---
name: unifyapps-connectors
description: Know what UnifyApps can connect to and what each connector can actually do — the full connector catalogue (983 application connectors + 91 platform nodes, verified on UAT), every action, trigger and agent-tool a connector exposes, its connection/auth form, and which connections already exist in the tenant. Use whenever someone asks "can UnifyApps connect to X", "what can it do with X / which actions does it have", "do we already have a connection for X", when picking a connector or action for a workflow step, agent tool, app data source or context-graph source, or when the catalogue needs refreshing because the platform added new connectors.
metadata:
  author: Maher
---

# UnifyApps connectors — what exists, what it can do, and how to keep learning

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

Every other UnifyApps skill (`unifyapps-builder`, `unifyapps-apps`, `unifyapps-config-apps`,
`unifyapps-context-graph`) eventually asks the same question: *which connector do I use, and what
can it do?* This skill is the answer, plus the refresh loop that keeps the answer current.

Everything here was harvested live from **`orbit.uat.unifyapps.com` on 2026-09-23** through the
platform's own APIs. Counts are a snapshot; the endpoints are the truth.

## Three words that get confused — get them right first

| Term | What it is | Where it lives | Identified by |
|---|---|---|---|
| **Connector** (a.k.a. *node*, *app*, *application*) | The integration itself: Slack, Oracle DB, Snowflake. Ships with the platform, or is built with the Connectors SDK. | `GET /api/workflow-builder/nodes` | `appName` — a lower_snake string (`slack`, `oracledb`, `microsoft_sharepoint`) |
| **Action / trigger / agent-tool** (*resource*) | One thing a connector can do: `slack_post_message_in_channel`. | `GET /api/workflow-builder/node/{appName}/resources` | `resourceName` + `resourceVersion` |
| **Connection** | One *authenticated instance* of a connector — this Slack workspace, that Oracle server. Holds the secrets. | `POST /api/aggregation?entityType=Connection` | 24-hex `id`, used as `context.connectionId` |

A workflow step, an agent tool, an app data source and a context-graph source all point at the
same triple: **`{appName, resourceName, resourceVersion}` plus a `connectionId`.**

## Answer the four questions

### 1. "Can UnifyApps connect to X?"

Grep the shipped index — no login needed:

```bash
grep -i "hubspot\|salesforce" ${CLAUDE_PLUGIN_ROOT}/skills/unifyapps-connectors/catalogue/connectors-index.tsv
```

983 application connectors are listed in `catalogue/connectors-index.tsv`
(`appName<TAB>displayName`), and the 91 built-in platform nodes — code, PDF, storage, agents,
control flow — in `catalogue/platform-nodes.tsv`. If it is in neither file, check for a **custom**
connector in this tenant (they are tenant-local, see below) and refresh the catalogue before
telling anyone "no".

If X genuinely has no connector, UnifyApps can still call it: **`custom_http_endpoint`** (ad-hoc
REST/GraphQL/SOAP, no connection needed), **`custom_http_application`** (the same over a saved,
authenticated base URL), or a purpose-built connector via the **Connectors SDK** (API-SPEC §25).

### 2. "What can it do?"

```http
GET /api/workflow-builder/node/{appName}/resources
```

Returns every action, trigger and agent-tool with the `version` you must put in
`context.resourceVersion`. Deep dives for 28 connectors — the ones this tenant uses most, plus the
platform core — are written up in `catalogue/actions/`; read one of those before making a call. For
the input/output contract of a single action:

```http
GET /api/workflow-builder/node/{appName}/resource/{resourceName}
```

`references/capability-patterns.md` explains how to read what comes back — naming conventions, the
three resource types, dynamic schemas, batch vs single, the trigger families.

### 3. "Do we already have a connection for X?"

Never pull `GET /api/connection` (7,700+ rows, no server-side filter, and it returns secrets). Use
the aggregation the Connections Manager itself uses:

```json
POST /api/aggregation?entityType=Connection&group=STANDARD
{ "entityType": "Connection", "group": "STANDARD", "includeTotalHits": true,
  "filter": { "op": "AND", "values": [
      { "field": "appName", "op": "EQUAL", "values": ["github"] },
      { "field": "active",  "op": "EQUAL", "values": [true] } ] },
  "projections": [{"name":"id"},{"name":"name"},{"name":"appName"},{"name":"oUId"},{"name":"cTm"}],
  "sorts": [{"field":"cTm","order":"DESC"}], "page": { "limit": 30, "offset": 0 } }
```

`catalogue/connections-uat-2026-09-23.tsv` is a snapshot of which connectors actually had
connections on UAT, with counts — a good proxy for what this tenant really runs on:
Ontology 3296 · Gmail 965 · Slack 574 · Google Sheets 392 · Google Drive 285 · Salesforce 111 ·
Outlook 105 · OpenAI 92 · Snowflake 74 · GitHub 73.

### 4. "How do I create one?"

`references/connections.md` — the auth form (`GET /api/applications/{appName}`), test
(`POST /api/connection/input/test`), create (`POST /api/connection/input`), and the hard rule:
**OAuth connectors need the user to click Authorize in the UI.** Never type a password or complete
an SSO prompt on someone's behalf, and never read `connection.userInput` into chat — it returns
secrets in clear.

## Keep learning — the refresh loop

The catalogue is a snapshot; the platform ships new connectors constantly. Refresh it whenever a
connector you expect is missing, before answering "UnifyApps has no connector for X", or on any
cadence the user asks for.

1. **Harvest** — sign in (`references/connect-and-call.md`), then run `scripts/harvest.js` in the
   browser's JavaScript tool, same-origin on the tenant. It prints a TSV snapshot (`appName`,
   `displayName`, kind, connection count, resource count) plus a summary. Non-SSO accounts can use
   `scripts/ua_connectors.py` from a terminal instead.
2. **Diff and merge** — save the output and run:
   ```bash
   python ${CLAUDE_PLUGIN_ROOT}/skills/unifyapps-connectors/scripts/refresh_catalogue.py /path/to/snapshot.tsv
   ```
   It reports **added / removed / renamed** connectors, rewrites `catalogue/connectors-index.tsv`
   and `catalogue/platform-nodes.tsv`, and appends a dated entry to `catalogue/CHANGELOG.md`.
   `--dry-run` reports without writing.
3. **Deep-dive what matters** — for each newly added connector the user cares about, pull its
   `/resources`, skim the action names, and write `catalogue/actions/<appName>.md` in the same
   shape as the existing files. Do not deep-dive all 983; do it on demand and let the catalogue
   grow.
4. **Record what you learned** — anything new about *how the platform behaves* (not just which
   connectors exist) goes in `API-SPEC.md` at the repo root, with an evidence marker, tenant and
   date. That is the master record; this skill's references are the readable summary.

## Custom connectors are tenant-local

140 of the 1,214 nodes on UAT are **custom** (`custom: true`), built with the Connectors SDK. Their
`name` is a 24-hex id, not a readable slug — `6824756fc286127c2ccfa630` displays as *14.1Outlook* —
so they are deliberately absent from the shipped index, which covers built-ins only. Enumerate them
per tenant:

```js
(await (await fetch('/api/workflow-builder/nodes?fields=name,displayName,custom',
  {credentials:'include'})).json()).objects.filter(o => o.custom)
```

A published SDK connector can also **add actions to a built-in connector**: `slack`'s resource list
contains entries like `slack:698dc5887da7f40d47ff1731` alongside the standard
`slack_post_message_in_channel`. Treat a colon in a `resourceName` as "custom action, this tenant
only" — see `references/capability-patterns.md`.

## What is in this skill

| Path | Contents |
|---|---|
| `references/connect-and-call.md` | **Sign in with your own account, find connections, API conventions** |
| `references/discovery-api.md` | Every endpoint that answers "what exists and what can it do", with verified responses |
| `references/capability-patterns.md` | How to read a connector's capabilities: naming, resource types, triggers, dynamic schemas, versions |
| `references/connections.md` | Auth forms, creating and testing connections, OAuth, per-user runtime connections, safety |
| `references/building-custom-connectors.md` | **Build a connector over REST** when none exists: refreshable token auth, action templates, what cannot work |
| `catalogue/connectors-index.tsv` | **983 application connectors** — `appName<TAB>displayName` |
| `catalogue/platform-nodes.tsv` | **91 built-in platform nodes** — code, files, PDF, storage, agents, control flow |
| `catalogue/connections-uat-2026-09-23.tsv` | Which connectors had connections on UAT, with counts and resource counts |
| `catalogue/actions/*.md` | Per-connector capability deep dives (29 connectors, incl. `hubspot.md`) |
| `catalogue/CHANGELOG.md` | What each refresh added or removed |
| `scripts/harvest.js` | Same-origin browser harvester → TSV snapshot |
| `scripts/ua_connectors.py` | Terminal harvester for local (non-SSO) accounts |
| `scripts/refresh_catalogue.py` | Diff a snapshot against the catalogue, merge, changelog |

## Rules that stop the usual mistakes

1. **Never hardcode `resourceVersion`.** It drifts (`oracledb_execute_sql` 16522 → 16523). Resolve
   it from `/resources` at build time, every time.
2. **`appName` is not always the product name.** Google Sheets is `gsheets`, Google Calendar is
   `gcalendar`, Zoho CRM is `zoho`, SQL Server is `sqlserver`, Ontology/MDM is `mdm_by_unifyapps`.
   Grep the index; do not guess.
3. **`custom_http_endpoint` is not `custom_http_application`.** The first is an internal node for
   ad-hoc HTTP with no connection; the second is a connector with a saved, authenticated base URL
   (45 connections on UAT). Picking the wrong one is the most common HTTP mistake.
4. **A connector existing is not a connection existing.** 983 connectors ship; only ~304 had any
   connection on UAT, and most of those had fewer than five. Check before you promise.
5. **Never use, edit or read the secrets of a connection you do not own** — and never one whose
   name contains *DND* or *DONT TOUCH*. Prefer connections owned by the user (`oUId`).
6. **OAuth connectors need a human.** Create the connection in the UI and let the user click
   Authorize. Token, basic-auth and database connectors can be created over the API.
7. **Execute one action without building anything:** `POST /api/test-workflow/initiate-test/{id}` of
   a workflow you own, with an inline `workflowDefinition` (START → the connector node → STOP) whose
   `resourceVersion` you just resolved. The inline graph runs; the saved definition is untouched;
   read the node output back with `TEST_WORKFLOW_VARIABLE` (verified UAT 2026-09-25, API-SPEC §46.4).
   A record-level 404 from the SaaS (e.g. `hubspot_get_owner_by_id` on a deactivated owner) fails
   the node and the run — prefer batch reads and map ids client-side.
