# Building the atomic-agent architecture on UnifyApps

**Style:** the table and sections below are the **Full** style. The **Light** style is at the end of this file
("Light style on UnifyApps").

Everything below uses the platform skills for the mechanics (`unifyapps-builder` for workflows and agents,
`unifyapps-apps` for the code app, `unifyapps-context-graph` for the entity graph, `API-SPEC.md` for endpoints).
Names use the project prefix (`scc_`) and a short use-case code (`<uc>`); every object carries the project's tags.

| Architecture item | Platform object | Name |
|---|---|---|
| Atomic agent `AG-nn` | one **UnifyApps AI Agent** (`ai_agent` entity) with one Task — its single action — answering with the confidence envelope; its tools are the callable workflows it needs (`scc_<uc>_ag_<nn>_<slug>_tool`) | `scc_<uc>_ag_<nn>_<slug>` |
| Sub-workflow `SW-nn` | a callable workflow that invokes its agents (the Invoke Agent node, below), takes the minimum confidence, writes the ledger, routes sub-100 to the inbox | `scc_<uc>_sw_<nn>_<slug>` |
| Master workflow `MW-00` (steps `MW-nn`) | one orchestrator workflow calling the sub-workflows in step order (loops per item) | `scc_<uc>_mw_cycle` |
| Screen `UI-nn` | a screen of the use case's **one** app — a route of a code app (Maher Methodology) or a page of a config app, in its navigation grouped by role — a second app only when the requirements explicitly ask for more than one application | route `/<slug>` |
| Data entity `DE-nn` | a **data object** (records keyed by cycle and item) and, when entities must be traversed, a node type in the context graph | `scc_<uc>_<entity>` |
| Resolution Inbox (cross-cutting SW + UI) | object `scc_<uc>_resolution` + workflow `scc_<uc>_sw_resolve` + an inbox page | |
| Evidence Ledger (cross-cutting SW + UI) | object `scc_<uc>_evidence` (one row per agent run) + a ledger page | |
| Precedent ledger | object `scc_<uc>_precedent` (rule, scope, owner, created_from resolution) | |
| Cycle manifest | object `scc_<uc>_cycle` (scope, item set, permitted change classes, status) | |

## An atomic agent is an AI Agent (Maher, 2026-09-26: "it should be AI Agents")
Every `AG-nn` is a real UnifyApps AI Agent — visible in the agent registry, traced in Observability, governed by AI
Governance controls scoped to it — never a step folded into a workflow. One agent, one action:

- **The agent**: `ai_agent` named `scc_<uc>_ag_<nn>_<slug>`, tagged, one Task whose instructions state the single
  action, the inputs it receives (JSON in the query), and that it answers with the confidence envelope as JSON only
  (no prose). Mechanics: `unifyapps-builder` `references/agents.md` (entity, Task, tools, publish).
- **Its tools**: the callable workflows the action needs (`scc_<uc>_ag_<nn>_<slug>_tool`, native nodes first, Code last).
  - **Class D**: the tool does the whole deterministic computation (fetch, calculate, write); the agent calls it once
    and returns its envelope unchanged — `confidence: 100` or `status: FAIL` with a typed `abstain_reason`. Run it on a
    fast model (the call's `taskExecutionModel`), so determinism and cost come from the tool, not the model.
  - **Class E**: tools return the two independent readings (structured parse + OCR/LLM read); the agent compares them
    field by field: equal → 100; different → that field at 0 with both readings in `value.conflicts`.
  - **Class J**: tools fetch the evidence (and the precedent rules from `scc_<uc>_precedent`); the agent judges.
    Confidence = f(evidence density, precedent match, self-report) capped at 97; record model and instruction
    version in `confidence_basis`.
- **Invoked from its sub-workflow** with the **Invoke Agent** node 👁 (schema read on orbit.uat 2026-09-26; prove it
  with one agent before building the rest): `type: CALL_INTERFACE_WORKFLOW`, `context {appName:
  'ai_agents_by_unifyapps', resourceName: 'ai_agents_by_unifyapps_invoke_agent', resourceVersion: <resolve>}`,
  `inputs {callableInterfaceId: '__ua__invoke_ai_agent_by_unifyapps', parameters: {aiAgentId, userQuery: <the JSON
  input>, messageId: <idempotency_key>, taskExecutionModel: <fast model for class D>, skipApprovalBeforeToolExecution:
  true}}` → `agentResponses[].text` (parse the envelope) and `usage {cost, inputTokens, outputTokens, llmCalls}` (write
  it on the evidence row). `messageId` is the idempotency key: a replay is answered from the original turn and not
  billed again.
- `idempotency_key` = hash of agent id + version + canonical input; the sub-workflow skips an agent whose key already
  has an OK evidence row this cycle (resume, not restart).
- **Governance**: every control the user approves is scoped to the desk's agents (`accessibleTo` = their ids) —
  never `global`, which would act on every agent on the tenant.

## Sub-workflow
Calls its agents (parallel where independent), validates each envelope, takes `min(confidence)` and the
`binding_constraint`, writes the produced entity, and for any envelope < 100 creates a `scc_<uc>_resolution` row with
the disposition (Confirm 90–99, Review 70–89, Escalate < 70 / ABSTAIN), the candidate answers and the evidence refs.
It never proceeds past a write gate while an input is below 100.

## Resolution and precedent
The inbox page shows one card per open resolution, ranked by how much downstream work it blocks, with the pattern
that fits (Confirm / Choose / Correct / Apply to pattern / Teach / Escalate). Resolving writes the decision, stamps the
corrected value at 100, replays the dependent sub-workflows only, and — for Teach — writes a precedent rule the class
J agents read next cycle.

## Applications
**One application per use case** (Maher, 2026-09-26): every `UI-nn` is a *screen* of that one app, reached from its navigation (grouped by role, each role seeing its own screens). A second application only when the requirements explicitly ask for more than one application — never one app per persona or per human moment.

One screen per human moment, with the evidence assembled and the agent's pick pre-selected. The code app follows the
six-part promise (command-centre first screen, agents docked, ua-chart, talk to the data, tested on the builder preview,
the published URL only when the user asks). The Evidence Ledger page plots human touches per cycle and per-agent accuracy.

## Tracking the build (Forge)
Every item in the blueprint (`blueprint-schema.md`) gets a status (planned → building → built → verified, or failed /
blocked / reused) and the platform object it became (kind, id, link). Record status as each object is created and
again when its test passes, so the architecture page always shows what exists, what is pending and what failed.

## Tests per layer
These are the Full style's layers at the **Standard** test mode, the default (Light: see "Light style on UnifyApps"). Quick and In-depth are defined in
`unifyapps-solution-playbook/references/build-options.md` §3, and the user picks the mode at Phase 0.
- Agent: invoke it through the Invoke Agent node with a real input (and once directly from its agent test chat); assert
  the envelope shape, status and confidence rule for its class (D never returns 87; E returns a conflict on a
  deliberately mismatched field; J never exceeds 97), and that its trace shows the tool call.
- Sub-workflow: min-propagation and inbox routing with one agent forced below 100.
- Master workflow: one full cycle on real (or neutral, labelled) data; the evidence ledger has a row per agent run.
- Applications: every page on the builder preview (the published URL only when the user asks — a private published app needs app user accounts); one resolution resolved end to end, the replay visible.

## Light style on UnifyApps (`"style": "light"`)
| Design item | Platform object |
|---|---|
| Process step | a workflow, one orchestration per human action (native nodes first); a shared read or calculation is its own callable workflow |
| AI reading | an LLM or extraction step inside the workflow that needs it, on a fast model where a person waits. It writes the reading, its confidence and its evidence onto the record (an upsert keyed by the record) and one evidence-log row per call. Make it an AI Agent only when it needs tools or must be in the agent registry. |
| Reading below the bar | a `needs_review` status on the record, shown as a queue on the screen where that person works; the decision writes who, when and why |
| Assistant | the docked analyst agent with read tools (unchanged; `unifyapps-apps` six-part promise) |
| Screen `UI-nn` / entity `DE-nn` | as in Full: routes (code app) or pages (config app) of the one app; data objects |

Tests per layer (Light, at the chosen test mode):
- every workflow through its data source;
- every AI step with one ordinary and one edge input, its confidence and evidence written;
- one below-the-bar reading reaching the review queue and resolved;
- the assistant's tool-only question;
- every page on the builder preview.

