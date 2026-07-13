import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { commandVectorPlugin, potionCommandVectorPlugin } from './vite'

describe('commandVectorPlugin', () => {
  test('exposes build-time command vectors through a virtual module', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'master-cmdk-vectors-'))
    const itemsPath = path.join(tmpDir, 'commands.mjs')

    await writeFile(
      itemsPath,
      'export default [{ value: "deploy", label: "Deploy production" }, { value: "issue", label: "Create issue" }]',
      'utf8',
    )

    const plugin = commandVectorPlugin<{ value: string }>({
      items: './commands.mjs',
      model: 'test-embedder',
      embedItem: item => item.value === 'deploy' ? [1, 0] : [0, 1],
    })

    ;(plugin.configResolved as (config: unknown) => void)?.({ root: tmpDir })
    const resolved = await (plugin.resolveId as (id: string) => string | null | Promise<string | null>)?.(
      'virtual:master-cmdk/semantic-vectors',
    )

    expect(typeof resolved).toBe('string')

    const code = await (plugin.load as (id: string) => string | null | Promise<string | null>)?.(resolved as string)
    expect(String(code)).toContain('export const model = "test-embedder"')
    expect(String(code)).toContain('"deploy":[1,0]')
    expect(String(code)).toContain('"issue":[0,1]')
  })

  test('can add typed metadata exports to the virtual vector module', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'master-cmdk-vectors-extra-'))
    const itemsPath = path.join(tmpDir, 'commands.mjs')

    await writeFile(itemsPath, 'export default [{ value: "deploy" }]', 'utf8')

    const plugin = commandVectorPlugin<{ value: string }>({
      items: './commands.mjs',
      model: 'test-embedder',
      extraExports: { modelAssets: { config: '/local/config.json', model: '/local/model.safetensors', vocab: '/local/vocab.txt' } },
      embedItem: () => [1, 0],
    })

    ;(plugin.configResolved as (config: unknown) => void)?.({ root: tmpDir })
    const resolved = await (plugin.resolveId as (id: string) => string | null | Promise<string | null>)?.(
      'virtual:master-cmdk/semantic-vectors',
    )
    const code = await (plugin.load as (id: string) => string | null | Promise<string | null>)?.(resolved as string)

    expect(String(code)).toContain('export const modelAssets = {"config":"/local/config.json"')
    expect(String(code)).toContain('export default { model, vectors, modelAssets }')
  })

  test('loads TypeScript command registries before embedding items', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'master-cmdk-vectors-ts-'))
    const itemsPath = path.join(tmpDir, 'commands.ts')

    await writeFile(
      itemsPath,
      [
        'type Command = { value: string; label: string }',
        'const items: Command[] = [{ value: "deploy", label: "Deploy production" }]',
        'export default items',
      ].join('\n'),
      'utf8',
    )

    const plugin = commandVectorPlugin<{ value: string }>({
      items: './commands.ts',
      model: 'test-embedder',
      embedItem: () => [1, 0],
    })

    ;(plugin.configResolved as (config: unknown) => void)?.({ root: tmpDir })
    const resolved = await (plugin.resolveId as (id: string) => string | null | Promise<string | null>)?.(
      'virtual:master-cmdk/semantic-vectors',
    )
    const code = await (plugin.load as (id: string) => string | null | Promise<string | null>)?.(resolved as string)

    expect(String(code)).toContain('"deploy":[1,0]')
  })

  test('wraps Potion embedding behind the same virtual vector module', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'master-cmdk-potion-vectors-'))
    const itemsPath = path.join(tmpDir, 'commands.mjs')

    await writeFile(
      itemsPath,
      [
        'export default [',
        '  { value: "deploy", label: "Deploy production", description: "Release the app to live users" },',
        '  { value: "issue", label: "Create Linear issue", description: "Report a bug to the tracker" },',
        ']',
      ].join('\n'),
      'utf8',
    )

    const plugin = potionCommandVectorPlugin<{ value: string; description: string }>({
      items: './commands.mjs',
      loadPotion: () => ({
        model: 'test-potion',
        dimensions: 2,
        embed: (text) => text.includes('Release') ? [1, 0] : [0, 1],
      }),
      getValue: item => item.value,
      getText: item => item.description,
    })

    ;(plugin.configResolved as (config: unknown) => void)?.({ root: tmpDir })
    const resolved = await (plugin.resolveId as (id: string) => string | null | Promise<string | null>)?.(
      'virtual:master-cmdk/semantic-vectors',
    )
    const code = await (plugin.load as (id: string) => string | null | Promise<string | null>)?.(resolved as string)

    expect(String(code)).toContain('export const model = "potion-base-2M"')
    expect(String(code)).toContain('export const modelAssets = {"config":"https://huggingface.co/minishlab/potion-base-2M/resolve/main/config.json"')
    expect(String(code)).toContain('"deploy":[1,0]')
    expect(String(code)).toContain('"issue":[0,1]')
  })

  test('reuses cached Potion command vectors across plugin instances', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'master-cmdk-potion-cache-'))
    const itemsPath = path.join(tmpDir, 'commands.mjs')
    let embedCalls = 0

    await writeFile(
      itemsPath,
      [
        'export default [',
        '  { value: "deploy", label: "Deploy production", description: "Release the app to live users" },',
        '  { value: "issue", label: "Create Linear issue", description: "Report a bug to the tracker" },',
        ']',
      ].join('\n'),
      'utf8',
    )

    const makePlugin = () => potionCommandVectorPlugin<{ value: string; description: string }>({
      items: './commands.mjs',
      cacheDir: '.semantic-cache',
      loadPotion: () => ({
        model: 'test-potion',
        dimensions: 2,
        embed: (text) => {
          embedCalls += 1
          return text.includes('Release') ? [1, 0] : [0, 1]
        },
      }),
      getValue: item => item.value,
      getText: item => item.description,
    })

    async function loadVirtualModule() {
      const plugin = makePlugin()
      ;(plugin.configResolved as (config: unknown) => void)?.({ root: tmpDir })
      const resolved = await (plugin.resolveId as (id: string) => string | null | Promise<string | null>)?.(
        'virtual:master-cmdk/semantic-vectors',
      )
      return (plugin.load as (id: string) => string | null | Promise<string | null>)?.(resolved as string)
    }

    await loadVirtualModule()
    expect(embedCalls).toBe(2)

    await loadVirtualModule()
    expect(embedCalls).toBe(2)
  })

  test('invalidates cached Potion vectors when the cache key changes', async () => {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'master-cmdk-potion-cache-key-'))
    const itemsPath = path.join(tmpDir, 'commands.mjs')
    let embedCalls = 0

    await writeFile(
      itemsPath,
      'export default [{ value: "deploy", description: "Release the app" }]',
      'utf8',
    )

    async function loadVirtualModule(cacheKey: string) {
      const plugin = potionCommandVectorPlugin<{ value: string; description: string }>({
        items: './commands.mjs',
        cacheDir: '.semantic-cache',
        cacheKey,
        loadPotion: () => ({
          model: 'test-potion',
          dimensions: 2,
          embed: () => {
            embedCalls += 1
            return [embedCalls, 0]
          },
        }),
        getValue: item => item.value,
        getText: item => item.description,
      })

      ;(plugin.configResolved as (config: unknown) => void)?.({ root: tmpDir })
      const resolved = await (plugin.resolveId as (id: string) => string | null | Promise<string | null>)?.(
        'virtual:master-cmdk/semantic-vectors',
      )
      return (plugin.load as (id: string) => string | null | Promise<string | null>)?.(resolved as string)
    }

    await loadVirtualModule('normalize=true')
    expect(embedCalls).toBe(1)

    await loadVirtualModule('normalize=true')
    expect(embedCalls).toBe(1)

    await loadVirtualModule('normalize=false')
    expect(embedCalls).toBe(2)
  })
})
