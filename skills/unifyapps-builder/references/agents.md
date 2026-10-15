# UnifyApps — AI Agents, Tasks and Tools via API

Reverse-engineered from the `orbit.uat.unifyapps.com` sandbox on 2026-09-19.
Companion to `unifyapps-automation-api.md`. **VERIFIED** = executed successfully.

Auth is identical to workflows — see section 2 of the automation doc.

---

## 1. The mental model

| UnifyApps concept | UI label | Entity type | What it is |
|---|---|---|---|
| Agent | Agents | `ai_agent` | The agent itself: system prompt, models, guardrails |
| Task | Tasks | `e_topic_ai_agent` | A journey/flow — *when* to act and *how* |
| Tool | Tools | `e_action_ai_agent` | A callable function, usually **a workflow** |
| Prerequisite Action | Tasks → Prerequisite Actions | `e_prerequisite_task_ai_agent` | Runs before the agent acts |
| Capability | Capabilities | (inline `properties.defaultTools`) | Built-ins: web search, todo, code, charts |
| Team | — | `e_ai_agent_team`, `e_ai_team_task` | Multi-agent orchestration |
| Knowledge | Knowledge | `knowledge_set`, `knowledge`, `knowledge_source` | RAG corpora |
| Deployment | Deployments | `ai_agent_deployment` | Channel bindings (web, Slack, …) |
| Prompt | — | `prompt` | Reusable prompt objects |

**The key insight:** a tool is just a call into a workflow. Same
`callables_call_automation` shape as a `CALL_WORKFLOW` node. So every workflow you build
is a potential agent tool, with no extra machinery.

---

## 2. Generic entity CRUD — **VERIFIED**

All agent objects are "entities" and share one CRUD surface.

| Operation | Call |
|---|---|
| **Create** | `POST /api/entity` with `{entityType, properties}` |
| **Read** | `GET /api/entity/{entityType}/{id}` |
| **List / search** | `POST /api/entity/{entityType}` (query body) |
| **Update** | `POST /api/entity/update` with `{id, entityType, properties, version}` |
| **Publish** | `POST /api/entity/action/saveAndDeploy` with the **full entity** + `deploymentNotes` |
| **Aggregate / filter** | `POST /api/aggregation?entityType={t}&group=ENTITY` |

Gotchas:

- `POST /api/entity/{entityType}` is **list**, not create. Creating there returns a page
  of existing entities and silently does nothing.
- Update is *not* `POST /api/entity` with an id — that returns a Mongo duplicate-key 500.
- `PUT /api/entity/{type}/{id}` is **405** (UAT 2026-09-23) — tools and agents alike; only `POST /api/entity/update`.
- `conversationStarters` is an array of **plain strings**. Objects (`{text}`) are stored stringified and the copilot renders the JSON literally (UAT 2026-09-23).
- `saveAndDeploy` validates the whole entity; a missing `properties.name` fails with
  *"Non Empty Validations ... required name"*. Read the entity, modify, send it all back.
- Entities use `group=ENTITY` in aggregation. `group=STANDARD` (used by workflows) errors
  with *"Invalid group: STANDARD and type: e_topic_ai_agent"*.

Entity response envelope:

```json
{ "id": "e_6aae34ad3c95b76375e8dce2", "entityType": "ai_agent", "version": 1,
  "createdTime": 0, "modifiedTime": 0, "ownerUserId": 12345, "deleted": false,
  "deploymentState": { "deployedAt": 0, "deployedBy": 12345, "entityVersion": 1, "version": 1 },
  "properties": { }, "grants": { }, "tags": [] }
```

Everything real lives in `properties`.

---

## 3. Agent — `ai_agent`

### Create (**VERIFIED**)

```http
POST /api/entity
{ "entityType": "ai_agent",
  "properties": { "name": "Support Agent",
                  "agentType": "CONVERSATIONAL",
                  "instructions": "You are a support agent. Be concise." } }
```

`properties.name` is effectively required — without it publish fails later.

### Key properties

| Property | Meaning |
|---|---|
| `name` | Agent name (required for publish) |
| `instructions` | **The system prompt** (string) |
| `agentType` | e.g. `CONVERSATIONAL` |
| `defaultTools` | Built-in capabilities, a flat map of booleans |
| `disableDefaultTools` | Turn the whole built-in set off |
| `visibility.type` | Who can see it |
| `responseGenerationSettings.answerGenerationModel` | Answer model |
| `responseGenerationSettings.{tone,style,format,outputSchema}` | Response shaping |
| `preProcessingSettings.{queryRephrasingModel,rankingModel,hybridSearch,useHyDE}` | RAG pre-processing |
| `indexingSettings.{embeddingModel,chunkingSettings,graphRAGSettings,piiMasking}` | Knowledge indexing |
| `longTermMemorySettings.enabled` | Memory |
| `contextManagement.{compressionEnabled,compactionSettings}` | Context window handling |
| `topicExecutionSettings.{topicSelectionModel,topicExecutionModel,topicAsTool}` | How Tasks are chosen/run |
| `multiAgentConfig`, `teamManagerSettings.agentsAsTools` | Multi-agent |
| `textToSQLSettings` | Text-to-SQL behaviour |
| `websearchSettings`, `voiceSettings`, `dictationSettings` | Channel features |
| `evalSettings.isEnabled`, `loggingSettings`, `promptCachingSettings` | Ops |
| `mcpEnabled` | Expose agent over MCP |

`defaultTools` keys observed: `deepResearch`, `executeCodeTool`, `executeCodeInSandbox`,
`generateChartTool`, `generateImageTool`, `createDocx`, `createPDF`, `createPPTX`,
`createExcel`, `createFile`, `analyseFile`, `documentVision`, `companyKnowledge`,
`ingestKnowledge`, `search_knowledge_graph`, `todo_tool`, `planTool`, `summaryTool`,
`requestClarification`, `clarifyFromUser`, `clarifyConnection`, `loadSkill`,
`saveInstantMemoryTool`, `informationNotFoundTool`, `generatePublicFileUrl`,
`allowKnowledgeControl`, `CompleteDocumentContext`.

### Publish (**VERIFIED**)

```http
POST /api/entity/action/saveAndDeploy
{ ...the entire entity object..., "deploymentNotes": "V1 via API" }
```

Response carries `deploymentState.version`, which increments per publish. Then verify by snapshot, not by version:
see "Verify a publish by snapshot" below (deploy again at most 3 times if the snapshot differs).

---

## 4. Task — `e_topic_ai_agent`

A Task is a journey: **`description` says when to use it, `instructions` says how.**

```http
POST /api/entity
{ "entityType": "e_topic_ai_agent",
  "properties": {
    "name": "Customer Lookup",
    "description": "Use this task when the user asks to look up a customer by id.",
    "instructions": [
      "Ask the user for the customer id if not provided.",
      "Call the LookupCustomer tool with that id.",
      "Summarise the returned rows and the http status in plain English."
    ],
    "aiAgentId": "e_6aae34ad3c95b76375e8dce2",
    "enabled": true,
    "isAppConnector": false,
    "runTimeConnectionEnabled": false,
    "governanceConfig": {}
  } }
```

- `instructions` is an **array of strings**, not a single string.
- `description` is what the router matches on — write it as a trigger condition.
- `aiAgentId` links it to the agent.
- `modelSelectionConfig` optionally overrides the model for this task.

Verified: created via API, appears immediately in the agent's **Tasks** tab.

---

## 5. Tool — `e_action_ai_agent`

A tool that calls one of your workflows:

```http
POST /api/entity
{ "entityType": "e_action_ai_agent",
  "properties": {
    "name": "LookupCustomer",
    "description": "Look up a customer by id. Returns oracle rows and an http payload.",
    "aiAgentId": "e_6aae34ad3c95b76375e8dce2",
    "topicId": "GLOBAL",
    "context": { "appName": "callables", "resourceName": "callables_call_automation" },
    "inputs": { "automationId": "6aae21e07c95610571778cb5",
                "version": "-1", "synchronous": true,
                "runtimeConnections": {}, "parameters": {} },
    "enabled": true
  } }
```

### Scoping — **VERIFIED**

| `topicId` | Effect |
|---|---|
| `"GLOBAL"` | Agent-level tool; appears in the **Tools** tab, available to every task |
| `"<topic entity id>"` | Scoped to that Task only; does **not** appear in the Tools tab |

### Critical defaults

`enabled` defaults to **`false`** when omitted — the tool exists but the agent will never
call it. Always set `enabled: true`.

Other server-applied defaults: `deferToolLoading`, `enableToolSearch`,
`excludeInputOutputFromTrace`, `isStandardAction`, `runTimeConnectionEnabled`.

**Per-user OAuth (runtime user connections)** — omit `connectionId` and set `runTimeConnectionEnabled: true`
on a connector tool: each user gets a one-time Connect card and their own stored connection (`ownerUserId`),
reused on later chats. Secrets come back masked from `GET /api/connection/{id}` and never live in data objects.
Never bind personal connectors (Gmail/Drive/Calendar/Fireflies) to a fixed connection. See API-SPEC §8.

### Parameters

`inputs.parameters` maps to the target workflow's `inputs.setup` JSON Schema. Left as
`{}`, the model fills arguments from the schema. `version: "-1"` = latest deployed.
`synchronous: true` waits for the result.

### Real-world reference

The platform's own prompt-to-automation copilot (`text_to_automation_ai_agent_v2`) is
built exactly this way — tools named `FetchActions`, `UpdateWorkflow`, `RebuildWorkflow`,
`FillInput`, each a `callables_call_automation` into an internal workflow, all with
`topicId: "GLOBAL"`. Worth reading as a design reference.

---

## 6. Recipe — agent with a workflow-backed tool (**VERIFIED**)

1. Build and **deploy** the workflow (automation doc §6). Give it a `CALLABLE` trigger
   with a clear `inputs.setup` schema — that schema becomes the tool's argument contract.
2. `POST /api/entity` → `ai_agent` with `name` + `instructions`.
3. `POST /api/entity` → `e_topic_ai_agent` with `aiAgentId`, `description`, `instructions[]`.
4. `POST /api/entity` → `e_action_ai_agent` with `aiAgentId`, `topicId`,
   `context.resourceName = callables_call_automation`,
   `inputs.automationId = <workflow id>`, **`enabled: true`**.
5. `POST /api/entity/action/saveAndDeploy` with the full agent entity.

Naming matters more than usual: the agent picks tools from `name` + `description`, so
write them as instructions to a model, not as internal identifiers.

---

## 7. UI routes (useful for eyeballing what the API built)

```
/p/0/ai-agents/custom                                   list
/p/0/ai-agents/{id}/configuration/instructions          system prompt
/p/0/ai-agents/{id}/configuration/topics                Tasks
/p/0/ai-agents/{id}/configuration/actions               Tools
/p/0/ai-agents/{id}/configuration/tasks                 Prerequisite Actions
/p/0/ai-agents/{id}/configuration/capabilities          built-in defaultTools
/p/0/ai-agents/{id}/configuration/knowledge             knowledge
/p/0/ai-agents/{id}/configuration/skills                skills
/p/0/ai-agents/{id}/configuration/ai-models             models
/p/0/ai-agents/{id}/deployments                         channels
/p/0/ai-agents/{id}/observability                       traces
```

Note the mismatch: the tab **labelled** "Tasks" is `/configuration/topics`, while
`/configuration/tasks` is **Prerequisite Actions**.

---

## 8. Scale in this tenant (context for what is normal)

31,703 workflows · 28,994 tools · 2,872 tasks · 7,775 connections · 1,210 node types ·
17,791 entity types.

---

## 9. Not yet covered

Honest list of what this study did **not** establish:

1. **Invoking an agent** — how to start a conversation and read a reply over the API
2. **Knowledge** — creating `knowledge_set` / ingesting sources
3. **Skills** entity shape
4. **Guardrails** — the sensitive-information / hallucination / content-filter configs
5. **Deployments** (`ai_agent_deployment`) — binding an agent to a channel
6. **Multi-agent teams** — `e_ai_agent_team`, `e_ai_team_task`
7. **Model selection** — valid values for `answerGenerationModel` (see `ai_agent_llm_model`)
8. **Prerequisite actions** — `e_prerequisite_task_ai_agent` shape

---

## 10. Scratch objects created (left in place — do not delete; see the no-delete rule)

| Entity type | id | name |
|---|---|---|
| `ai_agent` | `e_6aae34ad3c95b76375e8dce2` | ZZ Api Test Agent (published v1) |
| `e_topic_ai_agent` | `e_6aae34db5f977a32333e7090` | Customer Lookup |
| `e_action_ai_agent` | `e_6aae34db6a7a1a6dffbce1b5` | LookupCustomer (task-scoped) |
| `e_action_ai_agent` | `e_6aae36065f977a32333e77bb` | LookupCustomerGlobal |

## Agent Skills (`e_skill_ai_agent`) ✅ UAT 2026-09-21

A Skill (the agent's *Skills* tab) is its own entity, **not** a field on the agent. The link is on
the **skill**: `properties.accessibleTo = ["ai_agent/<agentId>", ...]`.

| Step | Call |
|---|---|
| Read one | `GET /api/entity/e_skill_ai_agent/{skillId}` → `properties {name, description, skill (the SKILL.md text), files[], category, enabled, accessibleTo[], isHidden}` |
| Skills of an agent | `POST /api/aggregation?entityType=e_skill_ai_agent&group=ENTITY` with `filter:{op:"AND",values:[{field:"properties_accessibleTo",op:"IN",values:["ai_agent/<agentId>"]}]}` |
| Attach to an agent (= console *Add skill*) | append `"ai_agent/<agentId>"` to `accessibleTo` → `POST /api/entity/update` (full entity) → `POST /api/entity/action/saveAndDeploy` (fresh full entity) → republish the agent |
| List all | `POST /api/entity/e_skill_ai_agent {page:{limit,offset}}` — offset paging caps at 1000 rows; search by name client-side |

⚠️ **Deploying a skill publishes its whole current draft.** `entity.version` can be ahead of
`deploymentState.entityVersion` (edits saved but not published); your `saveAndDeploy` then makes
those pending edits live for **every** agent in `accessibleTo`. Compare the two before deploying and
tell the owner.

✅ **Attaching does not need the skill deploy** (verified 2026-09-21): `accessibleTo` + `POST /api/entity/update`
only, then republish the *agent* (with `defaultTools.loadSkill: true`) — the RFP Agent's trace showed
"Reading the unifyapps-response-qa-scorer skill" and applied its rubric. Prefer this: it leaves the
owner's unpublished skill draft unpublished.

### Create a skill with bundled script files ✅ UAT 2026-09-21
Skill `files[]` are mounted in the code sandbox at `/workspace/skills/<…>/<relativePath>` — locate them with
`find /workspace/skills -path '*/scripts/<file>.py' -print -quit` (the built-in `generate-chart` skill does
exactly this). So ship real helper modules instead of pasting code into SKILL.md.

1. Upload each file (same-origin, cookie auth) — the console's multipart flow:
   - `POST /api/file/create-multipart-upload {fileName, mimeType, directory:"user-uploads/<tenant>/<folder>"}` → `{uploadId}`
     (`GET /api/file/upload-bucket` gives the allowed `directory` root, e.g. `user-uploads/147`)
   - `POST /api/file/upload-part` multipart form `file`, `partNumber=1`, `uploadId`
   - `POST /api/file/complete-multipart-upload?uploadId=…` → `{key, location}` (`location` = `/api/file/download/…`)
2. `POST /api/entity {entityType:"e_skill_ai_agent", properties:{name, description, skill:<SKILL.md>, enabled:true,
   isHidden:false, accessibleTo:["ai_agent/<agentId>"], files:[{fileObject:{name, path:<location>, source:<key>,
   sourceType:"CLOUD_STORAGE", fileType:"py", size}, relativePath:"scripts/x.py"}]}}` → then
   `POST /api/entity/action/saveAndDeploy` (fresh full entity), then republish the agent.

**Built-in file tools = skill + sandbox.** "Create DOCX/PPTX/PDF/Excel" show in the trace as
`loadSkill` → `executeCodeInSandbox` (the model writes python-docx/python-pptx code in `/workspace/working`)
→ `RenderArtifact` (canvas file; the result gives an artifact id to re-render a new version).
Because the model writes the layout every time, output drifts between runs — give it a skill with fixed helpers.

## Clone an agent ✅ UAT 2026-09-21
Console *⋯ → Clone* (name + optional workspace) copies instructions, tools, tasks, **skills and
knowledge sets** (knowledge re-syncs). No REST clone endpoint captured yet; a hand-rolled REST copy
of `ai_agent` + tools + topics loses skills/knowledge unless you also add the agent to each skill's
`accessibleTo`.

## Copying tools between agents ✅ UAT 2026-09-21
Connector tools (e.g. HubSpot) are plain `e_action_ai_agent` rows:
`{name, description, aiAgentId, topicId, context:{appName, resourceName, connectionId}, inputs, enabled:true}`.
To reuse another agent's toolset, list its rows (`POST /api/entity/e_action_ai_agent` filter
`properties.aiAgentId`), de-duplicate by `context.resourceName` (clones often carry duplicate rows),
filter out write actions if the target must be read-only, and `POST /api/entity` each with the new
`aiAgentId`. Republish the target agent.

## Talking to an agent over the API ✅ UAT 2026-09-21 (closes open question #2)

Same-origin from a logged-in tab (cookie auth). This is what the agent *Preview* uses.

**Send a message** (new conversation) — streaming:
```
POST /api/workflow/execute/node/sse        Accept: text/event-stream
{ "context": {"appName":"callables","resourceName":"callables_call_automation_streaming"},
  "inputs":  {"automationId":"67dcfe388445037d9b0662c0","synchronous":true,
              "debugParams":{"createCase":"67dcfe388445037d9b0662c0"},
              "parameters":{"copilotType":"AI_AGENT_TEST","message":"<text>","messageContentType":"MARKDOWN",
                            "aiAgentId":"<agentId>","timezoneId":"Asia/Dubai"}} }
```
The stream is `event:message` / `data:{response:{result:{caseId, delta:{data, path}, messageId, responseGenerationStatus}}}`.
Take `caseId` from the first event. Read the whole body with `r.body.getReader()`; the stream closes
when the turn ends (a report took ~60 s). Optional `parameters.settings.taskExecutionModel` picks the model.

**Read the conversation** (final text):
```
POST /api/workflow/execute/node?name=call_automation&fetchConversation=66ab98083d73300e63962287&copilotType=AI_AGENT_TEST
{ "context":{"appName":"callables","resourceName":"callables_call_automation"},
  "inputs":{"automationId":"66ab98083d73300e63962287","synchronous":true,
            "parameters":{"copilotType":"AI_AGENT_TEST","caseId":"<caseId>","userId":"<your user id>",
                          "aiAgentId":"<agentId>","until":<epoch ms>}} }
```
→ `response.messages[]` (`messageType` Bot|Fan, `additional.internalMessageType:"THOUGHT"` for the
thinking lines, text in `message[].data.text`), `response.additional.responseGenerationStatus`
(`completed`) and `llmUsageDetails` (tokens, **cost**). The answer is the Bot message without
`internalMessageType`. The list is **reverse chronological**, so the answer is the **first** such message, not the
longest: in a stalled turn the longest one is a mid-turn narration (builder `SKILL.md` "Measure it properly";
API-SPEC §33).

**Which model runs the agent loop** ✅ 2026-09-21: `topicExecutionSettings.topicExecutionModel`
(also `topicSelectionModel`) drives tool calling and the streamed answer;
`responseGenerationSettings.answerGenerationModel` alone changed nothing measurable. RFP Agent, same
prompt + one 13 s tool call: default `e_699c8d91…` 60 s / $0.11 → Gemini 3.8 Flash [MEDIUM]
`e_6ab12f80f843281fda62e98d` **35 s / $0.057**, same verdict, table and `ua-chart` block.
Edit with `POST /api/entity/update` (full entity) then `POST /api/entity/action/saveAndDeploy`.

**Traces over the API** (the Observability tab):
- Timeline: `POST /api/workflow/execute/node?name=GetTraceTimeline&fetchTraceDetail=680cdbcaa3741471fc7c22e9`
  `{context:{appName:"callables",resourceName:"callables_call_automation"},inputs:{automationId:"680cdbcaa3741471fc7c22e9",synchronous:true,parameters:{traceId:"<first Fan messageId of the turn>"}}}`
  → `response.timeline.children[]` (Input Guardrails, Agent Execution → LLM / Tool spans with
  `toolName`, `timeTaken`, token info).
- Span I/O: `…name=TraceTimelineDetails&fetchTimelineDetails=6943f1be474ba4398bf4201c` with
  `parameters:{id:"<spanId>",type:"Tool"|"LLM"|"Query"}` → `response.inputOutputContent`.

### Silent end after `loadSkill(generate-chart)` ✅ reproduced twice 2026-09-21
With `generateChartTool` (+ `renderArtifact`, with or without `executeCodeTool`) the model calls
`loadSkill(["generate-chart"])`, the trace shows a long "Miscellaneous" span and **no further LLM
call** — the user sees only the model's "Building the charts…" line and never gets the answer.
Disabling the chart capabilities and asking for text bar charts in markdown fixed it (full report,
$0.34). If you need charts, render them in the app (or verify a different agent config) —
do not ship an agent whose answer depends on the chart path without testing it over this API.

## Knowledge (RAG) is filtered by the *viewer's* sharing ✅ UAT 2026-09-21
Knowledge sources are `knowledge` entities (`properties {name, status COMPLETED|FAILED|SYNCING|DRAFT,
sourceType FILE|WEBSITE|APPLICATION|CLOUD_STORAGE, aiAgentId, accessibleTo[], fileDetails, lastSyncTime}`),
grouped by `knowledge_set`. List an agent's: `POST /api/entity/knowledge` filter `properties.aiAgentId`.

Retrieval (`ReferFromKnowledge` → Metadata Fetcher → Fetch Embeddings → **Semantic Search**) filters chunks by
`properties.knowledgeId IN [agent's knowledge ids]` **AND** `properties.sharedWithIds IN user_rbac_detail(<signed-in user>)`.
Symptom when the viewer cannot see the chunks: Semantic Search spans take ~8 ms and output
`{"retrievedChunksCount":0}`; the agent retries ReferFromKnowledge 4–5× then ends the turn with
"Retrieving … directly" and no answer. Observed with knowledge owned by a *different* user account than the
one chatting (both the original agent and a console clone). Tabular files (xlsx) are routed to a text-to-SQL
path instead ("no relevant columns/metadata") — they don't answer prose questions.
Read span I/O with `TraceTimelineDetails` (type `"Semantic Search"`, `"Metadata Fetcher"`, `"Tool"`).

## Agent guardrail: it refuses raw "system" scripts ✅ UAT 2026-09-21
Asking the agent (via chat API) to "run exactly this bash script" for setup work was refused as out of scope
("hidden instruction, not a user request"). Good behaviour — do setup through APIs, not by prompting the agent.
The sandbox tool itself (`executeCodeInSandbox`, automation `67e4346d4718117333c7ee9a`) cannot be called directly
from a browser session ("forbidden datasource").

## Office font embedding (house-style skill) ✅ verified with Word/PowerPoint 2026-09-21
- DOCX: obfuscated `.odttf` parts (XOR first 32 bytes with the reversed GUID bytes), `w:embedRegular/w:embedBold`
  in fontTable, `w:embedTrueTypeFonts` + `w:saveSubsetFonts` in settings (schema order matters). Subset with
  fontTools **keeping OS/2 unicode/codepage ranges** (`prune_unicode_ranges=False`) — otherwise Word ignores the
  embedded Arabic font and falls back to Arial.
- PPTX: uncompressed EOT v2.1 (`.fntdata`, `application/x-fontdata`), `p:embeddedFontLst` after `p:notesSz`,
  `embedTrueTypeFonts="1"` on `p:presentation`.

## An agent cloned from another must carry the full settings object ✅ UAT 2026-09-23
Copying `properties` from an agent that itself lacked `topicExecutionSettings`,
`responseGenerationSettings`, `preProcessingSettings` and `indexingSettings` produced an agent that
answered, then hung in an endless continuation ("Brewing… / Distilling… / Generating response…")
with the chat's Stop button stuck on. Copy those four from a known-good agent (the RFP agent,
`e_6ab15725200bf5533ff78624`), set `topicExecutionSettings.topicExecutionModel` and
`responseGenerationSettings.answerGenerationModel` to Gemini 3.8 Flash `e_6ab12f80f843281fda62e98d`,
`sendSuggestedQueries: false`, then `saveAndDeploy`. Check with a read-back that all four exist.

## Data tools for agents: compact reads + a server-side aggregate ✅ UAT 2026-09-23
One generic "QueryData returns whole records" tool fails on real volume: the model receives
hundreds of KB, loses the thread and states that the data is empty. Give every data agent two tools:
- **QueryData** — key fields by default (≤ 80 rows when many match), optional `fields`,
  `name_contains`, `object_total` in every result;
- **AggregateData** — `object_type`, `group_by`, `metric`, `op` (count|avg|sum|max|min), optional
  filter and `top`; Groovy groups over one storage page of `limit: 5000` with
  `includeTotalCount: true` on the fetch, returning `records_scanned`, `object_total`, `complete`.
Instructions say which to use when, and that an empty search is "no match for X", never "the
object is empty". Reference: the supplier-risk build's query and aggregate workflows `6ab35e559d7b0545553f32f6`
and `6ab377ddaa76b93f750914c9` (case file `unifyapps-solution-playbook/references/builds/rest-supplier.md`). Test battery: `unifyapps-apps` ai-app-patterns §16.


## Verify a publish by snapshot, not by version ✅ UAT 2026-09-25 (API-SPEC §47.1–47.2)
- `ai_agent.version` climbs after a publish with no real change (platform writes). A publish is
  current when `GET /api/entity/deployed/ai_agent/{id}` `.properties` equals the agent's `.properties`.
  Never loop "publish until `deploymentState.entityVersion === version`".
- The first `saveAndDeploy` after an edit can still deploy the pre-edit snapshot (API-SPEC §27). So: deploy,
  compare the snapshot's `properties` with the agent's, and if they differ re-read and deploy again, at most 3
  times, then stop and report.
- `POST /api/entity/update` without `tags` clears the agent's tags: always send them.
