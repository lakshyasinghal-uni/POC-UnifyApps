# Sharek Executive Intelligence (CGB Qatar), code app

Sources: transcript `426fd237…jsonl` (22 to 25 Sep 2026), repo `mmaheranwar/sharek-executive-intelligence`
(`DEMO.md`, `tools/automations/README.md`, `app/src/App.tsx`). App `app-dcf4fe771575`, public, v19 at `41f0e23`, tagged `DEMO_READY`.

## 1. Customer & brief

The customer is CGB Qatar (Civil Service & Government Development Bureau). The customer's team
had a static Cloudflare Workers prototype: nine routes of mock JSON, with every figure labelled
VERIFIED or ILLUSTRATIVE. Maher asked for it to be rebuilt on Orbit UAT as a working product:
- AI agents over Data Objects, plus a large, realistic dataset;
- actionable AI insights and `ua-chart` charts;
- a real interactive Qatar map, and a demo control page that changes the data live;
- a luxurious, light, slightly Qatari design;
- innovation beyond the wireframe, with no questions asked.

**Personas:** CGB leadership (President / DG), entity heads, the strategy and performance office,
and the demo presenter.

## 2. What was built

- **Data:** 14 Data Objects holding 7,998 records (up from 13 objects and 590 in pass 1):
  - 12 entities, 8 municipalities, 28 service centres at real lat/lon, 252 officers;
  - categories, channels, topics, 2,600 bilingual comments and app reviews;
  - 5,016 KPI snapshots (24 months for every scope and metric);
  - insights, interventions, 19 scenarios and 7 stories.

  They are read through 5 storage bindings (FETCH, FETCH_ONE, CREATE, UPDATE, DELETE).
- **Automations (6), each exposed as an `e_data_source`:**
  - `sharek_query` and `sharek_metric_trend` are the agent tools.
  - `sharek_write_insight` runs behind an approval.
  - `sharek_apply_scenario` applies a scenario or does an exact reset.
  - `sharek_ai_insights` is an LLM step over the rows on screen, about 19 s.
  - `sharek_refresh_insights` is a Groovy rules engine that re-derives the risks, achievements,
    actions and brief from the records.
- **Agents (3):** Executive Analyst, Issue Detector and Communications Advisor. They share the
  tools QueryData, MetricTrend and RecordInsight (with approval), and answer with `ua-chart` fences.
- **Routes and their signature components:**
  - `/`: `IndexRadial` (animated index plus six weighted dimensions) and a decision board that
    pairs each risk with its action by shared evidence.
  - `/entity-performance`: a quadrant, the entity against its cluster, and a radar.
  - `/citizen-experience`: `BubbleMatrix` and a comment feed.
  - `/employee-quality`: officer matrix. `/social-intelligence`: topics and verified store ratings.
  - `/qatar-map`: `QatarMap` (geoBoundaries ADM1, 8 heat metrics, centre pins, zoom, RTL).
  - `/ai-decision-center`: the full-size agent and a capacity ranking.
  - `/interventions`: before/after series cut at the start date.
  - `/control-room`: 19 levers in 5 families, reset, re-derive, and 7 stories (`StoryBar`).
  - The Methodology and "Built on UnifyApps" pages were deleted.
- **AI features:**
  - An `InsightPanel` band on every screen: 2 to 4 findings, each with evidence chips, an optional
    chart, one whitelisted action and "Dig into this".
  - An `AgentDock` beside every screen, running in the copilot island.
  - Every chart asks the agent (`setChartAgent`, registered once).
  - Lineage chips instead of the "illustrative" badges.
  - Full EN/AR with RTL.

## 3. Build sequence actually followed

About 6.5 h of active work in three sittings.

1. Study the prototype (4 min).
2. App, repo and map module (`tools/build-map.py`).
3. Global page, 5 storage bindings, 13 schemas, then the seed from the signed-in tab. The app
   token returns 401, so seeding had to run there.
4. Theme, hooks and pages. Publishing the scaffold unblocked the SDK.
5. Automations and their data sources, then the agents.
6. The LLM insight engine, the copilot island (built locally) and the Control Room.
7. Republish, because the new data sources were invisible until then.
8. Skill assets and API-SPEC §26.
9. Publish, and fix the island's tensor/srcdoc problem (v8). Day 1 ended here, 2 h in.

Day 2 (about 4.5 h):
10. The rules engine, then an Overview rewritten to lead with decisions, then `IndexRadial`.
11. Data scaled to 7,998 records with committed generators, plus 19 scenarios, 7 stories,
    chart-to-agent and a UX audit.
12. Automation export to the repo.
13. QA: agent charts, island cache, the agent deploy trap, lint and i18n (v16).
14. Demo pass: a 10-question agent battery, a sweep of all 19 scenarios, and `DEMO.md` (v19).

25 Sep: the description paragraph and the `DEMO_READY` tag, applied after the final publish.

## 4. Praise and corrections

There was no explicit praise. He accepted it by asking for the `DEMO_READY` tag and a
commit-and-push.

- "why you are putting "Illustrative" everyywhere": the data lives in objects. He wanted live AI
  and an agent on every page, and the Methodology and "Built on UnifyApps" pages made no sense to
  him. **Fix:** lineage chips, an insight band and dock everywhere, and a Control Room in place of
  both pages.
- "it is too long, it need to be more into point with more visuals": said of the Overview, where
  the risk and action text had been authored at seed time. **Fix:** a rules engine that derives
  the text from records, and a decision board that leads the page.
- "the main animation with 83 is look very basic". **Fix:** `IndexRadial`, where each arc's
  thickness is its dimension's weight. It was enlarged later.
- "UI is not correct and overlapping in the agent chat": the starters were painted over the
  answer. **Fix:** hide them on any of three independent signals. The same pass fixed the ring,
  which drew nothing under reduced motion.

## 5. Reusable assets (repo paths)

| Path | What | Documented in |
|---|---|---|
| `app/src/components/charts/*` | `ua-chart` with palette, agent hook and drill | `unifyapps-apps/assets/ua-chart`, ai-app-patterns §4, §11 |
| `components/sharek/InsightPanel.tsx`, `data/insights-live.ts` | insight band and hook | `assets/ai-insights`, §2 |
| `AgentDock.tsx`, `lib/agent-dock.ts`, `copilot-host.tsx`, `src/copilot-island/*`, `app/island/`, `vite.island.config.ts` | dock and prebuilt island | `assets/agent-dock`, code-apps §island |
| `components/sharek/IndexRadial.tsx` | index plus dimensions ring | **not packaged** |
| `components/sharek/QatarMap.tsx`, `tools/build-map.py`, `data/qatar-geo.ts` | build-time projected map | §7 (no asset) |
| `components/sharek/StoryBar.tsx`, `lib/story.ts` | story runner | §10 (no asset) |
| `BubbleMatrix.tsx`, `Figures.tsx`, `kit.tsx` | quadrant, radar, sparkline, page kit | code-apps §"Clone the app SHELL" |
| `routes/ControlRoom.tsx`, `data/actions.ts` | levers, apply then refresh, reset | §5 |
| `data/bindings.ts`, `data/datasources.ts` | storage bindings and id registry | code-apps §Object CRUD |
| `lib/palette.ts` | 5-step ramp tuned for cream paper | not documented |
| `tools/objects.js`, `tools/seed-1…4-*.js`, `smoke.mjs`, `tools/automations/export.js` + `*.groovy` | schema, generators, smoke test, automation export | code-apps §"Export the platform layer AND the seed" |
| `DEMO.md` | presenter run sheet | **not documented** |

## 6. New pitfalls and lessons not already in the skills

Already covered by ai-app-patterns §1 to §14 and code-apps:
- a data source created after publish is invisible;
- srcdoc gives an opaque origin; fetch the island with `no-store`;
- rAF and hidden-document failures;
- truncating `limit`s at scale;
- Tailwind `padding-block`;
- scenarios must SET, not add; the baseline carries prose;
- the `saveAndDeploy` stale-deploy trap.

New:
- **Publishing wipes tags and the description.** A code-app publish or any Code Builder turn
  does it. This is recorded in API-SPEC §47.2 only. **Fix:** as the last done-step, send
  `POST /api/entity/update {id, entityType, properties, tags, version}` *after* the final publish,
  then read it back.
- **The insight cache TTL is wrong in the skill.** It says 30 min. Sharek moved to 6 h: the key
  already hashes the screen, language and rows, so a longer TTL cannot go stale. The cache is also
  per browser. **Fix:** a TTL in hours, plus a warm-up step on the presenter's machine.
- **A demo run sheet is a deliverable.** `DEMO.md` holds:
  - a warm-up;
  - 4- and 12-minute paths (where / what to do / what to say);
  - agent questions with *measured* latency;
  - a symptom → cause → fix table;
  - a "what is real" statement.

  **Fix:** add it to the done-checklist.
- **Give measured latency, never an estimate.** The sheet first said 20–40 s; the real range was
  29–121 s, and a presenter would think the app had hung.
- **A mutation hook's shared `running/error` state swallowed a failed call.** It was the second
  call in apply→refresh. **Fix:** each call gets its own result, and the UI shows "re-derived: N".
- **In-tab builder helpers were never saved (`window.WF`).** **Fix:** commit them under `tools/`
  in the first hour.
- **History generated while a scenario was applied baked in the drift.** **Fix:** reset to the
  baseline first, and anchor the history on the earliest real point.
- **An absolute sentiment formula produced zero complaints.** **Fix:** set each comment's posture
  from the entity's position against the portfolio.
- **The browser pane restarted and logged the tenant out mid-build.** **Fix:** do repo-only work
  until Maher signs back in. Never sign in yourself.
- **The shell ate backticks in `git commit -m`.** **Fix:** use `-F file`.

## 7. Use this build as the reference for:

Executive and government performance dashboards across many entities and regions. It combines a
code app, a live AI band everywhere, a docked charting agent, a real geographic map, a scenario
control room with stories, AR/EN RTL, and a demo run sheet.
