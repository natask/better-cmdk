# Decisions

This is the decision log index. Keep decisions short and durable. Use a separate RFC only when a decision needs exploration before settling.

## Accepted

### 2026-06-14 - `wiki/` is internal project memory

Decision:

Use `wiki/` as the private project memory and context recovery hub for you and future agents.

Reason:

Chat sessions lose context. GitHub and Linear track work but do not preserve the full reasoning. Public docs are for others. `wiki/` keeps the project brain close to the code.

Consequences:

- every session starts from `wiki/HOME.md`
- `wiki/NOW.md` records the current state
- `wiki/TASKS.md` maps work to GitHub/Linear
- `wiki/DECISIONS.md` records important decisions
- `wiki/LOG.md` records what happened over time

### 2026-06-14 - `docs/` is public documentation

Decision:

Reserve `docs/` for public documentation powered by `farming-labs/docs`.

Reason:

Public docs and private project memory have different audiences. Mixing them creates confusion and makes private operating notes harder to use.

Consequences:

- public user/contributor docs go in `docs/`
- internal planning stays in `wiki/`
- rough notes stay in `scratch/`

### 2026-06-14 - adapters, not infrastructure

Decision:

`master-cmdk` should connect existing systems instead of owning search, durable execution, auth, analytics storage, or browser automation infrastructure.

Reason:

The product should be easy to adopt and self-host. Teams already have search backends, workflow runtimes, auth systems, and analytics tools.

Consequences:

- core package defines contracts and UI behavior
- provider integrations should be thin connectors
- hosted services are optional later, not required for the open-source package

## Proposed

- GitHub is code/review/CI; Linear is planning/status.
- `docs/` should use `farming-labs/docs`.
- Semantic/search experiments should be separated from the cmdk-compatible core before the next public push.
