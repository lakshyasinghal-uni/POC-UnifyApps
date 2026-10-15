# The architecture act — a narrated, animated diagram

A film can open with **how the solution is built** before the screens: the UnifyApps building blocks it uses, the
customer's systems around them, what is **built and running**, what is **simulated today** (and what replaces it at
go-live), and then **one scenario drawn across the picture**. The narration explains it, and each part animates on
the word that names it. The film then cuts into the recorded demo as usual.

It is an act like any other in `steps.json`. Its steps carry `"diagram"` cues instead of an `action`, and they have
no `persona`. `scripts/diagram.mjs` draws it from `diagram.json`, and `scripts/motion.mjs` renders it with HyperFrames.
The recorder and `capture.mjs` skip it. `build.py` puts its clip in the film with its voice, opening card and act
card, and the next act pulls back from its last frame. It needs `"motion"` on.

```bash
python scripts/narrate.py o1 o2 o3 o4 o5      # voice its lines (the cues need the word timings)
node scripts/motion.mjs --diagram             # render only it: build/motion/diagram_<act>.mp4 + build/shots/<id>.jpg
npx hyperframes check build/motion/diagram_O  # lint the composition
```

Iterate with `--diagram`; a full `build.py` renders it anyway (cached by content). Each line's still goes to
`build/shots/<id>.jpg`, so the script, the runbook, the manual and the screenshot export all include the act.

## The facts come first (invent nothing)

Every node is a thing that exists, under the name a customer would recognise. Read before drawing:

- **The build:** the app's README / BUILD-STATE ("How it works", "What is real and what is simulated"), and the
  platform export (agents, workflows, objects). Count from the export. Example: "four AI agents", "fifteen
  workflows".
- **Simulated vs live:** a system is `simulated` only when the build says so (its own objects with sample data). Its
  `live` face names what replaces it, without claiming a connector exists unless the catalogue shows one: "Herotel's
  CRM, connected at go-live", not "Salesforce connector".
- **Platform vocabulary:** the 2026 gold deck names three builders and the data underneath. **Workflows** are "what
  needs to be done", **Agents** are "what AI does autonomously", **Apps** are "where humans act". Under them sits
  the data and context. Use these as the row names. The PricingGuide's "Unify Data / Automations / Applications /
  Agentic AI" is the July 2025 naming. Connector counts differ by deck (500+, 950+, 1000+): do not say one unless
  you date it.
- **Numbers in the voice** (seconds, matches, credits) come from measured runs, the same as the screen acts.

## diagram.json

```json
{
  "space": [1440, 900],
  "legend": { "built": "Built and running on UnifyApps", "simulated": "Simulated today, with sample data", "planned": "Connected at go-live" },
  "groups": [
    { "id": "herotel", "label": "Herotel", "sub": "where messages arrive", "x": 20, "y": 150, "w": 196, "h": 620, "pad": 10,
      "stack": [{ "id": "clients", "cy": 300 }, { "id": "qcontact", "cy": 550.75 }] },
    { "id": "platform", "label": "UnifyApps", "sub": "one platform · built and running today", "tone": "platform", "mark": true,
      "x": 234, "y": 150, "w": 960, "h": 620, "gutter": 120, "pad": 16,
      "rows": [
        { "id": "row-apps", "label": "Apps", "sub": "where people act", "nodes": ["cc", "helpdesk", "tickets", "rulescost"] },
        { "id": "row-agents", "label": "Agents", "sub": "what AI does on its own", "nodes": ["router", "verify", "sales", "analyst"] }
      ] }
  ],
  "nodes": [
    { "id": "router", "label": "Router", "sub": "reads every ticket", "icon": "bot" },
    { "id": "qcontact", "label": "QContact", "sub": "every message a ticket", "icon": "ticket", "status": "simulated",
      "live": { "label": "Herotel's QContact", "sub": "connected at go-live" } }
  ],
  "edges": [
    { "from": "qcontact", "to": "trigger" },
    { "from": "router", "to": "sales", "fromSide": "top", "toSide": "top", "via": [[451, 347.5], [871, 347.5]] }
  ]
}
```

The full Herotel diagram is the worked example (`herotel-helpdesk-router/demo/diagram.json`).

**Groups** are panels placed on the design space (`space`, scaled to the film frame). A group lays out its nodes in
one of two ways:

- `rows`: a labelled row per building block, with nodes spread evenly across it. Every row uses the widest row's
  column count, so the columns line up.
- `stack`: a vertical column. Each item is an id, or `{ id, cy }` to pin its centre. Pin a system to the row it
  talks to, so its edge runs straight.

Other group fields:

- `tone: "platform"` gives the panel the gold border.
- `mark: true` builds the UnifyApps mark dot by dot. It needs `brand/ua-mark-dots.json`; the scaffold copies it.
- `headH`, `gutter`, `pad`, `gap`, `nodeH` tune the layout.

A node outside every group takes `x, y, w, h`.

**Nodes:** `label` and `sub` should each fit on about one line. `icon` is a name from `scripts/icons.mjs` (Lucide; to
add one, copy its nodes in). `status` is one of:

| status | looks | means |
|---|---|---|
| `built` (default) | gold border, gold icon | built and running on UnifyApps today |
| `simulated` | dashed violet outline that marches, "Simulated" tab | a stand-in with sample data |
| `planned` | dashed sky outline that marches, "At go-live" tab | not there yet; connected in the implementation |
| `external` | neutral glass | the customer's world (the people who write in) |

`live: { label, sub, icon, chip }` gives a node a second face. A `swap` cue turns the card over to it: the stand-in
becomes the system that replaces it, with a sky outline and a light sweeping across it until the end of the act.
This is the "placeholder to be replaced" picture. Any node can have one; for example, a `built` AI model on the
platform today turns over to "the customer's own AI model".

**Edges** run `from` → `to`, between nodes, rows (`row-…`, anchored on the row band) or groups. Each edge is
drawn on its own once both ends are on screen (set `"auto": false` to hold it back, or `"autoEdges": false` on the
diagram). Data keeps flowing along every edge on screen.

Sides are chosen automatically. Steer an edge with:

- `fromSide` and `toSide` (`left`, `right`, `top`, `bottom`), and `fromAt` and `toAt` (0–1 along that side).
- `bend` for curve depth.
- `via: [[x, y], …]`, which routes the edge through points with rounded corners. Use it to go around a row through
  the gap between rows.

Edges sit under the cards, so route them through the gaps: rows are about 50 px apart. An edge between adjacent
rows that leaves the bottom of one node and enters the top of another stays inside the gap.

## The cues (in the act's steps)

```json
{ "id": "o4", "segment": "O", "act": "How it is built", "caption": "Follow one message across the picture",
  "narration": "Now follow one message. Khanyisile writes on WhatsApp, and QContact opens a ticket. …",
  "diagram": { "cues": [
    { "focus": null },
    { "at": "Khanyisile writes on WhatsApp", "token": { "id": "k", "label": "Khanyisile · WhatsApp", "on": "clients" } },
    { "at": "QContact opens a ticket", "move": ["qcontact"] },
    { "at": "The router checks CRM", "move": ["lookups", ["crm", "network", "billing"], "lookups"] },
    { "at": "two of three details match", "badge": { "on": "verify", "text": "2 of 3 details match" } }
  ] } }
```

`at` works like a highlight's `at`: a phrase of the line, matched against the spoken word timings, or milliseconds.
With no `at`, the cue fires as the line starts. `delayMs` shifts a cue.

| cue | does |
|---|---|
| `show: [ids]` | brings groups (panel, border draws in, mark builds), rows (label and their nodes, staggered), nodes or edges in |
| `swap: [ids]` | turns each card over to its `live` face, one after another |
| `focus: [ids]` / `null` | spotlights nodes (a row id means its nodes) and dims the rest; `null` restores |
| `token: {id, label, on}` | a glowing token with a label appears on a node: the scenario's subject |
| `move: [...]` | the token rides the edges node by node; each hop lights its edge, and the node it reaches pulses. `["a", ["x","y","z"], "b"]` fans out to x, y and z in parallel, then gathers at b. `tokenId` picks the token, `hopMs` sets the pace (default 750) |
| `hide: [tokenIds]` | tokens leave |
| `popup: {on, kicker, title, lines, side, w, keep}` | a card beside a node: a kicker, a title and up to three lines on what it does or is worth; `side` is right, left, above or below; the line's previous card leaves when the next arrives (IHC proposition film, 2026-10-06) |
| `badge: {on, text, tone, keep}` | a pill over a node until the line ends (`keep`: to the end). Tone is `accent`, `built`, `planned` or `simulated` |
| `camera: {on, scale}` / `null` | a slow push in on a group or node; `null` pulls back |
| `legend: true` | the key appears: built / simulated / at go-live |

Each line's `caption` is the headline at the top, rising in as the line starts. The act's `kicker` (or title) sits
above it. Every hop needs an edge between the two nodes, and the build fails with the missing pair if one is not
there.

## Writing the act

About five lines, two minutes at most, in this order:

1. **The platform.** The rows build as they are named, each with what it does in this solution.
2. **The systems around it.** Name the simulated ones as stand-ins, then swap them on "at go-live". Say "only the
   connection changes".
3. **Anything else that connects at go-live** (the customer's own AI model, their sign-in), and the value: built
   once, in one place, theirs to change.
4. **One scenario across the picture.** The token follows the subject of the demo through every block, and badges
   carry the facts the voice says.
5. **The exception path, if the demo has one** (a person decides), then hand over: "Now, the router at work."

The scenario should be the same subject the recorded acts follow, so the audience recognises it on the screens.
Business words only: no node names that read like code, no object keys, no workflow ids.

## More than one picture

A film can open with several diagram acts (the customer today and the case for change, the proposition with its pillars, then the architecture). Give an act its own picture with `diagram.<act>.json` next to `steps.json` (e.g. `diagram.S.json`); acts without one use `diagram.json`. A group's `show` brings in its panel and rows, not the cards it stacks: name stacked cards in the `show` too. A `move` starts where the token already is: list only the nodes it moves to, and give the token an id the moves name (default `k`).

## Gotchas

- The cues need `build/words.json`, so voice the lines before rendering. A line re-voiced after a render needs
  `--diagram` again; the cache notices the change.
- A cue's `at` that is not found in the line fires at the line's start. Check the stills, and fix the phrase:
  matching ignores case and punctuation, but not words.
- Rendering takes about 1.6 s per second of film at 1440×900, so a two-minute act takes about four minutes.
- A node a cue never shows is logged as `never shown by a cue`.
- RTL films: the diagram is drawn left-to-right. Mirror `x` by hand if an Arabic film needs it.
