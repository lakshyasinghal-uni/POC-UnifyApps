# Jaidah Majlis: playbook notes

Sources: transcript `bcd30717…jsonl` (23–25 Sep 2026). Repos:
- `mmaheranwar/jaidah-majlis`: Orbit build, abandoned; it still holds the seed and the platform export.
- `mmaheranwar/jaidah-majlis-ecg`: the live build on `tool.prod-aps1`, app `app-441809e30b81`, v31 at `a784e73`, tagged `DEMO_READY`.

## 1. Customer & brief, personas

The customer is Jaidah Group of Qatar, a five-division conglomerate (Automotive, Heavy Equipment, Energy, Industrial & Electrical, Real Estate). The brief was Requirement 1 of the *Jaidah ECG Approach & Technical Questionnaire*: conversational analytics over their existing Microsoft Fabric/OneLake medallion lakehouse and 8 semantic models, with the Enterprise Context Graph as the foundation.

The user's ask:
- a fully functional proof of concept: data, a working ECG as the base, a code app, and agents;
- "talk to data in every part";
- elegant, Qatar-relevant, researched to the customer;
- built by the "Maher Methodology", which he named and confirmed during this build as the AI-native app bar.

The core argument is that one contractor trades with three divisions under three accounts; only the graph sees the combined exposure.

**Personas:** Group CEO/executive, division heads (AUTO, HEQ, ENR), CFO/credit and collections, and a data/estate owner.

## 2. What was built

- **Data.** 22 `jd_*` Data Objects with 37,902 deterministic records: 3,330 customers, 10,272 orders, 9,256 invoices, 4,288 vehicles, 530 fleet assets, 3,572 service jobs and 5,016 monthly KPI snapshots over 24 months.
  - QAR 1.18B trailing twelve months; QAR 230M open receivables.
  - The division mix and KPI history are *derived* from the transactions, so tiles and charts cannot disagree.
- **ECG.** 17 node types (KpiSnapshot and GoldTable/lineage included), 49 edge types, 37,902 records and 106,985 relationships.
  - It is the only read path for figures. Three config reads stay on objects: scenarios, stories and the agent registry.
  - Proof query: customers trading with 3 or more divisions, found by traversal.
- **Workflows on aps1:**
  - `jd_graph_query` is the single OpenCypher read for screens and agents.
  - `jd_ai_insights` produces ranked, evidence-cited findings per screen, stored in `jd_insight`.
  - `jd_ai_writer` writes every narrative line.
  - `jd_apply_scenario` runs 13 rule levers over graph records with exact reset.
  - `jd_write_edges` loads the relationships.
- **Agents.** Three, each with one tool (`jd_graph_query`), the full schema, the category enums and the ua-chart contract:
  - Majlis Group Analyst: default dock plus the Ask page.
  - Credit & Collections: docked on Receivables.
  - Context Graph Explorer: docked on Customer 360.
  - All on Sonnet 5, thinking off: 15 s and 5/5 reliable (Gemini Flash: 27 s, half failed).
- **Screens and their signature components:**

| Route | Screen | Signature component |
|---|---|---|
| `/` | Majlis | Dark hero with glass KPI tiles; a real geoBoundaries **QatarMap** (24 sites, 8 municipalities, both clickable to ask the agent); insight band |
| `/ask` | Ask | Full-size agent with persona question sets |
| `/estate` | Data Estate | Neutral source roles → bronze/silver/gold → semantic models → graph lineage and freshness |
| `/automotive`, `/equipment`, `/energy` | Division ×3 | One parameterised screen: stock ageing by brand, fleet utilisation, project load |
| `/customers` | Customer 360 | Divisions, orders, invoices, assets and contracts, all reached by traversal |
| `/receivables` | Receivables | Ageing, concentration, DSO, "who to call first", credit agent |
| `/control` | Control Room | 13 levers that apply and reset exactly |
| `/stories` | Stories | 6 executive runs |

- **AI features:** 28 stored insights on 7 screens (severity rail, metric, evidence chips, action footer); every chart a `ChartBlock`; ask on every tile, row and chart; per-screen specialist dock; live ua-charts in answers.

## 3. Build sequence actually followed (~10 active hours over two days)

1. **Orbit build, about 2.5 h.** Seed generator, 22 objects, app scaffold, 7 workflows, agent, copilot island built locally, 12 screens, control-room battery. Published v6.
2. **Graph on the wrong tenant, about 50 minutes lost.** Neo4j was missing on Orbit. The user pointed to aps1; 11,588 edges were written there in 74 s.
3. **"Everything from the ECG".** The app moved to aps1 with a new repo; the full dataset was loaded as graph nodes; every hook was rebuilt on Cypher, with the chart module and CGB template.
4. **Agent speed and truth.** The model override was fixed. A divergence test proved the screens read the graph.
5. **Invent-nothing purge.** Named source systems were replaced with roles and 69 lineage edges rebuilt. The AI Governance and Context Graph pages were removed.
6. **Always-on insights.** Insight cards were pre-generated and redesigned; the map was made clickable; per-screen agent routing added; avatars changed.
7. **Full end-to-end test, about 1 h.** It found 17 defects (§6), all fixed; published v31.
8. **Final touches.** Asset links, the description paragraph, and a real top-level `DEMO_READY` tag.

## 4. Praise and corrections

There was no explicit praise. Acceptance showed as commit-and-push requests, a readiness check before the demo, and the `DEMO_READY` tag. The corrections:

- *"but i said everything source should be the ECG itself, why you didnt do that?"* The screens had been reading Data Objects. **Fix:** every hook compiles to Cypher. Proved by changing one graph value: the ranking moved while the object stayed put.
- *"we dont have these sources, from where u got it"* Seventeen vendor products had been invented. **Fix:** neutral roles, the disclosure moved to the top, and the INVENT NOTHING hard rule.
- *"qatar map is so bad, i want it similar to the one in the CGB app"* **Fix:** a real ADM1 boundary map ported from Sharek; §18 "components are finished". Later: make it bigger and clickable.
- *"AI Instights cards look so bad"* **Fix:** the severity-rail card with metric, evidence chips and action footer. Before that, he flagged empty insight panels, which led to pre-generated insights on load.

Also requested: actionable insights on every analytics screen, ua-chart wired to the agents, simulated platform pages removed, and a new avatar.

## 5. Reusable assets

| Path (`jaidah-majlis-ecg` unless noted) | Use | Documented in |
|---|---|---|
| `app/src/data/graph.ts` | `useCypher` / `useCypherRows` / `useCypherValue`, NODE map read back from tenant, `ROW_CEILING`, NUMERIC/BOOLEAN coercion | context-graph "only source is the graph" |
| `app/src/data/jd.ts` | Typed graph data layer: `FIELDS` per node, `whereClause`, `useNode` (rows + real count), `useSum`, `useGroup`, `useFromCustomer` traversals | same; not as a drop-in asset |
| `app/src/data/insights.ts` | Store-first insights (`jd_insight` by screen) with live re-run | `ai-app-patterns` §2 (live and cache; store-first is new) |
| `app/src/components/kit.tsx` | `InsightBand` (severity rail), `LineageChip` (graph vs object), `TrendChart`/`DonutChart` on ChartBlock | §1, §2 |
| `app/src/components/charts/*` + `palette.ts`, `app/island/ua-chart-mount.tsx` | ua-chart module; resolves CSS vars to hex for canvas | §4 (palette fix: API-SPEC §36) |
| `app/src/components/QatarMap.tsx`, `tools/build-map.py`, `tools/qat_adm1.json`, `app/src/data/qatar-geo.ts` | Build-time projected country map, click → ask agent | §7 |
| `app/src/components/AgentDock.tsx`, `data/agents.ts` | Per-route specialist agent | §6, §21 |
| `app/src/routes/Control.tsx`, `Stories.tsx` | Rules-based levers; stories as records | §5, §10 |
| `jaidah-majlis/tools/jaidah-seed.js` | Deterministic group-finance generator (derived KPIs, ledger fixes) | §9 |
| `jaidah-majlis/platform/jaidah-platform.json` | Export of workflows, data sources, agents and schemas (Orbit version) | "Export the automations into the repo" |

## 6. New pitfalls and lessons (not in the skills)

- **Prove the source with a divergence test.** "Every screen reads the graph" was asserted twice before it was true. **Fix:** change one value in the graph only, confirm the screen moves while the Data Object does not, then restore. Not in any skill.
- **Never simulate a module UnifyApps already ships.** An "AI Governance" page with 18 invented agents, and a home-made Context Graph page, were both rejected. **Fix:** link to or frame the platform's own module (SHU later framed the console graph). Add this as a rule next to INVENT NOTHING.
- **Stored insights go stale under scenarios.** Levers move tiles and charts but not the stored cards until "Run again". **Fix:** re-run the affected screens' insights after a lever or reset, or show an "as of" stamp. The latency budget in `ai-app-patterns` §2 does not cover this.
- **Validate model output before storing it.** Customer 360 cards were stored with blank titles because the model used different keys. **Fix:** schema-check each finding before writing and filter blanks at render. The numeric audit is covered (context-graph test §5); the key check is not.
- **UI copy lies after a data-path change.** The dock still said it was "reading all 22 data objects" after the move to the graph. **Fix:** grep UI copy for source claims whenever the read path changes.
- **Cloned templates leak identity.** A cloned writer carried another customer's system prompt; a cloned avatar was pink. §20 covers prompts only. **Fix:** also reset avatars, colours, names and starter questions on every clone.
- **The live repo is incomplete.** `jaidah-majlis-ecg` has no seed generator, no platform export, and the starter `PRODUCT.md`/README; those live only in the abandoned Orbit repo. **Fix:** port `tools/` and a fresh aps1 export into the live repo, and write a real README before tagging DEMO_READY.
- **Timed-out `javascript_tool` loops keep running.** A second loop raced the first and created 14 duplicate node types. This is in API-SPEC but not in the skill checklist. **Fix:** detach long loops and poll for completion.
- **Pick the tenant before the first object when an ECG is in scope.** Orbit was built fully, then abandoned. The context-graph skill says graphs go on aps1. **Fix:** make "ECG in scope ⇒ app, data and agents on aps1" step 0 of the methodology.
- **A fresh copilot sometimes ignored its first message** (unconfirmed). **Fix:** send a warm-up question before a live demo.

## 7. Use this build as the reference for:

Executive conversational-analytics apps over an existing lakehouse or BI estate, with the ECG as the only read path. Examples: multi-division groups, cross-division customer exposure, receivables and credit, geography-driven dashboards, and specialist agents per screen.
