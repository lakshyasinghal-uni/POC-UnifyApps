# Connector catalogue changelog

One entry per refresh. Newest entries are appended at the end by
`scripts/refresh_catalogue.py`; the seed entry below was written by hand.

## 2026-09-23 - https://orbit.uat.unifyapps.com (seed)

First harvest. 1,214 nodes in `GET /api/workflow-builder/nodes`:

- **983 application connectors** → `connectors-index.tsv`
- **91 built-in platform nodes** → `platform-nodes.tsv`
- **140 custom connectors** (Connectors SDK, tenant-local) → not merged into the index;
  listed by `appName` in `connections-uat-2026-09-23.tsv` where they had connections
- 1,064 of 1,214 require a connection; 1 hidden; 0 marked `standard`

**304 connectors** were returned by `find-nodes-with-connections`; 25 of those had a Connection
aggregation count of 0. 7,775+ connections exist tenant-wide.

Deep dives written for 28 connectors (`actions/`): slack, gmail, gdrive, gsheets, gcalendar,
github, openai, anthropic, oracledb, postgres, snowflake, amazon_s3, storage_by_unifyapps,
mdm_by_unifyapps, and 14 platform core nodes in `platform-core.md`.

New platform facts recorded in `API-SPEC.md` at the same time: the `AGENT_TOOL` resource type,
`{defId}:{actionId}` custom actions attached to built-in connectors, `GET /api/applications/`
returning an empty body for internal nodes, and the `find-nodes-with-connections` vs aggregation
count discrepancy.
