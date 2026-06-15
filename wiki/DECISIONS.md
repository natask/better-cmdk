# decisions

This file records what we decided and why.

## accepted

### 2026-06-14 - `wiki/` is internal project memory

Decision:

Use `wiki/` as private project memory for you and later agents.

Reason:

Chat sessions lose context. GitHub and Linear track work. Public docs explain the product to others. `wiki/` keeps the project memory near the code.

Effects:

- every session starts from `wiki/HOME.md`
- `wiki/NOW.md` records the current state
- `wiki/TASKS.md` maps work to GitHub/Linear
- `wiki/DECISIONS.md` records important decisions
- `wiki/LOG.md` records what happened over time

### 2026-06-14 - `docs/` is public documentation

Decision:

Use `docs/` for public docs powered by `farming-labs/docs`.

Reason:

Public docs teach users. `wiki/` helps us remember the project.

Effects:

- public user/contributor docs go in `docs/`
- internal planning stays in `wiki/`
- rough notes stay in `scratch/`

### 2026-06-14 - connect through adapters

Decision:

`master-cmdk` should connect existing search, workflow, auth, analytics, and browser tools through adapters.

Reason:

Teams already run search tools, workflow tools, auth tools, and analytics tools. `master-cmdk` should make those tools usable from one command UI.

Effects:

- core package defines contracts and UI behavior
- provider integrations should be thin connectors
- hosted services can come later

## proposed

- GitHub is code/review/CI; Linear is planning/status.
- `docs/` should use `farming-labs/docs`.
- Semantic/search experiments should be separated from the cmdk-compatible core before the next public push.
