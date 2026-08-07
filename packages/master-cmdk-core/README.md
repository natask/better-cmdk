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
  authority: { access: 'write', scopes: ['team:write'] },
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

The registry also tracks permission checks and denials. `confirmation: 'writes'` requires confirmation when `effects.readOnly` is false.

## Permission contract

Pass an authorizer when you create the registry. The authorizer can allow the action, require confirmation, or deny it. A confirmed action runs through the authorizer again.

```ts
const registry = createActionRegistry({
  authorize: async ({ action }) => {
    const allowed = (action.authority.scopes ?? []).every((scope) => currentUser.scopes.includes(scope))
    if (!allowed) {
      return { decision: 'deny', reason: 'Missing scope', code: 'missing_scope' }
    }

    return { decision: 'allow' }
  },
})
```

A permission adapter can require confirmation. It cannot remove the action's own confirmation rule. A permission error returns `denied` with `permission_error`. The executor does not run.

## Adapter references

Manifests store `ActionAdapterReference` values. Each reference contains an adapter id and kind. `configRef` is an opaque lookup key for configuration held by the host.

Do not put credentials or configuration values in an action manifest. Runtime adapters receive credentials from the host that created them.

```ts
const billingAdapter = {
  id: 'billing-api',
  kind: 'openapi',
  version: '3.2',
  configRef: 'billing-production',
}

const refundAction = {
  // action fields
  source: { kind: 'openapi', adapter: billingAdapter },
  execution: {
    adapter: billingAdapter,
    operation: 'refundInvoice',
  },
}
```

`ActionSourceAdapter` loads actions. `ActionExecutionAdapter` runs an action. `ActionPermissionAdapter` decides whether the current caller may run it.

## OpenAPI entry point

The next connector should implement `ActionSourceAdapter<ActionDocumentSource<OpenApiDocument>>.load`. Pass the parsed OpenAPI document at runtime. `ActionDocumentSource.reference` may hold a safe file path or public URL for provenance.

Map each OpenAPI Operation Object into one `ActionDefinition`:

- Use `operationId` as `execution.operation`. Fall back to a stable method and path key when it is absent.
- Build `inputSchema` from parameters and `requestBody`.
- Build `outputSchema` from the selected success response.
- Map OpenAPI security requirement names and OAuth scopes into `authority.scopes`.
- Set read or write authority from the HTTP method, with an adapter option for explicit overrides.
- Store only the adapter `configRef`. Resolve API keys and OAuth tokens inside the runtime execution adapter.

The OpenAPI specification defines Operation Objects, request bodies, responses, and security requirements: <https://spec.openapis.org/oas/3.2.0.html>.
