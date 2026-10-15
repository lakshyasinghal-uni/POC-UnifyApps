// Copies the captured stills into out/screenshots as a browsable library, plus a contact
// sheet. build/shots holds them under step ids; this produces the same images under names
// a person can scan — act number, order, and the caption — so the folder reads as a
// walkthrough of the product rather than a bag of slugs. Useful long after the demo: decks,
// proposals, support articles.
//
//   node scripts/export-shots.mjs
import { config, OUT, SHOTS, steps, bySegment, actMeta, BRAND, fs, path, log } from './config.mjs'

const DEST = path.join(OUT, 'screenshots')
fs.rmSync(DEST, { recursive: true, force: true })
fs.mkdirSync(DEST, { recursive: true })

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const groups = bySegment()
const cards = []
let n = 0
let missing = 0

for (const [segment, segSteps] of Object.entries(groups)) {
  const act = actMeta(segment)
  const actNo = String(Object.keys(groups).indexOf(segment) + 1).padStart(2, '0')
  for (const step of segSteps) {
    n += 1
    const source = path.join(SHOTS, `${step.id}.jpg`)
    if (!fs.existsSync(source)) { missing += 1; continue }
    const name = `${actNo}-${String(n).padStart(2, '0')}-${slug(step.caption)}.jpg`
    fs.copyFileSync(source, path.join(DEST, name))
    cards.push({ name, step, act })
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sheet = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(config.title)} — screenshots</title>
<style>
  body { font-family: ${BRAND.font}; margin: 0; background: #f6f8fb; color: #17202e; }
  header { background: ${BRAND.ink}; color: #fff; padding: 28px 40px; }
  header .k { font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: ${BRAND.accent}; font-weight: 700; }
  header h1 { margin: 8px 0 0; font-size: 26px; font-weight: 600; }
  main { padding: 28px 40px 60px; }
  h2 { font-size: 15px; margin: 32px 0 14px; color: ${BRAND.ink}; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
  figure { margin: 0; background: #fff; border: 1px solid #e3e9f1; border-radius: 8px; overflow: hidden; }
  figure img { width: 100%; display: block; }
  figcaption { padding: 10px 12px; font-size: 13px; }
  figcaption b { display: block; margin-bottom: 3px; }
  figcaption code { font-size: 11px; color: #7b8798; }
</style></head><body>
<header><div class="k">Screenshot library</div><h1>${esc(config.title)}</h1></header>
<main>
${Object.entries(groups).map(([segment, segSteps]) => {
  const act = actMeta(segment)
  const mine = cards.filter((c) => segSteps.some((s) => s.id === c.step.id))
  if (!mine.length) return ''
  return `<h2>Act ${esc(act.n)} — ${esc(act.title)}</h2><div class="grid">`
    + mine.map((c) => `<figure><img src="${c.name}" alt="${esc(c.step.caption)}">`
      + `<figcaption><b>${esc(c.step.caption)}</b><code>${esc(c.name)}</code></figcaption></figure>`).join('')
    + '</div>'
}).join('')}
</main></body></html>`

fs.writeFileSync(path.join(DEST, 'index.html'), sheet)
log(`Wrote ${cards.length} screenshots to out/screenshots (contact sheet: index.html)`)
if (missing) log(`${missing} step(s) had no still — run: node scripts/capture.mjs`)
