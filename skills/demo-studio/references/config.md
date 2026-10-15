# demo.config.json — every key

The one file that knows anything about this particular demo. If you find yourself editing
a script under `scripts/` or `manual/` to change a URL, a name, a colour or a title,
the change belongs here instead.

## Identity

```jsonc
"title":    "AI Recruitment & Onboarding",     // title card, every cover page
"subtitle": "Port of Fujairah · built on UnifyApps",
"slug":     "Fujairah_Ports_AI_Recruitment_Demo",  // names out/<slug>.mp4, _Script.pdf, …
"locale":   "en-GB"                            // date format on the documents (optional)
```

## Personas

One per identity the demo signs in as. The key (`recruiter`) is what `steps.json`
references.

```jsonc
"personas": {
  "recruiter": {
    "label":  "Recruiter",                     // shown in documents
    "user":   "tanay",                         // username to ask for — never a password
    "base":   "https://app.example.com",       // origin; step urls are appended to it
    "login":  "/login?returnTo=%2F",           // where auth.mjs starts: a path, or a full URL on the same host
                                               // (a builder preview: the platform's /login?returnTo=<preview path>)
    "home":   "/candidate_pipeline_dashboard", // where each recording starts
    "homeWaitText": "Edges ·",                 // optional: wait for this text before an act is filmed (slow canvases)
    "homeSettleMs": 5000,                      // optional: settle after home loads (default 7000 record, 6000 capture)
    "colour": "#24406e",                       // this persona's bar in the runbook
    "window": "Window 1",                      // defaults to Window 1, 2, 3… in order
    "note":   "Acts I, II and IV. Keep open throughout.",   // runbook card footnote
    "auth":   true,                            // false for a public site: no sign-in at all
    "viewport": { "width": 420, "height": 860 },            // a phone-sized persona
    "permissions": ["clipboard-read", "clipboard-write"],
    "localStorage": { "app-ui": { "demoAdmin": false, "language": "en" } },
    "sessionStorage": { }
  }
}
```

**A second persona for a second screen of the same account.** A scene on a slow page in another part of
the product (a graph canvas that takes 20 s to draw) would be silent footage mid-act. Give it its own act
and its own persona with the same `user`, `home` set to that page and `homeWaitText` set to text that only
appears once it has painted; the load then happens before filming and is trimmed. Copy the first persona's
`auth/<id>.json` to the new id (same origin, same session). (A student-lifecycle demo film, 2026-09-25.)

`auth: false` makes the whole pipeline work against a public site with no sign-in —
useful for documentation walkthroughs and for rehearsing the pipeline itself.

`localStorage` and `sessionStorage` are seeded through `addInitScript`, so they are in
place before the app boots rather than being applied visibly afterwards. This is how you
turn off the demo-admin tooling that must not appear on camera, fix a language, or start
every act with the sidebar open. Objects are JSON-stringified; strings are stored as-is.

**`session`** — the name of another persona whose saved sign-in this one uses
(`"session": "builder"`). Use it when several personas are views of one account, and above all
when the film **writes** on camera (decides, publishes, approves): every such persona must film
as the account that owns the build, never as someone's personal account. `auth.mjs` captures
only the persona that owns the session.

## Acts

Optional. Keys are the `segment` values in `steps.json`; the numbering and order come from
the order the acts first appear.

```jsonc
"acts": {
  "A": { "n": "I",                                    // defaults to I, II, III…
         "title": "The roles you did not know you were missing",
         "heading": "…",                              // title card text, if different
         "goal": "Establish that this is a strategist, not a form." },
  "F": { "n": "I", "title": "…", "card": false }     // continues act I without a title card
}
```

**Screens that load slowly after an in-app move get their own act.** A screen whose data takes 6–15 s to arrive
after `nav` makes every `at` cue in that scene land late (the ring waits for the element), and no settle or
wording fixes it. Give the scene its own act and persona whose `home` is that screen and whose `homeWaitText`
appears only once its data has landed: it then loads before filming, and the load is trimmed. Set `"card": false`
and the same `n` on that act so the film does not grow an extra title card. (MCIT Control Tower film, 2026-09-29:
late cues of 6–15 s on four scenes fell to one of 0.8 s.)

**The architecture act** (`references/diagram.md`) is an act like the others: give it a `title` (its card) and
a `kicker` (the small line above each headline in the diagram). It is usually the first act, so the opening card
hands straight into it.

## Look and sound

```jsonc
"brand": { "ink": "#0d1a33", "accent": "#d6a04a", "muted": "#9fb0c9",
           "font": "\"Segoe UI\", system-ui, sans-serif",
           "logo": "brand/customer-logo.png",     // optional: on every title card and document cover
           "fontFile": "brand/Customer-Semibold.woff2" },   // optional: the font file for `font`, for the animated cards
"voice": { "name": "en-GB-SoniaNeural", "rate": "-4%" },
"viewport": { "width": 1440, "height": 900 },
"subtitleWidth": 42,
"captions": { "style": "chip" },      // "chip" (quiet, bottom-left) or "panel" (act + title
                                      // + the spoken line, so it reads with the sound off)
"badge": { "text": "Powered and built by", "position": "bottom-right" },   // on by default; see below
"overlaySelectors": [".consent-banner .dismiss"],   // extra things to click away
"toastSelector": "[data-sonner-toast]",             // what this app's confirmations look like
"dialogSelector": "[role=dialog], dialog[open]",    // what its modals look like
"scrollContainers": "main, main *",                 // which panes `scroll` should move
"spaPrefix": "^/agent-api/preview/b/[^/]+/[^/]+",    // router basename read from the live URL, for `nav`
"pacing": {
  "tailMs": 700,             // silence held after each narration line (keep it short)
  "narrationLeadMs": 300,    // gap between a scene starting and its line playing; the recorder and
                             // build.py both read it (build.py used to assume 400 — see gotchas)
  "cueLeadMs": 250,          // an `at` cue fires this much before its word, so the glow is up as it is said
  "openingHoldMs": 5000,
  "actHoldMs": 3400,
  "closingHoldMs": 7000
}
```

Set `captions.style` to `"panel"` when the demo will be watched muted, sent round as a
file, or played in a room with the sound down — it puts the act, the headline and the
spoken sentence on screen. Keep `"chip"` when the screen itself is dense and the caption
should stay out of the way.

`logo` (a path relative to the demo project) is inlined as a data URI onto the title cards
(large on the opening and closing cards, small on act cards) and onto the manual, script and
runbook covers. All of them sit on `ink`, so use the version of the customer's logo drawn for a
dark ground, taken from their own site; never redraw or recolour it. Use **the same file the
app build already had confirmed** by the user (`app/public/brand/`, see `unifyapps-apps`
`references/customer-logo.md`); if there is none yet, show the user the logo and get a yes before
the first render.

**The UnifyApps badge — on every film, by default** (Maher, 2026-09-30). `build.py` burns a
cream pill reading "Powered and built by" + the UnifyApps logo (`brand/unifyapps-logo.png`,
copied in by the scaffold; the official gold horizontal logo, never redrawn or recoloured) into
every frame of every act, title cards included. It is on the **video only, never in the app**:
the app stays the customer's. Its height is 3.6 % of the frame (32 px at 900) with a 1.2 %
margin; with the `panel` caption the recorder lifts the panel to `bottom: 58px` so the badge
has its own strip and never overlaps the card. Omit the key to get the default; restyle with
`{"text", "position"}` (`bottom-right` · `bottom-left` · `top-right` · `top-left` ·
`bottom-center`); `"badge": false` only when Maher asks for a film without it.

`ink` and `accent` are used everywhere at once: title cards, the caption chip, the pointer
ring, the PDF covers and the act bars. One pair of colours makes all four artefacts look
like one production. Voices: `edge-tts --list-voices`.

## Title cards

```jsonc
"opening": { "heading": "AI Recruitment & Onboarding", "sub": "Port of Fujairah" },
"closing": { "heading": "One pipeline. Three people. No handoffs.", "sub": "UnifyApps",
             "cta": "unifyapps.com" },            // optional: a pill under the closing line
"motion": { "engine": "hyperframes",             // the default. false = the old static cards, nothing else
            "seat": true,                        // lower third when the film changes seats (default on)
            "seatKicker": "Seen by" }            // the word above the persona's label
```

Set `"closing": null` to end on the last scene instead.

**The film's motion graphics are HyperFrames clips, by default** (Maher, 2026-10-03). `scripts/motion.mjs`
writes each one as a small HyperFrames project (HeyGen's open-source HTML-to-video engine, Apache 2.0,
installed by `npm install`) and renders it; `build.py` extracts each act's first and last frame, runs it,
and joins everything. The moves are adapted from the HyperFrames registry and its transitions guide
(corporate grammar: push and focus pull, the transition is the exit, only the final scene fades out):

| Clip | What the viewer sees | Registry source |
|---|---|---|
| `head_<act>` | opening card (first act) → **push** → act card (kicker, word-by-word heading, act-of-N bars) → **focus pull** into the act's real first screen; the film then cuts onto live footage with no seam. A later act's card **starts on the previous act's last screen** and pulls back from it, so the whole film has no hard cut | transitions guide, `titlecard-reveal` |
| `tail_<act>` | the last screen **pulls back** and blurs into the closing lockup: logo slides in, overshoots, glow blooms; heading, sub, optional `cta` pill; ends on a clean `ink` field | `logo-outro`, `cta-lockup` |
| `seat_<act>` | a lower third over the footage (transparent): kicker + the persona's `label` on an ink panel, 4.2 s, when the act's persona differs from the previous act's (and on the first act) | `lt-kicker-name` moves on `lt-dark-card` |
| `callout_<step>` | a stat card over the footage (transparent), top right: the figure **counts up** (track fills if `max`), label, caption — **on the word that names it**, gone when its scene ends | `mk-progress-stat`, `count-up` |

**Arabic films** (`captions.rtl: true`): the clips are laid out right to left — the lower third sits on the
right, the callout on the left, fills and act bars run from the right — and nothing is letter-spaced or
upper-cased (tracking breaks joined Arabic letters). The seat kicker is copy: an Arabic film shows only the
persona's label unless `motion.seatKicker` gives the Arabic word. Proven on the SZGMC Arabic config.

Callouts are opt-in per step (`"callout"` in steps.json, see `references/steps-schema.md`) — use them for
the one or two figures a scene is about, never on every scene. A phone (`framed`) act gets dissolves and no
overlays: ffmpeg composes it into the film frame after the fact.

- **The cards are not filmed.** With motion on, the recorder skips the in-page cards, so each act
  is shorter on the raw footage and `timeline.json` marks it `"cards": "film"`. An act recorded
  before this (or with `"motion": false`) has its static card baked in and gets no second one, no seat
  and no callouts. Switching an existing film over means re-recording it.
- **Cached.** A clip re-renders only when its text, colours, size, logo, font or boundary frame change;
  15–40 s each on a desktop CPU. `node scripts/motion.mjs` renders them alone (cards then end on their own
  frame and dissolve, because the act frames come from the build).
- **Fonts.** The render browser draws only fonts the composition ships. Without `fontFile` the
  clips fall back to a default sans; give the customer's font file (the weight used for
  headings, ~600) to match the app.
- **FFmpeg.** HyperFrames needs ffmpeg and ffprobe: a system install on `PATH` wins, else the
  `ffmpeg-static`/`ffprobe-static` copies `npm install` brought. Overlays render as ProRes 4444 `.mov`
  (alpha). Its anonymous telemetry is switched off for every render (`HYPERFRAMES_NO_TELEMETRY=1`), so
  customer titles never leave the machine.
- **Node 22 or newer** (HyperFrames' own requirement). `npx hyperframes doctor` diagnoses a
  render that fails; `build/motion.log` has the output.
- **More of the catalog.** `npx hyperframes catalog --query "<the move in plain English>"` searches 386
  blocks and components locally. Most are social-media styles; take a move only where a business film
  earns it, adapt it to `brand`, and add it to `motion.mjs` rather than to one project.

## Document copy

The prose the generators cannot invent. Every string may contain `{{personaId}}`, which
expands to that persona's base URL, and light inline HTML (`<b>`, `<code>`, `<br>`).

```jsonc
"manual": {
  "kicker": "Demonstration Manual",
  "blurb":  "…",                 // the paragraph on the cover
  "before": "…",                 // replaces the default "you need N browser windows" note
  "setup":  [ { "title": "Window 1 — sign in as the recruiter", "steps": ["…"] } ],
  "warnings": ["…"],             // "The things that go wrong"
  "warningsTitle": "The four things that go wrong",
  "warmup": "…",
  "story":  "…"
},
"runbook": {
  "warnings": ["…"],
  "qa": [ { "q": "\"Is the AI making the decision?\"", "a": "No. It scores and recommends…" } ],
  "ifItBreaks": "…"
}
```

`manual.setup` is generated from the personas when omitted — one window per persona, the
second and later ones incognito. Write it by hand when the order matters, e.g. when one
portal must not be signed into until halfway through.

Write `warnings` and `qa` from what actually happened in rehearsal. They are the part of
these documents a presenter re-reads; invented ones are worse than none.
