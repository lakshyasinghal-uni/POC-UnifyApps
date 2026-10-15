---
name: unifyapps-context-graph
description: Build, populate and query a UnifyApps Enterprise Context Graph (ECG) - node/edge schema, records, record-level edges, OpenCypher retrieval, enricher agents, connector-driven ingestion, and wiring an AI agent that answers from the graph. Use whenever the user wants to create or inspect a context graph, load records or relationships into one, connect HubSpot/Slack/Drive/Gmail sources to one, write an enrichment agent, or build an agent that answers questions about customers and deals.
metadata:
  author: Maher
---

# UnifyApps Enterprise Context Graph

> **Created by Maher.** Contains no credentials. Each user signs in with their own UnifyApps
> account — read `references/connect-and-call.md` first (tenant, sign-in, finding connections,
> API conventions). Never ask for a password.

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

Create, populate and query a **context graph** over the platform REST API. Everything here
was verified live on `tool.prod-aps1` across three full graph builds (2026-09-19/20),
ending in a working customer-context graph with 15 node types, 211 records, ~300 edges and
an agent that answers real questions correctly.

## 🔴 Loading at scale on aps1 — what actually works ✅ 2026-09-24/25 (a student-lifecycle graph build, 37 types, 199k records, 358k edges)

- **Records: bulk-create INTO the node type.** A callable workflow `START(object_type, rows_json) → Groovy
  JsonSlurper → storage_by_unifyapps_bulk_create_records (object_type = the unifiedEntityId, useRawPayload,
  rawPayload = the array, skipUpdate:false) → STOP`, run **synchronously through an app data source**
  (`POST /api/workflow/execute/node?name=<ds>&requestId=<dsId>`, header `x-ua-app`): 1,000 records in
  ~1.4 s, `insertedIds[]` in the STOP result. Not `POST /api/entity` one record at a time.
- **Projection lags by minutes.** Count with `MATCH (n) RETURN labels(n)[0], count(*)` after a pause and
  compare to the plan; reload any short slice (bulk create upserts by primary key). Do not write edges to
  a type that has not finished projecting — `MERGE` after a failed `MATCH` writes nothing, silently.
- **Relationships: `mdm_by_unifyapps_execute_opencypher_update` with `UNWIND … MERGE`, matched on the
  node's `id`.** `UNWIND [{f:'<org>::<ue>::<pk>',t:'…'}] AS r MATCH (a:\`<ue>\`) WHERE a.id = r.f
  MATCH (b:\`<ue>\`) WHERE b.id = r.t MERGE (a)-[:LABEL]->(b)` — 500 per call, 100 edges in 364 ms.
  Matching on the `_pr_` primary-key property instead is a label scan (8.6 s per 100). The org prefix is
  the first segment of any node's `id`. The action returns only `{success:true}`; count afterwards.
- **The `loop_for_each` + `add_edge_to_graph` writer did not work on aps1 this time:** initiate-test
  answered 500 `No Response received within specified timeout` every time, and a synchronous run is
  cancelled by the platform at 20 s. API-SPEC §42.4.
- 🔴 **The engine is shared by every graph of the tenant** ✅ 2026-09-27 (API-SPEC §60.1). A statement
  without node labels (`MATCH ()-[r]->() RETURN type(r), count(*)`) returned the relationship types of
  OTHER graphs; a node scan by label is scoped to the model. Name a node type in every pattern, count
  with one labelled `MATCH` per type joined by `UNION ALL`, and refuse a model-written statement that
  holds an unlabelled node or a write keyword. Let the model write friendly names (`(f:Finding)`,
  `f.verdict`) and translate them to the engine's (`` `<ue>` ``, `_pr_<property>`) before the query runs.
- The first segment of a node `id` can be read from the graph itself (`MATCH (n:<label>) RETURN n.id`,
  node `limit` 1): the relationship writer needs no configured prefix. A statement's own `LIMIT` did not
  cap the rows; the node's `limit` input does.
- 🔴 **Every property of a node type carries `graphQueryable: true, standard: false`** ✅ 2026-09-27 (API-SPEC
  §60.12). Without it the records load, the vertices appear with their key only, and every filter on another
  property matches nothing — silently. To repair: update the node type with its own properties only (never
  send back the platform's `_ua_*` properties), publish, write the records again.
- The graph's auto-created MDM connection is now named **`<graph> Ontology Connection`**.
- The full builder is that build's graph tool (ontology spec → graph, node and edge types, bulk
  load, Cypher edge writer, counts) — case file `unifyapps-solution-playbook/references/builds/shu.md`.

## What is in this skill

| Path | Contents |
|---|---|
| `references/connect-and-call.md` | **Sign in with your own account, find connections, API conventions** |
| `references/ecg-api.md` | Graph / node / edge / record endpoints, id formats, MDM metadata, UI routes |
| `references/sources-and-sync.md` | **Verified source payloads**, MDM + storage connector patterns, HubSpot and Slack specifics, reading run output |
| `references/ingestion-and-agents.md` | The discovery → enrichment → map pipeline, and the retrieval-prompt pattern worth copying |
| `scripts/ecg_builder.py` | Spec-driven builder that encodes the correct build order - **start here** |

## The living API spec - master reference

`API-SPEC.md`, at the root of the POC Studio plugin (`${CLAUDE_PLUGIN_ROOT}/API-SPEC.md`), is the **master record of every UnifyApps endpoint
discovered** - 126 paths, of which this skill's Context Graph surface is §12. Every entry
carries an evidence level (✅ verified · 👁 observed · 📦 bundle-only · ⚠️ partial ·
⛔ does not work), a tenant and a date.

It is **additive, not required**: this skill's own references are enough to build and query
a graph. If you received this skill without the repo, carry on without it.

**Read it when:**
- a graph build needs something from **outside** this skill - workflow creation, deploy and
  run (§4-6), agent/tool entities (§8-9), connection lookup (§7). This skill uses those
  constantly (edge-writing and Cypher automations, the retrieval agent) but only summarises them;
- an endpoint looks plausible but is untested - check **§15 Confirmed dead ends** first;
- you hit an error you don't recognise - **§17 Error catalogue**;
- a behaviour differs between tenants - **§18 Discrepancies**. Two involve this skill directly:
  **D1** (reading node outputs: `TEST_WORKFLOW_VARIABLE` works on UAT, so the debug-node pattern
  below may be unnecessary) and **D3** (run-status filter field);
- you need a connector action's full input/output contract - **§16 Node action contracts**.

**Where this skill and the spec disagree, the spec wins** - it is the master and is updated first.

**Write to it** whenever you verify or disprove anything about the API, in the same session:
use the entry template in its §1, give the entry a status mark plus tenant and date, put
contradictions in §18 instead of overwriting, add a §21 changelog line, bump the version -
then update this skill if its guidance changed. **Never paste passwords, cookies, tokens or
`connection.userInput` contents into it.**

## 🔴 Build the graph on a tenant that actually has Neo4j ✅ 2026-09-23

**`orbit.uat` has the ECG API but no graph engine behind it.** Creating a graph, publishing it,
creating node and edge types and writing records all return 200 — and the graph header reports
the right node and edge counts — but every projection-backed read fails with
`org.neo4j.driver.exceptions.ServiceUnavailableException: Unable to establish connection in
30000ms` from `EntityRelationshipService`. Nothing tells you the engine is absent; it looks like
an outage, and it does not clear.

**Context graphs go on `tool.prod-aps1`**, where the same build runs end to end (verified
2026-09-23: **17 node types, 49 edge types, 37,864 records, 106,985 relationships**, Cypher
aggregating over the whole set in under a second, with a full application reading nothing else).
Confirm before you start:

```js
// create one throwaway node type, write one record, then read it back
await ua('POST', `/api/context-graph/${graphId}/nodes/${ue}`, {includeTotalHits:true, page:{limit:1, offset:0}})
// 200 with a row = the engine is there. 500 ServiceUnavailable = it is not; change tenant.
```

Action versions differ **completely** between tenants (callables 1686 on aps1 vs 3126 on orbit,
storage 3565 vs 16419, groovy 1285 vs 2611, `loop_for_each` 77 vs 214, `add_edge_to_graph` 869 vs
1698). Resolve them from `GET /api/workflow-builder/node/{app}/resources` per tenant; never copy a
version from another tenant's workflow. On aps1, `POST /api/workflow-definition/update` is **405** —
use `saveAndReturnViolations` then `deploy`.

**An app on another tenant cannot reach the graph.** There is no UnifyApps-to-UnifyApps connector,
no MCP or A2A endpoint, and no API key or service account — agent deployments are only SCHEDULE,
CHANNEL and COPILOT, all in-tenant. A cross-tenant read means a Custom HTTP Endpoint connection
carrying a user session, which the user must create. Put the graph and the things that read it on
one tenant unless you have no choice.

## Read this first - the five rules that cost the most to learn

**1. Publish the graph BEFORE loading any records.**
Records written while a graph is `DRAFT` land in the entity store and are **never projected
into the Cypher layer**. `GET /api/entity/...` finds them; `MATCH (n)` does not. There is no
error. Create graph → create nodes → create edge types → **publish** → then load.

**2. Make every property `STRING`.**
Typed properties (`DATE`, `DOUBLE`, `INTEGER`, `BOOLEAN`) store correctly in the entity
store but the node then projects **zero vertices** into the graph. Proven by isolation: a
string-only Deal projected, an otherwise identical typed Deal did not. Use STRING and
convert in Cypher: `toFloat(d.` + "`_pr_amount`" + `) > 100000`,
`toInteger(d.` + "`_pr_days_in_stage`" + `) > 45`. Store dates as `YYYY-MM-DD` so string
comparison and ordering behave.

**3. Verify projection after the first insert of each node type.**
```cypher
MATCH (n) RETURN DISTINCT labels(n) AS labels
```
A node type missing from that list has records that will never be queryable. Catch it at
record 1, not record 200.

**4. Records never link themselves.**
A matching `customer_id` property creates no relationship. Edges are written with
`mdm_by_unifyapps_add_edge_to_graph` from inside an automation.

At any scale, write them with a **`loop_for_each` over a JSON array input** rather than one
literal node per edge — 11,588 edges in 59 runs of 200, 74 seconds, zero failures. Two traps:
`listSource` must be a **plain template string** (the `mappedArray` shape deploys cleanly and the
loop body silently never runs), and the loop needs a **loopback edge** from the body back to the
loop node. Because the STOP still returns the pre-loop values, a run that wrote nothing reports
success — bind `{{ n_edge.outputs }}` into the STOP result and check the key is present, then
verify an actual edge with a record read or Cypher. Full write-up: API-SPEC §34.

**5. Never judge a deal's state from its stage id.**
In real portals stage ids are recycled: `closedwon` can be an **open** 70% stage called
"Business Win". Always traverse `(Deal)-[AT_STAGE]->(Stage)` and read `label` and
`is_terminal`. See *The stage trap* below.

## Build order (verified end to end)

```
1. POST /api/context-graph                    {name, description}      -> graphId
   (a matching mdm_by_unifyapps UDM connection is auto-created)
2. POST /api/context-graph/{graphId}/publish  DRAFT -> LIVE   <-- BEFORE loading
3. POST /api/context-graph/nodes              one per node type, all STRING properties
4. POST /api/context-graph/edges              {graphId,label,fromNodeId,toNodeId}
5. POST /api/entity                           {entityType:<ue>, properties:{...}} per record
6. Verify: MATCH (n) RETURN DISTINCT labels(n)
7. Workflow: mdm_by_unifyapps_add_edge_to_graph   one node per record edge, then run
8. Workflow: mdm_by_unifyapps_execute_opencypher_query, deploy it
9. POST /api/entity  e_action_ai_agent        tool -> that workflow, enabled:true
10. POST /api/entity/action/saveAndDeploy     publish the agent; verify: deployed snapshot properties == agent properties
```

Steps 7 and 8 need the graph's UDM connection id. Find it with
`POST /api/lookup?ByQuery=CONNECTION` and `{"type":"ByQuery","lookupType":"CONNECTION","query":"<graph name>"}`.

Nodes can be created before or after publish; **records must come after**.

## Two ingestion mechanisms - pick per source

The platform supports both. Neither is a workaround; they fit different jobs.

| | Source pipeline (wizard) | Connector actions + automation |
|---|---|---|
| Configured via | Objects → Discover & Enrich → Map → Publish | Workflow definition API |
| Good for | Continuous broad sync, unstructured content | Scoped, controlled, per-record sync |
| Scoping | Per connector. **Slack: yes** (`channelList`). **HubSpot: no** - only "import all companies/deals/contacts" | Exact records you name |
| Blocker | The **Map** step cannot be written via API - POST/PUT/PATCH all return 405. Wizard only | None |

**Consequence:** if the user wants one account only, HubSpot *must* be automation-driven -
the native source has no record-level filter. Say that explicitly rather than appearing to
take a shortcut.

Also: the HubSpot source exposes only Company, Deal, Contact, Ticket. **Engagements
(emails, calls, meetings, notes, tasks) are not source objects at all** and always need
automations.

## Querying: OpenCypher conventions

Node label = the `unifiedEntityId`. Property names are prefixed `_pr_`.

```cypher
MATCH (c:`<customer_ue>`)
WHERE toLower(coalesce(c.`_pr_name`, '')) CONTAINS 'presidential'
MATCH (c)-[:HAS_DEAL]->(d:`<deal_ue>`)-[:AT_STAGE]->(s:`<stage_ue>`)
RETURN d.`_pr_deal_name` AS deal, s.`_pr_label` AS stage,
       s.`_pr_is_terminal` AS terminal,
       labels(d) AS labels, d.modelId AS modelId
LIMIT 50
```

Two rules to put in every agent prompt:
1. Every `RETURN` must include `labels(v) AS labels` and `v.modelId AS modelId`.
2. Never bind with an inline `{prop: value}` map - match the bare label, then filter with
   `WHERE toLower(coalesce(...)) CONTAINS`.

## The stage trap

Real portals recycle stage ids and mis-set the closed flag. Observed live:

| Pipeline | Stage id | Label | isClosed | Truth |
|---|---|---|---|---|
| `default` | `closedwon` | Business Win | false | **OPEN**, 70% |
| `default` | `closedlost` | Paper Win | false | **OPEN**, 90% |
| `default` | `appointmentscheduled` | Engage | **true** | OPEN, earliest stage |
| VEP | `5901834432` | Submitted for Closure | false | OPEN *(terminal in `default`)* |

Classification must be computed per pipeline at sync time:

```text
openMax  = max(displayOrder) where isClosed == false
TERMINAL = isClosed == true AND displayOrder > openMax
```

The `displayOrder > openMax` clause is what rescues early stages wrongly flagged closed.
Model `Stage` keyed on `pipeline_id::stage_id` - **the same label means different things in
different pipelines**. Also: labels can carry trailing spaces (`"Closed Lost "`), so trim.

## Enricher agents

An enricher is an `ai_agent` with `role: "Enricher"` whose **output schema is the contract**:

```json
"responseGenerationSettings": {
  "outputSchema": {
    "type": "object",
    "properties": {
      "results": { "type": "array", "items": { "type": "object",
        "properties": { "field_a": {"type":"string"}, "field_b": {"type":"string"} } } }
    } } }
```

The platform reads it at
`GET /api/context-graph/sources/enrichers/AGENT/{agentId}/{n}/schema` and flattens
`results[].items.properties` into the mappable field list.

Prompt discipline that matters (copied from the platform's own reference enrichers):
- **Multiple entity output** - one input yields one row per extracted entity.
- **No Cartesian product** - 2 commitments + 1 blocker is 3 rows, not 6.
- **Deterministic ids** - derive from the source record id, never invent.
- **ID reuse** - fetch existing records before assigning ids, or every run creates duplicates.

**Name enricher output fields to match the destination node's property ids.** The reference
SharePoint source maps a 92-field enriched schema with **one** fieldMapping, because
same-named fields ride along. Prefixing every field (`interaction_subject` vs `subject`)
manufactures mapping work that shouldn't exist.

**Don't use an LLM for pure capture.** A Slack message already has `ts`, `text`, `user`.
Enrich where meaning is added - commitments, blockers, use cases, sizing - and map the
structured parts directly.

## Platform gotchas

| Symptom | Cause / fix |
|---|---|
| Cypher returns `objects: []` but records exist | graph was DRAFT when records were written, or properties aren't STRING |
| A node type is missing from `labels(n)` | same - reload that type's records after publishing |
| `500 Please delete data before updating entity schema` | property **type** changes need zero records; metadata flags (e.g. `scdType2Enabled`) can change with data present |
| `500 version is required for node update` | version goes in the **query string**: `/nodes/update/{id}?version={n}` |
| Workflow node fails but run keeps going… it doesn't | `fallbackMode: CONTINUE` does **not** continue - one failed node fails the run |
| `storage_by_unifyapps_create_record` writes nothing | record fields go under **`record`**, not at input top level |
| Run status query returns `{}` | projections are **UPPERCASE** (`STATUS`, `FAILED_NODES`, `RUN_ID`); filter on `fields.id` |
| Log record empty after a big payload | the storage text field silently truncates to empty - page smaller or project fewer fields |
| `forbidden datasource: not found` | connector action called via `/api/workflow/execute/node`; use a real workflow |
| HubSpot search 400s | `CONTAINS` is invalid - use `CONTAINS_TOKEN` |
| `405` on schema-mappings / automap | Map step is wizard-only; don't burn attempts guessing payloads |
| Record titles show raw ids | `recordTitleFormat` must be `{{ mdm.field.<prop> }}` |
| `Validation failed ... sourceConnectionId` | don't hand-create the UDM connection - the graph made one |

## Reading run output

There is no supported "get node outputs" API that worked. The reliable pattern is a
**debug node**: add a scratch node type with `log_id` + `payload`, append a
`storage_by_unifyapps_create_record` step after the action you want to inspect, then read
it with `GET /api/entity/{ue}/{log_id}`. Keep payloads small - the field truncates silently.

## Wiring an agent to the graph

The built-in `search_knowledge_graph` default tool did **not** activate from
`graphModelId` + `defaultTools` alone, even copying a working agent's entire property set.
It is server-gated and on the reference agent it runs as an internal automation. **Build the
tool explicitly** instead:

1. CALLABLE workflow: `START(cypherQuery) -> mdm_by_unifyapps_execute_opencypher_query -> STOP`
2. Deploy it
3. `e_action_ai_agent` with `callables_call_automation`, `inputs.automationId`,
   `topicId: "GLOBAL"`, **`enabled: true`** (defaults to false)
4. Put the label ids, `_pr_` names, edge list and the Cypher rules in the agent instructions
5. `saveAndDeploy`

## Verified example - tool.prod-aps1

Built by the skill author; ids exist only on that tenant. **Read-only for everyone else** - build
your own graph rather than writing to it.

**SC Customer Context (Live)** `6aaf77ef12a16316109f378f` - 15 node types, 32 edge types,
211 records. Agent `e_6aaf734612a16316109f0ba3` answers correctly, including the stage trap
(*"it is open, even though 'Business Win' sounds closed"*), a people-by-message ranking, a
23-document inventory grouped by type, and an honest "none are recorded" for empty node types.

Read-only reference built by the product team: *Enterprise Context Graph*
`6a8583af13a9131516e287ac` plus its retrieval and enrichment agents. Study it; never write to it.

## Still unproven

- Writing schema mappings / publishing a source without the wizard.
- What server-side condition enables the built-in `search_knowledge_graph` tool.
- `associatedEdgeMappings` payload shape - every live source had it empty.
- Whether typed properties ever project (they did not in this build, at any point).

## Building an app whose ONLY source is the graph ✅ a graph-only analytics build 2026-09-23

Case file: `unifyapps-solution-playbook/references/builds/jaidah.md`.

Most ECG builds put the graph behind one or two screens and read Data Objects for the rest. If
the user asks for the graph to be *the* source — and they should — these are the things that
decide whether it actually is.

### Read the node → unifiedEntityId map BACK. Never transcribe it.

```
POST /api/aggregation?entityType=KNOWLEDGE_GRAPH_NODE&group=STANDARD&name=context_graphs_nodes_table
    → every node of the graph with name, id AND unifiedEntityId
GET  /api/entity-type?entityType={ue}   → `name` is the node type's real name
```

A map built by pairing the ids from a creation log with the names in creation order was wrong for
**twelve of sixteen** node types: `Order` pointed at Invoice's entity, `Employee` at Product's.
Every query still returned plausible-looking rows, because a label that exists always matches
something. Nothing failed. Read it back from the tenant, every time.

### The graph does not denormalise foreign keys

Node types built from `<uc>_order` and `<uc>_invoice` carried no `customer_code`. That is correct: the
counterparty is mastered once and reached by relationship. Consequences:

- Any per-customer read is a **traversal**, not a filter:
  `MATCH (i:<invoice>)-[:OWED_BY]->(c:<customer>) WHERE c.\`_pr_customer_code\` = '…'`
- A screen that filters on `customer_code` matches nothing and renders an empty state — not an
  error, not a warning.
- Before porting any screen from objects to the graph, diff every field it reads against
  `GET /api/entity-type?entityType={ue}`. On that build this found two phantom fields and one missing
  one that crashed a screen on `.toFixed()`.
- When a field genuinely belongs on the node (freshness on a GoldTable), add it to the node type
  and backfill — do not let one screen reach past the graph to the object behind it.

### Everything is a string, and the engine returns at most 1,000 rows

- `toFloat()` on every comparison, every `ORDER BY`, every `sum()`. `WHERE balance > 0` on a
  string column matches nothing useful and reports no error.
- `mdm_by_unifyapps_execute_opencypher_query` caps at **1,000 rows** whatever limit you pass. Cap
  your own limit at 1,000 too, or `count >= limit` — your truncation check — silently says "no".
- `ORDER BY` **is** applied before the limit, so "the six newest" works. A trailing `LIMIT n`
  inside the query text is ignored; the action's limit wins.
- Therefore **every total, count and share is `sum()`/`count()` in the query.** A browser-side
  reduce over a truncated read is wrong and looks completely normal.

### Writing to graph records

Node records are addressable as an object (`object_type` = the `unifiedEntityId`) and read
normally. Writing is narrower than it looks:

| Method | Result |
|---|---|
| `POST /api/entity/update` `{entityType, id, properties}` | **200, writes nothing** |
| `POST /api/entity/update` with the whole entity from `GET /api/entity/{ue}/{id}` | ✅ |
| `storage_by_unifyapps_bulk_upsert_records_by_id` | `success:false`, `"Service EntityService remote call failure"` |
| `storage_by_unifyapps_bulk_update_record_by_id` | `{failedCount:0, updated:0}` — **no error, nothing written** |
| `storage_by_unifyapps_update_record_by_id`, `useRawPayload`, **whole** properties map | ✅ |

So a workflow that rewrites many graph records is a `loop_for_each` over a planned list with one
whole-payload `update_record_by_id` in the body. The record's `id` IS its primary key
(`CUS-00678`), not a separate platform id.

And if you need to undo those writes: capture the **before** values of exactly the fields you
change, onto the thing doing the changing. Do not add a `baseline_json` property to every node
type — a baseline is a property of the change, not of the customer.

### Scale

37,864 records and 106,985 relationships loaded in about six minutes: records via
`POST /api/entity` at concurrency 10 (28,848 in ~9 min, zero failures), relationships via the
`add_edge_to_graph` loop at 150 per call and concurrency 5 (106,985 in 152 s, zero failures).
Publish the graph before loading records, and verify edge writes by counting in Cypher before and
after — the loop's STOP cannot see its own body's output, so a batch that wrote nothing still
reports success.

## Showing the real graph inside an app ✅ a student-lifecycle graph build 2026-09-25

Frame the console's own graph view rather than redrawing it: `/p/0/context-graphs/{graphId}` (the model) or
`…?tab=records&recordNodeId={graph node id}&recordId={record key}` (one record's neighbourhood). `frame-ancestors`
allows every `*.unifyapps.com` host and the session cookie is same-site, so it renders on the published app for any
viewer signed in to the console. Crop the console chrome from outside (framed, it has no side nav: model card at
16,62; record row at 0,113), inject CSS only where `contentDocument` is reachable (the preview). Say in the UI that
the graph is served by the console and link "Open it full screen". Details and offsets: API-SPEC §45.17.

## Testing an ECG app before you call it done ✅ the graph-only analytics build 2026-09-24

A finished-looking app passed `tsc`, rendered every screen, logged no console error, and still
had six field defects, one wrong agent answer and ten wrong figures. All of them **rendered**.

**1. Diff every field the UI reads against the node schema, per variable.**
`GET /api/entity-type?entityType={ue}` → `input.schema.properties`. A TS interface is not a
defence — every phantom field was declared on the interface, so the compiler was happy and the
cell was empty. Resolve loop variables (`rows.map((r) => r.field)`) back to their hook before
checking, or the sweep finds nothing.

**2. The counterparty is a traversal, and it must be `OPTIONAL MATCH`.**
A plain `MATCH` to join the customer onto a ledger drops every row whose edge is missing — the
table shrinks, the count beside it does not, and nothing errors.

**3. Give the agent the enum, not an instruction to be careful.**
Every property is a string, so `CONTAINS` always compiles. `ageing_bucket CONTAINS '90'` also
matches `'61-90'`: QAR 78.7M/382 invoices instead of QAR 60.3M/295. Run
`RETURN DISTINCT n.\`_pr_<field>\`` for every categorical property and paste the lists into the
agent prompt with "match with `=`, never CONTAINS". Watch for `expiring`/`expired`,
`service`/`services`, `in_stock`/`in_transit`.

**4. Say how a KPI series reconciles to its transactions.**
On that build `KpiSnapshot.revenue` differed from the sum of its own orders in 93 of 120
division-months — until `status <> 'cancelled'`, which reconciled 119 of 120. Until that rule was
in the prompt the agent quoted QAR 50,417,956 for a division whose every chart said QAR 49,943,900.

**5. Audit stored findings numerically.** Every insight cited a real record code, and ten of
twenty-eight still carried a wrong number: a total contradicting its own components, a count
taken from the examples named rather than the population, a superlative that ranked 4th, an
inference the cited data contradicts. A citation proves the record exists, nothing more.

**6. Take the baseline from the engine, not from an agent.** Comparing a scenario reset against
"171.0 days" — a figure the agent had rounded — reported a failure. The real baseline was
170.952, and the reset was exact.
