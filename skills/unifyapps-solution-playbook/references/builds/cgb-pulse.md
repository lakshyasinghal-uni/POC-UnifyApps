# CGB Pulse, config (no-code) app

Sources: transcript `277641ed…jsonl` (23 Sep 2026, 06:47 to 10:31). There is no app repo. The build
lives as the worked example `${CLAUDE_PLUGIN_ROOT}/skills/unifyapps-config-apps/examples/cgb-pulse/`
(README, `ids-orbit-uat.json`, `platform/`, `pages/`). App `cgb-pulse`, private, v11, map component v2.

## 1. Customer & brief

The customer context is the same as Sharek (CGB Qatar), but the brief was a *learning build*.
Maher asked Claude to master config apps end to end — components, custom components, connectors,
events and UI — by building "a smaller version of the CGB app" while he was away, and to turn what
it learned into a new skill.

Round 2 asked for three things:
- use far more prebuilt blocks (cards, charts);
- prove that custom components can be built and used;
- show a document uploaded in the app flowing to a workflow and to an agent.

**Personas:** the CGB executive and entity-head audience on screen. The real users were future
builders (Claude and SCs) who needed a proven config-app recipe.

## 2. What was built

- **Objects (7), all synthetic:**
  - Five cloned from Sharek's schemas: `cgbp_entity` (12), `cgbp_region` (8, real centroids),
    `cgbp_kpi` (168 = 12 months), `cgbp_voice` (420) and `cgbp_scenario` (6). That is 614
    records, counting 12 seeded actions.
  - `cgbp_action`, which the app writes to.
  - `cgbp_document`, added in round 2.
- **Automations (4):**
  - `cgbp_query` (the agent tool), `cgbp_ai_insights` (LLM ranked findings, each with one bound
    action) and `cgbp_apply_scenario` (exact reset). All three were cloned from Sharek in about
    10 min.
  - `cgbp_ingest_document`: create the record, then OCR (`__ua__call_ocr_extraction`, a
    TEXT_EXTRACTION model), then Groovy parse, then bulk-upsert. About 39 s.
- **Agent:** *CGB Pulse Analyst*, with one QueryData tool and one task. It knows `cgbp_document`
  and reads files attached in the chat.
- **Data sources:**
  - 5 global ones: entities, regions, trend, scenarios, and Doha weather, which calls a public
    HTTP connector straight from the data source with no automation.
  - 14 page-level ones.
- **Theme:** maroon `#8A1538` with champagne `#B08D57`.
- **Pages and their signature components:**
  - **Command Centre:** a dark hero with glass StatCards and the **PulseMap** custom component
    (click → region panel). Insight cards sit in a Repeatable, and one button per card switches
    its action by `runCondition`.
  - **Performance Studio:** a ButtonGroup over 4 **PulseGauge** dials (click → asks the agent);
    Tabs holding COLUMN, RADAR, WATERFALL, BUBBLE, DUAL_AXES, AREA, HEATMAP, DONUT and
    STACKED_COLUMN; **PulseHeatmap** (cell click → KeyValue + LINE); and Kanban, Timeline,
    Stepper, Calendar and AvatarGroup.
  - **Entities:** a table whose row select opens the Entity detail page (`pageInputs`).
  - **Citizen Voices:** filtered by `?entity_code=`.
  - **Documents:** FileUpload → ingest workflow → library → Analysis, PDFViewer and extracted text
    → "Raise as action".
  - **Control Room:** set variable → run automation → refresh the globals; the reset is exact.
  - **Analyst:** auto-asks `?question=`.
  - "Ask about this" on every card opens the Copilot drawer (with attachments) through
    `controlBlockMethod('submitMessage')`.
- **Custom components (3):** plain JS and CSS plus an `out.json` manifest. They were uploaded by a
  scripted run of the builder dialog.
- **Research base:** a read-only harvest of 252,982 blocks from 80 real config apps, which became
  the catalogues.

## 3. Build sequence actually followed

About 2.5 h of active work: round 1 about 1 h, round 2 about 50 min, map v2 about 20 min.

1. **Learn first.** Read the memory, the skill and the spec. Harvest real apps' blocks, actions
   and data sources, and watch the custom-component upload's network traffic.
2. **Data.** Clone the schemas under `cgbp_`. Paste the deterministic generator into the tab,
   because copying Sharek's records was blocked.
3. **Clone the three automations.**
4. **Write the builder library** `ua_cfg.js`, a DSL that computes the dependency bookkeeping.
5. **Theme, app, `defaultPageId`, then empty pages.** Register them, then **publish the scaffold**
   to prove the create path.
6. **Global data sources.** The HTTP connector's URL field was fixed here.
7. **PulseMap:** build, pack and upload. This is where the `out.json` name was discovered.
8. **Agent, then pages.** Republish for the new data sources.
9. **Preview QA.** Fixed binding paths, `queryDisabled`, the modal form, the drawer variant and
   the CopilotInput.
10. **Export and document.** Pages and platform JSON went into the example, then the skill and
    API-SPEC §29, then a secret scan, then a commit.
11. **Round 2:**
    - research the OCR node;
    - build the gauge, the heatmap, `cgbp_document`, the ingest workflow and a synthetic PDF;
    - build the Studio and Documents pages;
    - QA fixes: Stepper/Timeline shapes, heatmap grouping, and a hidden-pane "empty Tabs" false
      alarm;
    - `documents.md`, API-SPEC §32, and a rebuilt `ua-skills.zip`.
12. **Map v2.** Real geoBoundaries shapes (`build_geo.py`) with callouts for small areas, uploaded
    through **New Version**. The app picked it up without a republish.

## 4. Praise and corrections

- "great, make sure you are creating a skill for it". The round-1 app was accepted, and the skill
  was the deliverable he cared about. **Response:** `unifyapps-config-apps` was registered, pushed
  and bundled in `ua-skills.zip`.
- "i want you to utilize the prebuilt components more and more". Round 1 under-used native blocks.
  **Fix:** Performance Studio, with 11 native chart types and about 25 other native blocks, plus
  an on-page inventory card.
- "the map looks off in the Service satisfaction by municipality". The first map was bubbles on
  an abstract field, with labels colliding.
- "i want it to be the map of Qatar itself". **Fix:**
  - a real ADM1 choropleth with a ramp against the 80% target;
  - a clickable ranked list beside it and a white outline on the selected municipality;
  - a CC-BY credit;
  - shipped as v2 with no republish.

He also asked whether custom components really worked, then asked to be shown them. A live pane
walk-through of the library and all three components settled it.

## 5. Reusable assets (under `${CLAUDE_PLUGIN_ROOT}/skills/unifyapps-config-apps/`)

| Path | What | Documented in |
|---|---|---|
| `scripts/ua_cfg.js` | block DSL: dependency extraction, `chartX` (12 types), FileUpload/Kanban/Timeline/Stepper/attachments helpers, `ensureDs`, publish | config SKILL §How to build one |
| `scripts/pack_component.py` | ZIP a component (checks `out.json`) plus a dialog-attach snippet | `references/custom-components.md` |
| `assets/custom-components/pulse-map/` (+ `build_geo.py`), `pulse-gauge/`, `pulse-heatmap/` | three production custom components that emit `onChange` | same |
| `examples/cgb-pulse/seed.js` | deterministic generator | example README |
| `examples/cgb-pulse/build-platform.js`, `platform/*.json`, `scenario_calc.groovy` | recreate the objects, 4 workflows and the agent in any tenant | example README |
| `examples/cgb-pulse/build-pages.js`, `build-pages-v2.js`, `pages/*.json` | the 8 pages as code, plus the stored JSON | example README |
| `examples/cgb-pulse/make_test_document.py` | synthetic PDF for the document flow | `references/documents.md` |
| `references/*-catalogue.md` | harvested real shapes | config SKILL rule 6 |

## 6. New pitfalls and lessons not already in the skills

Already in `unifyapps-config-apps`:
- `defaultPageId`; read data through `ds['data']`; `queryDisabled` gating;
- a hidden Modal never opens; drawer `variant:'card'`; CopilotInput;
- `out.json`; NESTED heatmap data; Tabs blank in a hidden pane;
- FileUpload's file reference is `source`, not `key`; Stepper/Timeline shapes;
- CSP blocks localhost; no copying another app's records;
- publish after a new data source; a component version needs no republish.

New:
- **An unregistered page slug silently falls back to home.** **Fix:** register every page, test
  pages included, with `nav:false`.
- **Re-pasting a 75 KB in-tab library wastes context.** Navigation wipes it too. **Fix:** use one
  "seed" tab for API work and a separate UI/preview tab. Re-evaluate only the changed functions
  from source, after a Node dry-run of the canonical file.
- **A config app has no repo.** **Fix:** after every change, export the pages, workflows, agent
  and ids to a versioned folder (the `examples/cgb-pulse/` pattern, or `unifyapps-backup-restore`
  for customer builds). Run a secret scan before each commit.
- **The bubble "map" was rejected on sight.** The real-shape rule lives only in the code-app skill
  (ai-app-patterns §7). **Fix:** start every config map from `pulse-map/build_geo.py`: real ADM1
  rings, small-area callouts, a credit, and a ranked list beside it.
- **A capability claim made in text was not enough.** **Fix:** after claiming something works,
  open it live in the pane and walk through it.
- **The first pass under-used native blocks.** **Fix:** reach for a native block first. Build a
  custom component only for what natives cannot draw (a real map, a gauge with a target, a
  clickable grid).
- **The published private host was never checked past its login.** **Fix:** list "Maher signs in
  once on the published host" as an explicit open item in the report.
- **This build predates the design-quality pipeline (25 Sep).** No design slug, a11y scan or
  product-design pass is recorded. **Fix:** a rebuild from this example must run config SKILL
  steps 0 and 9.
- **The data is invented.** That is acceptable only for a learning sample. **Fix:** customer reuse
  needs real or neutral data, or a dataset Maher explicitly asked to be generated.

## 7. Use this build as the reference for:

No-code (config) dashboards and command centres that customers or SCs maintain: native charts and blocks, custom JS components (map, gauge, heatmap), document upload →
OCR/LLM → object → agent, a control room with exact reset, and chat-with-data on every card.
