# unifyapps-helper

Verified, self-contained **skills** for driving UnifyApps through its REST API —
reverse-engineered from the platform and tested end to end against live tenants.

| Skill | What it covers | Verified against |
|---|---|---|
| `unifyapps-builder` | Automations (workflows) and AI agents — triggers, Oracle/SQL and HTTP steps, branching, loops, agent Tasks and workflow-backed Tools | `orbit.uat` |
| `unifyapps-context-graph` | Enterprise Context Graph — graph/node/edge schema, records, record-level edges, connector ingestion with discovery + enrichment agents, OpenCypher retrieval, agent wiring | `tool.prod-aps1` |
| `unifyapps-apps` | Applications (config pages/blocks/data sources, code apps + `/agent-api` + GitHub), Objects Manager schemas and records, Connections create/test/search | `orbit.uat` |
| `unifyapps-config-apps` | Config (no-code) apps end to end — builder library, every component, events/actions, data sources on objects/automations/any connector, transformers, custom components (ZIP upload + runtime), theme, navigation, publish; full sample app *CGB Pulse* | `orbit.uat` |
| `unifyapps-connectors` | **What UnifyApps can connect to and what each connector can do** — the full 1,214-node catalogue (983 application connectors, 91 platform nodes), every action/trigger/agent-tool, auth forms, which connections a tenant already has, and a refresh loop that keeps it current | `orbit.uat` |
| `demo-studio` | Narrated demo video, narration script, live runbook and presenter manual — one pipeline, any web app | PlatformX, Fujairah Ports HR demo |
| agents `ua-scout`, `ua-checker` (`.claude/agents/`) | Sonnet subagents: read-only lookups and mechanical pass/fail checks with evidence; every judgement stays with the main session (playbook §4b) | — |
| `taste-skill` + `redesign-skill`, `minimalist-skill`, `soft-skill`, `brutalist-skill`, `brandkit`, `output-skill`, `stitch-skill`, `gpt-tasteskill`, `image-to-code-skill`, `imagegen-frontend-web/-mobile`, `taste-skill-v1` | **UI/UX design taste** for any app UI built with the skills above — anti-slop layout, typography, spacing, motion; audit-first redesigns; style directions. Third-party, from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT). Read `taste-skill/SKILL.md` before designing or restyling a code/config app screen; `redesign-skill` for existing screens. | — |
| `design-skills` | **Registry of 67 design-system skills** (enterprise, corporate, minimal, glassmorphism, shadcn, material, editorial, …) — pick a slug in its SKILL.md, then follow `registry/<slug>/SKILL.md` as the token/component system for the build. Third-party, from [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) (MIT). | — |
| `playwright-cli` | **Browser automation & UI testing** via the global `@playwright/cli` — scripted checks of code/config apps in the builder preview, screenshots, test codegen, tracing. Installed with `playwright-cli install --skills=claude`; sessions live in `.playwright-cli/` (git-ignored). | — |
| `frontend-design` | **Visual taste** — Anthropic's frontend-design skill: aesthetic direction, typography, non-templated UI choices. Read before building or reshaping any screen, together with `taste-skill`. From [anthropics/skills](https://github.com/anthropics/skills). | — |
| `web-design-guidelines` | **Accessibility / UX review** of UI code against Vercel's Web Interface Guidelines — run before a build is called done in the Standard and In-depth test modes. From [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT). | — |
| `react-best-practices` | **React/Next performance** rules from Vercel Engineering — apply when writing or refactoring code-app components, data fetching, bundles. From [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT). | — |
| `accessibility-scan` / `-inspect` / `-fix` / `-diff` / `-audit` (+ `shared/`) | **Dedicated WCAG 2.2 a11y auditing** (AccessLint): automated scan of a live page, hands-on keyboard/screen-reader inspection, remediation loop, regression diff, whole-site audit. scan/diff use `npx @accesslint/cli`; fix needs the `@accesslint/mcp` server (see `shared/SOURCE.md`). From [AccessLint/skills](https://github.com/AccessLint/skills) (MIT). | — |
| `ui-animation` | **UI motion** — build, review and measure animation: springs, gestures, scroll effects, transition recipes, curve fitting from recordings, interface SFX. Use when adding or reviewing animation in a code app. From [mblode/agent-skills](https://github.com/mblode/agent-skills) (MIT). | — |
| `ui-design` / `product-design` / `typography-audit` / `ui-verification` | mblode companions to `ui-animation`: build and audit React/Tailwind UI (design-system extraction, dark mode, responsive, slop removal); interaction semantics (action scope, reversibility, recovery, reachable states); 78-rule typography audit; scoped browser probes (focus, hit targets, overflow, themes, request failures, perf) with evidence. From [mblode/agent-skills](https://github.com/mblode/agent-skills) (MIT). | — |
| `img2threejs` | **Image → procedural Three.js model** — rebuild the object/character in a reference image as a quality-gated, animation-ready `THREE.Group` factory in code. Third-party, from [img2threejs/img2threejs](https://github.com/img2threejs/img2threejs) (Apache-2.0). Use when a code app, landing page or presentation needs a 3D product/hero visual from a picture; not for charts, icons or flat art. | — |

Each lives in its own folder under `.claude/skills/` and depends on nothing outside
itself — no `CLAUDE.md`, no shared files. This repo is just their home.

## Design & UX quality pipeline (mandatory on every app)

`unifyapps-apps` and `unifyapps-config-apps` carry `references/design-quality-pipeline.md`; the canonical copy is
in `unifyapps-apps`. **Claude Code building a solution end to end uses:**
- `unifyapps-solution-playbook`;
- `atomic-agent-architecture`;
- `unifyapps-apps` and `unifyapps-config-apps`;
- `unifyapps-builder` and the other platform skills;
- `API-SPEC.md`.

`unifyapps-usecase-studio` belongs to a separate project, the UnifyApps Studio, as Forge is. Claude Code builds
don't use it, and it isn't part of the team plugin.

The pipeline runs on every app build from **Phase 0**, before the first component: direction (`frontend-design`, `taste-skill`, one
`design-skills` slug, brand tokens win) → UX decisions (`product-design`) → build (`ui-design`,
`react-best-practices`, `typography-audit`, `ui-animation`) → verify (`ui-verification`,
AccessLint scan/inspect/fix/diff, `web-design-guidelines`, on the builder preview at the chosen test mode) → report
naming every skill that ran.
The third-party skills it uses are the rows above.

**Build questions:** asked once at Phase 0:
- the process as understood from the brief (confirmed before anything is built);
- environment;
- config or code app;
- access (private or public);
- sellable product or demo app;
- design style: Full atomic (AI decision pipelines) or Light (dashboards, analytics, chat-over-data), recommended per use case;
- customer name and logo (both confirmed);
- unit of work and volume;
- data per system (connect if a connection exists, else simulate) and test inputs;
- business rules;
- which agent writes need approval;
- test mode: Quick · **Standard** · In-depth;
- where to test: **builder preview only**, unless the user asks for the published URL;
- review: **early** or at the end.

Once the build is done, the user is asked whether they want a video recording, a demo script, a manual, or a
`DEMO.md` run sheet. All the questions and their options, what each test mode runs, and where build time actually
goes (from the eleven case files) are in `unifyapps-solution-playbook/references/build-options.md`.

## API specification — the living document

**[`API-SPEC.md`](API-SPEC.md)** is the master record of every UnifyApps endpoint discovered so
far — 126 paths across auth, workflows, execution, connections, entities, agents, search,
observability, the Context Graph and files — with request/response shapes, workflow-step
contracts, an error catalogue, and the dead ends nobody should retest.

Every entry carries its evidence level (✅ verified · 👁 observed · 📦 bundle-only ·
⚠️ partial · ⛔ does not work), plus the tenant and date. Section 1 explains how to maintain
it; section 18 lists contradictions between tenants that still need resolving.

The skills hold curated, self-contained copies of the parts they need. **When you discover
something new, record it in `API-SPEC.md` first**, then update any skill it affects.

## Sellable, not a prototype (applies to every solution built with these skills)

The overall solution must be ready to be sold to the customer as it stands — every app, agent,
workflow, object and graph production-grade, published and tested on the builder preview (the published URL only when the user asks). The one
exception: it need not connect to the customer's third-party systems; the data may live on our
platform (Data Objects, Context Graph, uploaded documents). That data is still bound by the
INVENT NOTHING rule in `unifyapps-apps`. Anything that cannot be made sellable is left out and
named in the report, never shipped half-built. Set by Maher, 2026-09-25.

## No-delete rule (applies to every skill here)

**Anyone using these skills must never delete a resource** on any tenant, database or repo they
touch: no workflow, agent, task/tool, app, page, data source, object, record, context graph,
node, edge, source, connection, code-app branch or file, Oracle row, git branch or repository.
Not even one the skill created. Soft-delete (a status / `archived` / `enabled=false` flag), or
leave it in place and name it for the owner. Every `SKILL.md` carries the rule at the top and
`references/connect-and-call.md` §0 spells out what counts and what to do instead.

It is enforced, not just stated. `.claude/hooks/no-delete-guard.py` (identical copy in each
skill's `scripts/no_delete_guard.py`) is a Claude Code `PreToolUse` hook that scans every shell
command, browser JavaScript call and any script a command runs, and refuses the call when it
matches a delete endpoint, HTTP `DELETE`, a `deleted` flag set to true, a `*_delete_*`
storage/connector node, SQL `DELETE`/`DROP`/`TRUNCATE`, an Oracle `DELETE_*` API or a git/GitHub
branch/repo deletion. It fails closed. This repo's `.claude/settings.json` wires it for sessions
started here; install it in `~/.claude/settings.json` (snippet in `connect-and-call.md` §0) so it
applies everywhere.

## Install it wherever you need it

### For your team (recommended): install as a Claude Code plugin

This repo is a plugin marketplace. One install gives a person the whole set in every project:
- every skill in `.claude/skills/`;
- the `ua-scout` and `ua-checker` subagents from `.claude/agents/`;
- the no-delete guard hook, wired automatically;
- `API-SPEC.md`, which ships inside the plugin at its root.

Each teammate runs this once, in Claude Code:

```
/plugin marketplace add mmaheranwar/unifyapps-helper
/plugin install unifyapps@unifyapps-helper
```

They need read access to the GitHub repo. From a shell the same steps are
`claude plugin marketplace add mmaheranwar/unifyapps-helper` and then
`claude plugin install unifyapps@unifyapps-helper`.

- **Updates.** The plugin carries no pinned version, so every commit on `main` is a new version. Teammates get it with
  `/plugin marketplace update unifyapps-helper` and then `/plugin update unifyapps@unifyapps-helper`. To have it
  happen by itself, turn on auto-update for this marketplace: `/plugin` → Marketplaces → unifyapps-helper → Enable
  auto-update.
- **Names.** Plugin items are namespaced. Skills are `/unifyapps:unifyapps-builder`, `/unifyapps:atomic-agent-architecture`
  and so on, and the agents are `unifyapps:ua-scout` and `unifyapps:ua-checker`. Sessions still pick skills up
  automatically from the task.
- **No duplicates.** If you copied these skills into `~/.claude/skills/` before, remove those copies after installing
  the plugin, or each skill loads twice. Inside this repo itself the skills already load as project skills, so don't
  enable the plugin for this repo.
- **Offering it in another team repo.** To prompt everyone who opens a given project, add this to that project's
  `.claude/settings.json`:

  ```json
  {
    "extraKnownMarketplaces": {
      "unifyapps-helper": { "source": { "source": "github", "repo": "mmaheranwar/unifyapps-helper" } }
    },
    "enabledPlugins": { "unifyapps@unifyapps-helper": true }
  }
  ```

**Publishing an update:** commit and push to `main`. When you add a **new skill folder**, also add its path to the
`skills` list in `.claude-plugin/plugin.json`. The list is explicit so that `unifyapps-usecase-studio`, which belongs
to the separate Studio project, stays out of the plugin.

### Or share it as a zip (no GitHub access needed)

**Make the zip.** From the repo, run:

```bash
git archive --format=zip -o unifyapps-helper.zip HEAD
```

It contains only what the plugin needs (~4 MB): the plugin files, the skills it ships, the agents, the hook,
`API-SPEC.md` and this README. `.gitattributes` (`export-ignore`) leaves out `hr-demo/`, the old `.7z` backup,
local launch and settings files, and the Studio skill. Saved sign-ins, `node_modules` and videos are git-ignored, so
they are never in it. Send the zip however you
share files.

**Install it (each teammate, once).**
1. Unzip to a folder that will stay put, e.g. `C:\claude\unifyapps-helper` or `~/claude/unifyapps-helper`.
2. In Claude Code:
   ```
   /plugin marketplace add C:\claude\unifyapps-helper
   /plugin install unifyapps@unifyapps-helper
   ```
3. Restart Claude Code. The skills load in every project as `unifyapps:<skill>`. `API-SPEC.md` is inside the
   plugin folder, and the skills find it there.
4. Python 3 must be on the PATH as `python`, because the no-delete guard is a Python script. Without it, the guard
   does not run.

**Update it.**
1. Unzip the new zip over the same folder, replacing the files.
2. Run `/plugin marketplace update unifyapps-helper`, then `/plugin update unifyapps@unifyapps-helper`.
3. Restart Claude Code.

Tested 2026-09-28: install from an unzipped folder, then an update after the folder changed.

### Or copy single skills by hand

**For every project**, as personal skills that load in any session:

```bash
cp -r .claude/skills/unifyapps-builder ~/.claude/skills/
cp .claude/agents/*.md ~/.claude/agents/      # the ua-scout / ua-checker subagents
```

**For one project**, drop the skill into that project's skill folder:

```bash
cp -r .claude/skills/unifyapps-builder /path/to/project/.claude/skills/
```

Either way the folder is copied whole. If the target project already has its own
`CLAUDE.md`, nothing needs merging — the skill carries its own environment details, rules
and references. Copies do not update themselves; the plugin does.

## Why this exists

UnifyApps' prompt-to-automation copilot runs server-side, so watching it in devtools
never reveals the authoring API. The manual builder uses the *same* endpoints and **is**
observable — that is how the contract was captured, then confirmed by building and
running real workflows and agents.

## What works

Verified end to end, purely over HTTP:

- **Workflows** — create, configure, deploy, execute, read results
- **Triggers** — Schedule, Callable (typed input parameters), Event, Webhook
- **Steps** — Oracle DB / SQL, HTTP REST, Groovy/code, variables, sub-workflow calls
- **Control flow** — conditions, while-loops, break, error paths
- **Mapping** — `{{ n_node.outputs.field }}` templating and `=FORMULA()` expressions
- **Responses** — arbitrary nested JSON from a `STOP` node
- **Agents** — create, Tasks (journeys), Tools that call workflows, publish

## Contents

```
.claude/skills/unifyapps-builder/
    SKILL.md                  entry point: environment, rules, auth, endpoints,
                              object model, cookbook, gotchas, build order
    references/workflows.md   full workflow API reference
    references/agents.md      agent / task / tool reference
    scripts/ua_builder.py     spec-driven generator  <- start here for real work
    scripts/ua_client.py      minimal single-workflow example
```

## Quick start

```bash
python .claude/skills/unifyapps-builder/scripts/ua_builder.py
```

Prompts for the service-account password, then builds and smoke-tests four workflows,
creates an agent with two tasks and four workflow-backed tools, and publishes it.
Standard library only — no `pip install`.

To build your own: **copy** the spec block at the bottom of `ua_builder.py` (don't edit it
in place, or every run rebuilds the demo). One function per workflow, then
`build_agent` → `build_task` → `build_tool` → `publish_agent`.

## Working example in the tenant

`Fleet Operations Assistant` — 2 tasks, 4 tools, 4 workflows (Oracle SQL, REST GET,
Oracle + branching + Groovy, REST POST + Groovy + error path). All deployed, all
smoke-tested green. Ids are in `SKILL.md`; treat them as read-only references.

## Caveats

The UAT tenant is **shared**. Read anything; write only objects you created.

Not yet established: conversing with an agent over API, connectors with dynamic schemas,
and knowledge/guardrails/teams. These are listed honestly in `SKILL.md` rather than assumed.
(Invoking a deployed CALLABLE and creating connections are now verified — see
`unifyapps-apps`.)

---

## unifyapps-apps

Applications (config-based **and** code-based), Data Objects and Connections.

```
.claude/skills/unifyapps-apps/
    SKILL.md                              module map, config vs code, GitHub status, rules, scratch ids
    references/config-apps.md             e_interface / e_component / blocks / e_data_source / publish
    references/code-apps.md               code-app repo layout, app-builder-sdk contract, /agent-api, Git
    references/objects-and-connections.md EntityType schema + records; connection test/create/search
    scripts/ua_apps.js                    same-origin helper for a logged-in tab (window.ua.*)
```

The idea that unlocks all of it: **an app never calls an automation or object directly — it
executes a registered `e_data_source`** through `POST /api/workflow/execute/node`. You can
create that data source yourself over REST, which is how Claude wires a hand-written or
GitHub-edited code app to a new automation.

Code apps are real React/Vite repos that can be linked to a **new private GitHub repo** (personal
account or org — a tenant feature flag can force org-only; it is off on UAT); the source ships the platform agent's own skills in `.agents/skills/`. Whether
commits pushed from outside flow back into the Code Builder is still to be tested.

---

## unifyapps-context-graph

Builds and queries an **Enterprise Context Graph**: the ontology layer (node types +
edge labels) that sits on top of the platform's Data Objects, with records, record-level
relationships, and an OpenCypher query surface.

```
.claude/skills/unifyapps-context-graph/
    SKILL.md                              rules, build order, stage trap, gotchas table
    references/ecg-api.md                 every endpoint, payload and id format
    references/sources-and-sync.md        verified source payloads, MDM/storage patterns,
                                          HubSpot + Slack specifics, reading run output
    references/ingestion-and-agents.md    discovery/enrichment pipeline, retrieval prompt
    scripts/ecg_builder.py                spec-driven builder in the correct order
```

Five things that are easy to get wrong and cost the most time:

- **Publish the graph before loading anything.** Records written to a `DRAFT` graph land in
  the entity store and are *never* projected into the Cypher layer. No error — they simply
  don't exist to `MATCH`.
- **Make every property `STRING`.** Typed properties (`DATE`/`DOUBLE`/`INTEGER`/`BOOLEAN`)
  store fine but the node then projects **zero vertices**. Convert in Cypher instead:
  ``toFloat(d.`_pr_amount`) > 100000``.
- **Verify projection after the first insert of each node type** with
  `MATCH (n) RETURN DISTINCT labels(n)`. A missing type means unqueryable records.
- **Records do not link themselves.** A matching `customer_id` links nothing; record edges
  are written with `mdm_by_unifyapps_add_edge_to_graph` from inside an automation.
- **Never judge a deal from its stage id.** Stage ids get recycled — `closedwon` can be an
  *open* 70% stage. Traverse `(Deal)-[AT_STAGE]->(Stage)` and read `is_terminal`.

Working example in `tool.prod-aps1`: **SC Customer Context (Live)** — 15 node types,
32 edge types, 211 records, ~300 record edges, fed from HubSpot and Slack, with an agent
that correctly answers the stage trap, ranks people by activity, inventories 23 documents
by type, and says "none are recorded" rather than inventing facts. Ids are in `SKILL.md`.

---

## unifyapps-connectors

The answer to the question every other skill runs into: **which connector do I use, and what can
it do?** A live harvest of the tenant's whole connector surface, plus the loop that keeps it from
going stale.

```
.claude/skills/unifyapps-connectors/
    SKILL.md                              the four questions, the refresh loop, the rules
    references/discovery-api.md           every endpoint that answers "what exists"
    references/capability-patterns.md     naming, resource types, triggers, versions, look-alikes
    references/connections.md             auth forms, create/test, OAuth, per-user connections
    catalogue/connectors-index.tsv        983 application connectors
    catalogue/platform-nodes.tsv          91 platform nodes (no connection needed)
    catalogue/connections-uat-*.tsv       what this tenant actually has connections for
    catalogue/actions/*.md                28 per-connector capability deep dives
    scripts/harvest.js                    same-origin browser harvester -> TSV snapshot
    scripts/refresh_catalogue.py          diff a snapshot, merge it, write the changelog
```

Answering "can UnifyApps talk to X?" is a `grep`, with no login:

```bash
grep -i zendesk .claude/skills/unifyapps-connectors/catalogue/connectors-index.tsv
```

What the harvest established, on `orbit.uat` at 2026-09-23: **1,214 nodes** — 983 application
connectors, 91 platform nodes, 140 tenant-local custom ones. 1,064 need a connection, but only
**~279 connectors actually have a usable one**, and most of those have fewer than five. A connector
shipping is not the same as this tenant being able to call it.

Three things worth knowing before you pick one:

- **`appName` is rarely the product name** — `gsheets`, `gcalendar`, `zoho` (Zoho CRM),
  `sqlserver`, `mdm_by_unifyapps` (Ontology). Grep the index rather than guessing.
- **Never hardcode `resourceVersion`.** It drifts, and a stored version eventually produces a step
  that will not save. Resolve it from `/resources` at build time, every time.
- **`custom_http_endpoint` is not `custom_http_application`** — ad-hoc HTTP with no connection
  versus a connector with a saved, authenticated base URL. Getting this pair wrong is the most
  common HTTP mistake on the platform.

When the platform ships new connectors, run the harvester, then
`python scripts/refresh_catalogue.py snapshot.tsv`: it reports what was added, removed or renamed,
rewrites the index and appends a dated entry to the catalogue changelog. Anything learned about
platform *behaviour* goes into `API-SPEC.md` §31 at the same time.

---

## demo-studio

The only skill here that is not about the UnifyApps API. It produces a customer-facing
demo of **any** web application — the video and the paperwork that goes with it — from a
single `steps.json`:

```
out/<slug>.mp4            narrated walkthrough, captions and title cards burned in
out/<slug>.srt            subtitles, timed to the narration
out/<slug>_Script.pdf     the words, act by act — send this for sign-off before recording
out/<slug>_Runbook.pdf    one sheet to present live from: beats, key lines, traps, likely questions
out/<slug>_Manual.pdf     literal step-by-step manual with a screenshot per scene
out/screenshots/          every still under a readable name, plus a contact sheet
```

Playwright drives a real Chrome, `edge-tts` speaks the narration, and ffmpeg mixes each
act and joins them. Every project-specific fact — URLs, personas, brand colours, act
titles, document copy — lives in `demo.config.json`; no script contains a URL.

The engine does what a good demo needs rather than just clicking: a visible pointer and a
glow ring, smooth scrolling of inner panes, in-app navigation with no white flash, waiting
for the app's own confirmation instead of a hopeful sleep, and `actions.mjs` for steps that
change real state — plus `prepare[act]`, staging that runs off camera so any act can be
re-recorded on its own. Captions come in two styles: a quiet chip, or the PlatformX panel
that puts the spoken line on screen for a video watched with the sound off.

```
.claude/skills/demo-studio/
    SKILL.md                      pipeline, stage order, the rules that matter
    references/steps-schema.md    every field and action type
    references/config.md          every config key
    references/authoring.md       how to write a demo that has an ending
    references/gotchas.md         the traps, and why the code is shaped that way
    scaffold.mjs                  copies the pipeline into a project
    assets/                       the pipeline itself
```

Distilled from the PlatformX demo (three personas through one live emergency) and the
Fujairah Ports AI Recruitment demo, and smoke-tested end to end on throwaway sites —
including a step that opens a confirm dialog, waits for the app's toast and watches the
board update.

Two things it refuses to do: type a password (sign-ins are captured by a human into a
saved `storageState`), and record before the dry run is clean.
