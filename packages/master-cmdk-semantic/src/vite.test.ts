import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { commandVectorPlugin } from './vite'

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
})
