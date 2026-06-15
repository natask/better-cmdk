# now

Last updated: 2026-06-14

## current state

The project now has two threads:

- fix `cmdk` and keep the same API
- connect search, OpenAPI, MCP, workflow tools, auth, and analytics through adapters

Chat sessions lose context. Use `wiki/` to remember the project.

## current split

Use this split:

- `wiki/` - private project memory for you and agents.
- `scratch/` - raw notes and temporary files.
- `docs/` - public docs powered by `farming-labs/docs`.
- GitHub - code, PRs, issues, CI, releases.
- Linear - roadmap, cycles, priority, and work status.

## recent commits

- `96c8d00 docs(wiki): add working product documents`
- `817c5f8 feat(playground): add product action landing page`

## local state

The worktree has unrelated local changes from earlier code and semantic-search work. Keep them unless the user asks to change them.

## next goal

Clean up project management before more feature work.

Next steps:

1. Finish the internal hub files in `wiki/`.
2. Decide how GitHub and Linear should map to this hub.
3. Create a cleanup plan that separates core cmdk work, semantic/search experiments, docs, and adapter design.
