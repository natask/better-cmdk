# architecture

## layers

```txt
UI
  React cmdk-compatible package
  framework adapters later
  browser extension later

Core
  item registry
  matcher and alias expansion
  action manifest
  command state
  permission data
  run status
  analytics events

Adapters
  search
  OpenAPI
  MCP
  execution
  auth
  analytics

Customer tools
  Turbopuffer / Algolia / Postgres / Meilisearch / customer API
  Temporal / Hatchet / Trigger.dev / Restate / DBOS / Inngest / customer queue
  PostHog / Segment / warehouse
  customer's auth and app database
```

## packages

### `master-cmdk`

React package. Preserves cmdk JSX and CSS attributes.

It owns:

- React components
- DOM attributes
- accessibility behavior
- keyboard and pointer behavior
- previews, forms, and status UI

### `master-cmdk-core`

Framework-neutral core.

It owns:

- command registry
- action manifest shape
- matching contracts
- adapter contracts
- state transitions
- analytics event definitions

Customer tools own:

- React
- DOM
- network storage
- workflow runs
- auth rules

### connector packages

Possible packages:

- `master-cmdk-openapi`
- `master-cmdk-mcp`
- `master-cmdk-turbopuffer`
- `master-cmdk-temporal`
- `master-cmdk-hatchet`
- `master-cmdk-trigger`
- `master-cmdk-posthog`

Keep each connector small.

## data flow

1. User types in the command surface.
2. Local matcher and aliases run first.
3. Search adapter may return remote candidates.
4. Action manifest turns candidates into command items.
5. Auth adapter marks actions as allowed, disabled, hidden, or approval-gated.
6. User previews or confirms an action.
7. Execution adapter starts work in the customer's workflow tool.
8. Status updates stream back into the command surface.
9. Analytics adapter receives query/result/execution events.

## main point

`master-cmdk` connects tools that teams already run.
