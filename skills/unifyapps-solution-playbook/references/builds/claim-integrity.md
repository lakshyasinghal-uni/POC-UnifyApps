# Claim Integrity: build playbook

App `app-7121817b391f` (Orbit UAT). Repo `mmaheranwar/claim-integrity`. Transcript `a822c309`, 2026-09-23 to 09-25.

## 1. Customer & brief

The starting point was a colleague's config-based AI Reimbursement Claims Detector (`e_6982fed14ca6bf2bd9b3f2b8`), built for a school-fee customer with agents and workflows. The user asked for the same product or more, rebuilt as a **code app**, with better workflows, agents and integrations. It had to be generic (no customer name), elegant, fast, animated, and built end to end with the Maher methodology. The brief grew during the build: cover intake through decision, have one "analyse" action run the whole process, and use real documents instead of simulations.

**Personas:** claims reviewer (queue, workbench, decision); forensic analyst (document forensics, network); policy and recovery lead (cases); executive (command centre, stories).

## 2. What was built

**Objects (17, prefix `cig_`):** claim, finding, check, document, claimant, vendor, school (issuer registry), price_ref, rule, case, action, link, kpi, insight, scenario, story, agent_run.

**Workflows (16):**
- `cig_intake`: one-call orchestration of forensics, registry check, duplicate check and claim filing.
- `cig_forensics`: sends the PDF over HTTP to an external deterministic forensic engine.
- `cig_registry_check`: checks tax number, name, address, emirate and campus.
- `cig_duplicate_check`: matches by hash, by invoice number + total + issuer, or by text similarity ≥0.97.
- `cig_file_claim`, `cig_decide`, `cig_rescore`, `cig_rollup`.
- Platform layer cloned from Sharek: `cig_query`, `cig_aggregate`, `cig_ai_insights`, `cig_ai_writer`, `cig_create_action`, `cig_apply_scenario`.
- `cig_purge` breaks the no-delete rule. It is unused and must never run.

**Agents (3, each with 3 tasks and 4–5 tools, writes behind approval):** Claims Integrity Analyst, Forensic Investigator, Policy & Recovery Advisor.

**Data sources:** 13 workflow data sources plus 6 storage bindings, all in `app/src/data/datasources.ts`.

**Screens (12 routes):**

| Route | Signature component |
|---|---|
| `/` Command centre | Detection radar (one spoke per check) plus the insight band |
| `/claims` | 200-row triage queue: sticky header, ask icons shown on approach |
| `/workbench` | Risk score broken into each finding's contribution, plus the DecisionBar |
| `/analyse` | PDF drop zone with a live scan line and a Stages panel |
| `/corpus` | Proof run over 165 bundled PDFs, scored against the pack's ground truth |
| `/library` | Check catalogue with a status per check: EXECUTES, PARTIAL or SPECIFIED |
| `/network`, `/vendors`, `/people`, `/cases` | Rings, issuers, claimants, investigation lanes |
| `/control-room` | 13 levers and 7 executive stories, with an exact reset |
| `/analyst` | The three agents at full size |

**AI features:** an insight band on every screen, the docked copilot island with ua-chart answers, chat-with-data on every tile and row, a control room, stories, and ChartBlock charts. The ticker was removed at the user's request.

**Data:** the first build seeded about 11.2k records. The user rejected them and they were cleared. The final register holds 165 real PDFs: 37 from the customer's scenario pack, 28 generated tampering cases and 100 ordinary invoices. That gives 165 claims, 100 findings across 16 checks, 98 claimants and 8 issuers. Risk bands: 35 critical, 1 high, 22 medium, 107 low.

## 3. Build sequence (~8 h on 09-23, 11:16 to 19:01; small edits on 09-24 and 09-25)

1. **Platform first (~40 min).** Objects, seed data, 7 workflows (the forensic HTTP call was proven at 2.3 s), and a control room whose reset went from 45 s to 1.2 s. Then the starter app: GitHub link, local clone, first publish.
2. **Agents, then the React app.** Cloned the shell from an earlier build and rewrote the domain. Published v2 (~1.5 h in).
3. **End to end.** Added filing and decision workflows. Tested intake → triage → decide → undo in the UI and fixed 3 reset defects. Polished the UI (skeletons, focus ring, tabular figures). Published v3.
4. **Honesty audit.** Only 21 of 818 findings were real, and only 5 of 27 checks had code.
5. **Real-data rebuild.** Cleared everything. Ingested the customer's invoice packs and generated 28 tampered PDFs. Implemented the registry and duplicate checks. Added the `cig_intake` orchestration and the `/corpus` proof screen.
6. **Ordinary traffic (100 invoices).** This exposed a saturated score and stale aggregates, fixed with `cig_rescore` and `cig_rollup`. Hid single-period trend charts and derived the copy counts. Published v6.
7. **Hand-over.** Removed the ticker, re-pointed a stale builder checkout, published v8, set the description and the `DEMO_READY` tag, pushed.

## 4. Praise and corrections

There was no explicit praise. Acceptance came as the `DEMO_READY` request once the real register was live. The corrections:

- *"why u are so slow with this"* (40 min in). **Fix:** stop narrating, give a short verified status, then keep building.
- *"it seems it is not real, what is mocked and what is trully working"*. **Fix:** an itemised table of real versus synthetic, admitting that the library counted its own seed data as hit rates. Every check now carries an EXECUTES, PARTIAL or SPECIFIED status.
- The user saw that a real run had filed zero claims, then said *"when i analyse file, it do the whole process"*. **Fix:** the `cig_intake` orchestration now takes one call from document to filed claim.
- *"i dont want simulations, i want real applicaiton"*. **Fix:** every record now comes from a real PDF through the real pipeline, with ordinary invoices added so the register looks like a working desk. The corpus screen became secondary.
- Asked to remove the moving banner. **Fix:** the Ticker was unmounted; the file stays, per the no-delete rule.

## 5. Reusable assets

- `tools/make-scenarios.py`, `tools/make_scenarios_lib.py` and `tools/make-traffic.py` generate real PDFs:
  - tampering via `retotal()` in three modes: `incremental`, `fullsave` and `font`;
  - clean invoices via `clean_invoice()`, with overrides for stated total, TRN and address;
  - ordinary traffic.
  **Not in any skill.**
- `app/public/corpus/manifest.json` + `app/src/routes/Corpus.tsx`: a runner that scores itself against ground truth, reusable for any detector. **Not in any skill.** ai-app-patterns §21 covers only the calibration idea.
- `app/src/routes/Analyse.tsx`: the live-engine stage. Already in ai-app-patterns §17.
- `app/src/components/cig/{DecisionBar,DetectionRadar,AiPanel,Skeleton}.tsx`. The radar is in ai-app-patterns §17.
- `platform/cig-platform.json`, `platform/cig-reference.json`, `platform/groovy/*.groovy`: the platform export. The practice is in unifyapps-apps SKILL, "Export the automations".
- `platform/groovy/cig_registry_check.n_calc.groovy`: fuzzy issuer resolution. It matches the tax number first, then the whole text, tolerates abbreviations, and settles campus by majority vote. **Not documented.**
- `platform/groovy/cig_apply_scenario.n_calc.groovy`: the dirty-flag reset. Already in code-apps.md, "3,000 JSON parses".
- `.gitattributes` (see §6).
- Shell, island and data layer: already listed in code-apps.md, "Clone the app SHELL".

## 6. New pitfalls and platform lessons

- **Git line-ending conversion corrupted 35 of 65 PDFs.** Every hash changed, which broke duplicate detection. **Fix:** add `*.pdf binary` and `*.png binary` to `.gitattributes` before committing any file corpus.
- **Counting your own seed data as detections is fabrication.** **Fix:** give every capability row a `status` (EXECUTES, PARTIAL or SPECIFIED), `implemented_by` and `evidence_note`. Show only executing checks as live, and send the real-versus-synthetic table before the user asks.
- **Separate "analyse" and "file" steps left a real run with 0 claims.** **Fix:** one orchestration workflow per human action (`*_intake`) that returns every stage for the UI to render.
- **The same entity was derived twice, with two answers.** The registry check and the filing step picked different campuses. **Fix:** resolve the entity once and pass its key through the orchestration.
- **The duplicate key was too weak.** "Same issuer + same total" marked 54 of 65 invoices CRITICAL. **Fix:** use hash, or invoice number + total + issuer, or text similarity ≥0.97.
- **Positional parsing broke on wrapped headers,** giving 22 false "unknown issuer" results. **Fix:** match against the whole text and resolve by the strongest identifier. Scope address checks to the parsed address, because a name containing a city must not pass them.
- **A remembered reset key set missed fields,** and stale decision prose survived a reset. **Fix:** derive the key set from every scenario payload and every field the decide workflow writes, then assert coverage. Objects moved by levers need baselines too.
- **The engine emitted check ids the catalogue lacked,** leaving 23 orphan findings. **Fix:** after each run, assert that every finding's `check_id` exists in the catalogue.
- **The user rejected the house "live ticker".** unifyapps-apps SKILL and ai-app-patterns §19 still prescribe one. **Fix:** make the ticker opt-in in the skill.
- **Generated people must not get honorifics or gender guesses.** "Mr." appeared beside a woman's name.
- Already documented, so not repeated here:
  - `updateFields` vs `properties` (API-SPEC §37.1)
  - sending every templated input (§37.4)
  - publishes that run longer than 45 s (§37.5)
  - `skipIfBlank` on restores (builder references)
  - the stale checkout at publish (the SKILL checklist)
  - the Groovy `owner` blacklist (code-apps.md)

## 7. Use this build as the reference for

Document-evidence detection products (invoice, claim, expense, KYC or certificate fraud), and any "AI detector" whose verdict must come from a deterministic engine and be proven against a real ground-truth corpus.
