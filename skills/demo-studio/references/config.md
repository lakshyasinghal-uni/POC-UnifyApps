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
    "login":  "/login?returnTo=%2F",           // where auth.mjs starts
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

## Acts

Optional. Keys are the `segment` values in `steps.json`; the numbering and order come from
the order the acts first appear.

```jsonc
"acts": {
  "A": { "n": "I",                                    // defaults to I, II, III…
         "title": "The roles you did not know you were missing",
         "heading": "…",                              // title card text, if different
         "goal": "Establish that this is a strategist, not a form." }
}
```

## Look and sound

```jsonc
"brand": { "ink": "#0d1a33", "accent": "#d6a04a", "muted": "#9fb0c9",
           "font": "\"Segoe UI\", system-ui, sans-serif",
           "logo": "brand/customer-logo.png" },   // optional: on every title card and document cover
"voice": { "name": "en-GB-SoniaNeural", "rate": "-4%" },
"viewport": { "width": 1440, "height": 900 },
"subtitleWidth": 42,
"captions": { "style": "chip" },      // "chip" (quiet, bottom-left) or "panel" (act + title
                                      // + the spoken line, so it reads with the sound off)
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

`ink` and `accent` are used everywhere at once: title cards, the caption chip, the pointer
ring, the PDF covers and the act bars. One pair of colours makes all four artefacts look
like one production. Voices: `edge-tts --list-voices`.

## Title cards

```jsonc
"opening": { "heading": "AI Recruitment & Onboarding", "sub": "Port of Fujairah" },
"closing": { "heading": "One pipeline. Three people. No handoffs.", "sub": "UnifyApps" }
```

Set `"closing": null` to end on the last scene instead.

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
