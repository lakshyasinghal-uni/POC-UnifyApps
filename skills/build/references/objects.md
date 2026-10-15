# Orbit Studio objects: where every POC, document, decision and piece of feedback is saved

Each POC's record lives in four UnifyApps objects on the tenant (by default
`https://orbit.uat.unifyapps.com`):

| Object | One row per | Key (built by POC Studio; the tenant generates none) |
|---|---|---|
| `orbit_studio_poc` | POC | `poc_id`: `POC-<client-slug>-<YYYYMMDD>` |
| `orbit_studio_document` | document version | `document_id`: `<poc_id>__<stage>__<slug>__v<n>` |
| `orbit_studio_feedback` | piece of feedback | `ticket_no`: `FB-<n>` |
| `orbit_studio_activity` | event in the POC's life | `activity_id`: `ACT-<n>` |

A record's `id` is its key, and the `poc` field on documents, feedback and activity holds the
POC's `poc_id`.

## How records reach Orbit

Every write goes through the **POC Studio API**: automations hosted on Orbit and published in
API Manager, which fill these four objects. POC Studio calls them with an API key; it never
signs in to Orbit and never calls Orbit's own REST endpoints. The API is being built, so until
its endpoints are listed here:

- Every record below is still prepared exactly as described, and kept as one JSON file per
  record under `$STUDIO/objects/<object>/<key>.json` (an update rewrites the file with the
  merged fields). Nothing is sent to Orbit.
- Tell the person once per session, in one line: `Orbit write-back is off until the POC Studio
  API is live; records are kept in the working folder.`
- Resume reads the same files.

## The four objects

Write each value exactly as below; these are the tenant's own options as read on 2026-10-15.
When the tenant changes, this table is updated to match. **Bold** fields are required.

### `orbit_studio_poc`

| Field | Value |
|---|---|
| **`poc_id`** | `POC-<client-slug>-<YYYYMMDD>` (the start date). When that key is taken, add the start time: `POC-<client-slug>-<YYYYMMDD>-<HHMM>` |
| **`client_name`**, **`client_slug`**, **`use_case`** | text |
| `brief` | the person's request, as typed |
| **`tier`** | `express`, `standard`, `full` |
| **`owner_name`**, `owner_email`, `approvers` | the person running the session is the owner and the approver |
| **`started_by`**, **`started_at`** | who started it, and when |
| `demo_date` | epoch milliseconds |
| **`stage`** | `0_kickoff`, `1_signal_capture`, `2_research_assess`, `3_scope`, `4_design_system`, `5_build`, `6_finalize`, `7_collaterals`, `8_demo_ready` |
| **`current_gate`** | `none`, `g1`, `g2`, `g3`, `g4` |
| **`g1_status`** … **`g4_status`** | `pending`, `waiting`, `approved`, `changes_requested` |
| **`status`** | `running`, `waiting`, `blocked`, `stopped`, `demo_ready` |
| `blocked_on` | one line: why it is blocked, stopped or held |
| `slack_channel` | the person's own Slack chat for gate notifications |
| `watch_email` | who else follows the POC, when the person names someone |
| `last_activity`, `last_activity_at` | one line, and when |
| `documents_count`, `open_feedback_count` | numbers |
| `tenant_host` | the tenant the app is built on |

### `orbit_studio_document`

| Field | Value |
|---|---|
| **`document_id`** | `<poc_id>__<stage>__<slug>__v<n>` |
| **`poc`** | the `poc_id` |
| **`name`** | the document's title |
| **`type`** | `brief`, `input`, `requirements`, `scope`, `email`, `brd`, `design_system`, `build_report`, `app`, `evidence_pack`, `demo_script`, `deck`, `video` (§ Document types) |
| **`stage`** | as the POC's `stage` |
| `gate_pack` | `none`, `g1`, `g2`, `g3`, `g4`: the gate whose pack it is in |
| **`version`** | `1`, `2`, … |
| **`status`** | `draft`, `in_review`, `approved`, `final`, `superseded` |
| `summary` | one line |
| `content` | the text itself, for text files under ~1 MB |
| `file` | the uploaded file |
| `file_link` | a link to the thing itself when it lives elsewhere (the app's URL) |
| `path_in_build_session` | the local path it came from |
| `size_bytes` | number |
| **`created_by`**, **`saved_at`** | who saved it, and when |

### `orbit_studio_feedback`

| Field | Value |
|---|---|
| **`ticket_no`** | `FB-<n>`: the highest existing number + 1 |
| **`poc`** | the `poc_id` |
| **`title`**, **`feedback`** | a short title; the exact words |
| `quote` | the passage the feedback is about, when there is one |
| `client_name` | the POC's client |
| `poc_stage` | as the POC's `stage` |
| `gate` | `none`, `g1`, `g2`, `g3`, `g4` |
| `related_document` | the `document_id` it is about |
| **`category`** | `process`, `output`, `skill`, `ux`, `bug`, `other` |
| **`severity`** | `low`, `medium`, `high` |
| **`channel`** | `app`, `gate`, `slack`, `email`, `session` (`session` for the Claude chat, `gate` for a gate answer) |
| `channel_ref` | the Slack message link, when there is one |
| `target_skill` | the plugin skill or agent it is about, for `skill` feedback |
| `parent_ticket` | the ticket it follows on from |
| **`status`** | `open`, `in_review`, `resolved`, `not_incorporated` |
| `action_taken`, `reviewed_by`, `resolved_at` | what was done, by whom, when |
| **`given_by_name`**, `given_by_email` | who gave it |
| **`created_at`** | when |

### `orbit_studio_activity`

| Field | Value |
|---|---|
| **`activity_id`** | `ACT-<n>`: the highest existing number + 1 |
| **`poc`** | the `poc_id` |
| **`type`** | `poc_started`, `stage_started`, `stage_completed`, `document_saved`, `gate_posted`, `gate_decided`, `feedback_created`, `feedback_reviewed`, `input_added`, `nudge_sent`, `poc_stopped`, `poc_restarted` |
| `stage` | the POC's stage |
| `gate` | `none`, `g1`, `g2`, `g3`, `g4` |
| `decision` | for `gate_decided`: `approve`, `request_changes`, `stop` |
| **`actor_type`** | `ai`, `person`, `system` |
| **`actor_name`**, `actor_email` | `AI · <agent or step>` for `ai`; the person's name for `person` |
| **`message`** | one line a person can read: `Harshal approved G2 (Scope and BRD)` |
| `note` | the run state block (§ Run state) and any detail |
| `related_document`, `related_ticket` | the `document_id` or `ticket_no` |
| `posted_to` | where a notification went (the Slack chat) |
| **`created_at`** | when |

## Document types

| What POC Studio makes | `type` | Stage |
|---|---|---|
| the client profile; the kickoff brief | `brief` | `0_kickoff` |
| client files, notes and messages read in | `input` | where read |
| the context notes, the decision ledger | `requirements` | `1_signal_capture` |
| the research document | `scope` | `2_research_assess` (gate pack `g1`) |
| an email drafted for the client | `email` | where drafted |
| the BRD | `brd` | `3_scope` (gate pack `g2`) |
| the design system (style guide, tokens, logo kit) | `design_system` | `4_design_system` (gate pack `g2`) |
| the entity table, rehearsal, checks, unverified list, Text2Code prompt, a failure report | `build_report` | `5_build` or `6_finalize` |
| the app (link in `file_link`) | `app` | `6_finalize` (gate pack `g3`) |
| the G3 pack summary: beats and checks passed, what is unverified | `evidence_pack` | `6_finalize` (gate pack `g3`) |
| the demo script, the runbook | `demo_script` | `6_finalize`, `7_collaterals` |
| the explainer, the PDFs, the field note | `deck` | `7_collaterals` (gate pack `g4`) |
| the demo video | `video` | `7_collaterals` (gate pack `g4`) |

Working documents (run-control.md § Working documents) take the type of the stage they belong
to (`requirements` up to stage 2, `scope` for 3, `design_system` for 4, `build_report` for 5
and 6, `demo_script` for 7), `status: draft`, and a slug starting `working-`.

## Run state

The POC object holds the outcome (`stage`, `status`, gate statuses, `blocked_on`). What a
session is doing, where to resume and the build mode are written in the `note` of every
activity POC Studio records, as a block a resume can read:

```
run_state: running | waiting_gate | stalled | failed | done | abandoned
resume_from: <exact step>
build_mode: sonic | zen
session: <this session's link>
```

The POC's latest activity (by `created_at`) is its current run state.

## Recipes

**Create the POC row.** Build the `poc_id` (adding the time when a row with that key exists),
then create the `orbit_studio_poc` record with the fields run-control.md § Creating the row
lists. Write the `poc_id` to `$STUDIO/objects/poc.ref`. Then record a `poc_started` activity.

**Update the POC row.** Change only the fields that change, and always `last_activity` (one
line) and `last_activity_at` (now).

**Record an activity.** Take the next free `ACT-<n>`, then create the activity with
the fields above, the run state block in `note`, and `created_at` now. Record one at the start
and end of every stage (`stage_started`, `stage_completed`), for every document saved, every
gate posted and decided, every ticket raised and closed, and when the POC stops or restarts.

**Save a document.**
1. Find this POC's documents whose `document_id` has this stage and slug; the next version is
   the highest `version` + 1.
2. Attach the file (skip for a link-only record such as the app).
3. Create the document with `document_id`, `poc`, `name`, `type`, `stage`,
   `gate_pack`, `version`, `status`, `summary`, `content` (text files), `file`,
   `path_in_build_session`, `size_bytes`, `created_by`, `saved_at`.
4. Set the previous version to `status: superseded`.
5. Update the POC row's `documents_count` and `last_activity`, and record a
   `document_saved` activity with `related_document`.

**Fetch a document back** (resume, `edited` at a gate). Find the highest version of the slug as
above and write its `content` to the local file. When it has no `content`, tell the person the
file is on the record and ask them to attach it.

**Raise a feedback ticket.** Take the next free `FB-<n>`, then create the ticket (`status:
open`, `created_at` now). Then update the POC row's `open_feedback_count` and
record a `feedback_created` activity with `related_ticket`.

**Close a ticket.** Update the ticket with `status: resolved`
(or `not_incorporated`), `action_taken` (one line), `reviewed_by` and `resolved_at`; lower the
POC row's `open_feedback_count`; record a `feedback_reviewed` activity.

## The save check (before every human step)

Before a gate is sent, and before any other question reaches the person:

1. Save every document made or changed since the last check, and every working document that
   changed.
2. Confirm the latest version of each document is there.
3. Update the POC row (`stage`, `status`, `current_gate`, gate statuses, `blocked_on`, the
   counts, `last_activity`, `last_activity_at`) and record an activity whose note carries the
   run state.

When any step fails, stop, show the person what failed and the error in a few lines, and say
what did not save. Do not send the gate or start the next step until the check passes.
