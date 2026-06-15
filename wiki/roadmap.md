# roadmap

## phase 1 - make replacement easy

Goal: a user can replace `cmdk` with `master-cmdk` and keep moving.

Work:

- preserve cmdk JSX compatibility
- preserve CSS attribute contract
- keep shadcn composition working
- document the import swap
- publish a drop-in demo
- keep Playwright compatibility suite green

Check:

- existing cmdk snippets compile unchanged
- `pnpm -F master-cmdk build`
- `pnpm -F master-cmdk typecheck`
- `pnpm -F master-cmdk test`
- `pnpm -F master-cmdk test:e2e`

## phase 2 - improve the command surface

Goal: make the palette better with no backend setup.

Work:

- aliases
- better local matching
- group-level filtering
- previews
- forms and confirmations
- loading/error/result states
- query analytics events

Check:

- all features are additive
- no cmdk API breakage
- playground scenarios exist

## phase 3 - define the action manifest

Goal: one schema for product actions.

Work:

- action manifest type
- command/action mapping
- source data
- input schema data
- permission data
- preview and execution references

Check:

- manual actions can render in the palette
- OpenAPI and MCP can map into the same shape
- docs explain what is core vs adapter

## phase 4 - define adapter contracts

Goal: connect tools that teams already run.

Work:

- search adapter contract
- action source adapter contract
- execution adapter contract
- auth adapter contract
- analytics adapter contract

Check:

- adapters are optional
- examples can use mocks first

## phase 5 - add first connector examples

Goal: prove the layer works with real external tools.

Candidate examples:

- OpenAPI to actions
- MCP to actions
- Turbopuffer search adapter
- PostHog analytics adapter
- Trigger.dev or Hatchet execution adapter

Check:

- each connector is thin
- each connector can be replaced by a customer implementation
- examples keep the backend swappable

## phase 6 - keep shareable docs

Goal: move planning out of chat, Notion, and Linear into local Markdown.

Work:

- maintain this wiki
- add decision records for major choices
- add task briefs
- generate issue/task docs from the roadmap

Check:

- another person can read `wiki/README.md` and understand the plan
- docs can be copied, exported, and shared
