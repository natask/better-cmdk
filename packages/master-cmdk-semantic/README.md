# master-cmdk semantic internals

Client-side semantic scoring helpers for `master-cmdk`.

Public users should import these helpers through `master-cmdk/semantic`. This
workspace package exists so the optional semantic implementation can stay
separate from the base `master-cmdk` entrypoint.

This package keeps cmdk's filter contract synchronous:

```ts
(value, search, keywords) => number
```

The expensive embedding work runs outside that function. The filter only reads
the latest cached semantic score map and composes it with the core text matcher.

## Potion vectors

`master-cmdk/semantic/potion` loads Model2Vec/Potion static embedding tables.
The default model is `minishlab/potion-base-2M`.

```ts
import { createPotionQueryEmbedder } from 'master-cmdk/semantic/potion'
import { potionCommandVectorPlugin } from 'master-cmdk/semantic/vite'
```

Use the Vite plugin to pre-embed static command entries during dev/build. The
same plugin also serves/copies the Potion table as local app assets, so the
browser does not fetch the model from Hugging Face at runtime.

```ts
export default {
  plugins: [
    potionCommandVectorPlugin({
      items: 'src/commands.ts',
      getValue: command => command.value,
      getText: command => `${command.label}\n${command.description}`,
    }),
  ],
}
```

Then compose the generated vectors with the normal cmdk filter:

```ts
import { createSemanticCommandScore } from 'master-cmdk/semantic'
import { createPotionQueryEmbedder } from 'master-cmdk/semantic/potion'
import { model, modelAssets, vectors } from 'virtual:master-cmdk/semantic-vectors'

const queryEmbedder = createPotionQueryEmbedder({ model, urls: modelAssets })
const semantic = createSemanticCommandScore({
  vectors,
  embedQuery: queryEmbedder,
})
```

## Qwen command ranking

`master-cmdk/semantic/qwen` adds an optional LLM ranker for small command sets.
It is not an embedding model; it calls a local OpenAI-compatible Qwen server and
returns ranked command values. Use it with `shouldFilter={false}` or another
app-owned async result pipeline.

Start a local server with vLLM, for example:

```sh
vllm serve Qwen/Qwen3.5-0.8B --port 8000 --tensor-parallel-size 1 --language-model-only
```

Then call the ranker:

```ts
import { createQwenCommandRanker } from 'master-cmdk/semantic/qwen'

const rankCommands = createQwenCommandRanker({
  endpoint: 'http://localhost:8000/v1',
  model: 'Qwen/Qwen3.5-0.8B',
})

const results = await rankCommands('prod broke', commands, signal)
```

Environment variables are also supported: `QWEN_BASE_URL`, `QWEN_MODEL`, and
`QWEN_API_KEY`. Use Node's built-in env loading when needed, for example
`node --env-file=.env ./script.js`.

## Hugging Face feature extraction

`master-cmdk/semantic/huggingface` wraps the official Hugging Face JS client for
embedding smoke tests. The default model is `MongoDB/mdbr-leaf-mt` with
`provider: 'auto'`.

```ts
import { createHuggingFaceFeatureExtractionEmbedder } from 'master-cmdk/semantic/huggingface'

const embedQuery = createHuggingFaceFeatureExtractionEmbedder({
  token: process.env.HF_TOKEN,
})

const vector = await embedQuery('Today is a sunny day and I will get some ice cream.', new AbortController().signal)
```

The lower-level endpoint helper supports all playground wire modes: TEI `/embed`,
OpenAI-compatible `/v1/embeddings`, raw Hugging Face feature-extraction HTTP, and
the Hugging Face `InferenceClient` provider path.

For app-owned proxy routes, keep the provider on your server and pass only an
abort-aware query embedder to the scorer:

```ts
import { createFetchEmbedder } from 'master-cmdk/semantic/embedding'

const embedQuery = createFetchEmbedder('/api/embed')
```

The default request body is `{ input: query }`. The helper accepts custom
headers, request bodies, and response parsers for Cloudflare Workers, Vercel
functions, or hosted embedding services.
