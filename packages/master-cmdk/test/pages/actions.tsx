import {
  Command,
  createActionRegistry,
  defineActions,
  useActionRun,
} from 'cmdk'
import type { ActionDefinition } from 'cmdk'
import * as React from 'react'

type FindInput = { query: string }
type FindOutput = { customer: string }
type InviteInput = { email: string }
type InviteOutput = { invited: string }

const findCustomer: ActionDefinition<FindInput, FindOutput> = {
  id: 'find-customer',
  title: 'Find customer',
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

const actions = defineActions([findCustomer, inviteTeammate])

export default function ActionsPage() {
  const registry = React.useMemo(() => createActionRegistry(), [])
  const [approveWrites, setApproveWrites] = React.useState(false)
  const [confirmCalls, setConfirmCalls] = React.useState(0)
  const [inviteCalls, setInviteCalls] = React.useState(0)
  const findRun = useActionRun<FindInput, FindOutput>(registry, findCustomer.id)
  const inviteRun = useActionRun<InviteInput, InviteOutput>(registry, inviteTeammate.id)

  React.useEffect(() => {
    const removeFind = registry.register(findCustomer, ({ query }) => ({ customer: query }))
    const removeInvite = registry.register(inviteTeammate, ({ email }) => {
      setInviteCalls((calls) => calls + 1)
      return { invited: email }
    })

    return () => {
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
      <div data-testid="find-status">{findRun.status}</div>
      <div data-testid="find-output">{findRun.output?.customer ?? ''}</div>
      <div data-testid="invite-status">{inviteRun.status}</div>
      <div data-testid="invite-output">{inviteRun.output?.invited ?? ''}</div>

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
        </Command.List>
      </Command>
    </div>
  )
}
