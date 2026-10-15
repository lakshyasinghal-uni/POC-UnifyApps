# The client profile

One file per client at `studio/profiles/<client-slug>.md` in the working folder. It is the only
input Demo Studio needs beyond the request, and the lever that drives questions to zero: every
decision the runbook lists under `Decisions taken for you` names the line that would have
settled it. The request overrides any line for one run.

When no profile exists, the build skill drafts one from the request, fills the rest with the
defaults below, and marks it `drafted by Studio`. The `profile` skill writes or edits one on
request.

## Shape

```markdown
# <Client name>

- status: <confirmed | drafted by Studio on <date>>
- client: <name> · site <https://…> · industry <one line>
- audience: <who watches> · <n> minutes · <in person | call | recorded> · <projector | laptop | phone>
- owner: <who owns the POC and approves the four gates: G1 Path, G2 Scope and BRD, G3 Final review, G4 Release> · <Slack name or ID>
- approvers: <others whose gate replies count, such as the manager; or "owner only"> · <Slack names or IDs>
- gate destination: <dm | group dm | channel #name> · <where gate messages go; default from poc-studio.yml, else a DM to the owner>
- demo date: <YYYY-MM-DD> · <sets the tier: 3 days or fewer sprint (gates merged in pairs), 4 to 10 standard, more full>
- gates: <by tier | full | merged> · <full asks all four separately; merged asks G1 with G2 and G3 with G4; never fewer>
- presenter: <who> · tells the story from <whose seat>
- show off: <the two or three things the demo must make obvious>
- intent: <use-case | platform | both | find out> · <why, in the client's words when known>
- sources: <slack gmail calendar drive, any subset, or none> · <what to look for, when known>
- slack: <channels to read, such as #acme-deal #sales-emea, or "find them">
- nebula: <latest-code | keep> · <latest-code (the default) updates Nebula to the code-builder version at the start of a build when it is older; keep never updates>
- design system: <reuse | generate> · <reuse takes studio/design-systems/<client-slug>/ when it exists; generate runs the design-system skill>
- video: <on | off> · <on renders the demo assets at handoff: narrated video with an architecture opening, subtitles, live-demo runbook, presenter manual, PG playbook and screenshot library>
- frontend: <code | nebula | both> · <code (the default) builds the final app code-first with the code-builder Nebula from the approved BRD and design system; nebula builds a Config app; both does both>
- innovate: <nebula | all | off> · <nebula admits platform-feature ideas Nebula can build; all admits ideas a browser agent could build from the operator skills; off skips the Innovator>
- avoid: <what must not appear or happen>
- tenant: <host> · solution: <name> (create if missing)
- release: <publish and deploy without asking | leave unpublished> · visibility <PRIVATE | shareable>
- data: <given: studio/data/<file> or a link | assumed, shaped like <their system>> · <15 to 20 | enough to paginate> rows · lives in <UnifyApps Storage | their <database> through a connection> · masked · one story row the script leans on
- external: <existing | sandbox | client | off> · <existing uses only connections already on the tenant and asks nothing; sandbox allows one credential stop for the team's demo systems; client allows the client's own test systems too>
- sandboxes: <system: connection name on the tenant, or where its credential lives, such as "jira: Acme Jira Sandbox" or "postgres: 1Password item Demo Postgres"> · <none>
- budget: <3> discussion rounds · <4> pages · <3> objects · <3> automations · <1> AI agent · <2> rehearsal rounds
- voice: plain words · the client's own terms (<their word>, not <ours>)
- brand: <logo URL, colours or fonts already known, or "scout the site">
- notes: <anything the Stand-in should know: past demos, what the audience disliked, a competitor they compare with>
```

## Defaults when a line is missing

| Line | Default |
|---|---|
| audience | a senior operations leader · 20 minutes · in person · projector |
| owner | the owner in `poc-studio.yml`, else the person who started the build |
| approvers | the approvers in `poc-studio.yml`, else owner only |
| gate destination | the destination in `poc-studio.yml`, else a DM to the owner |
| demo date | the demo event the Researcher found; else none, tier `standard` |
| gates | `by tier` |
| presenter | the person who asked · from the seat of the client's team lead |
| show off | the request's own nouns; else approvals that route by a rule, an AI assistant over live data, clean tables |
| intent | `find out`: the Researcher's Slack signals and the request decide; when neither does, `both`, marked `Check this` |
| sources | `slack gmail calendar drive`: Slack must be connected; any other that is missing is noted and skipped |
| slack | `find them`: the Researcher searches channels by the client's name, domain and the demo words |
| nebula | `latest-code`: updated to the code-builder version when older |
| design system | `reuse` when the client's folder exists, else `generate` |
| video | `off` |
| frontend | `code`: the final app is a code app from the code-builder Nebula; the Text2Code prompt is written in every case |
| innovate | `nebula`: the Innovator runs, and the Judge admits at most two ideas Nebula can build |
| avoid | deletes · anything needing a connection the tenant lacks · more pages than the budget |
| tenant | the host of a builder link in the request; else the folder's Nebula solution; else the most recent tenant Nebula's `state next` lists |
| solution | `<Client> Demo` |
| release | publish and deploy without asking · PRIVATE |
| data | assumed, fictional · 15 to 20 rows · UnifyApps Storage · one story row; files found under `studio/data/` count as given |
| external | `existing`: only connections already on the tenant, no credential stop |
| sandboxes | none |
| budget | 3 rounds · 4 pages · 3 objects · 3 automations · 1 AI agent · 2 rehearsal rounds |
| voice | plain words · the client's terms as the site uses them |
| brand | scout the site |

A drafted profile is still a profile: the build never asks for one. The runbook shows which
defaults were used so the person can confirm or change them.
