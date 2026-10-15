# UnifyApps — Create Automations via API

Reverse-engineered from the `orbit.uat.unifyapps.com` sandbox on 2026-09-19.
Everything marked **VERIFIED** was executed successfully against the live tenant.

---

## 1. Key architectural finding

The **prompt-to-automation copilot has no private API.** It runs server-side: the browser
only sends `call_automation` to start it and receives progress over SSE. It then writes
through the *same* `workflow-definition` endpoints the manual builder uses.

So to build automations from your own agent, ignore the copilot entirely and call the
workflow-definition API directly.

---

## 2. Authentication — **SOLVED**

### Programmatic login (**VERIFIED**)

The credentials login is scriptable. It lives under `/auth/`, **not** `/api/` — which is
why every `/api/login`-style probe returned 404.

```http
POST /auth/workflow/execute/node?name=emailAndPassLoginRequest
Content-Type: application/json

{
  "id": "emailAndPassLoginRequest",
  "context": { "appName": "auth_by_unifyapps", "resourceName": "auth_by_unifyapps_login" },
  "inputs": {
    "returnTo": "/",
    "failureReturnTo": "https://orbit.uat.unifyapps.com/login",
    "formData": { "username": "<user>", "password": "<pass>", "rememberMe": true },
    "identityProviderId": "65d2f4cf672d16da08efc3d0"
  },
  "options": { "cacheConfig": {} }
}
```

- `identityProviderId` identifies the **local credentials IdP** for this tenant. It will
  differ per tenant/environment — read it off the login page's request, or ask an admin.
- Bad credentials → `401 {"message":"Invalid username or password"}` (verified with a
  deliberately nonexistent account).
- Valid credentials → session cookie via `Set-Cookie`. The session cookie is **httpOnly**,
  so your HTTP client must keep a cookie jar; page JavaScript cannot read it.
- Optional headers observed: `x-ua-timestamp`, `x-ua-timezone`, `x-ua-trace-id`.

**Recipe for an external agent:** POST the above with a cookie jar, then send every
`/api/...` call from section 3 with that jar. No OAuth needed.

**Caveats**

- A `/mfa-verification` route exists. If MFA is enforced on the account, expect an extra
  step. Use a dedicated service account without MFA.
- Create that service account in Settings → Users → Create New User: the form has a
  **Password** field plus `User Session Type` and `First Login` attributes. Set a password
  so it is a local (non-SSO) account — Google SAML rejects accounts outside the SSO app
  with `app_not_configured_for_user`.
- `firstLogin` on a fresh user may force a password change on first login; clear it before
  automating.

---

## 2b. Background — what was ruled out

All calls documented here were made from an authenticated browser session
(session cookie on `orbit.uat.unifyapps.com`). That works, but is not viable for an
unattended agent.

**There is no username/password API login.** All of these return 404:
`/api/auth/login`, `/api/login`, `/api/user/login`, `/api/authenticate`,
`/api/auth/token`, `/api/session`, `/api/oauth/token`, `/api/v1/auth/login`.

Interactive login is SSO-driven: Google SAML (`accounts.google.com/o/saml2/idp`),
several Okta variants, or a credentials form. None of it is a documented machine API.

**But an OAuth surface does exist.** Scanning the login bundle turns up:

| Path | Implication |
|---|---|
| `/ui/auth/oauth/authorize` | UnifyApps acts as an OAuth authorization server |
| `/complete/oauth/` | OAuth callback |
| `/oauth-consent` | Consent screen — so third-party clients are a supported concept |
| `/runtime-auth/new/` | Runtime auth issuance |

This is the thread to pull for programmatic access. See section 10 for exactly what to
ask your admin for.

---

## 3. Endpoint inventory

### Workflow CRUD

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/workflow-definition` | POST | **Create.** Requires non-null `nodes`. |
| `/api/workflow-definition/{id}` | GET | Read a definition |
| `/api/workflow-definition/saveAndReturnViolations` | POST | **Save/update** + validation |
| `/api/workflow-definition/validate` | POST | Validate without saving |
| `/api/workflow-definition/update/` | POST | Partial update |
| `/api/workflow-definition/clone/` | POST | Clone |
| `/api/workflow-definition/delete/` | POST | 🚫 Delete — **forbidden, never call** (soft delete, no undelete; see `connect-and-call.md` §0) |
| `/api/workflow-definition/deployed-workflow/` | GET | Fetch deployed version |
| `/api/workflow-definition/reachableFromNodeIds` | POST | Graph reachability (builder helper) |
| `/api/workflow-definition/node-dependency/` | GET | Node dependency graph |
| `/api/workflow-definition/global-settings` | GET | Tenant workflow settings |
| `/api/entity/action/saveAndDeploy` | POST | **Deploy / publish** (generic entity action) |

### Node catalog and schema discovery

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/workflow-builder/nodes` | GET | Full app/node catalog (**1210** entries in this tenant) |
| `/api/workflow-builder/node/{nodeName}` | GET | One node's details |
| `/api/workflow-builder/node/{nodeName}/resources` | GET | That node's actions (name + version) |
| `/api/workflow-builder/node/{nodeName}/resource/{resourceName}` | GET | **Action's input/output JSON Schema** |
| `/api/workflow-builder/search-nodes-and-resources` | POST | Combined search |
| `/api/workflow-builder/find-nodes-with-connections` | GET | Only nodes with configured connections |
| `/api/workflow-builder/lookup/input-schema` | POST | Input schema lookup |
| `/api/workflow-builder/lookup/output-schema` | POST | Output schema lookup |
| `/api/workflow-builder/node/automap` | POST | Auto-map fields between steps |
| `/api/workflow-builder/node/suggestions` | POST | Next-node suggestions |
| `/api/workflow-builder/env-variables` | GET | Environment variables |
| `/api/workflow-builder/webhook-trigger-url` | GET | Webhook URL for a webhook trigger |

### Connections

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/connection` | GET | **List all connections** (7775 in this tenant) |
| `/api/connection/{connectionId}` | GET | One connection |
| `/api/workflow-builder/find-nodes-with-connections` | GET | Nodes that have at least one connection configured (299 here) |
| `/api/workflow-builder/lookup/runtime-connections-schema/` | POST | Runtime connection schema |

> No server-side filter on `/api/connection` was found — `?appName=`, `?app=`,
> `?active=` are all ignored and return the full list, which is slow enough to time out
> a 45s call. Fetch once and filter/cache client-side.

### Execution

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/workflow-definition/{id}/deploy?version={n}` | POST | **Deploy** a version |
| `/api/test-workflow/initiate-test/{id}` | POST | **Run** a workflow with input payload |
| `/api/aggregation?entityType=WORKFLOW_EXECUTION&group=TEST_WORKFLOW_EXECUTION` | POST | Run status / history |
| `/api/workflow-runs/node-executions` | POST | Per-node timings and status |
| `/api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE` | POST | **Node input/output payloads** — ⚠️ returns `inaccessibleObjects` (nothing) for runs of workflows created over the API on UAT (API-SPEC, "Reading a run's node outputs is still blocked"); verify through the workflow's data source instead |
| `/api/workflow-definition/executedWorkflowDefinition` | POST | Definition used for a given run |
| `/api/workflow/execute/node` | POST | Execute a single node / internal automation |
| `/api/workflow/execute/node/sse` | POST | Streaming execution (the copilot uses this) |
| `/api/workflow/cancel/execution/` | POST | Cancel a run |
| `/api/workflow/re-trigger-execution` | POST | Re-run |

### Listing and searching workflows

```http
POST /api/aggregation?entityType=WorkflowDefinition&group=STANDARD

{ "entityType": "WorkflowDefinition", "group": "STANDARD", "includeTotalHits": true,
  "filter": { "op": "AND", "values": [
      { "op": "EQUAL", "field": "d", "values": [false] },
      { "op": "ICONTAINS", "field": "lcName", "values": ["user role matrix"] } ] },
  "sorts": [{ "field": "cTm", "order": "DESC" }],
  "projections": [{"name":"id"},{"name":"name"},{"name":"trigger"},{"name":"deployed"},{"name":"appsUsed"},{"name":"tags"},{"name":"cTm"}],
  "page": { "limit": 30, "offset": 0 } }
```

Returns `{ objects: [{ columns: {...} }], totalHits }`. Field abbreviations:
`cTm` created, `mTm` modified, `oUId` owner user id, `lMBy` last modified by,
`d` deleted, `pId` project id, `lcName` lowercased name.
Operators seen: `AND`, `OR`, `EQUAL`, `IN`, `ICONTAINS`, `MISSING`, `GT`, `LT`.

---

## 4. Object model

### WorkflowDefinition

```json
{
  "id": "6aae21e07c95610571778cb5",
  "name": "API Test 2",
  "lcName": "api test 2",
  "description": "...",
  "version": 1,
  "standard": false,
  "deleted": false,
  "appsUsed": [],
  "schemaReferences": [],
  "ownerUserId": 12345,
  "settings": {
    "enableNodeLevelLogging": true,
    "enableRunLogging": true,
    "enableVariableLogging": true,
    "route": { "default": false, "tierName": "global" }
  },
  "nodes": [],
  "edges": []
}
```

`version` increments on every save. `lcName`, `createdTime`, `modifiedTime`,
`ownerUserId` and `appsUsed` are server-assigned.

### Node

Two fields do the real work:

- **`context`** — *which* app/action: `{appName, resourceName, resourceVersion}`
- **`inputs`** — *configuration* for that action, shaped by the action's JSON Schema

```json
{
  "id": "n_code",
  "type": "ACTION",
  "title": "Execute Javascript",
  "subTitle": "Code",
  "context": {
    "appName": "code_by_unifyapps",
    "resourceName": "code_by_unifyapps_javascript",
    "resourceVersion": 2594
  },
  "inputs": { "code": "return { ok: true };", "isAsync": false },
  "groupId": "g1",
  "index": 2,
  "fallbackMode": "STOP",
  "skip": false,
  "debug": false,
  "dirty": false
}
```

Node `type` values seen: `START`, `ACTION`, `IF_ELSE`, `LOOP`, `BRANCH_CONDITION`, `DELAY`.

### START node and triggers

`trigger.type` values: `EVENT` (app trigger), `SCHEDULED`, `CALLABLE`, `WEBHOOK`.

Schedule trigger (**VERIFIED**):

```json
{
  "id": "n_trigger",
  "type": "START",
  "title": "New recurring event",
  "subTitle": "Schedule",
  "trigger": { "type": "SCHEDULED" },
  "context": { "appName": "schedule", "resourceName": "schedule_default", "resourceVersion": 202 },
  "inputs": { "cron": "INTERVAL", "interval": 15, "frequency": "MINUTES", "sequential": false },
  "groupId": "g1",
  "index": 1,
  "fallbackMode": "STOP",
  "skip": false
}
```

`inputs.cron` must be `"INTERVAL"`: **only `INTERVAL` saves on UAT** (API-SPEC, 2026-09-23; `'CRON'` and
`'CUSTOM'` are rejected). Use `{cron:'INTERVAL', interval: 15, frequency:'MINUTES', sequential: true}`. `frequency`:
`MINUTES` | `HOURS` | `DAYS` (others unconfirmed). For "every weekday at 07:00", run on an interval and let the first
node skip the runs outside the window.

### Edge

```json
{
  "fromNodeId": "n_trigger",
  "toNodeId": "n_code",
  "type": "next",
  "id": "next@n_trigger@n_code",
  "priority": 0,
  "skip": false
}
```

The `id` convention is `"{type}@{fromNodeId}@{toNodeId}"`. `priority` and `skip` default
server-side.

---

## 5. Useful no-auth internal nodes

These need no connector or credential, so they are ideal for testing:

| displayName | name | type |
|---|---|---|
| Code | `code_by_unifyapps` | ACTION |
| Variable | `variable_by_unifyapps` | ACTION |
| Condition | `if_else` | IF_ELSE |
| Branch Condition | `branch_condition` | BRANCH_CONDITION |
| Loop | `loop` | LOOP |
| Delay | `delay` | DELAY |
| Custom HTTP Endpoint | `custom_http_endpoint` | ACTION |

Code node actions (`/api/workflow-builder/node/code_by_unifyapps/resources`):

| Action | resourceName | version |
|---|---|---|
| Execute Javascript | `code_by_unifyapps_javascript` | 2594 |
| Execute Python script | `code_by_unifyapps_python` | 2594 |
| Execute Groovy code | `code_by_unifyapps_groovy` | 2593 |
| Execute Java code | `code_by_unifyapps_java` | 2591 |
| Execute custom code snippets | `code_by_unifyapps_execute_code_snippets` | 2593 |
| Execute method from classpath | `code_by_unifyapps_third_party_library` | 2594 |
| Execute playwright script | `code_by_unifyapps_playwright` | 2588 |
| Execute Python function | `code_by_unifyapps_execute_python_function` | 2525 |
| Execute CSharp script | `code_by_unifyapps_csharp` | 2477 |
| Execute Code (Sandbox) | `code_by_unifyapps_bubblewrap` | 1009 |

> `resourceVersion` is required in `context` and these numbers move. Read them from
> `/resources` at runtime rather than hardcoding them.

### Reading an action's input schema

`GET /api/workflow-builder/node/{node}/resource/{resource}` returns:

```json
{
  "name": "code_by_unifyapps_javascript",
  "version": 2594,
  "resourceType": "ACTION",
  "input":  { "type": "SCHEMA_AND_LAYOUT", "dynamic": false, "schema": {}, "layout": {} },
  "output": { "type": "SCHEMA_AND_LAYOUT", "dynamic": false, "schema": {}, "layout": {} }
}
```

`input.schema` is what your agent should generate `node.inputs` against.
`input.layout` is UI-only (`ui:widget`, `ui:title`, …) and can be ignored.

---

## 5a. 🔴 Native nodes first — a Code node is the last resort *(rule, Maher 2026-09-25)*

The platform ships ~90 first-party nodes (`unifyapps-connectors/catalogue/platform-nodes.tsv`) for
reading, filtering, joining, sorting, parsing, branching and looping. **Use them.** A Code node
(`code_by_unifyapps_*`) is allowed only for a genuine computation no native node can express, and
it must say why in its title.

**Why this is a rule, not a preference.** Audit of our own workflows on Orbit UAT, 2026-09-25
(357 workflows across ten builds, API-SPEC §56): hand-built apps ran 15–20 % Code nodes, but
a multi-agent storefront-optimization build (case file `unifyapps-solution-playbook/references/builds/mars-pedigree.md`) was **46 % Code — 416 of 909 nodes, 15,700 lines of Groovy, 99 nodes over
60 lines** — and Studio-generated workflows (`scc_*`) **48 %**. What those nodes did:
hand-built joins ("Lookups", 92), assembling the return object ("Envelope", 78), branching logic
("Act", 78), loop bookkeeping ("This item" / "Next item", 22), flattening fetched rows (68),
coercing a record before a write (70). Every one of those has a native node. Code-heavy graphs:

- read as a black box on the canvas — a customer's admin cannot see or change the logic;
- fail where the canvas cannot help (Groovy compiles only at deploy; closure-name clashes,
  GString leaks, blacklisted substrings — §5 of the Studio reference lists a dozen);
- are **wrong at scale without saying so**: `uc_aggregate` sums in Groovy over one 5,000-row
  page and returns a note admitting the total may be short. A native read has no such ceiling in
  the code path you wrote.

### What to use instead — verified on UAT 2026-09-25 (probe `mnp_native_node_probe`, `6ab663aa83d15b63326027b0`)

| If you are about to write Code to… | Use | Status |
|---|---|---|
| filter records | `storage_by_unifyapps_fetch_records` `triggerInputCondition` on `properties.<field>`, `properties_<field>` or `id` — both spellings honoured | ✅ an unmatched value → 0 rows with either form; `id` → 1 |
| count records | `storage_by_unifyapps_count_records` `{object_type, triggerInputCondition}` → `outputs.count` | ✅ 167 = fetch total; filter honoured |
| group / sum / avg / join / rank a list | `utility_by_unifyapps_run_sql_query_on_list` — `dataSources:["{{ n_f.outputs.objects }}"]`, and the **same pill is the table name**: `SELECT properties.scheme AS scheme, COUNT(*) AS n, SUM(CAST(properties.claimed_amount AS DOUBLE)) AS total FROM {{ n_f.outputs.objects }} WHERE … GROUP BY properties.scheme ORDER BY total DESC`. Nested fields by dot path; `JOIN` across two pills works. Output `outputs.result` (array) | ✅ GROUP BY, SUM, AVG, ROUND, CAST, WHERE, ORDER, LIMIT, 2-list JOIN; 1.0 s for 2×167 rows |
| sort a list | `utility_by_unifyapps_sort_list` `{listSource, sortBy:[{field, order}]}` → `outputs.sortedList` | ✅ |
| parse a JSON string (LLM reply, HTTP body) | `utility_by_unifyapps_to_json_object` `{jsonString}` → `outputs.result` | ✅ |
| assemble the response ("envelope") | the STOP node's `result` **is** a template map: `{count:"{{ n_c.outputs.count }}", rows:"{{ n_sql.outputs.result }}"}` | ✅ |
| branch | `IF_ELSE` (`if_else_condition`) with `if`/`next` edges | ✅ builder §7 |
| iterate | `LOOP` `loop_for_each` with a plain-template `listSource` and a loopback edge | ✅ spec §34 |
| counters, flags, small arithmetic | `variable_by_unifyapps_create_variables` / `update_variables` with `=SUM(…)`, `=LEN(…)` formulas | ✅ §7 below |
| call another workflow | `CALL_WORKFLOW` (`callables_call_automation`) — never inline its logic | ✅ spec §38 |
| update every record matching a condition | `storage_by_unifyapps_update_records` `{numberOfRecordsToUpdate:"MULTIPLE", triggerInputCondition, updateFields:[{fieldName, actionType:"SET", setValue}]}` | used in a property performance-intelligence build's workflow builder (`UPDATE_WHERE`; case file `unifyapps-solution-playbook/references/builds/msheireb.md`) |
| rule tables (score bands, routing, thresholds) | `decision_table_by_unifyapps_execute_table` `{entityId, input_loader}` | 👁 schema read, not yet run |
| render text from a template | `template_by_unifyapps_compile_template`, `utility_by_unifyapps_template_resolver` | 👁 schema read, not yet run |
| date maths | `utility_by_unifyapps_date_diff` (`outputUnit` days/hours/…), `epoch_to_date`, `date_to_epoch` | 👁 schema read, not yet run |
| distinct values, ids, sequences | `storage_by_unifyapps_fetch_distinct_values`, `utility_by_unifyapps_generate_uuid`, `sequence_generator` | 👁 schema read, not yet run |

Every node's full contract: `GET /api/workflow-builder/node/{app}/resource/{resource}`. Many input
fields carry a **`ua:llm_description`** in `input.layout` — the platform's own instructions for
filling that field; read it before guessing a shape.

### More contracts, from building Studio engine 1.7.0 (spec §57)

- **SQL-on-list fails on an empty list** — guard it, or flatten inside the code step that consumes the rows.
- An object embedded in a longer template string renders as a Java map (`{a=1}`), not JSON: use
  `utility_by_unifyapps_to_json_string` for text a model reads. Templates have no `[*]` wildcard.
- Variable formulas are Excel with each template as a cell: `=IF({{ n.outputs.total }}>0,TRUE,FALSE)`,
  `=ROUND((NOW()-DATE(1970,1,1))*86400000,0)` for epoch ms.
- Never update through `bulk_upsert_records_by_id` with an id that may be blank: it inserts. Use
  `storage_by_unifyapps_update_records` with an `id` EQUAL condition.

### Two traps found while verifying — do not use these until the shape is found

- ⛔ **`storage_by_unifyapps_aggregate_records` does not aggregate** (UAT, three shapes tried).
  Bare names → rows with empty `columns`; `properties.x` → the same; `properties_x` → **one row per
  record** with the raw value under every alias (`SUM` = `COUNT` = `AVG` = the record's own
  amount). Nothing errors, and a screen built on it shows plausible wrong numbers. Same wall as
  spec §48.4. Group with **fetch → run SQL on list** instead.
- ⛔ **`utility_by_unifyapps_filter_list` returned 0 of 20 matching rows** with both the
  documented pill form (`{{ n_f.outputs.objects[0].properties.country }}`) and `properties.country`.
  Filter in the fetch's `triggerInputCondition`, or in the SQL `WHERE`.

### When Code IS the right answer — and how to keep it honest

Legitimate: a real formula or scoring model, a multi-field parse with fallbacks, a scenario that
rewrites many records from one computation, a hash/crypto step, an outbound call no connector
covers. Then:

1. **One job per Code node**, titled with that job and why native cannot do it
   (`"Score claim — weighted model (no native node)"`). Reads, writes, joins, branches and the
   response stay native around it.
2. **Keep it short.** Over ~40 lines is a design smell: split off whatever a table above covers.
   Over 60 lines needs a stated reason in the build report.
3. **Never** a Code node that only flattens rows, renames fields, builds a filter from inputs that
   could be templated, assembles the STOP payload, or returns `[ok: true]` to join two branches.
4. Count them. The pre-production audit (builder `SKILL.md` "Pre-production audit") reports
   Code nodes per workflow; a workflow where Code ≥ native nodes is sent back for review.

---

## 5b. Connector nodes (Oracle DB, SQL, and friends) — **VERIFIED**

Connector nodes work exactly like internal nodes, with **one extra field**:
`connectionId`, which goes **inside `context`** — not at node top level, not in `inputs`.

```json
{
  "id": "n_sql",
  "type": "ACTION",
  "title": "Execute a SQL statement",
  "subTitle": "Oracle DB",
  "context": {
    "appName": "oracledb",
    "resourceName": "oracledb_execute_sql",
    "resourceVersion": 16522,
    "connectionId": "<your oracle connection id>"
  },
  "inputs": { "sql": "SELECT 1 FROM DUAL" },
  "groupId": "g1",
  "index": 2,
  "fallbackMode": "STOP",
  "skip": false
}
```

Saved with HTTP 200, zero violations, and the server auto-populated
`appsUsed: ["oracledb"]` on the workflow — you do not set that yourself.

### Finding a connection

Use a connection **you own or were told to use** — prefer the fast server-side search in
`connect-and-call.md` §4 (`POST /api/aggregation?entityType=Connection&group=STANDARD`). The full
list below is slow and returns `userInput` secrets in clear; redact before showing anything.

```http
GET /api/connection
```

Returns `{ objects: [...], hasMore: false }`. Connection shape:

```json
{
  "id": "<connection id>",
  "appName": "oracledb",
  "name": "OracleDB Server",
  "active": true,
  "projectId": "...",
  "options": {},
  "userInput": {},
  "version": 0
}
```

Match `appName` to the node name and prefer `active: true`.

### Database node names

`oracledb` (Oracle DB), `oracle`, `postgres`, `mysql`, `sqlserver`, `snowflake`,
`custom_db`, `microsoft_azure_database`, `redshift`, `mongo`.

Non-DB Oracle connectors also exist: `oracle_fusion`, `oracle_fusion_cloud`,
`oracle_ebusiness_suite`, `oracle_jde`, `oracle_epm`, `oracle_siebel`, `oracle_aq`,
`oracle_nosql`, `oracle_health`.

### `oracledb` actions (23 total)

| Action | resourceName | version |
|---|---|---|
| Execute a SQL statement | `oracledb_execute_sql` | 16522 |
| Select rows using custom SQL | `oracledb_select_rows_using_custom_sql` | 16454 |
| Run long query using custom SQL | `oracledb_run_long_query_using_custom_sql` | 16444 |
| Select rows | `oracledb_select_rows_in_batch` | 16455 |
| Insert row | `oracledb_insert_record` | 16517 |
| Insert rows | `oracledb_insert_rows` | 16459 |
| Insert rows via file | `oracledb_insert_rows_using_file` | 16421 |
| Update rows | `oracledb_update_rows` | 16453 |
| Update batch of rows | `oracledb_update_rows_batch` | 16454 |
| Upsert row | `oracledb_upsert_row` | 16456 |
| Upsert rows | `oracledb_upsert_rows_batch` | 16451 |
| Delete rows | `oracledb_delete_rows_in_batch` | 16457 |
| Execute stored procedure | `oracledb_execute_stored_procedure` | 16444 |
| Export query result | `oracledb_export_query_result` | 16444 |
| List tables | `oracledb_list_tables_from_schema` | 16457 |
| List all schemas | `oracledb_list_schemas` | 16515 |
| Create snapshot of table | `oracledb_create_snapshot` | 16521 |
| Scheduled query | `oracledb_on_scheduled_query_search` | 16419 |

Trigger-style actions on the same connector: `oracledb_on_event`,
`oracledb_on_new_event`, `oracledb_on_update_event`, `oracledb_on_delete_event`,
`oracledb_on_new_or_update_event` — these pair with a `START` node whose
`trigger.type` is `EVENT`.

### `oracledb_execute_sql` input schema

| Property | Type | Required |
|---|---|---|
| `sql` | string | **yes** |
| `params` | object | no |
| `performAsync` | boolean | no |
| `response_schema` | object | no |
| `record_loader` | object | no |
| `objectSourceResourceName` | string | no |

Read it live from
`GET /api/workflow-builder/node/oracledb/resource/oracledb_execute_sql` → `input.schema`.

---

## 6. Verified end-to-end recipe

### Step 1 — Create (**VERIFIED**, HTTP 200)

`nodes` must be non-null, or the service 500s with
`Cannot invoke "java.util.List.iterator()" ... getNodes() is null`.

```http
POST /api/workflow-definition
Content-Type: application/json
```

```json
{
  "name": "My Automation",
  "description": "created via API",
  "nodes": [
    {
      "id": "n_start",
      "type": "START",
      "title": "Select a trigger event",
      "trigger": { "type": "EVENT" },
      "index": 0,
      "groupId": "n_start-1",
      "fallbackMode": "STOP",
      "skip": false,
      "debug": false,
      "dirty": false
    }
  ],
  "edges": []
}
```

Returns the created object including the server-assigned `id`.

### Step 2 — Save the real graph (**VERIFIED**, HTTP 200, version 0 → 1)

```http
POST /api/workflow-definition/saveAndReturnViolations
Content-Type: application/json
```

```json
{
  "id": "<id from step 1>",
  "name": "My Automation",
  "description": "built end-to-end via API only",
  "version": 0,
  "standard": false,
  "schemaReferences": [],
  "settings": {
    "enableNodeLevelLogging": true,
    "enableRunLogging": true,
    "enableVariableLogging": true,
    "route": { "default": false, "tierName": "global" }
  },
  "nodes": [],
  "edges": [
    { "fromNodeId": "n_trigger", "toNodeId": "n_code", "type": "next", "id": "next@n_trigger@n_code" }
  ]
}
```

Response: `{ "workflowDefinition": { ... } }`. Violations, when present, come back
alongside it — an empty or absent violations list means the graph is valid.

Send the **current** `version`; the server returns the incremented one.

### Step 3 — Deploy (**VERIFIED**, HTTP 200)

```http
POST /api/workflow-definition/{id}/deploy?version={currentVersion}
Content-Type: application/json

{ "deploymentNotes": "API-built callable workflow", "_type": "WORKFLOW_DEPLOY_OPTIONS" }
```

Response contains `deployedWorkflowVersion: 1`, `deployedWorkflowNotes`, and a **new
deployed-snapshot id** distinct from the draft id. The draft keeps its own `version`;
the deployed copy has its own counter.

> The generic `/api/entity/action/saveAndDeploy` seen in the bundle is **not** what the
> workflow builder uses. Use the endpoint above.

---

## 7. Confirmed working example

Workflow `6aae21e07c95610571778cb5` in the UAT sandbox was created and populated using
only the two calls above — schedule trigger every 15 minutes → JavaScript code step —
with no UI interaction at all.

---

## 7b. Input parameters, mapping, and JSON response — **VERIFIED END TO END**

### Templating syntax

```
{{ n_<nodeId>.outputs.<path> }}
```

Note the spaces inside the braces — that is how the platform writes them. Reference any
upstream node by its `id`. Nested paths work: `{{ n_in.outputs.values.Partner }}`.

### Input parameters — CALLABLE trigger

The workflow's input schema is a **JSON Schema in the START node's `inputs.setup`**:

```json
{
  "id": "n_in",
  "type": "START",
  "title": "Trigger via automation",
  "trigger": { "type": "CALLABLE" },
  "context": { "appName": "callables", "resourceName": "callables_from_automation", "resourceVersion": 3108 },
  "inputs": {
    "setup": {
      "type": "object",
      "additionalProperties": false,
      "required": ["customerId"],
      "properties": {
        "customerId": { "type": "string",  "title": "customerId" },
        "maxRows":    { "type": "integer", "title": "maxRows" }
      }
    }
  }
}
```

The UI generates its run-dialog form straight from this schema, and the values become
`{{ n_in.outputs.customerId }}` etc.

### JSON response — STOP node

A workflow returns JSON via a node of type **`STOP`**:

```json
{
  "id": "n_out",
  "type": "STOP",
  "title": "Respond to automation",
  "context": { "appName": "callables", "resourceName": "callables_return_to_automation", "resourceVersion": 3110, "type": "APPLICATION" },
  "inputs": {
    "result": {
      "customerId": "{{ n_in.outputs.customerId }}",
      "oracle": { "rows": "{{ n_sql.outputs.rows }}", "rowsCount": "{{ n_sql.outputs.rowsCount }}" },
      "http":   { "status": "{{ n_http.outputs.status }}", "body": "{{ n_http.outputs.result }}" }
    }
  }
}
```

`inputs.result` can be a scalar or an arbitrarily nested object — it is returned verbatim
with templates resolved.

### Node output field names

| Action | Output fields |
|---|---|
| `oracledb_execute_sql` | `rows` (array), `rowsAffected` (int), `rowsCount` (int) |
| `custom_http_endpoint_execute` | `result` (object), `status` (int) |
| `callables_from_automation` | dynamic — mirrors `inputs.setup` |

Read any action's outputs from
`GET /api/workflow-builder/node/{node}/resource/{res}` → `output.schema`.

### HTTP node

`custom_http_endpoint` needs **no connection** (`needsAuthentication: false`).

```json
{
  "context": { "appName": "custom_http_endpoint", "resourceName": "custom_http_endpoint_execute", "resourceVersion": 2380, "type": "APPLICATION" },
  "inputs": { "baseUrl": "https://api.example.com", "path": "/v1/users/1", "httpMethod": "GET", "requestTimeoutInSecs": 30, "sslVerify": true }
}
```

Variants: `_execute` (REST), `_execute_graphql`, `_execute_soap`, `_execute_multipart`,
`_execute_streaming`. Other useful `inputs`: `headersList`, `queryParamsList`,
`pathParamsList`, `bodySchema`, `authType`, `responseSchema`, `enableProxy`.

### `fallbackMode`

`STOP` (default — abort the run on error) or `CONTINUE` (carry on). Use `CONTINUE` on
nodes whose failure should not kill the workflow.

---

## 7c. Executing a workflow and reading results — **VERIFIED**

### Run it

```http
POST /api/test-workflow/initiate-test/{workflowId}
Content-Type: application/json

{
  "payload": { "customerId": "CUST-12345", "maxRows": 10 },
  "type": "MOCK",
  "workflowDefinition": { ...the full definition... }
}
```

Returns `{ "runId": "6aae266715ef207b242e9026" }`. Note it takes the **whole definition
inline**, so you can test an unsaved graph.

### Poll run status

```http
POST /api/aggregation?entityType=WORKFLOW_EXECUTION&group=TEST_WORKFLOW_EXECUTION

{ "entityType": "WORKFLOW_EXECUTION", "group": "TEST_WORKFLOW_EXECUTION",
  "projections": [{"name":"STATUS"},{"name":"EXECUTION_TIME"},{"name":"START_NODE_OUTPUT"},{"name":"FAILED_NODES"},{"name":"ID"}],
  "filter": { "op": "IN", "field": "ID", "values": ["<runId>"] },
  "page": { "limit": 30, "offset": 0 } }
```

`STATUS` goes to `COMPLETED`. `START_NODE_OUTPUT` echoes the inputs.

### Per-node timings

```http
POST /api/workflow-runs/node-executions
```
Grouped by `CURRENT_NODE_ID` with `STATUS`, `ENTRY_TIME`, `EXIT_TIME`, `EXECUTION_TIME`.

### Read a node's actual output — this is the result payload

> ⚠️ On UAT this returns `inaccessibleObjects` (nothing) for runs of workflows **created over the API**, and
> `node-executions` above returns zero rows for them (API-SPEC "Reading a run's node outputs is still blocked").
> For those, verify through the workflow's data source, or re-run the definition inline through `initiate-test`
> and read each node from that run.

```http
POST /api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE

{ "type": "ByKeys",
  "lookupType": "TEST_WORKFLOW_VARIABLE",
  "keys": ["<runId>.<runId>.<nodeId>"],
  "options": { "startTime": <runStart-10s>, "endTime": <runEnd+10s>, "workflowId": "<workflowId>" } }
```

Key format is `{rootExecutionId}.{executionInstanceId}.{nodeId}`. Response:

```json
{ "response": { "objects": { "<key>": [
  { "id": "<runId>/<runId>/n_out/outputs", "nodeId": "n_out", "type": "outputs",
    "payload": { ...the node's output... } } ] } } }
```

### Actual verified run

Input `{"customerId":"CUST-12345","maxRows":10}` → `STATUS: COMPLETED` in **395ms**
(n_in 77ms, n_sql 231ms, n_http 85ms, n_out 0ms). Output payload of `n_out`:

```json
{
  "customerId": "CUST-12345",
  "maxRows": 10,
  "oracle": {
    "rows": [{ "CUSTOMER_ID": "CUST-12345", "AS_OF": "2026-09-19 06:06:31" }],
    "rowsCount": 1
  },
  "http": {
    "status": 200,
    "body": { "id": 1, "name": "Leanne Graham", "address": { "city": "Gwenborough" } }
  }
}
```

`CUSTOMER_ID` returning `CUST-12345` proves the input parameter reached live Oracle SQL
through the template — real database round trip, not a mock.

---

## 7d. Control flow — **VERIFIED** (built from scratch and run green)

### Node types

`START`, `ACTION`, `STOP`, `IF_ELSE`, `LOOP`, `BREAK`, `DELAY`, `CALL_WORKFLOW`.

### Edge types

| type | meaning |
|---|---|
| `next` | normal flow. Also carries `name: "no"` (else) and `name: "loopback"` |
| `if` | true branch of an `IF_ELSE`, `name: "yes"` |
| `loop` | entry into a `LOOP` body |
| `error` | failure path off a node (requires `fallbackMode: "MANUAL"`) |

Edge id convention stays `{type}@{fromNodeId}@{toNodeId}`.

### groupId — how nesting is expressed

This is the structural key. Branch and loop bodies live in a **child group**:

```
childGroupId = "{ownerNodeId}@{parentGroupId}@{suffix}"
```

Suffixes: `y` (if-true), `n` (if-else body), `l` (loop body), `error` (error handler).

> 🔴 **Loop bodies MUST be in the loop's child group** (`<loopId>@<parentGroup>@l`). Save and deploy accept a
> body left in the parent group, and then the run never ends: the loopback re-enters the loop at its first
> item for ever and replays every call in the body (API-SPEC §45.10 — 2,163 replays of one child workflow
> in 35 min). After building any loop, check `new Set(nodes.map(n => n.groupId))` contains the child group,
> and test once through `initiate-test` (a flat loop is `CANCELLED` at 20 s there; a nested one completes).
Nesting concatenates, e.g. `n_DFNaB@n_si1de@_hQ3re-1@l@y` = the true-branch of `n_DFNaB`,
which sits in the loop body of `n_si1de`, which sits in root group `_hQ3re-1`.

### IF_ELSE

```json
{
  "id": "n_chk", "type": "IF_ELSE", "title": "Condition", "subTitle": "Condition",
  "context": { "appName": "if_else", "resourceName": "if_else_condition", "resourceVersion": 204, "type": "APPLICATION" },
  "inputs": { "operator": "AND",
              "filters": [ { "property": "{{ n_var.outputs.counter }}",
                             "filter": { "operator": "GTE", "value": "3" } } ] }
}
```

Wiring — **both paths converge on the same downstream node**:

```
if@n_chk@<firstNodeOfTrueBranch>     type "if",   name "yes"
next@n_chk@<rejoinNode>              type "next", name "no"
next@<lastNodeOfTrueBranch>@<rejoinNode>
```

Filter operators seen: `EQUAL`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `ICONTAINS`, `MISSING`.

### LOOP (while)

```json
{
  "id": "n_loop", "type": "LOOP", "title": "While loop", "subTitle": "Loop",
  "context": { "appName": "loop", "resourceName": "loop_while", "resourceVersion": 199, "type": "APPLICATION" },
  "inputs": { "captureIterations": true,
              "condition": { "operator": "AND",
                             "filters": [ { "property": "{{ n_var.outputs.counter }}",
                                            "filter": { "operator": "LT", "value": "{{ n_in.outputs.threshold }}" } } ] } }
}
```

Wiring:

```
loop@n_loop@<firstBodyNode>          type "loop"   -- enter body
next@<lastBodyNode>@n_loop           name "loopback" -- back edge
next@n_loop@<afterLoopNode>          -- exit
```

Runtime emits `outputs: {result, index}` and `state: {iteration}`.

### BREAK

```json
{ "id": "n_brk", "type": "BREAK", "title": "Break", "subTitle": "Break",
  "context": { "appName": "break", "resourceName": "break", "resourceVersion": 199, "type": "APPLICATION" },
  "inputs": { "loop": "n_loop" } }
```

`inputs.loop` names the loop to exit. **A BREAK still needs an outgoing `next` edge** —
point it at the same rejoin node the enclosing `IF_ELSE`'s `no` edge uses, or save fails
validation. The runtime does the actual exit; the edge only satisfies the graph checker.

### Error handling

Set `fallbackMode: "MANUAL"` on the node, then add
`error@<node>@<handlerNode>` (`name: "error"`). The handler lives in group
`{nodeId}@{parentGroup}@error`.

`fallbackMode` values: `STOP` (abort run), `CONTINUE` (ignore failure and carry on),
`MANUAL` (route down the `error` edge). **Only `MANUAL` activates the error edge** — with
`STOP` the run just fails and the handler never executes.

### CALL_WORKFLOW — one workflow calling another

```json
{
  "id": "n_call", "type": "CALL_WORKFLOW", "title": "Call automation",
  "context": { "appName": "callables", "resourceName": "callables_call_automation", "resourceVersion": 3115, "type": "APPLICATION" },
  "inputs": {
    "automationId": "<target workflow id>",
    "version": "-1",
    "synchronous": true,
    "runtimeConnections": {},
    "parameters": { "customerId": "{{ n_in.outputs.customerId }}" }
  }
}
```

`version: "-1"` means latest deployed. `parameters` must match the **target's**
`inputs.setup` schema. This is the building block for composing automations — and for
exposing a workflow as an agent tool.

### Variables

Create (`variable_by_unifyapps_create_variables`) — inputs are a flat map:
```json
{ "counter": "0", "label": "{{ n_in.outputs.name }}" }
```
Read back as `{{ n_var.outputs.counter }}`.

Update (`variable_by_unifyapps_update_variables`):
```json
{ "variables": [ { "source": "{{ n_var.outputs.counter }}", "value": "=SUM({{ n_var.outputs.counter }},1)" } ] }
```

### Formula expressions

A value starting with `=` is a formula, not a literal:
`"=SUM({{ n_var.outputs.counter }},1)"`, `"=LEN({{ n_x.outputs.items }})"`.
Templates interpolate inside formulas.

### Code nodes — the contract

> Before writing one, check §5a: most of what our workflows used Code for (joins, filters, counts,
> flattening, the response envelope, branching, loops) has a native node.

```json
{
  "input":  { "type": "object", "required": ["counter"], "properties": { "counter": { "type": "string", "title": "counter" } } },
  "output": { "type": "object", "required": ["note"],    "properties": { "note":    { "type": "string", "title": "note" } } },
  "code":   "return [\"note\": \"loop finished at \" + counter];",
  "parameters": { "counter": "{{ n_var.outputs.counter }}" },
  "compile_static": false,
  "captureStdOutput": false
}
```

- `input` declares parameter names; `parameters` binds their values via templates; the
  code accesses them as **bare variables** (`counter`).
- `output` declares the result schema; the code returns a map matching it.
- **Outputs nest under `result`**: reference as `{{ n_code.outputs.result.note }}`.

**Gotcha — JavaScript:** `code_by_unifyapps_javascript` rejects a top-level `return` with
*"Script rejected by sandbox validation: Invalid return statement"*. Groovy
(`code_by_unifyapps_groovy`) with `return ["key": value]` works reliably and is what this
tenant uses everywhere. Prefer Groovy until the JS form is pinned down.

**Gotcha — silent template failure:** a template that resolves to nothing causes the key
to be **dropped from the output object entirely**, with no error and no violation. If a
field vanishes from your response, the path is wrong. Verify against the node's real
`outputs` payload rather than assuming.

### Validation response shape

`saveAndReturnViolations` returns violations alongside the definition:

```json
{ "violations": [ { "id": "n_brk", "type": "NODE",
    "innerViolations": [ { "id": "Outgoing", "type": "next",
      "message": "This automation has a trigger which expects response..." } ] } ] }
```

`violations: null` means the graph is valid. Always check it — a save with violations
still returns HTTP 200 and still persists.

---

## 8. Scratch objects created during this investigation

These stay in the tenant on purpose. **Do not delete them** (no-delete rule, `connect-and-call.md`
§0); the tenant owner can remove them from the console if they wish:

| id | name |
|---|---|
| `6aae1f0685759015bd3d6ee2` | Untitled workflow (from the failed copilot run) |
| `6aae21b715ef207b242b3e9c` | API Capture Test 1 |
| `6aae21e07c95610571778cb5` | API Test 2 (pure api) |

---

## 9. Next steps

1. **Auth** — the only real blocker; see section 10
2. **Control flow** — capture `if_else` / `loop` node shapes and their multi-edge wiring
   (edge `type` is presumably not `"next"` for branches)
3. **Production invocation** — `initiate-test` is the *test* runner. Find how a deployed
   CALLABLE workflow is invoked for real (likely `call_automation`, or a webhook URL via
   `/api/workflow-builder/webhook-trigger-url`)
4. **Error handling** — what a failed node's payload looks like; `FAILED_NODES` projection

~~App actions with connections~~ — done, section 5b.
~~Deploy~~ — done, section 6 step 3.
~~Field mapping~~ — done, section 7b.
~~Execution and results~~ — done, section 7c.

---

## 10. Setting up the service account

Auth is solved (section 2) — a username and password is enough. As a sandbox admin you
can do all of this yourself.

### Steps

1. **Settings → Users → Create New User** (`/settings/users/create/details`)
   - Set **Name**, **Username**, **Email**, and a **Password** (makes it a local,
     non-SSO account)
   - Set **State** to active
   - Assign roles and teams (see permissions below)
2. **Log in once manually** as that user to clear any `firstLogin` password-change prompt
3. **Confirm MFA is not enforced** for it
4. **Grab the `identityProviderId`** for your environment from the login request, or reuse
   `65d2f4cf672d16da08efc3d0` for this UAT tenant
5. Script the login from section 2, keep the cookie jar, call the APIs

### 3. Permissions the principal needs

Seen on platform objects as grant configs with `["V","E"]` (view / edit):

- `WorkflowDefinition` — view + edit + **deploy**
- `CONNECTION` — view, to resolve `connectionId` (the Oracle connection specifically)
- Access to the node catalog (`workflow-builder/*`) — read
- Membership of the right **workspace / project** (`pId`), since automations are scoped

### 4. Environment details

- Base URL per environment — UAT is `https://orbit.uat.unifyapps.com`; you need the
  production hostname too
- The **project segment** in paths (`/p/0/...`) and its id
- Whether UAT and prod have separate OAuth clients and separate connection ids
  (they will — `connectionId` values are environment-specific)

### 5. Questions worth asking outright

- Is there a **published/supported REST API** for automations, or is
  `/api/workflow-definition/*` internal and subject to change without notice?
- Is there an official **SDK or Terraform/CLI provider** for workflow-as-code?
- Are there **rate limits** on the automation APIs?
- Is `resourceVersion` pinned per environment? (If UAT and prod differ, resolve it at
  runtime from `/resources` rather than hardcoding.)

## LLM step inside a workflow — `conv_ai_by_unifyapps_call_llm_model_with_options` ✅ 2026-09-21

Built as `maher_ebs_ai_insights` (`6ab106c8cdaead5b7e003482`) and run end to end through an app
data source: **200 in 24.9 s**, Claude Sonnet 4.6 (Vertex) returned structured JSON.

```json
{ "id": "n_llm", "type": "CALL_INTERFACE_WORKFLOW",
  "context": { "appName": "conv_ai_by_unifyapps",
               "resourceName": "conv_ai_by_unifyapps_call_llm_model_with_options", "resourceVersion": 2471 },
  "inputs": { "callableInterfaceId": "__ua__call_ai_agent_llm_model",
    "parameters": { "modelId": "<ai_agent_llm_model id>", "systemPrompt": "...",
      "message": [ { "role": "user", "content": [ { "type": "text", "text": "... {{ n_in.outputs.p_data }}" } ] } ],
      "temperature": 0.2, "maxTokens": 3000, "responseFormat": { "type": "json_object" } } } }
```
- **Node `type` must be `CALL_INTERFACE_WORKFLOW`** (the resource's `nodeType`). As `ACTION` the run
  fails in ~80 ms with *"No config found for resource conv_ai_by_unifyapps_call_llm_model_with_options
  in app conv_ai_by_unifyapps"* / *"Service ConnectionService remote call failure"*. Drop `context.type`.
- Outputs: `llmResponse` (string — parse it), `success`, `tokensUsed`, `inputTokens`, `outputTokens`,
  `finish_reason`, `tools`. The input/output contract is the callable interface
  `__ua__call_ai_agent_llm_model` (`POST /api/lookup?ByKeys=CALLABLE_INTERFACE`).
- It runs as a **child run** of platform workflow `685127a68611a7196adb4415`.
- Models: `POST /api/lookup?ByQuery=ENTITY_ID:ai_agent_llm_model` with filter
  `properties.modelGroup IN ["TEXT_GENERATION"]`. An agent's own model is
  `responseGenerationSettings.answerGenerationModel` on the `ai_agent` entity.
- ⚠️ **`initiate-test` gives up at ~26 s**: `500 "No Response received within specified timeout."`
  and the run (and its child) show `CANCELLED`. A slow LLM step cannot be smoke-tested that way —
  deploy it and execute through a data source (synchronous execute waited 25 s fine).
- Templating (`{{ n_in.outputs.x }}`) works inside `systemPrompt` and inside message `text`.
- **Model choice is the latency lever** ✅ 2026-09-21. Same RFP-qualification prompt (≈9k input
  tokens, 15-requirement JSON out), run through an app data source: default model
  `e_66b07801…` **62 s**, `sonnet_4_6_bedrock_no_thought` **53 s**, Gemini 3.8 Flash [LOW]
  `e_6ab12fadf843281fda62ea44` **7.8 s** (thinner output), Gemini 3.8 Flash [MEDIUM]
  `e_6ab12f80f843281fda62e98d` **13 s** with equal quality. Use the Flash [MEDIUM] model for
  interactive app calls; a synchronous data-source call held 62 s fine, but users won't wait.
- ⚠️ **Thinking models spend `maxTokens` on reasoning.** Gemini 3.8 Flash [MEDIUM] with `maxTokens: 3000`
  returned `finish_reason: MAX_TOKENS`, `outputTokens: 2996` but only 1,416 characters of (truncated)
  JSON → the parse node failed. Give thinking models 3–4× the visible output you expect
  (12,000–16,000 for a 2–4k-token JSON answer) and check `n_llm.outputs.finish_reason`.
  HubSpot insights: 43 s → 11.6 s after the model switch + `maxTokens` 12000.
- Test with a data source, not `initiate-test` (cancels at ~26–60 s). Helper:
  `SC-Companion/platform/tools/ua-helper.js` → `UA.execCallable(appId, dsId, automationId, params)`.

## AI evidence and usage log — one row per AI call (ported 2026-09-28)

Every LLM or OCR node writes one row to the use case's evidence log (`<prefix>_evidence`,
`atomic-agent-architecture` core rule 5). The row says what the model read and returned, and it also records
tokens and cost, so the cost of each business unit can be measured instead of estimated.

| Field | Value |
|---|---|
| `workflow_id` / `workflow_name` | this workflow's id and name (constants, known after the create call) |
| `step_name` | the AI node id (`n_llm`, `n_ocr`) |
| `source` | `workflow` (LLM node) · `extraction` (OCR node) · `agent` (a conversation, read from `llmUsageDetails`) |
| `unit_type` / `unit_ref` | the business unit and its key (`invoice` / the invoice number from the parse node; fall back to the input file name, never blank) |
| `record_ref` | the record the reading is about (the upsert key of the reading, core rule 5) |
| `model_id` | the `modelId` the node was given |
| `tokens_in` / `tokens_out` | `inputTokens` / `outputTokens` |
| `cost_in` / `cost_out` / `cost` | LLM node: `inputTokenCost` / `outputTokenCost` / their sum. OCR node: none reported, so compute from a list-price map (see `unifyapps-config-apps/references/documents.md` §3); unset when the model is not in the map, never guessed |
| `success` | the node's `success`, and `finish_reason` is not `MAX_TOKENS` |
| `test_run` | the workflow input `p_test_run` (default false; test passes send true, so measurements can be told apart from real traffic) |
| `created_at` | `System.currentTimeMillis()` (epoch ms) |

Two nodes after every AI node, inside the loop body when the AI node is in a loop:

```json
{ "id": "n_usage_prep", "type": "ACTION",
  "context": { "appName": "code_by_unifyapps", "resourceName": "code_by_unifyapps_groovy", "resourceVersion": "<resolve>", "type": "APPLICATION" },
  "inputs": {
    "input":  { "type": "object", "properties": {
      "tin": {"type":"string"}, "tout": {"type":"string"}, "cin": {"type":"string"}, "cout": {"type":"string"},
      "ok": {"type":"string"}, "fin": {"type":"string"}, "unit": {"type":"string"}, "test": {"type":"string"} } },
    "output": { "type": "object", "properties": { "row": { "type": "object" } } },
    "parameters": { "tin": "{{ n_llm.outputs.inputTokens }}", "tout": "{{ n_llm.outputs.outputTokens }}",
                    "cin": "{{ n_llm.outputs.inputTokenCost }}", "cout": "{{ n_llm.outputs.outputTokenCost }}",
                    "ok": "{{ n_llm.outputs.success }}", "fin": "{{ n_llm.outputs.finish_reason }}",
                    "unit": "{{ n_parse.outputs.result.invoice_no }}", "test": "{{ n_in.outputs.p_test_run }}" },
    "code": "def p = { String pname -> binding.hasVariable(pname) ? binding.getVariable(pname) : null }\ndef num = { raw -> (raw == null || raw.toString().trim() == '') ? null : new BigDecimal(raw.toString()) }\ndef ci = num(p('cin')); def co = num(p('cout'))\ndef row = [workflow_id: '<wf id>', workflow_name: '<wf name>', step_name: 'n_llm', source: 'workflow', unit_type: 'invoice', unit_ref: (p('unit') ?: 'unknown').toString(), model_id: '<modelId>', tokens_in: num(p('tin')), tokens_out: num(p('tout')), cost_in: ci, cost_out: co, cost: (ci != null && co != null) ? ci + co : null, success: String.valueOf(p('ok')) == 'true' && String.valueOf(p('fin')) != 'MAX_TOKENS', test_run: String.valueOf(p('test')) == 'true', created_at: System.currentTimeMillis()]\nreturn [row: row.findAll { fk, fv -> fv != null }]",
    "compile_static": false, "captureStdOutput": false } },

{ "id": "n_usage", "type": "ACTION", "fallbackMode": "MANUAL",
  "context": { "appName": "storage_by_unifyapps", "resourceName": "storage_by_unifyapps_create_record", "resourceVersion": "<resolve>", "type": "APPLICATION" },
  "inputs": { "useRawPayload": true, "writeThroughSessionVariables": false,
              "object_type": "<prefix>_evidence", "rawPayload": "{{ n_usage_prep.outputs.result.row }}" } }
```
- The raw create writes exactly the map it is given and validates it against the object schema
  (API-SPEC §16, §34). The row must hold every required field and nothing else, so read the object's
  schema at build time and drop unknown keys. If the primary key is not auto-generated, add one
  (`<wf>-<step>-<created_at>`).
- `fallbackMode:"MANUAL"` plus an `error` edge to a handler that returns the business result with
  `usage_logged:false`. A log failure must never mask a business write that already committed. The `error`
  edge is verified (`workflows.md` §7d); run the handler path once in the test pass before relying on it.
- Put `usage_logged` and the AI node's `success` in the STOP result, so a test can assert them without a
  node-output read.
- Write the log row **before** the business record when both follow the AI node. A duplicate-key failure on
  the record then never loses the measurement.
- Groovy details that matter here:
  - optional parameters may be unbound (`binding.hasVariable`);
  - return plain Strings and BigDecimals (`.toString()`, no GString);
  - `1.0G`, not `1G`;
  - every closure parameter named uniquely in the script (`pname`, `raw`, `fk/fv`), or the deploy fails.
- The snippet is assembled from verified pieces but has not been run as a whole. On the first build, read one
  log row back and compare it with the AI node's output.

**Cost per business unit** (for the report, and for sizing when the user asks):
- Group the log rows by `unit_ref`, excluding `test_run` rows unless you are measuring a test pass.
- Report tokens and cost per unit as min, median, p90 and max, plus the failure rate and the model used. Use the
  distribution, not only the mean (`unifyapps-apps/references/ai-app-patterns.md` §21).
- A monthly estimate is cost per unit × the volume the user gave (build question B3), labelled "at list price".
- Agent turns carry their own cost in the conversation's `llmUsageDetails` (`references/agents.md`).

## Oracle SQL node gotchas (verified UAT 2026-09-21)

- **Any `:<word>` in the SQL text is treated as a bind — including inside string literals.** `NVL(:p_time,'09:00')`
  failed with `ORA-17003: Invalid column index` because `:00` became a bind. Build such literals without a colon
  (`'09'||CHR(58)||'00'`). Also use every bind name **once** (assign to a PL/SQL local at the top and reuse the local).
- `RAISE_APPLICATION_ERROR(-20100..-20999, 'plain sentence')` inside the PL/SQL surfaces to callers as
  `ORA-201xx: <sentence>` deep inside the "Workflow execution failed" payload — good for business-rule refusals
  (the app's `oracleFault()` digs it out).
- Test PL/SQL first in sqlplus inside a transaction that ROLLBACKs (replace COMMIT with NULL) before deploying.
- Clone a workflow by copying START/ACTION/STOP nodes from an existing definition: `POST /api/workflow-definition`
  (START only) → `saveAndReturnViolations` with all nodes + edges → `/{id}/deploy?version=n`. Then create the agent
  tool (`e_action_ai_agent`, copy a sibling's properties, new `automationId`) and the app data source
  (`e_data_source`, copy a sibling, new `inputs.automationId` + `name`).

---

## Four ways the platform answers 200 and does nothing ✅ a document-fraud build, UAT 2026-09-23

All four were found by *running* the thing and counting rows, never by reading a response. Add
them to the list you check first when an automation "worked" and the data did not move.

### 1. A bulk upsert whose `updates` carry `properties` instead of `updateFields`

`storage_by_unifyapps_bulk_upsert_records_by_id` takes **field-level** edits:

```jsonc
{ "object_type": "uc_claim", "skipIfBlank": false, "unsetIfNull": false,
  "updates": [ { "id": "<record id>",
                 "updateFields": [ { "fieldName": "risk_score", "actionType": "SET", "setValue": 74.6 } ] } ] }
```

Send `{id, properties:{…}}` — the shape `POST /api/entity/update` wants — and the run succeeds,
the STOP node reports the row count your Groovy built, and **nothing is written**. Always read one
record back after the first batch; never trust the count the automation returns.

(The field-level shape is a genuine partial update, so unlike `useRawPayload` on the create node
it does not silently strip the fields you left out.)

### 2. A fetch node read through `outputs.records`

The collection a `storage_by_unifyapps_fetch_records` node emits is **`{{ n_x.outputs.objects }}`**.
`outputs.records` resolves to nothing, the downstream Groovy sees an empty list, and the workflow
happily returns zero of everything.

### 3. A fetch node with no `triggerInputCondition`

Omit it and the node returns nothing at all. To fetch every record, send it empty:
`triggerInputCondition: {}`. `page: {paginateBy:'OFFSET', limit: 2000, offset: 0}` returned
everything at low thousands of rows.

### 4. A data source called without all of its templated inputs

A data source whose stored inputs contain `{{placeholders}}` must be sent **every one of them**,
blank where unused. Leave one out and the placeholder reaches the workflow as literal text and it
filters on the string `{{filter_field}}`:

```js
// uc_query declares 15 parameters. This returns count: 0 on an object holding 8 rows.
runDS(QUERY_DS, { object_type: 'uc_school', limit: 50 })

// This returns 8.
runDS(QUERY_DS, { object_type: 'uc_school', limit: 50,
  filter_field: '', filter_value: '', filter_field2: '', filter_value2: '',
  filter_field3: '', filter_value3: '', sort_field: '', sort_order: '', fields: '',
  name_contains: '', min_field: '', min_value: '', max_value: '' })
```

This is the read-side twin of `500 forbidden datasource : invalid input`. On a write the platform
tells you; on a read it just answers zero.

### And one that does fail loudly, for completeness

A START node created over the API without `trigger: {type: 'CALLABLE'}` makes
`saveAndReturnViolations` 500 with `Node.getTrigger() is null`. Note the preceding
`POST /api/workflow-definition` **succeeded**, so the workflow already exists — fetch it, add the
trigger, and save that rather than re-running your builder and minting a second one.
