# The blueprint: the architecture as data

Forge stores one blueprint per project, renders it as the architecture page (the table, the cross-cutting callout
and the entity flow) and tracks every item against what was built. Other tools can emit the same JSON.

**Style first.** Every blueprint carries `"style": "full" | "light"` (atomic-agent-architecture "Pick the style
first"). Forge recommends a style from the use-case type, says why, and the user confirms or overrides it (playbook
`references/build-options.md` A5). Forge validates by style:
- **`full`:** everything below applies (the six stage keys, AG items as atomic agents, the Resolution Inbox and
  Evidence Ledger cross-cutting items).
- **`light`:** a smaller contract, set out in "Light-style blueprint" at the end of this file.

A blueprint without `style` is treated as `full`, which is the behaviour before 2026-09-28.

```jsonc
{
  "title": "Amazon Storefront Optimization",
  "subtitle": "Every master-workflow step, read top to bottom, with its sub-workflows, atomic agents, owning application and the data entity it produces.",
  "stages": [ { "key": "setup", "name": "Setup" }, { "key": "read", "name": "Read & ground" } ],
  "crossCutting": [
    { "ids": ["UI-02", "SW-25"], "name": "Resolution Inbox", "text": "catches any output below confidence 100 from any agent, in any row, and routes it to a named person." },
    { "ids": ["UI-15", "SW-26"], "name": "Agent Trust & Evidence Ledger", "text": "records every run in every row — inputs, outputs, prompt, model version." }
  ],
  "notes": ["Agents marked ↺ are shown once but serve a second, closely related step."],
  "steps": [
    { "id": "MW-01", "name": "Cycle setup", "stage": "setup", "loop": null, "orchestrationOnly": true,
      "subWorkflows": [ { "id": "SW-01", "name": "Cycle setup and scope resolution", "agents": [] } ],
      "apps": ["UI-01"], "entity": { "id": "DE-01", "name": "Cycle manifest", "description": "Scope, item set, permitted change classes" },
      "human": "none" },
    { "id": "MW-02", "name": "Read the storefront", "stage": "read",
      "subWorkflows": [ { "id": "SW-02", "name": "Storefront capture", "agents": ["AG-01", "AG-02", "AG-03", "AG-04"] } ],
      "apps": [], "entity": { "id": "DE-02", "name": "Storefront snapshot" } }
  ],
  "agents": [
    { "id": "AG-01", "name": "Store Page Fetcher", "class": "D", "action": "Fetch and render the store URL; store the snapshot and DOM",
      "sharedWith": [], "library": null },
    { "id": "AG-04", "name": "Sponsored Slot Detector", "class": "E", "action": "Identify which placements are paid", "sharedWith": ["SW-08"] }
  ],
  "apps": [ { "id": "UI-01", "name": "Cycle Console", "moment": "Set scope and launch a cycle", "owner": "Amazon Sales Manager", "gestures": "3–5" } ],
  "flow": [ { "name": "Cycle manifest", "text": "Scope, ASIN set, permitted change classes" } ],
  "nextCycle": "precedent written to the ledger lets the same case clear automatically at confidence 100."
}
```

Rules (Forge validates them): ids unique per kind; every agent id listed in a sub-workflow exists in `agents`; every
`apps` lists the **screens** of the use case's one application (UI-nn = a screen in its navigation, `owner` = the
role that uses it) — not separate apps, unless the requirements explicitly ask for more than one application. app id exists in `apps`; every step's stage exists; a shared agent (↺) appears in its home sub-workflow and in the
`sharedWith` sub-workflows. `human` is `none`, `gated` (agentic with a gated decision) or `always` (always ends in a
person).

### Fields added 2026-09-27 (Forge validates them)
```jsonc
{
  "draft": "process",   // the FIRST save only: the process (stages, MW steps, entities, human moments, AC, scenarios) — no agents yet
  "reference": {        // the accepted build this starts from (unifyapps-solution-playbook §1/§1b)
    "type": "Request / case desk", "primary": "<reference build>", "repo": "<reference-repo>",   // case file: unifyapps-solution-playbook/references/builds/<file>.md
    "why": "The verdict rests on the documents; the queue and the workbench are the screens judged first.",
    "donors": { "UI-01": "<donor-repo>/app/src/routes/CommandCentre.tsx", "UI-02": "<reference-repo>/app/src/routes/Workbench.tsx" }
  },
  "acceptance": [       // every SOW acceptance criterion, verbatim
    { "id": "AC-01", "text": "Every request is read by the desk's agents, not by a script.", "items": ["MW-02", "AG-01"],
      "check": "After a master run, every seeded request has its reading row written by AG-01 (kit_verify reconcile)." }
  ],
  "design": { "slug": "enterprise" },   // the design-skills registry slug
  "apps": [ { "id": "UI-02", "name": "Request workbench", "owner": "travel_manager", "route": "Workbench",
              "assistant": { "tools": ["SW-07"], "reads": ["DE-02", "DE-03"] } } ]   // exactly one screen carries the assistant
}
```
- `MW-00` is the master workflow itself (the orchestration over MW-01…): tracked and verified like every item. Full
  style only; a Light blueprint has no MW-00.
- `AC-nn` are tracked items too: verified only with the evidence their `check` names.
- The Resolution Inbox and Evidence Ledger each list a UI-nn and an SW-nn in `ids` (Light: the Evidence Ledger lists
  its UI-nn and the workflow that writes it; the inbox is optional); a step whose `human` is `gated` or
  `always` lists the screen where the person decides.

## Build status per item
Tracked separately from the design so the design can be revised without losing progress:
`{ id, status: planned|building|built|verified|failed|blocked|reused, kind, platformId, url, note, updatedAt }`
where `kind` is `workflow`, `agent`, `object`, `page`, `app`, `graph` or `repo`. `reused` means an existing library
agent was used instead of building a new one.


## Scenarios — how it works end to end (required)
`scenarios` tells how the architecture works, in this use case's own situations: at least the main happy path and an
exception routed through the Resolution Inbox, then the human decisions and edge cases this use case really has. There
is no fixed count — and no fixed number of agents per step either: the design follows the use case (one agent, one
action).

```json
"scenarios": [
  { "id": "SC-01", "name": "A clean claim is paid automatically", "kind": "happy",
    "trigger": "A batch of e-claims arrives from a Tier 1 clinic",
    "path": [ { "id": "MW-05", "what": "The batch is validated and de-duplicated." },
              { "id": "AG-14", "what": "Each line's diagnosis and procedure are checked for coherence." },
              { "id": "DE-07", "what": "The adjudicated line is recorded with its reason code." } ],
    "outcome": "The line is in the weekly payment batch with its remittance advice." }
]
```
- `kind`: `happy` | `exception` | `human` | `edge`. `path`: three or more hops, in order, each a real
  `MW`/`SW`/`AG`/`UI`/`DE`/`GV`/`AC` id with one sentence of what happens there. Forge draws the path over the table.
- Scenario-only edits save without a proposal (they change no built item).

## Light-style blueprint (`"style": "light"`, 2026-09-28)
For dashboards, analytics, command centres, scoring overlays and chat-over-data use cases. Forge validates:
- `stages`: optional. When present, any keys and names in the use case's own words. No fixed six.
- `steps`: the process, one row per step, with `id` (`MW-nn`), `name`, `human` (`none` | `gated` | `always`),
  `apps` and `entity`. `stage` only when stages are used. `subWorkflows` optional: a step may name the workflow that
  implements it in its own `workflow` field (the workflow's name).
- `agents`: optional. List an AG only for a real AI Agent (one that needs tools or must sit in the registry). An LLM
  step inside a workflow is not an AG. Every listed AG follows the Full rules (one action, class, envelope).
- `crossCutting`:
  - the **Evidence Ledger** is required when any step makes an AI call;
  - the **Resolution Inbox** is optional: a step with an AI reading below the bar lists the screen where a person
    reviews it.
- Still required, and still validated as in Full: `reference` with its donors, `acceptance` (AC-nn), `scenarios`
  (happy + exception + human decision), `design`, `apps` (screens of the one application; exactly one carries the
  assistant), and build status per item.
- Not used: precedent, cycle manifest, idempotency keys (unless the use case runs in cycles), min-confidence
  propagation.
- `draft: "process"` on the first save applies to both styles: the process is agreed before anything is built.

Switching style after items are built is a design change: it is proposed, shows what it touches, and leaves built
items on the tenant (atomic-agent-architecture "Changing the design").

