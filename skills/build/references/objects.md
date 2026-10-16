# Orbit Studio objects: where every POC, document, change, decision and piece of feedback is saved

Each POC's record lives in five UnifyApps objects on the tenant (by default
`https://orbit.uat.unifyapps.com`), written only through the Orbit Studio API:

| Object | One row per | Key (made by the endpoint) | Written by |
|---|---|---|---|
| `orbit_studio_poc` | POC | `POC-<client-slug>-<yyyymmdd>` (`-HHmm`, then `-HHmmss`, when taken) | `poc-create`, `poc-update`, the gate endpoints |
| `orbit_studio_document` | document version | `<poc_id>__<stage>__<slug>__v<n>` | `document-save` |
| `orbit_studio_iteration` | change made between gates | `ITR-<epoch>-<n>` | `iteration-log` |
| `orbit_studio_activity` | event in the POC's life | `ACT-<epoch>-<n>` | every endpoint, and `log-activity` |
| `orbit_studio_feedback` | piece of feedback | `FB-<n>` (highest + 1) | `feedback-create`, `feedback-review` |

The endpoints build every key and every date. POC Studio never makes a key itself: it keeps
the `poc_id` that `poc-create` returns in `$STUDIO/objects/poc.ref` and sends it with every
call. The `poc` field on documents, iterations, activities and feedback holds that `poc_id`.

How the rows change:

- **POC:** one row, updated in place. Every update sends the whole record back with the
  changes on top; empty values are dropped, so nothing is cleared by accident.
- **Documents:** never edited. A change is a new version; the previous one becomes
  `superseded`.
- **Iterations, activities, feedback:** only added. A ticket's status moves forward through
  `feedback-review`; nothing is deleted.

## How records reach Orbit

Every write goes through the **Orbit Studio API**: automations hosted on Orbit and published in
API Manager under the group `orbit-studio` with a No Auth access profile. POC Studio needs no
token and never signs in to Orbit:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/studio-api.mjs" call <endpoint> @$STUDIO/objects/<name>.json [--debug]
```

Every endpoint's fields, defaults and answers are in
[../../connect/references/endpoints.md](../../connect/references/endpoints.md). Every call
follows the guardrails in [../../connect/SKILL.md](../../connect/SKILL.md) § Guardrails: the
body is written to a file under `$STUDIO/objects/` first, carries only this POC's `poc_id`, and
only the fields and values below.

| Exit | Meaning | What to do |
|---|---|---|
| 0 | saved | keep the IDs it returns (`document_id`, `activity_id`, `ticket_no` …) |
| 1 | the endpoint refused the record: `{"ok": false, "error": "…"}` lists every problem; nothing was written | fix the body and send it once more; if it fails again, stop the step and show the person the error |
| 2 | the API refused the call | run `/poc-studio:connect`'s check and say what is wrong |
| 3 | Orbit could not be reached | the same |

**When write-back is off** (`poc-studio.yml` `orbit.writeback: off`, because setup or connect
found the API refusing or unreachable), every body is still written exactly as below and kept
as `$STUDIO/objects/pending/<nnn>-<endpoint>.json`, numbered in the order the calls would have
been made. Tell the person once per session, in one line, that records are kept in the working
folder. When write-back comes back on, send the pending files in order (the endpoints build the
keys then) and say how many went through.

**When write-back is on and a call fails** after the retry, the step stops: show the person
what failed and the error in a few lines, and do not send a gate or start the next step until
it is saved.

## Phases, gates and the two approvals

| Phase | `phase` (iterations) | Stages | Gate that closes it | Stage after it passes |
|---|---|---|---|---|
| 1 · Understand | `understand` | `0_kickoff`, `1_signal_capture`, `2_research_assess` | `g1` (G1 · Path) | `3_scope` |
| 2 · Plan | `plan` | `3_scope`, `4_design_system` | `g2` (G2 · Scope and BRD) | `5_build` |
| 3 · Build | `build` | `5_build`, `6_finalize` | `g3` (G3 · Final review) | `7_collaterals` |
| 4 · Deliver | `deliver` | `7_collaterals` | `g4` (G4 · Release) | `8_demo_ready`, status `demo_ready` |

A gate passes only when **both** approvals are in, in either order:

- **The owner** (the person running POC Studio) answers in the Claude chat; POC Studio writes it
  with `gate-owner-approve`.
- **The manager** (`manager_name` on the POC) approves in the Orbit Studio app, which sets
  `g<n>_manager_approved`.

When the second approval lands, the gate passes: `g<n>_status: approved`, `current_gate:
none`, the next stage, `status: running`, `g<n>_summary` filled, and a `gate_decided` activity.
`gate-owner-approve` does this itself when the manager approved first. When the owner approves
first, the pass belongs to the app; gate-delivery.md § Waiting for the manager says what the
build does while it waits, and how it closes the gate when the app has not.

## The five objects

Written exactly as below: these are the tenant's own fields and options, read from the live
schemas on 2026-10-16. When the tenant changes, this section is updated to match. **Bold**
fields are required by the object.

### `orbit_studio_poc`

| Field | Value | Set by |
|---|---|---|
| **`poc_id`** | the key above | `poc-create` |
| **`client_name`**, **`client_slug`**, **`use_case`** | text | `poc-create` |
| `brief` | the person's request, as typed | `poc-create` |
| **`tier`** | `express`, `standard`, `full` | `poc-create`, `poc-update` |
| **`owner_name`**, `owner_email` | the person running the session | `poc-create` |
| `manager_name`, `manager_email` | who approves gates in the app (`poc-studio.yml` `manager`) | `poc-create`, `poc-update` |
| `approvers` | owner and manager, comma-separated | `poc-create` |
| **`started_by`**, **`started_at`** | who started it, and when | `poc-create` (never changed) |
| `demo_date` | epoch milliseconds | `poc-create`, `poc-update` |
| **`stage`** | `0_kickoff`, `1_signal_capture`, `2_research_assess`, `3_scope`, `4_design_system`, `5_build`, `6_finalize`, `7_collaterals`, `8_demo_ready` | `poc-update`; the gate pass |
| **`current_gate`** | `none`, `g1`, `g2`, `g3`, `g4` | the gate endpoints |
| **`g1_status`** … **`g4_status`** | `pending`, `waiting`, `approved`, `changes_requested` | the gate endpoints |
| `g1_owner_approved` … `g4_owner_approved` | `true` once the owner approved | `gate-owner-approve`; reset by `gate-open` and `gate-request-changes` |
| `g1_manager_approved` … `g4_manager_approved` | `true` once the manager approved | the Orbit Studio app; reset as above |
| `gate_summary` | what the open gate asks the approvers to decide | `gate-open` |
| `g1_summary` … `g4_summary` | what the phase settled, written when the gate passes | `gate-owner-approve` (`phase_summary`) |
| **`status`** | `running`, `waiting`, `blocked`, `stopped`, `demo_ready` | `poc-update`; the gate endpoints |
| `blocked_on` | one line: why it is blocked, stopped or held | `poc-update` |
| `slack_channel` | the person's own Slack chat for gate notifications | `poc-create` |
| `watch_email` | who else follows the POC, when the person names someone | `poc-create`, `poc-update` |
| `last_activity`, `last_activity_at` | one line, and when | every endpoint |
| `documents_count`, `open_feedback_count` | numbers | `document-save`; the feedback endpoints |
| `tenant_host` | the tenant the app is built on | `poc-create`, `poc-update` |

### `orbit_studio_document`

| Field | Value |
|---|---|
| **`document_id`** | `<poc_id>__<stage>__<slug>__v<n>`: made by `document-save` |
| **`poc`** | the `poc_id` |
| **`name`** | the document's title |
| **`type`** | `brief`, `input`, `requirements`, `scope`, `email`, `brd`, `design_system`, `build_report`, `app`, `evidence_pack`, `demo_script`, `deck`, `video`, `use_case`, `design`, `automation`, `object`, `agent`, `walkthrough`, `poc_link` (§ Document types) |
| **`stage`** | as the POC's `stage` |
| `gate_pack` | `none`, `g1`, `g2`, `g3`, `g4`: the gate whose pack it is in |
| **`status`** | `draft`, `in_review`, `approved`, `final`, `superseded` (`in_review` by default in a gate pack, else `draft`; `superseded` is set by the endpoint) |
| `format` | `markdown`, `html`, `link` (`link` by default when there is no content, else `markdown`) |
| `summary` | one line |
| `content` | the text itself (Markdown, or HTML for an `.html` file) |
| `file_link` | a link to the thing itself when it lives elsewhere (the app's URL, a video) |
| `file` | an uploaded file; the API does not upload files, so POC Studio leaves it empty |
| `path_in_build_session` | the local path it came from |
| `size_bytes` | number |
| **`created_by`**, **`saved_at`** | who saved it (the person, or `AI · <agent>`); `saved_at` is set by the endpoint |

Every save needs `content` or `file_link`. A binary file (a PDF, an MP4) is saved with a
`file_link` when it has one, else with a short Markdown `content` saying what the file is and
where it sits in the working folder.

### `orbit_studio_iteration`

One row per change made between gates, so the approvers see what moved since they last looked.

| Field | Value |
|---|---|
| **`iteration_id`** | `ITR-<epoch>-<n>`: made by `iteration-log` |
| **`poc`** | the `poc_id` |
| **`phase`** | `understand`, `plan`, `build`, `deliver`: the phase the change belongs to |
| **`source`** | `person` (the owner or someone they passed on), `judge` (a Judge ruling), `nebula` (Nebula's own fix in the fix loop) |
| **`actor_name`**, `actor_email` | who made the change: the person, `AI · Judge`, `AI · Nebula` |
| **`title`** | one line: what changed (`BRD: approval step moved before the SLA check`) |
| `reason` | why, in a line or two |
| `skill` | the POC Studio skill or agent the change points at, when it is about how the plugin works |
| `related_document`, `related_ticket` | the `document_id` and `ticket_no` it came from |
| `slack_ref` | the Slack message link, when there is one |
| **`created_at`** | set by the endpoint |

### `orbit_studio_activity`

| Field | Value |
|---|---|
| **`activity_id`** | `ACT-<epoch>-<n>`: made by the endpoint |
| **`poc`** | the `poc_id` |
| **`type`** | `poc_started`, `stage_started`, `stage_completed`, `document_saved`, `gate_posted`, `owner_approved`, `manager_approved`, `gate_decided`, `iteration_logged`, `feedback_created`, `feedback_reviewed`, `input_added`, `nudge_sent`, `poc_stopped`, `poc_restarted` |
| `stage` | the POC's stage |
| `gate` | `none`, `g1`, `g2`, `g3`, `g4` |
| `decision` | for `gate_decided`: `approve`, `request_changes`, `stop` |
| **`actor_type`** | `ai`, `person`, `system` |
| **`actor_name`**, `actor_email` | `AI · <agent or step>` for `ai`; the person's name for `person` |
| **`message`** | one line a person can read: `Harshal approved G2 (Scope and BRD)` |
| `note` | the run state block (§ Run state) and any detail |
| `related_document`, `related_ticket` | the `document_id` or `ticket_no` |
| `posted_to` | where a notification went (the Slack chat) |
| **`created_at`** | set by the endpoint |

The endpoints log their own activities (`poc_started`, `document_saved`, `gate_posted`,
`owner_approved`, `gate_decided`, `iteration_logged`, `feedback_created`, `feedback_reviewed`).
POC Studio adds the rest with `poc-update`'s `activity` (when the POC row changes too) or with
`log-activity`. `manager_approved` is the app's.

### `orbit_studio_feedback`

| Field | Value |
|---|---|
| **`ticket_no`** | `FB-<n>`: made by `feedback-create` |
| **`poc`** | the `poc_id` |
| **`title`**, **`feedback`** | a short title; the exact words |
| `quote` | the passage the feedback is about, when there is one |
| `client_name`, `poc_stage`, `gate` | filled from the POC when not sent |
| `related_document` | the `document_id` it is about |
| **`category`** | `process`, `output`, `skill`, `ux`, `bug`, `other` |
| **`severity`** | `low`, `medium`, `high` |
| **`channel`** | `app`, `gate`, `slack`, `email`, `session` (`session` for the Claude chat, `gate` for a gate answer) |
| `channel_ref` | the Slack message link, when there is one |
| `target_skill` | the plugin skill or agent it is about, for `skill` feedback |
| `parent_ticket` | the ticket it follows on from |
| **`status`** | POC Studio uses `open`, `in_review`, `resolved`, `not_incorporated` |
| `action_taken`, `reviewed_by`, `resolved_at` | what was done, by whom, when (`resolved_at` set by the endpoint) |
| **`given_by_name`**, `given_by_email` | who gave it |
| **`created_at`** | set by the endpoint |

The object also has `source` (`self_llm`, `iteration`, `user`, `reviewer`),
`incorporated_in_version`, `skill_proposal` and the statuses `in_proposal`, `incorporated`,
`dismissed`, for the skill-improvement review in the app. POC Studio does not write them.

## Which call at which step

| When | Call | What goes in it |
|---|---|---|
| A new build, once the build mode, owner and tier are known | `poc-create` | client, use case, brief, tier, owner, manager, `slack_channel`, `demo_date`, `tenant_host`, `build_mode` |
| A stage starts | `poc-update` | `changes: {stage}`, `activity: {type: stage_started}` with the run state |
| A stage ends without a gate | `poc-update` | `activity: {type: stage_completed}` with the run state |
| A document or working document is made or changed | `document-save` | slug, name, type, stage, `gate_pack`, content or `file_link`, summary, path, size |
| A document is needed back (resume, `edited` at G1) | `document-get` | `poc_id`, slug, stage |
| The save check | `document-save` for what changed, then `poc-update` | § The save check |
| A gate is sent | `gate-open` | gate, `gate_summary`, `posted_to` (gate-delivery.md) |
| The owner approves (`approve`, `partial`, `edited`) | `gate-owner-approve` | gate, `phase_summary`, `slack_ref` |
| The owner asks for changes | `gate-request-changes` | gate, reason (the exact words) |
| The owner stops (`block`, `stop`, `hold`) | `poc-update` | `changes: {status, blocked_on}`, `activity: {type: gate_decided, gate, decision: stop}` |
| A change is made after a gate's changes, a Judge ruling or a fix | `iteration-log` | phase, source, actor, title, reason, related ticket or document |
| Feedback is given | `feedback-create` | title, exact words, who, category, severity, channel |
| A ticket is picked up or closed | `feedback-review` | `ticket_no`, status, `reviewed_by`, `action_taken` |
| New client input, a nudge, a Zen answer | `log-activity` | `type: input_added` or `nudge_sent`, or `gate_decided` with `gate: none` |
| A session stops, fails or is resumed | `poc-update` | status and `blocked_on`, `activity: {type: poc_stopped | poc_restarted}` with the run state |
| Resume, and before each gate | `poc-get` | `poc_id` |

## Recipes

Each recipe is one or two calls; the body goes in a file under `$STUDIO/objects/`.

**Create the POC.**

```json
{ "client_name": "Acme Logistics", "client_slug": "acme-logistics",
  "use_case": "Shipment exception desk", "brief": "<the request as typed>",
  "tier": "standard", "owner_name": "Harshal", "owner_email": "harshal@…",
  "manager_name": "Lakshya", "manager_email": "lakshya@…", "approvers": "Harshal, Lakshya",
  "started_by": "Harshal", "slack_channel": "D0…", "tenant_host": "orbit.uat.unifyapps.com",
  "demo_date": 1792800000000, "build_mode": "sonic" }
```

Keep the returned `poc_id` in `$STUDIO/objects/poc.ref`. `poc_started` is logged by the
endpoint. If the call's answer is lost, run `poc-get` on the expected key before creating
again; never create a second row.

**Move a stage, or change the POC.** `poc-update` with only what changes, and always an
activity:

```json
{ "poc_id": "POC-acme-logistics-20261016",
  "changes": { "stage": "4_design_system" },
  "activity": { "type": "stage_started", "message": "Design system started",
                "stage": "4_design_system",
                "note": "run_state: running\nresume_from: 4_design_system · brand sampling\nbuild_mode: sonic\nsession: <link>" } }
```

`changes` may hold `stage`, `status`, `blocked_on`, `tier`, `demo_date`, `manager_name`,
`manager_email`, `watch_email`, `tenant_host` and the gate fields; it may not hold `poc_id`,
`started_at` or `started_by`. The endpoint checks every option and refuses a wrong one.

**Save a document.**

```json
{ "poc_id": "POC-acme-logistics-20261016", "slug": "brd", "name": "Acme Logistics BRD",
  "type": "brd", "stage": "3_scope", "gate_pack": "g2",
  "content": "<the Markdown>", "summary": "Six beats, three objects, one agent",
  "path_in_build_session": "studio/brd.md", "size_bytes": 18230, "created_by": "AI · Moderator" }
```

The endpoint finds the next version, supersedes the previous one, updates `documents_count`
and logs `document_saved`. Keep the `document_id` it returns; gate messages and tickets point
at it. Save a version only when the file changed since the last save (keep the file's hash
per slug in `$STUDIO/objects/saved.json`).

**Read a document back.** `document-get` with `poc_id`, `slug` and `stage`; write its `content`
to the local file. A document saved with a link only comes back as its link; tell the person
the file is on the record and ask them to attach it when the build needs the file itself.

**Log an iteration.**

```json
{ "poc_id": "POC-acme-logistics-20261016", "phase": "plan", "source": "person",
  "actor_name": "Harshal", "title": "BRD: approval step moved before the SLA check",
  "reason": "G2 changes, round 1", "related_ticket": "FB-1031",
  "related_document": "POC-acme-logistics-20261016__3_scope__brd__v2" }
```

When the change points at how a POC Studio skill works, also raise a ticket with
`target_skill`.

**Raise a feedback ticket.** `feedback-create` with the exact words in `feedback` (in the
file, never in the command). Keep the `ticket_no`. The endpoint raises `open_feedback_count`.

**Close a ticket.** `feedback-review` with `ticket_no`, `status: resolved` (or
`not_incorporated`), `reviewed_by` and one line in `action_taken`. The endpoint lowers the
open count. `status: in_review` marks a ticket being worked on.

**Record any other event.** `log-activity` with `poc`, `type`, `actor_type`, `actor_name`,
`message` and the run state in `note`.

## Document types

| What POC Studio makes | `type` | `format` | Stage |
|---|---|---|---|
| the client profile; the kickoff brief | `brief` | `markdown` | `0_kickoff` |
| client files, notes and messages read in | `input` | `markdown` | where read |
| the context notes, the decision ledger | `requirements` | `markdown` | `1_signal_capture` |
| the research document | `scope` | `markdown` | `2_research_assess` (gate pack `g1`) |
| an email drafted for the client | `email` | `markdown` | where drafted |
| the BRD | `brd` | `markdown` | `3_scope` (gate pack `g2`) |
| the design system (style guide, tokens, logo kit) | `design_system` | `html` for the style guide, else `markdown` | `4_design_system` (gate pack `g2`) |
| the entity table, rehearsal, checks, unverified list, Text2Code prompt, a failure report | `build_report` | `markdown` | `5_build` or `6_finalize` |
| the app | `app` | `link` (`file_link`: the app's URL) | `6_finalize` (gate pack `g3`) |
| the G3 pack summary: beats and checks passed, what is unverified | `evidence_pack` | `markdown` | `6_finalize` (gate pack `g3`) |
| the demo script, the runbook | `demo_script` | `markdown` | `6_finalize`, `7_collaterals` |
| the explainer, the PDFs, the field note | `deck` | `html` for the explainer, else `markdown` | `7_collaterals` (gate pack `g4`) |
| the demo video | `video` | `link`, or `markdown` naming the file | `7_collaterals` (gate pack `g4`) |

The tenant also has `use_case`, `design`, `automation`, `object`, `agent`, `walkthrough` and
`poc_link` for the Orbit Studio app's own records; POC Studio does not write them.

Working documents (run-control.md § Working documents) take the type of the stage they belong
to (`requirements` up to stage 2, `scope` for 3, `design_system` for 4, `build_report` for 5
and 6, `demo_script` for 7), `gate_pack: none` (so `status: draft`), and a slug starting
`working-`.

## Run state

The POC object holds the outcome (`stage`, `status`, gate statuses and approvals,
`blocked_on`). What a session is doing, where to resume and the build mode are written in the
`note` of the activities POC Studio sends, as a block a resume can read:

```
run_state: running | waiting_gate | stalled | failed | done | abandoned
resume_from: <exact step>
build_mode: sonic | zen
session: <this session's link>
```

`poc-get` reads it back as `run_state` (each key from the newest activity that carries it).

## The save check (before every human step)

Before a gate is sent, and before any other question reaches the person:

1. `document-save` every document made or changed since the last check, and every working
   document that changed. Each answer's `document_id` is the confirmation that it is there.
2. `poc-update` the POC: whatever changed of `stage`, `status`, `blocked_on`, `demo_date`,
   and an activity (`stage_started`, `stage_completed`, or `input_added` for a check with no
   stage change) whose note carries the run state.
3. Before a gate, `poc-get` and check that the pack's documents are the latest versions and
   the open tickets match the gate message.

When any step fails after its retry, stop, show the person what failed and the error in a few
lines, and say what did not save. Do not send the gate or start the next step until the check
passes.

## Not covered by the API yet

- **A document's status after it is saved.** The endpoints set `superseded` on the previous
  version only. An approved gate shows on the POC (`g<n>_status`, both approvals and
  `g<n>_summary`); the pack's documents keep the status they were saved with. A document that
  must read `final` (the released runbook) is saved again as a new version with `status:
  final`.
- **Finding a POC by client.** `poc-get` needs the `poc_id`. A resume takes the ID from the
  person, from a gate's Slack message, or from `$STUDIO/objects/poc.ref` in the working folder
  (run-control.md § Resume).
