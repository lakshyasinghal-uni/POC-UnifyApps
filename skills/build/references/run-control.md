# Run control: build mode, new or resume, run state, working documents, failures

One POC is one row in `poc_studio_poc`, however many sessions work on it. This file says how a
session starts or picks up that row, keeps it current, and leaves it in a state the next
session can carry on from. Every command below is `node "${CLAUDE_PLUGIN_ROOT}/scripts/orbit-api.mjs"`
(or the same calls from a signed-in tab, orbit-records.md).

## New build or resume

Decide from the person's words, never from what Orbit holds:

- **A new build** ("build a POC for…", "start a demo for…", `/poc-studio:build <request>`):
  always a new POC row, even when the same client or use case already has one. Never resume
  automatically.
- **A resume** ("pick up", "continue", "resume", a POC ID such as `POC-_1007`, or "the Acme
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

Store it on the row as `build_mode` (`sonic` or `zen`). A resume uses the stored mode and
never asks again. Gates, the write-back check and feedback tickets work the same in both.

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

`new-poc @<file>` with: `client`, `client_slug`, `use_case`, `use_case_slug`, `poc_name`
(`<Client> · <use case in a few words>`), `owner` and `started_by` (the person running this
session, with their Slack ID), `approvers` (the same person), `gate_destination` and
`slack_channel` (their personal Slack chat, from their settings), `tier`, `demo_date`, `build_mode`, `stage: 0_kickoff`, `status: running`,
`run_state: running`, `current_gate: none`, all four gate statuses `not_started`, and
`active_session` (this session's link). **Never pass `poc_id`**: Orbit generates it
(`POC-_1001`, `POC-_1002`, …). Read it from the command's output and use it everywhere,
including every document key `<poc_id>__<stage>__<file-slug>__v<n>`. If the output carries no
ID, find the row with `find-poc` before trying again; never create a second one.

## Resume

1. `find-poc <what the person gave>`: a POC ID, a name, a client or a use case.
2. Show the matches in the chat, at most five: POC ID, name, stage, run state, build mode,
   resume point and last activity. Ask one question to confirm which (even when only one
   matches).
3. `claim --poc <id> --session <this session's link>`. Exit 4 means another session's heartbeat
   is younger than 2 hours: say whose and how long ago, and ask `Take over from that session?`
   (`Take over`, `Leave it`). Take over only on a yes (`--force`).
4. **Read the working documents back** from Orbit into `$STUDIO` (§ Working documents,
   `fetch-doc` each latest version), and the approved research, assessment, BRD and design
   system into the working folder. A working document Orbit does not have is rebuilt from the
   approved documents, and a ticket says so.
5. **Show the open gate or question again** in the Claude chat, if one was waiting.
6. Use the row's `build_mode`. Carry on from `resume_from`. Say one line: `Resuming
   <poc_id> (<name>) in <Sonic | Zen> from <resume_from>.`

## Run state

Kept current at every write-back check with `heartbeat`, and whenever it changes:

| `run_state` | Set when | `resume_from` | `stall_reason` |
|---|---|---|---|
| `running` | a session is working on the POC | the step just started, e.g. `1_signal_capture · discovery wave` | cleared |
| `waiting_gate` | a gate or Zen question is sent and the turn ends waiting | `G2 · round 1`, or `Zen question · 3_scope · <key>` | cleared |
| `stalled` | the session stops before the phase is done: the person stops it, a required connection is lost, a Nebula update needs a fresh session | the exact step to redo, e.g. `5_build · plan task t7` | one line: what stopped it |
| `failed` | a Nebula plan or the code app build fails and cannot be fixed in the run (§ Failed build) | `5_build · <plan id> · task <id>` | the failure, one line |
| `done` | G4 approved (released) | `G4 · released` | cleared |
| `abandoned` | the owner chooses stop at a gate or a failure | where it stopped | the owner's reason |

`active_session` and `last_heartbeat_at` are set by every `claim` and `heartbeat`. Before a
turn ends without a gate open (an error, the person leaving, a stop), set `stalled` with the
exact `resume_from`. A row left `running` whose heartbeat is older than 2 hours is treated as
stalled by the next `claim`.

`status` stays the POC's outcome (`running`, `waiting_on_gate`, `blocked`, `stopped`, `held`,
`released`); `run_state` is what a session is doing with it.

## Working documents

The only documents sent for review are the research document, the BRD, the design system and
the collaterals (and the app itself). Everything the team writes along the way lives in
`$STUDIO` while a session works and is saved to Orbit as a working document
(type `other`, status `draft`) at every write-back check when they changed, so a resume in a
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
| `entity-table` | the entity table with builder links (Markdown) | after every `plan finish`, and on a failure |
| `working-rehearsal`, `working-checks`, `working-unverified` | rehearsal (with shots), check results, the unverified list | phase 3 on |
| `working-demo-script`, `working-text2code` | the demo script and the Text2Code prompt | phase 3 on |
| `run-log` | this session: link, start, steps done, how it ended | at every write-back check |

## Failed build

When a Nebula plan, a later task or the code app build fails and the fix loop cannot recover
it (when-something-fails.md):

1. `plan finish` (or `plan get`) for whatever was built; write `entity-table.md` with every
   entity that exists, its builder link and whether the beats need it.
2. Save a failure document (`save-doc --slug failure --type other --stage 5_build`): what was
   being built, the exact task and error, what was tried, the partial entity table, and what
   each option below would do. Nothing on the tenant is deleted; partial entities are kept for
   reuse or listed for the owner to remove by hand.
3. `heartbeat --run-state failed --resume-from "<step>" --stall-reason "<one line>"`, run the
   write-back check, then ask in the Claude chat (gate-delivery.md § Questions in the Claude
   chat), header
   `Build failed`: `retry` (run the failed task again, once), `back to G2` (reopen G2 with
   a smaller scope; the BRD gets a new version), `stop` (`run_state: abandoned`, `status:
   stopped`). Wait for the owner.
