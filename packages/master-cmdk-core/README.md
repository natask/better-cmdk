# master-cmdk-core

Framework-agnostic command menu engine for `master-cmdk`.

The core owns registration, search scoring, ordering, modes, and selection. It does not import React and does not read or write the DOM. UI packages adapt framework-specific component trees into this engine.

## Actions

Define action data once, then bind it to an executor at runtime. The action data has only serializable fields, so OpenAPI and MCP adapters can read and write it.

```ts
import { createActionRegistry, defineActions } from 'master-cmdk-core'
import type { ActionDefinition } from 'master-cmdk-core'

type InviteInput = { email: string }
type InviteOutput = { invited: string }

const inviteAction: ActionDefinition<InviteInput, InviteOutput> = {
  id: 'invite-teammate',
  title: 'Invite teammate',
  inputSchema: {
    type: 'object',
    properties: { email: { type: 'string', format: 'email' } },
    required: ['email'],
  },
  effects: {
    readOnly: false,
    destructive: false,
    idempotent: false,
    openWorld: true,
  },
  confirmation: 'writes',
  source: { kind: 'manual' },
}

const actions = defineActions([inviteAction])

const registry = createActionRegistry()

registry.register(actions[0], async ({ email }) => {
  return { invited: email }
})

await registry.execute('invite-teammate', { email: 'ada@example.com' })
// status: confirming

await registry.execute(
  'invite-teammate',
  { email: 'ada@example.com' },
  { confirmed: true },
)
// status: succeeded
```

The registry tracks `confirming`, `running`, `succeeded`, `failed`, and `cancelled` states. `confirmation: 'writes'` requires confirmation when `effects.readOnly` is false.
