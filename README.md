# Better CMDK

The end-to-end loop from user intent to deployed product. Master CMDK is the
command surface: an embeddable palette (and voice interface) that captures
what users want changed, with the evidence of what they just did. Behind it,
an agent pipeline plans, implements, QAs, and deploys per surface, and every
deployment traces back to the intents that caused it.

Replace the stitched stack (PostHog + Datadog + ticketing + deploy scripts)
with one deployable unit whose core object is the feature request / bug
report from a real user and the deployed update they get back.

## Components

- `master-cmdk` — the embeddable command surface (lives in master-orch today:
  `packages/master-cmdk`, served at `/sdk/master-cmdk.js`)
- `master-orch` — the control plane: comments -> crystallizations -> tickets
  -> runs -> deployments (event-sourced store, Postgres-backed)
- `site/` — the demo website
- `packaging/` — one-unit deployment (compose: station + postgres + caddy)
- `docs/` — architecture, principles, research

## Status

Hosted control plane: https://34.187.233.150.sslip.io/dashboard
