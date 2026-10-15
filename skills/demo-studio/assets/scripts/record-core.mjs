// The recording engine. Used by recorder.mjs (saved sessions) and live-record.mjs
// (sign in and record in one process). Overlays — the caption and the title cards — are
// drawn into the page itself, so they are burned into the footage with no editor.
import {
  config, BRAND, LOGO, RAW, BUILD, VIEW, steps, durations, bySegment, actMeta, personaOf,
  contextOptions, seedContext, sleep, log, fs, path, words, isDiagramAct,
} from './config.mjs'
import { runAction, clearOverlays, toolkit, setVoice, missingCues } from './lib.mjs'
import { project } from './project.mjs'

const DUR = durations()
const WORDS = words()
const LEAD_MS = config.pacing.narrationLeadMs   // build.py places each line this far after its scene starts
const total = steps.length
const acts = Object.keys(bySegment())
const LAST_ACT = acts[acts.length - 1]
const { tailMs, openingHoldMs, actHoldMs, closingHoldMs } = config.pacing
const PANEL = config.captions.style === 'panel'
// With motion on, the cards are not filmed at all: build.py cross-fades the rendered ones in (scripts/motion.mjs).
// Each act records which kind it holds, so a film recorded with the static cards is never given a second set.
export const CARDS = config.motion ? 'film' : 'page'
// build.py burns "Powered and built by UnifyApps" into the bottom strip of every frame; the panel sits above it
const PANEL_BOTTOM = config.badge === false ? 20 : 58

async function caption(page, step, index) {
  // a framed persona (a phone-sized screen, "framed": true) carries no in-page caption: build.py places it in the
  // side panel of the film frame, so nothing ever covers the phone's own screen
  if (config.personas[personaOf(step.segment)]?.framed) return
  try {
    await page.evaluate(({ kicker, title, narration, counter, brand, panel, panelBottom, rtl }) => {
      let el = document.getElementById('ds-cap')
      if (!el) {
        el = document.createElement('div')
        el.id = 'ds-cap'
        el.setAttribute('dir', rtl ? 'rtl' : 'ltr')
        el.style.cssText = panel
          // The panel carries the spoken line, so the demo still reads with the sound off.
          ? 'position:fixed; left:24px; right:24px; bottom:' + panelBottom + 'px; z-index:2147483647; pointer-events:none;'
            + 'border-radius:18px; padding:14px 20px 15px; background:' + brand.ink + 'ee;'
            + 'border:1px solid ' + brand.accent + '73; box-shadow:0 20px 50px -20px rgba(0,0,0,.7);'
            + 'backdrop-filter:blur(14px); font-family:' + brand.font + '; color:#fff;'
            + 'opacity:0; transition:opacity .4s ease'
          // The chip stays out of the way when the screen itself is the story.
          : 'position:fixed; left:92px; bottom:34px; z-index:2147483647; pointer-events:none;'
            + 'font-family:' + brand.font + '; display:flex; align-items:center; gap:14px;'
            + 'background:' + brand.ink + '; color:#fff; padding:13px 22px 13px 18px; border-radius:12px;'
            + 'box-shadow:0 10px 34px rgba(0,0,0,.34); border-left:4px solid ' + brand.accent + '; max-width:78vw;'
            + 'opacity:0; transition:opacity .35s ease'
        document.body.appendChild(el)
        requestAnimationFrame(() => { el.style.opacity = '1' })
      }
      el.innerHTML = panel
        ? '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">'
            + '<span style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:'
            + brand.accent + '">' + kicker + '</span>'
            + '<span style="margin-left:auto;font-size:10px;letter-spacing:.14em;color:rgba(255,255,255,.55)">'
            + counter + '</span></div>'
          + '<div style="font-size:24px;font-weight:600;line-height:1.15;margin-bottom:5px">' + title + '</div>'
          + '<div style="font-size:13px;line-height:1.45;color:rgba(255,255,255,.82);max-width:1250px">' + narration + '</div>'
        : '<span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:' + brand.accent
            + ';font-weight:700;white-space:nowrap">' + kicker + ' · ' + counter + '</span>'
          + '<span style="font-size:19px;font-weight:600;line-height:1.3">' + title + '</span>'
      el.style.opacity = '1'
    }, {
      kicker: step.act ?? (config.actWord ?? 'Act') + ' ' + actMeta(step.segment).n,
      title: step.caption,
      narration: step.narration,
      counter: (index + 1) + '/' + total,
      brand: BRAND,
      panel: PANEL,
      panelBottom: PANEL_BOTTOM,
      rtl: !!config.captions?.rtl,
    })
  } catch { /* cosmetic */ }
}

/**
 * One full-frame magenta flash just before an act's clock starts. build.py finds it in the raw
 * footage and starts the act exactly there. Without it the start is inferred from the file's
 * length, and Playwright keeps filming for a variable stretch after the act ends (closing the
 * context, flushing the file) — on an earlier film that put every act's picture 0.1–1.8 s ahead of its voice,
 * so each highlight glowed before the word. Returns the wall-clock time the flash painted.
 */
export async function syncMark(page) {
  try {
    const at = await page.evaluate(() => new Promise((done) => {
      const el = document.createElement('div')
      el.id = 'ds-sync'
      el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#ff00ff;pointer-events:none'
      document.body.appendChild(el)
      // the frame that paints it comes right after this callback; a hidden tab never calls it
      const t = setTimeout(() => done(Date.now()), 120)
      requestAnimationFrame(() => { clearTimeout(t); done(Date.now()) })
    }))
    await sleep(360)
    await page.evaluate(() => document.getElementById('ds-sync')?.remove())
    await sleep(240)
    return at
  } catch {
    return null
  }
}

async function clearCaption(page) {
  try { await page.evaluate(() => document.getElementById('ds-cap')?.remove()) } catch { /* gone already */ }
}

async function titleCard(page, heading, sub, holdMs, kicker) {
  try {
    await page.evaluate(({ heading, sub, kicker, brand, logo }) => {
      const el = document.createElement('div')
      el.id = 'ds-title'
      el.style.cssText = 'position:fixed; inset:0; z-index:2147483647; background:' + brand.ink + '; color:#fff;'
        + 'display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;'
        + 'font-family:' + brand.font + '; text-align:center; padding:0 12vw;'
        + 'opacity:0; transition:opacity .5s ease'
      el.innerHTML =
        // the opening and closing cards carry the logo large; act cards carry it small
        (logo ? '<img alt="" src="' + logo + '" style="height:' + (kicker ? 64 : 132) + 'px;width:auto;margin-bottom:' + (kicker ? 4 : 10) + 'px">' : '')
        + (kicker ? '<div style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:' + brand.accent
          + ';font-weight:700">' + kicker + '</div>' : '')
        + '<div style="font-size:46px;font-weight:600;line-height:1.2;max-width:22ch">' + heading + '</div>'
        + (sub ? '<div style="font-size:19px;color:' + brand.muted + ';letter-spacing:.02em">' + sub + '</div>' : '')
        + '<div style="width:64px;height:3px;background:' + brand.accent + ';border-radius:2px;margin-top:6px"></div>'
      document.body.appendChild(el)
      requestAnimationFrame(() => { el.style.opacity = '1' })
    }, { heading, sub, kicker, brand: BRAND, logo: LOGO })
    await sleep(holdMs)
    await page.evaluate(() => {
      const el = document.getElementById('ds-title')
      if (!el) return
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 600)
    })
    await sleep(700)
  } catch { /* cosmetic */ }
}

/**
 * Plays one act on an already-open page and returns its step timeline.
 * `videoStart` is when the act's footage should be considered to begin, which is not
 * necessarily when recording started — see live-record.mjs.
 */
export async function playAct(page, base, segment, segmentSteps, videoStart) {
  const act = actMeta(segment)
  for (const step of segmentSteps) {
    const lost = missingCues(step)
    if (lost.length) log(`  CUE NOT IN THE LINE ${step.id}: ${lost.map((c) => '"' + c + '"').join(', ')} — these fire straight away`)
  }
  if (CARDS === 'page' && segment === acts[0] && config.opening) {
    await titleCard(page, config.opening.heading, config.opening.sub, openingHoldMs)
  }
  // an act may continue the previous chapter without a card ("card": false): used when a slow screen gets its own act
  // only so that it loads before filming
  if (CARDS === 'page' && act.card !== false) await titleCard(page, act.heading ?? act.title, null, actHoldMs, (config.actWord ?? 'Act') + ' ' + act.n)

  const timeline = []
  for (const step of segmentSteps) {
    const index = steps.findIndex((s) => s.id === step.id)
    const narrationMs = (DUR[step.id] ?? 10) * 1000

    // A full page load shows a blank frame, so navigate first, silently — narration should
    // only ever play over a page that already has something on it. An in-app `spa` move
    // repaints in place, so it can happen under the voice like any other action.
    const navigateFirst = step.action.type === 'goto' && !step.action.spa
    if (navigateFirst) {
      await clearCaption(page)
      // only the load happens off the voice; the step's `then` (scroll, highlight, click) is the
      // scene itself and runs under the narration, or the film has a silent stretch every scene
      const { then: _then, ...load } = step.action
      try { await runAction(page, load, base, step) } catch (e) { log('  PREP FAILED', step.id, e.message.split('\n')[0]) }
      await clearOverlays(page)
    }

    const startMs = Date.now() - videoStart
    timeline.push({ id: step.id, startMs })
    // build.py starts this line LEAD_MS after startMs; `at` cues count from the same instant
    setVoice({ id: step.id, t0: videoStart + startMs + LEAD_MS, words: WORDS[step.id], narration: step.narration, durationMs: narrationMs })
    log('  ' + step.id.padEnd(4) + ' @ ' + String(Math.round(startMs / 1000)).padStart(3) + 's  ' + step.caption)
    await caption(page, step, index)

    const actionStart = Date.now()
    const underVoice = navigateFirst ? step.action.then : step.action
    if (underVoice) {
      await sleep(LEAD_MS)
      try { await runAction(page, underVoice, base, step) } catch (e) { log('  ACTION FAILED', step.id, e.message.split('\n')[0]) }
      await caption(page, step, index)   // the app may have repainted over the caption
    }

    const spent = Date.now() - actionStart
    const hold = narrationMs + tailMs - spent
    if (hold > 0) await sleep(hold)
    else if (-hold > 1500) {
      // An action that outlasts its line (a slow agent answer, a job) is dead air on the film.
      // Record the silent stretch; build.py cuts it out, so the result arrives with a clean cut.
      // Half a second before the result is kept so the change is still seen happening.
      const from = actionStart - videoStart + narrationMs + tailMs
      const to = actionStart - videoStart + spent - 500
      if (to - from > 800) timeline[timeline.length - 1].cut = [Math.round(from), Math.round(to)]
      log(`  OVERRUN ${step.id}: the action ran ${Math.round(-hold / 1000)}s past its narration; that stretch is cut from the film.`)
    }
    setVoice(null)
  }

  await clearCaption(page)
  if (CARDS === 'page' && segment === LAST_ACT && config.closing) {
    await titleCard(page, config.closing.heading, config.closing.sub, closingHoldMs)
    // Hold on a clean colour field so the file does not end on a live UI frame.
    await page.evaluate((ink) => {
      const el = document.createElement('div')
      el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:' + ink
      document.body.appendChild(el)
    }, BRAND.ink)
    await sleep(2200)
  } else {
    await sleep(1800)
  }
  return timeline
}

/**
 * Put the app into the state this act opens in — approve the thing the story says was
 * approved last week, fire the event, reset the data. It runs in a hidden context that is
 * never filmed, which is why an act can be re-recorded on its own and still make sense.
 */
export async function prepareAct(browser, segment, storage) {
  const fn = project.prepare?.[segment]
  if (!fn) return
  const persona = personaOf(segment)
  const p = config.personas[persona]
  log('   staging act ' + segment + ' off camera…')
  const context = await browser.newContext(contextOptions(persona, storage ? { storageState: storage } : {}))
  await seedContext(context, persona)
  const page = await context.newPage()
  try {
    await page.goto(p.base + p.home, { waitUntil: 'domcontentloaded' })
    await sleep(5000)
    await fn(page, toolkit(page, p.base))
  } catch (e) {
    log('   STAGING FAILED for act ' + segment + ': ' + e.message.split('\n')[0])
  } finally {
    await context.close()
  }
}

async function recordSegment(browser, segment, segmentSteps, storage) {
  const persona = personaOf(segment)
  const p = config.personas[persona]
  const videoDir = path.join(RAW, segment)
  fs.rmSync(videoDir, { recursive: true, force: true })
  fs.mkdirSync(videoDir, { recursive: true })

  const context = await browser.newContext({
    ...contextOptions(persona, storage ? { storageState: storage } : {}),
    recordVideo: { dir: videoDir, size: p.viewport ?? VIEW },
  })
  await seedContext(context, persona)
  const page = await context.newPage()

  await page.goto(p.base + p.home, { waitUntil: 'domcontentloaded' })
  // a slow landing page (a graph canvas, a record web) must finish painting before the act is filmed:
  // persona.homeWaitText waits for text that only appears once it has; persona.homeSettleMs replaces the settle
  // A missing home text means the act would film something else (a platform error page, a half-loaded screen): the
  // MCIT film recorded 52 s of "permission check is temporarily unavailable" this way. Reload once — those errors are
  // transient — and if the text is still missing, stop the act rather than film it.
  if (p.homeWaitText) {
    const seen = () => page.getByText(p.homeWaitText, { exact: false }).first().waitFor({ state: 'visible', timeout: 90000 }).then(() => true, () => false)
    if (!(await seen())) {
      log('   home text "' + p.homeWaitText + '" never appeared; reloading once')
      await page.reload({ waitUntil: 'domcontentloaded' })
      if (!(await seen())) {
        await context.close()
        throw new Error('Act ' + segment + ': home text "' + p.homeWaitText + '" never appeared (' + page.url() + '). Not filmed; re-run this act.')
      }
    }
  }
  await sleep(p.homeSettleMs ?? 7000)
  if (p.auth && /\/(login|auth|sso)/.test(new URL(page.url()).pathname)) {
    await context.close()
    throw new Error('Session for "' + persona + '" is dead — landed on ' + page.url()
      + '. Re-run: ONLY=' + persona + ' FORCE=1 node scripts/auth.mjs')
  }
  await clearOverlays(page)

  // Playwright starts filming when the page is created, which is before the session check
  // and the settle above — several seconds of a blank page the timeline knows nothing
  // about. build.py finds the sync flash in the footage and starts the act `syncMs` after it;
  // `activeMs` (how long the act ran, against the file's length) is the fallback estimate.
  const markAt = await syncMark(page)
  const videoStart = Date.now()
  const timeline = await playAct(page, p.base, segment, segmentSteps, videoStart)
  const activeMs = Date.now() - videoStart

  // Carry this act's browser state into the next one, so anything the app accumulated
  // (a dismissed hint, a counter, a conversation) is still there in the following act.
  const nextStorage = await context.storageState().catch(() => null)
  const video = page.video()
  await context.close()
  const syncMs = markAt ? videoStart - markAt : undefined
  return { result: { segment, video: await video.path(), steps: timeline, activeMs, syncMs, cards: CARDS }, storage: nextStorage }
}

/** Merge freshly recorded acts into build/timeline.json, keeping the others. */
export function mergeTimeline(recorded, wanted) {
  const timelinePath = path.join(BUILD, 'timeline.json')
  fs.mkdirSync(BUILD, { recursive: true })
  const existing = fs.existsSync(timelinePath) ? JSON.parse(fs.readFileSync(timelinePath, 'utf-8')).segments ?? [] : []
  const order = Object.keys(bySegment())
  const merged = [...existing.filter((s) => !wanted.includes(s.segment)), ...recorded]
    .sort((a, b) => order.indexOf(a.segment) - order.indexOf(b.segment))
  fs.writeFileSync(timelinePath, JSON.stringify({ segments: merged }, null, 2))
  log('Wrote build/timeline.json (' + merged.map((s) => s.segment).join(', ') + ')')
  return merged
}

/** Record the given acts and merge them into build/timeline.json. */
export async function recordWith(browser, wanted, storage) {
  const recorded = []
  // Per persona, because state only carries forward between acts played by the same person.
  const carried = {}
  for (const segment of wanted) {
    const segmentSteps = steps.filter((s) => s.segment === segment)
    if (!segmentSteps.length) continue
    if (isDiagramAct(segment)) {
      log('── act ' + segment + ' is the architecture diagram: motion.mjs draws it, nothing to record ──')
      continue
    }
    const persona = personaOf(segment)
    const from = carried[persona] ?? storage
    await prepareAct(browser, segment, from)
    log('── recording act ' + segment + ' (' + persona + ', ' + segmentSteps.length + ' steps) ──')
    const { result, storage: next } = await recordSegment(browser, segment, segmentSteps, from)
    recorded.push(result)
    // Only the app's own origin state moves forward — whatever the demo accumulated. The
    // cookies stay as they were saved, because a portal that rotates tokens will have
    // handed this context one that dies with it.
    if (next) carried[persona] = { cookies: (from ?? next).cookies, origins: next.origins }
    // Write after every act: a failure in act five must not cost acts one to four, and a
    // partial run must not drop acts recorded earlier.
    mergeTimeline(recorded, recorded.map((r) => r.segment))
  }
  return recorded
}
