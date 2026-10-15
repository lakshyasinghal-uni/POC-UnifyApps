---
name: unifyapps-governance
description: Use the UnifyApps AI Governance module over REST — Controls (prompt-injection, PII, credentials, denied topics, blocked tools, regex, content filter, custom LLM checks) attached to agents or applied globally, plus the Policies, Agent/Model Registry, Monitoring, Incidents, Evaluation and Cost surfaces. Use whenever an agent needs guardrails, when hardening an agent against prompt injection or data exfiltration, when auditing what AI assets exist in a tenant, or when asked about AI compliance, policies, controls, incidents or AI spend.
metadata:
  author: Maher
---

# UnifyApps AI Governance

> **Created by Maher.** Contains no credentials. Each user signs in with their own UnifyApps
> account — read `references/connect-and-call.md` in `unifyapps-builder` first.

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

Verified live on `orbit.uat.unifyapps.com`, **2026-09-23** and **2026-09-25**. Evidence marks:
✅ verified over REST · 👁 observed in the UI · ❓ not yet established.

> ## 🔴 Read this first (2026-09-25, API-SPEC §52)
> There are **two layers**. The **agent's own Guardrails** (`gaurd_rail` entity, console: agent →
> Configuration → Guardrails) run **inline** and are the only thing proven to block a turn.
> The **AI Governance Controls** below (`controls` via `accessibleTo`) did **not** gate a single
> one of 14 probes on a native agent — scoped to the agent id, to a registry profile id, under both
> prefixes; the tenant's incidents point at Registry (`agent_profile`) ids and arrive in 5-minute
> bursts, i.e. post-hoc evaluation. Ship the `gaurd_rail` (section "Inline guardrails" below) as the
> enforcement, keep Controls as the audit/incident layer, and say so in the handoff.

Sister skills: `unifyapps-builder` (workflows + agents), `unifyapps-apps`, `unifyapps-connectors`.
Master API record: `API-SPEC.md` at the repo root — **where it disagrees with this skill, it wins.**

## Where it lives

The base route `/p/0/agent-governance` **404s** — every screen is a child route.

| Screen | Route | Scale on UAT |
|---|---|---|
| Overview | `/p/0/agent-governance/overview` | — |
| Discovery | `…/discovery` | 60 assets |
| Agent Registry | `…/registry` | 10,832 agents |
| Model Registry | `…/model-registry` | 1,324 models |
| Monitoring | `…/monitoring` | 78% trace success |
| Incidents | `…/incidents/chat` | 7,238 open |
| **Policies** | `…/policies` | 133 active |
| **Controls** | `…/controls/chat` | 509 controls |

Five pillars: **AI Assets** (discovery, registries) · **AI Observability** (monitoring, incidents) ·
**AI Compliance** (policies, controls) · **AI Evaluation** (experiments, datasets, metrics) ·
**AI Cost & ROI** (optimizer, cost explorer, outcomes).

> ⚠️ Those counts look seeded — 10,832 registry agents against ~2,400 real `ai_agent` entities.
> Treat registry/incident volumes on UAT as demo data until confirmed.

## Controls — the part you will actually use ✅

A **Control** is an entity of type `controls`. It runs a check on an agent's traffic and either
**flags** or **blocks**.

```
POST /api/aggregation?entityType=controls&group=ENTITY   list (574 on UAT)
POST /api/entity/controls          {page:{limit,offset}}  full entities (offset paging)
GET  /api/entity/controls/{id}                            one control
POST /api/entity                                          create  (entityType:"controls")
POST /api/entity/update                                   update (whole entity)
```

### Entity shape ✅

```json
{ "entityType": "controls",
  "tags": ["SC_NATIVE", "MAHER_STUDIO"],
  "properties": {
    "name": "Studio - Prompt Injection Protection",
    "description": "Detect attempts to hijack the builder agent.",
    "checkType": "e_6a500b3015d9546842783050",
    "appliedTo": "chat",
    "appliedOn": ["user_input", "agent_output", "tool_input", "tool_output"],
    "actionType": "block",
    "enabled": true,
    "llmModel": "sonnet_4_6_bedrock_no_thought",
    "confidenceThreshold": "high",
    "checkSeverity": true,
    "severityModel": "sonnet_4_5_bedrock_no_thought",
    "severityLevel": "critical",
    "accessibleTo": ["ai_agent/<agentId>"]
  } }
```

- **`accessibleTo` is the attachment**, exactly like `e_skill_ai_agent`: `["global"]` applies it
  tenant-wide, `["ai_agent/<id>"]` scopes it to one agent. On UAT: 325 global, 226 scoped (2026-09-25).
  ⚠️ The `<id>` in every incident-producing live row is a **Registry `agent_profile` id** (the
  incidents' `accessibleTo` reads `agent_profile/<id>` or `ai_agent/<registry id>`), not a native
  `ai_agent` entity id. A control scoped to the native id attached fine (found by the aggregation)
  but never fired — see "Read this first". Scope to all three strings if you attach at all.
- **`appliedOn`** is the entity field; the check's own schema calls the same thing `inputs`.
- **`actionType`**: `"flag"` (record an incident, let it through) or `"block"` (stop it).
- **`llmModel`** is either a model **entity id** (`e_6a6b2ca257e0bb568325685b`) or a model **alias**
  (`sonnet_4_6_bedrock_no_thought`). Both occur in live rows.

### The check-type catalogue — `controls_schema` ✅

`checkType` points at a `controls_schema` entity (or the literal `custom_chat` /
`custom_knowledge`). `GET /api/entity/controls_schema/{id}` → `{name, description, type, schema,
layout, redact, mask}`. There are **15**, in two families: `type: "chat"` (agent traffic) and
`type: "knowledge"` (RAG/ingestion).

| Check | `chat` id | `knowledge` id | Config fields |
|---|---|---|---|
| **Prompt Injection** | `e_6a500b3015d9546842783050` | `e_6a55d234b6bf3639e4822464` | `inputs`, `llmModel`*, `confidenceThreshold` |
| **Blocked Tools** | `e_6a500b08d46d4e608bbe2f9b` | — | `inputs`, `blockedTools` |
| **Credentials & Secrets** | `e_6a500b3f15d9546842783059` | `e_6a55d2256db63111e04d1acc` | `inputs`, `infoTypes` |
| **PII detection** | `e_6a500b1bd46d4e608bbe2f9f` | `e_6a55d214b38bca3a61480e3d` | `inputs`, `infoTypes` |
| **Denied Topics** | `e_6a500b7c30b9186dd3773d30` | — | `inputs`, `llmModel`, `deniedTopics`, `confidenceThreshold` |
| **Content Filter** | `e_6a500b6ad46d4e608bbe2fdd` | — | `inputs`, `llmModel`, `filterCategories` |
| **Regex pattern** | `e_6a500b4fd46d4e608bbe2fbe` | `e_6a55d24ab38bca3a61480e53` | `inputs`, `regexes` (RE2) |
| **Custom terms** | `e_6a500b5b30b9186dd3773d18` | `e_6a55d2406db63111e04d1afb` | `inputs`, `terms` |
| **Custom (LLM check)** | `custom_chat` | `custom_knowledge` | `inputs`, `llmModel`, `prompt`, `output` |

`*` = required. `mask: true` on the chat PII, Credentials and Regex checks — they can redact
rather than only detect.

The `additional` shapes, read from live controls ✅ 2026-09-27 (API-SPEC §59.6):
`deniedTopics: [{name, description, examples: [..]}]` · `filterCategories: {hate|insult|violence|sexual|misconduct:
{severity: low|medium|high}}` (Content Filter reads only `user_input` / `agent_output`) · `regexes: [{name, pattern}]` ·
`terms: [{primary, related: "comma, separated"}]`. Scope each control to all three strings —
`ai_agent/<native id>`, `agent_profile/<profile id>`, `ai_agent/<profile id>` — creating the agent's `agent_profile`
first when it has none (the Forge kit does this and reads the scope back).

**`inputs` enum** (same for every chat check): `user_input` · `agent_output` · `tool_input` ·
`tool_output`. Default `["user_input"]` — **widen it deliberately**: a control that only watches
user input will not catch an injection arriving through a *tool result* or a retrieved document,
which is the realistic path.

### Custom LLM check ✅

`checkType: "custom_chat"` with `additional.prompt` holding the rubric and `outputType: "binary"`.
The live example ends with *"Return: YES if the interaction violates the policy. NO if it is
acceptable."* — keep that binary contract; the classifier is parsed, not read.

## Hardening a builder agent — the recipe

For an agent that takes untrusted input (uploaded RFPs, retrieved documents, tool output) and can
write to the tenant, attach these, scoped with `accessibleTo: ["ai_agent/<id>"]`:

| Control | Action | `appliedOn` | Why |
|---|---|---|---|
| Prompt Injection | **block** | all four | the document is the attack surface |
| Blocked Tools | **block** | `tool_input` | name every delete/destructive tool — this is the platform-side twin of the no-delete rule at the top of this file |
| Credentials & Secrets | **block** | `agent_output`, `tool_output` | stops exfiltration |
| PII detection | flag (or mask) | `agent_output` | |
| Custom (LLM check) | **block** | `tool_input` | "is this write inside the user's own scope?" |

**Controls are defence in depth, not the primary control.** They are LLM classifiers with a
confidence threshold — they will miss things. Ownership and tag checks enforced in code are what
actually guarantee a destructive action cannot cross a boundary. Use both.

## Creating and attaching a control ✅ verified 2026-09-23

`POST /api/entity` with `entityType:"controls"`, tags at the **top level**, everything else in
`properties`. Verified by creating `scc_studio_prompt_injection`
(`e_6ab3cfb004beb12b389b720f`) scoped to a throwaway agent `scc_studio_probe_agent`
(`e_6ab3cfb0c9518d7218b0e719`) — created enabled, `actionType:"block"`, on all four surfaces.

Find an agent's controls exactly like its skills:

```
POST /api/aggregation?entityType=controls&group=ENTITY
filter: {op:"AND", values:[
  {op:"EQUAL", field:"d", values:[false]},
  {op:"IN", field:"properties_accessibleTo", values:["ai_agent/<agentId>"]}]}
```

- `breachOn` defaults to **false** on create (live rows carry `true`); its meaning is unconfirmed —
  it reads more like breach *state* than configuration.
- No `deploymentState` came back, so a control is **live on create**. ✅ 2026-09-25: **no republish
  is needed** — neither a control nor a `gaurd_rail` appears in the agent's deployed snapshot
  (`GET /api/entity/deployed/ai_agent/{id}` stayed deep-equal), and the guardrail blocked turns
  minutes after being created with no publish in between.
- **`blockedTools` takes tool NAMES by keyword** ✅ 2026-09-25:
  `"additional": {"blockedTools": {"operator": "OR", "filters": [{"property": "NAME",
  "filter": {"operator": "CONTAINS", "value": "delete"}}]}}` — `CONTAINS` or `NOT_CONTAINS`
  (allow-list form: one `NOT_CONTAINS "scc_poc_"` filter), one filter per keyword, `operator`
  always `OR` on the 35 live rows. Inline gating of a tool call was not observed (see above).

## Inline guardrails — the agent's `gaurd_rail` entity ✅ 2026-09-25 (API-SPEC §52)

One entity per agent, type **`gaurd_rail`** (sic), `properties.aiAgentId` = the agent. This is what
the console's Guardrails group edits (PII Masking · Hallucinations · Content Filters · Custom Word
Filter · Denied Topics · Blocked Messaging) and what runs **inline** as `Input Guardrails` /
`Response Guardrails` spans in every trace. Find it:
`POST /api/entity/gaurd_rail {filter:{op:"AND", values:[{op:"EQUAL", field:"properties.aiAgentId", values:["<agent>"]}]}, page:{limit:5,offset:0}}`.

Create (verified on PoC Copilot, `e_6ab60d8305e65b5f922f4fe2`, tags kept):

```json
{ "entityType": "gaurd_rail", "tags": ["SC_NATIVE"],
  "properties": {
    "aiAgentId": "<agent id>", "name": "scc_<agent>_guardrails", "runInAsync": false, "enabled": true,
    "contentFilters": { "llmModel": "e_66b280e945f17a17c0e7c27a",
      "filterStrengthForPrompts":   {"hate":"high","insult":"medium","violence":"high","sexual":"high","misconduct":"high","promptAttack":"high"},
      "filterStrengthForResponses": {"hate":"high","insult":"medium","violence":"high","sexual":"high","misconduct":"high"} },
    "DeniedTopics": { "llmModel": "e_66b280e945f17a17c0e7c27a",
      "DeniedTopics": [ {"topicName":"...", "definitionOfYourTopic":"...", "addSamplePhrases":["...","..."]} ] },
    "customWorldFilter": { "filterProfanity": true, "wordsOrPhrases": [] },
    "RedactSensitiveInformation": { "piiByUA": {"enabled": true},
      "regex": {"enabled": true, "patterns": [ {"name":"AWS access key","pattern":"AKIA[0-9A-Z]{16}"} ]},
      "automations": {"enabled": false, "ids": []} },
    "BlockedMessaging": { "blockedMessagingForPrompts": {"blockedMessage": "..."},
                          "blockedMessagingForResponses": {"blockedMessage": "..."} },
    "Hallucinations": { "llmModel": "e_66b280e945f17a17c0e7c27a",
      "groundingConfig": {"enableGrounding": false, "groundingScore": 0.5},
      "relevanceConfig": {"enableRelevance": false, "relevanceScore": 0.5} } } }
```

Rules learned the hard way:
- The server sets **`enabled: false`** on create if you omit it — send `true` (update with the full
  entity + `tags` + `version`, like any entity).
- `regex.patterns[]` items are exactly `{name, pattern}`; anything else is a 500 *"property patterns
  invalid; add additionalProperties regexPattern"*. `wordsOrPhrases[]` items are `{name}`.
- **Do not use the `sonnet_4_6_bedrock_no_thought` alias as a guardrail `llmModel`**: every turn then
  fails after ~127 s with `executionError: CONNECTION with id 683020ca44e4f747c6415668 not found`
  and sits at `pending`. The platform default `e_66b280e945f17a17c0e7c27a` (924 live rows; not
  readable with `GET /api/entity/ai_agent_llm_model/…`, shown as a raw id in the picker) runs; its
  classifier spans carry `modelId e_69b9900c5739ad5159baa133` = "Vertex Sonnet 4.6".
- Strength semantics: **higher = stricter**. `high` blocked a category the classifier rated `Low`;
  `medium` blocked `insult: Medium`. Expect ~7 short classifier calls per turn (≈ $0.01).
- A **blocked turn never reaches `responseGenerationStatus: completed`** — the reader stays
  `pending`. The settled signal is `guardrailHit: true` on the Fan message and a Bot message whose
  text is your `blockedMessagingForPrompts.blockedMessage`; the trace has `Input Guardrails ›
  Content Filters` with `withinThreshold:false, guardrailViolationDetected:true` and **no `Agent
  Execution`** span. Cost of a blocked turn ≈ $0.013.
- What was proven on PoC Copilot (read-only probes over the agent test API, `probes.json` in the run):
  prompt injection blocked (content filter `promptAttack` + denied topic "Platform administration and
  prompt disclosure"), an off-topic question blocked (denied topic), profanity blocked (insult
  `Medium`), a question carrying an AWS key + password blocked; a normal question and a question
  that merely mentions "credentials" still answered. PII masking (`piiByUA`, regex) is configured
  but the `PII Mask` span echoes raw text, so masking itself is unconfirmed.
- Hallucination grounding/relevance: leave off for a tool-calling agent (no reference corpus; a
  relevance threshold blocks legitimate multi-part answers).
- ✅ 2026-09-27 (Three-Way Match desk, UAT): **a denied topic must say what is NOT in it, or it
  blocks the agent's own job.**
  - **Drafting agent (AG-06 supplier-message drafter).** A topic "Requests to send, e-mail or
    dispatch a message to a supplier" blocked every draft request. Its ledger rows went from OK to
    FAIL the moment the guardrail was attached, and the workflow still completed green.
    - Fix: "… Writing a draft for an AP clerk to review, edit and send themselves is NOT in this topic."
    - Likewise "pay or change bank details … drafting a note that asks for a credit note or
      corrected invoice, or describing amounts, holds, discounts or payment terms in it, is NOT in
      this topic."
    - Also: a "never write a full IBAN" topic on an agent whose *input data* carries the supplier's
      bank details blocks the input. Put that rule in the regex redaction (and on the chat agent),
      not in a denied topic of a data-fed agent.
  - **Chat agent.** A plain "discounts" topic blocked "which discounts expire" (the fix is the same NOT clause).
  - **After attaching or changing any guardrail, re-run one real workflow turn of that agent** and
    read its newest Evidence Ledger row. A probe alone is not enough: the workflow still completes
    green when its agent turn is blocked.
- ✅ 2026-09-27: **kit_governance resolves an agent item (`AG-nn`, and the assistant's `UI-nn`) through
  the blueprint_status platform_id.** Keep the assistant's UI item recorded as `kind: agent,
  platform_id: <agent id>`, never the app id: with the app id the kit probed a bare default agent
  (invalid results) and created a stray guardrail whose `aiAgentId` is the app id. That guardrail
  cannot be switched off by hand (orbit_api refuses edits to kit-made guardrails); the user removes it.
- ✅ 2026-09-27: **no incident was written on UAT for more than 40 hours, by any control of any
  project.** The newest was created at 1790367944969; the six Three-Way Match controls produced
  none after dozens of probes. So a control's own firing cannot be proven by a live probe there.
  Verify the inline guardrail (a turn blocked plus a turn allowed), record which layer stopped the
  case, and keep the control as built.

### Registry (`agent_profile`) and incidents ✅ 2026-09-25

- The Agent Registry is the `agent_profile` entity (176 on UAT). A native agent is listed only when
  a profile links to it: `{applicationId:"unifyapps", assetType:"agent", external_agent_id:"<ai_agent
  id>", connectionType:"observe"|"control", enabled, registered, agentProfileGroupIds:["unifyapps"],
  ownerId}`. `POST /api/entity {entityType:"agent_profile", tags, properties}` creates one directly
  (`e_6ab60c0205e65b5f922f3cb3` for PoC Copilot; the page then shows it with traces and cost). The
  UI path is Register Agent → "UnifyApps", which needs a `unifyapps` connector connection the user
  authorises (Discovery = `agent_profile_group` rows, one per platform connection).
- `incidents` entity: `checkType, severity, confidence, traceId, chatTypeIncident{userQuery, source,
  userId, conversationId}, incidentType:"CHAT", action:"FLAG"|"BLOCK", control, policy,
  accessibleTo (["global","agent_profile/<id>"] or ["ai_agent/<registry id>"]), assetType, status`.
  List with `POST /api/aggregation?entityType=incidents&group=ENTITY` (sort `cTm`, `IN` /
  `ICONTAINS` on `properties_accessibleTo`). No incident appeared for PoC Copilot within 20 minutes
  of the probes.

### `additional.infoTypes` — the shape for PII and Credentials checks ✅ 2026-09-23

Not a flat list. It is a map of the check's **display names** to a severity:

```json
"additional": { "infoTypes": {
  "API token / key": {"severity":"high"}, "AWS access key": {"severity":"high"},
  "Database connection string": {"severity":"low"}, "Encryption key": {"severity":"medium"},
  "OAuth client secret": {"severity":"medium"}, "Password": {"severity":"medium"},
  "Private key": {"severity":"low"}, "SSH private key": {"severity":"high"} } }
```

PII uses the same shape with `Bank account number`, `Date of birth`, `Email address`,
`IP address`, `Passport number`, `Phone number`. Live rows carry **no top-level `infoTypes`**
despite the schema listing one — everything is under `additional`.

### A worked hardening set ✅ built 2026-09-23 on `scc_studio_planner` (`e_6ab3dd29c9518d7218b9a4b6`)

| Control | Check | Action | `appliedOn` |
|---|---|---|---|
| `scc_studio_injection` | Prompt Injection | block | all four |
| `scc_studio_credentials` | Credentials & Secrets | block | `agent_output`, `tool_output` |
| `scc_studio_pii` | PII detection | flag | `agent_output`, `tool_output` |
| `scc_studio_scope_guard` | `custom_chat` | block | `tool_input`, `agent_output` |

Two choices worth copying: put the **exfiltration** checks on OUTPUT (secrets leave, they do not
arrive), and give the custom check a numbered YES/NO rubric — "answer YES if the interaction
plans deletion of an asset not created by this run for this user…", ending with the literal
binary contract. All four verified attached with the `properties_accessibleTo IN` aggregation.

## Policies — `policies` ✅ 2026-09-23

A Policy is a named group of Controls. UI: `/p/0/agent-governance/policies`, with `standard` and
`custom` sub-tabs. The list columns are Name, Controls (count), Incidents, Applies to.

```
POST /api/entity/policies {page:{limit,offset}}   list (60+ on UAT, hasMore)
POST /api/aggregation?entityType=policies&group=ENTITY
POST /api/entity  {entityType:"policies", tags:[...], properties:{...}}   create ✅
```

```json
"properties": {
  "name": "SC Studio — Build Safety",
  "description": "...",
  "appliedTo": "chat",
  "enabled": true,
  "controls": ["e_<controlId>", "..."],
  "controlSettings": {}
}
```

Verified by creating `SC Studio — Build Safety` (`e_6ab3ddd9c9518d7218b9b24f`) grouping four
controls. A policy carries **no `accessibleTo`** — attachment to an agent stays on each control,
so the policy is the reporting and grouping layer while the controls do the enforcing.
`controlSettings` was empty on every live row; its purpose is unconfirmed.

⚠️ Do not confuse `policies` with **`e_platform_asset_settings`**, which the same screens also
query — that one has only 15 rows on UAT, none of them named, and is not the policy list.

## Roles and permissions ✅ 2026-09-23

Settings → Governance → **Roles** (`/settings/roles`, 219 on UAT). A role has four tabs, each its
own sub-route: `/platform`, `/connectors`, `/entity-types` (labelled *Objects*), `/activity`.

```
POST /api/aggregation?entityType=RoleDefinition&group=STANDARD    list roles
```
⛔ `GET /api/role-definition/{id}`, `/api/entity/RoleDefinition/{id}`, `/api/role{s}/{id}` all **404**.
Read a role's permissions from its UI sub-routes until the detail API is captured.

**Platform tab — 32 asset classes**, each with its own permission set. **`Delete` is a separate
permission on every one of them**, which is the single most useful fact here: a service role can be
granted Create/Edit/View and simply never hold Delete, so deletion is refused by the *platform*
rather than by application code.

| Asset class | Permissions |
|---|---|
| Agents | View · Create · Edit · Delete · Share · Archive · Deploy & Pause · Simple · Advanced · Guardrails · Tasks · View Observability |
| Automations | View · Create · Edit · Delete · Share · Deploy & Pause · Test · Export as Template · Cancel Runs · View Runs · View All Runs · View Settings · View Insights · View PII · Raw Query Action |
| Applications | View · Create · Edit · Delete · Share · Manage Localization · View Insights · Test |
| Object Manager | View · Create · Edit · Delete · Share · Standard · View PII |
| Ontology | View · Create · Edit · Delete · Share · Steward View · Steward Edit |
| Pipelines | View · Create · Edit · Delete · Deploy & Pause · Share · Export · Clone |
| Skills · Knowledge · Knowledge Set · Prompts · MCP Servers · Deployments · Workspaces · Space · Asset · Automation Interfaces · Evaluation Datasets · Evaluation Metrics · User Preferences | View · Create · Edit · Delete · Share |
| Agent Models | + Import · Export |
| Agent Optimizer · Evaluation Experiments | + Execute |
| Ai Solutions | + Deploy & Pause |
| Chat | + Comment |
| Data Catalog · Agent Spending Limits · THEME_MANAGER | View · Create · Edit · Delete |
| System Automation | View · View Runs · Cancel Runs · View PII |
| Template Library | View · Edit · Delete |
| Copilot | View · Switch Model |
| Evaluation · Platform Settings | View |

**Connectors tab** is an allow-list, not a permission grid: *Grant Access to All Apps* ·
*Allow Apps Listed Below* · *Allow All Apps Except* — scoping which applications, triggers and
actions the role may use. A role that must create connections to arbitrary systems needs
**All Apps**.

**Objects tab** (`/entity-types`): *Grant Access to All Objects* or *Allow Objects Listed Below*,
then record-level permissions — View · Create · Edit · **Delete** · Share · Import · Export · Read ·
Approve · **Decrypt** · **View PII**. Withhold Decrypt, View PII and Export from any automated role:
they are the data-exfiltration permissions.

### Setting a role's permissions ✅ 2026-09-23 (`scc_studio_builder`, `6ab3d5eaa82fd1243435585d`)

The Save request is **not interceptable** by patching `window.fetch` / `XMLHttpRequest` — the console
is a Next.js app and the save appears to be a server action, so the role API is still uncaptured.
Drive the UI instead: every permission is a real `input[type=checkbox]` whose row text reads
`"<Permission> <AssetClass>"` (group toggles read `"<AssetClass> Select All"`). Parse by matching the
**longest** asset-class suffix — `Evaluation` vs `Evaluation Metrics` vs `Evaluation Datasets` —
then `el.click()` each one that differs and press Save. 208 boxes; ~100 clicks settles in two passes.

⚠️ **Some permissions are forced dependencies** (`input.disabled === true`) and cannot be turned off:
`Edit Chat` is implied by `Create Chat`, and **`Cancel Runs` on Automations is implied by the
Test / Deploy & Pause / View Runs set**. Plan for a service role to hold `Cancel Runs`.

🔴 **Objects tab trap.** With *Grant Access to All Objects*, `View Records` and `Read Records` are
**disabled and driven only by Select All**. Unchecking any single permission flips Select All off and
drags View and Read off with it — so you **cannot** have record read access without also granting
`Delete`, `Decrypt` and `View PII` on every object in the tenant. The tab also defaults to *all
permissions on*. For any automated or service role use **Allow Objects Listed Below** (`SPECIFIED`)
and name only the objects it owns: full rights there, no reach anywhere else.

⚠️ `Connections Manager` and `Connectors SDK` appear as permission labels in the Roles *list*
column but are **not** among the 32 Platform asset classes on the Admin role. Unresolved — verify
empirically after creating a role that must manage connections.

## Not yet established ❓

- ~~Whether a control attached to an agent needs the agent republished~~ — ✅ no (2026-09-25).
- ~~Whether `blockedTools` takes tool names or ids~~ — ✅ names, keyword match (2026-09-25).
- **Whether a Governance Control ever gates a turn inline** on a native agent — 14 probes say no;
  what makes the post-hoc evaluation produce an incident for a native agent (a synced `unifyapps`
  connection? the 5-minute `evalSettings`?) is unknown. How the Registry counts "policies" per agent.
- `confidenceThreshold` enum beyond `"high"` / `"medium"`.
- Monitoring / Evaluation / Cost request bodies — routes mapped, APIs not (Registry and Incidents
  are now mapped above).
- `GovernanceHomepageCounts` (`POST /api/workflow/execute/node?name=…`) — the overview tiles.
- `e_platform_asset_settings` — read alongside controls; purpose unknown.

## Discovery notes

The Controls screen is driven by `POST /api/aggregation?entityType=controls&group=ENTITY` plus
`POST /api/lookup?ByKeys=ENTITY_ID:controls_schema`. `POST /api/lookup?ByKeys=ENTITY` with a bare
`lookupType:"ENTITY"` fails — *"ENTITY_TYPE with id null not found"* (5002); resolve entity ids by
`GET /api/entity/{type}/{id}` once you know the type.
