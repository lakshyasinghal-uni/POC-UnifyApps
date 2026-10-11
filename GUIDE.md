# Demo Studio: Quick Guide

Demo Studio builds a ready-to-present UnifyApps demo from one sentence. You type what you want, and it does the rest.

## Before you start

You need two things, both already set up on your Mac:

- The **Nebula** plugin, which does the actual building.
- The **Demo Studio** plugin, version 0.2.0.

Optional but useful: Slack connected, so it can read what the client said.

## Step by step

**1. Open a new Claude Code session in an empty folder.**
Use the desktop app's Code tab or the terminal. One folder holds one demo.

**2. (Optional, once per client) Save a client profile.**
This tells Demo Studio about the client so it never has to ask.

```
/demo-studio:profile Acme Logistics · site acmelogistics.com · audience COO, 20 minutes · tenant orbit.uat.unifyapps.com
```

Skip this and Demo Studio drafts a profile for you.

**3. Ask for the demo.**

```
/demo-studio:build Build a demo for Acme Logistics: fleet maintenance with approvals and an AI assistant, for their COO.
```

**4. Sign in, if asked.**
If your login has expired it asks you to sign in to the tenant. Pick "Open browser" and sign in.

**4b. Pick a design.**
Before anything is built it shows you three to five mockups of the demo's main screen, each a
different design in the client's colours and fonts with the demo's own data, and asks which
one to follow. Pick one, or type a change such as "B with A's header" and it redraws once.
This is the one question it always asks; set `mockups: auto` in the profile to skip it.

**5. Wait.**
You will see short progress lines, such as "Round 1: picked a storyline" and "Task 3 of 14 done". Behind the scenes it:

- reads Slack, your email and your calendar for what the client asked for and who is coming,
- reads the client's website for colours, fonts, logo and layout, and writes a design brief from them,
- works out the data: what you gave it (masked), what it must invent, how many rows, where it lives,
- proposes ways to use platform features (agents, evaluations, context graph) in the demo,
- proposes one bonus step that touches an outside system, such as a ticket created in Jira or an email sent, using connections already on the tenant,
- decides if the client wants to see the use case, how the platform is set up, or both,
- picks one storyline and cuts anything the demo does not use,
- builds it with Nebula,
- clicks through the finished demo in a browser and fixes what looks wrong,
- writes a prompt for the Code Builder, builds the app there if you asked for it, and has a critic review the look against the client's brand,
- writes an explainer with diagrams so anyone can understand what was built.

**6. Open the runbook.**
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
| The **code app** itself, when your profile says `frontend: code` or `both` | On your tenant, with a live link in the runbook |
| A saved client profile, so the next demo for this client is faster | `studio/profiles/<client>.md` |

## When it will stop and ask you

Only for these things:

1. Which mockup to follow (the one question you asked for; `mockups: auto` skips it).
2. Signing in, when your login has expired.
3. Deleting anything.
4. One credential, when a bonus step needs a connection the tenant does not have yet (only if your profile allows `external: sandbox` or `client`).
5. A demo too big for the budget, when it cannot cut it down.

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
