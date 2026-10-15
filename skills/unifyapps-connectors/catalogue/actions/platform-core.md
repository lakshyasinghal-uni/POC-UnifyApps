# Platform core nodes — the 14 that need no connection

These are the nodes every workflow uses. All are `needsAuthentication: false`, so there is no
connection to find and no auth to arrange. Verified on UAT, 2026-09-23.

---

## `custom_http_endpoint` — Custom HTTP Endpoint (7 actions)

Ad-hoc HTTP with no saved connection.

`custom_http_endpoint_execute` · `custom_http_endpoint_execute_streaming` ·
`custom_http_endpoint_execute_multipart` · `custom_http_endpoint_execute_streaming_multipart` ·
`custom_http_endpoint_execute_graphql` · `custom_http_endpoint_execute_soap` ·
`custom_http_endpoint_execute_soap_multipart`

Use for public APIs and one-off calls. When the same base URL and credentials recur, switch to the
**`custom_http_application`** connector (5 actions, 45 connections on UAT) so the secret lives in a
connection instead of in every step. `GET /api/applications/custom_http_endpoint` returns an empty
body — it has no connection form, by design.

## `callables` — Callable (15 resources: 11 ACTION, 4 TRIGGER)

How workflows call each other and how apps, APIs and agents call workflows.

| Resource | Type | Use |
|---|---|---|
| `callables_call_automation` | ACTION | call another workflow and wait |
| `callables_call_automation_async` | ACTION | fire and forget |
| `callables_call_automation_batch` | ACTION | many invocations in one step |
| `callables_call_automation_streaming` | ACTION | stream results back |
| `callables_call_interface` | ACTION | invoke an app interface |
| `callables_schedule_a_callable` · `callables_cancel_scheduled_callable` | ACTION | delayed invocation |
| `callables_return_to_automation` · `callables_return_to_automation_streaming` | STOP | return to the caller |
| `callables_return_response_to_api` · `callables_return_to_api_streaming` | STOP | return an HTTP response |
| `callables_from_api` · `callables_from_automation` · `callables_from_automation_streaming` · `callables_from_interface` | TRIGGER | the START node that makes a workflow callable |

An agent tool that runs a workflow is `callables_call_automation` under the hood.

## `code_by_unifyapps` — Code (10 actions)

`code_by_unifyapps_python` · `code_by_unifyapps_javascript` · `code_by_unifyapps_groovy` ·
`code_by_unifyapps_java` · `code_by_unifyapps_csharp` · `code_by_unifyapps_playwright` ·
`code_by_unifyapps_execute_code_snippets` · `code_by_unifyapps_execute_python_function` ·
`code_by_unifyapps_third_party_library` · `code_by_unifyapps_bubblewrap`

`code_by_unifyapps_playwright` is browser automation inside a workflow;
`code_by_unifyapps_third_party_library` lets a snippet import a declared dependency.

**Reach for Code last.** Most Code steps in our builds (joins, counts, flattening, response
assembly, branching, loop bookkeeping) had a native node — see the next section and
`unifyapps-builder/references/workflows.md` §5a.

## `utility_by_unifyapps` / `variable_by_unifyapps` / `decision_table_by_unifyapps` — data work without code

Harvested from `/resources` on UAT, 2026-09-25 (✅ = run in probe `mnp_native_node_probe`).

- `utility_by_unifyapps` (63 actions): ✅ `run_sql_query_on_list` (SQL over one or more lists; the
  list pill is the table name; nested `properties.x`; GROUP BY / JOIN work) · ✅ `sort_list` ·
  ✅ `to_json_object` · `to_json_string` · ⛔ `filter_list` (returned 0 of 20 matching rows — filter
  in the fetch or the SQL instead) · `evaluate_filter` · `get_value_at_index_from_list` ·
  `resolve_value` · `template_resolver` · `date_diff` · `date_to_epoch` · `epoch_to_date` ·
  `generate_uuid` · `sequence_generator` · `perform_hashing` · `from_xml_to_json_object` ·
  `from_html_to_plain_text` · `convert_to_markdown` · `parse_email` · `decode_jwt_token` ·
  `text_difference` · `translate_text` · `run_sql_query_on_file` · document and file conversions.
- `variable_by_unifyapps` (17): `create_variables` / `update_variables` (formulas `=SUM(…)`,
  `=LEN(…)`) · `create_list` · `add_item_to_list` · `add_items_to_list` · `modify_item_at_index` ·
  `find_and_update_variables` · 2D/3D variables · session variables.
- `decision_table_by_unifyapps` (6): `execute_table` `{entityId, input_loader}` — rule tables for
  score bands, routing, thresholds · `execute_sheet` · `create_table` / `add_row` / `update_row`.
- `template_by_unifyapps`: `compile_template`. `duckdb_by_unifyapps`: `execute_sql_query`,
  `upload_to_duckdb`. `analytics_by_unifyapps`: `execute_query` (analytics SQL), `query_reports`.
- `storage_by_unifyapps`: ✅ `count_records` · `fetch_distinct_values` · `update_records` (by
  condition) · ⛔ `aggregate_records` (see `storage_by_unifyapps.md`).

## `conv_ai_by_unifyapps` — AgentKit (8 actions)

`conv_ai_by_unifyapps_call_llm_model_with_options` · `conv_ai_by_unifyapps_execute_prompt` ·
`conv_ai_by_unifyapps_collect_slots` · `conv_ai_by_unifyapps_publish_response` ·
`conv_ai_by_unifyapps_publish_interface` · `conv_ai_by_unifyapps_crawl_website` ·
`conv_ai_by_unifyapps_ocr_document_details_extraction` · `conv_ai_by_unifyapps_fetch_embeddings`

**Prefer `call_llm_model_with_options` over a vendor connector** when the model should stay
configurable — it fronts OpenAI, Anthropic, Gemini and Bedrock behind one node, so switching model
is a config change rather than a rebuild.

## `ai_agents_by_unifyapps` — AI Agents (7 actions)

`ai_agents_by_unifyapps_invoke_agent` · `ai_agents_by_unifyapps_resume_agent_stream` ·
`ai_agents_by_unifyapps_cancel_stream` · `ai_agents_by_unifyapps_chat_queue_enqueue` ·
`ai_agents_by_unifyapps_chat_queue_resume` · `ai_agents_by_unifyapps_chat_queue_unpause` ·
`ai_agents_by_unifyapps_chat_queue_release_send_now`

Calls a UnifyApps agent from a workflow — the reverse of an agent tool calling a workflow.

## `files_by_unifyapps` — Files (9 resources: 8 ACTION, 1 TRIGGER)

`files_by_unifyapps_upload_file` · `files_by_unifyapps_get_file` · `files_by_unifyapps_copy_file` ·
`files_by_unifyapps_delete_file` · `files_by_unifyapps_create_temp_file` ·
`files_by_unifyapps_create_pdf_file` · `files_by_unifyapps_append_line_to_file` ·
`files_by_unifyapps_get_file_mime_type` · `files_by_unifyapps_on_new_or_created_file` (TRIGGER)

## `pdf_by_unifyapps` — PDF (6 actions)

`pdf_by_unifyapps_merge_pdfs` · `pdf_by_unifyapps_extract_pages` · `pdf_by_unifyapps_for_each_page`
· `pdf_by_unifyapps_for_each_split_file` · `pdf_by_unifyapps_add_signature` ·
`pdf_by_unifyapps_protect_pdf`

`for_each_page` is a loop construct, not an extraction — pair it with an OCR or LLM step.
Siblings: `csv_by_unifyapps`, `excel_by_unifyapps`, `ppt_by_unifyapps`, `parquet_by_unifyapps`,
`json_by_unifyapps`, `text_by_unifyapps`.

## `platform_by_unifyapps` — Platform (9 resources: 2 ACTION, 7 TRIGGER)

`platform_by_unifyapps_get_api_schema` · `platform_by_unifyapps_repeat_run` (ACTION)

Triggers on the platform's own events — the building blocks of monitoring automations:
`on_automation_run_failed` · `on_automation_run_cancelled` · `on_pipeline_create` ·
`on_pipeline_update` · `on_pipeline_complete` · `on_pipeline_record_success` ·
`on_pipeline_record_failure`

`on_automation_run_failed` plus a Slack post is the standard "tell me when something breaks" flow.

## `mcp_servers` — MCP Servers (2 actions)

`mcp_servers_list_tools` · `mcp_servers_invoke_tool`

46 connections on UAT. Connection inputs: `name`, `isSSESupported`, `authType`
(`TOKEN` | `NO_AUTH` | `BASIC` | `OAUTH` | `OAUTH_DCR` | `CREDENTIALS`), `endpoint`, `headersList`.
This is how UnifyApps consumes an external MCP server — two actions covering any number of tools.
(`mcp_by_unifyapps` is the separate internal node for exposing UnifyApps *as* MCP.)

## `a2a_servers` — A2A Servers (4 actions)

`a2a_servers_fetch_agent_card` · `a2a_servers_send_message` · `a2a_servers_send_message_stream` ·
`a2a_servers_get_tasks`

Agent-to-agent protocol: read another agent's card, then send it work. 20 connections on UAT.

## `webhooks` / `schedule` — the two bare triggers

`webhooks_default` (TRIGGER) — an inbound HTTP webhook starts the workflow.
`schedule_default` (TRIGGER) — cron.

Together with the four `callables_from_*` triggers, these are every way a workflow can begin that
does not involve a connector event.

## `unified_entity_by_unifyapps` / `ecg_by_unifyapps`

Covered in `mdm_by_unifyapps.md`.
