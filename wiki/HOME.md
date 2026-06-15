# project hub

This is the project hub for `better-cmdk` / `master-cmdk`.

Open this when you forget what is going on.

## start here

1. Read [NOW](NOW.md) for the current state.
2. Read [TASKS](TASKS.md) for active work and task links.
3. Read [DECISIONS](DECISIONS.md) for what we decided.
4. Read [LOG](LOG.md) for what happened recently.

## what this project is

`master-cmdk` replaces `cmdk` first. It keeps existing JSX working. It adds adapters after that.

Build toward this:

- replace `cmdk` and keep existing JSX
- preserve the public cmdk API and CSS attribute contract
- add better command features
- connect to existing search, OpenAPI, MCP, execution, auth, and analytics systems

## repo map

- `packages/master-cmdk/` - React package and cmdk-compatible UI.
- `packages/master-cmdk-core/` - framework-neutral core work.
- `packages/master-cmdk-semantic/` - current semantic/search experiment area.
- `apps/playground/` - local demo and manual test app.
- `wiki/` - internal memory hub for you and agents.
- `scratch/` - raw notes, experiments, logs, and research.
- `docs/` - reserved for public docs powered by `farming-labs/docs`.

## reference docs

- [Product scope](product-scope.md)
- [Architecture](architecture.md)
- [Adapter contracts](adapter-contracts.md)
- [Roadmap](roadmap.md)
- [Open decisions](open-decisions.md)
- [Notion and Linear exit](notion-linear-exit.md)

## session steps

Before work:

1. Read `AGENTS.md`.
2. Read this file.
3. Read [NOW](NOW.md).
4. Read [TASKS](TASKS.md).
5. Read [DECISIONS](DECISIONS.md).

After work:

1. Update [NOW](NOW.md) if the current state changed.
2. Update [TASKS](TASKS.md) if active work changed.
3. Update [DECISIONS](DECISIONS.md) if a decision was made.
4. Add an entry to [LOG](LOG.md).
