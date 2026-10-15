# Ask Nebula: how a platform question gets answered

Any role can hit a question about the platform: can a table's search fire an event, how does
an AI agent get a tool's arguments, what does a picklist store, which block shows rows grouped
under headings, can a page call an automation that is not deployed. Nobody guesses. The
question goes to Nebula, which holds the answer in one of five places, with the plugin's
verified UnifyApps skills as a sixth. The Scout owns this
during discovery and the capability check; the moderator does it itself for a question that
arrives mid-build; any other role asks the moderator.

## Why not from memory

Nebula's own agents say it best: the platform fails silently. A guessed prop renders nothing,
a guessed action is a quiet no-op, and the write still reports success. So a platform answer
that did not come from Nebula's files, Nebula's knowledge sheets or a tenant read does not
count, and a decision built on it is reopened.

## Where Nebula keeps the answers, in the order to try

1. **The capability boundary.** `NEBULA/skills/zen-routing/references/task-kinds.md`
   § What each builder can do, with its list of work no tool does, and
   `NEBULA/skills/app-craft/references/kit.md` for the parts proven to look finished. Most
   "can it" questions end here.
2. **A knowledge skill.** Load the one the table below names with the Skill tool. Nebula wrote
   each for exactly these questions.
3. **The platform's own knowledge sheets** (pages, blocks, actions, fields, concepts):
   `get_app_builder_knowledge_map` with no topics browses the catalog's one-line summaries;
   with a sheet id it returns that sheet's neighbours; `get_app_builder_knowledge` returns the
   sheet, and the exact shape a key accepts. The full sheet list is in Nebula's app-agent file
   (`NEBULA/agents/app-agent.md` § Every knowledge sheet there is).
4. **The automation references**: `get_dsl_reference` (the language), `find_workflow_examples`
   (worked examples), `search_operations` then `get_operation_schema` (a connector action and
   its inputs), `get_code_sandbox_restrictions` (what a code node may do),
   `describe_storage_object` (an object as an automation sees it).
5. **The tenant itself**, through Nebula's Ask path (`NEBULA/skills/sonic-routing/SKILL.md`
   § 2 Ask): cache first with `entity context` and the `cache …` views, live only on `miss`
   or `stale` or for what the cache never holds. Never write anything for a question.

6. **The verified UnifyApps skills in this plugin**, when Nebula's five places do not settle
   it, or to check an answer they give: `unifyapps-connectors` (what a connector can do,
   its auth form, which connections the tenant holds), `unifyapps-config-apps` (every config
   component, event, action and data source), `unifyapps-apps` (code apps, `/agent-api`,
   objects, connections), `unifyapps-builder` (automations, agents, tools),
   `unifyapps-context-graph`, `unifyapps-governance`, and `API-SPEC.md` at the plugin root.
   Each finding carries an evidence level, a tenant and a date: only `✅ verified` settles a
   row; `👁 observed` or `⚠️ partial` settles it marked `Check this`; `⛔ does not work` is a
   `no tool` answer. Log the source as `NEBULA platform-skill <skill> <section>`.

Stop at the first place that settles it.

## Which skill answers which question

| Question about | Load |
|---|---|
| pages, blocks, bindings, data sources, events, what a page can do | `nebula:app-design`; `nebula:app-native` the moment the app is MOBILE |
| what a finished page needs, states, the words on screen, where a look can live | `nebula:app-craft` |
| the app's theme and look | `nebula:app-theme`, with `app-craft/references/app-look.md` |
| a page's job and regions | `nebula:app-page-planner` |
| how far to push a screen, direction, motion | `nebula:agentic-editing-designer` |
| objects, fields, picklists, indexes, records, record filters | `nebula:object-storage-manager`; designing a schema `nebula:object-schema-designer`; relationships `nebula:object-erd` |
| automations: runtime behaviour, contracts, what a clean save does not catch | `nebula:automation-runtime`; test runs `nebula:automation-testing`; a broken run `nebula:automation-run-debugging` |
| transforming data, code nodes | `nebula:data-transforms-and-code` |
| dates, epochs, schedules | `nebula:dates-and-time` |
| files and attachments | `nebula:files-and-attachments` |
| maybe-absent values, dynamic schemas, mapped arrays | `nebula:node-inputs-and-pills` |
| connectors, external systems, what to resolve before a step | `nebula:external-data-inspection`; connections `nebula:connection-manager` |
| retries, errors, partial failure | `nebula:resiliency`; speed `nebula:performance` |
| AI agents: instructions, model, tools, skills, knowledge, guardrails, test, publish | `nebula:agent-builder` |
| evaluation datasets, metrics, experiments | `nebula:eval-datasets`, `nebula:eval-metrics`, `nebula:eval-experiments` |
| exposing an automation as an API, keys, policies, traffic | `nebula:api-groups`, `nebula:api-access`, `nebula:api-policies`, `nebula:api-insights` (their tool server is not built yet; the skills say so) |
| records, users, analytics, reports, platform events | `nebula:unifyapps-data` |
| languages and translated text | `nebula:app-localization` |
| UI tests in Test Studio | `nebula:app-test-author` |
| what a solution is, what Nebula itself can and cannot do | `nebula:solution-manager`, and `NEBULA/README.md` and `NEBULA/getting_started.md` |
| the safety rules | `nebula:nebula-safety` |

## The protocol

1. Write the question as one ledger row: `platform question · <subject.decision>: <the
   question>`, raised by the role that hit it.
2. Answer it through the six places above, in order, stopping at the first that settles it.
3. Record the answer in the ledger as `Key | Answer | Source: NEBULA <skill, sheet id or read>
   | settled`, so nobody asks twice and the runbook can show where it came from.
4. "No tool does this" is an answer, and a finding: name the nearest thing the platform can
   do, and bend the storyline, never the platform. It is `no tool` in the Scout's capability
   table and a cut for the Judge.
5. A question Nebula's files, sheets and reads cannot settle is answered by the safest
   reading that `kit.md` proves, marked `Check this`, and listed in the runbook as unverified.

## Who asks, when

- **Scout**: its own questions and everyone else's during discovery and the capability check.
  It names the source in `scout.md`.
- **Moderator**: a builder's `needs_confirmation` mid-build that is about the platform (what
  it can do or store), as opposed to a client decision. Answered here, saved with
  `plan task <planId> <taskId> --answer`, logged `NEBULA`.
- **Designer**: before planning a region it is not sure the platform can draw. `kit.md` first.
- **Ideator and Judge**: through the Scout, as `open rows`; neither reads the tenant.
- **Rehearsal**: when a beat fails for a reason that looks like platform behaviour rather than
  a build mistake, so the fix line asks for the right change.
