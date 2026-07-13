import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { transformWithEsbuild } from 'vite'
import type { Plugin } from 'vite'
import type { SemanticVector } from './index'

export interface CommandVectorPluginOptions<T = unknown> {
  items: string
  model?: string
  virtualModuleId?: string
  getValue?: (item: T, index: number) => string
  extraExports?: Record<string, unknown> | (() => Record<string, unknown> | Promise<Record<string, unknown>>)
  embedItem: (item: T, index: number) => SemanticVector | Promise<SemanticVector>
}

async function loadItemsModule(absolutePath: string): Promise<unknown[]> {
  let source = await readFile(absolutePath, 'utf8')
  const extension = path.extname(absolutePath)

  if (extension === '.ts' || extension === '.tsx') {
    const transformed = await transformWithEsbuild(source, absolutePath, {
      format: 'esm',
      loader: extension === '.tsx' ? 'tsx' : 'ts',
      target: 'es2020',
    })
    source = transformed.code
  }

  const sourceUrl = `${pathToFileURL(absolutePath).href}?t=${Date.now()}`
  const withSourceUrl = `${source}\n//# sourceURL=${sourceUrl}`
  const dataUrl = `data:text/javascript;base64,${Buffer.from(withSourceUrl).toString('base64')}`
  const loaded = await import(/* @vite-ignore */ dataUrl)
  const items = loaded.default ?? loaded.items

  if (!Array.isArray(items)) {
    throw new Error('[master-cmdk-semantic] items module must export an array as default or `items`')
  }

  return items as unknown[]
}

function defaultValueResolver(item: unknown, index: number): string {
  const maybeValue = item as { value?: unknown; id?: unknown }
  if (typeof maybeValue.value === 'string') return maybeValue.value
  if (typeof maybeValue.id === 'string') return maybeValue.id
  return String(index)
}

function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(value)
}

async function resolveExtraExports(
  extraExports: CommandVectorPluginOptions['extraExports'],
): Promise<Record<string, unknown>> {
  if (!extraExports) return {}
  return typeof extraExports === 'function' ? extraExports() : extraExports
}

export function commandVectorPlugin<T = unknown>(options: CommandVectorPluginOptions<T>): Plugin {
  const virtualId = options.virtualModuleId ?? 'virtual:master-cmdk/semantic-vectors'
  const resolvedVirtualId = `\0${virtualId}`

  let rootDir = process.cwd()
  let vectorsPromise: Promise<Record<string, SemanticVector>> | undefined

  async function resolveVectors(): Promise<Record<string, SemanticVector>> {
    const absoluteItemsPath = path.isAbsolute(options.items)
      ? options.items
      : path.resolve(rootDir, options.items)

    const items = await loadItemsModule(absoluteItemsPath)
    const getValue = options.getValue ?? ((item: T, index: number) => defaultValueResolver(item, index))

    const vectors: Record<string, SemanticVector> = {}
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index] as T
      vectors[getValue(item, index)] = await options.embedItem(item, index)
    }

    return vectors
  }

  return {
    name: 'master-cmdk-semantic-vectors',

    configResolved(config) {
      rootDir = config.root
    },

    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId
      return null
    },

    async load(id) {
      if (id !== resolvedVirtualId) return null

      vectorsPromise ||= resolveVectors()
      const vectors = await vectorsPromise
      const extraExports = await resolveExtraExports(options.extraExports)
      const extraKeys: string[] = []
      const extraLines = Object.entries(extraExports).flatMap(([key, value]) => {
        if (!isIdentifier(key)) throw new Error(`[master-cmdk-semantic] invalid virtual export name: ${key}`)
        const serialized = JSON.stringify(value)
        if (serialized === undefined) return []
        extraKeys.push(key)
        return [`export const ${key} = ${serialized}`]
      })

      return [
        `export const model = ${JSON.stringify(options.model ?? 'custom')}`,
        `export const vectors = ${JSON.stringify(vectors)}`,
        ...extraLines,
        `export default { ${['model', 'vectors', ...extraKeys].join(', ')} }`,
      ].join('\n')
    },

    handleHotUpdate(ctx) {
      const absoluteItemsPath = path.isAbsolute(options.items)
        ? options.items
        : path.resolve(rootDir, options.items)

      if (ctx.file === absoluteItemsPath) {
        vectorsPromise = undefined
      }
    },
  }
}
