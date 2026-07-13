import { describe, expect, test, vi } from 'vitest'
import { commandScore } from 'master-cmdk-core'
import { cosineScore, createSemanticCommandScore, createSemanticScore, signedExponentialScore } from './index'

describe('semantic scoring', () => {
  const vectors = {
    'cmd-deploy': [1, 0, 0],
    'cmd-issue': [0, 1, 0],
    'cmd-prs': [0, 0, 1],
  }

  test('computes signed cosine scores', () => {
    expect(cosineScore([1, 0], [1, 0])).toBe(1)
    expect(cosineScore([1, 0], [-1, 0])).toBe(-1)
    expect(cosineScore(undefined, [1, 0])).toBe(0)
  })

  test('pushes neutral semantic scores to zero and emphasizes edges', () => {
    expect(signedExponentialScore(0)).toBe(0)
    expect(signedExponentialScore(0.1)).toBe(0)
    expect(signedExponentialScore(-0.1)).toBe(0)
    expect(signedExponentialScore(0.8)).toBeGreaterThan(signedExponentialScore(0.4))
    expect(signedExponentialScore(-0.8)).toBeLessThan(signedExponentialScore(-0.4))
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

  test('scores the best result across query variants', async () => {
    const embedQuery = vi.fn((query: string) => query === 'linear issue' ? [0, 1, 0] : [0, 0, 0])
    const semantic = createSemanticScore({
      vectors,
      embedQuery,
      queryVariants: search => search === 'lienar bug' ? ['linear issue'] : [],
    })

    await semantic.setSearch('lienar bug')

    expect(embedQuery).toHaveBeenCalledTimes(2)
    expect(semantic.semanticScore('cmd-issue', 'lienar bug')).toBeGreaterThan(
      semantic.semanticScore('cmd-deploy', 'lienar bug'),
    )

    await semantic.setSearch('lienar bug')
    expect(embedQuery).toHaveBeenCalledTimes(2)
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
