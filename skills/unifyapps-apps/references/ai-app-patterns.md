# Building an AI-native UnifyApps app — the patterns that carry across projects

Captured while building a **government-performance executive-intelligence app** (orbit.uat,
2026-09-22; case file `unifyapps-solution-playbook/references/builds/sharek.md`) on top of what
was learned from an earlier Oracle EBS assistant and Platform X. Everything here is re-usable:
none of it is specific to that domain, and the drop-in sources live in `assets/`.

The through-line: **an app built on UnifyApps should not look like a dashboard that happens to
have a chatbot bolted on.** The platform gives you three things a normal front end does not —
a governed object store, callable automations, and agents that can read and write through
them. An app that uses all three feels categorically different from one that uses only the
first.

---

## 1. Kill the "illustrative" disclaimer; show lineage instead

A demo built on mock JSON has to apologise for its numbers. One built on Data Objects does
not — so stop apologising and start citing.

Replace every "ILLUSTRATIVE" badge with a **lineage chip**: the object name and the number of
records the block is holding.

```tsx
<Lineage object="uc_entity" count={12} />     // uc_entity · 12
<Lineage objects={['uc_region', 'uc_service_center']} />
```

Why it is better than a disclaimer:

- it is **checkable** — a Control Room page lists the same objects with the same counts, and
  applying a demo scenario moves both at once;
- it teaches the viewer the platform's model without a slide;
- it puts the honest caveat where it belongs: on the handful of figures that really are
  third-party (`<VerifiedSource />` for those, with the date they were observed).

Keep exactly one standing note in the footer for the legal framing. Do not repeat it per block.

Source: `assets/ai-insights/` uses it; the chips themselves are ~30 lines, in the
government-performance build's `kit.tsx` (repo in case file `…/builds/sharek.md`).

---

## 2. The AI insight band — every screen, not one "AI page"

The single highest-value pattern. Each screen hands the records it is showing to an LLM
automation, and gets back two to four ranked findings, each with evidence and **exactly one
executable action**.

### The automation (`<uc>_ai_insights`)

Three nodes. Input `p_screen`, `p_context`, `p_actions`, `p_data`; output the raw model reply.

| Node | Contract |
|---|---|
| `n_in` | START `callables_from_automation`, `inputs.setup` with the four string params |
| `n_llm` | type **`CALL_INTERFACE_WORKFLOW`**, `context {appName:'conv_ai_by_unifyapps', resourceName:'conv_ai_by_unifyapps_call_llm_model_with_options', resourceVersion:2471}`, `inputs {callableInterfaceId:'__ua__call_ai_agent_llm_model', parameters:{modelId, systemPrompt, message, temperature, maxTokens, responseFormat}}` |
| `n_out` | STOP, `result {insights:'{{ n_llm.outputs.llmResponse }}', success:'{{ n_llm.outputs.success }}', tokensUsed:'{{ n_llm.outputs.tokensUsed }}'}` |

- `message` is the chat array: `[{role:'user', content:[{type:'text', text:'SCREEN: {{ n_in.outputs.p_screen }} …'}]}]`.
- `responseFormat: {type:'json_object'}`, `temperature: 0.2`, **`maxTokens: 1600`**.
- **`modelId`: a fast model — `e_ai_agent_openai_gpt_4.1_mini` on orbit.uat.** Not the Sonnet id
  this section used to name (`e_69b9900c5739ad5159baa133`, Vertex Sonnet 4.6): 8 of the 9 insight
  workflows on UAT copied it and every screen waited ~30 s (API-SPEC §56). On another tenant,
  list `ai_agent_llm_model` and time one call before choosing.
- Measured, same prompt, 8–14k chars of records in: **Sonnet 4.6 29–33 s; GPT-4.1 mini 3.9–6.5 s**
  with input capped at 8k chars and two or three findings — figures still correct (spec §25 latency note, §56;
  measured on a golden-record build's insights workflow, case file `…/builds/mars-pedigree.md`).

### 🔴 Latency budget — every insight surface, every build *(rule, Maher 2026-09-25)*

A screen's insights are a summarising job over records already on the screen; they do not need the
largest model. Hold every build to this:

| Lever | Setting | Why |
|---|---|---|
| Model | a fast one (GPT-4.1 mini on UAT); the large model stays in the open-ended chat | swapping the model alone took a screen from ~30 s to ~5 s (spec §25, §56) |
| Input | ≤ 30 rows per dataset, ≤ 8,000 chars total (`MAX_ROWS_PER_SET`, `MAX_PAYLOAD_CHARS` in the hook) | 14k chars made every screen wait (golden-record build, 2026-09-25) |
| Output | two or three findings, two short sentences each, `maxTokens` 1,600 | output tokens are the slow ones |
| Thinking | no thinking model for insights; if one is unavoidable, `disableThought` where the node offers it | thinking spends seconds per call (§20) |
| Repeat visits | the hook's cache (keyed on the rows) replays a report instantly | a revisit must never wait |
| Order | request insights as soon as the screen's rows arrive, never after other slow calls | no serial waits |
| Visible wait | the live loading state (design pipeline rule 12a), never a blank or frozen panel | the wait that remains must read as work |

**Target: a first report in under ~8 s; a revisit instant.** Measure it on the builder preview (and on the
published URL when the user asked for published testing): read the workflow's run times
(`WORKFLOW_EXECUTION` aggregation, `EXECUTION_TIME`) or time the data-source call. Put the number per
screen in the test report. Over budget is a
defect, fixed before the demo, not a known issue.

When a build clones an existing `*_ai_insights` workflow, **re-set `modelId` and `maxTokens`** in
the clone's patch — cloning is how the slow model spread. **And re-write the prompt:** on UAT a
Qatari trading-house build's insights workflow was found running a procurement build's prompt
word for word — naming the Egyptian procurement customer and "all money is EGP millions" —
because the clone's patch never replaced it.

**🔴 A fast model must never count (rule, 2026-09-25).** With the model swapped, a university
build's Retention screen came back in 5 s but GPT-4.1 mini *miscounted the rows it was given*: of the 30 records
sent, it said 26 were critical (30 were), 26 "asked about withdrawal" (24), 15 "aid verification
outstanding" (12), and charted the wrong counts. Sonnet slipped too, less often. Every insight
prompt ends with this block, verbatim:

> NUMBERS (hard rule): quote only figures that appear in the data exactly as given. Never count
> rows, add, average or derive a new figure yourself, in the text or in a chart. If a count matters
> and the data does not state it, name the records instead of counting them. A chart may only plot
> values present in the data.

Re-run on the identical payload: every figure was a value present in the data (scores, office
counts, the signals-by-office series) and it still answered in 5.2 / 6.1 s. If a screen's story
needs a count, compute it where it is exact (a workflow `count_records` / SQL-on-list, or the
screen's own totals) and send it in `p_data` as a field — the same principle as §21 "every
aggregate on the screen needs an owner".

**Measuring it on a code app without the published login:** open the Orbit preview
`https://<tenant>/agent-api/preview/b/<appId>/main/` in the signed-in tab, clear the
`*-insight:` localStorage keys, reload (or press the panel's Regenerate), then read
`performance.getEntriesByType('resource')` for `/api/workflow/execute/node` — the insights call is
the multi-second one; confirm it with the response's data-source `id`. Config apps:
`/p/0/interfaces/<slug>/preview/<page>` (raise `performance.setResourceTimingBufferSize` first — the
Orbit shell fills the default 250 entries). Measured 2026-09-25 across eight apps: **16.5–35.9 s →
3.6–5.5 s** (API-SPEC §56.6).

### The system prompt — the rules that make it trustworthy

Non-negotiables, in the prompt itself:

1. Use ONLY facts present in the data; quote real codes and numbers; never invent a record.
2. Prefer what is **moving, concentrated, breaching or unanswered** over what is merely low.
3. Compare — a figure with nothing to compare it to is not an insight.
4. Say the so-what. "X is 76.2%" is a reading; "X is 7.6 below national and the gap has widened
   three months running, which makes it the largest single driver of complaints" is an insight.
5. Exactly one action per insight, chosen from the ACTIONS list **by id**, with `params` filled
   only from the names that action declares.
6. Domain guardrails (for a government-performance build: never an employment decision about a person; never claim an
   action was performed; never promise a date the data does not support).

Then the output schema, and "return between 2 and 4, most important first".

**State the customer's business in one line, in EVERY prompt** (agent instructions, insight and writer
system prompts, and the app-side task instructions), taken from the customer's own website, plus what it
must never be called. ❌ 2026-09-25 (a supplier-risk build): prompts gave the customer's name but never what
the customer is, and the sales rep had to correct "retirement" to "superannuation". ✅ "<Customer> (<full
legal name>) is an Australian profit-to-member superannuation fund. Always call it <Customer> and describe it
as a superannuation fund, never as a retirement company or a retirement fund." Also sweep records for wording that
frames the customer the wrong way (a critical operation described as "Retirement ... payments" was reworded
to super benefit language).

### Charts inside the insight cards

Let the model attach an optional `chart` object — same shape as the `ua-chart` spec. Rule text
that works:

> Add a chart ONLY when the point IS a shape — a series over months, a ranking across four or
> more items, or a split of a whole. A chart of two numbers, or of numbers already in your
> sentence, adds nothing. At most two insights carry one.

Parse it through the **same** `parseChartSpec` the chat blocks use, so a malformed chart is
dropped rather than half-drawn, and an in-card chart looks identical to one on a dashboard.
Render it `dense` (no type switcher, no summary row) — the controls otherwise take as much
room as the plot, and expanding restores them.

### The hook and the panel

`assets/ai-insights/use-live-insights.ts` + `InsightPanel.tsx`. What they add on top of a
plain fetch, all of it earned the hard way:

- **Payload capping** — 30 rows per set, 8 K chars total, largest set shrinks first (was 40 /
  14 K; cut on 2026-09-25 because the larger input made every screen wait).
- **Truncation salvage** — a reply cut off mid-string still yields every insight that closed
  before the cut, so a long answer degrades instead of vanishing.
- **Action whitelisting** — an action id the screen did not offer is dropped, so the model
  cannot render a button that does nothing.
- **A cache keyed on a hash of (screen, language, rows), kept for hours** (6 h in the reference build; the key
  already changes when the rows do, so a long TTL cannot go stale) — a revisit is instant, and a
  scenario change invalidates it automatically. The cache is per browser: warm it on the
  presenter's machine before a demo.
- **A cached report is re-parsed before replay**, so a bad one cannot stick.
- **An analysing state that names the datasets and steps through the reasoning** — a blank panel
  reads as broken; "reading … comparing … ranking … binding" reads as work. It covers the few
  seconds a fast model takes; it is not a licence for a 30-second one.

### Wiring an action

```tsx
<InsightPanel
  screen="Government Entity Performance"
  context="…what changes the reading: the period, the current selection…"
  datasets={{ entities: rows.map(compactRow), health_trends: … }}
  actions={[
    { id: 'select_entity', kind: 'select',   label: 'Open this entity',  params: ['entity_code'] },
    { id: 'open_map',      kind: 'navigate', to: '/qatar-map',           label: 'See it on the map', params: ['region_code'] },
    { id: 'record_insight',kind: 'record',   label: 'Record this finding', params: ['title'] },
  ]}
  onSelect={(a) => setSelected(String(a.params.entity_code ?? ''))}
/>
```

`ASK_AGENT` is appended automatically. A `record` action deliberately routes **through the
agent** rather than writing directly: the write then goes through the agent's approval card and
lands with the evidence attached.

---

## 3. The embedded agent — a dock, not a page

`assets/agent-dock/`. A zustand store, a same-origin frame, and a button in the header.

```ts
const ask = useAskAgent()
ask('Why did satisfaction fall in Al Rayyan?')   // opens the dock and sends
```

Rules that matter:

- **Mount it once, in the shell.** A question asked on the map must not navigate away from the
  map, and the conversation has to survive moving between screens. Keep it mounted after the
  first open (`started`) even while hidden.
- **`nonce` on the question**, or clicking the same insight twice looks broken.
- **Opening the dock sends nothing.** An agent that starts talking because you opened a panel is
  answering a question nobody asked. Say what it can see in the header, and offer starter chips
  that send only on click.
- **Never put a tool name, an id or JSON in a user-voice message.** Tool routing belongs in the
  agent's instructions. (Owner feedback, 2026-09-21 — a message reading "Look it up with
  scc_deal_lookup (detail=true)" was rejected outright.)
- The full-size version of the same copilot goes on a Decision Centre page, with an agent
  switcher and per-agent starter questions.

Copilot island build: see `code-apps.md` — the SDK copilot cannot be compiled by the cloud
builder, so it is built locally (`bun run build:island`) into `app/public/copilot-island/`
(~28 MB, ~2,050 files) and committed, with `.gitattributes` marking it `-text -diff
linguist-generated` and `.oxlintrc.json` ignoring it.

⚠️ **Do not load the island by URL — write it into the frame.** On the deployed tensor host,
every request whose path ends in `.html` is answered with the application's own shell (the SPA
fallback), so framing the island by URL loads the app inside itself and no chat ever appears.
Renaming the file does not help; the rewrite is on the extension. Sibling assets under the same
folder (`/copilot-island/assets/*.js`) are served correctly, which is what makes this look like
a build failure rather than a routing one. It works on the dev server either way, so it only
shows up after the first deploy. Check the dock on the published URL when the user asked for published testing;
otherwise list it in the report as "not checked on the published URL" (playbook `build-options.md` §2b).

The fix, both halves of which matter:

1. The island build also emits the document under an extension tensor will serve:
   ```json
   "build:island": "vite build -c vite.island.config.ts && node -e \"require('fs').copyFileSync('public/copilot-island/index.html','public/copilot-island/agent-page.txt')\""
   ```
2. The host fetches that text and **writes it into an about:blank frame** with
   `document.open()/write()/close()`. Do **not** use `srcdoc`: a srcdoc document gets an
   **opaque origin** (`origin === "null"`), which costs the frame the platform session, the
   `/api` cookies and the `postMessage` origin check all at once — the chat then fails in a way
   that looks like an auth bug. An about:blank frame created by same-origin script inherits the
   parent origin, so everything that worked when the island loaded by URL still works.

   Rewrite every `./assets/…` to an absolute URL on the way in. The written document's own URL
   is `about:blank`, and a module script resolves its specifier against that — a `<base>` tag is
   not enough for modules, and the failure is silent (the root simply stays empty).

Working implementation: `assets/agent-dock/copilot-host.tsx`.

⚠️ **Never ride the first question on `init.initialPrompt`** ✅ 2026-09-23. On the deployed tensor
host a question clicked while the island was still loading (the very first ask from a KPI or an
insight) was handed over as `initialPrompt`; the island's auto-send fired before the SDK had opened
its chat session and the message was silently dropped — the dock opened on its empty state. The
second click worked. Fix (in the asset): keep `initialPrompt` for explicit prompts only, and post
every question with `ua-copilot:send` after `ua-copilot:ready`, holding the first one ~2.5 s after
ready — **and verify delivery**: a fixed delay alone still lost the first message on a cold load,
because the SDK re-renders its composer when the chat session opens and wipes inserted text. The
host (same origin) counts `[data-message-type="user"]` in the frame and re-posts every 3.5 s until
the new user turn appears (max 5). Verified: one click → exactly one user turn → agent runs. Test
the *first* click after a fresh page load on the builder preview (and on the published URL when the user asked for
published testing), not just the dev server.

---

## 4. One chart component for the whole app — MANDATORY

> 🔴 **Never hand-roll charts.** On a trading-house build (2026-09-23) I wrote a fresh recharts wrapper because
> it was the obvious thing to reach for, and shipped an app whose dashboards and whose agent
> answers drew charts two different ways — the agent's ```` ```ua-chart ```` blocks rendering as raw
> JSON, none of it drillable. Maher: "my skills need to be updated to always have the new charts
> module we created and always connected and used by the Agents". `assets/ua-chart/` is the house
> chart. Copy it in, wire it, and use it for **every** chart in the app. There is no case where a
> bespoke chart wrapper is the right call.

Copy `ChartBlock.tsx`, `spec.ts`, `chart.css` and `export.ts` into `src/components/charts/`, and
`mount.tsx` into the copilot island. Originally the agent's chat block; it is the app's house
chart so a chart in an answer and a chart on a dashboard are the same object.

```tsx
setChartPalette(CHART_PALETTE)            // once, before first render
<ChartBlock spec={spec} lang={lang} />                       // dashboard: read-only
<ChartBlock spec={spec} lang={lang} onDrill={ask} />         // chat: click to ask
<ChartBlock spec={spec} lang={lang} dense height={172} />    // inside a card
```

- `onDrill` optional — omitted means the click handler is inert and the "click to ask" hint is
  dropped. A hint pointing at an agent that is not there is worse than no hint.
- `eyebrow` overrides or (with `null`) hides the "Live chart" label.
- `dense` for embedded use; `setChartPalette` because a `<canvas>` cannot read a CSS variable.

**`setChartPalette` takes RESOLVED COLOURS.** Handing it the app's `CHART_COLORS` is the obvious
move and it is wrong when those are `['var(--chart-1)', …]`: `addColorStop` throws
`'var(--chart-1)' could not be parsed as a color`, every chart in the app dies behind an error
boundary, and the *next* render fails with the far more confusing `Canvas is already in use`
because the throw left Chart.js holding the canvas. Resolve the ramp first and keep a literal
fallback:

```ts
const FALLBACK_RAMP = ['#004E8D', '#C8A24A', '#008AD3', '#2F7F78', '#8A1538', '#6B7FA8']
function resolvedRamp() {
  if (typeof window === 'undefined') return FALLBACK_RAMP
  const style = getComputedStyle(document.documentElement)
  return CHART_COLORS.map((token, i) => {
    const name = /^var\((--[^)]+)\)$/.exec(token)?.[1]
    const value = name ? style.getPropertyValue(name).trim() : token
    // withAlpha() parses hex; a theme on oklch, or an unresolved token, falls back rather than
    // producing a silently colourless chart
    return /^#[0-9a-f]{6}$/i.test(value) ? value : FALLBACK_RAMP[i % FALLBACK_RAMP.length]
  })
}
setChartPalette(resolvedRamp())
```

And in `ChartBlock`, destroy by canvas rather than by ref — `Chart.getChart(canvas)?.destroy()`
before `new Chart(...)` — so one bad render cannot poison every later one.
- Built in: type switch, sort, top-N, table view, PNG/XLSX/CSV/print export, EN+AR copy, RTL.
- Agents emit ```` ```ua-chart ```` fenced JSON; `mount.tsx` swaps it for the component with a
  MutationObserver (streaming-safe, idempotent).

**Both halves are required, and the second is the one that gets forgotten:**

1. `mountCharts({lang, onDrill})` called from the island's `mount()`, so the agent's chart blocks
   become real charts in the chat instead of a wall of JSON.
2. **The agent instructed to emit them.** A chart module wired into an island whose agent was
   never told the fence exists renders nothing. Put this in every analyst agent's instructions:

   > When a number is better seen than read — a trend over months, a split across divisions, a
   > ranking — emit a chart block as well as the sentence:
   > ```ua-chart
   > {"kind":"chart","type":"bar","title":"…","subtitle":"…",
   >  "labels":["…"],"series":[{"name":"…","data":[…]}],"unit":"QAR","source":"<object · filter>",
   >  "insight":"one sentence on what the shape means"}
   > ```
   > `"kind"` is always the word `chart`, in every block. The shape goes in `"type"`, one of
   > `bar`, `hbar`, `line`, `area`, `doughnut`, `pie`, `stacked` (hbar for long labels). A second
   > chart is a second complete block with `"kind":"chart"` again, e.g.
   > `{"kind":"chart","type":"hbar","title":"…","labels":[…],"series":[…]}`.
   > Use the real figures you just read, cite the object in `source`, and keep the prose answer —
   > the chart is in addition to the answer, never instead of it.

**One chart drawn, the others missing (AP Exception Desk, 2026-09-27).** Asked for "detailed
reports with chart", the assistant wrote four blocks: the first `{"kind":"chart","type":"bar"}`,
the other three `{"kind":"hbar","type":"hbar"}` and `{"kind":"bar"}` — it had been shown the
contract as `"type":"bar|hbar|line|…"` and treated `kind` and `type` as the same field. The parser
returned `null` for any `kind` other than `chart`, so three complete, drawable charts were dropped
and the reader saw one. Both halves are fixed and both are required:

- **The renderer is tolerant** (`assets/ua-chart/spec.ts`, since 2026-09-27): a `kind` that names
  a chart shape is a chart of that shape; `type` missing falls back to it; only a `kind` naming
  something else (a table, a card) is refused. `mount.tsx` finds an unlabelled block by its shape
  (`labels` and `series`), not only by `"kind":"chart"`. A chart module copied before that date
  carries the strict check — copy the asset again, never patch an old copy by hand.
- **The contract is shown by example, never as `a|b|c`.** A pipe list inside a JSON example is
  read as a value to choose from for whichever field comes to mind. Give one whole block per shape
  you expect, and say in words that `kind` never changes.
- **Test it with the question that broke it**: a golden case asking for a report with several
  charts, judged on every block in the answer being drawn, not on the first.

---

## 5. The demo scenario engine — one automation, exact reset

What makes a demo feel like a product: the presenter changes the world and every screen
follows, then puts it back exactly.

**Schema.** Every object that a scenario can move carries `baseline_json` (a JSON blob of its
fields as loaded). Time-series rows carry `baseline_value` and `baseline_delta` instead,
because a snapshot is a single number. Populate both **at load time**, in the same write as the
value, or they drift the first time you test a scenario.

⚠️ **The baseline must capture every field a scenario can set, including the prose.** A baseline
of numbers only is the commonest version of this bug and the hardest to spot: the reset puts
`response_ratio` back to 2.4 and leaves the recovery scenario's paragraph — "response time is
back to 1.3x" — sitting directly above it. Nothing errors, the numbers are all correct, and the
screen contradicts itself in the one place a reader is most likely to quote. Derive the list
mechanically rather than by memory: walk every scenario payload, collect each key it sets, and
assert that every one appears in the baseline.

**A scenario record** (`<uc>_scenario`) holds `payload_json`:

```json
{ "entity":   [{"code":"LABOUR", "satisfaction":-3.4, "sentiment":-16,
                "narrative_en":"A seventh consecutive week of negative sentiment…"}],
  "region":   [{"code":"RAYYAN", "response_ratio":-1.1, "risk_score":-29}],
  "category": [...], "topic": [...],
  "national": {"satisfaction":-0.9, "public_sentiment":-6},
  "insight":  [{"kind":"RISK","severity":"CRITICAL","title_en":"…","body_en":"…"}] }
```

Numbers are **deltas**; strings are **replacements** (the narrative that matches the new
numbers — a recovery scenario that leaves "2.4x the national average" under a 1.3x figure reads
as a bug). `{"reset": true}` is the restore scenario.

**The automation** (one linear graph, no loops):

```
n_in → fetch scenario → fetch all scenarios → fetch each object → fetch current-period KPIs
     → n_calc (Groovy: compute every update) 
     → bulk_upsert ×5  → delete_records (agent insights) → bulk_create (new insights)
     → bulk_upsert (scenario flags) → n_out
```

- `storage_by_unifyapps_bulk_upsert_records_by_id` (v16331) takes
  `updates:[{id, updateFields:[{fieldName, actionType:'SET', setValue}]}]`. **`setValue` is
  declared a string but accepts a real number and stores it as one** — verified; the field stays
  `typeof 'number'` after the write.
  🔴 **Get that shape wrong and the platform says nothing.** An `updates` array of
  `{id, properties:{…}}` — the shape `POST /api/entity/update` takes, and the natural guess —
  returns **HTTP 200 and writes zero records** (a document-fraud build, 2026-09-23: a rescore reported
  `rescored: 165` and changed nothing). The count a Groovy step returns is the count it *built*,
  never the count that landed. **Read one record back after the first batch.**
- `bulk_create_records` (v16415) with `useRawPayload:true` and `rawPayload` = an array.
- 🚫 **No-delete rule (added 2026-09-23):** the `delete_records` step below is how an early
  procurement build's reset was built *before* the rule. New builds must not use a delete node: give agent rows
  an `active` flag, set it `false` on reset, and filter on it. Keep the sort-order split; drop the delete.
- **Deleting only agent-written rows without a NOT_EQUAL filter (historical):** give seeded rows
  `sort_order < 100` and agent rows `sort_order = 100`, then `delete_records` with
  `EQUAL 100`. Pass the value from Groovy (`'100'` on reset, `'-1'` otherwise) so the same node
  is a no-op when not resetting — no branching needed.
- **Keep the scope's own trend row in step — by SETTING it, not by adding to it.** Record the
  new value of each `(scope, code, field)` that moved and write that value into the matching
  current-period snapshot row. Setting is both simpler and strictly stronger than applying the
  delta twice: the last point of every trend is *by construction* the number printed beside it,
  however many levers get pulled. (Storing the new value in that map and then *adding* it to the
  row is a real bug that shipped here — it took a municipality to 150% satisfaction, because
  76.2 + 81.6 looks like arithmetic rather than a mistake.)
- **Clamp in the automation, not in the UI.** A percentage cannot exceed 100 however many
  scenarios are applied in a row. One `clampMetric(metric, value)` helper in the Groovy step,
  applied to both the record write and the snapshot write, is the only place that can hold the
  line — the UI sees the number far too late.
- The app calls it through one data source and then `queryClient.invalidateQueries()` — every
  screen reads through the same FETCH binding, so one invalidation refreshes the whole app,
  insight panels included.

Verified round trip: apply → every screen moves → reset → **byte-identical** values restored,
active flags cleared, agent insights deleted.

---

## 6. Agents: three narrow ones beat one broad one

The government-performance build ships an **Executive Analyst** (answers what is asked), an **Issue Detector** (goes
looking for what nobody asked about) and a **Communications Advisor** (decides what to say in
public). They share the same three tools.

The reason is not capability, it is failure mode: an answering agent that volunteers
communications advice is the one that gets a government tenant into trouble. Different
mandates want different instructions about what to *refuse*.

**Tool design that works:** one generic `QueryData` over a `<app>_query` automation rather than
one tool per object. Name the objects and their fields in the agent's instructions instead — the
model picks correctly, and adding an object costs nothing. Add `RecordInsight` / `CreateAction`
(with `approvalConfig.enabled: true`) for the write.

### The query tool's SHAPE is what decides whether the agent stalls ⛔ → ✅ 2026-09-23

An agent that "hangs", loops, or answers without an answer is almost never the model. It is the
tool giving it no way to ask the question. Two defects did this on a procurement build, and both are
inherited by anything cloned from the earlier government-performance / supplier-risk query workflow. **Fix them in the clone, before
the first agent conversation.**

**1. One filter pair is not enough — give it three, ANDed.** `object_type` plus a single
`filter_field` / `filter_value` cannot express *"the GROUP series for spend_egp"*, which needs
scope **and** scope_code **and** metric. Asked for a 24-month trend, the agent called the tool
five times with different single filters, found the wrong rows each time, and ended the turn with
no answer at all. Take `filter_field2/filter_value2` and `filter_field3/filter_value3` in the
START schema, AND the leaves together, and while you are in there make the pre-processor generous:

```groovy
// a comma-separated value becomes an IN list; "true"/"false" filter a boolean;
// a caller that sends "properties.risk_band" gets the prefix stripped rather than a silent no-op
if (v.contains(',')) { leaves << [property:'properties.'+f, filter:[operator:'IN', value: v.split(',').collect{it.trim()}]] }
else if (v.equalsIgnoreCase('true') || v.equalsIgnoreCase('false')) { ... EQUAL, v.equalsIgnoreCase('true') }
else { ... EQUAL, v }
```

A silently-ignored `sort_field` is the same class of bug: the pre-processor prefixes
`properties.`, so a caller that helpfully sends `properties.spend_ytd_egp` gets
`properties.properties.spend_ytd_egp`, no sort, no error, and a "top ten" that is not sorted.

**2. Compact by SHAPE, never by a whitelist of field names.** The cloned post-processor carried a
`keyFields` list from the app it came from. Any result over fifteen rows was filtered through it,
so on a new domain it kept almost nothing: an unfiltered read of a 5,424-row KPI object returned
**sixty empty objects** — `[{}, {}, {} …]` — with `compacted: true`, no error and nothing to
explain it. A whitelist cannot survive a change of domain; "is this a long string" can:

```groovy
def isProse = { String k, v -> k.endsWith('_json') ||
  ((v instanceof String || v instanceof GString) && v.toString().length() > 140) }
```

Drop prose, keep every number, code, date and flag, and return a `note` naming the dropped fields
so the model can ask again with `fields=` instead of guessing. Verify it the cheap way — call the
tool for each object the agent can reach and assert `Object.keys(rows[0]).length` is what you
expect. Sixty empty objects is indistinguishable from sixty real ones in a latency measurement.

**3. Then TELL the agent the contract.** The tool being capable is half of it; the instructions
carry a worked example of the hardest call it will make, and an explicit stopping rule:

> A TIME SERIES from `<app>_kpi` always needs all three pairs: scope, scope_code and metric. The
> 24-month group spend series is `filter_field=scope, filter_value=GROUP, filter_field2=scope_code,
> filter_value2=<GROUP_CODE>, filter_field3=metric, filter_value3=spend_egp, sort_field=period,
> sort_order=ASC`. …
>
> WHEN A CALL DOES NOT ANSWER THE QUESTION — re-read the arguments before you re-call. Two calls
> that returned the wrong rows means the FILTER was wrong, not the tool. Never make a third call
> that is another guess at the same thing: say what you found, name what is missing, and ask the
> one question that would let you finish. An answer with a gap in it is worth more than a silence.

Measured on the same six questions before and after, driving the real dock: before, the trend
question made five tool calls and produced nothing; after, **every question answered in 24–49 s
with a chart, and none stalled.** Also give the agent `object_total` alongside `returned` and tell
it to say which one it is quoting — otherwise it reports the page size as the register.

### Test the agent by driving the dock, not by calling the workflow

A workflow smoke test proves the tool; it does not prove the agent. Drive the real composer —
`.ProseMirror` + `insertText` + `button[aria-label="Send message"]` — and, for each question,
record: time to a settled answer, the number of tool calls, the answer length, whether any chart
mounted (`canvas` count) and whether a raw ` ```ua-chart ` block was left unmounted. Two traps in
the harness itself: wait for the answer to stop growing **and** for no `Executing tool` / `Thinking`
marker in the tail before sending the next question — send too early and the SDK drops the
previous answer, which looks exactly like a stall you caused; and count `[data-message-type="user"]`
to prove exactly one turn was created per click.

Put the chart-block rule and the grounding rules in the agent instructions verbatim; they are
the same rules the insight engine gets.

---

## 7. Maps: project at build time, not at render time

> 🔴 **Do not hand-trace a coastline. Ever.** On a trading-house build (2026-09-23) this section
> already said "use the real boundaries" and I wrote a 32-point hand-traced Qatar outline anyway,
> because it was quicker and looked approximately right in the code. On screen it read as a blue
> blob with dots on it. Maher's words: "qatar map is so bad". The real file was already in the
> repo next door — the government-performance build's `tools/qat_adm1.json`, 8 municipalities,
> 86 KB (repo in case file `…/builds/sharek.md`) — and porting it took ten minutes. **Check whether the real geometry already exists in another build
> before you draw anything.**

If the app shows a country or a region, use the real boundaries. `geoBoundaries` publishes
ADM1/ADM2 per country under CC BY 4.0 — but the files are **Git LFS pointers** on the normal
raw URL; fetch them from `media.githubusercontent.com/media/…` instead.

Project once in a build script (`tools/build-map.py`) and emit a TS module of plain SVG path
strings plus a `projectLonLat()` that uses the *same* projection, so geo-located points land
inside the right polygon. Also emit each shape's `bbox`, which is what a zoom-to-region
animates to — and animate a `<g transform>`, not the `viewBox`, because CSS does not transition
an attribute.

Two sizing traps: a tall country in a wide card wastes half its width on sea (match the card's
aspect to the bbox), and label font sizes are in viewBox units — 26 units on a 2047-unit canvas
rendered at 560 px is 7 px on screen.

---

## 8. The order that avoids rework

1. Create a **new** app over the API (code mode, **minimal starter brief**, never the builder
   agent for the real build) and link Git over the API — SKILL.md "Maher's code-app methodology".
2. Create the objects, then load records **with their baselines in the same write** (12 parallel
   `POST /api/entity` workers: 3,397 records, zero failures, under a minute — 2026-09-23).
3. Create the five storage data sources, write their ids into `bindings.ts`.
4. Build and deploy the automations; smoke-test each with `initiate-test` and assert on `n_out`.
5. Create a data source per automation.

> **Shortcut for steps 2–5 (✅ orbit.uat, 2026-09-23): clone an earlier build's assets.** Read
> its workflow / `e_data_source` / `ai_agent`, change the names, prompt, `object_type`,
> `interfaceId`/`interfacePageId`/`automationId`, and POST it back — a supplier-risk build's
> platform layer (6 objects, 3,397 records, 4 workflows, 9 data sources, 1 agent) took ~10
> minutes. One generic **AI writer** clone (`p_screen`, `p_context` with the exact JSON shape,
> `p_actions`, `p_data`) covers every narrative task. Source ids and recipe: `code-apps.md` and
> case file `unifyapps-solution-playbook/references/builds/rest-supplier.md`.
6. **Publish the app** (`versionTag: "v0-scaffold"` is fine — ✅ 2026-09-23 it made storage and
   callable data sources execute immediately). See the gotcha below — data sources are invisible until you do.
7. Build the UI. Re-publish whenever you add a data source.

### The two that will cost you an hour each

- **A data source created after the app was published is invisible to the running app**:
  `500 forbidden datasource: not found`, even though the entity exists and the ids match.
  Publishing again fixes it immediately. Storage bindings created before the first publish work,
  which makes this look like a callable-specific bug — it is not.
- **The SDK 401s on every call until the interface has been published once**
  (`GET /auth/interface/deployed` → 404). Publish the scaffold before you expect any data.

### Groovy sandbox

- `Date.format(String)` is a Groovy JDK extension and is **not loaded**. Use **`java.time`**, which later runs
  verified (UAT 2026-09-21, 09-26, 09-27; API-SPEC §47.29, §47.50), e.g.
  `java.time.LocalDate.now(java.time.ZoneOffset.UTC).toString()`. An earlier note that `java.time` was blocked
  came from an empty error, and mutating a map while iterating it (next bullet) produces exactly that.
  `new java.sql.Date(System.currentTimeMillis()).toString()` for `yyyy-MM-dd` also works.
- **Never mutate a map while iterating it** — `ConcurrentModificationException` surfaces as an
  error object with no message at all. Build the map by adding, not by removing.
- An optional parameter whose template resolved to nothing **has no binding**, and reading it as
  a bare variable throws `No such property`. Start every script with:
  ```groovy
  def p = { String k -> binding.hasVariable(k) ? binding.getVariable(k) : null }
  ```
- `groovy.json.JsonSlurper` **is** available.
- `storage_by_unifyapps_fetch_records` output is `{{ n.outputs.objects }}` — not nested under
  `response`. Its count is `{{ n.outputs.total }}` — **not** `totalCount`, which resolves to nothing
  (a university build, 2026-09-24; the cloned `*_query` post-processors carried this bug).
- **`[:] as Set` is immutable** — the first `.add()` throws `UnsupportedOperationException`, reported as
  `{errorCode:-1}` with no message, and only on the path that adds. Use `new HashSet()`.
- **To see an error the node will not print**, re-run the definition through `initiate-test` with the script
  wrapped in `try { … } catch (Throwable e) { return [err: e.toString(), at: e.getStackTrace().findAll { it.toString().contains('Script') }.take(6).collect { it.toString() }] }`
  and the STOP returning `err`/`at`; the stack names the script line. (API-SPEC §40.2)
- **Load volume through a bulk-create workflow, not thousands of `POST /api/entity` calls.** Parallel single
  creates froze the (hidden) browser pane three times; START → JsonSlurper → `bulk_create_records` run via
  `initiate-test` at 1,000–1,500 rows per call loaded 25,389 rows in seven calls. (API-SPEC §40.5)

### The test runner

`initiate-test` cancels the run when its own HTTP call times out (~23 s), so an LLM step shows
as `CANCELLED` even though the node fired. Verify anything slow by calling the **deployed**
workflow through its data source instead.

---

## 9. Scale: what changes when the data layer has thousands of rows, not hundreds

Everything above works at 600 records. At 8,000 the failure mode changes: the storage node stops
raising errors and starts returning **plausible wrong answers**. Nothing on the screen looks
broken, so nothing gets investigated.

**Name the metrics a screen plots.** A KPI object holding 24 months × every scope × every metric
is five thousand rows. A page-limit read of 600 renders a chart that is missing half its
entities and looks completely normal. Filter server-side — `IN` on `properties.metric`, with the
list the screen actually charts — and the same read returns 300 rows.

```ts
// not useScopeSeries('ENTITY')
useScopeSeries('ENTITY', ['health_score', 'satisfaction', 'sentiment', 'resolution'])
```

**Count with `total`, never `records.length`.** The read returns both. On a "what the data layer
contains" screen, `length` will confidently report the page size.

**Generate history; never type it.** Anchor every series on the value the live record already
holds and extend **backwards**, and where real history exists, join the synthesised part to its
*earliest real point* rather than to the current value — otherwise there is a visible step at
the seam. The last point of every chart is then by construction the number on the tile above it,
and the two can never disagree.

**Make volume mean something, or do not add it.** Two thousand comments filed against the
entity, municipality, centre and service each one names give every screen a real evidence base
and make "the comments for this centre" a working filter. Two thousand comments with no foreign
keys are a page of decoration that costs 1.5 MB.

**Compose text, do not repeat it.** Bilingual fragments in three movements — what happened, what
it cost, what they want — assembled with real names pulled from the objects at generation time,
produced 2,536 distinct comments from ~100 fragments. Draw the posture (complaint / praise /
question / suggestion) from the entity's own satisfaction **relative to the portfolio mean**, so
the mix shifts when a scenario moves the scores instead of being frozen at seed time.

**Draw dependent attributes from their parent, never independently.** ❌ A KPI command-centre build, 2026-09-25: the
work-order generator picked a fault ("Lift door fault") and an equipment item ("Chilled-water pump 1")
separately, and the explain workflow quotes work-order titles in the executive answer. One glance
from a facilities director ends the meeting. Key every generated attribute list by the parent's
category (faults by equipment category, complaints by service, line items by product family), and
read ten generated rows as the audience would before loading. Repair recipe: API-SPEC §55.9.

---

## 10. Stories: the thing that makes a demo an argument

A scenario is a lever. Nine levers demonstrate capability and answer nothing. What an executive
arrives with is a question and forty minutes.

Model the story as a **record**, not a route — `{ persona, question, payoff, minutes, steps[] }`,
each step `{ scenario_code?, route, title, note }` — so a new story is a row, not a release.
Then run it from a **store, not a page**: a story that ended when you left the screen that
started it is a list, not a run. A slim bar along the bottom survives navigation and carries the
one line saying what to notice on the screen you are now looking at.

Each step does two things in a fixed order: apply its scenario, then **always** re-derive the
insight register from the records it just rewrote. Never the first without the second. A lever
that moves the numbers and leaves the risk cards quoting the old ones produces a screen that
contradicts itself, which is worse than a screen that did not move.

Seven stories covered every screen and needed only two extra panels to land: the selected entity
against **its own cluster** (is this an entity problem or a sector one?) and a capacity ranking
with every column shown (where does the next riyal go?). Write the second with a caveat that
says plainly it ranks priority and does not forecast impact — the credibility of the whole
screen rests on not overclaiming that one number.

---

## 11. Let every chart talk to the agent — ambiently

Wiring "ask about this" per call site means the three charts someone remembered get it. Register
the handler **once**, beside the palette:

```ts
setChartPalette(CHART_PALETTE)
setChartAgent((question) => useAgentDock.getState().send(question))
```

The chart component then falls back to it when no explicit `onDrill` is given, so a figure added
next month is askable the moment it renders. Two affordances, not one: clicking a bar asks about
that value, and a toolbar control asks about the whole chart. Compose that question from what
the reader is actually looking at — the title, the series names, and the two ends of the
distribution — never a chart id.

**Axis floors.** An index moving between 62 and 81 against a target of 88 has nineteen points of
real movement, and a zero-based axis puts all of it in the top quarter. Give the spec an
optional `min` and use it for indices and scores only; keep zero for counts and amounts, where a
truncated axis exaggerates.

---

## 12. The docked copilot: one empty state, not two

The SDK renders its own centred welcome — a 64 px avatar and the agent's name — and in a 30 rem
dock that repeats the panel header two centimetres above it and pushes the opening questions off
the fold. The result is a tall column of nothing.

In compact mode: hide the SDK's welcome block, drop the island's own toolbar (the host header
already carries the name), and render the starter questions **inside the chat, directly above
the composer**. An opening question belongs next to the box you would type it into; anywhere
else it reads as decoration. The host header keeps three icon buttons — history, new chat, close
— sent into the frame as `postMessage` commands with a nonce so the same command can fire twice.

**Detecting "has the conversation begun" needs more than one signal**, because the starters are
an overlay: getting it wrong paints them over the agent's answer. A single DOM marker is not
enough — a `MutationObserver` on that subtree demonstrably did not fire for the SDK's own
re-render. Hide on *any* of: a latch set the moment anything reaches the composer; a
capture-phase `keydown`/`submit` listener for the user typing it themselves; and a poll of the
chat's **visible text**, which also covers a conversation restored from history. Do not test for
`[data-block-id]` — the SDK puts it on composer chrome too, so it is true on a brand-new chat
and the starters never appear at all.

**Fetch the island document with `cache: 'no-store'`.** The one file that must never be cached.
Its asset references are content-hashed, so the heavy chunks stay cacheable and are reused across
deploys — but if the little document naming them comes from cache, it names the *previous*
build's hashes, the CDN still serves those happily, and the frame silently runs the old island.
A fix deployed an hour ago simply does not exist for anyone who opened the dock before it. The
symptom is maddening: the bundle on the server provably contains the fix, and the behaviour never
changes. Diagnose it by comparing the `<script src>` inside the frame with the hash in the
freshly-fetched document — if they differ, this is it.

**Never schedule the chart mount on `requestAnimationFrame` alone.** The scan that turns a
` ```ua-chart ` fence into a chart runs in an iframe, and an iframe in a hidden pane never gets a
frame. Every chart the agent writes then stays a raw block of JSON while the agent looks like it
ignored its instructions. Pair the frame with a timer and let whichever lands first win. See §13.

**Give every insight card and every chart a way into the chat.** Two controls on a finding, not
one: the action does what the finding asks for, and "dig into this" opens the agent carrying the
finding's own words, the evidence lines it cited and the screen it came from — then asks for a
chart. An agent handed "tell me more" has to guess what the reader was looking at.

---


### The starters overlay must give way to the conversation ✅ 2026-09-23 (reported from a phone)

Custom starter chips + welcome line drawn by the island over the SDK chat stayed on screen after
the first message and overlapped the agent's answer. Cause: "is the chat empty?" was read from a
**layout class** (`.items-end`) — the same class right-aligns a *user* bubble. Never infer chat state
from layout classes, and do not rely on a MutationObserver alone (it missed the SDK's own re-render).
Hide on ANY of: a latch set the instant anything is handed to the composer; a capture-phase Enter /
submit listener (the user typing); a 400 ms poll for visible text in `.copilot-chat-theme`. Reset on
New chat. Canonical implementation: `assets/agent-dock/island/entry.tsx` + `composer.ts` (from
the government-performance build); use it for every new island. Apps that pass `welcomeText` to the
SDK and draw no overlay of their own are not affected. Verify: starters visible on open → gone after
the first question → back after New chat, on a phone-width viewport too.

## 13. Animations that fail visible

Two bugs of the same family, both of which made real content **wrong** rather than undecorated.
Treat them as data bugs, because that is what the reader sees.

- **`requestAnimationFrame` does not run while the document is hidden.** A count-up that settles
  only inside its frame callback leaves the headline figure reading `0` in a background tab and
  in every screenshot. Land on the final value with a `setTimeout` regardless; the frame loop is
  the nice way of getting there, not the only way.
- **`animation-fill-mode: both` holds the from-state forever** if the animation never completes.
  An entrance keyframe from `opacity: 0` leaves headings simply absent. Make the resting style
  the visible one and use `backwards`.

- **`prefers-reduced-motion` must skip the animation, not the drawing.** The worst of the three,
  because it hits the users who asked for the setting. `useState(reduced)` seeds from a flag that
  is `false` on the first render and only becomes true once `matchMedia` has been read — so an
  effect that reads `if (reduced) return` never sets the drawn state, and the figure stays at its
  from-state for ever. A weighted ring rendered as an empty circle around its number. Always set
  the final state explicitly on the reduced-motion branch.

The test: hide the pane, load the page, screenshot; then turn `prefers-reduced-motion: reduce`
on and do it again. Anything that reads zero or renders blank is this bug. Do not trust
`getComputedStyle` here — read the element's own `stroke-dashoffset`, or look at the picture.

---

## 14. Nine destinations do not fit on one masthead row

Nine labelled nav items plus a brand and two controls need about 1,640 px. On a 1,440 px laptop
that is horizontal scroll on every page — and hiding the labels below 1,280 px trades a layout
bug for a wayfinding one. Give the nav its own 44 px row, with a hairline where the group
changes so the items read as *one overview, four lenses, three places to act* rather than nine
equal tabs.

Check for this the mechanical way rather than by eye:

```js
JSON.stringify({ doc: document.documentElement.clientWidth, scroll: document.body.scrollWidth })
```

### A fixed bar must reserve the space it covers — and `pb-*` will not do it

Anything fixed to the bottom — a story runner, a player, a cookie bar — makes whatever is under
it unreachable. On a phone that is the bottom fifth of every screen, silently.

Reserve the height **from the bar**, where it is known, with a `ResizeObserver` writing
`document.body.style.paddingBottom`. Do **not** reach for a conditional `pb-*` on the page
container: it already carries `py-*`, Tailwind v4 emits that as the logical `padding-block`, and
a physical `padding-bottom` — from a class *or* from an inline style — does not reliably win
against it. The class appears in the element's class list, the inline style appears in its
`style` attribute, and the rendered padding does not move. Two hours of cascade forensics for a
one-line effect in the right place.

Related: **verify layout by screenshot, not by `getComputedStyle`.** In an automated browser the
computed value read back from an injected script can disagree with what is painted. The picture
is the thing the reader gets.

---

## 15. Chat with the data — the default on every surface ✅ 2026-09-23 (a supplier-risk build)

Owner rule: *"add chat with data in all AI insights, charts and so on, so when the user clicks they
have the agent copilot open and it explains and elaborates, and the user can ask anything."* This
is a default for every app, not a feature to be asked for.

**What gets an ask affordance — all of it:**

| Surface | Affordance | Question it sends (plain language, never tool names or JSON) |
|---|---|---|
| AI insight card | "Explain & discuss" button beside the action button | `Explain this finding and what we should do about it: "<title>" — <detail> Evidence: <evidence>.` (or the model's own `ask_agent.prompt` when it chose that action) |
| Insight panel header | "Discuss with the analyst" | `Walk me through what matters on the <screen> screen. Headline: … Findings: <titles>.` |
| Chart (dashboard and in-card) | click a bar/slice + toolbar ask icon (registered once via `setChartAgent`, §11); in-card charts pass `onDrill` that appends the insight's title/detail as context | the value clicked + the chart title |
| KPI tile | small ask icon, top-right, `stopPropagation` so the tile's own link still works | the number, what it counts, and the question an executive would ask of it |
| Heatmap cell / matrix | the cell itself is the button | `In <row> the <factor> pressure scores <v>/100 across <n> items. Which drive it, why does it matter, what should we do?` |
| Table row | ask icon in the last cell | `Brief me on <name> (<code>): <2-3 key figures>. What is driving it and what should we do?` |
| Domain card (operation, treatment, alert) | ask icon beside its code | the card's own facts + "is this the right response / what if it slips?" |
| AI task result (brief, assessment, plan, triage, scenario) | `AiPanel discuss="…"` renders "Discuss with the analyst" in its header | `Explain this <thing> and challenge it: <the model's own output, summarised>` |

**Rules**

- The question carries the context the agent needs — the figures on screen, codes, names — so the
  first answer is specific. The agent still re-reads the records with its tools; the context only
  tells it where to look.
- Pass a `scope` (the supplier/entity/screen name) so the dock header says what it is reading.
- Opening the dock by any other route still sends nothing (§3); only these explicit clicks send.
- Never put tool names, ids-as-instructions or JSON in the user-voice message (§3). Record codes
  as facts are fine ("SUP-0012").
- Clicking twice must re-send — the dock store's `nonce` handles it.
- A write the user asks for from there still goes through the agent's approval card.

**Drop-in:** `assets/chat-with-data/Ask.tsx` — `AskIcon` (icon button, for tiles/rows/cards) and
`DiscussButton` (labelled, for AI results), both on top of `useAskAgent()` from
`assets/agent-dock/agent-dock.ts`. Reference use: the supplier-risk build's `app/src` (its
`ui.tsx`, `InsightPanel.tsx`, every route; repo in case file
`unifyapps-solution-playbook/references/builds/rest-supplier.md`).

**`AskIcon` is a `<button>` — never put it inside another `<button>`.** A clickable card that holds an
AskIcon must be `<div role="button" tabIndex={0} onClick onKeyDown(Enter/Space)>`, or the AskIcon must
sit outside the card's button. React logs "<button> cannot contain a nested <button>" and the inner
click can fire the card too (supplier-risk build `/sources` registry cards, 2026-09-25). Internal links from inside
a route use router `<Link to>`, not `<a href="/x">`, or the published app (which has a basename) loses the path.

---

## 16. Agent QA before any demo — run the battery, don't spot-check ✅ 2026-09-23 (a supplier-risk build)

"Is the agent always responding, quick, and drawing charts?" is answered by a scripted battery on
the **builder preview** (the published URL only when the user asked for it), in the app's own copilot frame, not
by one friendly question. How many questions follows the test mode (playbook `build-options.md` §3).

**The harness** (paste into the live app tab; the frame is same-origin):
- send with `frame.contentWindow.postMessage({type:'ua-copilot:send', text}, location.origin)` — the
  same path the app's ask buttons use; start each scenario with the SDK's own "New chat" button;
- **done = no `button[aria-label="Stop generating response"]` for ≥ 8 s AND answer text present**
  (or 30 s idle). Two false signals that cost a run each: the "Response has been generated"
  live-region text persists across chats, and the Stop button disappears for 5–25 s *between
  phases* (task selection → tools → answer) — a user sees an idle chat in that gap;
- record per scenario: first tool call, first answer text, done, longest silent gap, charts
  (`.gc-host` count), tools used, approval card (`Deny` / `Approve Once` buttons), errors;
- run scenarios sequentially and wait for idle before the next — overlapping sends stack runs and
  every later measurement is garbage.

**The battery** (adapt the nouns): top-N ranking + chart · one record's 12-month trend chart ·
simple count · breakdown chart for one entity · "most exposed" reasoning question · out-of-scope
question · unknown entity name · category comparison chart · lookup by name · same-chat follow-up ·
portfolio-wide breakdown over thousands of rows · write request → confirm → approval card →
Approve → **read the record back from the object**. Plus one question that states a wrong number.

**What it caught on that build (all fixed, all re-tested):**

| Symptom | Cause | Fix |
|---|---|---|
| "The register contains no records" / "no suppliers in those categories" | the only tool returned whole records; a 300-row pull (~200 KB) was more than the model could read, so it concluded the data was empty | query returns key fields by default (≤ 80 rows, `fields=` to choose, `name_contains=` to search, `object_total` always reported) **and** an `AggregateData` tool (group_by / metric / op computed server-side over a single 5,000-row page — verified exact on 2,926 rows) |
| a finished answer followed by an endless "Brewing… / Distilling… / Generating response…" | agent cloned from one that had **no** `topicExecutionSettings` / `responseGenerationSettings` / `preProcessingSettings` / `indexingSettings` | copy all four from a known-good agent and set `topicExecutionModel` + `answerGenerationModel` to Gemini 3.8 Flash (`e_6ab12f80f843281fda62e98d` on UAT); did not recur in 16 runs |
| trend chart headed "TOTAL 1,029 points" | chart rule never said when not to total | rule: add `"total": false` for scores, averages, rates and series over time |
| "The operation completed successfully — no errors occurred." after a write | platform continuation turn; the write task lacked the end-the-turn rule | put "reply with the business outcome only … and end the turn" in **every** task, the write task included |
| agent repeated the user's wrong count (15 vs 38) | nothing told it to check numbers in the question | the rule in the **agent prompt did nothing** (re-tested: still "15 flagged"); as the **first instruction of each answering task** it worked — "38 suppliers flagged — not 15". Put behaviour rules in the tasks |

**Measured after the fixes** (published app, Gemini 3.8 Flash): simple count 10 s · out-of-scope
10 s · unknown name 12 s · breakdown / comparison / trend charts 18–31 s · top-10 ranking + chart
32 s · multi-query reasoning 43–72 s · approval card 8 s after "yes". Every chart rendered; no run
hung. The remaining gap is the platform's silent pause between phases (10–25 s, up to 50 s on
multi-query answers) — nothing in the app can fill it yet.


### 🔴 Never name another vendor's product in the app — the brief's reason is not the product's copy

✅ **Standing rule, Maher 2026-09-23.** The brief for a build almost always explains *why* the
customer is buying: "they license X, use 20% of it, and want to sunset it". That sentence is the
user's context for commissioning the work. **It is not copy, not a scenario, not an agent
instruction, and not a data value.** The delivered application says what it does; it never says
what it is instead of.

A prompt may freely say *"build something like X, or better"*. What ships must not mention X.

Why it matters, in order:
- **It is customer-facing.** The customer will show this to its own board. A screen carrying a
  competitor's trademark reads as a vendor's sales deck, not as their system.
- **It dates instantly.** The incumbent changes, the contract lapses, the migration finishes —
  and the copy is now wrong on every screen.
- **It is legally and commercially careless.** A third party's registered mark on a product
  screen, in a story a CFO is meant to walk through, is not yours to put there.
- **It is weaker.** "Registration, qualification, sourcing, award and contract — the whole chain
  on 440 live supplier records" is a stronger claim than "we replace X", because it is a
  statement about the product rather than about somebody else's.

**Where it hides.** It is never only in the obvious heading. On a procurement build one line in the
brief had reached **eight** places, four of which no UI search would have found:

| Where | What it was |
|---|---|
| A hero card | "Replacing Ariba" / "<Customer> uses about a fifth of what it licenses" |
| A page lede | "the register inherited from the Ariba estate" |
| **An enum value** | `<uc>_registration.channel = 'MIGRATED_ARIBA'` — in the TS union, the object SCHEMA's `oneOf`, its title, and 47 records |
| **A record's primary key** | `<uc>_story.story_code = 'ST-ARIBA'` — an id, so it needed delete + recreate, not an edit |
| Record prose | the story's title, question, payoff and every step note |
| **Two workflow system prompts** | the insight engine and the writer — so the LLM would say it unprompted, on any screen |
| **An agent's instructions** | same, in conversation |
| Source comments | three of them, which is how it kept coming back |

**So make it a build step, not a proofread.** Before the first publish, and again before any
demo, grep the whole surface — `app/src`, the seed, the exported `platform/*.json`, and the live
tenant — for the incumbent, its vendor, and the obvious alternatives, plus the words that carry
the same idea without the name: `licens`, `sunset`, `retiring`, `migrate`, `legacy estate`,
`a fifth of`. Search the Arabic too; `أريبا` does not match `ariba`.

```js
const RE = /ariba|أريبا|\bSAP\b|coupa|jaggaer|ivalua|zycus/i
// records
for (const o of OBJECTS) (await UA.fetchAll(o)).filter(r => RE.test(JSON.stringify(r.properties)))
// agents and workflows — the two everyone forgets, and the two that SPEAK
for (const id of AGENT_IDS)  RE.test(JSON.stringify((await getAgent(id)).properties))
for (const id of WORKFLOWS)  RE.test(JSON.stringify(await getWorkflow(id)))
```

**Neutral replacements that keep the meaning:**

| Instead of | Write |
|---|---|
| "Replacing <product>" | "What runs here" |
| "uses a fifth of what it licenses" | name the chain: "registration, qualification, sourcing, award and contract" |
| "inherited from the <product> estate" | "inherited from the legacy estate" |
| `MIGRATED_<PRODUCT>` | `MIGRATED_LEGACY` |
| "Can we leave <product>?" | "Can we run all of this ourselves?" |
| "the module <product> was bought for" | "the front door of the register" |
| "that is the operating case, not the licence case" | "that is the operating case, in records" |

A scenario or an executive story may still be about **consolidation, self-service, insourcing or
cycle time** — those are the customer's problems and they belong in the product. What goes is the
other company's name and the commercial framing that only makes sense as a pitch.

**Changing an enum value is a four-part change**, and doing three of them leaves writes failing
with `property <field> invalid; oneOf fail`: the TypeScript union, the object schema's `oneOf`
**const**, its `title`, and every existing record. The schema update needs the top-level `schema`
block (see "entity-type/update ignores schema changes"). Changing a value that is a record's
**primary key** cannot be edited in place. Under the no-delete rule you create the new row, carry
every property across, and **mark the old one inactive** (status/`archived` flag) once the new one
reads back — never delete it. Ask the user before doing this on shared data.

**A count that needs a join is where the agent invents numbers — denormalise the flag.** ❌ 2026-09-25
(a supplier-risk build): "how many material providers depend on the Sydney cloud region?" came back as 74 of 85; the
records say 61. `<uc>_dependency` (supplier → platform) did not carry materiality, so the agent had to
join two objects through QueryData/AggregateData and got it wrong. ✅ Fix at the data level: add
`supplier_material` to the link object (schema property + backfill every row with full properties),
tell the agent to count link rows with that flag = true, re-ask: 61 of 85 (71.8%), correct. Fact-check
every battery answer against the records with your own count, not against the screen.

---

## 17. When the product's claim is deterministic, do not let the model make it ✅ 2026-09-23 (a document-fraud build; case file `unifyapps-solution-playbook/references/builds/claim-integrity.md`)

The trap in an "AI detector" is that the AI is the weakest instrument in the room for the thing
the product is named after. A model cannot tell you an invoice's total was 36,750 before someone
changed it to 46,750. A parser that walks the PDF's own incremental-save history can, and it is
right every time or it says it could not run.

So split the product in two and be explicit about the seam:

| Layer | Owns | In this app |
|---|---|---|
| **Deterministic** | the verdict, the evidence, the confidence | 7 document checks called over HTTP from `<uc>_forensics`; arithmetic; duplicates; published-price cross-validation |
| **Statistical** | what to look at first | outlier, velocity, concentration, Benford |
| **The model** | the reading, the comparison, the so-what, the next action | the insight band, the writer, the three agents |

Four things follow, and all four are visible on screen:

1. **Show the arithmetic.** The workbench decomposes the risk score into each finding's own
   contribution under the weighted noisy-OR, in order, with the running total. A number a reader
   cannot take apart is a number they have to trust, and nothing that decides about money should
   ask for trust.
2. **Put the honest caveat where the claim is, not in a footer.** Every screen that shows a clean
   result says a clean result is not a certificate. That single sentence is what makes the rest of
   the product credible, and it is in the agents' instructions and both system prompts too — so it
   survives into conversation.
3. **Give "inconclusive" a place in the UI.** A check that could not run reports why. The Analyse
   screen renders those in their own block. A product that only ever shows pass and fail is
   training its users to believe the passes.
4. **Never let a finding become a statement about a person.** The agents are instructed to say what
   the check found and what it checked against, never that someone did something; the claimants
   screen says so in its own lede; and the integrity score is described as arithmetic over findings.

### Run the real engine on the demo's own stage
The strongest single screen in this build is the one where the viewer hands the platform a document
and watches it answer: drop a PDF (or click a bundled sample), the file is base64'd in the browser,
`<uc>_forensics` posts it, and 2.3 seconds later the recovered original amount is on screen with the
flag that found it. Bundle two samples — one altered, one clean — because the control is what makes
the catch mean anything.

Two details that make it feel like an instrument rather than a spinner: the scan line runs over the
drop zone **while the request is genuinely in flight** and stops when the answer lands, and the
report opens with the score ring drawing to its value. Neither invents a wait.

### A signature visual can come from the product's own model
Instead of a map, this app opens on a **radar of its own detection library**: one spoke per check,
length proportional to how often it has fired, coloured by family, with the seven deterministic
ones haloed. It is read from `<uc>_check` — so it is a picture of the register, not a decoration —
every spoke is a button that asks the agent about that check, and it makes the product's central
argument (a small family of document checks produces most of the escalations) legible in one look.

---

## 18. Components are finished, or they do not ship ✅ standing rule, set by Maher 2026-09-23

> "I want it similar to the one in the [earlier] app … this must be applicable for all future apps,
> not only this."

Every component we put on a screen is built to the standard of the best one we have already
built. Not "works", not "conveys the data" — **finished**. The audience is an executive in a live
meeting, and a component that looks provisional makes them doubt the number on it.

**The rule: before writing a component, go and look at the best existing version of it.**
The reference builds in `unifyapps-solution-playbook` (the government-performance build, the
config-app sample in `unifyapps-config-apps/examples/cgb-pulse/`, the procurement build) and the
assets in this skill are the reference set. If we have built a
map, a gauge, a heatmap, a KPI tile, a chart card or an agent dock before, the new one starts
from that — not from a blank file and a guess.

What "finished" means concretely, and what a provisional version looks like beside it:

| | Provisional | Finished |
|---|---|---|
| **Geography** | a hand-traced outline | the real boundary release, projected at build time, with the sub-regions |
| **Depth** | one flat fill | a lit gradient, a rim on the silhouette, a shadow that seats it on the card |
| **Data encoding** | one colour for everything | size *and* colour carry meaning, with a legend that names both |
| **State** | static | hover, selected, dimmed-siblings, empty, loading — all designed, not defaulted |
| **Labels** | none, or every one | the ones that fit, sized per shape, at a contrast you can read on the card |
| **Edges** | a `<div>` with a border | a considered corner radius, hairline, and one shadow that matches the rest of the app |
| **Provenance** | nothing | the source named on the component (`geoBoundaries ADM1 · CC BY 4.0`) |
| **Accessibility** | a bare `<svg>` | `role="img"` and an `aria-label` that states what it shows and how many |

Two habits that produce this without slowing anything down:

1. **Steal from ourselves first.** `grep` the other app repos for the component before writing it.
   The geometry, the projection, the build script and the type definitions are usually already
   solved and tested.
2. **Look at it before you ship it.** Run the dev server and take a screenshot. Every one of the
   defects above is obvious in a picture and invisible in a diff — the hand-traced map compiled,
   type-checked, rendered without errors and was still unusable.

Applies to every component in every app from now on, not just maps.

---

## 19. The visual template: elegant, and it plays with colour ✅ standing rule, set by Maher 2026-09-23

> "the UI is very basic. always use a template like the one in [the earlier app] that is elegant
> luxury and play with colors."

The reference builds are the config-app sample (`unifyapps-config-apps/examples/cgb-pulse/`) and
the government-performance build. What makes them read as finished, and what a
"basic" screen is missing:

**Colour does work, it does not merely decorate.** A brand has more than one accent and a screen
should use them to mean different things: a division, a status, a direction of travel. One ordered
brand ramp defined once (`--chart-1..6`) and read in order by every chart, so the same division is
the same colour on every screen. Status colours separate from brand colours. A warm metal accent
(champagne, brass) against a deep ground is what separates "corporate template" from "considered".

**Depth, on a budget.** A dark hero band with a radial wash behind it; glass tiles
(`rgba` gradient + 1px light border + backdrop blur) on that band; one shadow scale used
consistently; hairlines rather than heavy borders. Never a flat white page with grey boxes.

**Rhythm.** A screen opens on ink and a thesis sentence, then the numbers, then the evidence.
Dark page headers on *every* screen, not only the first. A live ticker under the masthead only when asked (the
supplier-risk and document-fraud builds had it removed, 2026-09-25). Section
headings that say what the reader is looking at, not what the component is.

**Type.** A display face for hero lines and a text face for everything else, both loaded from the
brand where one exists (sample the customer's own CSS for their palette and type — one customer's
site gave navy `#002961`, blue `#004E8D`, cyan `#008AD3`; its display face mapped to IBM Plex). Tabular
numerals on every figure. Uppercase letterspaced eyebrows.

**Motion, sparingly.** A ticker that scrolls, a pulse on the live dot, 120–160 ms transitions on
hover. Nothing that moves while being read.

Before shipping a screen, put it beside a screenshot of the config-app sample. If the difference is obvious,
it is not finished — and the gap is nearly always colour doing no work, no dark band, and flat
tiles.

## 20. An agent that is configured is not an agent that works ✅ 2026-09-23 (a trading-house graph build; case file `unifyapps-solution-playbook/references/builds/jaidah.md`)

Creating an agent over REST gets you something that looks complete on every screen and answers
questions fluently without ever touching its data. Four separate things sit between the two, and
none of them shows up as an error.

**1. `agentType` must be `ai-agent`.** Cloning an existing agent to get a sane
`responseGenerationSettings` / `indexingSettings` block is the right move — but if the template
was a `team`, you inherit `agentType: 'team'` and a `multiAgentConfig` naming `tensor_builder`
and `tensor_planner`. That is a platform builder team, not an analyst.

**2. Deploy it.** `POST /api/entity/action/saveAndDeploy` with the WHOLE entity plus
`deploymentNotes`, then verify by snapshot (`unifyapps-builder` `references/agents.md` "Verify a publish by
snapshot": deployed `properties` equal the agent's; deploy again at most 3 times). An agent that has never been deployed answers `204 No Content` to the app
embedding it, and the copilot sits on "Loading <agent name>…" forever.

**3. The tool needs `enabled: true`.** This is the cruellest one. Without it the tool is not
offered to the model at all, so the agent reasons about the question in the abstract:

> "I do not currently have access to the Enterprise Context Graph query tool (`<Uc>Graph`) or
> the underlying records required to retrieve this data directly. To determine which
> counterparties cross three or more divisions, access to the following would be required: …"

It then describes, correctly and in detail, the exact queries it would run. It reads like a
permissions problem. It is a missing boolean. Copy the flag set from a tool that already works:
`enabled`, `isStandardAction: false`, `enableToolSearch: false`, `runTimeConnectionEnabled: false`,
`deferToolLoading: false`. (`e_action_ai_agent` rejects an unknown property on update, so copy
only fields a real tool has.)

**4. Leave `inputs.parameters` empty.** `{}`, not `{cypher: '', row_limit: '500'}`. Pre-seeded
values pin the arguments; an empty map lets the agent fill them from the automation's own START
schema.

### Then give it a budget

The first working turn cost **471,035 tokens** and ended in a loop. The agent omitted
`row_limit`, the default was 500, and it got 500 full records per call.

- Default the row limit **low** (100) in the automation, not in the caller. The app passes its own
  explicitly, so the default is what an *agent* gets.
- Budget **characters** as well as rows in the shaper, sized to catch a pathological result rather
  than a large one — a 1,000-row ledger read is legitimate. 400k characters, not 60k; the agent is
  held back by its row limit, not by this.
- Say it in the tool description, in the imperative: *aggregate in the query; if `truncated` comes
  back, re-ask as an aggregation rather than raising the limit.*
- Return `{count, matched, limit, truncated, clippedForSize, rows}`. An agent that cannot tell a
  page from an answer will confidently report the page.

### Check which model it is ACTUALLY running

`responseGenerationSettings.answerGenerationModelSettings.modelId` **overrides**
`answerGenerationModel`, and `topicExecutionSettings` holds two more. A cloned agent had Sonnet 5
declared and Gemini 3.8 Flash in all three effective slots, so the whole tool loop ran on a model
nobody picked. On the same question: **27 s and roughly one failure in two** on Flash,
**15.4 s and no failures** on Sonnet 5.

The failure signature is worth recognising — several fast tool calls, then four model calls of
~200 ms each, then `The AI response contained corrupted internal data`. That is the platform
retrying an unparseable output, i.e. the model fumbling the exact-JSON chart contract. It reads
like a data or permissions fault and is neither.

Also set `disableThought: true` for a tool-calling analyst: thinking on every hop costs seconds
and buys nothing when the instructions already prescribe the method.

**And read the trace before blaming the data.** Across every trace on that build the graph query is 1–3%
of wall clock (115–840 ms); the rest is the model.

### Verify it the only way that counts

Ask it something **only the tool can answer** and check the number against the engine yourself.
The acceptance there was: *"How much do we have in open receivables, split by division?"* →
QAR 229.6M across 1,113 invoices, all five divisions correct to the riyal, the traversal named
(`Invoice` → `[:IN_DIVISION]` → `Division`), and a ```` ```ua-chart ```` block rendered as the same
`ChartBlock` the dashboards use. Anything less than a number you have independently checked is a
fluent agent, not a working one.

### And read the prompt of anything you clone

The AI-writer workflow on the first version of that build was cloned from a procurement app. Its
system prompt still described the procurement customer, a large Egyptian private energy group — so every line of narrative in a
Qatari trading-house application was written by an engine told it worked somewhere else. Nothing
failed. Nothing logged. Cloning a workflow clones its prompt.

---

## 21. Calibrate a score against ordinary traffic, not the adversarial set ✅ 2026-09-23 (a document-fraud build)

A risk score exists to **order a queue**. If everything it flags comes out in one band, it has
told the reviewer nothing, and no amount of good detection underneath rescues it.

The document-fraud build scored each claim with a weighted noisy-OR over the findings that fired, with the
weight as an exponent:

```groovy
prod = prod * Math.pow(1.0d - score, weight)      // wrong
def risk = 100.0d * (1.0d - prod)
```

Against the adversarial corpus this looked fine — everything in an adversarial corpus really is
bad, so everything scoring 90+ reads as correct. The moment 100 ordinary invoices went through
the same pipeline, the defect was obvious: **all 58 flagged claims scored between 79.8 and 100
and every one banded CRITICAL.** A single finding at score 0.65 with weight 2 already gives 87.8.
The command centre's "the eight claims carrying the most risk right now" was picking eight rows
out of fifty-eight that were indistinguishable.

The weight is a **strength**, not an exponent. Normalise it against the strongest evidence the
catalogue holds and let the noisy-OR run over probabilities:

```groovy
def W_REF = 2.5d                                   // the weight of the strongest check
def strength = w / W_REF; if (strength > 1.0d) { strength = 1.0d }
def pi = sc * strength; if (pi > 0.99d) { pi = 0.99d }
prod = prod * (1.0d - pi)
```

And narrow whatever forces an escalation past the score. "Any high-or-critical severity finding"
escalated 53 of 58 claims and made the score decorative; "proof of tampering, or a check the
catalogue itself calls critical" escalated 35. A single high-severity policy miss is a review.

Same 100 findings, same documents, after: **35 CRITICAL / 1 HIGH / 22 MEDIUM / 107 LOW**, scores
spanning 44 to 96. That is a queue.

Three rules that generalise to any scored product:

1. **Build ordinary traffic before you trust the score.** A test set that is all positives cannot
   show you saturation, a false-positive rate, or a base rate. Generate the boring cases through
   the same real pipeline — most of a working register is claims where nothing fired, and a
   register that flags everything looks broken to the person who has to work it.
2. **Check the distribution, not the extremes.** Print min / p25 / p50 / p75 / max and the band
   histogram after any scoring change. Both bugs here were one query away and neither was visible
   in a spot-check.
3. **Make the model re-runnable.** Scores already written are stale the moment the formula moves,
   and re-running the whole intake would mean deleting records. A `*_rescore` automation that
   recomputes from the findings already stored — and **rewrites each record's control-room
   baseline** so a reset restores the new model rather than the old one — is the difference
   between a calibration you can iterate on and one you get a single shot at.

### The other half: every aggregate on the screen needs an owner

Filing 165 claims left `<uc>_vendor`, `<uc>_claimant`, the catalogue's hit counts and the whole KPI
object holding the zeros they were seeded with. Nothing was wrong with the claims; nothing had
been told to recount. Give the app **one `*_rollup` automation that rebuilds every derived number
off the base records**, and call it from the same screen that creates one:

```ts
if (response.claim?.claim_code) void run('rollup', {}, 'rollup')   // behind the result, not in front of it
```

The user gets their answer immediately, and the command centre is correct by the time they
navigate to it. A rollup that only ever runs by hand is a rollup that is wrong most of the time.

### And: derive the numbers in your own copy

The lede said "Twenty-seven checks read each claim" while the catalogue held 37 rows, 17 of them
live. A count written into a sentence is the first thing in a product to become untrue. Derive it:

```tsx
const lib = useMemo(() => {
  const rows = checks ?? []
  const live = rows.filter((c) => c.status === 'EXECUTES' || c.status === 'PARTIAL')
  return { live: live.length, specified: rows.length - live.length,
           forensic: live.filter((c) => c.family === 'DOCUMENT_FORENSICS').length,
           fired: rows.filter((c) => c.hit_count > 0).length }
}, [checks])
```

Same rule for charts. Two 24-month trend lines were drawn from a KPI object holding **one**
period, because every claim was filed the day its document was read. Guard them
(`if (periods.length < 3) return undefined`) and show what the data supports instead — where the
findings come from, flag rate by issuer. A line through one point is decoration, and the reader
cannot tell it apart from a line through twenty-four.

## 21b. Test the finished app as if someone else wrote it ✅ 2026-09-24 (a trading-house graph build)

"It renders, it has no console errors, the agent answers" is where testing starts. A pass over a
finished app found, in order of how badly each would have shown in a customer demo:

1. **An agent that disagreed with the screen behind it.** Same graph, same question, two numbers
   (§39.3). Always ask the agent something the screen already shows and compare digits.
2. **Ten wrong figures on cards that all cited real records** (§39.6).
3. **Blank columns** where the component read a field the data model does not have (§39.1) —
   type-checked, rendered, empty.
4. **A severity default** that made three critical findings look routine (§39.5).
5. **Two figures for one concept in one panel** — a donut computed from the latest month beside
   a list reading a stored `revenue_share_pct`. Give a legend the chart's own arithmetic.

The shape they share: **nothing failed.** A default was taken, a property was missing, a filter
matched more than intended. Testing that only looks for errors finds none of them. Test by
asking, for every number on the screen, *where did this come from and does anything else in the
app claim something different?*

**And check the affordances.** Three separate things in this build were inert but perfect-looking
— an optional `onSelect` no caller passed, an agent tool without `enabled: true`, two agents
nothing routed to. If something looks clickable, click it.

---

## 22. Integrate a source you cannot access — simulate the SYSTEM, integrate for real ✅ 2026-09-25 (a supplier-risk build: Cyble + ten named feeds)

When the customer names an external system we have no access to (Cyble, World-Check, UpGuard,
Creditsafe, Moody's, ASX…), do not fake its output on a screen. Build it as a **source system**
and connect the product to it exactly as the live one would be connected:

1. **The simulated system owns its objects and keys** — e.g. `cyble_vendor` (watch-list, its own
   `vendor_id`, monitored domain) and `cyble_alert` (its own `alert_id`, module, category,
   severity, `status NEW|ACKNOWLEDGED`); one `ext_feed_item` object (with `provider`) for many
   simpler feeds. Object descriptions start with "SIMULATED source system:".
2. **A sync workflow ingests it** (CALLABLE for "Sync now" + a SCHEDULED twin every 15 min, same
   graph): fetch `status = NEW` → fetch the mapping data → one Groovy node maps each item to a
   product record (by the source's key, fallback by domain/name) and builds three lists →
   `storage_by_unifyapps_bulk_create_records` (v16419, `{object_type, useRawPayload: true,
   rawPayload: [ … ]}`) for the new product records → `storage_by_unifyapps_bulk_upsert_records_by_id`
   (v16335, field-level `updateFields`) to **acknowledge back to the source** (`status`,
   `acknowledged_at`, the product record code) → `create_record` of a sync-run log → bulk upsert
   of the source-registry row (`last_sync`, running total). Unmapped items stay NEW and are named
   in the run note ("vendors not in the supplier register") — that is a finding, not an error.
3. **A separate SIMULATOR workflow** (scheduled hourly, name prefixed `SIMULATOR`, description
   "not product — pause when the real API is connected") emits 0–3 new items into the source
   objects, so the pipeline is live between demos. It never writes product objects.
4. **A source registry object** (`<uc>_signal_source`: name, provider, what it provides, mode
   `SIMULATED_FEED|CONNECTED`, cadence, last_sync, total) and a **sync-run log** drive an
   Integrations/Sources screen: registry cards, per-source detail with Sync now, the field
   mapping table, "needs mapping" list, sync history. A visible banner says the feeds are
   simulated and that going live changes the connection, not the product.
5. **Verify by counting rows**, never by the workflow's own summary: items flipped to
   ACKNOWLEDGED, product records created with the source reference, run logged, registry total
   moved. Test the empty case (0 NEW) and let one scheduled run fire unattended before calling it done.

Measured on UAT: 22 Cyble alerts → 18 signals + 4 unmapped in 0.6 s; 60 feed items → 60 signals;
empty run clean; scheduled runs at :00 ingested the simulator's alerts unattended.

**Map overlay + widget pattern.** Put the external signals on the map as a layer (toggle by source,
pulsing ring on suppliers with open signals, ring colour = worst severity) and make a click open a
**supplier widget** over the map (ratings from each source, open signals by source, critical
operations, fourth parties, contingency, Open 360 / Ask) instead of navigating away.


### 🔴 Animate by DEFAULT, and ship the switch that turns it off ✅ standing rule, Maher 2026-09-25

The reflex — gate every animation on `prefers-reduced-motion` and stop there — is wrong for
these apps, and the way it fails is silent.

**What happened.** Every animation in a procurement hub build was behind
`@media (prefers-reduced-motion: reduce)`. **Windows turns animation effects off whenever
Battery Saver engages.** So a demo laptop that unplugs drops the river, the canal convoy, the
risk pings, the bubble entrances, the sheen and the ticker *at the same moment*, with nothing on
screen to explain it and no way back without leaving the app and editing an OS setting. The
report was "the animations stopped in my Chrome" — one symptom, everything at once, which is the
signature of exactly this.

It is not only Battery Saver. The same flag is set by Windows → Accessibility → Visual effects →
Animation effects, by a Chrome flag, and — the one that catches people mid-demo — by DevTools →
Rendering → *Emulate CSS media feature prefers-reduced-motion*, which persists for as long as
DevTools stays open.

**So: the app decides, and the OS is one input to that decision, not the decision.**

```
on    animate, whatever the OS says   ← the default
auto  follow prefers-reduced-motion   ← the platform's own behaviour
off   never animate
```

Overriding an accessibility preference with no way back is just a worse platform, so **the
override always ships with the switch**, in the masthead on every screen — not buried in a
settings page, because the person who needs it is the person least able to go hunting.

**The shape** (`src/lib/motion.ts` + a picker in the shell; the procurement build is the
reference — case file `unifyapps-solution-playbook/references/builds/taqa.md`):

1. **Resolve once, publish once.** The module resolves the preference to a boolean and writes it
   to `<html>` as `data-motion="on|auto|off"` plus a bare `data-still` when the answer is "hold
   still". Then CSS needs **one** guard per animation:

   ```css
   :root[data-still] .qa-map__flow,
   :root[data-still] .app-ticker-track { animation: none; }

   /* and the blanket stop, keyed the same way */
   :root[data-still] { *, *::before, *::after {
     animation-duration: .01ms !important; animation-iteration-count: 1 !important;
     transition-duration: .01ms !important; scroll-behavior: auto !important; } }
   ```

   A bare `@media` block per animation is the thing to avoid: it has to be kept in step with a
   second condition forever, and the day somebody adds an animation without one, that animation
   is the only one still moving.

2. **Resolve again inline in `index.html`, before first paint.** Same logic, ~8 lines. Without
   it a reduced-motion viewer sees one frame of every entrance animation while React mounts.
   Keep it in step with `resolveStill()` and say so in a comment on both.

3. **`auto` keeps listening.** `matchMedia(...).addEventListener('change', …)` — the OS setting
   changes *while the app is open*, which is precisely what Battery Saver does.

4. **SMIL obeys nothing.** `<animateMotion>` and friends honour no media query and no CSS guard,
   so an SVG that uses them must not RENDER them when still: `{animate ? <circle>…</circle> :
   null}`. A travelling dot parked mid-path reads as a place, which is the one thing it is not.

5. **Store per browser** (`localStorage['app.motion']`), wrapped in try/catch — it throws in a
   sandboxed frame and in some private modes, and a preference must never take the app down.

**Diagnosing "the animations stopped"** — one console line, before changing anything:

```js
matchMedia('(prefers-reduced-motion: reduce)').matches
```

`true` and everything stopped together ⇒ this, every time. Check in order: Windows Battery
Saver, then Accessibility → Visual effects → Animation effects, then DevTools → Rendering
emulation, then `chrome://flags`.

**What does NOT change.** Motion stays decoration: with it all stopped, every screen must say
exactly the same thing. Nothing may depend on an animation to be readable, and the loading
animation on every AI surface is a state indicator, not decoration — it stays legible when still
(a pulse rather than a sweep).
