---
name: unifyapps-config-apps
description: Build complete, working UnifyApps CONFIG-based (no-code) applications end to end over the REST API — app shell, theme, navigation, pages, every built-in component (Stack, StatCard, Card, Chart in all 12 types, Table, Repeatable, Form, Modal, Drawer, Tabs, Kanban, Timeline, Stepper, FileUpload, PDFViewer, Copilot…), page variables, page inputs, events and actions, data sources on Objects / automations / any connector (HTTP, Gmail, OpenAI…), JS output transformers, custom components (upload a ZIP, runtime contract), the native agent chat, document upload into a workflow (OCR/LLM) or the agent, and publishing. Use whenever the user wants a config/no-code UnifyApps app (not a React code app), wants to add or change pages, blocks, charts, events or data sources in one, build a custom component, handle uploaded files, or asks how a config-app feature works.
metadata:
  author: Maher
---

# UnifyApps config apps — end to end

> **Created by Maher.** Contains no credentials. Each user signs in with **their own** UnifyApps
> account — read `references/connect-and-call.md` first. Never ask for a password.

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

Everything here was captured from the platform's own bundles and from **252,982 blocks on 2,203 pages
of 80 real published config apps** (read-only harvest), then **proven by building a complete app over
REST**: *CGB Pulse* (the sample in `examples/cgb-pulse/`) — 8 pages, 7 objects, 4 automations, an agent, 3 custom components, 19 data
sources — on `orbit.uat.unifyapps.com`, 2026-09-23. Its *Performance Studio* page exercises 10 chart
types and 25 prebuilt components; its *Documents* page runs upload → OCR/LLM workflow → object →
agent. Evidence marks: ✅ executed and verified · 👁 seen in real apps / UI traffic, not executed ·
📦 bundle only.

Sister skills: `unifyapps-apps` (code apps, objects, connections), `unifyapps-builder` (workflows,
agents), `unifyapps-context-graph`. Master record: `API-SPEC.md` at the repo root (§29 is this skill).

> ## 🔴🔴 HARD RULE — SELLABLE, NOT A PROTOTYPE (Maher, 2026-09-25)
> The overall solution must be ready to be sold to the customer as it stands — every page,
> data source, automation and agent production-grade, published, and tested on the builder preview (the published
> URL only when the user asks).
> The **one exception**: it need not connect to the customer's third-party systems; the data may
> live on our platform (Data Objects, Context Graph, uploaded documents), still bound by
> INVENT NOTHING (`unifyapps-apps`): real or neutral names, labelled where it renders. No
> placeholder pages, stubbed events, hard-coded numbers or half-built parts — leave a part out
> and name it in the report rather than ship it unfinished.

## Config app or code app?

Config app: pages are JSON block trees you (or the visual builder) edit; no repo, no build step; data
through `e_data_source` entities; publish = one call. Code app: a React repo (see `unifyapps-apps`).
The user picks the app type at build question A2 (default code; playbook `references/build-options.md`).
Recommend a config app when they say *config / no-code / builder / low-code*, when non-developers must
maintain it, or when the screens are dashboards, forms, lists and agent chat — which config apps cover
completely. Build a code app when you need arbitrary React. **Both call the platform the same
way: through `e_data_source`s.**

## The model in one screen

```
e_interface (app)  id = slug; theme.defaultThemeId -> e_theme; navigation.primary[] -> pages
 ├─ e_component PAGE  (one per page; + e_global_<appId> for app-wide data sources)
 │    blocks: FLAT map id -> block; tree via parentId + content.blockIds / slots / content.blockId
 │    pageVariables var_*, pageFunctions func_*, inputSchema (page inputs), interactions (onPageLoad),
 │    events (page events), customBlocksVersionsMap (custom components used)
 ├─ e_data_source  (per page or global) context = ANY connector action; inputs may hold {{ }}
 ├─ e_theme        cssVars palette (--palette-brand-*), defaultScheme light|dark
 └─ e_custom_component  manifest {type, main .es.js, style .css} — uploaded ZIP
```

A block: `{id, parentId, displayName, component:{componentType, content, appearance, slots?},
visibility, events?, dataSourceIds, dpOn, dP, cP?, additional:{customCSS}}`. **`dpOn/dP/cP/
dataSourceIds` are dependency bookkeeping computed from every `{{ }}` — without them a block never
re-renders.** `scripts/ua_cfg.js` computes them for you; never hand-write them.

## How to build one (the order that works) ✅

All calls run **same-origin from a signed-in tab** (browser JavaScript tool). Paste
`scripts/ua_cfg.js` once; it defines `window.cfg`. (A tab can't load it from disk: Orbit's CSP blocks
`localhost`. Paste the file; navigating the tab wipes it — do UI work in a second tab.)

0. **Design direction + UX decisions first** — `references/design-quality-pipeline.md` Phase 0
   and 1 (mandatory, agreed 2026-09-25): read `frontend-design` + `taste-skill`, pick ONE
   `design-skills` slug (`enterprise` default; UnifyApps brand tokens win), run `product-design`
   over every action (scope, undo vs confirm, recovery, empty/loading/error, reachable states),
   and record both before step 1. The theme colours in step 2 come from that decision, never
   from a guess.
1. **Data first.** Objects + records (`unifyapps-apps` → objects), automations and agent
   (`unifyapps-builder`). Seed with a deterministic generator (`examples/cgb-pulse/seed.js`).
2. **Customer logo, then theme** — get the customer's real logo, **show it to the user and get their
   confirmation that it is the right one** (with the customer's name, build questions B1–B2) before using it (`unifyapps-apps/references/customer-logo.md`,
   standing rule 2026-09-25). Then `cfg.createTheme({name, brand:'#8A1538', secondary:'#B08D57'})`
   → `e_theme`, using the Phase 0 tokens sampled from the confirmed brand.
3. **App shell** — `cfg.createApp({appId, name, themeId, host:'orbit.matrix-uat.unifyapps.com', logo})`
   creates the `e_interface`, its global page and the domain mapping. `logo` defaults to the
   UnifyApps assets; a customer URL there is not yet verified (test it, record it). Either way the
   confirmed logo also goes on the first page as an `Image` block in the header/hero.
4. **Empty pages first** (`cfg.savePage(cfg.page({...}))`) so every page id exists before any
   `navigateToPage` points at it; then `cfg.registerPages(appId, [{pageId, slug, name, icon, nav?}])`.
5. **Global data sources** on `e_global_<appId>` (`cfg.dsFetch / dsAutomation / dsHttp / createDs`).
6. **Pages with their page-level data sources** — `cfg.ensureDs` (idempotent) then
   `cfg.savePage(cfg.page({id, appId, name, slug, vars, inputs, onLoad, body, overlays}))`.
   As each page lands: `ui-design` audit, purposeful motion only (`ui-animation`), tokens only
   (pipeline Phase 2). `typography-audit` once after the first three pages and again before publish.
7. **Publish** — `cfg.publish(appId, notes)`. **Publish again after every new data source** —
   a running app cannot see a data source created after its last publish.
8. **Verify in the preview**, not by trusting 200s:
   `https://<tenant>/p/0/interfaces/<appId>/preview/<slug>` renders the app with live data in the
   Orbit session (the builder's ▷ opens it in a new tab). The published host
   `https://<appId>-orbit.matrix-uat.unifyapps.com` is private and shows the app's own login — the
   user signs in there, never Claude.
9. **Design pipeline Phase 3 + 4** on the preview, at the test mode the user chose at Phase 0 (Quick ·
   **Standard** · In-depth — `unifyapps-solution-playbook/references/build-options.md` §3). In-depth is
   every page of the preview: `ui-verification`, `accessibility-scan → inspect → fix → diff`,
   `web-design-guidelines`, the design-skill's quality gates, screenshots. The published URL is tested only
   when the user asked for it. The test report states the mode and names every pipeline skill that ran.

`examples/cgb-pulse/build-pages.js` is the full, working reference: every pattern below in six pages.

## Expressions — the scopes a `{{ }}` can read ✅

| Scope | Example | Notes |
|---|---|---|
| data source | `{{ e_<id>['data'] }}`, `['isLoading']`, `['error']['message']` | **with a transformer, `data` IS the transformer's return value** (the server wraps it in `result`; the runtime unwraps it). Storage fetch without one: `['data']['objects']` |
| page variable | `{{ var_x['value'] }}` | set with `setPageVariable`; functions: `{{ var_x['setValue'] }}` in scripts |
| page input | `{{ pageInputs['entity_code'] }}` | declared in `inputSchema`; arrive as URL query params |
| block state | `{{ b_select['value'] }}`, `{{ b_form['data']['field'] }}`, `{{ b_table['context']['currentRow']['x'] }}` | the block must have a known id |
| repeatable row | `{{ b_rep['context']['item']['field'] }}` | inside the Repeatable's item template (also inside its events) ✅ |
| custom component event | `{{ code }}` | keys of the object the component passes to `emitOnChange` ✅ |
| user / env | `userContext['name']`, `userContext['id']`, `location`, `envVariables`, `sessionStorage`, `localStorage`, `utils[...]` | |

Arrow functions, `?.`, `??`, template logic all work: `{{ (e_x['data']?.['rows'] || []).filter(r => r.v < 80).length }}`.
**Keep a space before the closing `}}`** when the expression itself ends with `}` (`{{ { a: 1 } }}`).

## Events and actions ✅

`events: [{id, eventType, action, targetId?}]`; `action: {id, actionType, executionType:'delay',
payload, onSuccessActions?, onErrorActions?, runCondition?, delayDuration?}`. In `ua_cfg.js`:
`events: { onClick: [A.goto(...), A.when(A.runDs(id), C.eq("{{ ... }}", 'x'))] }`.

| Action (`A.*`) | actionType | Verified |
|---|---|---|
| `setVar(varId, value)` | setPageVariable | ✅ |
| `runDs(dsId)` | controlDataSource `trigger` | ✅ |
| `goto(pageId, pageInputs)` | navigateToPage | ✅ (inputs → `?key=value`) |
| `modal(id,'show'/'hide')`, `drawer(id, …)` | controlModal / controlDrawer | ✅ |
| `method(blockId, name, payload)` | controlBlockMethod — `submitMessage` on a Copilot, `submitForm`, `updateState`… | ✅ submitMessage |
| `notify(title, type)` | showNotification | ✅ |
| `copy`, `download`, `url`, `script`, `fn`, `emit`, `setUrl`, `session`, `local` | copyToClipboard, downloadFile, navigate, executeScript, triggerFunction, emitPageEvent, setURLParameters, setInterfaceSessionStorage, setLocalStorage | 👁 |
| `then(a, …next)`, `fail(a, …)`, `when(a, cond)`, `delay(a, ms)` | onSuccessActions / onErrorActions / runCondition / delayDuration | ✅ then, when, delay |

Page load: `onLoad: [actions]` → `interactions.events[{eventType:'onPageLoad'}]` ✅. Full catalogue of
30 action types and 60+ event types with real payloads: `references/actions-events-catalogue.md`.

## Data sources ✅

Any workflow-builder action can back a data source — storage (Objects), `callables_call_automation`,
`custom_http_endpoint_execute`, Gmail/OpenAI/… with `context.connectionId`, `code_by_unifyapps_*`,
analytics. `references/data-sources.md` has the recipes; the harvest of 677 real ones is in
`references/datasource-catalogue.md`. Key rules:

- **Transformer** (`options.transformerConfig`, JS, runs server-side, input `data`): flatten
  `objects[].properties`, compute KPIs and chart rows once instead of in every block. ✅
- **Make one data source wait for others with `advancedOptions.queryDisabled`** (a condition) and
  `runBehaviour:'automatic'` — `cfg.createDs({..., disabledWhen: C.eq("{{ !(ready) }}", 'true')})`.
  ⛔ An `onPageLoad` chain *runDs(A) → then runDs(B)* evaluates B's inputs **before A's data is in the
  store** — the LLM received empty arrays and reported "no data". ✅ the gated version runs once when
  data lands and again whenever it changes (e.g. after a scenario).
- `callbacks.successEvents / failureEvents` run actions after the call (refresh, notify, close modal) ✅.
- Storage filters use `properties_<field>` (underscore) or `id`; `C.and(C.eq('properties_x', '{{ … }}'))` ✅.
- HTTP: `baseUrl` + `path` + `queryParamsList:[{key,value}]` — a single `url` fails
  "Base URL must start with http(s)" ✅.
- Execute server-side to test: `cfg.runDs(dsId, {'parameters.x': 'v'})` → `POST /api/workflow/execute/node` ✅.

## Components — what to reach for ✅

`references/components.md` is the cookbook (layout, style tokens, dark bands, every block the
sample uses, pitfalls). `references/component-catalogue.md` lists all ~130 types seen in real apps
with their keys and one real block each. The builder offers 287: 100 built-in, 143 template
components, 44 custom components (on UAT).

Non-obvious and verified:
- **`appearance.theme: 'dark'` on a Stack** re-themes everything inside it — the command-centre hero.
- **Modal / Drawer blocks stay `visibility: true`**; open/closed is their own state. `visible:false`
  removes the block and `controlModal show` then does nothing. ⛔ → ✅
- **Drawer with inline content = `content.variant:'card'`** (+ `defaultHeight:'h-full'`). `'page'`
  renders another page (`content.pageId`) and shows an empty panel for a body slot. ⛔ → ✅
- **Copilot needs a `CopilotInput` block in its `messageInputPanel` slot**, or it renders a header
  and no input box. Its send button runs `controlBlockMethod(copilotId,'submitMessage',{message})` —
  **so any button can ask the agent a question** (chat with the data, config-native) ✅.
- Conditional colours: `appearance.color = {defaultValue, conditionalValueFilters:[{propertyValue,
  conditions}]}` ✅. `EXISTS` is true for `''` — test `{{ !!var_x['value'] }}` EQUAL 'true' instead ✅.
- Icons are Untitled-UI names: `Home02 Cube02 MessageSmileSquare Settings04 Stars02 Zap Plus
  AlertTriangle RefreshCcw01…` — an unknown name renders nothing (no error) ✅.
- **Charts: `cfg.chartX(data, {type, x, series…})`** covers LINE, AREA, COLUMN, BAR, STACKED_COLUMN,
  PIE/DONUT, DUAL_AXES, RADAR, WATERFALL (bars are relative deltas), BUBBLE, HEATMAP ✅. ⚠️ HEATMAP's
  NESTED data is grouped **by column** (`[{month, data:[{entity, value}]}]`); grouped by row the grid
  collapses into one tile.
- **Global data sources cannot read page state** (2026-09-25 ⛔→✅): a source on `e_global_<app>` evaluates
  `{{ var_x }}` / `{{ b_x }}` in the global scope → parameters arrive empty. Bind page state only on
  page-level sources (`ensureDs` with `pageId`). Row actions, `htmlAttributes` (aria-label / heading roles),
  `setValue` on TextArea (not CopilotInput), always-modal Drawers, the Copilot's native starters and
  `?<blockId>-chatId` URL key, measured spacing tokens: `references/components.md` §"Verified 2026-09-25".
- **Tabs panels render only in a visible page** (the runtime wraps each in `DeferredRender`): a
  background/hidden tab shows the tab bar and empty panels. Check visibility before the JSON ✅.
- Per-row templates: Repeatable/Kanban keep theirs in `content.blockId`; **Timeline needs
  `type:'custom'` + a `timelineItem` slot** (else 0 px); Stepper steps need `level/subTreeDepth/path/
  subSteps` (else nothing) ✅. State keys and event names per component: `references/components.md`.

## Custom components ✅

A plain ES module that sets `window.renderComponent = props => …` and draws into
`#ua-custom-block` inside a srcdoc iframe. props: `data` (the block's evaluated `content.data`),
`emitOnChange(ctx, payload)` (ctx keys become `{{ key }}` in the onChange handler), `emitOnClick`,
`state` / `updateState`, `mode`, … Package **`out.json`** (the manifest: name, type, main, style,
icon, keywords) + the `.es.js` + `.css` in a ZIP and upload it at
`/p/0/interfaces/custom-components/create` (Production). The upload flow, the API behind it,
development mode (manifest URL) and three dependency-free examples (`assets/custom-components/`:
PulseMap, PulseGauge, PulseHeatmap) are in `references/custom-components.md`. The upload dialog can be
driven unattended (open `/create` by URL, set inputs, attach the ZIP, Add twice) ✅.

## Documents: upload in the app → workflow → object → agent ✅

`FileUpload` uploads on drop; `{{ b_up['files'][0]['source'] }}` (**not** `key`) is the storage key.
A manual automation data source passes it to a workflow whose `CALL_INTERFACE_WORKFLOW` node
`__ua__call_ocr_extraction` reads the file (`files:[{fileObject:{source, sourceType:'CLOUD_STORAGE',
name, fileType}, mimeType}]`, a TEXT_EXTRACTION model, a JSON prompt); Groovy parses; storage writes
the record; the page lists it, shows the analysis and the PDF (`PDFViewer` on `files[0].url`), and turns
recommendations into records. For a one-off question, `cfg.copilot(…, {attachments:true})` lets the
user attach the file to the agent directly. Full recipe and traps: `references/documents.md`.

## Golden rules

1. **Shared tenant: read anything, write only what you created.** Prove ownership of an app
   (`ownerUserId` vs `user-context` `user.id`) before touching it. Prefix your objects (`<uc>_`;
   the sample in `examples/cgb-pulse/` uses `cgbp_`).
2. **Never enter credentials.** Private apps show their own login — the user signs in.
3. **Don't copy another app's records into yours** — generate synthetic data (the harness blocked a
   copy of one customer app's records into another, rightly; `examples/cgb-pulse/seed.js` generates instead).
4. **Publish after every new data source**, and verify on the preview URL, reading text and
   network — a 200 from `hierarchical` proves nothing about rendering.
5. **Send full bodies on update** (`entity/update`, hierarchical `UPDATED`).
6. When blocked twice, look at how the 2,203 real pages do it (`references/*-catalogue.md`) before
   guessing a third time — every fix in this skill came from a real example.
7. **Sellable, not a prototype** (hard rule at the top): every part production-grade; platform-hosted
   data is the only allowed shortcut, and it is still real or neutral, never invented.
8. **The design & UX pipeline is not optional** (`references/design-quality-pipeline.md`): direction
   and product-design decisions before the theme, per-page audits during, a11y + verification on the
   preview before and after each publish, every skill named in the report. The user chooses only how deep Phase 3 verification
   goes (test mode, playbook `build-options.md`). You never lower it yourself.

## Files

| Path | What |
|---|---|
| `scripts/pack_component.py` | ZIP a custom component folder (checks `out.json`) + a snippet that attaches it to the upload dialog ✅ |
| `scripts/ua_cfg.js` | **the builder library** — block DSL with dependency extraction, actions/conditions, pages, data sources (`ensureDs`), theme, app, nav, publish, `runDs` ✅ |
| `references/anatomy.md` | the object model in depth: app, pages, blocks, dependencies, variables, inputs, functions, page events, global page |
| `references/components.md` | component cookbook + layout/style tokens + pitfalls |
| `references/data-sources.md` | data sources and connectors: recipes, transformer, gating, callbacks, execution, errors |
| `references/custom-components.md` | runtime contract, `out.json`, ZIP upload (automated), dev mode, the API, the three samples |
| `references/documents.md` | file upload → OCR/LLM workflow → object → UI → agent; chat attachments |
| `references/theme-nav-publish.md` | themes, navigation, domains, publish, preview, security |
| `references/design-quality-pipeline.md` | **mandatory** design/UX/a11y pipeline (Phase 0 direction → 1 UX decisions → 2 build → 3 verify → 4 report) and which sibling skill runs at each step |
| `references/*-catalogue.md` | harvested real shapes: components, actions/events, data sources, page structures |
| `references/connect-and-call.md` | sign in with your own account; API conventions |
| `assets/custom-components/pulse-map/` | choropleth of Qatar's real municipalities (geoBoundaries, baked in by `build_geo.py`), emits onChange |
| `assets/custom-components/pulse-gauge/`, `pulse-heatmap/` | radial KPI gauge; clickable entity × month grid |
| `examples/cgb-pulse/` | the complete sample: seed, platform definitions, page builders (`build-pages.js`, `build-pages-v2.js` for Studio + Documents), saved pages, ids, a synthetic test PDF generator |
