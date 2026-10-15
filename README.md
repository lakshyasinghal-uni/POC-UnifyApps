# POC Studio

Runs a UnifyApps POC end to end, from the first client signal to a released demo, with the
owner deciding at four gates. Built on Demo Studio 0.6.0 by Gourav Mahunta and Maher's verified
UnifyApps platform skills. Plugin maintenance notes are in [CONTRIBUTING.md](CONTRIBUTING.md).

Every document, gate decision and piece of feedback is saved to **Orbit**
(orbit.uat.unifyapps.com). Gates are sent to **Slack** with links to the Orbit records and shown
in the chat at the same time. The final app is built **code-first** by the Nebula plugin with
its code builder.

## Install and stay up to date

In Claude Code on your machine:

```
claude plugin marketplace add shubhankargarg-lang/POC-UnifyApps
claude plugin install poc-studio@poc-unifyapps
```

**Auto-update is on by default.** `/poc-studio:setup` (and `/poc-studio:update`) turn on
background auto-update for the `poc-unifyapps` marketplace by adding this entry to your
`~/.claude/settings.json`, keeping everything else in the file and leaving a backup beside it:

```json
"extraKnownMarketplaces": {
  "poc-unifyapps": {
    "source": { "source": "github", "repo": "shubhankargarg-lang/POC-UnifyApps" },
    "autoUpdate": true
  }
}
```

Claude Code keeps marketplace auto-update as a per-person setting (a marketplace file cannot
turn it on), so this is where it lives. This repository's own `.claude/settings.json` carries
the same entry for anyone working inside it. To turn it off, set `"autoUpdate": false` there,
or use `/plugin` → Marketplaces → poc-unifyapps.

**Checking by hand.** Build and setup do not contact GitHub; auto-update keeps the plugin
current. To check now, run `/poc-studio:update`: it compares the installed version with
GitHub main and, in Claude Code, updates the marketplace and the plugin, then asks you to start
a fresh session (or run `/reload-plugins`).

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
4. **Your personal Slack chat** for the four gate approvals (your own DM, posted as you
   through your Slack connection), where gate notifications are sent.
5. **Nebula**: its version, and whether it can build code apps. The first build updates it
   to the code-builder version if needed.
6. **One test gate**, end to end: a test POC row and document in Orbit, a test notification in
   your Slack, the approval in the chat, recorded and read back.

Setup also runs a **schema check**: it reads the three objects' live schemas and compares them
with every field name and single-select value POC Studio writes. If anything differs, setup
(and every build, which runs the same check first) stops with the exact list and writes
nothing. POC Studio never changes the Orbit objects.

To test the Orbit connection end to end on the real tenant:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/orbit-api.mjs" selftest
```

It runs the schema check, writes and reads back one record on each object (on a single
`POC Studio · self-test` row it reuses), uploads and downloads one file, and prints a results
table.

It saves your settings in Orbit (with a copy in `poc-studio.yml`), with no secret in either,
so a new chat finds them without running setup again. It also asks how long a gate may wait
before the POC is put on hold.

## What you type

The simplest way in is one command:

```
/poc-studio:start Build a POC for Acme Logistics (acmelogistics.com): fleet maintenance with
approvals and an AI assistant, demo to their COO on Friday.
```

It checks GitHub for a newer POC Studio (5 seconds at most; when GitHub is slow it carries on),
runs setup if you have never run it, then starts the build, which checks your connectors,
Orbit and the schema first. When it installs an update it asks you to type `/reload-plugins`
and run the same command again, because Claude Code loads a new version only then. Without a
request it asks what the POC is. `/poc-studio:start resume POC-_1007` carries on an existing
POC.

The steps also work on their own:

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
reads its working files back from Orbit, shows any gate that was waiting, and carries on from
where it stopped. If another session worked on it in the last two hours, it
asks before taking over.

Optional, once per client, so later runs need fewer decisions:

```
/poc-studio:profile Acme Logistics · site acmelogistics.com · owner Harshal · audience COO,
20 minutes · demo date 2026-10-23
```

## What happens

| Phase | Produces, saved to Orbit | Ends with |
|---|---|---|
| **0 · Kickoff** | prerequisites checked (Slack and Orbit before anything else), the profile, the POC row in Orbit with owner and tier | — |
| **1 · Signals and research** | **the research document**: cited web research on the client, the process, the rules, the market and realistic data, plus what the client and team said in Slack, Gmail, Calendar and Drive, and a readiness verdict | **G1 · Path** |
| **2 · Scope, BRD and design** | **the BRD**, sized to the tier, then **the design system** made from it | **G2 · Scope and BRD** |
| **3 · Build** | **the app**, built code-first by the code-builder Nebula (in Sonic or Zen, as chosen) from the approved BRD and design system, then rehearsed in a browser and checked | **G3 · Final review** |
| **4 · Collaterals** | **the collaterals**: the runbook, the explainer, the narrated video and its PDFs (when the profile asks), the field note | **G4 · Release** |

Those five are the only documents a POC produces for review, in that order: research
document, BRD, design system, app, collaterals. The team's own notes along the way (the
decision ledger, storylines, data plan, design notes, check results and so on) are saved to
Orbit as working documents so any chat can resume the POC; they are never sent at a gate.

## The four gates

**You approve gates in the Claude chat.** When a gate is ready, a notification goes to **your
personal Slack chat** (your own DM, posted as you through your Slack connection) with the Orbit
links and the feedback raised since the last gate, asking you to approve in the Claude chat.
That notification is the only thing POC Studio sends to Slack, and replies there are not read.
In the chat, answer with the gate's reply words.

| Gate | You decide | Reply with |
|---|---|---|
| **G1 · Path** | whether the research holds and how to proceed | `approve` · `partial` · `edited` · `block` |
| **G2 · Scope and BRD** | the BRD and the design system; nothing touches the tenant before this | `approve` · `changes: …` · `stop` |
| **G3 · Final review** | you open the app and accept it, or list the changes; each becomes a ticket, the BRD gets a new version when a requirement changes, every check runs again | `approve` · `changes: …` · `stop` |
| **G4 · Release** | the demo and its collaterals go to the field | `approve` · `changes: …` · `hold` |

- Silence or an emoji is never a yes. An unclear reply is asked back.
- A gate waits in the chat until you answer; it is never passed. If you close the session,
  the next resume shows the gate again.
- With three days or fewer to the demo date, the gates come in pairs (G1 with G2, G3 with G4).
- Before any gate is sent, every document made so far is read back from Orbit. If something
  did not save, you are asked to reconnect, and the gate waits.

## Feedback, any time

Say it in the chat or in a gate thread, whenever. Each piece of feedback becomes a ticket in
Orbit (`FB-_1001`, `FB-_1002`, …) with your exact words, is acknowledged with its number, and is
closed with what was done. Your feedback overrules any decision the team made; something you
pass on from someone else is weighed and shown at the next gate, unless you say to act on it.

Every other question is asked in the Claude chat only, never in Slack: in Sonic, a missing
required connection, an expired sign-in, a delete, a credential for a new connection, a budget
that cannot be met, a risky fix during the build, a failed build, the design system's two
stops, a Nebula update that needs a fresh session, and the narration approval before a video;
in Zen, clarifying questions too.

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
- In Orbit, under the POC: the research document, the BRD, the design system, the
  collaterals (runbook, explainer, video and PDFs, field note), every gate decision and every
  feedback ticket, plus the working documents that let any chat resume it.
- The same documents in your working folder as working copies, and the client profile in
  `studio/profiles/<client>.md`.

## Files

```
poc-studio/
  .claude-plugin/plugin.json
  skills/start/SKILL.md            the front door: update check, setup if needed, then the build
  skills/setup/SKILL.md            connect once: Slack, Calendar, Drive, Orbit, your Slack chat, a test gate
  skills/update/SKILL.md           check for and install the latest version; auto-update on
  skills/build/SKILL.md            the four phases and their gates
  skills/build/references/         gates, gate-delivery, run-control, orbit-records, orbit-objects.json,
                                   brd-template, nebula-bridge, ask-nebula, context-research,
                                   data-plan, external-connections, innovation,
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
                                   data-assumer, connector, designer, judge, critic,
                                   rehearsal, scribe, coder, ua-scout, ua-checker
  scripts/orbit-api.mjs            Orbit without a browser: check, schema-check, selftest, new-poc,
                                   find-poc, claim, heartbeat, records, upload, save-doc, fetch-doc,
                                   readback, new-ticket, close-ticket, flush
  scripts/nebula-root.mjs          finds Nebula, checks its version and code-builder support
  scripts/version-check.mjs        installed vs GitHub main; updates in Claude Code with --apply
  scripts/enable-autoupdate.mjs    turns on auto-update for poc-unifyapps in your Claude settings
  .claude/settings.json            the same auto-update entry for work inside this repository
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
