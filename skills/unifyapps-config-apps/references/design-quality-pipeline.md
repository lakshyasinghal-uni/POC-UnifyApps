# Design & UX quality pipeline — mandatory for every app build

**Canonical copy:** `unifyapps-apps/references/design-quality-pipeline.md`. An identical copy lives in
`unifyapps-config-apps/references/`; edit the canonical one and re-copy. (The UnifyApps Studio, a separate
project, keeps its own copy in `unifyapps-usecase-studio`; it is not synced from here.) Agreed with Maher 2026-09-25: this runs on **every** app (config or code, new or
redesign) **from the first screen**, not as a polish pass at the end. It is part of what
"a UnifyApps app" means, alongside the Maher Methodology and the no-mock-data rule.

All skills named here are sibling folders in the same `${CLAUDE_PLUGIN_ROOT}/skills/` directory (installed from
their upstream repos; each has a `SOURCE.md`). Read a skill's `SKILL.md` **in full** the first time it
is used in a session — do not work from memory of it.

| Skill folder | Role in the pipeline |
|---|---|
| `frontend-design`, `taste-skill` | visual taste, aesthetic direction, non-templated choices |
| `design-skills` | registry of 67 design systems — pick one slug, follow `registry/<slug>/SKILL.md` |
| `redesign-skill` | audit-first rework of an existing screen |
| `product-design` | interaction semantics: action scope, undo vs confirm, recovery, reachable states |
| `ui-design` | build/audit React + Tailwind UI, design-system extraction, dark mode, responsive, slop removal |
| `react-best-practices` | React/Next performance patterns (code apps) |
| `typography-audit` | 78-rule type-system audit |
| `ui-animation` | purposeful motion: springs, transitions, gestures, reduced-motion |
| `web-design-guidelines` | UI-code review against Vercel's Web Interface Guidelines |
| `accessibility-scan` / `-inspect` / `-fix` / `-diff` / `-audit` (+ `shared/`) | WCAG 2.2 auditing on the live preview |
| `ui-verification` | scoped browser probes: focus, hit targets, overflow, themes, request failures, perf |
| `img2threejs` | only when a screen needs a 3D object built from a reference image |

Verification runs in the **browser pane on the builder preview URL**
(`/p/0/interfaces/<appId>/preview/<slug>` for config apps, the local dev server / preview for code
apps). `playwright-cli` is optional for repeatable screenshot runs; it is never required.

---

## Phase 0 — Direction (before the first page or component exists)

1. Read `frontend-design/SKILL.md` and `taste-skill/SKILL.md`. On a redesign also `redesign-skill/SKILL.md`.
2. Read `design-skills/SKILL.md` and choose **one** slug. Defaults: `enterprise` / `corporate` /
   `professional` for internal dashboards and product UI; `minimal` / `clean` / `editorial` for
   content-heavy pages; `shadcn` when the code app already uses shadcn/ui. Follow
   `design-skills/registry/<slug>/SKILL.md` as the token and component system.
3. **UnifyApps brand tokens win.** For anything customer-facing or UnifyApps-branded, the palette and
   type from `unifyapps-document-theme` override the registry palette; the registry still supplies
   spacing, component rules and quality gates. For a customer's own app, use the customer's brand —
   starting with **their real logo, confirmed by the user before use** (`unifyapps-apps/references/customer-logo.md`).
4. Write the decision down (slug, palette source, type scale, spacing base, dark-mode yes/no) in the
   build notes / plan before creating the theme (`e_theme`) or the first component.
5. Redesign only: audit every existing screen in the preview and **list the generic / AI-slop
   patterns first** (redesign-skill's audit), then plan the rework.

## Phase 1 — UX decisions (before building any flow)

6. Read `product-design/SKILL.md`. For every user action the app will have (create, edit, delete,
   submit, approve, filter, navigate, upload, ask-the-agent) decide and record: scope of the action,
   reversibility (undo vs confirm), failure recovery, empty / loading / error states, and which states
   are reachable from where. Delete is undoable or confirmed — never silent.
7. These decisions drive the page inventory, the data-source list and the workflow list. Do not
   start pages until they exist.

## Phase 2 — Build (applies to every page and component as it is written)

8. Build under the chosen design system: tokens only, no ad-hoc hex values, no inline magic numbers.
9. Code apps: follow `react-best-practices/SKILL.md` for every component — data fetching, memoisation,
   bundle size, re-render control. Config apps: reuse the catalogued component shapes
   (`unifyapps-config-apps/references/*-catalogue.md`), never invent block props.
10. Run `ui-design` **Audit** on each screen as it lands (hierarchy, spacing, breakpoints, dark mode,
    hit targets ≥ 24 px, slop). Fix before moving to the next screen.
11. Run `typography-audit` once after the first three screens exist, then again before publish.
12. Read `ui-animation/SKILL.md` and add motion **only where it carries meaning**: page/panel
    transitions, list enter/exit, hover/press feedback, loading and success states. No decorative
    motion, none on data tables or charts, ≤ ~300 ms except intentional choreography. Motion follows the app's own setting — on | auto | off, default on, resolved before first paint and published as `data-still` on `<html>`, with a Motion switch in the masthead; `auto` honours `prefers-reduced-motion`; purposeful only, none on tables or charts; AI loading states keep their opacity pulse when still.
12a. **Every AI surface shows that it is working (rule, Maher 2026-09-25).** Anything a model
    produces on screen (insight cards, summaries, agent answers, generated copy, chat charts) has a
    live loading state from the moment the request starts until the result lands: placeholders in
    the shape of the result with a light sweep across them, a breathing AI mark (sparkle) and a
    specific status line with animated dots ("Reading 35 records from this screen…"). Never static
    grey blocks, never a timer-driven fake step list. Under `prefers-reduced-motion` replace the
    sweep with a slow opacity pulse, and give it `!important` so the template's global reduced-motion
    kill switch cannot freeze it into something that looks finished or broken. `aria-busy` +
    `role="status"` on the container. Code apps: the `.ai-skel` / `.ai-spark` / `.ai-dots` recipe
    in the agentic-operation build's `index.css` (`unifyapps-solution-playbook/references/builds/mars-pedigree.md`); config apps: the Card's loading state plus a
    skeleton block per result slot.
    **And make it fast:** screen insights and summaries run on a fast model (measured: GPT-4.1 mini
    4–6 s against Sonnet 4.6's ~30 s for the same insight prompt), with the input capped (~8k chars) and
    two or three findings; keep the large model for open-ended chat. Measure the call before calling it done.
    **Budget (rule, Maher 2026-09-25): first report under ~8 s (measured on the builder preview; on the published app too when the user asked for published testing), a revisit instant
    from cache, the measured time per screen in the test report; over budget is a defect.** Full lever
    list: `unifyapps-apps/references/ai-app-patterns.md` §2 "Latency budget".
13. Charts stay on the house chart module (`ua-chart` for code apps; the catalogued chart blocks for
    config apps) styled with the chosen tokens — the design system never replaces the chart module.

## Phase 3 — Verify (browser pane, builder preview, every screen)

**Test mode and where:** Phases 0–2 run in full on every app, in every test mode. Phase 3 runs at the **test mode the user chose** at
Phase 0 (Quick · **Standard**, the default · In-depth), **on the builder preview**. The published URL is tested only
when the user asked for it. Steps 14–18 below are the **In-depth** mode. The per-step table for Quick and Standard is
in `unifyapps-solution-playbook/references/build-options.md` §3; §2b there covers the preview rule. Standard is
1440 + 360 px in two review rounds, `scan → fix → diff` on every page, and `inspect` on the command centre and one
action flow. Never lower the mode on your own. The report states the mode and records every step it skipped as
`partial`.

14. `ui-verification` probes: focus order, hit targets, overflow at 320 / 768 / 1280 px, light and dark
    themes, request failures, performance attribution.
15. `accessibility-scan` then `accessibility-inspect` on each page; `accessibility-fix` on the findings;
    `accessibility-diff` after fixes to prove no regression. Whole-app `accessibility-audit` before the
    first publish of a new app.
16. `web-design-guidelines` review of the final UI code, plus the chosen design-skill's own quality gates.
17. Screenshot every screen (before/after on a redesign). Beside the matching screen of the chosen reference
    build (playbook §1b: the primary build's donor route for this screen) it must hold up — same depth of domain
    content, real data, decision surfaces — this is the existing "Look at it" check, with a named baseline.
18. **Only when the user asked for published-URL testing:** republish, then repeat 14–16 on the **published** URL once
    (publish takes the builder's commit, not necessarily the one you just pushed). Otherwise the report lists, in one
    line, what was not checked on the published URL (`build-options.md` §2b).

## Phase 4 — Report

19. The build's test report (`Tests/<date>-app-report.md` in the app's repo)
    must list: chosen design slug and palette source; product-design decisions; slop patterns found
    (redesign); defects found / fixed per screen; animations added; **every pipeline skill that ran
    with its result**, and anything left open. "It looks fine" is not a result.

## Redesign playbook for a code app ✅ 2026-09-25 (a supplier-risk build, full overhaul in one session)

Reference build: the supplier-risk build's `app/` (commit e39f084; repo in
`unifyapps-solution-playbook/references/builds/rest-supplier.md`), "operations room" on the
`enterprise` slug. What worked, in order:

1. **Audit the running app first** and write the slop list (light page with one dark card, tracked
   ALL-CAPS eyebrows everywhere, middle-dot meta strings, accent word in the headline, identical
   card grids and boxed big-number KPI tiles, 12-item top nav). State the design read and dials.
2. **Retheme at the token layer, not per screen**: rewrite the `:root, .dark` token block (canvas,
   panel, raised, line, ink, ink-muted, ONE accent, a separate semantic risk ramp), register new
   tokens in `@theme inline` (`--color-raised`, `--color-risk-high`...), set `class="dark"` and
   `color-scheme: dark` on `<html>`, swap fonts in `index.html`. Keep legacy token names
   (`--gold`, `--paper`) aliased to the new ones so untouched markup still resolves.
3. **Put custom surface classes (`.qa-card`, tables, eyebrows) inside `@layer components`.**
   Unlayered custom CSS beats Tailwind utilities, so `qa-card sticky` silently stays `relative`.
4. **Then the kit** (PageHeader, Section, chips, AI button/panel, loading), the shell (grouped rail
   + top bar + Ctrl K command palette on `cmdk` over every entity and screen, with "Ask the analyst:
   <query>" as the fallback item), the chart module's CSS and canvas colours, the insight panel,
   and the copilot island. Only then recompose screens.
5. **Parallelise screens with builders on disjoint files** and one written brief (tokens to use,
   rules, what must not change). Give each builder its own browser tab: builders share the pane,
   drive each other's tabs, and every save hot-reloads everyone's page.
6. **Signature screen:** a live thesis computed from the records instead of a slogan, an
   instrument strip instead of KPI tiles, one stage panel (map + rail), scorecards as rows.

**Traps met:**
- `backdrop-filter` panels over an animated SVG (pulsing map rings) repaint the blur every frame.
  Map overlays are opaque (`.<uc>-overlay`), and only the critical rings pulse.
- A **hidden browser pane** throttles `requestAnimationFrame`, makes screenshots time out and makes
  `document.visibilityState` "hidden". Frame-rate numbers taken then are meaningless (it read 3 fps).
  Verify with DOM audits (overflow, dashes, caps labels, nested/unnamed buttons, target sizes) and
  say what was not seen.
- The **em-dash ban reaches data and prompts**: seed strings, workflow Groovy (e.g. obligation
  labels), sync-run triggers and the AI prompts ("never use em dashes or en dashes"). Fix the
  records and the workflows that write them, not the screen.
- **Copilot island dark mode** is `colorScheme="dark"` on `CopilotProvider` (platform-supported)
  plus the brand ramp; the island document also needs a border-box reset
  (`.island-root * { box-sizing: border-box }`) or the composer is 28px wider than the dock and the
  send button clips. Rebuild with `bun run build:island` and commit the output.
- Starter clicks sent from the parent page by script do not focus the iframe editor, so nothing
  sends; test the chat with real pointer clicks.
- `font: 500 12px inherit` is **invalid** shorthand (`inherit` cannot sit inside `font`), so the whole
  declaration is dropped and buttons fall back to the browser's size. When converting
  `var(--x, inherit)` fallbacks, write `font-family: inherit; font-size: …; font-weight: …`.
- A chart card inside a panel card is a double frame: `.qa-card .gc-card:not(.gc-expanded)`
  drops the inner border, fill and padding.
- Card grids of AI insights must fill their rows for any count: a 6-track grid with spans
  (4 → 2×2, 5 → 2 + 3), never a 3-column grid that orphans the fourth card.
- **See it headless when the pane is hidden:** `playwright-cli run-code --filename=shots.js`
  against the builder preview (or a public app's published URL when the user asked for published testing)
  screenshots every route at 1440 and 360 (full page), and a
  second script can type into the dock iframe (`frameLocator(...).locator('.ProseMirror')`,
  `keyboard.type`, Enter) and time answers until the text is stable. Dev needs the signed-in pane.

**Map motion that carries meaning** ✅ 2026-09-25 (the supplier-risk build's `WorldMap.tsx`): suppliers
arrive in a west-to-east sweep (`animation-delay` from x); each material link draws on
(`pathLength=1`, dashoffset 1→0) and a dash stream flows along it into the hub (`pathLength=100`,
`stroke-dasharray: 1.2 7.5`, dashoffset animation); SMIL packets ride only the ten riskiest links
(not rendered when still); sonar rings leave the hub; a spotlight steps through the newest open
signals for the chosen layer every ~3 s (ripple at the supplier + caption with source, supplier,
headline; rests on the newest when still); layer rings and the selected link animate in by keying
their group on the value. All transform / opacity / dash offset, one `:root[data-still]` guard each.

## Done-checklist additions (copy into any app checklist you maintain)

- [ ] Design slug chosen and recorded before the first component; tokens only, brand tokens win.
- [ ] product-design decisions recorded for every action; delete undoable or confirmed.
- [ ] ui-design audit passed per screen; typography-audit passed before publish.
- [ ] Motion purposeful, on by default with the Motion switch (`data-still`; `auto` honours reduced motion), none on tables/charts.
- [ ] Every AI surface has a live loading state (sweep + breathing mark + status line; opacity pulse under reduced motion).
- [ ] ui-verification + accessibility checks clean on the builder preview (the published URL only when the user asked for it), at the chosen test mode (playbook `build-options.md` §3).
- [ ] web-design-guidelines review and the design-skill quality gates passed (Standard and In-depth).
- [ ] Report states the test mode; every step the mode skipped is a `partial` check with the reason.
- [ ] Report names every pipeline skill that ran and its result.
