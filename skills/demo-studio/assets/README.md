# <demo name>

Produces a narrated MP4 walkthrough, a narration script, a live-demo runbook and a
step-by-step presenter manual — all from one `steps.json`, so editing the story updates
every artefact.

| File | What it is |
|---|---|
| `out/<slug>.mp4` | Narrated walkthrough with captions and title cards |
| `out/<slug>.srt` | Subtitles, timed to the narration |
| `out/<slug>_Script.pdf` | The words, act by act — send this for sign-off before recording |
| `out/<slug>_Runbook.pdf` | One sheet to present live from: beats, key lines, traps, likely questions |
| `out/<slug>_Manual.pdf` | Literal step-by-step manual with a screenshot per scene |
| `out/screenshots/` | Every still under a readable name, plus a contact sheet |

## Running it

Sessions are captured once and reused, so the recording itself is unattended.

```bash
npm install
node scripts/auth.mjs          # opens Chrome once per persona; you sign in, it saves the sessions
node manual/build-script.mjs   # the narration script — review the words BEFORE recording
python scripts/narrate.py      # edge-tts → build/audio/*.mp3 + durations.json + words.json (for `at` cues)
node scripts/capture.mjs       # dry run: validates every step, writes build/shots for the manual
node scripts/recorder.mjs      # records build/raw/<act>/*.webm + build/timeline.json
python scripts/build.py        # muxes narration, concatenates → out/<slug>.mp4 + .srt
node manual/build-runbook.mjs  # one-sheet runbook
node manual/build-manual.mjs   # shots + script + notes → manual PDF
node scripts/export-shots.mjs  # the screenshot library
```

Useful environment variables:

- `ONLY=candidate FORCE=1 node scripts/auth.mjs` — re-capture one persona's session
- `SEGMENTS=C,D node scripts/recorder.mjs` — re-record specific acts; `timeline.json` merges
- `ONLY=interviewer node scripts/capture.mjs` — re-shoot one persona's stills
- `python scripts/narrate.py a3 b1` — re-voice single steps
- `SEGMENTS=E PERSONA=candidate node scripts/live-record.mjs` — for a portal whose token
  will not survive being copied into a fresh browser context

Every stage writes `build/<stage>.log`. Read that before re-running anything.

## Where things live

```
demo.config.json   every project-specific fact: URLs, personas, brand, act titles, document copy
steps.json         the story: one entry per scene — caption, narration, key line, action, manual notes
actions.mjs        custom steps (real Playwright) and per-act off-camera staging
manual/notes.json  longer presenter instructions, if you would rather keep them out of steps.json
auth/              saved sign-ins (git-ignored, never commit)
build/             audio, raw footage, stills, timings (git-ignored)
out/               the deliverables
```

## Prerequisites

- Node with `playwright-core` (`npm install`) and a real Chrome on the machine
- Python with `edge-tts` and `imageio-ffmpeg` (`pip install edge-tts imageio-ffmpeg`)
