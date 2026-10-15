// The narration script — act by act, every scene with its screenshot, the line that must
// land, the full words to say and what happens on screen. It is the document you send for
// review, and the one a presenter or a voice artist reads from; so it is complete, not a list
// of captions (Maher, 2026-09-25: "it should be full").
//
// It works with or without build/durations.json: before narration exists, timings are
// estimated from the word count; afterwards they are the real clip lengths.
import { steps, bySegment, actMeta, personaOf, BUILD } from '../scripts/config.mjs'
import { config, BRAND, esc, escAll, fill, notesFor, shot, today, css, renderPdf, fs, path, logoTag } from './doc-kit.mjs'

// documentGuard — customer documents: no template placeholders, no personal account (see build-manual.mjs)
if (JSON.stringify(config).includes('REPLACE ME')) throw new Error('demo.config.json still has REPLACE ME text: fill manual/runbook before building documents')
for (const p of Object.values(config.personas)) if (/@/.test(String(p.user))) throw new Error('persona ' + p.id + ': user looks like an email address; documents print it — describe the account instead')

const durationsFile = path.join(BUILD, 'durations.json')
const measured = fs.existsSync(durationsFile) ? JSON.parse(fs.readFileSync(durationsFile, 'utf-8')) : {}
const spoken = Object.keys(measured).length > 0

// 155 words a minute is close to edge-tts at rate -4%, which is what narrate.py uses.
const estimate = (text) => (text.trim().split(/\s+/).length / 155) * 60
const secondsFor = (step) => measured[step.id] ?? estimate(step.narration)
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

function action(step) {
  const a = step.action
  if (a.type === 'goto') return `Open ${a.url}`
  if (a.type === 'scroll') return 'Scroll down the page'
  if (a.type === 'scrollTo') return `Scroll to ${a.text ?? a.selector}`
  if (a.type === 'type') return `Type "${a.value}"`
  if (a.type === 'press') return `Press ${a.key ?? 'Enter'}`
  if (a.type === 'wait') return 'Hold the frame'
  return `${a.type[0].toUpperCase()}${a.type.slice(1)} ${a.text ?? a.selector ?? ''}`.trim()
}

let n = 0
let running = 0
const total = steps.reduce((t, s) => t + secondsFor(s), 0)
const words = steps.reduce((t, s) => t + s.narration.trim().split(/\s+/).length, 0)

const acts = Object.entries(bySegment()).map(([segment, segSteps]) => {
  const act = actMeta(segment)
  const p = config.personas[personaOf(segment)]
  const actSec = segSteps.reduce((t, s) => t + secondsFor(s), 0)
  const startAt = running
  running += actSec

  const scenes = segSteps.map((step) => {
    n += 1
    const sec = secondsFor(step)
    const note = notesFor(step)
    const img = shot(step.id)
    const doing = (note.do ?? []).length ? note.do : [action(step)]
    return `
      <div class="scene">
        <div class="scene-head">
          <span class="n">${n}</span>
          <span class="caption">${escAll(step.caption)}</span>
          <span class="time">${mmss(sec)}</span>
        </div>
        <div class="scene-body">
          ${img ? `<figure><img alt="" src="${img}"><figcaption>Scene ${n} as recorded</figcaption></figure>` : ''}
          <div class="words">
            ${step.key ? `<div class="key"><span class="tag">The point</span> ${fill(esc(step.key))}</div>` : ''}
            <div class="tag say">Say</div>
            <p class="line">${escAll(step.narration)}</p>
            <div class="tag">On screen</div>
            <ol class="doing">${doing.map((d) => `<li>${fill(esc(d))}</li>`).join('')}</ol>
            ${note.expect ? `<p class="expect"><strong>You should see:</strong> ${fill(esc(note.expect))}</p>` : ''}
          </div>
        </div>
      </div>`
  }).join('')

  return `
    <div class="act">
      <div class="act-head" style="border-color:${p.colour}">
        <span class="act-no">ACT ${escAll(act.n)}</span>
        <span class="act-title">${escAll(act.title)}</span>
        <span class="act-meta">${escAll(p.label)} · ${segSteps.length} scenes · ~${mmss(actSec)} · from ${mmss(startAt)}</span>
      </div>
      ${act.goal ? `<div class="goal">${escAll(act.goal)}</div>` : ''}
      ${scenes}
    </div>`
}).join('')

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escAll(config.title)} — Narration Script</title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  ${css}

  /* inside the page box: Chrome's print clips anything drawn into the @page margin */
  .head { background: ${BRAND.ink}; color: #fff; margin: 0 0 7mm; padding: 8mm 10mm 7mm; border-radius: 5px; overflow: hidden; }
  .head .kicker { font-size: 8.5pt; letter-spacing: .3em; text-transform: uppercase; color: ${BRAND.accent}; font-weight: 700; }
  .head h1 { font-size: 22pt; margin-top: 3mm; }
  .head .sub { color: ${BRAND.muted}; font-size: 10pt; margin-top: 2.5mm; }

  .note { background: #f4f7fb; border: 1px solid #dde5ef; border-radius: 4px; padding: 3mm 4mm; font-size: 9pt;
          color: #3b4a60; margin-bottom: 6mm; }

  .act { page-break-inside: auto; margin-bottom: 7mm; }
  .act-head { border-left: 4px solid ${BRAND.ink}; padding: 1mm 0 1mm 5mm; margin-bottom: 3mm;
              display: flex; align-items: baseline; gap: 4mm; page-break-after: avoid; }
  .act-no { font-size: 8pt; letter-spacing: .16em; font-weight: 700; color: #8a6524; }
  .act-title { font-size: 13pt; font-weight: 600; color: ${BRAND.ink}; flex: 1; }
  .act-meta { font-size: 7.5pt; letter-spacing: .08em; text-transform: uppercase; color: #7b8798; }
  .goal { font-size: 9pt; color: #5a6a80; font-style: italic; margin: 0 0 4mm 5mm; }

  .scene { page-break-inside: avoid; margin-bottom: 7mm; border: 1px solid #e3e9f1; border-radius: 5px; overflow: hidden; }
  .scene-head { display: flex; align-items: baseline; gap: 3mm; background: #f4f7fb; padding: 2.2mm 4mm; border-bottom: 1px solid #e3e9f1; }
  .scene-head .n { font-size: 12pt; font-weight: 700; color: ${BRAND.ink}; }
  .scene-head .caption { flex: 1; font-size: 11pt; font-weight: 600; color: ${BRAND.ink}; }
  .scene-head .time { font-size: 8pt; color: #7b8798; font-family: Consolas, monospace; }
  .scene-body { display: flex; gap: 5mm; padding: 4mm; }
  .scene-body figure { flex: 0 0 88mm; margin: 0; }
  .scene-body img { width: 100%; border: 1px solid #d7dee8; border-radius: 3px; display: block; }
  .scene-body figcaption { font-size: 7pt; color: #98a4b5; margin-top: 1mm; }
  .words { flex: 1; min-width: 0; }
  .key { font-size: 9.5pt; color: #17202e; margin-bottom: 3mm; }
  .key strong { color: ${BRAND.ink}; }
  .say { margin-top: 1mm; }
  .line { margin: 1.5mm 0 3mm; font-size: 10.5pt; line-height: 1.6; color: #17202e; }
  .doing { margin: 1.5mm 0 2mm; padding-left: 4.5mm; font-size: 9pt; color: #33425a; }
  .doing li { margin-bottom: .8mm; }
  .expect { font-size: 8.5pt; color: #48576e; margin: 0; }
  .tag { display: inline-block; background: #eef2f8; border: 1px solid #d5dfec; color: #24406e; font-weight: 700;
         font-size: 6.5pt; letter-spacing: .06em; text-transform: uppercase; padding: .4mm 1.6mm;
         border-radius: 2px; margin-right: 1.6mm; }
</style></head><body>

<div class="head">
  ${logoTag('14mm', 'float:right;margin:0 0 2mm 6mm')}
  <div class="kicker">Narration Script</div>
  <h1>${escAll(config.title)}</h1>
  <div class="sub">${escAll(config.subtitle)}${config.subtitle ? ' · ' : ''}${steps.length} scenes ·
    ${words} words · ~${mmss(total)} spoken · ${today}</div>
</div>

<div class="note">
  ${spoken
    ? 'Timings are the measured length of each recorded narration clip. The finished video runs longer — every scene also holds for the action on screen.'
    : 'Nothing has been narrated yet, so timings are estimated from the word count at about 155 words a minute. Run <code>python scripts/narrate.py</code> and rebuild this document for the real lengths.'}
  Edit the wording in <code>steps.json</code>; this document is generated from it.
</div>

${acts}

</body></html>`

const pdf = await renderPdf(html, {
  name: `${config.slug}_Script`,
  footer: `${config.title} — Narration Script`,
  margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
})
console.log(`Wrote ${path.basename(pdf)}  (${n} scenes, ${words} words, ~${mmss(total)} spoken${spoken ? '' : ', estimated'})`)
