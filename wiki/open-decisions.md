# open decisions

## product name

Current package name is `master-cmdk`.

Question: should the adapter/action-manifest layer keep this name or use a new package name?

Options:

- keep everything under `master-cmdk`
- package split: `master-cmdk` for UI, `master-command` or similar for core
- keep `master-cmdk-core` as the framework-neutral package

## adapter API location

Question: do adapter contracts live in `master-cmdk-core` or a separate package?

Current lean: put stable contracts in `master-cmdk-core`; put provider code in connector packages.

## OpenAPI shape

Question: should OpenAPI load at build time, runtime, or both?

Current lean:

- build-time generation for typed app actions
- runtime load for admin/internal tools and dynamic APIs

## MCP relationship

Question: is MCP an import source, export target, or both?

Current lean: both.

- import MCP tools into the command surface
- export the action manifest as an MCP server

## analytics storage

Question: should open source store events locally?

Current lean: emit events. Provide simple dev storage. Use an adapter for production storage.

## browser extension

Question: when should a browser extension enter the roadmap?

Current lean: later. First make the app command layer work. Add the browser extension after the manifest and adapters work.

## Notion and Linear

Question: do we sync wiki docs back to Notion/Linear?

Current lean: local Markdown is the main place. Export summaries to Notion/Linear only when sharing requires it.
