// Sign in and record inside the SAME browser context.
//
// Some portals bind the access token to the context that obtained it, so a storageState
// copied into a fresh context is rejected outright — not an expiry problem, so no amount
// of hurrying helps. The only reliable route is to record in the context where the
// sign-in happened, then cut the sign-in off the front of the footage (build.py does it
// from `trimStartMs`).
//
//   SEGMENTS=E,F PERSONA=candidate node scripts/live-record.mjs
import { config, RAW, VIEW, steps, chromium, personaOf, logTo, sleep, log, fs, path } from './config.mjs'
import { clearOverlays } from './lib.mjs'
import { playAct, mergeTimeline, syncMark, CARDS } from './record-core.mjs'

logTo('live-record')
const wanted = (process.env.SEGMENTS ?? '').split(',').filter(Boolean)
if (!wanted.length) throw new Error('Set SEGMENTS, e.g. SEGMENTS=E,F PERSONA=candidate node scripts/live-record.mjs')
const persona = process.env.PERSONA ?? personaOf(wanted[0])
const p = config.personas[persona]

const videoDir = path.join(RAW, wanted.join('-'))
fs.rmSync(videoDir, { recursive: true, force: true })
fs.mkdirSync(videoDir, { recursive: true })
const profileDir = path.join(RAW, '.profile', persona)
fs.rmSync(profileDir, { recursive: true, force: true })

const context = await chromium.launchPersistentContext(profileDir, {
  channel: process.env.BROWSER_CHANNEL ?? 'chrome',
  headless: false,
  viewport: VIEW,
  recordVideo: { dir: videoDir, size: VIEW },
  args: ['--window-size=' + VIEW.width + ',' + (VIEW.height + 120), '--hide-scrollbars'],
})

const page = context.pages()[0] ?? await context.newPage()
const recordingStart = Date.now()
await page.goto(/^https?:/.test(p.login) ? p.login : p.base + p.login, { waitUntil: 'domcontentloaded' })

const who = (p.user + '  (' + p.label + ')').padEnd(42).slice(0, 42)
console.log('')
console.log('  ┌────────────────────────────────────────────────────────┐')
console.log('  │  SIGN IN AS: ' + who + '│')
console.log('  │  Recording begins once you are in. The sign-in itself  │')
console.log('  │  is trimmed off and the raw file deleted afterwards.   │')
console.log('  └────────────────────────────────────────────────────────┘')
console.log('')

await page.waitForURL((url) => !/\/(login|auth|sso)/.test(url.pathname), { timeout: 0 })
await sleep(3000)

// Every page load re-validates the token, and on a rotating portal that is exactly when
// it gets rotated out from under us. If sign-in already landed somewhere usable, do not
// reload — go straight into the act.
if (new URL(page.url()).pathname !== p.home) {
  await page.goto(p.base + p.home, { waitUntil: 'domcontentloaded' })
  await sleep(6000)
}
await clearOverlays(page, config.overlaySelectors)

// Everything before this instant is the sign-in, and gets cut by build.py — which works
// it out from `activeMs` (how long the acts ran) against the file's real duration, so an
// unhurried sign-in costs nothing.
const videoStart = Date.now()
log('Signed in after ' + Math.round((videoStart - recordingStart) / 1000) + 's. That footage will be trimmed.')

const recorded = []
for (const segment of wanted) {
  const segmentSteps = steps.filter((s) => s.segment === segment)
  if (!segmentSteps.length) continue
  log('── recording act ' + segment + ' (' + persona + ', ' + segmentSteps.length + ' steps) ──')
  // Every act here lands in ONE file, so each needs its own slice of it or build.py
  // would emit the whole recording once per act.
  // and a sync flash of its own, so build.py can find that slice to the frame
  const markAt = await syncMark(page)
  const actStartMs = Date.now() - videoStart
  const timeline = await playAct(page, p.base, segment, segmentSteps, videoStart)
  recorded.push({
    segment, steps: timeline, actStartMs, actEndMs: Date.now() - videoStart, cards: CARDS,
    ...(markAt ? { syncMs: videoStart + actStartMs - markAt } : {}),
  })
}
const activeMs = Date.now() - videoStart
for (const r of recorded) r.activeMs = activeMs

const video = page.video()
await context.close()
const videoPath = await video.path()
for (const r of recorded) r.video = videoPath

mergeTimeline(recorded, wanted)
fs.rmSync(profileDir, { recursive: true, force: true })
log('Recorded ' + videoPath)
log('Next: python scripts/build.py   (the raw file still contains the sign-in — it is trimmed, not deleted)')
