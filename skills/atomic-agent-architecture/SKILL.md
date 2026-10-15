---
name: atomic-agent-architecture
description: The solution architecture UnifyApps use cases are designed with, in one of two styles chosen per use case — FULL atomic for AI decision pipelines (case desks, invoice/claim/document processing, multi-step agentic operations) and LIGHT for dashboards, analytics, command centres and chat-over-data — plus the core rules every build follows in both styles. Full style: process stages, a master workflow documented before anything is built, sub-workflows, single-action atomic agents (classes D deterministic, E extraction, J judgment), one screen per human moment inside ONE application, the data entity each step produces, the confidence contract, the Resolution Inbox and Evidence Ledger, precedent that compounds, and the build sequence. Use whenever a use case is designed, planned, scoped, presented or built (Claude Code, Forge), whenever an architecture table or "atomic agents" are mentioned, and whenever agents are reused across solutions.
metadata:
  author: Maher
  source: "an earlier multi-agent solution design (case file: unifyapps-solution-playbook/references/builds/mars-pedigree.md) — solution design and architecture portrait (2026-09-01, 2026-09-24); decomposition methodology by Waseem Bhatti"
---

# Atomic-agent architecture

A use case is not "an agent". In the **Full** style it is a **master workflow** of steps, each implemented by **sub-workflows**, each
made of **atomic agents** that do exactly one thing, with an **application** wherever a person must decide, and a
**data entity** produced by every step. The design is written down and agreed (Phase 0) before anything is built,
and every build item is then tracked against it. The **Light** style keeps the agreed process and the core rules
without the full structure (below).

Reference build (Full style): an earlier multi-agent storefront-optimization build (case file:
`unifyapps-solution-playbook/references/builds/mars-pedigree.md`) — 1 master workflow of 20 steps, 26 sub-workflows (24 staged + 2 cross-cutting),
78 atomic agents (40 D, 20 E, 18 J), 15 applications, 9 integrations.

## Pick the style first — per use case (Claude and Forge alike)

The full structure pays off where AI readings drive decisions step after step. It is overhead where they don't. Of
the eleven builds in the playbook, only two used the full style: Mars (78 agents) and the Forge Three-Way Match (6
agents). The six builds that set the bar were built before this architecture existed, and were accepted without it.

| Use-case type (playbook §1b) | Recommended style |
|---|---|
| Request / case desk: intake → AI reading → rule check → auto-decide or route to a person (AP invoices, claims, travel, customs, onboarding) | **Full** |
| Document evidence / fraud verdict against a corpus | **Full** |
| Designed multi-step agentic operation (cycles, dozens of AI actions, precedent) | **Full** |
| Executive / KPI command centre, analytics over systems or a context graph, scoring overlay, conversational analytics | **Light** |
| Golden-record 360 with rules → to-dos → cases | Light, or Full when AI readings decide cases |
| A no-code (config) app the customer maintains | **Light** |

The builder (Claude or Forge) recommends a style from this table and says why in one line. The user confirms or
overrides it (playbook `references/build-options.md`, question A5). Record the answer as `style` in the blueprint or
plan. Change the style later only through a design change (§"Changing the design").

- **Forge** validates each style's own contract (`references/blueprint-schema.md`, "Light-style blueprint"). A
  blueprint without `style` is treated as Full.

| | **Full** | **Light** |
|---|---|---|
| Process agreed before building | master workflow (MW-nn) in the six stages | a short numbered process (steps, who acts, what each produces), stages optional and named freely |
| AI steps | each an atomic agent (AG-nn), a real AI Agent with the confidence envelope | an LLM or agent step inside the workflow that needs it; an AI Agent only when it needs tools or must sit in the agent registry |
| Sub-workflows | SW-nn per step, min-confidence propagation | ordinary workflows, one orchestration per human action |
| Low-confidence readings | the cross-cutting Resolution Inbox (UI + SW) | a "needs review" state on the screen where that person already works |
| Evidence Ledger | yes | yes: one row per AI call (the core rules) |
| Precedent ledger, cycle manifest, idempotency keys | yes | only if the use case runs in cycles |
| Blueprint items | MW / SW / AG / UI / DE / GV / AC / SC | steps, UI, DE, AC, SC (AG only for real AI Agents) |

Everything below this section describes the **Full** style unless it says otherwise. The core rules apply to both.

## The core rules — every build, both styles
1. **Agree the process before building.** The steps, who acts at each, and what each produces are written in business
   terms and confirmed with the user in the Phase 0 message (build question A0), before anything is built. The early
   review (C3) re-checks the process against the data and the first screen.
2. **A model never does arithmetic, lookups or thresholds.** A workflow step or a tool does. A rule, lookup or
   calculation is a workflow step. It becomes an agent (Full style, class D) only when it must sit in the agent
   registry.
3. **One AI step, one job.** If its output can be wrong in two independent ways, split it.
4. **Every AI reading that drives a decision shows its confidence and the evidence behind it.** A reading below the
   bar goes to a person, never "proceed with a warning".
5. **One current reading per record.** Write the reading with an upsert keyed by the record it describes. Keep the
   history in an evidence log, one row per AI call.
6. **Scenarios and acceptance criteria in business terms:** a happy path, an exception, a human decision, each
   traced through the design.
7. **Internal codes (MW-, SW-, AG-, UI-, DE-) never appear on a customer's screen.** The customer's view comes first,
   and the machinery sits under "How it works" (playbook, Mars case file).

## The seven design principles (Full style)
1. **The process is documented before anything is built.** Phase 0 produces the master workflow as one artifact
   with no apps and no agents in it. It is the contract; everything else implements a step of it.
2. **One agent, one action.** If an agent's output can be wrong in two independent ways, it is two agents.
   Atomicity makes a node testable, reusable, replaceable and accountable for its confidence.
3. **Probabilistic proposes, deterministic verifies and executes.** A language model never does arithmetic, never
   calls an API, never does a lookup and never decides a threshold. Those are class D agents with typed contracts.
4. **Every agent returns a confidence number, and the number is earned** (the confidence contract below). A
   judgment agent cannot reach 100 on its own.
5. **Nothing publishes below 100.** Under 100 is a queue item in the Resolution Inbox, never "proceed with a warning".
6. **Human moments get an application, not a notification.** Evidence assembled, the agent's pick pre-selected,
   one gesture; median resolution under fifteen seconds.
7. **Corrections are retained as precedent, not consumed as fixes.** Every human resolution writes a rule (scope +
   owner) to the precedent ledger; the same case clears at 100 next cycle. Human touches per cycle must fall.

MGSA for agents: **Mindset** = runtime constraints (evidence or abstain; say the number; the human decides; one
job). **Goals** = one measurable outcome per agent (with a golden-set threshold when a golden set exists). **Skills** = precedent rules,
guardrail knowledge, extraction patterns, calibration — written by human resolutions. **Activities** = the single
action with typed input/output, idempotency key and evidence write.

## The architecture (the table)
Read top to bottom by **process stage**; each row is one master-workflow step laid out left to right:

| Master workflow | Sub-workflows | Atomic agents | Applications | Data entity produced |
|---|---|---|---|---|
| `MW-nn` + step name | `SW-nn` chips (one or more) | `AG-nn` name, class dot, ↺ when shared, grouped by SW when a step has several | `UI-nn` chips, or — | the entity (dark pill) |

- **Stages** (colour bands) — always the template's six, in this order, with these keys: `setup` Setup ·
  `read` Read & ground · `understand` Understand & prioritize · `propose` Propose · `govern` Govern · `publish`
  Publish & measure. The stage *names* may be said in the use case's language; the keys and order never change, and
  every step sits in one of them: acquire truth first, decide later, write last. (Full style: Forge rejects any
  other stage set. Light style: stages are optional and named freely.)
- **IDs**: `MW-01…` steps, `SW-01…` sub-workflows, `AG-01…` agents, `UI-01…` applications, `DE-01…` entities.
  A step may say "Orchestration only — no dedicated agent". Loop steps say "(loop, per <item>)".
- **Shared agents** (↺) are listed once and referenced again where they serve a second, closely related step.
- **Cross-cutting**, above the table: the **Resolution Inbox** (a UI + SW that receives every sub-100 output from
  any agent in any row and routes it to a named person) and the **Agent Trust & Evidence Ledger** (a UI + SW that
  records every run — inputs, outputs, prompt, model version — and is never triggered by a single step).
- **Data entity flow** (the context graph), below the table: the entities converge — ground-truth records fold into
  understanding, one decision produces the next artifact — ending in precedent that feeds the next cycle.
- **One current reading per record**: an agent's result entity (DE-nn) is keyed by the record it describes and written
  with an upsert, so a re-run replaces the reading instead of adding one — the Evidence Ledger keeps the history. (A
  Forge build that created a new row per run had 167 estimates for 121 requests and dashboards that did not reconcile.)
- The **decision rule** for every step: can AI do it autonomously and can the result be verified? → an agent. Must a
  person decide, judge or be accountable? → a workflow step with an application. No third category.

## Agent classes and the confidence contract
Every agent returns the same envelope:
```
{ agent_id, agent_version, run_id, cycle_id, idempotency_key /* hash(agent_id, agent_version, canonical_input) */,
  status: OK | ABSTAIN | FAIL, value: <typed payload, schema-validated>, confidence: 0-100,
  confidence_basis: { method, evidence_refs[], model_version, calibration_set },
  binding_constraint /* the input that capped this confidence */, abstain_reason /* typed enum */, observed_at, cost_ms }
```
| Class | Does | Confidence | Ceiling |
|---|---|---|---|
| **D** deterministic | fetches, authorized API reads, calculations, normalizations, diffs, writes | a verification outcome: schema valid + second-source reconciliation + checksum, else FAIL with a typed error | 100 or FAIL |
| **E** extraction | parse / classify what is visibly present | dual read per field by independent methods; agreement = 100, disagreement = 0 for that field only with both readings sent to the inbox; never averaged | 100 |
| **J** judgment | cluster, hypothesize, estimate, write, score | evidence density + precedent match + self-report calibrated on a golden set **when one exists** (isotonic; no build has had one yet); raw self-report never used on its own | 97 |

**Propagation is a minimum, never a mean**: a composite inherits its lowest input and carries it as
`binding_constraint` ("Capped at 91 by AG-39").

| Confidence | Disposition | Behaviour |
|---|---|---|
| 100 | Auto-proceed | continues without a human |
| 90–99 | Confirm | Resolution Inbox, one gesture, the agent's answer pre-selected |
| 70–89 | Review | full card: both candidates, evidence, downstream impact |
| < 70 or ABSTAIN | Escalate | a named owner, the abstain reason and the whole evidence chain |

Resolution patterns (chosen by the system): **Confirm** (< 8 s) · **Choose** (< 12 s) · **Correct** inline, then
replay downstream from that node only (< 30 s) · **Apply to pattern** (same correction to N similar items) ·
**Teach** (write a precedent rule with scope and owner) · **Escalate** (named person, full chain).

## Reliability, by construction
1. Idempotency on every step (the key above): re-runs are free, a failed cycle resumes, a corrected node replays
   only what depends on it. 2. Typed contracts at every boundary; a schema violation fails the step. 3.
   Probabilistic and deterministic never mix inside one agent. 4. Bounded retry, then abstain with a typed reason —
   never a guess. 5. The write path needs an approval token bound to the diff hash. 6. Publish, then verify (re-read),
   then arm rollback; prior state is always kept, no change is destructive. 7. *(Optional, for a production
   go-live with a golden set; no build has done it yet)* Promotion gates and drift monitoring per agent: a version
   reaches production only after its golden set; a drifting agent is demoted to review-only.

Governance gates terminate in named applications (brand → auto-clear at 100 else review UI; regulatory → always a
person; commercial → advisory; publish → one gate with every token). Agents draft, humans approve.

## Build sequence (Full style; each phase usable on its own)
0 **Process capture** — the master workflow agreed and signed; no build. 1 **Read** — acquisition, grounding and
the evidence ledger. 2 **Understand** — analysis and prioritization, the decision board live. 3 **Propose** —
generation agents and their studios. 4 **Govern** — gates, approval orchestration, signed tokens. 5 **Close the
loop** — publish, verify, roll back, measure against a holdout, write precedent back.

Measure three layers: commercial outcome, process outcome (cycle time, approval turnaround, rollback rate) and
system outcome (human touches per cycle, median resolution time, precedent rules accumulated, per-agent accuracy).

## Building it on UnifyApps
**One application per use case** (Maher, 2026-09-26): every `UI-nn` is a *screen* of that one app, reached from its navigation (grouped by role, each role seeing its own screens). A second application only when the requirements explicitly ask for more than one application — never one app per persona or per human moment.
Before designing, pick the closest earlier build in `unifyapps-solution-playbook` §1 and read its case file —
its corrections and its reusable parts shape the design (customer view first, no invented sources, real data).
`references/unifyapps-implementation.md` — how each layer becomes platform objects (atomic agent = a UnifyApps
AI Agent with one Task, invoked from its sub-workflow by the Invoke Agent node, its tools the callable workflows; sub-workflow and master workflow = orchestrators; evidence / inbox / precedent
objects; applications = pages of the one app, config or code; entities = data objects), naming, tags, and tests.
`references/blueprint-schema.md` — the machine-readable architecture (Forge stores and renders it, and tracks each
item's build status and platform link).
`references/atomic-agent-package.md` — the package format for the reusable atomic-agent library.

## Changing the design (before or after the build)
- A change is traced before it is proposed: everything wired to the changed items — the sub-workflows that call a
  changed agent, the step that orchestrates them, the application that shows a step's moment, the next step that
  reads a changed entity, the governance rules on a changed agent — and which of those are already built (rework).
- It is then **proposed**, never applied silently: the person sees what is added, changed and removed and what it
  touches, and applies it or keeps the current design. On apply, changed built items go back to pending (rebuild and
  re-verify) and touched built items are re-checked. Items removed from the design stay on the tenant — never delete
  them; the owner retires them.

## Rules when designing or presenting
- Never start at the agent. Write the process (the master workflow, in Full style) first and get it agreed.
- Pick the style from the table at the top, say why, and let the user confirm it. Never force Full onto a dashboard,
  analytics or chat-over-data use case.
- Count honestly: every agent and application in a total is named and scoped in a register.
- No agent writes to a consumer or a customer-facing channel unless the scope says so; read-only first for
  anything commercial.
- A step that must end in a person says so, even at confidence 100.
- An atomic agent is named for its single action ("HS Code Candidate Retriever", "Duplicate Claim Detector"), never
  for an area ("Classification Agent"). A conversational copilot or analyst assistant is a **screen of the application** (UI-nn)
  whose tools are sub-workflows, never an atomic agent.
- Decompose honestly: an agent whose output can be wrong in two independent ways is two agents. Probabilistic and
  deterministic never share an agent. A class D agent exists only where a deterministic action must be in the agent
  registry; otherwise the rule, lookup or calculation is a workflow step (references/unifyapps-implementation.md). There is no quota — the count follows the use case. Every step produces a
  data entity.
