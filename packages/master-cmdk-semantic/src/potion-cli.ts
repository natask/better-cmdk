#!/usr/bin/env node
import { dot, signedExponentialScore } from './index'
import { loadPotionModel } from './potion'

const BASE_MODELS = ['potion-base-2M', 'potion-base-4M', 'potion-base-8M', 'potion-base-32M']
const ALL_MODELS = [
  ...BASE_MODELS,
  'potion-retrieval-32M',
  'potion-code-16M',
  'potion-multilingual-128M',
]

interface Pair {
  textA: string
  textB: string
}

function usage(): string {
  return [
    'Usage: potion-score [--model <name>] [--verbose] <text-a> <text-b>',
    '       potion-score [--model <name>] <text-a,text-b> [more-a,more-b ...]',
    '',
    'By default, compares all Potion base models: 2M, 4M, 8M, 32M.',
    'Use --all to include retrieval, code, and multilingual models.',
    '',
    'Examples:',
    '  potion-score jira linear',
    '  potion-score jira,linear love,lo',
    '  potion-score "love" "lo"',
    '  potion-score "create jira issue,create linear issue" "search docs,find API reference"',
    '  potion-score --all "search docs" "find API reference"',
    '  potion-score --model potion-base-8M "create jira issue" "create linear issue"',
  ].join('\n')
}

function normalize(vector: readonly number[]): number[] {
  let magnitude = 0
  for (const value of vector) magnitude += value * value

  const norm = Math.sqrt(magnitude)
  if (!Number.isFinite(norm) || norm === 0) return []
  return vector.map((value) => value / norm)
}

function parsePair(input: string): Pair {
  const comma = input.indexOf(',')
  if (comma === -1) throw new Error(`Expected comma pair: ${input}`)

  const textA = input.slice(0, comma).trim()
  const textB = input.slice(comma + 1).trim()
  if (!textA || !textB) throw new Error(`Invalid comma pair: ${input}`)

  return { textA, textB }
}

function parsePairs(positionals: string[]): Pair[] {
  if (positionals.length === 2 && !positionals[0].includes(',') && !positionals[1].includes(',')) {
    return [{ textA: positionals[0], textB: positionals[1] }]
  }

  if (positionals.length > 0 && positionals.every((value) => value.includes(','))) {
    return positionals.map(parsePair)
  }

  throw new Error('Expected either two text arguments or one-or-more comma pairs')
}

function parseArgs(args: string[]): { models: string[]; pairs: Pair[]; verbose: boolean } {
  const models: string[] = []
  const positionals: string[] = []
  let all = false
  let verbose = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--') continue

    if (arg === '--help' || arg === '-h') {
      console.log(usage())
      process.exit(0)
    }

    if (arg === '--all') {
      all = true
      continue
    }

    if (arg === '--verbose' || arg === '-v') {
      verbose = true
      continue
    }

    if (arg === '--model' || arg === '-m') {
      const model = args[index + 1]
      if (!model) throw new Error('Missing value for --model')
      models.push(model)
      index += 1
      continue
    }

    positionals.push(arg)
  }

  return {
    models: models.length > 0 ? models : all ? ALL_MODELS : BASE_MODELS,
    pairs: parsePairs(positionals),
    verbose,
  }
}

async function main() {
  const { models, pairs, verbose } = parseArgs(process.argv.slice(2))

  const loadedModels = await Promise.all(models.map((modelName) => loadPotionModel({ model: modelName })))

  for (let pairIndex = 0; pairIndex < pairs.length; pairIndex += 1) {
    const { textA, textB } = pairs[pairIndex]

    if (pairIndex > 0) console.log('')
    console.log(`${textA} <> ${textB}`)
    if (verbose) console.log('')

    for (const model of loadedModels) {
      const vectorA = normalize(model.embed(textA))
      const vectorB = normalize(model.embed(textB))
      const rawCosine = vectorA.length && vectorB.length ? dot(vectorA, vectorB) : 0

      if (verbose) {
        console.log(`${model.model} (${model.dimensions}d)`)
        console.log(`  cosine: ${rawCosine.toFixed(6)}  (-1 opposite, 0 neutral, 1 same)`)
        console.log(`  edge:   ${signedExponentialScore(rawCosine).toFixed(6)}  signed exponential score`)
        console.log('')
      } else {
        console.log(`${model.model}: ${rawCosine.toFixed(6)}`)
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  console.error('')
  console.error(usage())
  process.exit(1)
})
