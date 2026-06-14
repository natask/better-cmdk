# Tasks

This file is the human-readable task map. GitHub and Linear should track executable work, but this file explains how the work fits together.

## Active

### 1. Establish internal project hub

Status: in progress

Goal: make `wiki/` the single place to recover context across chat sessions.

Done:

- created initial product/architecture docs
- added this hub structure

Remaining:

- decide GitHub/Linear mapping
- add links once projects/issues exist
- add session logging practice

### 2. Codebase cleanup plan

Status: not started

Goal: cleanly separate production package work from semantic/search experiments and playground demos.

Questions:

- what remains core `master-cmdk`?
- what belongs in `master-cmdk-core`?
- what belongs in `master-cmdk-semantic`?
- what is demo-only?
- what should be removed, moved, or documented?

### 3. Public docs setup

Status: not started

Goal: use `docs/` for public documentation powered by `farming-labs/docs`.

Questions:

- should `docs/` live in this repo or a separate docs repo?
- which pages are public first: install, compatibility, roadmap, adapter philosophy?
- when do agent-readable docs become a release blocker?

## Backlog

- Define GitHub labels.
- Define Linear project/cycle structure.
- Create ADR template.
- Create RFC template.
- Create session log template.
- Write ADR: `wiki is internal memory; docs is public docs`.
- Write ADR: `adapters, not bundled infrastructure`.
- Write cleanup plan for current dirty worktree.
