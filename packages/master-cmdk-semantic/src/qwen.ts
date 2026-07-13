export interface QwenCommandEntry {
  value: string
  label: string
  description?: string
  aliases?: readonly string[]
  keywords?: readonly string[]
}

export interface QwenRankResult {
  value: string
  score: number
  reason?: string
}

export interface QwenCommandRankerOptions {
  endpoint?: string
  model?: string
  apiKey?: string
  fetch?: typeof fetch
  systemPrompt?: string
  temperature?: number
  topP?: number
  maxTokens?: number
}

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const DEFAULT_MODEL = 'Qwen/Qwen3.5-0.8B'
const DEFAULT_ENDPOINT = 'http://localhost:8000/v1'

const DEFAULT_SYSTEM_PROMPT = [
  'You rank command palette actions by user intent.',
  'Return only JSON. No markdown, no prose.',
  'Use only command values present in the provided command list.',
  'Scores must be numbers from 0 to 1, where 1 is an exact intent match and 0 is unrelated.',
  'Prefer precise user-visible actions over loosely related actions.',
].join(' ')

function getEnv(name: string): string | undefined {
  const maybeProcess = globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
  return maybeProcess.process?.env?.[name]
}

function clampScore(score: unknown): number {
  const numeric = typeof score === 'number' ? score : Number(score)
  if (!Number.isFinite(numeric)) return 0
  if (numeric <= 0) return 0
  if (numeric >= 1) return 1
  return numeric
}

function normalizeEndpoint(endpoint: string): string {
  const base = endpoint.replace(/\/$/, '')
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
}

function parseJsonArray(content: string): unknown {
  const trimmed = content.trim()
  if (trimmed.startsWith('[')) return JSON.parse(trimmed)

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (match) return JSON.parse(match[1])

  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start !== -1 && end > start) return JSON.parse(trimmed.slice(start, end + 1))

  throw new Error('[master-cmdk-semantic] Qwen ranker did not return a JSON array')
}

function commandText(command: QwenCommandEntry): string {
  return [
    `value: ${command.value}`,
    `label: ${command.label}`,
    command.description ? `description: ${command.description}` : undefined,
    command.aliases?.length ? `aliases: ${command.aliases.join(', ')}` : undefined,
    command.keywords?.length ? `keywords: ${command.keywords.join(', ')}` : undefined,
  ].filter(Boolean).join('\n')
}

function buildMessages(query: string, commands: readonly QwenCommandEntry[], systemPrompt: string): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        `Query: ${query}`,
        '',
        'Commands:',
        commands.map((command, index) => `${index + 1}. ${commandText(command)}`).join('\n\n'),
        '',
        'Return a JSON array sorted best-first:',
        '[{"value":"command-value","score":0.95,"reason":"short reason"}]',
        'Return [] when no command is relevant.',
      ].join('\n'),
    },
  ]
}

function parseRankResults(content: string, commands: readonly QwenCommandEntry[]): QwenRankResult[] {
  const allowed = new Set(commands.map((command) => command.value))
  const parsed = parseJsonArray(content)
  if (!Array.isArray(parsed)) throw new Error('[master-cmdk-semantic] Qwen ranker JSON must be an array')

  const seen = new Set<string>()
  const results: QwenRankResult[] = []

  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue

    const record = item as Record<string, unknown>
    const value = typeof record.value === 'string' ? record.value : ''
    if (!allowed.has(value) || seen.has(value)) continue


    seen.add(value)
    results.push({
      value,
      score: clampScore(record.score),
      reason: typeof record.reason === 'string' ? record.reason : undefined,
    })
  }

  return results.sort((a, b) => b.score - a.score)
}

export function createQwenCommandRanker(options: QwenCommandRankerOptions = {}) {
  const endpoint = normalizeEndpoint(options.endpoint ?? getEnv('QWEN_BASE_URL') ?? getEnv('OPENAI_BASE_URL') ?? DEFAULT_ENDPOINT)
  const model = options.model ?? getEnv('QWEN_MODEL') ?? DEFAULT_MODEL
  const apiKey = options.apiKey ?? getEnv('QWEN_API_KEY') ?? getEnv('OPENAI_API_KEY') ?? 'EMPTY'
  const fetchImpl = options.fetch ?? globalThis.fetch
  const systemPrompt = options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT

  if (!fetchImpl) throw new Error('[master-cmdk-semantic] fetch is required to use the Qwen ranker')

  return async function rankCommands(
    query: string,
    commands: readonly QwenCommandEntry[],
    signal?: AbortSignal,
  ): Promise<QwenRankResult[]> {
    const search = query.trim()
    if (!search || commands.length === 0) return []

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(search, commands, systemPrompt),
        temperature: options.temperature ?? 0.2,
        top_p: options.topP ?? 0.8,
        max_tokens: options.maxTokens ?? 512,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`[master-cmdk-semantic] Qwen ranker request failed: ${response.status}`)
    }

    const body = await response.json() as ChatCompletionResponse
    const content = body.choices?.[0]?.message?.content
    if (!content) throw new Error('[master-cmdk-semantic] Qwen ranker returned no message content')

    return parseRankResults(content, commands)
  }
}

export { DEFAULT_MODEL as defaultQwenModel }
