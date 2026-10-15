# POC Studio

Runs a UnifyApps POC end to end, from the first client signal to a released demo, with the
owner deciding at four gates. Built on Demo Studio 0.6.0 by Gourav Mahunta and Maher's verified
UnifyApps platform skills. Plugin maintenance notes are in [CONTRIBUTING.md](CONTRIBUTING.md).

Every document, gate decision and piece of feedback is saved to **Orbit**
(orbit.uat.unifyapps.com). Gates are sent to **Slack** with links to the Orbit records and shown
in the chat at the same time. The final app is built **code-first** by the Nebula plugin with
its code builder.

## Before your first build: connect once

Run this once, and again whenever a connection breaks:

```
/poc-studio:setup
```

It checks and connects, in this order:

1. **Slack** (required): gate messages, replies and feedback. **Google Calendar** and **Google
   Drive** are checked too; when either is missing you get a connector card, and the build
   goes on without it.
2. **Orbit** (required), by direct API with an environment secret: `ORBIT_COOKIE`, or
   `ORBIT_USERNAME` and `ORBIT_PASSWORD` for a local account. Set these as environment
   secrets; never paste them into the chat. Without them, it uses an Orbit tab you are signed
   in to. It warns you if Orbit is signed in as someone else.
3. **The three Orbit objects** POC Studio writes to: `poc_studio_poc`, `poc_studio_document`
   and `poc_studio_feedback`. Any that is missing is created; none is ever changed or deleted.
4. **Who approves gates** (just you, you and your manager, or others) and **where gate
   messages go** (a DM to you by default, a group DM with the approvers, or a channel).
5. **Nebula**: its version, and whether it can build code apps. The first build updates it
   to the code-builder version if needed.
6. **One test gate**, end to end: a test POC row and document in Orbit, a test gate in Slack
   and the chat, your answer recorded and read back.

It saves your settings in Orbit (with a copy in `poc-studio.yml`), with no secret in either,
so a new chat finds them without running setup again. It also asks how long a gate may wait
before the POC is put on hold.

## What you type

```
/poc-studio:build Build a POC for Acme Logistics (acmelogistics.com): fleet maintenance with
approvals and an AI assistant, demo to their COO on Friday.
```

It asks one thing first: **Sonic** (no questions during the build; only the four gates reach
you) or **Zen** (it may ask clarifying questions at any step, each with a suggested answer).
Every new build gets a new POC in Orbit with an ID Orbit generates (`POC-_1001`, …).

To carry on with an existing POC, in this chat or a new one, name it:

```
/poc-studio:build resume POC-_1007
/poc-studio:build continue the Acme fleet approvals POC
```

It finds the matches, shows each one's stage, run state, mode and last activity, asks which,
reads its working files back from Orbit, takes any gate answer given in Slack meanwhile, and
carries on from where it stopped. If another session worked on it in the last two hours, it
asks before taking over.

Optional, once per client, so later runs need fewer decisions:

```
/poc-studio:profile Acme Logistics · site acmelogistics.com · owner Harshal · approvers Harshal,
Rohit · audience COO, 20 minutes · demo date 2026-10-23
```

## What happens

| Phase | Produces, saved to Orbit | Ends with |
|---|---|---|
| **0 · Kickoff** | prerequisites checked (Slack and Orbit before anything else), the profile, the POC row in Orbit with owner, approvers and tier | — |
| **1 · Signals and research** | what the client and team said in Slack, Gmail, Calendar and Drive; cited web research on the client, the process, the rules, the market and realistic data; a readiness assessment; the data plan | **G1 · Path** |
| **2 · Scope, BRD and design** | three storylines argued down to one; a BRD sized to the tier; the client's design system; three to five mockups; a one-page scope | **G2 · Scope and BRD** |
| **3 · Build** | the app, built code-first by the code-builder Nebula (in Sonic or Zen, as chosen) from the approved BRD and design system; every beat rehearsed in a browser; mechanical checks; an explainer with diagrams; the evidence pack | **G3 · Final review** |
| **4 · Collaterals** | the runbook, the narrated video and its PDFs (when the profile asks), the field note | **G4 · Release** |

## The four gates

Each gate is sent to Slack, in the POC's thread, with links to the Orbit records and the
feedback raised since the last gate, and shown in the chat at the same time. The owner or an
approver answers in either place with the gate's reply words; the first answer counts and the
other place is told.

| Gate | You decide | Reply with |
|---|---|---|
| **G1 · Path** | whether the research holds and how to proceed | `approve` · `partial` · `edited` · `block` |
| **G2 · Scope and BRD** | what gets built, from which BRD, in which design; nothing touches the tenant before this | `approve` · `approve <mockup letter>` · `changes: …` · `stop` |
| **G3 · Final review** | you open the app and accept it, or list the changes; each becomes a ticket, the BRD gets a new version when a requirement changes, every check runs again | `approve` · `changes: …` · `stop` |
| **G4 · Release** | the demo and its collaterals go to the field | `approve` · `changes: …` · `hold` |

- Only approvers' replies count. Anyone else's reply is logged as a comment.
- Silence or an emoji is never a yes. An unclear reply is asked back.
- One reminder goes after 24 hours (or what setup recorded). An unattended run waits at the
  gate; it never passes it. After the expiry you chose at setup (3 days by default), the POC
  goes on hold until someone answers or resumes it.
- With three days or fewer to the demo date, the gates come in pairs (G1 with G2, G3 with G4).
- Before any gate is sent, every document made so far is read back from Orbit. If something
  did not save, you are asked to reconnect, and the gate waits.

## Feedback, any time

Say it in the chat or in a gate thread, whenever. Each piece of feedback becomes a ticket in
Orbit (`FB-_1001`, `FB-_1002`, …) with your exact words, is acknowledged with its number, and is
closed with what was done. Feedback from the owner or an approver overrules any decision the
team made; anyone else's is weighed and shown at the next gate.

Between gates, in Sonic, only these reach you: a missing required connection, an expired
sign-in, a delete, a credential for a new connection, a budget that cannot be met, a risky fix
during the build, a failed build, the design system's two stops, a Nebula update that needs a
fresh session, and the narration approval before a video is recorded. In Zen, clarifying
questions reach you too. All of them come to Slack and the chat like a gate, except a sign-in
and a credential, which stay in the chat.

## If a build stops or fails

The POC row always says where it stands: `run_state` (running, waiting on a gate, stalled,
failed, done, abandoned), the exact step to resume from, and why it stopped. Every working
file (the decision ledger, designs, brief, entity table) is saved to Orbit as it changes, so
any new chat can pick it up. If Nebula cannot finish the build, a failure document lists what
was built with links, and you are asked: `retry`, `back to G2` (smaller scope), or `stop`.
Nothing on the tenant is deleted.

## Three rules worth knowing

- **It asks Nebula, never guesses.** Any question about what the platform can do or store is
  answered from Nebula, then from the verified UnifyApps skills shipped here
  (`skills/build/references/ask-nebula.md`). The platform fails silently, so a guess is worse
  than no answer.
- **Orbit is the record.** The full file of every document is uploaded, versioned (a new
  version supersedes the old one; nothing is deleted) and its text kept alongside.
- **It builds only what the approved BRD and the demo's beats use.** Everything else is cut,
  however good.

## Which browser it uses

Wherever an agent needs a browser signed in to the tenant, it takes the Claude desktop app's
built-in browser first (the pane beside the chat, where you are usually already signed in),
then Claude in Chrome, then Nebula's own Chrome for Testing. The Designer reads the client's
public site the same way, in a new tab it closes afterwards. The Rehearsal agent starts in
Nebula's browser because that one can save a screenshot per beat for the runbook; when Nebula's
stored sign-in has expired it falls back to the built-in browser, keeps the verdicts and notes
that the shots are missing. Nothing ever types a password: a sign-in page is the one stop
that reaches you.

## What you get at the end

- The app on your tenant, code-first, in the client's colours and fonts, with its data,
  automations and assistant.
- In Orbit, under the POC: the research, assessment, context notes, data plan, scope, BRD,
  design system, mockups, explainer, evidence pack, runbook, video and PDFs, field note, every
  gate decision and every feedback ticket.
- The same documents in your working folder as working copies, and the client profile in
  `studio/profiles/<client>.md`.

## Files

```
poc-studio/
  .claude-plugin/plugin.json
  skills/setup/SKILL.md            connect once: Slack, Calendar, Drive, Orbit, approvers, a test gate
  skills/build/SKILL.md            the four phases and their gates
  skills/build/references/         gates, gate-delivery, run-control, orbit-records, orbit-objects.json,
                                   brd-template, nebula-bridge, ask-nebula, context-research,
                                   data-plan, external-connections, innovation, mockups,
                                   explainer, text2code, code-design-brief, brand-to-look,
                                   demo-defaults, when-something-fails, ledger, storyline,
                                   demo-script, runbook and profile templates
  skills/profile/SKILL.md          write or edit a client profile
  skills/poc-research/             cited web research for phase 1
  skills/design-system/            the client's measured design system (Design Language v3.4)
  skills/demo-studio/              narrated demo video and its PDFs
  skills/unifyapps-*/              verified UnifyApps platform skills (builder, apps, config
                                   apps, connectors, context graph, governance, backup and
                                   restore, solution playbook)
  skills/atomic-agent-architecture/, skills/oracle-ebs-apis/
  skills/<design and a11y skills>  the design-quality pipeline (see THIRD_PARTY.md)
  agents/                          stand-in, scout, researcher, ideator, innovator,
                                   data-assumer, connector, designer, mockups, judge, critic,
                                   rehearsal, scribe, coder, ua-scout, ua-checker
  scripts/orbit-api.mjs            Orbit without a browser: check, new-poc, find-poc, claim,
                                   heartbeat, records, upload, save-doc, fetch-doc, readback, flush
  scripts/nebula-root.mjs          finds Nebula, checks its version and code-builder support
  scripts/explainer-html.mjs       turns the explainer's Markdown into one HTML page
  hooks/                           no-delete-guard
  API-SPEC.md                      the verified record of UnifyApps endpoints
```

## Design notes

Nebula's Sonic mode already answers its own questions, but with a safety bias (smallest scope,
no release, no seed rows) that is wrong for demos, and it still asks setup, execution and
builder questions. Demo Studio replaces Sonic's single-mind scoping with a bounded team debate
over a decision ledger, carries its own demo defaults, and reuses everything downstream of the
brief unchanged. The full design is in `Demo Studio - Skill Design.md` beside this folder.
