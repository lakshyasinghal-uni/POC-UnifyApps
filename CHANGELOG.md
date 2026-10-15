# Changelog

Every change that is merged into `main` gets an entry here, and the version in
`.claude-plugin/plugin.json` goes up with it.

- Patch (0.1.x): a fix or a new scenario added to an existing skill or agent.
- Minor (0.x.0): a new skill, a new agent, or a change to how a stage works.

## 0.3.0 (2026-10-15)

- The owner now decides at four gates placed as in the POC Studio flow, defined in
  `skills/build/references/gates.md`: **G1 · Path** after research and assessment (new
  readiness assessment: proceed, proceed partial or block), **G2 · Scope** after the design
  system (one-page scope summary, style guide and mockup choice; no tenant write before it),
  **G3 · Build verified** after a new finalize stage (evidence pack, owner dry run, freeze),
  and **G4 · Release** after the collaterals (field note; release or hold).
- Gates are never answered by an agent, never skipped and never assumed from silence;
  unattended runs wait at them. With three days or fewer to the demo, they merge in pairs.
- Build fixes are classed safe or risky; risky ones need the owner's yes, and every fix
  re-runs rehearsal and all checks.
- The build skill opens with a stage-to-act map of the flow; new client input re-enters at
  Stage 1 and marks what is stale.
- Profile: new `owner`, `demo date` and `gates` lines; the `research gate` line is gone (G1
  always runs). The Stand-in may not answer a gate or overrule an `OWNER` row. The runbook
  carries the gate log.

## 0.2.1 (2026-10-15)

- Updated `demo-studio` to the latest version: HyperFrames motion graphics, an animated
  architecture opening (`diagram.json`), the "Powered and built by UnifyApps" badge,
  UnifyApps brand assets, and the PG (Pipeline Generation) playbook PDF.
- The build's handoff now feeds it the demo script's beats, the design system's brand and
  the entity table, and asks for narration approval before recording.

## 0.2.0 (2026-10-15)

- Stage 1–2: added the `poc-research` skill (six-lens, cited web research into
  `research/<client>-research.md`). The Researcher runs it in discovery; the new research gate
  (G1, profile `research gate: review`) has the PM approve the draft before scoping, and its
  open questions become ledger rows. Its prior-work lens reads the solution playbook.

- Stage 4: added the `design-system` skill (Design Language v3.4 skinned onto the client's
  brand, luminance preserved, audited in light and dark; ships a style guide, token block,
  logo kit and type note). The build reuses `studio/design-systems/<client>/` or generates
  it before the Designer, mockups and Coder, which now all follow its tokens.
- Added Maher's verified UnifyApps platform skills from unifyapps-helper (28 Sep 2026):
  `unifyapps-builder`, `-apps`, `-config-apps`, `-connectors`, `-context-graph`,
  `-governance`, `-backup-restore`, `-solution-playbook`, `atomic-agent-architecture`,
  `oracle-ebs-apis`, and `API-SPEC.md` at the plugin root. `ask-nebula.md` uses them as a
  sixth place, settling only on verified findings.
- Added the design-quality pipeline skills the platform skills call (taste, design-skills
  registry, product-design, ui-design, typography-audit, ui-animation, ui-verification,
  AccessLint a11y, web-design-guidelines, react-best-practices, playwright-cli). Left out
  `img2threejs` (5.5 MB, not used by any stage).
- Added the `ua-scout` and `ua-checker` agents; Act 4 runs ua-checker's mechanical checks
  beside the rehearsal.
- Added the `no-delete-guard` hook (blocks delete calls from shell or browser scripts).
- Stage 7: added the `demo-studio` video skill; with the profile's `video: on` the handoff
  renders a narrated demo video, narration script, presenter manual and screenshots.
- Code-first apps: `nebula-root.mjs` now reads beta versions and reports `codeBuilder`; the
  build runs `/nebula:update v3.55.4-beta.31.feat-code-builder-mcp` when Nebula is older,
  unless the profile says `nebula: keep`. Act 3b's Nebula code-builder path is outlined and
  waits on the beta's files to name its tools.
- Profile: new `nebula`, `design system` and `video` lines.

## 0.1.0 (2026-10-15)

- Started POC Studio from Demo Studio 0.6.0 (gouravUnifyapps/DemoStudio-UnifyApps).
- Renamed the plugin to `poc-studio` and the marketplace to `poc-unifyapps`, so it
  can be installed alongside Demo Studio without clashing.
- Added a contributing guide, a skill feedback issue form and a pull request template.
