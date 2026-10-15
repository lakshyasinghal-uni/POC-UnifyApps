# Per-connector capability deep dives

One file per connector, named `{appName}.md`. Each lists every action, trigger and agent-tool that
connector exposed on `orbit.uat.unifyapps.com` on 2026-09-23, grouped so you can find the right one
without reading 100 names.

**Resource names are stable; `resourceVersion` is not.** Nothing here records a version — resolve
it from `GET /api/workflow-builder/node/{appName}/resources` at build time, every time.

## Which connectors are covered

29 of the 983, chosen by how much this tenant uses them plus the platform nodes everything else
depends on:

| File | Covers |
|---|---|
| `slack.md` `gmail.md` `gdrive.md` `gsheets.md` `gcalendar.md` | the four highest-connection SaaS connectors plus Slack |
| `github.md` | the only connector shipping `AGENT_TOOL` resources |
| `hubspot.md` | HubSpot CRM — search/filter contract, pipelines, owners, associations, the write list to refuse on a read-only connection |
| `openai.md` `anthropic.md` | LLM connectors |
| `oracledb.md` `postgres.md` `snowflake.md` | the SQL family, and the CDC trigger pattern they share |
| `amazon_s3.md` | object storage |
| `storage_by_unifyapps.md` `mdm_by_unifyapps.md` | the tenant's own Objects and Ontology/graph |
| `platform-core.md` | the 14 no-connection platform nodes: HTTP, code, callables, files, PDF, AI, MCP, A2A, triggers |

## Adding one

When you need a connector that is not here — especially a newly discovered one after a refresh:

```js
// same-origin in a signed-in tab
const r = await (await fetch('/api/workflow-builder/node/<appName>/resources',
  {credentials:'include'})).json();
r.objects.map(x => `${x.resourceType}\t${x.name}\t${x.displayName}`).join('\n');
```

Then write `{appName}.md` in the same shape: what the connector is for, how its connection
authenticates, actions grouped by object or verb family, triggers in their own section, and a
gotchas list. Keep it to what a builder needs to choose — not a copy of the API reference.
