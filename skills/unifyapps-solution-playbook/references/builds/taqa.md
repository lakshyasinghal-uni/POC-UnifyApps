# Playbook source: TAQA Arabia Sourcing & Supplier Hub

App `app-8854f9ab3223` (orbit.uat, **private**, demoed from the builder preview, v7) · repo `mmaheranwar/taqa-sourcing-hub` · transcript `ecce7216…jsonl` (23 and 25 Sep 2026).

## 1. Customer & brief

TAQA Arabia is Egypt's largest private energy and utility group: gas distribution, power, petroleum retail, water and solar. The brief: supplier registration plus strategic sourcing as their own platform, production ready with charts and AI insights all linked to agents, lots of meaningful data, TAQA's look and feel, the Maher Methodology, no questions.

The brief's reason for buying was that they license a procurement suite, use about 20% of it and want to sunset it. That reason must **not** reach the product (see §4).

**Personas:** CPO (Command Centre, Spend), category buyer (Sourcing), qualification officer (Registration), risk advisor (Risk), contract manager (Contracts).

## 2. What was built

**Objects:** 16 objects prefixed `taqa_`, about 14,000 records:
- suppliers: `supplier` 440, `registration` 307, `document` 4,529;
- structure: `category` 43, `buyer` 20;
- sourcing: `event` 210, `bid` 854, `contract` 168;
- measures: `spend` 1,800, `kpi` 5,424;
- risk and follow-up: `risk_signal` 604, `action` 71;
- demo engine: `scenario` 13, `story` 7;
- logs: `insight`, `agent_run`.

**Workflows (5):** `taqa_query` (three ANDed filter pairs, comma = IN, prose compacted by shape), `taqa_ai_insights`, `taqa_ai_writer` (all narratives), `taqa_create_action` (only agent write, approval card), `taqa_apply_scenario` (rule levers `{object, where, set}`, exact reset from `baseline_json`).

**Data sources (11):** 6 storage bindings, including a minted **UPSERT**, plus 5 callables.

**Agents (3, narrow):**
- Sourcing Analyst;
- Registration Officer;
- Supply Risk & Compliance Advisor.

Each has the query tool and the approval-gated action tool, the `ua-chart` contract, and a turn contract: never end on "Let me look…", never make a third guess.

**Screens (10, English and Arabic RTL):**

| Route | Signature component |
|---|---|
| `/` Command centre | dark masthead, `TaqaWordmark`, `Ticker`, `EgyptFlow` (real governorates, Nile/Suez flow, sea corridors; land = density, bubbles = exposure) |
| `/registration` | 9-gate queue split "waits on supplier / on TAQA" |
| `/suppliers`, `/:code` | register; 360 with AI assessment, documents feed the ISO ticks |
| `/sourcing`, `/:code` | RFQ→award; award desk that argues against its own pick |
| `/spend` · `/risk` | savings, leakage, concentration · compliance wall, uncovered spend (EGP 934.6m, 29 holds), weekly brief |
| `/contracts` | renewal wall, auto-renewals, ceilings |
| `/control` · `/analyst` | 13 record-rewriting scenarios + exact reset · the three agents full size |

**AI and product features:** insight panel and `Ask` on every screen, a docked agent (copilot island), `StoryBar` with 7 executive stories from a zustand store, lineage chips, a branded Arabic `AuthFrame`, a Motion switch, 944 i18n keys (Arabic 100%).

## 3. Build sequence and time

**Day 1 (about 4 h):**
1. Starter app and GitHub link.
2. 16 schemas, then about 14k records from a seed pasted into the browser (`tools/taqa-seed.js`).
3. Workflows cloned from Sharek, then 3 agents and 11 data sources.
4. All screens.
5. A live-data sanity pass: currency, page-limit counts, an implausible headline.
6. Agent stall fixed through the tool's shape: 6 of 6 answered, 24–49 s.
7. Arabic retrofit, logo, luxury redesign.
8. Real Egypt geometry (`tools/egypt-geo.py`) and motion.
9. Battery: 12 scenarios with zero drift over 6,382 records; 9 of 9 agent answers.
10. Accidental wipe of 415 records, then a deterministic re-seed.
11. Vendor-name purge (v6).

**Day 2 (about 20 min):** Motion default plus switch (v7), then the description and `DEMO_READY` tag.

## 4. Praise and corrections

There was no explicit praise; each fix was accepted and the user moved on.

**Look.** "UI and look and feel is off, i want it all luxary and elegant."
- Fixed with a system taken from TAQA's colours: gold `#B0762A` on paper, amber only on dark, Spectral display type, a portfolio chart palette, and dark bands with a gold hairline.
- Part of it was a stale preview (v3). Publishing v4 from the new commit resolved that.

**Map.** "it look so basic, and want more animations and more detaileds."
- Real geoBoundaries and Natural Earth data, projected at build time.
- River, canal and corridor motion.
- Split encodings: land shows supplier density, bubbles show exposure.

**The other vendor's name.** "dont mention or say these related to Ariba or other platforms." It was purged from 8 places:
- an enum (`MIGRATED_ARIBA` became `MIGRATED_LEGACY` in the TS, the schema and 47 records);
- a primary key (`ST-ARIBA` became `ST-OWNRUN`);
- both AI prompts;
- an agent's instructions.

It is now a methodology rule.

**The data wipe.** "fix the problem now and think of safeguard or guardrails." A partial UPDATE had replaced 415 records.
- Rebuilt from the deterministic seed, verified against a business total; guardrails (patch helper, snapshot, one-record dry run, tell the user first) went into the skills.

**Also delivered:** no stalling agents (tool shape plus turn contract), full Arabic, and, after animations stopped on his laptop (Battery Saver), motion on by default with a switch for all apps.

## 5. Reusable assets

| Asset | Path | Documented in |
|---|---|---|
| Rule-based scenario client + refresh-after-apply | `app/src/data/scenario.ts`, `routes/ControlRoom.tsx` | ai-app-patterns §5, code-apps "scenarios as RULES" |
| Executive story runner | `app/src/lib/story.ts`, `components/ua/StoryBar.tsx` | ai-app-patterns §10 |
| Real-geometry map + build-time projector | `components/ua/EgyptFlow.tsx`, `egypt-geo.ts`, `tools/egypt-geo.py` | ai-app-patterns §7 |
| Platform export + Groovy bodies | `platform/taqa-platform.json`, `platform/groovy/` | code-apps "Export the platform layer AND the seed" |
| Deterministic re-runnable seed (`baselineKeys`, `widenBaselines`, `writeComplianceHolds`) | `tools/bootstrap.js`, `tools/taqa-seed.js` | code-apps TAQA findings |
| Three-filter query tool + shape compaction | `platform/groovy/taqa_query.n1/.n3.groovy` | ai-app-patterns §6, builder SKILL |
| Data layer (typed hooks, `vocab()` sets, `useCount`, `egp()`) | `app/src/data/taqa.ts` | `useCount` and `egp()` **not documented** |
| Branded, localised sign-in | `components/ua/AuthFrame.tsx`, `routes/Login.tsx` | **not documented** |
| Wordmark / rosette favicon | `components/ua/TaqaWordmark.tsx`, `TaqaMark.tsx` | customer-logo.md |
| Motion switch | `app/src/lib/motion.ts` | ai-app-patterns "Animate by DEFAULT" |
| Bilingual RTL setup | `app/src/i18n/`, `lib/i18n/` | template README, code-apps |
| Project README with an "invariants" section | `README.md` | **not documented**; a good model (but see §6) |

## 6. New pitfalls not already in the skills

**The vendor purge missed the repo.**
- `README.md` still says "TAQA licenses SAP Ariba… uses roughly a fifth".
- `platform/taqa-platform.json` was exported at 08:10 UTC, before the 10:55 cleanup, and still holds "retiring SAP Ariba" in a workflow prompt and in agent text.
- Fix:
  - extend the vendor grep to cover `README*`, `docs/` and platform exports;
  - add a checklist line: re-export after any tenant change and compare `exportedAt` with the last API edit;
  - ignore the "bnpparibas" TLD-list false positive in the island bundle.

**The seed ships delete helpers.** `T.deleteAll` and `T.reap` in `tools/taqa-seed.js` now break the HARD no-delete rule.
- Anyone copying the seed swaps them for UPSERT on the business key plus an `active=false` flag.
- The repair re-seed was held by the auto-mode "Mass Delete" block until the user approved.

**Count hooks refetch in a loop.** Passed an array literal, a count hook re-keys every render: one request per frame, on a green build.
- Fix: memoise the filter on `JSON.stringify(where)`, as `useCount` in `data/taqa.ts` does.

**Money formatting and carried-over wording.** "EGP 10609m" was unreadable, and "every riyal" had been carried over from a Gulf build.
- Fix: a per-customer money formatter (`egp()` gives "EGP 10.61bn"), plus a currency-word check in the pre-publish grep.

**Unreachable bands and empty levers.**
- The seed's risk ceiling of 63 against a CRITICAL threshold of 72 meant no supplier could ever be CRITICAL.
- SC-SANCTION (`risk_gte 78`) moved zero records, reported success and still wrote a CRITICAL insight.
- This is recorded only in API-SPEC. Fix:
  - check that every legend band has at least one record;
  - have the scenario Groovy fail on `selected: 0`;
  - make the seed place records in every band.

**Implausible headlines.** "Uncovered spend EGP 8,149m" was 86% of group spend, because documents *expiring* were counted as uncovered.
- Fix: a plausibility pass on every headline KPI (share of total, whether an executive would believe it) before the design pass.
- Seed rules, such as compliance holds, make each metric non-zero.

**The Code Builder popup** in the Browser pane paused all scripting in every tab and blocked the tag update. It is in API-SPEC only.
- Fix: close it before browser-driven REST work, and add this to connect-and-call.

**A private app demoed from the preview.**
- Login is the first screen (auth routes needed Arabic and branding), and the batteries had to run against the tenant directly. Fix: decide public or private at step 1; budget the branded auth frame if private.

**Arabic record prose is empty.** `taqa_category.*_ar`, `taqa_story.*_ar` and `taqa_scenario.description_ar` are typed and read by the UI but never populated, so Arabic mode shows English prose.
- Fix: populate them, or report the gap.

## 7. Use this build as the reference for:

Procurement, supplier onboarding and qualification, sourcing (RFQ to award) and contracts; multi-agent apps with a rule-based control room and executive stories; bilingual Arabic RTL; country maps on real sub-national geometry; private apps needing a branded sign-in.
