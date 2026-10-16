# Run control: build mode, new or resume, run state, working documents, failures

One POC is one row in `orbit_studio_poc`, however many sessions work on it, with its history in
`orbit_studio_activity` and its changes between gates in `orbit_studio_iteration`. This file says how a
session starts or picks up that row, keeps it current, and leaves it in a state the next
session can carry on from. Every read and write below is a call to the Orbit Studio API, as
[objects.md](objects.md) § Which call at which step says.

## New build or resume

Decide from the person's words, never from what the objects hold:

- **A new build** ("build a POC for…", "start a demo for…", `/poc-studio:build <request>`):
  always a new POC row, even when the same client or use case already has one. Never resume
  automatically.
- **A resume** ("pick up", "continue", "resume", a POC ID such as `POC-acme-logistics-20261015`, or "the Acme
  build"): find the row, confirm it, carry on (§ Resume).

When the words could be either, ask one question: `Start a new POC, or continue an existing
one?`

## Build mode (new builds only)

Asked once, in the chat, before anything else is written: one question, header `Build mode`,
two options:

| Option | What happens |
|---|---|
| **Sonic** | No questions during the build; only the four gates reach the person (and the stops the build skill lists). Nebula runs in Sonic mode. The Stand-in answers open points for the person and logs them. |
| **Zen** | The build may ask clarifying questions at any step. Nebula runs in Zen mode with its Zen skills and questionnaires. The Stand-in only drafts a suggested answer for each question; the person answers. |

Record it in the run state block of every activity as `build_mode: sonic` or `zen`
(objects.md § Run state); the `poc_started` activity carries it first. A resume uses the stored
mode and never asks again. Gates, the save check and feedback tickets work the same in both.

### What changes in Zen

| Step | Sonic | Zen |
|---|---|---|
| Open ledger rows | the Stand-in answers, tagged `STAND-IN` | each row the team cannot settle from a source becomes a question to the person, with the Stand-in's draft as the suggested answer; the answer is tagged `OWNER` |
| Scoping questionnaires (round 1 and 2) | written with the ledger's answers | sent to the person, one round per message, in Nebula's questionnaire shape (`zen-brainstorming`), with the Stand-in's draft beside each question |
| Nebula | `--mode sonic`, `fast` briefs, `sonic-plan` | `--mode zen`, Nebula's Zen skills (`zen-brainstorming`, `zen-routing` and their run loop), as nebula-bridge.md § Zen mode says |
| A builder's `needs_confirmation` | client decisions to the Stand-in | client decisions to the person, with the Stand-in's draft |
| Deploys and publishes | do not wait (`## Ready when` is the yes) | as Nebula's Zen run loop asks |

Every Zen question is asked in the Claude chat only (gate-delivery.md § Questions in the
Claude chat); only the four gates go to Slack. Group questions that arrive together into one
AskUserQuestion call, up to four.

## Creating the row (new builds)

Call `poc-create` (objects.md § Recipes) with: `client_name`, `client_slug`, `use_case`,
`brief` (the person's request as typed), `tier`, `owner_name` and `owner_email` (the person
running this session), `manager_name` and `manager_email` (from `poc-studio.yml` `manager`;
left out when there is none), `approvers` (owner and manager), `started_by` (the same person),
`demo_date` when known, `slack_channel` (their personal Slack chat, from `poc-studio.yml`),
`tenant_host` when the profile names it, and `build_mode`.

The endpoint makes the `poc_id` (`POC-<client-slug>-<yyyymmdd>`, with the time added when that
key is taken), starts the POC at `0_kickoff` with every gate `pending` and `status: running`,
and logs `poc_started` with the build mode in its run state. Keep the returned `poc_id` in
`$STUDIO/objects/poc.ref` and use it in every later call. If the answer is lost after the row
may have been written, `poc-get` the expected key before trying again; never create a second
row.

Then record this session's link with `poc-update` (`changes: {status: running}`; activity
`stage_started`, `stage: 0_kickoff`, note `run_state: running`, `resume_from: 0_kickoff`, the
`build_mode` and `session: <link>`).

## Resume

1. Find the POC's ID: the one the person gave (`POC-acme-logistics-20261015`), else the one in
   `$STUDIO/objects/poc.ref` of the working folder, else the one in the gate messages in their
   Slack chat (search it for `POC Studio · <client>`). When none of these gives an ID, ask for
   it in one line; never guess one.
2. `poc-get` it. Show in the chat: POC ID, client and use case, stage, status, the open gate and
   its two approvals, run state, build mode, resume point and last activity. Ask one question
   to confirm.
3. When the run state is `running`, the latest activity is under 2 hours old and its `session`
   is a different one, say whose session and how long ago, and ask `Take over from that
   session?` (`Take over`, `Leave it`). Carry on only on a yes.
4. Record the restart with `poc-update`: `changes: {status: running}` (or `waiting` when a gate
   is open), activity `poc_restarted` with this session's link in its run state block.
5. **Read the working documents back** into `$STUDIO` with `document-get` (§ Working documents;
   `poc-get` lists the latest version of each), and the approved research, BRD and design
   system into the working folder. A working document Orbit does not have is rebuilt from the
   approved documents, and a ticket says so.
6. **Show the open gate or question again** in the Claude chat, if one was waiting. A gate
   waiting on the manager (`resume_from: G<n> · manager approval`) goes straight to
   gate-delivery.md § Waiting for the manager.
7. Use the stored `build_mode`. Carry on from `resume_from`. Say one line: `Resuming
   <poc_id> (<client> · <use case>) in <Sonic | Zen> from <resume_from>.`

## Run state

Written in the note of an activity (objects.md § Run state) at every save check, and whenever
it changes. The POC row's fields in the last column change in the same `poc-update`:

| `run_state` | Set when | `resume_from` | The POC row |
|---|---|---|---|
| `running` | a session is working on the POC | the step just started, e.g. `1_signal_capture · discovery wave` | `status: running`, `blocked_on` cleared |
| `waiting_gate` | a gate or Zen question is sent and the turn ends waiting | `G2 · round 1`, or `Zen question · 3_scope · <key>` | `status: waiting` |
| `stalled` | the session stops before the phase is done: the person stops it, a required connection is lost, a Nebula update needs a fresh session | the exact step to redo, e.g. `5_build · plan task t7` | `status: blocked`, `blocked_on`: what stopped it |
| `failed` | a Nebula plan or the code app build fails and cannot be fixed in the run (§ Failed build) | `5_build · <plan id> · task <id>` | `status: blocked`, `blocked_on`: the failure |
| `done` | G4 approved (released) | `G4 · released` | `status: demo_ready`, `stage: 8_demo_ready` |
| `abandoned` | the owner chooses stop at a gate or a failure | where it stopped | `status: stopped`, `blocked_on`: the owner's reason |

Before a turn ends without a gate open (an error, the person leaving, a stop), record
`stalled` with the exact `resume_from` (`poc-update`: `status: blocked`, `blocked_on`, activity
`poc_stopped`). A POC whose latest activity says `running` and is
older than 2 hours is treated as stalled by the next resume.

## Working documents

The only documents sent for review are the research document, the BRD, the design system and
the collaterals (and the app itself). Everything the team writes along the way lives in
`$STUDIO` while a session works and is saved as a working document (objects.md § Recipes,
`document-save` with `gate_pack: none`, so `status: draft`, the type of their stage as
objects.md § Document types says) at every save check when they changed, so a resume in a
new chat can carry on:

| Slug | File | From |
|---|---|---|
| `working-ledger` | `ledger.md` | phase 1 on |
| `working-rulings` | `rulings.md` | round 1 on |
| `working-storylines` | `storylines.md` | phase 1 on |
| `working-scout` | `scout.md` (tenant map and capability table) | phase 1 on |
| `working-context-notes` | `context-notes.md` (what the client and team said) | phase 1 on |
| `working-data-plan` | `data-plan.md` | phase 1 on |
| `working-design` | `design.md` | round 2 on |
| `working-code-design` | `code-design.md` | round 2 on |
| `working-profile` | the client profile | phase 0 on |
| `working-brief` | the Nebula brief | phase 3 on |
| `working-entity-table` | the entity table with builder links (Markdown) | after every `plan finish`, and on a failure |
| `working-rehearsal`, `working-checks`, `working-unverified` | rehearsal (with shots), check results, the unverified list | phase 3 on |
| `working-demo-script`, `working-text2code` | the demo script and the Text2Code prompt | phase 3 on |

## Failed build

When a Nebula plan, a later task or the code app build fails and the fix loop cannot recover
it (when-something-fails.md):

1. `plan finish` (or `plan get`) for whatever was built; write `entity-table.md` with every
   entity that exists, its builder link and whether the beats need it.
2. Save a failure document (slug `failure`, type `build_report`, stage `5_build`): what was
   being built, the exact task and error, what was tried, the partial entity table, and what
   each option below would do. Nothing on the tenant is deleted; partial entities are kept for
   reuse or listed for the owner to remove by hand.
3. Record the run state `failed` with `resume_from: <step>` in one `poc-update` (`status:
   blocked`, `blocked_on: <one line>`, activity `poc_stopped`), run the save check, then ask in the Claude chat (gate-delivery.md § Questions in the Claude
   chat), header
   `Build failed`: `retry` (run the failed task again, once), `back to G2` (reopen G2 with
   a smaller scope; the BRD gets a new version), `stop` (`poc-update`: run state `abandoned`, `status:
   stopped`, and a `poc_stopped` activity). Wait for the owner.
