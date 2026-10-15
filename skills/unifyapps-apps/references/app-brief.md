# The app brief — building a solution's application from its architecture

The decisions and the facts sheet for writing a use case's ONE code app once its data, workflows and agents exist. A
builder (Forge's `kit_app_brief`, or a person) puts this file together with the solution's live facts — its screens,
objects with their fields, workflows with their inputs and results, agents. It COMPLEMENTS the skills; it never
replaces them: the app is built from `SKILL.md` (The Maher Methodology), `ai-app-patterns.md`, `code-apps.md`,
`design-quality-pipeline.md`, frontend-design, the taste skill and the solution playbook, read in full, starting from a
clone of the closest accepted build.

**The bar (a MUST for every build):** the six accepted builds recorded in `unifyapps-solution-playbook` (§1, case
files in `references/builds/`). Custom screens written for the domain, with its signature visual, the AI readings shown with
their evidence, the docked assistant, charts, insights and ask everywhere, every state designed, reviewed on the builder
preview against the reference build's screens. A template screen that only lists an object does not meet it.

## Decisions already made
- **One application**, a code app (React + Vite + Tailwind + the app-builder SDK) unless the user chose config at
  build question A2 (then `unifyapps-config-apps`), private unless A3 = public, in its own GitHub repo.
  Every screen of the architecture (UI-nn) is a route in its navigation, grouped by role.
- **Data layer** (generated, do not hand-edit ids): `app/src/data/bindings.ts` (object-agnostic storage reads/writes,
  the `ENTITY` map), `app/src/data/datasources.ts` (ids, `DEFAULT_AGENT_ID`), `app/src/data/solution.ts`
  (`WORKFLOWS`, `useWorkflow`, `AGENTS`, `islandSrc`, `AgentChat`). Reads: `useData<Row[]>(key, 'storage', { object:
  ENTITY.x, where: [leaf…], limit })` from `@/lib/data` (rows arrive flat: `row.status`, `row.id`). Actions:
  `const { run, isRunning, error } = useWorkflow('<key>')` then `await run({...inputs})` — writes refresh every list.
  Never call `/api/*` from the app, never `@unifyapps/app-builder-sdk/copilot` (the cloud build cannot bundle it),
  never `components/copilot.tsx` from the starter.
- **Numbers come from records or workflow results**, never typed in. A total is `total` from the read, not
  `rows.length` of a capped page. No "sample", "demo" or invented names.
- **The agent**: the architecture's assistant (the screen with `assistant` — built with `kit_agent item=UI-nn`, an entity
  guide for every object it reads, the ua-chart contract, its read tools and sub-workflows) docked beside every screen
  and on a full-size agent page, through the framed copilot (`AgentChat` / `islandSrc` from `solution.ts`). Atomic
  agents answer JSON envelopes inside their sub-workflows and are never docked. Questions are handed over in plain words (`useAskAgent()` from
  `@/lib/agent-dock`): never tool names, ids or JSON in a user-voice message; opening the dock sends nothing.

## Ready parts (copy with skill_copy, then import — never re-type them)
| From `${CLAUDE_PLUGIN_ROOT}/skills/unifyapps-apps/assets/…` | To `app/src/…` | Use |
|---|---|---|
| `studio-kit/app/src/kit/` | `kit/` | ONLY for a secondary admin list that is not a UI-nn of the architecture (a rate card, a settings list) — never for a screen in the architecture. Its contract is in `assets/studio-kit/README.md`. |
| `studio-kit/app/src/components/charts/` | `components/charts/` | `ChartBlock({ spec, lang, onDrill?, eyebrow?, height?, dense? })`, `ChartSpec { type: bar\|hbar\|line\|area\|doughnut\|pie\|stacked, title, labels, series: [{name, data}], unit?, currency? }` — the ONLY chart component; needs `chart.js`, `exceljs` in package.json |
| `studio-kit/app/src/lib/agent-dock.ts` | `lib/agent-dock.ts` | `useAgentDock`, `useAskAgent()` |
| `brand-mark/` | `components/brand-mark/` | `UaMark` (the animated UnifyApps mark) |

The shell, the rail, the island host, InsightPanel, Ask, LineageChip and the record writer come from the CLONED
REFERENCE BUILD (playbook §1/§1b, §3), not from the studio-kit. Every screen of the architecture (UI-nn) is a CUSTOM
route in `routes/`, written from its donor route in the reference build and rewritten for this domain.

**Two insights contracts — use the one that matches the workflow:** `assets/ai-insights` (`useLiveInsights`,
`InsightPanel`) calls an insights workflow with `p_screen`, `p_context`, `p_actions`, `p_data` and reads
`response.insights`; the studio-kit's `kit/Insights.tsx` sends `screen` and `records_json`. Mixing them sends blank
inputs and the panel reports "nothing needs attention" (Travel Request Desk, 2026-09-27).

## Screens — how each kind is built
- **Command centre (first screen)**: dark hero band with the solution's thesis in one sentence, 4–6 glass KPI tiles
  (each a real aggregate, each clickable to the filtered list, each with an ask), 2–3 ChartBlock charts, the attention
  list (what needs a person now), the live insights panel. A live ticker only when the SOW asks for one (the
  supplier-risk and document-fraud builds had it removed).
- **Queue**: list + detail split. List: search, filter chips, status pills, the oldest waiting first. Detail: the record,
  every AI reading with its confidence and the evidence words that drove it, the timeline, and the actions (buttons
  that run workflows: confirm step naming the consequence for anything that changes records, progress, a toast with the
  outcome, refresh).
- **Detail / workbench**: the one record in full, each AI result with "why" (evidence, rule, source) and Ask.
- **Form / intake**: labelled inputs from the object's fields, validation, submit runs the intake workflow and shows
  its result.
- **Assistant**: the full-size `AgentChat` with suggested questions for this solution beside it.
- Every data block has a loading skeleton, an empty state that names the first action, and an error state with retry.

## Design
- Premium enterprise, calm and dense; one palette. App-wide theme colours go in `theme.json` at the repo root (the engine
  turns it into `index.css`, which is engine-owned — never edit it). `kit/brand.css` recolours the chart tokens on
  `:root`: `--gc-green` (primary), `--gc-gold` (accent), `--gc-gold-ink`, `--gc-ink`, `--gc-muted`, `--gc-line`,
  `--gc-paper`. Tabular numerals, human labels for enum values (`missing_po` → "Missing PO"),
  `Intl` dates and currency. UnifyApps brand tokens win over any style skill.
- Motion follows the app's own setting — on | auto | off, default on, resolved before first paint and published as
  `data-still` on `<html>`, with a Motion switch in the masthead; `auto` honours `prefers-reduced-motion`; purposeful
  only (150–250 ms, transform/opacity), none on tables or charts; AI loading states keep their opacity pulse when still.
- Responsive to 360 px, keyboard reachable, visible focus, labels on inputs, WCAG AA contrast.
- Ask everywhere: an `AskIcon` on every tile, chart, row and AI result (a plain-words question with the record's
  context), and an "Ask AI" button in the top bar.

## Sequence
1. Before the screens: the data reconciles (`kit_verify` — one current row per record), every workflow — in Full
   style every SW and the master — is verified with evidence, and the customer's logo is confirmed by the user (`customer-logo.md`) or declined.
2. Write the design decision into `Tests/<date>-design.md` before the first component: the reference build and donors,
   the design-skills slug, palette source (the logo), type scale, spacing base, and the product-design decision for
   every action (scope, undo or confirm, recovery, empty/loading/error states, who may do it by platform role).
3. Copy the reference build's shell, not the studio-kit: the grouped rail and command palette, `index.html` pre-paint +
   `lib/motion.ts` (the Motion switch), copilot-host + the island, InsightPanel and its client, Ask, LineageChip, the
   read-merge-write record writer (`usePatchRecord` in `solution.ts` when a storage write is wired); ChartBlock from
   `assets/ua-chart`. Re-theme at the token layer (`theme.json` + the app-owned brand css).
4. Write every UI-nn as a custom route in `app/src/routes/` from its donor route, rewritten for this domain: the
   screen's question, the domain's signature visual (a real map, gauge, flow or index — never a generic chart grid), the
   ordering that matters (what waits for a person first), derived measures (used vs remaining, time to decision,
   breaches by rule), actions shown only for the statuses and roles they apply to. Every detail screen joins every
   entity its step's agents write — value, confidence, the evidence words, the rule or source — and the record's
   Evidence Ledger rows. Every figure from a read or a workflow result with its lineage chip; totals from the engine.
5. Insights on every screen through the insight workflow whose inputs match its START params (non-empty data, a fast
   model, first report under 8 s); an ask on every tile, chart, row and AI result; the assistant docked beside every
   screen and on its own page.
6. `kit_app_publish`, then for every screen a review on the BUILDER PREVIEW at 1440 and 360 px beside the donor's
   screen: write what falls short (the slop list), fix it, publish, review again. The number of rounds follows the test
   mode chosen at Phase 0 (playbook `references/build-options.md`): Quick 1 round at 1440 px, **Standard 2 rounds**
   (default), In-depth until it matches. Shots in `Tests/shots/<UI-nn>-1440.png` and `-360.png`. With the **Early**
   review checkpoint (default), the command centre goes to the user after its first round and before the other
   screens are written.
7. Verify at the chosen test mode (`build-options.md` §3), on the builder preview: the design-quality pipeline Phase 3 skills on the preview, the
   agent battery (ai-app-patterns §16) with measured times, every SOW acceptance line exercised through the UI, one
   below-the-bar reading resolved end to end (the Resolution Inbox in Full style, the screen's review queue in Light). The floor checks (`build-options.md` §2) run in every mode; the published URL only when the user asked.
8. Repo hygiene: README and PRODUCT.md written for this product, starter placeholders neutralised, vendor and
   banned-word grep clean, tags re-applied after the final publish.
9. `Tests/<date>-app-report.md`: the build answers (test mode, where tested) first, then the traceability table (SOW line → where met → evidence), real vs synthetic,
   measured latencies, the reference build and donors, every pipeline skill run with its result, what is open. Then
   ask the user to review the screens (the correction round) before the solution is recorded as done.
The studio-kit spec pages are allowed only for a secondary admin list that is not a UI-nn.
