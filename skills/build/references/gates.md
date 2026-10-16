# The four gates

A POC moves through four owner gates. Each gate closes a phase; the answer starts the next.
Between gates the team decides, logs and moves on. At a gate it stops, shows the owner what it
made, and waits. Nothing past a gate starts until the owner answers it.

| Gate | Closes | Decides | What the owner reviews |
|---|---|---|---|
| **G1 · Path** | Phase 1: signal capture and research | Proceed, proceed partial, or block | The research document |
| **G2 · Scope and BRD** | Phase 2: the BRD, then the design system | What gets built, and how it looks | The BRD and the design system |
| **G3 · Final review** | Phase 3: the code-first build and its checks | The app is accepted as built | The app |
| **G4 · Release** | Phase 4: collaterals | The demo goes to the field | The collaterals: runbook, explainer, video and PDFs when made, field note |

These are the only documents a POC produces for review. Everything else the team writes along
the way (the decision ledger, storylines, the data plan, design notes, the Nebula brief, the
entity table, rehearsal and check results, the Text2Code prompt) is a working document: saved to
the objects so a resume can carry on, never sent as a gate document.

Every gate is delivered as [gate-delivery.md](gate-delivery.md) says: a notification with links to
the records in the owner's personal Slack chat, and the approval itself in the Claude chat,
with the gate's reply words. Every pack document is saved and read back before the gate is
sent ([objects.md](objects.md) § The save check).

## Rules for every gate

- **Two people approve a gate:** the owner (the person running POC Studio), in the Claude chat,
  and the POC's manager, in the Orbit Studio app. The gate passes when both have approved, in
  either order (gate-delivery.md § Waiting for the manager). The Stand-in, the Judge and the
  moderator never answer one, never treat silence or an emoji as a yes, and never pre-fill an
  answer.
- **One question per gate,** in both places at once, with the gate's reply words.
- **Changes loop back, twice at most.** A `changes: …` answer becomes feedback tickets tagged
  `OWNER`, goes back to the phase that owns them, and the same gate is asked again. Every
  change made for them is logged as an iteration, so the approvers see what moved. After the
  second round of changes, the third answer can only approve, approve with the open tickets
  listed as `Not done`, or stop.
- **Stop means stop.** `block`, `stop` and `hold` end the build at that gate with what exists
  saved, the POC row set to `status: blocked` (with `blocked_on: held · <reason>` for `hold`) or
  `stopped`, a `gate_decided` activity, and one line saying so.
- **Gates wait.** A gate waits in the Claude chat until the owner answers. If the session ends
  first, the latest activity keeps `run_state: waiting_gate` and the next resume shows the gate
  again.
  A gate is never skipped because nobody answered.
- **Every answer is a record,** written through the gate endpoints before the next phase
  starts (gate-delivery.md § After a gate answer): the approvals and the gate's status on the
  POC, its summary, and an activity. The runbook carries the table of gate answers.
- **Edits win.** When the owner edits a document in the tenant (`edited` at G1, or a newer version
  at any gate), read the latest version back; it is the source of truth for every later phase.
- **Feedback since the last gate** is listed in every gate message by ticket number and status.

## Merged gates on short timelines

The demo date sets the tier at kickoff (profile `demo date`, else the demo event the
Researcher found, else `standard`):

| Days to the demo | Tier | Gates |
|---|---|---|
| 3 or fewer | `express` | G1 and G2 asked together at G2's place; G3 and G4 asked together at G4's place |
| 4 to 10 | `standard` | all four, separately |
| more than 10 | `full` | all four, separately |

The profile's `gates` line overrides the tier (`full` or `merged`). A merged gate shows both
packs and takes both gates' reply words (`approve` approves both; anything else names the
gate it is about). It is still two `gate_decided` activities, and both gates' statuses on the
POC row carry the answer.

In a merged G1 and G2, phase 2 runs before G1 is answered. When the answer is `block` for G1,
the BRD, the design system and every working document phase 2 made stay on the record as
they are, the `gate_decided` activity names them as dropped, the POC goes to `status: stopped`,
run state `abandoned`, and nothing is built.

## G1 · Path

**When:** at the end of phase 1, once the research document is written and saved.

**Pack:** the research document (status `in_review`). Besides the web research, it carries two
sections the moderator adds from the phase's working documents: **What the client and team
said** (from the context notes: the ask in their words, the audience, the demo slot, the
intent signals, the systems they run) and **Readiness**, in this shape, from the context notes,
the data plan and the Scout's tenant map:

```markdown
## Readiness

Recommendation: <proceed | proceed partial | block> · tier <express | standard | full>

| Area | Score 1–5 | Why, with its source |
|---|---|---|
| Problem clarity | | what the client actually asked, in their words |
| Data | | given or assumed, and what is missing |
| Platform fit | | what Nebula and the platform skills say it can do; any `no tool` |
| Connections | | systems the demo would touch and whether the tenant has them |
| Time | | the demo date against the budget |

### Gaps
- <gap> → <what closes it, and who>

### If proceeding partial
- In: <what the demo will show> · Out: <what waits, and why>
```

`proceed` needs no score below 3; `proceed partial` names what is cut; `block` names the gap.

**Reply words:** `approve` · `partial` · `edited` · `block`.

**After:** the gate's approval and `g1_summary` (the readiness verdict, and the cut list for
`partial`) carry the decision. The research document's open questions and gaps become
ledger rows. With `partial`, the cut list is a hard limit for the Stand-in and the Judge.
`approve` or `partial` starts phase 2.

## G2 · Scope and BRD

**When:** at the end of phase 2, once the BRD is written and the design system is made from
it. Nothing is written to the tenant before G2.

**Pack:**

- The BRD ([brd-template.md](brd-template.md)), sized to the tier. Its summary, storyline,
  data, scope and out-of-scope sections carry what the team decided.
- The design system: its style guide (the visual reference the app follows), token block and
  logo kit.

**Reply words:** `approve` · `changes: …` · `stop`.

**After:** each change is a ticket and a ledger row tagged `OWNER`: a new BRD version when a
requirement changes, a new design system version when the look changes. Then G2 is asked
again. `approve` starts phase 3, which builds only what the approved
BRD and design system say.

## G3 · Final review

**When:** at the end of phase 3, once the app is built code-first, rehearsed and checked.

**Pack:** the app's link. The gate message itself says, in a few lines, how many beats passed
rehearsal and how many checks passed, and lists anything unverified; the rehearsal and check
results are working documents in the objects for anyone who wants the detail.

**Reply words:** `approve` · `changes: …` · `stop`.

**After:** the owner opens the app and either accepts it or lists changes. Each change becomes
a feedback ticket tagged `OWNER`. A change that alters a requirement gives the BRD a new
version first. The fixes run through the build's fix loop, rehearsal and every check run again
on the whole app, and G3 is asked again. `approve`
freezes the build: from here no tenant change happens unless the owner asks for one, which
reopens G3. It starts phase 4.

## G4 · Release

**When:** at the end of phase 4, once the collaterals are made and saved.

**Pack:** the collaterals: the runbook, the explainer, the video and its PDFs when made, and the
field note: five lines for the field team (what the demo shows, the link, how long it
runs, what not to click, who to ask). Nothing is posted to the field from here; the note is
for the owner to send.

**Reply words:** `approve` · `changes: …` · `hold`.

**After:** when G4 passes, the runbook is marked `Demo-ready · released by <name> on <date>` and
saved as a new version with `status: final`, and the POC is `status: demo_ready`, stage
`8_demo_ready`. `hold` keeps everything as it is, with `status:
blocked` and `blocked_on: held · <reason>`.
