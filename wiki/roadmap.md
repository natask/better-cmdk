# Roadmap

## Phase 1 - Make replacement easy

Goal: a user can replace `cmdk` with `master-cmdk` and keep moving.

Work:

- preserve cmdk JSX compatibility
- preserve CSS attribute contract
- keep shadcn composition working
- document the import swap
- publish a drop-in demo
- keep Playwright compatibility suite green

Acceptance:

- existing cmdk snippets compile unchanged
- `pnpm -F master-cmdk build`
- `pnpm -F master-cmdk typecheck`
- `pnpm -F master-cmdk test`
- `pnpm -F master-cmdk test:e2e`

## Phase 2 - Add command-surface enhancements

Goal: make the palette clearly better without requiring backend infrastructure.

Work:

- aliases
- better local matching
- group-level filtering
- previews
- forms and confirmations
- loading/error/result states
- query analytics event emission

Acceptance:

- all features are additive
- no cmdk API breakage
- playground scenarios exist

## Phase 3 - Define the action manifest

Goal: one schema for product actions.

Work:

- action manifest type
- command/action normalization
- source metadata
- input schema metadata
- permission metadata
- preview and execution references

Acceptance:

- manual actions can render in the palette
- OpenAPI and MCP can map into the same shape
- docs explain what is core vs adapter

## Phase 4 - Adapter contracts

Goal: connect external systems without owning them.

Work:

- search adapter contract
- action source adapter contract
- execution adapter contract
- auth adapter contract
- analytics adapter contract

Acceptance:

- adapters are optional
- no bundled infra requirement
- examples can be implemented with mocks first

## Phase 5 - First connector examples

Goal: prove the layer works with real external tools.

Candidate examples:

- OpenAPI to actions
- MCP to actions
- Turbopuffer search adapter
- PostHog analytics adapter
- Trigger.dev or Hatchet execution adapter

Acceptance:

- each connector is thin
- each connector can be replaced by a customer implementation
- examples avoid locking the product to one backend

## Phase 6 - Shareable working docs

Goal: move planning out of chat, Notion, and Linear into local Markdown.

Work:

- maintain this wiki
- add decision records for major architecture choices
- add implementation briefs per task
- generate issue/task docs from the roadmap

Acceptance:

- another person can read `wiki/README.md` and understand the plan
- docs can be copied/exported/shared without depending on Notion or Linear
