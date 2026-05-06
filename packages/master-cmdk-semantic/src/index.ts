import { commandScore as defaultCommandScore } from 'master-cmdk-core'
import type { CommandFilter } from 'master-cmdk-core'

export type SemanticVector = readonly number[]
export type SemanticVectorMap = Record<string, SemanticVector> | ReadonlyMap<string, SemanticVector>
export type SemanticStatus = 'idle' | 'embedding' | 'ready' | 'error'

export type EmbedQuery = (query: string, signal: AbortSignal) => SemanticVector | Promise<SemanticVector>

export interface SemanticScoreSnapshot {
  search: string
  status: SemanticStatus
  version: number
  error?: unknown
}

export interface SemanticScoreOptions {
  vectors: SemanticVectorMap
  embedQuery: EmbedQuery
  onError?: (error: unknown, context: { search: string }) => void
}

export interface SemanticCommandScoreOptions extends SemanticScoreOptions {
  commandScore?: CommandFilter
  blend?: (input: {
    lexical: number
    semantic: number
    value: string
    search: string
    keywords?: string[]
  }) => number
}

export interface SemanticScoreStore {
  setSearch: (search: string) => Promise<void>
  semanticScore: (value: string, search?: string) => number
  getScores: (search?: string) => ReadonlyMap<string, number>
  getSnapshot: () => SemanticScoreSnapshot
  subscribe: (listener: () => void) => () => void
  cancel: () => void
  clear: () => void
}

export interface SemanticCommandScore extends SemanticScoreStore {
  filter: CommandFilter
}

function clamp01(value: number): number {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function toVectorMap(input: SemanticVectorMap): Map<string, number[]> {
  const out = new Map<string, number[]>()
  const entries = input instanceof Map ? input.entries() : Object.entries(input)

  for (const [value, vector] of entries) {
    const normalized = normalizeVector(vector)
    if (normalized.length > 0) out.set(value, normalized)
  }

  return out
}

function normalizeSearch(search: string): string {
  return search.trim()
}

function normalizeVector(vector: SemanticVector | undefined): number[] {
  if (!vector || vector.length === 0) return []

  let magnitude = 0
  for (const value of vector) {
    magnitude += value * value
  }

  const norm = Math.sqrt(magnitude)
  if (!Number.isFinite(norm) || norm === 0) return []

  return vector.map((value) => value / norm)
}

export function dot(a: SemanticVector, b: SemanticVector): number {
  const size = Math.min(a.length, b.length)
  let total = 0
  for (let index = 0; index < size; index += 1) {
    total += a[index] * b[index]
  }
  return total
}

export function cosineScore(queryVector: SemanticVector | undefined, itemVector: SemanticVector | undefined): number {
  const query = normalizeVector(queryVector)
  const item = normalizeVector(itemVector)
  if (query.length === 0 || item.length === 0) return 0

  return clamp01((dot(query, item) + 1) / 2)
}

function compareAll(queryVector: SemanticVector, itemVectors: ReadonlyMap<string, SemanticVector>): Map<string, number> {
  const query = normalizeVector(queryVector)
  const scores = new Map<string, number>()

  if (query.length === 0) return scores

  for (const [value, itemVector] of itemVectors) {
    scores.set(value, clamp01((dot(query, itemVector) + 1) / 2))
  }

  return scores
}

function defaultBlend(input: { lexical: number; semantic: number }): number {
  return clamp01(Math.max(input.lexical, input.semantic))
}

export function createSemanticScore(options: SemanticScoreOptions): SemanticScoreStore {
  const itemVectors = toVectorMap(options.vectors)
  const scoreCache = new Map<string, Map<string, number>>()
  const listeners = new Set<() => void>()

  let controller: AbortController | undefined
  let activeRequest = 0
  let search = ''
  let scores = new Map<string, number>()
  let status: SemanticStatus = 'idle'
  let version = 0
  let error: unknown

  function notify() {
    version += 1
    listeners.forEach((listener) => listener())
  }

  function setReady(nextSearch: string, nextScores: Map<string, number>) {
    search = nextSearch
    scores = nextScores
    status = nextSearch ? 'ready' : 'idle'
    error = undefined
    notify()
  }

  async function setSearch(nextSearchInput: string): Promise<void> {
    const nextSearch = normalizeSearch(nextSearchInput)
    activeRequest += 1
    const requestId = activeRequest

    controller?.abort()
    controller = undefined

    if (!nextSearch) {
      setReady('', new Map())
      return
    }

    const cached = scoreCache.get(nextSearch)
    if (cached) {
      setReady(nextSearch, cached)
      return
    }

    const activeController = new AbortController()
    controller = activeController
    status = 'embedding'
    search = nextSearch
    error = undefined
    notify()

    try {
      const queryVector = await options.embedQuery(nextSearch, activeController.signal)
      if (activeController.signal.aborted || requestId !== activeRequest) return

      const nextScores = compareAll(queryVector, itemVectors)
      scoreCache.set(nextSearch, nextScores)
      setReady(nextSearch, nextScores)
    } catch (caught) {
      if (activeController.signal.aborted || requestId !== activeRequest) return

      error = caught
      status = 'error'
      options.onError?.(caught, { search: nextSearch })
      notify()
    }
  }

  function semanticScore(value: string, searchOverride?: string): number {
    const query = normalizeSearch(searchOverride ?? search)
    if (!query) return 0

    const source = query === search ? scores : scoreCache.get(query)
    return source?.get(value) ?? 0
  }

  function getScores(searchOverride?: string): ReadonlyMap<string, number> {
    const query = normalizeSearch(searchOverride ?? search)
    if (!query) return new Map()
    return query === search ? scores : scoreCache.get(query) ?? new Map()
  }

  function getSnapshot(): SemanticScoreSnapshot {
    return { search, status, version, error }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  function cancel() {
    activeRequest += 1
    controller?.abort()
    controller = undefined
    status = search ? 'ready' : 'idle'
    notify()
  }

  function clear() {
    activeRequest += 1
    controller?.abort()
    controller = undefined
    scoreCache.clear()
    search = ''
    scores = new Map()
    status = 'idle'
    error = undefined
    notify()
  }

  return {
    setSearch,
    semanticScore,
    getScores,
    getSnapshot,
    subscribe,
    cancel,
    clear,
  }
}

export function createSemanticCommandScore(options: SemanticCommandScoreOptions): SemanticCommandScore {
  const semantic = createSemanticScore(options)
  const lexicalScore = options.commandScore ?? defaultCommandScore
  const blend = options.blend ?? defaultBlend

  const filter: CommandFilter = (value, search, keywords) => {
    const lexical = lexicalScore(value, search, keywords)
    const semanticScore = semantic.semanticScore(value, search)
    return blend({ lexical, semantic: semanticScore, value, search, keywords })
  }

  return {
    ...semantic,
    filter,
  }
}

export type { CommandFilter }
