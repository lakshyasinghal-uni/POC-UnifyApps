# Deal Forecast — VEP Forecast Map for the CRO (reference build)

App `app-a5c1503f6a90` (a tile in Brain v2) · repo `mmaheranwar/sc-native-deal-forecast` · builders in `E:\github\SC-Companion\platform\workflows\` · built 2026-09-24/25 · transcript `a3012c10…`

## 1. Customer & brief

The customer is internal: UnifyApps' own CRO. The brief asked for a deal-forecast app built on the "VEP Excellence Training Q3-27" deck:
- the six Structural Levers, buyer zones and VEP stages from the deck;
- the look of the existing Forecast Map app, but "much better", animated and "smart";
- a forecast that visibly moves forward and backward;
- a Forecast Score, whose criteria arrived later as the CRO's Excel workbook;
- Brain v2 styling;
- HubSpot's new fields discovered live, with HubSpot strictly read-only and the HubSpot skill updated.

**Personas:**
- The CRO, who opens any deal to see its true state.
- SC Manager / Admin, the only roles that may edit the scoring model.
- Sales leaders, who ask the Forecast Agent through the Brain v2 supervisor.

## 2. What was built

**Objects**
- `scc_forecast_model`: the contract as records. 51 are active (36 contract + 15 stage-map). 21 older records were retired with `active=false`. The `kind` enum was extended.
- `scc_forecast_snapshot`: one row per open deal per day, about 605 rows a day.
- `scc_forecast_evidence`: the lever-evidence register. It exists because a loop does not collect its results.

**Workflows**
- `scc_hs_forecast_deals`: HubSpot search → owners → associations → companies → the shared Groovy ENGINE → scored deals plus `map_points`.
- `scc_hs_forecast_deal_history`: `propertiesWithHistory` replayed through the same ENGINE.
- `scc_forecast_insights` (Gemini Flash).
- `scc_forecast_model_update`: role-checked, requires a reason, audited.
- `scc_forecast_snapshot_page`: 100 deals in about 10 s.
- `scc_forecast_snapshot_run`: a coordinator of 10 CALL_WORKFLOW nodes.
- `scc_forecast_snapshot_daily`: the 24-hour schedule.
- `scc_hs_forecast_evidence`.
- `scc_forecast_selftest`: the workbook's worked examples, 21/21 passing.

**Data sources:** FETCH plus 7 callables.

**Agent:** "SC Native – Forecast Agent", with 5 tools and the platform skill `hubspot-crm-operator-sc` attached. It is a member of the Brain supervisor team, which keeps ` ```ua-forecast-map ` blocks verbatim.

**Screens**

| Route | Signature component |
|---|---|
| `/` | `forecast-map.tsx`. An animated SVG plot of Qualification Strength against Decision Momentum. Markers are company logos with green, amber or red direction rings and dated trails. It has a "No score" lane and a True/Equal scale toggle. Around it: summary tiles, a Forecast Truth panel scrolled level with the map, simple and advanced search (`?q=`), and the deal table. |
| `/deal/:id` | Score gauge with the QS×0.6 + DM×0.4 → raw → ceiling breakdown. Dated stage ribbon. Six lever ladders showing points, evidence date and guidance. A per-day numbered dot path with a "Position by day" list. History with a replay that re-scores each moment. |
| `/model` | Contract records, editable with a reason. |
| `/agent` | Full-page agent. The inline chat block `ForecastMapBlock.tsx` is also copied into the Brain v2 hub island. |

**AI**
- Scoring is deterministic and versioned as `FMS.CONTRACT.v1`. The LLM never scores.
- An insights panel names risks, backfill and the next lever moves.
- The agent answers with an interactive map. Clicking a deal sends `postMessage('ua-copilot:open-deal')`.

**Volume**
- About 604 open deals; 54 closing in Q3; 76 with any lever value.
- Only one deal is actually scored. On the first run, 352 had insufficient evidence and 254 were off the map.

## 3. Build sequence (51 min to v1; about 4.5 h active over 5 rounds)

1. **Discovery (7 min):** extract the deck, list the HubSpot connector actions, pull the live pipelines and stage IDs (the user's screenshot confirmed them), and read the live platform HubSpot skill.
2. **Starter app:** create the starter code app over the API and link GitHub. The PAT already covered it. Apply the Gold theme.
3. **Workflows:** write the builder script and deploy 6 workflows. Test them on real deals; this surfaced a BigInteger bug.
4. **Wiring:** create the data sources, clone the agent from the HubSpot Agent, add it to the Brain team, and register the Brain v2 tile.
5. **UI, then v1:** write the UI, push, bounce the preview, and test in the browser on live HubSpot. Update the platform skill and API-SPEC. **v1 reported.**
6. **Round 2 (30 min):** inline chat map, simple and advanced search, logos, direction rings, and dates everywhere. An Orbit outage was waited out with a background health check.
7. **Round 3 (13 min):** split the snapshot into a page workflow plus a coordinator so it covers all 604 deals. Add a client "take today's snapshot if missing" safety net. Fix the panel scroll.
8. **Round 4 (40 min):** the workbook arrived and was applied strictly. Records were migrated, the engine and replay rewritten, and the self-test passed 21/21. Nullable scores were threaded through the UI, and the replay was checked by hand.
9. **Round 5 (next day, 8 min):** diagnosed "animations stopped" and added the True/Equal toggle.

## 4. User reactions

- **Praise:** "great, you need to do one UI change/fix". This came after round 2's logos, rings, search and inline map, all of which he kept.
- **Correction:** "list on the righ side is too long, it should have scroll".
  - Fix: the panel is `xl:absolute xl:inset-0` with a body of `min-h-0 flex-1 overflow-y-auto`, so the map sets the row height.
- **Challenge:** "is the replay correct? do u have any assumptions or mock data". Four things satisfied it:
  - a hand-checked table of every replay moment;
  - the self-test workflow;
  - a replay fix for same-instant changes;
  - an explicit list of "rules I made up because the workbook doesn't define them", each labelled in the UI where it is used.
- **Correction:** "why this is not split equally like before". The true-scale quadrant lines sit at QS 60 and DM 70.
  - Fix: a small True/Equal toggle, remembered per browser. Only the drawing changes.
- **"No deals to test with":** the only assessed deal was hidden by the quarter filter. The fix was a deep link, the filter settings to use, and two honest options: fill the levers in HubSpot, or add a what-if mode. No fake data was added.
- **"Animations stopped":** two causes, reduced motion in the OS and a second snapshot day making most deals "holding". The real-move fix was proposed but not yet confirmed.

## 5. Reusable assets

| Path (repo unless absolute) | What | Documented in |
|---|---|---|
| `app/src/components/forecast-map.tsx` + `.css` | Animated SVG scatter: transform-transition markers, logo `<image clipPath>`, rings, dated trails, fan-out, lane, scale toggle | code-apps "Deal Forecast" (toggle and fan-out **not**) |
| `app/src/copilot-island/forecast-map/ForecastMapBlock.tsx`, `ua-chart/mount.tsx` | Custom visual block inside agent chat | code-apps round 2 |
| `app/src/components/deal-search.tsx`, `app/src/lib/search.ts` | Simple/advanced search, `?q=` criteria, option counts, presets | code-apps round 2 |
| `app/src/lib/trend.ts` | Direction basis and logo fallback chain | code-apps round 2 |
| `app/src/components/lever-ladder.tsx`, `score-gauge.tsx`, `timeline.tsx`, `deal-bits.tsx` | Ladder, gauge, replay, stage ribbon | partly |
| `app/src/components/app-shell.tsx` | Layout route that keeps the docked copilot alive | code-apps round 2 |
| `app/src/data/forecast.ts` | Parallel offset paging, ensure-today snapshot, nullable contract types | code-apps rounds 3–4 |
| `fms_model_v1.json` | A workbook contract as model records | code-apps ("score parameters as records") |
| `E:\github\SC-Companion\platform\workflows\scc_forecast_fms.js` | Shared ENGINE, deals/history nodes, self-test harness | **self-test not documented** |
| `E:\github\SC-Companion\platform\workflows\scc_forecast.js` | Snapshot page and coordinator | code-apps round 3 |

## 6. New pitfalls / platform lessons (not in the listed skills)

- **History replay: record creation writes every property at the same timestamp.** Group same-instant changes into one moment, or the first step scores a half-written deal. Measure the evidence window from each moment's own date.
- **Turn the customer's scoring workbook into a self-test workflow.** Cover its worked examples and edge cases (ceiling, off-map, 3 vs 4 recent levers, invalid state). Run it after every engine change, and show the contract version ID in the app.
- **List the contract's gaps; never fill them silently.** Keep a "rules we assumed" list, for example category → position, the variance flag, the evidence date, the legacy stage map and provisional thresholds. Label each in the UI where it applies and ask for ratification.
- **Day-over-day direction needs a "real move" test.** With a second snapshot day, "unchanged since yesterday" turned unscored deals amber and hid stale ones (one deal had sat 91 days in its stage). Use the snapshot only when the stage or score changed; otherwise fall back to stage age and activity. Proposed, not yet applied.
- **Off-centre business thresholds make lopsided quadrants.** Ship a True/Equal scale toggle, store it per browser inside try/catch, and label the Equal view "not to scale".
- **Sparse real data.** A default filter can hide the only real example. Answer with a deep link and a what-if mode; never seed a read-only source.
- **A workflow can vanish after a platform outage.** Find it by name, recreate it, and repoint the data source, the coordinator's CALL node and `callables.ts`. So far this is only in API-SPEC, in the §39 "Deal Forecast" notes.
- **Publishing a platform skill draft also releases other people's pending drafts.** Leave the publish to the owner.
- **A model object's `kind` oneOf rejects new kinds.** Extend the schema first, and retire old records with `active=false`.

## 7. Use this build as the reference for:

Read-only overlays on a system of record (CRM, ERP, PSA) that score entities with a customer-supplied methodology and show how they move over time, through snapshots and history replay. Examples: forecast maps, account health, supplier or risk scoring, portfolio health. Also any "open any record, see its true state" executive app whose agent answers in visuals.
