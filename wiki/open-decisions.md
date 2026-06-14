# Open decisions

## Product naming

Current package name is `master-cmdk`.

Open question: should the broader adapter/action-manifest layer keep this name or get a separate product/package name?

Options:

- keep everything under `master-cmdk`
- package split: `master-cmdk` for UI, `master-command` or similar for core
- keep `master-cmdk-core` as the framework-neutral package

## Adapter API location

Open question: do adapter contracts live in `master-cmdk-core` or a separate package?

Default leaning: put stable contracts in `master-cmdk-core`; put provider-specific code in connector packages.

## OpenAPI shape

Open question: should OpenAPI ingestion happen at build time, runtime, or both?

Likely answer:

- build-time generation for typed app actions
- runtime loading for admin/internal tools and dynamic APIs

## MCP relationship

Open question: is MCP an import source, export target, or both?

Likely answer: both.

- import MCP tools into the command surface
- export the action manifest as an MCP server

## Analytics storage

Open question: should open source include local storage for events?

Default leaning: emit events only. Provide simple dev/demo storage, but production storage should be an adapter.

## Browser extension

Open question: when should a browser extension enter the roadmap?

Default leaning: later. First make the app-embedded command layer work. The browser extension can become another UI/execution surface after the manifest and adapters are stable.

## Notion and Linear

Open question: do we sync wiki docs back to Notion/Linear?

Default leaning: local Markdown is canonical. Notion/Linear can receive exported summaries if sharing requires it, but they should not become the source of truth.
