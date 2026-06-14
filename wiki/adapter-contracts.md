# Adapter contracts

These are working shapes, not final API commitments.

The goal is to make each external system replaceable without changing the command UI.

## Action manifest

```ts
export type CommandAction = {
  id: string
  title: string
  description?: string
  aliases?: string[]
  keywords?: string[]
  source?: 'manual' | 'openapi' | 'mcp' | 'search'
  inputSchema?: unknown
  permissions?: string[]
  preview?: ActionPreview
  execute?: ExecutionRef
}
```

## Search adapter

```ts
export type SearchAdapter = {
  query(input: {
    query: string
    limit?: number
    signal?: AbortSignal
    context?: CommandContext
  }): Promise<SearchResult[]>
}
```

Use for Turbopuffer, Algolia, Postgres, Meilisearch, local indexes, or customer APIs.

`master-cmdk` should not care whether results came from fuzzy search, exact search, vector search, or an API.

## Action source adapter

```ts
export type ActionSourceAdapter = {
  load(context?: CommandContext): Promise<CommandAction[]>
}
```

Use for:

- OpenAPI specs
- MCP servers
- app-defined actions
- workflow registries
- admin-tool manifests

## Execution adapter

```ts
export type ExecutionAdapter = {
  start(input: {
    action: CommandAction
    values: unknown
    context?: CommandContext
  }): Promise<ExecutionHandle>

  subscribe?(handle: ExecutionHandle, onEvent: (event: ExecutionEvent) => void): () => void
  cancel?(handle: ExecutionHandle): Promise<void>
}
```

Use for Temporal, Hatchet, Trigger.dev, Restate, DBOS, Inngest, Cloudflare Queues, or a customer's own job system.

## Auth adapter

```ts
export type AuthAdapter = {
  check(input: {
    action: CommandAction
    context?: CommandContext
  }): Promise<AuthDecision> | AuthDecision
}

export type AuthDecision =
  | { type: 'allow' }
  | { type: 'disable'; reason?: string }
  | { type: 'hide' }
  | { type: 'approval_required'; reason?: string }
```

Use for customer auth, RBAC, workspace policies, billing tier gates, and approval workflows.

## Analytics adapter

```ts
export type AnalyticsAdapter = {
  track(event: CommandEvent): void | Promise<void>
}
```

Events to emit:

- `query_typed`
- `no_results`
- `result_rendered`
- `result_selected`
- `action_previewed`
- `action_confirmed`
- `execution_started`
- `execution_completed`
- `execution_failed`
- `execution_cancelled`

The open-source package emits events. Storage belongs to the user's analytics system unless a hosted product is added later.
