# The catalogue

A snapshot of what one UnifyApps tenant can connect to, in files that are meant to be **grepped,
diffed and regrown** rather than read end to end.

| File | Rows | What it is |
|---|---|---|
| `connectors-index.tsv` | 983 | every built-in **application connector**: `appName<TAB>displayName` |
| `platform-nodes.tsv` | 91 | every built-in **platform node** (no connection needed) |
| `connections-uat-2026-09-23.tsv` | 304 | which connectors had connections on UAT, with connection and resource counts |
| `actions/*.md` | 28 files | per-connector capability deep dives |
| `CHANGELOG.md` | — | one entry per refresh |

Source: `orbit.uat.unifyapps.com`, 2026-09-23, via `GET /api/workflow-builder/nodes`,
`/find-nodes-with-connections`, `/node/{app}/resources` and
`POST /api/aggregation?entityType=Connection`.

## Using it

```bash
# does a connector exist?
grep -i zendesk connectors-index.tsv

# what is the appName for a product whose slug you cannot guess?
grep -i "sql server\|sharepoint\|zoho crm" connectors-index.tsv

# what does this tenant actually run on?
head -20 connections-uat-2026-09-23.tsv

# which connectors have a big action surface (worth a deep dive)?
sort -t$'\t' -k4 -rn connections-uat-2026-09-23.tsv | head
```

## What this is not

- **Not a version record.** No `resourceVersion` is stored anywhere on purpose — resolve it from
  `/resources` at build time.
- **Not tenant-portable for custom connectors.** The 140 custom (Connectors SDK) connectors on UAT
  have 24-hex `appName`s that mean nothing on another tenant, so they are deliberately kept out of
  `connectors-index.tsv`.
- **Not complete for actions.** 28 of 983 connectors have a deep dive. For the rest, one call to
  `/resources` gives you the current truth — and `actions/README.md` explains how to turn that into
  a new file.

## Refreshing

See `SKILL.md` §*Keep learning*. Short version: run `scripts/harvest.js` in a signed-in browser
tab, save the TSV, then `python scripts/refresh_catalogue.py snapshot.tsv`.
