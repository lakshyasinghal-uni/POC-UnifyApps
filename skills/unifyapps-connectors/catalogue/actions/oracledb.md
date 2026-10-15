# `oracledb` — Oracle DB

23 resources: 17 ACTION, 6 TRIGGER. 22 connections on UAT. **Not** OAuth — username/password, so
the connection can be created over the API (the user supplies the password themselves).

Connection inputs: `name`, `authType`, `databaseHost`, `databasePort`, `username`, `password`,
`isCDBDatabase`, `databaseName`, `serviceName`, `schemaName`, `driverType`, `connectionType`,
`ssl`, `connectionPoolProperties`.

> **Oracle EBS:** `serviceName` must be the **PDB**, with `isCDBDatabase: false`. Pointing at the
> CDB gives `ORA-01017` because APPS is PDB-local. See the `oracle-ebs-apis` skill.

## Query

| Action | Note |
|---|---|
| `oracledb_execute_sql` | arbitrary SQL — the one most workflows use |
| `oracledb_select_rows_in_batch` | structured filter, paged |
| `oracledb_select_rows_using_custom_sql` | raw SQL, paged |
| `oracledb_run_long_query_using_custom_sql` | async; for queries that outlive the step timeout |
| `oracledb_export_query_result` | straight to a file |
| `oracledb_execute_stored_procedure` | PL/SQL packages — the path for EBS seeded APIs |

## Write

`oracledb_insert_record` · `oracledb_insert_rows` · `oracledb_insert_rows_using_file` ·
`oracledb_update_rows` · `oracledb_update_rows_batch` · `oracledb_upsert_row` ·
`oracledb_upsert_rows_batch` · `oracledb_delete_rows_in_batch`

Prefer the `_batch` variants. A per-row insert inside a loop costs one step execution per row and
one round trip to the database.

## Schema

`oracledb_list_schemas` · `oracledb_list_tables_from_schema` · `oracledb_create_snapshot`

## Triggers (6) — the SQL CDC family

`oracledb_on_new_event` · `oracledb_on_update_event` · `oracledb_on_delete_event` ·
`oracledb_on_new_or_update_event` · `oracledb_on_event` · `oracledb_on_scheduled_query_search`

`on_scheduled_query_search` runs a query on a schedule and fires once per returned row — the
practical choice when the database has no change-tracking columns you can trust.

**The same six exist on `postgres` and `snowflake`.** Learn the pattern once.

## Gotchas

- `execute_sql` will happily run DDL and DML. On a shared tenant, read before you write, and never
  run a statement against a colleague's connection.
- Date-tracked Oracle HR tables need effective dates; see the `oracle-ebs-apis` skill rather than
  hand-rolling SQL.
- `GET /api/connection/{id}` returns this connection's `password` in clear. Do not read it into
  chat to "check the host" — use the aggregation projection instead, and if you must read it,
  redact.
