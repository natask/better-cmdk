export type ActionSchema = Readonly<Record<string, unknown>>

export type ActionEffects = {
  readOnly: boolean
  destructive: boolean
  idempotent: boolean
  openWorld: boolean
}

export type ActionConfirmation = 'never' | 'writes' | 'always'

export type ActionSource = {
  kind: 'manual' | 'openapi' | 'mcp' | 'recorded'
  reference?: string
  provenance?: string
}

declare const actionTypes: unique symbol

export type ActionDefinition<TInput = unknown, TOutput = unknown> = {
  id: string
  title: string
  description?: string
  keywords?: readonly string[]
  inputSchema?: ActionSchema
  outputSchema?: ActionSchema
  effects: ActionEffects
  confirmation: ActionConfirmation
  source: ActionSource
  readonly [actionTypes]?: {
    input: TInput
    output: TOutput
  }
}

export type ActionManifest = readonly ActionDefinition[]

export type ActionExecutionContext = {
  action: ActionDefinition
  signal: AbortSignal
}

export type ActionExecutor<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: ActionExecutionContext,
) => TOutput | Promise<TOutput>

export type ActionRunStatus = 'idle' | 'confirming' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export type ActionRunSnapshot<TInput = unknown, TOutput = unknown> = {
  actionId: string
  status: ActionRunStatus
  input?: TInput
  output?: TOutput
  error?: string
  startedAt?: number
  finishedAt?: number
}

export type ExecuteActionOptions = {
  confirmed?: boolean
  signal?: AbortSignal
}

export type ActionRegistrySnapshot = {
  actions: ActionDefinition[]
  runs: Map<string, ActionRunSnapshot>
}

type RegisteredAction = {
  definition: ActionDefinition
  execute: ActionExecutor
  order: number
}

type ActiveRun = {
  token: number
  controller: AbortController
}

export function defineActions<const TManifest extends ActionManifest>(manifest: TManifest): TManifest {
  const ids = new Set<string>()

  for (const action of manifest) {
    assertActionDefinition(action)
    if (ids.has(action.id)) throw new Error(`Duplicate action id: ${action.id}`)
    ids.add(action.id)
  }

  return manifest
}

export function requiresActionConfirmation(action: ActionDefinition): boolean {
  if (action.confirmation === 'always') return true
  if (action.confirmation === 'never') return false
  return !action.effects.readOnly
}

export function createActionRegistry() {
  let nextOrder = 0
  let nextRunToken = 0
  const listeners = new Set<() => void>()
  const actions = new Map<string, RegisteredAction>()
  const runs = new Map<string, ActionRunSnapshot>()
  const activeRuns = new Map<string, ActiveRun>()
  let snapshot: ActionRegistrySnapshot = {
    actions: [],
    runs: new Map(),
  }

  function emit() {
    snapshot = {
      actions: list(),
      runs: new Map(Array.from(runs, ([id, run]) => [id, cloneRun(run)])),
    }
    listeners.forEach((listener) => listener())
  }

  function register<TInput, TOutput>(
    definition: ActionDefinition<TInput, TOutput>,
    execute: ActionExecutor<TInput, TOutput>,
  ) {
    assertActionDefinition(definition)
    if (actions.has(definition.id)) throw new Error(`Action already registered: ${definition.id}`)

    actions.set(definition.id, {
      definition,
      execute: execute as ActionExecutor,
      order: nextOrder++,
    })
    emit()

    return () => {
      const current = actions.get(definition.id)
      if (!current || current.definition !== definition) return
      activeRuns.get(definition.id)?.controller.abort()
      activeRuns.delete(definition.id)
      actions.delete(definition.id)
      runs.delete(definition.id)
      emit()
    }
  }

  function list() {
    return Array.from(actions.values())
      .sort((a, b) => a.order - b.order)
      .map((action) => action.definition)
  }

  function get(actionId: string) {
    return actions.get(actionId)?.definition
  }

  function getRun(actionId: string): ActionRunSnapshot {
    return cloneRun(runs.get(actionId) ?? { actionId, status: 'idle' })
  }

  function getSnapshot(): ActionRegistrySnapshot {
    return snapshot
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  async function execute<TInput = unknown, TOutput = unknown>(
    actionId: string,
    input: TInput,
    options: ExecuteActionOptions = {},
  ): Promise<ActionRunSnapshot<TInput, TOutput>> {
    const registered = actions.get(actionId)
    if (!registered) throw new Error(`Unknown action: ${actionId}`)
    if (activeRuns.has(actionId)) throw new Error(`Action is already running: ${actionId}`)

    if (requiresActionConfirmation(registered.definition) && !options.confirmed) {
      const run: ActionRunSnapshot<TInput, TOutput> = {
        actionId,
        status: 'confirming',
        input,
      }
      setRun(run)
      return cloneRun(run)
    }

    const token = ++nextRunToken
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (options.signal?.aborted) controller.abort()
    else options.signal?.addEventListener('abort', abort, { once: true })

    const startedAt = Date.now()
    const running: ActionRunSnapshot<TInput, TOutput> = {
      actionId,
      status: 'running',
      input,
      startedAt,
    }
    activeRuns.set(actionId, { token, controller })
    setRun(running)

    try {
      if (controller.signal.aborted) return finishCancelled(actionId, input, startedAt, token)

      const output = (await registered.execute(input, {
        action: registered.definition,
        signal: controller.signal,
      })) as TOutput

      if (controller.signal.aborted) return finishCancelled(actionId, input, startedAt, token)

      const succeeded: ActionRunSnapshot<TInput, TOutput> = {
        actionId,
        status: 'succeeded',
        input,
        output,
        startedAt,
        finishedAt: Date.now(),
      }
      setRunIfCurrent(succeeded, token)
      return cloneRun(succeeded)
    } catch (error) {
      if (controller.signal.aborted) return finishCancelled(actionId, input, startedAt, token)

      const failed: ActionRunSnapshot<TInput, TOutput> = {
        actionId,
        status: 'failed',
        input,
        error: toErrorMessage(error),
        startedAt,
        finishedAt: Date.now(),
      }
      setRunIfCurrent(failed, token)
      return cloneRun(failed)
    } finally {
      options.signal?.removeEventListener('abort', abort)
      if (activeRuns.get(actionId)?.token === token) activeRuns.delete(actionId)
    }
  }

  function cancel(actionId: string) {
    const active = activeRuns.get(actionId)
    if (!active) return false
    active.controller.abort()
    return true
  }

  function reset(actionId: string) {
    if (activeRuns.has(actionId) || !runs.has(actionId)) return false
    runs.delete(actionId)
    emit()
    return true
  }

  function setRun(run: ActionRunSnapshot) {
    runs.set(run.actionId, run)
    emit()
  }

  function setRunIfCurrent(run: ActionRunSnapshot, token: number) {
    if (activeRuns.get(run.actionId)?.token !== token) return
    setRun(run)
  }

  function finishCancelled<TInput, TOutput>(
    actionId: string,
    input: TInput,
    startedAt: number,
    token: number,
  ): ActionRunSnapshot<TInput, TOutput> {
    const cancelled: ActionRunSnapshot<TInput, TOutput> = {
      actionId,
      status: 'cancelled',
      input,
      startedAt,
      finishedAt: Date.now(),
    }
    setRunIfCurrent(cancelled, token)
    return cloneRun(cancelled)
  }

  return {
    register,
    list,
    get,
    getRun,
    getSnapshot,
    subscribe,
    execute,
    cancel,
    reset,
  }
}

export type ActionRegistry = ReturnType<typeof createActionRegistry>

function assertActionDefinition(action: ActionDefinition) {
  if (!action.id.trim()) throw new Error('Action id is required')
  if (!action.title.trim()) throw new Error(`Action title is required: ${action.id}`)
}

function cloneRun<TInput, TOutput>(run: ActionRunSnapshot<TInput, TOutput>): ActionRunSnapshot<TInput, TOutput> {
  return { ...run }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
