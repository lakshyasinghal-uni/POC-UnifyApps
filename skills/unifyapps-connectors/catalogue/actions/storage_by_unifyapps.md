# `storage_by_unifyapps` — Storage (the tenant's own Objects)

43 ACTION + 5 TRIGGER (48 resources). **No connection needed** — it reads and writes the Objects
defined in the tenant's Objects Manager. This is the node to reach for before adding an external
database for application data.

Six connections exist on UAT, but they are not required for normal use.

## Records — read

| Action | Note |
|---|---|
| `storage_by_unifyapps_fetch_records` | the main query: filters, sorts, paging |
| `storage_by_unifyapps_get_record_by_id` · `storage_by_unifyapps_get_records_by_ids` | direct fetch |
| `storage_by_unifyapps_count_records` | count without pulling rows |
| `storage_by_unifyapps_aggregate_records` · `storage_by_unifyapps_aggregate_metadata` | group-by and stats server-side |
| `storage_by_unifyapps_fetch_distinct_values` | populate a filter dropdown |
| `storage_by_unifyapps_semantic_query_records` | vector / semantic search over records |
| `storage_by_unifyapps_autocomplete_query` | type-ahead |
| `storage_by_unifyapps_federation_query` | query across federated sources |
| `storage_by_unifyapps_export_records` | |

⛔ **`aggregate_records` does not group on UAT (verified 2026-09-25, API-SPEC §56).** With
`properties_<field>` projections it returns one row per record with the raw value under every alias
(`SUM` = `COUNT` = `AVG`); with bare or dotted names the `columns` come back empty. No error. Totals
still should not be computed in a Code step — do it natively: `fetch_records` →
`utility_by_unifyapps_run_sql_query_on_list` (`SELECT … GROUP BY …` over the fetched list, ✅), and
`count_records` for plain counts (✅, filter honoured). See `unifyapps-builder/references/workflows.md` §5a.

## Records — write

`storage_by_unifyapps_create_record` · `storage_by_unifyapps_bulk_create_records` ·
`storage_by_unifyapps_upsert_record` · `storage_by_unifyapps_bulk_upsert_records_by_id` ·
`storage_by_unifyapps_update_records` · `storage_by_unifyapps_update_record_by_id` ·
`storage_by_unifyapps_update_record_fields_by_id` · `storage_by_unifyapps_bulk_update_record_by_id` ·
`storage_by_unifyapps_delete_records` · `storage_by_unifyapps_delete_record_by_id` ·
`storage_by_unifyapps_archive_record_by_id` · `storage_by_unifyapps_clone_record` ·
`storage_by_unifyapps_import_records` · `storage_by_unifyapps_share_records` ·
`storage_by_unifyapps_add_translation` · `storage_by_unifyapps_remove_translation`

`update_record_fields_by_id` patches named fields; `update_record_by_id` replaces. Choose
deliberately — the replace variant will blank fields you omit.

## Objects (schema)

`storage_by_unifyapps_create_object` · `storage_by_unifyapps_get_object_by_id` ·
`storage_by_unifyapps_delete_object` · `storage_by_unifyapps_update_schema` ·
`storage_by_unifyapps_export_entity_schema` · `storage_by_unifyapps_list_versions` ·
`storage_by_unifyapps_fetch_dependency_tree` · `storage_by_unifyapps_insert_entity_part` ·
`storage_by_unifyapps_flush_entity_parts` · `storage_by_unifyapps_clear_entity_dependency_cache`

## Triggers (5)

`storage_by_unifyapps_on_create_record` · `storage_by_unifyapps_on_update_record` ·
`storage_by_unifyapps_on_delete_record` · `storage_by_unifyapps_on_any_change` ·
`storage_by_unifyapps_on_any_change_in_entities` · `storage_by_unifyapps_on_entity_deployed`

Record triggers are how an app page write kicks off a workflow without the page calling anything.

## Gotchas

- Schema actions (`update_schema`, `delete_object`) change a shared tenant's data model. Only run
  them against objects you created — see the sharing rules in `references/connect-and-call.md`.
- For graph-shaped data (nodes, edges, traversals) use `mdm_by_unifyapps` /
  `unified_entity_by_unifyapps` instead; Storage is relational.
