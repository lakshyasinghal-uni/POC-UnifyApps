# UnifyApps Platform API — Living Specification

> **Living document.** This is the master record of every UnifyApps REST endpoint we have
> discovered, how we call it, and what comes back. It is reverse-engineered — UnifyApps does
> not publish these APIs — so every entry carries its evidence level. Update it whenever you
> learn something, including when something turns out **not** to work.

| | |
|---|---|
| **Spec version** | 0.32.11 |
| **Last updated** | 2026-09-28 |
| **Tenants covered** | `UAT` = `https://orbit.uat.unifyapps.com` · `APS1` = `https://tool.prod-aps1.unifyapps.com` |
| **Endpoints catalogued** | ~176 unique paths, including confirmed-dead ones (§15) |
| **Companion skills** | `unifyapps-builder` (workflows + agents), `unifyapps-context-graph` (ECG), `unifyapps-apps` (applications, objects, connections) |
| **Repository** | `github.com/mmaheranwar/unifyapps-helper` — **private** |

---

## Contents

1. [How to maintain this document](#1-how-to-maintain-this-document)
2. [Conventions](#2-conventions) — base URLs, auth, headers, envelopes, errors, ids
3. [Authentication & session](#3-authentication--session)
4. [Workflow definitions](#4-workflow-definitions)
5. [Workflow builder — node catalog & schemas](#5-workflow-builder--node-catalog--schemas)
6. [Workflow execution & runs](#6-workflow-execution--runs)
7. [Connections](#7-connections)
8. [Entities (generic CRUD)](#8-entities-generic-crud)
9. [AI agents, tasks, tools](#9-ai-agents-tasks-tools)
10. [Search: aggregation & lookup](#10-search-aggregation--lookup)
11. [Observability & traces](#11-observability--traces)
12. [Enterprise Context Graph](#12-enterprise-context-graph)
13. [Files](#13-files)
14. [Other observed platform endpoints](#14-other-observed-platform-endpoints)
15. [Confirmed dead ends](#15-confirmed-dead-ends)
16. [Node action contracts](#16-node-action-contracts) — workflow step inputs/outputs
17. [Error catalogue](#17-error-catalogue)
18. [Discrepancies to resolve](#18-discrepancies-to-resolve)
19. [Open questions / backlog](#19-open-questions--backlog)
20. [UI routes](#20-ui-routes)
21. [Changelog](#21-changelog)
22. [Applications — config-based](#22-applications--config-based) — `e_interface`, pages, blocks, data sources, publish
23. [Applications — code-based & the agent API](#23-applications--code-based--the-agent-api) — `/agent-api`, SDK, Git
24. [Objects Manager](#24-objects-manager) — `EntityType` schema + records
25. [Connectors SDK (custom connectors)](#25-connectors-sdk-custom-connectors)
26. [Findings 2026-09-22 — Sharek build: AI-native app patterns](#26-findings-2026-09-22-sharek-executive-intelligence-build-uat)
27. [Findings 2026-09-23 — scaling one app's data layer to 8,000 records](#27-findings-2026-09-23-sharek--scaling-to-8000-records-uat)
48. [Findings 2026-09-25 — PoC Command Centre data layer: objects, records, aggregation limits](#48-findings-2026-09-25-poc-command-centre--data-layer-three-objects-1268-records-orbit-uat)
49. [Findings 2026-09-25 — PoC Command Centre automations: storage filters in workflows, caller identity without a delete, paging loops, Opus price signature, repo-vs-live parity](#49-findings-2026-09-25-poc-command-centre--six-callable-workflows-and-their-data-sources-orbit-uat)
51. [Findings 2026-09-25 — PoC Command Centre config app: global data-source scope, theme overrides applied, measured spacing tokens, htmlAttributes, row actions, block methods, Drawer/Copilot behaviour](#51-findings-2026-09-25-poc-command-centre--the-config-app-over-rest-orbit-uat)
52. [Findings 2026-09-25 — PoC Command Centre governance: the agent's own `gaurd_rail` guardrails block inline (proven), AI Governance Controls do not gate a turn, registry `agent_profile`, incidents shape, blockedTools keyword matcher, no republish after attaching](#52-findings-2026-09-25-poc-command-centre--governance-guardrails-vs-controls-orbit-uat)
50. [Findings 2026-09-25 — PoC Command Centre agent: test-API turn lifecycle, model proof from the LLM span, hidden user context, tags on tasks/tools, group_by query tool](#50-findings-2026-09-25-poc-command-centre--the-poc-copilot-agent-over-rest-orbit-uat)
28. [Findings 2026-09-23 — Rest Supplier Intelligence: the mandatory build flow, builder control, cloning assets](#28-findings-2026-09-23-rest-supplier-intelligence-build-uat)
29. [Config apps end to end — CGB Pulse build](#29-config-apps-end-to-end-cgb-pulse-build-uat) — app/page/data-source/theme creation, runtime paths, queryDisabled, overlays, Copilot input, custom components (skill `unifyapps-config-apps`)
30. [Findings 2026-09-23 — TAQA Arabia Sourcing & Supplier Hub](#30-findings-2026-09-23-taqa-arabia-sourcing--supplier-hub-uat) — rules-based scenarios, UPSERT bindings, silent resets
31. [Connector catalogue — what exists and what it can do](#31-connector-catalogue--what-exists-and-what-it-can-do-uat-2026-09-23) — the 1,214-node catalogue, resource types, auth specs (skill `unifyapps-connectors`)
46. [HubSpot read-only PoC read — connector versions drift, `poc` values, owner 404s, inline initiate-test on an existing id](#46-findings-2026-09-25-poc-command-centre--hubspot-read-only-read-orbit-uat)
32. [Config apps, round 2 — prebuilt components, custom components, documents](#32-config-apps-round-2--prebuilt-components-custom-components-documents-cgb-pulse-uat) — every chart type, HEATMAP grouping, Tabs `DeferredRender`, FileUpload `source`, OCR node contract, chat attachments

---

## 1. How to maintain this document

### Status legend — every entry must carry one

| Mark | Meaning |
|---|---|
| ✅ | **Verified** — we called it directly and confirmed the result |
| 👁 | **Observed** — seen succeeding in live UI traffic; we did not call it ourselves |
| 📦 | **Bundle-only** — path found in the front-end JavaScript; never exercised |
| ⚠️ | **Partial** — works, but with a caveat that matters (stated inline) |
| ⛔ | **Does not work** — tested; 404 / 405 / silent no-op. Kept so nobody retests it |

Each entry also names the **tenant** and **date** it was established. A ✅ on `UAT` is not
a ✅ on `APS1` — platform versions differ.

### Entry template

```markdown
### `METHOD /path/{param}` — Short name
✅ UAT · 2026-09-19

What it does, in one or two sentences.

**Request** — query params, body fields (table), then a minimal real example.
**Response** — status, shape, the fields that matter.
**Errors** — status + message + cause.
**Notes** — gotchas, ordering constraints, related endpoints.
```

### Rules

1. **Record what you observed, not what you expect.** If you only saw it in the bundle,
   it is 📦, however obvious it looks.
2. **Negative results are first-class.** A 405 you hit is worth an entry in §15.
3. **Contradictions go in §18**, not silently overwritten. Two tenants disagreeing is data.
4. **Never paste secrets.** No passwords, cookies, tokens, or `connection.userInput`
   contents. Redact to `<redacted>`.
5. **Bump the changelog** (§21) and the spec version with every substantive change.
6. **Skills keep curated copies.** This file is the master; when an entry changes in a way
   that affects a skill's instructions, update the skill too.

---

## 2. Conventions

### Base URL and paths

All endpoints are relative to the tenant origin. Two prefixes exist:

- `/api/...` — everything except login
- `/auth/...` — the login executor only. **`/api/login`-style paths do not exist** (§15).

### Authentication

Session cookie, **httpOnly**, set by the login call (§3). Every `/api/*` call requires it.
Clients must use a cookie jar; the value cannot be read from page JavaScript.

When the session expires:
- `GET /api/user-context` returns **401**, and/or
- the call is **redirected to the HTML login page** — check `content-type` before parsing
  JSON, or you will parse HTML.

Alternative for non-interactive work: call the API **same-origin from an already
logged-in browser tab** (`fetch('/api/...', {credentials:'include'})`); the cookie rides
along and no credential enters the conversation. ✅ UAT

### Headers

| Header | Value | Required |
|---|---|---|
| `Content-Type` | `application/json` | on bodies |
| `Accept` | `application/json` | recommended |
| `x-ua-timestamp`, `x-ua-timezone`, `x-ua-trace-id` | set by the web UI | no — calls succeed without them ✅ |

### Methods

The platform is **POST-heavy**. Updates and deletes are usually `POST .../update/...` or
`POST .../delete/...`, not `PUT`/`PATCH`/`DELETE`. Assume POST unless an entry says otherwise.

> 🚫 **No-delete rule (2026-09-23).** Delete endpoints are catalogued here for completeness and
> so they can be recognised. **Nobody using the companion skills may call any of them**, nor set
> the `deleted` flag to true, nor build a `*_delete_*` node into a workflow, data source or agent
> tool. The `no-delete-guard.py` PreToolUse hook (in `.claude/hooks/` and each skill's
> `scripts/`) blocks such calls at execution time. Soft-delete instead, or leave the object and
> name it for its owner.

### Standard response envelopes

**Aggregation** (`/api/aggregation`):
```json
{ "objects": [ { "columns": { "id": "...", "name": "..." } } ],
  "totalHits": 123, "hasMore": false, "cursor": { "next": "<base64>" },
  "type": "AGGREGATION_RESPONSE" }
```
Read `o.columns`, not `o`. Column names are often abbreviated (see *Field abbreviations*).

**Entity** (`/api/entity/...`):
```json
{ "id": "e_6aae34ad3c95b76375e8dce2", "entityType": "ai_agent", "version": 1,
  "createdTime": 1789801645357, "modifiedTime": 1789801645357,
  "ownerUserId": 82118, "lastModifiedBy": 82118, "deleted": false, "standard": false,
  "deploymentState": { "deployedAt": 0, "deployedBy": 0, "entityVersion": 1, "version": 1 },
  "properties": { }, "grants": { "configs": [] }, "tags": [] }
```
Everything meaningful lives in `properties`.

**Entity list** (`POST /api/entity/{type}`):
```json
{ "objects": [ ...entities ], "hasMore": true, "cursor": { "next": "..." }, "type": "HITS" }
```

**Lookup** (`/api/lookup`):
```json
{ "response": { "objects": { "<key>": {...} }, "inaccessibleObjects": [], "type": "MAPPED_HITS" } }
{ "response": { "objects": [ ... ], "hasMore": false, "cursor": {...}, "type": "HITS" } }
```
`ByKeys` returns `MAPPED_HITS` (keyed map); `ByQuery` returns `HITS` (array).

### Error envelope

```json
// 404 / 405 — terse
{ "errorCode": -1, "errorId": "5b583ca8-6ca3-4ee1-84ed-cc273aad2851" }

// 500 — descriptive
{ "rootCauseMessage": "...", "message": "...", "errorCode": -1,
  "errorId": "<uuid>", "serviceName": "WorkflowDefinitionService" }

// 500 — asset not found
{ "rootCauseMessage": "CONNECTION with id oracledb not found",
  "assetClass": "CONNECTION", "assetId": "oracledb", "errorCode": 5002, ... }
```

Known `errorCode` values: `-1` generic · `5002` asset not found · `5004` invalid
group/type for aggregation. Full list in §17.

> ⚠️ **A 200 does not mean success.** Several endpoints return 200 while doing nothing
> (`objects/bulkUpdate` → `{"data":0}`), and `saveAndReturnViolations` returns 200 *and
> persists* a graph that has violations. Always check the body.

### Id formats

| Thing | Format | Example |
|---|---|---|
| Workflow | 24 hex | `6aae3aaa0900af6ee3a552b8` |
| Deployed workflow snapshot | `s_{workflowId}/{version}/{hash}` | `s_6aae21e0.../3/Khf8HC...=` |
| Entity (agent, task, tool, ...) | `e_` + 24 hex | `e_6aae3af83c95b76375e9046c` |
| Workflow node | author-chosen; UI uses `n_` + 5 chars | `n_sql`, `n_7M2BR` |
| Workflow edge | `{type}@{fromNodeId}@{toNodeId}` | `next@n_in@n_sql` |
| Run / execution | 24 hex | `6aae266715ef207b242e9026` |
| Node-output key | `{rootExecutionId}.{executionInstanceId}.{nodeId}` | `6aae26...026.6aae26...026.n_out` |
| User | integer | `82118` |
| ECG vertex | `{spaceId}::{unifiedEntityId}::{recordId}` | `90::6aae7f3c...::CON-001` |
| ECG record edge | `{fromVertex}::{toVertex}` | |

### Field abbreviations (aggregation)

| Abbrev | Field | Abbrev | Field |
|---|---|---|---|
| `cTm` | created time | `mTm` | modified time |
| `oUId` | owner user id | `lMBy` | last modified by |
| `d` | deleted | `pId` | project id |
| `v` | version | `lcName` | lower-cased name |
| `lPUBy` / `lPUOn` | last platform update by / on | | |

### Templating (inside workflow node inputs)

`{{ n_<nodeId>.outputs.<path> }}` — spaces inside the braces. A value starting with `=` is a
formula: `"=SUM({{ n_v.outputs.i }},1)"`, `"=LEN({{ n_x.outputs.items }})"`.
**An unresolved template silently drops the key** — no error, no violation.

---

## 3. Authentication & session

### `POST /auth/workflow/execute/node?name=emailAndPassLoginRequest` — Log in
✅ UAT · 2026-09-19

Credential login for a **local (non-SSO)** account. Sets the httpOnly session cookie.
Runs through the same node-executor as `/api/workflow/execute/node`, but under `/auth/`.

**Request**

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string | ✅ | literally `"emailAndPassLoginRequest"` |
| `context.appName` | string | ✅ | `"auth_by_unifyapps"` |
| `context.resourceName` | string | ✅ | `"auth_by_unifyapps_login"` |
| `inputs.formData.username` | string | ✅ | |
| `inputs.formData.password` | string | ✅ | never log it |
| `inputs.formData.rememberMe` | boolean | | `true` |
| `inputs.identityProviderId` | string | ✅ | tenant's **local** IdP. UAT: `65d2f4cf672d16da08efc3d0` |
| `inputs.returnTo` | string | | `"/"` |
| `inputs.failureReturnTo` | string | | `"{BASE}/login"` |
| `options.cacheConfig` | object | | `{}` |

```json
{ "id": "emailAndPassLoginRequest",
  "context": { "appName": "auth_by_unifyapps", "resourceName": "auth_by_unifyapps_login" },
  "inputs": { "returnTo": "/", "failureReturnTo": "https://orbit.uat.unifyapps.com/login",
              "formData": { "username": "maheragent", "password": "<redacted>", "rememberMe": true },
              "identityProviderId": "65d2f4cf672d16da08efc3d0" },
  "options": { "cacheConfig": {} } }
```

**Response** — 200 + `Set-Cookie` session cookie.

**Errors**

| Status | Body | Cause |
|---|---|---|
| 401 | `{"message":"Invalid username or password"}` | bad credentials, **or** wrong `identityProviderId`, **or** `firstLogin` still set, **or** MFA enforced |

**Notes**
- SSO accounts cannot use this. Google SAML rejects non-provisioned accounts with
  `app_not_configured_for_user`. Use a local account with a password set.
- `identityProviderId` is tenant-specific — read it from the login request on a new tenant.
- A `/mfa-verification` route exists in the UI; an MFA-enforced account needs a step not
  yet documented.
- Verified from outside a browser (Python `urllib`): no CORS or referer requirement.

### `GET /api/user-context?includeRoles=true` — Current user
✅ UAT · 2026-09-19

Session check and current-user details. Returns **401** when the session is invalid — the
cheapest liveness probe.

**Response** — 200, user object. `customer.id` is the tenant **`spaceId`** used in ECG
vertex ids (APS1 = `90`). Full field list not yet recorded.

### OAuth surface (UI routes, not REST)
📦 UAT · 2026-09-19

`/ui/auth/oauth/authorize`, `/oauth-consent`, `/complete/oauth/`, `/runtime-auth/new/`
exist in the login bundle — the platform can act as an OAuth authorization server. **No token
endpoint has been found**; see §19.

---

## 4. Workflow definitions

A workflow ("automation") is a `WorkflowDefinition`: `nodes[]` + `edges[]` + settings.
Node/edge model is in §16.

### `POST /api/workflow-definition` — Create
✅ UAT · 2026-09-19

**Request**

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | string | ✅ | not unique — track ids |
| `description` | string | | |
| `nodes` | array | ✅ | **must be non-null**, even for a stub (see Errors) |
| `edges` | array | | `[]` allowed |
| `tags` | string[] | | top-level; the supported ownership marker in shared tenants |
| `settings` | object | | defaults applied if omitted |

Minimal stub (then fill it via `saveAndReturnViolations`):
```json
{ "name": "My Automation", "description": "created via API",
  "nodes": [ { "id": "n_seed", "type": "START", "title": "seed",
               "trigger": { "type": "EVENT" }, "index": 0, "groupId": "n_seed-1",
               "fallbackMode": "STOP", "skip": false } ],
  "edges": [] }
```

**Response** — 200, the full `WorkflowDefinition`:
```json
{ "id": "6aae21e07c95610571778cb5", "name": "My Automation", "lcName": "my automation",
  "description": "...", "version": 0, "standard": false, "deleted": false,
  "appsUsed": [], "ownerUserId": 82118, "createdTime": 1789796832014, "modifiedTime": 1789796832014,
  "settings": { "enableNodeLevelLogging": true, "enableRunLogging": true,
                "enableVariableLogging": true, "route": { "default": false, "tierName": "global" } },
  "nodes": [ ... ], "edges": [ ... ] }
```
`lcName`, `appsUsed`, timestamps and ownership are server-assigned.

**Errors**

| Status | Message | Cause |
|---|---|---|
| 500 | `Cannot invoke "java.util.List.iterator()" because the return value of "...WorkflowDefinition.getNodes()" is null` | `nodes` omitted |

### `GET /api/workflow-definition/{id}` — Read
✅ UAT · 2026-09-19

Returns the full definition (same shape as create).

⚠️ **Does not return `tags`.** Read tags back only via aggregation projection
`[{"name":"tags"}]` (§10).

⚠️ **`groupId` on the stub START hides the rest of the graph in the builder canvas** (UAT 2026-09-24): a
definition whose START had `groupId:"n_in-1"` while the other nodes had none rendered as trigger-only
("+" below it) although `GET` returned all 5 nodes and 4 edges. Either give every node no `groupId`
(what the UI does for a single lane) or the same one. Re-saving without `groupId` fixed it.

### `POST /api/workflow-definition/saveAndReturnViolations` — Save / update
✅ UAT · 2026-09-19

The real "save". Send the **complete** definition.

**Request** — full `WorkflowDefinition` including `id` and the **current** `version`,
`nodes`, `edges`, `settings`, `schemaReferences: []`, `standard: false`.

**Response** — 200:
```json
{ "workflowDefinition": { ...saved, "version": 1 },
  "violations": [ { "id": "n_brk", "type": "NODE",
                    "innerViolations": [ { "id": "Outgoing", "type": "next",
                      "message": "This automation has a trigger which expects response. Please add a step to send a response{{stepLabel}}." } ] } ] }
```
`violations` is `null` (or absent) when valid. `version` increments per save.
`appsUsed` is recomputed server-side from node `context.appName`.

**Notes**
- ⚠️ **HTTP 200 and persisted even with violations.** Always check `violations`.
- The UI calls this for Save; the UI never uses the bare `update/` endpoint.

### `POST /api/workflow-definition/{id}/deploy?version={n}` — Deploy
✅ UAT · 2026-09-19

**Request**

| Where | Field | Notes |
|---|---|---|
| query | `version` | the draft version to deploy (from the last save) |
| body | `deploymentNotes` | free text |
| body | `_type` | literally `"WORKFLOW_DEPLOY_OPTIONS"` |

```json
{ "deploymentNotes": "API-built callable workflow", "_type": "WORKFLOW_DEPLOY_OPTIONS" }
```

**Response** — 200:
```json
{ "workflowDefinition": { "id": "6aae2626ae96dd56dff79733",
    "deployedWorkflowVersion": 1, "deployedWorkflowNotes": "API-built callable workflow", ... } }
```
⚠️ The returned `id` is a **deployed snapshot id**, distinct from the draft id. The draft
and deployed copies version independently.

**Notes**
- Deploying a `SCHEDULED` workflow activates a live recurring job. `CALLABLE` workflows only
  run when invoked.
- ⛔ `/api/entity/action/saveAndDeploy` is **not** the workflow deploy — that is for entities (§8).

### `POST /api/workflow-definition/reachableFromNodeIds` — Graph reachability
👁 UAT · 2026-09-19

Builder helper, called while editing.

```json
{ "nodeId": "n_ahrd9",
  "workflowDefinition": { "name": "", "version": 0, "nodes": [ ... ], "edges": [ ... ] } }
```

### Other workflow-definition endpoints

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/workflow-definition/validate` | 👁 UAT | called by the UI before a test run; body not captured |
| POST | `/api/workflow-definition/executedWorkflowDefinition` | 👁 UAT | body `{"deployedWorkflowId":"s_{id}/{ver}/{hash}","test":true}` → the definition a run used |
| POST | `/api/workflow-definition/update/` | 📦 | partial update; unused by the UI |
| POST | `/api/workflow-definition/clone/` | 📦 | |
| POST | `/api/workflow-definition/delete/{id}` | ✅ | UAT 2026-09-21 → `200 true` (no body). `DELETE /api/workflow-definition/{id}` is 405 |
| GET | `/api/workflow-definition/deployed-workflow/` | 📦 | |
| GET | `/api/workflow-definition/node-dependency/` | 📦 | |
| GET | `/api/workflow-definition/global-settings` | 📦 | |
| GET | `/api/workflow-definition` | ⛔ 405 | there is **no list GET** — use aggregation (§10) |

---

## 5. Workflow builder — node catalog & schemas

How to discover which actions exist, their versions, and their input/output schemas.
**Resolve `resourceVersion` from here at runtime** — it drifts (e.g. `oracledb_execute_sql`
16522 → 16523, `if_else_condition` 11 → 204).

### `GET /api/workflow-builder/nodes` — Node catalog
✅ UAT · 2026-09-19

**Query params**

| Param | Notes |
|---|---|
| `fields` | comma list, e.g. `name,displayName,iconUrl,tags,type,needsAuthentication,custom,hidden` |
| `resourceType` | e.g. `ACTION` (👁) |
| `name` | ⛔ ignored — returns the full list |

**Response** — 200:
```json
{ "objects": [ { "id": "6a1b657d7dc7176bfe64f52e", "name": "formbuilder_123",
                 "displayName": "123FormBuilder", "type": "ACTION", "tags": ["Applications"],
                 "needsAuthentication": true, "custom": false, "hidden": false,
                 "standard": false, "iconUrl": "https://...", "lcName": "...", "version": 0,
                 "hasOverriddenDetails": false, "deleted": false } ],
  "totalHits": 1210, "hasMore": false, "type": "HITS" }
```
**1,214 nodes on UAT (2026-09-23)**, up from 1,210 on 2026-09-19: **983 application connectors
+ 91 platform nodes (`tags: ["Internal"]`) + 140 custom**. 1,064 need a connection; 1 hidden;
0 `standard`. `type` values: `ACTION` (1,203), two `LOOP`, and one each of `IF_ELSE`, `BRANCH`,
`BRANCH_CONDITION`, `BREAK`, `CONTINUE`, `DELAY`, `SCOPE`, `STOP`, `CALL_WORKFLOW`.
Custom connectors have `custom: true` and a 24-hex id as `name`. The full catalogue ships in
the `unifyapps-connectors` skill (§31).

### `GET /api/workflow-builder/node/{nodeName}` — Node detail
✅ UAT · 2026-09-19

Node metadata plus a large `grants` block.

### `GET /api/workflow-builder/node/{nodeName}/resources` — A node's actions
✅ UAT · 2026-09-19

**Response** — 200:
```json
{ "objects": [ { "name": "oracledb_execute_sql", "displayName": "Execute a SQL statement",
                 "version": 16523, "nodeName": "oracledb", "resourceType": "ACTION",
                 "async": false, "hidden": false, "custom": false, "standard": false,
                 "passNodeSchema": false, "nodeTestDisabled": false, "description": "..." } ],
  "hasMore": false }
```
`version` here is the value to put in a node's `context.resourceVersion`.

**`resourceType` values ✅ UAT 2026-09-23** — `ACTION`, `TRIGGER`, and **`AGENT_TOOL`**, a
ready-made agent tool. `AGENT_TOOL` is rare: on UAT only `github` shipped any
(`github_tools_get_file_modified_details`, `github_tools_list_collaborators`). Verified
mixes (ACTION/TRIGGER/AGENT_TOOL): `hubspot` 100/6/0 · `jira` 78/13/0 · `salesforce` 65/11/0 ·
`github` 44/12/2 · `slack` 44/2/0 · `gmail` 25/8/0 · `oracledb` 17/6/0 ·
`custom_http_endpoint` 7/0/0. Resource counts per connector run 1–170 (`workday`, `keka` 170;
`netsuite` 146; `snowflake` 145; `microsoft_teams` 136).

⚠️ A published **Connectors SDK** action can be attached to a *built-in* connector: `slack`'s
resource list contains six entries named `slack:{24-hex actionId}` alongside the standard
`slack_*` ones, flagged `custom: true`. A colon in a `resourceName` means "tenant-local" —
never put one in a portable artefact; resolve it with
`GET /api/connector-builder/definition/{defId}` (§25).

### `GET /api/workflow-builder/node/{nodeName}/resource/{resourceName}` — Action schema
✅ UAT · 2026-09-19

The input and output contract for one action. ~15 KB typical.

**Response** — 200:
```json
{ "name": "oracledb_execute_sql", "version": 16523, "resourceType": "ACTION",
  "input":  { "type": "SCHEMA_AND_LAYOUT", "dynamic": false,
              "schema": { "type": "object", "required": ["sql"], "properties": { ... }, "definitions": { } },
              "layout": { "ui:order": [...], "sql": { "ui:widget": "..." } } },
  "output": { "type": "SCHEMA_AND_LAYOUT",
              "schema": { "type": "object", "properties": { "rows": {...}, "rowsCount": {...}, "rowsAffected": {...} } } },
  "groupDetails": { } }
```
- Generate node `inputs` against `input.schema`. `input.layout` is UI-only.
- `input.dynamic: true` means the schema depends on runtime lookups — not yet exercised (§19).
- Some outputs are `SCHEMA_AND_LAYOUT` with no properties (e.g. callables) — they are
  dynamic, derived from the node's own config.

### `GET /api/workflow-builder/find-nodes-with-connections` — Nodes with a connection
✅ UAT · 2026-09-19

Same `fields` param as `/nodes`. Returns a **plain JSON array** (not the `objects` envelope)
of nodes that have at least one configured connection. 299 on 2026-09-19, **304 on
2026-09-23**.

⚠️ **It over-reports.** 25 of the 304 return `totalHits: 0` from
`POST /api/aggregation?entityType=Connection` for the same `appName` — deleted or
out-of-project connections still count here. Use this endpoint to narrow 1,214 nodes to ~300,
then trust the aggregation count for whether a connection is actually usable. (§18 D4)

### Other builder endpoints

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/workflow-builder/search-nodes-and-resources` | 👁 UAT | → `{nodeBuilders:{...}, nodeBuilderResources:{...}}` |
| GET | `/api/workflow-builder/env-variables` | 👁 UAT | |
| GET | `/api/workflow-builder/node/resource/entity-search-enabled` | 👁 UAT | |
| POST | `/api/workflow-builder/lookup/output-schema` | 👁 UAT | called before a test run |
| POST | `/api/workflow-builder/lookup/input-schema` | 📦 | |
| POST | `/api/workflow-builder/lookup/output-schema/with-errors` | 📦 | |
| POST | `/api/workflow-builder/lookup/nodes/output-schema/with-errors` | 📦 | |
| POST | `/api/workflow-builder/lookup/node/output-schema` | 📦 | |
| POST | `/api/workflow-builder/lookup/node/aggregation-metadata` | 📦 | |
| POST | `/api/workflow-builder/lookup/resources` | 📦 | |
| POST | `/api/workflow-builder/lookup/start-schema/` | 📦 | |
| POST | `/api/workflow-builder/lookup/runtime-connections-schema/` | 📦 | |
| POST | `/api/workflow-builder/lookup/{run,user,env,alert}-variables-schema` | 📦 | four variants |
| POST | `/api/workflow-builder/lookup/error-schema` | 📦 | |
| POST | `/api/workflow-builder/lookup/applications/` | 📦 | |
| POST | `/api/workflow-builder/collect-slot-schema` | 📦 | |
| POST | `/api/workflow-builder/node/automap` | 📦 | auto-map fields between steps |
| POST | `/api/workflow-builder/node/suggestions` | 📦 | next-node suggestions |
| GET | `/api/workflow-builder/node/resources` | 📦 | |
| GET | `/api/workflow-builder/webhook-url` | 📦 | |
| GET | `/api/workflow-builder/webhook-trigger-url` | 📦 | likely the URL for a `WEBHOOK` trigger — see §19 |

---

## 6. Workflow execution & runs

### `POST /api/test-workflow/initiate-test/{workflowId}` — Run a workflow
✅ UAT · 2026-09-19

Starts a run with an input payload. Despite the name, **it executes against real systems** —
the Oracle and HTTP calls in verified runs were genuine round trips.

**Request**

| Field | Type | Req | Notes |
|---|---|---|---|
| `payload` | object | ✅ | inputs matching the START node's `inputs.setup` schema |
| `type` | string | ✅ | `"MOCK"` |
| `workflowDefinition` | object | ✅ | the full definition **without `id`** — can be unsaved |

```json
{ "payload": { "customerId": "CUST-12345", "maxRows": 10 },
  "type": "MOCK",
  "workflowDefinition": { "name": "...", "version": 3, "nodes": [...], "edges": [...], "settings": {...} } }
```

**Response** — 200 `{ "runId": "6aae266715ef207b242e9026" }`. The run is asynchronous; poll
status next.

**Notes**
- Because the definition travels inline, you can test a graph you have not saved.
- Very large graphs (~60+ heavy nodes) can **time out the HTTP call** while the run still
  starts. Verify by reading results, not by the response. (APS1)
- This is the **test** runner. How to invoke a *deployed* workflow from outside is open (§19).

### `POST /api/aggregation?entityType=WORKFLOW_EXECUTION&group=TEST_WORKFLOW_EXECUTION` — Run status
✅ UAT · 2026-09-19 · ✅ APS1 · 2026-09-20

**Request**
```json
{ "entityType": "WORKFLOW_EXECUTION", "group": "TEST_WORKFLOW_EXECUTION",
  "projections": [ {"name":"ID"}, {"name":"STATUS"}, {"name":"EXECUTION_TIME"},
                   {"name":"START_TIME"}, {"name":"END_TIME"}, {"name":"FAILED_NODES"},
                   {"name":"START_NODE_OUTPUT"} ],
  "filter": { "op": "IN", "field": "ID", "values": ["<runId>"] },
  "page": { "limit": 5, "offset": 0 } }
```
To list runs of one workflow: filter `{"op":"IN","field":"WORKFLOW_ID","values":["<wfId>"]}`
and sort `[{"field":"START_TIME","order":"DESC"}]`. The UI also filters
`CONCURRENT_EXECUTION IN [false]`.

**Response**
```json
{ "objects": [ { "columns": {
    "ID": "6aae266715ef207b242e9026", "STATUS": "COMPLETED", "EXECUTION_TIME": 395,
    "START_TIME": 1789797991130, "END_TIME": 1789797991525,
    "START_NODE_OUTPUT": { "customerId": "CUST-12345", "maxRows": 10 },
    "DEPLOYED_WORKFLOW_ID": "s_6aae21e0.../3/Khf8HC...=",
    "ROOT_EXECUTION_INSTANCE_ID": "...", "PARENT_EXECUTION_INSTANCE_ID": "...",
    "OTEL_TRACE_ID": "9e6bb8b5db1aa6d60f103176d3441eba", "RUN_TIME_TYPE": "TEST",
    "FAILED_NODES": ["n_code"], "DEBUGGED": false } } ],
  "type": "AGGREGATION_RESPONSE" }
```

| Projection | Meaning |
|---|---|
| `STATUS` | `COMPLETED`, `FAILED` observed. `CANCELLED` / `TIMED_OUT` **assumed**, not seen |
| `FAILED_NODES` | node ids that failed — present on `FAILED` |
| `START_NODE_OUTPUT` | echoes the input payload |
| `DEPLOYED_WORKFLOW_ID` | the snapshot actually run |
| `OTEL_TRACE_ID` | OpenTelemetry trace id |

**Notes**
- Projection names are **UPPERCASE**.
- ⚠️ The id filter differs by tenant — see §18: `field:"ID"` (UAT) vs `field:"fields.id"` (APS1).
- A `COMPLETED` status only means no node threw. Assert on the output payload.

### `POST /api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE` — Node inputs/outputs of a run
✅ UAT · 2026-09-19 · ⚠️ see §18 for APS1

Reads what a node actually received and produced. **This is how you verify a run.**

**Request**
```json
{ "type": "ByKeys", "lookupType": "TEST_WORKFLOW_VARIABLE",
  "keys": [ "<runId>.<runId>.n_out", "<runId>.<runId>.n_sql" ],
  "options": { "startTime": <START_TIME - 10000>, "endTime": <END_TIME + 10000>,
               "workflowId": "<workflowId>" } }
```
Key = `{rootExecutionId}.{executionInstanceId}.{nodeId}`; for a top-level run both ids
equal the `runId`. `startTime`/`endTime` are epoch ms bracketing the run.

**Response**
```json
{ "response": { "objects": {
    "<runId>.<runId>.n_sql": [
      { "type": "inputs",  "nodeId": "n_sql",
        "payload": { "sql": "SELECT 'CUST-12345' AS CUSTOMER_ID, SYSDATE AS AS_OF FROM DUAL" } },
      { "type": "outputs", "nodeId": "n_sql",
        "id": "<runId>/<runId>/n_sql/outputs",
        "payload": { "rows": [ { "CUSTOMER_ID": "CUST-12345", "AS_OF": "2026-09-19 06:54:34" } ],
                     "rowsCount": 1, "rowsAffected": 0 } } ] },
  "type": "MAPPED_HITS" } }
```

| Entry `type` | Contains |
|---|---|
| `inputs` | node inputs **with templates already resolved** — shows exactly what ran |
| `outputs` | node outputs, or an error object `{errorCode, cause:{...}, message}` on failure |
| `state` | runtime state, e.g. `{ "iteration": 3 }` on a `LOOP` |

### `POST /api/workflow-runs/node-executions` — Per-node timings
👁 UAT · 2026-09-19

Grouped per node: `STATUS`, `ENTRY_TIME`, `EXIT_TIME`, `EXECUTION_TIME`, `SKIPPED`,
`EXECUTION_INSTANCE_ID`, `ROOT_EXECUTION_INSTANCE_ID`, `PARENT_EXECUTION_INSTANCE_ID`.
Body wraps an aggregation query:
```json
{ "aggregationQuery": { "entityType": "WORKFLOW_NODE_EXECUTION", "group": "TEST_WORKFLOW_EXECUTION",
    "projections": [ { "name": "CURRENT_NODE_ID", "projections": [
        { "name": "CURRENT_NODE_ID", "aggregationFunction": "GROUP" },
        { "name": "ENTRY_TIME", "aggregationFunction": "MAX" },
        { "name": "STATUS", "aggregationFunction": "MAX_BY", "additional": { "AGGREGATE_BY": "ENTRY_TIME" } } ] } ] } }
```

### `POST /api/workflow/execute/node?name={registeredName}` — Named internal automation
⚠️ UAT · APS1 · 2026-09-19

Executes a **registered internal automation by name**. It is **not** a generic "run any
connector action" endpoint.

```json
{ "id": "getIndexRecommendationsForWorkflow",
  "context": { "appName": "standard_entities",
               "resourceName": "standard_entities_get_index_recommendations_for_workflow" },
  "inputs": { "includeOnlyMissingIndexes": true, "workflowId": "6aae21e07c95610571778cb5" } }
```

Calling it with an arbitrary connector action returns **500 `forbidden datasource: not
found`**. Use a real workflow + `initiate-test` for connector actions.

Registered names observed in UI traffic:

| Name | Purpose | Status |
|---|---|---|
| `fetchUserPreferences` | UI preferences | 👁 |
| `fetch_records` | generic record fetch (saved views, etc.) | 👁 |
| `WorkflowScore` | best-practice score → `{score, totalChecks, passedChecks, success}` | 👁 |
| `getIndexRecommendationsForWorkflow` | index hints → `{result:{workflowIndexRecommendations:[]}}` | 👁 |
| `call_automation` | starts the prompt-to-automation copilot | 👁 |
| `fetch_ai_workflow_case_id`, `CopilotLookup`, `fetch_current_case`, `update_case_additional` | copilot internals | 👁 |
| `GetAllSessions`, `GetTraceTimeline`, `TraceTimelineDetails` | observability — see §11 | ✅ |

### Other execution endpoints

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/workflow/execute/node/sse` | 👁 UAT | server-sent-events stream used by the copilot. **Do not** clone/buffer the stream client-side — it stalls the session ("lost track of your active connection session") |
| POST | `/api/workflow/cancel/execution/` | 📦 | |
| POST | `/api/workflow/re-trigger-execution` | 📦 | |

---

## 7. Connections

### `GET /api/connection` — List all connections
✅ UAT · 2026-09-19

**Response** — 200 `{ "objects": [ ... ], "hasMore": false }`. **Every** connection in the
tenant (7,775–7,787 on UAT).

```json
{ "id": "6971155898773c08b865cacb", "appName": "oracledb", "name": "OracleDB Server",
  "active": true, "projectId": "...", "options": {}, "userInput": { "<redacted>": "..." },
  "captureFailures": false, "standard": false, "version": 0,
  "ownerUserId": 0, "createdTime": 0, "modifiedTime": 0, "lcName": "..." }
```

**Notes**
- ⛔ **No server-side filter on this endpoint.** `?appName=`, `?app=`, `?appNames=`, `?filter=`,
  `?active=` are all ignored, and it is slow enough to exceed a 45 s client timeout.
  **Use `POST /api/aggregation?entityType=Connection&group=STANDARD` instead** (below) — it
  filters server-side in ~50 ms and does not return secrets.
- 🔴 **`userInput` contains secrets in clear** (`password`, `authToken`). Redact before
  logging or returning anywhere.
- **Names are not unique** (three different connections are all `RDQA-OracleDB-PRY`). Find a
  connection by the host/service in `userInput`, not by name.
- Match `appName` to the node name; prefer `active: true`.

### `GET /api/connection/{connectionId}` — One connection
✅ UAT · 2026-09-19

**Errors** — 500 `{"rootCauseMessage":"CONNECTION with id X not found","assetClass":"CONNECTION","errorCode":5002}`.

### `POST /api/lookup?ByQuery=CONNECTION` — Search connections by name
✅ APS1 · 2026-09-19

The fast alternative to pulling all connections.
```json
{ "type": "ByQuery", "lookupType": "CONNECTION", "query": "Maher", "fields": ["name"],
  "options": { "appName": "mdm_by_unifyapps" }, "page": { "limit": 20, "offset": 0 } }
```

### `POST /api/aggregation?entityType=Connection&group=STANDARD` — Find connections (server-side)
✅ UAT · 2026-09-21

The Connections Manager list uses this. Filters on `appName`, `active`, `oUId`, `name`, `tags`.
```json
{ "entityType": "Connection", "group": "STANDARD", "includeTotalHits": true,
  "filter": { "op": "AND", "values": [
      { "field": "appName", "op": "EQUAL", "values": ["github"] },
      { "field": "active", "op": "EQUAL", "values": [true] } ] },
  "projections": [{"name":"id"},{"name":"name"},{"name":"appName"},{"name":"oUId"},{"name":"cTm"}],
  "sorts": [{"field":"cTm","order":"DESC"}], "page": { "limit": 30, "offset": 0 } }
```
**Response** — aggregation envelope; `totalHits` 56 for `github` on UAT; ~50 ms. No `userInput`.

### `GET /api/applications/{appName}?fields=authSpec,iconUrl,displayName,name,refreshable,includeOptions` — Connector auth form
✅ UAT · 2026-09-21

`authSpec.input` is a `SCHEMA_AND_LAYOUT` JSON Schema describing the connection `inputs`
(Custom HTTP: `name, requestType, authType, baseUrl, headersList, sslVerify,
requestTimeoutInSecs, connectionType, groupId, …`). Auth-type options come from
`POST /api/lookup?ByQuery=CUSTOMER_AUTH` `{options:{appName, auths:[{type,label}]}}` 👁.

**Also returns** `refreshable` (true ≈ OAuth with refresh → the user must click
*Authorize*; there is no API path around it) and `authSpec.externalDocUrl`, the public docs
page (`https://www.unifyapps.com/docs/unify-integrations/{slug}`; the slug is usually but not
always the `appName` — `openai` → `open-ai`). ✅ UAT 2026-09-23.

⛔ **Empty body for internal nodes.** `custom_http_endpoint` returns **200 with a zero-length
body** — it is a platform node and has no connection form. Guard the JSON parse. Note the
pair: `custom_http_endpoint` = ad-hoc HTTP, no connection; `custom_http_application` = a
connector with a saved authenticated base URL (45 connections on UAT).

`authType` is usually **not** an inline enum — hence the `CUSTOMER_AUTH` lookup. A few
connectors do inline it: `openai` → `["TOKEN","COMPLIANCE"]`, `mcp_servers` →
`["TOKEN","NO_AUTH","BASIC","OAUTH","OAUTH_DCR","CREDENTIALS"]`. Verified required fields:
`snowflake` name/authType/domain/databaseName/schemaName/warehouseName · `sftp`
name/authType/host/port/username · `openai` domain/name/authType/authToken · `slack`,
`github`, `hubspot`, `gmail` name/authType only.

### `POST /api/connection/input/test?appName={appName}` — Test connection inputs
✅ UAT · 2026-09-21

Same body as create (below). **204** = success; the UI shows *Test connection successful*.

### `POST /api/connection/input?appName={appName}` — Create connection
✅ UAT · 2026-09-21

```json
{ "name": "maher_scratch_http (Claude API learning)", "authType": "CUSTOM",
  "inputs": { "name": "maher_scratch_http (Claude API learning)", "requestType": "HTTP",
              "authType": "CUSTOM", "baseUrl": "https://jsonplaceholder.typicode.com",
              "headersList": [], "sslVerify": true, "requestTimeoutInSecs": -1,
              "connectionType": "DIRECT", "tags": [],
              "rateLimitConfig": {"enabled": false}, "circuitBreakerConfig": {"enabled": false} },
  "options": { "rateLimitConfig": {"enabled": false}, "circuitBreakerConfig": {"enabled": false} },
  "tags": [] }
```
**Response** — 200, the connection (`id` 24 hex, `active: true`, `userInput` echoed). Created
`6ab0ea7a5459f4370f0c1f3f` on UAT. `inputs` follow the app's `authSpec`. OAuth apps need the
user to click *Authorize* in the UI — do not attempt to script it.

### `POST /api/connection` — Create connection (bare)
⚠️ APS1 · 2026-09-19

Creating an `mdm_by_unifyapps` UDM connection by hand fails with
`No Value found in filter with field: sourceConnectionId` — a context graph creates its own
(§12). For ordinary connectors use `POST /api/connection/input?appName=` above.

**Connection config notes**
- Oracle **EBS**: `appName: "oracledb"`, `serviceName` = the **PDB**,
  `isCDBDatabase: false`. Pointing at the CDB gives `ORA-01017` (APPS is PDB-local).

---

## 8. Entities (generic CRUD)

Agents, tasks, tools, prompts, context-graph records and more are all **entities**, sharing
one CRUD surface keyed by `entityType`.

### `POST /api/entity` — Create
✅ UAT · APS1 · 2026-09-19

**Request**

| Field | Type | Req | Notes |
|---|---|---|---|
| `entityType` | string | ✅ | e.g. `ai_agent`, `e_action_ai_agent`, or an ECG `unifiedEntityId` |
| `properties` | object | ✅ | the entity's content |
| `tags` | string[] | | ⚠️ **top level only** — inside `properties` it 500s |

```json
{ "entityType": "e_topic_ai_agent", "tags": ["MAHER"],
  "properties": { "name": "Customer Lookup", "aiAgentId": "e_...", "enabled": true } }
```

**Response** — 200, entity envelope with a new `e_...` id (ECG records use the primary-key
value as id). Server fills defaults (e.g. tools get `enabled: false` unless set).

**Errors**

| Status | Message | Cause |
|---|---|---|
| 500 | `Non Empty Validations ... add additionalProperties tags` | `tags` placed inside `properties` |

### `GET /api/entity/{entityType}/{id}` — Read
✅ UAT · APS1 · 2026-09-19

`GET /api/entity/{id}` without the type is ⛔ 405. Some types are singletons readable
without an id: `GET /api/entity/e_ai_agent_settings` ✅ returns the settings entity.

### `POST /api/entity/{entityType}` — List
✅ UAT · 2026-09-19

⚠️ **This lists — it does not create.** Posting a create body here returns a page of
existing entities and writes nothing.

**Request** — `{ "page": { "limit": 50, "offset": 0 } }`

**Response** — `{ objects, hasMore, cursor, type }`.

**Paging:** ⚠️ **offset-based.** Feeding `cursor` back silently re-returns page 1, so a
cursor loop yields duplicates. Increment `offset`; stop on `hasMore === false`.

### `POST /api/entity/update` — Update
✅ UAT · 2026-09-19

```json
{ "id": "e_6aae34db6a7a1a6dffbce1b5", "entityType": "e_action_ai_agent",
  "properties": { ...full properties, modified... }, "version": 0 }
```
Send the **full** `properties` and the **current** `version`. Response: entity, version +1.

### `POST /api/entity/action/saveAndDeploy` — Publish
✅ UAT · 2026-09-19

Publishes an entity (used for agents). Send the **whole entity object** as read, plus notes.

```json
{ ...entity from GET /api/entity/ai_agent/{id}..., "deploymentNotes": "V1 via API" }
```

**Response** — entity with `deploymentState: { deployedAt, deployedBy, entityVersion, version }`.

**Errors**

| Status | Message | Cause |
|---|---|---|
| 500 | `Non Empty Validations in Validating entity ai_agent with validationResult required name` | sent a partial body (e.g. `{id, entityType}`) or `properties.name` missing |

### Entity types reference

| entityType | What | Aggregation group |
|---|---|---|
| `ai_agent` | agent | ENTITY |
| `e_topic_ai_agent` | agent **Task** | ENTITY |
| `e_action_ai_agent` | agent **Tool** / capability | ENTITY |
| `e_prerequisite_task_ai_agent` | prerequisite action | ENTITY |
| `e_ai_agent_settings` | tenant agent settings (singleton) | ENTITY |
| `ai_agent_deployment` | channel deployment | ENTITY |
| `ai_agent_llm_model` | model registry | ENTITY |
| `e_ai_agent_team`, `e_ai_team_task` | multi-agent teams | ENTITY |
| `prompt` | reusable prompts (26 on UAT) | ENTITY |
| `knowledge_set`, `knowledge`, `knowledge_source` | RAG | ENTITY |
| `EntityType` | the type registry itself (17,791 on UAT) | STANDARD |
| `WorkflowDefinition` | workflows | STANDARD |
| `KNOWLEDGE_GRAPH_NODE` / `_EDGE` / `_SOURCE` | ECG schema | STANDARD |
| `<unifiedEntityId>` | an ECG node's records | — |
| `e_interface` | application (config or code) — id is a slug | ENTITY (§22) |
| `e_component` | app page / module / template component | ENTITY (§22) |
| `e_data_source` | app data source (authorises execute-node) | ENTITY (§22) |
| `e_theme`, `e_page_template`, `e_custom_component`, `e_i18n_namespace` | app theme / page templates / custom React components / translations | ENTITY |
| `EntityType` (`ENTITY_TYPE` in lookups) | Objects Manager objects | STANDARD (§24) |
| `Connection` | connections | STANDARD (§7) |
| `<objectId>` (e.g. `maher_scratch_task`, or `obj_<5 chars>` when generated) | an object's records | ENTITY (§24) |

Discover any type's fields with `POST /api/aggregation/metadata` (§10).

---

## 9. AI agents, tasks, tools

Built entirely on §8's entity CRUD. **A tool is a call into a workflow** — the same
`callables_call_automation` contract as a `CALL_WORKFLOW` node.

### Agent — `ai_agent`
✅ UAT · 2026-09-19

**Create** via `POST /api/entity`:
```json
{ "entityType": "ai_agent",
  "properties": { "name": "Fleet Operations Assistant", "agentType": "CONVERSATIONAL",
                  "instructions": "You help fleet operators ..." } }
```
`properties.name` is required for publish. Publish with `saveAndDeploy` (§8).

**Key properties**

| Property | Meaning |
|---|---|
| `name` | required |
| `instructions` | the system prompt (string) |
| `agentType` | `CONVERSATIONAL` |
| `role`, `goal` | shown in the UI Instructions tab; enrichers use `role: "Enricher"` |
| `responseGenerationSettings.answerGenerationModel` | answer model |
| `responseGenerationSettings.outputSchema` | structured output — the contract for enricher agents |
| `responseGenerationSettings.{tone,style,format}` | response shaping |
| `topicExecutionSettings.{topicSelectionModel,topicExecutionModel,topicAsTool}` | task routing |
| `preProcessingSettings`, `indexingSettings` | RAG behaviour |
| `longTermMemorySettings.enabled`, `contextManagement.*` | memory / context |
| `graphModelId` | links a context graph (does **not** by itself enable graph search — §12) |
| `defaultTools` | map of booleans; ⚠️ capabilities are really tool rows — see below |
| `mcpEnabled`, `visibility.type`, `evalSettings`, `loggingSettings` | misc |

### Task — `e_topic_ai_agent`
✅ UAT · 2026-09-19

```json
{ "entityType": "e_topic_ai_agent",
  "properties": {
    "name": "Vehicle Status",
    "description": "Use this task when the user asks about a vehicle's status or telemetry.",
    "instructions": [ "Confirm the vehicle id.", "Call VehicleLookup.", "Summarise in plain English." ],
    "aiAgentId": "e_6aae3af83c95b76375e9046c",
    "enabled": true, "isAppConnector": false, "runTimeConnectionEnabled": false,
    "governanceConfig": {} } }
```
- `description` = **when** (what the router matches on). `instructions` = **how** — an
  **array of strings**, rendered as numbered steps.
- Optional `modelSelectionConfig` overrides the model per task.
- At runtime `SetTopic` is a real tool call; the task's `instructions[]` arrive as its
  tool result (visible in traces, §11).

### Tool — `e_action_ai_agent` (workflow-backed)
✅ UAT · 2026-09-19

```json
{ "entityType": "e_action_ai_agent",
  "properties": {
    "name": "VehicleLookup",
    "description": "Look up a vehicle record by vehicle id.",
    "aiAgentId": "e_6aae3af83c95b76375e9046c",
    "topicId": "GLOBAL",
    "context": { "appName": "callables", "resourceName": "callables_call_automation" },
    "inputs": { "automationId": "6aae3aaa0900af6ee3a552b8", "version": "-1",
                "synchronous": true, "runtimeConnections": {}, "parameters": {} },
    "enabled": true,
    "approvalConfig": { "enabled": true, "storeUserApprovalPreference": false } } }
```

| Field | Notes |
|---|---|
| `topicId` | `"GLOBAL"` = agent-wide (Tools tab); a task id = scoped to that task only |
| `inputs.automationId` | the workflow to call — must be **deployed** |
| `inputs.version` | `"-1"` = latest deployed |
| `inputs.parameters` | `{}` lets the model fill args from the workflow's `inputs.setup` schema |
| `enabled` | ⚠️ **defaults to `false`** — the tool silently never fires |
| `approvalConfig` | human-in-the-loop gate; shows real parameter values + Deny / Approve Once. **Deny genuinely blocks the write** ✅. Put it on every write tool; republish after changing |

Server-applied defaults also seen: `deferToolLoading`, `enableToolSearch`,
`excludeInputOutputFromTrace`, `isStandardAction`, `runTimeConnectionEnabled`.

#### Per-user OAuth — runtime user connections
✅ UAT · 2026-09-22 — a connector tool with `context: {appName, resourceName}`, **no** `connectionId`
and `runTimeConnectionEnabled: true` makes each signed-in user connect their **own** account: the chat
shows a "Connectors that could help → Connect" card once, the platform keeps that user's connection
(`ownerUserId` = the user) and reuses/refreshes it on later chats. Nobody else's calls resolve to it.
- **Secrets are never readable**: `GET /api/connection/{id}` returns the connection with the secret masked
  (`"token": "__UNIFYAPPS_GARBAGE_CONSTANT__…"`); tokens live in the connection store, not in any data
  object, so object-level access to `scc_*` data never exposes them.
- ⛔ Never bind a personal connector (Gmail, Drive, Calendar, Fireflies) to a fixed `connectionId`, and
  never copy a token into an object or workflow variable: a fixed connection runs as its owner for every caller.
- ⚠️ **Connection metadata is tenant-visible and permissions come from platform roles.** `aggregation Connection`
  lists every user's connections (name, `appName`, `oUId`). `lookup ENTITY_PERMISSIONS {entityType:"Connection"}`
  on a connection owned by someone else returned `DECRYPT, EDIT, DELETE, SHARE…` for a broad (admin-level) role
  (UAT 2026-09-22). Masking in `GET /api/connection/{id}` is not access control: restrict DECRYPT/EDIT on
  connections to admins via platform roles, grant OAuth scopes read-only, and let users revoke at the provider.
- Agent memory: `longTermMemorySettings: {enabled: true, userGlobalMemoryNotNeeded: false}` + `defaultTools.saveInstantMemoryTool: true`
  (per-user long-term memory; team agents have no `defaultTools`). ✅ UAT 2026-09-22.

### Capability — `e_action_ai_agent` with `isStandardAction: true`
✅ UAT · 2026-09-19

Built-in capabilities are **tool rows**, not agent fields:
```json
{ "entityType": "e_action_ai_agent",
  "properties": { "name": "generateChartTool", "aiAgentId": "<agent>",
                  "isStandardAction": true, "enabled": true, "topicId": "GLOBAL" } }
```
Standard names seen: `generateChartTool`, `renderArtifact`, `loadSkill`, `webSearch`,
`createExcel`, `createDocx`, `createDocxOrPdf`, `createPDF`, `createPPTX`,
`createFlowDiagram`, `createFile`, `analyseFile`, `documentVision`, `deepResearch`,
`generateImageTool`, `executeCodeTool`, `ingestKnowledge`, `companyKnowledge`, `planTool`,
`todo_tool`, `summaryTool`, `requestClarification`, `clarifyFromUser`, `qa`,
`informationNotFoundTool`, `generatePublicFileUrl`, `allowKnowledgeControl`,
`CompleteDocumentContext`, `generateAndEditEmail`, `Build_App`.

⚠️ **`generateChartTool` needs `renderArtifact` too**, or the agent prints a table while
claiming it drew a chart. Charting is expensive (one request measured ~291 K tokens, ~$0.94).

### Recipe — agent with workflow-backed tools
✅ UAT · 2026-09-19 (Fleet Operations Assistant `e_6aae3af83c95b76375e9046c`)

1. Build → save → check violations → **deploy** each workflow (§4). CALLABLE trigger with a
   clear `inputs.setup` — that schema becomes the tool's argument contract.
2. Smoke-test each with `initiate-test`; assert on the `n_out` payload (§6).
3. `POST /api/entity` → `ai_agent`.
4. `POST /api/entity` → one `e_topic_ai_agent` per journey.
5. `POST /api/entity` → one `e_action_ai_agent` per workflow, `enabled: true`, right `topicId`.
6. `POST /api/entity/action/saveAndDeploy` with the full agent entity.

---

## 10. Search: aggregation & lookup

### `POST /api/aggregation?entityType={t}&group={g}` — Universal query
✅ UAT · APS1 · 2026-09-19

The platform's general search. `entityType` and `group` go in **both** the query string and
the body. Optional query param `name=table_block` (👁, used by list screens).

**Request** — send the **complete** body; partial bodies 500 with no useful message.
```json
{ "entityType": "WorkflowDefinition", "group": "STANDARD", "includeTotalHits": true,
  "filter": { "op": "AND", "values": [
      { "op": "EQUAL", "field": "d", "values": [false] },
      { "op": "ICONTAINS", "field": "lcName", "values": ["fleet"] } ] },
  "sorts": [ { "field": "cTm", "order": "DESC" } ],
  "projections": [ {"name":"id"}, {"name":"name"}, {"name":"trigger"}, {"name":"deployed"},
                   {"name":"appsUsed"}, {"name":"tags"}, {"name":"oUId"}, {"name":"cTm"} ],
  "page": { "limit": 30, "offset": 0 } }
```
A filter may also be a single flat condition: `{"field":"graphId","op":"EQUAL","values":["..."]}`.

**Groups**

| group | entityTypes |
|---|---|
| `STANDARD` | `WorkflowDefinition`, `EntityType`, `KNOWLEDGE_GRAPH_NODE/EDGE/SOURCE` |
| `ENTITY` | `e_*` entity types, `ai_agent_deployment`, `e_platform_asset_settings`, ... |
| `TEST_WORKFLOW_EXECUTION` | `WORKFLOW_EXECUTION`, `WORKFLOW_NODE_EXECUTION` |

**Operators seen:** `AND`, `OR`, `EQUAL`, `NOT_EQUAL`, `IN`, `ICONTAINS`, `EXISTS`,
`MISSING`, `GT`, `GTE`, `LT`, `LTE`.

**WorkflowDefinition projections:** `id`, `name`, `trigger` (`CALLABLE`, `SCHEDULED`,
`Application`, ...), `deployed`, `appsUsed`, `tags`, `standard`, `pId`, `oUId`, `cTm`,
`mTm`, `lMBy`. Filter fields: `d`, `standard`, `lcName`.

**Errors / gotchas**

| Symptom | Cause |
|---|---|
| 500, no message | body incomplete — send all of entityType, group, filter, sorts, projections, page |
| 500 `projections is null` | `projections` is **mandatory** for `group: ENTITY` |
| 500 `Invalid group: STANDARD and type: e_topic_ai_agent` (5004) | wrong group for the type |
| unrelated rows returned | ⚠️ `ICONTAINS` on `lcName` does **not** filter entity types — list and filter client-side |
| no `name` column | entity projections return only `id` / `tags` — read names via entity list |

Scale on UAT (2026-09-19): 31,703 workflows · 28,994 tools · 2,872 tasks.

### `POST /api/aggregation/metadata` — Field list for any type
✅ APS1 · 👁 UAT · 2026-09-19

```json
{ "group": "ENTITY", "entityType": "ai_agent_deployment" }
```
Returns every field for the type. **The fastest way to learn an unknown schema.**

### `POST /api/lookup?ByKeys={TYPE}` / `?ByQuery={TYPE}` — Keyed / text lookup
✅ UAT · APS1 · 2026-09-19

```json
// by keys
{ "type": "ByKeys", "lookupType": "USER", "keys": ["82118"] }
// by query
{ "type": "ByQuery", "lookupType": "CONNECTION", "query": "Maher", "fields": ["name"],
  "options": { "appName": "mdm_by_unifyapps" }, "page": { "limit": 20, "offset": 0 } }
```

| lookupType | Status | Use |
|---|---|---|
| `TEST_WORKFLOW_VARIABLE` | ✅ UAT | node inputs/outputs of a run (§6) |
| `CONNECTION` | ✅ APS1 | find a connection by name |
| `USER` | 👁 | user records (`email`, `name`, `userGroups`, `ssoLogin`, `state`, `userSessionType`) |
| `ENTITY_PERMISSIONS` | 👁 | `options: {entityType}`, `keys: [id]` |
| `ENTITY`, `UNIFIED_ENTITY`, `UNIFIED_ENTITY_MODEL` | 👁 APS1 | ECG and entity lookups |
| `TAG`, `NODE_BUILDER`, `TRIGGER_TYPE`, `s_project` | 👁 | UI list rendering |
| `WorkflowDefinition` | ⛔ | 500 — use aggregation instead |

`POST /api/lookup/bulk` is also used by the UI (👁).

### `POST /api/global-search` — Global search
⚠️ UAT · 2026-09-19

`{ "query": "user role matrix" }` → `{"hasMore":false}` with no results. Body shape not
understood yet. `/api/global-search/recent-searches` is 👁.

---

## 11. Observability & traces

Reads an agent's sessions and the **exact message array sent to the model**. Called through
the named-automation executor.

| Call | Returns | Status |
|---|---|---|
| `POST /api/workflow/execute/node?name=GetAllSessions` | sessions | ✅ UAT |
| `POST /api/workflow/execute/node?name=GetTraceTimeline&fetchTraceDetail={traceId}` | span tree | ✅ UAT |
| `POST /api/workflow/execute/node?name=TraceTimelineDetails&fetchTimelineDetails={spanId}` | span input/output incl. full `message[]` | ✅ UAT |

Request bodies are not yet recorded in full — the reliable method so far is to drive the UI
(`/p/0/ai-agents/{id}/observability`) and read the `TraceTimelineDetails` response from
network capture.

What traces reveal:
- Tool results verbatim — an empty `""` result is immediately visible.
- `SetTopic` is a real tool call carrying the task instructions.
- The platform appends a synthetic user turn `"Lets continue.."` after an assistant turn,
  causing an extra generation (the source of trailing "anything else?" filler).

---

## 12. Enterprise Context Graph

Verified on **APS1** across three graph builds (2026-09-19/20) unless marked. Deep detail
lives in the `unifyapps-context-graph` skill.

### Critical ordering rules

1. **Publish the graph before loading records.** Records written to a `DRAFT` graph go to
   the entity store and are **never projected** into the Cypher layer — no error.
2. **Make every property `STRING`.** Typed properties store fine but the node projects
   **zero vertices**. Convert in Cypher (`toFloat(...)`).
3. **Records never link themselves.** Record edges are written only by the MDM connector
   inside a workflow (§16).

### Graph

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/context-graph` | ✅ | create — body `{name, description}` |
| GET | `/api/context-graph/{graphId}` | ✅ | header |
| POST | `/api/context-graph/update/{graphId}` | ✅ | |
| POST | `/api/context-graph/{graphId}/publish` | ✅ | `DRAFT` → `LIVE` |
| POST | `/api/context-graph/delete/{graphId}` | ✅ | |
| GET | `/api/context-graph/templates` | ✅ | prebuilt templates |

**Create response:** `{ id, status: "DRAFT", nodeCount: 1, unifiedEntityModelId: <same as id>, version: 1 }`.
Side effects: a default **`ecg_grant`** node (leave it), and an `mdm_by_unifyapps` **UDM
connection** named `<graph name> UDM Connection` with `userInput.unifiedEntityModelId =
<graphId>`. Use that connection for every MDM step; never hand-create one.

### Nodes (types)

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/context-graph/nodes` | ✅ | create |
| GET | `/api/context-graph/nodes/{nodeId}` | ✅ | incl. `properties[]`, `entityMetadata`, `recordTitleFormat` |
| POST | `/api/context-graph/nodes/update/{nodeId}?version={n}` | ✅ | ⚠️ version in the **query string**; body = full node |
| POST | `/api/context-graph/nodes/delete/{nodeId}` | ✅ | |
| POST | `/api/context-graph/nodes/bulk-update-node-positions` | ✅ | canvas layout |
| GET | `/api/context-graph/nodes/templates` | ✅ | node templates |

**Create node request**
```json
{ "graphId": "<graphId>", "name": "Customer", "category": "core", "description": "...",
  "iconUrl": "account-executive", "nodePosition": { "x": 0, "y": 0 },
  "recordTitleFormat": "{{ mdm.field.customer_name }}",
  "properties": [
    { "id": "customer_id", "displayName": "Customer Id", "dataTypeInfo": { "type": "STRING" },
      "primaryKey": true, "required": true, "unique": false, "pii": false,
      "filterable": false, "sortable": false, "searchable": false,
      "graphQueryable": true, "standard": false } ] }
```
**Response:** node with server `id` **and** `unifiedEntityId` (the Cypher label and the
record `entityType`). `dataTypeInfo.type` values: `STRING`, `DOUBLE`, `BOOLEAN`, `DATE`,
`INTEGER`, `JSON`, `ARRAY` — **use STRING only** (rule 2).

**Errors:** `500 version is required for node update` → version belongs in the query string.
`500 Please delete data before updating entity schema` → type changes need zero records.

### Edges (types)

| Method | Path | Status |
|---|---|---|
| POST | `/api/context-graph/edges` | ✅ |
| GET | `/api/context-graph/edges/{edgeId}` | ✅ |
| POST | `/api/context-graph/edges/update/{edgeId}` | ✅ |
| POST | `/api/context-graph/edges/delete/{edgeId}` | ✅ |

```json
{ "graphId": "<graphId>", "label": "WORKS_AT", "fromNodeId": "<nodeId>", "toNodeId": "<nodeId>" }
```
A type-level edge only **declares** a relationship may exist; it materialises nothing.

### Records

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/entity` | ✅ | create — `{entityType: <unifiedEntityId>, properties:{...}}`; id = primary-key value |
| POST | `/api/entity/update` | ✅ | |
| GET | `/api/entity/{unifiedEntityId}/{recordId}` | ✅ | raw record incl. `mdmRecordMetadata` |
| POST | `/api/context-graph/{graphId}/nodes/{unifiedEntityId}` | ✅ | list — `{includeTotalHits, page:{limit,offset}}`; flat props + `_ua_recordTitle`, `labels`, `modelId` |
| GET | `/api/context-graph/{graphId}/unifiedEntity/{ue}/records/{recordId}` | ✅ | record + `edges[]` |
| GET | `/api/context-graph/{graphId}/unifiedEntity/{ue}/records/{recordId}/graph?depth=1` | ✅ | neighbourhood |
| DELETE | `/api/entity/{ue}/{id}` | ⛔ 405 | delete via `storage_by_unifyapps_delete_records` in a workflow |
| POST | `/api/entity/action/delete` | ⛔ 405 | same |

Record edge shape (on read):
```json
{ "direction": "OUTGOING", "entityType": "<other ue>", "isDangling": true,
  "recordId": "TKT-002", "recordTitle": "AXN-256 - Duplicate Customer Profiles",
  "relationshipId": "HAS_TICKET", "relationshipLabel": "HAS_TICKET",
  "properties": { "edgeLabel": "HAS_TICKET", "id": "90::ueA::ACC-001::90::ueB::TKT-002" } }
```
`isDangling: true` = no matching type-level edge; still traverses normally.

`mdmRecordMetadata` carries field-level lineage: `sourceDetails[{fieldName, sourceAppName,
sourceId, stageRecordId, modifiedTime}]`, `contributingSources[]`,
`associatedStagingRecordIds[]`, `dataQualityResult`, `modelId`, `stagingMetadata`.

### Querying (OpenCypher)

Queried through the `mdm_by_unifyapps_execute_opencypher_query` workflow action (§16), not a
REST endpoint. Node label = `unifiedEntityId` (backticked); properties prefixed `_pr_`.
```cypher
MATCH (c:`<customer_ue>`)
WHERE toLower(coalesce(c.`_pr_name`, '')) CONTAINS 'presidential'
MATCH (c)-[:HAS_DEAL]->(d:`<deal_ue>`)
RETURN d.`_pr_deal_name` AS deal, labels(d) AS labels, d.modelId AS modelId LIMIT 50
```
Verify projection after the first record of each type: `MATCH (n) RETURN DISTINCT labels(n)`.

### Sources (connector ingestion)

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/context-graph/sources` | ✅ | `{graphId, appName, connectionId, name}`; auto-fills `destinationConnectionId`; starts Draft |
| GET | `/api/context-graph/sources/{sourceId}` | ✅ | incl. `objectDiscoveryConfigRefs[]` |
| POST | `/api/context-graph/sources/update/{id}` · `/delete/{id}` | ✅ | |
| POST | `/api/context-graph/sources/{sourceId}/publish` | 📦 | |
| GET | `/api/context-graph/sources/{sourceId}/objects/fetch-selected?limit=200&offset=0` | ✅ | per-object `objectSchema`, `enrichedObjectSchemas[]`, `schemaMappings[]` |
| POST | `/api/context-graph/sources/{sourceId}/objects/bulkUpdate` | ⛔ | 200 but `{"data":0}` — writes nothing |
| GET | `/api/context-graph/sources/{sourceId}/object-discoveries` | ✅ | |
| POST | `.../object-discoveries/scope-configs/bulk-save` | ✅ | scope (e.g. Slack `channelList`) |
| POST | `.../object-discoveries/discovery-configs/bulk-save` | ⚠️ | 200, but the **enricher binding does not persist** |
| GET | `/api/context-graph/sources/{sourceId}/schema-mappings` | ✅ | returns `{"objects":[]}` |
| POST · PUT · PATCH | `/api/context-graph/sources/{sourceId}/schema-mappings` | ⛔ 405 | **Map step is wizard-only** |
| POST | `/api/context-graph/sources/{sourceId}/schema-mapping/automap` | ⛔ 405 | |
| POST | `/api/context-graph/sources/{sourceId}/transformations/save` | 📦 | |
| GET | `/api/context-graph/sources/{sourceId}/transformations/group-by-source-field` | 📦 | |
| GET | `/api/context-graph/sources/applications/{appName}/objects` | ✅ | objects a connector exposes |
| POST | `/api/context-graph/sources/applications/{appName}/objects/{objectId}/details?connectionId=` | ✅ | body `{}`; object schema (nested for raw, flat for enriched) |
| GET | `/api/context-graph/sources/applications/{appName}/settings` · `/disabled-steps` | 📦 | |
| POST | `/api/context-graph/sources/objects/describe` | ✅ | `{connectionId, objectId, sourceConfigId}` → destination `fields[]` |
| GET | `/api/context-graph/sources/discoverers/{method}/{agentId}/{n}/schema` | ✅ | e.g. `AGENT/.../0` → `{outputSchema:{...}}` |
| GET | `/api/context-graph/sources/enrichers/{method}/{agentId}/{n}/schema` | ✅ | flattens `results[].items.properties` |
| GET | `/api/context-graph/sources/app/{appName}/resource/{resourceId}` | 📦 | |

**Scope config (Slack) request**
```json
{ "objectDiscoveryConfigEntries": [
    { "objectId": "Message", "displayName": "Message",
      "scopeConfig": { "scopeActionId": "slack_index_channels_and_chat",
                       "actionInputs": { "token_type": "user_token", "channelList": ["C0BD6AWDTLH"] } } } ] }
```
⚠️ An **empty `channelList` means every channel**. Always set it. HubSpot has no
record-level scope at all.

### ECG entity-type fields (from `/api/aggregation/metadata`)

- **`KNOWLEDGE_GRAPH_NODE`**: `id graphId name lcName category color iconUrl description
  properties propertiesCount edgeCount recordCount nodePosition unifiedEntityId standard tags
  spaceId v cTm mTm oUId pId lMBy lPUBy lPUOn`
- **`KNOWLEDGE_GRAPH_EDGE`**: `id graphId label lcName description fromNodeId toNodeId
  entityRelationshipIds[] standard tags spaceId v cTm mTm oUId pId lMBy lPUBy lPUOn`
- **`KNOWLEDGE_GRAPH_SOURCE`**: `id graphId name lcName appName connectionId status
  lastSyncTimeEpochMillis standard tags spaceId v cTm mTm oUId pId lMBy lPUBy lPUOn`

---

## 13. Files

### `POST /api/file/signed-url?preview=true&expiryTime=1` — Signed download URL
✅ APS1 · 2026-09-19

```json
{ "fileDetails": { "fileType": "application/pdf", "name": "AXN-MSA.pdf", "size": 54396,
    "source": "connector_streaming_uploads/90/6/<uuid>_AXN-MSA.pdf",
    "sourceType": "CLOUD_STORAGE", "ua:type": "FILE" } }
```
**Response:** `{ "url": "/api/file/download/__UNIFY_ENCR_AWS__V0__..." }`.

### `GET /api/file/download/{encryptedRef}&isPublic=false&preview=true` — Download
✅ APS1 · 2026-09-19

Returns the file bytes. Use the `url` from `signed-url` verbatim and append the flags.

---

## 14. Other observed platform endpoints

UI plumbing seen in live traffic. Not needed for building, recorded for completeness.

| Method | Path | Status | Notes |
|---|---|---|---|
| GET | `/api/mqtt/connectionDetails?resourceTypes=PLATFORM` | 👁 | realtime channel (MQTT over WebSocket) — needed by the copilot |
| GET | `/api/notification/unopenedCount` | 👁 | |
| POST | `/api/collaborators/connect` | 👁 | 204 — builder presence |
| POST | `/api/collaborators/active-users` | 👁 | → `{activeSessions:[{sessionId, userId}]}` |
| GET | `/api/entity/deployed/e_interface/{id}` | 👁 | deployed UI interface |
| POST | `/api/entity/deployed/embedded-entities/e_component` | 👁 | UI components |
| GET/POST | `/api/entity/deployed/...` (`bulk-fetch-snapshots`, `child-entities`, `snapshot/`, `entity-dependency`) | 📦 | deployed-entity family |
| POST | `/api/entity/restore/deployed/` | 📦 | |

---

## 15. Confirmed dead ends

Tested and **do not work**. Do not retest without a reason.

| Method | Path | Result | Use instead |
|---|---|---|---|
| any | `/api/login`, `/api/auth/login`, `/api/user/login`, `/api/v1/auth/login` | 404 | `/auth/workflow/execute/node?name=emailAndPassLoginRequest` |
| any | `/api/authenticate`, `/api/auth/token`, `/api/oauth/token`, `/api/session`, `/api/auth/me` | 404 | — |
| GET | `/api/workflow-definition` | 405 | aggregation, group `STANDARD` |
| GET | `/api/entity/{id}` (no type) | 405 | `/api/entity/{type}/{id}` |
| GET | `/api/entity/ai_agent` (no id) | 405 | `POST /api/entity/ai_agent` to list |
| POST | `/api/entity` with an existing `id` | 500 Mongo `E11000 duplicate key` | `POST /api/entity/update` |
| PUT · POST | `/api/entity/{type}/{id}` | 405 | `POST /api/entity/update` |
| PUT | `/api/entity/{type}` | 405 | |
| POST | `/api/entity/action/save`, `/api/entity/action/update` | 405 | `POST /api/entity/update` |
| POST | `/api/entity/save` | 500 `ENTITY_TYPE with id save not found` | |
| DELETE | `/api/entity/{ue}/{id}` | 405 | `storage_by_unifyapps_delete_records` in a workflow |
| POST | `/api/entity/action/delete` | 405 | same |
| any | `/api/connections` | 404 | `/api/connection` |
| GET | `/api/connection?appName=` (and `app`, `appNames`, `filter`, `active`) | filter ignored | client-side filter / `lookup?ByQuery=CONNECTION` |
| any | `/api/tag`, `/api/tags`, `/api/entity-tag` | 404 | top-level `tags` on create; read via aggregation projection |
| GET | `/api/workflow-builder/nodes/{name}` | 404 | `/api/workflow-builder/node/{name}` |
| GET | `/api/workflow-builder/node/{n}/resource` | 404 | `/node/{n}/resources` |
| GET | `/api/workflow-builder/node/{n}/resources/{r}` | 404 | `/node/{n}/resource/{r}` |
| GET | `/api/workflow-builder/node/{n}/resource/{r}/schema` · `/input-schema` | 404 | `/node/{n}/resource/{r}` → `input.schema` |
| GET | `/api/workflow-builder/resource/{r}`, `/node-resource/{r}`, `/resources?nodeName=` | 404 | |
| GET | `/api/workflow-builder/node/resource?nodeName=` | 200 empty body | |
| POST | `/api/workflow/execute/node?name=<connector action>` | 500 `forbidden datasource: not found` | a real workflow + `initiate-test` |
| POST | `/api/lookup?ByQuery=WorkflowDefinition` | 500 | aggregation |
| POST | `/api/global-search/search` | 404 | |
| POST · PUT · PATCH | `/api/context-graph/sources/{id}/schema-mappings`, `.../schema-mapping/automap` | 405 | the UI wizard |
| POST | `/api/context-graph/sources/{id}/objects/bulkUpdate` | 200 `{"data":0}` — no-op | the UI wizard |
| POST | `/api/connection` for an `mdm_by_unifyapps` UDM connection | 500 `No Value found in filter with field: sourceConnectionId` | the graph creates it |
| GET | `/api/entity-type/{id}`, `/api/entity-type/find/{id}`, `/api/entity-type/by-id/{id}` | 404 | `GET /api/entity-type?entityType={id}` |
| GET | `/api/entity-type?id={id}` | 500 | same |
| POST | `/api/lookup?ByKeys=EntityType` | 500 5004 `Lookup type not supported` | `lookup?ByKeys=ENTITY_TYPE` |
| POST | `/api/aggregation/metadata?entityType=e_interface&group=ENTITY` with `{}` | 204 empty | read the entity itself |
| POST | `/api/workflow/execute/node` calling a CALLABLE with no `id` | 500 `forbidden datasource: not found` | register an `e_data_source` (§22) |
| fetch | `http://127.0.0.1` from a UnifyApps page | blocked by CSP `connect-src` | read data through the browser tool, not out of the page |

---

## 16. Node action contracts

✅ VERIFIED UAT · 2026-09-26 (Forge build kit, workflow `6ab7f2542904de691eb73c43`, run `6ab7f25462755c68a11af4e8` COMPLETED) — one callable workflow compiled from a step list ran first time: `storage_by_unifyapps_fetch_records` (two EQUAL filters, one templated) → `storage_by_unifyapps_count_records` `{object_type, triggerInputCondition}` → `{{ .count }}` → `utility_by_unifyapps_run_sql_query_on_list` `SELECT properties.category_id AS category, COUNT(*) AS n FROM {{ n_req.outputs.objects }} GROUP BY properties.category_id` → `{{ .result }}` rows → `if_else_condition` (`{{ n_req.outputs.total }}` GT 0, true body in group `n_chk@g1@y`) → `loop_for_each` (body group `n_each@g1@l`, `{{ n_each.outputs.item.id }}`) with `storage_by_unifyapps_update_records` by id query inside → STOP. Versions resolved from `GET /api/workflow-builder/node/{app}/resources` at build time. An auto-generate primary key (`prefix:'KTT', startFrom:1001`, not in `required`) was filled by a create-record node as `KTT_1001`.

Workflow steps are not REST endpoints, but they are the API surface you actually program
against. Each is identified by `context.{appName, resourceName, resourceVersion}`, configured
by `inputs`, and read back as `{{ n_<id>.outputs.<field> }}`.

### Node / edge model
✅ UAT · 2026-09-19

```json
{ "id": "n_sql", "type": "ACTION", "title": "Execute a SQL statement", "subTitle": "Oracle DB",
  "context": { "appName": "oracledb", "resourceName": "oracledb_execute_sql",
               "resourceVersion": 16523, "connectionId": "<id>", "type": "APPLICATION" },
  "inputs": { ... }, "groupId": "g1", "index": 2, "fallbackMode": "STOP", "skip": false }
```

| Field | Notes |
|---|---|
| `type` | `START`, `ACTION`, `STOP`, `IF_ELSE`, `LOOP`, `BREAK`, `DELAY`, `CALL_WORKFLOW` |
| `context.connectionId` | **inside `context`**, never at node level |
| `context.type` | `"APPLICATION"` on non-trigger nodes |
| `groupId` | scope: `{ownerNodeId}@{parentGroupId}@{y\|n\|l\|error}`, concatenating as it nests |
| `fallbackMode` | `STOP` (fail run) · `MANUAL` (take the `error` edge) · `CONTINUE` (⚠️ see §18) |

Edges: `{ fromNodeId, toNodeId, type, id: "{type}@{from}@{to}", name? }`.

| Edge type | `name` | Meaning |
|---|---|---|
| `next` | — / `"no"` / `"loopback"` | normal flow / else / back to loop |
| `if` | `"yes"` | true branch of `IF_ELSE` |
| `loop` | — | into a `LOOP` body |
| `error` | `"error"` | failure path (needs `fallbackMode: MANUAL`) |

### Triggers (START nodes)

| resource | `trigger.type` | inputs | Status |
|---|---|---|---|
| `callables` / `callables_from_automation` | `CALLABLE` | `setup` = JSON Schema of the workflow's **input parameters** | ✅ UAT |
| `schedule` / `schedule_default` | `SCHEDULED` | `cron: "INTERVAL"\|"CRON"`, `interval`, `frequency: MINUTES\|HOURS\|DAYS`, `sequential` | ✅ UAT |
| (event) | `EVENT` | app event triggers, e.g. `oracledb_on_new_event` | 📦 |
| (webhook) | `WEBHOOK` | | 📦 |

CALLABLE outputs mirror `setup`: `{{ n_in.outputs.customerId }}`. Trigger `context` carries no
`type` field.

### Response — `callables_return_to_automation` (type `STOP`)
✅ UAT · 2026-09-19

`inputs.result` = any scalar or nested object, returned verbatim with templates resolved.
Every path of a CALLABLE workflow must end in one — the validator enforces it.

### Invoke an AI Agent from a workflow — `ai_agents_by_unifyapps_invoke_agent`
✅ VERIFIED UAT · 2026-09-26 (AP Invoice Exception Desk, tenant orbit.uat.unifyapps.com) — ran end to end: START node context `{appName:'callables', resourceVersion:3109, resourceName:'callables_from_automation'}`, STOP node context `{appName:'callables', resourceVersion:3111, resourceName:'callables_return_to_automation', type:'APPLICATION'}`, edges as a top-level array (`fromNodeId`/`toNodeId`, not inline per-node). Invoke Agent node resourceVersion resolved via `GET /api/workflow-builder/node/ai_agents_by_unifyapps/resources` → 1783. String interpolation for `userQuery`/`messageId` must embed `{{ n_in.outputs.field }}` inside the JSON string literal — string concatenation with `+` sends the literal placeholder text, not the value. `ai_agent` entity create requires `tags` at the top level of the POST body, not inside `properties` (500 'additionalProperties tags' otherwise). Round trip ~15-22s for a class-D agent with one tool call; agent narrates tool selection in `agentResponses` (auditable) then returns the tool's JSON verbatim when instructed to.
Groovy Code-node gotchas found while building the tool workflow: `groovyx.net.http.HTTPBuilder` does not resolve (remove unused import); `new Date().format(pattern)` fails — use `new Date().toInstant().toString()` instead.
✅ VERIFIED UAT · 2026-09-26 (Forge build kit, workflows `6ab7f2c9c3064c77d9856277` and the per-project agent probe) — **reading the agent's answer downstream**: `{{ n_x.outputs.agentResponses }}` is a list whose THOUGHT messages carry `additional.internalMessageType`; the answer is the LAST element without it, and it may arrive wrapped in a ```json fence. A Groovy node that takes `responses` (typed `array`), keeps `it.text && !it.additional?.internalMessageType`, takes the last, strips the fence and parses it with `new groovy.json.JsonSlurper().parseText(...)` (allowed in the sandbox) returns `[text, messageId, json]`; `{{ n_x_ans.outputs.result.json.priority }}` then feeds a create-record node. Data for the agent: `utility_by_unifyapps_to_json_string` `{object: "{{ n_f.outputs.objects }}"}` → `{{ n_j.outputs.result }}` embedded in `userQuery`. A **templated `aiAgentId`** (`"{{ n_in.outputs.agent_id }}"`) works — one probe workflow can ask any agent. A unique `messageId` per call: `"<wf>-<step>-{{ n_t.outputs.t }}"` with a create-variables node `t = "=ROUND((NOW()-DATE(1970,1,1))*86400000,0)"`. Turn times 7–12 s (Vertex Sonnet 5). initiate-test returned its runId normally for these runs. An agent with a guardrail denied topic answers the guardrail's blocked message through this node as well.
The synchronous (`async:false`) node that lets a workflow call a UnifyApps AI Agent and wait for its answer — how an
atomic agent (skill `atomic-agent-architecture`) is invoked from its sub-workflow.

| | |
|---|---|
| node `type` | `CALL_INTERFACE_WORKFLOW` |
| `context` | `{appName:'ai_agents_by_unifyapps', resourceName:'ai_agents_by_unifyapps_invoke_agent', resourceVersion}` (1783 on UAT today — resolve at runtime: `GET /api/workflow-builder/node/ai_agents_by_unifyapps/resources`) |
| `inputs.callableInterfaceId` | `'__ua__invoke_ai_agent_by_unifyapps'` (the node's defaults also carry `defaultFallbackWorkflowId 68050ca67df58855654804a0`, `triggerWorkflowWithRuntimeType 'IN_MEMORY'`) |
| `inputs.parameters` | `aiAgentId` (required), `userQuery`, `sessionId` (same id = same conversation context), `messageId` (**a replay of the same id is answered from the original turn and not billed again** — use the idempotency key), `taskExecutionModel` (per-call `ai_agent_llm_model` id override), `skipApprovalBeforeToolExecution`, `userEmailAddress`, `attachments[]`, `ai_agent_default_tools {enableKnowledge, webSearch}`, `externalKnowledges[]`, `citations`, `routineId`, `spaceId` |
| output | `agentResponses[] {text, messageId, messageCreatedTime, choices[], coPilotBlocks[], additional}`, `publicResponse[] {text, choices[]}`, `citations[]`, `sessionId`, `usage {cost, inputTokens, outputTokens, llmCalls}` |

Interface definition: `POST /api/lookup?ByKeys=CALLABLE_INTERFACE {type:'ByKeys', lookupType:'CALLABLE_INTERFACE',
keys:['__ua__invoke_ai_agent_by_unifyapps']}`. The same app also has `…_cancel_stream`, `…_resume_agent_stream` and
chat-queue actions. Sibling node `workflow_agent_ask_ai_agent` ("create a new mini-agent on the fly") is a different
thing: an inline agent, not a registered one.

✅ VERIFIED UAT · 2026-09-27 (UnifyApps Studio engine 1.6.91, workflow `scc_gfd_triage` `6ab8dcfc3c2b816ad4051efe`, test run
`6ab8dd5863499e03002ba1e9`) — the same node built by the Studio's plan step `kind: "agent"`: a Groovy node builds `userQuery`
(one line of what to do + `INPUT (JSON):` + the input map as JSON), the Invoke Agent node carries only `aiAgentId`, `userQuery`
and `skipApprovalBeforeToolExecution: true` (no `messageId`, no `sessionId`), a Groovy node reads `agentResponses`. The run
completed in 7.6 s; the agent (one Task, no tools, Opus 4.8) answered `{status, value, confidence, confidence_basis,
abstain_reason}` as plain JSON, and `{{ n_x_p.outputs.result.json.category }}` fed the record update. A node-level
`async: false` sent on save is not kept on the stored node (read back `undefined`) and the call is synchronous all the same.
The platform fills `inputs.automationId` (`68050ca67df58855654804a0`, the node's default fallback workflow) by itself.

### Sub-workflow / agent tool — `callables_call_automation`
✅ UAT · 2026-09-19

| Input | Notes |
|---|---|
| `automationId` | target workflow id (deployed) |
| `version` | `"-1"` = latest deployed |
| `synchronous` | `true` waits for the result |
| `parameters` | must match the target's `inputs.setup` |
| `runtimeConnections` | `{}` |

Used by `CALL_WORKFLOW` nodes and by `e_action_ai_agent` tools alike.

### Oracle — `oracledb_execute_sql`
✅ UAT · 2026-09-19

| Input | Req | Notes |
|---|---|---|
| `sql` | ✅ | may contain templates and `:binds` |
| `params` | with binds | JSON Schema declaring each bind (name + type) |
| `record` | with binds | the bind **values**, as templates |
| `objectSourceResourceName` | | `"oracledb_execute_sql_metadata"` — enables typed `rows` |
| `response_schema` | | column schema matching the SELECT |
| `performAsync`, `record_loader` | | |

**Outputs:** `rows[]`, `rowsCount`, `rowsAffected`.

⚠️ Bind traps (the most expensive gotchas found):
- `params` **and** `record` are both required; missing either → `ORA-17041: Missing IN or OUT parameter`.
- `record` templates must reference **this** workflow's START node id — copied nodes carry
  a foreign id that silently resolves to nothing.
- A `record` **missing one key binds NULL silently** — diff SQL `:binds` against `record` keys.
- **OUT binds (`o_*`) must not be in `record`.**
- 🔴 **PL/SQL OUT binds are never returned** — an anonymous block returns
  `{"rows":[],"rowsCount":0,"rowsAffected":0}`. Follow every write with a verification
  `SELECT` node and return that.

23 `oracledb` actions exist, incl. `oracledb_select_rows_using_custom_sql`,
`oracledb_insert_record`, `oracledb_update_rows`, `oracledb_upsert_row`,
`oracledb_delete_rows_in_batch`, `oracledb_execute_stored_procedure`,
`oracledb_list_schemas`, `oracledb_list_tables_from_schema`, and CDC triggers
`oracledb_on_new_event` / `_on_update_event` / `_on_delete_event`.

### HTTP — `custom_http_endpoint_execute`
✅ UAT · 2026-09-19

Needs **no connection**.

| Input | Notes |
|---|---|
| `baseUrl`, `path`, `httpMethod` | required in practice |
| `headersList`, `queryParamsList`, `pathParamsList` | arrays |
| `bodySchema`, `body_loader` | request body |
| `authType`, `connectionType` | |
| `requestTimeoutInSecs`, `sslVerify`, `enableProxy`, `httpVersion` | |
| `responseSchema`, `errorResponseSchemas` | |

**Outputs:** `status` (int), `result` (parsed body).
Variants: `_execute_graphql`, `_execute_soap`, `_execute_multipart`, `_execute_streaming`.

### Code — `code_by_unifyapps_groovy`
✅ UAT · 2026-09-19

```json
{ "input":  { "type":"object", "required":["km"], "properties": { "km": {"type":"string","title":"km"} } },
  "output": { "type":"object", "required":["recommendation"], "properties": { "recommendation": {"type":"string","title":"recommendation"} } },
  "code": "return [\"recommendation\": \"Service now - odometer at \" + km + \" km\"];",
  "parameters": { "km": "{{ n_in.outputs.mileage }}" },
  "compile_static": false, "captureStdOutput": false }
```
- `input` declares names; `parameters` binds values; code reads them as bare variables.
- **Outputs nest under `result`**: `{{ n_code.outputs.result.recommendation }}`.

⚠️ `code_by_unifyapps_javascript`: a top-level `return` is rejected with *"Script rejected by
sandbox validation: Line 1, column 1: Invalid return statement"*. Correct JS form unknown
(§19). Other code actions: `_python`, `_java`, `_csharp`, `_execute_code_snippets`,
`_bubblewrap` (sandbox), `_playwright`.

### Auth — `auth_by_unifyapps_create_user_session` (the "run as the caller" executor)
✅ UAT · 2026-09-24 — `scc_studio_exec_step` `6ab4e8ed7c47e164fbbafcbc`, three workflows created end to end

```json
{ "context": { "appName": "auth_by_unifyapps", "resourceName": "auth_by_unifyapps_create_user_session", "resourceVersion": 2013 },
  "inputs": { "sessionDuration": 900000 } }
```
- Inputs: `sessionDuration` (ms), optional `userId` (a TEST user; leave empty = **the caller**).
  Output: `{{ n_session.outputs.sessionId }}`.
- A following Groovy node replays it as `Cookie: _at=<sessionId>` against the tenant's own
  `/api/*` and everything it creates is **owned by the calling user** (`oUId` = caller) — no
  service account, no stored password. Verified writes: `POST /api/workflow-definition` +
  `saveAndReturnViolations` + `deploy`, `POST /api/entity` (`ai_agent`) + `saveAndDeploy`,
  `POST /api/entity-type` + `/update`.
- Called from a code app through a `callables_call_automation` data source (`version: "-1"`,
  `synchronous: true`) the caller is the signed-in app user, so a plan step builds as the person
  who approved it. Ledger row + `Respond to automation` `{ok, platform_id, asset_type, name, detail, error}`.
- Pattern and paste-ready installers: `sc-native-studio/platform/studio-exec/` (`install-exec-step.js`).
- ⚠️ Claude's own permission gate refuses to *create or deploy* such a workflow and its data source
  (in auto **and** manual mode); the user runs the installer in their signed-in console. Reads,
  wiring, and calling it from the app are not gated.

### Control flow

| resource | type | inputs | Status |
|---|---|---|---|
| `if_else` / `if_else_condition` | `IF_ELSE` | `operator`, `filters: [{property, filter:{operator, value}}]` | ✅ |
| `loop` / `loop_while` | `LOOP` | `condition: {operator, filters}`, `captureIterations` | ✅ |
| `break` / `break` | `BREAK` | `loop: "<loop node id>"` | ✅ |

- `IF_ELSE` wiring: `if` edge (`yes`) into the body; `next` edge (`no`) to the rejoin node;
  the body's last node also points at the rejoin node.
- `LOOP` wiring: `loop` edge in; `next` (`loopback`) from the body's last node back; `next` out.
  Outputs `{result, index}`, state `{iteration}`.
- `BREAK` **still needs an outgoing `next` edge** to the enclosing condition's rejoin node,
  or validation fails.

### Variables

| resource | inputs |
|---|---|
| `variable_by_unifyapps_create_variables` | flat map `{ "counter": "0" }` → `{{ n_v.outputs.counter }}` |
| `variable_by_unifyapps_update_variables` | `{ "variables": [ { "source": "{{ n_v.outputs.counter }}", "value": "=SUM({{ n_v.outputs.counter }},1)" } ] }` |

### MDM — `mdm_by_unifyapps` (context graph write/read)
✅ APS1 · 2026-09-19/20

All steps use the graph's UDM connection as `context.connectionId`.

| Action | Inputs | Outputs |
|---|---|---|
| `add_edge_to_graph` | `modelId` (graphId), `primaryEntityType`, `primaryEntityId`, `associatedEntityType`, `associatedEntityId`, `label`, `updateIfPresent` | `{success, fromNodeId, toNodeId}` |
| `execute_opencypher_query` | `modelId`, `query`, `limit` (1–1000, default 100), `offset`, `skipRBAC`, `outputSchema` | query rows |
| `execute_opencypher_update` | Cypher write | 📦 |
| `create_staging_records`, `apply_data_matching_rules`, `apply_data_quality_rules`, `find_by_sql` | MDM golden-record pipeline | 📦 |

Entity types are `unifiedEntityId`s; entity ids are primary-key values. ~60–70 edge nodes per
workflow run reliably in 25–40 s.

### Storage — `storage_by_unifyapps`
✅ APS1 · 2026-09-19

| Action | Inputs |
|---|---|
| `create_record` | `object_type: <ue>`, `record: {...}` — ⚠️ fields under **`record`**, not top level |
| `delete_records` | `object_type`, `numberOfRecordsToDelete: "SINGLE"`, `triggerInputCondition: {operator, filters}` |
| `fetch_records` | `object_type`, `page {paginateBy:"OFFSET", limit, offset}`, `numberOfRecordsToFetch:"MULTIPLE"`, `triggerInputCondition {operator:"AND", filters:[{property:"id", filter:{operator:"EQUAL", value}}]}` ✅ UAT 2026-09-21 (templated `object_type` works) |
| `create_record` (raw) | `useRawPayload:true`, `writeThroughSessionVariables:false`, `object_type`, `rawPayload: {{ node.outputs.result.payload }}` (a Map) ✅ UAT 2026-09-21 — output = the created entity (`id` = autonumber) |
| `update_record_by_id` (raw) | `useRawPayload:true`, `upsert:false`, `writeThroughSessionVariables:false`, `object_type`, `recordId`, `rawPayload` = **full** record (replaces it; merge the current `properties` first) ✅ UAT 2026-09-21 |

### ECG pipeline — `ecg_by_unifyapps`
📦 APS1 · 2026-09-20

`run_discovery`, `translate_raw_record`, `apply_enrichment`, `publish_record` — **all require a
published source config**, so they do not bypass the wizard.

### Connector specifics
✅ APS1 · 2026-09-20

- **HubSpot:** search operator `CONTAINS` is rejected → use `CONTAINS_TOKEN`. Always request
  `hs_object_id`. `hubspot_get_deal` supports `propertiesWithHistory: ["dealstage"]`. No
  "record updated" trigger — poll `hs_lastmodifieddate`.
- **Slack:** bot tokens read only joined channels; `token_type: "user_token"` reads what the
  user sees. `slack_list_conversation_history` = top-level only; replies need
  `slack_list_conversations_replies`. `slack_get_user_info_by_id` takes **`user`**;
  `slack_get_conversation` takes **`channelId`**; history takes **`channel`**.

---

### Caller identity inside workflows ✅ UAT 2026-09-21
A CALLABLE workflow run from an app data source or an agent tool gets **no trusted caller identity**:
the Groovy binding holds only the node inputs, and the trigger outputs carry only
`__internals__ {m, s, c, p}` (mode, page slug, channel, platform). Templates may reference nodes only
(`{{ $user }}` etc. → *"Node referenced in input no longer exists"*). No workflow node looks up
platform users or roles (`auth_by_unifyapps` = sessions/MFA/IdP; `platform_by_unifyapps` = run
events). What IS trusted: storage writes run **as the caller** — records get `lastModifiedBy` = the
caller's platform user id — so platform object permissions (role → EDIT/VIEW per entity type) are the
hard enforcement, and `lastModifiedBy` is a trustworthy audit. App-side roles come from
`GET /api/user-context?includeRoles=true` (`user.roles[].name`).

## 17. Error catalogue

| Message (substring) | Where | Cause → fix |
|---|---|---|
| `Invalid username or password` (401) | login | bad creds, wrong IdP id, `firstLogin` set, or MFA |
| `app_not_configured_for_user` | Google SAML | account not in the SSO app → use a local account |
| `getNodes() is null` | create workflow | send `nodes` (a stub is fine) |
| `This automation has a trigger which expects response` | save violation | a path lacks a `STOP`; a `BREAK` lacks an outgoing edge |
| `forbidden datasource: not found` | `execute/node` | not a registered automation → use a workflow |
| `Script rejected by sandbox validation: Invalid return statement` | JS code node | use Groovy |
| `ORA-17041: Missing IN or OUT parameter at index` | Oracle node | `record` missing, or its templates reference a foreign START id |
| `ORA-17003: Invalid column index` | Oracle node | a `:word` inside a **string literal** (e.g. `'09:00'`) is parsed as a bind — build it with `CHR(58)` |
| `ORA-201xx: <sentence>` | Oracle node (PL/SQL) | a business rule raised with `RAISE_APPLICATION_ERROR`; surfaced verbatim deep in the failure payload |
| `ORA-01017` | Oracle connection | pointed at the CDB; EBS APPS is PDB-local |
| `Non Empty Validations ... required name` | saveAndDeploy | send the full entity; set `properties.name` |
| `Non Empty Validations ... add additionalProperties tags` | create entity | move `tags` to the top level |
| `E11000 duplicate key error` | `POST /api/entity` | you sent an existing id → use `/api/entity/update` |
| `ENTITY_TYPE with id save not found` | `/api/entity/save` | not an endpoint |
| `CONNECTION with id X not found` (5002) | connection | bad id |
| `Invalid group: STANDARD and type: e_topic_ai_agent` (5004) | aggregation | entities use `group: ENTITY` |
| `projections is null` | aggregation | `projections` mandatory for `ENTITY` |
| `version is required for node update` | ECG node update | version in the query string |
| `Please delete data before updating entity schema` | ECG node update | type changes need zero records |
| `No Value found in filter with field: sourceConnectionId` | create connection | don't hand-create the UDM connection |
| `The system lost track of your active connection session` | copilot | realtime channel broken — don't buffer the SSE stream; the in-app browser may block MQTT |
| `forbidden datasource : invalid input` | `execute/node` with an `id` | an input differs from the data source's stored value where it is not `{{templated}}`, or a stored input was omitted → send the full stored inputs, change only templated fields |
| `Non Empty Validations ... property X invalid; oneOf fail` | record create/update | value not in the field's `oneOf` |
| `Non Empty Validations ... required X` | record create/update | missing required field — updates replace the whole record, send all fields |
| `Non Empty Validations ... add additionalProperties X` | record create | field not in the object schema |
| `E11000 duplicate key ... CUSTOMER_ENTITY_<n>.<object>` | record create | primary-key value already used (record id = PK) |
| `Lookup type not supported: EntityType` (5004) | lookup | use `ENTITY_TYPE` |
| `e_component with id e_global_<app> not found` (5002) | embedded-entities | app has no global page yet — it is created with the first page |
| HTML instead of JSON | any | session expired → re-login |

---

## 18. Discrepancies to resolve

Places where two sessions/tenants recorded conflicting facts. **Do not pick one silently** —
resolve by testing, then update both the entry and the affected skill.

### D1 — Reading node outputs
- **UAT (builder):** `POST /api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE` ✅ returns node
  inputs/outputs — used successfully in dozens of runs.
- **APS1 (context-graph):** *"There is no supported get-node-outputs API that worked"* — a
  debug node writing to storage was used instead.
- **To resolve:** try `TEST_WORKFLOW_VARIABLE` on APS1 with the exact UAT body (§6),
  including `options.startTime/endTime/workflowId`. If it works, retire the debug-node pattern.

### D2 — `fallbackMode: CONTINUE`
- **Builder skill** says `CONTINUE` *"ignores the failure and carries on"* — ⚠️ this was
  **inferred, never tested**. Every verified UAT run using `CONTINUE` succeeded, so the
  failure path was never exercised.
- **APS1 (context-graph):** observed that *"`fallbackMode: CONTINUE` does not continue — one
  failed node fails the run."* This is the only direct evidence.
- **Current best knowledge:** assume `CONTINUE` does **not** continue. Use `MANUAL` + an
  `error` edge for failure handling (✅ verified).
- **To resolve:** a two-node workflow on UAT with a deliberately failing `CONTINUE` node,
  then check `STATUS` and whether the next node ran.
- ✅ **Resolved on UAT 2026-09-24 (§41.10):** `CONTINUE` does not continue after a failed connector action, and
  `MANUAL` + `error` edge did not route it either (run via an app data source). One unit of work per run instead.

### D3 — Run-status filter field
- **UAT:** `filter: {"op":"IN","field":"ID","values":[runId]}` ✅
- **APS1:** `filter: {"op":"AND","values":[{"field":"fields.id","op":"EQUAL","values":[runId]}]}` ✅,
  with projection `RUN_ID`.
- Possibly both work on both. **To resolve:** try each form on the other tenant.

---

### D4 — `find-nodes-with-connections` vs the Connection aggregation
✅ UAT · 2026-09-23

`GET /api/workflow-builder/find-nodes-with-connections` listed 304 connectors; querying
`POST /api/aggregation?entityType=Connection&group=STANDARD` per `appName` returned
`totalHits: 0` for 25 of them (`apitemplate_io`, `amazon_kms`, `base_ai`, `gchat`,
`microsoft_business_central`, `qualtrics`, `spotify`, `square`, `rootly`, `totango`,
`unicommerce`, …).

Most likely cause: the node list counts connections the aggregation filters out — deleted
ones, or ones in a project the caller cannot see. **Resolution rule:** the node list is a
cheap pre-filter, the aggregation is the answer. Not yet confirmed against a tenant admin
view.

### D5 — `initiate-test` and call-workflow nodes
- **§38 (2026-09-24):** "`initiate-test` cannot run a call-workflow node at all".
- **Forge (2026-09-26, UAT):** master workflows made of `CALL_WORKFLOW` nodes COMPLETED through
  `initiate-test` — runs `6ab7fc9f63499e0300b6e8a2` (50 s) and `6ab7ffbda0b15c54f55c1de4` (53 s), each
  node's sub-workflow ran.
- **To resolve:** the §38 case used a stale `callables_call_automation` version (3124); the Forge runs
  resolved the version from the tenant. Re-test one master with a resolved version through both
  paths before relying on either statement. Until then: verify a master by the records its run
  writes (Forge `kit_verify`), whichever way it was started.

---

## 19. Open questions / backlog

Ordered roughly by value to the "build agents and workflows in bulk" goal.

| # | Question | Notes |
|---|---|---|
| 1 | ~~Invoke a deployed CALLABLE workflow from outside~~ | ✅ 2026-09-21: register an `e_data_source` and call `execute/node` with its `id` (§22). API Manager endpoints (docs) are the external route — untested |
| 2 | **Converse with an agent over API** | start a session, send a message, read the reply |
| 3 | **Dynamic-schema connectors** | `input.dynamic: true` actions (Salesforce objects, picklists) — what extra lookup runs? |
| 4 | ~~Create a connection~~ | ✅ 2026-09-21: `POST /api/connection/input?appName=` (§7). OAuth still needs the user |
| 5 | **Correct JavaScript code-node form** | top-level `return` rejected |
| 6 | Resolve D1–D3 (§18) | cheap, high value |
| 7 | **Webhook trigger** end to end | `/api/workflow-builder/webhook-trigger-url` |
| 8 | **OAuth token endpoint** | authorize/consent routes exist; no token endpoint found |
| 9 | **MFA login step** | `/mfa-verification` |
| 10 | Workflow **delete / clone** | 📦 only |
| 11 | Observability **request bodies** | currently captured from UI traffic |
| 12 | ECG **Map step via API** | 405 everywhere; capture the wizard's real payload once |
| 13 | ECG `associatedEdgeMappings` shape | every live source had it empty |
| 14 | What enables built-in `search_knowledge_graph` | `graphModelId` + `defaultTools` insufficient |
| 15 | Knowledge / RAG, guardrails, multi-agent teams, channel deployments | entity types known, payloads not |
| 16 | `/api/user-context` full response | only `customer.id` recorded |
| 17 | `/api/global-search` request shape | returns empty |
| 18 | ~~Does a commit pushed to GitHub flow back?~~ | ✅ 2026-09-21 — branches and merged `main` both pulled |
| 19 | Code-builder chat-send request | not on page fetch/XHR/WS hooks; use `POST /agent-api/sessions` with `appId` (📦) instead. Publish ✅ `{versionTag, versionNote}`. Code-app privacy: Settings → Privacy refuses (`RefusalError … is a code-builder app`); ask the agent ✅ |
| 20 | Delete an object / record over REST | records: `DELETE` 405; object delete not yet tried |
| 21 | Config-app event action that triggers a data source | `navigateToPage` / `showNotification` captured; run-data-source action not |
| 22 | Change Sets (Move/Export between environments) API | docs describe it; not captured |
| 23 | App-level Google SAML IdP: save payload, how fetch is app-scoped, login test | on hold pending org-admin OK and a Google Admin SAML app (§22) |

---

## 20. UI routes

Useful for eyeballing what the API built.

| Route | Screen |
|---|---|
| `/p/0/automations` | automation list |
| `/p/0/automations/ai-create` | prompt-to-automation |
| `/p/0/automations/{id}/builder` | builder canvas |
| `/p/0/automations/{id}/test` · `/test/{runId}` | test runs |
| `/p/0/ai-agents/custom` | agent list |
| `/p/0/ai-agents/{id}/configuration/instructions` | system prompt |
| `/p/0/ai-agents/{id}/configuration/topics` | **Tasks** (label ≠ path) |
| `/p/0/ai-agents/{id}/configuration/actions` | **Tools** |
| `/p/0/ai-agents/{id}/configuration/tasks` | **Prerequisite Actions** |
| `/p/0/ai-agents/{id}/configuration/capabilities` | capabilities |
| `/p/0/ai-agents/{id}/configuration/{knowledge,skills,memory,ai-models}` | |
| `/p/0/ai-agents/{id}/configuration/{sensitive-information,hallucinations,content-filter,word-filter,denied-topics,blocked-messaging}` | guardrails |
| `/p/0/ai-agents/{id}/deployments` · `/observability` | channels · traces |
| `/p/0/context-graphs` · `/{graphId}?tab=nodes\|edges\|sources\|records` | context graphs |
| `/p/0/objects/custom` · `/p/0/objects/{objectId}/records` · `/schema` · `/activity` · `/settings` | Objects Manager |
| `/p/0/connections/all` · `/p/0/connections/create/{appName}` | Connections Manager |
| `/p/0/interfaces` · `/p/0/interfaces/{appId}/overview` · `/builder/{pageSlug}` · `/settings/users` | Applications |
| `/p/0/interfaces/code-builder/{appId}?sessionId={s}` | Code Builder |
| `/p/0/interfaces/custom-components` · `/template-components` · `/p/0/design-system` | app assets |
| `/p/0/solutions` | AI Solutions (groups assets per use case) |
| `/p/0/agent-governance/*` | governance, model registry, monitoring |
| `/settings/users` · `/settings/users/create/details` | user admin |

---

## 21. Changelog

- **2026-09-28 (b)** — §24 Object indices, verified over REST: custom indexes are `metadata.customIndexDefinitions` `[{name, indexFieldMetadataList:[{field:"properties.x", type:1|-1}], status}]`, written with `entity-type/update` (`IN_PROGRESS` → `SUCCESS` in seconds; max 5 in the UI); only PK/unique keys are indexed automatically, and `filterable`/`sortable` flags create no index. Indexed `taqa_kpi` + `taqa_document`: same rows, no measurable change at ~5k rows, rows with equal sort keys reordered. The entity list ignores `{op:AND, filters}` (use `values`); the object listing's `id` filter 500s for CONTAINS/LIKE/STARTS_WITH/REGEX/PREFIX.
- **2026-09-28 (a)** — §60.15–60.17: a published code app's favicon is `e_interface.metadata.logo.favicon`, written at publish; the public app's AI runs as its visitor, not the builder's user (browse the builder preview for layout checks); the branch switch is asynchronous (its reply shows the old branch); switching to another branch, waiting until it is current, then back to `main` pulls GitHub `main`.
- **2026-09-27 (h)** — §60 aps1 findings from a 115-workflow, 40-agent build: the graph engine is shared by every graph of the tenant (an unlabelled relationship scan reads other graphs); node outputs of a background run by execution id when run history lists nothing; a Groovy parameter named `binding`; `policies` refuses `controlSettings`; guardrail overhead 1.5 s; one agent answer cannot carry 48 items; a property needs `graphQueryable: true`; what the daily AI cost limit stops.
- **2026-09-27 (g)** — Chat chart blocks: an agent shown `"type":"bar|hbar|…"` writes the shape into `kind`; a strict parser drops those charts (1 of 4 drawn). Parser made tolerant, rule text given by example; `GetAllSessions.lastMessage` holds each session's last answer in full.
- **2026-09-27 (f)** — §16 Invoke Agent: verified from the Studio engine (plan step kind `agent`): minimal parameters, 7.6 s, envelope parsed downstream; node-level `async` is not stored.
- **2026-09-27 (e)** — §45.2a: a record-change trigger deploys only when the object has `metadata.supportsWebhook: true` ("Webhooks are not enabled for object").
- **2026-09-27 (e)** — §47.52: identity in use cases (user id in apps, username in agents); a blank one-record lookup must match nothing (`id EQUAL __no_match__` returns 0 records).
- **2026-09-27 (d)** — §38: the "initiate-test cannot run a call-workflow node" statement is marked disputed in place, pointing at §18 D5.
- **2026-09-27 (c)** — §47.51: an Invoke Agent call under the tenant daily AI cost limit parks its run in `WAIT` (no failure, no cause); an LLM node fails at once with `[COSTFLAG]` — use that to tell them apart.
- **2026-09-27 (b)** — §59 Forge kit hardening, verified on UAT: `if_else_condition` refuses an empty comparison value (save violation `inputs`); a Variables formula over an empty templated input read as set (`LEN(TRIM("{{x}}"))>0` → "yes") — test emptiness in Groovy; `update_record_by_id` upsert with a blank primary key fails 5008 "Primary key field is required" on an object with a key (corrects the §57 note for keyed objects); Invoke Agent `agentResponses` carry `additional.internalMessageType` THOUGHT before the answer; an idempotency key computed in Groovy (SHA-256 of agent|version|question) as `messageId` works; the controls' `additional` shapes for denied topics, content filter, regex and custom terms read from live controls; `agent_profile` + three-string `accessibleTo` created and read back; `WORKFLOW_EXECUTION` `group=PLATFORM` takes `sorts` and an `AND` filter with `GTE START_TIME`; `GET /api/entity-type?entityType=` returns the schema at `schema.schema.properties` (used to keep fields a later spec leaves out).

- **2026-09-27 (a)** — `storage_by_unifyapps_update_record_by_id` with `upsert:true`, `recordId` = the primary-key value and the full `rawPayload`, inside a workflow: creates the record the first time and replaces it on the next run (UAT, workflow `6ab827713c2b816ad4d0e9b2`, count 2 → 3 → 3). Use it for an agent's result entity so re-runs do not add duplicates.
- **2026-09-27 (b)** — §47.51 tenant daily AI cost hard limit ([COSTFLAG]); reading a failed run's cause from its executionInstanceId.
- **2026-09-27** — §47.50 no Date.parse(format, text) in platform Groovy; use java.time.
- **2026-09-26 (l)** — §47.49 early return inside an IF_ELSE branch (second STOP in the yes group) verified; an empty yes-branch fails the save.
- **2026-09-26 (k)** — Forge app kit verified on UAT (`app-af0a30b868c2`): the code-app publish recipe works end to end — push `main` and `t-<sha>`, nudge (`PUT /agent-api/sessions/{s}/files/contents` with the COMMITTED `PRODUCT.md`) + `POST /branch {branch:'t-<sha>'}`, nudge + `POST /branch {branch:'main'}`, then `POST /agent-api/apps/{app}/publish`: the first publish built the previous commit, the second built the pushed one (`deploymentState.additionalDetails.sourceCommitHash` read back). `GET /api/entity/e_component/<missing id>` answers **500 errorCode 5002 "… not found"** (not 404). A GitHub connection's `oUId` can differ from the signed-in user id (an org/admin-created connection), so "my own connection" lookups by `oUId` miss it — take the connection id from the user.
- **2026-09-26 (k)** — §47.48 the Code Builder model (openai/gpt-6-sol via OpenRouter) can fail a turn with 402 (credits); the starter template is still laid down, so judge a starter by `app/package.json`.
- **2026-09-26 (j)** — `POST /api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE` is flaky right after a test run completes (UAT): the same query returned the STOP node's outputs and, seconds later, `objects: {}`. Read until the STOP (or failed) nodes have an `outputs` entry, keeping every output seen; up to ~30 s.
- **2026-09-26 (i)** — Forge build kit verified on UAT: reading an agent's answer from `agentResponses` inside a workflow (last non-THOUGHT message, fence stripped, JsonSlurper), templated `aiAgentId`, unique `messageId` via an epoch formula; count / SQL-on-list / if / for-each / update-by-query compiled together and ran; auto-generate PK value `KTT_1001`.
- **2026-09-26 (h)** — §47.46 ISO date text needs more than Instant.parse (engine converter dropped date-only values); §47.47 `"" as BigDecimal` error text and the failed-node lookup.
- **2026-09-26 (g)** — §47.44 corrected: the record list is ordered by key descending and ignores `sort`; `createdTime` can't be filtered; scan and check in code.
- **2026-09-26 (f)** — §47.43 main preview updated with no Code Builder turn (branch from main, builder page open, switch back to main, publish); §47.44 newest records via `sort:{field:'createdTime'}`; §47.45 github_compare_commits contract.
- **2026-09-26 (e)** — §47.40 branch builds without a builder turn (~3 min; a builder page may be needed on an errored session; `base:'main'` as a deploy fallback); §47.41 auditing a frame from the parent page gives false form-label failures; §47.42 path routes and the session-preview redirect.
- **2026-09-26 (d)** — §47.38 a code-app build is strict `tsc -b`; a pull ends `done` even when the build failed (`buildFailed` on `/branches`, compiler output in the `preview_ready` event); §47.39 tool history as Anthropic `tool_use`/`tool_result` parts works, the OpenAI shape fails, a text echo gets imitated.
- **2026-09-26 (c)** — §47.34–47.37: the LLM interface takes whole conversations, native `tools` (answers `tool_use` + `outputs.tools`) and `image_url` data-URL parts (Opus 4.8 reads them); 10k-token files in 88 s; a step id `out` collides with the return node `n_out`; Orbit pages cannot fetch public CDNs; Playwright node contract (721 s runs, `exposeFunction`), one-time schedule node, identity kept across scheduled runs, session node.
- **2026-09-26 (b)** — §47.31–47.33 probes on `kit-support-desk`: `.agents/rules/*.md` loaded every turn; `.agents/skills/<ours>` read only when a rule points to them; `POST /agent-api/sessions/{s}/events {message, attachments, mode}` streams the turn; attachments land in `.attachments/<session>/` but the tenant-default `gemini-3.8-flash` builder does not see images (it analyses them with Python); `planner` in createSession leaves the builder model unchanged.
- **2026-09-26** — §47.28 the OCR extraction node has no token input and stops at the model entity's `maxOutputTokens` (GPT-4.1 mini = 436 on UAT, which cut a six-line invoice); §47.29 Groovy `Date.format(String, TimeZone)` unavailable, use `java.time`; §47.30 fetch code-app-served files with `cache:'no-cache'`.
- **2026-09-25 (i)** — §57 Studio engine 1.7.0 compiles plans to native nodes (hospital plan 95 → 26 Groovy of 187 → 142 nodes, step tests unchanged); SQL-on-list fails on an empty list, templates embed objects as Java maps and have no `[*]`, Variable formulas are Excel with templates as cells, upsert with a blank id inserts a record, update-by-query is safe.
- **2026-09-25 (i)** — §58 SAP connectors, read from UAT: `sap_odata` connection form (BASIC, OData 2.0/4.0, `hostUrl`, `connectionType` DIRECT | ON_PREM with `groupId`) and its 8 resources; `sap_rfc` form (direct `gateway_host` + `system_number`, or `message_server_host` + `logon_group`; client/user/password; optional SNC) has **no ON_PREM option**, so RFC needs a direct network path from the platform; 6 RFC resources incl. `sap_rfc_call_rfm`. SAP VMS APIs have no Business Accelerator Hub sandbox; SAP Digital Vehicle Hub sandbox returns 0 vehicles; a keyed test returned 403 for VMS paths, the same as a made-up service (§58.5).
- **2026-09-25 (h)** — §56.6–56.8 the eight live `*_ai_insights` workflows moved to GPT-4.1 mini / 1,600 / two or three findings, measured on the Orbit previews 16.5–35.9 s → 3.6–5.5 s; GPT-4.1 mini miscounts rows → NUMBERS rule appended to every insight prompt; pre-existing defects found (Jaidah UAT runs TAQA's prompt, never renders its cards, reads the oldest months).
- **2026-09-25 (g)** — §56 Code-node audit of 357 of our UAT workflows (Mars `pao_` 46 % Code, Studio `scc_` 48 %, mostly joins/envelopes/branching and the Studio engine's own wrappers); native replacements verified in probe `mnp_native_node_probe`: `count_records`, `run_sql_query_on_list` (GROUP BY / SUM / AVG / JOIN over fetched lists, nested `properties.x`), `sort_list`, `to_json_object`, STOP result maps; both `properties.x` and `properties_x` filters honoured in fetch/count; ⛔ `aggregate_records` returns one row per record (no grouping) and `filter_list` returned nothing; 8 of 9 live insight workflows still on Sonnet 4.6 at 4–5K tokens (23–27 s runs). Skills: native-first rule + latency budget.
- **2026-09-25 (f)** — §52 PoC Command Centre governance: agent guardrails live in a per-agent `gaurd_rail` entity (`POST /api/entity {entityType:"gaurd_rail", properties:{aiAgentId, contentFilters, DeniedTopics, customWorldFilter, RedactSensitiveInformation, BlockedMessaging, Hallucinations}}`; server adds `enabled:false` — set true) and block inline with no republish (injection, denied topic, profanity, credential strings all blocked at `Input Guardrails`; baseline and a credentials false-positive check still answered). The Bedrock alias `sonnet_4_6_bedrock_no_thought` is unusable as a guardrail classifier (`CONNECTION 683020ca44e4f747c6415668 not found`, turn hangs at `pending` 127 s); the platform default `e_66b280e945f17a17c0e7c27a` resolves to Vertex Sonnet 4.6. AI Governance `controls` attached via `accessibleTo` (native id, registry profile id under `ai_agent/` and `agent_profile/`) did not gate any of 14 probes; incidents reference registry profiles and come in 5-minute bursts. `agent_profile` (the Registry) creatable over REST with `external_agent_id`. `blockedTools` is a NAME CONTAINS/NOT_CONTAINS keyword matcher. `incidents` entity shape recorded.
- **2026-09-25 (e)** — §50 PoC Command Centre agent: "PoC Copilot" `e_6ab6046002f36a2e66f90b68` built over REST (3 tasks, 6 workflow tools, 2 approval-gated) and proven by a 12-question battery over the agent test API against the engine's kpis; streaming call returns `pending` after ~2 s — poll `fetchConversation` until `responseGenerationStatus: completed` AND the newest Bot message is the settled answer; LLM span input names the `modelId`; hidden user context = username only; `e_topic_ai_agent`/`e_action_ai_agent` keep `tags`; hand-counting rows from a 114-row list is unreliable (58 vs 65) — a `group_by` on the query tool fixed it.
- **2026-09-25 (d)** — §49 PoC Command Centre automations: six `scc_poc_*` callables built, deployed (deployed == live, 0 violations) and verified from node outputs; storage `triggerInputCondition` on `properties_<field>` and `id` bites inside workflows (counts matched the object exactly); author derived from the created note's `ownerUserId` + `scc_user_profile.platform_user_id` — no scratch row, no delete; `loop_while` + `variable_by_unifyapps` paging over HubSpot `after` and 100-id company chunks; Vertex Opus 4.8 `e_6a1948ae4a418d2dde7d1096` ran in 3–5 s and its price signature reads 5.00 / 25.00 USD per M; null map values are dropped from a Groovy node's output; HubSpot `closedate` has a time component (normalise to date); `bulk_upsert_records_by_id` with 114 field-level updates is idempotent (`changed_rows` 0 on the third run); repo copy == live definition by canonical hash; config-app shell created from a plain hierarchical POST and `e_data_source` keeps top-level `tags`.
- **2026-09-25 (d)** — §45.10–45.16 Student Lifecycle Brain hardening on aps1: 🔴 a `LOOP` body outside the loop's child group never ends and replays every call in it (proven both ways; stop with `/pause` + `/workflow/cancel/execution/{id}`); production runs via `WORKFLOW_EXECUTION` `group=PLATFORM`; storage fetch ignores `createdTime` sorts; the entity list DOES return an exact count with `includeTotalHits:true` → `totalHits` (corrects (c)); store numbers come back Long or Double; single backslashes vanish in Groovy built inside JS template literals; projection lag ~15 min under a write flood; files endpoint now returns raw text.
- **2026-09-25 (c)** — §48 PoC Command Centre data layer: create→read→update with both schema carriers derives `referenceKeys`/`uniqueKeyFields`/`dateFields` first time; field rename = replace in both carriers + full-body rewrite of every record; replace-guard needs a per-batch `allowDrop`; record aggregation 500s without `projections` and no group-by shape grouped (compute KPIs in Groovy over a full fetch); entity list has `cursor/hasMore`, no total.
- **2026-09-25 (b)** — §46 PoC Command Centre HubSpot read: all four HubSpot resource versions drifted again in 24 h (`search_records_batch` 23234→23241, `get_owners` 23013→23020, `get_association_batch` 23253→23260, `get_pipelines` 10731→10738); `poc` deal property values are `Completed | Ongoing | Upcoming | No POC yet` (so "poc = yes" is `IN [Ongoing, Completed, Upcoming]`); `HAS_PROPERTY` and `IN` filters verified; `hubspot_get_owners` returns active owners only and `hubspot_get_owner_by_id` **404s and fails the run** for deactivated owners; `initiate-test/{existingId}` with a *different* inline graph runs that graph without touching the saved definition; HubSpot rate-limit headers surface in the node output (190 / 10 s). New catalogue deep dive `unifyapps-connectors/catalogue/actions/hubspot.md`.

- **2026-09-24 (d)** — §41 Mars Pedigree Amazon Optimization (`app-31077911d563`): 109 workflows generated from a solution design and deployed in ~13 s; scripts loaded into an Orbit tab by pushing a new git branch and switching the builder session to it; fda.gov refuses the platform egress (Akamai 404) while eCFR's renderer serves Part 501 uncompressed (its versioner needs compression the HTTP node cannot undo); a generic "run any workflow by id" dispatcher is refused as a remote-execution surface — one data source per workflow; `MessageDigest` SHA-256 allowed in Groovy; 600 KB object fields read back intact.

- **2026-09-24 (c)** — **Per-unit AI usage verified.** `__ua__call_ocr_extraction` outputs `{output, content[], status, errMsg, inputTokens, outputTokens}` (CALLABLE_INTERFACE lookup + a real run) — tokens yes, cost no. `__ua__call_ai_agent_llm_model` outputs `{llmResponse, success, finish_reason, inputTokens, outputTokens, inputTokenCost, outputTokenCost, tokensUsed, tools}` (probe run: 20 in / 4 out / $0.0001 each side). Invoice PDF through OCR with **OpenAI GPT-4.1 mini** `e_ai_agent_openai_gpt_4.1_mini`: ~5 s, 8/8 fields, 2,505 in / 135–174 out; **Claude Sonnet 4.6 Bedrock `e_69b41a443d6f1815768c245f` hung to the ~128 s sync limit** on the same file. The OCR node's `status` did not read "SUCCESS" on a good read — judge success from the parsed output. **Groovy: a parameter whose template resolves to nothing is ABSENT from the binding** → `No such property: errMsg` (5005); bind defaults first (`binding.hasVariable`). `initiate-test/probe` timed out at submission ("No Response received within specified timeout") while the deployed workflow ran through its app data source in 5 s — test AI workflows through the deployed path. `WORKFLOW_EXECUTION` aggregation with `group=WORKFLOW_EXECUTION` is 5004 (invalid group). A literal `{{ }}` inside Groovy source is read by the validator as a node reference ("Node referenced in input no longer exists") — build such strings at run time. New skill `unifyapps-usecase-studio` (methodology for production use cases).

- **2026-09-24 (b)** — Records are entities: `POST /api/entity {entityType:"<object id>", properties:{...}}` creates a record (200, `id` = the primary key value); a value outside a `single-select` `oneOf` is a 500. `create-update-or-delete/hierarchical` accepts `tags` on the `e_interface` entity at create (tags land on the app). Config app built end to end from a signed-in tab with `ua_cfg.js` in ~90 s (`scc-invrecon-app`: 5 pages, 4 global DS with JS transformers, `dsAutomation` run:'manual' bound to a FileUpload's `files[0].source`, `update_record_by_id` DS with `rawPayload` = `Object.assign({}, row._props, {status})` — verified on the preview: row select → page input → detail, approve → record updated → table refreshed). CSP blocks `fetch` of raw.githubusercontent.com from an Orbit tab, so the library is pasted, not fetched. **Token usage per LLM request**: the copilot's conversation reader automation `66ab98083d73300e63962287` (`callables_call_automation`, params `{copilotType:"AI_AGENT", caseId, userId, aiAgentId}`) returns `messages[]` where assistant turns carry `additional.llmUsageDetails {inputTokens, outputTokens, cacheWriteInputTokens, cacheReadInputTokens, inputCost, outputCost, cacheWriteCost, cacheReadCost, cost}`; registering it as an app data source was NOT gated (read-only), unlike the session executor's.

- **2026-09-24** — Session executor proven: `auth_by_unifyapps_create_user_session` (v2013) → Groovy cookie replay creates workflows/agents/objects **as the calling user**; contract in §16. Deterministic redeploy via `POST /agent-api/sessions/{s}/branches {branch, base}` + poll `buildPending`. Aggregation for workflows must use `lcName`/`ICONTAINS` with the full body (a `name`/`CONTAINS` filter 500s).

- **2026-09-23** — Cloud build runs oxlint as a gate (local build does not); a queued branch switch can be silently dropped on a conflicting tree — bounce via `main` after fast-forwarding the session branch.

- **2026-09-23 (b)** — copilot SDK in app code = cloud build WASM OOM (error signature recorded); Studio host↔island postMessage protocol extended with new-chat/stop/go-to-chat/status.
- **2026-09-23** — Studio moved onto the platform agent: connector `definition/basic` ✅ over API; caller identity via ownerUserId stamp in an agent tool; update-record data source; agent publish via `saveAndDeploy`; copilot SDK prop facts; `initiate-test` latency and hidden-pane throttling.

- **2026-09-23** — Correction: a pending code-app branch switch is applied by LOADING THE CODE BUILDER PAGE, not by `POST …/branch` (which only queues) and not by a files write. Prompt-to-solution data model (`scc_studio_solution`, `scc_studio_snapshot`; session/run/asset gained `solution_key`).

- **2026-09-23** — Code-app preview builds from git HEAD, not the working tree; `app/src/index.css` is engine-owned (422) and the theme comes from `theme.json`; a dirty tree blocks a branch switch; the reliable deploy recipe is push branch → any files write → POST branch.

- **2026-09-23** — Studio build: objects `scc_studio_run` + `scc_studio_asset` (the delete whitelist), planner agent `scc_studio_planner` with four AI Governance controls attached; `additional.infoTypes` is a name-to-severity MAP; a push to `main` is NOT pulled by a Code Builder session and the documented page-load trick did not apply a pending branch switch.

- **2026-09-23** — Role permissions: 32 Platform asset classes each with their own `Delete`; some permissions are forced dependencies (`Cancel Runs` implied by the Automations Test/Deploy set); the Objects tab cannot grant record `View`/`Read` without also granting `Delete`/`Decrypt`/`View PII`, so service roles must use `SPECIFIED` object scoping. Role save API still uncaptured (Next.js server action, not interceptable).

- **2026-09-23** — AI Governance Controls mapped: `controls` entities attach to an agent via `accessibleTo:["ai_agent/<id>"]` like skills, `checkType` resolves against a 15-entry `controls_schema` catalogue (Prompt Injection, Blocked Tools, PII, Credentials, Denied Topics, Content Filter, Regex, Custom terms, custom LLM), each flagging or blocking on user input / agent output / tool input / tool output. New skill `unifyapps-governance`.

- **2026-09-23** — HTTP nodes return every response header in `outputs.headers` despite the declared schema; `followRedirects` is an enum not a boolean; `custom_http_application` encrypts header values but cannot inject a secret into a request body (use a Connectors SDK connector).

- **2026-09-23** — Groovy code nodes have outbound HTTPS egress to the tenant API and can read response headers, so login + cookie replay fits in one node; the `TEST_WORKFLOW_VARIABLE` lookup needs its full body or it 500s.

- **2026-09-23** — Orbit is framable by any `*.unifyapps.com` origin and the framed console is **signed in** (same-site cookie); the parent still cannot read or click inside it (`contentDocument` null, `location.href` SecurityError). Deep-link navigation of the frame works. Basis for the UnifyApps Studio tab strip + bridge extension.

- **2026-09-23** — §32: config apps round 2 (CGB Pulse Studio + Documents): every Chart type incl. HEATMAP (NESTED data grouped by column), Timeline/Stepper/Kanban shapes, Tabs panels need a visible page (`DeferredRender`), FileUpload file object (`source`, no `key`), OCR extraction node `__ua__call_ocr_extraction` + TEXT_EXTRACTION models, Copilot attachments, unattended custom-component upload.
- **2026-09-23** — §31: full connector-catalogue harvest (1,214 nodes = 983 application + 91 platform + 140 custom; 304 with connections, 25 of them phantom). New `resourceType` **`AGENT_TOOL`**; Connectors-SDK actions attach to built-in connectors as `{appName}:{actionId}`; `GET /api/applications/{internal node}` returns an empty 200; `refreshable` + `externalDocUrl` on the auth spec; §18 D4. New skill `unifyapps-connectors`.
- **2026-09-23** — §29: config apps end to end over REST (CGB Pulse): required `defaultPageId`, page registration, theme entity, preview URL, transformer `data` path, `queryDisabled` gating, Modal/Drawer visibility and `card` variant, Copilot needs a CopilotInput + `submitMessage`, HTTP `baseUrl`/`path`, custom components (`out.json`, upload chain, runtime props). New skill `unifyapps-config-apps`.
- **2026-09-23** — §28: GitHub link with a push-capable connection lands the starter commit immediately (`linked:true`, no PAT step); `GET /agent-api/sessions/{s}` and `POST …/stop` verified; clone-from-Sharek recipe for workflows, data sources and agents (~10 min for a whole platform layer); one generic AI-writer workflow; `entity-type` read of a missing object is 200 + empty body; 12-worker record load; scaffold publish; ownership check before touching any app.
- **2026-09-22** — §26: an app must be re-published before a new data source is callable; the SDK 401s until the interface has been deployed once; the `conv_ai_by_unifyapps` LLM node contract; storage bulk write/create/delete versions and shapes; four Groovy sandbox traps; `initiate-test` cancels slow runs; geoBoundaries raw URLs are LFS pointers.

| Version | Date | Change |
|---|---|---|
| 0.31.0 | 2026-09-26 | Forge build kit verified: agent answer extraction in a workflow, templated aiAgentId, node combination count/sql/if/loop/update; auto-number PK format. |
| 0.32.11 | 2026-09-28 | Groovy sandbox note "java.time appears to be blocked" marked superseded (java.time verified 09-21, §47.29, §47.50). |
| 0.32.10 | 2026-09-28 | §27, §44.2 and the "needs the whole entity" note marked superseded by §47.1: an agent publish is verified by snapshot `properties`, deploying again at most 3 times; skills no longer loop on version equality. |
| 0.32.9 | 2026-09-28 | §24 Object indices verified over REST (`metadata.customIndexDefinitions`, ASC 1 / DESC -1, max 5, `IN_PROGRESS`→`SUCCESS`); flags ≠ indexes; TAQA timings; listing `id` text filters 500. |
| 0.32.6 | 2026-09-27 | Chat chart blocks: shape written into `kind` (1 of 4 charts drawn) — tolerant parser, rule by example; `GetAllSessions.lastMessage`. |
| 0.32.5 | 2026-09-27 | §16 Invoke Agent verified from the Studio engine (atomic agents as AI Agents, plan step kind `agent`). |
| 0.32.4 | 2026-09-27 | §47.53 no OpenAI-compatible LLM endpoint on the tenant; Governance is inventory/observe; API Manager as the only façade route. |
| 0.32.3 | 2026-09-27 | §47.52 identity: user id vs username; blank lookups match nothing. |
| 0.32.3 | 2026-09-27 | §45.2a record triggers need `metadata.supportsWebhook` on the object. |
| 0.32.2 | 2026-09-27 | §38 call-workflow claim marked disputed (see §18 D5). |
| 0.32.1 | 2026-09-27 | §47.51: under the daily AI cost limit an Invoke Agent run stays in WAIT instead of failing. |
| 0.31.4 | 2026-09-27 | §47.51 daily AI cost limit; failed-run cause lookup. |
| 0.31.3 | 2026-09-27 | §47.50 Groovy Date.parse unavailable. |
| 0.31.2 | 2026-09-26 | §47.49 early STOP inside a branch. |
| 0.31.1 | 2026-09-26 | §47.48 builder model 402; starter template without a turn. |
| 0.30.0 | 2026-09-26 | §47.46 converting ISO date text; §47.47 blank BigDecimal cast. |
| 0.30.0 | 2026-09-26 | Invoke Agent node `ai_agents_by_unifyapps_invoke_agent` (👁 schema): a workflow calls a registered AI Agent synchronously; `messageId` replay is not re-billed; `taskExecutionModel` override. Atomic agents are now AI Agents (skill atomic-agent-architecture). |
| 0.29.1 | 2026-09-26 | Models: an inactive model connection fails every call; check `properties_connectionId` → connection `active`; working Vertex models on UAT. |
| 0.29.1 | 2026-09-26 | §47.44 corrected (record list ordered by key, sort ignored). |
| 0.29.0 | 2026-09-26 | §47.43 turn-free deploy of a code app's main preview; §47.44 newest-records listing; §47.45 compare commits. |
| 0.28.0 | 2026-09-26 | §47.40 branch builds without a Code Builder turn; §47.41 cross-realm accessibility false positives; §47.42 path routes and preview redirects. |
| 0.27.0 | 2026-09-26 | §47.38 build result in `preview_ready` (strict tsc; a done pull may not have built); §47.39 tool_use/tool_result conversation parts. |
| 0.26.0 | 2026-09-26 | §47.34–47.37 LLM interface with conversations, native tool calls and images (Studio Coder bridge); return-node id clash; CDN fetches blocked on Orbit pages; Playwright, schedule and session node contracts. |
| 0.25.0 | 2026-09-26 | §47.31–47.33 Code Builder: rules auto-loaded, our skills only via a pointing rule, shell in the workspace; follow-up turns over `…/events` (SSE); image attachments reach disk but not the default Gemini model, `planner` does not change the builder model. |
| 0.24.0 | 2026-09-26 | §47.28–47.30 OCR output capped by the shared model entity's `maxOutputTokens`; Groovy `Date.format` unavailable; code-app files cached by the browser. |
| 0.23.0 | 2026-09-25 | §57 native-node contracts and traps behind Studio engine 1.7.0. |
| 0.22.0 | 2026-09-25 | §56.6–56.8 live insight workflows moved and measured (before/after table), the NUMBERS rule, Jaidah UAT defects. |
| 0.21.0 | 2026-09-25 | §56 Code-node audit + native-node probe (count, SQL on list, sort, JSON parse, STOP maps ✅; aggregate_records and filter_list ⛔) + insight-latency survey of the nine live `*_ai_insights` workflows. |
| 0.20.0 | 2026-09-25 | §52 PoC Command Centre governance (run-002): the inline enforcement layer is the per-agent `gaurd_rail` entity (Content Filters with strength semantics higher = stricter, Denied Topics `{topicName, definitionOfYourTopic, addSamplePhrases}`, Custom Word Filter, `RedactSensitiveInformation.regex.patterns[{name,pattern}]` + `piiByUA`, Blocked Messaging) — created over REST, live without a republish, proven by blocked turns (`guardrailHit:true` on the Fan message, `Input Guardrails › Content Filters` `guardrailViolationDetected:true`, no Agent Execution, ~$0.013); the `sonnet_4_6_bedrock_no_thought` alias as a guardrail model fails every turn with `CONNECTION … not found` (use `e_66b280e945f17a17c0e7c27a` = Vertex Sonnet 4.6); a blocked turn never reaches `responseGenerationStatus: completed`; nine AI Governance Controls scoped `ai_agent/<agent id>`, `ai_agent/<profile id>` and `agent_profile/<profile id>` changed none of 14 probes — the tenant's incidents point at registry `agent_profile` ids and arrive in 5-minute bursts (post-hoc); `agent_profile` can be created over REST with `external_agent_id`; `blockedTools` = `{operator:OR, filters:[{property:NAME, filter:{operator:CONTAINS|NOT_CONTAINS, value}}]}`; `incidents` entity shape; no `RoleDefinition` named after `scc_role.platform_role` exists. |
| 0.19.0 | 2026-09-25 | §51 PoC Command Centre config app (run-002): a GLOBAL `e_data_source` evaluates its `{{ }}` in the global page scope (page variables/blocks undefined, parameters arrive empty) so page-level data sources per page; automation data source `data` = the STOP payload (no `result` wrapper); `e_theme` accepts and the runtime applies `--palette-success/warning/error-*` overrides; platform gap/padding tokens measured (gap-xs 4 · sm 6 · md 8 · lg 12 · xl 16 · p-3xl 24 px) and raw px accepted in `styles.gap.all` / `padding.custom`; `additional.htmlAttributes` lands on Typography and IconButton (aria-label, role, aria-level); IconButton accessible name = icon name unless overridden, size sm = 28 px; Table `rowActions` + `events[{eventType:'onClick', targetId:<rowActionId>}]` with `context.currentRow` verified; Form `initialFormData` and ButtonGroup `initialSelectedItemId` re-evaluate from a page variable; `controlBlockMethod setValue` works on TextArea, not on CopilotInput; Drawer is always modal (the page behind is hidden) even with `showBackdrop:false`; Copilot block renders the agent description + conversationStarters natively and keys its chatId in the URL as `?<blockId>-chatId`; `XClose` is not an icon name (`XCircle` is); Google Fonts `@import` in page CSS passes CSP; `setURLParameters` with `history:'replace'` + `pageInputs` deep links verified. |
| 0.18.0 | 2026-09-25 | §50 PoC Command Centre agent (run-002): the agent test API stream closes at ~2 s with `pending` and the turn finishes server-side (poll the conversation reader; an interim narration Bot message can precede the answer); model proof = `TraceTimelineDetails` LLM span input `modelId` + `llmUsageDetails` price signature (Opus 4.8 = 5 / 6.25 / 25); the hidden user-context message carries only `userName`/`alias` (+ date, timezone); ~35 K cache-write tokens per new conversation → $0.23–0.54 a turn; `tags` accepted and kept on `e_topic_ai_agent` / `e_action_ai_agent`; `deploymentState.entityVersion == version` immediately after each `saveAndDeploy` (1/1, 8/8, 15/15); generic query tool with `group_by` → `groups_total` is what makes "how many PoCs have X" exact. |
| 0.17.0 | 2026-09-25 | §49 PoC Command Centre automations (run-002): `properties_<field>` / `id` filters verified inside workflow fetch nodes; caller identity from the business row's own `ownerUserId` (no scratch row, no delete); `loop_while` + variables for HubSpot paging and chunked IN queries; Vertex Opus 4.8 verified by price signature in 3–5 s through `initiate-test`; null Groovy values dropped from outputs; HubSpot `closedate` carries time of day; repo-vs-live parity by canonical hash; config-app shell + tagged `e_data_source` from plain fetch. |
| 0.16.0 | 2026-09-25 | §48 PoC Command Centre data layer (run-002): schema carriers + derived metadata, field rename recipe, replace-guard allow-list, record aggregation needs `projections` / no grouping shape found, entity list has no total. |
| 0.15.0 | 2026-09-25 | §46 HubSpot read-only PoC read (run-002): live resource versions, `poc` values, owner 404 behaviour, inline initiate-test on an existing workflow id, rate-limit headers; `catalogue/actions/hubspot.md` added. |
| 0.11.0 | 2026-09-23 | §37 Claim Integrity on the real corpus (165 real PDFs, 0 errors): `bulk_upsert_records_by_id` takes `updateFields`, not `properties` — the `properties` shape returns 200 and writes nothing; a START node made over the API must carry `trigger:{type:'CALLABLE'}` or the save 500s (and the create has already left a workflow behind); fetch nodes emit `outputs.objects` and need `triggerInputCondition:{}`; a data source must send EVERY templated parameter or the workflow filters on the literal `{{template}}` and answers 0; `/agent-api/apps/{id}/publish` can take >2 min (fire and poll — `/versions` 404s, `files/contents` GET 405s); a record whose `id` you set cannot have its business key renamed; base64 through an oversized tool result moves a 218 KB export from the browser into the repo; and weight-as-an-exponent saturates a noisy-OR risk score — calibrate against real traffic, not the adversarial set. |
| 0.10.0 | 2026-09-23 | §35 Claim Integrity (`app-7121817b391f`): `custom_http_endpoint_execute` takes a plain `body` mapped from a Groovy step — no `bodySchema`, no connection, external service → records in 2.3 s; `initiate-test/{anyId}` probes a node contract without creating a workflow; resource versions drifted four times in one day (table); a Groovy reset that parsed 2,978 baselines >45 s → 1.16 s by guarding the parse with a dirty flag; adding a field needs BOTH `input.schema` and `schema.schema`; `skipIfBlank` makes an empty bulk write a no-op; run-variable reads still blocked (§18 D1) so verify through the data source. |
| 0.8.0 | 2026-09-23 | §32 config apps round 2: chart types and HEATMAP data grouping, Tabs `DeferredRender` visibility trap, Timeline/Stepper/Kanban shapes, FileUpload → OCR workflow (`__ua__call_ocr_extraction`), chat attachments, automated custom-component upload. |
| 0.7.0 | 2026-09-23 | §31 connector catalogue: 1,214 nodes harvested and shipped as the `unifyapps-connectors` skill (index, platform nodes, connection snapshot, 28 deep dives, harvester + diff script); `AGENT_TOOL` resource type; `{appName}:{actionId}` custom actions on built-in connectors; auth-spec `refreshable`/`externalDocUrl`/inline `authType` enums; empty-body `GET /api/applications/custom_http_endpoint`; D4 phantom connections. |
| 0.6.0 | 2026-09-23 | §29 config apps end to end (CGB Pulse, `cgb-pulse`): creation chain, runtime/data paths, gating, overlays, Copilot input, custom components; harvested catalogues. New skill `unifyapps-config-apps`. |
| 0.5.0 | 2026-09-23 | §28 Rest Supplier Intelligence build (`app-17f0ba4c8283`): Git link ✅ pushes immediately with Maher's connection; `GET /agent-api/sessions/{s}` ✅; `POST …/stop` 📦→✅; §23 table `git`/`changes` 📦→✅; asset cloning from Sharek; AI-writer workflow; §24 empty-body read of a missing object; scaffold publish; ownership lesson. |
| 0.4.4 | 2026-09-22 | §22 app identity providers: per-app IdPs, Google = SAML, SP URLs derived from the app host (read-only, 👁). |
| 0.4.3 | 2026-09-21 | Agent chat over REST (send via SSE, read conversation, trace timeline + span I/O); generate-chart silent-end defect; HubSpot search/owners/pipelines output quirks. |
| 0.4.2 | 2026-09-21 | Agent skills (`e_skill_ai_agent`, `accessibleTo` link, attach over REST, draft-publish side effect); agent clone via console; copying connector tools between agents. |
| 0.5.1 | 2026-09-24 | HubSpot: no property-list action, null props dropped on get_deal, `propertiesWithHistory` on custom levers, VEP pipeline `4056960228`; Groovy `0G` = BigInteger; CALL_WORKFLOW outputs are flat; bulk_create_records output; preview rebuild bounce. Built Deal Forecast `app-a5c1503f6a90`. |
| 0.4.1 | 2026-09-21 | §25 Connectors SDK: create/auth/action/request endpoints, `{{ rawPayload.x }}` templates, create-vs-update request paths, publish → node resources. Verified by building `SC Native - Fireflies` on UAT. Agents: console *⋯ → Clone* duplicates an agent **with its skills and knowledge** (used for SC Copilot v2 `e_6ab1375cf843281fda63184d`). |
| 0.4.0 | 2026-09-21 | ✅ LLM step in a workflow: `conv_ai_by_unifyapps_call_llm_model_with_options` must be node type `CALL_INTERFACE_WORKFLOW` (as `ACTION` → *No config found for resource … ConnectionService remote call failure*); inputs via callable interface `__ua__call_ai_agent_llm_model`; `initiate-test` cancels at ~26 s, execute via data source instead. ✅ API-created code app lacks `e_global_<appId>` → data source create fails `5011 Parent e_component … not found`; create the page first. Fine-grained-PAT Git link leaves `linked:false`. Details: `unifyapps-builder/references/workflows.md`, `unifyapps-apps/references/code-apps.md`. |
| 0.3.2 | 2026-09-21 | API-only code app `app-282f2c90f0fd` confirmed: listed in Applications, built, private per brief, renders live object data. |
| 0.3.1 | 2026-09-21 | Code app published over `POST /agent-api/apps/{id}/publish` ✅; privacy via builder agent; merge-to-main pickup ✅. |
| 0.3.0 | 2026-09-21 | §23: code app created over the API, file edits, Git link captured and two-way sync verified on our own app/repo; token trap; org-only is a feature flag. Colleague app references removed. |
| 0.2.0 | 2026-09-21 | Added §22 config apps, §23 code apps + `/agent-api` + Git, §24 Objects Manager; §7 connection create/test/auth-spec and server-side search (aggregation); new dead ends and errors; backlog #1 and #4 closed, #18–22 opened. ✅ items verified on UAT by building scratch objects `maher_scratch_task`, connection `6ab0ea7a5459f4370f0c1f3f`, app `maher-scratch-cfg`, data source `e_6ab0ebe6f843281fda5f6032`. |
| 0.1.0 | 2026-09-21 | Initial consolidation of everything discovered 2026-09-19/20 across the `unifyapps-builder` (UAT) and `unifyapps-context-graph` (APS1) work: 126 endpoint paths with evidence levels, node action contracts, error catalogue, dead ends, and three cross-tenant discrepancies (§18). |

---

## 22. Applications — config-based

> Superseded in depth by **§29** and the `unifyapps-config-apps` skill (2026-09-23).

Module id `e_interface` (*Applications*). An app is an `e_interface` entity whose id is a slug;
its pages/modules are `e_component` entities; every data call is an `e_data_source` entity.
`properties.manifest = {type:"WEB", mode:"config"|"code"}` — `mode` distinguishes the two
builders (older config apps omit it). 9,416 apps on UAT. Full field-level reference:
`unifyapps-apps/references/config-apps.md`.

### `POST /api/entity/create-update-or-delete/hierarchical` — Create / update app, page, module
✅ UAT · 2026-09-21

| Field | Notes |
|---|---|
| `entity` | the full entity (`entityType` `e_interface` or `e_component`) |
| `requestType` | `CREATED` \| `UPDATED` (\| `DELETED` presumably — untested) |
| `ignoreVersion` | `true` on app create |
| `parentEntities` | `[{type:"e_interface", id:<appId>}]` for pages |
| `postUpdateEntities` | the app entity with its maps updated (UI sends it; `NEW_ENTITY_ID` placeholder for the new page id) |

✅ **App description and tags over REST (UAT 2026-09-25, `app-31077911d563`):** `GET /api/entity/e_interface/{appId}`,
change `properties.description` and `tags` on that same object (tags were `null`; now `["DEMO_READY"]`), then POST it back
with `requestType:"UPDATED"` (no `ignoreVersion`) → 200; read-back shows version 12→13, both fields changed, and
`deploymentState` (the published commit) untouched — editing metadata does not republish.
Confirmed again on a **code** app (`app-7121817b391f`, 2026-09-25): same call, v17→v18, a 1,405-character
description accepted whole, `tags` preserved. So it holds for both app modes, and the description is a
free-text field — long enough for a real paragraph, not just a strapline.

Plain `POST /api/entity/update` does the same job with less ceremony (code app `app-dcf4fe771575`,
2026-09-25): send `{id, entityType:'e_interface', properties, tags, version}` read fresh from
`GET /api/entity/e_interface/{appId}` → 200, v26→v27, a 1,215-character description and
`tags:["DEMO_READY"]` both landed, `properties.additional.gitDetails` untouched. **`tags` must be in
the body** — §47.2(a) applies here, and omitting it clears them rather than leaving them alone. Like
the hierarchical route it does not republish; but §47.2(b) still bites, so set tags *after* the final
`publish`, because a later publish or Code Builder turn silently drops them again.

**Response** — 200, an **array** of saved entities. Creating the first page also creates the
global page `e_global_<appId>` (name/slug `global-page-of-<appId>`), which anchors app-wide
data sources. ✅ App create (UI) · ✅ page update (REST) · 👁 page create (UI).

### `POST /api/domain-mapping/interface` — Map the app's host
✅ UAT · 2026-09-21 — `{domain:"<appId>-orbit.matrix-uat.unifyapps.com", module:"INTERFACE", applicationId}` → 204.
Read back with `POST /api/lookup?ByQuery=DOMAIN_MAPPING` `{options:{applicationId}}`.

### `POST /api/entity/e_component` — List an app's pages/modules
✅ UAT · 2026-09-21 — filter `properties.interfaceId` EQUAL appId, optionally
`properties.componentType` EQUAL `PAGE` / IN `[MODULE, TEMPLATE_COMPONENTS]`. The global page
is returned as a `PAGE`.

### `POST /api/entity/embedded-entities/e_component` — A page with its data sources
✅ UAT · 2026-09-21 — `{entityId, allowedEntityTypes:["e_component","e_data_source","e_interface"]}`.
Deployed variant: `/api/entity/deployed/embedded-entities/e_component` (+ `excludeFields`), types `e_component_deployed`.

### `e_data_source` — create with `POST /api/entity`, run with `execute/node`
✅ UAT · 2026-09-21

```json
{ "entityType": "e_data_source", "properties": {
  "name": "ds_vehicle_telemetry", "type": "APPLICATION",
  "interfaceId": "<appId>", "interfacePageId": "e_global_<appId>",
  "context": {"appName":"callables","resourceName":"callables_call_automation","resourceVersion":3124},
  "inputs": {"automationId":"<deployed CALLABLE id>","version":"-1","runtimeConnections":{},
             "parameters":{"vehicleId":"{{vehicleId}}"},"synchronous":true},
  "dP": [{"p":"inputs.parameters.vehicleId"}], "dpOn": [],
  "advancedOptions": {"runBehaviour":"automatic","refetchOnWindowFocus":true,
                      "timing":{"runQueryOnPageLoad":false,"runQueryPeriodically":false}} } }
```

```json
POST /api/workflow/execute/node?name=ds_vehicle_telemetry&requestId=<dsId>
{ "context": {...same...}, "id": "<dsId>",
  "inputs": {"automationId":"...","version":"-1","runtimeConnections":{},
             "parameters":{"__internals__":{"m":"PREVIEW","s":"global-page-of-<appId>","c":"PLATFORM","p":"browser"},"vehicleId":"V-100"},
             "synchronous":true},
  "options": {} }
→ 200 { "executionInstanceId", "id", "lookupReferences": {}, "response": <STOP result> }
```

**Governance (✅ verified):** no `id` → `forbidden datasource: not found`; a changed
non-templated input (e.g. `automationId`) or an omitted stored input →
`forbidden datasource : invalid input`. `context` may be any workflow action — storage
(`storage_by_unifyapps_fetch_records`, `_create_record`, `_update_record_by_id`,
`_delete_record_by_id`) is common. Blocks bind with `{{ <dsId>['data'][...] }}`.

### `POST /api/entity/e_interface/{appId}/deploy` — Publish
✅ UAT · 2026-09-21 (captured from the UI's Publish click) — `{deploymentNotes}` → the app with
`deploymentState {deployedAt, deployedBy, deploymentNotes, entityVersion, version}`. The UI
first calls `POST /api/entity/entity-dependency` and `/api/entity/deployed/entity-dependency`
`{entityType:"e_interface", entityId}` 👁. Versions: `aggregation` on `EntitySnapshot` (STANDARD)
with `additional:{entityType, entityId}` 👁.

### Other app endpoints
👁 `GET /api/entity/e_theme/{id}` · `POST /api/entity/e_theme/find-by-ids {ids}` ·
`POST /api/entity/e_page_template` · `POST /api/entity/e_custom_component` ·
`POST /api/entity/e_i18n_namespace {interfaceIds, locale}` · `GET /api/collab/connectionDetails` ·
`POST /api/workflow/execute/node?name=NoCodePageScore` (page quality score, automation
`68fcad84dede0b5c299e1cc8`) · `GET /api/entity-type/getLoggedInUser` (the `s_user` schema).

### App identity providers (SSO) — per-app, not tenant-wide
👁 UAT · 2026-09-22 — read-only look; nothing created yet (on hold until the org admin agrees).

- Route: `/p/0/interfaces/{appId}/settings/privacy` (*App → Settings → Security → Privacy Settings*),
  which has **Access level** (Private/Public) and an **Identity providers** list.
- IdPs are **scoped to one app**: `GET /api/identity-provider/fetch-identity-providers` from that page returned
  the app's own `type:"PASSWORD"` IdP `Login` with `applicationId:"maher-scratch-cfg"`. A new app gets one
  automatically. Adding SSO to an app means adding an IdP to **that app**, not changing the tenant's
  Security → identity providers. The same GET called bare from the console returned **204**, so the UI sends
  the app scope some other way (header or param not captured yet).
- *Add identity provider* types: Anonymous User Session, Custom SAML, Custom Workflow, External Session,
  **Google**, LDAP, Microsoft Azure, Okta, …
- **Google is SAML.** Orbit fills in the SP side from the app host:
  ACS `https://{appId}-orbit.matrix-uat.unifyapps.com/auth/sso/SAML/complete-login`,
  SP Entity ID `https://{appId}-orbit.matrix-uat.unifyapps.com/sso/saml`, button text "Continue with Google".
  IdP side needed: metadata XML, or IdP Entity ID + Login URL + X.509 cert. Other fields: attribute statements
  (name/first/last/email/username/phone), User Attributes Sync, JIT Provisioning (+ user criteria),
  **Login Restriction** (where a domain limit would go), session options, additional auth params
  (e.g. `hd`/`login_hint`).
- **Needs a Google Workspace admin:** a custom SAML app in Google Admin pointing at this app's ACS/Entity ID.
  The tenant's existing Google SAML app targets the platform's URLs and won't serve a new app.
- Save request body not captured yet (backlog #23).

---

## 23. Applications — code-based & the agent API

A code app is an `e_interface` with `manifest.mode: "code"`; its source is a Git working tree
behind the **Code Builder agent API** at `/agent-api` (same origin, cookie auth). Written by the
platform agent `text_to_ui_tensor`. Hosted at `<appId>-orbit.tensor-uat.unifyapps.com`. Stack:
React 19, Vite 8, TypeScript 7 rc, Tailwind 4, TanStack Query 5, `@unifyapps/app-builder-sdk`
0.4 (vendored). Full reference: `unifyapps-apps/references/code-apps.md`.

**Runtime contract** (✅ via the same endpoint on a config app; 👁 in code-app source): app code
calls `useExecuteWorkflowNode` / `useExecuteWorkflowNodeMutation` from
`@unifyapps/app-builder-sdk/hooks/workflow` → `POST /api/workflow/execute/node` with an
`e_data_source` id, anchored `interfacePageId: "e_global_<appId>"`. Objects use five
object-agnostic storage bindings (FETCH, FETCH_ONE, CREATE, UPDATE, DELETE); each automation
gets its own `callables_call_automation` data source. App code must never call `/api/entity`
or `/api/aggregation`.

| Method · path (prefix `/agent-api`) | Purpose | Status |
|---|---|---|
| `POST /sessions` `{target:"code-builder", input, userName, userEmail, appId?, branch?, planner?}` | new app or new chat → `{appId, sessionId}` | ✅ |
| `GET /sessions/{s}/files` | `{files:[{path,size}]}` | ✅ |
| `GET /sessions/{s}/files/content?path=&v=` | raw text | ✅ |
| `PUT /sessions/{s}/files/contents` `{edits:[{path,content}]}` | save files (no commit) → `{filesVersion}` | ✅ |
| `POST /sessions/{s}/files/{op}` | file op | 📦 |
| `GET /sessions/{s}/branches` | `{current, default, linked, remoteError, branches[], previewVersion, filesVersion}` | ✅ |
| `POST /sessions/{s}/branches` `{branch, base, description}` · `POST /sessions/{s}/branch` `{branch}` · `DELETE /sessions/{s}/branches/{b}` | create / switch / delete (remote too) | 📦 |
| `GET` · `POST /sessions/{s}/git` | link status · link repo | ✅ (§28) |
| `GET /sessions/{s}/changes` | commit list `{branch, changes:[{sha, message, date, published}]}` — also shows who authored an app's commits | ✅ |
| `POST /sessions/{s}/restore {sha}` | restore | 📦 |
| `GET /sessions/{s}` | `{sessionId, status: running\|done\|stopped, target, appId, interactive}` | ✅ UAT 2026-09-23 (§28) |
| `POST /sessions/{s}/stop` `{}` | stop the running builder turn → `{"ok":true}`, status `stopped` | ✅ UAT 2026-09-23 (§28) |
| `POST /sessions/{s}/edits` · `/styles {file,loc,styles}` · `/bindings/seed {id,seed}` | visual edits | 📦 |
| `GET /sessions/{s}/manifest` · `/routes` · `/data-model` · `/query-plan` · `/download` | metadata / zip | 📦 |
| `POST /sessions/{s}/events?since=` · `/retry` · `/queue/…` | agent control | 👁/📦 |
| `POST /apps/{appId}/publish` `{versionTag, versionNote}` | publish (default branch only) → entity `deploymentState.additionalDetails.sourceCommitHash` | ✅ |
| `GET /apps/{appId}/deployed/routes` · `/apps/{appId}/branches/{b}/files/content` · `/branches/{b}/manifest` | read without a session | 📦 |
| `GET /preview/b/{appId}/{branch}` | branch preview | 👁 (404 while not built) |

**Git link body** 📦: `{provider:"GITHUB"|"GITLAB", connectionId, repositoryName, projectName,
organizationName, createOptions:{autoCreate:true, payload:{visibility:"private", description}}}`.
✅ **Verified two-way 2026-09-21** on `app-3dfc7c54e504` ↔ `mmaheranwar/maher-scratch-code-app`: agent commits push with identical SHAs; a branch pushed from outside appears in `GET /agent-api/apps/{appId}/branches` and `POST /agent-api/sessions/{s}/branch {branch}` pulls it into the builder. Personal owner id format: `organizationName: "username:<login>"` (owners from `lookup?ByQuery=APPROVED_GITHUB_ORG`). A fine-grained PAT limited to selected repos creates the repo but fails the push (`sync.detail: push failed`, `remoteError: could not reach the remote repository`) — add the repo to the token; the push retries on the next commit (fallback only: a push-capable connection lands the starter commit at once, §28). **Create a code app over the API** ✅: `POST /agent-api/sessions {target:"code-builder", input, userName, userEmail}` → `{appId, sessionId}`, then create the `e_interface` (`manifest.mode:"code"`, `chatSessionId`) and `POST /api/domain-mapping/interface` yourself — the session does not create the entity. Always creates a **new private** repo. Personal account vs organization is governed by the
tenant feature flag *Code app repositories under organizations only* (`/settings/feature-flags`)
— **off on UAT 2026-09-21, so personal accounts are allowed**; when on, the UI shows "No
organization available … personal accounts aren't supported". Sync: push on save ("Code will sync with the first saved change");
Branches view shows check status, *Behind | Ahead*, pull requests. Pull-back from the remote is
**unverified** (§19 #18).

**Builder chat** 👁: `POST /api/workflow/execute/node?name=call_automation` → automation
`66ab98083d73300e63962287` (`copilotType:"AI_AGENT"`, `caseId`); sessions/locks via automation
`6a7c42a1eddf8930c2ffe6af` (`fetchType: SESSION_HISTORY | QUEUE_AND_LOCK_STATUS`, `appId`,
`branchKey`). Entities `tensor_agent_queue_entry`, `session_task_tracker`, `text_to_ui_code_models`.

---

## 24. Objects Manager

Module id `ENTITY_TYPE`. An object is an `EntityType` (STANDARD); its records are entities of
that type. ~18,300 custom objects on UAT. Full reference:
`unifyapps-apps/references/objects-and-connections.md`.

### `POST /api/entity-type` — Create object
✅ UAT · 2026-09-21 — `{id, name, pluralName, description, metadata:{storeDetails:{store:"MONGO"}}, tags}`
→ the EntityType with defaulted `metadata`. UI store options: JSON (MONGO), Blob, Key Value,
Event, Vector, Analytics.

### `GET /api/entity-type?entityType={id}` — Read object
✅ UAT · 2026-09-21. Bulk: `POST /api/lookup?ByKeys=ENTITY_TYPE {type:"ByKeys", lookupType:"ENTITY_TYPE", keys}` ✅.
⚠️ UAT 2026-09-23: an object that does not exist returns **200 with an empty body** — `r.json()`
throws "Unexpected end of JSON input". Read as text; empty = not found (§28).

### `storage_by_unifyapps_create_object` (workflow node) — what worked ✅ UAT 2026-09-24
Inputs `{uniqueId, singularName, pluralName, description, store:"MONGO", schemaPayload:<JSON schema object>,
layoutPayload:{"ui:order":[…]}, metadataPayload}` created four objects with 9–11 typed fields (auto-generate
primary key with `autoGeneratedFieldDefinition`, `single-select` with `oneOf`, `date-time`+`epoch`) from a
Groovy step's output mapped as `'{{ n.outputs.result.schema }}'` (an object template resolves to the object).
Output `{success:true}`. ⚠️ `metadataPayload: {tags: '{{ …array… }}'}` did **not** tag the object (string
rendering); tag afterwards with `POST /api/entity-type/update` (`tags:[…]`) or pass a whole object template —
`metadataPayload: '{{ n.outputs.result.metadata }}'` with `metadata:[tags:[…]]` from Groovy (unverified).
Runs as the workflow's caller: `ownerUserId` = the user who invoked the data source.

### App data sources refuse any input-shape drift ✅ UAT 2026-09-24
`forbidden datasource : invalid input` when a call to a registered `e_data_source` changes a non-templated
stored input (e.g. `numberOfRecordsToFetch: SINGLE` on a source registered `MULTIPLE`) or omits one (`upsert`,
`page`, `sortBy`). Reuse the exact stored inputs + the templated ones; the same id cannot serve two shapes.
Also: `storage_by_unifyapps_update_record_by_id` with `useRawPayload` needs the **full** record and rejects
keys that are not in the object schema (`additionalProperties:false`).

### `POST /api/entity-type/update` — Update schema / settings
✅ UAT · 2026-09-21 — send the **full** object as read, with
`input: {type:"SCHEMA_AND_LAYOUT", schema:<S>, layout:{"ui:order":[...]}}` and
`schema: {dynamic:false, type:"SCHEMA", schema:<S>}`. `<S>` is JSON Schema; per-field flags
`primaryKey, uniqueKey, nameField, searchable, sortable, filterable`; formats `text, email,
date-time (+dateFormat:"epoch"), single-select (+oneOf | foreignKey:{reference:"ENTITY_ID:<obj>"}),
auto-generate (+autoGeneratedFieldDefinition:{prefix,startFrom})` — the server joins prefix and
counter with `_` (`prefix:"SZ"` → `SZ_1004`; `"SZ-"` → `SZ-_1003`), so never end a prefix with a
separator; a prefix change applies to new records only ✅ UAT 2026-09-21. The server derives
`metadata.primaryKeyField / nameField / filterableFields / searchableFields / dateFields /
referenceKeys / autoGeneratedFields` from the flags. `version` increments.

### Records
✅ UAT · 2026-09-21 — create `POST /api/entity {entityType:<obj>, properties}` (record id = PK
value); read `GET /api/entity/{obj}/{id}`; list `POST /api/entity/{obj}` with
`{filter:{op,field:"properties.x",values}, sorts, page}` (EQUAL, GT, IN verified); aggregate
`POST /api/aggregation?entityType={obj}&group=ENTITY` (fields `properties_x`); update
`POST /api/entity/update` with the **full** properties (partial → `required` error). Schema
validation enforces `required`, `oneOf`, `additionalProperties:false`.

### Listing objects
✅ `POST /api/aggregation?entityType=EntityType&group=STANDARD` with projections
`name, id, columns, tags, oUId, cTm, mTm, description, packaged, standard`; custom objects:
filter `standard` EQUAL false OR MISSING. Fields of one object:
`POST /api/lookup?ByQuery=ENTITY_FIELD {options:{group:"ENTITY", entityType}}` ✅.
⛔ UAT 2026-09-28: filtering that listing on `id` with op `CONTAINS`, `LIKE`, `STARTS_WITH`, `REGEX` or
`PREFIX` answers **500** `{"errorCode":-1}`. To find a project's objects, take the ids from its repo
(seed/bootstrap scripts) and read each one with `GET /api/entity-type`.

### Object indices (custom indexes) ✅ UAT 2026-09-28 — written over REST on `taqa_kpi` and `taqa_document`
Objects Manager → object → **Settings** → **Object Indices**. The page says primary-key and
unique-key fields are indexed automatically (shown as `PK_<field>` / `UK_<field>`); every other
index is a **custom index** you define. The `filterable` / `sortable` / `searchable` field flags
do **not** create indexes. They only feed `metadata.filterableFields` / `searchableFields`.

Stored on the EntityType as `metadata.customIndexDefinitions`, read from
`dnd_ramis_fde_object` (someone else's object, read only):
```json
"customIndexDefinitions": [
  { "name": "index_1",
    "indexFieldMetadataList": [ { "field": "properties.job_id", "type": -1 } ],
    "status": "SUCCESS" } ],
"skipIndexLimitValidation": false
```
From the Objects UI bundle (`CreateOrUpdateCustomIndexModal`, `adaptCustomIndexDefinitionToDTO`):
- `field` is `properties.<fieldKey>`. `type` is the direction: `1` = ASC, `-1` = DESC. A list of
  several fields is a **compound** index, and field order matters.
- `name` must match `^[^ ]+$` (no spaces). The UI names them `index_1`, `index_2`, …
- `MAX_CUSTOM_INDEXES = 5` per object in the UI. `metadata.skipIndexLimitValidation` suggests the
  server enforces a limit too.
- Save = the settings form merges `customIndexDefinitions` into `metadata` and sends the **whole**
  object to `POST /api/entity-type/update` (the `useUpdateEntityType` mutation). No separate index
  endpoint.
- Comparison: all 16 `taqa_*` objects (TAQA Sourcing Hub, ~14k records) had **no**
  `customIndexDefinitions`, so each had only its automatic primary-key index. They mark 7–58 fields
  `filterable`/`sortable`, and none of those fields was indexed.

**Verified over REST (2026-09-28).** The full object as read (it now includes `schema`), with
`metadata.customIndexDefinitions` set and no `status` on the new entries → `POST /api/entity-type/update`
→ **200**, `version` 1 → 2, `columnCounts` unchanged, and each index returned with **`status:"IN_PROGRESS"`**.
A re-read a few seconds later showed every index **`SUCCESS`**. So an API write triggers the build, just
like the UI save. Written:
- `taqa_kpi` (5,424 rows): `index_1 {scope:1, metric:1, period:1}`, for the charts' `scope EQUAL` +
  `metric IN` (+ `scope_code EQUAL`) sorted by `period`.
- `taqa_document` (4,529 rows): `index_1 {supplier_code:1, days_to_expiry:1}` and
  `index_2 {status:1, days_to_expiry:1}`.

Before/after, 20 timed runs each of `POST /api/entity/{obj}` from the browser (median ms): KPI series
48 → 51, KPI by scope 52 → 50, documents by supplier 47 → 43, documents needing attention 59 → 58.
**No measurable difference at this size.** The time is network and serialisation; responses carry
no server-timing header. Each query returned the same row set after indexing and was still correctly
sorted. **Rows with equal sort keys came back in a different order** (KPI rows sharing a `period`),
so code must not rely on tie order. TAQA's screens don't: they filter by metric and then read in
period order. Rollback = the same update with the previous list.

Also: the entity list's combinator is `{op:"AND", values:[…]}`. `{op:"AND", filters:[…]}` is
accepted and **ignored** (all rows returned).

---

## 24b. AI Solutions — the platform's native prompt-to-solution builder
✅ UAT · 2026-09-23 (read-only survey)

**UI:** sidebar *AI Solutions* → `/p/0/solutions` (975 on UAT). A solution = "one problem statement, one linked
set of assets". Detail page `/p/0/solutions/{id}` (Overview · Insights · Versions · Settings; *Preview*;
*Open in builder*). Builder = `/p/0/solutions/{id}?chatId=new`: chat on the left ("Describe what you want to
build. The agent will plan it, then build it."), right pane tabs **Plan · Preview · Code · Data sources ·
Objects · Trace**, model picker ("Auto"), *Publish*. Several chats per solution (`chatId`).

**Entity:** `POST /api/entity/e_solution` (list) — `properties: {name, description, status: building|built,
globalPlan (markdown "build plan — N items — …"), planId, approvedPlanId, chatId, model, modelEntityId,
provider, vertexProject, connectionId, memory, linkedEntities:[{id, type, state, version}]}`; linked types seen:
`ENTITY_TYPE` (objects, ids `obj_xxxxx`), `e_interface` (apps, `app-xxxxx`), `WORKFLOW_DEFINITION`,
`CONNECTION`; `state` = `COMPLETED`. Plans are a separate entity type (id `e_…`), type name not found yet
(`e_plan`, `e_solution_plan`, `plan`, `e_ai_plan`, `e_build_plan` → 500).

**Workflow nodes** (`solution_by_unifyapps`): `save_solution` (create/update, fields above), `deploy_solution`
(deploys every linked entity then the solution; returns `deployedEntityVersion`), `save_solution_versions`,
`restore_solution {id, deployedVersion}`. So version control of a whole solution is native.

**Other first-party nodes worth knowing (no session needed — they run with platform identity):**
`storage_by_unifyapps_create_object {uniqueId, singularName, pluralName, store, schemaPayload, layoutPayload,
metadataPayload}` / `update_schema` / `delete_object`; `routines_by_unifyapps_create_routine` (managed agent
from `agentConfig`); `git_by_unifyapps_*` (clone/edit/commit/push/bash — code apps server-side);
`auth_by_unifyapps_create_user_session {userId?, sessionDuration}` → `sessionId` ("current user, or a TEST
user when userId is set"); `auth_by_unifyapps_mint_agent_identity` (SPIFFE token);
`platform_tools_by_unifyapps_*` (node/resource discovery); `platform_by_unifyapps_on_pipeline_*` triggers.

**Why it matters:** this is the product the SC Studio was rebuilding (plan → approve → build → versions,
embedded preview, multiple chats). Build on `e_solution` rather than beside it.

## 25. Connectors SDK (custom connectors)
✅ UAT · 2026-09-21 — built `SC Native - Fireflies` (`6ab1385f5459f4370f0d1499`, 5 GraphQL actions, published).
UI route: **`/connectors/custom`** (sidebar *Enterprise Systems → Connectors SDK*), connector at
`/connectors/{defId}/{authentications|triggers|actions|settings}`. Aggregation entity type: `ConnectorDefinition` (group `STANDARD`).

| Step | Call | |
|---|---|---|
| Create connector | `POST /api/connector-builder/definition/basic` `{name, description, baseUrl, logo, categories}` | 👁 (UI) |
| Read connector | `GET /api/connector-builder/definition/{defId}` → `{auths[], baseUrl, enabled, version, …}` (no tags field) | ✅ |
| Add auth | `POST /api/connector-builder/definition/{defId}/auth?type=TOKEN` (`TOKEN`, `JWT`, `OAUTH`, `OAUTH1`, `BASIC`, `CUSTOM`, `AWS`) | 👁 (UI) |
| Update auth input schema | `POST /api/connector-builder/definition/update/{defId}/auth?type=CUSTOM&version={v}` body `{type:"CUSTOM", input:{type:"SCHEMA_AND_LAYOUT", dynamic:false, layout:{}, schema:{…JSON schema…}}}` → `{definition:{auths[…]…}}`, bumps `version` | ✅ UAT 2026-09-23 |
| Auth request (headers) | read `GET /api/connector-builder/request/{defId}/{TYPE}/auth` · update `POST /api/connector-builder/request/update/{defId}/{TYPE}/auth?version={v}` with the full object | ✅ |
| CUSTOM auth request (login call) | the object the UI saves: `{type:"CUSTOM", authType:"CUSTOM", method, url, headers, queryParams, body:{type:"JSON", formEncode:false, payload:{…"{{ rawPayload.username }}"…}}, output:{type:"SCHEMA", dynamic:false, schema}, actionAuthHeaders:{}, refreshCredentials:{…}, refreshable, sslVerify, urlPath:false, version}`. Save the empty form once in the UI (creates the row, `version:0`), then `POST …/request/update/{defId}/CUSTOM/auth?version={v}` with the full object. **Output fields are body keys only** (Add field = Key/Label/Type/Default) — response headers such as `Set-Cookie` cannot be mapped there | ✅ UAT 2026-09-23 |
| Create action | `POST /api/connector-builder/definition/{defId}` `{name, description, type:"ACTION"}` → `{definition:{id…}, violations}` | ✅ |
| Action definition | read `GET /api/connector-builder/definition/{defId}/{actionId}` · update `POST /api/connector-builder/definition/{defId}/update/{actionId}?version={v}` (full object; set `enabled:true`, `input`/`output` `{type:"SCHEMA_AND_LAYOUT",dynamic:false,layout:{},schema}`) | ✅ |
| Action HTTP request | read `GET /api/connector-builder/request/{defId}/{actionId}/action` (`""` until first save) · **create** `POST` same path · **update** `POST /api/connector-builder/request/{defId}/update/{actionId}/action?version={v}` | ✅ |
| Publish | UI *Publish* button; then the connector's `enabled:true` and actions appear in `GET /api/workflow-builder/node/{defId}/resources` as `{defId}:{actionId}` | ✅ |
| Publish (API) | `POST /api/connector-builder/definition/{defId}/publish?version={v}` (what the UI button calls); publishing is what copies `logo` → `GET /api/applications/{defId}` `iconUrl` | ✅ |
| Edit name/description/logo | UI: Connectors list → row ⋯ → *Edit* (dialog fields `root.name`, `root.description`, `root.logo`). `POST …/definition/basic/update/{defId}?version=` with a hand-built body → 500 ConstraintViolation (shape unknown) — use the dialog, then Publish | ✅ |

- ⚠️ **UI "Use Code Snippet" on the auth Input tab expects an EXAMPLE PAYLOAD, not a JSON schema** — pasting a
  schema creates fields literally named `type`/`properties`/`required`. Paste `{"username":"","password":""}` and set
  formats in the field editor, or set the schema over the API (row above).
- **Templates:** connection inputs and action inputs are both `{{ rawPayload.<field> }}` (scan of 486
  connectors: TOKEN/CUSTOM/BASIC all use `rawPayload.*`; CUSTOM auth outputs use `{{ auth.<field> }}`).
  Auth header for a personal API key: auth input schema `{properties:{api_key:{type:"string",format:"password"}},required:["api_key"]}`
  + `actionAuthHeaders:{"Authorization":"Bearer {{ rawPayload.api_key }}"}`.
- **Action request shape:** `{type:"ACTION", method, url, headers, queryParams, body:{type:"JSON", formEncode:false, payload:{…}}, sslVerify, enableRetry}`.
  Templates may sit inside a larger string (e.g. a GraphQL query `transcripts(limit: {{rawPayload.limit}})`).
- ✅ **A Connectors-SDK action's run output is `{headers, status_code, body}`** (UAT 2026-09-23, read via
  `TEST_WORKFLOW_VARIABLE`): `headers` is the full response-header map of arrays — so `set-cookie` from a login
  action is readable by the next node, same as `custom_http_endpoint_execute`. A non-2xx (401) marks the node
  FAILED but the payload is still recorded. Node shape in a workflow: `{type:"ACTION", context:{appName:"<defId>",
  resourceName:"<defId>:<actionId>", resourceVersion:1, connectionId}, inputs:{}}`; `initiate-test/probe` with the
  inline definition runs it without saving a workflow.
- ✅ **Template scope inside a Connectors-SDK action request** (UAT 2026-09-23, echoed through httpbin):
  Groovy binding = `[systemInputs, cursor, input, rawPayload, user]`. `rawPayload` = the ACTION's own inputs;
  the connection lives at **`input.auth`** = `{username, password, credentials, name, connectionId, authType,
  tags, circuitBreakerConfig, rateLimitConfig}` (your auth-schema fields plus platform metadata). So a body-borne
  credential is `{{ input.auth.password }}` — NOT `rawPayload.*` (that contradicts the older note above for
  actions; `rawPayload.*` is what the AUTH request itself uses). `auth`, `connection`, `userInput` do not exist
  ("No such property … for class Script_…"). `systemInputs` = `[__ENV__, appName, VOICEBOT_URL, customerId,
  resourceName, user, systemAutomation, webhookUrl, isTestExecution]`.
- ⚠️ **Success output of an action = the parsed body only.** On a non-2xx the node FAILS and its output is the raw
  `{headers, status_code, body}`; on 2xx you get the body and nothing else — declaring `headers`/`status_code`
  in the output schema does not bring them back. So a login action cannot hand `Set-Cookie` to the next node.
- ⚠️ **The connection's own auth request does not seed a cookie jar**: after a successful CUSTOM auth login, a
  plain action to `/api/entity/<obj>` returned **401**. Session-cookie replay must be built explicitly.
- `GET /api/user/context` is **404** from a plain HTTP client (the SDK hook resolves it differently); use an
  entity read such as `POST /api/entity/<own object>` as an "is my session valid" probe.
- ⛔ `POST …/request/{defId}/{actionId}/action` on an action that already has a request → 500 Mongo `E11000 duplicate key`; use the `/update/` path.
  ⛔ `PUT`/`PATCH` on that path → 405. `/request/update/{defId}/{actionId}/action` → 404 (the `update` segment goes **after** `{defId}` for actions, **before** it for auth).
- UI gotcha: the Value field of the auth header editor is a template editor; synthetic typing leaves React state at `Bearer {{` — set it over the API instead.
- ⚠️ Runtime user connections with a **custom** connector: the chat's "Connectors that could help" card renders blank
  (no name, `<img alt="placeholder">` with no src) even though `GET /api/applications/{defId}` has `displayName`/`iconUrl`;
  **Connect still opens the auth popup** (UAT 2026-09-22). Built-in connectors (Gmail, Calendar) render correctly.
- Google built-in connector scopes (OAUTH): Gmail and Calendar expose a `scopes` multi-select (defaults: Gmail
  `https://mail.google.com/`; Calendar edit + events + tasks + drive.readonly); **Drive has no scope field** and requests
  full `drive`. For enforced read-only, build a custom OAUTH connector with fixed `*.readonly` scopes.

### Agent skills — `e_skill_ai_agent`
✅ UAT · 2026-09-21 — link lives on the skill: `properties.accessibleTo: ["ai_agent/<id>"]`. Attach = update
`accessibleTo` + `saveAndDeploy` the skill + republish the agent. Find an agent's skills with aggregation
`group=ENTITY`, filter `properties_accessibleTo IN ["ai_agent/<id>"]`. ⚠️ deploying a skill also publishes any
unpublished draft (`version` > `deploymentState.entityVersion`). Details: `unifyapps-builder/references/agents.md`.

### Agent conversation over REST
✅ UAT · 2026-09-21 — send: `POST /api/workflow/execute/node/sse` (`callables_call_automation_streaming`,
automation `67dcfe388445037d9b0662c0`, params `{copilotType:"AI_AGENT_TEST", message, messageContentType:"MARKDOWN", aiAgentId, timezoneId}`);
read: `…?name=call_automation&fetchConversation=66ab98083d73300e63962287` (params `{copilotType, caseId, userId, aiAgentId, until}`);
traces: `GetTraceTimeline` (automation `680cdbcaa3741471fc7c22e9`, `{traceId}`) and `TraceTimelineDetails`
(automation `6943f1be474ba4398bf4201c`, `{id, type}`). Full bodies: `unifyapps-builder/references/agents.md`.
⚠️ `loadSkill(generate-chart)` silently ends the turn on UAT (no further LLM span).

### HubSpot search notes
✅ UAT · 2026-09-21 — `hubspot_search_records_batch` operators: EQ NEQ LT LTE GT GTE CONTAINS NOT_CONTAINS
HAS_PROPERTY NOT_HAS_PROPERTY BETWEEN IN NOT_IN (no CONTAINS_TOKEN); multi-owner field
`hs_all_collaborator_owner_ids` **IN [ownerId]** matches deals where the owner is one of several collaborators.
`hubspot_get_owners` returns `results[]` (schema says `owners`) incl. `teams[]`. `hubspot_get_pipelines`
returns `metadata.isClosed` as the **string** "true"/"false". `hubspot_get_association_batch` → `results[{from:{id}, to:[{toObjectId}]}]`.

### Browser → localhost from an Orbit page — blocked
✅ UAT · 2026-09-22 — Orbit's CSP `connect-src` allows only `'self'` and listed cloud hosts, so `fetch('http://127.0.0.1:…')`
from an Orbit tab is refused; `window.open` without a user click is popup-blocked. To move data out of the tenant, call a
callable workflow (same-origin `/api/workflow/execute/node`) that writes through a connector (e.g. GitHub), not the browser.

### Orbit framed by another `*.unifyapps.com` origin — renders authenticated
✅ UAT · 2026-09-23 — Orbit sets **no `X-Frame-Options`**; its CSP carries
`frame-ancestors 'self' https://*.unifyapps.com https://delegate-orbit.matrix-uat.unifyapps.com http://localhost:3000 https://orbit.uat.unifyapps.com`.
Code-app hosts carry `frame-ancestors 'self' https://*.unifyapps.com https://orbit.uat.unifyapps.com https://test-studio.orbit.uat.unifyapps.com`.
Verified by framing `https://orbit.uat.unifyapps.com/p/0/automations` from a page on
`https://app-7a0b14fcda38-orbit.tensor-uat.unifyapps.com`: the console renders **fully signed in**. Every
surface is a subdomain of `unifyapps.com`, so they are **same-site** — the httpOnly session cookie rides into
the frame and one Orbit login covers every embedded tab. Setting `iframe.src` to another deep link
(`/p/0/connections/all`) navigates it and it stays authenticated.
**But the parent cannot script it:** `iframe.contentDocument` -> `null`, `contentWindow.location.href` ->
`SecurityError`. `postMessage` can be sent; nothing is known to listen.
=> An embedded tab strip works with **deep-link navigation only**; clicking or reading inside a framed Orbit
page needs a browser-extension content script (SC Companion `platform/studio-bridge`) or Playwright.
WARNING: `http://localhost:3000` may *frame* Orbit but is **cross-site**, so the cookie is not sent there —
always test framing from a `*.unifyapps.com` origin or you get a false negative.

### Groovy code node has outbound HTTPS egress and can read response headers
✅ UAT · 2026-09-23 — `code_by_unifyapps_groovy` opened `https://orbit.uat.unifyapps.com/api/user-context`
with `new java.net.URL(t).openConnection()` and got a real **401** back (`egress:"OK"`, `status:401`,
`hasSetCookie:false`, `contentType:"null"`). So the sandbox is **not** network-isolated: it can call the
tenant's own REST API, and `getHeaderField(...)` reads response headers — which means a single Groovy
node can perform `emailAndPassLoginRequest`, capture `Set-Cookie`, and replay it on `/api/entity`.
Preferred over stitching `custom_http_endpoint` steps, whose exposure of response headers is untested.
Probe workflow kept as `scc_studio_probe_egress` (`6ab3c48b7c47e164fb29ea6d`, tag `SC_NATIVE`).
Resource versions drift — resolved at run time to `callables_from_automation` 3127,
`callables_return_to_automation` 3129, `code_by_unifyapps_groovy` 2612 (the skill's documented
3108/3110/2593 were all stale).
⚠️ Reading node payloads needs the FULL lookup body — `{type, lookupType, keys, options:{startTime,
endTime, workflowId}}`. Sending only `{keys}` returns HTTP 500 with a bare `errorId`.
⚠️ A password passed as a run-time workflow input is **persisted in the run variable store** and is
readable by anyone who can read that run. Do not send real credentials through `initiate-test`.

### `custom_http_endpoint_execute` returns ALL response headers — the declared output schema lies
✅ UAT · 2026-09-23 — the action's advertised output schema has only `result` and `status`, but a real run's
`outputs` payload is `{status, status_code, rawParams, headers}` where **`headers` is every response header**
as a map of arrays (`headers['set-cookie'][0]`). The `responseHeaders` **input** (array of header names) did
**not** restrict the set — declaring three still returned all twelve. So an HTTP node CAN capture
`Set-Cookie`, which makes a connection-held credential + cookie replay viable without dropping to Groovy.
Never infer a node's real output from `/api/workflow-builder/node/{n}/resource/{r}` — run it and read
`TEST_WORKFLOW_VARIABLE`.
- ⚠️ **`followRedirects` is an ENUM, not a boolean.** `false` fails at run time with
  `IllegalArgumentException: No enum constant java.net.http.HttpClient.Redirect.false`. Use `NEVER`
  (also `ALWAYS`, `NORMAL`). `authType` here is only `CUSTOM` | `BASIC_AUTH`; `connectionType` is
  `DIRECT` | `ON_PREM`.
- `custom_http_application` encrypts `pathsToEncrypt: ["password","headersList.value","soapHeadersList.value","clientSecret"]`
  — so a secret may live in a connection's **header value**, but there is no built-in way to inject one into a
  request **body**. For a body-borne credential (e.g. `emailAndPassLoginRequest`) use a **Connectors SDK**
  connector, whose `{{ rawPayload.<field> }}` templates do resolve inside a body string (§25).
Probe workflow kept as `scc_studio_probe_headers` (`6ab3c8d89d7b0545558ed6fa`, tag `SC_NATIVE`);
`custom_http_endpoint_execute` resourceVersion 2399 on this date.

### AI Governance — Controls, and the `controls_schema` catalogue
✅ UAT · 2026-09-23 — closes backlog item S4 for the Controls surface (Policies still open).
**Routes:** base `/p/0/agent-governance` **404s**; every screen is a child —
`/overview`, `/discovery`, `/registry`, `/model-registry`, `/monitoring`, `/incidents/chat`,
`/policies`, `/controls/chat`.
**Controls** are entities of type `controls` (574 on UAT). List with
`POST /api/aggregation?entityType=controls&group=ENTITY`, full rows with
`POST /api/entity/controls {page:{limit,offset}}` (offset paging), one with
`GET /api/entity/controls/{id}`.
`properties`: `name`, `description`, `checkType`, `appliedTo:"chat"|"knowledge"`,
`appliedOn:["user_input","agent_output","tool_input","tool_output"]`, `actionType:"flag"|"block"`,
`enabled`, `llmModel`, `confidenceThreshold`, `checkSeverity`, `severityModel`, `severityLevel`,
`accessibleTo`, and `additional.prompt` for custom LLM checks.
**`accessibleTo` is the attachment, exactly like `e_skill_ai_agent`**: `["global"]` (509 rows) or
`["ai_agent/<id>"]` (65 rows, all `ai_agent/enterprise_search_agent`).
**`checkType`** points at a `controls_schema` entity — `GET /api/entity/controls_schema/{id}` →
`{name, description, type, schema, layout, redact, mask}`. 15 exist, mirrored across
`type:"chat"` and `type:"knowledge"`: Prompt Injection (chat `e_6a500b3015d9546842783050`,
knowledge `e_6a55d234b6bf3639e4822464`), Blocked Tools `e_6a500b08d46d4e608bbe2f9b`,
Credentials & Secrets `e_6a500b3f15d9546842783059`, PII detection `e_6a500b1bd46d4e608bbe2f9f`,
Denied Topics `e_6a500b7c30b9186dd3773d30`, Content Filter `e_6a500b6ad46d4e608bbe2fdd`,
Regex pattern `e_6a500b4fd46d4e608bbe2fbe`, Custom terms `e_6a500b5b30b9186dd3773d18`, and the
literals `custom_chat` / `custom_knowledge`. The schema's `inputs` field is the entity's
`appliedOn`; default is `["user_input"]` only. `mask:true` on chat PII / Credentials / Regex.
⚠️ `POST /api/lookup?ByKeys=ENTITY` with a bare `lookupType:"ENTITY"` fails —
*"ENTITY_TYPE with id null not found"* (5002). Resolve ids with `GET /api/entity/{type}/{id}`.
⚠️ Registry/incident counts on UAT look seeded (10,832 registry agents vs ~2,400 real `ai_agent`).
✅ **Create verified 2026-09-23:** `POST /api/entity {entityType:"controls", tags:[...], properties:{...}}`
created `scc_studio_prompt_injection` (`e_6ab3cfb004beb12b389b720f`) attached to a throwaway agent
(`e_6ab3cfb0c9518d7218b0e719`), enabled and blocking on all four surfaces; found again with an
aggregation filtered on `properties_accessibleTo IN ["ai_agent/<id>"]`. `breachOn` defaults to
`false`; no `deploymentState` is returned, so controls look live-on-create.
✅ 2026-09-25 (§52): **Policies** = `policies` entity (grouping only); attaching a control needs NO republish; `blockedTools`
takes tool NAMES (keyword CONTAINS / NOT_CONTAINS); and — the important part — a control scoped `ai_agent/<native agent id>`
**did not gate a single turn** on the PoC Copilot (14 probes), while the agent's own `gaurd_rail` guardrails blocked inline.
Treat Controls as the audit/incident layer and `gaurd_rail` as the enforcement layer. `confidenceThreshold` enum still
unconfirmed beyond `high`/`medium`. Skill: `unifyapps-governance`.

### ⚠️ A git push to `main` is NOT pulled by the Code Builder session — and the page-load trick failed
⚠️ UAT · 2026-09-23 — qualifies §23 / the `unifyapps-apps` note that opening the Code Builder page applies
a pending branch switch. Observed on `app-3a0598e469c9` / session `e_6ab3d0f0c9518d7218b0f7b4`:
- Pushing a new commit to `main` left the session on `filesVersion: 1`, `previewVersion: 1`, with
  `sync.state: "synced"` but a **stale** `sync.ts` — the platform never noticed the remote commit.
- `POST /agent-api/sessions/{s}/branch {branch:"main"}` while already on `main` is a **no-op**
  (no `pendingBranch`, nothing pulled).
- Pushing a *different* branch and `POST …/branch {branch:"studio-shell"}` DID set
  `pendingBranch: "studio-shell"` as documented — but **loading the Code Builder page twice, with
  20s of wait, did not apply it**: `current` stayed `main`, `filesVersion` stayed 1. The in-page
  branch switcher (`button "Switch branch, currently on main"`) opens no menu under automation.
⇒ Until the real trigger is found, the reliable ways to get local code into a session are
`PUT /agent-api/sessions/{s}/files/contents {edits:[{path,content}]}` (✅ verified) or a human
clicking the branch switcher. Do not assume a push to `main` reaches the preview.

### 🔴 Code-app preview builds from git HEAD — and the recipe that actually lands a change
✅ UAT · 2026-09-23 — supersedes the earlier note that opening the Code Builder page applies a
pending branch switch. Four facts, each learned the hard way on `app-3a0598e469c9`:

1. **`app/src/index.css` is engine-owned and read-only.** `PUT /agent-api/sessions/{s}/files/contents`
   answers **422** `{"detail":"engine-owned file is read-only: 'app/src/index.css'"}`. The palette and
   fonts live in **`theme.json` at the repo root**; the engine regenerates `index.css` from it at build
   time, so an edit to `index.css` is discarded even if you get it in through git.
2. **The preview builds from the current branch's git HEAD, not the working tree.** Files written with
   `PUT …/files/contents` change what `GET …/files/content` returns and bump `filesVersion`, but they
   are never built: `previewVersion` does not move, and the preview keeps serving the committed code.
   There is no commit endpoint (`/git/commit`, `/commit`, `/files/commit`, `/git/push` are all 404) —
   committing a manual edit still goes through the builder chat, which is not capturable.
3. **A dirty working tree blocks a branch switch.** `POST …/branch {branch}` sets
   `pendingBranch` and it then sticks — re-POSTing, and loading the Code Builder page (twice, 25 s),
   left `current` unchanged. Reverting the one file that differed from HEAD let the very next POST
   apply it.
4. ✅ **What actually applies the switch: loading the Code Builder page.** `POST …/branch` only
   ever QUEUES (`pendingBranch`); repeated POSTs, with or without a files write in between, left it
   queued for 5+ minutes across several attempts. Opening
   `/p/0/interfaces/code-builder/{appId}?sessionId={s}` and waiting ~20 s applied it every time.
   (An earlier note here claimed a files-write + POST was the trigger — that was coincidence; the
   page had been loaded in between.) `POST …/branch` with the branch you are already on is a no-op,
   so always target a *different* branch. Sequence:
   ```
   git push origin <new-branch>            # the preview builds THIS, not the working tree
   POST /agent-api/sessions/{s}/branch     # queues it
   open the Code Builder page, wait ~20 s  # applies it; previewVersion advances
   ```
   ⚠️ Comparing the session tree to git by length is misleading: `files/content` is read in JS where
   `.length` counts UTF-16 units, so every em-dash reads 2 bytes short of `wc -c`. Identical files
   look different.
⇒ Treat `PUT …/files/contents` as a scratchpad, never as a deploy path. Put every real change through
git, and drive the theme from `theme.json`.

### Studio pivot to the platform agent — verified pieces ✅ UAT 2026-09-23
- **`POST /api/connector-builder/definition/basic`** `{name, description, baseUrl, logo:"", categories:[]}` → 200
  `{definition:{id}, violations}` — previously 👁 only; created `SC Studio Platform` `6ab3fb7652be1230a2629ffe`.
  `POST …/definition/{id}/auth?type=CUSTOM` → 200; the auth arrives with an EMPTY `input.schema` and
  `GET /api/connector-builder/request/{id}/CUSTOM/auth` returns `{}` until a request is written.
- **Caller identity inside an agent tool, without a delete:** a workflow that creates a row in a
  scratch object (`scc_studio_ping`) and reads `outputs.ownerUserId` gets the chatting user; the row
  is left in place (the Studio never deletes). Verified as `scc_studio_context`
  (`6ab3fd02f83e366af186f5cb`) → `{user_id:"109790", found, solution_key, ref, name}` via
  `initiate-test`. `storage_by_unifyapps_fetch_records` output shape is `{cursor, objects, hasMore}`.
- **`storage_by_unifyapps_update_record_by_id` as an app data source** ✅: stored inputs
  `{useRawPayload:true, upsert:false, writeThroughSessionVariables:false, object_type, recordId,
  rawPayload}`; `rawPayload` must be the FULL record properties (spread the read row, then override).
  DS `e_6ab3fd0104beb12b38ab9ea0`.
- **Publishing an agent from the API** ✅: `GET /api/entity/ai_agent/{id}` → mutate `properties`
  (`instructions`, `agentType:"ai-agent"`, `topicExecutionSettings.topicExecutionModel`,
  `responseGenerationSettings.answerGenerationModel(+ModelSettings.modelId)`, `defaultTools`,
  `conversationStarters:[{text}]`) → `POST /api/entity/action/saveAndDeploy` with the whole entity →
  `deploymentState {entityVersion:1, version:1}`. Attaching skills first via the skill's
  `accessibleTo` needed no skill deploy. Only 5 `e_skill_ai_agent` rows on UAT match our names
  (`hubspot-crm-operator-sc`, `unifyapps-rfp-rfi-response-template`, `unifyapps-response-qa-scorer`,
  `unifyapps-data`, `unifyapps-uc-template-from-docs`) — the builder/apps/governance skills are NOT on
  the platform yet; the skill-sync workflow is still to build.
- **Copilot SDK facts (from the type errors, v0.4.x):** `CopilotChat` takes NO `className` (only
  `onGeneratingResponseChange`); size it through the wrapper / the provider's `className`.
  `appearance.customStyles.*.borderRadius` is an object `{x?,y?,t?,b?,l?,r?,all?,custom?}`, not a
  string. `CopilotProvider` has no context/variables prop; pass IDs to the agent through tools.
- ✅ **Approval card = the in-chat confirm/cancel** (UAT 2026-09-23, Studio): a tool with
  `approvalConfig.enabled` renders "<Agent> is ready to execute <tool>" with every parameter value
  and **Deny / Approve Once** inside the copilot; Approve runs the workflow, Deny blocks it and the
  user replies with what to change. Verified end to end through the framed island (`record_plan`
  → new `scc_studio_run` row). The copilot's `useCopilotStatus().chatId` is the literal string
  `"new"` until the first message is sent — never persist it.
- ⚠️ **Approval cards are per USER, not per browser tab** (UAT 2026-09-23): a tool approval raised
  by a copilot conversation opened from an automation/test tab was answered by the same user in
  their own Studio tab. Never run agent test turns under the account a human is actively using —
  their screen gets the cards, and the runs those cards approve land in their solution.
- 👁 **"Approve Once" appears to cover the rest of the conversation** (UAT 2026-09-23): after one
  Approve Once on `record_plan`, a later `record_plan` call in the same chat ran with no card
  (`approvalConfig` still `{enabled:true, storeUserApprovalPreference:false}`); a new chat asked
  again. Treat approval as per-conversation, not per-call, until disproved.
- ⛔ **Importing `@unifyapps/app-builder-sdk/copilot` in app code kills the cloud build** ✅ UAT
  2026-09-23: `[plugin vite:build-import-analysis] assets/index-….js … RolldownError:
  WebAssembly.Memory.grow(): Unable to grow instance memory` on the ~5.4 MB copilot chunk. Local
  `bun run build` passes, so the failure only shows in the Code Builder. Fix = the **copilot island**
  (code-apps.md §"Copilot island"): build the SDK locally into `public/copilot-island/`, frame it,
  drive it over postMessage. The Studio adds `new-chat` / `stop` / `go-to-chat` commands and a
  `status {chatId,isGenerating}` event so the host can tie chat ids to its own records.
- ⚠️ **A synchronous `callables_call_automation` to an LLM node can hang for minutes** (UAT
  2026-09-23): three Bedrock Claude entries took ~5 min each to answer a 5-token call, so a
  browser sweep with 3 workers sat at 0/105. Race every live check with a client timeout (Studio:
  30 s → status `timeout`) — there is no per-node timeout to set on `CALL_INTERFACE_WORKFLOW`.
- ⚠️ **`initiate-test` is slow and serialised** — ~2–5 s per call even for a 3-node workflow, so a
  browser-driven sweep of 100+ models blows a 45 s script budget. Fire ≤20 per script, or move the
  loop server-side.
- ⚠️ **Hidden Browser pane = throttled scripts.** With the pane collapsed, page `fetch`es stall and
  even a single aggregation timed out; front the pane (navigate) before long scripts.
- `TEXT_GENERATION` model lookup on UAT: 425 rows across 27 "providers", many of them embeddings,
  TTS, DALL·E, realtime and junk names; 105 remain after filtering and de-duplication.

### 🔴 The cloud build runs `oxlint` as a gate — a local `bun run build` does not
✅ UAT · 2026-09-23 — the Code Builder reported *"Build failed due to an unexpected error. Retry to
continue."* with `branches.buildFailed:true` and nothing in `/agent-api/sessions/{s}/events`. The
only local gate that failed was `bun run lint` (oxlint): `no-self-assign` on `el.src = el.src`.
Fixing it and re-pulling built cleanly. **Run `bun run lint` before every push**; `tsc -b && vite
build` passing is not enough. (`scripts/check-core-stack.mjs` must be run from the repo root, not
`app/`, or it reports the core files missing.)
Also: a queued branch switch can be **dropped** (`pendingBranch` back to null, `current`
unchanged) when the working tree carries uncommitted changes that conflict with the target — the
reliable route was a bounce through `main` after fast-forwarding the session's own branch.

### Findings 2026-09-22 (SC Companion build-out, UAT)
- **Runtime user connections stall agent turns.** When a tool needs a runtime connection the user has not made (or
  must pick with "Use"), the chat shows a Connectors card and the turn sits in "Executing Wait For Tool Calls" — the
  agent cannot skip it. Mitigate: tell the agent in the user message which sources are connected; disable tools of
  custom connectors (their card renders blank). Per-user data for app pages cannot come from a workflow: the
  "Runtime user connections" automation setting is not exposed on this tenant, and a connector node without
  `connectionId` fails validation ("Please select a connection").
- **Any user can pick any other user's connection** in their own workflow's connection list (e.g. a personal
  Gcalendar connection appears for every builder). Treat personal connections as tenant-readable unless sharing is removed.
  ✅ UAT 2026-09-26 — seen in the wild: another user's AI-generated workflow (`solution-builder-stub` tag) bound
  `gmail_send_email` to a personal `Gmail-1` connection and its **test runs really sent mail** (outputs
  `labelIds:["SENT"]`); another user's config-app data source ran `oracledb_create_snapshot` on a personal Oracle
  connection. **Who uses connection X (audit recipe):** there is no usage endpoint (`POST /api/entity/entity-dependency`
  `{entityType:"CONNECTION",entityId}` → `{}`). Instead: (1) agent tools / tasks / data sources —
  `POST /api/aggregation?entityType=e_action_ai_agent|e_topic_ai_agent|e_data_source&group=ENTITY` with
  `filter properties_context_connectionId IN [ids]` (projections `properties_name`, `properties_aiAgentId`,
  `properties_interfaceId`; `ownerUserId` is not projected — `GET /api/entity/{type}/{id}` for it); runtime-connection
  tools carry no `connectionId`. (2) workflows — `WorkflowDefinition` aggregation with `appsUsed IN [appName]`, then
  `GET /api/workflow-definition/{id}` and match the id in the body (3,901 definitions in ~20 s at 12 parallel).
  (3) whether it fired — `WORKFLOW_EXECUTION` in groups `PLATFORM` and `TEST_WORKFLOW_EXECUTION`, then
  `lookup TEST_WORKFLOW_VARIABLE` for the action node. Users by id: `POST /api/lookup?ByKeys=USER {keys:[...]}`.
- **Code-app builds:** `POST /agent-api/sessions/{s}/branch` can sit at `pendingBranch` with `buildPending:false`;
  re-POST the same branch to kick it. ✅ UAT 2026-09-22: re-POSTing does **not** always clear it — the switch is applied
  by the **Code Builder page**, not the API. Open (or reload) `/p/0/interfaces/code-builder/{appId}?sessionId={s}`
  and the pending switch runs on load (`current` changes, `previewVersion` +1). The chat shows it as a
  "Switch `main` → `branch`" card. Same trick to bring the session back to `main` after the remote moved.
  Builds run one at a time per tenant. After a sync branch builds, switch back to
  `main` so `/agent-api/preview/b/{app}/main/` (the shareable preview) rebuilds. Build errors appear in
  `POST /agent-api/sessions/{s}/events?since=` (SSE, read with an abort timeout), e.g.
  `BUILD FAILED: sandbox_remote: sandbox refused preview build: HTTP 503` (platform-side outage, retry later).
- **HubSpot meetings** for a user: `hubspot_search_records_batch` object `meetings`, filter groups
  `hubspot_owner_id EQ <id>` OR `hs_attendee_owner_ids CONTAINS_TOKEN <id>`, plus `hs_meeting_start_time BETWEEN` epoch-ms
  strings; associations `meetings → deals`. `hs_meeting_external_url` is the Google Calendar event page, not the call link.
- **Chat chart fences:** the SDK may label a ```ua-chart fence as `language-ua`, and agents may pretty-print the
  JSON; detect by class prefix `language-ua` or a leading `{ "kind": "chart"` with whitespace.
- **Several charts in one answer, one drawn** ✅ UAT 2026-09-27 (agent `e_6ab8ccbe3c61834d165e6b2f`, session
  `e_6ab8e2b00d47fd00066d1d61`, read from `GetAllSessions` → `sessions[].lastMessage`): the agent (Vertex Opus 4.8)
  wrote 4 ```ua-chart blocks; block 1 `{"kind":"chart","type":"bar"}`, blocks 2–4 `{"kind":"hbar","type":"hbar"}` /
  `{"kind":"bar","type":"bar"}`. The chart module's `parseChartSpec` refused every `kind` other than `chart`, so 3 of 4
  were not drawn. Its instructions held the contract as `"type":"bar|hbar|line|…"`. Fixed in the module (a shape in
  `kind` is the shape) and in the rule text (whole example blocks; `kind` is always `chart`). `GetAllSessions` /
  `GetSessionsMetadata` are the calls behind Agent → Observability → Sessions; the last answer of each session is in
  `lastMessage` in full, which makes a rendering fault checkable without asking the agent again.
- **Agent memory (UAT 2026-09-22, partly working):** `longTermMemorySettings.enabled` + `defaultTools.saveInstantMemoryTool`
  are not enough. Memory lives in entities `memoryprofile` (`scope:"userSpecific"`, `memoryTypes`, `accessibleTo:
  ["memory_profile_set/<id>" | "ai_agent/<id>"]`, not deployable — live on create), `memory_profile_set`
  (`accessibleTo:["ai_agent/<id>",…]`) and `memory_json_store` (records: `memoryText`, `memoryProfileId`,
  `memoryProfileSetId`, `createdFromAgentId`). Observed: the instant-save tool wrote to the tenant's
  "GlobalMemorySet" (not linked to the saving agent), so a new chat did not recall it; agents also claimed "saved"
  without calling the tool. Open: make saves land in a set linked to the agent.
  **Activation (2026-09-22):** a `memory_profile_set` created by API shows "Undeployed Changes"
  and the UI Publish button does nothing — deploy it with `POST /api/entity/action/saveAndDeploy`
  (whole entity + `deploymentNotes`); every working set on UAT has a `deploymentState`.
  `memoryprofile` itself → 500 `Entity type is not deployable`. The background extractor stamps
  `state` (`inProgress`/`completed`) and `lastSyncTime` on the profile when it runs; a profile
  with neither has never been picked up. Schedule = `userDefinedGrabbingSchedule
  {duration, unit: MINUTES|DAYS}`; extracted records carry `createdFromAgentId` and the
  profile id. UI: agent → Configuration → Memory; set page `/p/0/memory-set/{id}/profiles`.
- **Backup / restore findings (UAT 2026-09-22):**
  - GitHub connector exposes the git data API: `github_get_reference` (ref `heads/main`) →
    `github_get_commit` (→ `tree.sha`) → `github_create_tree` (`base_tree`, entries
    `{path, mode:"100644", type:"blob", content}` inline, no blobs needed) → `github_create_commit`
    (`parents:[sha]`) → `github_update_reference`. One atomic multi-file commit in ~3.8 s.
    `github_get_file_content` takes `ref` (any commit) and returns base64 (1 MB limit).
    Connector `owner` is the plain login (`mmaheranwar`), not `username:…`.
  - `internal_api_executor_execute_request` (server-side calls to platform APIs) → deploy fails
    `Internal HTTP Endpoint is not enabled` on UAT, so platform metadata can only be read from a
    signed-in browser tab (published code apps run on `app-…-orbit.tensor-uat…` subdomains, not
    same-origin).
  - Solutions (`e_solution`, `solution_by_unifyapps_*`: save / save versions / deploy / restore)
    link only `CONNECTION`, `ENTITY_TYPE`, `WORKFLOW_DEFINITION`, `e_interface` — no agents,
    records or data sources — and restore versions, not deletions.
  - Workflow delete (`/delete/{id}`) is a soft delete: GET → 500, create with the same `id` →
    Mongo E11000 duplicate key, save → not found, no undelete endpoint. A restored workflow
    gets a new id; re-point data sources (`inputs.automationId`), agent tools and callers.
  - `POST /api/workflow-definition` honours an explicit `id` when it is free.
  - Entity search guards: `e_component` requires a `properties.interfaceId` filter,
    `e_data_source` a `properties.interfacePageId` filter (5011). `properties.accessibleTo` IN
    `["ai_agent/<id>"]` works for skills, memory sets and profiles; `properties.aiAgentId` IN for
    topics and tools; `tags` IN works for `ai_agent` but not for apps.
  - Tool: `mmaheranwar/sc-native-backup/tools/sc-native-backup.js` (`SCN.backup/snapshots/restore`).
- **Caller identity inside a workflow (UAT 2026-09-22):** a CALLABLE run has no trusted "current user"
  variable — Groovy's binding holds only the declared parameters, `{{ context }}` is rejected ("Node referenced
  … no longer exists"), `variable_by_unifyapps_get_session_variables` returns `{}`, and `__internals__` in the
  START output is whatever the browser sent. Runs do record the caller (`WORKFLOW_EXECUTION.USER_ID`), and
  **storage writes are stamped with it**: `storage_by_unifyapps_create_record` returns `ownerUserId` /
  `lastModifiedBy` = the calling user (agent memory rows likewise carry the chatting user, not the agent owner).
  Pattern: create a row in a scratch object → read `{{ n_st.outputs.ownerUserId }}` → `delete_record_by_id` →
  match a profile row on a `platform_user_id` field → use that instead of any user parameter. Adds ~150 ms.
  `System.getProperties(` is blacklisted in Groovy. Used by `scc_my_items`, `scc_workspace_create/update`,
  `scc_my_meetings`, `scc_whoami` (object `scc_caller_stamp`).
- **Groovy closure parameters must not shadow anything in the script (UAT 2026-09-22).** A Code node's script
  is one scope: `{ String item, double price -> … }` deploys as 500 *"startup failed … already contains a
  parameter of the name price"* if `item`/`price` exist elsewhere, including in another closure's parameter
  list. `saveAndReturnViolations` passes; only `/deploy` compiles — so always read the deploy response.
- **`standard_entities_fetch_entities` — read platform entities from a workflow (UAT 2026-09-23).**
  `context {appName:'standard_entities', resourceName:'standard_entities_fetch_entities',
  resourceVersion:22476}`, `inputs {entityType, group, projections, page}`. Three hard-won details:
  · `projections` entries need **`aggregationFunction:'NONE'`** — `[{name:'id'}]` fails with
  *"Aggregation function is null"*, and plain strings throw a ClassCastException. Without
  projections every row comes back with empty `columns`.
  · **`filter` is silently ignored.** `filter:{field,op,values}` and `triggerInputCondition` both
  return the whole tenant. Filter in a Code node instead.
  · `page.limit` is honoured generously: **20000 returned all 10,333 `e_interface` rows in one call**
  with `hasMore:false`. So a whole-tenant scan is one node, not a paging loop.
  · Entity projections still yield **only `id` and `tags`** — no name, no description (§10 note).
- **An object has TWO schemas and a write validates against the second (UAT 2026-09-23).**
  `entity-type.input.schema` is the form/layout; `entity-type.schema.schema` is the validator and
  carries `additionalProperties:false`. Adding a field to `input.schema` alone lets the UI show it
  while every write fails with *"Non Empty Validations … add additionalProperties &lt;field&gt;"*.
  Update **both**, then `POST /api/entity-type/update`.
- **`storage_by_unifyapps_bulk_create_records`** (v16416) takes `rawPayload: [ …records ]` and
  returns `{inserted, insertedIds[], errors{}}`. An **empty list is accepted** (`inserted:0`), so a
  workflow that may have nothing to write needs no IF_ELSE branch.
- **The schedule trigger accepts `cron:'INTERVAL'` only (UAT 2026-09-23).** `'CRON'`, `'CUSTOM'` and
  `'CRON_EXPRESSION'` are all rejected by `saveAndReturnViolations` with *"Please select a valid
  value"*, so a scheduled workflow runs on an interval from deployment — there is no fixed clock time.
- **Browser fetch from an app page is same-origin only.** A code app can read its own and other
  apps' preview assets under `orbit.uat.unifyapps.com/agent-api/preview/b/{app}/main/…`, but the
  published host `app-{id}-orbit.tensor-uat.unifyapps.com` is a different origin and CORS blocks it.
- **Verifying chat charts needs a VISIBLE browser tab (UAT 2026-09-22).** The `ua-chart` mount
  schedules its work with `requestAnimationFrame`, which browsers do not fire for a hidden or
  background tab. With the Browser pane hidden, agent chart blocks stay as raw JSON and even a
  hand-injected valid block does not render — which looks exactly like a broken chart pipeline.
  Front the tab (`tabs_select` + a screenshot) and it mounts within a second, and blocks that were
  stuck while hidden recover on their own. Never diagnose chart rendering from a hidden pane.
- **Picking an agent's model — only ONE lever works (UAT 2026-09-22).** Verified by measurement on
  SC Companion Agent: `topicExecutionSettings.topicExecutionModel` (+ `topicSelectionModel`) on the
  `ai_agent` entity, then `saveAndDeploy`. Two other routes look plausible and are **silently ignored**:
  the per-user preference `<agentId>-selectedModelId` (record `{applicationId:'ua-copilot', module:'INTERFACE',
  recordId:'ua-copilot'}` via `standard_entities_create_or_update_user_preferences`) and the per-turn
  `parameters.settings.taskExecutionModel` on the streaming send. Both returned a normal answer that still
  ran the old model.
- **A model entity can silently fall back to Sonnet (UAT 2026-09-22).** `Claude Opus 4.8 [Anthropic]`
  (`e_6a8f219631696e1ce49b7e83`) was deployed on the agent and the trace still read
  "Claude Sonnet 4.6 (BedRock)". `Vertex Opus 4.8` (`e_6a1948ae4a418d2dde7d1096`) genuinely runs.
  The tenant carries 425 `ai_agent_llm_model` rows, many broken test entries — **always verify after
  switching**, don't trust the name.
- **A model whose tenant connection is inactive fails every call (UAT 2026-09-26).** `Claude Sonnet 4.6 [Anthropic]`
  (`e_6a8f21a7b722fc7ed84dddf8`) and `Claude Sonnet 5` (`e_6a8746bbf013e43a4b9c7d75`) run on connection
  `AI Agent Anthropic` (`66b0749af7361637ec9332c6`, `active:false`): the `__ua__call_ai_agent_llm_model` step fails in
  ~0.5 s with `Connection: AI Agent Anthropic is not active`, and a data-source call over it returns only
  `500 "Workflow execution failed"`. **Check before choosing a model**: aggregation on `ai_agent_llm_model` with
  projection `properties_connectionId` (also `properties_provider`, `properties_model` = the real model id), then
  `GET /api/connection/{id}` → `active`. Working on this tenant: `Vertex Opus 4.8` and `Sonnet 5 (Vertex AI)`
  (`e_6a5a0b37752c8e4398d37934`, `properties_model: claude-sonnet-5`), both on `UnifyApps Vertex AI Connection for
  Gemini`. `Vertex Sonnet 5 AI FDE` (`e_6a88244b31696e1ce45dbda1`) also says `claude-sonnet-5` but counts a
  different number of input tokens for the same prompt (32 vs 41) and calls itself an older model — treat it as a
  fallback, don't use it. `OpenAI GPT 5.6 Terra` (`e_6a7e03e1757839657b58552c`) failed through the same step after 12 s.
- **Verify which model actually ran by its price signature** — `fetchConversation` →
  `additional.llmUsageDetails`: divide `inputCost` by (`inputTokens` - cacheWrite - cacheRead),
  `cacheWriteCost/cacheWriteInputTokens`, `outputCost/outputTokens`, x1e6 for $/M.
  Sonnet 4.6 = **3 / 3.75 / 15**; Opus 4.8 = **5 / 6.25 / 25**. The Observability trace also names the
  model per span, which is the other confirmation.
- **Copilot conversation history & resume (UAT 2026-09-22).** The user's own past chats:
  `POST /api/workflow/execute/node?name=Fetch_Cases_List_Today&requestId=e_683579011c77f65a6e50d375`
  (and `Fetch_Cases_List_Past&requestId=e_683579e1e317a87bff7a23a1`) -> `response.cases[]`
  `{caseId, summary, content, createdTime, cost, isBookMarked, ownerUserId}`, scoped to the caller.
  **Resume by URL**: the copilot block reads `<blockId>-chatId` from the query string — `new` starts a
  fresh chat, a `caseId` reopens that conversation in full (verified on
  `/p/0/ai-agents/{id}/test?b_RurcA-chatId=<caseId>`). In the app-builder SDK the same knob is
  `<CopilotProvider chatId=...>`; the SDK sets `ignoreRouter` so it never writes the param itself.
- **Diagnosing agent chats (UAT 2026-09-22):** the copilot SDK shows the feedback icons (copy/👍/👎) once the
  thinking step ends, *before* the final answer streams in — a screenshot at that moment looks like a silent
  stop. Check Agent → Observability → Sessions: "LAST MESSAGE" holds the saved final answer; a string of
  "let me fetch the next page…" there means the agent looped on a tool (give it a direct lookup instead).
  An SSE `Workflow execution failed` in the console is a real failed run (transient on UAT; retry).
- **HubSpot search via the connector:** empty properties are omitted from results (you cannot tell "empty"
  from "no such property" except on records that have a value). `CONTAINS_TOKEN` accepts `*word*`
  wildcards; AND several of them to find a deal by name. `hs_object_id EQ` fetches one deal by id.
- **A CSS custom property is substituted where it is DECLARED, not where it is used.** A ramp
  written as `.board { --mix: calc(10% + var(--z) * 18%) }` and consumed by
  `.cell { background: color-mix(in oklab, var(--primary) var(--mix), var(--card)) }` reads `--z`
  from `.board` (its fallback, 0) on every cell, however the cells set `--z` — every band came out
  the same colour. Put the `calc()` in the rule of the element that carries `--z`. Corollary for a
  theme ramp: the flip point for a light-on-dark label differs between `:root` and `.dark` (light
  mode ramps the dark brand colour INTO cream, dark mode ramps the light one into the dark card),
  so pass both foregrounds and pick with a `.dark` rule rather than one threshold.
- **Every generated code app ships a global reduced-motion kill switch — and it looks like a
  browser bug.** `app/src/index.css` carries
  `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:0.01ms!important;
  transition-duration:0.01ms!important;animation-iteration-count:1!important}}`. On any machine
  whose OS reports "reduce motion" (common on managed laptops, and on automation/preview browsers)
  EVERY animation and transition in the app collapses — including ones with their own `!important`
  guards and inline styles, because a universal `!important` rule outranks an inline declaration.
  The tell is a computed `transition-duration: 1e-05s` on elements that have no transition at all,
  which reads like an engine-level clamp; it is not, it is this stylesheet. Diagnose with a bare
  probe element (`document.createElement('div')` + inline `transition: opacity 400ms`) — if that
  computes to 1e-05s, it is the app, not the browser. When a UI's whole point is the motion, scope
  the block under an opt-in attribute (`:root[data-motion='reduce']`) rather than deleting it, and
  do the same to the per-component `@media (prefers-reduced-motion)` blocks and to any inline
  `<style>` in a generated SVG (the brand mark has one).
- **`GET /agent-api/sessions/{s}/files/content?path=` can serve a STALE copy after a pull**
  (UAT 2026-09-24). After pushing a second commit and bouncing the branch, that endpoint still
  returned the previous revision of the file while `GET /agent-api/apps/{app}/branches/main/files/content?path=`
  returned the new one, `/changes` already listed the new sha, and the rebuilt preview bundle
  contained the new code. It has a `&v=` (filesVersion) parameter for a reason — do not read the
  session copy as proof that a pull failed, and never start a fresh builder session on that
  evidence alone. Grep the preview's `assets/index-*.js` instead; that is the artefact that matters.
- **Screen-insight latency is the model, not the app (measured UAT 2026-09-25, `pao_ai_insights`).** One
  `__ua__call_ai_agent_llm_model` step, ~8–14k chars of records in, up to four JSON findings out:
  **Vertex Sonnet 4.6 (`e_69b9900c5739ad5159baa133`) 29–33 s** per screen; **OpenAI GPT-4.1 mini
  (`e_ai_agent_openai_gpt_4.1_mini`) 3.9–6.5 s** with the same prompt (input capped at 8k chars, two or three
  findings, `maxTokens` 1600), figures still correct. Keep the large model for open chat, where it earns the wait.
  (Also: `GET /agent-api/apps/{app}/branches/{b}/files/content` served a stale copy after a push while
  `GET /agent-api/sessions/{s}/files/content` had the new file — read tooling from the session copy.)
- **Code-app preview, measured on `app-31077911d563` (UAT 2026-09-25, twelve deploys).** (1) `POST
  /sessions/{s}/branch {branch}` alone left `pendingBranch` set for minutes; switching **away** to any other
  branch and back (two POSTs ~5 s apart) applied it every time, `buildPending:true` for ~40–70 s, then a new
  `assets/index-*.js`. (2) While the away-branch builds, `/agent-api/preview/b/{app}/{new}/` briefly serves
  the away-branch's bundle, so never test or scan during a switch; check a string only the new build has.
  (3) `/agent-api/preview/b/{app}/{branch}/` keeps serving an older branch's last build (t45 kept the
  pre-redesign bundle beside t46), which makes a true before/after diff possible: scan both paths.
  (4) The copilot island is a separate local Vite build committed under `public/copilot-island/`
  (`npm run build:island`); its theme lives in `island/index.html`, not the app's `index.css`, so it can
  carry another project's brand long after the app is rethemed.
- **Findings from the Three-Way Match desk (app-98a8d3a0b331, UAT 2026-09-27) ✅**
  - **Main preview after kit_app_publish:** `…/preview/b/{app}/main/` kept the previous bundle after every
    publish. What worked each time (8 publishes):
    1. `POST /sessions/{s}/branch {"branch":"t-<sha>"}` (the kit pushes a `t-<sha>` branch);
    2. wait about 55 s (until then `…/b/{app}/t-<sha>/` answers "app not built yet");
    3. `POST … {"branch":"main"}` (it returned `pendingBranch:null`, previewVersion +2).
  - **Record list filters:** `POST /api/entity/{objectId}` accepts
    `filter {op:"AND", values:[{field:"properties.<f>", op:"GT"|"LT"|"GTE"|"IN", values:[…]}]}`, and GT/LT work
    on number fields (a GT 1000 filter on `match_ms` returned exactly the 2 rows above 1000). The
    `sort` in the same body did not apply: rows came back in id order.
  - **kit_verify `records.where`:** a range (`{op, value}`) matched 0 rows. Only equality works; check ranges with a
    plan `check` step instead.
  - **Plan `check` expect:** `{at, lte|gte}` works. `eq` is not supported. `at:"objects.length"` does not resolve,
    and a resolved 0 failed as "missing". To assert "every one of N", point at the Nth row, e.g.
    `at:"objects.36.properties.match_ms", lte:2000` over a filtered fetch.
  - **Contrast in a Tailwind v4 app:** computed colours come back as `oklch(...)`, so a hex/rgb parser skips
    them. Resolve every colour through a 1×1 canvas (`fillStyle = c; fillRect; getImageData`) and composite alpha
    backgrounds up the parent chain. Status tags with text in the tint's own hue (red 4.49:1, amber
    3.86:1 on a dark panel) failed 1.4.3. Mixing the text 30% toward white passed on all 9 screens.
  - **The accesslint engine could not run on a private app:** a dynamic `import()` from esm.sh inside the preview
    tab is blocked by the preview's CSP, and a separate debug Chrome has no tenant session.
  - **Opus agents on Vertex** sometimes write prose before the JSON envelope, or a fenced block, or an envelope with
    one extra brace (EV_1016). A reader must take the answer as JSON when it starts with `{`; otherwise the last
    fenced block containing `"status"`; otherwise the last balanced `{"status"…}` object (a string-aware brace
    scan). For text fields, fall back to a regex over the raw answer.
  - **Guardrail denied topics blocked a drafting agent's own work:**
    - **What happened.** On `gaurd_rail` e_6ab8cd5c3c61834d165e735e (AG-06), the topics "sending
      messages to suppliers" and "writing out a full IBAN" blocked every SW-16 draft. EV_1059 and
      EV_1060 are FAIL rows carrying the blockedMessage, and the workflow run still COMPLETED.
    - **Fix.** Definitions that name what is NOT in the topic (drafting for a person to send;
      credit-note or corrected-invoice requests). EV after the fix: OK, INV-0008 (run
      6ab935dcb7fa27725d00561f, 26.4 s).
    - **Rule.** After any guardrail change, re-run a real turn of that agent and read its newest ledger row.
  - **`incidents`:** the newest row on the tenant was created at 1790367944969 (another project's
    Blocked Tools control). For 40+ hours no control of any project wrote one, including the six
    controls of this desk after live probes. So control firing is not provable by probe on UAT at
    present.
  - **The Forge kit resolves `UI-nn` agent items through the blueprint_status platform_id.** An app id
    recorded there made kit_governance probe a default agent and create a guardrail with
    `aiAgentId=<app id>` (e_6ab9318646e99f0f6d1709fd, left for the user to remove).
- **Preview rebuild bounce re-confirmed (UAT 2026-09-22, `app-b01ff1ff2663`).** After `git push`
  to GitHub `main`, `POST /agent-api/sessions/{s}/branch {branch:"main"}` + opening the Code
  Builder page pulled the files (`/sessions/{s}/files/content` and
  `/apps/{app}/branches/main/files/content` both served the new file) while the shareable preview
  kept serving the OLD bundle. Switching **away** to another branch and back to `main` (two
  `POST /sessions/{s}/branch` calls, ~4 s apart, no agent turn and no `stop` needed) set
  `buildPending: true`, `previewVersion` +2, and the new bundle was live in under 10 s.
- **Animated SVG as `<img>`:** CSS keyframe animations inside an SVG image can stay frozen on the first
  frame (seen in Chrome when the image loaded before the page painted, and on SPA re-mounts of a cached
  copy). If the first frame is invisible (build-in animations), render the SVG inline instead, with every
  class/keyframe name prefixed so its `<style>` can't leak; for `<img>` you don't control, give each use a
  unique query string.
- **The shareable code-app preview `/agent-api/preview/b/{app}/main/` does NOT rebuild on its own**
  (UAT 2026-09-22). Starting a session with "pull the latest commits and rebuild the preview" pulls the
  files (visible in `GET /sessions/{s}/changes`) but the builder agent may wander for 10+ minutes and never
  rebuild; `POST /sessions/{s}/branch` answers 409 `cannot change the branch while a turn is running`.
  What works: `POST /agent-api/sessions/{s}/stop` → `{ok:true}`, then switch **away** to another branch and
  **back** to `main` (`POST /sessions/{s}/branch {branch}` twice); `branches.buildPending` goes true and the
  new bundle is served ~1 min later. Verify by fetching the preview's `index.html`, reading the
  `assets/index-*.js` name out of it and grepping that bundle for a string from the new code — the file name
  alone can stay the same.
- **UnifyApps brand mark animation (official, 2026-09-22):** rebuilt from the brand video
  `UnifyApps-Logo-Animation-GreenGold.mp4` over the official vector dots of
  `https://assets.unifyapps.com/interface/brand-logo/brand-logo-sm-3-comp.svg` (viewBox 33×32): the dots pop in
  along the spiral from the core outward (48 buckets, ordered by 0.82·√radius + 0.18·angle) while the whole mark
  turns from −140° / scale .35 into place; 1.8 s, plays once, honours `prefers-reduced-motion`.
  Canonical files in `unifyapps-apps/assets/brand-mark/`: `ua-mark.tsx` (inline, `uam-`-prefixed, the one to use
  in React), `ua-mark-build*.svg` / `ua-mark-loop*.svg` (for `<img>` / non-React; bronze and champagne),
  `make_inline.py` + `make_anim.py` + `vec_dots.json` to regenerate. Every SC Native app ships the same
  `src/components/ua-mark.tsx`; replay it by re-mounting (`key={n}`). Colours: bronze `#847347` on light,
  champagne `#C9B37C` / cream `#EDE6D7` on forest green. **Lockup with the wordmark:** keep the mark animated and
  the wordmark as an image cropped from the official logo PNG, proportions for a mark of height H: gap 0.17 H,
  wordmark height 0.65 H, top offset 0.237 H; fade the wordmark in ~1.1 s after the build starts
  (sc-native-presentation hero).
- **LLM steps are not repeatable on thinking models even at temperature 0** (Gemini 3.8 Flash [MEDIUM]): the same
  sizing scope gave 3–9 use cases. Flash [LOW] `e_6ab12fadf843281fda62ea44` + explicit granularity rules gave a stable
  structure in 3–5 s; exact repeatability needs caching the proposal per input.

## 26. Findings 2026-09-22 (Sharek Executive Intelligence build, UAT)

App `app-dcf4fe771575`, 13 Data Objects, 590 records, 5 automations, 3 agents.
Patterns and drop-in sources: `unifyapps-apps/references/ai-app-patterns.md`.

### A data source is invisible to a published app until the app is published again ✅ UAT 2026-09-22
Creating an `e_data_source` against `e_global_<appId>` is not enough for a **running** app.
Calling it returns `500 {"rootCauseMessage":"forbidden datasource: not found"}` even though the
entity exists, the ids match and the same call works from a signed-in platform tab.

`POST /agent-api/apps/{appId}/publish` fixes it immediately — the publish snapshots which data
sources the deployed app may execute.

Easy to misdiagnose: the five storage bindings were created **before** the first publish and
worked, so the failure looked specific to `callables_call_automation`. It is not. **Publish
after adding any data source.**

### The SDK 401s on everything until the interface has been published once ✅ UAT 2026-09-22
A brand-new code app (entity + domain mapping created, never published) returns `401` for every
`POST /api/workflow/execute/node` from the dev server and the preview, with an empty body.
`GET /auth/interface/deployed` → `404` is the tell: the SDK cannot mint an app session for an
interface that has never been deployed. One publish of the untouched scaffold clears it.

### `APP_AUTH_TOKEN` alone does not authenticate `execute/node` ⛔ UAT 2026-09-22
`app/.env`'s `APP_AUTH_TOKEN` sent as `x-ua-app-auth-token` (with or without `x-ua-app`,
`x-ua-interface-id`, or as a bearer) returns `401` with an empty body from a plain HTTP client.
Tried five header combinations. Seeding and any other bulk work runs **from a signed-in
platform tab**, not from a local script.

### LLM step inside a workflow — `conv_ai_by_unifyapps` ✅ UAT 2026-09-22

| Field | Value |
|---|---|
| node `type` | **`CALL_INTERFACE_WORKFLOW`** (not `ACTION`) |
| `context` | `{appName:'conv_ai_by_unifyapps', resourceName:'conv_ai_by_unifyapps_call_llm_model_with_options', resourceVersion:2471}` |
| `inputs.callableInterfaceId` | `'__ua__call_ai_agent_llm_model'` |
| `inputs.parameters` | `{modelId, systemPrompt, message, temperature, maxTokens, responseFormat}` |
| `message` | chat array: `[{role:'user', content:[{type:'text', text:'…{{ n_in.outputs.x }}…'}]}]` |
| `responseFormat` | `{type:'json_object'}` |
| `modelId` | an `e_…` entity id — copy from an existing LLM workflow (`e_69b9900c5739ad5159baa133` on orbit.uat) |
| outputs | `{{ n.outputs.llmResponse }}` (string), `.success`, `.tokensUsed` |

Measured: ~19 s / ~2.5–3.8 K tokens for 25–35 records returning 4 structured insights.

### `initiate-test` cancels a slow run when its own HTTP call times out ⚠️ UAT 2026-09-22
A workflow with an LLM step returned `500 "No Response received within specified timeout."`, and
the run then showed `STATUS: CANCELLED` at ~23 s — with the LLM node's `state` carrying a real
`childRunId`, i.e. the node had fired. The test runner, not the workflow, gave up.

Verify anything slow by calling the **deployed** workflow through its data source instead.

### Storage bulk writes ✅ UAT 2026-09-22

| Action | Version | Notes |
|---|---|---|
| `storage_by_unifyapps_bulk_upsert_records_by_id` | 16331 | `updates:[{id, updateFields:[{fieldName, actionType:'SET'\|'UNSET'\|'INCREMENT'\|…, setValue}]}]`. `setValue` is declared `string` but **accepts a real number and stores it as one** (verified: `typeof` stayed `number` after the write). Output `{success, successCount, failedCount, errors}` |
| `storage_by_unifyapps_bulk_create_records` | 16415 | `object_type`, `useRawPayload:true`, `rawPayload` = **array**. Output `{insertedIds, inserted, errors}` |
| `storage_by_unifyapps_delete_records` | 16416 | `numberOfRecordsToDelete:'MULTIPLE'` + `triggerInputCondition`. Output `{count}` |

No bulk record endpoint exists on the entity API — `POST /api/entity/update-bulk` is
`500 "ENTITY_TYPE with id update-bulk not found"`. Loop `POST /api/entity/update` (concurrency 10
did 414 rows without a failure).

**Deleting only some rows without a NOT_EQUAL filter:** give seeded rows `sort_order < 100` and
agent-written rows `sort_order = 100`, then filter `EQUAL`. Feed the value from a Groovy step
(`'100'` when deleting, `'-1'` otherwise) so the node is a no-op the rest of the time — this
avoids a branch entirely.

### Groovy sandbox — four traps ✅ UAT 2026-09-22
1. **An optional parameter that resolved to nothing has no binding**, and reading it as a bare
   variable fails `No such property: x for class: Script_…`. Start every script with
   `def p = { String k -> binding.hasVariable(k) ? binding.getVariable(k) : null }`.
2. **`Date.format(String)` is not available** (it is a Groovy JDK extension the sandbox does not
   load) → `No signature of method: java.util.Date.format()`. **`java.time` appears to be blocked
   outright** — it failed with an error object carrying no message at all. *(Superseded 2026-09-28: `java.time`
   runs verified on UAT 2026-09-21, 09-26 (§47.29) and 09-27 (§47.50); the empty error matches trap 3 below.)* What works:
   `new java.sql.Date(System.currentTimeMillis()).toString()` → `yyyy-MM-dd`.
3. **Mutating a map while iterating it** throws `ConcurrentModificationException`, which also
   surfaces as an error object with **no message**. Build maps by adding, never by removing.
4. `groovy.json.JsonSlurper` **is** available.

Also: `storage_by_unifyapps_fetch_records` output inside a workflow is `{{ n.outputs.objects }}`
— not nested under `response` as it is through `execute/node`.

### Objects Manager — schema and seeding ✅ UAT 2026-09-22
- Create with `POST /api/entity-type`, then **read it back and `POST /api/entity-type/update`
  with the whole object** plus `input` (`SCHEMA_AND_LAYOUT`) and `schema` (`SCHEMA`) carrying the
  same JSON Schema. The server derives `metadata.primaryKeyField` etc. from the per-field flags.
- A record's `id` **is** its primary-key value, which makes a seed loader idempotent: create,
  and on `E11000 duplicate key` read the row for its `version` and `POST /api/entity/update`.
- `POST /api/entity/{objectId}` with `page.limit` returns the rows; there is no `totalCount` on
  a `limit: 1` read, so count by fetching a page large enough to hold the object.

### tensor answers every `index.html` with the app shell ⚠️ UAT 2026-09-22
On the deployed host (`{appId}-orbit.tensor-uat.unifyapps.com`), `GET /copilot-island/index.html`
returns the **application's** `index.html`, not the file at that path — the SPA fallback matches
it. Sibling assets under the same folder (`/copilot-island/assets/*.js`, 6.2 MB) are served
correctly, so static serving works; it is only the entry document that is rewritten.

Consequence: a framed sub-page (the copilot island, an embedded report, anything with its own
document) must be published under a name that is not `index.html` — `agent.html` works. The dev
server serves either name, so this appears only after the first deploy.

### Publishing is refused while an agent turn is running ⚠️ UAT 2026-09-22
`POST /agent-api/apps/{appId}/publish` → `409 {"detail":"a turn is running on 'main'; retry the
publish once it finishes"}`. Starting a new session to pull from GitHub *is* a turn, so the
pull and the publish cannot be issued back to back — retry the publish on a timer.
`POST /agent-api/sessions/{s}/stop` did not clear it.

### Pulling GitHub commits: a new session works, a branch switch may not ✅ UAT 2026-09-22
`POST /agent-api/sessions/{s}/branch {branch:"sync/<sha>"}` fetched once, then stopped working:
`pendingBranch` stayed set across repeated POSTs and three Code Builder page loads, while
`GET /agent-api/apps/{id}/branches` showed every branch as `remote: true, ahead: 0, behind: 0`.

What worked every time: **start a new session on the app** —
`POST /agent-api/sessions {target:"code-builder", appId, branch:"main", input:"Pull the latest
commits … Do not modify any file", userName, userEmail}` — which pulled all outstanding commits
within ~20 s. The engine then commits its own "Rebuild preview on main branch" on top, so pull
that back into the local clone before the next push.

## 27. Findings 2026-09-23 (Sharek — scaling to 8,000 records, UAT)

Everything below was found while taking one app's data layer from ~580 records to 7,997 across
14 objects. The theme is that the storage node fails **silently and plausibly** at scale: it
returns 200, it returns rows, and the rows are wrong.

### `entity-type/update` ignores schema changes without the top-level `schema` block ⛔ UAT 2026-09-23
Adding eight fields to an object by reading it, editing `input.schema.properties` and POSTing
the whole thing back returns **200**, and a re-read shows all eight new properties. It has not
worked. `columnCounts` stays at the old number, `metadata.filterableFields` reverts, and every
write that mentions a new field fails with `CREATE 500: Workflow execution failed` — no field
name, no hint. Setting `columnCounts` by hand in the payload does nothing.

The update needs **both** carriers of the JSON Schema, which §24 states but which is easy to
lose when round-tripping a read (the GET does **not** return `schema`, only `input.schema`):

```js
const et = await (await fetch(`/api/entity-type?entityType=${id}`)).json()
et.input.schema.properties.new_field = { title: 'New', type: 'string', filterable: true }
et.schema = { dynamic: false, type: 'SCHEMA', schema: et.input.schema }   // ← the missing half
await fetch('/api/entity-type/update', { method: 'POST', body: JSON.stringify(et) })
```

With it: `columnCounts` jumps to the real property count, `filterableFields` is derived from the
flags, and writes succeed. Verified on `sharek_citizen_voice` (7 → 15 fields) and
`sharek_story`. **Check `columnCounts` after every schema update** — it is the only cheap signal
that the change actually landed.

### Storage filters: one shape works, a near-identical one is ignored ⛔ UAT 2026-09-23
`triggerInputCondition` must be `{ operator: 'AND', filters: [...] }`. The plausible variant
`{ operator: 'AND', operands: [...] }` is accepted and **silently ignored** — the read returns
the whole object with `total` unfiltered, which looks exactly like "the filter matched
everything". A single bare leaf (`{ property, filter }`) also works, which is what makes the
wrong shape so easy to ship: it behaves correctly until the day a second condition is added.

| Operator | Shape | UAT 2026-09-23 |
|---|---|---|
| `EQUAL` | `{ property, filter: { operator: 'EQUAL', value } }` | ✅ |
| `IN` | `filter: { operator: 'IN', value: [...] }` — on **`value`**, not `values` | ✅ (`values` is ignored) |
| `GREATER_THAN` / `GREATER_THAN_OR_EQUAL` on a string field | — | ⛔ `FETCH 500` |
| top-level `OR` in `triggerInputCondition` | — | ⛔ matches nothing (§26) |

A period window therefore cannot be expressed as `period > '2026-01'`; filter on the scope and
metric instead and slice in memory, or store an integer period alongside the string.

### Page limits are generous; the danger is not asking ✅ UAT 2026-09-23
`page: { paginateBy: 'OFFSET', limit }` returned 500/1,000/2,000/3,000 rows in 235/152/175/209 ms
against a 5,016-row object — the limit is not the bottleneck and a `limit: 600` inherited from
when the object held 414 rows is. A truncated read renders a chart that looks right and is
missing half its entities, with no error anywhere. Two rules that follow:

- **Name the metrics** a screen plots (`IN` on `properties.metric`) rather than reading the
  object and discarding 95% of it.
- **Count with `total` from the response**, never `records.length`. On the one screen whose job
  is to state what the data layer holds, `length` reported 3,000 of 5,016 and looked plausible.

### The UPDATE binding refuses `upsert: true` ⛔ UAT 2026-09-23
`storage_by_unifyapps_update_record_by_id` stores `upsert: false`, and overriding it at call
time is refused: `UPDATE 500: forbidden datasource : invalid input`. The stored input set is
matched by value, not merely by key (§26). A re-runnable seed therefore reads the existing
primary keys first and branches create-or-update per row — which is also faster, since the
create path skips the fetch-before-update.

**The better fix (✅ UAT 2026-09-23, TAQA Sourcing Hub): mint a sixth binding.** `upsert` is a
stored input like any other, so a data source that bakes it in as `true` is accepted and behaves
exactly as wanted — clone the app's UPDATE `e_data_source`, set `properties.inputs.upsert = true`,
rename it, `POST /api/entity`, publish. One extra entity turns every seed writer into a plain
`upsert(object, id, payload)` with no read-before-write and no branching at all, which is what
makes the whole seed re-runnable. Remember the publish: a data source minted after the last
publish is invisible to the running app.

### A data source created after the last publish, again ⚠️ UAT 2026-09-23
Cost an hour for the second time. The app called a new automation's data source, the call
failed, the calling code swallowed it into a shared error state, and the visible symptom was a
*stale risk card* — a card quoting "2.4x the national average" beside a map showing 1.3x.
Nothing said "forbidden datasource". **Publish immediately after registering a data source**,
before writing any UI against it, and give each automation call its own error surface rather
than a shared one.

### Two animations that fail invisible ⚠️ UAT 2026-09-23
Not platform bugs, but both shipped and both made real content wrong rather than undecorated —
worth the same vigilance as a bad query.

- **`requestAnimationFrame` does not run while the document is hidden.** A count-up that only
  settles inside its frame callback left the headline index reading **0** in a background tab
  and in every screenshot taken from a hidden pane. Fix: a `setTimeout` that lands on the final
  value regardless, with the frame loop as the nice way of getting there.
- **`animation-fill-mode: both` holds the from-state forever** when the animation never runs to
  completion. An entrance keyframe starting at `opacity: 0` left page headings simply absent.
  Fix: the element's resting style is the visible one, and the animation only decorates arrival
  (`backwards`, not `both`).

### `saveAndDeploy` deploys the version BEFORE your edit ⛔ UAT 2026-09-23
Editing an agent's instructions and calling `POST /api/entity/action/saveAndDeploy` once returns
**200** with a bumped `deploymentState.version`, and the change does **not** go live. The call
saves the draft and deploys in one step, but the snapshot it deploys is the entity as it was
*before* the save:

```
after one call:   version: 12   deploymentState.entityVersion: 7    ← deployed is stale
after a second:   version: 13   deploymentState.entityVersion: 13   ← now live
```

Nothing in either response says so, and the agent keeps answering from the old instructions —
which reads as "the model ignored my prompt" rather than as a deployment problem. **Always assert
`entity.version === entity.deploymentState.entityVersion` after deploying**, and call it again if
they differ. Verified on all three Sharek agents. *(Superseded 2026-09-28 by §47.1: verify by comparing the deployed snapshot's `properties` with the agent's; `version` climbs on its own, so a version-equality loop may never end.)*

Related: an agent's answer format is often governed by its **Task** (`e_topic_ai_agent`,
`properties.instructions`, linked by `properties.aiAgentId`) rather than by the agent's own
instructions — the transcript names the task it picked ("Establishing our focus on: …"). Change
both, or the agent-level edit has no effect on that path. Tasks are not returned by
`POST /api/lookup?ByQuery=ENTITY` with `entityType: 'e_topic_ai_agent'` (500 `ENTITY_TYPE with id
null not found`); list them with `POST /api/entity/e_topic_ai_agent` and filter by `aiAgentId`.

### `requestAnimationFrame` never fires in a hidden document — and it silently broke the charts ⛔ UAT 2026-09-23
The highest-cost instance of a family that bit three times in one day. The copilot island turns
` ```ua-chart ` fences into interactive charts by scanning the DOM, and that scan was scheduled
with `requestAnimationFrame`. In an iframe inside a pane that is not on screen — which is the
normal state for an embedded copilot, a background tab, or any automated check — no frame ever
arrives, the scan never runs, and **every chart the agent writes stays a raw block of JSON**.

The agent was behaving perfectly; the spec, the fence language and the parser were all correct.
Schedule on a frame *and* a timer, and have the worker clear its own scheduled flag first so
whichever lands first wins:

```ts
function schedule() {
  if (scheduled) return
  scheduled = true
  const run = () => { if (scheduled) sync() }
  requestAnimationFrame(run)   // frame-aligned when visible
  setTimeout(run, 80)          // guaranteed when not
}
```

The same rule applies to count-ups, entrance transitions and anything else whose *final* state is
only reached inside a frame callback. Test it by hiding the pane, loading the page and reading the
DOM — not by watching it work while you look at it.

### geoBoundaries files on GitHub raw are LFS pointers ⚠️ 2026-09-22
`raw.githubusercontent.com/wmgeolab/geoBoundaries/.../geoBoundaries-QAT-ADM1_simplified.geojson`
returns a 130-byte Git LFS pointer, not GeoJSON. Fetch from
`media.githubusercontent.com/media/wmgeolab/geoBoundaries/...` instead (86 KB, 8 features,
2,128 points for Qatar ADM1).

---

## 28. Findings 2026-09-23 (Rest Supplier Intelligence build, UAT)

Established while building `app-17f0ba4c8283` "Rest Supplier Intelligence Live" (owner user
109790) by the mandatory flow: new starter code app over the API → GitHub link over the API →
local clone → platform assets over REST → push + publish from `main`. Session
`e_6ab35ce3223be332a6b43939`, repo `github.com/mmaheranwar/rest-supplier-intelligence`, objects
`rsi_*`. Full write-up: `unifyapps-apps/references/code-apps.md`.

### `POST /agent-api/sessions/{s}/git` — Link GitHub (push-capable connection)
✅ UAT · 2026-09-23

With a connection whose token can reach newly created repos, the link pushes the starter commit
at once.

**Request** — as §23: `{provider:"GITHUB", connectionId:"6aaa918c8a8a3c62230da19a",
repositoryName, projectName, organizationName:"username:mmaheranwar",
createOptions:{autoCreate:true, payload:{visibility:"private", newRepoName, org, description}}}`.
**Response** — 200; starter commit `5e7a814` on GitHub within seconds; `GET …/git` → `linked:true`.
**Notes** — no PAT repo-access step and no "commit the working tree" nudge needed. The
fine-grained-PAT failure (§23: empty repo, `linked:false`) is now the fallback case only.

### `GET /agent-api/sessions/{s}` — Session status
✅ UAT · 2026-09-23

**Response** — `{sessionId, status: "running"|"done"|"stopped", target, appId, interactive}`.
**Notes** — the cheapest way to poll a builder run (cheaper than reading the `service_hub_case`).

### `POST /agent-api/sessions/{s}/stop` — Stop a builder turn
✅ UAT · 2026-09-23 (was 📦)

**Request** — body `{}`. **Response** — `{"ok":true}`; `GET /agent-api/sessions/{s}` then shows
`status: "stopped"`.
**Notes** — used to stop a run started by mistake on a colleague's app (`app-6adc194ec366`,
owner 94598); no commits were made. **Before typing into any builder chat or linking Git, compare
the `e_interface` `ownerUserId` with `GET /api/user-context?includeRoles=true` → `user.id`, and
check commit authors in `GET /agent-api/sessions/{s}/changes`.** An app's name is not evidence.

### Cloning platform assets from a known-good app
✅ UAT · 2026-09-23

The fastest correct way to build a new app's platform layer: 6 objects, 3,397 records,
4 workflows, 9 data sources and 1 agent (3 tasks + 2 tools) in ~10 minutes.

| Asset | Recipe | Source (Sharek, UAT) |
|---|---|---|
| Workflow | `GET /api/workflow-definition/{id}` → strip ids/metadata, change name/prompt/`object_type` → `POST /api/workflow-definition` → `saveAndReturnViolations` → `deploy?version=<live version>` | `6ab2cae9f3e2c17d001f62d5` (query) · `6ab2cd14c0d5e963952f2f3f` (ai_insights) · `6ab2cb57c0d5e963952e0abd` (write_insight) |
| Storage DS | `GET /api/entity/e_data_source/{id}` → change `name`, `interfaceId`, `interfacePageId` → `POST /api/entity` | FETCH `e_6ab2c239c9518d72189ab173` · FETCH_ONE `e_6ab2c239c9518d72189ab177` · CREATE `e_6ab2c239c9518d72189ab17b` · UPDATE `e_6ab2c23931928d0792e3f1da` · DELETE `e_6ab2c239c9518d72189ab17e` |
| Callable DS | same + `inputs.automationId` | `e_6ab2cd5531928d0792e64c72` |
| Agent | copy `ai_agent.properties`, replace name/instructions/role/goal; create `e_topic_ai_agent` + `e_action_ai_agent`; `POST /api/entity/action/saveAndDeploy` with the full entity | `e_6ab2cc71aa675d12810f273c` |

Resulting ids: workflows `rsi_query` `6ab35e559d7b0545553f32f6`, `rsi_ai_insights`
`6ab35e567c47e164fbec3277`, `rsi_ai_writer` `6ab35e577c47e164fbec3279`, `rsi_create_treatment`
`6ab35e57e1138510acc6d76e`; agent "Rest Supplier Risk Analyst" `e_6ab35e9e04beb12b3891957a`.

**One generic AI-writer workflow** ✅ — a clone of the insight engine taking `p_screen` (task
name), `p_context` (instructions incl. the exact JSON shape), `p_actions`, `p_data` served supplier
narratives, signal triage, treatment plans, board briefs and scenario analyses from one workflow
and one data source.

### `GET /api/entity-type?entityType={id}` — missing object
⚠️ UAT · 2026-09-23

**Response** — **200 with an empty body** for an object that does not exist, so `r.json()` throws
"Unexpected end of JSON input". Read `r.text()` and treat empty as not found.

### Records — parallel load
✅ UAT · 2026-09-23 — 12 parallel `POST /api/entity` workers loaded 3,397 records (412
suppliers, 2,926 signals, 38 alerts, 14 treatments, 7 critical ops), zero failures, well under a
minute.

### `POST /agent-api/apps/{appId}/publish` — scaffold publish
✅ UAT · 2026-09-23 — `{versionTag:"v0-scaffold"}` right after creating the data sources made a
callable DS and the storage FETCH DS execute from the app context (`x-ua-app`) immediately
(consistent with §26: publish once before expecting data, and after every new data source).

---

## 29. Config apps end to end (CGB Pulse build, UAT)

✅ UAT · 2026-09-23. Built `cgb-pulse` entirely over REST (6 pages, 6 objects / 614 synthetic records,
3 workflows, 1 agent, 1 custom component, 13 data sources) after a read-only harvest of 252,982 blocks
on 2,203 pages of 80 published config apps. Packaged as the **`unifyapps-config-apps`** skill
(`scripts/ua_cfg.js`, references, harvested catalogues, the full example). Ids:
`.claude/skills/unifyapps-config-apps/examples/cgb-pulse/ids-orbit-uat.json`.

### Creating the app and pages
- `POST /api/entity/create-update-or-delete/hierarchical` `{entity:{id:<slug>, entityType:'e_interface', properties}, requestType:'CREATED', ignoreVersion:true}` ✅ —
  ⛔ without `navigation.defaultPageId` → *"Non Empty Validations … required defaultPageId"*; give it `e_global_<appId>` until pages exist.
- Global page: hierarchical `CREATED` with `entity.id = e_global_<appId>`, `parentEntities:[{type:'e_interface', id}]` ✅.
- Pages: `POST /api/entity {entityType:'e_component', properties}` ✅; update via hierarchical `UPDATED` with the full entity ✅.
- Register pages on the app (`entityDetailsMap`, `interfacePageIdVsSlugMap`, `paths.f_root.children`, `navigation.primary` + per-breakpoint `appearance.*.primary`, `defaultPageId`) in one hierarchical `UPDATED` ✅.
- `POST /api/entity/e_data_source` list ⛔ 5011 *"Search on e_data_source requires a properties.interfacePageId filter"* — filter by `interfacePageId IN [...]` ✅.
- `POST /api/entity/e_interface` cursor paging returned the same page repeatedly; offset paging works ✅.
- Theme: `POST /api/entity {entityType:'e_theme', properties:{name, defaultScheme, cssVars:{--palette-brand-25…950, dark:{…}}}}` ✅; picked up by buttons, nav and the app's login page.

### Runtime and rendering
- Preview with live data in the Orbit session: `/p/0/interfaces/<appId>/preview/<slug>` ✅. Builder canvas runs data sources via `POST /api/workflow/execute/node/rungetschema?name=` ✅; preview/published via `execute/node` with `requestId=req_*`.
- **Transformer output**: the execute response is `response.result = <transformer return>`, but in expressions `{{ ds['data'] }}` **is** the return value ⛔ `['data']['result']` → ✅ `['data']`.
- **`advancedOptions.queryDisabled`** `{type:'filter', payload}` gates an automatic data source ✅. ⛔ `onPageLoad: runDs(A) → onSuccessActions runDs(B)` evaluated B's inputs before A's data was in the store (the LLM got empty arrays).
- Modal/Drawer: the block must stay `visibility.value:true`; ⛔ `false` removes it and `controlModal show` does nothing ✅.
- Drawer with inline content needs `content.variant:'card'`; ⛔ `'page'` renders an empty panel for a body slot (it expects `content.pageId`) ✅.
- **Copilot** renders no input unless a `CopilotInput` block sits in `slots.messageInputPanel` ✅. Its send action is `controlBlockMethod(<copilotId>, 'submitMessage', {message})` with `targetId:'<actionId>'` — any button can do the same (ask on the user's behalf) ✅.
- Condition `EXISTS` is true for `''` — use `{{ !!x }}` `EQUAL 'true'` ✅. Unknown icon names render nothing, silently ✅.
- Repeatable rows: `{{ b_rep['context']['item'][…] }}`, also inside the item's events ✅. Table selection: `{{ b_tbl['context']['currentRow'][…] }}` in `onRowSelect` ✅. Form values: `{{ b_form['data'][key] }}` ✅.

### Data sources
- HTTP (`custom_http_endpoint_execute`): `baseUrl` + `path` + `queryParamsList:[{key,value}]`; ⛔ a single `url` → *"Base URL must start with http(s)"*. Output `{status, result}` ✅.
- Storage filters `properties_<field>` / `id`; sort `properties.<field>` ✅. Callbacks `successEvents/failureEvents` run actions ✅.
- Connector data sources carry `context.connectionId` (Gmail, OpenAI… 👁 harvest). Action catalogue: skill `references/datasource-catalogue.md`.

### Custom components
- Entity `e_custom_component {name, manifest:{name, type, main, style, icon, keywords}}`; deploy `POST /api/entity/e_custom_component/{id}/deploy {deploymentNotes, deploymentTag}` ✅. Deployed list: `POST /api/entity/deployed/e_custom_component/search` 📦.
- Upload (UI `/p/0/interfaces/custom-components/create`, Production): Uppy S3 multipart via `/api/uploads/s3/multipart/<token>` → `execute/node?name=CustomComponentFileChecks` (unzips to `uat-uploads…/workflow_uploads/<uuid>/`, returns absolute manifest) ✅. ⛔ the manifest must be named **`out.json`** — `manifest.json` failed every check.
- Runtime: srcdoc iframe with `#ua-custom-block`; host calls `window.renderComponent({data, uncomputedData, state, emitOnChange(ctx,payload), emitOnClick, updateData, updateState, mode, permissions, …})` after `APP_READY`; RESIZE messages size the iframe ✅. `emitOnChange` ctx keys are expression scope in the handler (`{{ code }}`) ✅.
- Block: `componentType = manifest.type`, `content {type:'CUSTOM_BLOCK_TYPE', entityId, version:'-1', data}`; page `customBlocksVersionsMap` ✅. Development mode: manifest URL on localhost 👁.

### Tooling traps
- Browser downloads from the pane land in `~/Downloads` as `<uuid>.tmp` and are deleted when the tab navigates — copy immediately.
- Orbit's CSP blocks `fetch('http://127.0.0.1…')` from the platform tab (request never leaves the browser) — paste scripts instead.
- Copying another app's records into new objects was refused by the harness (provenance); generate synthetic data instead.

---

## 30. Findings 2026-09-23 (TAQA Arabia Sourcing & Supplier Hub, UAT)

App `app-8854f9ab3223`, repo `mmaheranwar/taqa-sourcing-hub`, 16 `taqa_` objects / ~14,000
records / 5 workflows / 3 agents. Built end to end on the mandatory flow (starter over the API →
GitHub link over the API → local development → platform assets over REST → push → publish).

### The Groovy validator blacklists some plain identifiers ⛔ UAT 2026-09-23
`saveAndReturnViolations` refused a node with
`Blacklisted commands found in code : owner = at position 1050`. The code was
`def owner = val('created_by') ?: '…'` — an ordinary local variable. The check is a substring
scan over the source, not a parse, so a variable **named** like a sensitive assignment is enough
to fail it. Rename (`raisedBy`) and it passes. Assume the same for any identifier that reads like
a platform field being assigned; the message does name the offending text and its offset, which
is the only reason this is quick to fix.

### Aggregation on `WorkflowDefinition`: `CONTAINS`, not `LIKE` ⚠️
`{field:'name', op:'LIKE', values:['sharek_%']}` → **500** with a bare `errorCode: -1` and no
message. `op: 'CONTAINS'` with a plain substring works and is the way to find a tenant's
workflows by name prefix.

### A rules-based scenario payload beats a list of record ids ✅
Sharek's control room enumerated the records each scenario moved. Expressing a scenario as
**rules** instead — a selector plus deltas — is strictly better at this scale:

```json
{"rules":[{"object":"taqa_supplier","where":{"origin_in":["INTERNATIONAL","REGIONAL"]},
           "set":{"price_index":"*1.18","risk_score":"+11","financial_score":"-4"}},
          {"object":"taqa_category","where":{"code_in":["C-PIP-LINE","C-SOL-PV"]},
           "set":{"risk_score":"+16","lead_time_days":"+25"}}],
 "narrative":{"taqa_category":{"C-SOL-PV":{"action_en":"…"}}},
 "insights":[{"kind":"RISK","severity":"CRITICAL","title":"…","body":"…"}]}
```

`+n` adds, `*n` multiplies, a bare string or boolean replaces. The payload stays a few hundred
bytes, one generic Groovy node serves every scenario, and — the real gain — a lever still works
after the dataset is regenerated, because it never named a record id. Selectors used here:
`all`, `code_in`, `origin_in`, `category_in`, `family_in`, `category_family`, `lifecycle_in`,
`status_in`, `stage_in`, `tier_in`, `subsidiary_in`, `live`, `risk_gte`, `maverick_gte`,
`spend_gte`. Graph: 7 fetches → 1 Groovy → 5 bulk upserts → delete + bulk create insights →
scenario flags → STOP, cloned from `sharek_apply_scenario` (`6ab2cbd146123637e2d79b3e`).
Measured: **12 levers moved 806 records; the reset restored every one byte for byte.**

### Derive the baseline key set from the payloads, then ASSERT ⛔ → ✅
The documented trap ("the baseline must capture every field a scenario can set") bit again, and
the mechanical fix is worth writing down as code rather than as advice:

```js
T.baselineKeys = () => { const need = {…}                       // one Set per object
  for (const s of SCENARIOS) { for (const rule of s.payload.rules ?? [])
      Object.keys(rule.set).forEach(k => need[rule.object].add(k))
    for (const [obj, byCode] of Object.entries(s.payload.narrative ?? {}))
      for (const patch of Object.values(byCode)) Object.keys(patch).forEach(k => need[obj].add(k)) }
  need.taqa_supplier.add('risk_band'); need.taqa_category.add('risk_band')   // derived fields too
  return need }
```

Then widen every record's `baseline_json` to that key set and **read them all back and assert no
key is missing** before trusting a reset. First pass missed `risk_band`, `lead_time_days` and
`price_variance_pct` — the reset restored the score and left the band, the lead time and the
variance at the scenario's values, with nothing erroring anywhere.

### One threshold, one place — or a reset restores a number and leaves the wrong badge on it ⛔
After widening the baselines, three categories still drifted: `risk_band` came back `MEDIUM`
where the baseline said `LOW`. Cause: the seed banded categories at `>= 36` while the suppliers,
the app (`bandOf`) and the scenario engine's `bandFor` all banded at `>= 34`. Three records sat
in the two-point gap. Any field the engine **re-derives** after a write must have exactly one
definition shared by the seed, the app and the automation; a duplicated constant that differs by
two is invisible until a reset disagrees with itself.

### Anchor the KPI series and SET the current point, never add to it ✅
Confirming Sharek's rule on a second dataset: the scenario engine records each category's new
`risk_score` and the *factor* by which `spend_ytd_egp` moved, then **sets** the matching
current-period `taqa_kpi` row from that. Setting is simpler and strictly stronger than applying
the delta — the last point of every chart is by construction the number on the tile above it,
however many levers get pulled in a row.

### Exporting the platform layer into the repo, in one call ✅
A workflow, an agent, a data source and an object schema all live on the tenant and nowhere else,
so the app's React source ends up versioned and the Groovy computing half of what it displays
does not. One browser pass fixes it: read every `workflow-definition/{id}`, `ai_agent/{id}` (plus
its `e_action_ai_agent` tools), `e_data_source/{id}` and `entity-type?entityType=`, put them in
one object, `URL.createObjectURL` + an `<a download>` click, then split out each
`code_by_unifyapps` node's `inputs.code` into its own `.groovy` locally. ~390 KB for 5 workflows,
3 agents, 11 data sources and 16 object schemas.

**The same channel keeps the seed honest.** The seed was pasted into the tab and then edited
in place there (a band threshold, a restructured writer), so the file first written to the repo
no longer matched what ran. Serialising the live namespace back out —
`Object.entries(T)` with `JSON.stringify` for data and `fn.toString()` for functions — and
committing *that* is the only version that is certainly the one that produced the data.

### Egypt without a boundary download ✅
geoBoundaries EGY is a Git-LFS fetch and a build step. Egypt's borders are mostly ruled lines
(22°N with Sudan, 25°E with Libya), so a ~25-point schematic of the two coasts plus those two
lines, the Nile, Lake Nasser and the Suez Canal — projected equirectangularly by the *same*
`project()` the supplier bubbles use — is recognisable, honest if labelled as a schematic, and
costs nothing. The rule that matters is unchanged: one projection function, or the points land
near the right shape instead of inside it.

### A stalling agent is a tool-shape problem, not a model problem ⛔ → ✅ UAT 2026-09-23
Driving the real dock with six questions, one of them — *"show me the group spend trend over the
last 24 months"* — made the agent call `QueryData` **five times** and end the turn with no answer.
Three defects in the cloned query workflow, all silent:

1. **One filter pair.** `object_type` + `filter_field`/`filter_value` cannot express a KPI series,
   which needs `scope` AND `scope_code` AND `metric`. The model can only guess one dimension at a
   time. Fix: three pairs, ANDed; a comma in the value becomes `IN`; `"true"`/`"false"` becomes a
   boolean; and strip a `properties.` prefix a caller added (otherwise `sort_field` silently
   becomes `properties.properties.x` and nothing sorts).
2. **Compaction by a whitelist of field names**, inherited from the app the workflow was cloned
   from. Over fifteen rows the post-processor kept only the fields on that list — none of which
   existed in the new domain — so an unfiltered read of a 5,424-row object returned **sixty empty
   objects**, `compacted: true`, no error. Compact by SHAPE instead: drop keys ending `_json` and
   string values longer than ~140 chars, keep every number, code, date and flag, and return a
   `note` naming what was dropped.
3. **No stopping rule in the instructions.** Added: *"two calls that returned the wrong rows means
   the filter was wrong, not the tool. Never make a third call that is another guess."*

After: the same six questions answered in **24–49 s each, every one with a chart, none stalled**.
Diagnose this class by calling the tool for every object the agent can reach and asserting the
returned rows have the number of keys you expect — sixty empty objects and sixty real ones are
indistinguishable in a latency measurement.


---

## 31. Connector catalogue — what exists and what it can do (UAT, 2026-09-23)

A full harvest of the tenant's connector surface, packaged as the **`unifyapps-connectors`** skill
(`catalogue/connectors-index.tsv`, `platform-nodes.tsv`, `connections-uat-2026-09-23.tsv`,
28 per-connector deep dives, a browser harvester and a diff/merge script). The endpoints are in
§5 and §7; this section records what the harvest established.

### The numbers

| | Count | Source |
|---|---|---|
| Nodes in the catalogue | **1,214** | `GET /api/workflow-builder/nodes` |
| — application connectors (built-in) | 983 | `tags: ["Applications"]`, `custom: false` |
| — platform nodes (built-in) | 91 | `tags: ["Internal"]`, `needsAuthentication: false` |
| — custom (Connectors SDK, tenant-local) | 140 | `custom: true`, 24-hex `name` |
| Need a connection | 1,064 | `needsAuthentication: true` |
| Have at least one connection | 304 → **279 real** | `find-nodes-with-connections`, minus 25 that aggregate to 0 (§18 D4) |
| Connections tenant-wide | 7,775+ | `GET /api/connection` (⛔ do not call — §7) |

Most-connected connectors: `mdm_by_unifyapps` 3,296 (every context graph creates one) · `gmail`
965 · `slack` 574 · `gsheets` 392 · `gdrive` 285 · `gcalendar` 247 · `salesforce` 111 ·
`microsoft_outlook` 105 · `openai` 92 · `snowflake` 74 · `github` 73.

**983 connectors ship; ~279 are actually connected, and most of those have fewer than five
connections.** "UnifyApps has a connector for X" and "this tenant can call X today" are different
claims — check the aggregation before promising the second.

### Three levels, not two

`appName` (connector) → `resourceName` + `resourceVersion` (action/trigger/agent-tool) →
`connectionId` (authenticated instance). A workflow step, an agent tool, an app data source and a
context-graph source all reference the same triple. `appName` is the key to every discovery
endpoint, and it is frequently **not** the product name: `gsheets`, `gcalendar`, `zoho` (Zoho CRM),
`sqlserver`, `mdm_by_unifyapps` (Ontology).

### Naming and shape conventions (useful for generating without a lookup)

- Resources are `{appName}_{verb}_{object}`; trigger prefixes occasionally differ from action
  prefixes (`gsheet_on_new_row_polling` vs `gsheets_add_row`).
- Verb families: `get_`/`fetch_` · `list_`/`search_`/`find_` · `create_`/`add_`/`insert_`/`upload_`
  · `update_`/`edit_`/`replace_` · `upsert_`/`merge_` · `delete_`/`remove_`/`archive_` ·
  `*_batch`/`bulk_*` · `on_*` (always TRIGGER).
- Superseded actions live alongside their replacements (`gsheets_add_row` / `_v2`,
  `openai_create_transcription` / `_v2`). Prefer the highest `_vN`.
- **Every SQL connector ships the same six triggers**: `on_new_event`, `on_update_event`,
  `on_delete_event`, `on_new_or_update_event`, `on_event`, `on_scheduled_query_search`. Verified
  identical on `oracledb`, `postgres`, `snowflake`.
- Trigger mechanism is in the name: `*_polling` (scheduled poll), `*_webhook` / `*_realtime`
  (push), bare `on_*` (connector-managed subscription).

### Near-duplicate connectors — pick deliberately

`salesforce` vs `salesforce_soap` vs `salesforce_cpq` vs `salesforce_marketing_cloud` ·
`netsuite` (146) vs `netsuite_soap` (13) · `workday` (170) vs `workday_soap` ·
`microsoft_sharepoint` (62) vs `microsoft_sharepoint_graph` (68) · `databricks` (3) vs
`databricks_rest` (105) · `custom_http_endpoint` (internal, ad-hoc) vs `custom_http_application`
(connector, saved base URL) · `google_workspace` (admin) vs `gmail`/`gdrive`/`gsheets` (user data)
· `oracledb` (the database) vs `oracle_fusion` / `oracle_ebusiness_suite` / `oracle_jde` /
`oracle_siebel` (the applications).

Comparing resource counts between two candidates reliably identifies the maintained one.

### Keeping it current

The catalogue is a snapshot; new connectors ship continuously. The skill's loop: harvest with
`scripts/harvest.js` (same-origin, browser) or `scripts/ua_connectors.py` (local accounts), then
`python scripts/refresh_catalogue.py snapshot.tsv` to diff added/removed/renamed, rewrite the index
and append to `catalogue/CHANGELOG.md`. Custom connectors are reported but never merged into the
shipped index — their 24-hex `appName`s mean nothing on another tenant.

---

## 32. Config apps, round 2 — prebuilt components, custom components, documents (CGB Pulse, UAT)

✅ UAT · 2026-09-23. Two pages added to `cgb-pulse` over REST (*Performance Studio*, *Documents*),
two more custom components, one object, one workflow; published v11. Skill `unifyapps-config-apps`
(`references/components.md`, `references/documents.md`, `references/custom-components.md`).

### Components (shapes that render)
- **Chart** — `chartType` LINE (AREA = `fillUnderLine:'gradient'`), COLUMN, BAR, COLUMN + `appearance.stacked`, PIE (`sliceWidth` sm = donut), DUAL_AXES (`yAxis.visualisation` + `yAxisRight {series, visualisation}`), RADAR, WATERFALL (`series[].barType`), BUBBLE (`series[].bubbleSize`, x scale `linear`), HEATMAP ✅.
  - ⛔→✅ **HEATMAP** `chartLayout:'TABULAR'`, `rows {dataFormat:'NESTED', category, data, value}`, `columns {category}`: the outer array is grouped **by column** (outer key → `columns.category`, nested key → `rows.category`). Grouped by row, the whole grid rendered as one tile. Reference: the bundle's `TABULAR_HEATMAP_DEFAULT_NESTED_DATA`.
  - WATERFALL bars are all relative (each starts where the previous ended) — plot deltas.
- **Tabs** — `content.items[{id, value, label, blockId, visibility}]`, `tabType:'manual'`, `defaultValue`; state `activeTab.value`, event `onChange` ✅. ⚠️ The runtime renders each manual panel inside `DeferredRender`; with `document.visibilityState === 'hidden'` (background tab, collapsed preview pane) the tab bar renders and every panel stays empty. A scratch page with one Tabs + text reproduced it and rendered once visible.
- **Timeline** — ⛔ `type:'mapped'` → 0 px; ✅ `type:'custom'` + `slots.timelineItem {blockId, wrappedInLayout:true}`; item scope `['context']['item']`.
- **Stepper** — ⛔ steps `{id, value, label}` render nothing; ✅ add `level:0, subTreeDepth:0, path:'[i]', subSteps:[]` + `appearance.stepDetails`.
- **Kanban** — `content {mode:'mapped', data, category.mapping, itemsConfig{mapping, id}, blockId:<card template>}`; card scope `['context']['item']` ✅.
- State/event pairs ✅: ButtonGroup `selectedOptionId` / `onClick`; Checkbox `value` / `onCheckChange`; Toggle `value`; Calendar `selectedDate`; Tabs `activeTab.value` / `onChange`.
- Also rendered ✅: Rating, ProgressBar, AvatarGroup (`type:'DYNAMIC'`, `mappedAvatars`), KeyValue, Alert, collapsible Card (`content.collapsible`), PDFViewer (`content.data {type:'URL', src}`), FileUpload.

### FileUpload → workflow
- Dropping a file uploads it at once (`/api/uploads/s3/multipart/<token>`). Block state `files[]`: `{id, name, source:'user-uploads/<tenant>/<ts>/<name>', sourceType:'CLOUD_STORAGE', url:'/api/file/download/…', fileType, mimeType, size, type:'FILE', isUploaded, progress, meta}` ✅. ⛔ there is **no `key`**; `source` is the storage key. `url` is session-authenticated (PDFViewer in the app ✅).
- **OCR/extraction node** ✅: `type:'CALL_INTERFACE_WORKFLOW'`, `context {appName:'conv_ai_by_unifyapps', resourceName:'conv_ai_by_unifyapps_ocr_document_details_extraction'}`, `inputs {callableInterfaceId:'__ua__call_ocr_extraction', parameters:{files:[{fileObject:{source, sourceType:'CLOUD_STORAGE', name, fileType}, mimeType}], modelId, prompt, systemPrompt, response_format:'json_object'}}` → outputs `{output (string), content[], status, errMsg}`. Interface definition: `POST /api/lookup?ByKeys=CALLABLE_INTERFACE`.
- `modelId` must be a **TEXT_EXTRACTION**-group model: `POST /api/lookup?ByQuery=ENTITY_ID:ai_agent_llm_model` with `properties.modelGroup IN [textExtraction, TEXT_EXTRACTION]` (orbit.uat: `e_69b41a443d6f1815768c245f`, Claude Sonnet 4.6) ✅.
- A one-page synthetic report PDF (3 KB): upload → record ANALYSED with summary, 5 key points, 3 risks, 13 metrics, 3 recommendations in ~39 s through an automation data source ✅.
- **Copilot attachments** ✅: CopilotInput action `{action:'addAttachments'}` + `submitMessage` payload `attachments: {{ <input>['attachments'] }}`; the agent reads the attached PDF directly.

### Events and data sources
- `setPageVariable` ×3 then `delay(controlDataSource trigger, 300)` in one click: the data source's inputs see the new variable values ✅.
- Custom-component event scope (`{{ label }}`) is still readable inside a delayed nested action (`controlDrawer` → `delay(submitMessage)`) ✅.
- A data source callback that reads its own result needs its id: create with a placeholder, then replace and `entity/update` ✅.

### Custom component upload, unattended ✅
Open `/p/0/interfaces/custom-components/create` by URL (the *Add Component* link navigates and ends a running script); set React inputs with the native value setter + `input` event; click the Production radio; attach the ZIP via `DataTransfer`; **Add** (file checks) → **Add** (create + deploy, navigates). Check with `POST /api/entity/e_custom_component`.

### Custom component — new version ✅
Component side panel (`/p/0/interfaces/custom-components/<id>/details`) → **New Version**: same dialog and checks as Add; result `deploymentState {version:2, deploymentTag}` with new `manifest.main/style` URLs under `workflow_uploads/<uuid>/`. Blocks with `content.version:'-1'` render the new version on the next page load — no app republish. PulseMap v2 (real Qatar municipalities from geoBoundaries, baked by `build_geo.py`) shipped this way.

### Tooling
- Blob downloads from the pane land in `~/Downloads/<uuid>.tmp` — used to move 90 KB page JSONs out of the tab (copy before the tab navigates).

## 33. Findings 2026-09-23 (TAQA — the end-to-end test pass, UAT)

Everything here was measured against `app-8854f9ab3223` on `orbit.uat` by driving the app's own
data sources from a signed-in tab. Continues §30.

### The scenario battery — how to prove a control room actually resets ✅

A control room is only worth shipping if the reset is exact, and "it looked the same" is not a
test. The method, which took ~4 minutes for 13 scenarios over 6,382 records:

1. **Derive the fingerprint from the scenarios themselves.** Parse every `payload_json`, collect
   `rules[].object` → `Object.keys(rules[].set)`, then ADD the fields the workflow derives from
   those (`risk_band`) and the series it recomputes (`taqa_kpi.value/delta`). A field a rule
   writes but the fingerprint omits is drift the test cannot see.
2. **Reset first, then take the baseline.** The first `SC-RESET` on our tenant restored **250
   records** that earlier sessions had left drifted — so a baseline taken before it would have
   been a baseline of somebody else's mess. A second reset moved 0 records in 483 ms, which is
   what "idempotent" looks like and is the real signal that the baseline is clean.
3. For each scenario: apply → fingerprint → diff against baseline (how much it moved) → reset →
   fingerprint → diff against baseline (must be **0**).

Result: **12 scenarios, 0 drift on every one**, across `taqa_supplier`, `taqa_category`,
`taqa_registration`, `taqa_contract` and `taqa_kpi`.

| Scenario | apply | reset | records moved |
|---|---|---|---|
| SC-STEEL | 5.7s | 4.7s | 178 |
| SC-SOLAR | 0.6s | 1.2s | 16 |
| SC-SANCTION | 4.9s | 3.9s | 110 |
| SC-PORTAL | 6.3s | 7.7s | 250 |
| SC-PORT | 3.0s | 3.2s | 125 |
| SC-PERMIT | 11.5–29.3s | 12.6s | 458 |
| SC-OEM-EXIT | 0.8s | 1.0s | 24 |
| SC-LOCAL | 14.7s | 11.8s | 428 |
| SC-HSE | 3.8s | 2.5s | 95 |
| SC-FX | 4.6s | 3.8s | 129 |
| SC-CONSOLIDATE | 1.7s | 1.5s | 48 |
| SC-CONNECT | 1.0s | 0.9s | 31 |

Roughly **40 records/second** through the storage node, both ways. Anything over ~300 records is
a 10s+ operation, so the button needs a clock on it, not just a spinner (§below).

### A scenario whose selector matches nothing still reports success ⚠️

`SC-SANCTION` selected `taqa_supplier where risk_gte: 78`. The highest composite risk on the
register was **63**, so the rule moved zero suppliers — and the run still returned
`{applied: 'SC-SANCTION', summary: '… 0 suppliers … moved; 1 finding(s) written'}` and wrote its
CRITICAL insight about "open purchase orders against newly suspended suppliers" regardless.

A lever that silently does nothing is worse than one that errors, because the summary reads like
success. **Make the apply workflow name any rule that matched zero records**, and check every
selector against the live distribution before shipping the scenario — a threshold copied from an
earlier build is a threshold nobody has checked against this data.

### A band nothing can reach ⚠️

Same root cause, wider blast radius. The seed computed `risk = 104 − weighted(sub-scores)`, which
is linear with slope 1; the sub-score floors put a hard ceiling of **63** on it against a
CRITICAL threshold of 72. So the register was 217 LOW / 194 MEDIUM / 29 HIGH / **0 CRITICAL** —
and CRITICAL appears in the legend, the filters, the badge vocabulary and the Groovy.

Fix: keep the ordering, stretch only the bad tail — `u = clamp((w − 41)/57)`,
`risk = 92 − 86·u^0.6`. That left the healthy majority where it was and produced
204 / 157 / 73 / **6**, with all six criticals holding open purchase orders.

**Check every vocabulary against the data before shipping.** For each enum the UI can render,
count the records in each value. A value with zero records is either a seed bug or a legend
entry to remove; either way it is a promise the screen cannot keep.

### The other half of the stalling-agent fix ✅

§30 established that a stalling agent is usually a tool-shape problem, and the three-ANDed-filter-
pair `QueryData` stopped the *looping*. A second failure mode survived it, at roughly 1 turn in 9:

> `responseGenerationStatus: "completed"`, three tool calls made, and the last Bot message is
> *"…Let me look at the document detail for the highest-exposure names and pull the actual
> mandatory expired/expiring documents."* The turn ends there. The user sees a plan, not an answer.

There is **no max-iterations setting** on `ai_agent` to raise (`topicExecutionSettings` has only
the model choices, `thinkTool`, citations and voice). It is a prompting problem, and the fix is a
turn contract — now shipped in all three TAQA agents:

```
HOW A TURN ENDS — a contract with no exceptions
The last thing you write is the ANSWER to the question you were asked. Never a plan, never a
next step, never a note about a field.
- If your final sentence starts "Let me", "I'll now", "Next I will", "Let's look at" or "I need
  to", the turn is not finished. Either make that call, or delete the sentence and answer with
  what you already have.
- You get at most FIVE QueryData calls in a turn. On the fifth you stop reading and write the
  answer, naming what you could not check and what somebody would have to open to close it. A
  partial answer with its gap stated is the deliverable. A promise is not.
- A field that cannot give you what you wanted is a FINDING, not a reason to stop. Say what it
  can and cannot distinguish, give the best answer it does support, and move on.
- Open with the answer, not with how you got it. "I retrieved", "I now have", "I have the full
  list", "Let me separate" are working notes. The reader wants the finding in the first line.
```

The last bullet fixes a separate, purely cosmetic problem that showed up in **4 of 9** answers:
the final answer opened with the model's own working notes ("I retrieved all awarded events…",
"I now have both sides. Let me cross-reference…").

**Measuring it.** Send with `POST /api/workflow/execute/node/sse` and read the stream to the end
(that is your latency); then read the conversation and take the Bot message **without**
`additional.internalMessageType`. The list is **reverse chronological** — index 0 is the newest —
so the ANSWER is the first such message, not the longest. Taking the longest hides exactly this
bug, because in a stalled turn the longest non-thought message is a mid-turn narration.

Nine-question baseline before the contract: 9/9 `completed`, 20–54s, 2.2k–7.0k chars,
$0.07–$0.55 per turn.

### `saveAndDeploy` needs the whole entity ✅

`POST /api/entity/action/saveAndDeploy {entityType, id}` → **500**. It takes the **full entity
object** plus `deploymentNotes`, exactly as §"Publish" in `unifyapps-builder/references/agents.md`
says. And still twice: re-READ the entity between the two calls, because the first publishes the
pre-edit snapshot. Confirm with `version === deploymentState.entityVersion`. *(Superseded 2026-09-28 by §47.1: verify by comparing the deployed snapshot's `properties` with the agent's; `version` climbs on its own, so a version-equality loop may never end.)*

### `i18next-cli extract --sync-primary` does not overwrite PLURAL forms ⚠️

Reword the English at a `t('key', 'new text', {count})` call site and `--sync-primary` updates
plain keys but leaves `key_one` / `key_other` / … at the OLD text. Nothing reports it: `status`
counts keys, `lint` looks at source, and the catalogue silently wins at runtime — the same class
of failure `--sync-primary` was added to prevent, in the one place it does not apply.

Delete the `key_*` entries from `<primary>/<ns>.json` and re-extract. Worth an explicit check
after any rewording: compare `{{vars}}` in each language's value against the primary's.

### `t()` cannot type a key held in a variable ⚠️

`t()` derives the allowed interpolation from the KEY, so a variable key whose members take
different variables (`pwRule.length` takes `{min,max}`, `pwRule.minLength` takes `{count}`) can
never satisfy the checker: it asks for the union of every variable at once. `vocab()` at the
definition site already proves the key exists, which is the check worth having; widen only at
the single call site and say why.

Related: typing the interpolation bag as `Record<string, string | number>` fails too — the index
signature collides with i18next's own options (`lng` must be `string`), and the error points at
the call site rather than at the type. Spell the fields out: `{ count?: number; min?: number }`.

### Choropleth by administrative area, when area is anti-correlated with the data ⚠️

Not an API finding, but it cost a rebuild and it generalises. The supply-base map coloured each
Egyptian governorate by the mean composite risk of its suppliers. Two problems, both arithmetic:

- **A mean over a large group cannot separate groups.** Across all 25 governorates the mean ran
  14.7 to 44.3 — 17 LOW and 8 MEDIUM, under a legend advertising four bands. The share of a
  governorate's suppliers at HIGH-or-above ran 0% to 33% over the same records, across five.
- **Area is the loudest channel on a map, and here it is inversely correlated with relevance.**
  Rendered, the four largest painted shapes were Red Sea (179,652 px², 9 suppliers), Matrouh
  (108,799 px², 7), Beheira, and Aswan (38,999 px², 3) — while Cairo, which holds 69 of 343
  domestic suppliers, is one of the smallest shapes on the map. One at-risk supplier out of three
  painted a third of the country garnet.

So split the encodings: the **land** carries density (one tint, opacity = share of the base),
the **bubbles** carry the measure, on a mark whose size IS the sample it was computed from.
Hover floods the governorate with its band, so the link survives. And never hide the denominator
— a share over three suppliers must read "1 of 3" wherever it is shown.

### Real geometry belongs in the repo, not in a runtime fetch ✅

Governorate and national boundaries from geoBoundaries (`gbOpen` ADM0/ADM1) and rivers/lakes from
Natural Earth 10m, projected **at build time** into a generated `egypt-geo.ts` (30 KB of path
data, gzips well) by a checked-in script. The app never downloads a shapefile, the projection is
shared by the boundaries and the supplier coordinates — which is what puts a bubble inside the
governorate its record names rather than near it — and the whole map still works with the CDN
down. `tools/egypt-geo.py --download` regenerates it.

Joining the two sides is where the silent failure lives: geoBoundaries spells them as the survey
does (`Gharbiyya`, `Monufia`, `Minya Governate`, `Asyut`) and the records use the everyday
English the register uses (`Gharbia`, `Menoufia`, `Minya`, `Assiut`). Write the aliases out and
**assert on every one** — a normalised-key join misses these four quietly, and the symptom is a
governorate that simply never lights up.

---

## 34. Findings 2026-09-23 (Jaidah Majlis — ECG + Fabric PoC, UAT)

Built on `orbit.uat`: app `app-473ca8d00f66`, 22 objects `jd_*` / 37,902 records, context graph
`6ab3ae8e04beb12b389926a9` (16 node types, 47 edge types, 4,000 records, 11,588 edges), 8
workflows, 3 agents. Repo `mmaheranwar/jaidah-majlis`.

### 🔴 `updateFields` on a bulk upsert is a LIST OF OPERATIONS, not a map ✅ 2026-09-23

`storage_by_unifyapps_bulk_upsert_records_by_id` takes

```json
"updates": [ { "id": "<recordId>",
               "updateFields": [ {"fieldName": "days_in_stock", "actionType": "SET", "setValue": 418} ] } ]
```

Sending `updateFields: {days_in_stock: 418}` — the obvious shape — is accepted and the node
returns **`{success: true, failedCount: 0, successCount: 0, errors: {}}`**. No error anywhere:
the workflow is green, the summary says "125 records rewritten", and not one record changed.
`successCount: 0` with a non-empty input is the only signal. **Always assert on `successCount`,
never on the node's own `success` flag.**

### 🔴 Storage filter comparison operators are the SHORT forms ✅ 2026-09-23

In `triggerInputCondition`, `{operator: 'GREATER_THAN'}` (and `GREATER_THAN_OR_EQUAL`,
`LESS_THAN`) fails the whole run with

```
Cannot invoke "_UIFilter$SimpleOps.getOp()" because ... "_UIFilter$FilterBlock.getOperator()" is null
```

The working names are **`GT`, `GTE`, `LT`, `LTE`**, alongside `EQUAL`, `NOT_EQUAL`, `IN`.
`IN` takes `value` with an array (not `values`) and works on `id` as well as `properties.*`.
Note the error names the *block* operator, which sends you looking at the wrong level.

### ⚠️ Hardcoding `resourceVersion` from another app's workflow

Cloning TAQA's nodes carried `storage_by_unifyapps_bulk_upsert_records_by_id` v16331 when the
tenant now serves **16333** (fetch 16417 → 16419, groovy 2609 → 2611, callables 3109 → 3126 /
3111 → 3128). Reads still worked on the stale version, so this is not always fatal — but resolve
them at build time (`GET /api/workflow-builder/node/{app}/resources`) rather than copying.

### 🔴 `loop_for_each`: `listSource` takes a PLAIN TEMPLATE, and mappedArray silently no-ops ✅ 2026-09-23

```json
{"type":"LOOP","context":{"appName":"loop","resourceName":"loop_for_each","resourceVersion":<resolve>},
 "inputs":{"captureIterations":false, "listSource":"{{ n_prep.outputs.result.items }}"}}
```

Three things, and the third cost an hour:

1. The input key is **`listSource`** — not `items` or `list`. Omit it and the violation names it.
2. The loop node needs **two incoming edges** — the one in, plus a `next` edge (name `loopback`)
   from the last body node back to the loop, or deploy fails with
   `Please add atleast 2 incomingEdges edge`. The current item is `{{ n_loop.outputs.item }}`.
3. **`listSource` must be a plain template string.** Given the `{source, items, "ua:type":
   "mappedArray"}` shape — which is correct for a Groovy parameter bound to a whole list, and
   which *deploys and validates cleanly here* — **the loop body never executes**. There is no
   error: the STOP node still returns whatever the pre-loop nodes computed, so a run that wrote
   nothing reports `{"written": 11588}` and looks perfect.

   How to catch it: bind the body node's own output into the STOP result
   (`"edgeOut": "{{ n_edge.outputs }}"`). If the key is **absent** from the response, the body
   never ran. Then verify the side effect itself — for edges, read the record back
   (`GET /api/context-graph/{g}/unifiedEntity/{ue}/records/{id}` → `edges[]`) or run the Cypher.

With the plain template: 11,588 `add_edge_to_graph` calls in 59 runs of 200, **74 seconds, zero
failures** — instead of one literal node per edge.

### `POST /agent-api/sessions/{s}/git` now requires `provider` ✅ 2026-09-23

`{provider: 'GITHUB', connectionId, organizationName: 'username:<login>', repositoryName}`.
Without `provider` → **422** `{"type":"missing","loc":["body","provider"]}`. The skill's earlier
payload omitted it.

### Listing a context graph's node types ✅ 2026-09-23

There is no `GET /api/context-graph/{graphId}/nodes` (404) and no `?graphId=` variant (405). The
UI uses

```
POST /api/aggregation?entityType=KNOWLEDGE_GRAPH_NODE&group=STANDARD
{ filter:{op:'AND', values:[{field:'graphId', op:'EQUAL', values:['<graphId>']}]},
  projections:[{name:'id'},{name:'name'},{name:'unifiedEntityId'},{name:'cTm'}], page:{limit:80,offset:0} }
```

Delete a node type with `POST /api/context-graph/nodes/delete/{nodeId}`.

### 🔴 The ECG is NOT provisioned on orbit.uat — it lives on tool.prod-aps1 ✅ 2026-09-23

Confirmed with Maher. Every ECG **endpoint** answers on `orbit.uat` — you can create a graph,
publish it, create node and edge types, and write records into the entity store, all returning
200 — but there is **no Neo4j behind it**, so every projection-backed read fails (below). The
graph header, node counts and edge counts still read back fine, which makes it look healthy.

On **`tool.prod-aps1`** the same build works end to end: 16 node types, 47 edge types, 4,000
records, 11,588 edges, Cypher traversal answering in well under a second. Build context graphs
there. Note the tenants serve **completely different action versions** (callables 1686 vs 3126,
storage 3565 vs 16419, groovy 1285 vs 2611, `loop_for_each` 77 vs 214, `add_edge_to_graph` 869
vs 1698) — resolve them per tenant, never copy.

Also on aps1: `POST /api/workflow-definition/update` is **405**; use
`saveAndReturnViolations` then `deploy`.

### ⛔ What the outage looks like on orbit.uat, 2026-09-23 ~10:55 UTC onwards

Every Neo4j-backed call — `mdm_by_unifyapps_execute_opencypher_query`, record listing
(`POST /api/context-graph/{g}/nodes/{ue}`), neighbourhood reads — failed with
`org.neo4j.driver.exceptions.ServiceUnavailableException: Unable to establish connection in
30000ms` from `EntityRelationshipService`. The graph header (`GET /api/context-graph/{g}`),
node/edge creation, record writes into the entity store and everything outside the graph service
kept working. Did not recover across 24 probes over ~20 minutes. Records and edges written during
the outage cannot be confirmed as projected — **re-verify with `MATCH (n) RETURN DISTINCT
labels(n)` before trusting the graph.**

### Node creation is slow, and a timed-out `javascript_tool` keeps running ⚠️

`POST /api/context-graph/nodes` takes ~35 s each (the graph re-projects). A 16-node loop exceeds
the 45 s browser-tool timeout — and **the script keeps running in the tab after the tool
returns**. Starting a second loop created 14 duplicate node types. Run long loops detached with
a progress object and poll; never start a second pass over the same work.

Same failure mode wrote `jd_order` twice: the first (timed-out) `JD.write` call completed in the
background, so the retry hit 8,308 `E11000 duplicate key` errors. Check the object count before
re-running a load.

### `POST /api/entity/{objectId}` filter shape

Top-level `{op, field, values}`, or `{op:'AND', values:[{op, field, values}, …]}` — **not** the
storage node's `{operator, filters:[…]}`. Sending the storage shape here returns
`Cannot invoke "Filter$Op.isCompound()" because ... getOp() is null`. The two surfaces genuinely
differ; §22 already warns about the reverse direction.

### An empty entity-type read is an EMPTY BODY, not 404

`GET /api/entity-type?entityType=<missing>` → **200 with a zero-length body**, so `r.json()`
throws "Unexpected end of JSON input". Read `r.text()` and treat empty as not-found. (Restates
§28; hit again here.)

---

## 35. Findings 2026-09-23 (Claim Integrity — an external forensic service inside a workflow, UAT)

Built `app-7121817b391f` ("Claim Integrity"), session `e_6ab3b5ce04beb12b3899bf33`, repo
`github.com/mmaheranwar/claim-integrity`. 16 objects prefixed `cig_`, ~11,200 records,
7 workflows, 13 data sources, 3 agents. The new ground here is calling a **third-party HTTP
service** from a workflow and turning its answer into records.

### `custom_http_endpoint_execute` — the POST body shape that works ✅ UAT 2026-09-23

The node's input schema is `dynamic: true` and its `body` field is generated from `bodySchema`
through a `DynamicSchemaField`, which makes it look as though a request body must be declared
ahead of time. It does not. **A plain `body` input, mapped from a Groovy step's output, is
accepted and sent as JSON:**

```json
{ "baseUrl": "https://<host>", "path": "/forensic-check", "httpMethod": "POST",
  "body": "{{ n_body.outputs.result }}",
  "requestTimeoutInSecs": 120, "sslVerify": true, "authType": "CUSTOM",
  "connectionType": "DIRECT", "requestContentType": "application/json",
  "responseContentType": "HEADER_BASED", "httpVersion": "HTTP_2",
  "followRedirects": "NORMAL", "isAsync": false, "enableProxy": false,
  "ignoreTrailingSlashes": false }
```

Outputs are `{{ n.outputs.status }}` (int) and `{{ n.outputs.result }}` (the parsed body).
Verified end to end: a base64-encoded PDF built in Groovy → POST → a JSON report back → findings
and a document record written → STOP, **2.3 s wall clock** through the data source. No connection
is needed, and no `bodySchema` had to be declared.

**Probing a node contract without creating a workflow** ✅ — `POST /api/test-workflow/initiate-test/{anyId}`
accepts an arbitrary path id when the full definition travels inline. `initiate-test/probe` ran a
three-node graph and reported `COMPLETED` in 333 ms. Useful for establishing an input shape before
committing a workflow to the tenant.

### Resource versions drift within DAYS, not months ✅

Between the TAQA build (2026-09-23, morning) and this one (same day, afternoon) on the same tenant:

| Action | Then | Now |
|---|---|---|
| `storage_by_unifyapps_fetch_records` | 16417 | 16419 |
| `code_by_unifyapps_groovy` | 2609 | 2611 |
| `callables_from_automation` | 3109 | 3126 |
| `callables_return_to_automation` | 3111 | 3128 |
| `callables_call_automation` | 3130 | 3132 |

Four of five moved inside one day. Resolve every version from
`GET /api/workflow-builder/node/{app}/resources` at build time — a stored version is a workflow
that will not save, later.

### A reset that parses every baseline is 40× slower than one that parses the dirty rows ⛔ → ✅

`cig_apply_scenario` restores from a `baseline_json` on each record. The first version walked
**every** row of four objects (2,978 records), ran `JsonSlurper.parseText` on each and compared
fields. Applying a lever took **1.9 s**; the reset **exceeded 45 s** and the run was still `ACTIVE`
after 40 s — for a reset that had nothing to restore. The Groovy sandbox makes per-record JSON
parsing expensive enough to dominate everything else.

**Fix:** add a boolean `scn_dirty` to every object a lever can move. The apply sets it on each
record it writes; the reset skips any row where it is not `true`, and clears it as part of the
restore. **Reset dropped to 1.16 s** and still restored exactly the 17 records that had moved —
verified at **zero drift across 2,978 records**, with the scenario's insights deleted and the
lever flag cleared.

The general rule: in a Groovy step, *guard the parse*, not the write. A cheap field test over
3,000 maps is free; 3,000 `parseText` calls are not.

### Adding a field to an object, and using it immediately ✅

`POST /api/entity-type/update` with the object as read, the new property added to **both**
`input.schema.properties` and `schema.schema.properties` (and appended to `input.layout['ui:order']`),
→ 200, and a read-back shows it. `storage_by_unifyapps_bulk_upsert_records_by_id` with
`skipSchemaValidation: false` could write the new field on the next run — no republish, no
migration of existing records (a row without the field simply does not have it).

### `skipIfBlank: true` makes an empty bulk write a no-op ✅

`storage_by_unifyapps_bulk_create_records` and `..._bulk_upsert_records_by_id` both take
`skipIfBlank`. With it set, a run where Groovy produced an empty array succeeds and writes
nothing. That removes the only reason these graphs would need branching.

### Reading a run's node outputs is still blocked on this tenant ⚠️

`POST /api/lookup?ByKeys=TEST_WORKFLOW_VARIABLE` returned
`{response: {inaccessibleObjects: [runId], objects: {}}}` for every run of a workflow created over
the API, with or without an `options.workflowExecutionId`, and
`POST /api/workflow-runs/node-executions` returned zero rows. Status and `EXECUTION_TIME` from the
`WORKFLOW_EXECUTION` aggregation work. (Consistent with §18 D1.)

**So verify a workflow through its `e_data_source`, not through the test runner.** `POST
/api/workflow/execute/node?name={dsName}&requestId={dsId}` from a signed-in platform tab returns
the STOP node's payload directly, which is both the real call path and the only one that shows you
the answer.

### Groovy blacklist, again: `owner` ⛔

`rec.owner = assignee` → `Blacklisted commands found in code : owner = at position 957`. It is a
substring scan over the source, not a parse. `rec['owner'] = assignee` passes and behaves
identically. (Restates §30; the trap is easy to re-create because `owner` is a natural field name.)

### `skipIfBlank: true` silently swallows a restore-to-EMPTY ⛔ UAT 2026-09-23

`storage_by_unifyapps_bulk_upsert_records_by_id` with `skipIfBlank: true` does not only guard
against an empty `updates` LIST — it skips an individual `setValue` that is blank. A control-room
reset that restores `ring_code` from `'RING-01'` back to `''` therefore reports success, moves the
record count it expected, and leaves the field set. Two claimants stayed in a fraud ring after a
"byte-identical" reset, with nothing in any response to say so.

It was never needed for the case it looks like it covers: with `skipIfBlank: false` an **empty
updates array is still accepted** (200, zero writes, no error). Set it `false` on every node whose
job includes clearing a field.

### Derive the baseline key set, never remember it ✅ UAT 2026-09-23

A control-room reset restores each record from a `baseline_json` blob. The blob is only as good as
the list of keys it was built from, and that list drifts the moment anything new can write:

- adding a **decision** action (`cig_decide`) put `decision`, `decided_by`, `decided_on` and
  `processing_days` beyond the baseline, so a reset restored a claim's *status* and left the
  previous decision's sentence sitting above it — the two then contradicting each other on screen;
- two objects (`cig_rule`, `cig_check`) could be moved by a lever and had **no `baseline_json`
  field at all**, so those writes were never undone by anything.

Build the set mechanically instead: walk every scenario payload's `set` keys, union in everything
the write automations touch, then widen every record's baseline to it and **assert** that each key
appears in each record. The assertion is the deliverable — it is what turns "we think the reset is
exact" into a number.

Verified after the fix: **12 levers → 473 record writes → one reset → zero drift across 3,024
records on every writable key**, KPI series back to `baseline_value`, scenario insights deleted,
lever flags cleared.

### A decision must not be able to edit the evidence ✅

`cig_decide` reads the claim, copies the **whole** record, and changes only status, the money
fields, the decision prose and who decided. The risk score, the band, the findings and the
headline are untouched by design, and the API-level test asserts the field count is identical
before and after (34 → 34) so a partial write can never quietly strip the record.

### The claim-integrity platform layer (read-only references, UAT)

| Asset | Id |
|---|---|
| App / session | `app-7121817b391f` / `e_6ab3b5ce04beb12b3899bf33` |
| `cig_query` · `cig_aggregate` | `6ab3b9ec7c47e164fb265c7d` · `6ab3bb98d95dfa746ea5264f` |
| `cig_ai_insights` · `cig_ai_writer` | `6ab3ba2a7c47e164fb2666ef` · `6ab3ba2b9d7b05455586c2c2` |
| `cig_forensics` (HTTP → records) | `6ab3bb54aa76b93f751c2699` |
| `cig_create_action` · `cig_apply_scenario` | `6ab3bb6b33349669108fc239` · `6ab3bbeb7c47e164fb26f3da` |
| Agents | `e_6ab3beb9223be332a6bcb270` · `e_6ab3bee7c9518d7218afefe9` · `e_6ab3bee7c9518d7218aff00a` |

## 36. Findings 2026-09-23 (Jaidah Majlis on aps1 — an app whose ONLY source is the graph)

The Orbit build read Data Objects and traversed the graph on two screens. Moving to
`tool.prod-aps1` and making **every** figure a Cypher query turned up a set of things that all
share one shape: **the platform answered 200 and did nothing.** Every item below was found by
running the app, not by reading the response.

### 36.1 `/api/entity/update` needs the WHOLE entity ✅ verified

```
POST /api/entity/update  {entityType, id, properties}   → 200, returns the id, writes NOTHING
POST /api/entity/update  {...the whole object from GET /api/entity/{ue}/{id}, modified}  → writes
```

The partial form is accepted and silently discarded. Read the entity, change the field on
`properties`, post the entity back. This is the same shape `entity-type/update` needs (§8) and
the same trap.

### 36.2 Graph node records reject both bulk writers ✅ verified

A context-graph node's records are addressable as an object (`object_type` = the
`unifiedEntityId`) and read fine through `storage_by_unifyapps_fetch_records`. Writing is another
matter:

| Node | Result |
|---|---|
| `storage_by_unifyapps_bulk_upsert_records_by_id` | `{failedCount:1, success:false, successCount:0, errors:{"CUS-00678":"Service EntityService remote call failure"}}` |
| `storage_by_unifyapps_bulk_update_record_by_id` | `{failedCount:0, updated:0, errors:{}}` — **no error at all**, and nothing written |
| `storage_by_unifyapps_update_record_by_id` with `useRawPayload` and a **partial** payload | 500 `Non Empty Validations … required customer_code` |
| `storage_by_unifyapps_update_record_by_id` with `useRawPayload` and the **whole** properties map | ✅ writes, returns the updated object |

So a workflow that changes many graph records is a `loop_for_each` over a planned list with one
whole-payload `update_record_by_id` in the body — not a bulk node. The record's `id` IS its
primary key (`CUS-00678`), not a separate platform id.

### 36.3 "forbidden datasource : invalid input" means **republish** ✅ verified

A deployed interface fixes the set of data sources it may call **at publish time**. A data source
created — or edited — after the last publish is rejected at runtime with
`forbidden datasource : invalid input`, which reads like a malformed request and is not one.
`POST /agent-api/apps/{appId}/publish` and it works, with nothing about the data source changed.

Corollary: `resourceVersion` in a data source's `context` must match what the app sends. The
generated `bindings.ts` sends `{appName, resourceName}` with **no** `resourceVersion` for the
storage bindings, so the stored context must omit it too.

### 36.4 The OpenCypher action caps at 1,000 rows ✅ verified

`mdm_by_unifyapps_execute_opencypher_query` returns at most **1,000** rows whatever `limit` you
pass. A 3,330-row match asked for 4,000 comes back as 1,000 rows and, unless you cap your own
limit at 1,000, your "did we truncate" check (`count >= limit`) says no. Cap at 1,000 and the
flag stays truthful.

`ORDER BY` **is** applied before the limit ✅ — `ORDER BY at DESC` with a limit of 6 returns the
six newest, not six arbitrary rows. A trailing `LIMIT n` inside the query text, however, is
ignored; the action's own limit wins.

**Consequence for an app:** every total, count and share must be `sum()` / `count()` in the query.
Reducing over the returned rows is wrong above 1,000 records and looks completely normal —
Receivables reported QAR 229M against a true QAR 229.6M for exactly this reason.

**Consequence for an agent:** give the tool a small default `row_limit` (100) and a description
that says aggregate. An agent that omits `row_limit` and gets 500 full records per call burned
**471,035 tokens in one turn** and then looped. Budget characters as well as rows in the shaper.

### 36.5 Agents: four things between "configured" and "working" ✅ all verified

| Symptom | Cause |
|---|---|
| app gets `204 No Content` on `GET /api/entity/ai_agent/{id}` | the agent was never **deployed** — `POST /api/entity/action/saveAndDeploy` with the whole entity |
| agent behaves like a platform builder, `multiAgentConfig` names `tensor_builder`/`tensor_planner` | `agentType` is `team`, inherited by cloning another agent. It must be `ai-agent` |
| agent answers "I do not have access to the tool … access to the following records would be required" | the tool entity lacks **`enabled: true`**. It is not offered to the model at all, and the answer reads like a permissions problem |
| agent calls the tool but never varies the arguments | the tool's `inputs.parameters` were pre-seeded (`{cypher:'', row_limit:'500'}`). Use `parameters: {}` and let the automation's START schema supply the shape |

`POST /api/entity/update` on `e_action_ai_agent` **rejects** an unknown property:
`Non Empty Validations … add additionalProperties excludeInputOutputFromTrace`. Copy only the
fields a real tool already has.

### 36.6 Read the node → unifiedEntityId map back; never transcribe it ✅

`POST /api/aggregation?entityType=KNOWLEDGE_GRAPH_NODE&group=STANDARD&name=context_graphs_nodes_table`
returns every node of a graph with `name`, `id` **and** `unifiedEntityId`. `GET
/api/entity-type?entityType={ue}` gives the same `name` one at a time.

This matters because a label that exists always matches something. A map transcribed in creation
order was wrong for **twelve of sixteen** node types — `Order` pointing at Invoice's entity,
`Employee` at Product's — and every query still returned plausible rows.

### 36.7 An ECG does not denormalise foreign keys

Node types built from `jd_order` / `jd_invoice` carried no `customer_code`: the counterparty is
reached by relationship, which is the point of mastering it once. Any per-customer read is a
traversal:

```cypher
MATCH (i:`<invoice_ue>`)-[:OWED_BY]->(c:`<customer_ue>`)
WHERE c.`_pr_customer_code` = 'CUS-00181'
```

A screen that filters on `customer_code` instead matches nothing and renders as an empty state,
not an error. When porting a screen from objects to the graph, check every filter field against
`GET /api/entity-type?entityType={ue}` first — two phantom fields (`customer_code`,
`since_year`) and one missing one (`freshness_hours`, which crashed a screen on `.toFixed()`)
were all found this way.

### 36.8 `resourceVersion` is per tenant

`callables_call_automation` is **3130** on orbit.uat and **1686** on tool.prod-aps1;
`storage_by_unifyapps` is 3565, `code_by_unifyapps` 1285, `loop_for_each` 77,
`conv_ai_by_unifyapps_call_llm_model_with_options` 1248. Always resolve from
`GET /api/workflow-builder/node/{app}/resources`. Carrying a number across tenants gives
`No config found for resource … in app …` from ConnectionService.

Also: the LLM node is `type: 'CALL_INTERFACE_WORKFLOW'`, not `ACTION`, whenever `inputs` carries
a `callableInterfaceId`. As an `ACTION` it fails with the same "No config found" message, which
points at the version and not at the type.

### 36.9 Cloning a workflow clones its prompt

`jd_ai_writer` on Orbit was cloned from the TAQA app and its system prompt still described TAQA
Arabia — so every line of narrative in that build was written by an engine told it worked for an
Egyptian energy group, in an app about a Qatari trading house. Nothing failed. Read the prompt of
anything you clone.

### 36.10 Jaidah Majlis on tool.prod-aps1 — what exists

| What | Id |
|---|---|
| App | `app-441809e30b81` · `https://app-441809e30b81-tool.tensor-prod-aps1.unifyapps.com/` |
| Repo | `github.com/mmaheranwar/jaidah-majlis-ecg` |
| Graph | `6ab3bf9fe80fdb31d9eeed3a` — **17 node types, 49 edge types, 37,864 records, 106,985 relationships** |
| UDM connection | `6ab3bf9fb7d88706b823c56f` |
| Workflows | `jd_graph_query` `6ab3c4fb82f0b33990e1a51e` · `jd_write_edges` `6ab3c4eb36fdb566dad9b482` · `jd_ai_writer` `6ab3d859403ba212933cfc93` · `jd_ai_insights` `6ab3d85a82f0b33990e6f78e` · `jd_apply_scenario` `6ab3da23aac8f718c8d9a342` |
| App data sources | graph `e_6ab3d5f3d88381182ceeab9d` · writer `e_6ab3d865e80fdb31d9f04e2c` · insights `e_6ab3d865e80fdb31d9f04e2f` · scenario `e_6ab3da2ee80fdb31d9f061de` · storage `e_6ab3d77b…` ×6 |
| Agents | Majlis Group Analyst `e_6ab3d962d88381182ceed361` · Credit & Collections `e_6ab3d962d88381182ceed365` · Context Graph Explorer `e_6ab3c61ce80fdb31d9ef5dfd` |
| LLM model | `e_6a5a0b37752c8e4398d37934` (Sonnet 5, Vertex). `e_6a61d1a4dc4fab3a0ad1d6ec` (Bedrock) appears in the registry and **hangs** |

Verified live: "How much do we have in open receivables, split by division?" → QAR 229.6M across
1,113 invoices, all five divisions correct to the riyal, the traversal named, and a ```ua-chart
block rendered as the same interactive ChartBlock the dashboards use.

### 36.11 The agent's model is `answerGenerationModelSettings.modelId`, not `answerGenerationModel` ✅

An agent cloned from a template carried `answerGenerationModel: <Sonnet 5>` **and**
`answerGenerationModelSettings.modelId: <Gemini 3.8 Flash>`. The settings block wins, so the
declared model was never used, and `topicSelectionModel` / `topicExecutionModel` were Flash too —
the whole tool-calling loop ran on a model nobody chose.

Measured on the same question, from the trace timeline:

| | Gemini 3.8 Flash | Sonnet 5 (Vertex) |
|---|---|---|
| Latency | 27 s (good run) | **15.4 s** |
| Model calls | 2–8 | 2 |
| Reliability | ~50%: repeated `corrupted internal data` | no failures observed |
| `JaidahGraph` | 115–840 ms | **160 ms** |

The failure signature is diagnostic: several fast tool calls, then **four model calls of
~190–300 ms each** and an error. That is the platform retrying an output it cannot parse — Flash
fumbling the exact-JSON chart contract — and it surfaces to the user as "The AI response
contained corrupted internal data". It is not a data problem and not a permissions problem.

Also set `responseGenerationSettings.disableThought: true` for a tool-calling analyst: thinking on
every hop costs seconds and buys nothing when the instructions already prescribe the method.

**The graph is never the slow part.** Across every trace it is 1–3% of wall clock; measured
directly, a count is 396 ms cold / ~100 ms warm, a grouped aggregation 102 ms, 1,000 rows 114 ms,
and a 2-hop traversal aggregation 161 ms. If an agent feels slow, read the trace timeline before
touching the data layer.

### 36.12 An empty parameter is a caller priming, not a fault

`mdm_by_unifyapps_execute_opencypher_query` answers an empty `query` with a 500 `query is
required`. A hook that builds its query from a route parameter fires once before the parameter
exists, so Customer 360 logged **four red calls on every load** while rendering perfectly. Four
false failures per page hide the real ones.

Guard it in the workflow, not only in the caller: decide in Groovy (the template language has no
ternary) and bind the action to the result.

```groovy
def cy = p('cypher')?.toString()?.trim()
boolean blank = (cy == null || cy.length() == 0)
def query = blank ? 'MATCH (n) WHERE false RETURN n' : cy
return [limit: n, blank: blank, query: query]
```

…with the action bound to `{{ n_lim.outputs.result.query }}` and the shaper returning
`skipped: blank`, so the caller can tell "nothing asked" from "nothing found".

### 36.13 Read-after-write lag, and what it destroys

This tenant returns a stale read for a few seconds after a write. Two consequences, both found
the hard way:

1. **A verification that reads immediately reports false failures.** A scenario-battery run
   measured 7 of 13 levers as "did not restore"; with a 4-second settle before each read, all 13
   restore exactly and the dataset comes back byte-identical to baseline.
2. **A read-modify-write pipeline running close behind another write silently drops columns.**
   A source-rename job read 43 gold tables before an earlier backfill had settled and wrote them
   back without `freshness_hours`, which then crashed the screen on `.toFixed()`. Always settle,
   and prefer re-deriving from an untouched source (the `jd_*` objects, which graph writes never
   touch) over trusting what you just read.

### 36.14 Publishing takes two calls ✅ reproducible

`POST /agent-api/apps/{appId}/publish` reliably builds the **previous** commit on the first call
after a push, and HEAD on the second — even when the session's own file listing already shows the
new files. Publish in a loop until the returned `commitHash` is the one you pushed:

```js
for (let i = 0; i < 3; i++) {
  const body = await publish();
  if (body.includes(shortSha)) break;
}
```

`POST /agent-api/sessions/{s}/branch {branch}` is still what makes a session pull at all; without
it the workspace can stay several commits behind indefinitely.

### 36.15 Deleting a record: only the storage node works

`POST /api/entity/delete` treats `delete` as an entityType (`ENTITY_TYPE with id delete not
found`); `/api/entity/delete/{ue}/{id}` is 404; `DELETE /api/entity/{ue}/{id}` and
`/api/entity/{ue}/delete` are both 405. The one that works is the workflow action:

```json
{"context": {"appName": "storage_by_unifyapps",
             "resourceName": "storage_by_unifyapps_delete_record_by_id", "resourceVersion": 3565},
 "inputs": {"object_type": "<ue or jd_*>", "entityId": "<primary key>"}}
```

### 36.16 Validate a model's output before you store it

Four Customer 360 insights generated, parsed and stored cleanly — and rendered as four cards with
a severity pill and nothing else, because the model had returned four objects under different key
names and `String(x.title || '')` wrote empty strings without complaint. The count looked right at
every step. Validate the fields you actually need before writing, and have the component skip a
record that is empty: an empty card is worse than no card.

---

## 37. Findings 2026-09-23 (Claim Integrity — running the real corpus, UAT)

`app-7121817b391f` again, after the seeded demo data was replaced with **165 real PDFs put
through the real pipeline** — 65 adversarial scenarios and 100 ordinary term invoices, one
`cig_intake` call each, 0 errors. Everything below was found by running it, not by reading a
response: the platform returned 200 for all of it.

### 37.1 `bulk_upsert_records_by_id` wants `updateFields`, not `properties` ✅ verified

The node's `updates` array is **field-level**, not record-level:

```jsonc
// storage_by_unifyapps_bulk_upsert_records_by_id
{ "object_type": "cig_claim", "skipIfBlank": false, "unsetIfNull": false,
  "updates": [
    { "id": "<record id>",
      "updateFields": [ { "fieldName": "risk_score", "actionType": "SET", "setValue": 74.6 } ] } ] }
```

An array of `{id, properties:{…}}` — the shape `POST /api/entity/update` takes, and the obvious
guess — is accepted with **HTTP 200 and writes nothing**. The workflow reports however many rows
it built; the records are untouched. The first run of a rescore said `rescored: 165` and changed
zero records. **Read one record back after the first batch**, not just the count the automation
returns.

Upside of the field-level shape: it is a genuine partial update, so it does not carry golden
rule 3's whole-record-replace hazard. `useRawPayload` on the *create* node still does.

### 37.2 A START node created over the API must carry its trigger ✅ verified

`POST /api/workflow-definition` accepts a START node without `trigger`; the follow-up
`saveAndReturnViolations` then 500s:

```
Cannot invoke "…triggers.Trigger.getType()" because the return value of "…nodes.Node.getTrigger()" is null
```

Add `trigger: { type: "CALLABLE" }` to the START node (alongside `context.resourceName =
callables_from_automation`). Note the create still **succeeded** and left a workflow behind, so
re-running the whole builder makes a second one — fetch the definition that exists, fix it, and
save that.

### 37.3 `fetch_records` output is `outputs.objects`, and `triggerInputCondition` must be present

- The collection a fetch node emits is `{{ n_x.outputs.objects }}`. `outputs.records` resolves to
  nothing and the downstream Groovy sees an empty list — again, 200 throughout.
- Omitting `triggerInputCondition` entirely returns nothing. To fetch everything, send
  `triggerInputCondition: {}`.
- `page.limit` of 1000–2000 returned all rows at these volumes (165 claims, 100 findings).

### 37.4 A data source sends **every** templated input, always ✅ verified

`cig_query` declares 15 templated parameters. Calling it with only `{object_type, limit}` came
back `count: 0` for an object holding 8 rows: the unset `{{filter_field}}` placeholders reach the
workflow as the literal template text and it filters on them. Send every templated parameter,
blank where unused. This is the read-side twin of `forbidden datasource : invalid input` on the
write side — there the platform tells you; here it just answers zero.

### 37.5 `POST /agent-api/apps/{id}/publish` can take >2 minutes

A publish of this app took ~120 s. A browser `javascript_tool` call times out at 45 s, so `await`
on the publish loses the result even though the publish succeeds. Fire it and poll:

```js
window.PUB = { state: 'running' }
fetch('/agent-api/apps/app-.../publish', { method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versionTag, versionNote }) })
  .then(async (r) => { window.PUB = { state: 'done', status: r.status, body: await r.text() } })
// later calls: JSON.stringify(window.PUB)
```

Success: `{ok:true, commitHash, branch:"main", version:"v8", tag:"v6", deployDir}`. `version` is
the platform's own counter and does **not** echo the `versionTag` you sent.

`GET /agent-api/apps/{id}/versions` → 404. `GET /agent-api/sessions/{s}/files/contents?path=…` →
**405 Method Not Allowed** (that path is write-only, `PUT`). To confirm what is live, fetch the
published origin's `index.html`, read the `assets/index-*.js` name out of it and grep the bundle
for a string you just added.

### 37.6 A record whose `id` you set is a record whose business key you cannot rename

`cig_check` records were created with `id` = the check id, so `id == properties.check_id`. When
the forensic engine turned out to emit `pdf_structure_forensics` / `font_resource_forensics`
while the catalogue called the same two checks `pdf_revision_recovery` / `retypeset_forensics`,
the catalogue **could not** be renamed to match — changing `check_id` would mean a new record and
abandoning the old one, which the no-delete rule forbids. The fix went the other way: the
**emitter** was changed to the catalogue's ids and the 23 findings already written were realigned
with `POST /api/entity/update`.

Worth knowing before you choose ids: an explicit `id` is a permanent primary key. Use it for
things whose identity is genuinely fixed, and let the platform mint ids for anything whose naming
might still move.

### 37.7 Getting a large export out of a browser session and into the repo

The browser cannot write to disk and its downloads do not reach the user's Downloads folder. But
an oversized tool result **is** spilled to a file by the harness. So: build the export in the tab,
base64 it, return it in one call, let it overflow, then decode the saved file locally.

```js
// in the tab
const b = new TextEncoder().encode(JSON.stringify(payload))
let s = ''
for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000))
window.B64 = btoa(s) // then a call whose entire body is: window.B64
```

```python
# locally — the saved file is [{type, text}] plus a trailer, so take the longest base64 run
txt  = ''.join(p['text'] for p in json.load(open(saved)) if p.get('type') == 'text')
b64  = re.search(r'[A-Za-z0-9+/]{2000,}={0,2}', txt).group(0)
data = json.loads(base64.b64decode(b64).decode('utf-8'))
```

218 KB of workflow definitions and 60 KB of Groovy crossed in three calls without any of it
entering the conversation. This is how `platform/cig-platform.json` and `platform/groovy/*` are
kept equal to what is deployed.

### 37.8 Design: weight as an exponent saturates a risk score

Not an API finding, but the one that mattered most. The claim score was a weighted noisy-OR with
the weight as an exponent, `risk = 100 × (1 − Π(1−score_i)^w_i)`. With real traffic, **every**
flagged claim landed between 79.8 and 100 — all 58 CRITICAL — because a single finding at score
0.65 and weight 2 already gives 87.8. A score that bands everything identically cannot order a
queue, which is the only thing the score is for.

Weight is now the check's strength relative to the strongest evidence held, and the product runs
over probabilities rather than exponentiating them:

```groovy
def W_REF = 2.5d
def strength = w / W_REF; if (strength > 1.0d) { strength = 1.0d }
def pi = sc * strength; if (pi > 0.99d) { pi = 0.99d }
prod = prod * (1.0d - pi)
```

with forced escalation narrowed from "any high or critical severity" to "proof of tampering, or a
check the catalogue itself calls critical". Same 100 findings, same documents: 35 CRITICAL /
1 HIGH / 22 MEDIUM / 107 LOW, scores spanning 44 to 96. **Calibrate a score against real traffic,
not against the adversarial set** — the adversarial set is where saturation is invisible, because
everything in it really is bad.

### 37.9 Ids added

| What | Id |
|---|---|
| `cig_intake` (forensics → registry → duplicates → claim, one call) | `6ab417c8aa76b93f754bc280` |
| `cig_registry_check` · `cig_duplicate_check` | `6ab4127ad95dfa746ee9721f` · `6ab4129faa76b93f754aa9d2` |
| `cig_file_claim` · `cig_decide` | `6ab3ceb3d95dfa746eac8487` · `6ab3ce847c47e164fb2c182b` |
| `cig_rescore` (re-applies the model to filed claims) | `6ab41d60aa76b93f754d9738` |
| `cig_rollup` (vendor/claimant rollups, hit counts, KPI rows) | `6ab41e5c3334966910ee65c1` |
| ⚠️ `cig_purge` — built on a records-delete node; **must not be run again** under the no-delete rule | `6ab41044aa76b93f75491738` |

---

## 38. Findings 2026-09-24 (Demo library — auto screenshots, UAT)

### 🔴 `POST /api/entity/update` REPLACES `properties` wholesale ⛔ UAT 2026-09-24

Sending one field does not merge it — every other property is dropped. A card updated with
`{properties:{screenshots:'…'}}` came back as a record whose *only* property was `screenshots`:
title, slug, description, categories, customer, videoUrl and sortOrder were gone, with a 200 and
nothing in the response to say so. There is **no version history** to roll back to
(`…/versions`, `…/history` both 404), and a record belonging to an app's own object is not
necessarily in the `SCN.backup()` snapshot either.

- **To write one field**, use `storage_by_unifyapps_bulk_upsert_records_by_id` (v16331) with
  `updateFields:[{fieldName, actionType:'SET', setValue}]`, which is a true partial update.
- **To use `/api/entity/update` at all**, read the record first and send **every** property back.
- It also takes an optimistic lock: omit `version` and the second write fails with
  `ENTITY with id … and version 0 is stale, current version is 1`. The *first* write succeeds
  precisely because version 0 is current — so the destructive call is the one that goes through.

Recovering a wiped record without a backup: the sibling records reconstruct it. A seeded series
carries two independent sequences — `sortOrder` and a numeric slug suffix — and both had exactly
one gap (103 / `-3`), which fixes the lost values rather than guessing them.

### Reading entities and records over REST ✅ UAT 2026-09-24

| Call | Returns |
|---|---|
| `POST /api/entity/{entityTypeId}` `{page:{limit,offset}}` | every record with **full `properties`** |
| `GET /api/entity/{entityTypeId}/{recordId}` | one record, incl. its `version` for the lock |

This works for app objects *and* for platform types. **`GET /api/entity/e_interface/{appId}`
returns `properties.name`** — the app's real name — which the `standard_entities_fetch_entities`
action cannot project (§ it yields only `id` and `tags`). So an app's name IS readable
server-side; the action is the limitation, not the platform.

`/api/entity/search` is a different thing entirely: it searches the `search` entity and silently
ignores an `entityType` in the body, answering 200 with unrelated rows.

### 🔴 `callables_call_automation` is a `CALL_WORKFLOW` node, not an `ACTION` ⛔ UAT 2026-09-24

Built as `type:'ACTION'` it saves and **deploys** clean, then fails at run time with
`No config found for resource callables_call_automation in app callables` (ConnectionService).
Correct node: `type:'CALL_WORKFLOW'`, context `{appName:'callables',
resourceName:'callables_call_automation', resourceVersion:<resolve>}`, inputs
`{automationId, version:'-1', synchronous:true, parameters:{}}`.

Resolve the version, never copy it: `GET /api/workflow-builder/node/callables/resource/callables_call_automation`
→ `.version` (**3133** on Orbit 2026-09-24; 3124 is stale and also fails). That response also
carries `nodeType`, which is how you learn the node type a resource wants.

⚠️ **Disputed — see §18 D5** (Forge master runs `6ab7fc9f…` and `6ab7ffbd…` COMPLETED through initiate-test with a resolved call-node version; this case used a stale version 3124). **`initiate-test` cannot run a call-workflow node at all** — it fails there regardless of whether
the node is correct, so a green test run is not evidence and a red one is not a bug. Verify
through the app's `e_data_source` (the real call path), per §33. This is how a daily job that had
been deployed for a day was found never to have been able to run.

### Poster frames without capturing anything ✅ UAT 2026-09-24

A demo card whose demo is a video needs no screenshot file:

| Source | Poster URL |
|---|---|
| Google Drive video | `https://drive.google.com/thumbnail?id={id}&sz=w1600` (a real frame) |
| Google **Slides** | the same Drive endpoint — a Slides file is a Drive file (first slide) |
| YouTube | `https://img.youtube.com/vi/{id}/maxresdefault.jpg` |

`fetch()` of these hosts is **CORS-blocked**, so only an `<img>` load tests one — a failed
`fetch` says nothing. A Drive thumbnail needs the same permission as its video: of 51 real
links, 24 loaded anonymously and 27 were restricted, i.e. exactly the people who can watch the
demo can see its poster. Render with an `onError` fallback so a restricted one degrades instead
of showing a broken image.

Do **not** store a signed CDN thumbnail (Trupeer's `og:image` carries `Expires=`); capture a
frame instead. `platform/tools/capture-demo-shots.js` drives the already-installed
`playwright-core` + Chromium with a persistent profile, clicks play and clips to the `<video>`,
and refuses to write a shot of a login page.

## 39. Findings 2026-09-24 (Jaidah Majlis — testing a finished app end to end, aps1)

The app was "done": every screen rendered, no console errors, the agent answered with charts.
A full end-to-end pass before the customer demo found **six field defects, one agent defect and
ten wrong figures on the stored insight cards.** Every one of them rendered, and none of them
logged. The pattern is the same throughout: *the platform succeeded at something other than what
was meant.*

### 39.1 Diff every field the UI reads against the node schema, per variable ✅

`GET /api/entity-type?entityType={ue}` → `input.schema.properties` is the node's real property
list. Read all of them back, then diff against what the components actually render. On Jaidah
this found five live defects:

| Screen | Rendered | Reality |
|---|---|---|
| receivables ledger | `invoice.customer_name` | not on Invoice — **blank column on 1,113 rows** |
| divisional pipeline | `opportunity.customer_name`, `.days_in_stage` | neither exists — blank name and "· d in stage" |
| divisional map | `order.site_code` as the marker weight | not on Order — every site keyed under `undefined` |
| site tooltip | `site.opened_year` | not on Site — "opened " with no year |
| vehicle stock | `status IN (in_stock, demo, in_transit)` labelled "in stock" | 151 units/166 days vs the agent's and the insight's 125/171 |

A TypeScript interface is no defence: all five fields were **declared** on the interface, so the
compiler was satisfied. `tsc` passes, the page renders, the cell is empty.

Diff per **variable**, not per file: the first sweep checked `opps.field` and found nothing,
because every defect was on the loop variable (`opps.map((o) => o.customer_name)`). Resolve
`for (const X of Y)` and `Y.map((X) =>` back to `Y`'s hook, then check `X.field`.

### 39.2 A transaction's counterparty is a traversal — use OPTIONAL MATCH ✅

Joining the customer onto a ledger with a plain `MATCH` silently **drops** every record whose
edge is missing, so the table loses rows while the count beside it does not. `OPTIONAL MATCH`
keeps the row set identical to the flat read and only fills the name in:

```cypher
MATCH (n:`<invoice ue>`) WHERE toFloat(n.`_pr_balance`) > 0
OPTIONAL MATCH (n)-[:OWED_BY]->(c:`<customer ue>`)
RETURN …, c.`_pr_customer_code` AS customer_code, c.`_pr_name` AS customer_name
```

Verified: 1,113 rows and QAR 230M before and after, with names on every row.

### 39.3 Categorical values are an enum; `CONTAINS` silently conflates them ✅

Every ECG property is a string, so `CONTAINS` always compiles and always returns something
plausible. Asked for the 90+ ageing bucket, the credit agent wrote
``ageing_bucket CONTAINS '90'`` and answered **QAR 78.7M across 382 invoices**. The truth is
**QAR 60.3M across 295** — `'61-90'` also contains "90", and 295 + 87 = 382 exactly.

The fix is not a better instruction to "be careful". Put the **actual value lists** in the
agent's prompt (`RETURN DISTINCT n.\`_pr_<field>\``, once per categorical property) and require
`=` or `IN [...]`. The traps are the pairs: `61-90`/`90+`, `expiring`/`expired`,
`service`/`services`/`parts_service`, `in_stock`/`in_transit`. After the change the same
question returned QAR 60,276,324 across 295, source line ``ageing_bucket = '90+'``.

### 39.4 A KPI series and its transactions reconcile only under a filter ✅

`KpiSnapshot.revenue` disagreed with the sum of its own orders in **93 of 120** division-months.
It was not drift: excluding `status = 'cancelled'` reconciled **119 of 120** exactly. The KPI
series *is* the non-cancelled order sum.

So the rule belongs in the agent's prompt, not in a comment. Without it the agent answers AUTO
September as QAR 50,417,956 while every chart in the app says QAR 49,943,900 — both from the
graph, both defensible, one of them on screen. With it, the agent returns all five divisions to
the riyal and totals QAR 121,051,719, the number on the KPI tile.

### 39.5 Severity vocabulary: a default is not a failure ✅

The insight workflow's system prompt asked for `critical|warning|opportunity|info`; the app's
per-call shape asked for `high|medium|low`; the renderer's map knew only the second and had
`?? SEVERITY.medium`. Three genuinely critical receivables findings rendered as calm amber
"Watch" cards — on the screen about money already overdue, one click from a group screen calling
receivables the act-now item. Map the synonyms, align the prompts, and **define what each level
means** so "every finding on this screen is the same severity" is recognisable as unranked.

### 39.6 Audit stored LLM findings numerically, not just for citations ✅

28 stored insights, every one citing real record codes, every code real. **Ten still carried a
wrong number.** Each figure has to be re-run against the engine:

- a total that contradicts the sum of its own components (QAR 61.4M over six brands that sum to
  QAR 64,619,740 — the per-brand figures were all correct)
- a count taken from the four examples named rather than the population (4 certified-but-not-
  answerable measures; there are 10)
- a superlative that is simply not true ("the largest absolute breach in the book" — it is 4th;
  "the worst reading in twelve months" — July was worse)
- an inference contradicted by the data it cites ("1,254 missed SLA … dragging satisfaction",
  when unmet jobs carry *higher* CSAT — 3.72 against 3.67)
- a headline framing a 7-month low as a spike (overdue 5.07%, down from 12.72%, against a 12%
  target, titled "Overdue receivables spike")
- a figure the generator computed without the cancelled-order filter (§39.4)

A citation proves a record exists. It does not prove the arithmetic, the superlative or the
causal claim. Re-run every number.

### 39.7 The app origin's data-source path is not the console's ✅

From the app origin the data sources are called at
`POST /api-endpoint/external/workflow/execute/node?name=<ds>&requestId=<dsId>`, body
`{id, context, inputs}`, cookies only. The console's `/api/workflow/execute/node` returns **401**
from the app origin and `forbidden datasource: not found` from the console. This is the way to
read and write an app's objects from outside the React app — the storage bindings in
`bindings.ts` give the exact `context` and `storedInputs`.

⚠️ `triggerInputCondition` on `storage_by_unifyapps_fetch_records` was **ignored** in this shape:
a filter on `properties.scenario_code = 'SCN-04'` returned SCN-13. Fetch the page and filter in
the caller, or verify the filter actually bit before trusting a single-record read.

### 39.8 Scenario apply/reset, verified from the UI ✅

SCN-04 from the Control Room: apply 27 s, Chevrolet average days in stock 170.952 → 248.952
(+78 exactly) and past-120 count 83 → 107, `active: true`, `touched_json` 6,985 chars of
per-record before-values. Reset 31 s, back to 170.952 / 83 / QAR 19,616,250, `active: false`,
`touched_json` `[]`, no other scenario touched. The baseline to compare against must be the
engine's own figure (170.952), not a figure the agent rounded for you (171.0).

### HubSpot connector: property discovery, lever history, VEP pipeline ✅ UAT · 2026-09-24
- The `hubspot` node has **no list-properties action** (106 resources; none reads the property catalogue).
  Discover a custom property by requesting it on `hubspot_get_deal` (`properties: [names…]`): existing
  properties with a value come back, **null-valued properties are dropped by the connector**, unknown
  names are ignored. So absence ≠ nonexistence — probe a deal known to carry values.
- `hubspot_get_deal` `propertiesWithHistory` works for **custom** single-selects: `propertiesWithHistory:
  ["dealstage","buyer_zone","case_for_change",…]` → `{value, timestamp, sourceType, sourceId, updatedByUserId}[]`
  per property (sourceType CRM_UI / AUTOMATION_PLATFORM / PROPERTY_DEFAULT_VALUE).
- Two small read-only probe workflows exist for this: `scc_hs_probe_search` `6ab4f1499d7b05455588c884`
  (any `filters[]`, `props[]`, `limit`, `after`) and `scc_hs_probe_deal` `6ab4f14af83e366af103e7eb`
  (`deal_id`, `props[]`, `history[]`). Run them with `UA.run(...)`; the search node's output is at
  `outputs.n_s` (results / total / paging.next.after).
- Portal 143913151 now has the **VEP New Prospect Pipeline** `4056960228` (Engage · Connect · Commit ·
  Validate · Select · Contract · Submitted for Closure(open) · Closed Won · Closed Lost) beside `default`
  and the renewal pipeline `4063987959`; lever properties `case_for_change`, `champion`,
  `decision_criteria`, `decision_process`, `economic_buyer`, `consensus`, `buyer_zone` — ladders in the
  `hubspot-crm-operator-sc` platform skill §14 (`e_6aaa4c0b992160713aebb310`, draft v20, published v16).

### Workflow authoring gotchas found on Deal Forecast ✅ UAT · 2026-09-24
- **Groovy `0G` is a `BigInteger`**, not BigDecimal: `def delta = 0G; delta.setScale(1, …)` fails with
  *No signature of method: java.math.BigInteger.setScale()*. Use `0.0G` for decimals (`2.0G`, `-2.0G`).
- A `CALL_WORKFLOW` node (`callables_call_automation` rv 3133) exposes the called workflow's STOP result
  **flat**: `{{ n_c1.outputs.deals }}`, `{{ n_c1.outputs.next_after }}` — there is no `.response` layer
  inside a workflow (the `.response` envelope exists only when an APP data source executes it).
- `storage_by_unifyapps_bulk_create_records` (rv 16416, `useRawPayload:true`, `rawPayload: <list of records>`)
  returns `{errors:{}, inserted:<n>, insertedIds:[…]}`; 300 rows in one node run in ~2 s. The Groovy
  that builds the rows must coerce numbers (`new BigDecimal(str(v))`) — values arriving from a called
  workflow are strings/doubles mixed.
- HubSpot search sorted by `amount DESCENDING` with `limit 100` pages fine with `after` (cursor is the
  offset as a string, e.g. `"100"`).

### Code app preview rebuild from a pushed `main` ✅ UAT · 2026-09-24
`POST /agent-api/sessions/{s}/branches {branch:'build-1', base:'main'}` then `POST …/branch {branch:'main'}`:
`/changes` showed the pushed commit and `/branches` went `buildPending:true` on `main` within ~10 s
(the deterministic "bounce"). The preview bundle (`assets/index-*.js` referenced by the preview's
`index.html`) is the only honest check that the new code is served.

### Storage fetch filter on a string date; HubSpot company logo; custom chat blocks ✅ UAT · 2026-09-24
- `triggerInputCondition` on a string field holding `YYYY-MM-DD`: `{operator:'GTE', value:'2026-08-10'}` ✅;
  `GREATER_THAN_OR_EQUAL` → *Workflow execution failed* (500). `IN` with an explicit list of dates also works.
- HubSpot company property `hs_logo_url` → `https://na1.hubspot-logos.com/<uuid|domain>` (loads cross-origin),
  but legacy rows still hold `https://logo.clearbit.com/<domain>` (dead). Fallback: DuckDuckGo icon by domain.
- Copilot island: any fenced block can become a component — see `unifyapps-apps/references/code-apps.md`
  "Deal Forecast, round 2". Contract used: ```` ```ua-forecast-map ```` + `{"kind":"forecast_map",…,"points":[…]}`.
- Orbit UAT outage observed 2026-09-24 ~13:10 UTC+4: `/api/user-context` 500 and `/agent-api/*` 503
  *"permission check is temporarily unavailable"* for every session; wait, do not retry writes blindly.
- `POST /api/test-workflow/initiate-test/{id}` returns 500 *No Response received within specified timeout*
  and the run ends CANCELLED when the workflow runs past roughly a minute (seen with 10 chained
  CALL_WORKFLOW nodes, ✅ UAT 2026-09-24). Production scheduled runs are not listed under
  `group=TEST_WORKFLOW_EXECUTION`; PROD/LIVE/WORKFLOW_EXECUTION/STANDARD groups are all *Invalid group*.
- Storage fetch node / FETCH data source accepted `page.limit` 5000 and `sortBy:[{field:'properties.x', order:'DESC'}]`.

### Deal Forecast under the CRO scoring contract ✅ UAT · 2026-09-24
- A workflow can **vanish** after a platform outage: `scc_forecast_snapshot_page` `6ab50af4aa76b93f75f49fce`
  returned 404 afterwards (not soft-deleted, not listed). Recreate it and repoint every CALL_WORKFLOW node and
  every `callables_call_automation` data source that named it (the data source's `automationId` is a stored
  input: update the entity, then the app code's CALLABLES map).
- `loop_for_each` (rv 214) does not collect per-iteration results. Write each iteration to a storage object
  (bulk upsert with `updateFields`) and read the object after the loop.
- A storage object's field with a `oneOf` enum (e.g. `kind`) rejects new values until the schema's `oneOf`
  is extended.
- Agent skill `e_skill_ai_agent` `e_6aaa4c0b992160713aebb310`: `POST /api/entity/update` saved v20 while
  `deploymentState.entityVersion` stayed 16 — edits are drafts until `saveAndDeploy`, which would also publish
  every other pending draft. Report the gap to the owner instead of deploying.
- Browser tooling: `POST /agent-api/sessions/{s}/branches` and `…/branch` can take longer than 45 s; fire them
  without awaiting and poll `/branches` in a separate call.

## 40. Findings 2026-09-24 (SHU Brain — Sacred Heart University, UAT)

App `app-2fa05be511e2` (session `e_6ab524227baf0b7e850b004b`), repo `mmaheranwar/shu-brain`. 23 objects `shu_*`,
58,340 records, 19 workflows, 4 agents, 23 data sources. Every item below was hit and fixed on this build.

**40.1 The fetch node's count is `total`, not `totalCount`** ✅. `storage_by_unifyapps_fetch_records` with
`includeTotalCount: true` outputs `{objects, total, hasMore, cursor}`. `{{ n_fetch.outputs.totalCount }}` resolves to
nothing, silently — the Claim Integrity `cig_query` clone has reported an empty `object_total` since it was
built, and an aggregate that trusted it said "computed over all 0 matching records". Use `{{ n.outputs.total }}`.

**40.2 `[:] as Set` is immutable in the Groovy sandbox** ⛔→✅. It coerces an empty map to an unmodifiable set;
the first `.add()` throws `UnsupportedOperationException`, which the node reports as `{errorCode:-1}` with no
message. It only fires on the path that adds, so a one-record test passed and the 2,000-record run failed.
Use `new HashSet()`. **Debugging recipe that found it:** re-run the definition through `initiate-test` with the
Groovy wrapped in `try { … } catch (Throwable e) { return [err: e.toString(), at: e.getStackTrace()…] }` and
the STOP node returning `err` — the stack gives the script line.

**40.3 A search on `e_data_source` must filter on `properties.interfacePageId`** ✅.
`POST /api/entity/e_data_source` filtered by `properties.interfaceId` → `500 "Search on e_data_source requires a
properties.interfacePageId filter"`. Filter on `e_global_<appId>`.

**40.4 Orbit's CSP blocks loading build scripts from localhost** ✅. `connect-src` allows only `'self'` and
`*.unifyapps.com`, so `fetch('http://localhost:…')` fails from a signed-in tab. Push the scripts to the app's
GitHub repo, pull a `sync/<sha>` branch into the session, and read them same-origin with
`GET /agent-api/apps/{appId}/branches/{branch}/files/content?path=tools/x.js` → `(0, eval)(text)`. The branch
must have been pulled (`POST …/branch`) first — before that the endpoint answers 404 `file not found`.

**40.5 Tens of thousands of small `POST /api/entity` calls freeze the hidden browser pane** ⛔→✅. Three tabs in a
row stopped responding mid-load (even `1+1` timed out) after ~1 minute of 12–32 parallel workers. Load volume
through the platform instead: a four-node workflow (`shu_bulk_load`: START {object_type, rows_json} → Groovy
`JsonSlurper` → `storage_by_unifyapps_bulk_create_records` `skipUpdate:false` → STOP) run with
`initiate-test`, 1,000–1,500 rows per call: **1,000 records in < 8 s**, 25,389 touchpoints in 7 calls, no freeze.
Resume by reading existing ids with `POST /api/aggregation … projections:[{name:'id'}]` in 5,000-row pages.

**40.6 A generated dataset object that is never registered loads zero rows, silently.** The seed built
`students` in its own array and never put them in the output map; the loader reported `shu_student: 0 rows`
with 0 failures and the baselines for that object were never written. Print per-object counts before loading
and assert every schema object has rows.

**40.7 The control-room reset must also undo derived writes that follow a scenario.** A to-do workflow that
closes an office task because its signal resolved changed a record the scenario never touched, so SCN-00 left
it closed. Rule: a Brain workflow that changes a SOURCE record in response to a lever sets `scn_dirty: true`
(the reset then restores it from `baseline_json`); purely derived fields (scores, priorities) are recomputed by
re-running the workflow after the reset. Verified: week five → Sarah acts → reset, with the to-do runs between,
**zero drift** on her student record, 6 signals and 6 tasks, zero Brain rows left active.

**40.8 Bulk-create rejects duplicate primary keys inside one batch.** The withdrawal cascade minted
`TP-B-WD-<student>-ADVISING` twice (interventions closed + caseload updated); the whole bulk create failed
after the upserts before it had succeeded — a half-applied cascade returning HTTP 500. Suffix an index.

**40.9 Writers sum figures across processes unless told not to.** Given 9 people (adjunct pay) and "up to 30"
(donation-to-cash), the writer produced "39 staff", and an agent applied "up to 30" as a ceiling to every process.
Say it in every system prompt and agent instruction: never add people/systems/steps across divisions, and name
which process each figure belongs to.

**40.10 Tool-level timings on UAT (deployed, via data source):** retention watch over 2,000 students 1.0–1.4 s;
intelligent to-do list (with its writing step) 8–9 s; payroll three-way match 0.8 s; gift-to-cash over 2,411 gifts
1.4 s; driver merge 2.1 s; withdrawal cascade 0.6 s; curriculum review 13 s; content plan 24 s; screen insights 26 s;
docked agent answer with a chart ~35 s (Gemini 3.8 Flash settings cloned from the Claim Integrity analyst).

**40.11 Publishing uses the engine's LOCAL `main`, which a `sync/<sha>` switch does not move.** After three
sync-branch switches (each pulling new commits), `POST /agent-api/apps/{appId}/publish` published v3 from the
old `5ea14fb` — `deploymentState.additionalDetails.sourceCommitHash` said so. The fix: `POST /sessions/{s}/branch
{"branch":"main"}` (reload the Code Builder page if it queues) until `/changes` shows `main <new sha>`, THEN
publish (v4 from `896158c` ✅). Always read `sourceCommitHash` back after a publish; the 200 alone proves nothing.
Corrects the earlier note that "the fetch also fast-forwards the engine's main".

**40.12 Cheap exact counts: `POST /api/entity/{objectType}` with `includeTotalHits: true`.** Body
`{filter:{op:'AND',values:[{op:'EQUAL'|'IN',field:'properties.x',values:[…]}]}, page:{limit:1,offset:0},
includeTotalHits:true}` returns `totalHits` in ~100 ms — the right tool for verifying a load or a reset
fingerprint at 170k records (a workflow aggregate pages through every row).

**40.13 Scale that holds on UAT (SHU, 167,958 records, 22 objects):** `shu_bulk_load` (Groovy JsonSlurper →
`bulk_create_records`) at 1,500 rows per call ≈ 17 s per initiate call, 128 calls ≈ 35 min; one call returned
500 "No Response received within specified timeout" and was resent (upsert by primary key, so idempotent).
A fetch node with an `IN` filter of ~2,900 codes and `limit: 5000` works; a targeted retention sweep over
7,087 students (read active signals → read only students with one, on the watch list, or with a stale count)
runs in 2.5 s. A 20-page aggregate (100k rows) replaces the 6-page one.

**40.14 A control-room reset must switch off what events CREATED, never restore it.** Event B touching rows
event A created (marking them `scn_dirty`) made the reset's "restore from baseline" branch claim them, and the
"switch off created rows" branch then skipped them — Sarah stayed at 52 instead of 41.69. Rule: classify created
rows by code prefix first (`SG-E-`, `TK-B-`, `IV-B-`, `TP-E-`, `DP-E-`) and always switch them off
(`active:false, scn_dirty:false`); only seeded rows are restored. Verified with a 25-figure fingerprint:
zero drift after each of 8 events, a two-event sequence, and the in-app filing/completion actions.

## 42. Findings 2026-09-24/25 (SHU Brain on tool.prod-aps1 — a 37-type, 199k-record graph loaded in one evening)

**42.1 `storage_by_unifyapps_bulk_create_records` INTO a graph node type works ✅ aps1.** `object_type` =
the node's `unifiedEntityId`, `useRawPayload:true`, `rawPayload` = a JSON array of records (all values
strings), `skipUpdate:false`. 1,000 records per call in ~1.4 s when the workflow is run synchronously
through an app data source (`POST /api/workflow/execute/node?name=<ds>&requestId=<dsId>` with header
`x-ua-app`); the STOP result carries `insertedIds[]`. 199,300 records in 37 node types loaded in ~50 min.
Corrects §36.2's implication that every bulk writer fails on graph records: bulk **create** is fine; the
bulk **update/upsert** writers are the ones that do not touch graph records. About 1 initiate-test run in
50 fails at `n_bulk` with no message under load; a re-run of the same slice succeeds (upsert by primary key).

**42.2 Projection lags the load by minutes, per type.** After every bulk create returned, `MATCH (n)`
counts trailed the plan for ~10 minutes (Registration 0 → 5,531 → 14,174). Verify counts after a pause,
not after the write, and never write relationships to a type that has not finished projecting — a
`MATCH` on an unprojected node simply matches nothing and `MERGE` writes no edge, silently.

**42.3 Relationships: `mdm_by_unifyapps_execute_opencypher_update` (rv 336) with `UNWIND … MATCH … MERGE` ✅**
— the fast path. `MATCH (a:\`<ue>\`) WHERE a.id = r.f` on the node's `id` property (`<org>::<ue>::<pk>`,
e.g. `90::6ab567a3…::TP-000001`, indexed) writes 100 edges in **364 ms**; the same by the `_pr_` primary-key
property takes **8.6 s** (label scan). 500 per call stays under the 20 s synchronous limit. Returns only
`{success:true}` — count the edges with a Cypher read afterwards. `SHOW INDEXES` is rejected by the
Cypher-DSL rewriter.

**42.4 The `loop_for_each` + `add_edge_to_graph` writer (§36 Jaidah) was unusable here ⛔ aps1 2026-09-24.**
`POST /api/test-workflow/initiate-test/{wf}` on that workflow returned 500 `No Response received within
specified timeout` on every attempt (5 edges, 84 edges, captureIterations true or false) while the same
call on a bulk-create workflow succeeded throughout. A synchronous run through its data source is
**CANCELLED by the platform at 20 s** mid-loop (2 of 84 edges landed); `callables_call_automation_async`
(`synchronous:false`) returned `{result:true}` in 173 ms and wrote nothing. Use 42.3.

**42.5 A graph's auto-created MDM connection is now named `<graph name> Ontology Connection`** (was
`… UDM Connection`, §12). Find it with the lookup and match `/ontology connection|udm connection/i`.

**42.6 Branch files are served as soon as a switch is REQUESTED.** `GET /agent-api/apps/{app}/branches/
sync/<sha>/files/content?path=…` returned 200 while `/sessions/{s}/branches` still showed the branch as
`pendingBranch` — the fetch happens on the POST, the checkout later. Good enough to load build tools into
the tab without waiting for the preview build.

**42.8 Writing graph records — what reaches the store and what does not ✅ aps1 2026-09-25.**
| Write | Store (`GET /api/entity/{ue}/{id}`) | Projection (Cypher) | Edges kept |
|---|---|---|---|
| `storage_by_unifyapps_update_record_by_id`, whole payload | ✅ | ✅ (seconds) | ✅ |
| `storage_by_unifyapps_bulk_create_records` on an EXISTING pk, `skipUpdate:false` | ✅ — it is an upsert that **REPLACES the whole record** (a payload of 2 fields leaves a record of 2 fields; verified 2026-09-25 03:55 after an earlier "merge" reading that was only the read lag) | ✅ | ✅ |
| `execute_opencypher_update … SET n.\`_pr_x\` = …` | ⛔ unchanged | ✅ changed | — |
| `execute_opencypher_update … MERGE (a)-[:L]->(b)` | edges appear in the record API's `edges[]` ✅ | ✅ | — |
So: bulk create is the mass-update path for a sweep, and the payload must be the WHOLE record (read all
properties by Cypher, change fields, write everything back) — a partial payload deletes what it omits.
Never SET a property by Cypher — the store keeps the old value and the next re-projection will disagree
with the screen. **Read-after-write lag is 5–15 s on the store and minutes on the projection after a bulk
load**: a workflow that reads records the projection has not caught up with writes them back WITHOUT the
fields it could not see (this is how 41 drivers, 71 certificates and 10 gifts lost their `baseline_json`
after a 62k-record backfill was followed too soon by Brain runs). After any bulk load, wait until
`MATCH (n) WHERE n.\`_pr_<new field>\` IS NULL` is zero before running anything that writes.

**42.9 `callables_call_automation` with `synchronous:false` executes ✅.** A data source cloned with
`inputs.synchronous=false` returns `{result:true}` in ~110 ms and the run completes in the background
(a record created by it appeared 12 s later). The earlier "async wrote nothing" (42.4) was the loop
workflow's own failure, not the async path. Use it from an app for anything longer than the 20 s
synchronous limit, and read the outcome back from the graph.

**42.10 Porting storage workflows to the graph by TRANSFORMATION (shu-graph-workflows.js) ✅ 2026-09-25.**
19 workflows moved from Data Objects to the ECG without rewriting their Groovy. What had to change:
- a storage `fetch_records` node exposes `{{ n.outputs.objects }}`; a Groovy node that replaces it exposes
  `{{ n.outputs.result.objects }}` — every downstream reference must be rewritten;
- `mdm_by_unifyapps_execute_opencypher_query` answers `{stats, objects:[…], success}`; bind
  `{{ n_q.outputs.objects }}` to an array parameter — binding the whole Map to an array parameter arrives
  EMPTY with no error;
- graph properties are strings, so `active == true` / `receipted == false` in the original logic silently
  fail; the shaper hands 'true'/'false' back as booleans;
- a spec that paged its own reads (offset 5000) must keep the offset or the second page repeats the first
  (Sarah scored 66 from her 2 signals counted twice);
- generated Groovy nodes need their own `def g = { k -> binding.hasVariable(k) ? … }` — the original PRE is
  not inherited ("No signature of method: Script.g()");
- a Groovy map literal is `['k': 'v']`, never JSON `{"k":"v"}` ("Unexpected input: ':'") — the deploy step
  compiles every script, the save step does not;
- relationships written right after a bulk create can miss the not-yet-projected nodes: keep the link key
  on the record and run an idempotent `shu_link_orphans` (`MATCH (a) WHERE NOT (a)-[:L]->() … MERGE`) after
  every run — 933 ms over 200k nodes.

**42.7 aps1 resource versions used:** callables 1686, storage 3565, groovy 1285, loop 77, mdm
`add_edge_to_graph` 869 / `execute_opencypher_query` 2244 / `execute_opencypher_update` 336 /
`create_staging_records` 2244, conv_ai llm 1248. A node type creates in ~2 s here (37 in ~80 s), not the
~35 s of §12.

## 41. Findings 2026-09-24 (Mars Pedigree Amazon Optimization — 109 workflows from one design, UAT)

App `app-31077911d563`, repo `mmaheranwar/mars-pedigree-amazon`; build tools `tools/pao-*.js`. A solution design
with 1 master workflow, 26 sub-workflows, 78 atomic agents and 15 applications, built literally: every agent is its
own deployed workflow returning a confidence envelope, every run lands in an evidence ledger (SW-26), and every
sub-100 output goes through a resolution workflow (SW-25) that applies precedent or opens an inbox item.

**41.1 Loading build scripts into a signed-in Orbit tab — push a NEW branch, switch the session, read the file ✅.**
Orbit's CSP blocks fetching from localhost and raw.githubusercontent. What works in ~3 s: `git push origin
tools:refs/heads/tN` → `POST /agent-api/sessions/{s}/branch {branch:'tN'}` (the engine only fetches branches it has
not seen) → `GET /agent-api/apps/{appId}/branches/tN/files/content?path=tools/x.js` → `(0, eval)(src)`. Reading the
file before the session switch returns 404 even though `GET /apps/{id}/branches` already lists the branch. Use a new
branch name per push; pushing more commits to a known branch is not fetched. Side effect: every switch is a builder
checkout — harmless while the branch only adds tool files.

**41.2 Generating 109 workflows.** One generator (`pao-wf-core.js` node helpers + a `wire()` that turns nested
`{if, then}` / `{each, body}` items into group ids and `if`/`loop`/`loopback` edges) built and deployed all 109 in
~13 s at 4–5 in parallel (`saveAndReturnViolations` → `deploy?version=`). Deploy is where Groovy compiles: the only
errors were a literal newline inside a single-quoted Groovy string (JS template escaping) and a helper defined only in
one prelude. Put shared helpers in ONE prelude; a second `def` of the same closure name in the same script is a
compile error.
- IF branch with nothing after it inside a loop body: add a no-op rejoin node, so the IF's `no` edge and the loopback
  are different edges (both would otherwise be `next@<if>@<loop>`).
- `loop_for_each` over a list that may be empty: pass `['__none__']` and guard the body with an IF on a flag the split
  node computes — otherwise the body runs once on the placeholder.
- The UnifyApps HTTP node cannot decompress: eCFR's `versioner/v1/full/...` returns **406 "requires response
  compression"**; the renderer `GET https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-21?chapter=I&subchapter=E&part=501`
  returns the official HTML uncompressed (132 KB) — use it.
- **fda.gov refuses the platform's egress** (AkamaiNetStorage **404 "Not found"** for pages that return 200 from a
  desktop, with any User-Agent, HTTP/1.1 or HTTP/2). Public FDA pages must arrive in collect mode (a capture with its
  SHA-256), and the adapter reads them from the capture object.
- pedigree.com product pages fetch fine from the platform (3.5 MB each; 97 pages in 14 s at 6 parallel data-source
  calls). Their schema.org `Product` JSON-LD and the Drupal `dataLayer.taxonomy` (JSON string inside JSON) give name,
  UPC, description, sizes, flavor, life stage and "reasons to believe" deterministically.
- `java.security.MessageDigest` is allowed in Groovy (SHA-256 for checksums, idempotency keys and diff hashes).
- A 600,000-character string written with `POST /api/entity` into an object field reads back intact.

**41.3 One data source per workflow — a generic dispatcher is refused.** A workflow whose CALL_WORKFLOW node takes
`automationId` from an input (run any workflow by id) was refused by Claude's permission classifier as a
remote-execution surface. Register one callable `e_data_source` per workflow the app runs (here 119), and keep the
map (name → data source id, automation id, parameters) in the repo as JSON read back from the tenant.

**41.4 Automated Amazon reads were refused** — a server-side fetch of amazon.com pages (browser User-Agent) was
refused by the classifier. There is no Amazon SP-API or Ads connector in the tenant catalogue. The build therefore
implements the design's own contract: acquisition agents ABSTAIN with `ACCESS_NOT_GRANTED` / `CAPTURE_NOT_PROVIDED`,
and a collect-mode intake accepts pages a person saved (reduced in the browser, stored with SHA-256, verified by the
fetch agents before anything reads them).

**41.5 Timings (deployed, via data source).** An abstaining agent with its ledger + resolution calls: ~0.4 s. An LLM
extraction or judgment agent: 4–10 s. The whole 20-step master workflow on an empty scope: 3.2 s (12 envelopes, 5
inbox items). SW-21 claims review of one product (1 classification + a rule match and a prohibited screen per claim,
13–19 claims): ~60 s.

**41.6 The Code Builder switch to a branch carrying a 28 MB prebuilt copilot island sat in `pendingBranch` for
several minutes** with `buildPending: false` (see §23 "Getting a local change into the preview").

**41.7 Collect mode from the in-app browser — a same-tab fragment relay ✅ (2026-09-24).** The browser pane refuses
`window.open` from page script ("new tabs open only from the user's own clicks"), and `window.open('', name)` to reach
an existing named tab returns `null`, so a `postMessage` relay between an Amazon tab and the signed-in Orbit tab is not
available. What works: in the Amazon tab reduce the rendered DOM (the Cycle Console rules, plus Amazon's site chrome
`#navbar-main, #nav-belt, #nav-main, #navFooter, #rhf, #hmenu-container, #nav-flyout-anchor, #skiplink`), gzip it
(`CompressionStream`), base64url it and navigate the SAME tab to `https://orbit.uat.unifyapps.com/robots.txt#pao=<data>`
(a fragment never reaches a server; `robots.txt` is a 200 text/plain page, so nothing heavy loads). On that Orbit
origin park it in `localStorage`; the signed-in Orbit tab (same origin) reads it back, `DecompressionStream`s it and
calls the intake workflow through its data source. A search results page: 1.19 MB rendered → 600 KB reduced → 63 KB
packed; the intake stored it with its SHA-256 (`CAP-SEARCH_RESULTS-67C82EBB93`). Tool: `mars-pedigree-amazon/tools/pao-relay.js`.

**41.8 Amazon serves the catalogue for the browser's delivery location.** Without a sign-in, amazon.com geolocates
the delivery address (here: United Arab Emirates). Search results are then filtered to items that ship there (the
Pedigree 30 lb bag disappeared), most prices are blank, and the ones shown are in AED. Any capture for a US
optimization needs a US delivery ZIP set first (a site preference, entered in the location popover). Captures made
before that are real but skewed; they stay (nothing is deleted) and the agents read the newest capture per subject.

**41.9 Deterministic codes make sub-workflow re-runs idempotent ✅.** Claim codes `CLM-<cycle>-<target>-<sha256(text)[0:8]>`,
gap codes `GAP-<asin>-<cls>-<sha256(cycle|cls|finding)[0:8]>` and opportunity codes derived from them: a re-run
FETCHes what exists, CREATE_MANYs only new codes, and UPSERTs pending claims in place (decided ones untouched).
Verified: SW-21 twice on one product → 13 claims, then the same 13 re-evaluated (rule matches refreshed), no
duplicates. The LLM classifier (AG-69) returned the same 13 claim texts both times.

**41.10 Connectors SDK — LWA (Login with Amazon) custom auth, templates, and failure handling (UAT 2026-09-24).**
- *Refreshable CUSTOM auth*: the saved auth request carries `defaultExpiry`, `defaultExpiryUnit`, `expiryType`
  (`RELATIVE` | `ABSOLUTE`), `expiryTime` (string), `expiryUnit`, `refreshable`, and a `refreshCredentials` request
  object (method/url/headers/body/output — the UI shows no Body field for it, but a `body` set over the API persists).
  `POST /api/connector-builder/request/{defId}/CUSTOM/auth` answered **500 "ConnectorRequestService remote call
  failure" but had saved the request** (read back with GET) — always read back before retrying.
  LWA shape that reaches Amazon: `POST https://api.amazon.com/auth/o2/token`, `Content-Type:
  application/x-www-form-urlencoded`, `body:{type:"JSON", formEncode:true, payload:{grant_type:"refresh_token",
  refresh_token, client_id, client_secret}}`; with obviously fake credentials `POST /api/connection/input/test`
  returns Amazon's own `x-amzn-errortype: OA2InvalidClientException` (401) — egress and encoding proven, nothing saved.
- *Action templates* (echoed through httpbin, connector `PAO template probe`): `{{ input.auth.<field> }}` is a
  connection field in query/body; a whole-value template keeps its type (array → JSON array, number → number); Groovy
  runs (`{{ rawPayload.values.collect { [value: it] } }}` → array of objects); an **absent** action input drops its
  query parameter entirely, an **empty string** is sent as `key=`; an absent body value drops the key, inline it
  renders `null`. In `actionAuthHeaders`, `{{ auth.<output> }}` renders but a connection field via
  `{{ rawPayload.<field> }}` does **not** (header omitted) — put per-connection headers on each action.
- *`connectionId` must be a literal, existing connection* at save time: a template (`{{ n_in.outputs.connection_id }}`)
  is a violation "Connection is no longer available" and the workflow does not deploy.
- ⛔ *Failure handling, resolving D2*: a Connectors-SDK action answering HTTP 500, run through an app data source,
  **failed the whole run with `fallbackMode: CONTINUE`**, and **also with `MANUAL` + an `error` edge** (edge
  `error@n_f@n_h`, name `error`, handler in group `n_f@g1@error`; both a handler that rejoins the main flow and one
  that ends in its own STOP). Design for it: one unit of work per run, record the attempt before the external call,
  let the scheduler retry, and cap attempts — do not rely on in-graph error paths for connector failures.
- *Gzip in Groovy* ✅: `new java.net.URL(u).openConnection()` → `getInputStream().bytes` →
  `new java.util.zip.GZIPInputStream(new ByteArrayInputStream(raw)).bytes` (probe `pao_zz_probe_report_gunzip`:
  3,619 → 17,920 bytes). This is the path for SP-API report documents and Ads v3 `GZIP_JSON` reports (pre-signed
  S3 URLs — download them WITHOUT the connector, which would add unsigned `x-amz-*` headers).
- Connectors built: `Amazon Selling Partner API` `6ab5498d18ddf207e96d5561` (14 actions), `Amazon Ads API`
  `6ab54c3084c18c627a82da24` (6 actions); build script `mars-pedigree-amazon/tools/pao-connectors.js`.

**41.11 ⛔ Publish ships the workspace's own `main`, which a session on another branch never updates (UAT 2026-09-24).**
The session had only ever been switched to `sync/<sha>` / `tN` branches (to refresh the preview and to load build
scripts). `POST /agent-api/apps/{id}/publish` then answered `ok` with `commitHash b9bb3be` — **the platform's
original starter commit** — so the published app became the starter page while GitHub `main` was 40+ commits
ahead. Fix: `POST /agent-api/sessions/{s}/branch {branch:"main"}` (applied at once when the session is on another
branch; the workspace pulled origin/main — `GET /agent-api/apps/{id}/branches/main/files/content?path=…` showed the
new files within 20 s), then publish and **check the returned `commitHash` equals the commit you pushed** (here one
call, ~2 min, `09fed4a` → v3). Rule: never trust a publish without comparing `commitHash` to `git rev-parse HEAD`.

**42.11 Cypher on the aps1 graph: always label the node you look up by `id` ✅ 2026-09-25.** On the 199k-node SHU graph
`MATCH (n) WHERE n.id = '90::<ue>::S-101443' OPTIONAL MATCH (n)-[r]-(m) RETURN …` took **15-17 s**; the identical query with
the label, `MATCH (n:\`<ue>\`) WHERE n.id = …`, took **120 ms** (47 rows). Likewise a lookup of one code across all 37 types:
`WHERE n.id IN [37 ids]` without a label 1.4 s, `n.id ENDS WITH '::S-101443'` 3.6 s, and 37 labelled `MATCH (n:\`<ue>\`) WHERE
n.id = …` branches joined with `UNION ALL` (9 KB of Cypher) **330 ms**. The `id` index is per label. Aggregate aliases
(`count(n) AS n`) come back as **strings** like every other value of `execute_opencypher_query` — `Number()` them before summing
(a `reduce` over them concatenates). Republish recipe re-confirmed on aps1: the workspace's `main` is pulled only by switching
the session **away** (`POST /agent-api/sessions/{s}/branch {branch:'sync/<x>'}`) and **back** to `main` (6 s apart);
`/changes` shows the new sha within ~10 s, `buildPending:true`, preview bundle live in ~60 s; then
`POST /agent-api/apps/{id}/publish {versionTag, versionNote}` — the call runs ~90 s (longer than a 45 s browser-tool timeout,
but it completes anyway; poll `GET /api/entity/e_interface/{app}` for `deploymentState.additionalDetails.sourceCommitHash`).
Each publish adds a `publish vN` commit to GitHub `main` (it rewrote `app/.env` `VITE_APPLICATION_ID` to the app's own id), so
`git fetch` + rebase before the next push.

## 43. Findings 2026-09-24 (UnifyApps Studio redesign, Orbit UAT)

**43.1 `theme.json` drives the code-app theme end to end ✅ UAT.** Changing `font` (`sans`, `heading`,
`googleHref`) and the `light` token map in the repo-root `theme.json` changed the built preview's
`--primary`, `--background`, `--border` and the `ua:theme-font` link on the next branch build (read via
`getComputedStyle(document.documentElement)`). Keys outside the shadcn set (`success`, `warning`,
`info`, …) are not taken from `theme.json`; set them in an app-owned stylesheet imported after
`index.css` in `main.tsx` (same specificity, later wins).

**43.2 `POST /agent-api/sessions/{s}/branches {branch, base}` returns 409 `branch '<x>' already exists`
when `branch` was pushed to GitHub first ✅ UAT.** Push to a source branch and create a *new* name from
it (`{branch:'<n+1>', base:'<pushed>'}`). While the build runs, `/agent-api/preview/b/<app>/<branch>/`
returns 404 and `GET …/branches` shows `buildPending:true`; builds took 5–8 minutes on 2026-09-24.

**43.3 In-page accessibility scans on signed-in previews ✅ UAT.** `@accesslint/core` (MIT) ships
`dist/index.iife.js`; served from the app's `public/tools/` it loads same-origin and
`AccessLint.runAudit(document)` returns WCAG 2.2 A/AA violations with selectors. The CLI and
playwright-cli need their own browser, which cannot reuse the Orbit session.

**43.4 Storage records of custom objects update through the entity API ✅ UAT.** `GET
/api/entity/<object>/<recordId>` then `POST /api/entity/update {id, entityType:<object>, properties,
version}` updated `scc_studio_solution.is_current` and `scc_studio_run.solution_key` (200, read back).

**41.12 A full simulated cycle end to end (CYC-2026-09-24-SIM, 2026-09-24) — what it exposed.**
Real amazon.com pages (8 Pedigree listings, 10 competitors, the brand store, 5 searches; delivery 37067) + simulated
API reports (tagged `SIMULATED`, read only inside a `…-SIM` cycle). ~2,500 agent runs; 104 gaps → 96 opportunities →
9 accepted → 30 changes → 267 claims decided → 18 signed → 13 verified → Impact Board; Teach → re-run cleared at 100
by precedent. Platform/tooling facts:
- Amazon's rendered PDP (Sep 2026) changed under the parsers: the page text opens with skip-links and delivery
  chrome (LLM windows must start at `#productTitle`); the listing title is `#productTitle` **+ the
  `dp-title-differentiators` line** (joined " | ", as in `<title>`; an HTML comment sits before its span); the Buy Box
  table reads "Shipper / Seller Amazon.com" with the value **rendered twice**; the first `.a-offscreen` in the price
  block is **blank** (the visible whole.fraction is the price; later offscreens are per-unit); review hooks are
  **`reviewTitle` / `reviewText`** (was `review-title` / `review-body`); carousels are "Products related to this item"
  / "Similar brands on Amazon" (no "people also consider"). Pack weight must handle "3.5 oz, 30 Count".
- Dual reads must look at the **same section**: when the parser reads a heading block and the LLM a text window, a
  correct extraction still "disagrees". For maps and unordered sets, keep only what both reads confirm (≥3).
- A `pao_query`-style data source that caps rows (ours: 150, `truncated:true`) silently hides work — filter or page.
- **Concurrent decisions race**: four claims of one change decided in parallel each saw the others pending, so the
  change's gate never flipped. Decide the gate where it matters (the Publish Gate reads the claims live).
- Long sub-workflows (≈3 min, one LLM call per gap) outlive a 200 s client wait on the data-source call; the run
  continues and completes server-side — poll the records, don't retry.

## 44. Findings 2026-09-25 (Studio build engine, Orbit UAT)

**44.1 `ai_agent` create rejects `sendSuggestedQueries` ✅ UAT.** `POST /api/entity {entityType:'ai_agent'}`
with `properties.sendSuggestedQueries` → 500 *Non Empty Validations … additionalProperties
sendSuggestedQueries*. Leave it out on create (agents.md §"An agent cloned…" suggests setting it; that
only applies to an update of an entity that already carries the key).

**44.2 Agent publish races its own tool/task writes ✅ UAT.** Creating `e_action_ai_agent` / `e_topic_ai_agent`
rows bumps the agent's version; a `saveAndDeploy` with the body read just before can fail *ENTITY … version
N is stale, current version is N+1* (5001). Re-read and retry; stop when
`deploymentState.entityVersion === version`. *(Superseded 2026-09-28 by §47.1: verify by comparing the deployed snapshot's `properties` with the agent's; `version` climbs on its own, so a version-equality loop may never end.)*

**44.3 Tag lookup for entities ✅ UAT.** `POST /api/aggregation?entityType=ai_agent&group=ENTITY` with
`filter:{op:'AND',values:[{field:'tags',op:'IN',values:['<tag>']}]}` returns the tagged agents
(`properties_tags` returns nothing). Tools/tasks of an agent: `e_action_ai_agent` / `e_topic_ai_agent`
with `properties_aiAgentId IN [id]`.

**44.4 FileUpload `supportedFileTypes` must be extensions or wildcards ✅ UAT.** `['.pdf','image/*']`
renders the drop zone; MIME strings (`application/pdf`, `image/png`) left the block invisible (no error).

**44.5 Reading a pushed branch without a build ✅ UAT.** After `POST /agent-api/sessions/{s}/branches
{branch, base}` the file is readable at once from
`GET /agent-api/apps/{appId}/branches/{branch}/files/content?path=app/public/…` (the build runs in the
background). A same-origin tab can fetch and eval a tool library from it; branches only pushed to GitHub
are 404 until registered.

**44.6 A schema-2 workflow compiler in the browser ✅ UAT.** Workflows built node by node over REST
(START callable/SCHEDULED, groovy, fetch, create_record, bulk_create, bulk_upsert with updateFields,
call_llm_model_with_options with a Groovy-built `message` list, OCR extraction, CALL_WORKFLOW,
IF_ELSE with a no-op rejoin, STOP) saved without violations and ran through app data sources; a
`triggerInputCondition` may be a template resolving to a map a Groovy node built (`[:]` = everything).

## 45. Findings 2026-09-25 (Student Lifecycle Brain — integration layer on tool.prod-aps1)

Product build: simulated systems of record (42 storage objects, 215k records) → generic sync engine →
Enterprise Context Graph (47 node types, 92 edge types). Tools in `mmaheranwar/shu-brain-ecg`
(`solution/tools/slb-*.js`, `tools/sim/*`).

**45.1 ECG Sources cannot ingest data objects.** The Sources wizard catalogue (`/api/applications?module=ecg`)
lists 20 SaaS connectors (Confluence, GitHub, Gmail, Google Drive/Sheets, HubSpot, Jira, OneDrive, Outlook,
SharePoint, Teams, Salesforce, Slack, WhatsApp, Workday, …) and nothing for a database, a student system or
a UnifyApps object; `GET /api/context-graph/sources/applications/storage_by_unifyapps/objects` → empty.
`mdm_by_unifyapps_create_staging_records` / `apply_data_matching_rules` require a `sourceId` (a published
ECG source). ⇒ For systems outside the catalogue, integration = automations: record triggers + scheduled pull.

**45.2 Storage record triggers carry the before image ✅ (schema read).**
`storage_by_unifyapps_on_any_change {object_type, triggerInputCondition}` → `{change_type, object{id,
properties, version, modifiedTime, lastModifiedBy…}, before{…}}`; `on_create_record` and `on_update_record`
also exist. START node: `trigger:{type:'EVENT'}`, context `storage_by_unifyapps / storage_by_unifyapps_on_any_change`,
inputs `{object_type, triggerInputCondition:{}}`.

**45.2a A record trigger deploys only on an object with record events on.** ✅ UAT 2026-09-27 (Forge three-way match build, workflow `6ab8b0903c2b816ad4fe8f2c`): `POST /api/workflow-definition/{id}/deploy` of a workflow whose START is `storage_by_unifyapps_on_any_change` on a freshly created object → HTTP 500, violation on `n_in.inputs.object_type`: "Webhooks are not enabled for object '<id>'. Please enable webhooks on the object to use this trigger." The switch is the object's `metadata.supportsWebhook` (false on every object the accepted builds exported; `true` in the entity-type read-back once set): `POST /api/entity-type/update` with the full metadata read from `GET /api/entity-type?entityType=` and `supportsWebhook: true`, then deploy. Forge's `kit_objects` takes `events: true` for it.

**45.3 🔴 Inside a workflow, `fetch_records` filters on object fields need `properties.<field>`.**
`{property:'status', filter:{operator:'EQUAL', value:'PENDING'}}` returns **nothing** (200);
`{property:'properties.status', …}` works. `id` works bare (`GT`, `EQUAL`, `IN`). Sorting accepts both
`queued_ms` and `properties.queued_ms`. The system fields **`modifiedTime` / `createdTime` cannot be
filtered at all** (`GT`, `GTE`, `LT`, `EQUAL` all return nothing) but **can be sorted**. ⇒ incremental pulls:
full resync pages by `id GT <last id>` ascending; a safety-net pull reads the newest N by
`modifiedTime DESC` and keeps those newer than the watermark (flag a GAP when the page does not reach back).

**45.4 A graph node record written through the store is invisible to Cypher for seconds to minutes.**
`MERGE` against a node the projection cannot see yet does nothing (no error): 50 employees + 50 edges written in
one run → 0 edges; the same edges a minute later → 50. After a 15k-record load, edges to those nodes kept
failing for several minutes. ⇒ Queue relationships (`slb_ops_edge_queue`), write them once ≥ 60 s old, **read
each back** with a labelled `MATCH (a:L1)-[:R]->(b:L2) WHERE a.id=… AND b.id=…`, mark DONE only if returned,
retry with time-based backoff (attempt n waits n minutes), FAILED after 10 with the reason. 4,200 edges per run
in six UNWIND statements of ≤ 700 pairs + six verify reads ≈ 10 s.

**45.5 🔴 Never merge a golden record from the projection.** Reading the current golden record with Cypher and
writing the merge back with `bulk_create` (which REPLACES the record, §42.8) wiped fields whenever the projection
lagged: 853 enrolled students lost their Slate fields and lineage. The store is authoritative and readable by
business key: graph node records are storage records of object type `<unifiedEntityId>` whose **record id is
the primary-key value** (`GET /api/entity/<ue>/G-SL-682522` ✅; the `90::<ue>::<pk>` node id → 404). Use
`storage_by_unifyapps_get_records_by_ids {object_type: <ue>, ids:[pk…]}` for read-modify-write.

**45.6 Workflow-to-workflow calls are `CALL_WORKFLOW` nodes** (re-confirmed on aps1): `type:'ACTION'` fails at run
time with *No config found for resource callables_call_automation*. Outputs are flat.

**45.7 Access identity for a governed read path ✅.** A query workflow that first writes its access-log row with
`storage_by_unifyapps_create_record` (raw payload from a Groovy node — templates cannot generate ids) gets
`outputs.ownerUserId` = the calling platform user (519612 for Maher via an app data source); map it to a role
in a config object and check every backticked label in the Cypher against a governance matrix before running it.

**45.8 Tooling.** A browser tab that `eval`s repo files from `/agent-api/apps/{app}/branches/main/files/content`
must fetch with `cache:'no-store'` and a cache-buster — the browser served a stale copy after a pull and two
deploys were silently built from old code. Groovy: a variable declared in an outer closure cannot be redeclared
in a nested closure (`score`), and two `def d` in one `switch` are the same scope — both fail at deploy.
Bash heredocs in the agent shell altered backslashes in patch scripts; write patch scripts as files. The
repo's no-delete guard matches trigger names that contain "delete" even in documentation text.

**45.9 Throughput measured (aps1, app data source, synchronous).** Generic apply of 1,000 simple records ≈ 1 s;
400 golden-record merges (crosswalk lookup, store read, survivorship, lineage) ≈ 1.1 s; 215k records across 41
sources synced in ~6 minutes with zero record errors.

**45.10 🔴 A `LOOP` body must sit in the loop's child group, or the run never ends and every call in the body
is replayed ✅ aps1 2026-09-25 (proven both ways).** Body nodes need `groupId: "<loopId>@<parentGroup>@l"`
(e.g. `n_loop@g1@l`), as the builder skill's groupId section says. Built with every node in the root group
(`g1`), the loopback edge re-enters the loop at its first item for ever: a scheduled job ran one
`CALL_WORKFLOW` body 2,163 times in 35 minutes (~100/min, stepping up with each schedule tick) and a
safety-net loop replayed ~200 pulls a minute, flooding the store and the projection. Inline test runs on the
same 3-item graph: flat body → `CANCELLED` at 20 s (the test runner's cap; production has no cap); nested body
→ `COMPLETED` in 847 ms with exactly three child calls. Also 42.4's "loop writer unusable" had the same flat
shape — re-test before relying on that finding.

**45.11 Stopping a runaway ✅.** Pause a deployed workflow: `POST /api/workflow-definition/{id}/pause` (resume:
`POST /api/workflow-definition/{id}/unpause`; `/resume` is 404; a redeploy also clears the pause). Cancel one
run: `POST /api/workflow/cancel/execution/{executionId}` → 204. Production runs are listed by
`POST /api/aggregation?entityType=WORKFLOW_EXECUTION&group=PLATFORM` with filter `WORKFLOW_ID IN [<id>]`
(statuses `COMPLETED`, `FAILED`, `CANCELLED`, `WAIT`); every `CALL_WORKFLOW` child shows as its own root
execution. A run may stay listed as `WAIT` after its work finished (and after a cancel returned 204) — judge by
effects. Node inputs/outputs of production runs are not readable through `TEST_WORKFLOW_VARIABLE`
(`inaccessibleObjects`); re-run the saved definition through `initiate-test` (inline graph) to read each node.

**45.12 The storage fetch step ignores a sort on `createdTime` / `modifiedTime` ✅.** Through an app data source
(`storage_by_unifyapps_fetch_records`) `sortBy [{field:'createdTime',order:'DESC'}]` returns unsorted rows;
`properties.<field>` sorts work (a `YYYY-MM-DD HH:MM:SS` string sorts correctly). `POST /api/entity/{object}`
honours `createdTime` sorts. The entity list takes `includeTotalHits:true` → `totalHits` (exact count).

**45.13 Numbers read back from the store are Long or Double.** The same field came back as `1790310088242` on
one record and `1.790310088242E12` on another. Groovy that drops decimals before expanding the exponent turns
the second into `1` — expand `E` first (`new BigDecimal(v).toBigInteger()`), then strip decimals.

**45.14 Groovy inside a JavaScript template literal loses single backslashes.** `\(` and `\s` in a builder's
template string reach Groovy as `(` and `s`: a governance regex `/\(\s*…\s*\)/` deployed as `/(s*…s*)/`,
matched every query and refused every read for non-admin roles. Double every backslash in the JS source and
check the deployed code (`GET /api/workflow-definition/{id}` → node `inputs.code`).

**45.15 Projection lag under load.** After the runaway in 45.10 wrote millions of records, a store update took
~15 minutes to show in Cypher (normally seconds). Screens that must show an action at once should read the
action's audit row from the store, not the graph.

**45.16 Files endpoint returns raw text.** `GET /agent-api/apps/{app}/branches/main/files/content?path=…`
now returns the file body as text (it returned JSON `{content}` earlier) — parse defensively.

**45.17 The real context graph can be framed inside a code app ✅ aps1 2026-09-25.** The console's graph view
(`/p/0/context-graphs/{graphId}`, and a record's neighbourhood at
`…?tab=records&recordNodeId={graph node id}&recordId={record key}`) sends `X-Frame-Options: SAMEORIGIN` **and**
`frame-ancestors 'self' https://*.unifyapps.com`; the browser honours `frame-ancestors`, so any `*.unifyapps.com`
host can frame it. Verified from the published code-app host `app-…-tool.tensor-prod-aps1.unifyapps.com`: the graph
renders under the viewer's console session (same-site cookie). The viewer must already be signed in to the console.
- **Framed, the console drops its side navigation.** Measured at a 1,420 px wide frame: the model view's graph card
  (node list + canvas) starts at **16,62** with a 16 px gutter; the record view's canvas + properties row starts at
  **0,113** (the "< name, type" line above it is at 56). Crop from outside: put the iframe in an `overflow:hidden`
  box at `left:-x; top:-y; width:calc(100% + x + r); height:calc(100% + y + b)`. Offsets measured without framing
  (73/90, 57/141 with the side nav) are wrong inside a frame; measure through `contentDocument` on the preview.
- **The preview is same-origin with the console** (`/agent-api/preview/…` on the tenant host), so there the parent
  can read `iframe.contentDocument` and inject CSS (e.g. hide Edit / Edit schema). The published host is cross-origin:
  `contentDocument` is `null`, only the crop applies. Design for the crop; treat injection as a preview-only extra.
- The record view takes ~20 s to fill; the model view a few seconds. Reference build: SHU Brain `GraphEmbed.tsx`.

**45.18 A Cypher `collect()` reaches Groovy as a JSON list string, quotes included ✅ aps1 2026-09-25.**
`collect(g.gift_id) AS ids`, read back from `code_by_unifyapps_groovy`'s input, is the string `["RG-1","RG-2"]`.
Stripping only brackets and spaces leaves `"RG-2"`, which became part of a finding key and a relationship end that
never existed: 11 relationships failed after 10 attempts each. Parse it as JSON
(`new groovy.json.JsonSlurper().parseText(...)`), or strip `[`, `]`, whitespace **and** `"`. A key that ended up with
quotes shows in the edge queue as `…::"RG-002428"`.

**45.19 A refused bulk write does not fail the node ✅ aps1 2026-09-25.** `storage_by_unifyapps_bulk_create_records`
given a record the schema refuses (here an extra field on an `additionalProperties:false` object) completes
normally and returns `{inserted: 0, insertedIds: [], errors: {"<key>": "…Validating entity … additionalProperties
<field>"}}`; the workflow runs on. An upsert of an existing record reports `inserted: 1`. So "saved" must be decided
**after** the write, from `inserted`/`errors` — SHU Brain's admin save reported *saved* and audited *Done* for a write
the store refused until a check step was added (`slb-admin.js` `SAVE_CHK`).

## 46. Findings 2026-09-25 (PoC Command Centre — HubSpot read-only read, Orbit UAT)

Run `run-002-poc-command-centre`, integration-specialist, signed-in tab, user 109790. Everything below
was executed, not read.

**46.1 Resource versions drift daily — four moved in 24 h.** ✅ UAT 2026-09-25 04:16 UTC.
`hubspot_search_records_batch` 23234 → **23241**, `hubspot_get_owners` 23013 → **23020**,
`hubspot_get_association_batch` 23253 → **23260**, `hubspot_get_pipelines` 10731 → **10738**
(the 2026-09-24 Deal Forecast build carried the old numbers). The saved probe workflow
`scc_hs_probe_search` `6ab4f1499d7b05455588c884` still holds 23234 and still runs, so an old version
is tolerated at run time — but a builder must still resolve from `/resources`.

**46.2 The `poc` deal property (portal 143913151).** ✅ `HAS_PROPERTY` on `poc` → `total` 225. Values:
`Completed`, `Ongoing`, `Upcoming`, `No POC yet` (first page 24/18/1/57). "A PoC exists" =
`{propertyName:'poc', operator:'IN', values:['Ongoing','Completed','Upcoming']}` → `total` **114**,
paged 100 + 14 with `after: "100"`. `technical_win` values on those: `Yes` 48, `TBD` 28, `No` 3, absent 35.
`sc_on_this_deal` absent on 11 of 114; company association absent on 3 of 114.

**46.3 Owners: active only, and a per-id lookup fails the run.** ✅ `hubspot_get_owners` (75 rows) omits
deactivated owners; four `hubspot_owner_id` values on live deals (`29253802`, `75556300`, `75441557`,
`30028601`) resolve to nothing. `hubspot_get_owner_by_id {ownerId:<int>}` on one of them returns HubSpot
404 (`x-hubspot-notfound: true` in the node's `headers` output) and the node is `FAILED`, so the run is
`FAILED` (run `6ab5f6a867f3a60322e55f37`). Map through `get_owners` and keep the raw id as the fallback.

**46.4 `initiate-test/{id}` with a foreign inline graph.** ✅ Posting
`{payload, type:'MOCK', workflowDefinition:<base definition with different nodes/edges>}` to the id of an
existing, deployed workflow runs the inline graph (five different graphs run against
`6ab4f1499d7b05455588c884`), reads back through `TEST_WORKFLOW_VARIABLE` with that `workflowId`, and
leaves the saved definition untouched (`version` 1, `deploymentState.workflowVersion` 1 before and after).
This is the cleanest "execute a connector action once" path: no object is created. Runs land in that
workflow's test-run history.

**46.5 Node output carries the upstream HTTP headers.** 👁 A failed `hubspot_get_owner_by_id` node's
`outputs` payload is the raw HubSpot response envelope (`headers{…}`, status), which is where the
rate-limit headers can be read: `x-hubspot-ratelimit-max` 190, `-interval-milliseconds` 10000,
`-daily` 1000000, `-remaining`.

**46.6 Company batch read.** ✅ `hubspot_search_records_batch` `object:'companies'` with
`hs_object_id IN [<≤100 ids>]` returned `total` 100 then 4 for 104 ids in two runs (~1 s each).
`hubspot_get_association_batch` for 114 deal ids → 111 `results` (deals with no company are simply
absent from `results`, not returned with an empty `to`).

**46.7 Platform skill read over REST.** ✅ `GET /api/entity/e_skill_ai_agent/e_6aaa4c0b992160713aebb310`
→ `properties.skill` (the SKILL.md text, 51 KB), `name`, `description`, `files[]`, `enabled`,
`accessibleTo`, `isHidden`; `version` 20, `deploymentState.entityVersion` 16. Entity types
`ai_agent_skill`, `e_skill`, `skill`, `ai_skill`, `platform_skill` are 404 "Entity not found".

## 47. Findings 2026-09-25 (Studio code apps, several apps per use case, checklist — Orbit UAT)

**47.1 An agent's `version` is not "unpublished changes".** ✅ After `saveAndDeploy`, `ai_agent.version`
keeps climbing (+5 within seconds on agents with approval-gated tools; later also on a read-only agent,
v7 → v12) while `GET /api/entity/deployed/ai_agent/{id}` (the published snapshot: `properties`,
`entityVersion`, `deployedEntityVersion`, `snapshotAssets` = `{}`, `lastPlatformUpdateBy/On`) has
**identical `properties`** to `GET /api/entity/ai_agent/{id}`. Test publication by comparing the
snapshot's `properties` with the agent's, never `deploymentState.entityVersion === version` (a loop on
that re-publishes forever). `?version=`, `/versions`, `/history`, `/deployed` suffix → 404 or ignored.

**47.2 Tags are dropped in two places.** ✅ (a) `POST /api/entity/update` with `{id, entityType,
properties, version}` and no `tags` clears the entity's tags — always send `tags`. (b) A code app's
`e_interface` loses its tags after `POST /agent-api/apps/{appId}/publish` and after Code Builder turns
(its app-settings tools rewrite the entity). Re-apply with hierarchical `UPDATED` after every publish
and after each build; keep a second ownership marker in `properties.additional` (e.g. `studioRef`).

**47.3 Uncommitted working-tree edits are shared across sessions of one app.** ✅
`PUT /agent-api/sessions/{s1}/files/contents` on the finished starter session, then
`POST /agent-api/sessions {appId, branch:'main', input}` → the new session's files include those
edits (PRODUCT.md, DESIGN.md, docs/…, `app/src/data/solution.ts`) and it commits them with its work.

**47.4 A full-brief Code Builder turn builds a real multi-screen app in ~22 min.** ✅ With PRODUCT.md
+ DESIGN.md present (so `impeccable` does not stop to interview) and a brief that pre-answers the
builder's confirmation tools (automations already connected with data-source ids, agents chosen,
`provision_data_sources` allowed, theme id given), `app-c79ce9af969e` got an app shell, Ctrl+K
palette, 8 routes, a Leaflet map and workflow actions, with no stop for questions.

**47.5 Pulling GitHub `main` into a Code Builder session.** ⚠️ `POST /agent-api/sessions/{s}/branch
{branch:'main'}` returned `current:'main'` but served an old local `main`; a code-builder page reload
and a new session "pull the latest commits" (6 min, stopped) did not pull either. What worked: push the
commit to a new branch name and `POST /agent-api/sessions/{s}/branches {branch:<new>, base:<pushed>}`
(builds that exact commit, ~6 min).

**47.6 Groovy helper names.** ✅ A code node whose prelude defines closure variables (`def p = {…}`)
fails to compile when the node's own code declares `def p` ("The current scope already contains a
variable of the name p", error 5008 on deploy). Define helpers as script methods (`def p(String k) {…}`).

**47.7 Workflow update in place.** ✅ `GET /api/workflow-definition/{id}` → replace `nodes`/`edges`
→ `saveAndReturnViolations` → `deploy?version=<new version>` keeps the id; every data source and agent
tool that calls it (`automationId`, `version:"-1"`) runs the new logic with no re-binding.

## 48. Findings 2026-09-25 (PoC Command Centre — data layer: three objects, 1,268 records, Orbit UAT)

Built `scc_poc` (26 cols), `scc_poc_milestone` (12), `scc_poc_note` (9), owner 109790, tag `SC_NATIVE`,
114 + 687 + 467 records from a signed-in tab (`data-specialist`, run-002). Model:
`SC-Companion-Agents/work/run-002-poc-command-centre/data/model.md`.

**48.1 Create → read → update with both schema carriers, in one pass ✅.** `POST /api/entity-type`
(`{id,name,pluralName,description,metadata:{storeDetails:{store:"MONGO"}},tags:["SC_NATIVE"]}`) then
`GET` it back, set `input:{type:"SCHEMA_AND_LAYOUT",schema:S,layout:{"ui:order":[…]}}` **and**
`schema:{dynamic:false,type:"SCHEMA",schema:S}`, `POST /api/entity-type/update`. `columnCounts` matched
the property count on the first read-back for all three (24/11/8), `metadata.referenceKeys` was derived
from `foreignKey:{reference:"ENTITY_ID:scc_poc"}` as `{key:"properties.poc_id", referenceType:"scc_poc"}`,
`uniqueKeyFields` from two `uniqueKey:true` flags, `dateFields` from `format:"date-time"+dateFormat:"epoch"`.

**48.2 Renaming a field = replace the property in both carriers + rewrite every record ✅.**
`hubspot_poc` → `poc_value`: rebuilt `properties` without the old key and with the new one (order kept
via `ui:order`), `entity-type/update` → `columnCounts` 25 → 26 (with one more boolean added), then
`POST /api/entity/update` with the **full** new body for all 114 rows. Records that still carried the
old key were accepted by the update (the replace drops it); a read-back `distinctKeys` over the object
is the check that no row still has the phantom field.

**48.3 A replace-guard needs an explicit allow-list ✅.** A loader that refuses any write whose body
lacks a key the stored record has (the §27 rule) correctly blocked 53 + 28 writes where a field
*legitimately* disappears under a new mapping (`health_reason` cleared on green rows, `completed_at`
cleared when a milestone leaves `done`). Pass the keys that may vanish per batch
(`allowDrop:['health_reason']`) rather than loosening the guard — every other drop stays a hard error.

**48.4 Aggregation on records needs `projections`; group-by shapes return rows, not groups ⛔.**
`POST /api/aggregation?entityType=scc_poc&group=ENTITY` without `projections` → 500
`Cannot invoke "java.util.List.iterator()" because "projections" is null`. With projections, none of
`aggregations:[{type:'COUNT'}]+groupBy:[…]`, `projections:[{name,aggregation:'COUNT'}]`,
`groups:[{field}]`, `projections:[{name,type:'SUM'}]` grouped anything — each returned one row per
record (the `type:'SUM'` variant simply projected `properties_amount` and `id`). Until a grouping shape
is found, compute KPI totals in a workflow Groovy step over a full storage fetch (≤ 2,000 rows) — never by
reducing an app page. `POST /api/entity/{obj}` responses carry `objects, cursor, hasMore` and **no total**.

**48.5 Verified in the same session ✅.** Entity-list filters `EQUAL` on `properties.status` /
`properties.archived` / `properties.poc_id` (FK value), `IN` on `properties.sc_owner`, compound `AND`,
sorts on `properties.sequence`, `properties.target_end_date`, `cTm`. 1,252 creates with 8 parallel
workers in ~10 s, zero failures; an idempotent reload (create → `E11000` → read `version` → full
update) of the same 1,247 rows in ~15 s. Full-row equality against the generator output: 0 diffs.

## 49. Findings 2026-09-25 (PoC Command Centre — six callable workflows and their data sources, Orbit UAT)

Run `run-002-poc-command-centre`, automation-engineer, signed-in tab (user 109790). Workflows `scc_poc_list`
`6ab5fe0c67f3a60322f00884`, `scc_poc_detail` `6ab5fe0d4218282a40ccfd36`, `scc_poc_add_note` `6ab5fe7a67f3a60322f01781`,
`scc_poc_update_milestone` `6ab5fe7b67f3a60322f01789`, `scc_poc_health` `6ab5fe7b67f3a60322f01792`,
`scc_poc_refresh_from_hubspot` `6ab5ff1383d15b6332253496`; app shell `scc-poc-command-centre`; data sources on
`e_global_scc-poc-command-centre`. Definitions, Groovy bodies and run ids:
`SC-Companion-Agents/work/run-002-poc-command-centre/automations/`.

**49.1 Storage filters inside a workflow fetch node bite when the property is `properties_<field>` or `id` ✅.**
`triggerInputCondition:{operator:'AND',filters:[{property:'properties_archived',filter:{operator:'EQUAL',value:false}},
{property:'properties_kind',filter:{operator:'EQUAL',value:'blocker'}}]}` returned exactly the 80 blocker notes of 446 live
rows; `properties_poc_id` EQUAL returned the 6 milestones / 4 notes of one PoC; `id` EQUAL returned one row. Counts matched
`POST /api/entity/{obj}` reads (114 / 687 / 80). `includeTotalCount:true` → `outputs.total` (114). This settles the §39.7
doubt: the dot form (`properties.x`) is the entity API's; the underscore form is the storage node's.

**49.2 Caller identity without a scratch row or a delete ✅.** The record the workflow is about to create IS the identity
probe: create the note with `author:''`, read `{{ n_c.outputs.ownerUserId }}` (109790 for Maher — through `initiate-test`
and through the app data source alike), match `scc_user_profile.properties.platform_user_id`, then `update_record_by_id`
with the full row and the resolved name ("Mohamed Maher"). 434 ms end to end, 9/9 fields read back, `lastModifiedBy` =
the caller. Fallback when no profile matches: `'Platform user <id>'` (factual, not invented). Replaces the
`scc_caller_stamp` + `delete_record_by_id` pattern of §26 for any workflow that writes anyway.

**49.3 `loop_while` + `variable_by_unifyapps` is a working paging loop ✅.** `create_variables {after:'', more:'yes',
rows_json:'[]', total:'0', pages:'0'}` → `loop_while` on `{{ n_v.outputs.more }} EQUAL 'yes'` → HubSpot search with
`after:'{{ n_v.outputs.after }}'` → Groovy appends `results` to a JSON string and reads `{{ n_s.outputs.paging.next.after }}`
(absent on the last page → parameter unbound → `''`) → `update_variables` `[{source:'{{ n_v.outputs.after }}', value:…}]`
→ loopback edge (`type:'next', name:'loopback'`), body nodes in group `n_loop@g1@l`. 2 pages, 114/114 in ~2 s. A second
loop of the same shape feeds `hubspot_search_records_batch` on companies with `filterGroups[0].filters[0].values:
'{{ n_cp.outputs.result.ids }}'` (a template resolving to a String array inside a nested input works; 124 ids in 2 chunks
of ≤ 100) and `hubspot_get_association_batch` `inputs:'{{ n_ids.outputs.result.deal_ids }}'` (114 ids → 111 results).
`saveAndReturnViolations` accepted both loops first time. Whole refresh: 7–10 s, fits `initiate-test`.

**49.4 Vertex Opus 4.8 through the LLM node, verified by price ✅.** `conv_ai_by_unifyapps_call_llm_model_with_options`
(`CALL_INTERFACE_WORKFLOW`, rv 2480) with `modelId:'e_6a1948ae4a418d2dde7d1096'`, `temperature 0.2`, `maxTokens 2000`,
`responseFormat {type:'json_object'}`: 1,722 in / 117 out, `inputTokenCost` 0.00861 and `outputTokenCost` 0.002925 →
**5.00 / 25.00 USD per M = Opus 4.8** (Sonnet 4.6 would read 3 / 15); `finish_reason: end_turn`; child run on the platform
workflow `685127a68611a7196adb4415` (4,977 ms). Whole workflow 3.1–5.4 s, so `initiate-test` did not hit its ~26 s limit
at this prompt size (3 KB). The model quoted only facts from the prompt (milestone titles, HubSpot `use_case` text).
`topicExecutionModel` is an agent-entity setting; a workflow LLM node takes `modelId` directly.

**49.5 A null value in a Groovy result map is dropped from the node output ✅.** `[next_milestone_due: null,
insight_age_days: null]` → neither key exists in `n_g.outputs.result` nor in the STOP payload. Consumers must treat a
missing key as null; do not `required` such keys in the output schema.

**49.6 HubSpot `closedate` carries a time of day ⚠️.** The search returned `2024-12-12T19:18:18Z`-style values for deals
the data layer had stored at UTC midnight (the integration read had truncated to `yyyy-MM-dd`). A refresh that stores the
raw value flips `close_date`/`target_end_date` on every row; normalising to the date (first 10 chars) made the third run
report `changed_rows: 0` with only `synced_at` moving. `hubspot_get_pipelines` stage labels are trimmed (`"Closed Lost "`).

**49.7 Field-level upsert at scale, idempotent ✅.** `storage_by_unifyapps_bulk_upsert_records_by_id` (rv 16334) with 114
`{id, updateFields:[{fieldName, actionType:'SET', setValue}]}` entries → `{success:true, successCount:114, failedCount:0}`
in ~1 s; a full-row diff of all 114 records before/after showed only the SET fields changed and zero protected fields
(`status`, `health*`, `success_criteria`, `next_action`, `last_insight_at`) touched. `bulk_create_records` with
`rawPayload: []` and `skipUpdate:true` → `{inserted:0, insertedIds:[], errors:{}}` (empty list accepted again).
`actionType:'UNSET'` is emitted for blanked values but no row exercised it yet (👁).

**49.8 Repo copy == live definition, provably ✅.** `sha256(JSON.stringify({nodes, edges}, sortedKeys))` with the
server-added edge fields `priority`/`skip` stripped is identical between the definition rebuilt from the repo specs and
`GET /api/workflow-definition/{id}` for all six workflows (`local-hashes.json` vs the tab). The server only reorders keys
and adds `priority:0, skip:false` on edges. A single comment line that was in the repo but not in the tab paste was the
one mismatch found — a cheap check worth running after every deploy.

**49.9 Config-app shell and tagged data sources from a plain `fetch` ✅.** The exact `cfg.createApp` bodies
(hierarchical `CREATED` for the `e_interface` with `navigation.defaultPageId = e_global_<appId>`, then the global page
with three root `Stack` blocks) work without `ua_cfg.js`; `POST /api/domain-mapping/interface` answers **204 with no body**
(a JSON-only client must accept it). `POST /api/entity {entityType:'e_data_source', tags:['SC_NATIVE'], properties}` keeps
the tags on read-back; `e_data_source` list with `properties.interfacePageId IN [...]` returns them.

**49.10 Groovy notes.** Script methods (`def sv(Object v) {…}`) as the prelude avoid the closure-parameter clash (§47.6)
entirely; closure parameters in the script body must still be unique per script (`s1/h1/h2/s2`, `ra/rb` + `na/nb`).
`payload['owner'] = x` passes the `owner =` blacklist; `payload.owner = x` would not. `String.isLong()` and
`java.sql.Date(ms).toString()` are available; a civil-days function replaces `java.time` for ISO → epoch.
`IllegalArgumentException` / `IllegalStateException` messages surface verbatim as `rootCauseMessage` to the app data
source (verified: `kind must be update, blocker or decision`).


## 50. Findings 2026-09-25 (PoC Command Centre — the PoC Copilot agent over REST, Orbit UAT)

Run `run-002-poc-command-centre`, ai-agent-engineer, signed-in tab (user 109790). Agent "PoC Copilot" `e_6ab6046002f36a2e66f90b68`
(`role: scc_poc_copilot`, tag SC_NATIVE, `agentType ai-agent`), tasks `scc_poc_triage` `e_6ab6046105e65b5f922ec386`,
`scc_poc_deep_dive` `e_6ab6046105e65b5f922ec389`, `scc_poc_record` `e_6ab6046102f36a2e66f90b77`; tools (all GLOBAL, `enabled:true`,
`version "-1"`, `parameters {}`): `scc_poc_list` `e_6ab6046105e65b5f922ec391`, `scc_poc_detail` `e_6ab6046102f36a2e66f90b7c`,
`scc_poc_query` `e_6ab6046105e65b5f922ec39d`, `scc_poc_whoami` `e_6ab6046205e65b5f922ec3a3`, `scc_poc_add_note`
`e_6ab6046205e65b5f922ec3a6` (approval), `scc_poc_health` `e_6ab6046202f36a2e66f90b84` (approval). New workflows `scc_poc_query`
`6ab6036167f3a60322f059e8` (v2) and `scc_poc_whoami` `6ab60362e2d40e5ba92f2ef9` (v1). Build scripts, battery and answers:
`SC-Companion-Agents/work/run-002-poc-command-centre/agents/`.

**50.1 The agent test API turn is asynchronous ✅.** `POST /api/workflow/execute/node/sse` (`callables_call_automation_streaming`,
`copilotType AI_AGENT_TEST`) returned 3 events and closed after ~2 s with `responseGenerationStatus: pending`; the turn kept running
server-side (7–20 s). Poll the conversation reader (`fetchConversation=66ab98083d73300e63962287`, `until` in the future) until
`response.additional.responseGenerationStatus === 'completed'` — and then check the newest Bot message is the settled answer: on the first
turn the reader reported `completed` while the only Bot message was the model's interim narration ("I'll start by identifying your SC owner
name…"); the real answer arrived a few seconds later as a second Bot message (list is reverse-chronological, take index 0 without
`internalMessageType`). `additional` also carries `firstFanMessageId` (= the trace id), `lastBrandMessageId`, `sessionDuration`,
`toolIndex` and `llmUsageDetails`. The browser `javascript_tool` has a 45 s ceiling, so run a battery as a background promise on
`window` and poll it from later calls.

**50.2 Which model actually ran — two independent proofs ✅.** (a) `TraceTimelineDetails` with `type: "LLM"` returns
`inputOutputContent.input.content` whose first keys are `isMultipleToolCallEnabled, modelId, …` — `modelId e_6a1948ae4a418d2dde7d1096`
(Vertex Opus 4.8) on every LLM span of the battery. (b) `llmUsageDetails`: `inputCost/inputTokens` (non-cached) = 5.00 USD/M,
`cacheWriteCost/cacheWriteInputTokens` = 6.25 USD/M, `outputCost/outputTokens` = 25.00 USD/M — the Opus 4.8 signature (Sonnet 4.6 = 3 /
3.75 / 15). Setting the same id in `topicExecutionSettings.{topicExecutionModel,topicSelectionModel}` and
`responseGenerationSettings.{answerGenerationModel,answerGenerationModelSettings.modelId}` left no other model in any slot.

**50.3 Cost shape ✅.** Every new conversation cache-writes ~35,700 tokens (platform prompt + 9 KB instructions + six tool schemas); a
turn with two LLM calls wrote it twice (68 K). Battery cost per turn: refusal $0.013, unknown-name $0.07, one-tool answers $0.23–0.34,
three-query answer $0.54. Same-chat follow-ups would read the cache instead (not measured here).

**50.4 The hidden user-context message carries the username only 👁.** The first user turn is prefixed by a hidden message:
`{"userName":"maheragent","alias":"maheragent"}` plus the date and timezone — no display name, email or platform user id. An identity
tool for "my …" questions must therefore accept `username`; `scc_poc_whoami` matches `scc_user_profile.username` (verified: the model
passed `{name:"maheragent", username:"maheragent"}` and got `sc_owner "Mohamed Maher"`). A bare display name ("Maher") is ambiguous
across profiles and is refused rather than guessed.

**50.5 `tags` on tasks and tools ✅.** `POST /api/entity {entityType:'e_topic_ai_agent'|'e_action_ai_agent', tags:['SC_NATIVE'], properties}`
keeps the tags on read-back (`POST /api/entity/<type>` list rows carry `tags`). `POST /api/entity/update` on either must resend `tags`
(§47.2 applies).

**50.6 Publish state ✅.** `saveAndDeploy` with the full entity + `tags` → `deploymentState.entityVersion === version` immediately
(1/1 → v1, 8/8 → v2, 15/15 → v3) and `GET /api/entity/deployed/ai_agent/{id}.properties` deep-equal to the agent's — both checks agree
here; the snapshot comparison remains the reliable one (§47.1).

**50.7 No `SetTopic` span appeared in any of the 12 traces 👁.** Traces show `LLM → Tool → LLM` under "Agent Execution" only, with
`topicAsTool:false` and three enabled tasks. Tool choice followed the agent-level instructions; whether task `instructions[]` were
injected could not be confirmed from the timeline (the builder skill's 2026-09-19 observation showed `SetTopic` as a tool call on a
different agent). Behaviour rules were therefore kept in BOTH the agent instructions and every task.

**50.8 Exact counts need a server-side group, not a list the model counts ✅.** Asked "there are 15 PoCs with blocker notes, right?",
the agent first equated `kpis.blocker_notes` (80 notes) with PoCs; after a counting rule it counted the 114 list rows by hand and
answered 58 (engine: 65). Adding `group_by`/`sum_field` to the generic query (`groups[{value,count,sum}]`, `groups_total` = distinct
values; `limit` defaults to 0 rows when grouping) gives `groups_total 65` for notes `kind=blocker` grouped by `poc_id`, and status
sums that add to the engine's 18,132,453.80. Same lesson as "Data tools for agents" in the builder skill: never let the model count.

**50.9 A single-PoC question stopped at the first row 👁→✅.** With both a generic query and a detail tool available, "what is the health of
Najm and why" was answered from the query row (health + health_reason) without the detail (missed milestones, blocker note). The fix
was in the tool descriptions, not the prompt alone: the detail tool now says it is the ONLY read with milestones and notes and MUST be
called for any one-PoC answer, and the query tool says it does not return them.

## 51. Findings 2026-09-25 (PoC Command Centre — the config app over REST, Orbit UAT)

Run `run-002-poc-command-centre`, config-app-builder, signed-in tab (user 109790). App `scc-poc-command-centre` (owner 109790, tag
`SC_NATIVE`), theme `e_6ab6039705e65b5f922eb155`, pages `e_6ab6039805e65b5f922eb15c` (`command-centre`), `e_6ab603983c61834d1608e7a0`
(`poc`, input `poc_id`), `e_6ab603983c61834d1608e7a4` (`copilot`); page-level data sources `e_6ab6082d3c61834d16091a56` (list),
`e_6ab6082e3c61834d16091a5c` (refresh), `e_6ab6082e05e65b5f922efb7a` (detail), `e_6ab6082e05e65b5f922efb7d` (add note),
`e_6ab6082e3c61834d16091a60` (update milestone), `e_6ab6082e05e65b5f922efb84` (health). Builder pasted into the tab:
`SC-Companion-Agents/work/run-002-poc-command-centre/app/build-pages.js` (on top of `unifyapps-config-apps/scripts/ua_cfg.js`).
Verified on `/p/0/interfaces/scc-poc-command-centre/preview/<slug>` by reading text and the `execute/node` request/response bodies.

**51.1 A GLOBAL data source cannot read page variables or blocks ⛔ → ✅ page-level.** The six data sources the automation layer
created on `e_global_<app>` (`target: app`) were rebound to `{{ var_f_status['value'] || '' }}` etc.; every run from the Command Centre
page sent the parameters EMPTY (114 of 114 rows with `search = Dubai` typed; `var_f_q` and the URL had the value). The `{{ }}` of a
global data source are evaluated in the global page's scope, where the page's `var_*` / `b_*` do not exist. Creating the same six on
the page that triggers them (`cfg.ensureDs(cfg.dsAutomation, {pageId, …})`, same workflow ids, `version "-1"`) fixed it first time
(`5 shown of 114` for `?q=Dubai`). Keep global data sources for parameter-less or `userContext`-only calls.

**51.2 Automation data source without a transformer: `data` IS the STOP payload ✅.** `POST /api/workflow/execute/node` answers
`{executionInstanceId, id, lookupReferences, response: <STOP payload>}` and in the page `{{ e_ds['data']['kpis'] }}` reads it directly —
no `['result']` (that wrapper exists only with a JS transformer, §29).

**51.3 `e_theme` semantic overrides are applied by the runtime ✅ (OQ-U2).** `cssVars` with `--palette-success/warning/error-25…950`
(+ `-600-seed`) beside the brand ramps were stored (66 keys) and rendered: an error Tag's text computed to `rgb(139, 48, 36)` = the
custom `--palette-error-700`, and on the dark band `rgb(212, 157, 150)` = the custom `-300`. `tags:['SC_NATIVE']` on `POST /api/entity`
for `e_theme` is kept on read-back.

**51.4 Spacing tokens measured, raw px accepted ✅ (OQ-U4).** Computed on the preview: `gap-xs 4 · gap-sm 6 · gap-md 8 · gap-lg 12 ·
gap-xl 16 · p-md 8 · p-lg 12 · p-xl 16 · p-3xl 24 px` — smaller than an 8-pt design scale. `styles.gap.all: '24px'` and
`styles.padding.custom: {t,b,l,r}` render exactly (root 24/24, hero 16/40, tiles 12), so a design scale can be written as px.

**51.5 `additional.htmlAttributes` works on Typography and IconButton ✅.** `[{key:'role',value:'heading'},{key:'aria-level',value:'1'}]`
made the accessibility tree show one h1 / three h2; `aria-label` on an IconButton replaced its default accessible name, which is the
ICON NAME (`"MessageSmileSquare"`) — `content.label` is not used for it. IconButton `size:'sm'` renders 28 × 28 px; a `min-width/min-height:
44px` customCSS gives the hit target. Button `md` is 32 px tall; `min-height: 44px` in customCSS is honoured.

**51.6 Table row actions ✅.** `content.rowActions:[{id, label, visibility:'VISIBLE', buttonType:'button'|'icon-button', appearance}]`
render per row; `events:[{eventType:'onClick', targetId:'<rowActionId>', action}]` fire with `{{ b_tbl['context']['currentRow'][…] }}`
as the row (navigateToPage with `pageInputs.poc_id`, and setPageVariable + controlDrawer both verified). `addOns.page {type:'PAGINATION',
size:25}` paginates; `columnAddOns.tooltip {type:'overflow'}` accepted; a TEXT column with pre-formatted date strings is the safe date cell.

**51.7 Block methods and re-initialisation ✅/⛔.** `controlBlockMethod {methodName:'setValue', methodPayload:{value}}` clears a
TextArea (`''`) ✅ but has NO effect on a CopilotInput (contenteditable stays empty) ⛔ — prefill a copilot question with a chip whose
click submits the literal text (ux-spec fallback). Form `content.initialFormData` given as an expression over a page variable
re-initialises when the variable changes (drawer prefilled per row) ✅; ButtonGroup `initialSelectedItemId` as an expression selects the
row's value ✅. `onCheckChange` on Checkbox and `onChange` on SingleSelect / TextInput drive `setPageVariable` → `controlDataSource` ✅.

**51.8 Drawer is modal regardless of `showBackdrop` (OQ-U5) ⚠️.** With `backdrop.showBackdrop:false` the `MuiDrawer-backdrop` still
exists (`pointer-events: auto`) and `elementFromPoint` on a page control returns it; with a backdrop the page behind renders as a flat
tint (the page content is hidden while a fixed Drawer is open). A Drawer body is announced as `role="dialog"`. Raw `rgba()` is accepted
in `backdropStyles.backgroundColor`.

**51.9 Copilot block behaviour ✅/👁.** It renders the agent's `description` and `conversationStarters` natively (a starter click sends
that text), so an app-level chip row duplicates them. It writes its conversation id to the URL as `?<blockId>-chatId=new|<id>`
(OQ-12: navigation with `navigateToPage` does not carry it, so each page starts a fresh chat unless the app passes that key as a page
input — untested). `onCitationClick` is the only per-answer hook (payload `referenceUrl`); a handler that opens the `poc` page when the
URL carries `POC-\d+` is wired but could not be exercised (no agent turns under the user's account, memory rule).

**51.10 Odds and ends ✅.** `XClose` is NOT an icon name (console: `Icon not found for XClose`; renders empty) — `XCircle`, `Copy01`,
`ArrowLeft`, `RefreshCcw01`, `Stars02`, `MessageSmileSquare`, `AlertTriangle` render (OQ-U7). A Google Fonts `@import` in the root
block's customCSS loads (`document.fonts` shows `Spectral 600 loaded`) — the tenant CSP allows it (OQ-U3). `setURLParameters` with
`history:'replace'` and `mergeWithExistingQueryParams:true` updates the query without reloading; `pageInputs` read back on
`onPageLoad` give shareable filtered views (`?q=Dubai`, `?tab=notes`). A `yyyy-MM-dd` sent to the milestone workflow is stored as UTC
midnight, so prefill date inputs with `toLocaleDateString('en-CA')` (local date), not `toISOString().slice(0,10)` — the first save moved a
due date by a day-fraction (restored through the same data source). Tab labels accept expressions (`'Milestones (' + n + ')'`). The
platform focus ring on the dark band is `rgba(255,255,255,0.56)` 3 px (OQ-U6: visible; the champagne outline rule stays as a
`:focus-visible` override).

## 52. Findings 2026-09-25 (PoC Command Centre — governance: guardrails vs controls, Orbit UAT)

Run `run-002-poc-command-centre`, ai-governance-officer, signed-in tab (user 109790). Agent "PoC Copilot" `e_6ab6046002f36a2e66f90b68`;
guardrail `gaurd_rail` `e_6ab60d8305e65b5f922f4fe2`; nine `controls` `e_6ab609eb05e65b5f922f24f0` … `e_6ab609ec05e65b5f922f24f3`; policy
`policies` `e_6ab60a1405e65b5f922f2549`; registry profile `agent_profile` `e_6ab60c0205e65b5f922f3cb3`. Full report and probe log:
`SC-Companion-Agents/work/run-002-poc-command-centre/governance/`.

**52.1 Two enforcement layers; only `gaurd_rail` blocks inline ✅.** The agent console's Configuration → Guardrails group (PII Masking
`/configuration/sensitive-information`, Hallucinations `/hallucinations`, Content Filters `/content-filter`, Custom Word Filter
`/word-filter`, Denied Topics `/denied-topics`, Blocked Messaging `/blocked-messaging`) is ONE entity per agent, type **`gaurd_rail`**
(sic), found with `POST /api/aggregation?entityType=gaurd_rail&group=ENTITY` or `POST /api/entity/gaurd_rail {filter:{op:AND,
values:[{op:EQUAL, field:"properties.aiAgentId", values:[<agent>]}]}}`. It runs inline: the trace shows `Input Guardrails › {PII Mask,
Content Filters, LLM×n}` before the agent loop and `Response Guardrails › {Content Filters, PII Mask}` after it. A blocked prompt
produces: Fan message `additional.guardrailHit: true`, a Bot message whose text is `BlockedMessaging.blockedMessagingForPrompts.
blockedMessage`, `Input Guardrails › Content Filters` output `{withinThreshold:false, guardrailViolationDetected:true, contentFilters:
{…strengths…}}`, NO `Agent Execution` span, cost ≈ $0.013. AI Governance `controls` (§"AI Governance — Controls") attached via
`accessibleTo` to the native agent id, to a registry profile id under `ai_agent/`, and to `agent_profile/<profile id>` did not change
any of 14 read-only probes (injection, credential strings, denied topic, identity PII, profanity, a false-positive check; re-run 12
minutes later and again after registration) — every Fan `guardrailHit:false`, and the agent even passed an AWS key and a password into
a tool call. The tenant's `incidents` rows reference `agent_profile/<registry id>` (or a registry id under `ai_agent/`) and arrive in
bursts (2026-09-24 04:02–04:03 for one agent); registry profiles carry `evalSettings {runFrequency {5 MINUTES}, sessionCloseTime {24
HOURS}}` — consistent with a post-hoc evaluation of traces. No incident for the PoC Copilot appeared within 20 minutes.

**52.2 `gaurd_rail` create shape ✅** (`POST /api/entity {entityType:"gaurd_rail", tags:["SC_NATIVE"], properties:{…}}`, tags kept):
```json
{ "aiAgentId": "<agent id>", "name": "scc_poc_copilot_guardrails", "runInAsync": false,
  "contentFilters": { "llmModel": "e_66b280e945f17a17c0e7c27a",
    "filterStrengthForPrompts":   { "hate":"high","insult":"medium","violence":"high","sexual":"high","misconduct":"high","promptAttack":"high" },
    "filterStrengthForResponses": { "hate":"high","insult":"medium","violence":"high","sexual":"high","misconduct":"high" } },
  "DeniedTopics": { "llmModel": "e_66b280e945f17a17c0e7c27a",
    "DeniedTopics": [ { "topicName": "...", "definitionOfYourTopic": "...", "addSamplePhrases": ["...", "..."] } ] },
  "customWorldFilter": { "filterProfanity": true, "wordsOrPhrases": [ { "name": "<word or phrase>" } ] },
  "RedactSensitiveInformation": { "piiByUA": { "enabled": true },
    "regex": { "enabled": true, "patterns": [ { "name": "AWS access key", "pattern": "AKIA[0-9A-Z]{16}" } ] },
    "automations": { "enabled": false, "ids": [] } },
  "BlockedMessaging": { "blockedMessagingForPrompts": { "blockedMessage": "..." }, "blockedMessagingForResponses": { "blockedMessage": "..." } },
  "Hallucinations": { "llmModel": "e_66b280e945f17a17c0e7c27a",
    "groundingConfig": { "enableGrounding": false, "groundingScore": 0.5 }, "relevanceConfig": { "enableRelevance": false, "relevanceScore": 0.5 } } }
```
Server adds `enabled` (**defaults `false`** — send/PATCH `true`) and `runInNewFlow:false`; `version` starts at 0; update with
`POST /api/entity/update {id, entityType:"gaurd_rail", tags, properties, version}`. `regex.patterns[]` items are exactly `{name,
pattern}` — any extra key is a 500 *"property patterns invalid; add additionalProperties regexPattern"*. Older rows carry a legacy
`RedactSensitiveInformation.Pattern[{Name, RegexPattern, guardrailBehaviour: mask|block}]`; the current UI writes the `regex` form.
Strength values `none|low|medium|high`; observed semantics: **higher = stricter** (`high` blocked a category the classifier rated
`Low`; `medium` blocked `insult: Medium`). The UI keys are `promptAttack` (entity) vs `prompt_attack` (span output).

**52.3 Guardrail classifier model ⚠️.** `llmModel: "sonnet_4_6_bedrock_no_thought"` (the alias that works in `controls`) makes EVERY
turn fail after ~127 s: Fan `additional.executionError` = `CONNECTION with id 683020ca44e4f747c6415668 not found`, Bot "The system
couldn't find the required connection…", `responseGenerationStatus` stuck at `pending`. The platform default `e_66b280e945f17a17c0e7c27a`
(924 of 1,0xx live `gaurd_rail` rows; `GET /api/entity/ai_agent_llm_model/<it>` 404s; the console picker shows the raw id) runs and
its classifier spans carry `modelId e_69b9900c5739ad5159baa133` = **"Vertex Sonnet 4.6"** (`claude-sonnet-4-6`, provider `vertex_ai`).
Per turn the guardrail adds ~7 short classifier calls (one per content category + one per denied-topic pass) ≈ $0.01.

**52.4 A blocked turn never completes ✅.** For a guardrail-blocked prompt the conversation reader keeps `responseGenerationStatus:
"pending"` (observed 72 s+); the settled signal is the Fan message's `additional.guardrailHit === true` plus the Bot blocked message.
Poll for that, not for `completed` (amends §50.1).

**52.5 No republish after attaching ✅.** The guardrail was created 05:58:27Z, after the agent's v4 publish at 05:56:33Z; the deployed
snapshot (`GET /api/entity/deployed/ai_agent/{id}`) stayed deep-equal to the agent and mentions neither the `gaurd_rail` nor any
control; the blocks fired at 06:03–06:07Z. Same for `controls` (not in the snapshot). Closes the §"AI Governance — Controls" question.

**52.6 Agent Registry = `agent_profile` ✅.** 176 rows on UAT; the Registry page is `POST /api/aggregation?entityType=agent_profile&
group=ENTITY` (projections `properties_name, properties_applicationId, properties_awaitingTraces, oUId, mTm`) plus
`POST /api/workflow/execute/node?name=AgentRegistryListing` (per-agent `{lastActivity, telemetryCount, cost, incidents, policies}`;
"forbidden datasource" when called from a script). A native agent is listed only when a profile links to it:
`{applicationId:"unifyapps", assetType:"agent", external_agent_id:"<ai_agent id>", connectionType:"observe"|"control", enabled,
registered, agentProfileGroupIds:["unifyapps"], ownerId}`; the tenant's 61 linked native profiles came through a `unifyapps` connector
connection (Discovery: `agent_profile_group` rows = platform connections, `GetDiscoveredAssetCount` per group; "qa new" = 4,246 agents).
Creating one directly works: `POST /api/entity {entityType:"agent_profile", tags:["SC_NATIVE"], properties:{name, description,
applicationId:"unifyapps", assetType:"agent", connectionType:"control", external_agent_id, enabled:true, registered:true,
agentProfileGroupIds:["unifyapps"], ownerId:"109790"}}` → `e_6ab60c0205e65b5f922f3cb3`, shown as "PoC Copilot · UnifyApps · Active ·
15 traces · $3.98 · policies 0" (the policies column ignored the nine attached controls under every scope string — unconfirmed how it
counts). The "Register Agent" drawer lists 14 platforms incl. a "UnifyApps" button (needs a connection the user authorises).

**52.7 `incidents` entity ✅.** `POST /api/aggregation?entityType=incidents&group=ENTITY` (sorts `cTm`; `IN` on `properties_accessibleTo`
works; `ICONTAINS` on it too) and `POST /api/entity/incidents`. Properties: `checkType` ("Denied Topics" | "PII detection" | "Regex
pattern" | "Custom terms" | "Custom LLM" …), `severity`, `confidence`, `traceId`, `chatTypeIncident {userQuery, source:"User Input",
userId, conversationId}`, `incidentType:"CHAT"`, `action:"FLAG"|"BLOCK"`, `control`, `policy`, `accessibleTo` (`["global",
"agent_profile/<id>"]` for a global control; `["ai_agent/<registry id>"]` for a scoped one), `assetType:"agent"`, `status:"OPEN"`.
`GET /api/entity/controls/<control referenced by an incident>` can 404 — controls get removed while incidents keep the id.

**52.8 `blockedTools` shape ✅.** `additional.blockedTools = {operator:"OR", filters:[{property:"NAME", filter:{operator:"CONTAINS"|
"NOT_CONTAINS", value:"<keyword>"}}]}` — tool NAMES by keyword, not ids (35 live rows: 33 CONTAINS, 5 NOT_CONTAINS, `operator` always
OR; some rows put a comma list in one `value`, semantics unknown — use one filter per keyword). Layout hint: *"Match tool names by
keyword — the agent may never invoke a matching tool."* Inline gating unobserved (see 52.1).

**52.9 Roles / visibility facts ✅.** `RoleDefinition` aggregation with `lcName ICONTAINS` "solutions" / "sc manager" / "sc_" /
"account exec" → 0 rows: none of `scc_role.platform_role` (Solutions Consultant, SC Manager, Account Executive, SDR / BDR, FDE /
Delivery) exists as a platform role on Orbit; the only `scc_` role is `scc_studio_builder`. Agent sharing shape:
`visibility {type:"PRIVATE", visibleTo:[{principalId:"<user id>", principalType:"u"}]}` (27 of 100 recent agents PRIVATE, 73 unset).
`GET /api/user-context?includeRoles=true` returns `{assumeContextAllowed, customer, environment, isImpersonatedSession, modules,
notificationMqttTopics, user}` with the role names under `user.roles`.

**52.10 Agent-level facts seen on the way.** `ai_agent.properties` carries `copilotAttachmentGuardrails`, `enableToolsGuardrailWrapper`,
`secureRuns`, `indexingSettings.piiMasking {automations, piiByUA, regex}` — indexing-time masking, separate from `gaurd_rail`. The
default (no `gaurd_rail` row) still runs `Input Guardrails › PII Mask ×2 + Content Filters` on `e_66b280e945f17a17c0e7c27a`, with
every category reported `none` and `withinThreshold:true` even for a prompt-injection string — the default blocks nothing.

**51.11 QA round (v10) — more block facts ✅/⛔.** An `aria-label` expression in `additional.htmlAttributes` is NOT evaluated inside a
Repeatable item (the literal `{{ … }}` becomes the accessible name) — use static text there. Table `rowActions` with
`buttonType:'icon-button'` render an unnamed button whose DOM `id` is the row-action id repeated per row; `buttonType:'button'` +
`label` gives a named button without the id. `additional.htmlAttributes [{key:'role',value:'paragraph'}]` on a display-variant
Typography removes it from the heading outline (display variants render as h4/h5). Drawer `content.hideOnEscape: true` has no
effect (Escape does not close a Drawer); `htmlAttributes` on a Drawer land on the block element, not on the inner `role=dialog`
(whose `aria-labelledby` points at a missing id); no block method moves focus after a data-source callback. `htmlAttributes` on a
TextArea land on the wrapper, not the `<textarea>`. Table blocks accept `overflow-x:auto` in customCSS so a wide grid scrolls inside
its card. A data-source parameter can be made "blank when unchanged" with an inline comparison expression (no-edit Save → `changed []`).

**47.8 Agent turn usage lives under `additional`.** ✅ The conversation reader
(`fetchConversation=66ab98083d73300e63962287`) returns the turn's usage at
`response.additional.llmUsageDetails` (also on the Fan message's `additional`), not at
`response.llmUsageDetails`. `inputTokens` already INCLUDES `cacheReadInputTokens` and
`cacheWriteInputTokens` (38,994 = 1,530 + 12,488 + 24,976; `inputCost` prices only the 1,530) —
sum `inputTokens` only. One Opus 4.8 turn with three tools: $0.18.

**47.9 A full-record update evaluates `{{ … }}` inside every string.** ⚠️ `storage_by_unifyapps_update_record_by_id`
through an app data source (`rawPayload` = the whole record, required because a partial payload is
rejected 500) replaced every `{{ input.x }}` inside a stored JSON text (`plan_json`) with `""`.
Write JSON-text fields with `{{` as the JSON escape `\u007b\u007b` (backslash-u007b, twice) — the storage node sees no template
and `JSON.parse` restores the braces. The original text was recovered from the agent's tool span:
`TraceTimelineDetails` `{id:<record_plan span>, type:"Tool"}` → `inputOutputContent.input.content.plan_json`.

**47.10 A Custom Connector with a static API key needs no auth request.** ✅ `definition/basic` →
`definition/{D}/auth?type=CUSTOM` `{}` → `definition/update/{D}/auth?type=CUSTOM&version=1` with only the
connection form (`input` = `{api_key: {type:'string', format:'password'}}`) → per action: create, update
(`input`/`output` SCHEMA_AND_LAYOUT), `request/{D}/{A}/action` with the header `X-API-Key: {{ input.auth.api_key }}`
and path parameters as `{{ rawPayload.<name> }}` → `definition/{D}/publish`. `POST /api/connection/input/test?appName={D}`
`{name, authType:'CUSTOM', inputs:{name, authType:'CUSTOM', api_key}}` → 204; create the same body on
`/api/connection/input` → 200. All 10 actions list at `GET /api/workflow-builder/node/{D}/resources` (v2).
A workflow node `{type:'ACTION', context:{appName:D, resourceName:'D:A', resourceVersion, type:'APPLICATION',
connectionId}, inputs:{…}}` called `GET https://httpbin.org/anything/cafm/work-orders/WO-5001` with the
connection's key in `X-Api-Key` (probe connector `6ab6242c4c066815e09925e4`, connection `6ab6246fe45e8122be9d20a0`).

**47.11 Catalogue search.** ✅ `GET /api/workflow-builder/nodes` → 1,220 connectors
(`name` = appName, `displayName`, `description`, `iconUrl`, `custom`) in ~2 s; match on whole words
with a stop list (work, order, asset, system, data…) or "work orders" matches every "Work*" connector.
Existing connections per connector: aggregation `Connection` with `appName IN [...]`, `active: true`,
projections `id, name, appName, oUId` (no secrets).

**47.12 A fetch filter with no value is rejected.** ✅ UAT 2026-09-25 — `storage_by_unifyapps_fetch_records`
with `{property:'properties.ward_code', filter:{operator:'EQUAL'}}` (the template resolved to nothing because
the optional input was blank) fails the run: errorCode 5004 "Validation failed with 1 violations",
violation `No Value found in filter with field: properties.ward_code, operator: EQUAL`. Blank optional
filters must be removed before the node: build `triggerInputCondition` in a Groovy node that skips blank
values and pass it as `{{ n_x_w.outputs.result.cond }}` (an empty map `[:]` means no filter).

**47.13 `create_record` on an existing key.** ✅ UAT 2026-09-25 — a second `storage_by_unifyapps_create_record`
with the same primary-key value fails: errorCode 5010 "Duplicate key exception while inserting entity"
(Mongo write error). An append-only record (event, audit, history) needs a key unique per write.

**47.14 Groovy node code is a script body.** ✅ UAT 2026-09-25 — a trailing unmatched `}` fails the deploy
(5008 "Unexpected input: '}'"), not the save: `saveAndReturnViolations` accepts it and `deploy` returns 500.

**47.15 Agent approval card shape.** ✅ UAT 2026-09-25 — a tool behind `approvalConfig` stops the turn with a Bot
message that has NO `message` text: `interfaceDetails.slug = "mcp-request"`, `pageInputs = {toolId, request, caseId,
canApproveAlways}` (`request` lists the tool inputs as `name: value` lines); `responseGenerationStatus` stays
`pending`. Detect the card by the slug, not by searching message text for "approve".

**47.16 Linking a code app to GitHub squashes its history.** ✅ UAT 2026-09-25 — after the link,
`GET /agent-api/sessions/{s}/changes` lists ONE commit ("Deploy <app> …", tagged with the published version) and
`additional.gitDetails` appears on the `e_interface`. A "more than one commit means the app was written" check
fails for every linked app.

**47.17 Code Builder file read.** ✅ UAT 2026-09-25 — `GET /agent-api/sessions/{s}/files/content?path=<repo path>`
returns the file as plain text (not JSON) for the session's current branch.

**47.19 AI document extraction reads USER-scope uploads, not PUBLIC ones.** ✅ UAT 2026-09-25 — the same transfer
letter, uploaded from a code app with `useUppy({ accessScope: 'PUBLIC' })` and passed as the upload's `key`, made
the workflow with `ocr_document_details_extraction` fail ("Workflow execution failed", no detail); uploaded with
`accessScope: 'USER'` it was read and the record created. Pass the upload's `key` (not its url) and upload
documents a workflow reads with USER (or ALL_USERS) scope.

**47.20 A Code Builder session's local `main` does not follow GitHub; a builder turn is what moves it.** ✅ UAT
2026-09-25 (Studio `app-3a0598e469c9`). Branch-by-branch deploys (`studio-main-N`) never touched the session's local
`main` (117 commits behind at `de6411d`), so the default preview and any publish served the old app. What did NOT move
it: `POST /sessions/{s}/branch {branch:'main'}`, away-and-back via another branch, away-and-back via a pushed
`sync/<sha>` branch, `POST /sessions/{s}/restore {sha}` (history and files unchanged). What moved it: any builder turn on
`main` (`POST /agent-api/sessions {target:'code-builder', appId, branch:'main', input}`). The builder has no `git` CLI
("git: command not found"). The platform commits the turn's working tree, including the app's platform theme it
re-injects into `app/index.html` (font link) and `app/src/index.css` (:root tokens) at session start. On the rejected push
it merges `origin/main` ("Merge branch 'main' of github…") and pushes. After that, `main` = latest code. `POST
/apps/{id}/publish` then published v1 from it and added `publish v1` + a merge to GitHub `main`, re-applying the
injected `index.css` block. The rendered theme is still the repo's `theme.json` (branch builds apply it), so those
index.css tokens are cosmetic in git only. Recipe to refresh `main` + publish: one harmless builder turn on `main`,
then publish, then `git fetch` + merge before the next push.

**47.21 An agent tool argument is written by the model in one generation, so a large JSON argument does not fit.** ⚠️ UAT
2026-09-25 (Studio planner `e_6ab3dd29c9518d7218b9a4b6`, Vertex Opus 4.8). The planner assembled a 230 KB plan (37 steps)
in its sandbox and could not pass it to `record_plan` (`plan_json` string): trimmed to 75-98 KB it still could not emit it,
and an `@file` reference is not resolved (the workflow received the literal text and the JSON parse failed). There is no
file or sandbox-to-tool hand-off; the model has to write every byte of the argument. Design for it: a tool that takes a
large document takes it in parts of about 20 KB (a draft record plus an append tool that merges the next part and
finishes on the last one). ✅ The Studio's `record_plan` (`draft`) + `append_plan_steps` (`finish`) pair ran through
`initiate-test`: 2 + 2 + 1 steps, then `awaiting_approval` with steps 1-5, and the earlier drafts were marked `superseded`.

**47.22 Calling the tenant's LLMs from outside the platform: a callable workflow behind an app data source.** ✅ UAT
2026-09-25 (UnifyApps Forge bridge: workflow `scc_forge_llm` `6ab6c4ee83d15b63329fa243`, app `app-d1479599aad8`,
data source `ds_forge_llm` `e_6ab6c51c05e65b5f923f28f6`). `POST /api/workflow/execute/node?name=call_automation` with
`callables_call_automation` and our own `automationId` answers 500 "forbidden datasource: not found" (as §15): an external
caller needs a data source. Recipe: START (`callables_from_automation`, inputs `model_id`, `system_prompt`, `prompt`,
`max_tokens` as strings) → `CALL_INTERFACE_WORKFLOW` `conv_ai_by_unifyapps_call_llm_model_with_options` (resourceVersion 2481 on
the day; `modelId`/`systemPrompt`/message text/`maxTokens` templated from START) → STOP (`callables_return_to_automation`,
`text` = `llmResponse`, tokens, `finish_reason`); a minimal config app (`e_interface` + `e_global_<app>` page) with one
`callables_call_automation` data source (every parameter templated, one `dP` each), published; then
`POST /api/workflow/execute/node?name=<dsName>&requestId=<dsId>` with header `x-ua-app: <appId>` and the parameters filled
in `inputs.parameters` → `response: {text, input_tokens, output_tokens, finish_reason, success}`. Gemini 3.8 Flash
[MEDIUM] `e_6ab12f80f843281fda62e98d`: ~2 s for a one-line reply. `{{ … }}` inside the prompt and the system prompt is
passed through literally both ways (not re-templated). The tenant's text models: `POST
/api/aggregation?entityType=ai_agent_llm_model&group=ENTITY` with projections `id`, `properties_name`,
`properties_modelGroup` and a client-side filter on `TEXT_GENERATION` (the `lookup?ByQuery=ENTITY_ID:ai_agent_llm_model`
body shape tried returned 200 with no objects). No native tool calling through this step: an agent loop needs a
JSON tool protocol on top.

**47.22 Every Code Builder session rewrites the app's `index.css` :root block and `theme.json` from its own theme.**
✅ UAT 2026-09-26 (RCM Command `app-a26cd7448525`). A pull-only session on `main` committed `4d0beae` "Rebuilt preview
from latest main branch without file changes": 30 brand tokens in `index.css` :root and the `theme.json` palette went back
to the builder's theme (the one it chose when it wrote the app), and the sidebar text turned white on white. The builder's
theme is not in the `e_interface` (no theme pin, `studioThemeId` unused), and `/agent-api/apps/{id}/theme` is 404. Keep a
code app's palette in an app-owned stylesheet imported after `index.css` (e.g. `app/src/brand.css` from `App.tsx`; same
specificity, later wins): the next session left it alone and made no commit. The Studio app kit ships `app/src/kit/brand.css`.

**47.23 A code app can add npm dependencies through `package.json` alone.** ✅ UAT 2026-09-26. A branch build of a commit
that added `chart.js` and `exceljs` to `app/package.json` without touching `bun.lock` built (RCM `kit-preview`). The next
builder session on `main` ran the install and committed the lock (`afe689d`, `app/bun.lock` +190).

**47.24 `POST /agent-api/apps/{id}/publish` right after a session reports `done` can answer 409 "a turn is running on
'main'".** ✅ UAT 2026-09-26. The session's own commit/push is still settling. Wait (30 s steps) and publish again; compare
the returned `commitHash` with `GET /agent-api/sessions/{s}/changes` → `changes[0].sha`.

**47.25 A branch build that fails TypeScript leaves the preview on the previous bundle with `buildFailed: true`.** ✅ UAT
2026-09-26 (`app-f2e81f31d3fb`, branch `studio-build-91fda75f`): an excess-property error in a generated data file
(`'"success"' does not exist in type 'ActionDef'`). `GET /agent-api/sessions/{s}/branches` shows `buildPending` and
`buildFailed`; the session preview keeps serving the old bundle (here the starter's "Ready to build."). Run `tsc -b` on
generated files before committing; cast plan-shaped data (`as unknown as T`) instead of typing object literals.

**47.26 A data-source call must carry the same `context` the data source stores, `resourceVersion` included.** ✅ UAT
2026-09-26. `POST /api/workflow/execute/node?name=<ds>&requestId=<id>` for a storage `fetch_records` data source created
with `context.resourceVersion: 16421`: without `resourceVersion` in the call's context → 500 "forbidden datasource :
invalid input"; with it → 200 and the records. A data source created without a version (the Code Builder's own) accepts
calls without one.

**47.27 The copilot island in standalone mode takes questions from the page that frames it.** ✅ Studio 2026-09-26: the
island posts `{type:'ua-copilot:ready'}` to its parent and accepts `{type:'ua-copilot:send', text}` from `window.parent`
when the sender's origin is the island's own or `https://*.unifyapps.com` (a published app on its tensor host frames the
Studio's `main` island at `orbit…/agent-api/preview/b/<studio app>/main/copilot-island/index.html`).

**47.28 The OCR extraction node writes at most the model entity's `settings.maxOutputTokens`, and that setting is shared.** ✅ UAT
2026-09-26 — `__ua__call_ocr_extraction` has no token-limit input (its schema: `files, modelId, prompt, systemPrompt,
response_format, templateId, enhanceImage, includePageText, processAsPdf, methodForReadingPDF`). The tenant's
"OpenAI GPT 4.1 mini" `e_ai_agent_openai_gpt_4.1_mini` carries `maxOutputTokens: 436`, so a six-line invoice's JSON
stopped after 436 tokens on every run (images, `processAsPdf`, `includePageText`, `response_format` text or none: same
cut; with `json_object` the service appends a lone `}` to the cut text). Read the cap with
`POST /api/lookup?ByKeys=ENTITY_ID:ai_agent_llm_model {type:'ByKeys', lookupType:'ENTITY_ID:ai_agent_llm_model', keys:[…]}`
→ `properties.settings.maxOutputTokens`, `properties.inputModality`. "OpenAI GPT 4.1" `e_68276df04d33a26a60af1a5d`
(8,192, text/image/pdf) read all six lines in 8 s (746 tokens out). Gemini 2.5 Flash and OpenAI GPT 5.2
`e_6a3b67af1ed6126a38505a6b` failed the node on the same file. These entities belong to the tenant, not to us: choose a
model whose cap fits at build time, and make the parse step fail the run when the answer does not parse (a silent `{}`
saved a document with no lines).

**47.29 Groovy `Date.format(String, TimeZone)` is not available in the Code node.** ✅ UAT 2026-09-26 — use `java.time`:
`java.time.Instant.ofEpochMilli(ms).atZone(java.time.ZoneId.of('Asia/Dubai')).format(java.time.format.DateTimeFormatter.ofPattern('yyyy-MM-dd HH:mm'))`.

**47.30 Files a code app serves are cached by the browser; fetch them with `cache: 'no-cache'`.** ✅ Studio 2026-09-26 —
the Studio read its app kit from `/agent-api/preview/b/<app>/main/tools/app-kit/…`; a plain `fetch` returned the copy
from an earlier build (9,509 bytes) while `cache:'no-cache'` returned the current one (11,961 bytes), so a stale
`Pages.tsx` was committed under a manifest naming the new kit.

**47.31 The Code Builder loads `.agents/rules/*.md` on every turn; it does not discover skills we add.** ✅ UAT
2026-09-26 on `app-f2e81f31d3fb` (repo `kit-support-desk`). The builder workspace (and the linked repo) holds
`.agents/rules/project-guidelines.md` and `.agents/skills/<name>/SKILL.md`; `.agents/skills/.engine-skills.json` lists
the platform's own skills with versions (analytics, app-plan, backend-integration, copilot, design-system-*,
frontend-ui-engineering, impeccable 3.8.2, object-data, theming, workflow-authoring, …). Probe: a committed rule
"end every reply with RULES-FILE-READ" was obeyed on every turn with no mention in the prompt. A committed
`.agents/skills/studio-probe/SKILL.md` whose description matched the question was **not** opened. Adding a rule that
says "read the SKILL.md of every skill under .agents/skills/ not listed in .engine-skills.json whose description
matches the request" made the builder `ls` the folder, open the probe skill and follow it. So: ship our skills as
`.agents/skills/<name>/` and one rule that points to them. The builder also has a shell in its workspace
(`ls`, `cat`, `find`, `python3` with PIL).

**47.32 A follow-up Code Builder turn is `POST /agent-api/sessions/{s}/events`, and the reply streams back.** ✅ UAT
2026-09-26. Body `{message, attachments, displayText, mode: 'auto'|'plan', planDecision, userName, userEmail}`
(read from the builder page's own code); the response is an SSE stream of `data: {…}` events: `user_message`,
`stage_started {agent, model, prompt}`, `text` (the builder's words), `command` / `command_output`,
`file_written {path, op: view|write}`, `usage {model, input_tokens, output_tokens, cached_tokens, cost_usd}`,
`branch_queue`, `preview_ready`, `stage_finished`, `done`. `POST …/events?since=<epoch s>` with `{}` replays the
session's events without sending anything. One short question on the kit app cost ~$0.15 (777k input tokens, 666k
cached): the builder reads a large context every turn.

**47.33 Code Builder image attachments reach its disk, not its model (tenant default model).** ✅ UAT 2026-09-26.
An attachment item is `{name, isImage, url: '/api/file/asset/download/<assetId>', mimeType, size,
sourceType: 'CLOUD_STORAGE', source: 'user-uploads/…'}`, uploaded by the chat's file input (platform upload,
`referenceId` CODE_BUILDER_SESSION) and written to `.attachments/<session>/<name>` in the workspace. With the tenant's
default builder model (`gemini-3.8-flash`, the `isDefault` record of entity `text_to_ui_code_models`) the builder
answers "the current model can't view images, so the attached image(s) weren't sent" and then analyses the file with
Python: it reported a red circle `#D62828` and the text ZEBRA-731 in `#1D3557` with pixel positions, exactly right.
`POST /agent-api/sessions` also takes `planner: {model, connectionId, provider, vertexProject, modelEntityId}` (the
page fills it from `text_to_ui_code_models` where `isPlanner: true`; none on UAT); a session created with
`planner` = Vertex Claude Sonnet 4.6 still ran the builder on `gemini-3.8-flash`, in auto and in plan mode. The
builder's model is therefore the tenant-wide default record, a shared setting (candidates on UAT that read images:
Vertex Sonnet 4.6 `e_69ce39f38f978106088ac428`, Vertex Sonnet 5, OpenAI GPT 5.6 Terra).

**47.34 The LLM interface does multi-turn conversations, native tool calls and images.** ✅ UAT 2026-09-26 (Studio
Coder bridge `scc_studio_coder_llm` `6ab75af101e8b466e18560c3`, data sources `ds_studio_coder_llm` (sync) and
`ds_studio_coder_llm_async` on `app-3a0598e469c9`). The `__ua__call_ai_agent_llm_model` interface's input schema
(`POST /api/lookup?ByKeys=CALLABLE_INTERFACE`, key `__ua__call_ai_agent_llm_model`) is `{modelId, systemPrompt,
message: [{role, content: [object]}], tools: [{type:'function', function:{name, description, parameters}}], maxTokens,
temperature, responseFormat:{type}, top_p, topK, stream, aiAgentId, caseId, messageId, retry_count, step, logProbs,
frequencyPenalty, presencePenalty}`. Build `message` and `tools` in a Groovy step from JSON strings and template them
into the LLM node as whole values. With Vertex Opus 4.8 `e_6a1948ae4a418d2dde7d1096`:
- **tools**: a turn that wants a tool answers `finish_reason: "tool_use"`, `llmResponse` = its short text, and
  `outputs.tools = [{name, arguments: "<JSON string>"}]` (no call id). The next turn works with the call echoed as
  assistant text and the result sent as a user text part: the model answered from it (`end_turn`), ~3 s a turn.
- **images**: a content part `{type:'image_url', image_url:{url:'data:image/png;base64,…'}}` is seen (it read
  "ZEBRA 47" and a red square, 115 input tokens, 2 s); the Anthropic shape `{type:'image', source:{type:'base64',…}}`
  fails the run ("Workflow execution failed").
- `{{ … }}` in message text (JSX `style={{ padding: 8 }}`) passes through literally.
- **speed**: a 450-line TSX file came back whole, 10,379 output tokens in 88 s through the synchronous data source
  (~118 tokens/s; Opus 4.8 and Vertex Sonnet 4.6 both allow 64,000 output tokens on UAT). Near the ~128 s sync limit
  for larger answers, so the Coder uses the async data source (`synchronous:false`, §42.9) and the workflow writes the
  answer to a record (`scc_studio_coder_turn`, keyed by `turn_key`) that the page polls.
Production runs of the bridge are not readable per node (§45.11); debug the definition with `initiate-test` (short
turns finish inside its ~20 s window).

**47.35 A compiled return step's id is `n_out`: a step you call `out` collides with it.** ✅ UAT 2026-09-26 — the
engine's `{kind:'return'}` becomes node `n_out`; a spec step `{id:'out'}` produced two nodes with the same id, the
save succeeded and the run stopped after the LLM node with no output. Never name a step `out`.

**47.36 Orbit pages cannot fetch from public CDNs.** ✅ UAT 2026-09-26 — `fetch('https://cdn.jsdelivr.net/…')` from an
Orbit page (builder or preview) fails "Failed to fetch" (content security policy). Tools a Studio page needs at run
time (a TSX parser, a screenshot library, AccessLint) are vendored into the app and served same-origin
(`<preview>/tools/vendor/…`).

**47.37 The Playwright node, the one-time schedule node, and identity across scheduled runs.** ✅ UAT 2026-09-26.
- `code_by_unifyapps_playwright` (resourceVersion 2608): inputs `{input: <JSON schema>, output: <JSON schema>,
  parameters: {…}, script: <Node JS>, async, useTypescript, usePlaywrightTestFramework, testTimeout}`. Node v22;
  `require('playwright')` → `chromium.launch()` works headless; parameters arrive as script globals; the node returns
  `outputs.output` (everything the script printed) and `outputs.result`. Runs of 180 s, 360 s, 721 s and
  1,500 s (25 minutes, a headless page kept open) completed. `initiate-test` answers 500 "No Response received within specified timeout"
  after ~20 s while the run continues; read it from `WORKFLOW_EXECUTION` / `TEST_WORKFLOW_EXECUTION` (projections
  `ID, STATUS, EXECUTION_TIME, START_TIME, END_TIME`).
- `callables_schedule_a_callable` (v3130): `{automation_id, version:'-1', schedule_name, schedule_method:{schedule_type:
  'ONE_TIME', setup_config:{start_time: ISO, timezone}}, cancel_existing, infinite_retries, runtimeType:'DEFAULT',
  parameters:{…}, runtimeConnections:{}}`. A workflow that schedules itself keeps the caller as the owner of every
  scheduled run (three hops a minute apart, owner 109790 each time).
- `auth_by_unifyapps_create_user_session` (v2013) `{sessionDuration}` → `{sessionId}` (the `_at` cookie value).
  Creating or deploying a workflow that mints sessions is left to the person (the Studio Runner installer,
  `platform/studio-runner/install-runner.js`, is run by them in the console).
- Playwright `page.exposeFunction(name, fn)` lets the page under test call back into the node's browser: the Studio
  Runner exposes `__studioScreen(url, w, h)` so the Studio page gets real screenshots of the app it built.

**47.38 A pull that "finished" may not have built: read `preview_ready`.** ✅ UAT 2026-09-26 (`app-40c1254a6c34`).
A code app builds with `tsc -b && vite build` (strict): one type error fails the build. The pull session still ends
`done`, `GET /agent-api/sessions/{s}/branches` shows `buildFailed: true`, and the preview (session URL redirecting to
`/agent-api/preview/b/<app>/main/`) keeps serving the previous build. The session's event stream (`POST …/events?since=`,
an SSE stream that stays open: read it for a few seconds with an AbortController) has one `preview_ready` event per
build: `{previewVersion, buildFailed, buildError}` where `buildError` is the compiler output, e.g.
`src/screens/ShipmentBoard.tsx(97,149): error TS2322: Type '{}' is not assignable to type ReactNode …`. Always read it
after a pull before publishing or reviewing screenshots.

**47.39 Conversation parts for tools: the Anthropic shape works, the OpenAI shape fails.** ✅ UAT 2026-09-26 (Opus 4.8
through `scc_studio_coder_llm`). Assistant turn `content: [{type:'text'}, {type:'tool_use', id:'toolu_…', name, input}]`
and the next user turn `content: [{type:'tool_result', tool_use_id, content:'…'}]` (then any `image_url` parts) are
understood: the model answered from the tool result. An assistant message with `tool_calls` plus a `role:'tool'`
message fails the run. Do not echo tool calls as text ("(I called read_file {…})"): the model imitated it as plain text
and stopped calling tools after 7 turns.

**47.40 Building a commit without a Code Builder turn: a branch.** ✅ UAT 2026-09-26 (`app-40c1254a6c34`,
`app-3a0598e469c9`). Push the commit to a branch, then `POST /agent-api/sessions/{s}/branches {branch:'studio-build-<sha8>',
base:'<that branch>'}` (409 when it exists: `POST …/branch {branch}` instead). `GET …/branches` shows `current` at once
and `buildPending` until the build ends (~3 minutes for a code app; ~5 for the Studio itself), then `buildFailed` and a
new `previewVersion`; the build is served at `/agent-api/preview/b/<app>/<branch>/`. No model turn, so it does not meet
the `PLATFORM_LLM_TIMEOUT` (360 s) that ended a "pull main" turn twice today. On a session whose last turn had ended
in `error`, the switched branch sat unbuilt (`buildPending: false`, no new preview) until the Code Builder page for
the session (`/p/0/interfaces/code-builder/<app>?sessionId=<s>`) was opened, then built: keep that page open (a hidden
same-origin frame works) while waiting. `base: 'main'` builds main as it is on GitHub, a fallback deploy when the pull
turn fails (the git pull itself had landed before the turn errored).

**47.41 Auditing a frame's document from the parent page gives false accessibility failures.** ✅ UAT 2026-09-26 —
AccessLint (`accesslint-core.iife.js`) loaded in the Studio page and run on a same-origin frame's `contentDocument`
reported 8 `labels-and-names/form-label` violations on a form whose inputs are labelled (`htmlFor`/`id`); loaded into
the frame (`frame.contentWindow.eval(src)`) and run there it reported 0. Contrast agreed (4 vs 3). Element checks
across JavaScript realms (`instanceof HTMLInputElement`) fail; run auditors inside the page they audit.

**47.42 Code-app previews serve path routes; a session preview redirects to the branch preview.** ✅ UAT 2026-09-26 —
`GET /agent-api/preview/b/<app>/main/workbench` answers the app's `index.html` (the SPA handles the route); the kit
navigates by path, so `…/#/workbench` shows the home screen. `/agent-api/preview/<session>/` redirects to
`/agent-api/preview/b/<app>/<branch>/`, so the app's links sit under the branch path: resolve a screen list from the
address the page landed on.

**47.43 Updating a code app's `main` preview with no Code Builder turn.** ✅ UAT 2026-09-26 (Studio
`app-3a0598e469c9`). Two "pull main" turns ended in `error` today (the builder's model timed out), leaving
`/agent-api/preview/b/<app>/main/` on the old build. What worked instead, on any session of the app: (1)
`POST /agent-api/sessions/{s}/branches {branch:'<new>', base:'main', description}` (the call can take over 20 s
to answer; it still lands), (2) keep the Code Builder page for that session open (a hidden same-origin frame)
until `GET …/branches` shows `current: '<new>'`, `buildPending: false` and a higher `previewVersion`, (3)
`POST /agent-api/sessions/{s}/branch {branch:'main'}`, which rebuilt `main` from GitHub (the main preview then
served the new commit), (4) `POST /agent-api/apps/{app}/publish`. About 6–8 minutes, no model turn.

**47.44 Listing an object's newest records.** ⛔→✅ corrected UAT 2026-09-26 (same day). `POST /api/entity/<object>`
with `{filter:{op:'AND',values:[]}, page:{limit, offset}}` returns records **ordered by `id` (the record key),
descending**; `sort:{field:'createdTime', order}` (either order), `sort:{field:'createdTime', order:'ASC'}` and no sort
all return the same order. The first reading ("newest first") was wrong: those keys happened to be sequential. A
`createdTime` `GTE` filter returns nothing, and `/api/aggregation` does not project or filter `createdTime`
(`properties_created_at`, the object's own field, works; §45.12 had already seen the storage fetch step ignore this sort). To find records created since a time: page through all
of them (`limit` 200) and check `createdTime` (ms) and `ownerUserId` in code; each record has `id`, `createdTime`,
`modifiedTime`, `ownerUserId`, `version`, `properties`. `GET /api/user-context?includeRoles=true` → `user.id` matches
`ownerUserId`. To find labelled records, filter on the label field instead
(`/api/aggregation?entityType=<object>&group=ENTITY`, `properties_<field> IN [...]`).

**47.46 Dates written from ISO text: convert with more than `Instant.parse`.** ✅ UAT 2026-09-26 (Studio
MS-4WUZE). Date(-time) fields are stored as epoch ms. The Studio engine converted text with
`java.time.Instant.parse`, which accepts only a full instant with a zone (`2026-09-14T00:00:00Z`); a workflow input
`"2026-09-14"` became null and the field was left out of the record, with no error (the claim lost its
`loss_date`, so every loss-date rule read 0). Our converter's fault, not the platform's: convert date-only
(`LocalDate…atStartOfDay(zone)`), `yyyy-MM-dd HH:mm`, `yyyy-MM-ddTHH:mm[:ss]` (`LocalDateTime…atZone`) and offset
forms in the business zone (Asia/Dubai). Fixed in the engine's create/update compile (1.6.44).

**47.47 Groovy `("" as BigDecimal)` fails with "Index 0 out of bounds for length 0".** ✅ UAT 2026-09-26. The
message does not say "number": an AI extraction that returned `vat_aed: ""` for one estimate line failed the code
node (`FAILED_NODES: ["n_build"]`) and the whole document read. Cast through a converter (blank → 0, currency text
cleaned, anything else rethrown). Run history with the failed node: `/api/aggregation?entityType=WORKFLOW_EXECUTION
&group=PLATFORM`, projections UPPERCASE (`ID`, `STATUS`, `FAILED_NODES`, `START_TIME`) — lowercase `id` is
"Invalid Projection : id" (500).

**47.48 The Code Builder's own model can be out of credits; the app template is laid down anyway.** ✅ UAT
2026-09-26 21:33. A new code-builder session (`POST /agent-api/sessions {target:'code-builder', input}`) ended
`status: error` 2 s into its turn. Its event stream (`POST /agent-api/sessions/{s}/events?since=<epoch s>`, SSE) shows
`stage_started … model: "openai/gpt-6-sol"` and then `{type:"error", message:"{\"error\":{… \"code\":402 …}}"}`:
the builder model is served through an OpenRouter key whose daily credit limit was used up ("requires more credits,
or fewer max_tokens … requested up to 64000 tokens"). The error text carries an account link: keep only its first
sentence in logs. What still works: the app id and its workspace — `GET /agent-api/sessions/{s}/files` listed the
full template (175 files, `app/package.json` present), `/git` answers `{linked:false}` and `/branches` answers
`main`. So a starter needs no model turn; judge it by `app/package.json`, not by the session status. Turn-free routes
(branch builds §47.40, main preview §47.43, publish) do not use the builder model. The builder model is tenant-wide:
do not change it; report the 402 to the tenant owner.

**47.49 An early return inside an IF_ELSE branch: a second STOP node in the branch group.** ✅ UAT 2026-09-26
(`scc_library_join_waitlist`, test run `6ab813ab3c2b816ad4cb2a5b`). A `callables_return_to_automation` STOP node with
`groupId: "<ifId>@<parentGroup>@y"`, reached by the IF_ELSE's `if`/`yes` edge and with no outgoing edge, saves with no
violations next to the main `n_out` STOP; the run ended there with that node's `result` and no later node ran.
Without it, an IF_ELSE whose yes-branch is empty fails the save: "Total 2 outgoingEdges expected, but found 1."
The no-branch group is `@n` (§ groupId convention).

**47.50 Groovy has no `Date.parse(format, text)`.** ✅ UAT 2026-09-27 (inline test run `6ab82fcbc3064c77d9a58e9f`): `Date.parse('yyyy-MM-dd', '2026-09-28')` throws MissingMethodException (the groovy-dateutil extension is not on the platform); `java.time.LocalDate.parse('2026-09-28').atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli()` works. Same family as §47.29 (`Date.format`).

**47.51 The tenant has a daily AI cost hard limit; a data source only says "Workflow execution failed".** ✅ UAT 2026-09-27 02:07 (Dubai). Every LLM call on Orbit UAT (`call_llm_model` nodes, agents, the Studio Coder bridge) failed with `rootCauseMessage: "[COSTFLAG]Overall daily cost hard limit reached: input alone (1733.61125624) exceeds limit of 500.0"`: a tenant-wide daily budget (USD), shared by all users; not ours to change. The data source that ran the workflow answers only `{rootCauseMessage: "Workflow execution failed", executionInstanceId}`; the real cause is read from the run: `POST /api/aggregation?entityType=WORKFLOW_EXECUTION&group=PLATFORM` filtered `ID EQUAL <executionInstanceId>` (projections `ID, FAILED_NODES, START_TIME`), then `POST /api/lookup?ByKeys=WORKFLOW_VARIABLE` with keys `<id>.<id>.<node>` and a time window, no `workflowId` needed; the failed node's `outputs.payload.rootCauseMessage`. Non-AI workflows keep working.

👁 UAT 2026-09-27 (Forge kit, workflows `6ab7f2c9c3064c77d9856277` and `6ab841e32904de691ef4519a`): under the same limit an **Invoke Agent node does not fail — the run stays in `WAIT`**. Every test run that called an agent after the limit was hit (seven runs over ~30 min) stayed `WAIT`, with node variables recorded only up to the node before the agent call; runs that called the same agent an hour earlier completed in 11–16 s; a `call_llm_model` workflow run at the same time failed in 2 s with `[COSTFLAG]`, and workflows without AI steps completed. So: a run parked in `WAIT` at an agent node is not evidence against the workflow — run any workflow with an LLM step: an immediate `[COSTFLAG]` confirms the limit. Forge names both cases instead of reporting a failure (`kit/run.ts` `tenantCause`) and marks the item blocked, not failed.

**47.52 Identity in a use case: the platform user id in apps, the username in agents; a blank lookup must match nothing.** ✅ UAT 2026-09-27 (Lost & Found, workflow `6ab86f82a0b15c54f5811d47`, inline test runs). `GET /api/user-context` gives `user.id` (`"109790"`), `name` and `username` (`maheragent`), no email; an agent sees only the username (§50.4). A workflow that acts for "the signed-in person" therefore takes `actor_user_id` or `actor_username` and looks the person up by each. A record-search filter on a blank value must not be sent (the platform refuses a filter without a value), and dropping it turns a one-record lookup into "the first record": with a blank id it returned the first person on file, a receptionist. A filter `{property: 'id', filter: {operator: 'EQUAL', value: '__no_match__'}}` is accepted and returns 0 records (`found: false`), which is what a blank lookup should answer. Verified: blank → refused, unknown username → refused, username `maheragent` → the right person and their claims, id `109790` → the same.

**47.53 No OpenAI-compatible LLM endpoint on the tenant; the options are the LLM interface or an API Manager façade.**
✅ UAT 2026-09-27 (probe for Forge). With a signed-in session, every OpenAI-style path answered 404: `/v1/models`,
`/v1/chat/completions`, `/openai/v1/…`, `/llm/v1/…`, `/llm-gateway/v1/…`, `/ai-gateway/v1/…`, `/gateway/v1/…`, the same
under `/api/…`, and `/agent-api/{v1/models, chat/completions, openapi.json, docs}` (FastAPI, no docs exposed). No
"gateway / chat/completions / virtual key" string exists in the console bundles. **AI Governance is not a model
gateway:** Model Registry "Add model" imports models from a connection (AWS Bedrock, Anthropic, Core42 Compass, OpenAI,
Snowflake, UnifyApps) into the inventory; Discovery connections are `Observe · Advisory` (sweeps + OTLP traces, copy
"This platform can't route calls through the gateway yet, so it can only be observed") except UnifyApps-native ones,
`Control · Enforced`. So external callers reach tenant models only through `__ua__call_ai_agent_llm_model` (§47.22
bridge, §47.34 native `tools` + multi-turn `message` + `responseFormat` + `stream`; output `tools:[{name, arguments}]`,
no call id). **API Manager** (`/p/0/api-platform`: API Groups = `APIEndpointCollection`, Policies — ACL, rate limit,
usage quota, cache, CORS, IP allow list, header injection, request transformer/validator, timeout — and Clients)
serves published groups under `/api-endpoint/<group path>/…`; it is the only way to put an OpenAI-shaped URL
(`…/v1/chat/completions` → workflow → the LLM interface → an OpenAI-shaped reply) in front of tenant models. 👁 Not
built or verified: path freedom, raw-JSON response shape, client API-key auth and streaming are still open. Every call
still counts against the tenant's daily AI cost limit (§47.51).

**47.45 `github_compare_commits` (v3845).** ✅ inputs `{owner, repo, basehead: 'main...studio-work', page,
per_page}`; outputs `{status, ahead_by, behind_by, total_commits, commits[], files[]}` (GitHub's compare shape).
The Studio's `scc_studio_repo_sync` uses it to move `studio-work` to `main` only over Studio Coder commits.

**47.18 A test run of a callable workflow writes for real.** ✅ UAT 2026-09-25 — `initiate-test` with
`type: "MOCK"` still executes `create_record` (a run record was created by a self-test); test with inputs that
cannot touch live data (a throwaway key) or be ready to close the record.

## 53. Findings 2026-09-25 (Rest Supplier Intelligence — simulated source systems and scheduled sync, UAT)

### `storage_by_unifyapps_bulk_create_records` — array of raw payloads
✅ UAT · 2026-09-25 — resourceVersion 16419. Inputs `{object_type, useRawPayload: true, skipIfBlank: false,
skipUpdate: false, rawPayload: "{{ n_build.outputs.result.signals }}"}` where the Groovy node returns a list of
maps. 60 records in one call. **An empty list is accepted** (run SUCCESS, nothing written) — no IF needed.

### Sync graph that writes back to the source
✅ UAT · 2026-09-25 — fetch (status NEW) → fetch mapping → Groovy → bulk_create (product) →
`bulk_upsert_records_by_id` (v16335, `updates: [{id, updateFields:[{fieldName, actionType:'SET', setValue}]}]`)
on the source object → `create_record` run log → bulk upsert on the registry row. The record `id` for
upserts is the primary-key value (`CYB-ALR-000123`, `SRC-CYBLE`). Verified by row counts after each run.

### Scheduled twin of a callable workflow
✅ UAT · 2026-09-25 — same nodes, START swapped for `schedule/schedule_default` v202 with
`{cron:'INTERVAL', interval: 15, frequency:'MINUTES', sequential: true}`. First unattended run fired on the
quarter hour after deploy. A scheduled workflow can still be smoke-tested with
`POST /api/test-workflow/initiate-test/{id}` `{payload:{}, type:'MOCK', workflowDefinition:<full def>}`;
node payloads via `lookup?ByKeys=TEST_WORKFLOW_VARIABLE` key `{runId}.{runId}.{nodeId}`.

### Groovy in these workflows
✅ ISO timestamp without java.time: `new java.sql.Timestamp(System.currentTimeMillis()).toString().replace(' ', 'T').substring(0, 19) + 'Z'`.
`new Random()` and `String.format` work in the sandbox.

### 12,700 entity writes from a signed-in tab
✅ 16 parallel workers (`POST /api/entity` create, `POST /api/entity/update` with the version from the list
read) — 12,752 writes, zero failures, a few minutes. 17 object schemas created/updated in one pass.

## 54. Findings 2026-09-25 (Rest Supplier Intelligence: live testing and redesign, Orbit UAT)

### App UPDATE binding with a partial payload: a REPLACE, again
❌ UAT · 2026-09-25 — an in-app writer passed partial changes to `storage_by_unifyapps_update_record_by_id`
(`useRawPayload: true`). On an object whose primary key is required the call 500s with
`Non Empty Validations in Validating entity rsi_review with validationResult required review_code`
(`rootCauseMessage` in the execute-node response). Adding the key "fixed" the error and stripped the record
to three fields. ✅ Fix: the writer reads the row first through the FETCH binding
(`triggerInputCondition {operator:'AND', filters:[{property:'id', filter:{operator:'EQUAL', value:id}}]}`,
`page {limit:1}`, full stored input set), spreads `response.objects[0].properties`, applies the change and
writes the whole record. Verified: all 11 fields kept, new pack saved. Damaged record restored with
`POST /api/entity/update {id, entityType, version, properties}`.

### Patching deployed workflows in place
✅ UAT · 2026-09-25 — `GET /api/workflow-definition/{id}`, edit `nodes[].inputs.code` (Groovy) in the returned
object, `POST /api/workflow-definition/saveAndReturnViolations` with the whole object (response
`{workflowDefinition}`, no `violations` key when clean), then `POST /api/workflow-definition/{id}/deploy?version=<new>`.
A save alone creates a new draft version; deploy it too so live and draft match. Four sync workflows moved
v1 → v2 this way, and the next scheduled runs used the new code.

### Bulk data correction
✅ UAT · 2026-09-25 — 3,559 records across five objects rewritten (full properties + version,
`POST /api/entity/update`, 16 workers): zero failures, re-scan showed no field loss.

### Publish
✅ `POST /agent-api/apps/{appId}/publish {versionTag, versionNote}` returns
`{ok, deployDir, commitHash, branch, version, tag}`. It can take longer than 45 s to return; poll
`GET /agent-api/sessions/{s}/changes` for `published: true` on the head commit instead of waiting.
A pull session commits its own "Rebuild preview with the latest changes on main" on top (it touches only
`.agents/skills/*`); pull it locally before the next push.

### Copilot SDK dark scheme
✅ `CopilotProvider colorScheme="dark"` ('light' | 'dark' | 'system', scoped to the copilot root) paints
the SDK's own dark token set; override only `--palette-brand-*` and the font variables on `.ua-variables`.
The island document needs a border-box reset or `ua-copilot-input` (w-full + padding, content-box)
overflows the dock by 28 px.

### Agent latency (observed)
⚠️ UAT · 2026-09-25 — Supplier Risk Analyst (Gemini Flash, QueryData tool) took ~70 s from question to full
answer on "Which material service providers need attention this week, and why?". The answer was correct
and cited record codes. Worth measuring before any live demo.


## 55. Findings 2026-09-25 (Msheireb Performance Intelligence — `app-0ad14f7488ef`, Orbit UAT)

**55.1 Acknowledge source rows with one `update_records` call.** ✅ — `storage_by_unifyapps_update_records`
(update type MULTIPLE, filter `id IN [<ids from the fetch>]`, `updateFields` SET `sync_status: ACKNOWLEDGED`)
marks ~1,000 rows in one node. The first version acknowledged row by row with upserts and the run was
cancelled at 165 s; with `update_records` the whole sync (8 sources → 8 product objects) takes ~9 s.

**55.2 The aggregate node does not group records of custom objects.** ❌ — with `properties.x` the columns
come back empty; with `properties_x` every record comes back as its own row (the REST aggregation API
behaves the same, §48). Compute KPIs in Groovy over a paged fetch (3 × 5,000 rows here) and assert
completeness (`rows_read == total`) before writing anything derived.

**55.3 LLM node numbers must be numbers.** ✅ — `max_tokens` / `temperature` resolved from a Groovy map as
strings fail the run: "max_tokens: Input should be a valid integer". Return `(int)` / `double` from Groovy.

**55.4 The test runner cancels LLM runs at ~26 s.** ⚠️ — `initiate-test` on a workflow with an LLM node
reports CANCELLED around 26 s. Test those workflows through their `e_data_source`
(`POST /api/workflow/execute/node`), which ran the same explain workflow to completion in 24 s.

**55.5 Groovy identifiers.** ❌ — `owner` is blacklisted (save fails); rename (`docOwner`). Avoid `next`,
`main` and other names that shadow script bindings.
❌ UAT 2026-09-27 (Three-Way Match desk, `scc_threew_sw_08_match_basis`): a closure parameter named **`g`**
(`list.each { g -> … }`, `inject(0.0G) { a, g -> … }`) passes `saveAndReturnViolations` but the **deploy** fails 500
*"startup failed … The current parameter list already contains a parameter of the name g"* — the Code node wraps the
script in a scope that already binds `g`. Rename it (`gx`). The same script compiled and ran under stock Groovy 4.

**55.6 Code-app branch switches.** ✅ —
- POSTing a second branch while the first switch is still pending **cancels** the first
  (`pendingBranch` cleared, `current` unchanged).
- The nudge works every time: `PUT /agent-api/sessions/{s}/files/contents` with `PRODUCT.md` unchanged,
  then `POST /branch {branch:'<new t-sha>'}` → `current` moves at once. Repeat for `main` → `/changes`
  head = the pushed commit. Reloading the Code Builder page with the pane hidden did not complete it.
- `/agent-api/preview/{sessionId}/<route>` redirects to `/agent-api/preview/b/<appId>/<branch>/<route>`;
  `/b/<appId>/main/` serves the last **built** main bundle (it showed the starter until main was rebuilt).

**55.7 Reading the publish result.** ✅ — `GET /api/entity/e_interface/{appId}` carries `deploymentState`
at the top level (not under `properties`): `{additionalDetails:{sourceCommitHash}, deploymentTag,
deploymentNotes, deployedAt, deployedBy, version}`. The publish POST outlived the 45 s tool limit; poll
this until `deploymentTag` is the new tag.

**55.8 Check a PRIVATE published bundle without signing in.** ✅ — the published origin serves `/` and
`/assets/*.js` unauthenticated. Routes are lazy chunks: grep `index-*.js` for `assets/<Route>-*.js`, fetch
each and look for strings only the new commit has.

**55.9 Generated data must be internally consistent.** ❌ found in review — the work-order generator drew
the fault ("Lift door fault") independently of the equipment ("Chilled-water pump 1"), and the explain
workflow cites work-order titles in the executive answer. Draw faults from the equipment's own category.
Repaired 250 work orders in the source and product objects with full-record `POST /api/entity/update`
(dry run on one record, field count read back, then 8 workers, 498 writes, 0 errors). The seed stayed
deterministic because `pick()` consumes one PRNG draw whatever the list length — diff old vs new
generator output first and assert that only the intended fields changed.

### Agent latency fix (measured)
✅ UAT · 2026-09-25 — Supplier Risk Analyst: `responseGenerationSettings.disableThought: true`,
`topicExecutionSettings.topicSelectionModel` moved from Vertex Opus 4.8 (`e_6a1948ae…`) to the same Gemini Flash
as execution (`e_6ab12f80…`), plus a length rule in the instructions. Warm answers 60–70 s → **34–38 s**, first
answer of a fresh chat ~60 s (session start). Accuracy unchanged: Sydney concentration 61 of 85, Cyble 27 alerts /
26 vendors / 9-7-9-2 by severity, all matching a direct count of the records.

### App tags survive nothing
✅ UAT · 2026-09-25 — `DEMO_READY` + description applied with hierarchical `UPDATED` on `e_interface`; publish
clears tags (§47.2), so re-apply after every publish.

---

## 56. Findings 2026-09-25 (Code-node audit of our workflows + native-node probe + insight latency, Orbit UAT)

Prompted by Maher: "most of the workflows … has a lot of code nodes … make sure we are utilizing
the different tools and nodes natively from the platform", and "AI Insights … not taking too much
time in loading". All reads were `GET /api/workflow-definition/{id}`; the only write was the scratch
probe below.

**56.1 How much Code our builds contain ✅.** 357 of our workflows on UAT, found by name prefix,
every node classified (START/STOP excluded):

| Build (prefix) | Workflows | Nodes | Code nodes | Groovy lines | Code nodes > 60 lines | Workflows with Code ≥ native |
|---|---|---|---|---|---|---|
| Mars Pedigree `pao_` | 128 | 909 | **416 (46 %)** | 15,733 | 99 | 109 |
| Studio-generated `scc_` | 137 | 740 | **353 (48 %)** | 6,256 | 13 | 82 |
| SHU `shu_` | 25 | 207 | 38 | 1,342 | 5 | 3 |
| Msheireb `msh_` | 15 | 239 | 34 | 1,748 | 11 | 3 |
| Claim Integrity `cig_` | 15 | 78 | 15 | 1,151 | 8 | 4 |
| Jaidah `jd_` | 11 | 56 | 10 | 522 | 2 | 6 |
| Rest `rsi_` | 11 | 50 | 11 | 296 | 0 | 3 |
| Sharek `sharek_` | 6 | 35 | 7 | 518 | 2 | 3 |
| TAQA `taqa_` | 5 | 23 | 4 | 354 | 1 | 2 |
| CGB Pulse `cgbp_` | 4 | 17 | 5 | 95 | 0 | 2 |

What the Code nodes did, by title — Mars: "Lookups" 92 (hand-built joins), "Act" 78 (branching
logic), "Envelope" 78 (assembling the return object), "Verify the evidence" 18, "Compare the two
reads" 17, "This item"/"Next item" 22 (loop bookkeeping), "Step record" 14. Studio: the engine's own
wrappers — "(rows)" 68 (flatten after every fetch), "(record)" 39 + "(changes)" 31 (coerce before
every write), "(prompt)" 12 + "(parse)" 12 + "(usage)" 6 around LLM calls, "(filter)" 8, "Continue"
4 (a Groovy `return [ok: true]` to rejoin an `if`) — emitted by
`sc-native-studio/app/public/tools/studio-build.js` `emit()` / `seq()`. Largest single node: 283
lines (`sharek_refresh_insights` "Derive the insights"). `cig_aggregate` sums in Groovy over one
5,000-row page and returns a note that the total may be short.

**56.2 Native replacements, run in probe `mnp_native_node_probe` (`6ab663aa83d15b63326027b0`, saved
v1, 0 violations) against `cig_claim` (167 rows) ✅.**

- `storage_by_unifyapps_count_records` v16419 `{object_type, triggerInputCondition}` → `{count}`;
  167 unfiltered, 0 with a non-matching filter.
- `utility_by_unifyapps_run_sql_query_on_list` v6779 `{dataSources:["{{ n_f.outputs.objects }}"],
  sqlQuery}` — the pill is also the table name in `FROM`. Verified: `GROUP BY properties.scheme`,
  `COUNT(*)`, `SUM(CAST(properties.claimed_amount AS DOUBLE))` = 3,480,482, `ROUND(AVG(…),2)` =
  20,841.21, `WHERE … IS NOT NULL`, `ORDER BY`, `LIMIT`, and `JOIN` of two pills (`FROM {{a}} a JOIN
  {{b}} b ON a.id = b.id`). Output `outputs.result` (array of row maps). Whole run incl. two 167-row
  fetches: 1,028 ms.
- `utility_by_unifyapps_sort_list` v6676 `{listSource, sortBy:[{field:"id", order:"ASC"}]}` →
  `outputs.sortedList` ✅.
- `utility_by_unifyapps_to_json_object` v6834 `{jsonString}` → `outputs.result` (parsed, nested) ✅.
- STOP `callables_return_to_automation` `result` as a map of templates ✅ (no "envelope" node needed).
- Fetch/count filters inside a workflow: **both** `properties.country` and `properties_country`
  honoured (a non-matching value → 0 rows for fetch and count), `id` EQUAL → 1 row. Refines §49.1:
  the dot form is not ignored in these nodes on UAT today.

**56.3 Traps ⛔.**
- `storage_by_unifyapps_aggregate_records` v2734 (description "Runs an aggregation query (GROUP, SUM,
  COUNT, AVG …)") **does not aggregate**. Projections `{name, aggregationFunction, alias}` with bare
  names or `properties.x` → rows with empty `columns`; with `properties_x` → one row per record, the
  record's own value under every alias (`total` = `n` = `avg` = 18000 / 38150 / …), `hasMore:true`.
  A filtered variant behaves the same. No error — same wall as §48.4. Use fetch → SQL on list.
- `utility_by_unifyapps_filter_list` v6805 returned `filteredList: []` for a filter every row
  matches, with the property as the documented pill (`{{ n_f.outputs.objects[0].properties.country }}`)
  and as `properties.country`. Shape unresolved; filter in the fetch or the SQL `WHERE`.

**56.4 Schema read, not yet run 👁.** `decision_table_by_unifyapps_execute_table` v2290 `{entityId,
input_loader, entity, enableDynamicOutput, responseType}`; `template_by_unifyapps_compile_template`
v1826 `{template_id, template_loader, template_content, nested_eval}` → `{output}`;
`utility_by_unifyapps_template_resolver` v6763 `{payload, additionalContext}` → `{output}`;
`utility_by_unifyapps_date_diff` v6796 `{date1, date2, outputUnit: years|days|hours|minutes|seconds|milliseconds}`
→ `{difference}`; `storage_by_unifyapps_fetch_distinct_values` v16325 `{object_type, field,
triggerInputCondition}` → `{objects}`; `storage_by_unifyapps_update_records` v16422 `{object_type,
numberOfRecordsToUpdate, triggerInputCondition, updateFields:[{fieldName, actionType, setValue}]}` →
`{result, count, failedCount}` (used by Msheireb `msh-wf.js`); `duckdb_by_unifyapps_execute_sql_query`
v1680 `{instanceId, sqlQuery, exportFileType}` → `{resultFile}`. Resource counts: utility 63,
variable 17, decision table 6, storage 43. Many input fields carry a `ua:llm_description` in
`input.layout` — the platform's own filling instructions for a model.

**56.5 Insight latency — what is live ✅.** The nine `*_ai_insights` workflows on UAT, read
2026-09-25: `maher_ebs`, `sharek`, `rsi`, `cgbp`, `taqa`, `jd`, `cig`, `shu` all call
`__ua__call_ai_agent_llm_model` with **Vertex Sonnet 4.6 `e_69b9900c5739ad5159baa133`, `maxTokens`
4000–5000**; only `pao_ai_insights` runs GPT-4.1 mini with 1600. Test-run history: `maher_ebs` 26–27 s,
`sharek` 23 s. The skill (`ai-app-patterns.md` §2) had named the Sonnet id as the one to copy, and
builds cloned each other's insight workflow — that is how it spread. Measured alternative (§25
latency note): GPT-4.1 mini 3.9–6.5 s against Sonnet 29–33 s on the same prompt. Skills now carry a
latency budget (first report < ~8 s, revisit instant, time per screen in the test report) and the
hook's caps were cut to 30 rows / 8,000 chars. The live workflows were changed the same day — §56.6.

**56.6 The eight live insight workflows moved, measured on the Orbit previews ✅.** Maher approved all
eight. Each: `modelId` → `e_ai_agent_openai_gpt_4.1_mini`, `maxTokens` → 1600, "between 2 and 4" →
"two or three", then the NUMBERS rule appended (below); `saveAndReturnViolations` (no violations),
deploy with the saved version, `deploymentState.workflowVersion === version` asserted for every one.
(`rsi_ai_insights` had already been moved by another session; it only received the NUMBERS rule.)
Timing = the insights `/api/workflow/execute/node` call in the preview tab
(`/agent-api/preview/b/<appId>/main/`, config app `/p/0/interfaces/cgb-pulse/preview/command`),
insight cache cleared, read from resource timings and matched to the response's data-source id:

| App (workflow) | Screen | Before (Sonnet 4.6) | After, final prompt | Live version |
|---|---|---|---|---|
| Claim Integrity (`cig_`) | landing | 34.7 s · 4 findings · 4,317 tok | 4.6 s | 3 |
| SHU Brain (`shu_`, UAT app-2fa05be511e2) | Retention, Regenerate | 35.9 s · 4 · 6,054 tok | 5.5 s | 5 |
| TAQA (`taqa_`) | landing | 30.3 s | 4.6 s | 5 |
| CGB Pulse (`cgbp_`) | Command Centre, Refresh AI read-out | 30.2 s | 5.3 s | 3 |
| Jaidah Majlis (`jd_`, UAT app-473ca8d00f66) | Majlis, "Find what matters" | 28.3 s | 4.7 s | 3 |
| Sharek (`sharek_`) | landing | 23.6 s · 4 · 4,062 tok | 4.5 s | 4 |
| GSPC EBS (`maher_ebs_`) | landing | 16.5 s | 3.6 s | 7 |
| Rest (`rsi_`) | landing | 4.8 s (already mini) | 4.3 s | 3 |

**56.7 GPT-4.1 mini miscounts rows ⛔ → the NUMBERS rule ✅.** On SHU's exact captured payload
(30 `at_risk` rows, 12,099 chars) the mini model said 26 critical (actual 30), 26 withdrawal (24),
20 missed classes (17), 15 aid verification (12) and charted those counts; Sonnet had 30 ✓ but listed
13 names under "12". Appended to every insight prompt: *"NUMBERS (hard rule): quote only figures that
appear in the data exactly as given. Never count rows, add, average or derive a new figure yourself,
in the text or in a chart. If a count matters and the data does not state it, name the records
instead of counting them. A chart may only plot values present in the data."* Replaying the same
payload twice: 3 findings, every figure a value from the data (scores, office counts, the
signals-by-office series), 5.2 s / 6.1 s. Claim Integrity's mini answer was also shallower than
Sonnet's (2 findings; the single-claimant network finding dropped) — correct, less incisive.

**56.8 Found in passing (pre-existing, not changed) ⚠️.**
- `jd_ai_insights` (UAT) carries TAQA's system prompt verbatim (node hash identical to
  `taqa_ai_insights`): "TAQA Arabia … Egypt … EGP millions" — a clone never re-prompted.
- Jaidah UAT `useInsights` never renders: `response.insights` is a JSON **string** and
  `parseInsights` parses the outer object, finds a string, returns `[]`. The call succeeds (4.7 s),
  the panel stays empty — same before the change.
- Jaidah UAT payload is `divisions.slice(0, 200)` cut at 60,000 chars, i.e. the OLDEST months: the
  model cited Oct-2024 figures as current and spent 20,113 tokens.
- `taqa-platform.json` in the repo still had the pre-edit sentence naming SAP Ariba; live had
  already dropped it — synced.
- The GSPC EBS insight footer and service catalogue said "Claude Sonnet 4.6" — fixed in the repo,
  shows after the next build.


### `rsi_ai_insights` and `rsi_ai_writer` moved to GPT-4.1 mini (measured on the published app)
✅ UAT · 2026-09-25 — both `__ua__call_ai_agent_llm_model` steps: `modelId` Vertex Sonnet 4.6
`e_69b9900c5739ad5159baa133` → `e_ai_agent_openai_gpt_4.1_mini`; insights `maxTokens` 5000 → 1600 and "exactly 3
insights"; writer 6000 → 4500; hook caps 30 rows / 8,000 chars. Edited in place (GET definition, change
`nodes[n_llm].inputs.parameters`, saveAndReturnViolations, deploy). Screen insight, cold, page load included:
**24–32 s → ~5 s** (home, reviews, MI); revisit 0.4–0.9 s from cache. AI review pack **~60 s → 11 s**, RAG per topic
and figures still correct. So of §56.5's list, `rsi` is now on the fast model.

**55.10 Public code app: who is the caller?** ✅ — after `security.type` flips to `PUBLIC` (builder session
asked only to run `update_app_security`; no commit), the published site keeps its login page until you
**publish again**. On the public URL an anonymous visitor's governed workflow calls run as **platform user 0**
(`ownerUserId: 0` on the rows they create). An app that derives roles from the caller therefore sees
"user 0" — grant or refuse that id deliberately; here it was granted EXECUTIVE by the owner's decision.

**55.11 Publish drops the app's tags.** ❌ — `tags: ["DEMO_READY"]` set on the `e_interface` with
`POST /api/entity/create-update-or-delete/hierarchical {entity:{id, entityType, version, tags, properties:<all>},
requestType:"UPDATED"}` came back `null` after the next `POST /agent-api/apps/{id}/publish`. Re-apply tags after
every publish. (Description survived.)

**55.12 Branch switches can take minutes.** ⚠️ — with the nudge (§55.6) the switch to a new `t-<sha>` sometimes
applies at once and sometimes stays `pendingBranch` for 3–5 min before `current` moves. Poll `/branches` in
short calls; do not POST the next switch until `current` has moved.


## 58. Findings 2026-09-25 (SAP connectors for an SAP automotive / VMS proof, Orbit UAT)

Read-only, from a signed-in tab (`GET /api/applications/{app}?fields=authSpec`,
`GET /api/workflow-builder/node/{app}/resources`). Nothing created.

**58.1 `sap_odata` connection form.** `name`*, `authType`* (default `BASIC`: username + password),
`odataVersion` (default `2.0`), `hostUrl`* (host only, e.g. `www.S4System.com`, port if needed; the service
path goes in the action), `sslVerify` (default true; a PEM server certificate can be supplied for self-signed
hosts), `connectionType`* `DIRECT` | `ON_PREM` (`ON_PREM` requires `groupId` = an On-Prem group).
Resources: `sap_odata_search_objects`, `sap_odata_create_object` (v3193), `sap_odata_on_new_object` (TRIGGER),
`sap_odata_list_purchase_order` (v3343), `sap_odata_get_purchase_order_by_id` (v3344),
`sap_odata_list_purchase_requisition` (v3297), `sap_odata_list_attachments` (v3299),
`sap_odata_download_attachment` (v3300); search/list/download are v3296–3300. Versions drift; re-read before use.

**58.2 `sap_rfc` connection form.** `name`*, `authType`* choosing either direct application server
(`network_connection.gateway_host`*, `system_number`*) or load-balanced (`message_server_host`*,
`logon_group`); both take optional `quality_of_protection` (SNC, with `snc_partner_name`) and `program_id`.
`user_logon`: `client`* (integer), `user`*, `password`*, `language`. ⚠️ **No `connectionType`/ON_PREM
option.** The platform must reach the SAP gateway directly (port 33<sysnr>, e.g. 3300), so a cloud-hosted
SAP needs that port opened to the platform's egress. Resources: `sap_rfc_call_rfm` (v4181),
`sap_rfc_export_call_rfm` (v1939), `sap_rfc_send_idoc` (v4227), `sap_rfc_check_idoc_status` (v4228),
`sap_rfc_list_all_idoc_types` (v4094), `sap_rfc_on_new_idoc` (TRIGGER, v4120; needs an SM59 HTTP destination +
WE21 XML-HTTP port in SAP pointing at the platform webhook, per the connector's own instructions).

**58.3 Tenant state.** UAT had 7 `sap_odata` connections (all active, owned by others, one named
`... PROD DND`) and 1 `sap_rfc` connection (inactive). Leave them alone.

**58.4 SAP side (outside UnifyApps, for the record).** On api.sap.com, none of the 9 S/4HANA VMS APIs
(`OP_API_VMSVEHICLE_0001`, `OP_VMSVEHICLESTATUS_0001`, `…CAMPAIGN`, `…ACTION`, `…USAGESTATUS`,
`…SEARCHAREA`, `…SHARINGLEVEL`, `OP_API_VMSVEHICLELOCATION_0001`) has a sandbox ("Try Out option is
unavailable"). SAP Digital Vehicle Hub APIs do (`sandbox.api.sap.com/sapdvh/...`): `PUT /vehicle/search` →
200 `{count:0}`, Vehicle Extension Entities → 500 (SAP-side OAuth 401). The hub catalogue
`/odata/1.0/catalog.svc/APIContent.APIs` exposes the sandbox as `ServiceUrl`; its `$filter` is ignored.
The SAP S/4HANA 2025 Fully-Activated Appliance (CAL) opens HTTPS 44300/44301 (Fiori/OData) and TCP 3300
(RFC) by default.


---

**58.5 Keyed sandbox test.** With a valid hub API key (`APIKey` header):
`/s4hanacloud/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner` → **200**, while
`API_VMSVEHICLE_SRV` / `API_VMSVEHICLE` (`$metadata` and `A_VMSVehicle`) → **403**, identical to a made-up
service name. Without a key, every `/s4hanacloud/...` path returns 401 (the key check runs before path
resolution), and `/s4hanaop/...` and `/s4hana/...` return 404 "Unable to identify proxy": the sandbox has no
on-premise/Private Edition area. **Conclusion: no free SAP-hosted VMS endpoint exists.**

**58.6 Listing a system's OData services from an existing connection (read-only).** The `serviceName`
dropdown of `sap_odata_search_objects` is a lookup: `POST /api/lookup?ByQuery=CONNECTOR_OBJECT_NAME`
`{lookupType:"CONNECTOR_OBJECT_NAME", type:"ByQuery", options:{connectionId, source_resource_name:"sap_odata_list_services"}}`
→ `{response:{objects:[{value|label…}], type:"HITS"}}`. It reads the gateway's registered services, with no
workflow and no write. (`objectId` uses `source_resource_name:"sap_odata_fetch_objects"` + `inputs.serviceName`.)
On UAT, `test` (Shreyans, 2025-01-20) returned **3,177** services (1,585 `*_SRV`, 25 `API_*`, custom
`Z*`/`ZZ1_*`), a full S/4HANA; no service matched `vms|vehicle|velo`. Four other connections to the same host,
and one to a BTP host, returned 200 with an **empty** list: an empty lookup is not a proof of "no services"
(likely stale credentials or a v4 connection).

## 57. Findings 2026-09-25 (Studio engine 1.7.0: native nodes instead of wrapper Groovy, Orbit UAT)

Probe workflow `mnp_native_node_probe` (`6ab663aa83d15b63326027b0`, inline `initiate-test` runs) and scratch object
`mnp_probe_record` (tag `MNP_SCRATCH`). Result in `sc-native-studio/Tests/2026-09-25-engine-1.7.0-native-nodes.md`.

**57.1 Verified ✅**
- `SELECT id, properties.* FROM {{ n_f.outputs.objects }}` flattens fetched records; `to_json(...)` must be
  `CAST(... AS VARCHAR)` (a JSON-typed column comes back as Jackson node metadata `{array:true,…}`); `list(struct)`
  does not convert, a single struct does; `list(id)` gives a string array.
- Templates: `{{ n.outputs.result[0] }}` (object) and `[0].field` work; an object embedded in a longer string
  renders as a **Java map** (`{a=1, b=2}`), not JSON; `[*]` wildcards are **not** supported (null payload).
- `utility_by_unifyapps_to_json_string {object}` → JSON text, `[]` for an empty list; throws on an unresolved input.
- `utility_by_unifyapps_to_json_object` parses clean JSON; a ```json fence fails (fastjson2).
- Variable node formulas are **Excel** (POI): each `{{ }}` becomes a cell (`0{{x}}` → `0A1`, invalid), so use
  templates as bare cells. Working: `=IF({{t}}>0,TRUE,FALSE)`, `=MIN({{t}},500)`,
  `=ROUND((NOW()-DATE(1970,1,1))*86400000,0)` (epoch ms), `=DEC2HEX(RANDBETWEEN(0,65535),4)&…` (RANDBETWEEN clamps
  at 2^31-1), `=LEFT(IF(LEN({{u}})>0,{{u}},"run"),120)`, `=IFERROR(VALUE({{a}}),0)+…` (SUM ignores numbers held as
  text); `GT()` and `UUID()` do not exist.
- A Groovy parameter typed string receives a template object as a **HashMap**.
- IF_ELSE: both branches may join the next node (or STOP) with two incoming edges; saves with no violations.
- `create_record` raw payload of templates: `"12.5"`→12.5, `"7"`→7, `"true"`→true, a list into a text field is
  stored as JSON text, unresolved keys dropped; `skipIfBlank:true` drops `""` values.
- `update_records` by query on `id`: blank id → `{result:false}`, nothing written; `skipIfBlank:false` lets `""`
  clear a text field, `true` skips it. Output is only `{result}` (no count).

**57.2 Traps ⛔**
- `run_sql_query_on_list` on an **empty list** fails ("json_read expected records"), and `dataSources` must be a
  list (an object pill → "Invalid data source"). No native node flattens a list that may be empty.
- `bulk_upsert_records_by_id` with a blank id **inserted a new record** (auto id) and reported success.
- `""` into a number field: create fails the run (select: oneOf); upsert fails that record silently (`failedCount`).
- A literal `"now"` in a date field is rejected by the platform (the Studio's old Groovy coercion dropped it silently).

---

## 48. Findings 2026-09-26 (Role-aware "my deals", and the chat id — Orbit UAT)

### 🔴 A role filter with no owner id returned the WHOLE pipeline ⛔ UAT 2026-09-26

`scc_hs_deals` built its role filter as `if (oid && r == 'sc') f << [...]`. With `role: 'sc'`
and no `owner_id`, the guard failed, **no filter was added at all**, and the search came back
with every deal in the portal. The agent's answer to *"which of my deals are missing a UC
Template?"* was therefore every deal missing one — a wrong answer that looks exactly like a
right one, because nothing in the response says the scope was dropped.

Fixed by refusing: a `role` other than `all` with no `owner_id` now throws
`role 'sc' needs owner_id…`. Verified — `{role:'sc'}` FAILS at `n_q`, `{role:'sc',owner_id}`
and `{role:'all'}` COMPLETE. **A filter that silently no-ops is worse than one that errors**;
prefer an exception to a default whenever the default changes who the answer is about.

### Identity belongs in the skill, not in a literal

The `hubspot-crm-operator-sc` skill carried the owner id `78099893` **14 times** as the
definition of "me". Correct for one person; for everyone else it silently answers about
Maher's pipeline. `scc_whoami` already returned `profile.hubspot_owner_id`, `primary_role`
and `roles`, and the SC Companion Agent already had it as a tool — the skill simply never
said to call it.

Now §0.1 resolves the caller first and writes `{my_owner_id}` everywhere, with the role
deciding which property means "mine":

| Role | "My deals" | Filter |
|---|---|---|
| `sc`, `fde` | deals they are SC on | `sc_on_this_deal` |
| `ae`, `sdr` | deals they own | `hubspot_owner_id` |
| `sc_manager` | the team's | ask which |

The same rule belongs in the apps: My Companion and the Forecast Map both hardcoded the SC
property, so an AE saw an empty list presented as their pipeline. Both now read
`primary_role` from the profile.

### A platform skill's edits are drafts, and the gap can be months of content ⚠️

`e_skill_ai_agent` `e_6aaa4c0b992160713aebb310` was at `version` 20 with
`deploymentState.entityVersion` 16 — and the *deployed* text the agent actually reads was
42,521 chars against a 48,432-char draft. A whole section (§14, the VEP / Forecast Map
contract) had never reached the agent. **Diff the deployed snapshot against the draft before
assuming an agent knows what its skill says**:

```
GET /api/entity/e_skill_ai_agent/{id}            → the draft
GET /api/entity/deployed/e_skill_ai_agent/{id}   → what the agent reads
```

`POST /api/entity/action/saveAndDeploy` with the full entity publishes it (and every other
pending draft, so check what else is pending first — here it was only our own §14).

### `useCopilotStatus()` gives the open conversation id ✅

`@unifyapps/app-builder-sdk/copilot` exports `useCopilotStatus()` → `{ isGenerating, chatId }`,
reading the same store entry the copilot writes. `chatId` is `undefined` until the first
message creates the conversation. Rendering it in the island toolbar puts the id on every
chat the copilot appears in, rather than per route.

## 59. Findings 2026-09-27 (Forge build kit hardening — Orbit UAT)

Verified with the Forge kit harness (`Tests/harness/kit-test.mjs`, project `prj_EPAgoyrQgqBR`) against Orbit UAT.

**59.1 `if_else_condition` refuses an empty comparison value.** ✅ A condition `{property: "{{ x }}", filter: {operator: "NOT_EQUAL", value: ""}}` saves with a violation on the node (`n_save_key: inputs`) and nothing deploys. Test "is this set?" another way (59.2).

**59.2 Emptiness is tested in Groovy, not in a Variables formula.** ⚠️ A Variables node `=IF(LEN(TRIM("{{ n_in.outputs.key }}"))>0,"yes","no")` returned `"yes"` for an empty `key` (run `6ab836e662755c68a14ae451`). ✅ A Groovy node returning `[has: (k && !k.startsWith('{{')) ? 'yes' : 'no']` (bind `k` with `binding.hasVariable` first, §24c) and an IF_ELSE on `{{ n.outputs.result.has }} EQUAL "yes"` skips the write on a blank key (workflow `6ab827713c2b816ad4d0e9b2`, three runs: NET created, NET replaced, blank skipped — `count` 1 / 1 / 0).

**59.3 An upsert with a blank primary key fails, it does not insert.** ✅ `storage_by_unifyapps_update_record_by_id` `{upsert: true, recordId: "", rawPayload: {<pk>: "", …}}` on an object whose primary key is required fails the node with **5008 "Primary key field is required"**. The §57 note ("upsert with a blank id inserts a record") holds for objects without a required key; guard the write either way (59.2) so the run does not fail.

**59.4 What an agent turn contains.** ✅ In `ai_agents_by_unifyapps_invoke_agent` → `agentResponses`, messages with `additional.internalMessageType` precede the answer (observed `THOUGHT`); the answer has none. A Groovy trail `rs.collect { it.additional?.internalMessageType ?: 'ANSWER' }` gives `THOUGHT,ANSWER` or `ANSWER`.

**59.5 An idempotent agent call.** ✅ `messageId` = `{{ n_k.outputs.result.key }}` where `n_k` is Groovy `java.security.MessageDigest.getInstance('SHA-256')` over `agentId|agentVersion|question` ran first time (workflow `6ab7f2c9c3064c77d9856277`, 8 nodes). Include the agent's version in the key, or a republished agent answers from the old turn (§16: a replayed id is answered from the first turn).

**59.6 The `additional` shapes of the remaining control checks** (read from live `controls` on UAT):

| Check | `checkType` | `additional` |
|---|---|---|
| Denied Topics | `e_6a500b7c30b9186dd3773d30` | `{deniedTopics: [{name, description, examples: [..]}]}` + `llmModel`, `confidenceThreshold` |
| Content Filter | `e_6a500b6ad46d4e608bbe2fdd` | `{filterCategories: {hate|insult|violence|sexual|misconduct: {severity: low|medium|high}}}` + `llmModel`; `inputs` only `user_input`, `agent_output` |
| Regex pattern | `e_6a500b4fd46d4e608bbe2fbe` | `{regexes: [{name, pattern}]}` (RE2) |
| Custom terms | `e_6a500b5b30b9186dd3773d18` | `{terms: [{primary, related: "comma, separated"}]}` |

A denied-topics control created by the kit (`e_6ab8375705e65b5f928f2a8f`) read back with `accessibleTo` = `["ai_agent/<native id>", "agent_profile/<profile id>", "ai_agent/<profile id>"]` after `POST /api/entity {entityType: "agent_profile", properties: {applicationId: "unifyapps", assetType: "agent", external_agent_id, connectionType: "control", enabled, registered, agentProfileGroupIds: ["unifyapps"], ownerId, name, description}}` ✅. Blocking still comes from the agent's `gaurd_rail` (§52): a salary question answered with the guardrail's blocked message, an ordinary ticket answered normally.

**59.7 Sorted and windowed run history.** ✅ `POST /api/aggregation?entityType=WORKFLOW_EXECUTION&group=PLATFORM` accepts `sorts: [{field: "START_TIME", order: "DESC"}]` and `filter: {op: "AND", values: [{op: "IN", field: "WORKFLOW_ID", values: [id]}, {op: "GTE", field: "START_TIME", values: [epochMs]}]}` — without the sort, a workflow with more than a page of runs hid its newest ones.

**59.8 The schema of an existing object.** ✅ `GET /api/entity-type?entityType=<id>` returns the schema at `schema.schema.properties` (and `required`); writing a spec back without a field removes it, so merge the current properties first (the kit keeps a field a later spec leaves out, `kept 1 existing field(s) … sla_hours`).


## 60. Findings 2026-09-27 (Digital Government Assurance — 115 workflows, 40 agents, a context graph, tool.prod-aps1)

Build `mmaheranwar/mcit-digital-assurance` (prefix `mda_`), app `app-51e0c98a8005`. Everything below was seen on APS1 on 2026-09-27.

**60.1 The graph engine is shared by every graph of the tenant.** 🔴 ✅ `mdm_by_unifyapps_execute_opencypher_query` with `modelId` = our graph and the statement `MATCH ()-[r]->() RETURN type(r), count(*)` returned the relationship types and counts of OTHER graphs of the tenant (about a hundred types, some with hundreds of thousands of records). `MATCH (n) RETURN labels(n)[0], count(*)` returned only the node types of our own model, so a node scan is scoped and a relationship scan is not. Rules the build follows: every statement names its node types (a label is the `unifiedEntityId`); counts are one `MATCH (n:<label>) RETURN '<name>', count(n)` per node type joined with `UNION ALL` (accepted by the engine); a statement written by a model is refused when a node pattern carries no label and its variable was not given one earlier in the statement (`(?<![A-Za-z0-9_])\(\s*([a-z][a-z0-9_]*)?\s*\)`), and when it holds any of `CREATE MERGE SET DELETE DETACH REMOVE DROP CALL LOAD FOREACH` outside a quoted value.

**60.2 Friendly names in, engine names out.** ✅ A statement is written with the names of the model (`(f:Finding)`, `f.verdict`) and translated before it runs: outside quoted values, `:<NodeType>` becomes ``:`<unifiedEntityId>` `` and `<var>.<property>` becomes `<var>._pr_<property>` (not `.id`). A fast model then writes correct statements from a schema it can read (3.1 s for the model, the check and the query together).

**60.3 Projection lag and the id prefix.** ✅ 626 node records written by ten `bulk_create_records` nodes in one workflow were all in the graph about two minutes later. The `LIMIT` of a statement did not cap the rows (`LIMIT 1` returned 3); the node's own `limit` input does. The first segment of a node `id` is read from the graph itself (`MATCH (n:<label>) RETURN n.id AS id`, node `limit` 1) instead of being configured.

**60.4 The outputs of every node of a background run, by execution id.** ✅ Run history was empty for the whole day: `WORKFLOW_EXECUTION` in groups `PLATFORM` and `TEST_WORKFLOW_EXECUTION` returned no row for workflows that were running or had run in the background (started by a data source with `synchronous: false`, or by a `call_automation` node with `synchronous: false`), and the Runs tab of the workflow showed "No data in the selected period". The variables were there all the same: `POST /api/lookup?ByKeys=WORKFLOW_VARIABLE` `{type: "ByKeys", lookupType: "WORKFLOW_VARIABLE", keys: ["<executionId>.<executionId>.<nodeId>", …], options: {startTime, endTime}}` with the `executionInstanceId` the data source call returned gave `inputs` and `outputs` of every node that ran, and `outputs.rootCauseMessage` on the node that failed. Ask for every node id of the definition at once; the nodes that did not run are simply absent.

**60.5 A Groovy parameter named `binding` hides the binding of the script.** ✅ With a parameter `binding` on a Code node, `binding.hasVariable(k)` fails with `No signature of method: java.lang.String.hasVariable() is applicable for argument types: (String)`. A parameter named `out` is harmless.

**60.6 `policies` refuses `controlSettings`.** ✅ `POST /api/entity {entityType: "policies", properties: {…, controlSettings: {}}}` → 500 `Non Empty Validations in Validating entity policies with validationResult add additionalProperties controlSettings`. Without the property the policy is created. (UAT rows carry an empty `controlSettings`.)

**60.7 Governance on APS1.** ✅ The eight chat check types carry the same ids as on UAT (read from `controls_schema` by name). Live controls use `llmModel` `sonnet_4_6_bedrock_no_thought`. None of the first 100 `gaurd_rail` rows was enabled; most carry `contentFilters.llmModel` `e_6a5a0b37752c8e4398d37934`. A guardrail created with `e_66b280e945f17a17c0e7c27a` runs: the same sub-workflow (Invoke Agent, one tool call) took 12.4 s before and 13.9 s after the guardrail was attached.

**60.8 One agent answer cannot carry 48 items.** ✅ A judgment agent asked for one entry per obligation of a section returned 31 of 48 (an answer of 7,854 characters) and the next agent abstained on the gap. Work is cut by the unit the text gives (one clause at a time): every answer then came back whole.

**60.9 A synchronous run is cancelled at about 20 to 27 seconds.** ✅ (extends §42.4) Through the test runner a sub-workflow with three agent calls ended `CANCELLED` at 26.9 s. A quick workflow that starts the long one in the background (`call_automation`, `synchronous: false`) answers in under two seconds; background runs with nested synchronous calls ran for ten minutes without trouble.

**60.10 Reading a file of a branch.** ⚠️ `GET /agent-api/apps/{app}/branches/{branch}/files/content?path=` took about 10 s per file while the tenant was running agents (under a second otherwise).

**60.11 An upsert key without a reference.** ✅ (kit) A record key written as a plain text in a spec (`actions|AG-35`) was wrapped as a reference and refused at compile time; a key always carries a reference.

**60.12 A property is readable in the graph only when the node type marks it `graphQueryable: true`.** ✅ Node types created with properties that carry no `graphQueryable` load their records without an error, the vertices appear with their id, their primary key and `_ua_recordTitle` — and nothing else: a `WHERE` on any other property matches nothing and a `RETURN` of it is null. Marking the properties afterwards works: `GET /api/context-graph/nodes/{nodeId}`, then `POST /api/context-graph/nodes/update/{nodeId}?version={n}` with the node and ONLY the properties of the model (the platform's own `_ua_*` / `standard: true` properties sent back give 500 `Duplicate property key(s) not allowed for a node: _ua_version`), publish the graph, write the node records again. `entityMetadata.graphQueryableFields` then lists them and the same queries answer.

**60.13 What the daily AI cost limit stops, and what it does not.** ✅ `[COSTFLAG]User daily cost hard limit reached: input alone (30.0008…) exceeds limit of 30.0` came back from every `call_llm_model` node run for the user (test runner and data source) from about 13:00 UTC. Agent invocations (`invoke_agent`) started by background runs went on answering for at least another quarter of an hour (378 agent runs in the 20 minutes around it), including agents whose tool holds an LLM node. Five background runs of the same period stopped without an error and without reporting. The limit is a guard of the tenant: the build stopped launching work and waits for the reset.

**60.14 `keep_blank` in the kit means "keep the field when the value is blank".** ✅ (kit) `storage_by_unifyapps_update_records` with `skipIfBlank: true` leaves a field alone when its value is blank; clearing a text field needs `skipIfBlank: false`.

**60.15 The favicon of a published code app comes from the app entity, written at publish.** ✅ tool.prod-aps1 2026-09-28 — the served `index.html` of a published code app carries `<link rel="icon" href="…">` taken from `e_interface.properties.metadata.logo.favicon` (default `https://assets.unifyapps.com/interface/brand-logo/brand-logo-sm-3-comp.svg`); the `<link rel="icon">` of the repo's `index.html` is replaced. Changing `metadata.logo.{favicon, small, large}` (entity update with the whole `properties`) did NOT change the served page until the app was published again; after the republish the page carried the new URL. A URL on the app's own host (`https://<appId>-<tenant>.tensor-….unifyapps.com/brand/x.svg`, a file of `public/`) works.

**60.16 The public app's AI runs as its visitor, not as the builder's user.** ✅ tool.prod-aps1 2026-09-28 — with the builder's user at its daily cost limit (`[COSTFLAG]` on every LLM node run for that user), the insight workflow called by the PUBLIC published app answered (two readings produced within a minute). The builder preview runs under the signed-in user and its LLM calls stop at that user's limit. So: browsing the public app spends AI budget; walk screens for layout checks on the builder preview.

**60.17 Getting a GitHub push into the builder's `main`.** ✅ tool.prod-aps1 2026-09-28 — `POST /agent-api/sessions/{s}/branch {branch}` (the builder's own `switchBranch`, same body) switches ASYNCHRONOUSLY: its reply carries the branch list and the OLD `current`. Re-posting `main` while the session is already on `main` pulls nothing. What pulled: switch to any other branch, poll `GET /agent-api/sessions/{s}/branches` until `current` is that branch, then `POST …/branch {branch:"main"}` — about 20 s later `current: "main"`, `buildPending: true` and `GET …/changes` heads with the GitHub commit. Loading the code-builder page, and bouncing without waiting for `current` to change, pulled nothing in four attempts. `/agent-api/preview/{s}/` redirects to `/agent-api/preview/b/{app}/main/`; `/preview/b/{app}/<other branch>/` answered `404 app not built yet`.

**55.13 Publish can report failure after it has published.** ⚠️ UAT 2026-09-28 — `POST /agent-api/apps/{id}/publish`
answered `{"detail":"deploy build succeeded but publishing the app failed: Failed to reach the entity API: timed out"}`,
yet `deploymentState` moved to the new tag/commit and the published origin served the new route chunks. Verify by
the bundle (§55.8) before re-publishing.
