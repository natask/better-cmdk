# product scope

## short version

`master-cmdk` replaces `cmdk` and connects to the tools a product already uses: search, OpenAPI, MCP, workflow tools, auth, and analytics.

## what we provide

### 1. replace `cmdk`

Start with this:

```tsx
// before
import { Command } from 'cmdk'

// after
import { Command } from 'master-cmdk'
```

Keep existing JSX:

```tsx
<Command>
  <Command.Input />
  <Command.List>
    <Command.Item>Invite teammate</Command.Item>
  </Command.List>
</Command>
```

Users can swap the package first. They can add OpenAPI, MCP, analytics, and workflow tools later.

### 2. improve the command UI

Add:

- better match behavior
- aliases
- group-level and item-level behavior
- previews
- forms and confirmations
- loading, running, failed, complete states
- disabled and approval-gated actions
- action results
- no-result query capture

### 3. define actions once

Define what the product can do in one shape.

Use that shape for:

- the visible command palette
- in-app agent actions
- MCP tool generation
- CLI/tooling generation
- docs
- workflow discovery

### 4. connect adapters

Adapters connect:

- search adapter
- OpenAPI action source
- MCP action source
- execution adapter
- auth/permission adapter
- analytics adapter

Keep adapters thin. They should translate between `master-cmdk` and tools customers already run.

## what stays outside

Customers bring:

- vector database
- semantic search engine
- workflow engine
- auth provider
- analytics warehouse
- browser automation engine
- customer database
- hosted agent tool

The open-source package should work with customer-owned tools.

## product promise

Bring search, workflow tools, auth, and analytics. `master-cmdk` makes them work from one command UI.
