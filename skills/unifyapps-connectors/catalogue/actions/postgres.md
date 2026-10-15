# `postgres` — PostgreSQL

19 resources: 13 ACTION, 6 TRIGGER. 10 connections on UAT. Username/password.

The shape is the same as `oracledb` and `snowflake`; if you know one you know all three.

## Query

`postgres_execute_sql` · `postgres_select_row_batch` · `postgres_select_row_using_custom_sql_batch` ·
`postgres_run_long_query_using_custom_sql` · `postgres_export_query_as_csv`

## Write

`postgres_insert_row` · `postgres_update_row` · `postgres_upsert_row_batch` ·
`postgres_delete_row_batch`

## Schema

`postgres_list_databases` · `postgres_list_table_object` · `postgres_get_table_schema` ·
`postgres_create_snapshot`

## Triggers (6)

`postgres_on_new_event` · `postgres_on_update_event` · `postgres_on_delete_event` ·
`postgres_on_new_or_update_event` · `postgres_on_event` · `postgres_on_scheduled_query_search`

## Related connectors

`mysql` (22) · `mariadb` (5) · `sqlserver` — Microsoft SQL Server (26) · `redshift` (21) ·
`clickhouse` (4) · `cockroachdb` · `greenplum` · `starrocks` (9) · `trino` · `teradata` ·
`custom_db` (a generic JDBC connector for anything without its own).

`custom_db` is the escape hatch when a database has no dedicated connector — check for the
dedicated one first, since it will have the CDC triggers and schema helpers.

## Gotchas

- `postgres_get_table_schema` before generating INSERT column lists; guessing column order is the
  usual cause of a silent type error.
- Long queries: use `run_long_query_using_custom_sql`, not `execute_sql` with a bigger timeout.
