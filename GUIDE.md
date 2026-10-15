# POC Studio: Quick Guide

POC Studio runs a UnifyApps POC from the first client signal to a released demo. You type what
you want; it researches, scopes, designs, builds and documents it, and stops for you at four
gates. Everything it makes is saved to Orbit.

## Before you start

- The **POC Studio** plugin, version 0.4.1, and the **Nebula** plugin (the first build updates
  Nebula to its code-builder version if needed).
- Run **`/poc-studio:setup`** once. It connects Slack (required), Google Calendar and Drive,
  and Orbit; asks who approves gates and where gate messages go; and runs one test gate.
- For Orbit, set `ORBIT_COOKIE`, or `ORBIT_USERNAME` and `ORBIT_PASSWORD` for a local account,
  as environment secrets. Never paste them into the chat. Without them it uses an Orbit tab
  you are signed in to.

## Step by step

**1. Open a new Claude Code session in an empty folder.**
Use the desktop app's Code tab or the terminal. One folder holds one demo.

**2. (Optional, once per client) Save a client profile.**
This tells POC Studio about the client so it never has to ask.

```
/poc-studio:profile Acme Logistics · site acmelogistics.com · audience COO, 20 minutes · tenant orbit.uat.unifyapps.com
```

Skip this and POC Studio drafts a profile for you.

**3. Ask for the demo.**

```
/poc-studio:build Build a demo for Acme Logistics: fleet maintenance with approvals and an AI assistant, for their COO.
```

**4. Choose Sonic or Zen.**
Sonic asks you nothing until the next gate. Zen may ask clarifying questions at any step, each
with a suggested answer you can take with `use suggestion`.

**5. Sign in, if asked.**
If your login has expired it asks you to sign in to the tenant. Pick "Open browser" and sign in.

**6. Answer the gates.**
At the end of each phase it posts a gate in Slack and shows it here. Open the Orbit links,
then reply with the gate's words (for example `approve B` at G2 to build with mockup B). The
first answer from either place counts.

**7. Wait.**
You will see short progress lines, such as "Round 1: picked a storyline" and "Task 3 of 14 done". Behind the scenes it:

- reads Slack, your email, your calendar and Drive for what the client asked for and who is coming,
- researches the client, the process and the rules on the web and writes a cited research document,
- reads the client's website for colours, fonts, logo and layout, and writes a design brief from them,
- works out the data: what you gave it (masked), what it must invent, how many rows, where it lives,
- proposes ways to use platform features (agents, evaluations, context graph) in the demo,
- proposes one bonus step that touches an outside system, such as a ticket created in Jira or an email sent, using connections already on the tenant,
- decides if the client wants to see the use case, how the platform is set up, or both,
- picks one storyline and cuts anything the demo does not use,
- writes a BRD and the client's design system, then builds the app code-first with Nebula,
- clicks through the finished demo in a browser and fixes what looks wrong,
- has a critic review the app's look against the client's brand and design system,
- writes an explainer with diagrams so anyone can understand what was built,
- saves every document, decision and feedback ticket to Orbit, and checks they arrived before each gate.

**8. Open the runbook.**
When it finishes, it gives you a link to `<Client> Demo Runbook.md`. That is your guide for the day.

## What you get at the end

| What | Where |
|---|---|
| A working, published demo app in the client's colours and fonts | On your UnifyApps tenant, with a live link |
| The data, automations and AI assistant behind it, with sample records | On your tenant, inside the solution |
| A **demo script**: what to say and click at each step, with a screenshot of each | In the runbook |
| Links to every page, object and automation | In the runbook |
| What the AI assistant answered in rehearsal | In the runbook |
| A list of **decisions it made for you**, and how to change them next time | In the runbook |
| An **explainer** with flowcharts: what each object, automation, agent and page does and how data flows | `<Client> Demo Explainer.html` (and `.md`) |
| A **Text2Code prompt** with the real ids, to build the same demo in the Code Builder | `<Client> Text2Code Prompt.md` |
| The **code app** itself (the default) | On your tenant, with a live link in the runbook and on the POC in Orbit |
| Every document, gate decision and feedback ticket, versioned | In Orbit, under the POC |
| A saved client profile, so the next demo for this client is faster | `studio/profiles/<client>.md` |

## Picking up a POC later

In any chat, type `/poc-studio:build resume <POC ID or name>`. It shows the matching POCs with
their stage and last activity, asks which one, reads everything back from Orbit, and carries on
from where it stopped. It never picks one up on its own: a new build request always starts a
new POC.

## When it will stop and ask you

At four gates. Each is posted to Slack with links to the Orbit records and shown in the chat at
the same time; the owner or an approver answers in either place:

1. **G1 · Path** (`approve`, `partial`, `edited`, `block`): the research and readiness
   assessment.
2. **G2 · Scope and BRD** (`approve`, `approve <letter>`, `changes: …`, `stop`): the scope, the
   BRD, the design system and a mockup. Nothing is built before this.
3. **G3 · Final review** (`approve`, `changes: …`, `stop`): open the app and accept it, or list
   changes; each becomes a ticket and the checks run again.
4. **G4 · Release** (`approve`, `changes: …`, `hold`): the runbook, video and field note.

With three days or fewer to the demo, they come in pairs (G1+G2, G3+G4). Between gates it only
asks for a missing connection, a sign-in, a delete, a credential, a budget it cannot meet, a
risky fix, the design system's two stops, a Nebula restart, and narration approval before a
video. Feedback is welcome any time and gets a ticket number.

## Giving it your data

Drop files in `studio/data/` before you start, or link them in the request. It profiles
them, masks every name, email, phone and identifier, and seeds from the masked copy. The
original never leaves the folder. If you give nothing, it invents realistic data shaped like
the client's system and says so in the runbook.

## Tips

- **Say who is watching and for how long.** It shapes the whole demo.
- **Name the client's website.** That is where the look comes from.
- **Check "Decisions taken for you" in the runbook.** Add those answers to the client profile and the next demo will be closer to what you want.
- **Want a change after it is done?** Just type it, for example "make the approve button bigger". It builds the fix without asking anything.
