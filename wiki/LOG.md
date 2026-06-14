# Log

## 2026-06-14

### Internal memory system

Created the first project memory docs:

- `wiki/product-scope.md`
- `wiki/architecture.md`
- `wiki/adapter-contracts.md`
- `wiki/roadmap.md`
- `wiki/open-decisions.md`
- `wiki/notion-linear-exit.md`

Then clarified the split:

- `wiki/` is private project memory.
- `docs/` is public documentation powered by `farming-labs/docs`.
- `scratch/` is raw notes and experiments.
- GitHub and Linear are execution systems, not canonical memory.

Added hub files:

- `wiki/HOME.md`
- `wiki/NOW.md`
- `wiki/TASKS.md`
- `wiki/DECISIONS.md`
- `wiki/LOG.md`

### Landing page

Added a default playground marketing page:

- commit `817c5f8 feat(playground): add product action landing page`

The root playground route now presents the product-action layer concept. The existing full fix demo remains available at `/?demo`.

### Verification

After the landing page commit, these checks passed:

- `pnpm -F @master-cmdk/playground typecheck`
- `pnpm -F @master-cmdk/playground build`
- `pnpm -F master-cmdk build`
- `pnpm -F master-cmdk typecheck`
- `pnpm -F master-cmdk test`
- `pnpm -F master-cmdk test:e2e`

Playwright e2e result: 69 passed.
