# Reading a connector's capabilities

How to turn a `/resources` response into a decision, without reading 145 action schemas.
All examples verified on `orbit.uat.unifyapps.com`, 2026-09-23.

---

## 1. The naming convention does most of the work

Almost every resource is `{appName}_{verb}_{object}`:

```
slack_post_message_in_channel      gdrive_upload_files        oracledb_execute_sql
gmail_create_draft_reply           gsheets_update_rows_batch  snowflake_create_warehouse
```

So you can usually **guess the name, then confirm it against `/resources`** instead of reading
every entry. Verbs that recur across connectors:

| Verb family | Typical names | Notes |
|---|---|---|
| Read one | `get_*`, `fetch_*`, `retrieve_*`, `describe_*` | `get_` dominates |
| Read many | `list_*`, `search_*`, `find_*`, `select_*` | `search_` takes a query; `list_` takes filters + paging |
| Write | `create_*`, `add_*`, `insert_*`, `upload_*`, `post_*` | |
| Change | `update_*`, `edit_*`, `replace_*`, `modify_*`, `rename_*`, `move_*` | |
| Write-or-change | `upsert_*`, `merge_*` | the one to prefer for idempotent sync |
| Remove | `delete_*`, `remove_*`, `archive_*`, `clear_*` | |
| Bulk | `*_batch`, `bulk_*`, `*_bulk`, `*_multiple_*` | see §4 |
| Event | `on_*` | always `resourceType: TRIGGER`, see §3 |

**Prefixes are not always the `appName`.** `gsheet_on_new_row_polling` (singular) sits next to
`gsheets_add_row` (plural); `github_tools_*` marks agent tools. Match on `name` from the API, not
on a prefix you assumed.

## 2. Three resource types

| `resourceType` | What it is | Where it can be used |
|---|---|---|
| `ACTION` | a step in the middle of a workflow | workflow node, agent tool, app data source |
| `TRIGGER` | starts a workflow | the workflow's START node only |
| `AGENT_TOOL` | a ready-made tool for an AI agent | agent tool definitions |

`AGENT_TOOL` is rare and worth knowing about — on UAT only `github` shipped any
(`github_tools_get_file_modified_details`, `github_tools_list_collaborators`). When one exists for
your use case, prefer it to hand-wrapping an ACTION in a workflow: it is already shaped for an LLM
to call.

## 3. Trigger families

Triggers come in three flavours; the name tells you which:

| Suffix / shape | Mechanism | Cost and latency |
|---|---|---|
| `*_polling` (`gmail_on_new_email_polling`, `gdrive_on_new_uploaded_file_polling`) | the platform polls on a schedule | latency = poll interval; safe everywhere |
| `*_webhook` / `_realtime` (`gmail_on_new_email_webhook`, `amazon_s3_on_new_file_realtime`) | the source pushes | near-instant; needs the source configured to call UnifyApps |
| plain `on_*` (`github_on_new_or_updated_pr`, `slack_on_new_message`) | connector-managed subscription | usually the one you want |

Database connectors add a CDC-style set — `on_new_event`, `on_update_event`, `on_delete_event`,
`on_new_or_update_event`, `on_event`, plus `on_scheduled_query_search` (run a query on a schedule
and fire per row). Verified identical on `oracledb`, `postgres` and `snowflake`.

Platform triggers live on their own nodes: `webhooks_default`, `schedule_default`,
`callables_from_api`, `callables_from_automation`, `callables_from_interface`.

## 4. Single vs batch — pick batch by default

Most data connectors ship both:

```
oracledb_insert_rows        oracledb_upsert_row          oracledb_select_rows_in_batch
oracledb_upsert_rows_batch  oracledb_update_rows_batch   oracledb_delete_rows_in_batch
gsheets_add_row             gsheets_add_multiple_row     gsheets_update_rows_batch
storage_by_unifyapps_create_record   storage_by_unifyapps_bulk_create_records
```

Inside a loop, a per-row action costs one step execution per row. Where a `*_batch` /
`bulk_*` variant exists, build the array first and call it once.

Also watch for the `_using_custom_sql` pair on every SQL connector: `select_rows_in_batch` takes a
structured filter, `select_rows_using_custom_sql` takes raw SQL, and
`run_long_query_using_custom_sql` is the async variant for queries that outlive the normal step
timeout.

## 5. Versions drift — resolve them, never store them

`version` in `/resources` is what goes in `context.resourceVersion`. It changes when the platform
ships a new revision of an action (`oracledb_execute_sql` moved 16522 → 16523; `if_else_condition`
11 → 204). A stored version will eventually produce a step that will not save or will not run.

Resolve at build time:

```js
const res = await (await fetch(`/api/workflow-builder/node/${app}/resources`,
  {credentials:'include'})).json();
const byName = Object.fromEntries(res.objects.map(r => [r.name, r]));
const v = byName['oracledb_execute_sql'].version;
```

Actions also get superseded rather than replaced: `gsheets_add_row` and `gsheets_add_row_v2`,
`openai_create_transcription` and `openai_create_transcription_v2` both exist. Prefer the highest
`_vN` unless something documents otherwise.

## 6. Dynamic input schemas

`GET /api/workflow-builder/node/{app}/resource/{name}` may return `input.dynamic: true`. That means
the visible fields depend on a runtime lookup — choose a Salesforce object and the field list
changes. The static `input.schema` is then only the outer shell.

Handling it:
- The builder resolves the rest through `POST /api/workflow-builder/lookup/input-schema` and
  friends (📦 — observed in bundles, not yet exercised; see `API-SPEC.md` §19 open question 3).
- Until that is pinned down, the reliable path for a dynamic-schema action is to configure the
  step **once in the UI**, then read the saved workflow definition back and copy the `inputs`
  shape. That is a documented, supported path — not a workaround.

## 7. Custom actions on built-in connectors

A connector's resource list can contain entries whose name is `{defId}:{actionId}`:

```
slack_post_message_in_channel          <- built-in
slack:698dc5887da7f40d47ff1731         <- added in this tenant with the Connectors SDK
```

On UAT, `slack` carried six of these. They behave like any other action, but:

- they exist **only in the tenant that built them** — never put one in a portable artefact, a
  backup that will be restored elsewhere, or a shipped skill;
- their `displayName` is set by whoever built them and may be meaningless;
- `custom: true` on the resource row marks them.

When a workflow you are reading uses one, resolve it through
`GET /api/connector-builder/definition/{defId}` before assuming what it does.

## 8. `needsAuthentication: false` — the nodes that need no connection

91 platform nodes work without any connection, and they are the ones people forget exist. The full
list is `catalogue/platform-nodes.tsv`; the ones that come up constantly:

| Node | Use |
|---|---|
| `code_by_unifyapps` | run Python, JavaScript, Groovy, Java, C#, Playwright inline |
| `custom_http_endpoint` | ad-hoc HTTP: REST, GraphQL, SOAP, multipart, streaming |
| `callables` | call another automation, return a response to an API/interface caller |
| `storage_by_unifyapps` | the tenant's own Objects — records, schema, semantic and federation queries |
| `mdm_by_unifyapps` / `unified_entity_by_unifyapps` / `ecg_by_unifyapps` | Ontology and Context Graph |
| `files_by_unifyapps`, `pdf_by_unifyapps`, `csv_by_unifyapps`, `excel_by_unifyapps`, `ppt_by_unifyapps`, `parquet_by_unifyapps` | file handling |
| `conv_ai_by_unifyapps` | call an LLM, run a prompt, OCR, embeddings, crawl a site |
| `ai_agents_by_unifyapps` | invoke an agent from a workflow |
| `variable_by_unifyapps`, `if_else`, `loop`, `branch`, `delay`, `scope`, `stop` | state and control flow |
| `pii_by_unifyapps`, `encryption_tools_by_unifyapps`, `pgp_by_unifyapps` | redaction, encryption, signing |
| `on_prem_command_by_unifyapps`, `on_prem_files_by_unifyapps`, `on_prem_browser_by_unifyapps` | on-prem agent execution |

Reach for these before building an HTTP call to a public API, and before writing a connector.

## 9. Choosing between near-duplicates

Several products appear more than once because the protocols differ. Pick deliberately:

| Product | Options | Choose |
|---|---|---|
| Salesforce | `salesforce`, `salesforce_soap`, `salesforce_cpq`, `salesforce_marketing_cloud`, `salesforce_communications_cloud` | `salesforce` (REST) unless you need the SOAP-only or product-specific surface |
| NetSuite | `netsuite` (146 actions), `netsuite_soap` (13) | `netsuite` |
| Workday | `workday` (170), `workday_soap` | `workday` |
| SharePoint | `microsoft_sharepoint` (62), `microsoft_sharepoint_graph` (68) | Graph for modern tenants; the classic one for on-prem/legacy sites |
| Databricks | `databricks` (3, JDBC-style), `databricks_rest` (105) | `databricks_rest` for anything beyond running SQL |
| SAP | `sap_odata`, `sap_rfc`, `sap_hana`, `sap_successfactors`, `sap_concur`, `sap_ariba`, `sap_ariba_soap`, `sap_business_one`, `sap_lms` | by the SAP product and protocol, not by the word "SAP" |
| Oracle apps | `oracle_fusion`, `oracle_fusion_cloud`, `oracle_ebusiness_suite`, `oracle_jde`, `oracle_siebel`, `oracle_epm`, `oracledb` | `oracledb` is the *database*; the others are application APIs |
| HTTP | `custom_http_endpoint`, `custom_http_application` | endpoint = ad-hoc, no connection; application = saved authenticated base URL |
| Google | `google_workspace` (58, admin-wide) vs `gmail`/`gdrive`/`gsheets`/`gcalendar`/`gdocs`/`gslides` | the specific one for user data; `google_workspace` for admin operations |

When in doubt, compare resource counts (`/resources`) — the richer surface is nearly always the
maintained one.
