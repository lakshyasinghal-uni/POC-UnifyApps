# Traps, and why the code is shaped the way it is

Each of these cost a take or a day. The pipeline already handles them; this is here so the
handling is not "fixed" away by someone who has not hit them yet.

## Sessions

**Two personas on one origin share a cookie jar.** Sign in as the second and the first is
silently replaced — it reads as a failed login. This is why `auth.mjs` captures one
`storageState` per persona and the recorder opens one browser context per act, and why the
manual insists on a private window for the second sign-in.

**Some portals bind the access token to the context that obtained it.** A `storageState`
copied into a fresh context comes back as a 401 on the first API call and a redirect to
`/login`. This is not expiry, so recording faster does not help. Use
`live-record.mjs` for that persona: it signs in and records in one process, reports how
long the acts ran, and `build.py` trims the sign-in off the front — so an unhurried
sign-in costs nothing.

**A second open session elsewhere invalidates the saved one** on portals that rotate
tokens. Before recording, close every other window signed in as that persona. Record the
fragile persona first, while its session is newest.

**The recorder checks for a dead session before it films.** If the landing URL is a login
page it aborts the act with the exact command to re-capture, rather than recording six
minutes of a login screen.

## State

**Stage each act off camera.** `prepare[segment]` in `actions.mjs` runs in a hidden context
before the act is filmed: reset the data, approve the thing the story says happened last
week, fire the event the story is about to react to. Without it, act four only works if
acts one to three have just run, and a single bad take costs the whole demo.

**Carry the app's own state forward, not the cookies.** Between acts played by the same
persona, the recorder keeps the origin state (whatever the app accumulated — a dismissed
hint, a conversation, a counter) and keeps the *saved* cookies. A context that was handed a
rotated token would otherwise pass a dead session to the next act.

**Never remove a node the app owns.** The engine used to clear leftover toasts with
`el.remove()`. When the toast's own timer fired, React tried to remove the same `<li>`,
found it gone, and the whole page fell to the error screen ("Failed to execute
'removeChild' on 'Node'"). It looked exactly like an app bug and cost two rehearsals on the
SZGMC Hijri Calendar film (2026-10-02). The app never crashed by hand. `clearToasts` now hides
toasts (`display: none`). Any custom step that tidies the screen should hide, not remove; the
engine's own overlays (`ds-*`) are the only nodes it may remove. If a page crashes only under
the recorder, suspect the engine first.

**`ctx.click` settles for six seconds by default — longer than a toast lives.** In a custom
step that clicks and then waits for the confirmation toast, pass a short settle
(`ctx.click({ text: 'Publish', settle: 300 })`), or the toast has come and gone before
`ctx.toast` starts looking and the step reports `TIMEOUT` although the action worked.

**Hide the demo tooling on camera.** If the app has a demo-control or admin panel used for
staging, turn it off in the recorded context through the persona's `localStorage` seed. The
customer should never see the levers being pulled.

## Silence on the film

**Every silent second has a cause, and three causes cover almost all of it** (a multi-agent
operations demo film, 2026-09-25: an 11:17 film carrying 6:36 of narration).

- **Full page loads.** A `goto` waits for the page before the voice starts, so twenty scenes
  with an 8-second settle each is nearly three minutes of silence. Move in-app (`nav`, `spa`,
  or click the app's own navigation) for every scene after the first of an act.
- **Work done before the voice.** The engine used to run a `goto`'s `then` (scroll, highlight)
  before the narration clock too; it now runs under the voice. Do not reintroduce it with a
  custom step that does all its work up front.
- **Actions longer than the line.** (The build now cuts a logged overrun out of the film automatically; an
  agent answer that takes 10 s on one take and 46 s on the next cannot be covered by wording alone.) A chat answer that takes 30 seconds under a 15-second line
  leaves 15 seconds of nothing. Split it: one scene asks (the line covers the streaming), the
  next scene shows and explains the answer. The recorder now logs `OVERRUN` for each one.

**A capture pass is not a dry run.** `capture.mjs` performs every action, so a step that clicks
"Confirm", "Approve" or "Accept" records a real decision on every rehearsal, on whatever item happens
to be first in the list (the same film, 2026-09-25: a rehearsal confirmed an unrelated inbox item).
Make such steps rehearsal-safe: a custom function that points at the control and only clicks when
`process.env.DEMO_LIVE === '1'`, and record with `DEMO_LIVE=1 node scripts/recorder.mjs`. Pick the
item deliberately (by its text), never "the first button on the page".

## Chat panels (a student-lifecycle graph demo film, 2026-09-25)

**A finished-answer marker can be a status line that never goes away.** The UnifyApps copilot island keeps
"Response has been generated" at the bottom of the chat, so "the marker appears after my question" is true
at once and the scene moved on 10 seconds into a 40-second answer. Wait instead for the text after the
question to stop changing for 3 s, with no "Assembling / Generating" in it, and a new chart (or a real
answer's worth of text).

**The chat reopens the user's last conversation.** A count of answers or charts taken before the panel
opens is wrong once it opens. Anchor on the question text (`lastIndexOf`) and look only after it.

**A "new chat" reset costs 10 seconds of the line.** Opening the panel, pressing New chat and closing it
again before a chart's ask button pushed the question 16 s into the scene and overran it. Skip the reset
when the detection is anchored on the question.

**A slow answer gets its own narrated scene.** Ask (the line covers the typing and the first seconds),
then a "while it works" scene whose action waits no longer than its own line, then the scene that explains
the answer. Say what the agent is doing in that middle scene; it is the best moment to explain governance.

**Several buttons share an accessible name.** `button[aria-label="Close"]` matched a hidden toast close
first, so the panel stayed open and covered the next click. Use `:visible`.

**Search boxes remember the last query.** Typing appended to it ("Sarah MitchellSarah Mitchell"). Clear the
field (`fill` with `""`) before a `type`.

**Icon buttons are often named by `title`, not `aria-label`.** Playwright's accessible name finds them;
a CSS `[aria-label=…]` does not. Prefer the class or `[title=…]`.

## Maps and custom steps (a supplier-risk demo film, 2026-09-25)

**Points on a map overlap, so a real mouse click can land on a neighbour.** Two suppliers in the same country
stacked; `page.mouse.click` at the right coordinates opened the bigger point's supplier. Find the element by
its SVG `<title>` in `page.evaluate` (a CSS `:has(title:text-…)` selector matches nothing, a `<title>` is not
rendered text), mark it with a data attribute, draw the pointer at its centre, then `locator.dispatchEvent('click')`.

**`actions.mjs` must not import from `scripts/`.** `lib.mjs` imports `project.mjs`, which imports
`actions.mjs`: a circular import that deadlocks at start-up with only "unsettled top-level await" on screen
and no steps run. Copy the small helper you need (a pointer dot) into `actions.mjs` instead.

**A row matched by a name can be the wrong row.** "Quandong Registry" also appeared as another plan's
substitute, so `tr:has-text(name)` opened that plan. Match the record's own code (`tr:has-text("CP-023")`).

**Search a full name, not a stem.** "Quandong" matched every supplier with that word in it; the story needs
"Quandong Registry". And clear the box first (`fill ""`): the search kept the previous run's text.

**Check each claim in the narration against the capture still before recording.** A line said the review
pack cited the recent signals; that pack's summary talked about SLAs and complaints. Rewrite the line to what
the screen actually shows, or it is an invented claim on film.

## Motion on screen

**`scrollIntoViewIfNeeded` treats a one-pixel sliver at the viewport edge as "in view".**
It silently produced four identical frames in one production. `scrollTo` forces
`scrollIntoView({ block: 'center', behavior: 'smooth' })` instead.

**An element that never appears must not freeze the scene.** A static frame under twenty
seconds of narration reads as a broken demo, so `scrollTo` falls back to a blind scroll and
logs it.

**Most apps scroll an inner pane, not the window.** A wheel event on the window does
nothing when the content lives in a scrolling `<main>`. `scroll` walks every scrollable
region and moves whichever one can move, in 25 micro-steps so it reads as a hand scrolling
rather than a jump.

**A full page load shows a white frame.** Inside an act, prefer `"spa": true`, which pushes
the route and fires `popstate` so the app re-renders in place. Between acts, or after a
dialog has gone wrong, use a real load — see the pointer-events trap below.

**Playwright's cursor is invisible on film.** A click with no cursor reads as the page
changing for no reason. `click`, `type` and `hover` draw a dot and an expanding ring at the
target first, then act — cause before effect.

**Narration must never play over a blank page.** `goto` runs before the narration clock
starts; only clicks and scrolls run under the voice.

**Chat-style apps keep the last draft in the composer**, which contradicts whatever the
narration is saying. `clearOverlays` clears it with real keystrokes so React's state
follows — and never presses Enter.

**The caption chip gets repainted away** by apps that re-render after an interaction, so it
is re-applied after each action.

**A glow beats a click for things nobody touches.** `highlight` rings the number or the
sentence the narration is about. It is the difference between "somewhere on this screen"
and "that line, there".

**Wait for the app, not the clock.** `toast` waits for the confirmation the action really
happened and logs what it said; `waitForText` waits for something the app does on its own.
A fixed `sleep` that is long enough on a good day is a take lost on a bad one.

**A modal may be a native `<dialog>`.** `[role=dialog]` is a CSS attribute match and does
not see an implicit role, which silently cost a step during this skill's own smoke test.
`confirmDialog` and `within: "dialog"` cover both; `config.dialogSelector` overrides it.

**A dialog that fails to close can freeze the rest of the run.** Some component libraries
leave `pointer-events: none` on the page body after a modal, and a single-page app carries
that state across `pushState` navigation — screenshots still work, but every click and
visibility check times out afterwards. That is why the capture pass navigates with real
page loads: each step gets a clean tree.

## Audio and assembly

**A highlight must be cued to its word, not timed with `settle`** (a student-lifecycle demo film,
2026-09-25: glows ran visibly ahead of or behind the voice). Three causes, all fixed in the engine:

- *Guessed delays.* Scenes lined up three highlights with `settle: 9000`, `settle: 6000`… — a
  guess at when the voice would reach each number, wrong as soon as the line was re-voiced.
  Use `"at": "<words from the line>"`: `narrate.py` keeps each word's time (`build/words.json`)
  and the action waits for it.
- *The act started late in the footage.* `build.py` found each act's start as the file's length
  minus how long the act ran, but Playwright keeps filming for a variable stretch after the act
  (closing the context, flushing the file). Measured on that film against the act title card, the
  real start was 0.1–1.8 s earlier in every act, so the picture ran ahead of the voice by a
  different amount per act. The recorder now paints a magenta sync flash; `build.py` starts
  the act from it and prints how far off the estimate was.
- *Two defaults for one number.* The recorder took `narrationLeadMs` as 300 ms, `build.py` as
  400 ms, so every line played 100 ms later than the recorder believed. Both read 300 now.

Measured on a test take after the fix: each glow reached half brightness 20–50 ms after its
word began (one video frame).

**Narration length drives the hold, not the other way round.** The recorder holds each
scene for its clip length plus `tailMs`, minus the time the action already took. A slow
click eats the hold; it does not push the voice out of sync.

**Acts are muxed separately, then concatenated with `-c copy`.** Every act must therefore
be encoded identically — same codec, rate and pixel format. Change the encoder settings in
`build.py` and change them for every act, or the concat will silently desync.

**Deleting a step leaves an orphan mp3.** `narrate.py` prunes `durations.json` to the steps
that still exist. Delete the audio file yourself if it bothers you; nothing reads it.

## Documents

**A PDF open in a viewer is locked on Windows.** `renderPdf` writes a timestamped file
beside it rather than failing a build that took ten minutes to reach.

**Clear the toasts before the shot.** A confirmation from the previous action outlives it
by several seconds and lands in the next screenshot, where it makes no sense. The capture
pass removes them first.

**Screenshots come from the capture pass, not the video.** That is the point of running
capture before recording: the stills are validated and reusable, and a re-shoot of one
persona is a minute rather than a re-record.

**Print with the light theme forced.** `renderPdf` calls `emulateMedia({ media: 'print',
colorScheme: 'light' })` and sets `data-theme="light"`, so a machine in dark mode does not
produce a PDF nobody can read on paper.

**Generate the script document before recording.** Changing wording after a take means
re-recording the act; changing it before means re-running `narrate.py`.

## Shared tenants

In a shared environment, the demo is a guest. Do not change objects, records or settings
that belong to someone else's work, and rehearse destructive steps (accepting an offer,
submitting a form) only where the state resets — or leave them out of the recording and
mark them **do not click** in the manual.

**Waiting for a copilot answer: use the "Copy message" button, not the status line.** (GSPC Knowledge Hub film,
2026-10-04.) In the UnifyApps copilot island, "Response has been generated" flashes between tool calls mid-answer and
the "Thinking… / Executing tool" lines stay in the transcript afterwards, so neither text nor a count of either is a
signal: a wait that trusted them ended after 7 s, the next question was typed while the agent was still answering, sat
unsent, and the one after was typed into the same box. Reliable: a finished answer adds a `button[aria-label="Copy
message"]`, and `button[aria-label="Stop generating response"]` is present only while one is written. Wait for
copies > before && no Stop button, and before typing wait for the Stop button to go and clear the composer.
