# Gate delivery: your personal Slack chat and the Claude chat

Only the four gate approvals in [gates.md](gates.md) go to Slack. Each one is posted in the
person's **personal Slack chat**: their own direct-message conversation, posted as them through
the Slack connection they set up. It also appears in the Claude chat at the same time, and they
answer in whichever place they see first. Every other question of a build stays in the Claude
chat only (§ Questions in the Claude chat).

The person running POC Studio is the gate owner: theirs is the only answer that counts.

## Before sending a gate

1. Run the write-back check ([orbit-records.md](orbit-records.md) § The write-back check).
   If it fails, the gate is not sent; ask the user to reconnect and stop until it passes.
2. Set the POC row: `current_gate` to the gate, `g<n>_status: asked`, `status:
   waiting_on_gate`, `run_state: waiting_gate`.
3. Save the gate pack summary as a `gate_pack` document (`--gate G<n> --status in_review`), and
   set every document in the pack to `in_review`.

## The Slack message

Post in the person's personal chat, in the POC's thread there (`slack_thread_ts` on the POC
row; the channel is the self-DM ID that setup saved, also kept on the row as `slack_channel`).
The first gate of a POC posts the root message and saves its `ts` on the row. Plain words, no
tool or file names:

```
POC Studio · <Client> · <Gate name> (<G1|G2|G3|G4>)
<two lines: what is being decided, and what is weakest>

To review in Orbit:
• <Document title> v<n> — <Orbit record link>
Feedback since the last gate: FB-_1007 (done), FB-_1009 (open)

Reply in this thread with one of: <the gate's reply words>
```

The Orbit record link is the record's page in Orbit's Objects Manager for that object and id.

## The Claude chat, at the same time

Show the same pack in the chat (SendUserFile for the files) and ask ONE AskUserQuestion whose
options are the gate's reply words, with free text for `changes: …`. Add one line: `Also in
your Slack; the first answer from either place counts.`

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

- **The first answer counts.** Whichever place answers first decides. Say in the other place:
  `Answered in <Slack | the chat>: <answer>. Nothing more needed here.`
- **Unclear replies are asked back.** A reply that matches no reply word, or matches two, gets
  one question back in the same place quoting the reply words. Never pick the nearest.
- **Silence is not a yes. An emoji is not a yes.** A reaction, a thumbs-up or "ok" alone is
  asked back.
- **Checking Slack.** Read the thread when the chat question returns, when the person says
  they answered in Slack, and before every reminder. When the run is unattended, schedule a
  check of the thread back into this session every 30 minutes (send_later) until there is an
  answer, and post one reminder in the thread after `reminder_hours` (default 24). One
  reminder only; after it, keep checking and wait. A resume in a new session checks the
  thread first (run-control.md § Resume).
- **Expiry.** A gate still unanswered after `gate_expiry_hours` (chosen at setup, default 72)
  expires: post `<Gate> expired after <n> hours with no answer. The POC is on hold; reply here
  or resume the build to pick it up.` in the thread and the chat, set the gate's status
  `held`, the POC's `status: held`, `run_state: stalled`, `stall_reason: <gate> expired`,
  `resume_from: <gate> · round <n>`, and stop checking. An answer that arrives later is taken
  by the next resume.

## Questions in the Claude chat

Nothing but the four gates goes to Slack. Zen clarifying questions and every stop the build
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
asks it again. A chat question has no reminder and no expiry: it waits for the person. Each
answer is saved with the run's records: a Zen answer as an `OWNER` ledger row in the working
ledger, any other as a `gate_decision`-type record with the question's header. A credential's
values are never written anywhere.

## After a gate answer

1. Save the decision as a `gate_decision` document: gate, answer, where, when, the exact
   words, and the tickets raised. Its status is `approved`.
2. Set the POC row's `g<n>_status` (`approved`, `approved_partial`, `approved_with_changes`,
   `changes_requested`, `blocked`, `stopped`, `held`, `released`), `current_gate: none` unless
   the gate is asked again, and the stage.
3. Set the pack's documents to `approved` when approved, or leave them `in_review` while
   changes run.
4. Every `changes: …` becomes one feedback ticket per change, tagged `OWNER`.
5. Run the write-back check again. Only then does the next phase start.
6. Post one line in the Slack thread: `<Gate> <answer>. Next: <what starts now>.`
