// The PG Playbook — how a GTM team uses this application to generate pipeline. Not a product tour: the plays a
// BDR, AE, SC or RevOps lead runs, when to run each one (the signal), the steps on the real screens with their
// screenshots, what to say to the prospect or the team, what comes out of it, and the next step that moves the
// deal. Same look as the runbook and the manual (Maher, 2026-10-06: "make it in our format and screenshots").
//
// Content lives in manual/playbook.json (see references/playbook.md). Every claim in it must be a fact about the
// app as it is; results that were never measured are written as what to measure, never as a number.
import { steps, BUILD } from '../scripts/config.mjs'
import { config, BRAND, esc, escAll, fill, shot, today, css, renderPdf, fs, path, logoTag, DOCS } from './doc-kit.mjs'

const FILE = path.join(DOCS, 'playbook.json')
if (!fs.existsSync(FILE)) throw new Error('manual/playbook.json is missing: write the plays first (references/playbook.md)')
const pb = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
if (JSON.stringify(pb).includes('REPLACE ME')) throw new Error('manual/playbook.json still has REPLACE ME text')

const ids = new Set(steps.map((s) => s.id))
const missing = []
const img = (id) => {
  if (!id) return null
  if (!ids.has(id)) missing.push(id)
  return shot(id)
}
const list = (xs, cls = '') => (xs ?? []).length ? `<ul class="${cls}">${xs.map((x) => `<li>${fill(esc(x))}</li>`).join('')}</ul>` : ''

const who = (pb.who ?? []).map((w) => `
  <div class="card">
    <h3>${escAll(w.role)}</h3>
    ${w.when ? `<p><span class="lbl">When</span> ${fill(esc(w.when))}</p>` : ''}
    ${w.how ? `<p><span class="lbl">How it helps</span> ${fill(esc(w.how))}</p>` : ''}
  </div>`).join('')

const signals = (pb.signals ?? []).length ? `
  <h2 class="sec">Signals that start a play</h2>
  <table><thead><tr><th>Signal</th><th>Where you see it</th><th>Play</th></tr></thead><tbody>
  ${pb.signals.map((s) => `<tr><td>${fill(esc(s.signal))}</td><td>${fill(esc(s.where ?? ''))}</td><td class="play-ref">${escAll(s.play ?? '')}</td></tr>`).join('')}
  </tbody></table>` : ''

let n = 0
const plays = (pb.plays ?? []).map((p, i) => {
  const beats = (p.steps ?? []).map((s) => {
    n += 1
    const pic = img(s.shot)
    return `<div class="beat">
      <div class="beat-head"><span class="n">${n}</span><span class="cap">${fill(esc(s.title ?? s.do))}</span></div>
      <div class="beat-body">
        ${pic ? `<img alt="" src="${pic}">` : ''}
        <div class="cols">
          <div><div class="lbl">Do this</div><p>${fill(esc(s.do))}</p>
            ${s.see ? `<div class="lbl">You get</div><p>${fill(esc(s.see))}</p>` : ''}</div>
          <div>${s.say ? `<div class="lbl">Use it with the prospect or the team</div><p class="keyl">${fill(esc(s.say))}</p>` : ''}
            ${s.tip ? `<div class="lbl">Tip</div><p>${fill(esc(s.tip))}</p>` : ''}</div>
        </div>
      </div>
    </div>`
  }).join('')
  return `
  <div class="act">
    <div class="act-bar">
      <span class="act-no">PLAY ${i + 1}</span>
      <span class="act-title">${escAll(p.name)}</span>
      <span class="act-meta">${escAll([p.who, p.stage, p.time].filter(Boolean).join(' · '))}</span>
    </div>
    <div class="goal">
      ${p.goal ? `<p><strong>Goal:</strong> ${fill(esc(p.goal))}</p>` : ''}
      ${p.when ? `<p><strong>Run it when:</strong> ${fill(esc(p.when))}</p>` : ''}
    </div>
    ${beats}
    <div class="outcome">
      ${p.output ? `<p><span class="lbl">What comes out</span> ${fill(esc(p.output))}</p>` : ''}
      ${p.next ? `<p><span class="lbl">Next step</span> ${fill(esc(p.next))}</p>` : ''}
      ${p.measure ? `<p><span class="lbl">Measure</span> ${fill(esc(p.measure))}</p>` : ''}
    </div>
  </div>`
}).join('')

const messages = (pb.messages ?? []).length ? `
  <h2 class="sec">What to say</h2>
  <table><thead><tr><th>Audience</th><th>The message</th></tr></thead><tbody>
  ${pb.messages.map((m) => `<tr><td class="aud">${escAll(m.audience)}</td><td>${fill(esc(m.line))}</td></tr>`).join('')}
  </tbody></table>` : ''

const objections = (pb.objections ?? []).length ? `
  <div class="qa"><h2 class="sec">Objections and honest answers</h2>
  <dl>${pb.objections.map((x) => `<dt>${fill(esc(x.q))}</dt><dd>${fill(esc(x.a))}</dd>`).join('')}</dl></div>` : ''

const metrics = (pb.metrics ?? []).length ? `
  <h2 class="sec">Measure the pipeline it generates</h2>
  <table><thead><tr><th>Metric</th><th>How to read it</th><th>Source</th></tr></thead><tbody>
  ${pb.metrics.map((m) => `<tr><td>${fill(esc(m.name))}</td><td>${fill(esc(m.how ?? ''))}</td><td>${fill(esc(m.source ?? ''))}</td></tr>`).join('')}
  </tbody></table>` : ''

const cadence = (pb.cadence ?? []).length ? `
  <h2 class="sec">Cadence</h2>
  <table><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>
  ${pb.cadence.map((c) => `<tr><td>${fill(esc(c.when))}</td><td>${fill(esc(c.who ?? ''))}</td><td>${fill(esc(c.what))}</td></tr>`).join('')}
  </tbody></table>` : ''

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escAll(config.title)} — PG Playbook</title>
<style>
  @page { size: A4; margin: 12mm 11mm 14mm; }
  ${css}
  body { font-size: 9.5pt; line-height: 1.45; }
  .head { background: ${BRAND.ink}; color: #fff; margin: 0 0 6mm; padding: 7mm 9mm 6mm; border-radius: 5px; overflow: hidden; }
  .head .kicker { font-size: 8.5pt; letter-spacing: .3em; text-transform: uppercase; color: ${BRAND.accent}; font-weight: 700; }
  .head h1 { font-size: 21pt; margin-top: 3mm; }
  .head .sub { color: ${BRAND.muted}; font-size: 10pt; margin-top: 2mm; }
  .purpose { font-size: 10.5pt; color: #17202e; border-left: 4px solid ${BRAND.accent}; padding: 1mm 0 1mm 4mm; margin: 0 0 5mm; }
  h2.sec { font-size: 12pt; color: ${BRAND.ink}; margin: 6mm 0 2.5mm; padding-bottom: 1.5mm; border-bottom: 2px solid ${BRAND.accent}; page-break-after: avoid; }
  .grid { display: flex; gap: 4mm; margin-bottom: 5mm; flex-wrap: wrap; }
  .card { flex: 1 1 40mm; border: 1px solid #dde5ef; border-radius: 4px; padding: 3mm 3.5mm; }
  .card h3 { font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: ${BRAND.ink}; margin-bottom: 2mm; }
  .card p { margin: 0 0 1.5mm; font-size: 8.8pt; color: #33425a; }
  .lbl { font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: #7b8798; font-weight: 700; margin: 0 1.5mm 1mm 0; }
  div.lbl { display: block; }
  .act { margin: 5mm 0 6mm; }
  .act-bar { background: ${BRAND.ink}; color: #fff; padding: 2.4mm 4mm; border-radius: 4px 4px 0 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4mm; page-break-after: avoid; }
  .act-no { font-size: 8pt; letter-spacing: .16em; font-weight: 700; color: ${BRAND.accent}; }
  .act-title { font-size: 11.5pt; font-weight: 600; flex: 1 1 60%; }
  .act-meta { font-size: 7.5pt; letter-spacing: .08em; text-transform: uppercase; opacity: .85; flex-basis: 100%; }
  .goal { background: #f6f4ee; border: 1px solid #e4dccb; border-top: 0; padding: 2mm 4mm; font-size: 8.8pt; color: #3b4a60; }
  .goal p { margin: .6mm 0; }
  .beat { page-break-inside: avoid; border: 1px solid #e3e9f1; border-top: 0; padding: 3mm 4mm; }
  .beat-head { display: flex; align-items: baseline; gap: 3mm; margin-bottom: 2mm; }
  .beat-head .n { font-weight: 700; color: ${BRAND.ink}; font-size: 11pt; }
  .beat-head .cap { flex: 1; font-weight: 600; color: ${BRAND.ink}; font-size: 10.5pt; }
  .beat-body { display: flex; gap: 4mm; }
  .beat-body img { flex: 0 0 70mm; width: 70mm; border: 1px solid #d7dee8; border-radius: 3px; align-self: flex-start; }
  .cols { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; min-width: 0; }
  .cols p { margin: 0 0 2mm; font-size: 8.5pt; color: #33425a; }
  .keyl { color: #17202e !important; font-size: 9pt !important; font-style: italic; }
  .outcome { border: 1px solid #e3e9f1; border-top: 0; border-radius: 0 0 4px 4px; background: #fbfaf6; padding: 2.5mm 4mm; page-break-inside: avoid; }
  .outcome p { margin: .8mm 0; font-size: 8.8pt; color: #17202e; }
  td.play-ref, td.aud { font-weight: 600; color: ${BRAND.ink}; width: 42mm; }
  .qa { page-break-inside: avoid; }
  .qa dt { font-weight: 600; color: ${BRAND.ink}; margin-top: 2.5mm; font-size: 9pt; }
  .qa dd { margin: .8mm 0 0; color: #3b4a60; font-size: 9pt; }
  ul.limits li { margin-bottom: 1mm; }
  .warn { page-break-inside: avoid; }
</style></head><body>

<div class="head">
  ${logoTag('14mm', 'float:right;margin:0 0 2mm 6mm')}
  <div class="kicker">PG Playbook · Pipeline Generation</div>
  <h1>${escAll(config.title)}</h1>
  <div class="sub">${escAll(pb.subtitle ?? 'How the GTM team uses it to create and move pipeline')} · ${(pb.plays ?? []).length} plays · ${today}</div>
</div>

${pb.purpose ? `<p class="purpose">${fill(esc(pb.purpose))}</p>` : ''}

${who ? `<h2 class="sec">Who runs it</h2><div class="grid">${who}</div>` : ''}
${signals}
<h2 class="sec">The plays</h2>
${plays}
${messages}
${objections}
${metrics}
${cadence}
${(pb.limits ?? []).length ? `<div class="warn"><div class="label">Know the limits</div>${list(pb.limits, 'limits')}</div>` : ''}
${(pb.resources ?? []).length ? `<h2 class="sec">Go deeper</h2>${list(pb.resources)}` : ''}

</body></html>`

const pdf = await renderPdf(html, {
  name: `${config.slug}_PG_Playbook`,
  footer: `${config.title} — PG Playbook`,
  margin: { top: '12mm', bottom: '14mm', left: '11mm', right: '11mm' },
})
if (missing.length) console.log(`WARNING — playbook steps point at shots that are not steps of this film: ${missing.join(', ')}`)
console.log(`Wrote ${path.basename(pdf)}  (${(pb.plays ?? []).length} plays, ${n} steps, ${(fs.statSync(pdf).size / 1024).toFixed(0)} KB)`)
void BUILD
