# Gate delivery: a Slack notification, approval in the Claude chat

Each of the four gates in [gates.md](gates.md) is **approved in the Claude chat**. Slack only
notifies: when a gate is ready, a message goes to the person's **personal Slack chat** (their
own direct-message conversation, posted as them through the Slack connection they set up)
saying what is ready to review, with the Orbit links, and asking them to approve in the Claude
chat. Replies in Slack are not read. Every other question of a build stays in the Claude chat
only (§ Questions in the Claude chat).

The person running POC Studio is the gate owner: theirs is the only answer that counts.

## Before sending a gate

1. Run the write-back check ([orbit-records.md](orbit-records.md) § The write-back check).
   If it fails, the gate is not sent; ask the user to reconnect and stop until it passes.
2. Set the POC row: `current_gate` to the gate, `g<n>_status: asked`, `status:
   waiting_on_gate`, `run_state: waiting_gate`.
3. Save the gate pack summary as a `gate_pack` document (`--gate G<n> --status in_review`), and
   set every document in the pack to `in_review`.

## The Slack notification

Post one message in the person's personal chat (the self-DM ID setup saved, kept on the row as
`slack_destination`), in the POC's thread there (`last_gate_thread`; the first gate posts the
root message and saves its `ts` there). Plain words, no tool or file names:

```
POC Studio · <Client> · <Gate name> (<G1|G2|G3|G4>) is ready for your approval
<one line: what is being decided>

To review in Orbit:
• <Document title> v<n> — <Orbit record link>
Feedback since the last gate: FB-_1007 (done), FB-_1009 (open)

Please approve in the Claude chat for this POC.
```

The Orbit record link is the record's page in Orbit's Objects Manager for that object and id.

## In the Claude chat

Show the pack (SendUserFile for the files) and ask ONE AskUserQuestion whose options are the
gate's reply words, with free text for `changes: …`. The build waits there for the answer.

## Reply words

| Gate | Approve | Other answers |
|---|---|---|
| G1 · Path | `approve` | `partial` (proceed with the cut list), `edited` (I edited the research document in Orbit), `block` |
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
  session ends first, the POC row says `run_state: waiting_gate` and `resume_from: <gate> ·
  round <n>`, and the next resume shows the gate again.

## Questions in the Claude chat

Nothing but the four gate notifications goes to Slack. Zen clarifying questions and every stop the build
skill lists (a risky fix, a failed build, the design system's two stops, the narration
approval, a delete, a budget that cannot be met, a Nebula update that needs a fresh session, a
sign-in, a credential) are asked **in the Claude chat only**, with AskUserQuestion, after the
write-back check. Each says the step it comes from, the question, the Stand-in's suggested
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
POC row says `run_state: waiting_gate` with `resume_from: <question> · <step>`, so a resume
asks it again. A chat question waits for the person. Each
answer is saved with the run's records: a Zen answer as an `OWNER` ledger row in the working
ledger, any other as a `gate_decision`-type record with the question's header. A credential's
values are never written anywhere.

## After a gate answer

1. Save the decision as a `gate_decision` document: gate, answer, when, the exact
   words, and the tickets raised. Its status is `approved`.
2. Set the POC row's `g<n>_status` (`approved`, `approved_partial`, `approved_with_changes`,
   `changes_requested`, `blocked`, `stopped`, `held`, `released`), `current_gate: none` unless
   the gate is asked again, and the stage.
3. Set the pack's documents to `approved` when approved, or leave them `in_review` while
   changes run.
4. Every `changes: …` becomes one feedback ticket per change, tagged `OWNER`.
5. Run the write-back check again. Only then does the next phase start.
6. Post one line in the Slack thread: `<Gate> <answer>. Next: <what starts now>.` (a
   notification, like the gate message).
