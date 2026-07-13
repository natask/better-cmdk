import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { getPotionModelName, getPotionModelRepo, loadPotionModel } from './potion'
import type { PotionEmbedder, PotionModelFiles, PotionModelUrls } from './potion'
import { commandVectorPlugin } from './vector-vite'

const POTION_ASSET_DIR = 'assets/master-cmdk-semantic'
const POTION_FILES = {
  config: 'config.json',
  model: 'model.safetensors',
  vocab: 'vocab.txt',
} as const

export interface PotionCommandVectorPluginOptions<T = unknown> {
  items: string
  model?: string
  revision?: string
  cacheKey?: string
  cacheDir?: string
  virtualModuleId?: string
  getValue?: (item: T, index: number) => string
  getText?: (item: T, index: number) => string
  modelAssets?: PotionModelUrls
  loadPotion?: () => PotionEmbedder | Promise<PotionEmbedder>
}

interface PotionModelPaths {
  config: string
  model: string
  vocab: string
}

interface CachedPotionModel {
  files: PotionModelFiles
  paths: PotionModelPaths
  modelName: string
}

interface CachedItemVector {
  model: string
  revision: string
  cacheKey: string
  value: string
  textHash: string
  vector: number[]
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

function defaultValueResolver(item: unknown, index: number): string {
  const maybeValue = item as { value?: unknown; id?: unknown }
  if (typeof maybeValue.value === 'string') return maybeValue.value
  if (typeof maybeValue.id === 'string') return maybeValue.id
  return String(index)
}

function defaultTextResolver(item: unknown): string {
  const value = item as { label?: unknown; text?: unknown; description?: unknown; keywords?: unknown }
  const parts = [
    typeof value.label === 'string' ? value.label : undefined,
    typeof value.text === 'string' ? value.text : undefined,
    typeof value.description === 'string' ? value.description : undefined,
    Array.isArray(value.keywords) ? value.keywords.filter((keyword): keyword is string => typeof keyword === 'string').join(' ') : undefined,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('\n') : JSON.stringify(item ?? null)
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function fetchFileToCache(url: string, outputPath: string): Promise<void> {
  if (await exists(outputPath)) return
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`[master-cmdk-semantic] failed to download ${url}: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, buffer)
}

function copyBufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength)
  copy.set(buffer)
  return copy.buffer
}

function isNumberVector(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item))
}

function itemVectorCachePath(input: {
  cacheDir: string
  model: string
  revision: string
  cacheKey: string
  value: string
  text: string
}): string {
  const modelKey = sha256(`${input.model}\0${input.revision}\0${input.cacheKey}`).slice(0, 16)
  const itemKey = sha256(`${input.value}\0${input.text}`)
  return path.join(input.cacheDir, 'vectors', modelKey, `${itemKey}.json`)
}

async function readCachedItemVector(input: {
  cacheDir: string
  model: string
  revision: string
  cacheKey: string
  value: string
  text: string
}): Promise<number[] | undefined> {
  const textHash = sha256(input.text)
  const cachePath = itemVectorCachePath(input)

  try {
    const cached = JSON.parse(await readFile(cachePath, 'utf8')) as Partial<CachedItemVector>
    if (
      cached.model === input.model
      && cached.revision === input.revision
      && cached.cacheKey === input.cacheKey
      && cached.value === input.value
      && cached.textHash === textHash
      && isNumberVector(cached.vector)
    ) {
      return cached.vector
    }
  } catch {
    return undefined
  }

  return undefined
}

async function writeCachedItemVector(input: {
  cacheDir: string
  model: string
  revision: string
  cacheKey: string
  value: string
  text: string
  vector: number[]
}): Promise<void> {
  const cachePath = itemVectorCachePath(input)
  const record: CachedItemVector = {
    model: input.model,
    revision: input.revision,
    cacheKey: input.cacheKey,
    value: input.value,
    textHash: sha256(input.text),
    vector: input.vector,
  }

  await mkdir(path.dirname(cachePath), { recursive: true })
  await writeFile(cachePath, JSON.stringify(record), 'utf8')
}

async function loadPotionModelFromCache(input: {
  model?: string
  revision?: string
  cacheDir: string
}): Promise<CachedPotionModel> {
  const repo = getPotionModelRepo(input.model)
  const revision = input.revision ?? 'main'
  const modelName = getPotionModelName(input.model)
  const modelDir = path.join(input.cacheDir, modelName)

  const paths: PotionModelPaths = {
    config: path.join(modelDir, POTION_FILES.config),
    model: path.join(modelDir, POTION_FILES.model),
    vocab: path.join(modelDir, POTION_FILES.vocab),
  }

  await Promise.all([
    fetchFileToCache(`https://huggingface.co/${repo}/resolve/${revision}/${POTION_FILES.config}`, paths.config),
    fetchFileToCache(`https://huggingface.co/${repo}/resolve/${revision}/${POTION_FILES.model}`, paths.model),
    fetchFileToCache(`https://huggingface.co/${repo}/resolve/${revision}/${POTION_FILES.vocab}`, paths.vocab),
  ])

  const [configJson, modelBuffer, vocabText] = await Promise.all([
    readFile(paths.config, 'utf8'),
    readFile(paths.model),
    readFile(paths.vocab, 'utf8'),
  ])

  return {
    files: {
      configJson,
      modelBuffer: copyBufferToArrayBuffer(modelBuffer),
      vocabText,
    },
    paths,
    modelName,
  }
}

export function potionCommandVectorPlugin<T = unknown>(options: PotionCommandVectorPluginOptions<T>): Plugin {
  let rootDir = process.cwd()
  let outDir = 'dist'
  let base = '/'
  let embedderPromise: Promise<PotionEmbedder> | undefined
  let cachedModelPromise: Promise<CachedPotionModel> | undefined

  function getCacheDir(): string {
    return options.cacheDir
      ? path.resolve(rootDir, options.cacheDir)
      : path.resolve(rootDir, 'node_modules/.cache/master-cmdk-semantic')
  }

  function getCachedModel(): Promise<CachedPotionModel> {
    cachedModelPromise ||= loadPotionModelFromCache({
      model: options.model,
      revision: options.revision,
      cacheDir: getCacheDir(),
    })
    return cachedModelPromise
  }

  function getVectorCacheKey(): string {
    return options.cacheKey ?? 'default'
  }

  async function getEmbedder(): Promise<PotionEmbedder> {
    if (options.loadPotion) return options.loadPotion()

    const cached = await getCachedModel()
    return loadPotionModel({ model: options.model, files: cached.files })
  }

  function modelAssetPath(modelName = getPotionModelName(options.model), file = ''): string {
    return [POTION_ASSET_DIR, modelName, file].filter(Boolean).join('/')
  }

  function withBase(assetPath: string): string {
    const normalizedBase = base || '/'
    const prefix = normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`
    return `${prefix}${assetPath}`
  }

  function remotePotionAssets(): PotionModelUrls {
    const repo = getPotionModelRepo(options.model)
    const revision = options.revision ?? 'main'
    const baseUrl = `https://huggingface.co/${repo}/resolve/${revision}`
    return {
      config: `${baseUrl}/${POTION_FILES.config}`,
      model: `${baseUrl}/${POTION_FILES.model}`,
      vocab: `${baseUrl}/${POTION_FILES.vocab}`,
    }
  }

  async function getModelAssets(): Promise<PotionModelUrls> {
    if (options.modelAssets) return options.modelAssets
    if (options.loadPotion) return remotePotionAssets()

    const cached = await getCachedModel()
    return {
      config: withBase(modelAssetPath(cached.modelName, POTION_FILES.config)),
      model: withBase(modelAssetPath(cached.modelName, POTION_FILES.model)),
      vocab: withBase(modelAssetPath(cached.modelName, POTION_FILES.vocab)),
    }
  }

  async function copyPotionAssetsToOutDir(): Promise<void> {
    if (options.loadPotion && !cachedModelPromise) return
    const cached = await getCachedModel()
    const outputDir = path.resolve(rootDir, outDir, modelAssetPath(cached.modelName))
    await mkdir(outputDir, { recursive: true })
    await Promise.all([
      copyFile(cached.paths.config, path.join(outputDir, POTION_FILES.config)),
      copyFile(cached.paths.model, path.join(outputDir, POTION_FILES.model)),
      copyFile(cached.paths.vocab, path.join(outputDir, POTION_FILES.vocab)),
    ])
  }

  function servePotionAssets(server: ViteDevServer): void {
    server.middlewares.use(async (request, response, next) => {
      const url = request.url ? new URL(request.url, 'http://localhost') : undefined
      const pathname = url?.pathname.replace(/^\/+/, '')
      const expectedPrefix = modelAssetPath(getPotionModelName(options.model))
      if (!pathname?.startsWith(`${expectedPrefix}/`)) {
        next()
        return
      }

      try {
        const file = pathname.slice(expectedPrefix.length + 1)
        const cached = await getCachedModel()
        const source = file === POTION_FILES.config
          ? cached.paths.config
          : file === POTION_FILES.model
            ? cached.paths.model
            : file === POTION_FILES.vocab
              ? cached.paths.vocab
              : undefined

        if (!source) {
          next()
          return
        }

        response.statusCode = 200
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        response.setHeader(
          'Content-Type',
          file === POTION_FILES.config ? 'application/json' : file === POTION_FILES.vocab ? 'text/plain; charset=utf-8' : 'application/octet-stream',
        )
        response.end(await readFile(source))
      } catch (error) {
        next(error)
      }
    })
  }

  const plugin = commandVectorPlugin<T>({
    items: options.items,
    model: getPotionModelName(options.model),
    virtualModuleId: options.virtualModuleId,
    getValue: options.getValue,
    extraExports: async () => ({ modelAssets: await getModelAssets() }),
    embedItem: async (item, index) => {
      embedderPromise ||= getEmbedder()
      const embedder = await embedderPromise
      const text = options.getText?.(item, index) ?? defaultTextResolver(item)
      const value = (options.getValue ?? defaultValueResolver)(item, index)
      const revision = options.revision ?? 'main'
      const cacheKey = getVectorCacheKey()
      const cached = await readCachedItemVector({
        cacheDir: getCacheDir(),
        model: embedder.model,
        revision,
        cacheKey,
        value,
        text,
      })
      if (cached) return cached

      const vector = embedder.embed(text)
      await writeCachedItemVector({
        cacheDir: getCacheDir(),
        model: embedder.model,
        revision,
        cacheKey,
        value,
        text,
        vector,
      })
      return vector
    },
  })

  const originalConfigResolved = plugin.configResolved
  const originalHandleHotUpdate = plugin.handleHotUpdate
  return {
    ...plugin,
    name: 'master-cmdk-potion-vectors',
    configResolved(config) {
      rootDir = config.root
      outDir = config.build?.outDir ?? outDir
      base = config.base ?? base
      if (typeof originalConfigResolved === 'function') {
        originalConfigResolved.call(this, config)
      }
    },
    configureServer(server) {
      servePotionAssets(server)
    },
    async writeBundle() {
      await copyPotionAssetsToOutDir()
    },
    handleHotUpdate(ctx) {
      if (typeof originalHandleHotUpdate === 'function') {
        return originalHandleHotUpdate(ctx)
      }
      return originalHandleHotUpdate?.handler(ctx)
    },
  }
}
