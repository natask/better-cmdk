# Architecture

## Layer model

```txt
UI surfaces
  React cmdk-compatible package
  future framework adapters
  browser extension surface later

Core engine
  item registry
  matcher and alias expansion
  action manifest
  command state
  permissions metadata
  execution status model
  analytics event model

Adapters
  search
  OpenAPI
  MCP
  execution
  auth
  analytics

External systems
  Turbopuffer / Algolia / Postgres / Meilisearch / customer API
  Temporal / Hatchet / Trigger.dev / Restate / DBOS / Inngest / customer queue
  PostHog / Segment / warehouse
  customer's auth and app database
```

## Package direction

### `master-cmdk`

React package. Preserves cmdk JSX and CSS attributes.

Owns:

- React components
- DOM attributes
- accessibility behavior
- keyboard and pointer behavior
- rendering previews/forms/status

### `master-cmdk-core`

Framework-neutral core.

Owns:

- command registry
- action manifest shape
- matching contracts
- adapter contracts
- state transitions
- analytics event definitions

Does not own:

- React
- DOM
- network storage
- workflow execution
- auth decisions

### Connector packages

Potential packages:

- `master-cmdk-openapi`
- `master-cmdk-mcp`
- `master-cmdk-turbopuffer`
- `master-cmdk-temporal`
- `master-cmdk-hatchet`
- `master-cmdk-trigger`
- `master-cmdk-posthog`

Each connector should be small and replaceable.

## Data flow

1. User types in the command surface.
2. Local matcher and aliases run first.
3. Search adapter may return remote candidates.
4. Action manifest normalizes candidates into command items.
5. Auth adapter marks actions as allowed, disabled, hidden, or approval-gated.
6. User previews or confirms an action.
7. Execution adapter starts work in the customer's runtime.
8. Status updates stream back into the command surface.
9. Analytics adapter receives query/result/execution events.

## Key principle

The product value is the connective layer, not the infrastructure behind it.
