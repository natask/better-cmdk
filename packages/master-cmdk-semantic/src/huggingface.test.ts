import { describe, expect, test, vi } from 'vitest'
import {
  DEFAULT_HF_FEATURE_EXTRACTION_MODEL,
  createHuggingFaceFeatureExtractionEmbedder,
  embedTextsWithHuggingFaceFeatureExtraction,
  parseHuggingFaceFeatureExtractionOutput,
} from './huggingface'

describe('Hugging Face feature extraction', () => {
  test('normalizes a single-vector response', () => {
    expect(parseHuggingFaceFeatureExtractionOutput([1, 2, 3], 1)).toEqual([[1, 2, 3]])
  })

  test('mean-pools token-vector responses', () => {
    expect(parseHuggingFaceFeatureExtractionOutput([[[1, 2], [3, 4]]], 1)).toEqual([[2, 3]])
  })

  test('uses MongoDB mdbr Leaf MT through provider auto by default', async () => {
    const signal = new AbortController().signal
    const featureExtraction = vi.fn().mockResolvedValue([0.25, 0.75])
    const embedQuery = createHuggingFaceFeatureExtractionEmbedder({
      client: { featureExtraction },
    })

    await expect(embedQuery('Today is sunny.', signal)).resolves.toEqual([0.25, 0.75])
    expect(featureExtraction).toHaveBeenCalledWith({
      model: DEFAULT_HF_FEATURE_EXTRACTION_MODEL,
      inputs: 'Today is sunny.',
      provider: 'auto',
    }, { signal })
  })

  test('passes a token-backed client request for batches', async () => {
    const signal = new AbortController().signal
    const featureExtraction = vi.fn().mockResolvedValue([[1], [2]])

    await expect(embedTextsWithHuggingFaceFeatureExtraction(['a', 'b'], signal, {
      token: 'hf_test',
      provider: 'auto',
      client: { featureExtraction },
    })).resolves.toEqual([[1], [2]])

    expect(featureExtraction).toHaveBeenCalledWith({
      model: DEFAULT_HF_FEATURE_EXTRACTION_MODEL,
      inputs: ['a', 'b'],
      provider: 'auto',
    }, { signal })
  })
})
