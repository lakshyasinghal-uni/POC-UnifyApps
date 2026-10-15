# CGB Pulse — a complete config app, built over REST

A smaller, config-based take on the Sharek / CGB executive app: an AI-native command centre over
synthetic Qatar government-service data. Built end to end over the REST API on **orbit.uat,
2026-09-23**, every screen and interaction verified in the preview (published v11).

| | |
|---|---|
| App | `cgb-pulse` — owner Maher (109790) |
| Preview (Orbit session) | https://orbit.uat.unifyapps.com/p/0/interfaces/cgb-pulse/preview/command-centre |
| Builder | https://orbit.uat.unifyapps.com/p/0/interfaces/cgb-pulse/builder/command-centre |
| Published (private — sign in) | https://cgb-pulse-orbit.matrix-uat.unifyapps.com |
| All ids | `ids-orbit-uat.json` |

## What it contains

| Layer | Items |
|---|---|
| Objects (614 records, synthetic) | `cgbp_entity` 12 · `cgbp_region` 8 (real municipality centroids) · `cgbp_kpi` 168 (12 months) · `cgbp_voice` 420 · `cgbp_scenario` 6 · `cgbp_action` (12 seeded by `cgbpActions()` + written by the app) · `cgbp_document` (written by the upload workflow) |
| Automations | `cgbp_query` (generic read, agent tool) · `cgbp_ai_insights` (LLM → ranked findings with one bound action each) · `cgbp_apply_scenario` (Groovy deltas + exact baseline reset) · `cgbp_ingest_document` (uploaded file → OCR/LLM → `cgbp_document`) |
| Agent | *CGB Pulse Analyst* — one `QueryData` tool, one task; knows `cgbp_document` and reads chat attachments |
| Custom components | *CGB Pulse Map* (`PulseMap`) — SVG of Qatar, click → `onChange({code})` · *CGB Pulse Gauge* (`PulseGauge`) — radial KPI dial, click → asks the agent · *CGB Pulse Heatmap* (`PulseHeatmap`) — entity × month grid, cell click → detail card |
| Theme | maroon `#8A1538` + champagne `#B08D57` |
| Pages | Command Centre · **Performance Studio** · Entities · Entity (detail, `?entity_code=`) · Citizen Voices (`?entity_code=`) · **Documents** · Control Room · Analyst (`?question=`) |
| Data sources | 5 global (entities, regions, trend, scenarios, Doha weather over HTTP) + 14 page-level |

## Patterns it proves (all ✅)

- Dark hero via `appearance.theme:'dark'`, glass KPI tiles via block CSS.
- JS transformers shaping records into KPIs, chart rows and map data.
- An LLM automation as an **automatic data source gated with `queryDisabled`** until its inputs exist;
  it re-reads after every scenario.
- Insight cards (Repeatable) whose one button runs different actions by `runCondition`
  (`open_entity` → navigate with page input, `focus_region` → set variable, `ask_agent` → docked chat).
- Custom component → `onChange` → page variable → conditional panel.
- Table row select → detail page with `pageInputs`.
- Modal + Form → create-record data source → success callbacks (notify, refresh, close).
- Control room: button → set variable → run automation → refresh three global sources; exact reset.
- **Chat with the data**: a Drawer with the Copilot; "Ask about this" on every card and on the map
  panel opens it and submits the question via `controlBlockMethod('submitMessage')`. The Analyst page
  auto-asks `?question=` on load.
- Public HTTP connector call (open-meteo) straight from a data source.
- **Performance Studio** (`build-pages-v2.js`): a ButtonGroup-driven metric band over four PulseGauges;
  Tabs with COLUMN, RADAR (entity picker), WATERFALL, BUBBLE, DUAL_AXES, AREA, native HEATMAP, DONUT,
  STACKED_COLUMN; the PulseHeatmap → page variables → KeyValue + LINE; Checkbox filter over a Repeatable
  of Rating + ProgressBar; Stepper, AvatarGroup, Toggle, Kanban with conditional card colours,
  Timeline, Calendar; a collapsible Card listing every component on the page.
- **Documents**: FileUpload → `ds_ingest_document` → `cgbp_ingest_document` (OCR + LLM, ~40 s) →
  `cgbp_document`; library Table, analysis tabs (summary, key points, risks as Alerts, metrics,
  recommendations with *Raise as action*), the uploaded PDF in a PDFViewer, extracted text; the
  analyst dock accepts attachments and is asked about the selected document. Recipe:
  `references/documents.md`. Test file: `python make_test_document.py` (synthetic).

## Files

| File | |
|---|---|
| `seed.js` | deterministic synthetic data (`cgbpGenerate`, `cgbpLoad`) |
| `platform/objects.json` | the six object schemas |
| `platform/workflow_*.json`, `platform/scenario_calc.groovy` | the three automations as deployed |
| `platform/agent.json` | agent properties, tool, task |
| `platform/theme.json`, `platform/custom_component.json` | theme and component entities |
| `build-platform.js` | recreate objects, automations and agent from `platform/` |
| `build-pages.js` | the six original pages and their data sources (`buildCgbPulse({APP, PG, DS, AGENT, WF, CC})`) |
| `build-pages-v2.js` | Performance Studio + Documents (`buildCgbPulseV2({APP, PG, DS, AGENT, WF:{ingest}, CC:{gauge, heatmap}})`) — needs the v2 helper section of `ua_cfg.js` |
| `platform/workflow_ingest_document.json` | the document workflow as deployed |
| `make_test_document.py` | generates the synthetic *Labour Services — Q3 2026 Service Review* PDF (reportlab) |
| `pages/*.json` | the saved page entities exactly as the platform stored them (reference JSON) |
| `ids-orbit-uat.json` | ids on orbit.uat |

## Rebuild (another tenant or a copy)

In a signed-in tab: paste `scripts/ua_cfg.js`, `seed.js`, `build-platform.js`, `build-pages.js`, then

```js
const { WF, AGENT } = await buildCgbPulsePlatform(P);            // P = the platform/*.json contents
await cgbpLoad(cgbpGenerate());
const th = await cfg.createTheme({ name: 'CGB Pulse', brand: '#8A1538', secondary: '#B08D57' });
await cfg.createApp({ appId: 'my-pulse', name: 'CGB Pulse', themeId: th.id, host: 'orbit.matrix-uat.unifyapps.com' });
// empty pages -> ids (cfg.savePage), then cfg.registerPages(...)
const DS = await buildCgbPulseGlobals('my-pulse');                // the five global data sources
await buildCgbPulse({ APP: 'my-pulse', PG, DS, AGENT, WF: { insights: WF.insights, scenario: WF.scenario }, CC: { id, type: 'PulseMap' } });
await cfg.publish('my-pulse');
```

Upload the custom component ZIPs from `assets/custom-components/` first (see
`references/custom-components.md`); `CC.id` is the `e_custom_component` it creates. For the v2 pages,
create two more empty pages (studio, documents), register all eight, then

```js
await buildCgbPulseV2({ APP: 'my-pulse', PG, DS, AGENT, WF: { ingest: WF.ingest },
  CC: { gauge: { id: GAUGE_ID, type: 'PulseGauge' }, heatmap: { id: HEATMAP_ID, type: 'PulseHeatmap' } } });
await cfg.publish('my-pulse');
```
