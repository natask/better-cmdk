import { describe, expect, test, vi } from 'vitest'
import {
  createFetchEmbedder,
  fetchEmbeddingEndpointVectors,
  parseEmbeddingEndpointResponse,
  parseFetchEmbeddingResponse,
} from './embedding'

describe('embedding endpoint modes', () => {
  test('parses OpenAI embedding responses', () => {
    expect(parseEmbeddingEndpointResponse('openai', {
      data: [{ embedding: [1, 0] }, { embedding: [0, 1] }],
    }, 2)).toEqual([[1, 0], [0, 1]])
  })

  test('parses raw Hugging Face feature-extraction responses', () => {
    expect(parseEmbeddingEndpointResponse('hf-feature-extraction', [[1, 0], [0, 1]], 2)).toEqual([[1, 0], [0, 1]])
    expect(parseEmbeddingEndpointResponse('hf-feature-extraction', [[[1, 0], [3, 2]]], 1)).toEqual([[2, 1]])
  })

  test('parses TEI embedding responses', () => {
    expect(parseEmbeddingEndpointResponse('tei', [[1, 0], [0, 1]], 2)).toEqual([[1, 0], [0, 1]])
  })

  test('calls the Hugging Face JS inference client mode', async () => {
    const signal = new AbortController().signal
    const featureExtraction = vi.fn().mockResolvedValue([[1, 0], [0, 1]])

    await expect(fetchEmbeddingEndpointVectors({
      label: 'MongoDB mdbr Leaf MT',
      model: 'MongoDB/mdbr-leaf-mt',
      endpoint: 'hf://MongoDB/mdbr-leaf-mt',
      kind: 'hf-inference-client',
      provider: 'auto',
    }, ['alpha', 'beta'], signal, {
      authToken: 'hf_test',
      hfClient: { featureExtraction },
    })).resolves.toEqual([[1, 0], [0, 1]])

    expect(featureExtraction).toHaveBeenCalledWith({
      model: 'MongoDB/mdbr-leaf-mt',
      inputs: ['alpha', 'beta'],
      provider: 'auto',
    }, { signal })
  })

  test('parses common one-vector proxy response shapes', () => {
    expect(parseFetchEmbeddingResponse([1, 0])).toEqual([1, 0])
    expect(parseFetchEmbeddingResponse({ vector: [0, 1] })).toEqual([0, 1])
    expect(parseFetchEmbeddingResponse({ embedding: [0.5, 0.5] })).toEqual([0.5, 0.5])
    expect(parseFetchEmbeddingResponse({ data: [{ embedding: [0.25, 0.75] }] })).toEqual([0.25, 0.75])
  })

  test('creates a fetch-backed query embedder for app-owned proxy routes', async () => {
    const signal = new AbortController().signal
    const response = new Response(JSON.stringify({ vector: [0.25, 0.75] }))
    const fetchMock = vi.fn().mockResolvedValue(response)
    const embedQuery = createFetchEmbedder('/api/embed', {
      fetch: fetchMock as unknown as typeof fetch,
      headers: { Authorization: 'Bearer hf_test' },
    })

    await expect(embedQuery('create ticket', signal)).resolves.toEqual([0.25, 0.75])
    const [endpoint, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(endpoint).toBe('/api/embed')
    expect(request.method).toBe('POST')
    expect(request.body).toBe(JSON.stringify({ input: 'create ticket' }))
    expect(request.signal).toBe(signal)
    expect(request.headers).toBeInstanceOf(Headers)
    expect((request.headers as Headers).get('Authorization')).toBe('Bearer hf_test')
    expect((request.headers as Headers).get('Content-Type')).toBe('application/json')
  })
})
