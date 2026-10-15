# Discovery API — everything that answers "what exists, and what can it do"

Verified on `orbit.uat.unifyapps.com`, 2026-09-23, with a browser session (see
`connect-and-call.md`). Evidence markers follow `API-SPEC.md`: ✅ verified · 👁 observed ·
⛔ does not work.

---

## 1. The connector catalogue

### `GET /api/workflow-builder/nodes` ✅

Every connector and platform node the tenant can use. This is the master list.

**Query params**

| Param | Notes |
|---|---|
| `fields` | comma list: `name,displayName,iconUrl,tags,type,needsAuthentication,custom,hidden,standard` |
| `resourceType` | e.g. `ACTION` 👁 |
| `name` | ⛔ ignored — always returns the full list. Filter client-side. |

**Response**

```json
{ "objects": [ { "id": "6a1b657d7dc7176bfe64f52e", "name": "formbuilder_123",
                 "displayName": "123FormBuilder", "type": "ACTION", "tags": ["Applications"],
                 "needsAuthentication": true, "custom": false, "hidden": false,
                 "standard": false, "iconUrl": "https://assets.unifyapps.com/images/app-icons/formbuilder.svg",
                 "lcName": "formbuilder_123", "version": 0, "hasOverriddenDetails": false,
                 "deleted": false } ],
  "totalHits": 1214, "hasMore": false, "type": "HITS" }
```

**What the fields mean for discovery**

| Field | Use |
|---|---|
| `name` | the `appName` you put in `context.appName`. **This is the key to everything else.** |
| `displayName` | what the UI shows; what a human will say to you |
| `tags` | `Applications` (1,128) = third-party connector · `Internal` (91) = platform node · plus a few strays (`Helpers`, `On Prem`, `AI`, `Document AI`, `Image Processing`, `Design`, `Commerce`, `WorkflowAgent`) |
| `custom` | `true` = built in this tenant with the Connectors SDK; `name` is a 24-hex id |
| `needsAuthentication` | `true` = needs a connection (1,064 of 1,214); `false` = usable bare (control flow, code, files) |
| `type` | `ACTION` for 1,203 of them; the rest are control-flow nodes: `IF_ELSE`, `LOOP` ×2, `BRANCH`, `BRANCH_CONDITION`, `BREAK`, `CONTINUE`, `DELAY`, `SCOPE`, `STOP`, `CALL_WORKFLOW` |

**UAT snapshot 2026-09-23** — 1,214 nodes: 1,074 built-in (983 application + 91 platform) and
140 custom. 1 hidden, 0 `standard`.

### `GET /api/workflow-builder/find-nodes-with-connections` ✅

Same `fields` param. Returns a **plain JSON array** (not the `{objects}` envelope) of the
connectors that have at least one connection configured in this tenant — **304 on UAT**. The
fastest way to go from "983 possible" to "what this tenant actually uses".

### `GET /api/workflow-builder/node/{appName}` ✅

One connector's metadata plus a large `grants` block. Rarely needed; `/nodes` already carries what
discovery wants.

---

## 2. A connector's capabilities

### `GET /api/workflow-builder/node/{appName}/resources` ✅

**The single most useful call in this skill.** Every action, trigger and agent-tool.

```json
{ "objects": [ { "name": "oracledb_execute_sql", "displayName": "Execute a SQL statement",
                 "version": 16523, "nodeName": "oracledb", "resourceType": "ACTION",
                 "async": false, "hidden": false, "custom": false, "standard": false,
                 "passNodeSchema": false, "nodeTestDisabled": false, "description": "..." } ],
  "hasMore": false }
```

| Field | Use |
|---|---|
| `name` | the `resourceName` for `context.resourceName` |
| `version` | the value for `context.resourceVersion` — **read it at build time, never hardcode** |
| `resourceType` | `ACTION` · `TRIGGER` (can start a workflow) · `AGENT_TOOL` (pre-built agent tool) |
| `async` | the step returns before the work finishes; poll or use a callback |
| `description` | one line of intent, usually enough to choose between two similar actions |

**Verified resource-type mixes (UAT 2026-09-23)**

| Connector | ACTION | TRIGGER | AGENT_TOOL |
|---|---|---|---|
| `hubspot` | 100 | 6 | — |
| `jira` | 78 | 13 | — |
| `salesforce` | 65 | 11 | — |
| `github` | 44 | 12 | 2 |
| `slack` | 44 | 2 | — |
| `gmail` | 25 | 8 | — |
| `oracledb` | 17 | 6 | — |
| `custom_http_endpoint` | 7 | — | — |

Resource counts range from 1 to 170 (`workday`, `keka`). Sizeable ones worth knowing:
`netsuite` 146 · `snowflake` 145 · `microsoft_teams` 136 · `genesys` 112 · `hubspot` 106 ·
`databricks_rest` 105 · `jira` 91 · `trello` 83.

### `GET /api/workflow-builder/node/{appName}/resource/{resourceName}` ✅

The input/output contract for one action — ~15 KB typical. Read this before writing a step's
`inputs`.

```json
{ "name": "oracledb_execute_sql", "version": 16523, "resourceType": "ACTION",
  "input":  { "type": "SCHEMA_AND_LAYOUT", "dynamic": false,
              "schema": { "type": "object", "required": ["sql"], "properties": {}, "definitions": {} },
              "layout": { "ui:order": [], "sql": { "ui:widget": "" } } },
  "output": { "type": "SCHEMA_AND_LAYOUT", "schema": { "type": "object", "properties": {} } },
  "groupDetails": {} }
```

- Generate `inputs` against `input.schema`. `input.layout` is UI-only — ignore it.
- `input.dynamic: true` means the schema depends on a runtime lookup (Salesforce objects,
  picklists). See `capability-patterns.md`.
- Some outputs are `SCHEMA_AND_LAYOUT` with no properties (e.g. `callables`) — those are derived
  from the node's own config at runtime.

### `POST /api/workflow-builder/search-nodes-and-resources` 👁

Returns `{nodeBuilders: {}, nodeBuilderResources: {}}` — the builder's search box. Useful when you
want one call across both levels instead of a catalogue scan; the response shape has not been
pinned down, so prefer the two GETs above.

---

## 3. What a connection for this connector looks like

### `GET /api/applications/{appName}?fields=authSpec,iconUrl,displayName,name,refreshable,includeOptions` ✅

The connection form: a `SCHEMA_AND_LAYOUT` JSON Schema at `authSpec.input`, plus
`authSpec.externalDocUrl` — the public docs page for that connector, which is the best prose
description of its capabilities that exists.

Verified shapes (2026-09-23):

| `appName` | `refreshable` | required | input properties |
|---|---|---|---|
| `slack` | true | name, authType | name, authType, revokeTokenOnDelete |
| `github` | true | name, authType | name, connectionType, authType, hostname |
| `hubspot` | true | name, authType | name, authType |
| `gmail` | false | name, authType | name, authType |
| `openai` | false | domain, name, authType, authToken | name, authType, domain, authToken, requestTimeoutInSecs |
| `snowflake` | true | name, authType, domain, databaseName, schemaName, warehouseName | + connectionPoolProperties |
| `sftp` | false | name, authType, host, port, username | + serverFingerprint |
| `oracledb` | false | — | name, authType, databaseHost, databasePort, username, password, isCDBDatabase, databaseName, serviceName, schemaName, driverType, connectionType, ssl, connectionPoolProperties |
| `custom_http_application` | false | name, baseUrl, authType, connectionType | + requestType, headersList, sslVerify, requestTimeoutInSecs |
| `mcp_servers` | false | name, isSSESupported, authType | + endpoint, headersList |

- `refreshable: true` ≈ OAuth with a refresh token — **the user must click Authorize in the UI**.
- `authType` is usually **not** an inline enum; its options come from
  `POST /api/lookup?ByQuery=CUSTOMER_AUTH` with `{options: {appName, auths: [{type, label}]}}` 👁.
  A few connectors do inline it: `openai` → `["TOKEN","COMPLIANCE"]`,
  `mcp_servers` → `["TOKEN","NO_AUTH","BASIC","OAUTH","OAUTH_DCR","CREDENTIALS"]`.
- ⚠️ Some `appName`s return **200 with an empty body** here (`custom_http_endpoint` — it is an
  internal node and has no connection form). Guard your JSON parse.

**Docs URL pattern** — `https://www.unifyapps.com/docs/unify-integrations/{slug}`. The slug is
usually the `appName` (`slack`, `github`, `snowflake`, `mcp_servers`) but not always
(`openai` → `open-ai`). Take it from `authSpec.externalDocUrl` rather than building it.

---

## 4. Which connections exist

### `POST /api/aggregation?entityType=Connection&group=STANDARD` ✅

The only sane way to search connections. Filters server-side on `appName`, `active`, `oUId`,
`name`, `tags`; ~50 ms; returns **no secrets**. Body and example in `SKILL.md` §3. Set
`includeTotalHits: true` and `page.limit: 1` when you only want a count.

### `POST /api/lookup?ByQuery=CONNECTION` ✅

Text search by name, optionally scoped to an app:

```json
{ "type": "ByQuery", "lookupType": "CONNECTION", "query": "Maher", "fields": ["name"],
  "options": { "appName": "mdm_by_unifyapps" }, "page": { "limit": 20, "offset": 0 } }
```

### `GET /api/connection` ⛔ for discovery

Returns **every** connection in the tenant (7,775+ on UAT) with **`userInput` secrets in clear**,
ignores every filter param (`appName`, `app`, `appNames`, `filter`, `active`), and is slow enough
to blow a 45 s timeout. Do not call it. `GET /api/connection/{id}` is fine for one known
connection, but it also returns secrets — read it only when you must check a host or service name,
and redact before showing anything.

---

## 5. Custom connectors (Connectors SDK)

Aggregation entity type `ConnectorDefinition`, group `STANDARD`; UI at `/connectors/custom`. Full
build/publish API in `API-SPEC.md` §25. For discovery you need only two facts:

- A published custom connector appears in `/api/workflow-builder/nodes` with `custom: true` and a
  24-hex `name`.
- Its actions appear in `GET /api/workflow-builder/node/{defId}/resources` as `{defId}:{actionId}`,
  and can also be attached to a built-in connector's resource list (see `capability-patterns.md`).

---

## 6. The same catalogue seen from other surfaces

The connector list is not workflow-only. The same `appName` drives:

| Surface | Call | Skill |
|---|---|---|
| App data sources | `e_data_source` with `context.{appName, resourceName, connectionId}` | `unifyapps-config-apps` |
| Agent tools / capabilities | `e_action_ai_agent` with `context.{appName, resourceName}` | `unifyapps-builder` |
| Context-graph sources | `GET /api/context-graph/sources/applications/{appName}/objects` — the **objects** a connector exposes for ingestion, and `.../objects/{objectId}/details?connectionId=` for their schema | `unifyapps-context-graph` |

The context-graph objects endpoint is the one place the platform describes a connector's *data
model* rather than its *actions* — worth a look when you need to know what entities a SaaS app
exposes, not just what verbs it supports.
