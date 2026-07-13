import { describe, expect, test } from 'vitest'
import { createPotionQueryEmbedder, getPotionModelName, getPotionModelRepo, loadPotionModel } from './potion'

function makeSafetensors(rows: number, dimensions: number, values: number[]): ArrayBuffer {
  const header = {
    embeddings: {
      dtype: 'F32',
      shape: [rows, dimensions],
      data_offsets: [0, rows * dimensions * Float32Array.BYTES_PER_ELEMENT],
    },
  }
  let headerJson = JSON.stringify(header)
  while (headerJson.length % 4 !== 0) headerJson += ' '
  const headerBytes = new TextEncoder().encode(headerJson)
  const buffer = new ArrayBuffer(8 + headerBytes.byteLength + values.length * Float32Array.BYTES_PER_ELEMENT)
  const view = new DataView(buffer)
  view.setBigUint64(0, BigInt(headerBytes.byteLength), true)
  new Uint8Array(buffer, 8, headerBytes.byteLength).set(headerBytes)
  new Float32Array(buffer, 8 + headerBytes.byteLength).set(values)
  return buffer
}

function makePotionFiles() {
  return {
    configJson: JSON.stringify({ hidden_dim: 3, normalize: true }),
    modelBuffer: makeSafetensors(8, 3, [
      0, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      0, 1, 0,
      0, 1, 0,
      0, 0, 1,
      0, 0, 1,
    ]),
    vocabText: ['[UNK]', 'ship', 'app', 'deploy', 'report', 'bug', 'cr', '##ash'].join('\n'),
  }
}

describe('Potion Model2Vec embedder', () => {
  test('loads a static embedding table and mean-pools token vectors', async () => {
    const embedder = await loadPotionModel({
      model: 'potion-base-2M',
      files: makePotionFiles(),
    })

    expect(embedder.model).toBe('potion-base-2M')
    expect(embedder.dimensions).toBe(3)
    expect(embedder.embed('ship app')).toEqual([1, 0, 0])
    expect(embedder.embed('report bug')).toEqual([0, 1, 0])
  })

  test('uses WordPiece continuation tokens for unknown whole words', async () => {
    const embedder = await loadPotionModel({ files: makePotionFiles() })

    expect(embedder.embed('crash')).toEqual([0, 0, 1])
  })

  test('creates an abort-aware query embedder for cmdk semantic scoring', async () => {
    const embedQuery = createPotionQueryEmbedder({ files: makePotionFiles() })
    const aborted = new AbortController()
    aborted.abort()

    await expect(embedQuery('ship app', aborted.signal)).resolves.toEqual([])
    await expect(embedQuery('ship app')).resolves.toEqual([1, 0, 0])
  })

  test('resolves shorthand and full Hugging Face model names', () => {
    expect(getPotionModelRepo('potion-base-2M')).toBe('minishlab/potion-base-2M')
    expect(getPotionModelRepo('example/model')).toBe('example/model')
    expect(getPotionModelName('minishlab/potion-base-2M')).toBe('potion-base-2M')
  })
})
