# adapter contracts

These shapes can change.

Use adapters so teams can swap tools without changing the command UI.

## action manifest

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

## search adapter

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

The adapter returns results. The command UI renders them.

## action source adapter

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

## execution adapter

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

## auth adapter

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

## analytics adapter

```ts
export type AnalyticsAdapter = {
  track(event: CommandEvent): void | Promise<void>
}
```

Emit these events:

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

The open-source package emits events. The user's analytics system stores them.
