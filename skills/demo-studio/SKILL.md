---
name: demo-studio
description: Produce a narrated demo video of a web application together with its written companions — narration script, live-demo runbook, step-by-step presenter manual and a screenshot library — all generated from one steps.json. Use whenever someone asks for a demo video, a walkthrough recording, a screen recording of an app, a demo script, a presenter manual, a demo runbook, subtitles for a walkthrough, product screenshots, or "record the demo and write the documentation". Works with any web app, authenticated or public.
---

# Demo studio

> ## 🚫 HARD RULE: never delete a resource
> Anyone using this skill **must not delete anything** — no files, recordings, pages, records or
> platform objects that already exist, and nothing another person made. Overwrite only the
> artefacts this pipeline itself generated in the current run. If something has to go, say what
> and let the user remove it. Every UnifyApps skill in this set ships a `no_delete_guard.py` hook;
> see any of them for the install snippet.

One `steps.json` is the story. Everything else is generated from it: the MP4, the
subtitles, the narration script, the runbook, the manual and the screenshot library.
Change a sentence in one place and every artefact follows.

Built from two productions — PlatformX (three personas through one live emergency) and the
Fujairah Ports AI Recruitment demo (one candidate through six acts). The traps in
`references/gotchas.md` cost real takes; read them before recording, not after.

## Do this yourself

Record and write it; do not ask the person to screen-record, supply screenshots, or "try it
and tell me what you see". The only thing to ask for is a sign-in, and ask for every
sign-in **up front, by username**, so the recording then runs unattended.

**Never type a password.** `auth.mjs` opens a visible Chrome window per persona and waits
on `page.waitForURL` off `/login` with `timeout: 0`. The person types the credentials; the
saved `storageState` is reused by every later stage.

## The pipeline

```bash
node <skill-dir>/scaffold.mjs ./demo --title "AI Recruitment" --slug Acme_Recruitment_Demo
cd demo && npm install                # playwright-core + HyperFrames; Node 22+, real Chrome
                                      # plus: pip install edge-tts imageio-ffmpeg pillow
```

Then, in order:

| # | Command | Produces |
|---|---|---|
| 1 | `node scripts/auth.mjs` | `auth/<persona>.json` — one saved sign-in per persona |
| 2 | `node manual/build-script.mjs` | `out/<slug>_Script.pdf` — **get the words approved before recording** |
| 3 | `python scripts/narrate.py` | `build/audio/*.mp3`, `build/durations.json`, `build/words.json` |
| 4 | `node scripts/capture.mjs` | `build/shots/*.jpg` + a pass/fail report per step |
| 5 | `node scripts/recorder.mjs` | `build/raw/<act>/*.webm`, `build/timeline.json` |
| 6 | `python scripts/build.py` | `out/<slug>.mp4`, `out/<slug>.srt` (renders the animated title cards first) |
| 7 | `node manual/build-runbook.mjs` | `out/<slug>_Runbook.pdf` |
| 8 | `node manual/build-manual.mjs` | `out/<slug>_Manual.pdf` |
| 8b | `node manual/build-playbook.mjs` | `out/<slug>_PG_Playbook.pdf` — the Pipeline Generation playbook from `manual/playbook.json` (`references/playbook.md`) |
| 9 | `node scripts/export-shots.mjs` | `out/screenshots/` — named stills + contact sheet |

Step 4 exists to fail cheaply. **Never record until capture reports every step clean** — a
failed action in a take costs the whole act, and its screenshots are what the manual is
built from anyway. Every stage also writes `build/<stage>.log`, so a failure at minute nine
can be read afterwards instead of reconstructed.

Re-runs are surgical: `SEGMENTS=C,D node scripts/recorder.mjs` re-records two acts and
merges them into the existing timeline; `python scripts/narrate.py a3 b1` re-voices two
lines; `ONLY=recruiter node scripts/capture.mjs` re-shoots one persona.

## What you edit

**`demo.config.json`** — every project-specific fact: personas (URL, username, login and
home path, viewport, seeded browser state), act titles and goals, brand colours, voice,
caption style, title cards, and the prose that belongs to the documents. Nothing
project-specific belongs in any script. Full key reference: `references/config.md`.

**`steps.json`** — the story, one entry per scene:

```json
{
  "id": "a3", "segment": "A", "persona": "recruiter",
  "act": "Command Centre · AI brief",
  "caption": "Ask the assistant, not the spreadsheet",
  "key": "It answers about <strong>this</strong> organisation, not in generalities.",
  "narration": "Alongside the board there is a hiring assistant…",
  "action": { "type": "goto", "url": "/page-5", "settle": 6000 },
  "manual": { "do": ["…"], "expect": "…", "recover": "…" }
}
```

Actions cover `goto` (with `spa` for no-flash in-app moves), `click`, `type`, `fill`,
`hover`, `press`, `highlight`, `scroll`, `scrollTo`, `scrollTop`, `toast`, `waitForText`,
`confirmDialog`, `wait`, `sequence` and `custom` — see `references/steps-schema.md`.

**`actions.mjs`** — for what a declarative step cannot express. Anything that changes real
state (approve, book, accept, advance four stages each behind a confirm dialog, wait for a
job) is easier as code, with the engine handed to it as `ctx`. The same file holds
`prepare[segment]`: staging that runs in a hidden context before an act, so the demo data
is rebuilt off camera and any act can be re-recorded on its own.

## Writing the story

**It is a business demo.** No code, JSON, IDs or system internals on screen or in the voice;
every scene ends on what it is worth to the customer. **Explore, do not state:** try things
(filter, open, switch, ask a follow-up), show the result, explain it. Ask the assistant real
questions on camera, wait for the full answer, and ask for charts where numbers matter.
**No dead air:** move in-app (`nav`/`spa`), keep actions shorter than their line, and fix
every `OVERRUN` the recorder logs. (Maher, 2026-09-25 — see `references/authoring.md`.)

The script carries the demo; the recording is just obedience. Before writing steps, read
`references/authoring.md`. In short: one idea per scene, 20–30 seconds each, acts of 4–6
scenes, follow one named subject all the way through, and write for the ear. Inside a
scene: arrive, reveal, point — navigate, scroll the thing to the middle, then `highlight`
it while the narration names it. **Cue every highlight to its word** with `"at": "<words from
the narration>"`; never line a glow up with guessed `settle` values
(`references/steps-schema.md`, "`at`").

Say where the boundary is ("it describes trends, it never diagnoses"), and show a screen
where the clever thing is deliberately switched off. That is what made the PlatformX video
land.

Get `out/<slug>_Script.pdf` approved before recording. Re-recording because the wording
changed costs an hour; re-generating the script costs seconds.

## Two caption styles

`config.captions.style`:

- **`chip`** — a short caption bottom-left. For dense screens that are themselves the story.
- **`panel`** — the PlatformX card: act breadcrumb, headline, and the spoken sentence, with
  a scene counter. Use it when the video will be watched muted, sent round as a file, or
  played in a room with the sound down.

## Motion graphics (default)

The film's motion is rendered with **HyperFrames** (HeyGen's open-source HTML-to-video engine) by
`scripts/motion.mjs`, its moves adapted from the HyperFrames registry: the opening and act cards
**push** into each other and **focus-pull** into the act's real first screen (the film cuts onto live
footage with no seam); the last screen pulls back into a **logo-outro** closing with an optional `cta`
pill; a **lower third** names the seat when the film changes persona; and a step can carry a
**`callout`** — a count-up stat card that lands on the word naming the figure. Built from `opening`,
`acts`, `closing`, `brand` (give `brand.fontFile` for the customer's font) and the steps' `callout`s,
cached, re-rendered only when one changes. The recorder no longer films cards, so a film recorded
before this keeps its static ones until it is re-recorded; `"motion": false` brings the static cards
back. Details: `references/config.md` → Title cards.

## The architecture act (opening diagram)

A film can open with **how the solution is built**. A narrated, animated diagram shows:

- the UnifyApps building blocks the solution uses: Apps, Agents, Workflows and Data;
- the customer's systems around them, marked as built and running, simulated today (and turned over to the live
  system that replaces it at go-live), or connected at go-live;
- one scenario token travelling across the picture.

Then it cuts into the recorded demo. It is an act whose steps carry `"diagram"` cues instead of an action. It is
drawn from `diagram.json` by `scripts/diagram.mjs` and rendered by HyperFrames; the recorder skips it. Iterate on it
with `node scripts/motion.mjs --diagram`. Every node must be a fact from the build (README, platform export), and
simulated stays simulated until it is not. Read `references/diagram.md` before drawing one.

## The UnifyApps badge (always)

Every film carries **"Powered and built by UnifyApps"** in its bottom-right corner, burned in by
`build.py` on every frame (title cards included), on by default with no config. It belongs to
the video, never to the app: do not add it to the customer's screens. With the `panel` caption
the recorder lifts the panel so the badge has its own strip. Details and the opt-out
(`"badge": false`, only on request): `references/config.md` → Look and sound.

## Before you record

- Every step green in `capture.mjs`, and thin-page warnings explained.
- `prepare` hooks written for any act that depends on state, so it can stand alone.
- Demo-only admin tooling switched off in the recorded context (`localStorage` seed).
- The slowest screens opened once so they paint instantly.
- No other session open for a persona whose portal rotates its token.
- In a shared tenant, nothing the story touches belongs to someone else's work.

## Gotchas that cost takes

Full list with the reasoning: `references/gotchas.md`. The ones that recur:

- **Two personas on one origin share a cookie jar.** One browser cannot hold both — hence
  one `storageState` per persona.
- **Some portals bind the token to the browser context** that obtained it. A copied
  `storageState` is rejected outright. Use `live-record.mjs`, which signs in and records in
  one process and trims the sign-in off the front.
- **`scrollIntoViewIfNeeded` treats a one-pixel sliver as "in view"** and silently produces
  identical frames. The engine forces `block: 'center'`.
- **Most apps scroll an inner pane, not the window**, so a wheel event does nothing.
- **Narration must never play over a blank loading screen.** Full page loads happen before
  the narration clock starts; everything else runs under the voice — which is also why every
  reload is silence on the film. Reload once per act at most.
- **The film should be about as long as the narration.** Compare them after `build.py`; the
  difference is silence.
- **Wait for the app, not the clock** — `toast` and `waitForText`, not a hopeful `sleep`.
- **Glow on the word.** `at` cues each highlight to its phrase; `build.py` starts each act on the
  recorder's sync flash (it prints `synced on the flash`). A `no sync flash found` or a
  `LATE CUE` in the logs means that act's highlights are off — fix it before sending the film.
