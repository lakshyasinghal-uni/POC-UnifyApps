# Msheireb Properties — Performance Intelligence (reference build)

- **App:** `app-0ad14f7488ef`, Orbit UAT.
- **Repo:** `mmaheranwar/msheireb-performance-intelligence`.
- **Prefix:** `msh_`.
- **Built:** 2026-09-25.
- **Transcript:** `3c5f9417…`.

## 1. Customer & brief

Msheireb Properties is a Doha district developer with six portfolio sectors. The source was a Studio solution owned by another user. Its brief asked for an executive "decision and action layer above existing systems":
- KPIs computed from source data;
- bilingual EN/AR (RTL) search;
- a context graph;
- an assistant that explains the R-07 energy-intensity overrun and answers a cross-sector shared-equipment question;
- an approval state machine with audit;
- an AI control tower and admin;
- the official logo.

Maher asked to "learn about this app and create a fully functional version, ready for customer usage". His choice was **Sellable product**:
- real sign-in with enforced roles;
- source systems simulated as their own objects under neutral names;
- sync and write-back;
- no demo reset or role switcher;
- data labelled as generated.

**Personas:**
- CEO/Executive.
- Portfolio Analyst.
- Facilities Manager.
- Commercial Manager.
- Search User.
- Governance Admin.
- Later, "Public link visitor" (anonymous), granted the Executive role.

## 2. What was built

### Objects (39)

- **Simulated source systems (9):** `msh_sys_*` (meter, meter_reading, wo, request, unit, footfall, hosp_summary, event, document). Each has `sync_status NEW|ACKNOWLEDGED`, and its description starts "SIMULATED source system:".
- **Config:** sector, asset, equipment, team, metric_definition, target, role, permission (244 rows), policy, user_access, model_config, connector, alias.
- **Ingested:** reading, space, work_order, service_request, footfall, hosp_period, event, document, document_section.
- **Derived:** observation, graph_edge, recommendation.
- **Governance:** approval, action, assistant_run, audit_event, sync_run.

### Workflows (16)

- **`msh_sync`:** fetches NEW source rows, bulk-creates the product rows, and acknowledges them with one `update_records`. It recomputes connector totals, then CALLs the rollup.
- **`msh_rollup`:** reads 3×5,000-row pages, computes KPIs in Groovy, writes observations, and applies an anomaly rule that raises a recommendation with evidence.
- **Governed layer:**
  - `msh_access`: identity and active role.
  - `msh_query`: scope, classification, masking, audit.
  - `msh_search`: permissions are applied *before* ranking.
  - `msh_graph`: restricted nodes return as placeholders.
  - `msh_agent_query`.
- **`msh_explain`:** a deterministic calculation pack, then the LLM (model read from config, `__rules__` for rules only), then citation validation.
- **`msh_action`:** a 14-verb state machine; APPROVE writes a WO into `msh_sys_wo`.
- **Also:** `msh_admin`, `msh_ai`, `msh_agent_propose`, `msh_bulk_load` and `msh_graph_build`.
- **Scheduled:** `msh_sync_scheduled` every 15 minutes. `SIMULATOR msh_source_feed` is not part of the product.

### Data sources, agent and data

- **Data sources:** 8 callables. There are **no storage bindings**: the app reads only through governed workflows.
- **Agent:** Sonnet 5, cloned from a template. Five tools: explain, query, search, graph, and propose (with `approvalConfig`).
- **Data:** about 17,000 generated records (8,260 readings, 920 WOs, 2,201 requests, 927 units, 2,723 footfall rows, 196 events, 23 bilingual docs). The rollup produces 2,130 observations.

### Screens

| Route | Signature component |
|---|---|
| `/overview` | Portfolio command centre with `PortfolioRing`, KPI tiles, the insight band and the action ticker |
| `/sector/:id` | Six sector lenses, each opening on a measure that has history |
| `/asset/:id` | `ExplainCard`: "Why is energy intensity here…" |
| `/metric/:id` | "How is this calculated?", drilling down to the source rows |
| `/search` | Bilingual search with highlighted hits |
| `/assistant` | Explain card plus the copilot island with ua-chart |
| `/graph` | Explorer; restricted nodes are shown locked |
| `/actions` | Inbox with a "What happened?" panel |
| `/control` | AI control tower: model routing, live policy tests, replay, audit |
| `/admin` | Grants, permission matrix, policies, metric rules, connectors |
| `/record/...` | Governed record page; access is checked on the server for every deep link |
| `/start` | Start screen |

### AI features

- **Explain:** answers from the calculation. For example, the pump explains 23.3% of the excess, and every citation is validated.
- **Insights:** a band on Gemini Flash.
- **Writer:** Sonnet 4.6.
- **Chat charts:** drawn in the question's language.

## 3. Build sequence (about 2 h 10 min to v1.0; about 4.5 h to v1.3)

1. Learn the source read-only, fetch the official logo, and confirm the logo and framing (6 min).
2. Write `docs/SOLUTION-ARCHITECTURE.md`. It covers the "could Msheireb buy it" test and names deviations up front.
3. Create the starter code app over the API and link GitHub.
4. Create the 39 objects from `tools/msh-objects.js`.
5. Load a deterministic seed with the story injected (FAULT_DAY: R-07 at +15%). Verify the story before loading.
6. Build the workflows in three stages, each tested on real calls:
   - ingest (sync fixed from 165 s to 9 s);
   - the governed layer;
   - explain, action, admin, schedule and simulator.
   Tests covered the full approval chain and a role refusal.
7. Create the data sources, then the agent (7 min).
8. Build the UI: all screens in about 25 min, reusing the Sharek bilingual shell and tokens sampled from the logo. Then lint, build the island locally and switch branches.
9. Do a preview pass: EN/AR, mobile, a data-consistency fix and the audience questions. Publish v1.0 and verify the bundle.
10. Round 2 (50 min): make the app public, fix the nav, set the description and tag, theme the charts, fix the hover. Released as v1.1–v1.3.

## 4. User reactions

- **Praise:** none explicit. The follow-ups (builder link, public, tag) read as acceptance.
- **Rejected:** "sectors in navaigation is not opening anything".
  - Cause: the menu was clipped inside the nav bar.
  - Fix: it opens below the button, closes on Escape or an outside click, and lands on a measure with history.
- **Rejected:** "why charts colors are not matching with the overall design."
  - Cause: the chart module carried dark-navy defaults.
  - Fix: colours now come from CSS variables mapped to Msheireb tokens and are recomputed on a theme switch, and the chat island was rebuilt. The hero-tile hover, which turned white under light text, was fixed too.
- **Satisfied asks:**
  - "make the app public": done with a security-only builder run plus a republish, and an audited grant for anonymous visitors.
  - "put tag DEMO_READY": re-applied after every publish.

## 5. Reusable assets

| Path | What | Documented in |
|---|---|---|
| `tools/msh-objects.js` | Object builder (field shorthand) | code-apps (SHU tools/) |
| `tools/msh-seed.js` | Deterministic seed, injected story, quoted public facts | ai-app-patterns §9, §22 |
| `tools/msh-wf.js` | Node helpers incl. `UPDATE_WHERE`; sync with acknowledge; paged rollup | workflows.md §5a (one row) |
| `tools/msh-wf2.js` | **Governed layer**: identity from the audit row, scoped/masked query, permission-before-rank search, restricted graph | **none** |
| `tools/msh-wf3.js` | Explain with citation check, action state machine with write-back, model routing from config, SIMULATOR | ai-app-patterns §17 (partly) |
| `tools/msh-ds.js`, `msh-agents.js`, `ids.json` | Data sources, agent clone, id registry | code-apps |
| `app/src/lib/access.tsx` | AccessProvider (`can`, `mayApprove`, `switchRole` among granted roles) | **none** |
| `app/src/routes/Control.tsx`, `Admin.tsx`, `Actions.tsx`, `Metric.tsx`, `Graph.tsx`, `Record.tsx` | Control tower, admin console, action inbox, calculation drill-down, graph, governed record | **none** |
| `app/src/components/ua/kit.tsx`, `ua/Figures.tsx`, `ExplainCard.tsx` | UI kit, PortfolioRing, explain card | ai-app-patterns §1, §13 |
| `app/src/components/charts/*`, `app/src/lib/palette.ts` | Chart module themed from CSS variables | ai-app-patterns §4 |
| `docs/SOLUTION-ARCHITECTURE.md` | Architecture template | — |

## 6. New pitfalls / platform lessons

- **Public code app.**
  - Anonymous callers run as **platform user 0**. Grant or refuse that user deliberately.
  - Ship a "No access yet" page and a headline guard, so a visitor with no role never sees empty dashboards stating conclusions.
  - After flipping `security.type`, the site keeps its login page until the next publish.
  - Recorded in API-SPEC §55.10 only.
- **Publish wipes `e_interface` tags** (the description survives). Re-tag after every publish. Recorded in API-SPEC §55.11 only.
- **Copied chart modules carry the origin app's theme.** Resolve colours from CSS variables at render time and recompute them on a theme toggle; cached series kept the light colour in dark mode. Rebuild the chat island, because it shares the component.
- **Long time series:** tick labels smear. Show an evenly spaced subset.
- **Lens pages** must default to a measure that has data.
- **Mobile overflow:** grid children grow to their widest chart or table. Put `min-w-0` on the shared `Section`.
- **Menus inside a sticky nav get clipped.** Render the menu outside the nav's overflow.
- **Hover on dark hero tiles:** brighten slightly and add an accent edge. Never swap to a light background.
- **The governed-only data layer is the sellable default for role-sensitive data:**
  - no storage bindings;
  - one callable per governed workflow;
  - identity is the `ownerUserId` of the audit row;
  - roles live in `*_user_access`;
  - denials are audited.
  This is not written up in any skill.
- **Test destructive chains on a secondary record** so the hero story stays open for the owner's demo. Restore the user's active role afterwards, and list leftover test rows in the report rather than deleting them.
- **Model routing as data:** a `*_model_config` object (task → model, `__rules__`) lets the control tower change models without redeploying.
- **Refactor candidate:** the Groovy rollup over paged fetches predates the SQL-on-list verification. Move it to `run_sql_query_on_list` with an empty-list guard.
- **Schema traps:**
  - Duplicate field labels fail validation.
  - An EQUAL `''` filter fails deploy with "required field". Add a boolean field instead.

## 7. Use this build as the reference for:

Role-governed executive KPI command centres over several simulated operational systems (real estate, facilities, smart district, utilities, campus or hospital operations), especially when the brief includes bilingual RTL, explainable variance → approval → work-order write-back, a context graph or an AI control tower.
