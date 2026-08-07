import {
  Command,
  actionExecutorFromAdapter,
  createActionRegistry,
  createOpenApiExecutionAdapter,
  createOpenApiActionSourceAdapter,
  defineActions,
  useActionRun,
} from 'cmdk'
import type { ActionDefinition, OpenApiExecutionInput, OpenApiExecutionResult } from 'cmdk'
import * as React from 'react'

type FindInput = { query: string }
type FindOutput = { customer: string }
type InviteInput = { email: string }
type InviteOutput = { invited: string }

const findCustomer: ActionDefinition<FindInput, FindOutput> = {
  id: 'find-customer',
  title: 'Find customer',
  authority: { access: 'read', scopes: ['customers:read'] },
  keywords: ['account lookup'],
  effects: {
    readOnly: true,
    destructive: false,
    idempotent: true,
    openWorld: false,
  },
  confirmation: 'writes',
  source: { kind: 'manual' },
}

const inviteTeammate: ActionDefinition<InviteInput, InviteOutput> = {
  id: 'invite-teammate',
  title: 'Invite teammate',
  authority: { access: 'write', scopes: ['team:write'] },
  keywords: ['add member'],
  effects: {
    readOnly: false,
    destructive: false,
    idempotent: false,
    openWorld: true,
  },
  confirmation: 'writes',
  source: { kind: 'manual' },
}

const deleteAccount: ActionDefinition<{ accountId: string }, { deleted: boolean }> = {
  id: 'delete-account',
  title: 'Delete account',
  authority: { access: 'write', scopes: ['accounts:delete'] },
  effects: {
    readOnly: false,
    destructive: true,
    idempotent: true,
    openWorld: false,
  },
  confirmation: 'always',
  source: { kind: 'manual' },
}

const [listTeamsDefinition] = createOpenApiActionSourceAdapter({
  identity: { id: 'directory-api', kind: 'openapi', configRef: 'directory-test' },
}).load(
  {
    reference: '/fixtures/directory.json',
    document: {
      openapi: '3.1.0',
      info: { title: 'Directory API', version: '1' },
      components: {
        securitySchemes: {
          DirectoryOAuth: { type: 'oauth2' },
        },
      },
      paths: {
        '/teams': {
          get: {
            operationId: 'listTeams',
            summary: 'List teams from OpenAPI',
            tags: ['directory'],
            security: [{ DirectoryOAuth: ['teams:read'] }],
            responses: {
              200: {
                description: 'Teams',
                content: {
                  'application/json': { schema: { type: 'array', items: { type: 'string' } } },
                },
              },
            },
          },
        },
      },
    },
  },
  { signal: new AbortController().signal },
)

const listTeams = listTeamsDefinition as ActionDefinition<OpenApiExecutionInput, OpenApiExecutionResult>

const actions = defineActions([findCustomer, inviteTeammate, deleteAccount, listTeams])

const directoryExecution = createOpenApiExecutionAdapter({
  identity: { id: 'directory-api', kind: 'openapi', configRef: 'directory-test' },
  allowedOrigins: ['http://localhost:3000'],
  allowedOperations: [{ operation: 'listTeams', method: 'GET', path: '/fixtures/teams.json' }],
  resolveRuntime: (configRef) => ({
    baseUrl: 'http://localhost:3000',
    headers: { 'x-runtime-ref': configRef },
  }),
  limits: { timeoutMs: 2_000, maxResponseBytes: 1_024 },
})

export default function ActionsPage() {
  const registry = React.useMemo(
    () =>
      createActionRegistry({
        authorize: ({ action }) =>
          action.id === deleteAccount.id
            ? { decision: 'deny', reason: 'Account deletion is disabled', code: 'policy_denied' }
            : { decision: 'allow' },
      }),
    [],
  )
  const [approveWrites, setApproveWrites] = React.useState(false)
  const [confirmCalls, setConfirmCalls] = React.useState(0)
  const [inviteCalls, setInviteCalls] = React.useState(0)
  const [deleteCalls, setDeleteCalls] = React.useState(0)
  const findRun = useActionRun<FindInput, FindOutput>(registry, findCustomer.id)
  const inviteRun = useActionRun<InviteInput, InviteOutput>(registry, inviteTeammate.id)
  const deleteRun = useActionRun(registry, deleteAccount.id)
  const teamsRun = useActionRun<OpenApiExecutionInput, OpenApiExecutionResult>(registry, listTeams.id)

  React.useEffect(() => {
    const removeFind = registry.register(findCustomer, ({ query }) => ({ customer: query }))
    const removeInvite = registry.register(inviteTeammate, ({ email }) => {
      setInviteCalls((calls) => calls + 1)
      return { invited: email }
    })
    const removeDelete = registry.register(deleteAccount, () => {
      setDeleteCalls((calls) => calls + 1)
      return { deleted: true }
    })
    const removeListTeams = registry.register(listTeams, actionExecutorFromAdapter(directoryExecution))

    return () => {
      removeListTeams()
      removeDelete()
      removeInvite()
      removeFind()
    }
  }, [registry])

  return (
    <div>
      <label>
        <input
          data-testid="approve-writes"
          type="checkbox"
          checked={approveWrites}
          onChange={(event) => setApproveWrites(event.target.checked)}
        />
        Approve writes
      </label>
      <div data-testid="confirm-calls">{confirmCalls}</div>
      <div data-testid="invite-calls">{inviteCalls}</div>
      <div data-testid="delete-calls">{deleteCalls}</div>
      <div data-testid="find-status">{findRun.status}</div>
      <div data-testid="find-output">{findRun.output?.customer ?? ''}</div>
      <div data-testid="invite-status">{inviteRun.status}</div>
      <div data-testid="invite-output">{inviteRun.output?.invited ?? ''}</div>
      <div data-testid="delete-status">{deleteRun.status}</div>
      <div data-testid="delete-reason">{deleteRun.denial?.reason ?? ''}</div>
      <div data-testid="teams-status">{teamsRun.status}</div>
      <div data-testid="teams-output">{JSON.stringify(teamsRun.output?.body ?? null)}</div>

      <Command label="Actions">
        <Command.Input placeholder="Search actions" />
        <Command.List>
          <Command.Empty>No actions found.</Command.Empty>
          <Command.Action action={actions[0]} registry={registry} input={{ query: 'Ada' }} />
          <Command.Action
            action={actions[1]}
            registry={registry}
            input={{ email: 'ada@example.com' }}
            confirm={() => {
              setConfirmCalls((calls) => calls + 1)
              return approveWrites
            }}
          />
          <Command.Action action={actions[2]} registry={registry} input={{ accountId: 'acct-1' }} />
          <Command.Action action={actions[3]} registry={registry} input={{}} />
        </Command.List>
      </Command>
    </div>
  )
}
