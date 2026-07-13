import { describe, expect, test, vi } from 'vitest'
import { createQwenCommandRanker, defaultQwenModel } from './qwen'

describe('Qwen command ranker', () => {
  const commands = [
    { value: 'deploy', label: 'Deploy production', description: 'Release the app to live users' },
    { value: 'issue', label: 'Create Linear issue', description: 'Report bugs and product defects' },
    { value: 'theme', label: 'Toggle dark mode', description: 'Change interface appearance' },
  ]

  test('calls an OpenAI-compatible chat completion endpoint and parses ranked values', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body))
      expect(body.model).toBe(defaultQwenModel)
      expect(body.messages[1].content).toContain('Deploy production')
      expect(body.messages[1].content).toContain('Query: ship app')

      return new Response(JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify([
              { value: 'deploy', score: 0.96, reason: 'shipping maps to deployment' },
              { value: 'missing', score: 1 },
              { value: 'issue', score: 0.2 },
            ]),
          },
        }],
      }))
    })

    const rank = createQwenCommandRanker({ fetch: fetchMock as unknown as typeof fetch })
    const results = await rank('ship app', commands)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/v1/chat/completions', expect.any(Object))
    expect(results).toEqual([
      { value: 'deploy', score: 0.96, reason: 'shipping maps to deployment' },
      { value: 'issue', score: 0.2, reason: undefined },
    ])
  })

  test('accepts fenced JSON responses and clamps scores', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{
        message: {
          content: '```json\n[{"value":"theme","score":3},{"value":"deploy","score":-1}]\n```',
        },
      }],
    })))

    const rank = createQwenCommandRanker({ fetch: fetchMock as unknown as typeof fetch })
    await expect(rank('night mode', commands)).resolves.toEqual([
      { value: 'theme', score: 1, reason: undefined },
      { value: 'deploy', score: 0, reason: undefined },
    ])
  })
})
