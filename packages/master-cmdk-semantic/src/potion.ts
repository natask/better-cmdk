import type { SemanticVector } from './index'

const DEFAULT_REPO = 'minishlab/potion-base-2M'
const DEFAULT_REVISION = 'main'
const DEFAULT_FILES = {
  config: 'config.json',
  model: 'model.safetensors',
  vocab: 'vocab.txt',
} as const

export interface PotionModelConfig {
  hidden_dim?: number
  normalize?: boolean
  do_lower_case?: boolean
}

export interface PotionModelFiles {
  configJson: string
  modelBuffer: ArrayBuffer
  vocabText: string
}

export interface PotionModelUrls {
  config: string
  model: string
  vocab: string
}

export interface PotionModelSource {
  model?: string
  revision?: string
  baseUrl?: string
  urls?: PotionModelUrls
  fetch?: typeof fetch
}

export interface PotionEmbedderOptions extends PotionModelSource {
  files?: PotionModelFiles
}

export interface PotionEmbedder {
  model: string
  dimensions: number
  embed: (text: string) => number[]
}

interface LoadedPotionModel {
  model: string
  dimensions: number
  normalize: boolean
  vocab: Map<string, number>
  embeddings: Float32Array
  rows: number
}

function clampToArrayBuffer(input: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input

  const copy = new Uint8Array(input.byteLength)
  copy.set(new Uint8Array(input.buffer, input.byteOffset, input.byteLength))
  return copy.buffer
}

function resolveModelRepo(model = DEFAULT_REPO): string {
  return model.includes('/') ? model : `minishlab/${model}`
}

function resolveModelName(model = DEFAULT_REPO): string {
  const repo = resolveModelRepo(model)
  return repo.split('/').pop() ?? repo
}

function resolveFileUrl(source: PotionModelSource, file: string): string {
  if (source.urls) {
    if (file === DEFAULT_FILES.config) return source.urls.config
    if (file === DEFAULT_FILES.model) return source.urls.model
    if (file === DEFAULT_FILES.vocab) return source.urls.vocab
  }
  if (source.baseUrl) return `${source.baseUrl.replace(/\/$/, '')}/${file}`
  return `https://huggingface.co/${resolveModelRepo(source.model)}/resolve/${source.revision ?? DEFAULT_REVISION}/${file}`
}

async function fetchText(source: PotionModelSource, file: string): Promise<string> {
  const fetchImpl = source.fetch ?? globalThis.fetch
  if (!fetchImpl) throw new Error('[master-cmdk-semantic] fetch is required to load Potion models')

  const response = await fetchImpl(resolveFileUrl(source, file))
  if (!response.ok) throw new Error(`[master-cmdk-semantic] failed to fetch ${file}: ${response.status}`)
  return response.text()
}

async function fetchBuffer(source: PotionModelSource, file: string): Promise<ArrayBuffer> {
  const fetchImpl = source.fetch ?? globalThis.fetch
  if (!fetchImpl) throw new Error('[master-cmdk-semantic] fetch is required to load Potion models')

  const response = await fetchImpl(resolveFileUrl(source, file))
  if (!response.ok) throw new Error(`[master-cmdk-semantic] failed to fetch ${file}: ${response.status}`)
  return response.arrayBuffer()
}

async function fetchPotionFiles(source: PotionModelSource): Promise<PotionModelFiles> {
  const [configJson, modelBuffer, vocabText] = await Promise.all([
    fetchText(source, DEFAULT_FILES.config),
    fetchBuffer(source, DEFAULT_FILES.model),
    fetchText(source, DEFAULT_FILES.vocab),
  ])

  return { configJson, modelBuffer, vocabText }
}

function readUint64LittleEndian(view: DataView, offset: number): number {
  const value = view.getBigUint64(offset, true)
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('[master-cmdk-semantic] safetensors header is too large')
  }
  return Number(value)
}

function parseSafetensorsEmbedding(bufferInput: ArrayBuffer | ArrayBufferView): {
  embeddings: Float32Array
  rows: number
  dimensions: number
} {
  const buffer = clampToArrayBuffer(bufferInput)
  const view = new DataView(buffer)
  const headerLength = readUint64LittleEndian(view, 0)
  const headerStart = 8
  const headerEnd = headerStart + headerLength
  const headerRaw = new TextDecoder().decode(buffer.slice(headerStart, headerEnd))
  const header = JSON.parse(headerRaw) as Record<string, { dtype?: string; shape?: number[]; data_offsets?: number[] }>
  const tensor = header.embeddings

  if (!tensor || tensor.dtype !== 'F32' || !Array.isArray(tensor.shape) || !Array.isArray(tensor.data_offsets)) {
    throw new Error('[master-cmdk-semantic] Potion model must contain an F32 `embeddings` tensor')
  }

  const [rows, dimensions] = tensor.shape
  if (!rows || !dimensions) throw new Error('[master-cmdk-semantic] invalid Potion embedding tensor shape')

  const [relativeStart, relativeEnd] = tensor.data_offsets
  const dataStart = headerEnd + relativeStart
  const dataEnd = headerEnd + relativeEnd
  const data = buffer.slice(dataStart, dataEnd)

  return {
    embeddings: new Float32Array(data),
    rows,
    dimensions,
  }
}

function parseVocab(vocabText: string): Map<string, number> {
  const vocab = new Map<string, number>()
  const tokens = vocabText.split(/\r?\n/)

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token) vocab.set(token, index)
  }

  return vocab
}

function stripAccents(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function basicTokenize(text: string): string[] {
  const folded = stripAccents(text.toLowerCase())
  return folded.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? []
}

function wordPieceTokenize(token: string, vocab: ReadonlyMap<string, number>): string[] {
  if (vocab.has(token)) return [token]
  if (token.length > 100) return ['[UNK]']

  const pieces: string[] = []
  let start = 0

  while (start < token.length) {
    let end = token.length
    let current: string | undefined

    while (start < end) {
      const piece = token.slice(start, end)
      const candidate = start === 0 ? piece : `##${piece}`
      if (vocab.has(candidate)) {
        current = candidate
        break
      }
      end -= 1
    }

    if (!current) return ['[UNK]']
    pieces.push(current)
    start = end
  }

  return pieces
}

function tokenize(text: string, vocab: ReadonlyMap<string, number>): number[] {
  const ids: number[] = []
  const unk = vocab.get('[UNK]') ?? 1

  for (const token of basicTokenize(text)) {
    for (const piece of wordPieceTokenize(token, vocab)) {
      ids.push(vocab.get(piece) ?? unk)
    }
  }

  return ids
}

function normalize(vector: number[]): number[] {
  let magnitude = 0
  for (const value of vector) magnitude += value * value

  const norm = Math.sqrt(magnitude)
  if (!Number.isFinite(norm) || norm === 0) return vector
  return vector.map((value) => value / norm)
}

function embedWithModel(model: LoadedPotionModel, text: string): number[] {
  const ids = tokenize(text, model.vocab).filter((id) => id >= 0 && id < model.rows)
  const vector = Array.from({ length: model.dimensions }, () => 0)

  if (ids.length === 0) return vector

  for (const id of ids) {
    const offset = id * model.dimensions
    for (let dimension = 0; dimension < model.dimensions; dimension += 1) {
      vector[dimension] += model.embeddings[offset + dimension]
    }
  }

  for (let dimension = 0; dimension < vector.length; dimension += 1) {
    vector[dimension] /= ids.length
  }

  return model.normalize ? normalize(vector) : vector
}

export async function loadPotionModel(options: PotionEmbedderOptions = {}): Promise<PotionEmbedder> {
  const files = options.files ?? (await fetchPotionFiles(options))
  const config = JSON.parse(files.configJson) as PotionModelConfig
  const parsed = parseSafetensorsEmbedding(files.modelBuffer)
  const model: LoadedPotionModel = {
    model: resolveModelName(options.model),
    dimensions: config.hidden_dim ?? parsed.dimensions,
    normalize: config.normalize ?? true,
    vocab: parseVocab(files.vocabText),
    embeddings: parsed.embeddings,
    rows: parsed.rows,
  }

  if (model.dimensions !== parsed.dimensions) {
    throw new Error('[master-cmdk-semantic] Potion config hidden_dim does not match embeddings shape')
  }

  return {
    model: model.model,
    dimensions: model.dimensions,
    embed: (text: string) => embedWithModel(model, text),
  }
}

export function createPotionQueryEmbedder(options: PotionEmbedderOptions = {}) {
  let modelPromise: Promise<PotionEmbedder> | undefined

  return async function embedPotionQuery(query: string, signal?: AbortSignal): Promise<SemanticVector> {
    if (signal?.aborted) return []
    modelPromise ||= loadPotionModel(options)
    const model = await modelPromise
    if (signal?.aborted) return []
    return model.embed(query)
  }
}

export function getPotionModelRepo(model?: string): string {
  return resolveModelRepo(model)
}

export function getPotionModelName(model?: string): string {
  return resolveModelName(model)
}
