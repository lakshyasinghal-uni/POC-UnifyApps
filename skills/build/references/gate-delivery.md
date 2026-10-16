# Gate delivery: a Slack notification, approval in the Claude chat

Each of the four gates in [gates.md](gates.md) is **approved in the Claude chat**. Slack only
notifies: when a gate is ready, a message goes to the person's **personal Slack chat** (their
own direct-message conversation, posted as them through the Slack connection they set up)
saying what is ready to review, with links to the records, and asking them to approve in the Claude
chat. Replies in Slack are not read. Every other question of a build stays in the Claude chat
only (§ Questions in the Claude chat).

The person running POC Studio is the gate owner: theirs is the only answer POC Studio takes in
the chat. The POC's manager approves the same gate in the Orbit Studio app, and the gate passes
when both have approved ([objects.md](objects.md) § Phases, gates and the two approvals).

## Before sending a gate

1. Run the save check ([objects.md](objects.md) § The save check), with every pack document
   saved through `document-save` with `gate_pack: g<n>` (status `in_review`). For G3, also save
   the evidence pack (type `evidence_pack`) and the app (type `app`, `format: link`). If the
   check fails, the gate is not sent; show what failed and stop until it passes.
2. Post the Slack notification (below).
3. Close the phase's last stage with `poc-update`: `changes: {status: waiting}`, activity
   `stage_completed` whose note carries `run_state: waiting_gate`, `resume_from: G<n> · round
   <r>` and the Slack thread's `ts`.
4. Open the gate with `gate-open`:

   ```json
   { "poc_id": "<poc_id>", "gate": "g2", "actor_name": "AI · POC Studio",
     "gate_summary": "<two or three lines: what the approvers are deciding>",
     "posted_to": "<the Slack chat>",
     "message": "G2 · Scope and BRD posted: BRD v2, design system v1" }
   ```

   It sets `current_gate`, `g<n>_status: waiting`, `status: waiting`, `gate_summary`, resets
   both approvals for the gate and logs `gate_posted`.
5. `gate-open` refuses a gate that is already approved; that answer means the gate was settled
   elsewhere: `poc-get`, and carry on from the stage it shows.

On a merged gate (gates.md § Merged gates), open both gates, one call each.

## The Slack notification

Post one message in the person's personal chat (the self-DM ID setup saved, kept on the row as
`slack_channel`), in the POC's thread there (the first gate posts the root message; keep its
`ts` in `$STUDIO/objects/poc.ref` and in the `stage_completed` activity's note). Plain words, no tool or file names:

```
POC Studio · <Client> · <Gate name> (<G1|G2|G3|G4>) is ready for your approval
<one line: what is being decided>

To review:
• <Document title> v<n> — <record link>
Feedback since the last gate: FB-1007 (resolved), FB-1009 (open)

Please approve in the Claude chat for this POC.
<Manager name> approves it in the Orbit Studio app; it passes when you both have.
```

The record link is the record's page in the tenant's Objects Manager for that object and id.

## In the Claude chat

Show the pack (SendUserFile for the files) and ask ONE AskUserQuestion whose options are the
gate's reply words, with free text for `changes: …`. The build waits there for the answer.

## Reply words

| Gate | Approve | Other answers |
|---|---|---|
| G1 · Path | `approve` | `partial` (proceed with the cut list), `edited` (I edited the research document in the tenant), `block` |
| G2 · Scope and BRD | `approve` | `changes: <what>`, `stop` |
| G3 · Final review | `approve` | `changes: <what>`, `stop` |
| G4 · Release | `approve` | `changes: <what>`, `hold` |

Case and punctuation do not matter. A reply that carries the words with a sentence around it
(`approve, looks good`) counts.

## Reading the answer

- **Only the answer in the Claude chat counts.** Slack is a notification; nothing posted there
  is read as an answer.
- **Unclear answers are asked back.** A free-text answer that matches no reply word, or matches
  two, gets one question back quoting the reply words. Never pick the nearest.
- **Silence is not a yes.** The gate waits in the chat until the person answers. If the
  session ends first, the latest activity says `run_state: waiting_gate` and `resume_from: <gate> ·
  round <n>`, and the next resume shows the gate again.

## Questions in the Claude chat

Nothing but the four gate notifications goes to Slack. Zen clarifying questions and every stop the build
skill lists (a risky fix, a failed build, the design system's two stops, the narration
approval, a delete, a budget that cannot be met, a Nebula update that needs a fresh session, a
sign-in, a credential) are asked **in the Claude chat only**, with AskUserQuestion, after the
save check. Each says the step it comes from, the question, the Stand-in's suggested
answer when there is one, and these choices:

| Question | Choices |
|---|---|
| Zen question | the options, `Use suggestion`, or free text |
| Risky fix | `Apply all` · `Safe ones only` · `Change them` |
| Build failed | `Retry` · `Back to G2` · `Stop` |
| Brand hue | the two measured options |
| Client logo | `I attached it` · `Use a placeholder` |
| Narration | `Approve` · `I edited it` · `Skip the video` |
| Delete | `Delete` · `Keep` |
| Budget | `Cut something` · `Raise the budget` · `Stop` |
| Nebula restart | `Restarted` · `Stop` |

Up to four questions that arrive together go in one AskUserQuestion call. While one waits, the
latest activity says `run_state: waiting_gate` with `resume_from: <question> · <step>`, so a resume
asks it again. A chat question waits for the person. Each
answer is saved with the run's records: a Zen answer as an `OWNER` ledger row in the working
ledger, any other as a `gate_decided` activity (`log-activity`, `gate: none`) with the question's
header in its message. A credential's
values are never written anywhere.

## After a gate answer

Write the answer to Orbit before anything else happens:

| Answer | Call | What it writes |
|---|---|---|
| `approve`, `partial`, `edited` | `gate-owner-approve` with `phase_summary` (two to four lines: what the phase settled; for `partial`, the cut list) and `slack_ref` | `g<n>_owner_approved: true` and an `owner_approved` activity; when the manager has already approved, the gate passes |
| `changes: …` | `gate-request-changes` with `reason`: the exact words | `g<n>_status: changes_requested`, both approvals reset, `current_gate: none`, a `gate_decided` activity (`request_changes`) |
| `block`, `stop` | `poc-update`: `changes: {status: stopped, blocked_on: <the owner's reason>}`, activity `gate_decided`, `gate: g<n>`, `decision: stop`, run state `abandoned` | the POC stops at the gate |
| `hold` (G4) | `poc-update`: `changes: {status: blocked, blocked_on: "held · <reason>"}`, activity `gate_decided`, `gate: g4`, `decision: stop`, run state `waiting_gate` | the POC is held at G4 |

Then:

1. **`approve`, `partial`, `edited`:** read `passed` in the answer. `yes`: the gate has passed
   and the POC is on the next stage; carry on. `no`: wait for the manager (§ Waiting for the
   manager).
2. **`changes: …`:** raise one feedback ticket per change (`feedback-create`, `channel: gate`,
   `gate: g<n>`, `given_by_name` the owner), tagged `OWNER` in the ledger. Every change made for
   them is logged with `iteration-log` (`source: person`, the ticket in `related_ticket`). When
   the changes are done, open the same gate again with `gate-open` (round <r + 1>).
3. Run the save check again. Only then does the next phase start.
4. Post one line in the Slack thread: `<Gate> <answer>. Next: <what starts now>.` (a
   notification, like the gate message).

## Waiting for the manager

A gate passes only when the manager approves it too, in the Orbit Studio app. When the owner's
approval comes first (`passed: no`):

1. Say one line: `G<n> approved by you; waiting for <manager_name> to approve it in the Orbit
   Studio app.` Post the same line in the Slack thread.
2. Record the run state with `log-activity` (`type: nudge_sent`, `gate: g<n>`, message
   `Waiting for <manager_name> to approve G<n>`): `run_state: waiting_gate`, `resume_from: G<n>
   · manager approval`.
3. Ask in the Claude chat, header `Manager approval`: `Check again` · `Stop for now`.
   `Check again` runs `poc-get`:
   - `g<n>_status: approved`: the app passed the gate. Say `G<n> passed.` and carry on from the
     stage `poc-get` shows.
   - `g<n>_manager_approved: true` with `g<n>_status` still `waiting`: both approvals are in but
     the app did not pass the gate. Pass it with `poc-update`: `changes: {g<n>_status: approved,
     current_gate: none, stage: <the next stage, objects.md § Phases>, status: running (or
     demo_ready after G4), g<n>_summary: <the phase summary>}`, activity `gate_decided`,
     `gate: g<n>`, `decision: approve`, message `G<n> passed: approved by <owner> and
     <manager>`. Then carry on.
   - otherwise: say it is still waiting and ask again.
   `Stop for now` ends the turn; the run state already says where to pick up, and a resume asks
   again.
4. **No manager on the POC** (`manager_name` empty): the owner's approval is the only one.
   Pass the gate at once with the same `poc-update` as above, message `G<n> passed: approved by
   <owner> (no manager on this POC)`.

The manager may also send the gate back in the app (`g<n>_status: changes_requested`). `poc-get`
shows it; treat it as a `changes: …` answer whose words are the app's latest `gate_decided`
activity, and raise the tickets with `channel: app` and the manager as `given_by_name`.
