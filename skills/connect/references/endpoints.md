# Orbit Studio API: endpoints

Base URL: `https://orbit.uat.unifyapps.com/api-endpoint/orbit-studio/<endpoint>`. Every endpoint
is `POST` with a JSON body and needs no token. Call them through the plugin's script:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/studio-api.mjs" call <endpoint> @<file.json> [--debug]
```

Every endpoint checks the request before it writes anything. A bad request writes nothing and
answers `{"ok": false, "error": "<every problem, in one line>"}`. A good one answers
`{"ok": true, …}`. The automations behind them live on Orbit and are named
`Orbit Studio API · <name>`.

Dates and times are written by the endpoints themselves; `demo_date` is epoch milliseconds.

## POC

### `poc-create`
Creates the POC row and logs `poc_started`. The ID is `POC-<client-slug>-<yyyymmdd>`; when that
is taken the time is added (`-HHmm`, then `-HHmmss`). All gates start `pending` with both
approvals `false`; stage `0_kickoff`; status `running`.

| Field | |
|---|---|
| **`client_name`**, **`client_slug`**, **`use_case`**, **`owner_name`** | required |
| **`tier`** | `express`, `standard`, `full` |
| `owner_email`, `manager_name`, `manager_email`, `approvers`, `started_by`, `brief`, `slack_channel`, `watch_email`, `tenant_host` | optional |
| `demo_date` | epoch milliseconds |
| `build_mode` | `sonic` (default) or `zen`; written into the run state |

Returns `{ok, poc_id, activity_id}`.

### `poc-update`
Reads the whole POC, puts `changes` on top, drops empty values, checks every dropdown value and
writes the whole record back; then logs one activity. Use it for stage changes, status,
`blocked_on`, and anything the gate endpoints do not cover.

```json
{ "poc_id": "POC-acme-20261016",
  "changes": { "stage": "3_scope" },
  "activity": { "type": "stage_started", "message": "Scope started",
                "note": "run_state: running\nresume_from: 3_scope\nbuild_mode: sonic" } }
```

`changes` may not touch `poc_id`, `started_at` or `started_by`. `activity` needs `type` (see
objects.md) and `message`; `actor_type` (default `ai`), `actor_name` (default `AI · POC
Studio`), `stage`, `gate`, `decision`, `note`, `related_document`, `related_ticket`,
`posted_to` are optional. Returns `{ok, poc_id, activity_id, record}`.

### `poc-get`
`{poc_id}` → `{ok, found, poc, run_state, documents, open_feedback, iterations, activities}`:
the whole POC row; the run state read from the latest activity notes (`run_state`,
`resume_from`, `build_mode`, `session`); the latest version of each document; open and
under-review tickets; the last 20 iterations; the last 15 activities. `found: false` when the
POC does not exist. Use it to resume a POC in a new chat.

## Documents

### `document-save`
Saves a new version. The ID is `<poc_id>__<stage>__<slug>__v<n>`; `n` is the next version for
that stage and slug. The previous version is set to `superseded`, the POC's
`documents_count` and `last_activity` are updated, and `document_saved` is logged.

| Field | |
|---|---|
| **`poc_id`**, **`slug`**, **`name`**, **`created_by`** | required; the slug is lower-cased |
| **`type`** | brief, input, requirements, scope, email, brd, design_system, build_report, app, evidence_pack, demo_script, deck, video, use_case, design, automation, object, agent, walkthrough, poc_link |
| **`stage`** | as the POC's stages |
| **`content`** or **`file_link`** | at least one |
| `gate_pack` | none (default), g1–g4: the phase it shows under |
| `format` | markdown, html, link (default: `link` without content, else `markdown`) |
| `status` | draft, in_review, approved, final (default: `in_review` in a gate pack, else `draft`) |
| `summary`, `path_in_build_session`, `size_bytes` | optional |

Returns `{ok, document_id, version, superseded, activity_id}`.

### `document-get`
`{poc_id, slug, stage?, version?}` → `{ok, found, document, versions}`: the latest version (or the
one asked for) with its content, and every version's ID, status and save time.

## Iterations

### `iteration-log`
Logs one change made between gates (Slack feedback, a Judge ruling, Nebula's own fix) and an
`iteration_logged` activity. The ID is `ITR-<epoch>-<n>`.

| Field | |
|---|---|
| **`poc_id`**, **`actor_name`**, **`title`** | required: who changed what, in one line |
| **`phase`** | understand, plan, build, deliver |
| **`source`** | nebula, judge, person |
| `reason`, `skill`, `actor_email`, `related_document`, `related_ticket`, `slack_ref` | optional |

When the change points at a POC-builder skill, also raise a ticket with `feedback-create`
(`target_skill`).

## Gates

Gate names: `g1` (Understand), `g2` (Plan), `g3` (Build), `g4` (Deliver). A gate passes when the
owner (in Slack, written by POC Studio) and the manager (in the app) have both approved, in
either order.

### `gate-open`
`{poc_id, gate, actor_name, gate_summary, actor_type?, posted_to?, message?}`. Sets
`current_gate`, `gN_status: waiting`, `status: waiting`, `gate_summary`, resets both approvals
for that gate to `false`, and logs `gate_posted` (`posted_to` defaults to the POC's
`slack_channel`). Save the gate-pack documents with `document-save` first. Refused when the gate
is already approved.

### `gate-owner-approve`
`{poc_id, gate, actor_name, phase_summary?, actor_email?, slack_ref?}`. Only for the open gate.
Sets `gN_owner_approved: true` and logs `owner_approved`. When the manager has already approved,
it also passes the gate: `gN_status: approved`, `current_gate: none`, the first stage of the next
phase (`3_scope`, `5_build`, `7_collaterals`, `8_demo_ready`), `status: running` (`demo_ready`
after G4), `gN_summary` from `phase_summary`, and logs `gate_decided` with `approve`.
Returns `{ok, poc_id, activity_id, passed: yes|no, stage}`.

### `gate-request-changes`
`{poc_id, gate, actor_name, reason, slack_ref?}`. Only for the open gate. Sets
`gN_status: changes_requested`, resets both approvals, `current_gate: none`, `status: running`,
and logs `gate_decided` with `request_changes` and the reason. Open the gate again with
`gate-open` when the changes are done.

## Feedback

### `feedback-create`
Raises the next `FB-<n>` ticket (status `open`), updates the POC's `open_feedback_count` and logs
`feedback_created`.

| Field | |
|---|---|
| **`poc_id`**, **`title`**, **`feedback`** (the exact words), **`given_by_name`** | required |
| **`category`** | process, output, skill, ux, bug, other |
| **`severity`** | low, medium, high |
| **`channel`** | app, gate, slack, email, session |
| `given_by_email`, `gate`, `poc_stage`, `related_document`, `quote`, `channel_ref`, `target_skill`, `parent_ticket` | optional; `gate` and `poc_stage` default to the POC's |

Returns `{ok, ticket_no, activity_id}`.

### `feedback-review`
`{ticket_no, status, reviewed_by, action_taken?}`; `status` is `in_review`, `resolved` or
`not_incorporated`, and closing needs `action_taken`. Stamps `resolved_at` when closed, keeps the
POC's `open_feedback_count` right and logs `feedback_reviewed`.

## Activity

### `log-activity`
Any event the endpoints above do not log, such as `input_added` or `nudge_sent`.
`{poc, type, actor_type, actor_name, message}` required (`poc` must exist); `stage`, `gate`,
`decision`, `actor_email`, `note`, `related_document`, `related_ticket`, `posted_to` optional.
The ID is `ACT-<epoch>-<n>`. Returns `{ok, activity_id, poc}`.
