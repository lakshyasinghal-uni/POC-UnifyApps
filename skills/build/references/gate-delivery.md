# Gate delivery: a Slack notification, approval in the Claude chat

Each of the four gates in [gates.md](gates.md) is **approved in the Claude chat**. Slack only
notifies: when a gate is ready, a message goes to the person's **personal Slack chat** (their
own direct-message conversation, posted as them through the Slack connection they set up)
saying what is ready to review, with links to the records, and asking them to approve in the Claude
chat. Replies in Slack are not read. Every other question of a build stays in the Claude chat
only (§ Questions in the Claude chat).

The person running POC Studio is the gate owner: theirs is the only answer that counts.

## Before sending a gate

1. Run the save check ([objects.md](objects.md) § The save check). If it fails, the gate is
   not sent; show what failed and stop until it passes.
2. Set the POC row: `current_gate` to the gate (`g1` … `g4`), `g<n>_status: waiting`,
   `status: waiting`.
3. Set every document in the pack to `in_review` with `gate_pack: g<n>` (for G3, also save the
   evidence pack: type `evidence_pack`). After the Slack post, record a `gate_posted` activity:
   actor `ai`, message `<Gate name> posted: <what is in the pack>`, `posted_to` the Slack chat,
   and the run state block with `run_state: waiting_gate` and `resume_from: G<n> · round
   <r>`.

## The Slack notification

Post one message in the person's personal chat (the self-DM ID setup saved, kept on the row as
`slack_channel`), in the POC's thread there (the first gate posts the root message; keep its
`ts` in `$STUDIO/objects/poc.ref` and in the `gate_posted` activity's note). Plain words, no tool or file names:

```
POC Studio · <Client> · <Gate name> (<G1|G2|G3|G4>) is ready for your approval
<one line: what is being decided>

To review:
• <Document title> v<n> — <record link>
Feedback since the last gate: FB-1007 (resolved), FB-1009 (open)

Please approve in the Claude chat for this POC.
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
ledger, any other as a `gate_decided` activity (`gate: none`) with the question's header in
its message. A credential's
values are never written anywhere.

## After a gate answer

1. Record a `gate_decided` activity: actor `person` (the owner), `gate: g<n>`, `decision`
   (`approve` for `approve`, `partial` and `edited`; `request_changes` for `changes: …`;
   `stop` for `block`, `stop` and `hold`), message `<name> <answer> <Gate name>`, and in
   `note` the exact words, the tickets raised and the run state block.
2. Set the POC row's `g<n>_status`: `approved` for `approve`, `partial` and `edited`,
   `changes_requested` for `changes: …`; it stays `waiting` for `block`, `stop` and `hold`,
   where the POC's `status` says the rest. `current_gate: none` unless the gate is asked again;
   and the stage.
3. Set the pack's documents to `approved` when approved, or leave them `in_review` while
   changes run.
4. Every `changes: …` becomes one feedback ticket per change, tagged `OWNER`.
5. Run the save check again. Only then does the next phase start.
6. Post one line in the Slack thread: `<Gate> <answer>. Next: <what starts now>.` (a
   notification, like the gate message).
