// The live demo runbook — what you present from. Every beat with its screenshot, what to do,
// what to say (the point, then the full line), what you should see and how to recover; the
// setup, the traps and the answers to the questions that always come. Complete, not a
// one-line table (Maher, 2026-09-25: "it should be full").
//
// `key` on a step is the one sentence that must land in that scene. Without it the
// caption is used, which is usually too thin to present from — write the keys.
import { steps, bySegment, actMeta, personaOf, BUILD, DIAGRAM_SEAT } from '../scripts/config.mjs'
import { config, BRAND, esc, escAll, fill, notesFor, shot, today, css, renderPdf, fs, path, logoTag } from './doc-kit.mjs'

// documentGuard — these documents go to customers: refuse to print template placeholders or a personal
// account. persona.user is printed as "Sign in as …", so it must be a role ("your own UnifyApps account"),
// never an email address (an earlier demo film, 2026-09-25: a personal email and REPLACE ME text reached the manual).
if (JSON.stringify(config).includes('REPLACE ME')) throw new Error('demo.config.json still has REPLACE ME text: fill manual/runbook before building documents')
for (const p of Object.values(config.personas)) if (/@/.test(String(p.user))) throw new Error('persona ' + p.id + ': user looks like an email address; documents print it — describe the account instead')

const r = config.runbook ?? {}

// Usable before anything has been narrated: fall back to the word count at roughly the
// speaking rate narrate.py produces, so the runbook can be reviewed early.
const durationsFile = path.join(BUILD, 'durations.json')
const DUR = fs.existsSync(durationsFile) ? JSON.parse(fs.readFileSync(durationsFile, 'utf-8')) : {}
const secondsFor = (step) => DUR[step.id] ?? (step.narration.trim().split(/\s+/).length / 155) * 60
const groups = bySegment()
const mm = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

function action(step) {
  if (step.diagram) return { verb: 'Show', what: 'the architecture picture (play the opening of the film, or show its still) and say the line' }
  const a = step.action
  if (a.type === 'goto') return { verb: 'Open', what: a.url }
  if (a.type === 'click') return { verb: 'Click', what: a.text ?? a.selector }
  if (a.type === 'type') return { verb: 'Type', what: a.value }
  if (a.type === 'hover') return { verb: 'Hover', what: a.text ?? a.selector }
  if (a.type === 'scrollTo') return { verb: 'Scroll to', what: a.text ?? a.selector }
  if (a.type === 'scroll') return { verb: 'Scroll', what: 'down the page' }
  return { verb: 'Hold', what: 'the frame' }
}

let n = 0
let runningSec = 0

const acts = Object.entries(groups).map(([segment, segSteps]) => {
  const act = actMeta(segment)
  const p = config.personas[personaOf(segment)] ?? DIAGRAM_SEAT
  // Demo pace, not video pace: four seconds a beat for the click and the pause.
  const actSec = segSteps.reduce((t, s) => t + secondsFor(s) + 4, 0)
  const startAt = runningSec
  runningSec += actSec

  const rows = segSteps.map((step) => {
    n += 1
    const a = action(step)
    const note = notesFor(step)
    const img = shot(step.id)
    const doing = (note.do ?? []).length ? note.do : [`${a.verb} ${a.what ?? ''}`]
    return `<div class="beat">
      <div class="beat-head"><span class="n">${n}</span><span class="cap">${escAll(step.caption)}</span><span class="t">~${mm(secondsFor(step) + 4)}</span></div>
      <div class="beat-body">
        ${img ? `<img alt="" src="${img}">` : ''}
        <div class="cols">
          <div><div class="lbl">Do this</div><ol>${doing.map((d) => `<li>${fill(esc(d))}</li>`).join('')}</ol>
            ${note.expect ? `<div class="lbl">You should see</div><p>${fill(esc(note.expect))}</p>` : ''}
            ${note.recover ? `<div class="lbl warnl">If it doesn't</div><p>${fill(esc(note.recover))}</p>` : ''}</div>
          <div><div class="lbl">Say this</div><p class="keyl">${step.key ? fill(esc(step.key)) : escAll(step.caption)}</p>
            <p class="full">${escAll(step.narration)}</p></div>
        </div>
      </div>
    </div>`
  }).join('')

  return `
  <div class="act">
    <div class="act-bar" style="background:${p.colour}">
      <span class="act-no">ACT ${escAll(act.n)}</span>
      <span class="act-title">${escAll(act.title)}</span>
      <span class="act-meta">${escAll(p.label)} · ~${mm(actSec)} · from ${mm(startAt)}</span>
    </div>
    ${act.goal ? `<div class="goal"><strong>Goal:</strong> ${escAll(act.goal)}</div>` : ''}
    ${rows}
  </div>`
}).join('')

const cards = Object.values(config.personas).map((p, i) => `
  <div class="card">
    <h3>${i + 1} · ${escAll(p.label)}</h3>
    <p><strong>${escAll(p.user)}</strong></p>
    <p><code>${escAll(p.base)}</code></p>
    <p style="color:#48576e">${escAll(p.note ?? `${p.window}. Keep it open throughout.`)}</p>
  </div>`).join('')

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escAll(config.title)} — Live Demo Runbook</title>
<style>
  @page { size: A4; margin: 12mm 11mm 14mm; }
  ${css}
  body { font-size: 9.5pt; line-height: 1.45; }

  /* inside the page box: Chrome's print clips anything drawn into the @page margin (the band's top was cut off) */
  .head { background: ${BRAND.ink}; color: #fff; margin: 0 0 6mm; padding: 7mm 9mm 6mm; border-radius: 5px; overflow: hidden; }
  .head .kicker { font-size: 8.5pt; letter-spacing: .3em; text-transform: uppercase; color: ${BRAND.accent}; font-weight: 700; }
  .head h1 { font-size: 21pt; margin-top: 3mm; }
  .head .sub { color: ${BRAND.muted}; font-size: 10pt; margin-top: 2mm; }

  .grid { display: flex; gap: 4mm; margin-bottom: 6mm; }
  .card { flex: 1; border: 1px solid #dde5ef; border-radius: 4px; padding: 3mm 3.5mm; }
  .card h3 { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #48576e; margin-bottom: 2mm; }
  .card p { margin: 0 0 1.5mm; font-size: 9pt; }
  .card code { font-size: 8pt; }

  .act { margin-bottom: 6mm; }
  .beat { page-break-inside: avoid; border: 1px solid #e3e9f1; border-top: 0; padding: 3mm 4mm; }
  .beat-head { display: flex; align-items: baseline; gap: 3mm; margin-bottom: 2mm; }
  .beat-head .n { font-weight: 700; color: ${BRAND.ink}; font-size: 11pt; }
  .beat-head .cap { flex: 1; font-weight: 600; color: ${BRAND.ink}; font-size: 10.5pt; }
  .beat-head .t { font-size: 8pt; color: #7b8798; font-family: Consolas, monospace; }
  .beat-body { display: flex; gap: 4mm; }
  .beat-body img { flex: 0 0 70mm; width: 70mm; border: 1px solid #d7dee8; border-radius: 3px; align-self: flex-start; }
  .cols { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; min-width: 0; }
  .lbl { font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: #7b8798; font-weight: 700; margin: 0 0 1mm; }
  .lbl.warnl { color: #b4441f; margin-top: 2mm; }
  .cols ol { margin: 0 0 2mm; padding-left: 4mm; font-size: 8.5pt; }
  .cols p { margin: 0 0 2mm; font-size: 8.5pt; color: #33425a; }
  .keyl { color: #17202e !important; font-size: 9pt !important; }
  .keyl strong { color: ${BRAND.ink}; }
  .full { color: #48576e !important; font-style: italic; }
  .act-bar { color: #fff; padding: 2.4mm 4mm; border-radius: 4px 4px 0 0; display: flex; align-items: baseline; gap: 4mm; }
  .act-no { font-size: 8pt; letter-spacing: .16em; font-weight: 700; color: #ffd79a; }
  .act-title { font-size: 11.5pt; font-weight: 600; flex: 1 1 60%; }
  .act-meta { font-size: 7.5pt; letter-spacing: .08em; text-transform: uppercase; opacity: .82; flex-basis: 100%; }
  .act-head { flex-wrap: wrap; }
  .goal { background: #f4f7fb; border: 1px solid #dde5ef; border-top: 0; padding: 2mm 4mm; font-size: 8.5pt; color: #3b4a60; }

  table { margin: 0; }
  th { background: #fff; font-size: 7.5pt; letter-spacing: .12em; color: #7b8798; padding: 2mm 3mm 1.2mm; }
  td { padding: 2.2mm 3mm; border-bottom: 1px solid #eef2f7; }
  td.n, th.n { width: 7mm; text-align: center; color: #98a4b5; font-size: 8pt; }
  td.act-cell { width: 62mm; }
  .verb { display: inline-block; background: #eef2f8; border: 1px solid #d5dfec; color: #24406e; font-weight: 700;
          font-size: 6.5pt; letter-spacing: .06em; text-transform: uppercase; padding: .4mm 1.6mm;
          border-radius: 2px; margin-right: 1.6mm; }
  .what { font-family: Consolas, monospace; font-size: 8pt; color: #33425a; word-break: break-word; }
  td.key { font-size: 9pt; color: #17202e; }
  td.key strong { color: ${BRAND.ink}; }
  td.key em { color: #7a4b12; font-style: italic; }

  .footer-note { margin-top: 4mm; border-top: 2px solid ${BRAND.accent}; padding-top: 3mm; font-size: 8.5pt; color: #48576e; }
  .qa { page-break-inside: avoid; }
  .qa h3 { font-size: 10pt; color: ${BRAND.ink}; margin: 4mm 0 2mm; }
  .qa dt { font-weight: 600; color: ${BRAND.ink}; margin-top: 2.5mm; font-size: 9pt; }
  .qa dd { margin: .8mm 0 0; color: #3b4a60; font-size: 9pt; }
</style></head><body>

<div class="head">
  ${logoTag('14mm', 'float:right;margin:0 0 2mm 6mm')}
  <div class="kicker">Live Demo Runbook</div>
  <h1>${escAll(config.title)}</h1>
  <div class="sub">${Object.keys(groups).length} acts · ${steps.length} beats ·
    ~${mm(runningSec)} at demo pace · ${today}</div>
</div>

<div class="grid">${cards}</div>

${(r.warnings ?? []).length ? `<div class="warn">
  <div class="label">Read this before you start</div>
  <ul>${r.warnings.map((w) => `<li>${fill(esc(w))}</li>`).join('')}</ul>
</div>` : ''}

${acts}

${(r.qa ?? []).length ? `<div class="qa">
  <h3>Likely questions, and the honest answer</h3>
  <dl>${r.qa.map((x) => `<dt>${fill(esc(x.q))}</dt><dd>${fill(esc(x.a))}</dd>`).join('')}</dl>
</div>` : ''}

${r.ifItBreaks ? `<div class="footer-note"><strong>If something breaks mid-demo:</strong> ${fill(esc(r.ifItBreaks))}</div>` : ''}

</body></html>`

const pdf = await renderPdf(html, {
  name: `${config.slug}_Runbook`,
  footer: `${config.title} — Live Demo Runbook`,
  margin: { top: '12mm', bottom: '14mm', left: '11mm', right: '11mm' },
})

const noKey = steps.filter((s) => !s.key).map((s) => s.id)
if (noKey.length) console.log(`WARNING — no "key" line (falling back to the caption) for: ${noKey.join(', ')}`)
console.log(`Wrote ${path.basename(pdf)}  (${n} beats, ${(fs.statSync(pdf).size / 1024).toFixed(0)} KB)`)
