# Implementer briefing

You are picking up the master-cmdk implementation.

Working notes, plans, task lists, and research live under [scratch/](scratch/) (gitignored, local-only). If that directory is empty, ask the user for the current plan — do not invent one.

## Non-negotiable constraints

- Preserve cmdk's public API exactly. Every JSX snippet that compiles against `cmdk@1.1.1` must compile unchanged against `master-cmdk`. No renames, no prop removals. Additive props only.
- Preserve the CSS attribute contract: `cmdk-root`, `cmdk-item`, `cmdk-group`, `cmdk-input`, `cmdk-list`, `cmdk-group-heading`, `cmdk-group-items`, `cmdk-separator`, `cmdk-empty`, `cmdk-loading`, `cmdk-label`, `data-selected`, `data-value`, `data-disabled`, `hidden`. Never rename. Only add.
- The Playwright suite at `packages/master-cmdk/test/` is the compat guardrail. If any task breaks it in a way that is not a deliberate API improvement, fix the code — do not edit the test.

## Execution protocol (per task)

1. Read the task from the user's current scratch notes (or ask if none exist).
2. Diagnose the code — follow the call chain, find the root cause. No guessing.
3. Implement the smallest change that satisfies acceptance criteria. Prefer deleting over adding.
4. Verify:
   - `pnpm -F master-cmdk build`
   - `pnpm -F master-cmdk typecheck`
   - `pnpm -F master-cmdk test` (vitest, if the task adds unit tests)
   - `pnpm -F master-cmdk test:e2e` (Playwright)
5. If verification fails, fix in the same commit. Do not land red.
6. Add a playground scenario in `apps/playground/src/App.tsx` exercising the change.
7. Stage only the files you changed: `git add <specific files>`.
8. Commit via `/commit` skill using the commit template in [Style](#style).
9. Move to the next task.

## Style

- Commits one-task-at-a-time. No batching.
- Commit message format:
  ```
  type(scope): short message

  body describing what and why, with upstream refs

  workhorse: AGENT <model name>
  ```
- Never skip hooks (`--no-verify`). Never force push.

## Repo layout

- `packages/master-cmdk/` — the library (forked from upstream cmdk, additive changes only).
- `packages/master-cmdk/test/` — Playwright compat suite; `cmdk` is aliased to `master-cmdk` via `workspace:master-cmdk@*`.
- `apps/playground/` — Vite + React playground for manual verification.

## Prior art worth reading

- [Upstream PR #369](https://github.com/pacocoursey/cmdk/pull/369) — abandoned upstream work on controlled open/onOpenChange and related fixes. Borrow the ideas; prefer `useLayoutEffect` over `requestAnimationFrame`.

## When in doubt

- Keep scope tight. Respect any "Non-goals" section on the task you were given.
- If you discover a related fix while implementing, note it in the user's scratch notes; do not pile it onto the current commit.


## info
npm run dev  following to display the demo the 13 fixes. 
http://localhost:5173/
