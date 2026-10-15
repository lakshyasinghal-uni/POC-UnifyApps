// The demonstration manual: literal, step-by-step presenter instructions with a
// screenshot per scene. Written for someone who has never seen the application —
// every step says what to type or click, what should appear, and what to do when it
// doesn't. Run the capture pass first; the screenshots come from build/shots.
import { steps, bySegment, actMeta, personaOf, DIAGRAM_SEAT } from '../scripts/config.mjs'
import { config, BRAND, esc, escAll, fill, notesFor, shot, today, css, renderPdf, fs, path, logoTag } from './doc-kit.mjs'

// documentGuard — these documents go to customers: refuse to print template placeholders or a personal
// account. persona.user is printed as "Sign in as …", so it must be a role ("your own UnifyApps account"),
// never an email address (an earlier demo film, 2026-09-25: a personal email and REPLACE ME text reached the manual).
if (JSON.stringify(config).includes('REPLACE ME')) throw new Error('demo.config.json still has REPLACE ME text: fill manual/runbook before building documents')
for (const p of Object.values(config.personas)) if (/@/.test(String(p.user))) throw new Error('persona ' + p.id + ': user looks like an email address; documents print it — describe the account instead')

const m = config.manual ?? {}
const groups = bySegment()
const personaList = Object.values(config.personas)

/** Setup instructions: whatever the config declares, else one block per persona. */
const setup = m.setup ?? personaList.map((p, i) => ({
  title: `${p.window} — sign in as ${p.label.toLowerCase()}`,
  steps: [
    i === 0
      ? 'Open a normal browser window.'
      : 'Open a <b>private / incognito</b> window (Ctrl+Shift+N in Chrome or Edge). It must not be a new tab in the window you already have open.',
    `Go to <code>${p.base}</code>`,
    `Sign in as <b>${escAll(p.user)}</b>.`,
    'Leave this window open for the whole demo.',
  ],
}))

let n = 0
const sections = Object.entries(groups).map(([segment, segSteps]) => {
  const act = actMeta(segment)
  const p = config.personas[personaOf(segment)] ?? DIAGRAM_SEAT

  const body = segSteps.map((step) => {
    n += 1
    const note = notesFor(step)
    const doList = (note.do ?? [`Carry out: ${describe(step)}`])
      .map((d) => `<li>${fill(esc(d))}</li>`).join('')
    const image = shot(step.id)
    return `
      <section class="step">
        <div class="step-head">
          <div class="num">${n}</div>
          <h3>${escAll(step.caption)}</h3>
        </div>

        <div class="block do">
          <div class="label">Do this</div>
          <ol>${doList}</ol>
        </div>

        ${note.expect ? `<div class="block see">
          <div class="label">You should now see</div>
          <p>${fill(esc(note.expect))}</p>
        </div>` : ''}

        <div class="block say">
          <div class="label">Say this</div>
          <p class="quote">${escAll(step.narration)}</p>
        </div>

        ${note.recover ? `<div class="block fix">
          <div class="label">If that didn't happen</div>
          <p>${fill(esc(note.recover))}</p>
        </div>` : ''}

        ${image ? `<figure><img src="${image}" alt=""><figcaption>Step ${n} — ${escAll(step.caption)}</figcaption></figure>` : ''}
      </section>`
  }).join('')

  return `
    <div class="act-break"></div>
    <div class="act">
      <div class="act-kicker">${escAll(p.label)} · signed in as ${escAll(p.user)} · use ${escAll(p.window)}</div>
      <h2>Act ${escAll(act.n)} — ${escAll(act.title)}</h2>
    </div>
    ${body}`
}).join('')

function describe(step) {
  if (step.diagram) return 'show the architecture picture and say the line'
  const a = step.action
  if (a.type === 'goto') return `open ${a.url}`
  if (a.type === 'scroll') return 'scroll down the page'
  return `${a.type} ${a.text ?? a.selector ?? ''}`.trim()
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escAll(config.title)} — Demonstration Manual</title>
<style>
  @page { size: A4; margin: 15mm 14mm 16mm; }
  ${css}

  .cover { height: 258mm; display: flex; flex-direction: column; justify-content: center;
           background: ${BRAND.ink}; color: #fff; margin: 0; padding: 0 18mm; border-radius: 6px; }
  /* the cover stays inside the page box: Chrome's print clips anything drawn into the @page margin */
  .cover .kicker { font-size: 10pt; letter-spacing: .3em; text-transform: uppercase; color: ${BRAND.accent};
                   font-weight: 700; margin-bottom: 12mm; }
  .cover h1 { font-size: 33pt; line-height: 1.15; max-width: 20ch; }
  .cover .rule { width: 64px; height: 3px; background: ${BRAND.accent}; margin: 10mm 0 7mm; }
  .cover .sub { font-size: 12.5pt; color: ${BRAND.muted}; max-width: 46ch; line-height: 1.5; }
  .cover .meta { font-size: 9.5pt; color: #7e90aa; margin-top: 8mm; }

  .act-break { page-break-before: always; }
  .intro h2 { font-size: 15pt; color: ${BRAND.ink}; margin: 0 0 3mm; }
  .intro h3 { font-size: 11pt; color: ${BRAND.ink}; margin: 6mm 0 2mm; }
  .intro p { margin: 0 0 3mm; }
  .intro ol, .intro ul { margin: 0 0 4mm; padding-left: 5mm; }
  .intro li { margin-bottom: 1.6mm; }

  .act { border-left: 4px solid ${BRAND.accent}; padding: 3mm 0 3mm 6mm; margin: 0 0 7mm; }
  .act-kicker { font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: #8a6524; font-weight: 700; }
  .act h2 { font-size: 16pt; margin-top: 2mm; color: ${BRAND.ink}; }

  .step { page-break-inside: avoid; margin-bottom: 8mm; }
  .step-head { display: flex; gap: 4mm; align-items: center; margin-bottom: 3mm; }
  .num { flex: 0 0 auto; width: 9mm; height: 9mm; border-radius: 50%; background: ${BRAND.ink}; color: #fff;
         font-size: 11pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .step h3 { font-size: 13pt; color: ${BRAND.ink}; }

  .block { margin: 0 0 2.5mm 13mm; border-left: 3px solid #d5dfec; padding: 2mm 0 2mm 4mm; }
  .block .label { font-size: 7.5pt; letter-spacing: .15em; text-transform: uppercase; font-weight: 700; margin-bottom: 1.5mm; }
  .block p { margin: 0; }
  .block ol { margin: 0; padding-left: 5mm; }
  .block li { margin-bottom: 1.6mm; }

  .do { border-left-color: #24406e; } .do .label { color: #24406e; }
  .see { border-left-color: #1d5b46; background: #f3f9f6; } .see .label { color: #1d5b46; }
  .say { border-left-color: ${BRAND.accent}; background: #faf7f1; } .say .label { color: #8a6524; }
  .say .quote { font-style: italic; color: #3b4a60; }
  .fix { border-left-color: #b4441f; background: #fdf5f2; } .fix .label { color: #b4441f; }

  figure { margin: 3mm 0 0 13mm; page-break-inside: avoid; }
  figure img { width: 100%; border: 1px solid #d7dee8; border-radius: 4px; display: block; }
  figcaption { font-size: 8pt; color: #7b8798; margin-top: 1.5mm; }
</style></head><body>

<div class="cover">
  ${logoTag('34mm', 'align-self:flex-start;margin-bottom:10mm')}
  <div class="kicker">${escAll(m.kicker ?? 'Demonstration Manual')}</div>
  <h1>${escAll(config.title)}</h1>
  <div class="rule"></div>
  <div class="sub">${escAll(m.blurb ?? 'Step by step, with the exact address to type and the exact thing to click at every point. Written for someone seeing this application for the first time.')}</div>
  <div class="meta">${escAll(config.subtitle)}${config.subtitle ? ' · ' : ''}${today}</div>
</div>

<div class="intro act-break">
  <h2>How to use this manual</h2>
  <p>Work through the steps in order, from 1 to ${steps.length}. Every step has the same four parts:</p>
  <ul>
    <li><b>Do this</b> — the exact keystrokes and clicks. Addresses are shown in full; copy them exactly.</li>
    <li><b>You should now see</b> — how to know it worked before you carry on.</li>
    <li><b>Say this</b> — the line to deliver over that screen. Put it in your own words if you prefer.</li>
    <li><b>If that didn't happen</b> — what to do when the screen does not match.</li>
  </ul>
  <p>Where a step says <b>do not click</b> something, that control changes real data. Skipping it costs nothing;
  clicking it can end the demo early.</p>

  <h2 style="margin-top:8mm">Before you start</h2>
  ${m.before ? `<p>${fill(esc(m.before))}</p>` : (personaList.length > 1 ? `<p>You need <b>${personaList.length} separate browser windows</b>, one per sign-in.
  Where two sign-ins share a web address, a single browser can only hold one of them at a time — open both in the
  same browser and the second sign-in silently replaces the first.</p>` : '')}
  ${setup.map((block) => `
    <h3>${fill(esc(block.title))}</h3>
    <ol>${block.steps.map((s) => `<li>${fill(esc(s))}</li>`).join('')}</ol>`).join('')}

  ${(m.warnings ?? []).length ? `<div class="warn">
    <div class="label">${escAll(m.warningsTitle ?? 'The things that go wrong')}</div>
    <ul>${m.warnings.map((w) => `<li>${fill(esc(w))}</li>`).join('')}</ul>
  </div>` : ''}

  ${m.warmup ? `<h3>Warm the demo up before the customer joins</h3><p>${fill(esc(m.warmup))}</p>` : ''}
  ${m.story ? `<h3>What the story is</h3><p>${fill(esc(m.story))}</p>` : ''}

  <table>
    <tr><th>Act</th><th>Window</th><th>Signed in as</th><th>Steps</th></tr>
    ${Object.entries(groups).map(([seg, ss]) => {
      const act = actMeta(seg)
      const p = config.personas[personaOf(seg)] ?? DIAGRAM_SEAT
      const first = steps.findIndex((s) => s.id === ss[0].id) + 1
      const last = steps.findIndex((s) => s.id === ss[ss.length - 1].id) + 1
      return `<tr><td>Act ${escAll(act.n)}</td><td>${escAll(p.window)}</td><td>${escAll(p.user)}</td><td>${first}–${last}</td></tr>`
    }).join('')}
  </table>
</div>

${sections}

</body></html>`

const pdf = await renderPdf(html, {
  name: `${config.slug}_Manual`,
  footer: `${config.title} — ${m.kicker ?? 'Demonstration Manual'}`,
})

const missing = steps.filter((s) => !notesFor(s).do).map((s) => s.id)
if (missing.length) console.log(`WARNING — no presenter instructions written for: ${missing.join(', ')}`)
const noShot = steps.filter((s) => !shot(s.id)).map((s) => s.id)
if (noShot.length) console.log(`WARNING — no screenshot for: ${noShot.join(', ')} (run: node scripts/capture.mjs)`)
console.log(`Wrote ${path.basename(pdf)}  (${n} steps, ${(fs.statSync(pdf).size / 1024 / 1024).toFixed(1)} MB)`)
