# `mdm_by_unifyapps` — Ontology (MDM / master data and the graph)

28 resources: 24 ACTION, 4 TRIGGER. **3,296 connections on UAT — more than any other connector**,
because every context graph and unified data model creates its own.

Displayed as *Ontology*. Closely related: `unified_entity_by_unifyapps` (8 resources) and
`ecg_by_unifyapps` (4) — see below.

## Entities and models

`mdm_by_unifyapps_create_entity_model` · `mdm_by_unifyapps_create_entity` ·
`mdm_by_unifyapps_update_entity_schema` · `mdm_by_unifyapps_delete_entity`

## Relationships (the graph)

`mdm_by_unifyapps_create_relationship` · `mdm_by_unifyapps_find_relationships` ·
`mdm_by_unifyapps_find_unified_entity_relationships` · `mdm_by_unifyapps_delete_relationships` ·
`mdm_by_unifyapps_add_edge_to_graph`

## Querying

| Action | Language |
|---|---|
| `mdm_by_unifyapps_execute_opencypher_query` | OpenCypher — the one the Context Graph skill uses |
| `mdm_by_unifyapps_execute_opencypher_update` | OpenCypher writes |
| `mdm_by_unifyapps_execute_gremlin_query` | Gremlin |
| `mdm_by_unifyapps_find_by_sql` | SQL over the entity store |

## Staging, matching and quality

`mdm_by_unifyapps_create_staging_records` · `mdm_by_unifyapps_fetch_staging_records` ·
`mdm_by_unifyapps_apply_data_matching_rules` · `mdm_by_unifyapps_apply_data_quality_rules` ·
`mdm_by_unifyapps_create_data_quality_rule` · `mdm_by_unifyapps_update_data_quality_rule` ·
`mdm_by_unifyapps_clone_data_quality_rule` · `mdm_by_unifyapps_fetch_data_quality_rules` ·
`mdm_by_unifyapps_get_data_sync` · `mdm_by_unifyapps_fetch_mdm_audit`

The MDM pipeline in order: land into **staging** → **data quality rules** → **matching rules** →
published unified entity.

## Triggers (4)

`mdm_by_unifyapps_on_new_unified_entity` · `mdm_by_unifyapps_on_unified_entity_deleted` ·
`mdm_by_unifyapps_on_new_unified_data_model` · `mdm_by_unifyapps_on_update_unified_data_model` ·
`mdm_by_unifyapps_on_delete_unified_data_model`

## Neighbours

| Node | Resources | For |
|---|---|---|
| `unified_entity_by_unifyapps` | 8 | the lighter surface: create a unified entity/model, relationships, OpenCypher, Gremlin, SQL |
| `ecg_by_unifyapps` | 4 | the Context Graph ingestion pipeline: `run_discovery`, `translate_raw_record`, `publish_record`, `apply_enrichment` |

## Gotchas

- **Records never link themselves.** Record-level edges are written by the MDM connector, not by
  creating records with foreign keys. See the `unifyapps-context-graph` skill and `API-SPEC.md` §12
  for the ordering rules — creating a graph out of order is the usual failure.
- A context graph creates its own `mdm_by_unifyapps` connection. Creating one by hand with
  `POST /api/connection` fails with `No Value found in filter with field: sourceConnectionId`.
- With 3,296 connections on the tenant, never pick one by name — take the id the graph gives you.
