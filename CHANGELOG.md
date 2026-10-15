# Changelog

Every release gets an entry here, and the version in `.claude-plugin/plugin.json` goes up
with it.

- Patch (0.1.x): a fix or a new scenario added to an existing skill or agent.
- Minor (0.x.0): a new skill, a new agent, or a change to how a stage works.

## 0.4.1 (2026-10-15)

- **Build mode, chosen once per POC:** a new build asks Sonic (no questions between gates;
  Nebula in Sonic mode) or Zen (clarifying questions at any step; Nebula's Zen skills and
  questionnaires; the Stand-in only drafts suggested answers). Stored as `build_mode`; a resume
  uses it. Zen questions go out like gates.
- **Orbit generates the POC ID** (`POC-_1001`, …). Rows are created without it (`new-poc`) and
  the returned ID is used everywhere; nothing builds an ID from client, use case or date.
  `poc_name`, `client_slug` and `use_case_slug` are kept for search.
- **New build or resume, never guessed:** a build request always creates a new row; a resume
  is asked for by ID or name, matches are shown with stage, run state, mode and last activity,
  the person confirms, the working documents are read back from Orbit, and the open gate's
  Slack thread is checked for an answer given meanwhile.
- **Run state on the row:** `run_state`, `resume_from`, `stall_reason`, `active_session` and
  `last_heartbeat_at`, kept current at every write-back check. A session that stops, or a
  Nebula plan that fails, leaves `stalled` or `failed` with the exact resume point. Taking
  over from a session with a heartbeat under 2 hours asks first. New reference
  `run-control.md`.
- **Working documents in Orbit:** ledger, rulings, storylines, scout map, `design.md`,
  `code-design.md`, profile, brief, entity table with builder links, and a run log, saved as
  they change, so a new chat can carry on.
- **Failed build:** a failure document with the partial entity table, and the owner's choice
  of retry, back to G2, or stop, in Slack and the chat. Nothing on the tenant is deleted.
- **Settings live in Orbit** (a `settings` document on the person's setup row), so a new chat
  needs no setup; `poc-studio.yml` is a local copy. Setup reuses the person's setup row and
  asks how long a gate may wait before it expires to `held`.
- **Every question between gates** (risky fix, failed build, design-system stops, narration,
  delete, budget, Nebula restart, Zen questions) goes to Slack and the chat like a gate, with
  reply words; sign-ins and credentials stay in the chat.
- **Queued writes that can never be replayed** are skipped by `flush`, kept in a `.dead.jsonl`
  file and raised as feedback tickets, so one lost file no longer blocks every gate.
- A merged G1 that comes back `block` marks all phase 2 work `superseded`.
- `orbit-api.mjs`: new `new-poc`, `find-poc`, `claim` (exit 4 when another session holds the
  POC), `heartbeat`, `fetch-doc` and `refresh-schemas`. `orbit-objects.json` has the new POC
  fields; run `refresh-schemas` against the tenant to match it to the live schemas exactly.

## 0.4.0 (2026-10-15)

- **Orbit holds everything.** Three Orbit objects on orbit.uat (`poc_studio_poc`,
  `poc_studio_document`, `poc_studio_feedback`; definitions in
  `skills/build/references/orbit-objects.json`). Every document is saved with its full file,
  versioned (a new version supersedes the old one; nothing is deleted), and its text kept
  alongside up to ~1 MB.
- **New `scripts/orbit-api.mjs`**, no browser: `check`, `schema`, `ensure-objects`, `get`,
  `find`, `create`, `update` (read, merge, write the full record), `upload` (the Orbit UI's S3
  multipart flow), `save-doc`, `readback`, `sync-counts` and `flush` (writes that could not
  reach Orbit are queued and replayed in order). Session from `ORBIT_COOKIE`, or
  `ORBIT_USERNAME` and `ORBIT_PASSWORD` for a local account, as environment secrets. The same
  calls for a signed-in tab (`ps`, `psUpload`) are in `orbit-records.md`.
- **New `/poc-studio:setup`**, run once and whenever a connection breaks: checks Slack,
  Google Calendar and Google Drive (a connector card for any missing), connects Orbit by
  direct API or a signed-in tab and warns when it is signed in as someone else, creates any
  missing Orbit object, records approvers and the gate destination (DM, group DM or channel)
  with resolved Slack IDs, runs one test gate end to end, and writes `poc-studio.yml` with no
  secrets.
- **The build runs in four phases**, each closed by a gate: phase 0 checks prerequisites
  (Slack and Orbit before any research or write) and creates or resumes the POC row; phase 1
  captures signals from Slack, Gmail, Calendar and Drive plus web research, then saves the
  research, readiness assessment, context notes and data plan → **G1 Path**; phase 2 writes
  the scope, storyline, a BRD sized to the tier (new `brd-template.md`), the design system and
  mockups → **G2 Scope and BRD**; phase 3 builds the final app code-first with the latest
  code-builder Nebula in Sonic mode, then rehearsal, checks and evidence → **G3 Final review**,
  where the owner opens the app and accepts it or lists changes; phase 4 makes the
  collaterals → **G4 Release**.
- **Gates go to Slack and the chat at once** (new `gate-delivery.md`), with links to the
  Orbit records and the reply words per gate. The first answer counts and the other place is
  told; only approvers' replies count; unclear replies are asked back; silence or an emoji is
  never a yes; one reminder after a set number of hours; each decision is saved to Orbit and on
  the POC row.
- **Write-back check before every human step:** flush the queue, read back every document
  made so far, update the POC row; if anything did not reach Orbit, the user is asked to
  reconnect and the gate waits.
- **Feedback at any time** becomes a ticket (`FB-_1001`, …), is acknowledged with its number,
  routed (owner or approver = an `OWNER` row that overrules the team; anyone else = a
  `COMMENT` row), closed with what was done, and listed in the next gate message.
- The Researcher also reads Google Drive. Profile: new `approvers` and `gate destination`
  lines; `frontend` defaults to `code`; `nebula` defaults to `latest-code`.
- GitHub is no longer part of the POC flow: no GitHub step, token or repository in setup,
  gates, profile or docs. Skill feedback comes from Orbit tickets (category `skill`), so the
  GitHub issue form is gone, and the copy of the helper's GitHub install notes is removed.

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
- Added Maher's verified UnifyApps platform skills (snapshot of 28 Sep 2026):
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

- Started POC Studio from Demo Studio 0.6.0 by Gourav Mahunta.
- Renamed the plugin to `poc-studio` and the marketplace to `poc-unifyapps`, so it
  can be installed alongside Demo Studio without clashing.
- Added a contributing guide.
