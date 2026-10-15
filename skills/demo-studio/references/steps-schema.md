# steps.json — the schema

An array of scenes, in playing order. One scene = one caption, one narration line, one
action. `config.mjs` validates the file on load and names the offending entry, so a typo
fails in a second rather than in the middle of a take.

## Fields

| Field | Required | What it does |
|---|---|---|
| `id` | yes | Unique, short (`a1`, `b3`). Names the audio clip (`build/audio/a1.mp3`), the screenshot (`build/shots/a1.jpg`) and any custom function in `actions.mjs`. Changing an id orphans all three. |
| `segment` | yes | The act this scene belongs to (`A`, `B`, …). Acts are recorded, and re-recorded, as units. |
| `persona` | yes (not in a diagram act) | A key in `demo.config.json.personas`. Determines the browser session and the base URL. |
| `caption` | yes | The headline on screen. Six to nine words. A label, not a sentence. |
| `narration` | yes | Spoken aloud; becomes the subtitle, the script and (in `panel` caption style) the on-screen text. |
| `act` | no | The breadcrumb above the caption — "Command Centre · AI brief". Defaults to "Act II". Only visible in `panel` style, where it does real work: it tells the viewer whose screen this is. |
| `key` | no | The one sentence that must land in this beat — the runbook's right-hand column. A little inline HTML (`<strong>`, `<em>`) is allowed. Without it the runbook falls back to the caption, which is usually too thin to present from. |
| `action` | yes | What happens on screen. See below. |
| `diagram` | instead of `action` | `{ cues: [...] }` — a step of the **architecture act**: the cues animate `diagram.json` on the narration's words (show, swap, focus, token, move, badge, camera, legend). No persona, nothing filmed; an act is either all diagram or all screen. See `references/diagram.md`. |
| `clip` | no | `{ selector, pad }` — photograph one element instead of the whole viewport. This is how a phone frame or a single panel stays readable in a printed manual. Stills only; the video always films the viewport. |
| `callout` | no | `{ value, label, caption?, max?, prefix?, suffix?, at?, ms? }` — an animated stat card over the footage (HyperFrames, `scripts/motion.mjs`): a number counts up from 0 (a string is revealed instead), `max` adds a progress track, `at` is the phrase of the narration it lands on (default 0.6 s into the line), `ms` its length (default 5000; it always ends with its scene). One or two per film, on the figures the story is about. |
| `manual` | no | `{ do: [...], expect, recover }` — presenter instructions. May instead live in `manual/notes.json` keyed by id; inline wins. |

An act's persona is inferred from its steps — the config never restates it. Keep one
persona per act; switching identity mid-act means switching browser context mid-recording.

## Actions

Every action takes an optional `settle` (milliseconds to wait afterwards, default 6000 —
these pages stream content long after `domcontentloaded`).

```jsonc
{ "type": "goto", "url": "/dashboard", "settle": 7000 }
{ "type": "goto", "url": "/dashboard", "spa": true }       // pushState — no white flash
{ "type": "nav", "route": "/shelf", "then": { … } }        // in-app move under a dynamic basename (config.spaPrefix)
{ "type": "click", "text": "Upload Transcript" }           // visible text, not exact
{ "type": "click", "selector": "[data-testid='save']" }    // or a CSS selector
{ "type": "click", "role": "button", "text": "Save", "within": "dialog" }
{ "type": "click", "text": "Approve", "toast": "approved|failed", "confirm": true }
{ "type": "type", "label": "Search", "value": "Marine Engineer", "enter": true }
{ "type": "fill", "selector": "#notes", "value": "…" }     // no typing animation
{ "type": "hover", "text": "Risk score" }
{ "type": "press", "key": "Escape" }
{ "type": "highlight", "text": "Critical Gaps", "at": "critical gaps" }   // glows as the voice says it
{ "type": "scrollTo", "text": "Environmental Compliance", "highlight": true, "at": "environmental compliance", "fallback": 600 }
{ "type": "click", "text": "Open case", "at": "open her case" }          // any action can wait for its word
{ "type": "scroll", "amount": 320, "ms": 2500 }
{ "type": "scrollTop" }
{ "type": "toast", "match": "published|failed", "timeout": 120000 }
{ "type": "waitForText", "text": "Emergency response active", "timeout": 60000 }
{ "type": "confirmDialog" }
{ "type": "wait", "ms": 2000 }
{ "type": "sequence", "steps": [ … ] }                     // several of the above, in order
{ "type": "custom" }                                       // this step's function in actions.mjs
{ "type": "custom", "fn": "releaseStock" }                 // a named one
{ "type": "custom", "fn": "ask", "question": "…" }         // extra keys reach the function as its 3rd argument
```

### `at` — put the action on its word

Any action may carry `"at"`: a phrase copied from the step's `narration` (case and punctuation
are ignored), or a number of milliseconds into the line. While a take is filmed the action
waits until the voice reaches that phrase:

- **`highlight`, `scrollTo` and `click` with `highlight`** scroll the element into view first,
  then glow on the word, and hold the glow until the voice has finished naming it plus 1.5 s
  (an explicit `ms` still wins). The reveal comes just before the word; the ring lands on it.
- **Everything else** (`click`, `scroll`, `nav`, `type`, a `sequence`) starts on the word.
- A phrase used twice resolves in order: the second `at` finds the occurrence after the first.
- In custom functions: `await ctx.cue('unpaid balance')`, or `ctx.highlight({ text: '…', at: '…' })`.

The timings come from `build/words.json`, which `narrate.py` writes from the voice engine's
word boundaries. A project voiced before that file existed falls back to an estimate from
where the phrase sits in the line (about ±0.3 s) and logs it — re-run `narrate.py`. The
capture pass ignores `at` but fails a step whose phrase is not in its narration (`CUE`), and
the recorder logs `LATE CUE` when the actions before a cue ran past its word.

Use `at` instead of guessing `settle` values to line a glow up with the voice. A sequence of
`highlight … "settle": 9000`, `highlight … "settle": 6000` drifts as soon as the line is
re-voiced or reworded; the cue moves with the words.

`nav` exists for apps whose router basename is not fixed — a preview served at
`/agent-api/preview/b/<app>/<branch>/…` changes path with every branch, so a hard-coded
`spa` URL breaks on the next deploy. Set `"spaPrefix": "^/agent-api/preview/b/[^/]+/[^/]+"`
in `demo.config.json`; `nav` reads the basename from the live URL and pushes `route` under it.

### Targeting

`selector` wins, then `role` + `text`, then `label`, then visible `text` (substring,
case-insensitive, first match). `within` scopes the search — `"within": "dialog"` means the
topmost modal, whether the app uses `[role=dialog]` or a native `<dialog>`. Prefer text: it
survives a re-deploy. Prefer `data-testid` when the copy changes more often than the code.

### What the actions do for the camera

- **`click`, `type`, `hover` and `confirmDialog` draw a pointer** — a dot and an expanding
  ring — before acting. Playwright's cursor is invisible on film, so an unannounced click
  reads as the page changing for no reason.
- **`highlight`** puts a glow ring around an element without touching it. Use it for the
  thing the narration is talking about: the number, the sentence, the warning.
- **`type` types at ~45ms a character** so it looks like someone typing rather than a cut.
  `fill` puts the value in at once, for long text nobody watches being typed.
- **`scroll` moves inner panes, not just the window.** Most apps scroll a `<main>` region;
  a wheel event on the window does nothing there. Scrolling is smooth, in 25 micro-steps.
- **`scrollTo` forces the element to the middle of the viewport.** If it never appears, it
  scrolls `fallback` pixels anyway rather than freezing the scene — a static frame under
  twenty seconds of narration reads as a broken demo.
- **`goto` with `spa: true`** pushes the route and fires `popstate` instead of reloading, so
  a single-page app re-renders in place with no white flash. Use it inside an act.
- **`toast` / `waitForText`** wait for the app, not the clock: the confirmation that the
  thing actually happened, or a background event arriving on its own.

### `then`

Any action may carry a follow-up, run after the first settles:

```jsonc
{ "type": "goto", "url": "/chat?id=abc", "settle": 9000,
  "then": { "type": "scrollTo", "text": "Missing and Emerging Roles" } }
```

That is how a saved conversation or a long report gets re-aimed: it opens scrolled to the
newest content, so a bare `goto` lands on the wrong part of the page.

## Custom steps — `actions.mjs`

Declarative steps cover a click-through. A demo that changes real state — approve, book,
accept, advance four stages each behind a confirm dialog, wait for a job — is easier to
write as code. Set `"action": { "type": "custom" }` and export a function with the step's id:

```js
export const actions = {
  b4: async (page, ctx) => {
    await ctx.click({ text: /Approve and contact/, highlight: true })
    ctx.log('approve →', await ctx.toast(/approved|failed/i, 90000))
    await ctx.sleep(2500)
  },
}
```

A custom function is called as `(page, ctx, action)`: `action` is the step's action object,
so one function can serve many steps (`{ "type": "custom", "fn": "ask", "question": "…" }`).

`ctx` carries the whole engine — `go`, `nav`, `frameText`, `goto`, `click`, `type`, `fill`, `hover`, `press`,
`scroll`, `scrollTo`, `scrollTop`, `highlight`, `pointAt`, `toast`, `waitForText`,
`confirmDialog`, `clearToasts`, `find` (a raw locator), `run` (any action above), plus
`page`, `base`, `config`, `sleep` and `log`. Anything written with `ctx` gets the pointer
and the smooth scrolling for free; raw `page` calls do not.

## Off-camera staging — `prepare`

```js
export const prepare = {
  C: async (page, ctx) => {
    await ctx.goto('/admin/demo-control', 7000)
    await ctx.click('Simulate the emergency')
    ctx.log('staged →', await ctx.toast(/complete|failed/i, 300000))
  },
}
```

`prepare[segment]` runs in a hidden browser context before that act is recorded or
captured. It is never filmed. This is what makes an act independently re-recordable: the
state the story assumes is rebuilt each time, instead of depending on the act before it
having just run.

## Timing

`narrate.py` measures each clip and writes `build/durations.json`, plus `build/words.json`
(when each word is spoken) for `at` cues. The recorder holds each
scene for the narration length plus a tail (`pacing.tailMs`, default 700ms), minus
whatever the action itself took. A slow action eats into the hold; it does not push the
voice out of sync.

A full-page `goto` loads **before** the narration clock starts — only the load: its `then`
(scroll, highlight, click) is the scene and runs under the voice. Everything else, including
`spa` and `nav` moves, runs under the voice, where seeing the page respond is the point.

**An action longer than its line is dead air.** The recorder logs
`OVERRUN <id>: … that stretch is cut from the film` and stores the silent interval on the
scene; `build.py` removes it from that act's video and moves every later voice line and
subtitle up by the same amount, so a slow agent answer arrives with a clean cut (half a second
of the change is kept). Treat the cut as a safety net, not the plan: Fix every one before
building: shorten the action, split the scene, or write a longer line. After `build.py`,
compare the film's length with the narration total plus title cards — a large difference
is silence, and it reads as a broken demo.

**Where an act starts in the footage.** Playwright films from page creation, so every raw
file opens with seconds the timeline knows nothing about. Just before each act's clock starts,
the recorder paints one full-frame magenta flash (`syncMark`) and stores `syncMs`, how long
after it the act begins. `build.py` finds the flash in the footage and starts the act there,
printing `synced on the flash (+0.50s against the estimate)`. Recordings made before the flash
existed fall back to the file's length minus `activeMs`, which lands late by up to ~2 s and
puts the picture ahead of the voice. `trimStartMs` still overrides both.
