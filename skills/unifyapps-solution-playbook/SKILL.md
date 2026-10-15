---
name: unifyapps-solution-playbook
description: What eleven real UnifyApps solution builds taught (Rest Supplier Intelligence for EY, SHU Brain, Jaidah Majlis, Claim Integrity, Mars Pedigree, TAQA Sourcing Hub, Sharek/CGB, CGB Pulse, Msheireb, Deal Forecast, the native-nodes audit) — which earlier build to start from for a new use case, the corrections Maher made again and again, the parts to clone instead of re-inventing, the build sequence that worked, the build questions asked at Phase 0 (environment, config or code, data, test mode Quick/Standard/In-depth, preview-only testing, review checkpoint, demo material) with where build time goes, and the done checklist. Use at Phase 0 of every UnifyApps solution (to pick the reference build), before writing any app or agent (to clone, not rewrite), and before calling a build done. Read with atomic-agent-architecture and unifyapps-apps; it never replaces them.
---

# UnifyApps solution playbook — learn from what we already built

Eleven solutions were built for real customers between 2026-09-19 and 09-26. Each one was corrected by Maher,
fixed, and accepted (`DEMO_READY`). This skill is what they have in common, so the next build starts where they
ended instead of repeating their first drafts. The full case file for each build is in `references/builds/`.

**Where this sits:** `atomic-agent-architecture` decides the design (in the style chosen per use case, Full atomic or
Light, plus the core rules every build follows); `unifyapps-apps` / `unifyapps-config-apps` /
`unifyapps-builder` / `unifyapps-context-graph` give the mechanics; `API-SPEC.md` is the endpoint record. This
playbook tells you **which earlier build to copy from and which mistakes not to make**. Where a lesson is already in
those skills, it points there instead of repeating it.

## 1. Pick the reference build first (Phase 0, before designing)

Match the brief to the closest build, read its case file, clone its repo (`gh repo clone mmaheranwar/<repo>`), and
reuse its shell, data layer and components. Rewrite only the domain.

| The use case looks like… | Start from | Repo | Case file |
|---|---|---|---|
| Executive / government performance across many entities and regions; a country map | **Sharek** (CGB Qatar) | `sharek-executive-intelligence` | `builds/sharek.md` |
| Third-party / supplier risk, operational resilience, a control tower fed by external intelligence | **Rest Supplier Intelligence** (EY) | `rest-supplier-intelligence` | `builds/rest-supplier.md` |
| Procurement, sourcing, supplier onboarding, contracts; bilingual Arabic RTL; private app with branded sign-in | **TAQA Sourcing Hub** | `taqa-sourcing-hub` | `builds/taqa.md` |
| Document evidence and fraud detection (invoices, claims, expenses, KYC); a verdict proven against a real corpus | **Claim Integrity** | `claim-integrity` | `builds/claim-integrity.md` |
| A designed multi-step agentic operation: master workflow, dozens of atomic agents, confidence, inbox, precedent | **Mars Pedigree** | `mars-pedigree-amazon` | `builds/mars-pedigree.md` |
| An "Enterprise Brain" / golden-record 360 over several systems; rules → to-dos → cases; audited write-back; admin | **SHU Brain (ECG)** | `shu-brain-ecg` | `builds/shu.md` |
| Executive conversational analytics where the context graph is the only read path; multi-division groups | **Jaidah Majlis (ECG)** | `jaidah-majlis-ecg` (+ `jaidah-majlis` for tools/export) | `builds/jaidah.md` |
| Role-governed KPI command centre over simulated operational systems (real estate, facilities, campus, hospital) | **Msheireb** | `msheireb-performance-intelligence` | `builds/msheireb.md` |
| A read-only overlay that scores records of a system of record (CRM/ERP) with the customer's own method, over time | **Deal Forecast** | `sc-native-deal-forecast` | `builds/deal-forecast.md` |
| A no-code (config) app the customer maintains; document upload → OCR → agent | **CGB Pulse** | (config app; `unifyapps-config-apps/examples/cgb-pulse`) | `builds/cgb-pulse.md` |
| Any workflow at all | the **native-nodes audit** | — | `builds/native-nodes.md` |

Say which build you started from in the plan and in the test report.

## 1b. Pick by the use-case type, then a donor route per screen

Name the use-case type from the SOW, take the primary build (its shell, token layer, island, data layer, README and
test approach are cloned), then pick a donor route for every screen (UI-nn starts from that file). Record both in the
blueprint (`reference`: type, primary, repo, why, donors). Read the case file of the primary build and of every donor.
(Every route below exists in its repo, listed 2026-09-27.)

| Use-case type (what the SOW describes) | Primary build (repo) | Donor routes by screen kind |
|---|---|---|
| **Request / case desk**: intake → AI reading → rule or policy check → auto-decide or route to a person (travel, AP invoices, claims triage, customs, onboarding requests) | **Claim Integrity** (`claim-integrity`) when the verdict rests on documents or evidence; otherwise **Rest** (`rest-supplier-intelligence`) | command centre: Rest `routes/CommandCentre.tsx` · queue, worst/oldest first: Rest `routes/Alerts.tsx` or Claim Integrity `routes/Cases.tsx` · record detail with every AI reading, its evidence and a decision bar: Claim Integrity `routes/Workbench.tsx` (or Rest `routes/Supplier360.tsx`) · manager decision with a reason and an audit row: SHU `routes/slb/Approvals.tsx` · Resolution Inbox, Evidence Ledger, agent detail: Mars `routes/Inbox.tsx`, `routes/TrustLedger.tsx`, `routes/AgentDetail.tsx` · budgets and spend: TAQA `routes/Spend.tsx` |
| Designed multi-step agentic operation (dozens of atomic agents, cycles, precedent) | Mars (`mars-pedigree-amazon`) | `CommandCentre`, `Inbox`, `TrustLedger`, `AgentDetail`, `CycleConsole`, `SystemMap` |
| Supplier / third-party risk, resilience, control tower | Rest (`rest-supplier-intelligence`) | `CommandCentre`, `Alerts`, `Supplier360`, `Dependencies`, `SupplierMI` |
| Procurement, sourcing, contracts; Arabic RTL; private branded sign-in | TAQA (`taqa-sourcing-hub`) | `CommandCentre`, `Registration`, `Sourcing`, `Contracts`, `Supplier360`, `Spend`, `Login` |
| Document fraud / evidence verdict against a corpus | Claim Integrity (`claim-integrity`) | `Cases`, `Workbench`, `Corpus`, `Network` |
| Golden-record 360, rules → to-dos → cases, audited write-back, admin | SHU (`shu-brain-ecg`) | `slb/Today`, `slb/Student`, `slb/Todos`, `slb/Approvals`, `slb/Admin`, `slb/Audit`, `slb/Integrations` |
| Executive analytics with the context graph as the only read path | Jaidah (`jaidah-majlis-ecg`) | `Majlis`, `Receivables`, `Division`, `Estate` |
| Executive / government performance across entities and regions, a country map | Sharek (`sharek-executive-intelligence`; the code counterpart of CGB Pulse) | `Overview`, `QatarMapPage`, `EntityPerformance`, `DecisionCentre` |
| Role-governed KPI command centre over simulated operational systems | Msheireb (`msheireb-performance-intelligence`) | `Overview`, `Sector`, `Metric`, `Actions`, `Admin` |
| Read-only scoring overlay on a system of record | Deal Forecast (`sc-native-deal-forecast`) | — |
| A no-code app the customer maintains | CGB Pulse (config; `unifyapps-config-apps/examples/cgb-pulse`) — only when the SOW asks for a config app | — |

Rules: the bar is always the six accepted builds (CGB Pulse, Rest, SHU, TAQA, Jaidah, Claim Integrity); the other
builds serve as donors. When no row fits, take the primary from the first screen the user will judge (a command
centre → Rest; a queue and a record decision → Claim Integrity) and say why in `reference.why`. Say which build you
started from in the plan and the test report. Forge refuses the first blueprint save until this skill, the primary
build's case file and atomic-agent-architecture are read, and refuses app source until the donor routes are read.

## 2. The corrections Maher made again and again — do these first time

Ranked by how often they cost a rebuild. Each is a rule now, not a preference.

1. **Invent nothing.** Invented source systems (Jaidah: "we dont have these sources"), invented customer routines
   in a demo ("why you say Monday meeting"), sample figures copied from slides (Rest), fake platform pages (a
   home-made "AI Governance" screen) — all rejected. Use neutral roles, the customer's own labels verbatim, "TBC"
   where they gave no value, and link to the real UnifyApps module instead of simulating it.
2. **Real, not a demo.** "it seems it is not real" (Claim Integrity), "you are doing it as demo presentation, not as
   actual system" (SHU), "must be production" (Mars). Every figure from a Data Object or the graph; one orchestration
   workflow per human action (`*_intake` does the whole process); capability rows carry EXECUTES / PARTIAL /
   SPECIFIED; send the real-versus-synthetic table before being asked. Simulated data lives in its own cycle
   (`…-SIM`, `source=SIMULATED`, a banner) and never mixes with real data.
3. **The customer's view first, machinery second.** "it is more like admin pages" (Mars). The home screen shows the
   customer's objects and decisions; the architecture, steps, inbox internals go under "How it works". Explain the
   use case in business terms before building screens.
4. **Command-centre quality on first sight.** "th UI is very poor" (Rest), "all luxary and elegant" (TAQA), "the main
   animation … look very basic" (Sharek), "AI Instights cards look so bad" (Jaidah). Start from the reference build's
   finished components, not from the starter. Tokens first, one palette, dark page headers, a live thesis sentence
   (not a slogan), motion on by default with a switch.
5. **Real maps only.** "qatar map is so bad" (Jaidah), "it look so basic" (TAQA), the bubble "map" rejected on sight
   (CGB Pulse). Build-time projected real boundaries (geoBoundaries ADM1 / Natural Earth) — clone Sharek's
   `QatarMap.tsx` + `tools/build-map.py` or TAQA's `EgyptFlow.tsx` + `tools/egypt-geo.py`.
6. **AI on every screen, fast.** Live insights everywhere, not one AI page (Sharek); ask on every tile, chart, row and
   AI result; insights on a fast model (≈5 s, not 30 s). Store-first insights (Jaidah) so a screen never opens empty.
7. **The agent chat must not overlap or stall.** "still iverlapping, fix it once and for all" (Rest, Sharek): starters
   hide on first send, on typing, or once any text appears — use the shared `copilot-host.tsx` logic. Give every
   chat agent an **entity guide** in its instructions, or it says data does not exist (Mars).
8. **The Maher Methodology even under a deadline.** "why u didnt crteate startter app and link with github" (Rest):
   never hand the brief to the Code Builder agent.
9. **No other vendor's name anywhere** — UI, records, enums, keys, prompts, agents, **and the repo README and
   platform exports** (TAQA's purge missed the repo).
10. **No live ticker unless asked.** Two customers had it removed (Rest v16, Claim Integrity). It is opt-in now.
11. **One application with navigation, not an app per screen or persona.** The AP desk's five screens were listed
    as five applications (2026-09-26). The screens live in one app, grouped by role in its navigation; a second
    app only when the requirements explicitly ask for it.
12. **A sellable product has no demo scaffolding inside it** (SHU). Control rooms, scenario levers, "reset", story
    runners and "demo data" labels belong in a separate simulator (its own app or workflows), never in the
    product's data model. For a pure demo app the user asked for, they stay — say which one you are building.
13. **Every chart the assistant writes is drawn, not the first one** (AP Exception Desk, 2026-09-27: "give me
    detailed reports with chart" — four charts written, one visible). The assistant had been shown the contract
    as `"type":"bar|hbar|…"` and wrote the shape into `kind`; the parser refused those blocks. Copy the chart
    module from `unifyapps-apps/assets/ua-chart` as it is today (its parser takes a shape in `kind`), give the
    assistant whole example blocks, and test it with a report question that returns several charts — count the
    charts on the screen against the blocks in the answer (unifyapps-apps `ai-app-patterns.md` §4).

## 3. Reuse-first map — clone these, don't write them

| Need | Clone from | Notes |
|---|---|---|
| App shell, grouped rail, Ctrl-K palette, motion switch | `rest-supplier-intelligence/app/src/components/rsi/CommandPalette.tsx`, `lib/motion.ts` | + `index.html` pre-paint script |
| Docked agent + **prebuilt copilot island** | any of `claim-integrity`, `rest-supplier-intelligence`, `taqa-sourcing-hub`, `sharek-executive-intelligence`, `msheireb-performance-intelligence`: `app/public/copilot-island`, `app/island`, `app/src/copilot-island`, `vite.island.config.ts`, `copilot-host.tsx` | copying skips the local island build; never replace the island with a bare hook chat |
| Charts | `unifyapps-apps/assets/ua-chart` (+ Jaidah `palette.ts`: resolve CSS vars at render) | copied modules keep the origin's colours — re-theme |
| Insight band, ask icon | `unifyapps-apps/assets/ai-insights`, `assets/chat-with-data`; Jaidah `kit.tsx` `InsightBand` (severity rail) | |
| Real country map | Sharek `QatarMap.tsx` + `tools/build-map.py`; TAQA `EgyptFlow.tsx` + `tools/egypt-geo.py` | |
| Index ring, bubble matrix, story runner | Sharek `IndexRadial.tsx`, `BubbleMatrix.tsx`, `StoryBar.tsx` + `lib/story.ts` | |
| Read-merge-write writer (never partial updates) | Rest `data/rsi.ts` `useRecordWriter` | a partial update wiped 415 TAQA records |
| Count hook without refetch loops, money formatter | TAQA `data/taqa.ts` `useCount`, `egp()` | memoise filters on `JSON.stringify(where)` |
| Branded bilingual sign-in (private apps) | TAQA `components/ua/AuthFrame.tsx`, `routes/Login.tsx` | |
| Governed data layer (role-sensitive data) | Msheireb (callables only, identity from the audit row, `*_user_access`); SHU `slb/api.ts` `useQ`/`useAction`, `ActButton` | the sellable default for role-sensitive data |
| Admin, integrations, audit, approvals screens | SHU `routes/slb/{Admin,Integrations,Audit,Approvals}.tsx` | lock keys after save; dropdowns not free text |
| Graph-only data layer | Jaidah `data/graph.ts`, `data/jd.ts`; SHU `data/graph.ts` | prove it with the divergence test (§5) |
| Atomic-agent operations UI (inbox, trust ledger, agent detail, cycle console, system map) | Mars `routes/{Inbox,TrustLedger,AgentDetail,CycleConsole,SystemMap}.tsx`, `components/pao/*` | design-as-data: `tools/pao-registry.js` |
| Workflow generator, envelope / dual-read helpers | Mars `tools/pao-wf-core.js`, `pao-wf-agentkit.js`, `pao-wf-infra.js` | agents themselves are AI Agents now (atomic-agent-architecture) — reuse the logic as their tools |
| Simulated source systems + sync | Rest (Cyble + 10 feeds), SHU `tools/sim/*`, Mars `pao-sim*.js` | simulate the system, integrate for real |
| Document corpus + self-scoring runner | Claim Integrity `tools/make-scenarios.py`, `public/corpus/manifest.json`, `routes/Corpus.tsx` | `.gitattributes`: `*.pdf binary` |
| Customer method as a self-test | Deal Forecast (21/21 self-test workflow on the CRO workbook) | list the rules you had to assume, label them in the UI |
| Project README, invariants, run sheet | TAQA `README.md` (model), Sharek `DEMO.md` (presenter run sheet) | |

## 4. The build sequence that worked

1. **Brief → reference build** (§1). Clone its repo into the workspace to read and copy from.
1b. **Build questions** — one message, defaults marked (`references/build-options.md` §0), opening with the process
   as you understood it (A0, confirmed before anything is built):
   - where and what: environment, config or code app, private or public, sellable product or demo app, design
     style (Full atomic or Light; recommend one from the use-case type and say why);
   - customer and data: customer name and logo (both confirmed), unit of work, data per system, test inputs,
     business rules, agent writes;
   - testing: **test mode** (Quick · **Standard** · In-depth), **where to test** (**preview only** ·
     preview + published URL), **review** (**early** · end only).

   Record the answers in the plan and the report. Only the user lowers the test mode; a customer hand-over is at
   least Standard.
2. **Tenant decision:** context graph in scope ⇒ app, data and agents on aps1 from the first object (Jaidah was
   built on Orbit, then abandoned). Public or private app ⇒ decide now (private needs the branded sign-in).
3. **Customer identity:** the customer's name and the real name of the product/industry from the customer's own site
   ("superannuation, not retirement"), and the logo, **both shown to the user and confirmed** before anything branded
   is built (`references/build-options.md` B1–B2; `unifyapps-apps/references/customer-logo.md`).
4. **Architecture** (atomic-agent-architecture) in the chosen style: **Full** for case desks, document/claim
   processing and multi-step AI operations; **Light** for dashboards, analytics, command centres, scoring overlays,
   chat-over-data and config apps.
   Both styles follow the core rules: the process agreed first, a model never does arithmetic, AI readings carry
   confidence and evidence, no internal codes on screens. Customer view first, scenarios in business terms.
5. **Data:** schemas and a deterministic, re-runnable seed committed under `tools/` in the first hour (volume by
   `references/build-options.md` "The seed rule"), anchored on
   official public figures with a facts file (source URL per figure); every legend band and every lever reachable;
   headline KPIs pass a plausibility check (would an executive believe it?).
6. **Starter app → GitHub link → clone → copy the reference shell** (island, charts, insights, ask, dock, motion).
7. **Workflows native-first** (`builds/native-nodes.md` gate); one orchestration per human action. In Full style,
   the atomic agents are AI Agents with workflow tools. In Light style, the AI steps live inside the workflows
   (`atomic-agent-architecture/references/unifyapps-implementation.md` "Light style on UnifyApps").
8. **Screens** from the reference components; the first screen is a command centre, not a report. With the
   **Early** checkpoint (default), stop once the data and the command centre (plus an agent answer, if the agent exists yet) are live on the
   preview and show them to the user before building the rest (`references/build-options.md` §4).
9. **Agents:** entity guide, turn contract, charts through `ua-chart`, measured latency.
10. **Test at the chosen mode on the builder preview** (the published URL only when the user asked for it), then
    the report (build answers first, then the traceability table, §6). The floor checks run in every mode
    (`build-options.md` §2).
11. **Publish → re-tag** (publishing wipes tags and, for code apps, the description) → **export the platform layer
    and seed to the repo** → real README.
12. **Ask what the user wants for the finished solution** (`references/build-options.md` D1, pick any): video
    recording, demo script, manual, `DEMO.md` run sheet, or none. Produce what they pick (`demo-studio` for the
    video, script and manual; the script is approved before any recording).

## 4b. Who does what — subagents and their models

Quality comes first. Lighter models only collect facts and run checks with a clear pass or fail. Every decision stays
with the main session's model.

| Work | Who | Model |
|---|---|---|
| Lookups and sweeps: connector catalogue, `API-SPEC.md`, case files, grepping skills, repos and logs, listing tenant objects, the vendor grep | agent **`ua-scout`** (read-only) | Sonnet |
| Mechanical checks: the workflow audit, read-backs, fields exist, indexes `SUCCESS`, deployed-vs-saved state, screenshot sweeps on the preview, the accessibility scan, running the agent test questions with timings | agent **`ua-checker`** (reports, never fixes) | Sonnet |
| The build questions, the design and its style, the process, writing workflows, agents and screens, fixing defects, and **judging** every screenshot, answer and check result | the main session | the session's model |

- The agents are in `agents/` of the POC Studio plugin (`poc-studio:ua-scout`, `poc-studio:ua-checker`). When installed as a plugin, they are
  `unifyapps:ua-scout` and `unifyapps:ua-checker`.
- Run independent scouts and checks in parallel. Read their evidence before acting on it.
- Never delegate a judgement. "Does this screen meet the bar?" and "is this answer right?" are the main session's to
  answer, from the checker's evidence.
- Never set a model lower than Sonnet for build work, and never force one model on every subagent. Both cost more in
  rework than they save.

## 5. Proofs that settle arguments

- **Divergence test** (graph or object is the source): change one value only in the source, watch the screen
  move while the other store does not, restore it.
- **Real-vs-synthetic table** for every capability, sent unasked.
- **Self-test of the customer's method** (their worked examples as a workflow), with the contract version shown.
- **Measured numbers only:** agent latency, insight latency, counts — never estimates (Sharek's sheet said 20–40 s;
  the real range was 29–121 s).
- **Every finding id exists in the catalogue; every stored insight passes a schema check before it is written.**

## 6. Done checklist (on top of unifyapps-apps and the design-quality pipeline)

- [ ] Report opens with a **requirement traceability** table (who asked · rule · where met), then what is real vs
      synthetic, then measured latencies.
- [ ] Tags and description re-applied **after the final publish**, and read back.
- [ ] Every object indexed for the queries the app, data sources and workflows run: `customIndexDefinitions`
      all `SUCCESS`, listed in the report (flags ≠ indexes; TAQA shipped with none) — unifyapps-apps
      `objects-and-connections.md` §"Indexes".
- [ ] `platform/` export (workflows, data sources, agents, schemas) and the seed generators are **in the repo** and
      match the tenant (compare `exportedAt` with the last change) — never only in a temp folder.
- [ ] Project README written (TAQA's is the model); starter placeholders neutralised by editing (never deleted).
- [ ] Vendor-name and banned-word grep across src, records, prompts, agents, README, docs and exports.
- [ ] Currency words and money format are the customer's (no "every riyal" in Egypt).
- [ ] No honorifics or gender guesses on generated people; no two generated people share a full name.
- [ ] Every legend band has records; every lever moves ≥1 record (a zero-record lever fails loudly).
- [ ] Stored insights re-run (or stamped "as of") after any data change that moves their screen.
- [ ] Chat starters never overlap answers; a warm-up question sent before any live demo.
- [ ] Dropdowns are rendered outside any scrolling or sticky nav; grid children carry `min-w-0` (no phone overflow).
- [ ] Public app: user 0 granted or refused deliberately, a "No access yet" page; governed app: an environment-default
      user row so unlisted users do not see blank screens.
- [ ] Test and setup rows hidden by flags (`during_setup`, `SUPERSEDED`), never deleted; destructive tests run on a
      secondary record so the hero story stays intact.
- [ ] Whatever the user picked when asked after the build (`references/build-options.md` D1) is delivered: the
      `DEMO.md` run sheet (warm-up, 4- and 12-minute paths, questions with measured latency, symptom → fix, "what is
      real"), the video, the demo script, the manual. Nothing when they picked none.
- [ ] The report states the test mode and where it ran, and lists every check the mode skipped as `partial`
      ("not run at Quick").
      `DEMO_READY` and customer hand-over need at least Standard.

## 7. Reconciled with the other skills (2026-09-26)

- **Live ticker:** opt-in only (two customers had it removed). `unifyapps-apps` updated.
- **Control room and executive stories:** a demo layer — in a sellable product they live in a separate simulator,
  never in the product's data model (SHU §11). `unifyapps-apps` updated.
- **Insight cache:** hours, not 30 minutes — the key already hashes screen, language and rows (Sharek: 6 h); warm it
  on the presenter's machine. `ai-app-patterns` updated.
- **The design style is chosen per use case** (2026-09-28): Full atomic or Light (atomic-agent-architecture "Pick the
  style first"). Only Mars and the Forge Three-Way Match used Full; the six bar-setting builds predate the architecture.
- **Atomic agents are AI Agents** (atomic-agent-architecture, 2026-09-26; Full style). Mars built them as workflows; reuse its
  logic as the agents' tools, not its shape.

## 8. Keep this skill alive

After every build: add or update its case file in `references/builds/` (the seven sections: brief · what was built ·
sequence · praise and corrections · reusable assets · new pitfalls · "reference for"), add a row to §1 if it opens a
new kind of use case, and move any correction that happened twice into §2.
