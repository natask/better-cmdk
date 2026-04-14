import { describe, expect, it } from 'vitest'
import { betterMatch } from './match'

describe('betterMatch', () => {
  it('matches cafe against Café', () => {
    expect(betterMatch('Café', 'cafe')).toBeGreaterThan(0)
  })

  it('matches gh against GitHub strongly', () => {
    expect(betterMatch('GitHub', 'gh')).toBeGreaterThanOrEqual(0.7)
  })

  it('ranks exact and prefix above contains', () => {
    expect(betterMatch('foo', 'foo')).toBeGreaterThan(betterMatch('Foo Bar', 'foo'))
    expect(betterMatch('Foo Bar', 'foo')).toBeGreaterThan(betterMatch('Barfoo', 'foo'))
  })

  it('returns 0 for empty search', () => {
    expect(betterMatch('Café', '')).toBe(0)
  })

  it('matches on keywords even when value is opaque id', () => {
    expect(betterMatch('id-123', 'cafe', ['Café'])).toBeGreaterThan(0)
  })
})
