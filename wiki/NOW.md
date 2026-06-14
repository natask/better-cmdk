# Now

Last updated: 2026-06-14

## Current state

The project is shifting from isolated cmdk fixes and semantic-search experiments toward a cleaner product shape:

> A cmdk-compatible replacement that can later connect existing search, OpenAPI/MCP tools, execution runtimes, auth, and analytics through adapters.

The immediate operational problem is context loss across sessions. The fix is to make `wiki/` the internal project hub.

## Current decision

Use this split:

- `wiki/` - private project memory for you and agents.
- `scratch/` - raw notes and temporary workbench material.
- `docs/` - public docs powered by `farming-labs/docs`.
- GitHub - code, PRs, issues, CI, releases.
- Linear - roadmap, cycles, priorities, execution tracking.

## Recent commits

- `96c8d00 docs(wiki): add working product documents`
- `817c5f8 feat(playground): add product action landing page`

## Current local caveat

There are unrelated local changes in the worktree from earlier implementation and semantic-search work. Do not revert them without explicit instruction.

## Next operating goal

Clean up the project management and memory structure before doing more feature work.

Concrete next step:

1. Finish the internal hub files in `wiki/`.
2. Decide how GitHub and Linear should map to this hub.
3. Create a cleanup plan that separates core cmdk work, semantic/search experiments, docs, and adapter design.
