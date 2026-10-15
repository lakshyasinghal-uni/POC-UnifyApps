# Gate delivery: Slack and the chat, at the same time

This file covers every human step of a build: the four gates, and the questions between gates
(§ Questions between gates). All of them go out the same way.

Every gate in [gates.md](gates.md) is delivered the same way. It goes to Slack with links to
the Orbit records and appears in the chat at once. The owner or an approver answers in
whichever place they see first.

## Before sending

1. Run the write-back check ([orbit-records.md](orbit-records.md) § The write-back check).
   If it fails, the gate is not sent; ask the user to reconnect and stop until it passes.
2. Set the POC row: `current_gate` to the gate, `g<n>_status: asked`, `status:
   waiting_on_gate`.
3. Save the gate pack summary as a `gate_pack` document (`--gate G<n> --status in_review`), and
   set every document in the pack to `in_review`.

## The Slack message

Post in the POC's Slack thread (`slack_thread_ts` on the POC row) at the destination in
`poc-studio.yml`. The first gate of a POC posts the root message and saves its `ts` and
channel on the row. Plain words, no tool or file names:

```
POC Studio · <Client> · <Gate name> (<G1|G2|G3|G4>)
<two lines: what is being decided, and what is weakest>

To review in Orbit:
• <Document title> v<n> — <Orbit record link>
• …
Feedback since the last gate: FB-_1007 (done), FB-_1009 (open)

Reply in this thread with one of: <the gate's reply words>
Only <approver names> can approve. cc <@manager>
```

The Orbit record link is the record's page in Orbit's Objects Manager for that object and
id. Mention the owner and every approver with their Slack IDs so they are notified.

## The chat, at the same time

Show the same pack in the chat (SendUserFile for the files) and ask ONE AskUserQuestion whose
options are the gate's reply words, with free text for `changes: …`. Add one line: `Also
posted in Slack; the first answer from either place counts.`

## Reply words

| Gate | Approve | Other answers |
|---|---|---|
| G1 · Path | `approve` | `partial` (proceed with the cut list), `edited` (I edited the research or assessment in Orbit), `block` |
| G2 · Scope and BRD | `approve` | `changes: <what>`, `stop` |
| G3 · Final review | `approve` | `changes: <what>`, `stop` |
| G4 · Release | `approve` | `changes: <what>`, `hold` |

Case and punctuation do not matter. A reply that carries the words with a sentence around it
(`approve, looks good`) counts.

## Reading the answer

- **The first answer counts.** Whichever place answers first decides. Post or say in the
  other place: `Answered in <Slack | the chat> by <name>: <answer>. Nothing more needed here.`
- **Only approvers count.** A reply from anyone else in the thread is feedback, not an answer:
  record it as a `COMMENT` ticket, acknowledge it, and keep waiting.
- **Unclear replies are asked back.** A reply that matches no reply word, or matches two, gets
  one question back in the same place quoting the reply words. Never pick the nearest.
- **Silence is not a yes. An emoji is not a yes.** A reaction, a thumbs-up or "ok" alone is
  asked back.
- **Checking Slack.** Read the thread when the chat question returns, when the user says they
  answered in Slack, and before every reminder. When the run is unattended, schedule a
  check of the thread back into this session every 30 minutes (send_later) until there is an
  answer, and post one reminder in the thread after `reminder_hours` (default 24). One
  reminder only; after it, keep checking and wait. A resume in a new session checks the
  thread first (run-control.md § Resume).
- **Expiry.** A gate or question still unanswered after `gate_expiry_hours` (the owner's
  choice at setup, default 72) expires: post `<Gate> expired after <n> hours with no answer.
  The POC is on hold; reply here or resume the build to pick it up.` in the thread and the
  chat, set the gate's status `held`, the POC's `status: held`, `run_state: stalled`,
  `stall_reason: <gate> expired`, `resume_from: <gate> · round <n>`, and stop checking. An
  answer that arrives later is taken by the next resume.
- **While waiting,** the POC row says `run_state: waiting_gate`, `resume_from: <gate> ·
  round <n>` (or `Zen question · <step> · <key>`), so a new session knows exactly what is
  open.

## Questions between gates

Zen clarifying questions, and the stops the build skill lists (a risky fix, a failed build,
the design system's two stops, the narration approval, a delete, a budget that cannot be met,
a Nebula update that needs a fresh session) go out exactly like a gate: write-back check
first, Slack thread and chat at once, the first approver's answer counts, unclear replies
asked back, the same reminder and expiry. The message has the step it comes from, the
question, the Stand-in's suggested answer when there is one, and the reply words:

| Question | Reply words |
|---|---|
| Zen question | `yes` / `no`, a letter (`a`, `b`, `c`) for a choice, or `answer: <words>`; `use suggestion` takes the Stand-in's draft |
| Risky fix | `apply all` · `safe only` · `changes: …` |
| Build failed | `retry` · `back to G2` · `stop` |
| Brand hue | `a` or `b` (the two measured options) |
| Client logo | `attached` (after attaching the file in the chat) · `placeholder` |
| Narration | `approve` · `edited` · `skip video` |
| Delete | `delete` · `keep` |
| Budget | `cut: <what>` · `raise budget` · `stop` |
| Nebula restart | `restarted` (after reloading plugins in a fresh session) · `stop` |

Up to four questions that arrive together go in one message, numbered; the reply names the
number (`2: use suggestion`). Each answer is saved with the run's other records: a Zen answer
as an `OWNER` ledger row in the working ledger, any other as a `gate_decision`-type record
with the question's header. Two stops never go to Slack: a sign-in, and a credential; they are
asked in the chat alone, and the values are never written anywhere.

## After the answer

1. Save the decision as a `gate_decision` document: gate, answer, who, where, when, their
   exact words, and the tickets raised. Its status is `approved`.
2. Set the POC row's `g<n>_status` (`approved`, `approved_partial`, `approved_with_changes`,
   `changes_requested`, `blocked`, `stopped`, `held`, `released`), `current_gate: none` unless
   the gate is asked again, and the stage.
3. Set the pack's documents to `approved` when approved, or leave them `in_review` while
   changes run.
4. Every `changes: …` becomes one feedback ticket per change, tagged `OWNER`.
5. Run the write-back check again. Only then does the next phase start.
6. Post one line in the thread: `<Gate> <answer> by <name>. Next: <what starts now>.`
