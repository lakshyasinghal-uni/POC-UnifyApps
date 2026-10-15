# The four gates

A POC moves through four owner gates. Each gate closes a phase; the answer starts the next.
Between gates the team decides, logs and moves on. At a gate it stops, shows the owner what it
made, and waits. Nothing past a gate starts until the owner or an approver answers it.

| Gate | Closes | Decides | The pack (Orbit documents) |
|---|---|---|---|
| **G1 · Path** | Phase 1: signal capture, research, assessment | Proceed, proceed partial, or block | Research document, readiness assessment, context notes, data plan |
| **G2 · Scope and BRD** | Phase 2: scope, storyline, BRD, design system, mockups | What gets built, from which BRD, in which design | Scope summary, BRD, style guide, mockups |
| **G3 · Final review** | Phase 3: the code-first build, rehearsal, checks, evidence | The app is accepted as built | The app link, evidence pack, unverified list |
| **G4 · Release** | Phase 4: collaterals | The demo goes to the field | Runbook, explainer, video and PDFs, field note |

Every gate is delivered as [gate-delivery.md](gate-delivery.md) says: to Slack with links to
the Orbit records and in the chat at the same time, answered with the gate's reply words,
first answer counts. Every pack document is saved to Orbit and read back before the gate is
sent ([orbit-records.md](orbit-records.md) § The write-back check).

## Rules for every gate

- **Only the owner or an approver answers a gate.** The Stand-in, the Judge and the moderator
  never answer one, never treat silence or an emoji as a yes, and never pre-fill an answer.
  The owner and approvers are the profile's `owner` and `approvers` lines, else
  `poc-studio.yml`, else the person who started the build.
- **One question per gate,** in both places at once, with the gate's reply words.
- **Changes loop back, twice at most.** A `changes: …` answer becomes feedback tickets tagged
  `OWNER`, goes back to the phase that owns them, and the same gate is asked again. After the
  second round of changes, the third answer can only approve, approve with the open tickets
  listed as `Not done`, or stop.
- **Stop means stop.** `block`, `stop` and `hold` end the build at that gate with what exists
  saved to Orbit, the POC row set to `blocked`, `stopped` or `held`, and one line saying so.
- **Unattended runs wait, then expire.** The gate is sent, the thread is checked on a
  schedule, one reminder goes after `reminder_hours`, and the build carries on from the gate
  when an answer comes. After `gate_expiry_hours` (the owner's choice at setup) with no
  answer, the gate expires to `held` and the POC is put on hold (gate-delivery.md § Reading the
  answer). A gate is never skipped because nobody answered.
- **Every answer is a record:** a `gate_decision` document and the gate's status on the POC
  row, written before the next phase starts. The runbook carries the table of gate answers.
- **Edits win.** When the owner edits a document in Orbit (`edited` at G1, or a newer version
  at any gate), read the latest version back; it is the source of truth for every later phase.
- **Feedback since the last gate** is listed in every gate message by ticket number and status.

## Merged gates on short timelines

The demo date sets the tier at kickoff (profile `demo date`, else the demo event the
Researcher found, else `standard`):

| Days to the demo | Tier | Gates |
|---|---|---|
| 3 or fewer | `sprint` | G1 and G2 asked together at G2's place; G3 and G4 asked together at G4's place |
| 4 to 10 | `standard` | all four, separately |
| more than 10 | `full` | all four, separately |

The profile's `gates` line overrides the tier (`full` or `merged`). A merged gate shows both
packs and takes both gates' reply words (`approve` approves both; anything else names the
gate it is about). It is still two `gate_decision` records.

In a merged G1 and G2, phase 2 runs before G1 is answered. When the answer is `block` for G1,
every document phase 2 made (scope, BRD, storyline, design system, mockups, and the working
rulings and designs) is set to `superseded`, the POC goes to `status: blocked`, `run_state:
abandoned`, and nothing is built.

## G1 · Path

**When:** at the end of phase 1, once signal capture, the research document, the context
notes and the data plan exist and are saved to Orbit.

**Pack:** the research document (status `in_review`), the context notes, the data plan, and
the readiness assessment the moderator writes from them and the Scout's tenant map:

```markdown
# <Client>: readiness

Recommendation: <proceed | proceed partial | block> · tier <sprint | standard | full>

| Area | Score 1–5 | Why, with its source |
|---|---|---|
| Problem clarity | | what the client actually asked, in their words |
| Data | | given or assumed, and what is missing |
| Platform fit | | what Nebula and the platform skills say it can do; any `no tool` |
| Connections | | systems the demo would touch and whether the tenant has them |
| Time | | the demo date against the budget |

## Gaps
- <gap> → <what closes it, and who>

## If proceeding partial
- In: <what the demo will show> · Out: <what waits, and why>
```

`proceed` needs no score below 3; `proceed partial` names what is cut; `block` names the gap.

**Reply words:** `approve` · `partial` · `edited` · `block`.

**After:** the research and assessment become `approved`. Their open questions and gaps become
ledger rows. With `partial`, the cut list is a hard limit for the Stand-in and the Judge.
`approve` or `partial` starts phase 2.

## G2 · Scope and BRD

**When:** at the end of phase 2, once the storyline is chosen, the BRD is written, the design
system exists and the mockups are drawn. Nothing is written to the tenant before G2.

**Pack:**

- The scope summary, one page: the storyline in one line and its beats; the screens; the
  flows; the AI agents; the data; the external beat, if any; what was cut and why; the
  `Check this` assumptions; the size against the budget and the tier.
- The BRD ([brd-template.md](brd-template.md)), sized to the tier.
- The design system's style guide, and the mockups unless the profile's `mockups` line is
  `off` or `auto`.

**Reply words:** `approve` (takes the recommended mockup) · `approve <letter>` · `changes: …`
· `stop`.

**After:** the chosen mockup becomes the design reference and the Designer refines. Each
change is a ticket and a ledger row tagged `OWNER`, a new BRD version when a requirement
changes, and G2 is asked again. `approve` starts phase 3, which builds only what the approved
BRD and design system say.

## G3 · Final review

**When:** at the end of phase 3, once the app is built code-first, rehearsed, checked, and
the evidence pack is saved.

**Pack:** the app's link, the demo script for the owner's walk through it, the evidence pack
(rehearsal with a shot per beat, checks with evidence, the entity table with builder links,
the external check when there is one) and the unverified list.

**Reply words:** `approve` · `changes: …` · `stop`.

**After:** the owner opens the app and either accepts it or lists changes. Each change becomes
a feedback ticket tagged `OWNER`. A change that alters a requirement gives the BRD a new
version first. The fixes run through the build's fix loop, rehearsal and every check run again
on the whole app, the evidence pack gets a new version, and G3 is asked again. `approve`
freezes the build: from here no tenant change happens unless the owner asks for one, which
reopens G3. It starts phase 4.

## G4 · Release

**When:** at the end of phase 4, once the collaterals are made and saved to Orbit.

**Pack:** the runbook, the explainer, the video and its PDFs when made, the Text2Code prompt,
and the field note: five lines for the field team (what the demo shows, the link, how long it
runs, what not to click, who to ask). Nothing is posted to the field from here; the note is
for the owner to send.

**Reply words:** `approve` · `changes: …` · `hold`.

**After:** `approve` marks the runbook `Demo-ready · released by <name> on <date>`, the POC row
`released`, stage `demo_ready`. `hold` keeps everything as it is, `held`, with the reason.
