---
name: unifyapps-apps
description: Build and change UnifyApps Applications — config-based (no-code pages, blocks, data sources) and code-based (React/Vite code apps with Git/GitHub branches) — plus Data Objects in the Objects Manager and Connections in the Connections Manager, all over the platform REST API. Use whenever the user wants to create or edit a UnifyApps app/interface/page, wire an app to an automation or object, work on a code app's source (including from a linked GitHub repo), create or change an object schema or records, or create/test/find a connection.
metadata:
  author: Maher
---

# UnifyApps apps, objects and connections

> **Created by Maher.** Contains no credentials. Each user signs in with their own UnifyApps
> account — read `references/connect-and-call.md` first (tenant, sign-in, finding connections,
> API conventions). Never ask for a password.

> ## 🚫 HARD RULE: never delete a resource
> Anyone using this skill **must not delete anything** on any platform it touches: no workflow,
> agent, task, tool, app, page, data source, object, record, graph, node, edge, source, connection,
> code-app branch or file, Oracle row, git branch or repository. Not even one this skill created.
> That covers `POST …/delete/…` endpoints, HTTP `DELETE`, `deleted: true`, `requestType: "DELETED"`,
> `*_delete_*` storage/connector nodes in workflows, data sources or agent tools, SQL
> `DELETE`/`DROP`/`TRUNCATE`, and Oracle `DELETE_*` APIs. Instead: **soft-delete** (a status /
> `archived` / `enabled=false` flag), or leave it and tell the user exactly what would need removing
> so they can do it themselves in the console. If a design seems to need a delete, stop and ask.
> A hook enforces this at execution time: `scripts/no_delete_guard.py` — install it per
> `references/connect-and-call.md` §0. Do not try to work around it.

> ## ⭐ HARD RULE: the quality bar is non-negotiable
> Every application built with this skill — by a person, Claude Code, the Studio or Forge — meets the bar of the
> **six accepted builds recorded in `unifyapps-solution-playbook`** (§1, case files in `references/builds/`,
> with their repos). Custom screens written for the use case's domain,
> started from a clone of the closest accepted build; a command-centre first screen with the domain's signature visual;
> every AI result shown with its evidence; the docked agent and a full agent page; charts through ChartBlock; live
> insights and an ask on every tile, chart, row and AI result; every state designed; reviewed on the preview against
> the reference build's screens and fixed until it matches. A template screen that only lists an object fails the bar.
> Read this skill and its references (`ai-app-patterns.md`, `code-apps.md`, `design-quality-pipeline.md`), the
> frontend-design and taste skills and the playbook in full before writing screens. Never trade this bar for tokens,
> time or budget — ask for more instead. **What is built never drops. How deeply it is verified is the user's
> choice**: test mode Quick · **Standard** · In-depth, asked once at Phase 0 with the other build questions
> (`unifyapps-solution-playbook/references/build-options.md`). Never lower the mode yourself. A customer hand-over
> is at least Standard.

Everything here was captured from the live UI's own traffic and then **re-executed over plain
REST** on `orbit.uat.unifyapps.com` on 2026-09-21 unless marked otherwise. Evidence marks:
✅ verified · 👁 observed in UI traffic, not re-executed · 📦 seen only in the JS bundle.

Sister skills: `unifyapps-builder` (workflows + agents), `unifyapps-context-graph` (ECG),
**`unifyapps-config-apps` — the complete guide to config (no-code) apps: builder library, every
component, events, data sources/connectors, custom components, theme, publish, and a full sample.**
Master API record: `API-SPEC.md` at the root of the POC Studio plugin (`${CLAUDE_PLUGIN_ROOT}/API-SPEC.md`)
(optional — carry on without it if you only have the skill).

> ## 🔴🔴 HARD RULE — SELLABLE, NOT A PROTOTYPE. Set by Maher, 2026-09-25.
>
> **The overall solution we build must be ready to be sold to the customer as it stands** —
> every app, agent, workflow, object and graph in it. Not a demo, not a prototype, not a
> proof-of-concept, not "good enough to show". A customer could sign, log in and use it.
>
> **The one exception:** it does NOT have to be connected to the customer's third-party systems
> (their ERP, CRM, HRMS, ticketing, files). The data may live on our platform — in Data Objects,
> the Context Graph, uploaded documents — and be loaded by us. Everything else is production:
> real reads, real writes, real automations, real agents that call real tools, roles, controls,
> error and empty states, published, and tested on the builder preview (the published URL only when the user asks).
>
> That exception changes *where the data comes from*, not *what the data is*: it is still bound
> by INVENT NOTHING below. Platform-hosted data is generated volume over real or neutral names,
> labelled where it renders — never invented facts about the customer's business.
>
> **What this forbids, concretely:** placeholder screens, "coming soon", hard-coded numbers,
> stubbed handlers, TODOs shipped, disabled buttons that stand in for a feature, an agent that
> answers in the abstract because its tool is not wired, a screen only the dev server can show.
> If a part cannot be made sellable in the time available, it is left out and named in the
> report — never shipped half-built.

> ## 🔴🔴 HARD RULE — INVENT NOTHING. Set by Maher, 2026-09-23, after the second time.
>
> **Everything we build is 100% real unless Maher explicitly says otherwise.** No mock data, no
> prototype data, no placeholder, no "plausible" stand-in. This outranks every other instruction
> in this skill, including finishing the task.
>
> The failure this is written for: a Data Estate screen shipped listing seventeen named source
> systems — Salesforce Sales Cloud, Microsoft Dynamics 365, SAP Business One, Autoline DMS,
> Kerridge K8, IBM Maximo, SAP S/4HANA — as **the customer's own stack**, with refresh cadences
> and vendor names, under a heading that said "ERP, CRM, dealer and field systems as they are
> today". Every one of them was generated. Nothing in the questionnaire named them. The customer
> read it on screen and asked "we don't have these sources, from where u got it".
>
> That is worse than a bug. A wrong number is a mistake; an invented fact about the customer's
> business, asserted confidently in their own demo, damages trust in everything else on the
> screen.
>
> **What this forbids, concretely:**
> - Inventing an organisation's systems, vendors, departments, people, sites, policies, KPIs,
>   targets, org structure, or anything else presented as theirs.
> - Filling a gap in a brief with something that "sounds right" for that industry.
> - Any figure, label, code or name a viewer could reasonably take as fact when it is not.
> - Carrying a name across from another customer's build because the shape fits.
>
> **What to do instead, in order:**
> 1. **Ask.** A blocking question costs minutes; an invented fact costs the meeting.
> 2. If you cannot ask and must proceed, use **neutral categories, not names** — "ERP", "Dealer
>    management system", "CRM", "Field service" — so the architecture reads without asserting
>    anything about them.
> 3. **Label it where it renders**, not only in a commit message. The person looking at the
>    screen is the one who must know.
> 4. **Say it in the summary, unprompted**, listing exactly what is stood in for.
>
> **Generated demo datasets are the ONE exception, and only when Maher asked for one.** Even
> then: the transactional volume may be synthetic, but names that describe the customer's real
> world — their systems, their brands, their sites — must be real or generic, never invented and
> never presented as theirs. If you are unsure which side of that line something falls on, it
> falls on the "ask" side.

> 🔴 **Building an app? Read "The Maher Methodology" below before anything else.** New starter
> app over the API → GitHub link over the API → local clone → platform assets over REST →
> push + publish from `main`. Never the Code Builder agent; never someone else's app.
>
> **This is the standing default. Maher does not need to restate it** — when he asks for an app,
> the Maher Methodology is what he is asking for, including the AI-native bar in "What a
> UnifyApps app has to mean" below (no mock data, live insights, an embedded agent, chat with
> the data everywhere, a command-centre first screen, real volume — and, for demo apps, a control
> room and executive stories). Confirmed by him on 2026-09-23 while building a graph-only analytics app.
> **One application per use case** (Maher, 2026-09-26): every `UI-nn` is a *screen* of that one app, reached from its navigation (grouped by role, each role seeing its own screens). A second application only when the requirements explicitly ask for more than one application — never one app per persona or per human moment.
> **Start every build from the closest earlier build:** skill `unifyapps-solution-playbook` §1
> (reference builds, what to clone) and §2 (the corrections he made again and again).

> ## 🟢 What "use the Maher Methodology" always includes — the six-part promise
> *(Maher, 2026-09-24: "make sure that this is part of my skills".)* When he says "as usual",
> "Maher methodology", or just asks for an app, all six are in scope without being listed:
>
> 1. **The Maher Methodology build flow** — new starter code app over the API → GitHub link over
>    the API → local clone → every platform asset over REST → push + publish from `main`.
> 2. **Super elegant design** — a command-centre first screen (dark hero band, thesis, glass KPI
>    tiles, the domain's signature visual; a live ticker only when asked — two customers had it removed),
>    dark page headers, one deliberate palette
>    in `:root` tokens, tabular numerals, motion on entry, every state designed (hover, selected,
>    empty, loading). Start from the closest accepted build chosen by the playbook §1/§1b (the bar:
>    the six accepted builds recorded in `unifyapps-solution-playbook` §1, case files in
>    `references/builds/`; the government-performance code build is the code-app counterpart of the
>    config-app sample), never from a blank page. `references/ai-app-patterns.md` §18–§19.
> 3. **Agents everywhere** — the solution's assistant (an entity guide for every object it reads,
>    the ua-chart contract, tools that really run) docked beside every screen (copilot island) and
>    on a full-size agent page. Atomic agents answer JSON envelopes inside their sub-workflows and
>    are never the docked one. §3, §12, §20.
> 4. **His custom chart module** — every chart is `ChartBlock` from `assets/ua-chart/` (type
>    switch, sort, top-N, table, PNG/XLSX/CSV export, click-to-drill), in the app AND in the
>    agent chat through ```` ```ua-chart ```` blocks (`mountCharts()` in the island + the rule in
>    every analyst agent's instructions). No bespoke chart code, no recharts wrappers. §4.
> 5. **Talk to the data** — an ask affordance on every tile, chart, row, card and AI result that
>    opens the docked agent with that item's context; live AI insights on every screen. §15,
>    `assets/chat-with-data/`.
> 6. **Tested and working** — not "it compiles": at the test mode the user chose (Standard by default; the
>    floor checks run in every mode — playbook `build-options.md` §2–3), run the whole checklist below on the
>    **builder preview** (the signed-in session). The published URL is tested only when the user asks for it
>    (`build-options.md` §2b). Screenshot every screen, click every action, run the agent battery and
>    the control-room battery, check one number per screen against the engine. Report the mode, what was
>    tested, what failed, and what the mode skipped.
>
> Two build-quality rules ride along with all six *(Maher, 2026-09-25)*:
>
> - 🔴 **Workflows use the platform's native nodes; Code is the last resort.** Filter in the
>   fetch, count with `count_records`, group/join with `run_sql_query_on_list`, sort, parse,
>   branch (`IF_ELSE`), loop (`LOOP`) and answer (STOP `result` map) natively; a Groovy node only
>   for a real computation, one job, titled with why. Our worst build was 46 % Groovy.
>   `unifyapps-builder/references/workflows.md` §5a.
> - 🔴 **AI Insights load fast.** Screen insights and summaries run on a fast model (GPT-4.1 mini:
>   4–6 s, against ~30 s on Sonnet 4.6), capped input, 2–3 findings, `maxTokens` ≤ 1,600; revisits
>   are instant from cache; the measured time per screen goes in the test report.
>   `references/ai-app-patterns.md` §2 "Latency budget".
>
> Plus the two rules above it all: **sellable, not a prototype** (data may live on our platform
> instead of the customer's systems — nothing else is optional) and **invent nothing**.
>
> 🔴 **And always the customer's logo** *(Maher, 2026-09-25)*: at the start of every build, get
> the customer's real logo from an official source, **show it to the user and ask them to confirm it is
> the correct one** (with the customer's name, build question B1–B2), and only then use it throughout the app — shell header, dark hero, favicon,
> exports, demo film. Never redrawn, recoloured or guessed; no confirmation, no logo.
> `references/customer-logo.md`.

## The one idea to hold on to

**An app never calls an automation or an object directly. It executes a registered
`e_data_source`.** Config apps and code apps both do this, through the same endpoint:

```
POST /api/workflow/execute/node?name=<dsName>&requestId=<dsId>
{ "context": {appName, resourceName, resourceVersion},   // must match the data source
  "id": "<dsId>",                                         // the e_data_source id
  "inputs": { ...the data source's stored inputs, with only {{templated}} fields changed } }
```

- No data source → `500 forbidden datasource: not found`.
- Any non-templated input differs (e.g. a different `automationId`), or a stored input is
  omitted → `500 forbidden datasource : invalid input`.
- A data source is an ordinary entity — **you can create it yourself with `POST /api/entity`**
  (✅). This is what the platform's own code agent does with its `create_datasource` /
  `provision_data_sources` tools, and it is how you let a hand-written (or GitHub-edited) code
  app call a new automation.

## Module map

| UI module | Route | Stored as | Reference |
|---|---|---|---|
| Applications (config) | `/p/0/interfaces/{appId}/builder/{slug}` | `e_interface` + `e_component` pages + `e_data_source` | **`unifyapps-config-apps` skill** (this skill's `references/config-apps.md` is the early summary) |
| Applications (code) | `/p/0/interfaces/code-builder/{appId}?sessionId=` | `e_interface` (`manifest.mode:"code"`) + files behind `/agent-api` | `references/code-apps.md` |
| **AI-native app patterns** | — | insight engine, agent dock, charts, scenarios, stories, scale | **`references/ai-app-patterns.md`** |
| Objects Manager | `/p/0/objects/{objectId}/records` · `/schema` | `EntityType` (group `STANDARD`); records are entities of that type | `references/objects-and-connections.md` |
| Connections Manager | `/p/0/connections/all` · `/create/{appName}` | `Connection` (group `STANDARD`) | `references/objects-and-connections.md` |

User-context module ids: Applications `e_interface`, Objects Manager `ENTITY_TYPE`,
Connections Manager `CONNECTION`, Code Functions `e_code_snippet`, Connector SDK
`CONNECTOR_DEFINITION`.

## Config vs code — which one

| | Config app | Code app |
|---|---|---|
| Created by | *New Application → Create Manually*, or prompt with **Config** | prompt with **Code** (the platform agent `text_to_ui_tensor` writes it) |
| Source of truth | page JSON (`e_component.properties.blocks`) | a Git repo of React 19 + Vite + TS + Tailwind 4 + TanStack Query |
| Claude edits it by | `POST /api/entity/create-update-or-delete/hierarchical` | editing files — via GitHub (linked repo) or `PUT /agent-api/sessions/{s}/files/contents` |
| Talks to the platform via | `e_data_source` entities bound in blocks with `{{ dsId['data'][...] }}` | the same `e_data_source` entities, called with `@unifyapps/app-builder-sdk/hooks/workflow` |
| Published by | `POST /api/entity/e_interface/{appId}/deploy` ✅ | `POST /agent-api/apps/{appId}/publish {versionTag, versionNote}` ✅ (default branch only) |
| Hosted at | `https://{appId}-orbit.matrix-uat.unifyapps.com` | `https://{appId}-orbit.tensor-uat.unifyapps.com` |

## Code apps + GitHub — what is and isn't established

- ✅ A code app is a real repo: `.agents/` (the platform agent's own skills + rules),
  `.githooks/pre-push`, `app/` (Vite project), `PLAN.md`, `PRODUCT.md`, `theme.json`.
  **Read `.agents/skills/*/SKILL.md` in the repo before changing app code** — they are the
  platform's own verified contracts (object-data, automation-integration, backend-integration,
  workflow-authoring, authentication, roles-and-permissions, copilot, …).
- ✅ **Create a code app over the API:** `POST /agent-api/sessions {target:"code-builder", input:<brief>, userName, userEmail}`
  → `{appId, sessionId}`, **then create the `e_interface` entity and the domain mapping yourself**
  (the session does not). Recipe in `references/code-apps.md`.
- ✅ **Link GitHub over the API:** `POST /agent-api/sessions/{s}/git` with `organizationName:"username:<login>"`
  (personal) or the org; owners from `lookup?ByQuery=APPROVED_GITHUB_ORG`. Creates a new private
  repo. Personal accounts allowed unless the tenant flag "Code app repositories under
  organizations only" is on (off on UAT). The connection's token must be able to **push** to the
  new repo — ✅ 2026-09-23 Maher's connection does, and the starter commit lands immediately; a
  fine-grained PAT on "Only select repositories" creates the repo but the push fails.
- ✅ **Builder control:** `GET /agent-api/sessions/{s}` → `{sessionId, status: running|done|stopped,
  target, appId, interactive}` (cheapest poll); `POST /agent-api/sessions/{s}/stop {}` → `{ok:true}`.
- ✅ **Two-way sync:** agent commits are pushed to GitHub (same SHAs). A branch pushed from a
  Claude session appears in UnifyApps and `POST /agent-api/sessions/{s}/branch {branch}` pulls it
  into the Code Builder; merges to `main` on GitHub are picked up too. Published v1 of our app from a merged commit.
- ✅ **Privacy for code apps is set by the builder agent** (ask it), not Settings → Privacy (refused for code apps).
- ✅ Direct edit without Git: `PUT /agent-api/sessions/{s}/files/contents {edits:[{path,content}]}`,
  then ask the builder agent to commit.
- Platform assets the code needs (objects, automations, agents, data sources, connections) are
  **not** in the repo — create them over REST (this skill, `unifyapps-builder`), then reference
  their ids from `app/src/data/`.

## The Maher Methodology (the required flow) ✅ agreed 2026-09-21, named 2026-09-23

*Named by Maher on 2026-09-23. It is the default for every UnifyApps build — app, data, graph,
agents — and does not need to be asked for.*

> 🔴 **NON-NEGOTIABLE — even under deadline pressure.** Every UnifyApps app is built this way,
> and only this way (✅ re-run end to end on orbit.uat, 2026-09-23, on a supplier-risk build —
> `unifyapps-solution-playbook/references/builds/rest-supplier.md`):
>
> 1. a **NEW minimal starter code app** created over the API — `POST /agent-api/sessions` +
>    the `e_interface` entity + the domain mapping (`ua.createCodeApp` in `scripts/ua_apps.js`;
>    recipe in `references/code-apps.md`);
> 2. **linked to GitHub over the API** — `POST /agent-api/sessions/{s}/git` (`ua.linkGithub`),
>    private repo. For Maher: his Orbit GitHub connection `6aaa918c8a8a3c62230da19a`,
>    `organizationName: "username:mmaheranwar"` (anyone else uses **their own** connection);
> 3. **cloned locally and developed from the Claude session**;
> 4. **every platform asset over REST** from a signed-in tab — objects, seed records, workflows,
>    data sources, agents (fastest: clone the known-good assets of an earlier build,
>    `references/code-apps.md` "Findings from the supplier-risk reference build");
> 5. **pushed to GitHub and published from `main`**.
>
> **NEVER hand the build brief to the Code Builder agent.** It is slow (~15 min just reading
> code), opaque, and not how any of the earlier accepted code apps were built.
> **NEVER type into a code-builder chat or link Git on an app you do not own.** First check
> the `e_interface`'s `ownerUserId` against
> `GET /api/user-context?includeRoles=true` → `user.id`, and look at the commit authors
> (`GET /agent-api/sessions/{s}/changes`). Lesson 2026-09-23: a colleague's app
> `app-6adc194ec366` (owner user 94598) was mistaken for Maher's (109790); a builder run was
> started on it and had to be stopped with `POST /agent-api/sessions/{s}/stop {}` →
> `{ok:true}`, status `stopped`, no commits made.
> **Before declaring "not signed in", check BOTH browsers** — the in-app Browser pane may hold
> the Orbit session when Chrome does not.

Follow this order exactly. Do **not** shortcut it (no pasting code into the builder working tree
with `PUT /files/contents`, no asking the builder agent to write the real app):

1. **UnifyApps creates the app.** `POST /agent-api/sessions` (or console *New Application → Code*)
   with a brief that asks for a **minimal starter only** — no objects, data sources, automations
   or seed data — then the `e_interface` + domain mapping. Name it as the user wants it shown
   (never "Maher" in the UI).
2. **UnifyApps creates and links the GitHub repo** (`POST /agent-api/sessions/{s}/git`) using the
   user's own GitHub connection. ✅ 2026-09-23: with Maher's connection `6aaa918c8a8a3c62230da19a`
   the starter commit was on GitHub within seconds and `GET .../git` → `linked:true` — no PAT step,
   no "commit the working tree" nudge.
3. **Confirm the push:** `GET /agent-api/sessions/{s}/git` → `linked:true` and
   `gh api repos/<owner>/<repo>/commits` shows the starter commit.
4. **Fallback only — if the push failed** (`linked:false`, empty repo; typical of a fine-grained
   PAT on "Only select repositories"): tell the user to add the repo to that PAT (**Contents: Read
   and write**), then trigger a commit (the engine pushes only on its next commit).
5. **Develop locally.** `gh repo clone`, `cd app && bun install && bun run build`. Run the dev
   server with `bun --cwd=<repo>/app run dev --port 5173` (a `.claude/launch.json` entry for the
   browser pane). The engine-managed `app/.env` carries `API_PROXY_TARGET` (the tenant),
   `VITE_APPLICATION_ID` and `APP_AUTH_TOKEN`, so `/api` and `/auth` proxy to the real backend.
   A PRIVATE app shows its login page first — **the user signs in**, never Claude.
6. **Platform assets over REST** (workflows, `e_data_source`s, agents) — then reference their ids
   in `app/src/data/`. A code app created over the API may lack `e_global_<appId>`; create it first.
7. **Commit and push to GitHub from the local clone**; UnifyApps picks it up (switch the session to
   the branch / `main`), rebuilds the preview, and is published from `main`.
8. Keep this skill and `API-SPEC.md` updated in the same turn as any new finding.

### 🔴 Design & UX quality pipeline — runs from the first screen ✅ agreed 2026-09-25

Not a polish pass. `references/design-quality-pipeline.md` is **part of the methodology** and
starts before step 5 above creates a single component:

- **Phase 0 Brand**: get the customer's logo, **confirm it with the user**, commit it with its
  `SOURCE.md`, sample the palette from it — `references/customer-logo.md`. Before the theme.
- **Phase 0 Direction** (before any page/component): read `frontend-design` + `taste-skill`
  (+ `redesign-skill` on a rework), pick ONE `design-skills` slug (`enterprise` default for
  dashboards, `shadcn` if the app uses shadcn/ui), UnifyApps brand tokens win, record the
  decision in the build notes.
- **Phase 1 UX decisions** (before any flow): `product-design` for every action — scope,
  undo vs confirm, recovery, empty/loading/error states, reachable states.
- **Phase 2 Build**: tokens only; `react-best-practices` per component; `ui-design` audit per
  screen as it lands; `typography-audit`; `ui-animation` for purposeful motion only.
- **Phase 3 Verify**, at the chosen test mode (Quick · **Standard** · In-depth; playbook `build-options.md` §3), on the builder preview (the published URL only when the user asks): `ui-verification`,
  `accessibility-scan → inspect → fix → diff`, `web-design-guidelines`, the design-skill's
  quality gates, screenshots against the closest accepted build's screens as the baseline.
- **Phase 4 Report**: name every pipeline skill that ran and its result.

All of these are sibling skill folders (see the table in the reference). Read each `SKILL.md`
in full the first time it is used in a session.

### 🔴 Before you call an app done — the checklist

Everything on this list has shipped broken at least once while compiling, type-checking and
rendering without errors. The failure mode this catches is not a crash — it is a **200 that did
nothing**, or a number that is quietly wrong. Three times on one earlier build (2026-09-23) the guidance
below already said the right thing and I did something quicker instead: a hand-traced map when §7 said use real boundaries, a bespoke recharts
wrapper when §4 said use `ua-chart`, and flat light panels when §19 describes the house style.
Each one compiled, type-checked and rendered without errors. Prose did not stop it; a checklist
does. **Walk this before saying an app is ready, on the builder preview.** Every item runs in every test mode.
The only exceptions are the batteries, the screenshot review and the pipeline items, which run at the chosen test
mode (playbook `build-options.md` §3):

- [ ] **Customer logo** — obtained from an official source, **confirmed by the user in chat**, and
      shown in the shell header, the dark hero, the favicon and any branded export; checked on the
      builder preview (and on the published URL when the user asked for published testing).
      `references/customer-logo.md` §4.
- [ ] **Charts** — every chart is `ChartBlock` from `assets/ua-chart/`. No bespoke chart code.
- [ ] **Agent charts** — `mountCharts()` is called in the island AND every analyst agent's
      instructions carry the ```` ```ua-chart ```` contract. Ask the agent for a trend and watch a real
      chart appear in the chat.
- [ ] **Geography** — real boundary data, projected at build time, sub-regions drawn. Check the
      other app repos first; the file usually exists already.
- [ ] **Look at it** — dev server up, screenshot every screen. Beside a screenshot of an accepted build, is
      the difference obvious? Dark band, colour doing work, glass tiles, tabular numerals.
- [ ] **Chat with the data** — an ask affordance on every tile, chart, panel, row and AI result.
- [ ] **No mock data** — every figure is a read; every block carries a lineage chip.
- [ ] **Reads cover their filtered set** — `total` vs `length` checked on every list-driven figure.
- [ ] **Control room** (demo apps, or the separate simulator of a sellable product) — every lever
  applies and resets exactly; run the whole battery, not one.
- [ ] **The playbook's done checklist** — `unifyapps-solution-playbook` §6 (re-tag after publish,
  platform export + seed in the repo, README, vendor grep incl. repo docs, traceability-first report).
- [ ] **Agent battery** — the QA questions in §16, not a spot-check (Quick: the five-question subset in
      `build-options.md` §3; Standard and In-depth: the full battery).
- [ ] **The agent actually calls its tool.** Ask it something only the tool can answer. An agent
      whose tool lacks `enabled: true` answers in the abstract — "access to the following records
      would be required" — which reads like a permissions problem and is not one. See §20.
- [ ] **Republish after touching a data source or an agent.** A deployed interface fixes the set
      of data sources it may call at PUBLISH time. Anything created or edited since is rejected
      at runtime with `forbidden datasource : invalid input`. Two screens sat empty for an hour
      over this and nothing about the data source was wrong.
- [ ] **Every field a screen reads exists.** Check each one against the object or node schema,
      not against the TypeScript interface. A phantom field renders as an empty state or blank
      cell and a missing one crashes the screen on `.toFixed()` — both compile, both typecheck.
- [ ] **Every object has the indexes its queries need, all `SUCCESS`.** `filterable`/`sortable`
      flags create no index; only the primary and unique keys are indexed automatically. From the app's reads, data
      sources and workflows, add ≤ 5 compound `customIndexDefinitions` per object (equality → sort
      → range), re-read until every status is `SUCCESS`, and list them in the report.
      Recipe: `references/objects-and-connections.md` §"Indexes".
- [ ] **Totals come from the engine.** Any figure over a set that could exceed a page must be
      `sum()`/`count()` server-side. A browser-side reduce over a truncated read is wrong and
      looks entirely correct — Receivables read 1,000 of 1,113 invoices and reported QAR 229M
      against a true QAR 229.6M.
- [ ] **Look at the builder preview, not only the dev server.** After each publish, also confirm the
      published bundle is your commit by grepping it (`references/code-apps.md`; a no-sign-in file
      check, not UI testing). The publish takes the commit the Code Builder session has, which is not
      necessarily the one you just pushed.
- [ ] **Design pipeline ran from Phase 0** (`references/design-quality-pipeline.md`): design slug
      recorded before the first component, tokens only, brand tokens win.
- [ ] **product-design decisions** recorded for every action; delete undoable or confirmed.
- [ ] **ui-design audit per screen, typography-audit before publish**, motion purposeful and
      following the app's Motion setting (on | auto | off; auto honours reduced-motion), none on tables/charts.
- [ ] **ui-verification + accessibility-scan/inspect/fix/diff + web-design-guidelines** clean on
      the builder preview (the published URL only when the user asked); the design-skill's quality gates passed.
- [ ] **Report names every pipeline skill that ran** and its result.
- [ ] **Sellable as it stands.** No placeholder screen, stub, TODO, hard-coded figure or
      unwired agent tool anywhere. Data on our platform is fine; a half-built part is not —
      it is left out and named in the report.

### What "a UnifyApps app" has to mean (agreed 2026-09-22)

A screen that reads a Data Object is the floor, not the goal. Unless the user says otherwise,
build every app with all of these, and read `references/ai-app-patterns.md` first:

- **Animation is ON by default, with a switch.** Never gate motion on `prefers-reduced-motion`
  alone: Windows turns animation effects off with Battery Saver, so a demo laptop that unplugs
  silently stops every animation at once with no way back from inside the app. The app decides
  (`on` / `auto` / `off`, default `on`), publishes the answer as `data-still` on `<html>` so the
  CSS needs one guard per animation, resolves it inline before first paint, and ships a Motion
  control in the masthead — an override of an accessibility preference is only defensible with a
  visible way back. Recipe: `references/ai-app-patterns.md`.
- **Never name another vendor's product.** The brief's reason for buying — "they license X and
  want to sunset it" — is the user's context, not the product's copy. It must not reach a
  heading, a lede, an enum value, a record code, a workflow system prompt or an agent's
  instructions. "Build something like X, or better" is a fine prompt; X must not ship. Grep for
  it (and its Arabic spelling) across src, seed, records, agents AND workflows before the first
  publish — full checklist and the neutral replacements in `references/ai-app-patterns.md`.
- **No mock data anywhere.** Every figure comes from a Data Object. Blocks carry a *lineage
  chip* (object + record count), never an "illustrative" disclaimer — a disclaimer is what you
  write when the numbers are fake, and these are not.
- **Live AI insights on every screen**, not on one "AI page": the records the screen is showing
  go to an LLM automation and come back as ranked, evidence-cited findings, each bound to one
  action the screen can execute. Charts inside the cards when the point is a shape.
- **An embedded agent** docked beside every screen, reading the same objects, with the full-size
  version on its own page. It never sends anything the user did not click.
- **Chat with the data — on every surface, by default** (Maher, 2026-09-23: "I want this
  behaviour in all my projects"). Every AI insight card, chart, KPI tile, heatmap cell, table row,
  domain card and AI result (brief, assessment, plan, triage, scenario) carries an ask affordance.
  One click opens the docked agent with that item's context written out in plain language, the
  agent explains and elaborates, and the user carries on asking anything. Not an "AI page" — the
  agent is one click from every number. Recipe and drop-in components:
  `references/ai-app-patterns.md` §15 and `assets/chat-with-data/`.
- **A first screen that looks like a command centre, not a report** (Maher, 2026-09-23: "the UI
  is very poor" about a clean-but-plain light dashboard). Open on a dark hero band with the
  product's thesis, glass KPI tiles and the domain's signature visual (a map, a network, a
  gauge), and dark page headers on every screen. A live ticker under the masthead is **opt-in**
  (the supplier-risk and document-fraud builds both had it removed, 2026-09-25). White space and hairlines alone read as unfinished to an executive audience.
- **Every component finished, not merely working** (Maher, 2026-09-23: "this must be applicable
  for all future apps, not only this"). Before writing any component, look at the best version of
  it we have already built — the accepted builds in `unifyapps-solution-playbook` §1 and this
  skill's `assets/` are the reference set — and start there. Real geometry over hand-traced shapes, size *and* colour carrying
  meaning, hover / selected / empty / loading all designed, labels sized per shape, provenance
  named on the component, `role="img"` with a real `aria-label`. Then **run the dev server and
  look at it**: a hand-traced map compiles, type-checks, renders without errors and is still
  unusable. `references/ai-app-patterns.md` §18.
- **A control room** that plays the data: named scenarios that run a real automation, rewrite
  real records, and reset exactly. **For a demo app.** In a *sellable product* (a golden-record build, 2026-09-25:
  "you are doing it as demo presentation, not as actual system") scenarios, levers, reset and
  "demo data" labels live in a separate simulator (its own app or workflows) and never in the
  product's data model — say which one you are building.
- **Executive stories** (added 2026-09-23). A scenario is a lever; nine levers demonstrate a
  capability and answer nothing. Model the stories a real user arrives with — persona, the
  question in their words, the payoff, and the run of screens and levers that gets there — as
  **records**, and play them from a store so the run survives navigation. This is what turns a
  set of screens into an argument. See `references/ai-app-patterns.md` §10.
- **Thousands of records, not hundreds** (added 2026-09-23), *when the data has real structure
  to carry it* (a simulated core record never has fewer than 100; playbook `build-options.md` "The seed rule"): generated monthly history anchored on the live values, and transactional rows
  filed against every dimension they name. Volume with no foreign keys is decoration; volume
  with them makes every filter, map click and scenario real. §9 has the rules — and the ways the
  storage node fails silently once you cross a few thousand rows.

Do not copy a wireframe's structure when the platform can do more than the wireframe assumed.

**Export the automations into the repo.** Built through the API from a browser session, a
workflow's definition lives on the tenant and nowhere else — so the app's React source is
versioned and the Groovy computing half of what it displays is not. A browser cannot write to
the repo, but it can hand you a download: fetch each `workflow-definition/{id}`, write out the
JSON and every `code_by_unifyapps` node's body, and `URL.createObjectURL` + an `<a download>`
click puts them in Downloads to be committed. Run it after any change made through the API. And
never commit a copy you are not certain matches what is deployed — a file in the repo that
quietly disagrees with the running automation is worse than no file, and much harder to notice.

## Golden rules

1. **Shared tenant.** Read anything; write only objects you created. Name scratch objects
   `<yourname>_scratch_*` (the signed-in user's name) and list them in your report. Never type into another person's code-builder
   chat, never link Git on an app you don't own, never publish someone else's app. **Prove
   ownership first** (`ownerUserId` vs `user-context` `user.id`, commit authors) — an app's name
   is not evidence (2026-09-23).
2. **Never enter credentials.** Connections needing OAuth or secrets are created by the user
   with their own account; you find them (`aggregation` on `Connection`, see
   `references/connect-and-call.md` §4) and reference the id. For GitHub, the user connects
   **their own** GitHub account — never reuse someone else's GitHub connection.
3. 🔴 **Send full bodies on EVERY write — entity API and storage bindings alike.** A storage
   binding runs `useRawPayload: true`, which **REPLACES** the record: a partial payload returns
   200 and silently deletes every field you left out (2026-09-23: 415 supplier records stripped
   to five). Read, spread, write back — `{...row.properties, ...changes}` — dry-run ONE record
   and read back its field count before the batch, and snapshot the object first. Full guardrails
   and the drop-in `patch()` helper: `references/objects-and-connections.md` §"Writing records".
   `POST /api/entity/update` and `/api/entity-type/update`
   replace `properties`/schema wholesale — a partial body fails `required` or drops fields.
4. **Every app→platform call goes through an `e_data_source`.** Never "fix" a
   `forbidden datasource` error by trying another endpoint — fix the data source or the inputs.
5. **Filters differ by surface.** Entity/aggregation API: `{op, field, values}` with field
   `properties.x` (entity) or `properties_x` (aggregation). Storage node / data sources:
   `{operator, filters:[{property, filter:{operator, value}}]}`. The wrong shape is often
   accepted with 200 and ignored.
6. **Verify by reading back**, and for apps by loading the page — a 200 from the hierarchical
   endpoint does not prove the page renders.
6b. **Publish after every new data source.** A data source created after the app was published is
   invisible to the running app (`500 forbidden datasource: not found`) until you publish again.
   The SDK also 401s on everything until the interface has been published **once**
   (`/auth/interface/deployed` → 404) — publish the scaffold before expecting any data.
7. **Never trust who-the-user-is from the browser.** A data source parameter like `owner` is
   whatever the caller sends; the workflow must derive the caller itself (API-SPEC "Caller identity").
8. **A capability the platform does not have is one HTTP node away.** An app whose value rests on
   something deterministic — document forensics, a scoring engine, a licensed dataset — should call
   that thing, not approximate it with an LLM. `custom_http_endpoint_execute` needs no connection,
   takes a plain `body` mapped from a Groovy step, and returns `{status, result}`. Let the service
   own the verdict and the workflow own the records: turn its report into rows and return its
   summary unchanged, so a disagreement between the engine and the screens stays visible.
   (✅ a document-fraud build, 2026-09-23 — 2.3 s end to end on a real PDF; API-SPEC §35;
   `unifyapps-solution-playbook/references/builds/claim-integrity.md`.)
9. **Animated logos: inline SVG, not `<img>`.** Keyframes inside an SVG image can freeze on frame one;
   a build-in animation then leaves the logo invisible (API-SPEC "Animated SVG as `<img>`").
   The **official UnifyApps mark animation** is ready to drop in: `assets/brand-mark/ua-mark.tsx`
   (`<UaMark className="size-8 text-[#EDE6D7]" />`, colour = `currentColor`) — see API-SPEC
   "UnifyApps brand mark animation" for the lockup with the wordmark and how to regenerate it.

## Auth

Full walkthrough: `references/connect-and-call.md`. In short: session cookie from the
user's own local-account login, or run calls
same-origin from a logged-in browser tab (`fetch('/api/...')`) — which is how everything here
was verified. `scripts/ua_apps.js` wraps the verified calls for a logged-in tab: its read,
update, search and run helpers were exercised as written on 2026-09-21; the create helpers
(`createObject`, `createConnection`, `createAutomationDataSource`, `updatePage` for new blocks,
`deployApp`) send the exact bodies verified by hand but were not re-run through the helper.
Never ask for or handle the password.

## Verified scratch objects (UAT, built by the skill author)

Read-only references for the known-good shapes — **do not edit, publish or link Git on them**;
build your own. The ids exist only on UAT.

| What | Id |
|---|---|
| Object `maher_scratch_task` (6 fields, 2 records `T-001`, `T-002`) | `maher_scratch_task` |
| Connection `maher_scratch_http (Claude API learning)` (Custom HTTP, jsonplaceholder) | `6ab0ea7a5459f4370f0c1f3f` |
| Config app `maher scratch config app` (published v1) | `maher-scratch-cfg` |
| Its Homepage / global page | `e_6ab0ebb7f843281fda5f5fa3` / `e_global_maher-scratch-cfg` |
| Data source → workflow `6aae3aab0900af6ee3a552c0` (Fleet telemetry) | `e_6ab0ebe6f843281fda5f6032` |
| **Code app "Task Scratchpad"** (built by the Code prompt on `maher_scratch_task`, no new objects) | `app-3dfc7c54e504` |
| Its builder session | `e_6ab0f9b9fbe116271240c547` |
| Its five storage bindings (FETCH, FETCH_ONE, CREATE, UPDATE, DELETE) | `e_6ab0fa3efbe116271240cdb8` `…cdbc` `e_6ab0fa3ef843281fda5fe694` `e_6ab0fa3efbe116271240cdbf` `e_6ab0fa3ff843281fda5fe697` |
| Code app created purely via API | `app-282f2c90f0fd` (session `e_6ab0fd75f843281fda600744`) |
| **Reference builds** — the mandatory flow end to end, and a real external service (document forensics) inside a workflow | app ids, sessions, objects and repos in the case files: `unifyapps-solution-playbook/references/builds/rest-supplier.md`, `…/claim-integrity.md`; lessons in `references/code-apps.md` |

The author's GitHub connection id appears only in the methodology above, for his own sessions.
Anyone else uses a GitHub connection made with **their own** GitHub account.
