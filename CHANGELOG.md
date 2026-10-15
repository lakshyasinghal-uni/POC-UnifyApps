# Changelog

Every release gets an entry here, and the version in `.claude-plugin/plugin.json` goes up
with it.

- Patch (0.1.x): a fix or a new scenario added to an existing skill or agent.
- Minor (0.x.0): a new skill, a new agent, or a change to how a stage works.

## 0.5.0 (2026-10-16)

- **The Orbit write-back starts afresh.** The old path is removed: `scripts/orbit-api.mjs`, the
  signed-in tab transport (`scripts/orbit-tab.mjs` and its bundle), the mapping contract
  (`orbit-contract.json`), `orbit-objects.json`, `orbit-records.md`, the schema check, the
  contract test, the self-test, the write queue and `flush`, session claims and heartbeats, and
  the settings document on the setup row. POC Studio no longer signs in to Orbit at all: no
  cookie, no password, no browser tab.
- **New targets: the four Orbit Studio objects** on orbit.uat: `orbit_studio_poc`,
  `orbit_studio_document`, `orbit_studio_feedback` and `orbit_studio_activity`, with their live
  fields and options recorded in `skills/build/references/objects.md`. Skills write the
  objects' own values (stages `1_signal_capture` … `8_demo_ready`, gates `g1` … `g4`, tier
  `express` in place of `sprint`, POC status `running | waiting | blocked | stopped |
  demo_ready`) and build every key: `POC-<client-slug>-<YYYYMMDD>`,
  `<poc_id>__<stage>__<slug>__v<n>`, `FB-<n>`, `ACT-<n>`.
- **The activity log carries the run.** Gate posts and decisions, documents saved, tickets
  raised and closed, stage starts and ends, stops and restarts are `orbit_studio_activity`
  rows; each note carries the run state, resume point and build mode, which a resume reads
  from the latest one. Gate decisions are `gate_decided` activities instead of documents.
- **Write-back goes through the Orbit Studio API**: automations hosted on Orbit and published
  in API Manager under the group `orbit-studio`, with a No Auth access profile, so no token,
  cookie or password is needed. The first endpoint, `log-activity`, is live and writes
  `orbit_studio_activity` rows; the POC, document and feedback endpoints are being built.
  Until an endpoint is live, or when Orbit refuses or cannot be reached, records are kept as
  JSON files under `$STUDIO/objects/` and setup and the build say so in one line.
- **`/poc-studio:connect`**, a new skill: checks that the API accepts calls (writing nothing),
  says what to fix when it does not, and sets out the guardrails every write-back follows:
  only POC Studio's own steps write, only to the POC in hand, only listed endpoints, fields and
  values, never a delete, tests marked `[TEST]`, no secrets in any field. Setup runs it.
- **`scripts/studio-api.mjs`**: `status`, `check` and `call <endpoint> @file [--debug]`.

## 0.4.11 (2026-10-15)

- **The plugin's home is now `lakshyasinghal-uni/POC-UnifyApps`.** The install commands
  (README, CONTRIBUTING), the auto-update marketplace entry (`.claude/settings.json`, the update
  skill), the version check and `enable-autoupdate.mjs` all point to it.
- `enable-autoupdate.mjs` moves an existing `poc-unifyapps` entry that still points at
  `shubhankargarg-lang/POC-UnifyApps` to the new repo (with a backup, and `movedFrom` /
  `movedTo` in its output), so people who installed from the old repo start updating from the
  new one the next time setup or `/poc-studio:update` runs. Any other source is left as it is.

## 0.4.10 (2026-10-15)

- **Orbit through the signed-in tab, with no cookie to copy.** New `scripts/orbit-tab.mjs` runs
  any `orbit-api.mjs` command inside the browser tab the user signed in to: `loader` (once per
  tab), `call <command>` (prints the snippet for the browser's JavaScript tool) and `apply`
  (writes back the files the command wrote and returns its JSON line and exit code). Same-origin
  calls carry the session, so the cookie never leaves the browser and setup no longer stops to
  ask for `ORBIT_COOKIE`. All commands, checks, exit codes and the write queue behave as with the
  direct API. The bundle (`scripts/orbit-tab/bundle.js`) is built from `orbit-api.mjs` by
  `scripts/orbit-tab/build.mjs`; `call` refuses a stale bundle.
- `orbit-api.mjs`: in a tab it skips login, sends no Cookie header, treats a hidden redirect as
  signed out, and uploads file parts without an extra header (no CORS preflight).
- Setup, build and orbit-records.md use the tab transport whenever no Orbit secret is set
  (`auth: tab`), and never start a local relay: a page cannot reach the local machine. The
  hand-written `ps` / `psUpload` helpers are replaced by the tab transport.

## 0.4.9 (2026-10-15)

- **One Orbit contract.** `skills/build/references/orbit-contract.json` holds the live field
  names, required fields, every dropdown's options as read on orbit.uat, and one map from each
  internal value to its Orbit value. Every create and update goes through it. Mappings: stages
  (`1_signal_capture` → `1_signal`, `2_research_assess` → `2_research`, `4_design_system` →
  `4_design`), document stage `gates` for gate packs and decisions, POC status `running` →
  `active`, gate statuses (`not_started` → `pending`, `asked` → `waiting`, approvals →
  `approved`, `changes_requested` → `changes`, `merged` → `skipped_merged`), doc_type as the
  file format with the document kind moved to `summary`, feedback category, severity
  (`blocker` → `high`), status (`done` → `resolved`, `wont_do` → `wont_fix`) and channel
  (`chat` → `session`).
- **Every write is checked whole before it is sent**: field names, no auto fields, options,
  required fields on the resulting record, and every reference pointing at an existing record.
  Any failure stops the write with the full list; a document is checked before its file is
  uploaded.
- **References** (`document.poc`, `feedback.poc`, `feedback.related_document`) hold the id
  read from an existing row: the record id or the primary key.
- **`contract-test`**: on the real tenant, every internal value of every mapped field written
  to `[TEST]` rows and read back, one document per file format, the three references, and seven
  bad writes that must be stopped. Nothing is deleted; the rows are reused and marked as test.
  Setup runs it once per version.
- `schema-check` compares the tenant with the contract; `find` maps internal values in
  filters; `orbit-objects.json` carries the live options.

## 0.4.8 (2026-10-15)

- **`/poc-studio:start`**, one command for the whole journey: it checks GitHub for a newer
  version (5 seconds at most, then it carries on), installs it in Claude Code and asks for
  `/reload-plugins` and a rerun, runs setup when the person has never run it, then hands over
  to the build, which checks the connectors, Orbit and the schema and starts the POC. Without
  a request it asks what the POC is; `resume <POC>` carries on an existing one.
- `version-check.mjs --timeout <seconds>`; a slow GitHub now reports how long it waited, and
  the Claude Code detection waits 3 seconds at most.

## 0.4.7 (2026-10-15)

- **Orbit writes use the live tenant's field names.** POC: `client_name`, `owner_name`,
  `slack_destination`, `last_gate_thread`, `session_ids`, `documents_count`, plus `request`,
  `owner_email`, `owner_slack_id`, `started_at`, `tenant_host`, `solution_name`,
  `last_activity`, `last_activity_at` (`app_url`, `updated_at`, `approvers`, `started_by` and
  `created_at` are no longer written). Document: `name`, `poc` (a reference to the POC row),
  `summary`, `source_path`, `file_url`; the slug is read from `doc_id`. Feedback: `ticket_no`,
  `title`, `poc`, `feedback`, `given_by_name`, `poc_stage`, `related_document`,
  `action_taken`, `resolved_at`, plus `client_name`, `given_by_email`, `given_by_slack_id`,
  `source_link`. The Orbit objects themselves are not changed.
- **`schema-check`**, run by setup and at the start of every build, compares the live schemas
  with every field and single-select value the plugin writes and stops with the list (exit 5)
  when they differ. Every write is checked the same way before it is sent; nothing is renamed
  or changed on the fly. A row written before a field was renamed keeps working: its old keys
  are left out of the update and reported.
- **Upload bucket read from the tenant** (`GET /api/file/upload-bucket`), with `ORBIT_BUCKET`
  only as an override. The hardcoded `uat-uploads.unifyapps.com` is gone, from the script and
  from the signed-in-tab helper.
- **`new-ticket` and `close-ticket`** own the feedback field names, so the build never writes
  them by hand.
- **`selftest`**: on the real tenant, the schema check, a write and a read-back on all three
  objects, and one file upload and download, with a results table.
- **`refresh-schemas`** now also lists every field and its options, to paste back.
- `orbit-objects.json` carries the live field names.

## 0.4.6 (2026-10-15)

- **No GitHub call at the start of build or setup.** The version check ran before every build
  and setup and could stall for a minute when GitHub was slow. Auto-update keeps the plugin
  current, so the check now runs only when the person types `/poc-studio:update`. Setup still
  turns auto-update on, which only edits the local Claude settings file.

## 0.4.5 (2026-10-15)

- **Gates are approved in the Claude chat.** Slack only notifies: when a gate is ready, a
  message goes to the person's personal Slack chat with the Orbit links, asking them to approve
  in the Claude chat. Replies in Slack are not read.
- Removed what depended on reading Slack: the scheduled thread checks, the reminder, the gate
  expiry and setup's expiry question. A gate waits in the chat; a resume shows it again. Live
  approval from Slack is left for later.

## 0.4.4 (2026-10-15)

- **Only the four gate approvals go to Slack,** and they go to the person's own personal Slack
  chat (their direct-message conversation, posted as them through their Slack connection),
  as well as the Claude chat. The first answer from either place counts.
- **Every other question stays in the Claude chat:** Zen questions, risky fixes, a failed
  build, the design system's two stops, narration approval, deletes, budget, Nebula restart,
  sign-ins and credentials. They have no Slack reminder or expiry; they wait in the chat.
- **No approvers or destination choices:** the person running POC Studio is the gate owner.
  Setup finds their Slack user and personal chat instead of asking who approves and where
  messages go; the profile's `approvers` and `gate destination` lines are gone.

## 0.4.3 (2026-10-15)

- **Only five things are produced for review, in this order:** the research document, the
  BRD, the design system, the app, and the collaterals (runbook, explainer, video and PDFs
  when asked for, field note).
- **No mockups.** The Mockups agent and its reference are removed, with the profile's
  `mockups` line and the `approve <letter>` reply at G2. The design system's style guide is
  the visual reference: the Text2Code prompt carries its tokens and component classes, and
  the Critic scores fidelity to it.
- **BRD first, then the design system,** in phase 2; G2 reviews the two together.
- **One G1 document:** the research document now ends with what the client and team said and
  the readiness verdict; the readiness assessment, context notes and data plan are no longer
  separate gate documents.
- **Folded into the BRD:** the scope summary and the storyline (the BRD's summary, storyline,
  data and out-of-scope sections).
- **G3 is the app.** The gate message gives the beat and check pass counts and anything
  unverified; the evidence pack is no longer a document.
- **The explainer moves to the collaterals** in phase 4.
- Context notes, data plan, rehearsal and check results, the unverified list, the demo script
  and the Text2Code prompt are kept as working documents in Orbit, for resuming only.

## 0.4.2 (2026-10-15)

- **New `/poc-studio:update`**, and a version check as the first step of `/poc-studio:build`
  and `/poc-studio:setup` (new `scripts/version-check.mjs`): the installed version is compared
  with GitHub main. Behind in Claude Code on a machine: it runs `claude plugin marketplace
  update poc-unifyapps` and `claude plugin update poc-studio@poc-unifyapps`, then asks for a
  fresh session (or `/reload-plugins`) and stops. Behind in the Claude app: it shows the newer
  version and how to update, then asks whether to stop or carry on.
- **Auto-update on by default** for the `poc-unifyapps` marketplace: setup and update add
  `autoUpdate: true` to its `extraKnownMarketplaces` entry in `~/.claude/settings.json` (new
  `scripts/enable-autoupdate.mjs`; keeps other settings, writes a backup, never rewrites a file
  that is not plain JSON). The repository's `.claude/settings.json` carries the same entry.
  Claude Code has no marketplace.json field for this, so it is a per-person setting.
- README: install steps and the auto-update setting.

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
