import { describe, expect, test, vi } from 'vitest'
import { commandScore } from 'master-cmdk-core'
import { cosineScore, createSemanticCommandScore, createSemanticScore } from './index'

describe('semantic scoring', () => {
  const vectors = {
    'cmd-deploy': [1, 0, 0],
    'cmd-issue': [0, 1, 0],
    'cmd-prs': [0, 0, 1],
  }

  test('computes cosine scores in the cmdk score range', () => {
    expect(cosineScore([1, 0], [1, 0])).toBe(1)
    expect(cosineScore([1, 0], [-1, 0])).toBe(0)
    expect(cosineScore(undefined, [1, 0])).toBe(0)
  })

  test('embeds a query once and compares it against build-time command vectors', async () => {
    const embedQuery = vi.fn(() => [1, 0, 0])
    const semantic = createSemanticScore({ vectors, embedQuery })

    await semantic.setSearch('ship app')

    expect(embedQuery).toHaveBeenCalledTimes(1)
    expect(semantic.semanticScore('cmd-deploy', 'ship app')).toBeGreaterThan(
      semantic.semanticScore('cmd-issue', 'ship app'),
    )

    await semantic.setSearch('ship app')
    expect(embedQuery).toHaveBeenCalledTimes(1)
  })

  test('keeps the cmdk filter sync while semantic work is cached outside it', async () => {
    const semantic = createSemanticCommandScore({
      vectors,
      embedQuery: query => query.includes('ticket') ? [0, 1, 0] : [1, 0, 0],
    })

    expect(semantic.filter('cmd-issue', 'make ticket', ['Create Linear issue'])).toBe(
      commandScore('cmd-issue', 'make ticket', ['Create Linear issue']),
    )

    await semantic.setSearch('make ticket')

    expect(semantic.filter('cmd-issue', 'make ticket', ['Create Linear issue'])).toBeGreaterThan(0)
    expect(semantic.filter('cmd-issue', 'make ticket', ['Create Linear issue'])).toBeGreaterThan(
      semantic.filter('cmd-deploy', 'make ticket', ['Deploy production']),
    )
  })

  test('notifies subscribers when semantic scores become ready', async () => {
    const semantic = createSemanticScore({
      vectors,
      embedQuery: () => [0, 0, 1],
    })
    const listener = vi.fn()

    semantic.subscribe(listener)
    await semantic.setSearch('review code')

    expect(listener).toHaveBeenCalled()
    expect(semantic.getSnapshot().status).toBe('ready')
    expect(semantic.semanticScore('cmd-prs', 'review code')).toBeGreaterThan(0)
  })
})
