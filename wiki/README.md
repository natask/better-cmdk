# master-cmdk wiki

This directory is the internal project memory hub.

Start at [HOME](HOME.md).

Use `scratch/` for raw notes and experiments. Use `wiki/` for context recovery, decisions, task maps, and cleaned project thinking.

Public documentation belongs in `docs/`, powered by `farming-labs/docs`.

## Current thesis

`master-cmdk` should make it easy to replace `cmdk` first, then progressively add product-command features through adapters.

It should not become a search engine, workflow engine, analytics store, auth system, or browser automation runtime. It should connect to those systems.

## Documents

- [Home](HOME.md) - internal project hub.
- [Now](NOW.md) - current state and active context.
- [Tasks](TASKS.md) - task map and GitHub/Linear link targets.
- [Decisions](DECISIONS.md) - durable decisions.
- [Log](LOG.md) - chronological project memory.
- [Product scope](product-scope.md) - what the product owns and does not own.
- [Architecture](architecture.md) - layers, package split, and data flow.
- [Adapter contracts](adapter-contracts.md) - the thin interfaces that connect external systems.
- [Roadmap](roadmap.md) - phased plan from drop-in replacement to adapter layer.
- [Open decisions](open-decisions.md) - unresolved product and architecture questions.
- [Notion and Linear exit](notion-linear-exit.md) - how local docs become the working system of record.

## Working rules

1. Keep the cmdk compatibility promise explicit.
2. Write down decisions here before they spread across chat, scratch files, Notion, or Linear.
3. If a feature requires infrastructure, define an adapter before considering a hosted implementation.
4. Treat external systems as replaceable: Turbopuffer, Algolia, Postgres, Temporal, Hatchet, Trigger.dev, Restate, DBOS, Inngest, PostHog, Segment, Notion, Linear.
5. Make the first adoption step boring: replace `cmdk`, keep JSX, keep CSS attributes, then opt in.
