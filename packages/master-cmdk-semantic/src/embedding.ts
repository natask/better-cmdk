import { embedTextsWithHuggingFaceFeatureExtraction } from './huggingface'
import type { HuggingFaceFeatureExtractionClient } from './huggingface'
import type { InferenceProviderOrPolicy } from '@huggingface/inference'
import type { EmbedQuery, SemanticVector } from './index'

export type EmbeddingEndpointKind = 'openai' | 'hf-feature-extraction' | 'tei' | 'hf-inference-client'

export type EmbeddingEndpointModel = {
  label: string
  model: string
  endpoint: string
  kind: EmbeddingEndpointKind
  provider?: InferenceProviderOrPolicy
}

export type EmbeddingEndpointOptions = {
  authToken?: string
  hfClient?: HuggingFaceFeatureExtractionClient
}

export type FetchEmbedderOptions = {
  endpoint: string | URL
  fetch?: typeof fetch
  headers?: HeadersInit | ((query: string) => HeadersInit | Promise<HeadersInit>)
  body?: (query: string) => unknown
  parse?: (response: unknown) => SemanticVector
}

export type FetchEmbedderInit = Omit<FetchEmbedderOptions, 'endpoint'>

function isVector(input: unknown): input is number[] {
  return Array.isArray(input) && input.every((value) => typeof value === 'number')
}

function isVectorList(input: unknown): input is number[][] {
  return Array.isArray(input) && input.every((item) => isVector(item))
}

function meanPool(tokenVectors: number[][]): number[] {
  const first = tokenVectors[0]
  if (!first) return []

  const pooled = new Array(first.length).fill(0) as number[]
  for (const vector of tokenVectors) {
    for (let index = 0; index < pooled.length; index += 1) pooled[index] += vector[index] ?? 0
  }

  return pooled.map((value) => value / tokenVectors.length)
}

export function parseOpenAIEmbeddings(input: unknown): number[][] {
  const data = (input as { data?: Array<{ embedding?: unknown }> }).data
  if (!Array.isArray(data)) throw new Error('OpenAI embedding response must contain a data array')

  const vectors = data.map((item) => item.embedding)
  if (!isVectorList(vectors)) throw new Error('OpenAI embedding response contained invalid embedding vectors')

  return vectors
}

export function parseFetchEmbeddingResponse(input: unknown): number[] {
  if (isVector(input)) return input

  const maybeObject = input as { vector?: unknown; embedding?: unknown; data?: unknown }
  if (isVector(maybeObject.vector)) return maybeObject.vector
  if (isVector(maybeObject.embedding)) return maybeObject.embedding

  const data = maybeObject.data
  if (Array.isArray(data) && data.length === 1) {
    const item = data[0] as { embedding?: unknown }
    if (isVector(item.embedding)) return item.embedding
  }

  throw new Error('Embedding response did not contain a query vector')
}

export function parseFeatureExtractionEmbeddings(input: unknown, expectedCount: number): number[][] {
  if (isVectorList(input) && input.length === expectedCount) return input
  if (expectedCount === 1 && isVector(input)) return [input]

  if (Array.isArray(input) && input.length === expectedCount) {
    const pooled = input.map((item) => {
      if (isVector(item)) return item
      if (isVectorList(item)) return meanPool(item)
      return null
    })
    if (pooled.every((item): item is number[] => Array.isArray(item))) return pooled
  }

  throw new Error('Hugging Face feature-extraction response did not contain one vector per input')
}

export function parseEmbeddingEndpointResponse(
  kind: Exclude<EmbeddingEndpointKind, 'hf-inference-client'>,
  input: unknown,
  expectedCount: number,
): number[][] {
  if (kind === 'openai') return parseOpenAIEmbeddings(input)
  if (kind === 'hf-feature-extraction') return parseFeatureExtractionEmbeddings(input, expectedCount)
  if (kind === 'tei' && isVectorList(input)) return input

  throw new Error('TEI embedding response must be an array of vectors')
}

export async function fetchEmbeddingEndpointVectors(
  model: EmbeddingEndpointModel,
  texts: readonly string[],
  signal: AbortSignal,
  options: EmbeddingEndpointOptions = {},
): Promise<number[][]> {
  if (model.kind === 'hf-inference-client') {
    return embedTextsWithHuggingFaceFeatureExtraction(texts, signal, {
      token: options.authToken,
      model: model.model,
      provider: model.provider,
      client: options.hfClient,
    })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = options.authToken?.trim()
  if (token) headers.Authorization = token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`

  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(model.kind === 'openai'
      ? { model: model.model, input: texts }
      : model.kind === 'hf-feature-extraction'
        ? { inputs: texts, normalize: true }
        : { inputs: texts }),
    signal,
  })

  if (!response.ok) throw new Error(`${model.label} request failed with ${response.status}`)

  return parseEmbeddingEndpointResponse(model.kind, await response.json() as unknown, texts.length)
}

export function createFetchEmbedder(endpoint: string | URL, options?: FetchEmbedderInit): EmbedQuery
export function createFetchEmbedder(options: FetchEmbedderOptions): EmbedQuery
export function createFetchEmbedder(
  endpointOrOptions: string | URL | FetchEmbedderOptions,
  init: FetchEmbedderInit = {},
): EmbedQuery {
  const options = typeof endpointOrOptions === 'string' || endpointOrOptions instanceof URL
    ? { ...init, endpoint: endpointOrOptions }
    : endpointOrOptions

  return async (query: string, signal: AbortSignal): Promise<number[]> => {
    const fetchImpl = options.fetch ?? globalThis.fetch
    if (!fetchImpl) throw new Error('createFetchEmbedder requires a fetch implementation')

    const resolvedHeaders = typeof options.headers === 'function'
      ? await options.headers(query)
      : options.headers
    const headers = new Headers(resolvedHeaders)
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    const response = await fetchImpl(options.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(options.body ? options.body(query) : { input: query }),
      signal,
    })

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      throw new Error(`[master-cmdk-semantic] embedding request failed with ${response.status}${details ? `: ${details.slice(0, 200)}` : ''}`)
    }

    const json = await response.json() as unknown
    return [...(options.parse ?? parseFetchEmbeddingResponse)(json)]
  }
}
