# Writing the demo

The recording is obedience; the script is the demo. Spend the time here.

## A business demo, not a technical tour

The audience is the buyer and the people who will use it, not the builders. So:

- **Nothing technical on screen or in the voice.** No code blocks, raw JSON, workflow or agent
  IDs, system maps, confidence formulas or "envelopes". If the app shows raw JSON to its own
  users, that is a UI defect: fix the screen to render it as a readable list, then film it.
- **Say what it is worth.** Every scene ends on the value to this customer: time saved, a
  decision made faster, a mistake that cannot reach the customer's customers, money found.
  "One screen replaces the Monday spreadsheet" beats "the dashboard aggregates records".

## Explore; do not just state

A scene that arrives, says one sentence and leaves is a slide, not a demo. Use the product the
way the customer would, and let them see it answer:

- **Try things and show the result.** Filter the list to one owner, switch the status tab,
  open a record, change a chart's type, ask a follow-up question. The result on screen is the
  proof; the narration explains what just happened and why it matters.
- **Ask the assistant real questions, on camera, and wait for the answer.** The first
  question from the panel the viewer is looking at, then a follow-up typed into the chat. Ask
  for the answer as a chart when numbers are the point: a chat that answers with the app's own
  chart component (a `ua-chart` block in UnifyApps apps) is worth more than any tile. Never cut
  away before the answer has finished; scroll the chat so the answer and its chart are in view
  while you narrate them.
- **Make a real decision on camera only on purpose.** Choose the item by its content, say why it is
  the right call, and make the step rehearsal-safe (`DEMO_LIVE`, see gotchas).
- **Show the safeguard working.** Press the consequential button and show the confirmation it
  demands, then cancel, and say why that step exists. It lands harder than describing it.
- **Two or three beats per scene is normal.** Arrive, try something, show the result. Keep the
  action shorter than the line (see Pacing).

## Shape

**One subject, followed through.** A named person, order, claim or ticket that appears in
the first act and is still there in the last. "Carlos Manuel Santos, Marine Engineer" beats
"a candidate" in every scene he is mentioned. A tour of features has no ending; a story
does.

**Acts of four to six scenes**, each act one persona and one claim. An act is the unit you
can re-record, so a bad take costs five minutes, not fifty.

**One idea per scene, 20–30 seconds.** If a scene needs two ideas it needs two scenes —
the hold time is driven by the narration, so a long line just means a long stare at one
screen. Eight to twelve minutes total is a demo; twenty is a training course.

**Follow one thread through different pairs of eyes.** The strongest version of this —
the PlatformX demo — put a member, her doctor and an ambulance crew on the same event, and
cut between them as it unfolded. Each seat only shows what that person would actually see.
The claim "one live record, three roles, no handoffs" then needs no explaining.

**Change seats when the claim changes.** Switching to the interviewer, or to the customer,
proves the handoff happened without anyone emailing anyone. That is usually the moment the
room believes it.

## The words

Write for the ear:

- Short sentences. The voice needs somewhere to breathe.
- Concrete nouns and real numbers from the screen — "three point eight three out of five",
  not "a score". Say numbers as they are spoken; `edge-tts` reads digits acceptably, but
  read the clip back before shipping.
- No feature lists. "Alongside the board there is a hiring assistant" and then what it
  does, not "the platform provides AI-powered assistance with natural language".
- Name the doubt. "Here is a question no applicant tracking system can answer" earns the
  next twenty seconds. So does "the system does the reasoning — the human still decides",
  said while a person clicks the button.
- Never narrate the mechanics. Nobody needs "now I click on the menu".
- Say where the boundary is. "It describes trends. It never diagnoses." "The system does
  the recording and the reasoning; the human still decides." A demo that volunteers its own
  limits is trusted on everything else — and it is the answer to the question the room was
  going to ask anyway.
- Show a screen where the clever thing is deliberately switched off, and say why. In
  PlatformX that was the crisis screen: no AI, by design, because that is not a moment for
  suggestions. It lands harder than any feature.

**`caption`** is a label, six to nine words, on screen while you speak.
**`narration`** is what is said.
**`key`** is the one sentence that must land — what the presenter says if they only get
one line out. Write all three; they do different jobs and the runbook is thin without
`key`.

## Rhythm inside a scene

The move that made PlatformX read well is three beats long, and it is worth copying:

1. **Arrive** — navigate, let the screen settle, say what this is.
2. **Reveal** — scroll the thing being discussed to the middle of the screen.
3. **Point** — `highlight` the number, the sentence, the warning, while the narration says
   it. Give it `"at"` with the words that name it (`"at": "unpaid balance"`) so the ring lands
   on the word, not a guessed number of seconds after the scene starts.

Without step 3 the viewer is hunting the screen while the voice moves on. `scrollTo` with
`"highlight": true` is those last two beats in one action. Several things in one line: one
`highlight` per thing, each with its own `at`, in the order the line names them.

Where the app does something real — approves, books, publishes, dispatches — let the
demo wait for the app to confirm it (`toast`), and let the narration land on the
confirmation rather than on the click. The pause while it works is the proof it is working.

## Pacing

Read the script aloud with a timer before recording. `out/<slug>_Script.pdf` estimates the
length from the word count before anything is narrated and shows measured clip lengths
afterwards — it is the cheapest place to find that act III is four minutes long.

Let the slow screens be slow, but never silent. An agent answer that streams for twenty
seconds is convincing at full length, so give it a scene of its own: the asking scene's line
covers the streaming, and the next scene's line explains the answer that is now on screen.

The voice should run continuously. Keep `pacing.tailMs` short (700ms default), move in-app
rather than reloading, and fix every `OVERRUN` the recorder logs.

## Presenter instructions

The manual is written for someone who has never seen the app — a colleague in another
region presenting it next week. That means, per step: the exact address to type, the exact
thing to click, how to tell it worked, and what to do when it did not. "Navigate to the
dashboard" is not an instruction; "click in the address bar, paste this, press Enter, wait
about eight seconds — the numbers load last" is.

Mark anything that changes real data **do not click**. Say what it costs: skipping it
costs nothing, clicking it can end the demo early.

`warnings` and `qa` in the config come from rehearsal, not from imagination. The questions
that actually get asked are about whether the AI decides, where the knowledge comes from,
and whether this works on the customer's own data. Answer them honestly and point at the
beat that shows it.
