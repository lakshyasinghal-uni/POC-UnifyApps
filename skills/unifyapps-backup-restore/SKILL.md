---
name: unifyapps-backup-restore
description: Back up every UnifyApps resource a solution owns (workflows, objects and records, agents with topics/tools/skills, memory config, apps and data sources, connection metadata) to a git repo, restore any of it into the tenant it came from, and rebuild the whole solution in a DIFFERENT tenant. Use whenever the user wants a backup or snapshot of their UnifyApps work, wants to undo a bad change or recover a deleted workflow/agent/object, asks "what if this environment disappeared", or needs to move or re-deploy a solution to another UnifyApps environment.
metadata:
  author: Maher
---

# UnifyApps backup, restore and re-deploy

> **Created by Maher.** Contains no credentials. Everything runs in a tab the user is already
> signed in to. A snapshot never contains a secret — see *What is never saved*. Never ask for a
> password or a token.

> ## 🚫 HARD RULE: never delete a resource
> Anyone using this skill **must not delete anything** on any platform it touches: no workflow,
> agent, task, tool, app, page, data source, object, record, graph, node, edge, source, connection,
> code-app branch or file, Oracle row, git branch or repository. Not even one this skill created.
> That covers `POST …/delete/…` endpoints, HTTP `DELETE`, `deleted: true`, `requestType: "DELETED"`,
> `*_delete_*` storage/connector nodes in workflows, data sources or agent tools, SQL
> `DELETE`/`DROP`/`TRUNCATE`, and Oracle `DELETE_*` APIs. Instead: **soft-delete** (a status /
> `archived` / `enabled=false` flag), or leave it and tell the user exactly what would need removing
> so they can do it themselves in the console. If a design seems to need a delete, stop and ask.
> A hook enforces this at execution time: `scripts/no_delete_guard.py` — install it per
> `references/connect-and-call.md` §0. Do not try to work around it.

Three different jobs, and they are not interchangeable:

| Job | Call | What it is for |
|---|---|---|
| **Backup** | `SCN.backup()` | A restore point. One git commit per snapshot. |
| **Restore** | `SCN.restore()` | Put things back **in the tenant they came from** after a bad change or a deletion. |
| **Deploy** | `SCN.portability()` → `SCN.deploy()` | Rebuild the solution in a **different tenant**. Ids are not portable; this is a migration, not a copy. |

The tool is a single file pasted into the console of a signed-in tab:
`sc-native-backup/tools/sc-native-backup.js` (repo `mmaheranwar/sc-native-backup`).
It writes snapshot files to GitHub through a workflow, server side, so the browser never holds a token.

## What a snapshot contains

| Folder | Contents |
|---|---|
| `workflows/` | every owned workflow, full node/edge definition |
| `objects/` · `records/` | object schemas and **every record** of them |
| `agents/` | each agent with its topics and its tools (enabled and disabled) |
| `skills/` | the platform skills those agents read |
| `memory/` | memory **set and profile configuration** — never anyone's memories |
| `apps/` | `e_interface` + pages/components + data sources (the **code** lives in the app's own GitHub repo) |
| `dependencies/` | outside workflows our agents call; recreated only if they have gone missing |
| `connections.json` | connection **name, app and id only** |
| `manifest.json` | what was saved, when, with counts |

### What is never saved
Connection secrets and tokens, OAuth grants, per-user memory records, the customer data in
connected systems (HubSpot, Gmail, Drive…), and code-app source. Code lives in git; that is the
backup. A restore therefore cannot re-authorize a connection — a person must do that.

## Backing up

```js
await SCN.backup()          // full snapshot → one commit
await SCN.snapshots()       // restore points, newest first
```

Run one **before** any risky change and after any milestone. The snapshot is only as current as
its last run: platform edits made after it are not in it.

## Restoring into the same tenant

```js
await SCN.restore({ dryRun: true })                              // what would change
await SCN.restore({ only: ['workflows/scc_deal_qa'] })           // one item
await SCN.restore({ ref: '<sha>', kinds: ['agents'] })           // from an older snapshot
```

It updates only what differs, revives soft-deleted entities, and recreates what has gone.

**The one thing to understand:** a deleted workflow cannot keep its id. When one is recreated it
gets a new id, and the tool re-points every reference to it — data sources, agent tools, other
workflows — and then lists any **app source lines** you must edit yourself (`report.codeChanges`),
because code lives in git, not on the platform. Verified: delete → restore of a live workflow in
16 s, with re-pointing, and a tampered record restored byte-exact.

## Re-deploying into a DIFFERENT tenant

> Ids are tenant-specific. Copying a snapshot into a fresh tenant without remapping produces
> workflows wired to connections that do not exist and agents pointing at models that are not there
> — and a wrong model id can **silently run a different model** with no error at all.

```js
const plan = await SCN.portability()   // read-only: every tenant-specific reference, resolved to a name
// fill in each `to` in plan.remap, then:
await SCN.deploy({ remap: plan.remap })                 // dry run by default
await SCN.deploy({ remap: plan.remap, dryRun: false })  // for real
```

`portability()` returns a remap skeleton grouped by kind, each entry showing what the id *was*
(resolved to a human name) and how many times it is used:

- **connections** — recreate each one in the target tenant and authorize it there, then paste the new id.
- **models** — find the model **by name** in the target tenant. Never assume the id carries over.
- **users** — map each platform user id to the target tenant's user.

`deploy()` refuses to run while any reference still has an empty `to` (pass `force: true` to
deliberately leave some unchanged), substitutes ids across every file, and then runs the same
restore engine.

### Order of operations for a cold rebuild

1. **Connections** — create and authorize every one a person must sign in for. Nothing else works first.
2. **Objects, then records** — schemas before the rows that live in them.
3. **Workflows** — they reference connections; check a couple actually run.
4. **Skills and memory config** — a memory **set** must be `saveAndDeploy`-ed; profiles are not deployable.
5. **Agents** — they reference models, workflows-as-tools and skills. Publish each one and verify by snapshot
   (`unifyapps-builder` `references/agents.md` "Verify a publish by snapshot").
6. **Code apps** — for each repo: `POST /agent-api/sessions {target:"code-builder"}` to make the app,
   link it to the same GitHub repo, build `main`, then restore that app's data sources and fix the
   `automationId`s the report lists.
7. **Verify** — see below. Do not declare it done on a green report alone.

### Verify, do not assume

- Run one workflow per connector and read the output, not just the status.
- Ask each agent one question and confirm in Observability that the **model name** is the one you
  meant — check the price signature if unsure (Sonnet 4.6 ≈ 3 / 3.75 / 15 $ per M in / cache-write /
  out; Opus 4.8 ≈ 5 / 6.25 / 25).
- Open each app's preview and confirm its data sources return rows.
- Re-run `SCN.backup()` in the new tenant so it has its own restore points.

## Gotchas worth knowing

- **Connector `resourceVersion` numbers are per tenant/build.** Resolve them at runtime rather than
  trusting the snapshot's; a stale one fails at deploy.
- **A code app's preview only rebuilds on a branch switch**, and the switch is applied by the Code
  Builder page, not the API — open or reload `/p/0/interfaces/code-builder/{appId}?sessionId={s}`,
  or use its **More → Git → branches** panel, which is the reliable route.
- **Restore covers app configuration, not app code.** Losing the GitHub repos loses the apps.
- **`saveAndDeploy` is required** for agents, skills and memory sets — saving alone leaves a draft.
- Check `report.errors` and `report.codeChanges` every time. A clean-looking run with entries in
  either is not finished.

## Status of this skill

Backup and same-tenant restore are **proven in production use** (workflow delete → restore,
record tamper → restore, 110-file snapshots in ~30 s). Cross-tenant `deploy()` is **written but
not yet exercised against a second tenant** — treat the first migration as a rehearsal, run it
`dryRun` first, and keep the source tenant until the target is verified.
