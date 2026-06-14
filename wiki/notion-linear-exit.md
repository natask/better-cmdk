# Notion and Linear exit

## Goal

Stop losing product thinking across chat, Notion, Linear, and scratch files.

The repo should contain the working documents:

- product direction
- architecture
- adapter contracts
- roadmap
- implementation briefs
- decision records

## Source of truth

`wiki/` is canonical for cleaned thinking.

`scratch/` remains local-only for raw notes, experiments, research dumps, and temporary task lists.

Notion and Linear can be sharing or tracking surfaces, not the place where the product truth lives.

## Sharing options

### Option A - Share Markdown directly

Send someone the relevant files or a GitHub link.

Best for engineers and collaborators who can read repo docs.

### Option B - Export generated docs

Generate a single Markdown or HTML packet from `wiki/` when a more polished share is needed.

Best for advisors, users, or design/product review.

### Option C - Push to Notion through the API

Possible later if sharing requires Notion.

Important constraint: Notion should be an output target, not the editor of record. If Notion diverges from `wiki/`, `wiki/` wins.

### Option D - Generate Linear tickets from docs

Possible later if task tracking requires Linear.

Important constraint: Linear tickets should point back to wiki docs for context. They should not hold the full plan.

## Immediate practice

1. Write product thinking in `wiki/`.
2. Link implementation tasks to wiki docs.
3. Use `scratch/` only for rough notes.
4. Promote useful scratch notes into `wiki/`.
5. If something matters enough to share, it belongs in `wiki/`.
