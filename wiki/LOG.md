# log

## 2026-06-14

### set up project memory

Created the first project memory docs:

- `wiki/product-scope.md`
- `wiki/architecture.md`
- `wiki/adapter-contracts.md`
- `wiki/roadmap.md`
- `wiki/open-decisions.md`
- `wiki/notion-linear-exit.md`

Then clarified the split:

- `wiki/` is private project memory.
- `docs/` is public docs powered by `farming-labs/docs`.
- `scratch/` is raw notes and experiments.
- GitHub tracks code work.
- Linear tracks project work.

Added hub files:

- `wiki/HOME.md`
- `wiki/NOW.md`
- `wiki/TASKS.md`
- `wiki/DECISIONS.md`
- `wiki/LOG.md`

### added landing page

Added a default playground marketing page:

- commit `817c5f8 feat(playground): add product action landing page`

The root playground route now shows the product-action layer. The full fix demo remains at `/?demo`.

### checked the page

After the landing page commit, these checks passed:

- `pnpm -F @master-cmdk/playground typecheck`
- `pnpm -F @master-cmdk/playground build`
- `pnpm -F master-cmdk build`
- `pnpm -F master-cmdk typecheck`
- `pnpm -F master-cmdk test`
- `pnpm -F master-cmdk test:e2e`

Playwright e2e result: 69 passed.
