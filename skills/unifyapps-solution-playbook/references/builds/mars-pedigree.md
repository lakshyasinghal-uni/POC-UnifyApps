# Mars Pedigree on Amazon: build playbook

App `app-31077911d563` (Orbit UAT). Repo `mmaheranwar/mars-pedigree-amazon` (redesign on branch `t46`, merged to `main`). Transcript `5d5f7f9a`, 2026-09-24 13:40 to 09-25 12:10.

## 1. Customer & brief

The input was two PDFs: the *Mars Pedigree Amazon Solution Design* and an architecture portrait. The design specified 1 master workflow of 20 steps, 26 sub-workflows, 78 atomic agents, 15 applications, a confidence contract, a Resolution Inbox and precedent. The user asked for it to be built strictly as specified, plus one page with the master-flow table and a hyperlink to every resource built. The build had to follow the Maher methodology: super elegant, agents everywhere, the CGB ua-chart module, talk to the data, and tested. This is the origin of the `atomic-agent-architecture` skill and of the six-part promise in unifyapps-apps.

**Personas:**
- Amazon Sales Manager (primary: listings, shelf, decisions).
- Content Lead, Brand, and Regulatory (inbox owners and gate approvers).
- Mars IT (Connect Amazon page).

## 2. What was built

- **Objects (22, prefix `pao_`):** registry, record, capture, claim, change, gap, opportunity, resolution, precedent, impact, ingest_job, and more (see `tools/pao-objects.js`).
- **Workflows (121):**
  - MW-00 master workflow and 26 sub-workflows (SW-25 resolution/precedent, SW-26 evidence ledger).
  - **78 atomic agents built as workflows**, each returning the confidence envelope: D 38, E 22, J 18.
  - 15 platform workflows (query, aggregate, insights, writer, decide, publish gate, brand decide, rollup).
  - Ingest workflows (`pao_int_amz_*`), defined in code and created only once Mars connects.
- **Chat agents (3), cloned from Claim Integrity's:** Cycle Analyst (dock), Claims & Regulatory Advisor, Trust Auditor.
- **Connectors (built with the Connectors SDK):** Amazon Selling Partner API (15 actions) and Ads API (6), using LWA refresh-token auth.
- **Data sources:** 41 for workflows (`app/src/data/ds-map.json`), 78 for agents (`ds-agents.json`), and the storage bindings.
- **Screens:**
  - Customer side: `/` listing table (price/lb, Buy Box, gaps), `/listing/:asin`, `/shelf` (page-one share), `/decisions`.
  - Desks (`Desks.tsx`): copy-studio, brand (Clear/Flag), claims (FDA 21 CFR 501), publish-gate (token bound to the diff hash), impact (lift vs holdout), and 7 more.
  - Under "How it works": `/connect`, `/operations` (MasterRiver of 20 steps), `/system` (System Map, every resource linked), `/cycle`, `/inbox` (dual readings, one tap), `/trust-ledger`, `/agent/:code`, `/knowledge`, `/analyst`.
- **AI features:** an insight band per screen (switched to GPT-4.1 mini, 30 s down to 4–9 s), the docked analyst with ua-chart answers, an "Ask the agent about this" button on every panel, and a cycle selector with a permanent SIMULATION banner.
- **Data:**
  - Real data: 28 FDA rules (eCFR); 97 pedigree.com products (standing in for Mars's product master); amazon.com pages delivered to ZIP 37067 (8 listings, 10 competitors, the store, 5 searches).
  - A labelled SIM cycle holds only the data that needs the Amazon API.
  - Results: ~2,500 agent runs; 104 gaps → 96 opportunities → 30 changes; 267 claims (10 blocked); 13 changes verified; 400 inbox items.
- **Deliverables:** 8-min voiced video, Manual/Script/Runbook PDFs, `Tests/Redesign-Test-Report.md`.

## 3. Build sequence (~22 h elapsed, including overnight)

1. **Design as data (~1.5 h, 13:40–15:20).**
   - Converted the PDFs to text with PyMuPDF.
   - Transcribed the whole design into `pao-registry.js`.
   - Generated the 21 objects, 184 registry records and 109 workflows from one generator, plus 3 chat agents and a code app with the System Map.
   - Cycle 01 ran on real FDA and pedigree.com data (92 claims).
2. **Reframe for the customer.** A customer-facing home, with the agent machinery moved under "How it works". Codes made deterministic so re-runs are idempotent.
3. **Real Amazon data.** A collect-mode relay with the user's ZIP approval. After "must be production": the SP-API and Ads connectors, the ingest queue, a Connect Amazon page, and a fix for a publish that had shipped the starter page (v3).
4. **SIM cycle (evening, 09-24).** Labelled API-format data in its own cycle; all 20 steps ran. Fixed 8 parsers, a gate race and the lift stub. Published v6.
5. **Demo prep (overnight).** Script and analyst fixes.
6. **Video v1 → v3 (09-25 03:00–08:00)** with a five-phase redesign in parallel (shadcn, Pedigree palette, dark mode). Accessibility findings 1,572 → 1, overflow 16 → 0, small targets 402 → 0.
7. **Hand-over.** `RESOURCES.md`, `DEMO_READY`, push.

## 4. Praise and corrections

There was no explicit praise. The `DEMO_READY` request signalled acceptance.

- *"it is more like admin pages, understand the case"* (plus: no mock data, full workflows).
  - **Fix:** the customer's view comes first (listings, shelf, "waiting for you"). The 20 steps, System Map, inbox and ledger went under "How it works".
  - The user then asked what the use case was. **Fix:** a one-screen business explanation (who, the problem, what each cycle does, what the customer sees).
- "Must be production", not a prototype.
  - **Fix:** real connectors, ingest, and write-with-approval. An honest list of what Mars must grant.
  - Then the user asked for simulated data run through every flow. **Fix:** a separate `-SIM` cycle, every record tagged, and a banner. Brand guidelines were deliberately not simulated.
- *"how can i demo while i'm getting stupid errors like these"* (the analyst said no reviews existed).
  - **Fix:** an entity guide in the agent instructions (what each `value_json` holds), one cycle per answer, "search before saying not found", and holdout listings never recommended.
  - Four demo questions were verified over the API.
- The video corrections:
  - *"dont make it technical demo, make it business demo"*, with no long gaps.
  - Explore and show results instead of stating.
  - Show the chat's charts.
  - *"why you say Monday meeting in the video, this is stupid"*.
  - **Fix:** demo-studio gained business-only scenes, silence-cutting, and chart-bearing questions. Every invented customer routine was removed, and the Pedigree logo added.
- Nav menus did not open.
  - **Fix:** render the dropdown outside the horizontally scrolling nav row and open it on click only.
  - The insight cards looked frozen under reduced motion. That is now rule 12a.

## 5. Reusable assets

- **Workflow generator.**
  - `tools/pao-wf-core.js`: node helpers, a nested `wire()` for `if`/`each`/`try`, the Groovy `PRE` prelude, and `buildSpec` with clone/patch.
  - `tools/pao-wf-agentkit.js`: envelope helpers, `E_COMPARE` dual-read, `J_SCORE` evidence scoring.
  - `tools/pao-wf-infra.js`: SW-25 inbox/precedent and SW-26 ledger.
  - The generator is only in API-SPEC §41.2. The confidence rules are in `atomic-agent-architecture`, but not these implementations.
- **Design as data.**
  - `tools/pao-registry.js` (steps, SWs, agents, apps, gates, asks, demo cut) drives both the build and `app/src/routes/SystemMap.tsx`.
  - `tools/pao-objects.js`, `tools/pao-seed.js`, `tools/pao-datasources.js`.
  - Not in any skill. They are the natural backing for `blueprint-schema.md`.
- **Simulation.** `tools/pao-sim.js` (seeded, reproducible, API-format) and `tools/pao-sim-run.js` (staged runner). ai-app-patterns §22 covers the pattern, but not a cycle-scoped SIM.
- **Connectors and relay.** `tools/pao-connectors.js`, `tools/pao-wf-amazon.js`, `tools/pao-relay.js`. Documented in `unifyapps-connectors/references/building-custom-connectors.md` and API-SPEC §41.7/§41.10.
- **App components.**
  - `components/pao/{MasterRiver,StepDesk,Readable,ui}.tsx` (confidence chip, disposition pill, class chip, console links), `lib/cycle.ts` (cycle store and SIM banner), `routes/{Inbox,TrustLedger,AgentDetail,CycleConsole,ConnectAmazon}.tsx`.
  - None are in the skills. They are the reference UI for atomic-agent apps.
- **Test probes.** `Tests/{a11y,overflow,cls,shoot,insight-timing}.mjs`. The pipeline names the skills, not these scripts.
- **Demo.** `demo/` (demo-studio project), `RESOURCES.md`.

## 6. New pitfalls and platform lessons

- **Skill conflict: agents as workflows.** The 78 agents were built as workflows. `atomic-agent-architecture/references/unifyapps-implementation.md` (2026-09-26) now requires real AI Agents invoked via the Invoke Agent node.
  - **Fix:** reuse the envelope and dual-read logic as agent tools. Do not copy the agent-workflow pattern.
- **Architecture-first builds look like admin consoles.**
  - **Fix:** the home page shows the customer's objects and decisions. Machinery goes under "How it works". Explain the use case in business terms before building screens.
- **Chat agents hallucinate absence.**
  - **Fix:** give the instructions an entity guide (what each record holds), a single-cycle rule, "look before saying not in the records", and exclusions for control groups.
  - Insights needed the same holdout framing.
- **Simulated and real data must never mix.**
  - **Fix:** a dedicated cycle id (`…-SIM`), `source=SIMULATED` on every record, and agents that read simulated evidence only inside a SIM cycle.
  - Human decisions are labelled "(SIMULATION)". A persistent banner is keyed off the cycle.
  - Never simulate customer policy (brand rules).
- **Rehearsal clicks record real decisions.** **Fix:** rehearsal-safe steps and a reopen path for resolved items.
- **Dropdown menus inside an `overflow-x:auto` nav are clipped out of sight,** and hover-open plus click-toggle closes them.
  - **Fix:** portal the menu, open on click, close on Escape or outside click.
- **Invented customer routines in demo narration.** The demo-studio `references/authoring.md` example "the Monday spreadsheet" invites exactly this.
  - **Fix:** replace the example, and add the rule "never state customer habits, meetings or schedules".
- **Raw JSON, internal codes (UI-03, AG-49), `pao_*` pills and "(s)" plurals were shown to users.**
  - **Fix:** a `Readable` renderer and plain labels. Only demo-studio mentions this; add it to the design pipeline's slop list.
- **Already documented:** one data source per workflow (§41.3), stale-`main` publish (§41.11), Groovy escaping (§45.14), insight latency (ai-app-patterns §2), rule 12a, the QA battery (§16).

## 7. Use this build as the reference for

Designed multi-step agentic operations (a master workflow, dozens of atomic agents, confidence gating, an inbox, precedent), especially marketplace, content or regulatory-compliance loops where the customer's API access comes later.
