import { useEffect, useState } from 'react'
import { Command } from 'master-cmdk'

type ActionStatus = 'approval' | 'running' | 'complete'

type ProductAction = {
  id: string
  title: string
  description: string
  source: string
  runtime: string
  policy: string
  query: string
  keywords: string[]
  status: ActionStatus
}

const actions: ProductAction[] = [
  {
    id: 'refund-customer',
    title: 'Refund customer',
    description: 'Create a guarded refund from a support query.',
    source: 'OpenAPI POST /refunds',
    runtime: 'Temporal or Hatchet',
    policy: 'Manager approval above $250',
    query: 'reverse the duplicate charge',
    keywords: ['refund', 'chargeback', 'payment', 'duplicate charge', 'customer asked for refund'],
    status: 'approval',
  },
  {
    id: 'invite-teammate',
    title: 'Invite teammate',
    description: 'Collect the email, check role policy, then call your API.',
    source: 'OpenAPI POST /workspaces/{id}/invites',
    runtime: 'Trigger.dev or Inngest',
    policy: 'Workspace admin only',
    query: 'add alex to this workspace',
    keywords: ['invite', 'add user', 'team member', 'workspace access'],
    status: 'running',
  },
  {
    id: 'create-api-key',
    title: 'Create API key',
    description: 'Preview scope, request confirmation, persist audit logs.',
    source: 'OpenAPI POST /api-keys',
    runtime: 'Restate or DBOS',
    policy: 'Requires scoped secret access',
    query: 'make a production key',
    keywords: ['api key', 'token', 'credential', 'secret', 'production access'],
    status: 'complete',
  },
  {
    id: 'diagnose-payment',
    title: 'Diagnose failed payment',
    description: 'Send the search to your retrieval backend and run a workflow.',
    source: 'Search adapter plus API action',
    runtime: 'Your existing queue',
    policy: 'Read-only by default',
    query: 'why did invoice 1041 fail',
    keywords: ['failed payment', 'invoice', 'billing issue', 'diagnose', 'support'],
    status: 'running',
  },
]

const stackRows = [
  ['Command surface', 'cmdk-compatible UI, action registry, forms, previews'],
  ['Intent routing', 'Aliases, OpenAPI operations, permissions, missing-query analytics'],
  ['Execution bridge', 'Adapters for MCP, Temporal, Hatchet, Trigger.dev, Restate, DBOS, Inngest'],
  ['Customer-owned systems', 'Secrets, APIs, workflow state, search backend, audit log'],
] as const

const ownershipRows = [
  ['Owns', 'Action manifest, command UX, approvals, execution status, query analytics'],
  ['Does not own', 'Vector database, durable workflow engine, auth provider, app database'],
  ['Deploys as', 'Open-source package first, self-hosted service next, hosted control plane optional'],
] as const

const integrationRows = [
  ['OpenAPI', 'Generate typed actions from existing specs instead of hand-writing every command.'],
  ['MCP', 'Expose the same action manifest to native agents, CLI tools, and external assistants.'],
  ['Durable runtimes', 'Run through Temporal, Hatchet, Trigger.dev, Restate, DBOS, Inngest, or your queue.'],
  ['Search backends', 'Send retrieval to Turbopuffer, Postgres, Algolia, Meilisearch, or your own API.'],
] as const

const statusCopy: Record<ActionStatus, string> = {
  approval: 'waiting for approval',
  running: 'workflow running',
  complete: 'completed with audit trail',
}

function Nav() {
  return (
    <header className="mk-nav">
      <a className="mk-brand" href="#top" aria-label="master-cmdk home">
        <span className="mk-brand__mark" aria-hidden="true" />
        <span>master-cmdk</span>
      </a>
      <nav className="mk-nav__links" aria-label="Page sections">
        <a href="#manifest">Manifest</a>
        <a href="#runtime">Runtime</a>
        <a href="#adapters">Adapters</a>
        <a href="/?demo">Fix demo</a>
      </nav>
    </header>
  )
}

function CommandExecutionDemo() {
  const [search, setSearch] = useState('refund customer')
  const [activeId, setActiveId] = useState(actions[0].id)
  const [pulse, setPulse] = useState(0)
  const activeAction = actions.find((action) => action.id === activeId) ?? actions[0]

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulse((value) => (value + 1) % 4)
    }, 1600)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="mk-command-scene" aria-label="Command execution preview">
      <div className="mk-command">
        <div className="mk-window-bar">
          <span>product command layer</span>
          <span>self-hosted</span>
        </div>
        <Command shouldFilter>
          <div className="mk-command__input">
            <span aria-hidden="true">&gt;</span>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type an action: refund customer, invite teammate, create API key"
            />
          </div>
          <Command.List>
            <Command.Empty>No action found. Capture this query for aliases or docs.</Command.Empty>
            {actions.map((action) => (
              <Command.Item
                key={action.id}
                value={action.title}
                keywords={action.keywords}
                onSelect={() => setActiveId(action.id)}
              >
                <div className="mk-command__item-main">
                  <span>{action.title}</span>
                  <small>{action.description}</small>
                </div>
                <span className="mk-command__status">{statusCopy[action.status]}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>

      <aside className="mk-execution">
        <div className="mk-execution__label">Execution state</div>
        <h2>{activeAction.title}</h2>
        <p>{activeAction.description}</p>
        <dl>
          <div>
            <dt>User typed</dt>
            <dd>{activeAction.query}</dd>
          </div>
          <div>
            <dt>Matched from</dt>
            <dd>{activeAction.source}</dd>
          </div>
          <div>
            <dt>Runs through</dt>
            <dd>{activeAction.runtime}</dd>
          </div>
          <div>
            <dt>Policy</dt>
            <dd>{activeAction.policy}</dd>
          </div>
        </dl>
        <div className="mk-timeline" aria-label="Execution timeline">
          {['intent', 'permission', 'approval', 'durable run'].map((step, index) => (
            <span
              className={index <= pulse ? 'is-active' : undefined}
              key={step}
            >
              {step}
            </span>
          ))}
        </div>
      </aside>
    </div>
  )
}

function DataTable({
  rows,
  heading,
}: {
  rows: readonly (readonly [string, string])[]
  heading: string
}) {
  return (
    <div className="mk-table" aria-label={heading}>
      {rows.map(([label, body]) => (
        <div className="mk-table__row" key={label}>
          <strong>{label}</strong>
          <span>{body}</span>
        </div>
      ))}
    </div>
  )
}

function MarketingSection({
  eyebrow,
  title,
  body,
  children,
  id,
}: {
  eyebrow: string
  title: string
  body: string
  children: React.ReactNode
  id: string
}) {
  return (
    <section className="mk-section" id={id}>
      <div className="mk-section__copy">
        <p className="mk-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="mk-section__body">{children}</div>
    </section>
  )
}

export function MarketingPage() {
  return (
    <main className="mk-page" id="top">
      <Nav />

      <section className="mk-hero" aria-labelledby="mk-title">
        <div className="mk-hero__grid" aria-hidden="true" />
        <div className="mk-hero__copy">
          <p className="mk-eyebrow">Open source. Self-hostable. Built for product actions.</p>
          <h1 id="mk-title">The command layer for apps that need to do real work.</h1>
          <p>
            Keep your search backend and durable workflow engine. Use master-cmdk to map user
            intent to approved actions, then run those actions through your own OpenAPI, MCP,
            and execution stack.
          </p>
          <div className="mk-actions">
            <a className="mk-button mk-button--primary" href="/?demo">
              Open the fix demo
            </a>
            <a className="mk-button" href="#manifest">
              Read the action manifest
            </a>
          </div>
          <div className="mk-proof" aria-label="Product constraints">
            <span>cmdk API compatible</span>
            <span>MIT licensed</span>
            <span>bring your runtime</span>
            <span>own logs and secrets</span>
          </div>
        </div>

        <CommandExecutionDemo />
      </section>

      <MarketingSection
        id="manifest"
        eyebrow="The wedge"
        title="One action manifest for humans, agents, and automation."
        body="The command surface becomes the product's action manifest. A user can click it, an in-app agent can call it, and an external MCP client can discover the same approved operations."
      >
        <DataTable rows={stackRows} heading="Action manifest stack" />
      </MarketingSection>

      <MarketingSection
        id="runtime"
        eyebrow="Scope"
        title="Not a search engine. Not another workflow engine."
        body="The valuable layer is between intent and execution: aliases, policies, previews, confirmations, execution state, and analytics about what users tried to do."
      >
        <DataTable rows={ownershipRows} heading="Ownership model" />
      </MarketingSection>

      <MarketingSection
        id="adapters"
        eyebrow="Adapters"
        title="Plug into the systems teams already trust."
        body="Start with the command palette, then add adapters. Retrieval goes to the customer's search stack. Long-running work goes to their durable runtime."
      >
        <div className="mk-adapter-grid">
          {integrationRows.map(([title, body]) => (
            <article className="mk-adapter" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <section className="mk-final" id="ship">
        <p className="mk-eyebrow">Today</p>
        <h2>Ship the page. Then ship the manifest.</h2>
        <p>
          The first public promise is simple: a cmdk-compatible, open command layer for product
          actions. The deeper runtime story can land behind it without pretending to own the
          whole stack.
        </p>
        <a className="mk-button mk-button--primary" href="/?demo">
          Check the working demo
        </a>
      </section>
    </main>
  )
}
