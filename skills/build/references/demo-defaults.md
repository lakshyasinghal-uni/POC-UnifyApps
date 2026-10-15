# Demo defaults

Decisions Demo Studio takes without asking. Nebula's `fast-defaults.md` (in the installed
Nebula, `skills/sonic-scoping/references/`) stays the fallback for anything not named here;
where the two disagree, this file wins. Every default used in a brief is echoed under
`## Assumptions` so the person can correct it afterwards, and the runbook lists it under
`Decisions taken for you` with the profile line that would have settled it.

## The bias

Sonic picks the safest answer: the smallest scope, no release, no seed rows unless asked. A
demo is seen once, to convince someone, so Studio picks the most convincing answer that the
platform can prove and the budget allows. When nothing settles a question, choose the option
the audience will notice, not the one that changes the least.

## Scope: nothing beyond the beats

- The chosen storyline's beats are the scope. Every object, field, automation, page, region
  and AI agent in the brief is named by a beat. The Judge cuts what no beat uses, however
  good, and the Scout's capability table carries a `beat` column so the cut is visible.
- No "while we're here": no admin page, no settings page, no second role, no export, no extra
  status value, no reporting page, unless a beat shows it.
- Nebula's own page defaults stay (loading, empty and error states; inline field errors; the
  disabled submit while saving; the success toast; the failure banner), because a page
  without them looks unfinished. They are not features and are never counted as extras.
- A field exists because a beat shows it or a rule needs it. A seed column no beat shows is
  cut. An automation branch no beat exercises is cut.

## Demo intent: what the client wants out of the demo

Settled first, by the Stand-in, as ledger row `demo.intent`, from the request, the profile's
`intent` line and the context notes' intent signals, with the sentences that show it quoted.
Three values:

- **`use-case`**: the audience wants to see their problem solved. The storyline is the
  product and the platform stays out of sight. Spend the budget on the story row, the data,
  the pages' look and the lean-forward moment. No hood beats.
- **`platform`**: the audience wants to see how it is configured, how hard it is to change,
  whether their own team could build it. The use case is a vehicle. Keep it small and plain so
  the configuration is the show: fewer entities, standard blocks over custom CSS, readable
  names and a one-line description on every automation node, object field, data source and
  block, one clear automation canvas, one clear object schema. The script carries 2 to 4 hood
  beats that open the automation canvas, the object, a page in the builder, the agent's
  configuration, and say what each shows. Visual flourish that makes the configuration look
  complex is cut.
- **`both`**: a use-case storyline with one or two hood beats where the audience is most likely
  to ask "how did you do that", usually right after the lean-forward moment.

When nothing settles it, answer `both` and mark it `Check this`: it serves either audience and
the person can drop the hood beats from the script.

| | `use-case` | `platform` | `both` |
|---|---|---|---|
| entities | up to the budget | the fewest that carry the use case | up to the budget |
| look | the full client brand, pushed as `use demo` allows | the client's colours and font through the theme only; standard blocks; little custom CSS | the brand on the story pages; the pages a hood beat opens stay plain |
| names and descriptions | the client's terms | the client's terms, plus a one-line description on every node, field, source and block | the same as `platform` on what a hood beat opens |
| hood beats | none | 2 to 4 | 1 or 2 |
| seed rows | 15 to 20 | 8 to 12 | 15 to 20 |
| lean-forward moment | the business outcome | the configuration behind the outcome | the outcome, then its configuration |

## Storyline

- One storyline per demo, chosen by the Judge from three, matching `demo.intent`. It has 5 to 7 beats; each beat is
  "the presenter does X, the screen shows Y", and the last beat is the lean-forward moment
  the profile's `show off` line names.
- One failure path on purpose: one beat shows a rule refusing something (a rejected approval,
  a duplicate caught, an amount over a limit), because a demo that only succeeds looks staged.
- The story row: one seeded record every beat revolves around, named in the client's
  vocabulary, with values chosen so the beats work (the amount that crosses the threshold,
  the date that is due).
- Scope follows the profile's budget line; the defaults are 4 pages, 3 objects, 3
  automations, 1 AI agent. The Judge cuts to it; nothing is asked.

## Names and words

- The app, its pages and its objects use the client's own terms from the profile's `voice`
  line and the Designer's `brand.md` (trucks, not vehicles; depots, not sites).
- The app's name is the client's name plus what it does ("Acme Fleet Desk"), never a
  product name of ours.
- Object ids follow Nebula's rule (`OBJ_<snake_case_slug>` or the solution's existing style).

## Data

The Data Assumer decides it (data-plan.md) and the brief follows:

- Given data is profiled and masked before a row is seeded; "their data" in a request with no
  file behind it is assumed, shaped like their system, and the runbook says so.
- Volume follows the intent: 15 to 20 readable rows for a `use-case` demo; enough to paginate
  and search for a `platform` demo that claims scale; never more than a beat shows. Named
  rows up to 20, a masked file up to 200, an automation above that, or a connection that
  reads rows where they are.
- Seeds are fictional and internally consistent (dates in the last 90 days, totals that add
  up) and include the story row. No real people, companies, addresses or identifiers.
- Where the data lives is a sentence the presenter can say: Storage objects by default, the
  client's system of record named, an external database only through a connection.
- Picklists carry the codes and labels the beats need, with the first value as the default.

## External connections: the bonus beat

The Connector proposes one to three external beats (external-connections.md): a ticket
created, an email sent, rows read live from the client's database, a message posted. The
Judge admits at most one unless the request asks for more, and never on the critical path:
the lean-forward moment works with the external system down, and the script carries the
fallback line. The profile's `external` line sets how far to go: `existing` (default) uses
only connections already on the tenant and asks nothing; `sandbox` admits the team's demo
systems and allows one credential stop; `client` admits the client's own test systems too;
`off` skips it. Test records are labelled `DEMO-TEST` and listed in the runbook for cleanup.
A client's production system is never touched.

## Pages and look

- The app look's `use` is `demo`: the bold thing may be large and one entrance on first load
  is allowed. Nothing else on the page moves on its own.
- The look comes from the client's brand through `brand-to-look.md`, never from a default
  palette. The `brand` label records what came from the site.
- Every page has a `job` line and a `design` block from Nebula's `app-page-planner`. The
  page carrying the bold thing is the one the storyline's lean-forward beat lands on.
- Every list has loading, empty and error states; every form has inline errors, a disabled
  submit while saving, a success toast naming the record, and a failure banner. These are
  built because Nebula's defaults build them; the storyline shows one of them.
- The logo goes at the top of every page's header through the app's custom code, from the
  URL `brand.md` recorded. A Rules line in the brief says so.
- A new app's home page is at `/home` and set as the default page; navigation gets one entry
  per top-level page.

## Automations and AI agents

- Every automation a page calls is deployed as part of the plan.
- An AI agent, when the storyline has one, is bound to the automations and objects the beats
  use, and tested with `send_test_messages` on the three questions the script will ask; the
  answers go in the runbook.
- No connection is created: Nebula reads connections and never creates one. A storyline that
  needs a connection the tenant does not have is cut by the Judge or made a `manual` task
  listed in the runbook, never asked about.

## Innovation: the platform's features, used on purpose

The Innovator proposes three to six platform-feature ideas (innovation.md), each a beat the
presenter can show in under two minutes. The Judge admits at most two, each replacing or
sharpening a beat, within the budget and the profile's `innovate` line: `nebula` (default)
admits only what Nebula can build (agents, evaluations, teams, guardrails, audit trails,
mobile); `all` admits ideas a browser agent could build from the operator skills (context
graph, ontology, search, campaigns, pipelines); `off` skips the Innovator. An admitted idea
that becomes the lean-forward moment is the goal; one that adds a page is cut. Ideas not
admitted go in the runbook under "Ideas for the next demo".

## Mockups: the one choice the person asked for

Before anything is built, the Mockups agent draws the number of UI directions the profile's
`mockups` line says (default 4, from 3 to 5) as complete self-contained HTML pages of the
lead screen and the lean-forward screen, with the client's real brand and the storyline's
real data, no two sharing a header treatment, a density or a colour strategy (mockups.md).
The person chooses one; a change request gets one more round. The chosen file is the design
reference: the Text2Code prompt carries its CSS and structure, the Critic scores `fidelity`
to it, and the Designer re-derives the brief, the Nebula look line and the page designs from
it. `auto` takes the recommendation without asking; `off` skips the step.

## Design quality for code apps

A code app is held to the code design brief (code-design-brief.md), not to Nebula's look
line: the client's real fonts, the full palette with roles, the layout language of the
client's site, every component specified, motion, the bold moment, and a refusal list. The
Critic reviews the preview against it, two rounds at most, and a brief line not met is a
change sent to the Code Builder. A page where the brand appears only in the logo is a
failure, whatever else works.

## Frontend: which builder makes the app

The profile's `frontend` line (text2code.md § The frontend line): `code` (the default) builds
the final app code-first, with the code-builder Nebula from the approved BRD, the Text2Code
prompt and the design system, with no config page lines in the brief; `nebula` builds a Config
app through Nebula's page builders and reviewers; `both` does both, which suits a `platform`
demo that compares the two builders. The Text2Code prompt is written
whatever the value, from the built ids, so the person can try the Code Builder later.

## Always produced

Whatever the storyline: the runbook; the explainer, in Markdown and as an HTML page, with one
picture of the whole thing, an entity diagram, a step diagram and five plain lines per
automation, and one record's journey; the Text2Code prompt; and the client profile with the
decisions it should carry next time.

## Release and access

- `## Ready when` names the publish of the app and every deploy. Studio never leaves a demo
  unpublished.
- Visibility is `PRIVATE` unless the profile's `release` line says shareable, in which case
  `PUBLIC`.
- Deleting anything is never proposed. If an existing entity is in the way, the storyline
  works around it or renames the new one with a domain qualifier.

## When nothing settles a question

Choose the option the audience will notice and the platform can prove, log the row with its
source, and put it first under `## Assumptions` with `Check this`. Never leave a row open past
the round cap; the Judge rules.
