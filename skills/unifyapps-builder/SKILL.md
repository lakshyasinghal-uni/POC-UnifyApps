---
name: unifyapps-builder
description: Build, deploy and run UnifyApps automations (workflows) and AI agents entirely through the platform REST API — triggers, Oracle/SQL and HTTP steps, branching, loops, input parameters, JSON responses, plus agent Tasks and Tools that call those workflows. Use whenever the user wants to create, edit, bulk-generate, inspect or deploy UnifyApps workflows/automations or AI agents, or asks about UnifyApps API endpoints, node schemas, connections, connectors, or the `{{ n_node.outputs.x }}` templating.
metadata:
  author: Maher
---

# UnifyApps builder

> **Created by Maher.** Contains no credentials. Each user signs in with their own UnifyApps
> account — see `references/connect-and-call.md`.

> ## 🚫 HARD RULE: never delete a resource
> Anyone using this skill **must not delete anything** on any platform it touches: no workflow,
> agent, task, tool, app, page, data source, object, record, graph, node, edge, source, connection,
> code-app branch or file, Oracle row, git branch or repository. Not even one this skill created.
> That covers `POST …/delete/…` endpoints, HTTP `DELETE`, `deleted: true`, `requestType: "DELETED"`,
> `*_delete_*` storage/connector nodes in workflows, data sources or agent tools, SQL
> `DELETE`/`DROP`/`TRUNCATE`, and Oracle `DELETE_*` APIs. Instead: **soft-delete** (a status /
> `archived` / `enabled=false` flag), or leave it and tell the user exactly what would need removing
> so they can do it themselves in the console. If a design seems to need a delete, stop and ask.
> A hook enforces this at execution time: `scripts/no_delete_guard.py` — install it per
> `references/connect-and-call.md` §0. Do not try to work around it.

Create and manage UnifyApps **automations** (workflows) and **AI agents** over REST.
Every endpoint and schema here was reverse-engineered and **verified live** against the
UAT tenant — including a complete agent with 2 tasks and 4 workflow-backed tools.

## Cold start — do these things first

1. **Get connected with the user's own account** — read `references/connect-and-call.md`:
   pick the tenant, sign in (browser session or local-account script), confirm who you are,
   and find the connection ids to use. Never ask for a password.
2. **Read `references/workflows.md`** before building any workflow, and
   **`references/agents.md`** before building any agent. They hold the full object model.
   Do not guess schemas; they are all documented.
3. **Start from `scripts/ua_builder.py`.** It is a working spec-driven generator, not a
   sketch. Adding an automation = adding a ~10-line function. Do not rewrite the plumbing.
4. **Confirm which tenant and account** you are targeting, and that the user is happy for
   objects to be created there.

## What is in this skill

| Path | Contents |
|---|---|
| `references/connect-and-call.md` | **Sign in with your own account, find connections, API conventions** |
| `references/workflows.md` | Workflow endpoints, node/edge model, control flow, execution, connectors |
| `references/agents.md` | Agent entity CRUD, Tasks, Tools, publish, UI routes |
| `scripts/ua_builder.py` | **Spec-driven generator — start here for anything multi-workflow** |
| `scripts/ua_client.py` | Smaller single-workflow example, good connectivity check |

## The living API spec — master reference

`API-SPEC.md`, at the root of the POC Studio plugin (`${CLAUDE_PLUGIN_ROOT}/API-SPEC.md`), is the **master record of every UnifyApps endpoint
discovered** — 126 paths across auth, workflows, execution, connections, entities, agents,
search, observability, the Context Graph and files. Every entry carries an evidence level
(✅ verified · 👁 observed · 📦 bundle-only · ⚠️ partial · ⛔ does not work), a tenant and a date.

It is **additive, not required**: this skill's own references are enough to build workflows
and agents. If you received this skill without the repo, carry on without it.

**Read it when:**
- you need an endpoint or workflow action **this skill does not document** — including the
  Context Graph APIs owned by the `unifyapps-context-graph` skill;
- an endpoint looks plausible but is untested — check **§15 Confirmed dead ends** first, so you
  don't spend attempts on a known 404/405;
- you hit an error you don't recognise — **§17 Error catalogue** maps message → cause → fix;
- a behaviour seems to differ between tenants — **§18 Discrepancies**;
- you need a workflow step's full input/output contract — **§16 Node action contracts**.

**Where this skill and the spec disagree, the spec wins** — it is the master and is updated
first. Known example: this file's note on `fallbackMode: CONTINUE` is contradicted by
evidence in §18 D2.

**Write to it** whenever you verify or disprove anything about the API, in the same session:
use the entry template in its §1, give the entry a status mark plus tenant and date, put
contradictions in §18 instead of overwriting, add a §21 changelog line, bump the version —
then update this skill if its guidance changed. **Never paste passwords, cookies, tokens or
`connection.userInput` contents into it.**

## Environment

| | |
|---|---|
| Tenant (sandbox / UAT) | `https://orbit.uat.unifyapps.com` |
| Account | **the user's own** — browser session, or a local non-SSO account for the scripts |
| Local IdP id for this tenant | `65d2f4cf672d16da08efc3d0` (tenant-wide, not a secret) |
| Oracle connection | **find your own** with the aggregation query below; pass it as `UA_ORACLE_CONNECTION_ID` |
| **Tenant scale** (measured 2026-09-19) | **~31,750** workflows · **~7,787** connections |

`GET /api/connection` has **no server-side filter** and returns every connection (slow). **Search
server-side instead** ✅ *2026-09-21*: `POST /api/aggregation?entityType=Connection&group=STANDARD`
with `filter: {op:"AND", values:[{field:"appName",op:"EQUAL",values:["oracledb"]},{field:"active",op:"EQUAL",values:[true]}]}`
and projections `id, name, appName, oUId` — ~50 ms, no secrets. Only fall back to the full list when
you must inspect `userInput`: to find a connection reliably, **match the real host/service in
`userInput`**, not its name — names are arbitrary and duplicated (three different connections
were all called `RDQA-OracleDB-PRY`). Creating connections is covered by the `unifyapps-apps` skill
(`POST /api/connection/input?appName=`).

Oracle **EBS** connections need `appName: "oracledb"` with `serviceName` set to the **PDB** and
`isCDBDatabase: false` — pointing at the CDB yields `ORA-01017`, because `APPS` is PDB-local.

Confirm the target tenant with the user before creating anything. Production will have a
different hostname, a different `identityProviderId`, and **different connection ids**.

The password belongs to the user. **Never ask for it in chat** — the scripts prompt for
it with `getpass`.

## Golden rules

00. **Sellable, not a prototype** (Maher, 2026-09-25). Every workflow and agent ships production-
   grade: deployed version == live version, zero violations, tools `enabled:true` and proven to be
   called, errors handled, identity resolved server-side, controls attached. The solution may run
   on platform-hosted data instead of the customer's third-party systems — that is the only
   shortcut — and that data is still real or neutral, never invented.
0. **Never delete anything.** See the hard rule at the top of this file and
   `references/connect-and-call.md` §0. Soft-delete or leave it; the `no_delete_guard.py` hook
   blocks delete calls at execution time.
1. **Never modify objects you did not create.** The tenant is shared — tens of thousands
   of workflows belong to colleagues. Read them freely to learn; write only your own.
   Avoid connections whose names contain DND or DONT TOUCH.
2. **Do not modify or delete the demo/reference objects** listed under *Verified working examples*.
   They belong to the skill author (Maher) and are kept as known-good, read-only references.
3. **Resolve `resourceVersion` at runtime.** Never hardcode. Versions drift fast
   (`oracledb_execute_sql` moved 16522→16523 within one session).
4. **Always check `violations`** after a save. A save with violations still returns
   HTTP 200 and still persists.
5. **Smoke-test every workflow before wiring it to a tool.** Behind an agent a broken
   workflow looks like a silent no-op.
6. **Verify by reading the run's node outputs**, never by assuming a template resolved.
7. **Copy, don't extend, the example spec** at the bottom of `scripts/ua_builder.py`.
   Editing it in place means every run also rebuilds the fleet demo workflows.
8. **Never guess — find the real cause, then fix it.** Do not describe a symptom as
   "probably platform-generated" or "cosmetic" and move on. Every "unexplained" behaviour so far
   has had a concrete, findable cause in the trace. Chase it to the actual mechanism, fix it, and
   record it here.
9. **A green run does not mean a correct result.** `STATUS: COMPLETED` only means no node threw.
   Always assert on the real payload, and for writes verify against the source system.
10. 🔴 **Native nodes first; a Code node is the last resort** (Maher, 2026-09-25). Filter in the
   fetch, count with `count_records`, group/join/rank with `run_sql_query_on_list`, sort with
   `sort_list`, parse with `to_json_object`, branch with `IF_ELSE`, iterate with `LOOP`, and build
   the response in the STOP node's `result` map. Code only for a real computation no node covers —
   one job per node, titled with why, ideally under 40 lines. Our own audit found 46–48 % Code
   nodes in the worst builds (API-SPEC §56). Replacement table and the two traps
   (`aggregate_records` does not group; `filter_list` returned nothing): `references/workflows.md` §5a.

## Reference architecture for a multi-subsystem agent ✅ *proven over 33 workflows*

Use this shape whenever one agent must cover many back-end subsystems.

```
GLOBAL tools   : whoami (session identity), resolve_<entity> (id expansion)
Capabilities   : generateChartTool + renderArtifact (both, or charts silently fail)
One Task per subsystem
   description  = WHEN to use it   (this is what the router matches on)
   instructions = HOW: scope, ID-MAPPING rules, domain rules, confirmation rules
   tools scoped by topicId so only that subsystem's tools are in play
One tool  → one CALLABLE workflow
   READ  : START → SELECT → STOP
   WRITE : START → PL/SQL → verify SELECT → STOP   (never trust OUT binds)
```

**Identity: resolve, never assume.** Put session identity behind **one** `whoami` tool that maps the
signed-in username to the back-end's own ids, and derive role from data (e.g. a `DIRECT_REPORTS`
count) rather than declaring "user X is a manager" in the prompt. Every Task then says *"call whoami
first; never hard-code an id"*. Before an IdP exists, default the username in one documented place —
switching to real federation is then a one-line change instead of a rewrite. Audit for this: grep
Task instructions for literal ids, not just the agent prompt — **Task-level instructions are the
place hard-coded ids survive a refactor**.

**Per-Task instructions should always carry an ID-MAPPING block** naming, for each id, the tool that
produces it and the tool that consumes it. This is what makes chained multi-tool calls reliable when
there is no field mapping.

## Pre-production audit — run this over EVERY workflow before shipping ✅ *verified 2026-09-19*

Do not rely on spot-checks. Fetch every workflow and assert these mechanically:

| Check | Why | Failure signature |
|---|---|---|
| **PL/SQL write whose STOP does not read a trailing `SELECT` node** | returns `""` to the agent | model invents a success message |
| **`inputs.setup.required` is empty** | the model may silently omit parameters | writes with NULL columns, no error |
| **`:binds` in SQL vs keys in `record`** | a missing key binds NULL silently | column quietly written as NULL |
| **OUT binds (`o_*`) present in `record`** | OUT fed an empty input | corrupted or failed call |
| **write tool without `approvalConfig.enabled`** | no human gate | agent writes unprompted |
| **`deploymentState.workflowVersion !== version`** | the agent runs an OLD definition | your fix is live but never executes |
| **a `:word` inside a single-quoted SQL literal** | parsed as a bind variable | `ORA-17003 Invalid column index` |
| **Code nodes ≥ native nodes, or any Code node over 60 lines, or one whose job is in `workflows.md` §5a's table** | logic hidden from the canvas, deploy-time-only failures, silent page ceilings | a 280-line Groovy "calc" nobody can review |
| **an LLM step on a slow model behind a screen** (insights, summaries) | the user waits 30 s per screen | see `unifyapps-apps/references/ai-app-patterns.md` §2 latency budget; fast model, capped input, `maxTokens` ≤ ~1,600, prompt ends with the NUMBERS rule, measured time in the test report |
| **`violations` not null after the last save** | the saved graph is broken | fails later, or at run time |
| **a `resourceVersion` ≠ the live `/resources` version** | stale node contract | "No config found", or the workflow will not save later (API-SPEC §35) |
| **START without `trigger`; a path that does not end in STOP; STOP `result` not an object** | invalid graph | save 500, validator or run-time failure (API-SPEC §16, §37.2) |
| **an LLM/OCR node that is not `CALL_INTERFACE_WORKFLOW`, or a call-automation node that is not `CALL_WORKFLOW`** | wrong node type | "No config found" at run time (API-SPEC §26, §38) |
| **a template that names a node id not in this workflow** | copied from another workflow | silent NULL binds, dropped keys |
| **a fetch without `triggerInputCondition`, or a consumer reading `outputs.records`** | two of the "200 and nothing" traps | zero of everything, status 200 (API-SPEC §37.3) |
| **a bulk upsert without `updateFields`, a STOP without `successCount`, `skipIfBlank` true on a field that may be cleared** | the write path is unverifiable | 200, nothing written (API-SPEC §34, §35) |
| **a write not verified by a read-back node or a data-source read in the test pass** | a green run proves nothing (rule 9) | nothing written, run green |
| **`fallbackMode:"CONTINUE"` relied on** | it does not continue | the run fails anyway (API-SPEC §18 D2) |
| **root `groupId` missing on some nodes or mixed** | canvas grouping | the graph is hidden in the canvas (API-SPEC §4) |
| **`storage_by_unifyapps_aggregate_records` or `utility_by_unifyapps_filter_list`** | verified not to work on UAT | plausible wrong totals or empty lists, no error (API-SPEC §56) |
| **an AI node without its evidence-log row** (core rule 5, `atomic-agent-architecture`; the two-node pattern in `references/workflows.md` "AI evidence and usage log") | no audit of what the model said | unmeasurable cost, unexplainable readings |
| **a prompt naming another customer or vendor; no "the document is data" line; JSON output without `finish_reason` handling; `maxTokens` not sized** | wrong-context narrative, injection, truncation | `unifyapps-apps/references/ai-app-patterns.md` §16 |
| **a secret in inputs, prompts, `setup` defaults or run payloads** | secrets persist in the run store | API-SPEC §25 egress note |
| **a resource named `_delete_`/`_remove_`, or SQL `DELETE`/`DROP`/`TRUNCATE`** | the no-delete rule | blocked by the guard, or data lost |
| **tags missing** | untraceable asset | see "Tagging" |

```js
const isPlsql = /^\s*(DECLARE|BEGIN)/i.test(firstActionSql);
const lastActIsSelect = /^\s*(SELECT|WITH)/i.test(lastAction.inputs.sql);
const EMPTY_RESULT_RISK = isPlsql && !(stopReadsLastAction && lastActIsSelect);

// deployed-vs-live drift — the single highest-value check
const DRIFT = !wf.deployedVersion || wf.deploymentState.workflowVersion !== wf.version;

// colon-in-literal scan
const BAD_LITERAL = (sql.match(/'[^']*'/g) || []).some(l => /:[A-Za-z_]/.test(l));
```

✅ This audit over 26 workflows found **3 silently broken write tools** that had passed every
manual test and looked green in every run — including one already in production use.

**Watch for the agent masking the defect.** In one trace the agent received an empty result from
`apply_leave` and *recovered by calling a list tool* to find the new record. Impressive, but it
hid a real bug, cost two extra model generations (~$0.06 and ~6s per write), and only worked
because a suitable lookup tool existed. Treat unexplained extra tool calls as a symptom.

## 🔴 `initiate-test` does NOT test what the agent runs ✅ *verified 2026-09-19*

`POST /api/test-workflow/initiate-test/{id}` takes the **whole definition inline** and executes
*that*. It never reads the deployed version. An agent tool, by contrast, calls
`version: "-1"` = **latest deployed**.

So this sequence is silently broken, and it cost a full debugging cycle:

```
deploy v1 (buggy)  →  edit the definition  →  initiate-test → GREEN ✅
                                             (tests your in-memory copy)
agent calls the tool                       →  still runs v1 ❌
```

**Rules:**
1. After **any** edit to an already-deployed workflow, deploy again — a save is not a deploy.
2. Deploy with the *live* version: `deploy?version=${wf.version}` (re-fetch it first; it advances
   on every save).
3. Assert afterwards that `deploymentState.workflowVersion === wf.version`. `deployedVersion` is a
   **deployment counter**, not the workflow version — do not confuse them.
4. Treat a green `initiate-test` as evidence about your SQL, never as evidence about the agent.

### Corollary: a write commits before its verification node runs
The write node `COMMIT`s, then the verify `SELECT` runs as a separate node. If the verify node
fails, the run is marked **FAILED** and the agent tells the user *"could not be created"* —
**while the row exists**. ✅ Observed exactly: a supplier was created in Oracle and the agent
reported failure. A false negative is worse than a false positive: the user retries and you get
duplicates. Keep verification SQL boringly simple, and when an agent reports a failed write,
check the database before believing it.

## Colons inside SQL string literals are parsed as bind variables ✅ *verified 2026-09-19*

The Oracle connector scans the whole statement for `:name` **without skipping quoted literals**.
So an Oracle date format mask breaks it:

```sql
TO_CHAR(d,'YYYY-MM-DD HH24:MI')   -- ':MI' taken as a bind → ORA-17003 Invalid column index
TO_CHAR(d,'YYYY-MM-DD HH24":"MI') -- ✅ escaped; still renders a real colon
```

`ORA-17003 Invalid column index` from a plain `SELECT` that runs fine in SQL*Plus is almost always
this. Isolate it by removing one column at a time — the failure is in the **SQL text**, not the
schema. Also give every SQL node `params`/`record` containing **only the binds its own SQL uses**;
copying a shared bind set between nodes leaves unused binds behind.

## Debugging an agent: read the real LLM conversation ✅ *verified 2026-09-19*

The Observability tab exposes the **exact message array sent to the model**, which settles any
question about who produced a piece of text. UI path:
`/p/0/ai-agents/{id}/observability` → Sessions → a session → Traces → a trace → click a model span.

The values render character-by-character in a code viewer, so scrape the **API** instead of the DOM:

| Call | Purpose |
|---|---|
| `POST /api/workflow/execute/node?name=GetAllSessions` | sessions |
| `POST /api/workflow/execute/node?name=GetTraceTimeline&fetchTraceDetail={traceId}` | span tree |
| `POST /api/workflow/execute/node?name=TraceTimelineDetails&fetchTimelineDetails={spanId}` | **span input/output — the full `message[]`** |

Easiest route: drive the UI, then `read_network_requests` with the `requestId` of the
`TraceTimelineDetails` call to read its response body.

### Cheaper first step: classify the text from the DOM
Before chasing traces, ask *"is this text even model output?"* Every chat message carries
`data-message-id`, and an ancestor carries `data-message-type` (`user` | `brand`):

```js
[...document.querySelectorAll('[data-message-id]')]
  .map(m => ({ id: m.dataset.messageId, text: m.textContent.replace(/\s+/g,' ').slice(0,120) }));
```

This lists the turns in order and shows whether a suspicious line is its **own message**.

**`data-message-type` is `user` or `brand` (assistant). It does NOT tell you whether a `brand`
message was generated by the model or emitted by the runtime** — both render identically. Use
this to count the turns, not to settle authorship. For authorship, read the trace.

⚠️ **Do not conclude "platform chrome" from repetition.** The continuation generation sees
near-identical context every time, so near-identical wording is exactly what you would expect from
a *model*. I made this mistake: I saw `"The operation completed successfully — no errors occurred."`
appear byte-identically with a duplicated answer around it, declared it un-fixable UI chrome, and
wrote that here — contradicting the correct finding already recorded two sections below
(*the platform appends a synthetic user turn, which triggers an extra model generation*).
The follow-up tests then falsified my own rule twice: it appeared on a turn with **no** task
switch, and was **absent** on several turns where a tool had succeeded.

**What is actually established about this symptom** (✅ reproduced 2026-09-19):
- It is an **extra assistant generation** appended after the real answer — not a UI string.
- It is **intermittent**: same agent, same chat, one turn clean and the next not. No trigger
  (tool success, tool count, task switch, approval) predicted it reliably across ~10 observations.
- Instructions **reduce** it — telling every Task to end the turn and add nothing new removed the
  duplicate answer and the trailing menu — but do not eliminate the one-line acknowledgement.
- Asking for an "EMPTY reply" is weak: a model that must produce *something* produces filler.

**Rule for next time: reproduce twice and try to falsify before writing a root cause here.**
A skill entry asserting "unfixable" is worse than no entry — it stops the next investigation.

### Never quote the forbidden string in an instruction
`"never output lines such as 'The operation completed successfully'"` puts the exact phrase in
context and **primes the model to emit it**. Write the rule positively instead:
*"Describe only the business outcome. Do not announce completion or narrate your own mechanics."*
Same for trailing menus: forbid the behaviour, do not illustrate it.

### Where to put behaviour rules: the Task, not just the Agent
A Task's `instructions[]` arrive as a **`SetTopic` tool_result**, far more recent in the context
than the agent's system prompt, and they dominate. ✅ A rule about ending a turn had no effect in
the agent prompt and worked once copied into every Task.

What the message array reveals that nothing else does:
- `SetTopic` is a real tool call — the Task's `instructions[]` are injected as its **tool_result**.
- Tool results appear verbatim, so you can see an **empty (`""`) result** immediately.
- The platform appends a synthetic user turn **`"Lets continue.."`** after an assistant message,
  which triggers an **extra model generation**. That second generation is the source of trailing
  "what would you like to do next?" filler — it is not something your instructions requested.

## Authentication

Full walkthrough, including how to find your IdP id and your connections:
`references/connect-and-call.md`. Summary below.

### Script login (local account) — Option B in `connect-and-call.md`

No OAuth required. Log in with a local (non-SSO) account and keep a cookie jar. The scripts
read `UA_BASE_URL`, `UA_USERNAME` and `UA_IDP_ID` from the environment and prompt for the
password; **the user runs them in their own terminal.**

```http
POST /auth/workflow/execute/node?name=emailAndPassLoginRequest
{ "id": "emailAndPassLoginRequest",
  "context": { "appName": "auth_by_unifyapps", "resourceName": "auth_by_unifyapps_login" },
  "inputs": { "returnTo": "/", "failureReturnTo": "{BASE}/login",
              "formData": { "username": "...", "password": "...", "rememberMe": true },
              "identityProviderId": "<tenant local IdP id>" },
  "options": { "cacheConfig": {} } }
```

Note `/auth/`, **not** `/api/` — every `/api/login`-style path 404s. The session cookie is
**httpOnly**, so the client must store and replay it. UAT `identityProviderId`:
`65d2f4cf672d16da08efc3d0` (tenant-specific; read it off the login request elsewhere).

Never ask the user to paste a password into chat. `ua_builder.py` prompts via `getpass`.

### Browser session (no password at all) — Option A, recommended ✅ *verified 2026-09-19*

`getpass` cannot run in a **non-interactive** session, which blocks the script login entirely. If the user
already has the tenant open and logged in in the built-in browser, call the REST API **same-origin
from the page** — the httpOnly session cookie is sent automatically and no credential ever enters
the conversation:

```js
// mcp__Claude_Browser__javascript_tool  (tab must be on the tenant origin)
await (async () => {
  const r = await fetch('/api/connection', {
    credentials: 'include', headers: { Accept: 'application/json' } });
  return await r.json();
})()
```

Works for every `/api/...` endpoint in this skill, including POSTs
(`headers: {'Content-Type':'application/json'}, body: JSON.stringify(...)`).
**Prefer this in non-interactive sessions.** Two cautions: if the response comes back non-JSON,
the session has expired and the call was redirected to the login page — check `content-type`
before parsing; and **redact secrets** before returning anything, since `connection.userInput`
contains `password` / `authToken` in clear.

## Workflow endpoints

| Step | Call |
|---|---|
| Create | `POST /api/workflow-definition` — `nodes` must be non-null |
| Save | `POST /api/workflow-definition/saveAndReturnViolations` |
| Deploy | `POST /api/workflow-definition/{id}/deploy?version={n}` |
| Run | `POST /api/test-workflow/initiate-test/{id}` → `{runId}` |
| Status | `POST /api/aggregation?entityType=WORKFLOW_EXECUTION&group=TEST_WORKFLOW_EXECUTION` |
| Node output | `POST /api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE`, key `{runId}.{runId}.{nodeId}` — ⚠️ empty (`inaccessibleObjects`) for workflows created over the API on UAT; verify through the data source, or re-run the definition inline through `initiate-test` to read each node |
| Node catalog | `GET /api/workflow-builder/nodes` |
| Node actions | `GET /api/workflow-builder/node/{node}/resources` |
| Action schema | `GET /api/workflow-builder/node/{node}/resource/{res}` → `input.schema` |
| Connections | `POST /api/aggregation?entityType=Connection&group=STANDARD` (filter `appName`/`active`); `GET /api/connection/{id}` for one |
| Find workflows | `POST /api/aggregation?entityType=WorkflowDefinition&group=STANDARD` |

## Core object model

```json
{ "id": "n_sql", "type": "ACTION", "title": "...", "subTitle": "...",
  "context": { "appName": "oracledb", "resourceName": "oracledb_execute_sql",
               "resourceVersion": 16523, "connectionId": "<id>", "type": "APPLICATION" },
  "inputs": { "sql": "SELECT '{{ n_in.outputs.customerId }}' ... FROM DUAL" },
  "groupId": "g1", "index": 2, "fallbackMode": "STOP", "skip": false }
```

`context` = **which** action · `inputs` = **its config** · `connectionId` goes **inside
`context`**, never at node level.

Edges: `{fromNodeId, toNodeId, type, id: "{type}@{from}@{to}"}`
Types: `next` (also carries `name:"no"` / `"loopback"`), `if` (`name:"yes"`), `loop`, `error`.

Nesting is encoded in `groupId`: `"{ownerNodeId}@{parentGroupId}@{suffix}"`, suffix
`y` | `n` | `l` | `error`, concatenating as it nests.

Node types: `START`, `ACTION`, `STOP`, `IF_ELSE`, `LOOP`, `BREAK`, `DELAY`, `CALL_WORKFLOW`.

## Templating

`{{ n_<nodeId>.outputs.<path> }}` — **spaces inside the braces**. A leading `=` makes it a
formula: `"=SUM({{ n_v.outputs.i }},1)"`, `"=LEN({{ n_x.outputs.items }})"`.

## SQL bind variables — `params` **and** `record` ✅ *verified 2026-09-19*

**The single most expensive gotcha found so far.** A `:bind` in `inputs.sql` needs **two more
inputs**, and missing either gives the same opaque error:

> `ORA-17041: Missing IN or OUT parameter at index: 1`

```json
"inputs": {
  "sql":    "SELECT ... FROM apps.per_all_people_f p WHERE p.person_id = :p_person_id",
  "params": { "type": "object", "additionalProperties": false,      // the bind SCHEMA
              "properties": { "p_person_id": { "type": "integer", "title": "p_person_id" } } },
  "record": { "p_person_id": "{{ n_in.outputs.p_person_id }}" },    // the bind VALUES
  "objectSourceResourceName": "oracledb_execute_sql_metadata",
  "performAsync": false,
  "response_schema": { "type":"object", "properties": { "rows": {...}, "rowsCount": {...}, "rowsAffected": {...} } }
}
```

- **`params`** declares the bind variables (name + type). **`record`** supplies their *values*,
  as templates referencing the trigger node. You need **both**; `params` alone still fails.
- ⚠️ **`record` templates must reference YOUR OWN START node id.** Copying a working node from
  another workflow carries over *its* node id (e.g. `{{ n_4yPw0.outputs.… }}`), the template
  silently resolves to nothing, and you get ORA-17041 while the SQL and `params` look perfect.
  This is the trap — always rewrite `record` after copying a node.
- Every declared bind must be supplied on every call. There is no "optional" bind.
- ⚠️ **A `record` that is MISSING ONE KEY does not error — it binds NULL silently.** Omitting
  `record` entirely gives ORA-17041, but forgetting a single key gives a *successful* run that
  quietly writes NULL. Found in the wild: `maher_ebs_apply_leave` used `:p_absence_days` in its SQL
  but had no `p_absence_days` in `record`, so every day-based leave stored a NULL duration and
  nothing ever failed. **Always diff the `:binds` in the SQL against the keys in `record`.**
- ⚠️ **But do NOT blindly add every `:bind` to `record` — OUT binds must stay out.** In a PL/SQL
  anonymous block, `:o_absence_id` is an **OUT** parameter that receives the new id. Only **IN**
  parameters belong in `record`; adding an OUT bind there feeds it an empty input. When diffing
  binds against `record`, exclude anything the block assigns to (conventionally `o_*`).
- Omitting an optional IN bind from the *payload* (while it is still declared in `record`) is safe:
  it resolves to NULL. Verified — a day-based leave and an hours-based leave both wrote correctly
  from the same workflow, each supplying only its own duration parameter.

### 🔴 PL/SQL **OUT binds are never returned** — always add a verification SELECT ✅ *verified 2026-09-19*

`oracledb_execute_sql` running an anonymous block returns **`{"rows":[],"rowsCount":0,"rowsAffected":0}`**
no matter what the block assigns to `:o_*`. Declaring the OUT bind in `response_schema` does **not**
help. A STOP node mapping `{{ n_sql.outputs.rows[0].o_status }}` therefore resolves to nothing and
the workflow returns an **empty result**.

**Why this matters enormously behind an agent:** the tool result arrives as `content: ""`. The model
is told a tool ran but given nothing, so it **invents a plausible success line** — observed verbatim
as *"The operation completed successfully — no errors occurred."* The run looks green, the agent
sounds confident, and nothing is actually confirmed.

**Fix — three nodes, not two:**

```
START → n_sql (the PL/SQL write) → n_ver (a SELECT of the resulting row) → STOP
```

`n_ver` re-reads what was just written and returns it, so the STOP maps
`{{ n_ver.outputs.rows[0].PHONE_NUMBER }}` and the agent sees the **real stored state**:

```json
{"phone_id": 2, "phone_number": "708.295.5460", "status": "UPDATED"}
```

This is strictly better than an OUT bind anyway — the agent confirms from the database rather than
from a status string the block set itself. For a create, order the verification SELECT by the new id
descending and take the top row.
- Binds work fine in `WHERE`/`ON`. ORA-17041 is essentially **never** a SQL-syntax problem — it
  means a value did not arrive, so check `record` first.
- `objectSourceResourceName: "oracledb_execute_sql_metadata"` and a `response_schema` matching the
  SELECT's columns are what make the typed `rows` come back.

**When Oracle rejects a write (ORA-20001 etc.) the run FAILS at `n_sql`** ✅ *verified 2026-09-21*.
The data source call answers HTTP 500 `{"rootCauseMessage":"Workflow execution failed", ...}` and the
real reason is nested at `output.cause.cause.payload.message`
(`"Received Response: [ORA-20001: The Zip code is incorrect for this address.
ORA-06512: …]"`).
- A client should dig the first non-`ORA-06512` line out of the error payload (the SDK's
  `UAFetchError.payload` holds the parsed body) and show it, instead of the generic message.
- Catching `WHEN OTHERS` in the PL/SQL to return an `:o_error` does **not** work (OUT binds are
  never returned), and `fallbackMode` values `CONTINUE`, `CONTINUE_ON_ERROR`, `IGNORE`, `SKIP`,
  `CONTINUE_WITH_ERROR` did **not** keep the run going in `initiate-test` — the ACTION still stops it.
- Validate known Oracle rules before the call (e.g. US address style: ZIP must be 5 digits or ZIP+4).
- `initiate-test` with an inline `workflowDefinition` runs that inline graph (not the saved one) —
  handy for testing a fix before saving; `/api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE` then shows each
  node's inputs/outputs including the ORA text.

## Built-in capabilities (charts, artifacts, web search) ✅ *verified 2026-09-19*

Capabilities are **not** fields on the agent entity. Each one is an `e_action_ai_agent` row with
`isStandardAction: true`. Create them exactly like a normal tool — only 5 properties are needed:

```json
{ "entityType": "e_action_ai_agent", "tags": ["..."],
  "properties": { "name": "generateChartTool", "aiAgentId": "<agent id>",
                  "isStandardAction": true, "enabled": true, "topicId": "GLOBAL" } }
```

Standard action names seen in this tenant: `generateChartTool`, `renderArtifact`, `loadSkill`,
`webSearch`, `createExcel`, `createDocx`, `createDocxOrPdf`, `createPDF`, `createPPTX`,
`createFlowDiagram`, `createFile`, `analyseFile`, `documentVision`, `deepResearch`,
`generateImageTool`, `executeCodeTool`, `ingestKnowledge`, `companyKnowledge`, `planTool`,
`todo_tool`, `summaryTool`, `requestClarification`, `clarifyFromUser`, `qa`,
`informationNotFoundTool`, `generatePublicFileUrl`, `allowKnowledgeControl`,
`CompleteDocumentContext`, `generateAndEditEmail`, `Build_App`.

### 🔴 Charts also need `executeCodeTool` ✅ *verified 2026-09-21*
The chart path is `loadSkill(generate-chart)` → sandbox scripts. An agent with `generateChartTool` +
`renderArtifact` but **no `executeCodeTool`** row loads the skill, then the turn **ends silently** — the
last visible message is the model's "Composing the report now…" and no answer is ever written (trace:
LoadSkill → ~28 s "Miscellaneous" → no further LLM span). Enable all three, and instruct the agent to
write the full text answer regardless of whether a chart renders.

Reading a span over the API (the Observability detail call):
`POST /api/workflow/execute/node?name=TraceTimelineDetails&fetchTimelineDetails=6943f1be474ba4398bf4201c`
`{context:{appName:"callables",resourceName:"callables_call_automation"},inputs:{automationId:"6943f1be474ba4398bf4201c",synchronous:true,parameters:{id:"<spanId>",type:"Tool"|"LLM"}}}`
→ `response.inputOutputContent.{input,output}.content`. Span ids come from `GetTraceTimeline`
(`response.timeline.children[].children[].id`).

### 🔴 `generateChartTool` alone does nothing visible — you also need `renderArtifact`

The chart pipeline is: `loadSkill` (generate-chart) → several `ExecuteCodeInSandbox` steps that
write a CSV and build **`/workspace/working/draft.html`**. That HTML needs **`renderArtifact`** to
display in the canvas beside the chat.

**With `generateChartTool` but no `renderArtifact`** the sandbox still reports `Exit Code: 0` and
`Output Files: []`, nothing renders, and **the agent prints a table while claiming "here is your
bar chart"** — a silent, confidently-wrong failure. Enable **both**.

Once both are on, output is genuinely good: insight-led chart titles, grouped series, negatives
highlighted, plus a downloadable/expandable canvas.

> ⚠️ **Cost.** One chart request measured **291.5K tokens, 94s, $0.94** versus **$0.09–0.20** for a
> normal tool conversation — the sandbox loop runs the model between every step. Enable charting
> deliberately, and do not let an agent reach for it on every answer.

## Search before you create — reuse, clone or create ✅ (ported 2026-09-28)

Before building each planned asset, search the tenant. Reuse or reference what fits, clone what nearly fits, and
create only what is missing. Say which you did for each asset in the build notes.

| Asset | Search call (read-only) | Notes |
|---|---|---|
| Workflows | `POST /api/aggregation?entityType=WorkflowDefinition&group=STANDARD`, full body, `lcName ICONTAINS` | `name`/`CONTAINS` answers 500; names are not unique, so track ids ("Bulk building") |
| Objects | `POST /api/aggregation?entityType=EntityType&group=STANDARD`, `standard` false or MISSING, project `id,name,tags,oUId` | a missing object reads as 200 with an empty body |
| Agents | `POST /api/entity/ai_agent {page:{limit,offset}}`, filter `properties.name` client-side | `ICONTAINS` does not filter entities; skip `(Deep Clone)` rows |
| Connections | `POST /api/aggregation?entityType=Connection&group=STANDARD` by `appName` + `active`; prefer `oUId` = the user | never `GET /api/connection` (it returns secrets and is slow) |
| Connectors and actions | `unifyapps-connectors` `catalogue/connectors-index.tsv`, then `GET /api/workflow-builder/node/{app}/resources` | `appName` is not the product name |

An asset **not owned by this user** is read-only (rule 1). Reference it (a tool pointing to its workflow, a data
source pointing to its automation) or clone it into a new asset of your own; never edit it. Cloning a workflow clones
its prompt, so rewrite the prompt. Never copy another app's records.

## Tagging and ownership ✅ *verified 2026-09-19*

`tags` is a **plain array of strings** on `WorkflowDefinition` — the supported way to mark objects
as yours in a shared tenant (72 of the 100 most recently created workflows use them, e.g.
`["AI Generated", "marketwise"]`).

```json
{ "name": "<uc>_04_apply_leave_<YourName>", "tags": ["<YOURNAME>_EBS"], "nodes": [...], "edges": [...] }
```

- There is **no tag API** — `/api/tag`, `/api/tags` and `/api/entity-tag` all return **404**.
- **`GET /api/workflow-definition/{id}` does not return `tags`.** The only way to read them back is
  an aggregation projection:
  `projections: [{"name":"id"},{"name":"name"},{"name":"tags"}]`. Verify tagging that way, never
  by re-reading the definition.
- Pair tags with a **name suffix** with your own name (e.g. `_<YourName>`); names are searchable with `ICONTAINS` on
  `lcName`, so the two together make your objects trivially findable and safe to clean up.

## Cookbook (details in `references/workflows.md`)

- **Input parameters** → JSON Schema in the CALLABLE trigger's `inputs.setup`. This schema
  also becomes the agent tool's argument contract.
- **JSON response** → a `STOP` node, `inputs.result` = any nested object.
- **Oracle / SQL** → `oracledb` + `oracledb_execute_sql`, outputs `rows` / `rowsCount` /
  `rowsAffected`. 23 actions available. **Bind variables need THREE inputs — see below.**
- **HTTP** → `custom_http_endpoint` + `custom_http_endpoint_execute`, needs **no
  connection**. Outputs `status` / `result`.
- **Code** → prefer Groovy. Declare `input`/`output` schemas + `parameters`; code reads
  params as bare variables; read results as `{{ n.outputs.result.field }}`.
- **Branch** → `IF_ELSE`; `if` edge (`name:"yes"`) into the body, `next` edge (`name:"no"`)
  to the rejoin node; the body's last node also points at that rejoin node.
- **Loop** → `LOOP` + `loop_while`; `loop` edge into the body, `next` edge
  (`name:"loopback"`) back to the loop node, `next` edge out.
- **Sub-workflow** → `CALL_WORKFLOW` with `callables_call_automation`.

## Gotchas that will each cost an hour

- **Unresolved templates fail silently** — the key is dropped from the output with no
  error and no violation. If a field vanishes, the path is wrong. Check the node's real
  `outputs` payload.
- **Code node outputs nest under `result`** → `{{ n_code.outputs.result.field }}`.
- **Never trust a "who am I" parameter** in an app-callable workflow — the browser can send anything. Get
  the caller from the platform: create a row in a scratch object, read `outputs.ownerUserId` (stamped with
  the calling user), delete it, then map the id to your profile row. See API-SPEC "Caller identity".
- **JavaScript code nodes reject a top-level `return`** ("Script rejected by sandbox
  validation"). Use Groovy.
- **`fallbackMode: "MANUAL"`** is required for an `error` edge to fire. With `STOP` the run
  just fails and the handler never runs. `CONTINUE` ignores the failure.
- **A `BREAK` still needs an outgoing `next` edge**, to the same rejoin node as the
  enclosing condition's `no` branch, or validation fails.
- **Agent tools default to `enabled: false`.** Always set it explicitly.
- **Human-in-the-loop is `approvalConfig`, not the prompt.** ✅ *verified 2026-09-19* Set
  `properties.approvalConfig = { "enabled": true, "storeUserApprovalPreference": false }` on every
  write tool. The user then sees the tool name + **actual parameter values** with **Deny /
  Approve Once** buttons. **Deny genuinely blocks the write** — confirmed against the database
  (0 rows). Instructions alone are NOT enough: an agent told to "summarise and wait for a yes"
  was observed asking for confirmation *and executing the write in the same turn*, creating a real
  EBS record. Republish the agent after changing it.
- **Entity `tags` go at the TOP LEVEL of the create payload, never inside `properties`.**
  `{entityType, tags:[...], properties:{...}}`. Putting `tags` in `properties` fails with
  *"Non Empty Validations … add additionalProperties tags"* (HTTP 500).
- **After a Deny, agents tend to retry** and to misreport the denial as a permission/session error.
  Add an explicit instruction: a denial is a user decision — do not retry, do not advise refreshing
  the session or contacting an administrator.
- **`POST /api/entity/{type}` lists, it does not create.** Create = `POST /api/entity`;
  update = `POST /api/entity/update`; publish = `POST /api/entity/action/saveAndDeploy`
  with the **whole entity**.
- **Entities use `group=ENTITY`** in aggregation; workflows use `group=STANDARD`.
- **`/api/aggregation` needs the FULL body or it 500s.** Sending just `{"page":{...}}` returns
  HTTP 500 with no useful message. Always send `entityType`, `group`, `filter`, `sorts`,
  `projections` and `page` together — copy the template from `references/workflows.md`.
- **Reading one entity: `GET /api/entity/{entityType}/{id}`.** `GET /api/entity/{id}` (without the
  type) returns **405 Method Not Allowed**. e.g. `/api/entity/ai_agent/e_6aae3af83c95b76375e9046c`.
- **Aggregation results are wrapped.** Rows come back as `{ objects: [{ columns: {...} }] }` — read
  `o.columns`, not `o`. Field names are abbreviated (`cTm`, `mTm`, `oUId`, `d`, `lcName`).
- **`ICONTAINS` on `lcName` does not filter ENTITIES.** It works for `WorkflowDefinition`, but for
  `ai_agent` / `e_action_ai_agent` / `e_topic_ai_agent` it silently returns unrelated rows, and
  entity aggregation projections return only `id`/`tags` — **not `name`**. To find an entity by
  name, list with `POST /api/entity/{entityType}` and filter client-side on `properties.name`.
- **Entity list paging is OFFSET-based.** The envelope is `{cursor, hasMore, objects, type}`, but
  feeding `cursor` back silently re-returns **page 1** — a loop then yields the same rows N times
  and looks like "50 tools" when there are 12. Page with `page: {limit, offset}`, incrementing
  `offset`, and stop on `hasMore === false`.
- **Optimization runs create deep clones of an agent**, named
  `"<name> (Deep Clone) for optimizationRun-<id>"`, each with its **own duplicate tools** carrying a
  different `aiAgentId`. Locating an agent via its tools can therefore land you on a clone. Always
  confirm `properties.name` has no `(Deep Clone)` before editing, or you will modify a throwaway.
- `initiate-test` is the **test** runner. To invoke a **deployed** CALLABLE the way apps do ✅
  *2026-09-21*: register an `e_data_source` for it (`POST /api/entity`) and call
  `POST /api/workflow/execute/node?name=<ds>&requestId=<dsId>` with that `id` — the output comes
  back synchronously in `response`. Without a data source you get `forbidden datasource: not found`.
  Recipe in the `unifyapps-apps` skill (`references/config-apps.md`).
- **Workflows authored by the platform's own code agent** follow rules worth copying (from its
  `workflow-authoring` skill, v9): a node's `groupId` encodes its nesting path; a Groovy
  parameter bound to a whole list must be `{"source":"{{ n.outputs.objects }}","items":"{{ n.outputs.objects[0] }}","ua:type":"mappedArray"}`
  or the builder can't render it; every `array` schema property needs `items`; a STOP `result`
  must be an object (a JSONArray fails only at run time); Groovy null params are unbound — test
  with `binding.hasVariable('x')`; assigning to `owner` in Groovy is rejected at deploy.
- **Groovy strings returned from a Code node must be java Strings.** An interpolated `"…${x}…"`
  is a GString and serialises as `{bytes, strings, values, valueCount}`; a React app rendering it
  crashes with minified error #31 (object as child). Call `.toString()` on every interpolated
  string in the returned map (and in lists: `notes.collect { it?.toString() }`). Learned
  2026-09-21 on `scc_sizing_calculate`.
- **`1G` is a BigInteger in Groovy, `1.0G` is a BigDecimal.** `[x ?: 1G, 1G].max().setScale(0, …)` fails
  at run time with *"No signature of method: java.math.BigInteger.setScale()"* when the fallback wins.
  Write decimal literals (`0.0G`, `1.0G`, `250000.0G`) in any Code node that rounds or scales.
- **The Groovy sandbox blacklists `owner =`** (it is a closure property): `def owner = …` fails
  `saveAndReturnViolations` with *"Blacklisted commands found in code : owner = at position N"*. Name the
  variable something else (`who`, `ownerName`). Map keys like `[owner: 'x']` and `payload[o.owner]` are fine
  (verified UAT 2026-09-21).
- **A closure parameter may not share a name with anything already in scope.** In a Code node the whole
  script is one scope, so `def costLine = { String item, double price -> … }` fails **at deploy**
  (`/deploy` → 500, *"startup failed: … The current parameter list already contains a parameter of the
  name price"*) when `item`/`price` exist anywhere in the script — including as another closure's
  parameter. `saveAndReturnViolations` accepts it: only the deploy compiles. Prefix closure parameters
  (`lineItem`, `lineRate`) (verified UAT 2026-09-22, `scc_delivery_estimate`).
- **No `Date.format(...)` in Code nodes** — the groovy-dateutil extension is absent, so
  `new Date().format('yyyy-MM-dd', tz)` fails with *"No signature of method: java.util.Date.format()"*.
  Use `java.time`: `java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString()` (verified UAT 2026-09-21).
- **Throw to fail a callable cleanly:** `throw new IllegalArgumentException('…')` in a Code node surfaces to the
  caller (app data source or agent tool) as `rootCauseMessage` with `errorCode 5005` — use it for whitelist /
  ownership guards before any storage write.

## Callable-workflow patterns proven on a PoC-tracking command-centre build ✅ 2026-09-25 (API-SPEC §49)

- **Storage filters inside a workflow use `properties_<field>`** (underscore) or `id` in
  `triggerInputCondition`; the dot form belongs to the entity API. Verified by exact counts (80 blocker
  notes of 446, 6 milestones of one PoC). Re-filter in Groovy anyway when correctness matters.
- **Caller identity without a scratch row:** when the workflow writes a record anyway, create it first
  with a blank author, read `{{ n_c.outputs.ownerUserId }}`, map it to a profile row
  (`platform_user_id`), then write the full row back with the name. No delete node, ~430 ms.
- **Paging loop:** `variable_by_unifyapps_create_variables` → `loop_while` on a `more` flag → the
  connector call with `after:'{{ n_v.outputs.after }}'` → Groovy accumulating into a JSON string →
  `update_variables` → loopback. Body nodes carry `groupId: '<loop>@g1@l'`. A template that resolves
  to an array works inside nested inputs (`filterGroups[].filters[].values`, association `inputs`).
- **LLM step:** Vertex Opus 4.8 `e_6a1948ae4a418d2dde7d1096` answers a 3 KB JSON prompt in 3–5 s
  (fits `initiate-test`); confirm the model by price signature (`inputTokenCost/inputTokens` × 1e6 =
  5.00, output 25.00). Parse `llmResponse` by slicing from the first `{` to the last `}`.
- **Null map values vanish** from a Groovy node's output — treat absent keys as null downstream.
- **Prove the repo copy:** hash `{nodes, edges}` with sorted keys (edges minus `priority`/`skip`) on
  both sides after every deploy; the server changes nothing else.
- **Idempotency check for a sync:** run it three times; the third must report zero changed fields
  beyond the sync timestamp. It caught HubSpot `closedate` carrying a time of day.

## Agents

### 🔴 A generic query tool needs THREE filter pairs, or the agent loops and answers nothing ✅ 2026-09-23

The commonest cause of "the agent stalls" is the TOOL, not the model. A `QueryData` tool that
takes `object_type` + ONE `filter_field`/`filter_value` cannot express a multi-dimensional lookup
— a KPI time series needs scope **and** scope_code **and** metric — so the model guesses, gets the
wrong rows, guesses again, and ends the turn with no answer. Give the tool
`filter_field2`/`filter_value2` and `filter_field3`/`filter_value3`, AND the leaves, accept a
comma-separated value as an `IN` list and `"true"`/`"false"` as a boolean, and strip a
`properties.` prefix a caller helpfully added (otherwise the sort silently never applies).

Two more, same family:
- **Never compact a result by a whitelist of field names.** Cloned from another app, the
  whitelist matches nothing in the new domain and the tool returns rows that are literally `{}` —
  with no error. Drop by SHAPE instead (keys ending `_json`, or string values over ~140 chars),
  which keeps every number and survives any domain.
- **Return `object_total` next to `returned`** and instruct the agent to say which it is quoting,
  or it will report the page size as the size of the register.

Then put the hardest call in the agent's instructions as a worked example, and add a stopping
rule — *"two calls that returned the wrong rows means the filter was wrong; never make a third
guess, say what you found and what is missing"*. Measured before/after on one build: a trend
question went from five tool calls and no answer, to an answer with a chart in 43 s.

Full recipe, with the Groovy: `unifyapps-apps/references/ai-app-patterns.md` §6.

### 🔴 The other half: an agent that ends the turn by announcing a call it never makes ✅ 2026-09-23

The three-filter-pair tool above stops the *looping*. A second failure mode survives it, at
roughly **1 turn in 9**, and it looks like success from the outside:

> `responseGenerationStatus: "completed"`, three tool calls made, and the last thing the agent
> wrote is *"Let me look at the document detail for the highest-exposure names and pull the
> actual mandatory expired/expiring documents."* The turn ends there. The user gets a plan.

There is **no max-iterations setting to raise** — `ai_agent.topicExecutionSettings` carries only
the model choices, `thinkToolDisabled`, citations and voice. It is a prompting problem. Put this
in EVERY agent's instructions, right after the tool-recovery rule:

```
HOW A TURN ENDS — a contract with no exceptions
The last thing you write is the ANSWER to the question you were asked. Never a plan, never a
next step, never a note about a field.
- If your final sentence starts "Let me", "I'll now", "Next I will", "Let's look at" or "I need
  to", the turn is not finished. Either make that call, or delete the sentence and answer with
  what you already have.
- You get at most FIVE <QueryTool> calls in a turn. On the fifth you stop reading and write the
  answer, naming what you could not check and what somebody would have to open to close it. A
  partial answer with its gap stated is the deliverable. A promise is not.
- A field that cannot give you what you wanted is a FINDING, not a reason to stop. Say what it
  can and cannot distinguish, give the best answer it does support, and move on.
- Open with the answer, not with how you got it. "I retrieved", "I now have", "I have the full
  list", "Let me separate" are working notes. The reader wants the finding in the first line.
```

The last bullet fixes a separate, cosmetic problem that appeared in **4 of 9** answers on the
same build: the final answer opened with the model's own working notes.

**Measure it properly, or you will not see it.** Send with `POST /api/workflow/execute/node/sse`
and read the stream to the end (that is the latency). Then read the conversation and take the Bot
message **without** `additional.internalMessageType` — the list is **reverse chronological**, so
the answer is the FIRST such message. Taking the longest one hides exactly this bug: in a stalled
turn the longest non-thought message is a mid-turn narration, and the harness reports an answer
that the user never saw. Nine-question baseline on an earlier sourcing build: 9/9 `completed`, 20–54 s,
2.2k–7.0k characters, $0.07–$0.55 a turn.


### 🔴 NEVER set `deleted: true` on a Task/Tool entity — it is irreversible and breaks the agent
❌ Learned the hard way 2026-09-19. Setting `deleted: true` via `/api/entity/update` makes the
entity **unupdatable** (`5002 ENTITY … not found`) while it still appears in listings — and the
agent then fails **globally** with *"The agent hit an unexpected error"* on every question, not just
the affected topic. There is no API route back: `/api/entity/delete` does not exist and
`DELETE /api/entity/{id}` returns -1. The orphan has to be removed from the console.

**To retire a Task safely:** move its tools to another topic first, then set
`properties.enabled = false`. Leave `deleted` alone. Never leave a topic with **zero tools**.

### Diagnosing "The agent hit an unexpected error"
The SSE stream (`POST /api/workflow/execute/node/sse`) carries only `Workflow execution failed`, so
work out *where* it failed instead:
- **No "Executing tool" line appears** → it died before tool execution: the fault is in the
  **topic/tool graph**, not in a workflow. Check for orphaned, empty or soft-deleted topics.
- **A tool ran first** → test that workflow directly with `initiate-test`.

Before blaming content, confirm the cheap things: every tool's `automationId` resolves and is
deployed, no duplicate tool **names** across the agent, no topic with zero tools, and
`agentType` set. Note that **disabling** a tool does not remove it from the schema, so disabling
tools is a weak bisection signal — move them to another topic instead.

### Save the agent from a full entity, not a list projection
`/api/entity/ai_agent` list rows are what you POST back to `saveAndDeploy`. Verify after each
publish that `properties` still carries `instructions`, `agentType`, `indexingSettings`,
`preProcessingSettings`, `responseGenerationSettings` and `topicExecutionSettings` — a partial
object silently degrades the agent — and that `GET /api/entity/deployed/ai_agent/{id}` `.properties`
equal the agent's (`references/agents.md` "Verify a publish by snapshot").


### 🔴 Set `properties.agentType` when creating an agent over the API ✅ *verified 2026-09-19*

The UI sets it; `POST /api/entity` does **not** default it. An agent created over the API comes out
with **no `agentType` at all**, which is not a normal state — in this tenant only **2 of 2,400**
agents lacked it, and one of them was mine.

```js
properties: { name, instructions, agentType: 'ai-agent' }
```

Tenant distribution, as a guide to the right value:
`ai-agent` 1136 · `custom-gpt` 1119 · `workflow-gpt` 52 · `SPACE` 46 · `team` 24 ·
`workflow` 19 · `CONVERSATIONAL` 2. For a Task/Tool agent the value is **`ai-agent`**.

Symptom of the missing value: the agent still works, but the test surface renders in a reduced mode
(for example no model selector) and the runtime appends extra messages after the real answer. Setting
it removed the duplicated-answer message. Find it with:

```js
agents.filter(a => !a.properties.agentType).map(a => a.properties.name);
```


| Concept | Entity type | Key fields |
|---|---|---|
| Agent | `ai_agent` | `properties.instructions` = system prompt; `name` required to publish |
| Task | `e_topic_ai_agent` | `description` = *when* to use; `instructions[]` = *how* (array!) |
| Tool | `e_action_ai_agent` | usually a workflow call; `topicId` scopes it |

A tool that calls a workflow:

```json
{ "name": "VehicleLookup",
  "description": "Look up a vehicle record by vehicle id.",
  "aiAgentId": "<agent id>", "topicId": "GLOBAL",
  "context": { "appName": "callables", "resourceName": "callables_call_automation" },
  "inputs": { "automationId": "<workflow id>", "version": "-1", "synchronous": true,
              "runtimeConnections": {}, "parameters": {} },
  "enabled": true }
```

`topicId: "GLOBAL"` = agent-wide (shows in the Tools tab); a topic id = scoped to that
Task only. `version: "-1"` = latest deployed. Leave `parameters: {}` and the model fills
arguments from the workflow's `setup` schema.

Tool `name` and `description` are what the model routes on — write them as instructions to
a model, not as internal identifiers.

### Proving an agent over the test API — what the PoC Copilot build taught ✅ 2026-09-25 (API-SPEC §50)

- **The streaming call does not wait for the answer.** `execute/node/sse` (`callables_call_automation_streaming`,
  `copilotType AI_AGENT_TEST`) closes after ~2 s with `responseGenerationStatus: pending`. Poll the conversation
  reader until `additional.responseGenerationStatus === 'completed'`, then make sure the newest Bot message is the
  settled answer — the reader can report `completed` while the only Bot message is still the model's interim
  narration ("I'll start by…"); the real answer lands a few seconds later. The browser JS tool has a 45 s ceiling:
  run the battery as a background promise on `window` and poll it from later calls.
- **Prove the model from the LLM span, not the agent entity.** `TraceTimelineDetails` `type:"LLM"` →
  `inputOutputContent.input.content.modelId`; cross-check with `llmUsageDetails` (Opus 4.8 = 5 / 6.25 / 25 USD per M
  for input / cache-write / output). Put the same id in all four slots (`topicExecutionModel`, `topicSelectionModel`,
  `answerGenerationModel`, `answerGenerationModelSettings.modelId`).
- **The model only knows the username.** The hidden user-context message is `{"userName","alias"}` + date + timezone —
  no email, id or display name. An identity tool must match on `username` (`scc_user_profile.username`), and should
  refuse an ambiguous display name rather than guess.
- **Never let the model count rows.** Given a 114-row list it hand-counted 58 "PoCs with a blocker" (engine: 65) even
  after a counting rule. Give the generic query tool `group_by` (+ `sum_field`) returning `groups[{value,count,sum}]`
  and `groups_total`, default the row `limit` to 0 when grouping, and say in the tool description "quote groups_total,
  never count rows by hand". Exact on the first try afterwards.
- **A detail tool loses to a query tool unless its description says why it is required.** With both available the
  agent answered "why is X amber" from the query row and skipped the milestones and notes. The fix that worked was in
  the *tool descriptions* ("the ONLY read that returns milestones and notes — MUST be called for any one-PoC answer";
  the query "does NOT return them"), mirrored in the instructions.
- **Cost shape on Opus:** ~35 K tokens cache-written per new conversation (platform prompt + instructions + tool
  schemas) → $0.23–0.54 a turn; a refusal costs $0.013.
- `tags` are accepted and kept on `e_topic_ai_agent` and `e_action_ai_agent` at create; resend them on every update.
- Reference build: agent `e_6ab6046002f36a2e66f90b68` "PoC Copilot" (3 tasks, 6 tools, 2 approval-gated), generic
  query workflow `scc_poc_query` `6ab6036167f3a60322f059e8`, profile lookup `scc_poc_whoami` `6ab60362e2d40e5ba92f2ef9`.

## Build order

1. Build each workflow → save → **check violations** → deploy.
2. **Smoke-test each one** with `run_workflow` and assert on the `n_out` payload.
3. Create the agent (`name` + `instructions`).
4. Create a Task per journey (`description` = trigger condition, `instructions[]` = steps).
5. Create a Tool per workflow, with `enabled: true` and the right `topicId`.
6. `publish_agent`.

## Bulk building

- Log in **once**; reuse the cookie jar for the whole batch.
- Fetch the node catalog and `/api/connection` **once** and cache — connections number in
  the thousands and the call is slow enough to time out.
- Resolve every `resourceVersion` up front into a lookup map (`ua_builder.version()`
  caches per node).
- Keep a manifest of created ids so a batch can be re-run or cleaned up idempotently.
- Workflow names are **not unique** — always track ids; search with `ICONTAINS` on
  `lcName`.

## Verified working examples in the UAT tenant

Built by the skill author. Read these back with `GET /api/workflow-definition/{id}` when you
need a known-good shape (UAT only — the ids do not exist on other tenants). **Do not modify them.**

| What | Id |
|---|---|
| Agent "Fleet Operations Assistant" (2 tasks, 4 tools, published v1) | `e_6aae3af83c95b76375e9046c` |
| Workflow — Oracle SQL | `6aae3aaa0900af6ee3a552b8` |
| Workflow — REST GET | `6aae3aab0900af6ee3a552c0` |
| Workflow — Oracle + IF_ELSE branch + Groovy | `6aae3ac87c956105717afc17` |
| Workflow — REST POST + Groovy + error path | `6aae3ac90900af6ee3a556e8` |
| Workflow — LOOP + BREAK + condition + variables | `6aae332a15ef207b2433c273` |

`scripts/ua_builder.py` reproduces the fleet agent exactly — it is the template.

## Open questions (do not assume these work)

1. **Invoking a deployed CALLABLE workflow** from outside; `initiate-test` is the test runner.
2. ~~Talking to an agent over API~~ — ✅ solved 2026-09-21, see `references/agents.md`.
3. **Connectors with dynamic schemas** (Salesforce objects, picklists) — the pattern should
   hold, but extra schema lookups may be needed. Expect one discovery round.
4. **Creating connections** via API (`POST /api/connection` untested).
5. Knowledge/RAG, Skills, Guardrails, multi-agent Teams, channel Deployments.

### 🚫 Delete endpoints — FORBIDDEN. Listed only so you recognise and refuse them
These exist on the platform and were verified once (2026-09-21) by the skill author. **Users of this
skill never call them**; the `no_delete_guard.py` hook blocks them. Soft-delete or leave the object.
- Workflow: `POST /api/workflow-definition/delete/{id}` — a soft delete with **no undelete endpoint**.
- Entities: `POST /api/entity/{entityType}/delete/{id}`.
- Code-app session branches: `DELETE /agent-api/sessions/{s}/branches/{name}` — removes the branch on
  **GitHub too**. Never. Leave branches in place and name them in the final message.

### Oracle APIs: decode the FND message stack ✅ *verified 2026-09-21*
`x_msg_data` from AP/TCA public APIs is ENCODED (`SQLAP<chr0>MESSAGE_NAME`) when one message is stacked,
so `RAISE_APPLICATION_ERROR(…, l_msg)` surfaces only "SQLAP". Loop
`FND_MSG_PUB.GET(p_msg_index => i, p_encoded => 'F')` for i in 1..x_msg_count and strip CHR(0) — the
duplicate-supplier rejection then reads "Supplier name already exists. Re-enter."
Vision position key flexfield: code segment max 6 chars (ORA-20001 FLEX-VALUE TOO LONG).
