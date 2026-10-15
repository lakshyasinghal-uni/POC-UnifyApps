# The four gates

A POC moves through four owner gates, in the places the POC Studio flow puts them. Between
gates the team decides, logs and moves on. At a gate it stops, shows the owner what it made,
and waits. Nothing past a gate starts until the owner answers it.

| Gate | Sits after | Decides | The owner sees |
|---|---|---|---|
| **G1 · Path** | Stage 2 · Research, assess | Proceed, proceed partial, or block | The research document and the readiness assessment |
| **G2 · Scope** | Stage 4 · Design system | What gets built and how it looks | The scope summary, the design system's style guide, and the mockups |
| **G3 · Build verified** | Stage 6 · Finalize | The demo works and is frozen | The evidence pack, the demo script for the dry run, and what is unverified |
| **G4 · Release** | Stage 7 · Collaterals | The demo goes to the field | The runbook, the explainer, the video and PDFs when made, and the field note |

## Rules for every gate

- **Only the owner answers a gate.** The Stand-in, the Judge and the moderator never answer
  one, never treat silence as a yes, and never pre-fill an answer. The owner is the
  profile's `owner` line; when the line is empty, the person who started the build.
- **One stop per gate.** Show the gate pack with SendUserFile (display `render` for pages,
  `attach` for documents) in one call, say in two or three lines what the owner is deciding
  and what is weakest, then ask ONE AskUserQuestion. A gate may carry up to three questions in
  that one call (G2 does), never a second stop.
- **Changes loop back, twice at most.** An answer that asks for changes goes back to the
  stage that owns them, with the owner's words quoted in the agent's message file. Then the
  same gate is asked again. After the second round of changes, the third answer can only be
  approve, approve with the changes listed as `Not done`, or stop.
- **Stop means stop.** `Stop here` ends the build at that gate. Write the runbook with what
  exists, mark the gate `stopped` and say so in one line.
- **Unattended runs wait.** When nobody is there to answer (a scheduled run, or the question
  has gone unanswered), write the gate pack, send it with SendUserMessage and a one-line
  summary, and end the turn. A returning owner answers the gate and the build carries on
  from it. A gate is never skipped because nobody answered.
- **Every answer is logged** in `$STUDIO/gates.md`, one row per ask:
  `Gate | Round | Asked | Answer | Owner's words | Next`. The runbook carries the table.
- **Edits win.** When the owner edits a file in the gate pack, re-read it; the edited
  version is the source of truth for every later stage.

## Merged gates on short timelines

The demo date sets the tier at kickoff (profile `demo date`, else the date of the demo event
the Researcher found, else `standard`):

| Days to the demo | Tier | Gates |
|---|---|---|
| 3 or fewer | `sprint` | G1 and G2 asked together at G2's place; G3 and G4 asked together at G4's place |
| 4 to 10 | `standard` | all four, separately |
| more than 10 | `full` | all four, separately |

The profile's `gates` line overrides the tier (`full` or `merged`). A merged gate shows both
packs and carries both gates' questions in one AskUserQuestion. It is still two rows in
`gates.md`.

## G1 · Path

**When:** after discovery, once the Scout, the Researcher (with the research document) and
the Data Assumer have reported, before the Judge picks a storyline.

**Pack:** `research/<client-slug>-research.md` (status Draft) and
`$STUDIO/assessment.md`, which the moderator writes from `scout.md`, the research document,
`context-notes.md` and `data-plan.md`:

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

`proceed` needs no score below 3; `proceed partial` names what is cut; `block` names the gap
that stops it.

**Question:** header `G1 Path`, `How should this POC proceed?` Options: `Proceed`, `Proceed
partial` (the cut list in the assessment), `I edited the research` (re-read both files and
carry on with the owner's version), `Block`. `Block` is a stop: write the gaps as the
runbook's `Not done` and end.

**After:** set the document's status to `Approved by <owner> on <date>`. The research's open
questions and the assessment's gaps become ledger rows. With `Proceed partial`, the cut list
goes to the Judge as a hard limit.

## G2 · Scope

**When:** after Round 2, once the design system exists, the Scout's capability table is in,
and the mockups are drawn; before the brief is filed. Nothing is written to the tenant before
G2 is approved.

**Pack:**

- `$STUDIO/scope.md`, the scope summary, one page: the storyline in one line and its beats;
  the screens (one line each, the job of the page); the flows (each automation, what starts it
  and what it writes); the AI agents and what each answers; the data (given or assumed, rows,
  where it lives); the external beat, if any; what was cut and why; the `Check this`
  assumptions; the size against the budget and the tier.
- The design system's `style-guide.html`.
- The mockup gallery and each mockup, unless the profile's `mockups` line is `off` or `auto`.

**Question:** header `G2 Scope`, one AskUserQuestion with up to two questions:

1. When mockups were drawn and the line is not `auto`: `Which design should the demo
   follow?`, one option per mockup (letter and direction in a few words), the recommended one
   first and marked, at most four, a fifth reachable through the free-text answer.
2. `Approve this scope for the build?` Options: `Approve and build`, `Change the scope`
   (free text: what to add, cut or change), `Stop here`.

**After:** the chosen mockup becomes `design-reference.html` and the Designer refines as the
build skill says. `Change the scope` goes to the Stand-in and a fresh Judge with the owner's
words; the changes are ledger rows tagged `OWNER`, which nothing else may overrule. Then the
brief is filed from the approved scope only.

## G3 · Build verified

**When:** after the build, the rehearsal, the checks and the finalize stage, before any
collateral is made.

**Pack:** `studio/evidence/<client-slug>/`, the evidence pack the finalize stage writes:
`rehearsal.md` with a shot per beat, `checks.md` with its evidence, the entity table with
builder links, `external-verify.md` when there is an external beat, the explainer, and
`unverified.md` (every beat or check still failing, every `Check this` assumption). Plus the
demo script, which the owner walks once as the dry run.

**Question:** header `G3 Verified`, `Walk the demo script once. Is the build verified?`
Options: `Verified, freeze it`, `Fix these first` (free text: what failed on the dry run),
`Stop here`.

**After:** `Fix these first` becomes later tasks; each is classed safe or risky as the build
skill's fix loop says, risky ones need the owner's yes, and rehearsal and checks run again
on everything before G3 is asked again. `Verified, freeze it` freezes the build: from here no
tenant change happens except as a later task the owner asks for, which reopens G3.

## G4 · Release

**When:** after the collaterals are made.

**Pack:** the runbook, the explainer, the video and its PDFs when made, the Text2Code prompt
or code app link when there is one, and `field-note.md`: a five-line note for the field team
(what the demo shows, the link, how long it runs, what not to click, who to ask). The note is
a draft; nothing is posted or sent from this skill.

**Question:** header `G4 Release`, `Release this demo to the field?` Options: `Release`,
`Change the collaterals` (free text), `Hold`.

**After:** `Release` marks the runbook `Demo-ready · released by <owner> on <date>` and the
build ends with the handoff lines. `Hold` keeps everything as it is, marked `held`, with the
owner's reason in the runbook.
