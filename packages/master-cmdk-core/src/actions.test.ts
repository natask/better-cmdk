import { describe, expect, test, vi } from 'vitest'
import { createActionRegistry, defineActions, requiresActionConfirmation } from './actions'

const readAction = {
  id: 'find-customer',
  title: 'Find customer',
  effects: {
    readOnly: true,
    destructive: false,
    idempotent: true,
    openWorld: false,
  },
  confirmation: 'writes',
  source: { kind: 'manual' },
} as const

const writeAction = {
  id: 'invite-teammate',
  title: 'Invite teammate',
  inputSchema: {
    type: 'object',
    properties: { email: { type: 'string', format: 'email' } },
    required: ['email'],
  },
  outputSchema: {
    type: 'object',
    properties: { invited: { type: 'string' } },
    required: ['invited'],
  },
  effects: {
    readOnly: false,
    destructive: false,
    idempotent: false,
    openWorld: true,
  },
  confirmation: 'writes',
  source: { kind: 'manual', provenance: 'playground' },
} as const

describe('defineActions', () => {
  test('keeps a serializable manifest unchanged', () => {
    const manifest = defineActions([readAction, writeAction])

    expect(manifest[1]).toBe(writeAction)
    expect(JSON.parse(JSON.stringify(manifest))).toEqual(manifest)
  })

  test('rejects duplicate ids', () => {
    expect(() => defineActions([readAction, readAction])).toThrow('Duplicate action id: find-customer')
  })
})

describe('createActionRegistry', () => {
  test('registers and lists actions in source order', () => {
    const registry = createActionRegistry()
    registry.register(readAction, () => ({ customer: 'Ada' }))
    registry.register(writeAction, () => ({ invited: 'ada@example.com' }))

    expect(registry.list().map((action) => action.id)).toEqual(['find-customer', 'invite-teammate'])
    expect(registry.get('find-customer')).toBe(readAction)
  })

  test('requires confirmation for writes and runs after confirmation', async () => {
    const registry = createActionRegistry()
    const executor = vi.fn(({ email }: { email: string }) => ({ invited: email }))
    registry.register(writeAction, executor)

    const pending = await registry.execute('invite-teammate', { email: 'ada@example.com' })
    expect(pending.status).toBe('confirming')
    expect(executor).not.toHaveBeenCalled()

    const finished = await registry.execute<{ email: string }, { invited: string }>(
      'invite-teammate',
      { email: 'ada@example.com' },
      { confirmed: true },
    )
    expect(finished.status).toBe('succeeded')
    expect(finished.output).toEqual({ invited: 'ada@example.com' })
    expect(executor).toHaveBeenCalledOnce()
  })

  test('runs read-only actions without confirmation', async () => {
    const registry = createActionRegistry()
    registry.register(readAction, () => ({ customer: 'Ada' }))

    expect(requiresActionConfirmation(readAction)).toBe(false)
    await expect(registry.execute('find-customer', { query: 'ada' })).resolves.toMatchObject({
      status: 'succeeded',
      output: { customer: 'Ada' },
    })
  })

  test('records executor failures', async () => {
    const registry = createActionRegistry()
    registry.register(readAction, () => {
      throw new Error('Customer service unavailable')
    })

    await expect(registry.execute('find-customer', {})).resolves.toMatchObject({
      status: 'failed',
      error: 'Customer service unavailable',
    })
  })

  test('cancels an active action', async () => {
    const registry = createActionRegistry()
    registry.register(readAction, async (_input, { signal }) => {
      await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }))
      return { customer: 'Ada' }
    })

    const execution = registry.execute('find-customer', {})
    expect(registry.getRun('find-customer').status).toBe('running')
    expect(registry.cancel('find-customer')).toBe(true)

    await expect(execution).resolves.toMatchObject({ status: 'cancelled' })
  })

  test('notifies subscribers for registration and run changes', async () => {
    const registry = createActionRegistry()
    const listener = vi.fn()
    registry.subscribe(listener)

    registry.register(readAction, () => ({ customer: 'Ada' }))
    await registry.execute('find-customer', {})

    expect(listener).toHaveBeenCalledTimes(3)
  })
})
