# `snowflake` — Snowflake

**145 resources** — the third-largest connector on UAT, and far more than a SQL client: it covers
warehouse, database and object administration as well as Cortex AI. 74 connections.

Connection inputs: `name`, `authType`, `domain`, `databaseName`, `schemaName`, `warehouseName`,
`connectionPoolProperties`. `refreshable: true` (key-pair / OAuth options).

Because of the size, this file groups the surface rather than listing all 145. Pull the exact names
with `GET /api/workflow-builder/node/snowflake/resources`.

## Data — start here

| Action | Note |
|---|---|
| `snowflake_execute_sql` · `snowflake_execute_multiple_sql` | arbitrary SQL |
| `snowflake_select_rows` · `snowflake_select_rows_using_custom_sql` | reads |
| `snowflake_insert_row` · `snowflake_update_rows` · `snowflake_delete_rows` | writes |
| `snowflake_upsert_rows` · `snowflake_merge_rows` | idempotent sync — prefer these |
| `snowflake_replicate_batch_rows` · `snowflake_replicate_schema` | bulk replication from another source |
| `snowflake_run_long_query_using_custom_sql` · `snowflake_execute_sql_loop` | long / iterative |
| `snowflake_get_statement_status` · `snowflake_cancel_statement` · `snowflake_fetch_statement_partition` | async statement control |
| `snowflake_export_query_result` | |
| `snowflake_get_schema_of_table` · `snowflake_fetch_views` | |

## Stages and file loading

`snowflake_create_stage` · `snowflake_delete_stage` · `snowflake_list_stage_files` ·
`snowflake_upload_file_to_internal_stage` · `snowflake_download_file_from_internal_stage` ·
`snowflake_get_stage_presigned_url` · `snowflake_bulk_load_data_to_table_from_stage` ·
`snowflake_create_pipe` / `get` / `list` / `refresh` / `delete`

The efficient bulk path: upload to an internal stage, then `bulk_load_data_to_table_from_stage`.

## Cortex (AI inside Snowflake)

`snowflake_cortex_complete` · `snowflake_cortex_embed` · `snowflake_cortex_search` ·
`snowflake_cortex_run_agent` · `snowflake_cortex_run_lite_agent` ·
`snowflake_cortex_cancel_agent_run` · `snowflake_cortex_list_agents` ·
`snowflake_cortex_describe_agent` · `snowflake_cortex_delete_agent` ·
`snowflake_cortex_create_thread` · `snowflake_cortex_list_threads` ·
`snowflake_cortex_describe_thread` · `snowflake_cortex_delete_thread` ·
`snowflake_cortex_list_models`

Worth knowing about: it keeps the data in Snowflake instead of shipping rows to an external LLM.

## Administration

Full CRUD plus clone / undrop / rename / swap across: **databases**, **schemas**, **tables**,
**views**, **dynamic tables**, **iceberg tables** (including creation from AWS Glue, Delta, Iceberg
REST and Iceberg files), **event tables**, **streams**, **sequences**, **stages**, **pipes**,
**tasks** and **warehouses** (`create`, `update`, `rename`, `suspend`, `resume`, `delete`,
`abort_warehouse_queries`), plus reclustering control
(`suspend_table_recluster`, `resume_dynamic_table_recluster`, …).

## Triggers (6)

`snowflake_on_new_event` · `snowflake_on_update_event` · `snowflake_on_delete_event` ·
`snowflake_on_new_or_update_event` · `snowflake_on_event` · `snowflake_on_scheduled_query_search`

## Gotchas

- The admin actions are real: `snowflake_delete_database`, `snowflake_delete_warehouse` and
  `snowflake_delete_table` do what they say and are not undoable beyond Snowflake's own Time
  Travel. Never wire one into a flow the user did not explicitly ask for.
- Warehouse actions cost credits. `resume_warehouse` at the top of a flow and `suspend_warehouse`
  at the end is a pattern worth suggesting, but confirm it — someone else may depend on that
  warehouse staying up.
