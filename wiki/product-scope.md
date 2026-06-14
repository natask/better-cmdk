# Product scope

## One-line positioning

`master-cmdk` is a cmdk-compatible command surface that connects a product's existing search, OpenAPI/MCP tools, execution runtime, auth, and analytics.

## What we provide

### 1. Drop-in cmdk replacement

The first install path should be:

```tsx
// before
import { Command } from 'cmdk'

// after
import { Command } from 'master-cmdk'
```

Existing JSX should keep working:

```tsx
<Command>
  <Command.Input />
  <Command.List>
    <Command.Item>Invite teammate</Command.Item>
  </Command.List>
</Command>
```

Compatibility is the wedge. The user should not need to buy into agents, OpenAPI, analytics, or workflow execution on day one.

### 2. Enhanced command UI

Additive capabilities on top of cmdk:

- better matching and aliases
- group-level and item-level behavior
- previews
- forms and confirmations
- loading, running, failed, complete states
- disabled and approval-gated actions
- action result rendering
- query capture for no-result states

### 3. Action manifest

A normalized description of what the product can do.

The same manifest should feed:

- the visible command palette
- in-app agent actions
- MCP tool generation
- CLI/tooling generation
- documentation and workflow discovery

### 4. Adapter layer

Adapters connect existing systems:

- search adapter
- OpenAPI action source
- MCP action source
- execution adapter
- auth/permission adapter
- analytics adapter

The adapters should be thin. They translate between `master-cmdk` and tools customers already run.

## What we do not provide

Do not build these as core product infrastructure:

- vector database
- semantic search engine
- durable workflow engine
- auth provider
- analytics warehouse
- browser automation engine
- customer database
- hosted agent runtime

Hosted versions may exist later, but the open-source/self-hosted contract should work without them.

## Product promise

Bring your own search, execution, auth, and analytics. `master-cmdk` makes them usable from one command interface.
