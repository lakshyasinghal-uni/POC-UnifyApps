# Demo Studio

Builds client-branded UnifyApps demo assets from one request, with no clarifying questions in
between. A team of agents settles every open decision itself, the installed Nebula plugin
builds the result through its own plan and builder agents, and a rehearsal agent walks the
finished demo in a browser the way the presenter will.

Requires the **Nebula** plugin (written against 3.47.0, checked for 3.46.0 and later 3.x).

## What you type

```
/demo-studio:build Build a demo for Acme Logistics (acmelogistics.com): fleet maintenance with
approvals and an AI assistant, 20 minutes for their COO on Friday.
```

Optional, once per client, so later demos need even fewer decisions:

```
/demo-studio:profile Acme Logistics · site acmelogistics.com · audience COO, 20 minutes, in person ·
show off approvals by amount and an AI assistant · tenant orbit.uat.unifyapps.com
```

## What happens

| Act | Who | What |
|---|---|---|
| 0 Setup | the skill | Nebula setup from the profile: tenant, sign-in, solution, Sonic mode. Sign-in is the only possible stop. |
| 1 Discovery | Scout, Researcher, Ideator, Designer; then Data Assumer, Innovator, Connector; then Stand-in | the tenant and platform map; what the client said in Slack, email and the calendar; three storylines; the client's brand from its site; the data plan (given versus assumed, how many rows and how they get in, where the data lives, masking); three to six ideas for using platform features as demo beats; one to three external "bonus" beats (a ticket created, an email sent, rows read from their database) probed on real connections; the demo intent settled from the client's own sentences; every open decision answered for you |
| 2 Convergence | Judge, Designer, Scout, Stand-in, Mockups | one storyline chosen to match the intent and cut to budget, with everything no beat uses removed; the app look and every page designed; every line checked against what the platform can build, with any platform question asked of Nebula rather than guessed; three to five UI mockups drawn in Claude as complete HTML pages with the client's brand and the demo's data, shown to you, and **one chosen by you**; the brief and the look re-derived from your choice; the Nebula brief filed |
| 3 Build | Nebula | the plan, the builders, the page reviewer, read-back proof, publish and deploy |
| 3b Code app | Coder, Critic | a Text2Code prompt written from the built ids and the code design brief (the client's real fonts, full palette, layout language, every component, motion); with `frontend: code` or `both`, the app built in the Code Builder from that prompt, iterated until the beats pass, then reviewed by the Critic against the brief and the brand, two rounds, and published |
| 4 Rehearsal | Rehearsal | every beat of the demo walked in a browser with a shot; fixes filed as Nebula later tasks; two rounds at most |
| 4b Explainer | Scribe | a plain-words document, Markdown and HTML, with one picture of the whole thing, an entity diagram, a step diagram per automation and one record's journey, written from what actually exists |
| 5 Handoff | the skill | a runbook with the script, shots, links, the look, the explainer, the prompt, and every decision taken for you with the profile line that would have avoided it |

## Three rules worth knowing

- **It asks Nebula, never guesses.** Any question about what the platform can do or store is
  answered from Nebula's knowledge skills, the platform's knowledge sheets or a tenant read
  (`skills/build/references/ask-nebula.md`). The platform fails silently, so a guess is worse
  than no answer.
- **It pulls context from Slack, Gmail and Calendar.** The Researcher searches channels,
  threads and events by the client's name, domain and the demo words, reads the relevant
  ones, and writes what the client and the team actually said, plus the demo slot's length
  and setting. No personal data leaves the sources; a source that is not connected is skipped.
- **It builds nothing a beat does not use, and it decides the demo's intent first.** Is the
  audience there for the use case, for a look at how it is configured on the platform, or
  both? The Stand-in settles that from the request, the profile and Slack before any
  storyline is chosen; a `platform` demo keeps the use case small and the configuration
  legible, with hood beats that open the builder; a `use-case` demo keeps the platform out of
  sight. Everything no beat shows is cut by the Judge.

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

- The published demo app on your tenant, in the client's colours and fonts, with its data,
  automations and assistant.
- `<Client> Demo Runbook.md`: the script with a shot per beat, links, the look, and the
  decisions taken for you.
- `<Client> Demo Explainer.md` and `.html`: what each object, automation, agent and page does
  and how data flows, with diagrams, for anyone who was not in the room.
- `<Client> Text2Code Prompt.md`: the same demo as a prompt for the Code Builder, carrying
  the real ids, and the code app itself when the profile asks for it.
- `studio/profiles/<client>.md`: the profile, ready for the next demo.

## What still reaches you

An expired sign-in, a delete, a budget the Judge cannot meet, one credential when an external
beat needs a connection the tenant does not hold (only with `external: sandbox` or `client`
in the profile), and one question you asked for: which of the UI mockups the demo should
follow (`mockups: auto` removes even that). Nothing else.

## Files

```
demo-studio/
  .claude-plugin/plugin.json
  skills/build/SKILL.md            the five acts
  skills/build/references/         nebula-bridge, ask-nebula, context-research, data-plan,
                                   external-connections, innovation, mockups, explainer,
                                   text2code, code-design-brief, brand-to-look, demo-defaults,
                                   when-something-fails, ledger, storyline, demo-script,
                                   runbook and profile templates
  skills/profile/SKILL.md          write or edit a client profile
  agents/                          stand-in, scout, researcher, ideator, innovator,
                                   data-assumer, connector, designer, mockups, judge, critic,
                                   rehearsal, scribe, coder
  scripts/explainer-html.mjs       turns the explainer's Markdown into one HTML page
  scripts/nebula-root.mjs          finds the installed Nebula and checks its version
```

Working files go under `.sessions/<sessionId>/drafts/studio/`; profiles under
`studio/profiles/`; the runbook in the working folder.

## Design notes

Nebula's Sonic mode already answers its own questions, but with a safety bias (smallest scope,
no release, no seed rows) that is wrong for demos, and it still asks setup, execution and
builder questions. Demo Studio replaces Sonic's single-mind scoping with a bounded team debate
over a decision ledger, carries its own demo defaults, and reuses everything downstream of the
brief unchanged. The full design is in `Demo Studio - Skill Design.md` beside this folder.
