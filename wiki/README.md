# master-cmdk wiki

This directory stores project memory.

Start at [HOME](HOME.md).

Use `scratch/` for raw notes and experiments. Use `wiki/` to remember decisions, tasks, and project thinking.

Public docs belong in `docs/`, powered by `farming-labs/docs`.

## current thesis

`master-cmdk` should make it easy to replace `cmdk` first. Then it should add product-command features through adapters.

It should connect to search, workflow, analytics, auth, and browser tools.

## documents

- [Home](HOME.md) - internal project hub.
- [Now](NOW.md) - current state and active context.
- [Tasks](TASKS.md) - task map and GitHub/Linear link targets.
- [Decisions](DECISIONS.md) - decisions.
- [Log](LOG.md) - chronological project memory.
- [Product scope](product-scope.md) - what the product owns.
- [Architecture](architecture.md) - layers, package split, and data flow.
- [Adapter contracts](adapter-contracts.md) - the thin interfaces that connect external systems.
- [Roadmap](roadmap.md) - phased plan from drop-in replacement to adapter layer.
- [Open decisions](open-decisions.md) - unresolved product and architecture questions.
- [Notion and Linear exit](notion-linear-exit.md) - how local docs store project memory.

## working rules

1. Keep the cmdk compatibility promise explicit.
2. Write down decisions here before they spread across chat, scratch files, Notion, or Linear.
3. If a feature needs an external tool, define an adapter first.
4. Treat external systems as replaceable: Turbopuffer, Algolia, Postgres, Temporal, Hatchet, Trigger.dev, Restate, DBOS, Inngest, PostHog, Segment, Notion, Linear.
5. Make the first adoption step boring: replace `cmdk`, keep JSX, keep CSS attributes, then opt in.
