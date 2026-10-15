# Changelog

Every change that is merged into `main` gets an entry here, and the version in
`.claude-plugin/plugin.json` goes up with it.

- Patch (0.1.x): a fix or a new scenario added to an existing skill or agent.
- Minor (0.x.0): a new skill, a new agent, or a change to how a stage works.

## 0.2.0 (2026-10-15)

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
