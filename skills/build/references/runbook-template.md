# The runbook

The one file the person keeps, written to the working folder as
`<Client> Demo Runbook.md`. Everything the presenter needs on the day, and everything the
person needs to make the next run ask even less.

```markdown
# <Client> Demo Runbook

Built <date> on <host> · solution <name> · Nebula <version> · Demo Studio <version>

## Open it
- Live: <published URL>
- Builder: <app link from the entity table>
- Sign in as: <the presenter's own tenant account; test user if one was made>
- Explainer: `<Client> Demo Explainer.html` (what each object, automation, agent and page does, with diagrams)
- Text2Code prompt: `<Client> Text2Code Prompt.md`
- Code app (when built): <published URL> · builder <link> · <n> of <n> beats pass

## The story in one breath
<Two lines: who the presenter is, what goes wrong, what the audience sees fixed.>

## Beats
<The demo script's beats, each followed by its rehearsal shot: ![beat 1](.sessions/<id>/drafts/studio/work/rehearsal/browser/beat-1.png)>

## What exists
<The entityTable exactly as plan finish returned it.>

## The look
<The chosen mockup: letter, direction, and a link to the gallery and the file; then the app look line, and two lines from brand.md on what came from the client's site and what was approximated (font, greys).>

## The data
<Three lines from the data plan: what was given and masked, what is assumed and shaped like which system, where the demo's data lives. Then the sentence to say if asked "is this our data?">

## External systems (when there is an external beat)
- <system> · <connection kind> · <what the beat does> · verified: <what was read back> · fallback if it is down: <the line to say>
- Test records to clean up: <keys, labelled DEMO-TEST>

## Assistant answers (when there is one)
| Question | Answer in rehearsal |
|---|---|

## Rehearsal
<n> of <n> beats pass. <For each fix: beat, what was wrong, what changed.>
Unverified: <what could not be proven, and the one check that would settle it.>

## Gates

| Gate | Round | Asked | Answer | Owner's words | Next |
(copied from the gate log; status line at the top of the runbook: `Demo-ready · released by <owner> on <date>`, `held`, or `stopped at <gate>`)

## Decisions taken for you
<One line per STAND-IN, JUDGE, DESIGNER and MODERATOR ledger row:>
- <key>: <decision> · <source> · to settle it next time add to the profile: `<line>`

## Not done
<Cut by the Judge or skipped by the plan, with the reason.>
```

Keep it under two screens of text plus the shots. Entity names and links, yes; tool names and
internal file paths, no, except the shot paths.
