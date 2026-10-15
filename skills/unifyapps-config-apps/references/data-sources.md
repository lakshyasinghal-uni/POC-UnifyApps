# Data sources and connectors

An app never talks to an object, automation or connector directly: every read and write is an
`e_data_source` entity that names **one connector action** (`context`) plus its `inputs`. The page
runtime executes it through `POST /api/workflow/execute/node`. ✅ = executed in CGB Pulse (the sample in `examples/cgb-pulse/`), 2026-09-23.

## Shape

```json
{ "entityType": "e_data_source", "properties": {
  "name": "ds_entities", "type": "APPLICATION",
  "interfaceId": "cgb-pulse", "interfacePageId": "e_global_cgb-pulse", "target": "app",
  "context": { "appName": "storage_by_unifyapps", "resourceName": "storage_by_unifyapps_fetch_records", "resourceVersion": 16417 },
  "inputs": { "object_type": "cgbp_entity", "triggerInputCondition": {}, "numberOfRecordsToFetch": "MULTIPLE",
              "page": {"paginateBy": "OFFSET", "limit": 50}, "sortBy": [{"field": "properties.health_score", "order": "DESC"}], … },
  "dP": [{"p": "inputs.…"}], "dpOn": [{"id": "var_x", "p": ["var_x['value']"]}],
  "advancedOptions": { "runBehaviour": "automatic"|"manual", "refetchOnWindowFocus": false,
                       "timing": {"runQueryOnPageLoad": true, "runQueryPeriodically": false},
                       "queryDisabled": {"type":"filter","payload":{…}}, "retryEnabled": false },
  "options": { "cacheConfig": {}, "transformerConfig": { … } },
  "callbacks": { "successEvents": [{"id","eventType":"onSuccess","action":{…}}], "failureEvents": [...] },
  "outputSchema": { … }, "metadata": {"isManuallyRenamed": true} } }
```

- Global (on `e_global_<appId>`, `target:'app'`) → readable on every page ✅. Page-level → only there.
- `resourceVersion`: resolve with `GET /api/workflow-builder/node/<app>/resource/<resource>` → `.version`
  (`cfg.resourceVersion`) ✅.
- Templated inputs (`"{{ var_x['value'] }}"`) are evaluated in the browser; the server rejects a call
  whose **non-templated** inputs differ from the stored ones (`forbidden datasource : invalid input`).
- **Publish after creating one** — the running app cannot see it until the next publish (✅ earlier
  finding, API-SPEC §26).

## Recipes (`ua_cfg.js`)

| Need | Helper | context | Verified |
|---|---|---|---|
| Read an object | `cfg.dsFetch({object, filter, sort, limit})` | `storage_by_unifyapps_fetch_records` | ✅ |
| Create a record | `cfg.dsCreateRecord({object, record})` (manual) | `storage_by_unifyapps_create_record` | ✅ |
| Call an automation | `cfg.dsAutomation({automationId, params})` | `callables_call_automation` (`version:'-1'`, `synchronous:true`) | ✅ |
| Public HTTP API | `cfg.dsHttp({baseUrl, path, query})` | `custom_http_endpoint_execute` | ✅ open-meteo |
| Any other connector action | `cfg.createDs({ctx:{appName, resourceName, connectionId}, inputs})` | e.g. `gmail_send_email`, `openai_send_message` | 👁 (harvest) |
| Update / count / get-by-id | `createDs` with `storage_by_unifyapps_update_records`, `…_count_records`, `…_get_record_by_id` (🚫 never `…_delete_records` — no-delete rule; soft-delete through an update) | | 👁 |
| Analytics query | `analytics_by_unifyapps_query_reports` | | 👁 |
| Inline code | `code_by_unifyapps_javascript` / `_groovy` | | 👁 |

Idempotent: `cfg.ensureDs(cfg.dsFetch, spec)` updates the data source of the same name on that page
instead of creating a duplicate ✅.

### Storage filters

`triggerInputCondition = {operator:'AND', filters:[{property:'properties_<field>', filter:{operator:'EQUAL', value}}]}` —
the field is **`properties_<field>`** (underscore) or `id` for the record id ✅. Sort uses
`{field:'properties.<field>', order}` (dot) ✅. Output: `data.objects[]` of `{id, properties:{…}}`.
There is no "if empty, ignore this filter": when a filter is optional, fetch the set and filter it in
the binding (`.filter(v => !var_x['value'] || v.kind === var_x['value'])`) ✅ — fine up to a few
thousand rows.

### Connectors that need a connection

Put the connection id in `context.connectionId` (Gmail, OpenAI, Salesforce…). Use the **user's own**
connection — find it with the `Connection` aggregation (see `connect-and-call.md`); never one named
DND / DONT TOUCH, never someone else's.

### HTTP

`inputs: {baseUrl:'https://api.open-meteo.com', path:'/v1/forecast', httpMethod:'GET',
queryParamsList:[{key:'latitude', value:'25.28'}], headersList:[], pathParamsList:[], authType:'NO_AUTH', …}` ✅.
A single `url` input fails **"Base URL must start with http(s)"** ⛔. Output: `{status, result:<parsed body>}`.

## Transformer ✅

```js
options.transformerConfig = { enabled: true, includeOriginalOutput: false, id: 'transformer', type: 'javascript', fallbackMode: 'FAIL',
  context: { type: 'APPLICATION', appName: 'code_by_unifyapps', resourceName: 'code_by_unifyapps_javascript' },
  inputs: { code: "const rows = (data?.objects || []).map(o => ({ id: o.id, ...o.properties })); return { rows, count: rows.length };", compile_static: false } }
```

- Runs **server-side**; `data` = the connector's output (`{objects}` for storage, `{status, result}`
  for HTTP, the STOP result for an automation).
- The execute response wraps it: `response.result = <your return>` — **but in the page, `{{ ds['data'] }}`
  IS your return value** (no `['result']`) ✅. Binding `['data']['result']…` shows `-` everywhere. ⛔ → ✅
- Use it to flatten records, compute KPIs, build chart rows and parse JSON strings from an LLM
  automation (`JSON.parse(data.insights)`) — once, instead of in every block ✅.

## Run behaviour

| Setting | Effect |
|---|---|
| `runBehaviour:'automatic'` + `runQueryOnPageLoad:true` | runs on load and whenever a dependency in `dpOn` changes ✅ |
| `runBehaviour:'manual'` | runs only on `controlDataSource trigger` (buttons, callbacks) ✅ |
| `queryDisabled: {type:'filter', payload}` | while the condition holds, an automatic source does not run ✅ |
| `runQueryPeriodically` + `interval` | polling 👁 |
| `refetchOnWindowFocus` | refetch on tab focus (default true in the builder — set false for LLM calls) |

**Waiting for other data sources** — ✅ the only reliable way:

```js
cfg.dsAutomation({ …, run: 'auto',
  disabledWhen: C.eq("{{ !((e_ent['data']?.['rows'] || []).length && (e_reg['data']?.['rows'] || []).length) }}", 'true') })
```

⛔ Not this: `onLoad: [A.then(A.runDs(ENT), A.runDs(INSIGHTS))]`. The insights call went out with
**empty arrays** — its inputs were evaluated before the entities data reached the store — and the LLM
reported "all data objects returned empty". A later manual trigger of the same source was correct.

## Callbacks ✅

`callbacks.successEvents` / `failureEvents` hold ordinary actions. The write path in the sample:

```js
cfg.dsCreateRecord({ …, onSuccess: [A.notify('Action raised'), A.runDs(ACTIONS_DS), A.modal('b_actModal','hide')],
                        onError: [A.notify('Could not save the action', 'error')] })
```

The scenario engine refreshes three global sources on success, and every screen follows ✅.

## Testing from the tab

`cfg.runDs(dsId, {'parameters.scenario_code': 'SC-LABOUR-ESC'})` executes it like the page does,
overriding templated inputs by dotted path, and returns `{response}` ✅. The builder canvas uses
`/execute/node/rungetschema`; preview and the published app use `/execute/node` with a `req_*` request id.

Measured (UAT): storage fetch 50 rows ~300 ms; the scenario automation (5 reads, Groovy, 3 bulk
upserts) ~350 ms; the LLM insight automation ~20 s for 12 entities + 8 regions + 12 months — on
Sonnet 4.6. **That is over budget now:** an insight automation runs on a fast model (GPT-4.1 mini
`e_ai_agent_openai_gpt_4.1_mini` on UAT, 3.9–6.5 s for the same kind of prompt), capped input,
`maxTokens` 1600, two or three findings (`unifyapps-apps/references/ai-app-patterns.md` §2
"Latency budget"). The CGB Pulse insight workflow was moved on 2026-09-25 (v3): `ds_cc_insights`
went from 30.2 s to 5.3 s on the preview, and `examples/cgb-pulse/platform/workflow_insights.json`
matches the live definition (GPT-4.1 mini, 1,600 tokens, two or three findings, the NUMBERS rule).

## Global vs page-level scope ⛔ → ✅ (a PoC-tracking command-centre build, 2026-09-25)

A data source on `e_global_<appId>` evaluates its `{{ }}` inputs in the **global page's scope**: a page's
`var_*` and `b_*` are undefined there, so `{{ var_f_q['value'] || '' }}` arrives as `''` on every run
(the list came back unfiltered with the value visibly in the input and the URL). Bind parameters to page
state only on a **page-level** data source (`cfg.ensureDs(cfg.dsAutomation, { pageId, … })`) — the same
workflow id can back one data source per page. Global sources are for parameter-less or
`userContext`-only calls. Also: without a transformer, an automation source's `{{ ds['data'] }}` **is**
the workflow's STOP payload (`['data']['kpis']`), and `callbacks.successEvents` may read the source's own
output (`{{ e_ds['data']?.['deal_name'] }}`) for the notification title. API-SPEC §51.1–51.2.
