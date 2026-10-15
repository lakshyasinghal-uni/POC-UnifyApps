# The PG Playbook (`manual/playbook.json` → `out/<slug>_PG_Playbook.pdf`)

PG means **Pipeline Generation**. The playbook is not a product tour (that is the manual) and not a presenter script
(that is the runbook). It tells a GTM team how to use the application to **create and move pipeline**: which plays to
run, when, by whom, with which screens, what to say, what comes out and what to do next. Built by
`node manual/build-playbook.mjs`, in the same look as the runbook and the manual, with the capture screenshots.

Set by Maher, 2026-10-06: "PG playbook, do it in a way it can be used to help with Pipeline Generation activities as a
playbook and also make it in our format and screenshots". In the CRO Suite a use case files three PDFs from its film
folder: the **runbook as the demo talk track**, the **manual as the user guide**, and this **PG Playbook**.

## Rules

- **Invent nothing.** Every step is something the app really does on the screen in the screenshot. No made-up win
  rates, conversion lifts, hours saved or customer stories. Results that were never measured go under `metrics` as what
  to measure and where to read it.
- **Plays, not features.** A play has a goal tied to pipeline (find, qualify, accelerate, protect, forecast), a signal
  that starts it, an owner, the steps, the output and the next step that moves a deal.
- **Business words.** No workflow names, ids or field codes. Name screens and buttons as the user sees them.
- **Screenshots.** `shot` is a step id of the film (its capture still in `build/shots/<id>.jpg`). Run capture first.
- 3–5 plays, 3–6 steps each. Every play ends on an output and a next step.

## Schema

```json
{
  "subtitle": "How AEs and SCs use it to …",
  "purpose": "One paragraph: what pipeline problem this solves and for whom.",
  "who": [{ "role": "SC", "when": "…", "how": "…" }],
  "signals": [{ "signal": "A deal reaches Show with no UCB", "where": "Missing UCB tile", "play": "Close the blueprint gap" }],
  "plays": [{
    "name": "Close the blueprint gap", "who": "SC with the AE", "stage": "Qualification → Show", "time": "10 minutes",
    "goal": "…", "when": "…",
    "steps": [{ "title": "Open the gap list", "do": "…", "see": "…", "say": "…", "tip": "…", "shot": "a3" }],
    "output": "…", "next": "…", "measure": "…"
  }],
  "messages": [{ "audience": "Prospect's CIO", "line": "…" }],
  "objections": [{ "q": "…", "a": "…" }],
  "metrics": [{ "name": "…", "how": "…", "source": "…" }],
  "cadence": [{ "when": "Monday", "who": "AE", "what": "…" }],
  "limits": ["…"],
  "resources": ["The walkthrough film and the runbook in the CRO Suite use case page"]
}
```
