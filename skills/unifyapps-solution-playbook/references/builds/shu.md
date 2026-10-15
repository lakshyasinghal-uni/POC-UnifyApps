# SHU Brain / Student Lifecycle Brain: playbook notes

Sources: transcript `3bb755c0…jsonl` (24–25 Sep 2026); repos `mmaheranwar/shu-brain` (Orbit demo, abandoned) and `mmaheranwar/shu-brain-ecg` (live product on `tool.prod-aps1`, app `app-e00247174bc3`, v11).

## 1. Customer & brief, personas

The customer is Sacred Heart University. The brief came through an internal email chain. The Chairman asked for a "Brain" that runs the nine divisions' use cases as workflows, plus an intelligent to-do list that drives each student. The audience was a senior-staff meeting with the CFO, 15–20 minutes. The brief's rules:
- follow one student ("Sarah") from first inquiry to staying enrolled;
- use the divisions' own quotes;
- show the CFO a before/after in people, systems and steps;
- counter a competitor without naming it;
- never say AI, LLM or agentic;
- no architecture diagrams.

The user wanted a "luxury, super elegant" full system. The target moved twice during the build: to "the Enterprise Brain", then to "sellable, not a demo".

**Personas:** cabinet and CFO; advisors and student success; Bursar; Financial Aid; HR/Payroll; Finance/Advancement; Risk; Athletics; the integrations/admin owner; the student.

## 2. What was built (final product build)

- **Simulated systems of record.** 42 storage objects named for each system (`banner_hold`, `slate_person`, `fa_requirement`, gifts, deposits, payroll, MVR/roster …). They use the systems' own keys and contain deliberate mess. About 215k records at SHU's real scale (7,087 undergraduates), calibrated to 27 published College Scorecard/IPEDS figures.
- **Product objects** (`slb_`):
  - `cfg_*`: signal rules, risk bands, to-do rules, reconciliation rules, users, 111 governance rows, settings, offices, and a source registry with watermarks.
  - `ops_*`: action audit, access log, sync runs/errors, edge queue, work queue.
  - `mdm_*` crosswalks.
  - Totals: 66 objects, 60 workflows, 14 data sources (`docs/RESOURCES.md`).
- **Enterprise Context Graph.** 47 node types and 92 edge types. Golden Students are matched by name + birth date and carry per-field source lineage. About 330k relationships. Governance sits in the graph as Office→CAN_SEE→EntityType.
- **Workflows:**
  - 42 `slb_cdc_*` record triggers feed `slb_sync_apply`.
  - `slb_sync_pull` is a 15-minute safety net with GAP detection and self-heal.
  - `slb_relate` is a queued, verified edge writer.
  - `slb_derive_students` computes signals → risk → to-dos → advisor case, all driven by `cfg_*`.
  - Three reconciliations: adjunct pay, gift→cash and drivers.
  - `slb_action`: write-back to the source system with role check, reason and two-person pay approval.
  - Admin save / resync / retry.
  - Scheduled jobs (2 min, 2 min, nightly).
  - `slb_query`: governed Cypher. It stamps the caller from its own access-log row and checks each label against governance.
- **Agents.** The Student Lifecycle Analyst is docked and full-size, runs on one governed `QueryBrain` tool, and outputs ua-charts. Three demo-era agents remain: Success, Operations and CFO.
- **Screens and their signature components** (`routes/slb/*`):
  - **Today:** dark band, band counts, and critical students ranked by cross-office signals.
  - **Student 360** (`/students/:id`): golden record with a source chip per value, signal timeline, one ordered to-do list, write-back ActButtons.
  - **Students** and **To-do lists**.
  - **Operations** desks: pay, gifts, drivers, athletics.
  - **Approvals:** two-person.
  - **The Brain:** glass stats plus `GraphEmbed`, which frames the real console graph (model view / student view).
  - **Integrations:** status, lag, queues, errors, Resync.
  - **Admin:** 8 config tabs.
  - **Audit:** setup rows hidden.
  - **Analyst.**
- **Retired demo surfaces:** Command Centre (`BrainOrbit` visual), Journey, CFO, Enrollment, Control room, Stories.
- **Collateral:** `demo/` (15-minute narrated film, script, runbook, manual) and `docs/` (STORYLINE, OPERATIONS, SOLUTION-ARCHITECTURE).

## 3. Build sequence actually followed (~26 h elapsed, three rebuilds)

1. **Orbit demo, about 2 h.** 23 flat objects, a 58k-row deterministic seed, 19 workflows, 4 agents, 11 screens. Published v2, then ran the lever/reset battery.
2. **"Real data", about 2 h.** Published facts with sources, real-scale cohort, events instead of levers, the Sarah page made generic. Published v4.
3. **Enterprise Brain pivot, about 4 h.** Plan document, then ontology → aps1 graph → bulk load → Cypher edges. A transformer ported the Orbit workflows, and a `useData`→Cypher compiler was added. Published aps1 v1–v4 with a rehearsal script.
4. **"Sellable" pivot, about 3 h.** Simulated systems, CDC/sync, derivation from config, actions/audit/governance, new product screens. Contained a self-inflicted runaway loop. Published v5.
5. **Customer polish, about 8 h.**
   - v7: real logo, then the film and PDFs.
   - v8: environment-default access.
   - Description and `DEMO_READY` tag.
   - v9: embedded ECG.
   - v10: clean Integrations and Audit.
   - v11: admin save correctness.

## 4. Praise and corrections

There was little explicit praise. Acceptance showed as requests to commit and push and to tag the app DEMO_READY. The corrections drove each rebuild:

- *"i need the system, the Enterprise brain to make this story works"*. Phase 1 was flat tables. **Fix:** the ECG became the base on aps1; every screen is a Cypher read; a Brain screen shows the ontology.
- *"again you are doing it as demo presentation, not as actual system and admin tool"*. The control room, reset and "demo data" labels were baked in. **Fix:** the 7-point sellable list (§6), now the SELLABLE hard rule in `unifyapps-apps`.
- *"it has no data anywhere, i need data, i need to show it to the customer"*. The governed reads refused his unlisted work account. **Fix:** an environment-default user row.
- *"why there is page for Sarah alone"*. **Fix:** a generic `/students/:id`, with the story student as the default link.

Other corrections:
- A personal email appeared in the PDFs. Fix: removed, and a guard added.
- A PDF header was clipped.
- 11 failed relationships showed, and test rows appeared on Audit. Fix: re-keyed, with `SUPERSEDED`/`during_setup` flags added.
- He asked whether Admin really worked. Four defects were found and fixed.

## 5. Reusable assets (`shu-brain-ecg`)

| Path | Use | Documented in |
|---|---|---|
| `solution/tools/slb-install.js`, `slb-workflows.js`, `slb-jobs.js` | Installer; generic CDC → apply → watermark pull (GAP, self-heal) → verified relate queue; jobs with nested loop bodies; refuses to build without `readNodes()` | API-SPEC §45; `ai-app-patterns` §22 (pattern only) |
| `solution/tools/slb-derive.js`, `slb-recon.js` | Config-driven signals/score/to-dos/case; three-way reconciliations | not in skills |
| `solution/tools/slb-actions.js`, `slb-admin.js` | Audited write-back, reason, two-person rule; post-write save check | API-SPEC §45.7, §45.19 |
| `solution/ontology.js`, `solution/tools/slb-objects.js`, `tenants/shu/config.js` | Ontology spec, `cfg_/ops_/mdm_` object set, solution/tenant split | not in skills |
| `tools/sim/shu-systems.js`, `tools/sim/load-systems.js` | Deterministic simulated-systems generator and loader | `ai-app-patterns` §22 (pattern) |
| `tools/shu-graph.js`, `tools/shu-graph-workflows.js` | Graph builder, bulk load, Cypher edge writer; object→graph workflow transformer | context-graph "Loading at scale on aps1" |
| `app/src/slb/api.ts`, `slb/ui.tsx` | Governed `useQ`/`useAction`, `ActButton` (reason → audited), `SysChip`, `Denied` | not in skills |
| `app/src/slb/GraphEmbed.tsx` | Framed console graph, crop plus same-origin CSS | context-graph "Showing the real graph"; API-SPEC §45.17 |
| `app/src/routes/slb/Admin.tsx`, `Integrations.tsx`, `Audit.tsx`, `Approvals.tsx`, `Student.tsx` | Admin console, ingestion health, audit filter, approvals, golden 360 | not in skills |
| `app/src/data/graph.ts` | `useData`→Cypher compiler (reads and grouped aggregates) | context-graph "only source is the graph" |
| `tools/shu-seed.js`, `components/shu/Facts.tsx` | Per-section RNG seed; sourced published-fact panel | not in skills |
| `demo/`, `docs/SOLUTION-ARCHITECTURE.md`, `docs/OPERATIONS.md` | Film, runbook, manual; seven-layer architecture; stop/cancel/recover runbook | `demo-studio`; docs not in skills |

## 6. New pitfalls and lessons (not in the skills)

- **The skill still mandates demo scaffolding.** `unifyapps-apps` ("What a UnifyApps app has to mean" and the checklist) requires a control room and stories. SHU's architecture §11 retires them from a product, along with `scn_dirty`, `baseline_json`, `is_story` and "demo data" copy. **Fix:** reconcile the skill. Scenarios live only in a separate simulator app or simulator workflows, never in the product's ontology.
- **"Brain" means the ECG first.** **Fix:** when a brief says Brain, 360 or one record, design the ontology (Knowledge / Governance / Actionability) and load it on aps1 before any screen. No skill defines "Enterprise Brain".
- **The seven-point sellable plan belongs in every plan template:**
  1. ingestion with match/survive and a status screen;
  2. event triggers, not buttons;
  3. audited write-back;
  4. config as admin data;
  5. enforced governance;
  6. hardening (idempotent writes, retries, monitoring, a 20-user load check);
  7. a solution/tenant split.
- **Governed reads blank the app for unlisted users.** **Fix:** add a `cfg_user` row with `platform_user_id 0` as the environment default, explain it on Admin → Users, and test the published app as a second account.
- **Test and setup rows are visible to customers, and nothing may be deleted.** **Fix:** a `during_setup` flag hidden by default behind a toggle. Dead queue rows get `SUPERSEDED` with the reason recorded.
- **Admin screens fail quietly.** **Fix:** lock keys after the first save (editing a key creates a second row); fill reference fields from config/graph dropdowns; validate numbers client-side and in the workflow; saving one row must not discard other rows' edits.
- **Anchor generated volume on official public data.** Keep a facts object with a source URL per figure, calibrate the seed to those figures, and show the working on screen.
- **Lead each report with requirement traceability.** The user lost the thread. **Fix:** give a "who asked / rule / where met" table first.
- **Timed-out browser scripts keep running.** This is in API-SPEC but recurred: an admin test set a governance rule to `abc`. **Fix:** promote it to the skill checklist; run detached and poll.
- **A live write in a film consumes a demo record.** Sarah's hold was really released. **Fix:** the runbook names another student for the live beat.
- **Generated people collide.** There were two Sarah Mitchells. **Fix:** the agent disambiguates by code; never merge on a name alone.
- **Brief-level word bans** (AI/LLM/agentic) need the same grep as vendor names (`ai-app-patterns`) across UI, seed, prompts and agents.

## 7. Use this build as the reference for:

Sellable operational "Brain" products over several simulated systems of record. That covers golden-record 360s, rule-driven risk with to-dos and cases, reconciliations, audited write-back, admin-configurable rules, a governed analyst and ingestion health, in higher ed or any member lifecycle.
