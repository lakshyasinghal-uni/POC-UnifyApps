# Orbit Studio objects: where every POC, document, decision and piece of feedback is saved

Each POC's record lives in four UnifyApps objects on the tenant (by default
`https://orbit.uat.unifyapps.com`):

| Object | One row per | Key (built by POC Studio; the tenant generates none) |
|---|---|---|
| `orbit_studio_poc` | POC | `poc_id`: `POC-<client-slug>-<YYYYMMDD>` |
| `orbit_studio_document` | document version | `document_id`: `<poc_id>__<stage>__<slug>__v<n>` |
| `orbit_studio_feedback` | piece of feedback | `ticket_no`: `FB-<n>` |
| `orbit_studio_activity` | event in the POC's life | `activity_id`: `ACT-<n>` |

A record's `id` is its key, so `get <object> <key>` reads it, and the `poc` field on documents,
feedback and activity holds the POC's `poc_id`. Every read and write goes through one plain REST
client:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/ua-objects.mjs" <command> … [--debug] [--log <file>]
```

It runs from the shell only. It never uses a browser tab, never maps or checks values, and keeps
no queue: what is passed is what is sent, and the server's answer comes back as one JSON line.

## Signing in

Set these as environment secrets. Never ask for them in the chat and never print them.

| Variable | What |
|---|---|
| `UA_BASE` | tenant origin; default `https://orbit.uat.unifyapps.com` |
| `UA_COOKIE` | the whole Cookie header of a signed-in session (works for SSO accounts), or |
| `UA_USERNAME` + `UA_PASSWORD` | a local (non-SSO) account; the client logs in on each run |
| `UA_IDP` | the tenant's local identity provider id (orbit.uat: `65d2f4cf672d16da08efc3d0`) |

Exit 0 is done, 1 is an error (the server's status and message are in the JSON), 2 is not
signed in.

## Commands

| Command | Use |
|---|---|
| `whoami` | who is signed in; the cheapest session check |
| `schema <object>` | the object's fields, required fields and dropdown options as the tenant has them |
| `get <object> <key>` · `exists <object> <key>` | one record; or only whether it exists |
| `find <object> [--where field=value]… [--limit n \| --all] [--sort field:desc]` | records matching every `--where` |
| `next-id <object> --field <key field> --prefix <text>` | the next free key, e.g. `--field ticket_no --prefix FB-` gives `FB-1017` |
| `create <object> @file` | a new record from a JSON file of properties, key included |
| `update <object> <key> @file` | read the record, merge these properties, write it back with its version |
| `upload <path>` | upload a file; prints the value for the `file` field |

Pass properties as `@file` (a JSON file under `$STUDIO/objects/`), so a person's words never sit
in a shell command. Dates and times are epoch milliseconds (`date +%s000`); `demo_date` too.
There is no delete command.

## Debugging

Add `--debug` to any command to print every request and response (method, path, status, time,
bodies cut at 2,000 characters) to the terminal, or `--log $STUDIO/objects/requests.jsonl` to
keep them. The password and cookie are never printed. When a write fails, run the same command
again with `--debug` and show the person the failing request and the server's answer.

## The four objects

Write each value exactly as below; these are the tenant's own options as read on 2026-10-15.
When `schema` shows something different, the tenant wins: use its value and tell the person in
one line. **Bold** fields are required.

### `orbit_studio_poc`

| Field | Value |
|---|---|
| **`poc_id`** | `POC-<client-slug>-<YYYYMMDD>` (the start date). When `exists` says it is taken, add the start time: `POC-<client-slug>-<YYYYMMDD>-<HHMM>` |
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
| `file` | the value `upload` printed |
| `file_link` | a link to the thing itself when it lives elsewhere (the app's URL) |
| `path_in_build_session` | the local path it came from |
| `size_bytes` | number |
| **`created_by`**, **`saved_at`** | who saved it, and when |

### `orbit_studio_feedback`

| Field | Value |
|---|---|
| **`ticket_no`** | `next-id orbit_studio_feedback --field ticket_no --prefix FB-` |
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
| **`activity_id`** | `next-id orbit_studio_activity --field activity_id --prefix ACT-` |
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

The latest activity for the POC (`find orbit_studio_activity --where poc=<poc_id> --sort
created_at:desc --limit 1`) is the POC's current run state.

## Recipes

**Create the POC row.** Build the `poc_id`, check it with `exists`, then `create
orbit_studio_poc @$STUDIO/objects/poc.json` with the fields run-control.md § Creating the row
lists. Write the `poc_id` to `$STUDIO/objects/poc.ref`. Then record a `poc_started` activity.

**Update the POC row.** `update orbit_studio_poc <poc_id> @file` with only the fields that
change, and always `last_activity` (one line) and `last_activity_at` (now).

**Record an activity.** `next-id` for the key, then `create orbit_studio_activity @file` with
the fields above, the run state block in `note`, and `created_at` now. Record one at the start
and end of every stage (`stage_started`, `stage_completed`), for every document saved, every
gate posted and decided, every ticket raised and closed, and when the POC stops or restarts.

**Save a document.**
1. `find orbit_studio_document --where poc=<poc_id> --all` and take the rows whose
   `document_id` has this stage and slug; the next version is the highest `version` + 1.
2. `upload <path>` (skip for a link-only record such as the app).
3. `create orbit_studio_document @file` with `document_id`, `poc`, `name`, `type`, `stage`,
   `gate_pack`, `version`, `status`, `summary`, `content` (text files), `file`,
   `path_in_build_session`, `size_bytes`, `created_by`, `saved_at`.
4. `update` the previous version to `status: superseded`.
5. `update` the POC row's `documents_count` and `last_activity`, and record a
   `document_saved` activity with `related_document`.

**Fetch a document back** (resume, `edited` at a gate). Find the highest version of the slug as
above and write its `content` to the local file. When it has no `content`, tell the person the
file is on the record and ask them to attach it.

**Raise a feedback ticket.** `next-id` for the `ticket_no`, then `create orbit_studio_feedback
@file` (`status: open`, `created_at` now). Then `update` the POC row's `open_feedback_count` and
record a `feedback_created` activity with `related_ticket`.

**Close a ticket.** `update orbit_studio_feedback <ticket_no> @file` with `status: resolved`
(or `not_incorporated`), `action_taken` (one line), `reviewed_by` and `resolved_at`; lower the
POC row's `open_feedback_count`; record a `feedback_reviewed` activity.

## The save check (before every human step)

Before a gate is sent, and before any other question reaches the person:

1. Save every document made or changed since the last check, and every working document that
   changed.
2. `find orbit_studio_document --where poc=<poc_id> --all` and confirm the latest version of
   each document is there.
3. Update the POC row (`stage`, `status`, `current_gate`, gate statuses, `blocked_on`, the
   counts, `last_activity`, `last_activity_at`) and record an activity whose note carries the
   run state.

When any step fails, stop. Run the failing command again with `--debug`, show the person the
request and the server's answer in a few lines, and say what did not save. Exit 2 means the
session is not signed in: ask them to refresh `UA_COOKIE` (or check `UA_USERNAME` and
`UA_PASSWORD`). Do not send the gate or start the next step until the check passes.
