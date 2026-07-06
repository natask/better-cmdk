# Better CMDK principles (draft for Nat to edit)

Status: synthesized 2026-07-06 from the Moa corpus and this project's research.
No canonical seven-item list pairing these exists in the Moa repos; the two
articulated principles below are quoted from where they live, and the rest are
drawn from moa-chrome-flows' "7 Core Pillars" and this product's research.
Sources: moa-bare/moa-chrome-flows (ideation.md, COMPRESSED_SUMMARY.md,
_____CORE_INSIGHTS_____expanded.md, architectural_decisions_cleaned.md,
history-primitive.md), chief-moa (AGENT_WORKFLOW.md).

1. Event sourcing. Capture everything happening in the application. "The
   append-only event log is the source of truth... materializations are caches
   that can always be rebuilt from the log." The log is the substrate for
   insight, replays, demo videos, and demo sequences you can show customers.

2. Intent capture. Catalog what users, engineers, and support reps want changed
   while they are using the application, with the action sequence that led to
   the idea. "Intention capture — either explicit or inferred from action
   patterns." Intents land in the new-features / fix-features space, then get
   triaged and executed by agents with an engineer driving end to end.

3. One end-to-end loop, not point solutions. Idea to deployed product in one
   system: intake -> plan -> implement -> QA -> per-surface deployment ->
   reporter sign-off. Session capture, error capture, ticketing, and deployment
   management are components of the loop, not separate products.

4. Deployments trace to intents. Every deployment is associated with the
   (possibly coalesced) intents that caused it, queryable both directions.
   Requests map to openable versions, not just branches.

5. The application is the surface. The palette (Master CMDK) lives inside the
   product; requesting a change, testing a preview, and signing off all happen
   where the user already is. Voice and keyboard are two inputs to one typed
   action registry.

6. Agent-driven, human-owned. Agents implement; a human owns the outcome.
   Delegation keeps accountability with the person (the Linear delegate model),
   approval gates guard actions and promotions.

7. Self-hostable, embeddable, composable. One deployable unit (station +
   database + previews + SDK) you can run yourself and embed in any app;
   mirrors outward to Linear/GitHub instead of replacing what teams use.
