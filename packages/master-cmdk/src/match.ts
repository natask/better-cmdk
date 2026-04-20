import { commandScore } from './command-score'

function fold(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getAcronym(words: string[]): string {
  return words
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
}

function getWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s\-_\/]+/)
    .filter(Boolean)
}

function tierScore(rawHaystack: string, needle: string): number {
  const haystack = fold(rawHaystack)
  if (!haystack || !needle) return 0
  if (haystack === needle) return 1
  if (haystack.startsWith(needle)) return 0.9

  const words = getWords(rawHaystack).map((word) => fold(word))
  if (words.some((word) => word.startsWith(needle))) return 0.8
  if (getAcronym(words) === needle) return 0.7
  if (haystack.includes(needle)) return 0.6

  return clamp(commandScore(haystack, needle, [] as string[]) * 0.5, 0, 0.5)
}

export function betterMatch(value: string, search: string, keywords?: string[]): number {
  const needle = fold(search)
  if (!needle) return 0

  const labelScore = tierScore(value, needle)
  const keywordScore = (keywords ?? []).reduce((max, keyword) => Math.max(max, tierScore(keyword, needle)), 0)

  if (labelScore > 0 && labelScore >= keywordScore) {
    return clamp(labelScore + 0.01, 0, 1)
  }

  return keywordScore
}
