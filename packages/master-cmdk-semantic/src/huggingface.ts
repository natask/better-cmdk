import { InferenceClient } from '@huggingface/inference'
import type { FeatureExtractionOutput, InferenceProviderOrPolicy } from '@huggingface/inference'

export const DEFAULT_HF_FEATURE_EXTRACTION_MODEL = 'MongoDB/mdbr-leaf-mt'
export const DEFAULT_HF_FEATURE_EXTRACTION_PROVIDER = 'auto' satisfies InferenceProviderOrPolicy

export type HuggingFaceFeatureExtractionClient = {
  featureExtraction: (
    args: {
      model?: string
      inputs: string | string[]
      provider?: InferenceProviderOrPolicy
    },
    options?: { signal?: AbortSignal },
  ) => Promise<FeatureExtractionOutput | unknown>
}

export type HuggingFaceFeatureExtractionOptions = {
  token?: string
  model?: string
  provider?: InferenceProviderOrPolicy
  client?: HuggingFaceFeatureExtractionClient
}

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
    for (let index = 0; index < pooled.length; index += 1) {
      pooled[index] += vector[index] ?? 0
    }
  }

  return pooled.map((value) => value / tokenVectors.length)
}

export function parseHuggingFaceFeatureExtractionOutput(input: unknown, expectedCount: number): number[][] {
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

export async function embedTextsWithHuggingFaceFeatureExtraction(
  texts: readonly string[],
  signal: AbortSignal,
  options: HuggingFaceFeatureExtractionOptions = {},
): Promise<number[][]> {
  const client = options.client ?? new InferenceClient(options.token)
  const output = await client.featureExtraction({
    model: options.model ?? DEFAULT_HF_FEATURE_EXTRACTION_MODEL,
    inputs: texts.length === 1 ? texts[0] : [...texts],
    provider: options.provider ?? DEFAULT_HF_FEATURE_EXTRACTION_PROVIDER,
  }, { signal })

  return parseHuggingFaceFeatureExtractionOutput(output, texts.length)
}

export function createHuggingFaceFeatureExtractionEmbedder(options: HuggingFaceFeatureExtractionOptions = {}) {
  return async (query: string, signal: AbortSignal): Promise<number[]> => {
    const vectors = await embedTextsWithHuggingFaceFeatureExtraction([query], signal, options)
    return vectors[0] ?? []
  }
}
