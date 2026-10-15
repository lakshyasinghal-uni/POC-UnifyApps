# Code-based applications (Code Builder)

Observed on UAT 2026-09-21 on our own scratch code app `app-3dfc7c54e504` ("maher scratch code
app") and from the builder's JS bundle. The data-source contract underneath was **re-executed** on our own
config app — it is the same endpoint and the same governance.

## What a code app is

`e_interface` with `properties.manifest = {type:"WEB", mode:"code"}` and almost nothing else —
the app lives in a Git working tree managed by the **Code Builder agent API** (`/agent-api`,
same origin, cookie auth). The platform agent that writes it is `aiAgentId: "text_to_ui_tensor"`.
Preview/deploy host: `https://{appId}-orbit.tensor-uat.unifyapps.com`.

### Repo layout (template, 2026-09)

```
.agents/rules/project-guidelines.md          the agent's coding rules
.agents/skills/<name>/SKILL.md               28 platform skills, versions in .agents/skills/.engine-skills.json
   object-data v6, backend-integration v8, automation-integration v1, workflow-authoring v9,
   authentication v3, app-users v2, roles-and-permissions v6, copilot v6, file-upload v4,
   analytics v4, localization v18, theming v8, maps v8, content-security-policy v2, ...
.githooks/pre-push                           runs app/scripts/check-core-stack.mjs on each pushed commit
PLAN.md  PRODUCT.md  README.md  theme.json
app/package.json      React 19, Vite 8, TS 7 rc, Tailwind 4, TanStack Query 5, react-router 7,
                      zustand, radix-ui, recharts, i18next;  "@unifyapps/app-builder-sdk": "^0.4.0"
app/vite.config.ts  app/vite/uaSdkRuntime.ts  app/vite/sdkImportMapBlock.ts
app/src/main.tsx      wraps the app in <AppBuilderProvider> (mounts TanStack Query) — don't add another
app/src/data/         ALL platform calls: bindings.ts (generated), refresh.ts, one wrapper per object/automation
app/src/lib/data.ts   useData(id, 'seed'|'storage'|'callable', config) — reads go through this so the Data tab sees them
app/src/routes/ app/src/components/ (shadcn/ui in components/ui)
```

The SDK is **not installed from npm** (it isn't public). `app/.ua-sdk-config.json` maps each
subpath to a tenant CDN build through an import map (`app/vite/sdkImportMapBlock.ts`):
`hooks/object`, `hooks/workflow`, `hooks/user`, `hooks/upload`, `hooks/permissions`, … →
`https://cdn.unifyapps.com/lib/app-builder-sdk/uat/hooks/<name>-<hash>.js`, with peers
`react`, `react/jsx-runtime`, `@tanstack/react-query`. Always import via the package specifier
(`@unifyapps/app-builder-sdk/hooks/workflow`). `VITE_APPLICATION_ID` is set by the engine.
(The agent's `backend-integration` skill text still says "vendored under src/" — our app,
built 2026-09-21, uses the CDN import map.) A local `bun run build` works — the agent ran it.

## How app code reaches the platform

Only through `e_data_source` entities, executed with the SDK hooks:

```ts
import { useExecuteWorkflowNode, useExecuteWorkflowNodeMutation,
         getExecuteWorkflowNodeQueryKey } from '@unifyapps/app-builder-sdk/hooks/workflow'
```

- `useExecuteWorkflowNode({id, context, inputs, options})` — query (reads, runs on mount, cached).
- `useExecuteWorkflowNodeMutation().mutateAsync({ data: {id, context, inputs, options} })` — writes / button actions.
- Both put the `x-ua-app` header on the request. **Never** use the bare `executeWorkflowNode`
  (no header → rejected) or the deprecated `useTriggerWorkflow`. Never pass your own `meta`.
- The app must **never** call `/api/entity` or `/api/aggregation` — those are build-time only.

### Object CRUD — five object-agnostic bindings (`src/data/bindings.ts`)

Minted once per app (the agent's `provision_data_sources`), anchored to `e_global_<appId>`:

| export | action (`storage_by_unifyapps_…`) | overridable inputs |
|---|---|---|
| `FETCH` | `fetch_records` MULTIPLE | `object_type`, `triggerInputCondition`, `page`, `sortBy` |
| `FETCH_ONE` | `fetch_records` SINGLE | `object_type`, `triggerInputCondition` |
| `CREATE` | `create_record` (`useRawPayload:true`) | `object_type`, `rawPayload` |
| `UPDATE` | `update_record_by_id` (`upsert:false`) | `object_type`, `recordId`, `rawPayload` |
| `DELETE` | `delete_record_by_id` — 🚫 do not wire this binding into anything you build (no-delete rule); soft-delete via UPDATE | `object_type`, `entityId` |

`ENTITY = { task: 'maher_scratch_task', ... }` maps names to object ids. Rules: spread the **whole**
`storedInputs` and change only overridable fields; filter shape
`{operator:'AND', filters:[{property:'properties.status', filter:{operator:'EQUAL', value:'open'}}]}`
(record id is `id`; `value` singular except `IN`); response `data.response.objects[]` with
fields nested under `properties` (the helpers flatten); UPDATE replaces the whole record; every
write must invalidate reads of that `object_type` (`useRefresh`).

### Calling an automation — one data source per automation

```ts
const AUTOMATION_ID = '6aae3aab0900af6ee3a552c0'       // our Fleet - Vehicle Telemetry workflow
const DATA_SOURCE_ID = 'e_...'                          // the e_data_source you created for it
const RESOURCE_VERSION = 3124                           // callables_call_automation version it was created with
const PAGE_SLUG = `global-page-of-${import.meta.env.VITE_APPLICATION_ID}`

mutateAsync({ data: {
  context: { appName: 'callables', resourceName: 'callables_call_automation', resourceVersion: RESOURCE_VERSION },
  id: DATA_SOURCE_ID,
  inputs: { automationId: AUTOMATION_ID, version: '-1', runtimeConnections: {},
            parameters: { __internals__: { m: 'BUILDER', s: PAGE_SLUG, c: 'PLATFORM', p: 'browser' }, vehicleId },
            synchronous: true },
  options: {} } })
// output = res.response  (the STOP node's result; no `body` wrapper)
```

The matching data source (created with `POST /api/entity`, ✅ verified mechanism):
`properties: {name, type:"APPLICATION", interfaceId:<appId>, interfacePageId:"e_global_<appId>",
context:{appName:"callables", resourceName:"callables_call_automation", resourceVersion},
inputs:{automationId, version:"-1", runtimeConnections:{}, parameters:{vehicleId:"{{vehicleId}}"}, synchronous:true},
dP:[{p:"inputs.parameters.vehicleId"}], advancedOptions:{...}}`.

**So when Claude adds a feature to a code app that needs a new automation:** build + deploy the
workflow (`unifyapps-builder`), create its `e_data_source` over REST, then write the wrapper in
`app/src/data/` using the returned id. Objects: create with `POST /api/entity-type`
(`objects-and-connections.md`) and add to `ENTITY` — the five bindings already cover them.

## Agent API (`/agent-api`)

`s` = a Code Builder session id (an `e_...` case id). Opening the builder creates one
(`POST /agent-api/sessions`) and puts it in the URL `?sessionId=`.

| Method · path | Purpose | |
|---|---|---|
| `GET /sessions/{s}/files` | `{files:[{path,size}]}` whole tree | ✅ read |
| `GET /sessions/{s}/files/content?path=&v=` | raw file text | ✅ read |
| `POST /sessions` `{target:"code-builder", input, userName, userEmail, appId?, branch?}` | create app / new chat → `{appId, sessionId}` | ✅ |
| `PUT /sessions/{s}/files/contents` `{edits:[{path,content}]}` | save files (no commit) → `{filesVersion}` | ✅ |
| `POST /sessions/{s}/files/{op}` | file operation (create/rename; 🚫 `delete` op is forbidden — no-delete rule) | 📦 |
| `GET /sessions/{s}/branches` | `{current, default, linked, remoteError, branches:[{name,local,remote}], previewVersion, filesVersion}` | ✅ read |
| `POST /sessions/{s}/branches` `{branch, base, description}` | create branch | 📦 |
| `POST /sessions/{s}/branch` `{branch}` | switch branch — pulls remote commits. Often only **queues** it: `/branches` then shows `pendingBranch` with `buildPending:false` and `current` unchanged, and re-POSTing does not clear it. **Open or reload the Code Builder page** (`/p/0/interfaces/code-builder/{appId}?sessionId={s}`) — the switch runs on page load (2026-09-22). | ✅ |
| `DELETE /sessions/{s}/branches/{name}` | 🚫 delete branch (local **and remote**) — **forbidden, never call** (no-delete rule) | 📦 |
| `GET` · `POST` /sessions/{s}/git | Git status · link (`DELETE` = unlink — 🚫 forbidden; ask the user to unlink in the console) | ✅ GET/POST |
| `GET /sessions/{s}/changes` | commit list of the current branch `{branch, changes:[{sha, message, date, published}]}` | ✅ |
| `POST /sessions/{s}/restore` `{sha}` | restore a snapshot | 📦 |
| `POST /sessions/{s}/edits` | apply visual edits (180 s timeout) | 📦 |
| `POST /sessions/{s}/styles` `{file, loc, styles}` | style edit | 📦 |
| `GET /sessions/{s}/manifest` · `/routes` · `/data-model` · `/query-plan` | app metadata | 📦 |
| `GET /sessions/{s}/download` | zip of the source | 📦 |
| `POST /sessions/{s}/events?since=` | agent event stream | 👁 |
| `GET /sessions/{s}` | `{sessionId, status: running\|done\|stopped, target, appId, interactive}` — the cheapest way to poll a builder run | ✅ 2026-09-23 |
| `POST /sessions/{s}/stop` `{}` | stop the running builder turn → `{"ok":true}`; session `status` becomes `stopped` | ✅ 2026-09-23 |
| `POST /sessions/{s}/retry` · `/queue/...` | agent control | 📦 |
| `POST /apps/{appId}/publish` `{versionTag, versionNote}` | publish (default branch only) | ✅ |
| `GET /apps/{appId}/branches?offset&limit&detail=basic` | branches incl. remote, ahead/behind, PR, `remoteError` | ✅ |
| `GET /apps/{appId}/branches/{b}/files` · `/apps/{appId}/branches/{b}/files/content?path=` · `/apps/{appId}/branches/{b}/manifest` | read any app's code on a branch **without a session** — file list, raw file, and the manifest (`objects[]` with `usedIn`, `functions`, `components`, `edges`) | ✅ 2026-09-21 (read `app-91b0b6546409` to learn its sizing model) |
| `GET /apps/{appId}/deployed/routes` | published routes | 📦 |
| `GET /system-health` | engine health (`{pvc}`) | ✅ (503 during an outage) |

Chat with the builder agent goes through `POST /api/workflow/execute/node?name=call_automation`
(automation `66ab98083d73300e63962287`, `copilotType:"AI_AGENT"`, `caseId:<session>`); session
lists via automation `6a7c42a1eddf8930c2ffe6af` (`fetchType: SESSION_HISTORY | QUEUE_AND_LOCK_STATUS`).
A branch is locked while someone's agent run is active ("<name> is editing — this branch is busy").

## Create a code app over the API ✅ 2026-09-21

Verified by creating `app-282f2c90f0fd` with no UI at all:

```js
// 1. start the build — the Code Builder agent writes the app from the prompt
POST /agent-api/sessions
{ "target": "code-builder", "input": "<the app brief>",
  "userName": "<me.name>", "userEmail": "<me.email>"
  // optional: "appId" (continue an existing app in a new chat), "branch",
  //           "planner": {model, connectionId, provider, vertexProject, modelEntityId}
  //           (from text_to_ui_code_models; empty on UAT → omit), "attachments": [...]
}
→ 200 { "appId": "app-282f2c90f0fd", "sessionId": "e_6ab0fd75f843281fda600744" }

// 2. REQUIRED — the session does NOT create the application entity. Without it the app is
//    invisible in Applications and GET /api/entity/e_interface/{appId} is 404 (checked after 60 s).
POST /api/entity/create-update-or-delete/hierarchical
{ "entity": { "id": "<appId>", "entityType": "e_interface", "tags": [],
    "properties": { "type": "application", "name": "...", "description": "...", "standard": false,
      "manifest": {"type":"WEB","mode":"code"}, "deviceDetails": {"base":"desktop"},
      "metadata": {"logo": {...}, "_counter": {"_pageCount":0,"_moduleCount":0,"_mqttTopicCounter":0,"_templateComponentCount":0}},
      "navigation": {"primary":[],"secondary":[],"defaultPageId":""},
      "locale": {"defaultLocale":"en-US"}, "theme": {"defaultThemeId":"<an e_theme id>"},
      "flags": {"shouldReEvaluateUsingEntityIds": true}, "chatSessionId": "<sessionId>" } },
  "requestType": "CREATED", "ignoreVersion": true }

// ⚠️ metadata.logo is NOT optional — an empty {} fails validation ✅ 2026-09-23
//    "Non Empty Validations ... property logo invalid; required favicon" (HTTP 500).
//    Copy a working app's logo block verbatim:
//    {"favicon":"https://assets.unifyapps.com/interface/brand-logo/brand-logo-sm-3-comp.svg",
//     "large":"https://assets.unifyapps.com/interface/brand-logo/brand-logo-lg-4.svg",
//     "small":"https://assets.unifyapps.com/interface/brand-logo/brand-logo-sm-3-comp.svg"}
//    Live code apps carry NO `theme` property at all — omit `theme.defaultThemeId` rather than
//    inventing one (the first e_theme row on UAT is someone else's probe theme).

// 3. host
POST /api/domain-mapping/interface
{ "domain": "<appId>-orbit.tensor-uat.unifyapps.com", "module": "INTERFACE", "applicationId": "<appId>" }  → 204
```

Result (checked after the build): `app-282f2c90f0fd` appeared in the Applications list (`e_interface` aggregation), status `done`, preview built, bound to `maher_scratch_task` verbatim, and `security.type: PRIVATE` because the brief asked for login — the agent sets privacy from the brief onto the entity we created. **API-only creation is fully verified.**

Progress: read the session case — `POST /api/workflow/execute/node?name=fetch_records` on
`object_type: "service_hub_case"`, `id` = sessionId → `properties.customProperties.enginePayload`
`{status: "running"|"done", model, routing, preview_version, files_version, ...}`. The UI shows a
branch as busy while `status` is running; file edits and Git setup are refused until it is done.
A finished app's entity gains `interfacePageIdVsSlugMap`/`entityDetailsMap` for `e_global_<appId>`,
`security` (`PUBLIC` if the brief said "no login"), `integrations.appAnalytics`.

## Editing code over the API ✅ 2026-09-21

```
PUT /agent-api/sessions/{s}/files/contents   {"edits":[{"path":"README.md","content":"<whole file>"}]}
→ 200 {"filesVersion": 2}
```

That writes the working tree only — **it does not commit**. The UI then asks the agent to
commit with a fixed message (strings from the bundle):
`"I made some changes to <path> (modified). No rebuild needed — commit these changes."` or
`"… Rebuild the preview with these changes, fix any code errors they introduce, and commit the result."`
Sent in the builder chat, the agent shows it as *Manual edit* and commits (verified: commit
`b903fd8`, then pushed to GitHub). The chat-send request itself travels over the streaming
channel and was not captured — until it is, send it from the builder chat, or prefer the Git
route below (no chat needed). Other file ops: `POST /agent-api/sessions/{s}/files/rename`
`{from_path, to_path}` 📦 (and create/delete by the same pattern).

## Privacy and publishing ✅ 2026-09-21

- **Private vs public is `e_interface.properties.security.type`** (`PUBLIC` | `PRIVATE`), read by
  the SDK at runtime — not a code toggle. For a **code** app the platform **refuses** changing it
  from *Settings → Security → Privacy Settings* (client-side `RefusalError: '<appId>' is a
  code-builder app … Change it in the code builder instead`). Ask the builder agent instead
  ("Make this app PRIVATE (sign-in required) using the app security setting…") — it calls its
  `update_app_security` tool; verified `security.type` flipped to `PRIVATE` within a minute.
  A brief that says "no login page" makes the agent set `PUBLIC`.
- A private app redirects to `/login?returnTo=/` on its host (verified on the published URL).
  Users must be granted in the app's *Settings → Users* (empty by default).
- **Publish:** `POST /agent-api/apps/{appId}/publish {"versionTag":"v1","versionNote":"..."}`
  (tag: starts with a letter, no spaces, only `-`/`_`). Default branch only. Result on the entity:
  `deploymentState {deployedAt, deployedBy, deploymentNotes, deploymentTag, version,
  additionalDetails:{sourceCommitHash}}` — the published commit is recorded; `/changes` marks it
  `published: true`. Published v1 of `app-3dfc7c54e504` from `3d2aadd`.
- **Merge-to-`main` pickup ✅:** after merging PR #1 on GitHub, the builder's `main` contained the
  merge (`9ea3734`). The engine added two merge commits of its own (`4d87e3e`, `3d2aadd`) that were
  not on GitHub yet — it reconciles local and remote `main` rather than fast-forwarding.
- Sending a builder chat message did not appear on any page-level fetch/XHR/WebSocket hook (only
  121-byte MQTT frames). To instruct the agent over the API, start a new session on the app:
  `POST /agent-api/sessions {target:"code-builder", appId, branch:"main", input:"<instruction>", userName, userEmail}`
  (same call the builder's "new chat" uses — the new-app form of it is verified; the existing-app
  form is 📦 from the bundle).

## Git / GitHub ✅ two-way, verified 2026-09-21

Link (captured from the UI, then used): Code Builder → **More → Git → Continue to Git setup →
GitHub → pick connection → Owner / Repository name / Description → Create repository**.

```
POST /api/lookup?ByQuery=APPROVED_GITHUB_ORG
{ "type":"ByQuery","lookupType":"APPROVED_GITHUB_ORG",
  "options":{"connectionId":"<github connection>","skipApprovalCheck":true,"source_resource_name":"github_fetch_organizations"},
  "query":"","page":{"limit":1000,"offset":0} }
→ objects [{ "id":"username:<your-github-login>", "name":"Your Repository" }, ...orgs]

POST /agent-api/sessions/{s}/git
{ "provider":"GITHUB", "connectionId":"<your own github connection id>",
  "repositoryName":"<yourname>-scratch-code-app", "projectName":"<yourname>-scratch-code-app",
  "organizationName":"username:<your-github-login>",
  "createOptions":{"autoCreate":true,"payload":{"visibility":"private","newRepoName":"<yourname>-scratch-code-app",
                   "org":"username:<your-github-login>","description":"..."}} }
→ 200 { provider, connectionId, repositoryName, repositoryUrl, remoteUrl, linkedAt, branch:"main", branchUrl }
```

- `GET /agent-api/sessions/{s}/git` → `{linked, config, sync:{state:"syncing"|"error"|…, ts, detail}}`;
  `DELETE` the same path unlinks (repo kept). The app entity records it in
  `properties.additional.gitDetails {provider, connectionId, organizationName, repositoryName, projectId, branch, linked, repositoryUrl}`.
- Personal account vs org: tenant flag **"Code app repositories under organizations only"**
  (`/settings/feature-flags`), **off on UAT** → personal accounts work.
- ✅ **A connection whose token can reach new repos pushes immediately** (orbit.uat, 2026-09-23):
  Maher's connection `6aaa918c8a8a3c62230da19a`, `organizationName:"username:mmaheranwar"` →
  `POST .../git` 200, starter commit `5e7a814` on GitHub within seconds, `GET .../git` →
  `linked:true`. No PAT/repo-access step, no "commit the working tree" nudge. The trap below is
  the fallback for connections that fail to push.
- **Token trap (hit and fixed):** the repo is created through GitHub's API, then the engine
  pushes with the same token. A **fine-grained PAT limited to "Only select repositories"** can
  create the repo but cannot push to it → repo exists but is empty, `sync.detail: "push failed —
  see engine logs"`, branches `remoteError: "could not reach the remote repository"`. Fix: add the
  new repo to the token (Contents: read & write), or use "All repositories". There is no retry
  call — the push happens on the **next saved change** (a commit).
- **UnifyApps → GitHub:** every agent commit is pushed; SHAs are identical on both sides
  (`00e743b`, `b903fd8`), commits co-authored by the UnifyApps user.
- **GitHub → UnifyApps:** a branch pushed from outside appears within seconds in
  `GET /agent-api/apps/{appId}/branches?offset=0&limit=10&detail=basic` and in the session's
  branches as `{local:false, remote:true}`. `POST /agent-api/sessions/{s}/branch {"branch":"claude/pull-test"}`
  checks it out and the Code Builder serves the pushed commit (`051e482`) — verified by reading
  the file back through `/files/content`.
- ✅ Merged-to-`main` commits are picked up too (PR #1, `9ea3734`) — see *Privacy and publishing*.
  (`/agent-api` can return 503 cluster-wide during engine outages — wait, don't retry in a loop.)
- Branch rows show *Check status*, *Behind | Ahead*, *Pull request*. Publishing is allowed only
  from the default branch (`POST /agent-api/apps/{appId}/publish` 📦).

### Working on a code app from a Claude session — the loop

This is the **mandatory** flow (SKILL.md, "Maher's code-app methodology") — never hand the brief
to the builder agent, never work on an app you do not own.

1. Create a **new** app (`POST /agent-api/sessions` with a minimal-starter brief + entity + domain);
   wait for `GET /agent-api/sessions/{s}` → `status: "done"`. Before touching any existing app,
   check its `ownerUserId` against `/api/user-context` `user.id` and the commit authors in
   `GET /sessions/{s}/changes`.
2. Link Git (`POST /agent-api/sessions/{s}/git`) with the user's GitHub connection; confirm
   `GET .../git` → `linked:true` (empty repo + `linked:false` = token cannot push → PAT fallback).
3. `gh repo clone <owner>/<repo>`; read `.agents/rules` and `.agents/skills` first; `bun install`
   (installs the pre-push hook) and `bun run build` before pushing.
4. Create platform assets over REST (objects, workflows, `e_data_source`s, agents) — fastest by
   cloning the known-good assets of an earlier build (next section); reference their ids in `app/src/data/`.
5. Push a branch, open a PR, merge to `main`.
6. In UnifyApps, switch the session to the branch/`main` (`POST /agent-api/sessions/{s}/branch`)
   to pull it in, check the preview, then publish from `main`.

## Findings from the supplier-risk reference build ✅ orbit.uat, 2026-09-23

The reference build for the mandatory flow (owner Maher, user 109790); app id, session, repo and
object list in `unifyapps-solution-playbook/references/builds/rest-supplier.md`. Six objects
prefixed `<uc>_` (supplier, signal, alert, treatment, critical op, agent run). Workflows
`<uc>_query` `6ab35e559d7b0545553f32f6`, `<uc>_ai_insights` `6ab35e567c47e164fbec3277`,
`<uc>_ai_writer` `6ab35e577c47e164fbec3279`, `<uc>_create_treatment` `6ab35e57e1138510acc6d76e`.
Agent (supplier risk analyst) `e_6ab35e9e04beb12b3891957a`.

### Clone the platform layer from an earlier build — don't write it from scratch ✅
The whole platform layer (6 objects, 3,397 records, 4 workflows, 9 data sources, 1 agent with 3
tasks + 2 tools) took **~10 minutes** by cloning the known-good assets of an earlier
government-performance build (UAT only):

| Asset | Clone recipe | Source ids |
|---|---|---|
| Workflow | `GET /api/workflow-definition/{id}` → strip ids/metadata, change name / prompt / `object_type` → `POST /api/workflow-definition` → `saveAndReturnViolations` → `deploy?version=<live version>` | `<uc>_query` `6ab2cae9f3e2c17d001f62d5` · `<uc>_ai_insights` `6ab2cd14c0d5e963952f2f3f` · `<uc>_write_insight` `6ab2cb57c0d5e963952e0abd` |
| Storage data sources | `GET /api/entity/e_data_source/{id}` → change `name`, `interfaceId`, `interfacePageId` → `POST /api/entity` | FETCH `e_6ab2c239c9518d72189ab173` · FETCH_ONE `e_6ab2c239c9518d72189ab177` · CREATE `e_6ab2c239c9518d72189ab17b` · UPDATE `e_6ab2c23931928d0792e3f1da` · DELETE `e_6ab2c239c9518d72189ab17e` |
| Callable data source | same, plus `inputs.automationId` → the new workflow | template `e_6ab2cd5531928d0792e64c72` |
| Agent | copy `ai_agent.properties` wholesale, replace name / instructions / role / goal; create `e_topic_ai_agent` + `e_action_ai_agent` rows; `POST /api/entity/action/saveAndDeploy` with the full entity | executive analyst agent `e_6ab2cc71aa675d12810f273c` |

### One "AI writer" workflow serves every narrative ✅
A clone of the insight engine with inputs `p_screen` (task name), `p_context` (task instructions,
**including the exact JSON shape** to return), `p_actions`, `p_data` served supplier narratives,
signal triage, treatment plans, board briefs and scenario analyses from **one workflow + one data
source** (`<uc>_ai_writer`). Add a task by adding a prompt in the app, not a workflow.

### Smaller findings ✅
- **Starter app + GitHub link over the API, no builder brief:** the starter commit `5e7a814`
  reached GitHub within seconds of `POST .../git` (Maher's connection) → `linked:true`.
- **`GET /api/entity-type?entityType=<id>` for a missing object → 200 with an EMPTY body**, so
  `r.json()` throws "Unexpected end of JSON input". Read `r.text()`; empty = not found.
- **Records:** 12 parallel `POST /api/entity` workers loaded 3,397 records (412 suppliers, 2,926
  signals, 38 alerts, 14 treatments, 7 critical ops) with zero failures in well under a minute.
- **Scaffold publish right after the data sources:** `POST /agent-api/apps/{appId}/publish
  {versionTag:"v0-scaffold"}` made a callable DS and the storage FETCH DS execute from the app
  context (`x-ua-app`) immediately.
- **Ownership lesson:** a colleague's app `app-6adc194ec366` (owner 94598) was mistaken for
  Maher's (109790) and a builder run started on it; stopped with `POST /agent-api/sessions/{s}/stop {}`
  → `{ok:true}`, `status: "stopped"`, no commits. Check `ownerUserId` and commit authors first.

## Findings from the procurement build ✅ orbit.uat, 2026-09-23

The mandatory flow run end to end a second time, on a bigger domain: supplier registration and
strategic sourcing for a utility in Egypt. App id, session and repo in
`unifyapps-solution-playbook/references/builds/taqa.md`. 16 objects prefixed `<uc>_`,
**~14,000 records**. Workflows
`<uc>_query` `6ab380eb9d7b0545554c2ba6`, `<uc>_ai_insights` `6ab380f8aa76b93f750b3307`,
`<uc>_ai_writer` `6ab380f9aa76b93f750b334e`, `<uc>_create_action` `6ab38117333496691060c841`,
`<uc>_apply_scenario` `6ab38411e1138510acf61b80`. Agents: Sourcing Analyst
`e_6ab38228223be332a6b64d0a`, Registration Officer `e_6ab3822904beb12b3893e342`, Supply Risk &
Compliance Advisor `e_6ab38229c9518d7218a8abf5`.

### Mint a sixth storage binding for UPSERT ✅
The cloned five bindings are not enough for a re-runnable seed: `upsert` is a **stored** input on
the UPDATE data source (`false`), and overriding it is refused as `invalid input`. Clone the
UPDATE `e_data_source`, set `properties.inputs.upsert = true`, rename, `POST /api/entity`, and
publish. Every writer then becomes `upsert(object, businessKey, payload)` — no read-before-write,
no create-or-update branching, and re-running the whole seed is safe. (API-SPEC §27.)

### Clone the government-performance build's `<uc>_apply_scenario`, but express scenarios as RULES ✅
`6ab2cbd146123637e2d79b3e` is the graph to clone (7 fetches → Groovy → 5 bulk upserts → delete +
bulk create insights → scenario flags → STOP). Change the object types, the fetch page limits and
the Groovy, and keep the node ids — the templates reference them by name (`n_calc`, `n_scn`, …).
Then make the payload a set of rules (`{object, where, set}` with `+n` / `*n` / literal) rather
than a list of record ids: the payload stays small, one Groovy serves every lever, and a lever
survives the dataset being regenerated. Verified: 12 levers moved 806 records; reset restored
every one byte for byte. Full shape in API-SPEC §30.

### The two things that made the reset wrong, both silent
1. **A baseline that did not cover every field a scenario sets.** Derive the key set mechanically
   by walking the payloads (`T.baselineKeys()` in the repo's `tools/<uc>-seed.js`), widen every record's
   `baseline_json` to it, then read them back and **assert** nothing is missing.
2. **Two definitions of one derived field.** The category seed banded risk at `>= 36`; the app and
   the scenario engine banded at `>= 34`. Three categories sat in the gap, so the reset restored
   the score and left the wrong badge beside it. Any field the automation re-derives after a write
   needs one threshold shared by the seed, the app and the Groovy.

### Export the platform layer AND the seed back into the repo ✅
One browser pass reads every workflow definition, agent (with its `e_action_ai_agent` tools), data
source and object schema into a single object and downloads it; split each `code_by_unifyapps`
node's `inputs.code` into a `.groovy` locally. ~390 KB covered 5 workflows, 3 agents, 11 data
sources and 16 schemas → `platform/<uc>-platform.json` + `platform/groovy/`.

**Do the same for the seed.** The seed was pasted into the tab and then edited *there* while
iterating, so the file first written to the repo no longer matched what ran. Serialise the live
namespace back out (`JSON.stringify` for data, `fn.toString()` for functions) and commit that —
it is the only copy that is certainly the one that produced the data. Downloads land in
`~/Downloads` as `<uuid>.tmp` and are deleted when the tab navigates, so move them immediately.

### Groovy: some plain identifiers are blacklisted ⛔
`def owner = …` was refused: `Blacklisted commands found in code : owner = at position 1050`. The
check is a substring scan, not a parse — rename the variable.

## Findings from the document-fraud build ✅ orbit.uat, 2026-09-23

The mandatory flow a third time, on a domain whose whole point is evidence: reimbursement-claim
fraud detection. App id, session and repo in
`unifyapps-solution-playbook/references/builds/claim-integrity.md`. 16 objects prefixed
`<uc>_`, ~11,200 records. Workflows `<uc>_query` `6ab3b9ec7c47e164fb265c7d`, `<uc>_aggregate`
`6ab3bb98d95dfa746ea5264f`, `<uc>_ai_insights` `6ab3ba2a7c47e164fb2666ef`, `<uc>_ai_writer`
`6ab3ba2b9d7b05455586c2c2`, **`<uc>_forensics` `6ab3bb54aa76b93f751c2699`**, `<uc>_create_action`
`6ab3bb6b33349669108fc239`, `<uc>_apply_scenario` `6ab3bbeb7c47e164fb26f3da`. Agents: Claims
Analyst `e_6ab3beb9223be332a6bcb270`, Forensic Investigator `e_6ab3bee7c9518d7218afefe9`,
Policy & Recovery Advisor `e_6ab3bee7c9518d7218aff00a`.

### Call a real external service from a workflow — it is one node ✅
The thing that made this app more than a dashboard: `<uc>_forensics` posts a PDF to a deterministic
document-forensics service over `custom_http_endpoint_execute` and writes every flag it raises into
`<uc>_finding` plus a `<uc>_document` row. The app's *Analyse a document* screen reads a file in the
browser, base64-encodes it and calls the data source — **2.3 s end to end**, on a real document, in
front of the viewer.

No connection is needed and no `bodySchema` has to be declared: map a plain `body` input from a
Groovy step's output. Exact node shape in API-SPEC §35. Outputs are `status` and `result`.

**Design note that matters more than the plumbing:** let the external engine own the verdict, and
let the workflow own the *records*. The Groovy step turns its report into rows and returns a
summary; it does not re-score, re-word or soften anything. When the screens and the agent then
disagree with the engine, the disagreement is visible instead of averaged away.

### Do not hand a Groovy step 3,000 JSON parses ⛔ → ✅
The control room's reset walked every row of four objects and `JsonSlurper`-parsed each
`baseline_json`: apply 1.9 s, **reset over 45 s** — for a reset with nothing to restore. Add a
boolean (`scn_dirty`) that the apply sets on every record it writes, skip any row without it, and
clear it as part of the restore: **reset 1.16 s**, still exact (zero drift over 2,978 records).
Guard the parse, not the write.

### Clone the app SHELL, rewrite the domain
The reusable half of a previous build is larger than it looks: `components/charts/*`,
`components/ua/{AgentDock,Ask,InsightPanel,StoryBar,kit,Figures}.tsx`, `copilot-host.tsx`,
`src/copilot-island/*`, `island/*`, `vite.island.config.ts`, the prebuilt `public/copilot-island`
(28 MB — copying it skips the local island build entirely), and `data/{actions,ai-task,scenario,
insights-live,bindings,datasources}.ts`. What must be rewritten is the domain: `data/<app>.ts`,
the routes, the palette and the `:root` tokens.
- Take the design system's CSS wholesale and **recolour the token values**, keeping every class
  name. `band-dark`, `qa-card`, `qa-eyebrow`, `qa-display`, `qa-rise`, `glass` are internal names;
  changing them costs edits in a dozen files and buys nothing. Recolouring `:root` changes the
  product's identity completely, in one file.
- Check the prebuilt island for the previous brand: only its `<title>` carried it
  (`index.html`, `agent.html`, `agent-page.txt`). Invisible in an iframe, still wrong to ship.
- Re-point three things by hand or the build lies to you: `insights-live.ts` (the automation name
  and the `ASK_AGENT` label), `ai-task.ts` (the STOP field — ours returns `output`, the donor
  build's returned `insights` — and the agent-run record's shape), and `lib/story.ts` (its `Story` import).

### The starter's `tsc -b` catches exactly the right things
A copied component tree failed on four real problems and nothing else: two missing dependencies
(`chart.js`, `exceljs`), a palette that had lost `GOLD`/`rampFor`/`PERFORMANCE_RAMP`, an unused
auth component pointing at a deleted wordmark, and `useTranslation('story')` against a starter
that declares only the `common` namespace. Full build after that: **1.3 s**, 2,038 modules.

### A PRIVATE app cannot be tested on the dev server ⚠️
`bun run dev` proxies `/api` to the tenant, but the localhost tab carries no platform session, and
`APP_AUTH_TOKEN` alone does not authenticate `execute/node` (§26). Every read comes back 401 and
the page renders empty. Test on the **builder preview** (runs under the platform session), not on
localhost, unless the app is PUBLIC. The published URL is tested only when the user asks for it.

## Findings from an earlier agentic-assistant build (Oracle EBS) ✅ 2026-09-21

### A code app created over the API has no global page — data sources need one
**Symptom:** `POST /api/entity` for an `e_data_source` with `interfacePageId: "e_global_<appId>"`
→ `500 {errorCode: 5011, "Parent e_component:e_global_<appId> not found while resolving
permissioned ancestor of e_data_source"}`. The session + `e_interface` + domain mapping recipe
above does **not** create the app's global page, and the builder agent only mints it when it
provisions data sources itself (a brief that says "create no data sources" never gets one).

**Fix (verified):** create the page yourself, then the data sources succeed:
```
POST /api/entity/create-update-or-delete/hierarchical
{ "entity": { "id": "e_global_<appId>", "entityType": "e_component", "tags": [],
    "properties": { "layout": {"body":"root_id","header":"header_id","footer":"footer_id"},
      "interfaceType": "application", "componentType": "PAGE", "metadata": {"_version": 2},
      "blocks": { ...header_id / root_id / footer_id Stack blocks, copied from any app's global page... },
      "flags": {"shouldUseBuiltDependencies": true}, "name": "global-page-of-<appId>",
      "slug": "global-page-of-<appId>", "interfaceId": "<appId>", "useAsync": true,
      "dataSources": {}, "pageVariables": {} } },
  "requestType": "CREATED", "ignoreVersion": true }
```
Then 57 automation data sources were created in one pass (8 in parallel, zero errors) and
executed through `POST /api/workflow/execute/node?name=<any>&requestId=<dsId>` from a logged-in
platform tab — 200 with `response.rows` straight from Oracle EBS.

### Data source shape that works for a CALLABLE workflow with N inputs
`properties.inputs.parameters` = every START-schema property as `"{{name}}"`, and `dP` = one
`{p:"inputs.parameters.<name>"}` per property. Tag the entity (`tags:["..."]`) — it is accepted.

### Git link with a fine-grained PAT limited to selected repositories
`POST /agent-api/sessions/{s}/git` → **200** with `repositoryUrl`; the GitHub repo exists but is
**empty**, and a later `GET /agent-api/sessions/{s}/git` returns `{"linked": false}` — the link
did not persist because the first push failed. The user must add the repo to the token
(Contents: read & write) before the link/push can succeed.

## Git-driven dev loop — what actually moves UnifyApps ✅ 2026-09-21 (the agentic-assistant build)

- **The engine only fetches from GitHub when it meets a branch it does not know.** Pushing to
  `main` alone changes nothing (`/changes` head stays old, `/apps/{id}/branches` shows
  `behind: 0`). Reliable recipe after every push:
  `git push origin main:refs/heads/sync/<short-sha>` → `POST /agent-api/sessions/{s}/branch
  {"branch":"sync/<short-sha>"}`. It does **NOT** move the engine's local `main`, and publish
  builds from that: before publishing, switch the session to `main` until `/changes` shows the new head,
  then publish and read back `deploymentState.additionalDetails.sourceCommitHash` (API-SPEC §40.11).
- **A branch switch is checkout + full preview build.** `pendingBranch` stays set for 1–3 min;
  when the build fails the switch is refused ("Could not switch to X — script build was
  terminated…") and `current` stays put. Poll `GET /sessions/{s}/branches` in ≤40 s chunks.
- The preview is same-origin at `/agent-api/preview/{sessionId}/…` — open
  `/agent-api/preview/{s}/<route>` in its own tab to test at full size (the builder's iframe src).

## The SDK copilot cannot be compiled by the cloud builder ⛔ → prebuilt "island" ✅

- **Symptom:** preview build dies at `rendering chunks…` with `memory allocation of 38160576
  bytes failed` / `SIGABRT`, 4,646 modules. Cause: `@unifyapps/app-builder-sdk/copilot` is
  never CDN-delivered (see `vite/uaSdkRuntime.ts`) — it is a 7.9 MB entry that alone needs
  ~1.7 GB to bundle (measured locally: app without copilot 464 MB, copilot-only app 1,681 MB).
  A copilot-ONLY app fails the same way, so it is not app size. Worth raising with UnifyApps.
- **Fix that keeps the full SDK copilot (charts, artifacts, approvals):** build it LOCALLY as a
  separate page and commit the output as static files the cloud build merely copies:
  `app/island/index.html` + `main.tsx` → `vite.island.config.ts` (`root: island`, `base: './'`,
  `outDir: public/copilot-island`, `define process.env`) → `bun run build:island`.
  The host frames `${BASE_URL}copilot-island/index.html` (same origin → same session) and
  initialises it with `postMessage({type:'<prefix>-copilot:init', options:{interfaceId, baseUrl,
  isPreview, appAuthToken, initialPrompt}})` (the current assets use `ua-copilot:init`); the island wraps `CopilotProvider` in its own
  `AppBuilderProvider`. Mark the output `-text` in `.gitattributes`. ~33 MB, ~2,050 chunk files.
- **Frame it — do not mount it in the host document:** `copilot.css` ships global utility class
  names (`bg-primary`, …) that overrode the host app (brand mark and avatars lost their fill).
- **`useCopilotActions().sendMessage({message})` stayed a no-op** (takes an object, not a string —
  a string is silently ignored too). What works for "open the chat with this question":
  focus `.ProseMirror`, `document.execCommand('insertText', false, text)`, then click
  `button[aria-label="Send message"]` — once, after the composer exists.
- The chat header shows the agent entity's `name` and `description` — rename the agent if the
  app must not show an internal name.
- The agent **Deployments → Copilot** type publishes the agent into UnifyApps' own Copilot panel
  (`ai_agent_deployment`, `type: COPILOT`, `trigger.context.appName: unify_ai`); it is not an
  embeddable widget.
- **Agent charts show "This chart could not initialise" in the island** ✅ fixed 2026-09-21.
  The "Generate charts using code" tool emits an HTML doc rendered in an
  `<iframe sandbox="allow-scripts" srcdoc>` that loads Chart.js from
  `cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.js` (fallback jsdelivr 4.4.0) and
  self-checks for `window.Chart`. A `srcdoc` frame **inherits the embedding document's CSP**, and
  the preview serves app files with `script-src 'self' blob: 'unsafe-inline' … *.unifyapps.com`
  (no cdnjs/jsdelivr; `connect-src` excludes them too, so runtime fetching is out). Fix: bundle
  `chart.js@4.5.0` in the island and patch `HTMLIFrameElement.prototype.srcdoc` +
  `Element.prototype.setAttribute('srcdoc')` to replace the CDN `<script src>` with an inline
  copy (escape `</script`, strip `sourceMappingURL`). chart.js does not export its UMD file —
  import it as `'../../node_modules/chart.js/dist/chart.umd.min.js?raw'` (an alias loses `?raw`).
  Inspect: the island iframe is same-origin, so `iframe.contentDocument.querySelector('iframe').srcdoc`
  shows the chart document.

## Findings from building the hub app ✅ 2026-09-21

### Getting GitHub commits into the builder
- **The shortest loop that works (re-verified 2026-09-22):** push to GitHub `main` →
  `POST /agent-api/sessions/{s}/branch {branch:"main"}` and open
  `/p/0/interfaces/code-builder/{appId}?sessionId={s}` (that page load runs the pull; the files are
  then readable at `/sessions/{s}/files/content` and `/apps/{appId}/branches/main/files/content`) →
  the shareable preview is still the OLD bundle, so bounce the branch: `POST .../branch` to any
  other branch, wait ~4 s, `POST .../branch` back to `main`. `buildPending` flips true and the new
  bundle serves within ~10 s. No agent turn, no chat message. Verify by reading
  `assets/index-*.js` out of the preview's `index.html` and grepping it for a string from the new
  code — the file name can stay the same. **Do not verify with `/sessions/{s}/files/content`**: it
  served the PREVIOUS revision for a whole build cycle (2026-09-24) while `/apps/{app}/branches/main/files/content`,
  `/changes` and the built bundle all had the new commit. The built bundle is the only honest check.
- ✅ **Reliable pull, tool.prod-aps1 2026-09-28 (API-SPEC §60.17):** the switch is ASYNCHRONOUS and its
  reply shows the OLD `current`. Switch to any other branch, poll `GET /agent-api/sessions/{s}/branches`
  until `current` equals it, then `POST …/branch {branch:"main"}`: ~20 s later `current:"main"`,
  `buildPending:true`, and `GET …/changes` heads with the GitHub commit. Bouncing without waiting, or
  loading the code-builder page, pulled nothing in four attempts.
- `POST /agent-api/sessions/{s}/branch {branch}` on an **existing** session returned the branch list
  (`local:true`) but left `current:"main"` and did **not** pull a merged PR — files stayed at the old commit.
- ✅ Starting a **new** session on the app pulls remote `main`:
  `POST /agent-api/sessions {target:"code-builder", appId, branch:"main", input:"Pull the latest commits from the linked GitHub main branch and rebuild the preview. Do not modify…", userName, userEmail}`
  → `GET /agent-api/sessions/{new}/changes` showed the merge commits within 15 s and the preview rebuilt.
  Test in that session's Code Builder preview (runs under the platform session — no app users needed).

### Privacy
- An API-created code app may have **no `security` at all** (not PRIVATE). Ask the builder in a new session:
  "Make this app PRIVATE (sign-in required) using the app security setting (update_app_security). Do not
  change any code…" → `security.type:"PRIVATE"` within ~1 min, no commit.

### Motion
The template's `app/src/index.css` ends with a **global** reduced-motion fallback that sets
`animation-duration: 0.01ms !important` (and the same for transitions) on `*, *::before, *::after`.
Every app inherits it, and on a machine that reports `prefers-reduced-motion: reduce` it silently
kills all motion in the app — the computed `1e-05s` on untouched elements looks like a browser
clamp but is this rule. For a UI whose point is the movement, scope it (and the per-component
blocks, and the guard inside `ua-mark.tsx`'s inline `<style>`) under `:root[data-motion='reduce']`
so the behaviour is opt-in rather than deleted. Verified on the hub app, 2026-09-25.

### Theme
- Don't copy `theme.defaultThemeId` from another app: the pinned theme was someone's indigo test theme.
  An API-created app's code keeps the template tokens until the builder's `set_app_theme` runs; for a
  code-first app, remove the pin (`delete properties.theme` + `POST /api/entity/update`) and own the tokens
  in `theme.json` + `src/index.css` `:root`/`.dark` + the `ua:theme-font` link (keep all three identical).
  Platform themes are `e_theme {name, defaultScheme, cssVars:{--palette-brand-*, --bg-*, --text-*, --fontFamily-*, …}}`.

### Data sources for a code app (all ✅ executed through `execute/node` with `x-ua-app`)
Create `e_global_<appId>` first (copy `properties.blocks/layout` from any app's global page), then:
- object reads: one `storage_by_unifyapps_fetch_records` data source (`inputs` = the FETCH `storedInputs`,
  `dP` for object_type/triggerInputCondition/page/sortBy) → put its id in `src/data/bindings.ts` `FETCH.id`.
- each CALLABLE: `inputs.parameters = {<every START field>: "{{<field>}}"}`, `dP` one per field; the app
  sends `parameters.__internals__ = {m:"BUILDER", s:"global-page-of-<appId>", c:"PLATFORM", p:"browser"}` too.
- `useExecuteWorkflowNode` + an `x-ua-app` request works from the dev server and the preview.

### Copilot parts
- `appearance.customStyles.*.borderRadius` is an **object** (`{all:"rounded-xl"}`), not a CSS string (TS2559).
- **Native chart blocks instead of the chart tool (fast + interactive)** ✅ 2026-09-21. The agent's
  "Generate charts using code" tool is a sub-agent (skill load → 3–4 sandbox runs → preflight →
  ~80 KB HTML): 65–120 s per chart. Instead instruct the agent to write a fenced block with a
  language tag (today `ua-chart`) holding one JSON chart spec; the island replaces it with its own
  Chart.js component. Measured: chart on screen in ~30 s including the Oracle tool call. Rendering facts:
  - the chat renders fences as `div.codeHighlighter > pre > code.language-<tag>` and **drops
    everything after a hyphen** in the tag (`ua-chart` → `language-ua`) — match on the prefix, or use a
    hyphen-free tag;
  - mount with a MutationObserver: hide the `.codeHighlighter`, insert a sibling host, render when
    the JSON parses (show a placeholder while streaming), unmount hosts whose container left the DOM;
  - agent answers live under `.prose`; keep DOM rewrites out of it.
  - Task-level instructions can still mention charts ("generate one") — update them too and
    republish the agent.
- **The SDK copilot has no locale option** — its chrome ("New chat", "Thinking...", "Executing
  tool: …") is English. `dir` is supported (inherits `<html dir>`). For Arabic, rewrite exact-match
  text nodes outside `.prose/pre/code` with an observer.
- `CopilotConfigProps.size`: `lg` full layout, `sm` narrow panel — use `sm` for a side dock.
- The agent entity `description` is shown under the agent name in the empty chat — keep it
  language-neutral for a bilingual app.

## Agent chat in a code app — use the copilot ISLAND ✅ 2026-09-21
The prebuilt copilot parts (`@unifyapps/app-builder-sdk/copilot`, 7.87 MB, never externalized) make the
**cloud builder run out of memory** ("memory allocation of N bytes failed" at "rendering chunks", SIGABRT —
seen on every preview build of two apps). Two working alternatives:

   **Symptom when you skip this:** local build green, cloud build fails with
   `RolldownError: WebAssembly.Memory.grow(): Unable to grow instance memory` (UAT 2026-09-23).
1. ✅ **Copilot island** (recommended — full SDK interactivity): build the copilot as its own page
   **locally** (`vite build -c vite.island.config.ts` → `app/public/copilot-island/`, ~28 MB, commit it),
   frame it same-origin from the app, and hand over identity + questions with `postMessage`
   (`ua-copilot:ready` → `ua-copilot:init {interfaceId, agentId, baseUrl, isPreview, appAuthToken,
   initialPrompt, welcomeText, placeholder, compact}` → `ua-copilot:send {text}`). You keep token
   streaming, thinking/tool status, approval cards and history. The main app build drops to ~1–2 s.
   Add `public/copilot-island` to `.oxlintrc.json` `ignorePatterns`. A programmatic send goes through the
   chat's own composer (`.ProseMirror` + `button[aria-label="Send message"]`) because
   `useCopilotActions().sendMessage` is a no-op in the framed build. Canonical source (UnifyApps Gold):
   `E:/github/SC-Companion/platform/copilot-island` (+ `install.py`); origin: the earlier agentic-assistant build.
   **For an island with starter chips / a welcome overlay and host-sent questions, start from
   `assets/agent-dock/island/entry.tsx` + `composer.ts` and `assets/agent-dock/copilot-host.tsx`**
   (2026-09-23): the overlay hides the moment a conversation begins, the island document is fetched
   `no-store`, and the host verifies the first question actually landed. See ai-app-patterns §3 and §12.
   🔴 **Never auto-send on the user's behalf, and never put tool names or JSON in a user-voice message**
   (owner feedback 2026-09-21: "I'm working on deal … Look it up with scc_deal_lookup (detail=true) …" was
   rejected outright). Opening a dock sends nothing; show the scope in the header / `welcomeText`; offer
   plain-language starter chips that send only on click; buttons that hand data over send a short natural
   bullet summary. Tool routing lives in the agent's instructions, not in the app.
2. ⚠️ `hooks/copilot` `useCopilotChat` (runtime-resolved, tiny) + your own renderer: builds fine, but it
   **polls** (5 s while generating) — no token streaming, no approval UI; a sent message shows nothing until
   the next poll. OK for simple Q&A only.

### Fast charts in chat — `ua-chart` blocks ✅
Don't use `generateChartTool` (code sandbox, ~1 min, and it silently ended turns on UAT). Instruct the agent
to write a fenced ```` ```ua-chart ```` block with one JSON object
`{"kind":"chart","type":"bar","title","labels":[…],"series":[{"name","data":[…]}],"currency"|"unit","source","insight"}`
(`kind` is always `chart`; `type` is one of bar, hbar, line, area, doughnut, pie, stacked — show the agent whole
example blocks, never `"type":"bar|hbar|…"`: given that form an assistant wrote `"kind":"hbar"` on three of four
charts and the strict parser of the time dropped them; the module's parser now takes a shape in `kind` as the shape);
the island's `MutationObserver` finds `code.language-ua-chart`, hides it and mounts a Chart.js card
(type switch, sort, top-N, table, PNG/XLSX/CSV export, click-to-drill that asks a follow-up). One model step.
Rule text for agent instructions: `SC-Companion/platform/agents/chart-block-rule.md`.

## Embedding Orbit (or another app) in a code app ✅ UAT 2026-09-23

Orbit sends **no `X-Frame-Options`** and allows `frame-ancestors … https://*.unifyapps.com …`;
code-app hosts do the same. Every surface (`orbit.uat`, `*.matrix-uat`, `*.tensor-uat`) is a
subdomain of `unifyapps.com`, so they are **same-site**: the httpOnly session cookie rides into a
cross-origin iframe and **one Orbit login covers every embedded tab**. Verified by framing
`/p/0/automations` from `app-7a0b14fcda38-orbit.tensor-uat.unifyapps.com` — the console rendered
fully signed in, and re-pointing `iframe.src` at `/p/0/connections/all` navigated it, still
authenticated.

What you still cannot do from the parent page: `iframe.contentDocument` is `null` and
`contentWindow.location.href` throws `SecurityError`. So an embedded tab strip gives you
**display + deep-link navigation**, not clicking or reading. For that you need a browser-extension
content script or the `code_by_unifyapps_playwright` node.

⚠️ `http://localhost:3000` is on Orbit's `frame-ancestors` list but is **cross-site**, so the
session cookie is *not* sent there. Always test framing from a `*.unifyapps.com` origin.

## Getting a local change into the preview ✅ UAT 2026-09-23

The preview builds from the **current branch's git HEAD**, not from the session working tree. So:

- `PUT /agent-api/sessions/{s}/files/contents` is a **scratchpad**: it bumps `filesVersion` and shows
  up in `GET …/files/content`, but `previewVersion` never moves and the preview keeps serving the
  committed code. There is no commit API (`/git/commit`, `/commit`, `/files/commit` → 404).
- `app/src/index.css` is **engine-owned**: the write is refused with 422
  `engine-owned file is read-only`. Theme colours and fonts belong in **`theme.json`** at the repo
  root, which the engine turns into `index.css` at build time.
- A **dirty working tree blocks a branch switch** — `pendingBranch` sticks through re-POSTs and page
  loads until the tree matches HEAD again.
- **Review the newest commit on the main preview (UAT 2026-09-27, 8 publishes).** After kit_app_publish,
  `…/preview/b/{app}/main/` still serves the previous build. Fix it in three steps:
  1. switch the session to `t-<sha>`;
  2. wait about 55 s;
  3. switch back to `main`.
  Then probe. API-SPEC "Findings from the Three-Way Match desk" also covers the oklch-safe contrast probe and envelope parsing.

**The recipe:** commit and push a **new** branch, then

```
PUT  /agent-api/sessions/{s}/files/contents   {edits:[{path:'PRODUCT.md', content:<unchanged>}]}
POST /agent-api/sessions/{s}/branch           {branch:'<new-branch>'}
```

The write nudges the sync cycle so the POST applies immediately instead of queueing; `current` moves
and `previewVersion` advances. Switching to the branch you are already on is a no-op.

## Before every push: `bun run lint` ✅ UAT 2026-09-23

The cloud build runs **oxlint** before Vite and fails the whole build on a lint error, reporting only
*"Build failed due to an unexpected error"* in the Code Builder. `tsc -b && vite build` passing
locally proves nothing about that gate. Run `bun run lint` in `app/` first.


## Findings from the CRM scoring-overlay build ✅ orbit.uat, 2026-09-24

The VEP Forecast Map for the CRO (HubSpot read-only). App id, session and repo in
`unifyapps-solution-playbook/references/builds/deal-forecast.md`; global page
`e_global_<appId>` created by hand, data sources: FETCH `e_6ab4f6457815656ce532700b`, callables
deals `e_6ab4f6457815656ce532700e`, history `e_6ab4f6457815656ce5327011`, insights `e_6ab4f6457815656ce5327014`,
model_update `e_6ab4f6459357d53f5f6590a7`, snapshot `e_6ab4f6467815656ce5327017`, whoami `e_6ab4f6467baf0b7e850909ab`.
Objects `scc_forecast_model` (48 provisional records: ladders, weights, zone expectations, stage map,
momentum, bands, settings) and `scc_forecast_snapshot` (one row per open deal per day; trails).
Workflows: `scc_hs_forecast_deals` `6ab4f525aa76b93f75f04272` (pipelines → model → filters → search →
owners → associations → companies → Groovy engine), `scc_hs_forecast_deal_history` `6ab4f5279d7b0545558a252d`
(propertiesWithHistory replayed through the same engine), `scc_forecast_insights` `6ab4f528aa76b93f75f0432d`,
`scc_forecast_model_update` `6ab4f52a57877b064eac2a68` (role-checked), `scc_forecast_snapshot_run`
`6ab4f52af83e366af1047415` (three chained CALL_WORKFLOW pages → bulk create / bulk upsert),
`scc_forecast_snapshot_daily` `6ab4f52b333496691092179e`. Agent `SC Native - Forecast Agent`
`e_6ab4f67b9357d53f5f659159` (cloned settings from the HubSpot Agent, 5 tools, hubspot-crm-operator-sc skill
attached via `accessibleTo`, added to the hub's supervisor team). Builder script:
`SC-Companion/platform/workflows/scc_forecast.js` (paste after `ua-helper.js`; `FC.buildAll({…existing ids})`
re-deploys in place).

Patterns worth keeping:
- **A scoring engine as Groovy shared by three workflows** (the `ENGINE` string in the builder) so a
  list read, a history replay and a daily snapshot can never disagree.
- **Score parameters as records, not code** (`scc_forecast_model`): the CRO's Excel becomes records;
  the app's *Scoring model* page edits them through a role-checked workflow with a reason (audit line in
  `source`).
- **Not-assessed is a state**: a deal whose levers all sit on the default first rung is *not* weak, it is
  unmeasured; band `Not assessed`, truth `UNASSESSED`, and a Commit call without assessment is its own risk
  figure (`unassessed_call_amount`).
- **Animated SVG map with CSS transforms**: markers are `<g style="transform: translate()">` with a
  transition, so a filter, a replayed day or a refetch glides every deal to its new position; a
  `dimIds` set fades rather than removes, which keeps the animation continuous.

### Scoring overlay, round 2 (2026-09-24): inline agent visuals, search, direction, logos

- **A custom visual inside the agent chat** = a new fenced block the island renders. The island's
  `ua-chart/mount.tsx` already scans chat `code` elements and swaps them for React components; a
  `parseBlock()` that routes `"kind":"forecast_map"` to its own renderer (`copilot-island/forecast-map/
  ForecastMapBlock.tsx`, self-contained CSS, no Tailwind, no app theme) and everything else to
  `ChartBlock` adds a block type in ~10 lines. Give the renderer a *compact data contract the tool
  already returns* (`map_points` on `scc_hs_forecast_deals`: `{id,n,a,s,m,sc,b,st,z,t,as,c,lg,dm,tr,tw}`)
  so the agent copies JSON rather than composing coordinates. The hub's supervisor must be told to keep
  such blocks verbatim, and the same renderer goes into every island that may show that agent's answers
  (hub + app). Clicks inside the island reach the host by `postMessage({type:'ua-copilot:open-deal', id})`.
- **The shell belongs in a layout route** (`<Route element={<AppShell><Outlet/></AppShell>}>`): when each
  page wrapped itself in the shell, navigating remounted the docked copilot iframe and lost the chat.
- **Company logos from HubSpot:** request `hs_logo_url` on companies (48 of 54 deals had one). Some values
  still point at the retired `logo.clearbit.com` — skip those and fall back to
  `https://icons.duckduckgo.com/ip3/<domain>.ico` (48 px), then initials. Orbit's CSP is `img-src *`, so
  external logos load in code apps; `<image clipPath>` inside SVG works.
- **Search over scored records:** read every page first (HubSpot's search cursor is the row offset, so
  pages after the first run in parallel: `after = 100, 200, …`), then filter client-side with a
  criteria object (AND across fields, OR within one) that serialises into `?q=` for sharing; recompute the
  summary tiles from the filtered set. Storage FETCH filters: `GTE` works on a string date field;
  `GREATER_THAN_OR_EQUAL` returns *Workflow execution failed*.
- **"Direction" needs an honest basis:** HubSpot history (deal page) > our daily snapshots > the deal's own
  signals (stage age, activity, close date). Show which one was used next to the colour.

- **Long batch jobs: page workflow + coordinator.** A workflow that chains ten ~6 s connector reads is
  cancelled by the test runner (`initiate-test` → *No Response received within specified timeout*, run
  CANCELLED). Split it: a page workflow that does one block (~10 s) and a coordinator of `CALL_WORKFLOW`
  nodes (fallbackMode CONTINUE) for the scheduler; the app can run the pages in parallel through one data
  source. A once-a-day client safety net (take today's snapshot if it is missing) keeps history building
  even if a scheduled run is missed.
- **A panel beside a chart that must not outgrow it:** wrap it in `relative` and give the panel
  `xl:absolute xl:inset-0` + `flex flex-col` with a `min-h-0 flex-1 overflow-y-auto` body — the grid row
  height comes from the chart column and the list scrolls inside.

### Scoring overlay, round 4 (2026-09-24): applying a scoring contract in the UI
- Model the contract's nullable outputs in the types (`number | null`) and let `tsc -b` find every place that
  assumed a number; unscored deals must show their status, never 0, in tables, tooltips, trails and replay.
- Animated counters driven by `requestAnimationFrame` never advance in a hidden or background tab (the
  in-app browser pane when hidden): render the true value as text and animate only the decoration.
- Plot only points that have a position; list the rest with their status (a day without a score is not a
  zero on the map).

## Findings from the golden-record build ✅ orbit.uat, 2026-09-24

A university demo (app id and repo in `unifyapps-solution-playbook/references/builds/shu.md`). The whole
platform layer is scripted in the repo's `tools/` — `<uc>-objects.js`, `<uc>-seed.js` (deterministic, 58,340
rows), `<uc>-workflows.js` (19 workflows built from node helpers, not clones), `<uc>-agents.js`,
`<uc>-datasources.js` — and re-running any of them updates in place.

- **Loading build scripts into the Orbit tab:** Orbit's CSP blocks `localhost`. Push the scripts, pull a
  `sync/<sha>` branch into the session, then `(0, eval)(await (await fetch('/agent-api/apps/<appId>/branches/sync%2F<sha>/files/content?path=tools/x.js')).text())`.
  The file endpoint 404s until the branch has been pulled (`POST /agent-api/sessions/{s}/branch`).
- **A code app's private published URL shows the app's own login** — the owner signs in there. For Claude's
  own checks use the builder preview `https://orbit.uat.unifyapps.com/agent-api/preview/{sessionId}/`
  (runs under the platform session; routes live under `/agent-api/preview/b/<appId>/main/`).
  To check the **published** build without signing in: `/` and `/assets/*.js` on the published origin are
  public — find the lazy route chunks (`assets/<Route>-*.js`) in `index-*.js` and grep them for a string only
  the new commit has (API-SPEC §55.8). Publish result: top-level `deploymentState` on
  `GET /api/entity/e_interface/{appId}` (§55.7).
- **Getting a pushed commit onto the session's `main`, reliably (a KPI command-centre build, 2026-09-25):** push
  `main:refs/heads/t-<sha>`, nudge (`PUT files/contents` with `PRODUCT.md` unchanged), `POST /branch t-<sha>`,
  nudge again, `POST /branch main` → `/changes` head = `<sha>`. Never POST the second switch while the first is
  still pending — it cancels it (§55.6).
- **Workflows written from node helpers deploy first time** when the node shapes are copied from a working
  export (`platform/*-platform.json`); the failures were all Groovy logic (API-SPEC §40.2, §40.8) or wrong
  output keys (§40.1) — none were node-shape problems.
- **`e_data_source` search needs `properties.interfacePageId`** (§40.3).

