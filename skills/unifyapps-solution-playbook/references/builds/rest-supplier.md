# Playbook source: Rest Supplier Intelligence (EY / Rest Super)

App `app-17f0ba4c8283` (orbit.uat, public, v16, tag `DEMO_READY`) · repo `mmaheranwar/rest-supplier-intelligence` · transcript `d047a72e…jsonl` (23 and 25 Sep 2026).

## 1. Customer & brief

Rest Super is an Australian profit-to-member superannuation fund; EY is the partner. The product is a third-party risk "control tower" under APRA CPS 230/234.

**Day 1 brief:** a fully functional app like CGB with real agents, a demo in 30 minutes, and no questions.

**Day 2 added EY feedback:**
- simulate Cyble, a threat-intel product the fund uses;
- EY's service-buyer review framework (KPI/KRI/performance reviews by tier);
- ten external signal feeds on the map;
- "External Suppliers & Industry Utilities" board metrics;
- APRA's 2026 themes: mapping material providers to critical operations, concentration, fourth-party and offshore exposure, agentic-AI risk, tested contingency, crisis exercises.

**Personas:**
- third-party risk lead / CRO (Command Centre, Resilience);
- service owner (Reviews, Contingency);
- board/risk committee (MI);
- EY advisor.

## 2. What was built

**Objects:** about 21 objects prefixed `rsi_`, roughly 12,700 records.
- Day 1: supplier 412 (with 12 months of history), signal 2,926, alert 38, treatment 14, critical_op 7, agent_run.
- Day 2 added:
  - simulated source systems `cyble_vendor` 155, `cyble_alert` 382 and `ext_feed_item`;
  - `signal_source` 11 and `sync_run`;
  - `fourth_party` 22 (real utilities: BECS, NPP, SuperStream, ASX CHESS…) and `dependency` 893;
  - `service` 506, `service_kpi` 4,800, `review` 1,236 and `issue` 605;
  - `incident` 96, `threshold` 6 (null = "TBC"), `contingency` 85 and `exercise`.

**Workflows (10):**
- `rsi_query` (compact fields) and `rsi_aggregate` (server-side counts and averages);
- `rsi_ai_insights` and `rsi_ai_writer`, both on GPT-4.1 mini;
- `rsi_create_treatment`;
- Cyble and feed syncs, each callable with a 15-minute scheduled twin;
- two hourly `SIMULATOR` emitters.

**Data sources:** 5 storage bindings plus 7 callables.

**Agent:** "Rest Supplier Risk Analyst" `e_6ab35e9e04beb12b3891957a`.
- Tools: QueryData, AggregateData, and CreateTreatment behind an approval card.
- Runs on Gemini Flash with `disableThought` on and a Flash `topicSelectionModel`.
- Instructions carry the identity line, a rule to check the user's numbers, and the `ua-chart` contract.

**Screens (13):** a grouped rail plus a Ctrl-K palette.

| Route | Signature component |
|---|---|
| `/` Command Centre | live thesis sentence, instrument strip, animated `WorldMap` with source layers + `SupplierWidget`, APRA scorecard |
| `/suppliers`, `/:code` | register; 360 with `Supplier360Extras` + AI assessment |
| `/signals` · `/sources` | feed search · Cyble panel (Sync now, field mapping, needs-mapping, history) |
| `/dependencies` | `DependencyMap` op → provider → shared platform/fourth party |
| `/resilience` · `/contingency` | scenarios + "record crisis exercise" · `PlanDetail`, test result, AI exit plan |
| `/reviews` · `/mi` | EY framework + AI `ReviewPack` saved to record · board metrics verbatim, thresholds TBC, AI commentary |
| `/alerts` · `/treatment` · `/ai` | triage · treatment board · Control Tower (AI run log, integration runs) |

**AI features:**
- An insight panel on every screen: 3 findings, about 5 s cold, instant on revisit.
- An ask icon on every tile, chart, row and AI result.
- A docked analyst that draws charts.
- One writer workflow for 8 narrative tasks.
- A governance log.

**Missing:** a full-size `/analyst` page, and executive stories.

**Demo film:** 9 min 48 s via demo-studio, "The score said low".

## 3. Build sequence and time

**Day 1 (about 3 h):**
1. 25 minutes were lost handing the brief to the Code Builder agent, on a colleague's app.
2. Restart: starter app and GitHub link.
3. Platform layer cloned from Sharek in about 10 minutes (3,397 records, 12 parallel writers).
4. v1 went live 75 minutes after the start.
5. Command-centre redesign and chat-with-data.
6. Fixes for the dropped first click and the starter overlay.
7. 13-scenario agent battery with 4 agent fixes.

**Day 2 (about 8.5 h):**
1. EY scope:
   - 17-object schema and seed;
   - sync and simulator workflows;
   - 5 screens built by parallel subagents from one `BUILD-BRIEF.md`;
   - read-merge-write fix.

   Result: v10.
2. Full redesign (`enterprise` slug, 4 parallel agents).
3. Map motion, the Motion switch, the move to GPT-4.1 mini and an accessibility pass: v13.
4. Rest identity and logo: v15.
5. Ticker removed (v16), then the film.

**In total:** about 11.5 hours, 21 commits and 16 publishes.

## 4. Praise and corrections

There was no explicit praise. Acceptance showed when he asked to make the app public, tag it `DEMO_READY` and film it.

- **Method:** "why u didnt crteate startter app and link with github…". He wanted a restart on the Maher Methodology, now written down as non-negotiable even under deadline.
- **Look:** "th UI is very poor", then on day 2 a request for a full redesign to wow standard.
  - Fix: a dark command centre, then an operations room: tokens first, grouped rail, Ctrl-K, and a live thesis instead of a slogan.
- **Chat overlay:** "still iverlapping, fix it once and for all agents and all embeddings".
  - Fix: the starters hide on first send, on typing, or once any text appears, using Sharek's logic in the shared component.
- **Industry:** "sales rep says it is Rest superannuation Not retirement".
  - Fix: swept code, records, prompts and agent, and put one identity line from rest.com.au in every AI prompt.
- **Other asks, all delivered:**
  - chat with data on every surface;
  - faster insights (Sonnet to GPT-4.1 mini, about 5 s);
  - loading animation;
  - map animation, which led to the Motion switch after the OS was found to be reducing motion;
  - ticker removed.

## 5. Reusable assets (under `app/src/` unless noted)

| Asset | Path | Documented in |
|---|---|---|
| Animated supply map | `components/rsi/WorldMap.tsx` | design-quality-pipeline "Map motion" |
| Map-click entity widget | `components/rsi/SupplierWidget.tsx` | ai-app-patterns §22 |
| Ctrl-K palette (entities, screens, "ask the analyst") | `components/rsi/CommandPalette.tsx` | redesign playbook §4 |
| Motion on/auto/off + pre-paint script | `lib/motion.ts`, `index.html` | ai-app-patterns "Animate by DEFAULT" |
| Read-merge-write writer | `data/rsi.ts` `useRecordWriter` | objects-and-connections "useRawPayload REPLACES" |
| Insight client with input caps | `data/insights-live.ts`, `components/sharek/InsightPanel.tsx` | ai-app-patterns §2 |
| Writer task catalogue + identity line | `data/ai-task.ts` | code-apps "One AI writer" |
| Sources/integration screen | `routes/Sources.tsx` | ai-app-patterns §22 |
| Periodic review with AI-drafted pack | `routes/ServiceReviews.tsx`, `components/rsi/service-reviews/ReviewPack.tsx` | **not documented** |
| Dependency trace (op → provider → fourth party) | `routes/Dependencies.tsx`, `components/rsi/dependencies/DependencyMap.tsx` | **not documented** |
| Board MI with verbatim labels + TBC thresholds | `routes/SupplierMI.tsx` | **not documented** |
| Copilot island (dark + border-box fix) | `copilot-island/`, `island/` | code-apps "island" |
| Demo film project | `demo/` (repo root) | demo-studio |
| Seed/schema generators, sync-workflow builder, timing and screenshot scripts | **only in the temp folder** `…\E--github-unifyapps-helper\d047a72e-…\scratchpad\rest\` (`seed2_schema.js`, `seed2_gen.js`, `wf_sync.js`, `*_timing.js`, `shots.js`) | SKILL.md "Export the automations into the repo": not followed here |

## 6. New pitfalls not already in the skills

- **Seed and workflow export are missing from the repo.** There is no `platform/` or `tools/` folder, and the scripts sit in a temp folder that can be cleaned.
  - Fix: add "`platform/` export + seed scripts committed and matching the tenant" to the SKILL.md done checklist; today it is only prose.
  - Copy these scripts into the repo now.
- **Template leftovers shipped:**
  - the root and app READMEs are the starter's generic text;
  - `PRODUCT.md` points to a `PLAN.md` that does not exist;
  - `data/seed.ts` still begins "Placeholder — REPLACE";
  - `components/copilot.tsx` is unused.

  Fix: a checklist line to overwrite the README with a project README (TAQA's is the model) and neutralise placeholders by editing. Don't delete them (no-delete rule); flag them instead.
- **Tags drop on every publish.** `DEMO_READY` and the description vanish on each publish or Code Builder turn. This is recorded only in API-SPEC §47.2. Fix: add "re-apply tags after the final publish" to the checklist.
- **A pull session that ends in `status: error` may still hold the commit.** Fix: check `/changes`, then publish directly. This is not in any skill.
- **Customer slides carry sample data.** EY's slides included sample numbers and vendor names. Fix: keep their labels verbatim, never their example figures, and show "TBC" where they left a value blank. INVENT NOTHING does not spell out "labels yes, samples no".
- **Simulators keep writing to shared UAT between demos.** Figures quoted in narration or test reports drift; two of the analyst's Cyble counts were off by one. Fix: re-verify quoted figures right before recording, or pause the emitters. §22 only says "pause when the real API is connected".
- **No `/analyst` full-size page,** which the app definition requires. Fix: add a checklist item.
- **Phone widths were not checked on day 2,** while the pane was hidden behind parallel agents. Fix: the playbook's headless `playwright-cli` pass at 375 px. It only works for public apps.

## 7. Use this build as the reference for:

Third-party / supplier risk, operational resilience (APRA CPS 230-style), vendor governance, and any control tower fed by external intelligence we cannot access (simulate the system, integrate for real); public demo app with a film.
