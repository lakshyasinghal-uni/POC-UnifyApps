# The Nebula bridge: every Nebula call this skill makes

Written against Nebula 3.47.0. `NEBULA` is the `root` that `scripts/nebula-root.mjs` printed.
Every CLI call below starts with its `cli` line, written here as `NEB`:

```
NEB = bash "$NEBULA/scripts/run-node.sh" "$NEBULA/scripts/nebula.mjs"
```

Always add `--json`. Claude Code supplies `CLAUDE_CODE_SESSION_ID`; when a command fails for a
missing session id, choose one stable id for the whole session and append `--session <id>` to
every command from then on. Never generate a new one per command.

## Contents
- Setup
- Reads
- Files to read from Nebula at run time
- Brief
- Build
- Later task (a fix, or Next task)
- Finish
- Links and addresses

## Setup

Mirror Nebula's `start` skill from the CLI, taking answers from the profile instead of asking.

1. `NEB state next --json`.
   - `continue_solution`: this folder already holds a solution. Use `folderSolution.tenant`
     and `folderSolution.id`, whatever the profile says, and write a ledger row
     `solution · kept the folder's <name> · MODERATOR`. Go to step 3 with that tenant.
   - `handoff`: use `handoff.tenant` and `handoff.solutionId` or `handoff.solutionName`.
   - `ask_tenant`: the tenant is the profile's `tenant` line, or the host of a builder link
     the person typed in the request. Run `NEB state next --tenant <host> --json`.
2. `login`: run `bash "$NEBULA/scripts/run-node.sh" "$NEBULA/scripts/login.mjs" <host> --check`.
   Exit 0: signed in. Exit 3 or `AUTH_EXPIRED`: this is the one setup stop. Ask ONE
   AskUserQuestion, header `Sign in`, question `How would you like to sign in to <host>?`,
   options `Open browser` and `Enter cookie manually`, and then do exactly what Nebula's
   `start` skill's `login` row says for each (read it at
   `$NEBULA/skills/start/SKILL.md`, the table row `login`): the browser wrapper with a
   300000 ms Bash timeout, or the cookie passed on stdin with `--manual`, never on a command
   line or echoed. Then `NEB solution storage-check --tenant <host> --json` and
   `NEB state next --tenant <host> --after-login --json`.
3. `pick_solution`: the solution is the profile's `solution` line.
   - `NEB solution resolve "<name>" --tenant <host> --json`. Exactly one `exact: true` match:
     `NEB solution open --tenant <host> --id <id> --mode <build_mode> --request "<request>" --json`.
     No match: `NEB solution create --tenant <host> --name "<name>" --mode <build_mode> --request "<request>" --json`.
     Several inexact matches and no exact one: create, and log the row.
   - `WORKSPACE_SOLUTION_MISMATCH`: the folder holds another solution; rerun step 1's
     `continue_solution` branch with it. Never pass `--override-folder` on your own.
   - `WORKSPACE_CONTENT_CONFLICT`: stop and show Nebula's message; the person must start in
     an empty folder.
   - `PLATFORM_UNREACHABLE` with `localFallback: true`: rerun the create once with
     `--storage local`, and log the row.
   - `PRODUCTION_BLOCKED` or `ENVIRONMENT_UNCONFIRMED`: show the message as it is and stop.
4. `NEB solution mode <build_mode> --json` (`sonic` or `zen`, the POC's build mode; harmless
   when `--mode` already recorded it), then `NEB solution context --json`. Check `mode` matches. Keep `memory`, `features`,
   `plans` and `linkedEntities` for the Scout's message.
5. `NEB solution refresh --json` before the Scout starts, so the cache is current.

## Reads

The Scout reads cache first and live only for what the cache never holds, exactly as
`$NEBULA/skills/sonic-scoping/SKILL.md` §1 says. The commands, for the Scout's message:

- `NEB entity context solution --json`: every linked app, object, automation, AI agent.
- `NEB cache app <appId>`, `cache nav <appId>`, `cache paths <appId>`: an app, its menu,
  its page addresses.
- `NEB cache outline <pageId> --app-id <appId>`, `cache blocks … --name <block>`,
  `cache ds --app-id <appId>`, `cache events <pageId> --app-id <appId>`.
- `NEB cache obj <objectId>`: fields and indexes. `cache wf <id> --contract`: an
  automation's inputs and outputs. `cache agent <id>`: an AI agent.
- `NEB cache limits`: what is never cached (records, connections, runs, AI agent parts).
  Those are live reads with the read tools of each server, and so is the global search a new
  name needs: `get_objects` on a new `OBJ_` id, `search` with an object's exact name,
  `get_app_overview` on a new app id, `search_workflows` with an automation's exact name.

Never pipe a cache answer through `grep`, `sed` or `head`: a filter hides the line that says
what to run instead.

## Files to read from Nebula at run time

Read these from `NEBULA`, never copy them into Studio: they move with Nebula.

| File | Who reads it | For |
|---|---|---|
| `skills/sonic-scoping/references/fast-defaults.md` | moderator, Stand-in | the fallback defaults demo-defaults.md overrides |
| `skills/sonic-scoping/references/brief-template.md` | moderator | the brief's exact headings and line shapes |
| `skills/zen-brainstorming/references/questionnaire-template.md` | moderator | the two questionnaire documents |
| `skills/zen-brainstorming/references/requirements-checklist.md` | moderator, Judge | the twelve fact-types every decision ledger must cover |
| `skills/zen-routing/references/task-kinds.md` § What each builder can do | Scout | which tool makes each change and which read proves it; what no tool does |
| `skills/zen-routing/references/run-loop.md` | moderator | the build loop, verbatim |
| `skills/zen-routing/references/dispatch-template.md` | moderator | what a builder's message holds |
| `skills/zen-routing/references/entity-membership.md` | moderator | checking an existing entity is in the open solution |
| `skills/app-craft/references/app-look.md` § Decide it | Designer | the 17 answers and the look line |
| `skills/app-craft/references/default-looks.md` | Designer | the `not` part |
| `skills/app-craft/references/kit.md` | Designer, Scout | parts proven to look finished |
| `skills/app-page-planner/SKILL.md` | Designer | the job line and the design block |
| `skills/app-craft/scripts/app-look-args.mjs` | Designer | checking the look line's contrast and values |
| `skills/app-verify/scripts/browser.mjs` | Rehearsal | the browser |
| `skills/app-verify/references/browser-walk.md` | Rehearsal | the preview route and the exit codes |
| `skills/sonic-plan/SKILL.md` | moderator (loaded as a skill) | brief lines to tasks |

## Brief

1. Write the brief at `$STUDIO/<brief-slug>.md` in the exact shape of `brief-template.md`:
   `## Goal`, `## Touches`, `## Changes`, `## Rules`, `## Ready when`, `## Assumptions`.
   `## Changes` in builder order: objects, record seeds, automations, the `app look` line,
   pages each with `job` and `design`, app navigation. Every `<…>` filled; literal angle
   brackets in code spans. Under about forty lines when it fits; a demo may run longer, and
   Studio never offers the Zen escalation.
2. `NEB fast brief --title "<title>" --md-file "$STUDIO/<brief-slug>.md" --json`. It refuses
   a missing heading, a look line in words or failing contrast, a font not on the list, a
   look line below a job line, a page without job or design, a deploy or publish naming
   nothing in `## Touches`. Fix exactly what it names.

## Build

1. `NEB fast accept --draft <slug> --execution plan --json`. Sonic's default is
   `no-ask-before-deploy`, so every deploy and publish in `## Ready when` runs without a
   further yes. Do not pass `--ask-before-deploy`.
2. Load `nebula:sonic-plan` with the Skill tool and follow it with policy `subsequent`: it
   turns `## Changes` and `## Ready when` into the task graph, writes the JSON under
   `.sessions/<sessionId>/drafts/`, runs `plan create --spec <specId> --tasks-file <json> --json`,
   then `plan start <planId> --json`, with no plan shown and no question.
3. Follow `run-loop.md` exactly: `NEB plan ready <planId> --mark --json` groups ready work
   and writes each builder's message file; start each builder named in `send` with the
   Agent tool (`nebula:app-agent`, `nebula:fde-agent`, `nebula:automation-agent`,
   `nebula:agent-builder`, `nebula:page-reviewer`) using the exact prompt the reply gives;
   pass the returned agent ids back with `--agent-ids`; record each report as the loop says.
   The Studio overrides are in SKILL.md § Phase 3, Build, which is Nebula.
4. When `plan ready` exits 5, the plan is no longer in progress: `NEB plan finish <planId> --json`
   and keep its `entityTable` and `notes`.

## Later task (a fix, or Next task)

This is Nebula's `sonic-routing` §5 path, which asks nothing.

1. `NEB solution refresh --json`. Read only what the fix touches, cache first.
2. Write the smallest valid brief from the fix line (one `## Changes` line when possible, the
   page it touches under `## Touches`, `publish <app>` under `## Ready when` when the change
   is invisible until published) at `$STUDIO/<fix-slug>.md`.
3. `NEB fast brief --title "<title>" --md-file <path> --json`, then
   `NEB fast accept --draft <slug> --json`. Present neither.
4. Load `nebula:sonic-plan` with policy `subsequent`; it creates and starts the plan. Run the
   loop as in § Build, then `plan finish`.

## Finish

1. `NEB plan get <planId> --json` for the last plan's results.
2. Feature documents: `NEB feature upsert --file <json> --json`, one per feature, in the shape
   `$NEBULA/skills/zen-routing/references/feature-template.md` gives, keeping app and page
   documentation apart from automation documentation.
3. Memory: `NEB memory remember <decisions|corrections|errors|notes> "<text>" --plan <planId> --json`
   only for a fact the spec and plan will not carry forward: an unexplained failure, a tenant
   fact, a correction. Not for the Stand-in's ordinary decisions, which the runbook lists.
4. `NEB solution context --json` so later requests see the persisted `execution` and plans.

## Zen mode

A POC whose `build_mode` is `zen` uses Nebula's Zen path in place of the Sonic commands above.
Read the Zen skills from `$NEBULA/skills/` at run time and follow them, since their commands are
Nebula's to define: `zen-brainstorming` (scoping by questionnaire, two rounds, in the shape of
its `questionnaire-template.md`) and `zen-routing` (the plan and its `run-loop.md`, which the
Sonic path also uses). What Studio changes:

- Each questionnaire round goes to the person in the Claude chat (gate-delivery.md),
  with the Stand-in's draft as the suggested answer; their answers are the questionnaire's.
- The brief carries the person's answers as `OWNER` assumptions.
- A builder's `needs_confirmation` that is a client decision goes to the person, with the
  Stand-in's draft; a platform question is still answered through ask-nebula.md.
- Deploys and publishes wait where Nebula's Zen run loop says they wait, as a question.
- Gates, the write-back check, run state and feedback tickets are the same as in Sonic.

If a Zen skill or command named here is missing from the installed Nebula, say so in one line
and run that step the Sonic way, asking the person each open question as a Zen question.

## Links and addresses

- An entity's platform link: `NEB entity link <kind> <id> [--app-id <id>] [--object-id <id>] --json`.
- A page's preview address, for the Rehearsal script: `https://<host>/p/0/interfaces/<appId>/preview/<path>`
  where `<path>` comes from `NEB cache paths <appId>`; a detail page takes a real record id in
  place of its `:param`. The published address is on another host and shows a sign-in page to
  a browser that `open-page` started, so Rehearsal walks the preview route and the runbook
  lists both.
