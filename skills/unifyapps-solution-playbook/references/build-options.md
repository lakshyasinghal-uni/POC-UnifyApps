# Build questions — what the user is asked at Phase 0, and once the build is done

Canonical copy for builds by Claude Code (and Forge). `unifyapps-apps`, `unifyapps-config-apps`, the design-quality
pipeline, `app-brief.md` and `atomic-agent-architecture` point here instead of repeating it. The UnifyApps Studio is a
separate project with its own methodology (`unifyapps-usecase-studio`); nothing here depends on it.

Ask sections A0–C **once, at Phase 0**, in a single message, before anything is built (playbook §4 step 1b). Ask
section D once the build has passed its tests (playbook §4 step 12). Mark the
defaults. The user can reply "defaults" for everything that has one. Questions marked **needs an answer** have no
default, because a default there would be an invention. Record every answer in the plan or blueprint, and put the
answers in the first lines of the test report.

You decide, and state rather than ask:
- the reference build (playbook §1, §1b);
- the design direction (the design-quality pipeline, Phase 0).

The user can override either one.

## 0. The questions and their options

### A0. The process — confirm before anything is built

| # | Question | Options | Notes |
|---|---|---|---|
| A0 | **Is this the process?** (the steps as you understood them from the brief: who acts at each, what each produces) | Yes · Change it as follows | **Needs an answer.** Core rule 1 (`atomic-agent-architecture`). When the brief is too thin to write the process, ask for it here instead. The early review (C3) re-checks it against the data and the first screen. |

### A. Where and what

| # | Question | Options (default **bold**) | Notes |
|---|---|---|---|
| A1 | **Which environment?** | **Orbit UAT** (`orbit.uat.unifyapps.com`) · aps1 (`tool.prod-aps1.unifyapps.com`) · other (give the URL) | A context graph (ECG) needs aps1: Orbit has no graph engine (`unifyapps-context-graph` "Build the graph on a tenant that actually has Neo4j"). If the use case needs a graph, say so and propose aps1. Everything (objects, workflows, agents, app) goes on the chosen environment from the first object. |
| A2 | **Config or code app?** | **Code app** (React; custom screens, most flexible; what the accepted builds use) · Config app (no-code pages the customer's own team can maintain) | Comparison: `unifyapps-apps` "Config vs code — which one". Config → `unifyapps-config-apps`. |
| A3 | **Who can open the app?** | **Private** (sign-in with app user accounts) · Public (anyone with the link) | Private gets the branded sign-in page. |
| A4 | **Sellable product or demo app?** | **Sellable product** · Demo app | Demo app: the control room and executive stories live inside the app. Sellable: they go in a separate simulator (playbook §7). |
| A5 | **Design style?** (Claude or Forge recommends one and says why) | **Full atomic** (the process in stages, each AI step its own agent with a confidence score, a review inbox, an evidence ledger) · **Light** (the process agreed first, AI steps inside workflows, low-confidence readings reviewed on the screen where the person works) | The default is the recommendation from the use-case type (`atomic-agent-architecture` "Pick the style first"): **Full** for case desks, document/claim/invoice processing and multi-step AI operations; **Light** for dashboards, analytics, command centres, scoring overlays, chat-over-data and config apps. The core rules apply in both styles. |

### B. Customer and data

| # | Question | Options (default **bold**) | Notes |
|---|---|---|---|
| B1 | **Is this the customer's name?** (shown to the user, as the app will show it: the customer and the product or industry in their own words, from their official site) | Yes · No, use this name instead | **Needs an answer.** Never guessed ("superannuation, not retirement"; playbook §4 step 3). |
| B2 | **Is this the customer's logo?** (the fetched file, shown to the user) | Yes · No, use this file instead · No logo: show the name as text | **Needs an answer.** Fetched from an official source (`unifyapps-apps/references/customer-logo.md`). Nothing branded is built until B1 and B2 are confirmed. |
| B3 | **What is the unit of work and its volume?** | free text, e.g. "one invoice, ~2,000 per month" | **Needs an answer.** Drives the usage sizing and the seed volume (the seed rule below). |
| B4 | **For each outside system (ERP, CRM, files…): where does its data come from?** | **Connect** when a usable connection already exists, otherwise **Simulate** (labelled sample data on our platform) · Collect (the user uploads files or sheets) | Asked per system. What each mode builds: apps `references/objects-and-connections.md` "connect, simulate or collect". Sellable allows platform-hosted data; it is never invented (apps "INVENT NOTHING"). |
| B5 | **Sample documents or records to test with?** | **Upload your real ones** · Generate labelled SAMPLE ones | Generated files carry "SAMPLE" in the name and inside the file. |
| B6 | **Business rules and thresholds** (tolerances, bands, SLAs, approval limits) | free text | **Needs an answer.** Never invent a threshold. |
| B7 | **Which agent actions write data, and which need a person's approval?** | **Every write needs approval** · list the writes that may run on their own | |

**The seed rule (one rule for every skill).**
- Rows are seeded only for reference data (policies, teams, SLA rules, catalogues) and for systems set to
  **Simulate** at B4.
- A simulated core record gets **at least 100 rows**. They are spread over weeks, cover every status, role and edge
  case, and have open work due around now.
- Go to **thousands** only where foreign keys carry the volume (apps "Thousands of records"). Volume with nothing
  hanging off it is decoration.
- Every simulated row is labelled "Sample data" where it renders.
- Seed with a deterministic, re-runnable generator committed under `tools/` (idempotent by primary key).

### C. Testing

| # | Question | Options (default **bold**) | Notes |
|---|---|---|---|
| C1 | **Test mode?** | Quick (~30–60 min of checks) · **Standard (~1.5–3 h)** · In-depth (~4–9 h) | What each mode runs: §3. The basic correctness checks (§2) run in every mode. |
| C2 | **Where should I test?** | **Builder preview only** · Builder preview + the published URL | §2b. The published URL is tested only when the user picks it here or asks later. |
| C3 | **When do you want to review?** | **Early:** show you the data and the first screen before building the rest · End only | §4. |

Only the user lowers the test mode. Never pick Quick on your own to save time, tokens or budget. If time runs short,
say so and ask. The user can raise the mode at any point, and the report then lists what remains to run. **A build
handed to a customer, or tagged `DEMO_READY`, has passed at least Standard.** Quick is for first looks and internal
iteration.

What never changes with any answer: **the bar.** Sellable, invent nothing, the six-part promise, the reference build,
the logo, the core rules, and design Phases 0–2 all still apply. C1–C3 choose how much verification runs, where it runs, and when the
user looks. They never decide which features exist.

### D. When the build is done — asked once the app passes its tests

Ask this **after** the build passes its tests and the user has reviewed the screens, not at Phase 0. The screens
and the story are only known then, and recording a screen that is still changing wastes the recording.

| # | Question | Options (pick any; default **none**) | Notes |
|---|---|---|---|
| D1 | **Do you want any of these for the solution?** | Video recording (narrated walkthrough film) · Demo script (the narration script + a live-demo runbook) · Manual (a step-by-step presenter manual with screenshots: what to do on each screen, what to expect, how to recover) · `DEMO.md` run sheet · None | All produced by `demo-studio` from one `steps.json`, except `DEMO.md` (playbook §6). What each costs: §5. |

If the user picks the video, get the demo script approved before recording (`demo-studio`: "Re-recording because the
wording changed costs an hour").

---

## 1. Why the testing and delivery options exist (where build time actually goes)

These figures come from the eleven case files in `references/builds/`. "Stated" means the case file gives the
number. "Est." means it was estimated from the sequence in the file.

- **The first working version is fast:**
  - Deal Forecast reached v1 in 51 min (`deal-forecast.md:60`).
  - Rest reached v1 in 75 min (`rest-supplier.md:78`).
  - Claim Integrity had its platform layer in about 40 min (`claim-integrity.md:48`).
  - Msheireb's screens took about 25 min (`msheireb.md:104`).
- **Testing, as the builds actually ran it, is about 10–17 % of the time:**
  - Jaidah is the only stated figure: "Full end-to-end test, about 1 h", which found 17 defects, out of about 10 h
    (`jaidah.md:63`).
  - The other hand-driven builds are estimated at 5–23 %.
- **The Forge build that verified everything shows the cost of In-depth:**
  - Three-Way Match took 258 min in tools against 133 min in the model.
  - 21 of its 41 refusals came from verification tools.
  - Its test loop waits ran 26–126 s per `kit_verify` (`three-way-match-ap-exception-desk.md:102,108,144`).
- **Running every step of design Phase 3 is the largest test cost** (est.):
  - Every screen at three widths and two themes, a11y inspect on every page, then all of it again on the published
    URL, comes to roughly 4–9 h for a ~10-screen app (it scales with the number of screens).
  - No accepted build ran all of it. Most reviewed at 1440/360 px in two rounds.
- **The biggest time sink is not testing. It is rework after the user sees the result:**
  - SHU went through about 9 h of pivots plus about 8 h of polish (`shu.md:55-59`).
  - Jaidah's Orbit build was abandoned (`jaidah.md:57-58`).
  - Claim Integrity was rebuilt on real data (`claim-integrity.md:50-63`).
  - Rest's day 2 was mostly a redesign (`rest-supplier.md:83-94`).
  - The defects that cost the most were found by the user, not by any test: "not real", "UI very poor", "demo not
    system", invented sources, the chat overlap. **The early review (C3) targets exactly this.**
- **Demo production is the other large optional cost:**
  - Mars spent about 5 h on its video (`mars-pedigree.md:46-47`).
  - SHU's 8 h of polish includes the film and PDFs.
  - `demo-studio`: "Re-recording because the wording changed costs an hour" (`demo-studio/SKILL.md:116`).

## 2. The floor — runs in every test mode

These are cheap and mechanical, and they catch the "200 that did nothing" failures. They are never scaled down.

- Workflows:
  - save, then confirm `violations` is null;
  - deploy, then assert the deployed version (builder rules 00, 4, "initiate-test does NOT test…");
  - redeploy after every edit.
- Every workflow smoke-tested through its data source, with node outputs read (builder rule 5).
- Every write read back after a ~4 s settle: field count and `successCount` (builder rule 9; apps
  `references/objects-and-connections.md`).
- The pre-production workflow audit, run as a script over every workflow (builder `SKILL.md` "Pre-production audit").
- Every agent asked one question only its tool can answer, with the digits checked against the engine, the tool
  seen in the trace, and the model verified.
- After any guardrail change, one real turn re-run and its Evidence Ledger row read (governance "Inline guardrails").
- Apps:
  - republish after every data source or agent change;
  - every field a screen reads exists in the schema;
  - totals come from the engine;
  - indexes are all `SUCCESS`.
- The vendor-name and banned-word grep.
- One number per screen checked against the engine.
- Every screen opened once on the builder preview: it renders data, with no `forbidden datasource`.
- The test report, which states the test mode. Every check the mode skipped is recorded as `partial` with the reason
  "not run at <mode>".

## 2b. Where testing runs — the builder preview, unless the user says otherwise

**Every test in every mode runs on the builder preview.** That is the config preview
(`/p/0/interfaces/<appId>/preview/<slug>`) or the code app's builder preview, in the signed-in session. The published
URL is tested **only when the user picks "preview + published URL" (C2) or asks later.** A private published app needs
app user accounts, and Claude never signs in there as the user.

You still **publish** as the build requires, for two reasons:
- a running app sees only the data sources that existed at its last publish;
- the code app is published from `main`.

"Tested" means tested on the preview.

A few faults show up only on the published app:
- the copilot island's assets rewritten on the published host (`ai-app-patterns.md` §3);
- the first dock click after a fresh load;
- the favicon and title;
- the basename on links.

With preview-only testing, the report lists these as **not checked on the published URL** in one line, so the user
knows what to look at after publishing. With C2 = preview + published, check them there.

## 3. Test mode — what runs in each (Quick · Standard · In-depth)

| Check (where it is defined) | Quick | **Standard** (default) | In-depth |
|---|---|---|---|
| `ui-design` audit (Phase 2; runs in full in every mode) | every screen as it lands | every screen as it lands | every screen as it lands |
| `typography-audit` (Phase 2; runs in full in every mode) | after the first three screens and before publish | after the first three screens and before publish | after the first three screens and before publish |
| Screen review beside the donor screen (`app-brief.md` step 6; pipeline 17) | 1 round, 1440 px | **2 rounds**, 1440 + 360 px | rounds until it matches, 1440 + 360 px |
| `ui-verification` (pipeline 14) | overflow at 360 px on every screen | 1440 + 360 px, the app's default theme, every screen | 320 / 768 / 1280 px, light and dark, every screen |
| Accessibility (pipeline 15) | `scan` on every page, blocking and serious findings fixed | `scan → fix → diff` on every page; `inspect` on the command centre and one action flow | `scan → inspect → fix → diff` on every page + whole-app `audit` before the first publish |
| `web-design-guidelines` + design-skill quality gates (pipeline 16) | — | once, on the final code | once on the final code, again after the last fix round |
| Published-URL pass (pipeline 18) — **only when C2 = preview + published** | open the command centre on the published URL | the command centre and one action flow on the published URL | repeat pipeline 14–16 on the published URL |
| Insight latency (pipeline 12a), on the preview | measured on two screens | measured on every screen | measured on every screen, first load and revisit |
| Agent battery (`ai-app-patterns.md` §16) | 5 questions: a tool-only question, a trend with a chart, a write with approval, a wrong-number challenge, one out-of-scope | the full battery once; after a fix, re-run the failed questions and the tool-only one | the full battery, re-run in full after every agent fix |
| Control-room battery (demo apps / simulator) | every lever applied once, one reset round trip | the whole battery | the whole battery, with byte-identical reset checked |
| End-to-end pass (`ai-app-patterns.md` §21b; playbook §5) | one happy-path cycle through the UI | happy path + one exception per business rule + one below-the-bar reading resolved (Resolution Inbox in Full style, the screen's review queue in Light) | every scenario + one adversarial case per AI step + the "as if someone else wrote it" sweep over every number and clickable |
| Architecture layers (`atomic-agent-architecture/references/unifyapps-implementation.md`: "Tests per layer" for Full, "Light style on UnifyApps" for Light) | Full: each agent once through Invoke Agent; one master cycle. Light: every AI step once; one below-the-bar reading | Full: as written there. Light: as written there | Full: as written, + every agent from its test chat and one forced-below-100 per sub-workflow. Light: as written, + one edge input per AI step |
| **Estimated time for a ~10-screen app** (est.; scales with the number of screens; excludes fix time and the optional published pass) | **~30–60 min** | **~1.5–3 h** | **~4–9 h** |

Where the estimates come from:
- the end-to-end pass: Jaidah's 1 h (stated);
- agent turns: 10–72 s each (`ai-app-patterns.md` §16, "Measured after the fixes") and 20–54 s each (`unifyapps-builder/SKILL.md:763`);
- a preview rebuild after a push: 1–3 min (`code-apps.md:504`);
- a `kit_verify`: 26–126 s (Three-Way Match);
- per-screen audit time: estimated.

**Standard matches what the accepted builds actually did:**
- two review rounds at 1440/360 px (Three-Way Match);
- a full agent battery once (Rest, Sharek, TAQA);
- an a11y scan and fix pass (Mars, Rest).

**In-depth is the pipeline to the letter.** Choose it for a production go-live or an accessibility commitment in
the SOW.

## 4. Review checkpoint

**Early (default).** Once these three things are live on the builder preview, stop and show them to the user:
- the data model and seed (with the headline KPI values);
- the first screen (the command centre);
- one agent answer, if the agent is built by then.

Ask three questions: is the data real enough, is the look right, and is the framing right (product, not demo)? Build
the rest only after the answer.

This moves the correction round (`app-brief.md` step 9) to the point where a correction costs minutes. The case
files' most expensive corrections were all visible on the first screen:
- "not real" (Claim Integrity);
- "UI very poor" (Rest);
- "demo not system" (SHU);
- "more like admin pages" (Mars).

**End only.** Build everything, then run the correction round as today. Choose it when the user is unavailable
during the build or has already approved a design.

The early checkpoint does not replace the final review. The user still reviews the finished screens.

## 5. After-build material (D1)

| Choice | Delivered | Typical cost |
|---|---|---|
| **None** (default) | test report + README only | — |
| `DEMO.md` run sheet | warm-up, 4- and 12-minute paths, questions with measured latency, symptom → fix, what is real (playbook §6) | ~20–40 min (est.) |
| Demo script | `demo-studio` narration script (PDF, with estimated and measured lengths) + live-demo runbook | ~30–60 min (est.; capture pass + script, no recording) |
| Manual | `demo-studio` step-by-step presenter/user manual + screenshot library | ~30–60 min (est.; shares the capture pass with the script) |
| Video recording | `demo-studio` narrated film with subtitles; needs the approved script | ~2–5 h (Mars: about 5 h, stated; Rest's film is 9 min 48 s long) |

Script, manual and video share one capture pass, so any two cost little more than the larger one alone.

## 6. How to ask

Send one message at Phase 0 with the fetched logo attached. Keep it short and mark the defaults. For example:

> Before I start: here is the process as I understood it — 1. … 2. … 3. … — ✱ is it right?
>
> Then a few questions. Reply "defaults" to take everything in bold; the items marked ✱ need your answer, and please confirm or change the design style.
>
> **Where and what**
> 1. Environment: **Orbit UAT** · aps1 (needed for a context graph) · other
> 2. App: **code app** · config (no-code) app
> 3. Access: **private (sign-in)** · public link
> 4. Building: **a sellable product** · a demo app
> 5. Design style: I recommend **<Full atomic | Light>** because <one line> · the other one
>
> **Customer and data**
> 6. ✱ Customer name as the app will show it: "<name — product/industry>". Right? yes · use this name instead
> 7. ✱ Is this the right logo? (attached) yes · use this file instead · no logo, show the name
> 8. ✱ Unit of work and volume (e.g. "one invoice, ~2,000 a month")
> 9. Data from <system>: **simulate with labelled sample data** · connect live · you upload files
> 10. Test inputs: **you upload real ones** · I generate labelled SAMPLE ones
> 11. ✱ Business rules and thresholds (tolerances, SLAs, approval limits)
> 12. Agent writes: **every write needs approval** · list the ones that may run on their own
>
> **Testing**
> 13. Test mode: Quick (~30–60 min) · **Standard (~1.5–3 h)** · In-depth (~4–9 h)
> 14. Test on: **builder preview only** · preview + published URL
> 15. Review: **early (data + first screen before the rest)** · only at the end
>
> I'll start from <reference build> because <one line>.

And once the build has passed its tests and the user has reviewed it:

> The solution is built and tested. Do you want any of these? (pick any)
> video recording · demo script · manual · DEMO.md run sheet · none
