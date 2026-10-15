// Dry run. Walks every step with the real sessions, screenshots each one, and reports
// which actions worked. It validates the script BEFORE a video take is burned, and the
// images it drops in build/shots are the ones the PDF manual is built from.
//
//   node scripts/capture.mjs            every persona
//   ONLY=interviewer node scripts/capture.mjs
import {
  config, BASES, SHOTS, BUILD, steps, bySegment, personaOf, contextOptions, seedContext,
  launch, logTo, sleep, log, fs, path,
} from './config.mjs'
import { runAction, clearOverlays, clearToasts, missingCues } from './lib.mjs'
import { prepareAct } from './record-core.mjs'

logTo('capture')
fs.mkdirSync(SHOTS, { recursive: true })
const only = process.env.ONLY?.split(',')
const results = []
const browser = await launch()

// Walk act by act, not persona by persona: an act's staging has to run before its steps,
// and a later act usually depends on what an earlier one did.
for (const [segment, segmentSteps] of Object.entries(bySegment())) {
  const persona = personaOf(segment)
  if (only && !only.includes(persona) && !only.includes(segment)) continue
  const p = config.personas[persona]

  await prepareAct(browser, segment)
  log(`── act ${segment} · ${persona} ─────────────────────────`)

  const context = await browser.newContext(contextOptions(persona))
  await seedContext(context, persona)
  const page = await context.newPage()
  // Prime the session so the first action is not fighting the auth bootstrap.
  await page.goto(BASES[persona] + p.home, { waitUntil: 'domcontentloaded' })
  // a slow landing page (a graph canvas, a record web) must finish painting before the act is filmed:
  // persona.homeWaitText waits for text that only appears once it has; persona.homeSettleMs replaces the settle
  if (p.homeWaitText) await page.getByText(p.homeWaitText, { exact: false }).first().waitFor({ state: 'visible', timeout: 90000 }).catch(() => log('   home text "' + p.homeWaitText + '" never appeared'))
  await sleep(p.homeSettleMs ?? 6000)

  for (const step of segmentSteps) {
    const started = Date.now()
    let status = 'ok'
    let detail = ''
    try {
      await runAction(page, step.action, BASES[persona], step)
      await clearOverlays(page)
    } catch (error) {
      status = 'FAILED'
      detail = error.message.split('\n')[0].slice(0, 120)
    }
    // an `at` cue has to be words the line really says, or on film it fires at the wrong moment
    const lost = missingCues(step)
    if (lost.length && status === 'ok') {
      status = 'CUE'
      detail = `cue not in the narration: ${lost.map((c) => '"' + c + '"').join(', ')}`
    }
    // A toast from the previous action outlives it and lands in this screenshot.
    await clearToasts(page)
    await sleep(800)

    const file = path.join(SHOTS, `${step.id}.jpg`)
    try {
      // `clip` photographs one element — the phone frame, the panel — instead of the
      // whole viewport, which is what makes a mobile screen readable in a printed manual.
      let clip
      if (step.clip) {
        const box = await page.locator(step.clip.selector ?? step.clip).first().boundingBox()
        if (box) {
          const pad = step.clip.pad ?? 18
          const viewport = page.viewportSize()
          clip = {
            x: Math.max(0, box.x - pad),
            y: Math.max(0, box.y - pad),
            width: Math.min(viewport.width, box.width + pad * 2),
            height: Math.min(viewport.height - Math.max(0, box.y - pad), box.height + pad * 2),
          }
        } else {
          detail ||= `clip target "${step.clip.selector ?? step.clip}" not found; shot the full viewport`
        }
      }
      await page.screenshot({ path: file, type: 'jpeg', quality: 86, ...(clip ? { clip } : {}) })
    } catch (error) {
      status = status === 'ok' ? 'SHOT FAILED' : status
      detail ||= error.message.split('\n')[0].slice(0, 120)
    }

    const chars = await page.evaluate(() => document.body.innerText.trim().length).catch(() => 0)
    log(`${status === 'ok' ? '✓' : '✗'} ${step.id.padEnd(4)} ${String(Date.now() - started).padStart(6)}ms  chars:${String(chars).padStart(6)}  ${step.caption}${detail ? `  << ${detail}` : ''}`)
    results.push({ id: step.id, segment, persona, status, detail, chars, url: page.url() })
    fs.writeFileSync(path.join(BUILD, 'capture-report.json'), JSON.stringify(results, null, 2))
  }
  await context.close()
}

await browser.close()

const bad = results.filter((r) => r.status !== 'ok')
log('')
log(`Done. ${results.length - bad.length}/${results.length} steps clean.`)
if (bad.length) {
  log('Needs attention:')
  for (const b of bad) log(`   ${b.id}  ${b.status}  ${b.detail}`)
}
// A near-empty page usually means the step landed somewhere it should not have.
const thin = results.filter((r) => r.status === 'ok' && r.chars < 200)
if (thin.length) log(`Thin pages (check these shots by eye): ${thin.map((t) => t.id).join(', ')}`)
if (bad.length) log('Do not record until this is clean — a failed action in a take costs the whole act.')
