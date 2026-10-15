// The action engine. Shared by the capture pass (stills for the manual) and the recorder
// (video). A step is one action; an action can be a sequence, or a named function in the
// project's own actions.mjs when the app needs real Playwright.
import { config, BRAND, VIEW, sleep, log } from './config.mjs'
import { project } from './project.mjs'

const TOAST = config.toastSelector ?? '[data-sonner-toast]'
// Apps scroll an inner pane, not the window. Anything matching this is fair game.
const SCROLLERS = config.scrollContainers ?? 'main, main *, [role="main"], [role="main"] *'
// `[role=dialog]` is a CSS attribute match, so it misses a native <dialog>, whose dialog
// role is implicit. Cover both, and let an app with its own modal markup say so.
const DIALOG = config.dialogSelector ?? '[role=dialog], dialog[open]'

/** Wait until the app stops painting — these pages stream content well after domcontentloaded. */
export async function settle(page, ms) {
  await sleep(ms ?? 6000)
  try {
    await page.waitForFunction(() => document.body && document.body.innerText.trim().length > 60, { timeout: 8000 })
  } catch { /* some screens are chart-only and never carry text */ }
}

/** Draw a cursor dot plus an expanding ring at (x, y), then hold so the eye catches it. */
export async function showPointer(page, x, y) {
  try {
    await page.evaluate(({ x, y, ink, accent }) => {
      const id = 'ds-pointer-style'
      if (!document.getElementById(id)) {
        const style = document.createElement('style')
        style.id = id
        style.textContent = `
          @keyframes ds-ring { from { transform:scale(.3); opacity:.9 } to { transform:scale(1); opacity:0 } }
          .ds-dot { position:fixed; width:18px; height:18px; margin:-9px 0 0 -9px; border-radius:50%;
                    background:${ink}; box-shadow:0 0 0 3px rgba(255,255,255,.9), 0 4px 14px rgba(0,0,0,.35);
                    z-index:2147483646; pointer-events:none }
          .ds-ring { position:fixed; width:70px; height:70px; margin:-35px 0 0 -35px; border-radius:50%;
                     border:3px solid ${accent}; z-index:2147483646; pointer-events:none;
                     animation:ds-ring .75s ease-out forwards }`
        document.head.appendChild(style)
      }
      for (const cls of ['ds-dot', 'ds-ring']) {
        const el = document.createElement('div')
        el.className = cls
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        document.body.appendChild(el)
        setTimeout(() => el.remove(), cls === 'ds-dot' ? 1100 : 800)
      }
    }, { x, y, ink: BRAND.ink, accent: BRAND.accent })
    await sleep(700)
  } catch { /* the overlay is cosmetic; never fail a take over it */ }
}

async function pointAt(page, locator) {
  const box = await locator.boundingBox().catch(() => null)
  if (box) await showPointer(page, box.x + box.width / 2, box.y + box.height / 2)
}

// ── The voice clock ─────────────────────────────────────────────────────────────────
// While a scene is filmed, the recorder says when its line starts playing on the film and
// hands over the word timings narrate.py measured. An action with `at` then waits for its
// word instead of a guessed `settle`: `"at": "unpaid balance"` fires as the voice says it.
// Outside a take (the capture pass) there is no clock and `at` is ignored.
let voice = null

export function setVoice(v) { voice = v ? { ...v, cursor: 0 } : null }

const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]+/gu, '').split(/\s+/).filter(Boolean)

/** Every `at` a step's action tree carries, so a phrase missing from its line is caught before a take. */
export function cuesOf(action, found = []) {
  if (!action || typeof action !== 'object') return found
  if (typeof action.at === 'string') found.push(action.at)
  for (const one of action.steps ?? []) cuesOf(one, found)
  cuesOf(action.then, found)
  return found
}

export function missingCues(step) {
  const line = ' ' + norm(step.narration ?? '').join(' ') + ' '
  return cuesOf(step.action).filter((at) => !line.includes(' ' + norm(at).join(' ') + ' '))
}

/** [startMs, endMs] of `at` inside the line: a phrase from the narration, or a number of ms. */
function locate(at) {
  if (typeof at === 'number') return [at, at]
  const want = norm(at)
  const spoken = (voice.words ?? []).map(([s, e, t]) => [s, e, norm(t).join(' ')]).filter((w) => w[2])
  // words.json tokens can merge ("$4,212" is one word), so match on the joined text, from the
  // last cue on — a phrase that occurs twice resolves in the order the step uses it
  const phrase = want.join(' ')
  const starts = [...spoken.keys()]
  for (const i of [...starts.slice(voice.cursor), ...starts.slice(0, voice.cursor)]) {
    let text = ''
    for (let j = i; j < spoken.length && text.length < phrase.length; j++) {
      text = (text ? text + ' ' : '') + spoken[j][2]
      if (text === phrase) {
        voice.cursor = j + 1
        return [spoken[i][0], spoken[j][1]]
      }
    }
  }
  // No word timings (voiced before narrate.py kept them): estimate from where the phrase sits.
  const line = norm(voice.narration ?? '').join(' ')
  const pos = line.indexOf(phrase)
  if (pos < 0 || !line.length) return null
  if (!voice.warned) { log(`    no word timings for ${voice.id}; cues are estimated — re-run narrate.py`); voice.warned = true }
  return [voice.durationMs * pos / line.length, voice.durationMs * (pos + phrase.length) / line.length]
}

/**
 * Wait for the voice to reach `at`. Returns how long the phrase lasts from now, so a glow can
 * be held until the voice has finished naming the thing (0 when there is no clock).
 */
export async function cue(at, early = config.pacing.cueLeadMs) {
  if (at == null || !voice) return 0
  const span = locate(at)
  if (!span) { log(`    CUE "${at}" is not in ${voice.id}'s narration — ran it straight away`); return 0 }
  const wait = voice.t0 + span[0] - early - Date.now()
  if (wait > 0) await sleep(wait)
  else if (wait < -700) log(`    LATE CUE ${voice.id} "${at}": ${(-wait / 1000).toFixed(1)}s after the word — shorten what runs before it`)
  return Math.max(0, voice.t0 + span[1] - Date.now())
}

/**
 * Glow ring around an element. The pointer says "this was clicked"; the glow says
 * "look here" for the thing the narration is talking about but nobody touches.
 */
export async function highlight(locator, ms = 2500) {
  await locator.evaluate((el, { d, accent }) => {
    const previous = el.style.boxShadow
    el.style.transition = 'box-shadow .3s'
    el.style.boxShadow = `0 0 0 3px ${accent}, 0 0 30px ${accent}88`
    setTimeout(() => { el.style.boxShadow = previous }, d)
  }, { d: ms, accent: BRAND.accent }).catch(() => { /* cosmetic */ })
  await sleep(600)
}

/**
 * The glow for an action that carries `highlight` or is one: on its `at` word when there is
 * one, and held until the voice has finished naming the thing, so the ring and the words land
 * together. The element is already on screen — the reveal happens before the word.
 */
async function glow(el, action, fallbackMs) {
  const naming = await cue(action.at)
  const asked = action.type === 'highlight' ? action.ms : (action.highlight === true ? undefined : action.highlight)
  await highlight(el, asked ?? (action.at != null ? Math.max(2500, naming + 1500) : fallbackMs))
}

export function target(page, action) {
  // `within: "dialog"` is the common case — scope to whatever this app uses for modals.
  const scope = action.within === 'dialog' ? DIALOG : action.within
  const root = scope ? page.locator(scope).last() : page
  if (action.selector) return root.locator(action.selector).first()
  if (action.role) return root.getByRole(action.role, { name: action.text, exact: action.exact ?? false }).first()
  if (action.label) return root.getByLabel(action.label, { exact: action.exact ?? true }).first()
  return root.getByText(action.text, { exact: action.exact ?? false }).first()
}

/**
 * Navigate without a reload. A single-page app re-renders in place, so the viewer never
 * sees a white flash — which a `goto` always produces. Use it inside an act; use a real
 * `goto` when the app must be rebuilt from scratch (see the pointer-events trap in
 * references/gotchas.md).
 */
export async function spaGo(page, route, settleMs = 3500) {
  await page.evaluate((r) => {
    history.pushState({}, '', r)
    dispatchEvent(new PopStateEvent('popstate'))
  }, route)
  await sleep(settleMs)
}

/** Scroll every scrollable region — the window and any inner pane — smoothly. */
export async function scrollBy(page, px, ms = 2500, ticks = 25) {
  for (let i = 0; i < ticks; i++) {
    await page.evaluate(({ dy, sel }) => {
      let moved = false
      for (const el of document.querySelectorAll(sel)) {
        const style = getComputedStyle(el)
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 40) {
          el.scrollBy(0, dy)
          moved = true
        }
      }
      if (!moved) window.scrollBy(0, dy)
    }, { dy: px / ticks, sel: SCROLLERS })
    await sleep(ms / ticks)
  }
}

export async function scrollTop(page) {
  await page.evaluate((sel) => {
    for (const el of document.querySelectorAll(sel)) if (el.scrollTop) el.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, SCROLLERS).catch(() => {})
  await sleep(500)
}

/** Wait for an app confirmation (a toast) matching `re`. Returns its text, or TIMEOUT. */
export async function toast(page, re, timeout = 120000) {
  const pattern = re instanceof RegExp ? re : new RegExp(re, 'i')
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const text = await page.evaluate(
      (sel) => [...document.querySelectorAll(sel)].map((t) => t.innerText.replace(/\n/g, ' ')).join(' | '),
      TOAST,
    ).catch(() => '')
    if (pattern.test(text)) return text
    await sleep(700)
  }
  return 'TIMEOUT'
}

/** Toasts outlive the action that caused them and land in the next screenshot. */
export async function clearToasts(page) {
  await page.evaluate((sel) => document.querySelectorAll(sel).forEach((t) => t.remove()), TOAST).catch(() => {})
}

/** Wait for something the app does on its own — a push, a job finishing, a takeover screen. */
export async function waitForText(page, text, timeout = 60000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await page.getByText(text, { exact: false }).first().isVisible().catch(() => false)) {
      return Math.round((Date.now() - started) / 1000)
    }
    await sleep(800)
  }
  log(`    waitForText "${text}" timed out after ${Math.round(timeout / 1000)}s`)
  return null
}

/** Click the affirmative button in the topmost dialog, whatever this app calls it. */
export async function confirmDialog(page, { timeout = 8000 } = {}) {
  const dialog = page.locator(DIALOG).last()
  await dialog.waitFor({ state: 'visible', timeout })
  await sleep(700)
  const buttons = dialog.getByRole('button')
  for (let i = (await buttons.count()) - 1; i >= 0; i--) {
    const label = (await buttons.nth(i).innerText()).trim()
    if (label && !/^(cancel|close|back|dismiss)$/i.test(label)) {
      await pointAt(page, buttons.nth(i))
      await buttons.nth(i).click()
      return label
    }
  }
  throw new Error('No confirm button in the dialog')
}

/** Everything a custom step in actions.mjs can reach for, without importing anything. */
export function toolkit(page, base) {
  const ctx = {
    page,
    base,
    config,
    sleep,
    log,
    settle: (ms) => settle(page, ms),
    go: (route, ms) => spaGo(page, route, ms),
    nav: (route, ms) => runOne(page, { type: 'nav', route, settle: ms }, base),
    /** The text of the largest same-origin iframe (a docked chat, an embedded report). */
    frameText: async () => { let best = ''; for (const f of page.frames()) { if (f === page.mainFrame()) continue; const t = await f.evaluate(() => document.body?.innerText ?? '').catch(() => ''); if (t.length > best.length) best = t } return best },
    goto: async (route, ms) => { await page.goto(base + route, { waitUntil: 'domcontentloaded' }); await settle(page, ms) },
    find: (spec) => target(page, typeof spec === 'string' ? { text: spec } : spec),
    click: (spec) => runOne(page, { type: 'click', ...(typeof spec === 'string' ? { text: spec } : spec) }, base),
    type: (spec) => runOne(page, { type: 'type', ...spec }, base),
    fill: (spec) => runOne(page, { type: 'fill', ...spec }, base),
    press: (key) => page.keyboard.press(key),
    hover: (spec) => runOne(page, { type: 'hover', ...(typeof spec === 'string' ? { text: spec } : spec) }, base),
    scroll: (px, ms) => scrollBy(page, px, ms),
    scrollTo: (spec) => runOne(page, { type: 'scrollTo', ...(typeof spec === 'string' ? { text: spec } : spec) }, base),
    scrollTop: () => scrollTop(page),
    // with `at` in the spec, the ring waits for its word, like a declarative highlight
    highlight: (spec, ms) => (spec?.at != null
      ? runOne(page, { type: 'highlight', ...spec, ...(ms ? { ms } : {}) }, base)
      : highlight(target(page, typeof spec === 'string' ? { text: spec } : spec), ms)),
    /** Wait until the voice reaches a phrase of this step's line (or a number of ms into it). */
    cue: (at) => cue(at),
    pointAt: (spec) => pointAt(page, target(page, typeof spec === 'string' ? { text: spec } : spec)),
    toast: (re, timeout) => toast(page, re, timeout),
    clearToasts: () => clearToasts(page),
    waitForText: (text, timeout) => waitForText(page, text, timeout),
    confirmDialog: (opts) => confirmDialog(page, opts),
    run: (action) => runAction(page, action, base),
  }
  return ctx
}

export async function runAction(page, action, base, step) {
  // A step whose id is in actions.mjs is driven by that function, whatever its action says.
  const custom = project.actions?.[action.fn ?? step?.id]
  if (action.type === 'custom' || (custom && action.type === undefined)) {
    if (!custom) throw new Error(`No function "${action.fn ?? step?.id}" exported from actions.mjs`)
    await custom(page, toolkit(page, base), action)
    return
  }
  await runOne(page, action, base)
  // A saved conversation or a long report opens scrolled to the newest content, so a
  // `goto` alone lands on the wrong part of the page. `then` re-aims once it settles.
  if (action.then) await runOne(page, action.then, base)
}

// Actions that glow wait for their word after scrolling the element into view; everything
// else (a click, a scroll, a move) starts on its word.
const REVEAL_FIRST = new Set(['highlight', 'scrollTo'])

async function runOne(page, action, base) {
  if (action.at != null && !REVEAL_FIRST.has(action.type) && !(action.type === 'click' && action.highlight)) await cue(action.at)
  switch (action.type) {
    case 'sequence': {
      for (const one of action.steps ?? []) await runOne(page, one, base)
      return
    }
    case 'custom': {
      const fn = project.actions?.[action.fn]
      if (!fn) throw new Error(`No function "${action.fn}" exported from actions.mjs`)
      await fn(page, toolkit(page, base), action)
      return
    }
    case 'nav': {
      // In-app navigation to an app route, under the voice and with no white flash. The router's
      // basename is read from the live URL with config.spaPrefix (a regex whose first match is the
      // basename, e.g. "^/agent-api/preview/b/[^/]+/[^/]+"), so a preview whose path carries a
      // branch name keeps working when the branch changes.
      const prefix = await page.evaluate((re) => (re ? (location.pathname.match(new RegExp(re))?.[0] ?? '') : ''), config.spaPrefix ?? '')
      await spaGo(page, prefix.replace(/\/$/, '') + action.route, action.settle ?? 3500)
      if (action.then) await runOne(page, action.then, base)
      return
    }
    case 'goto': {
      // `spa: true` pushes the route instead of reloading — no white flash mid-act.
      if (action.spa) await spaGo(page, action.url, action.settle ?? 3500)
      else {
        await page.goto(base + action.url, { waitUntil: 'domcontentloaded' })
        await settle(page, action.settle)
      }
      return
    }
    case 'click': {
      const el = target(page, action)
      await el.waitFor({ state: 'visible', timeout: action.timeout ?? 20000 })
      await el.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })).catch(() => {})
      await sleep(600)
      if (action.highlight) await glow(el, action, 2500)
      // Playwright's cursor is invisible on film, so a click reads as the page changing
      // for no reason. Draw the pointer where the click lands, then click.
      await pointAt(page, el)
      await el.click({ timeout: 15000 })
      if (action.toast) log(`    toast: ${await toast(page, action.toast, action.toastTimeout ?? 120000)}`)
      if (action.confirm) log(`    confirmed: ${await confirmDialog(page)}`)
      await settle(page, action.settle)
      return
    }
    case 'type': {
      const el = target(page, action)
      await el.waitFor({ state: 'visible', timeout: action.timeout ?? 20000 })
      await el.scrollIntoViewIfNeeded()
      await pointAt(page, el)
      await el.click()
      // Type at human speed — an instantly-filled field reads as a cut, not as typing.
      await page.keyboard.type(action.value ?? '', { delay: action.delay ?? 45 })
      if (action.enter) await page.keyboard.press('Enter')
      if (action.toast) log(`    toast: ${await toast(page, action.toast, action.toastTimeout ?? 120000)}`)
      await settle(page, action.settle ?? 2000)
      return
    }
    case 'fill': {
      // Straight into the field, no typing animation — for the long values nobody watches.
      const el = target(page, action)
      await el.waitFor({ state: 'visible', timeout: action.timeout ?? 20000 })
      await el.fill(action.value ?? '')
      await sleep(action.settle ?? 900)
      return
    }
    case 'hover': {
      const el = target(page, action)
      await el.waitFor({ state: 'visible', timeout: action.timeout ?? 12000 })
      await el.scrollIntoViewIfNeeded()
      await pointAt(page, el)
      await el.hover()
      await sleep(action.settle ?? 1500)
      return
    }
    case 'press': {
      await page.keyboard.press(action.key ?? 'Enter')
      await settle(page, action.settle ?? 2000)
      return
    }
    case 'highlight': {
      const el = target(page, action)
      await el.waitFor({ state: 'visible', timeout: action.timeout ?? 12000 })
      await el.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })).catch(() => {})
      await sleep(800)
      await glow(el, action, 2500)
      // a cued glow is already on its word, so the next beat only needs a breath, not a guess
      await sleep(action.settle ?? (action.at != null ? 300 : 1200))
      return
    }
    case 'confirmDialog': {
      log(`    confirmed: ${await confirmDialog(page)}`)
      await settle(page, action.settle ?? 2000)
      return
    }
    case 'toast': {
      log(`    toast: ${await toast(page, action.match ?? /./, action.timeout ?? 120000)}`)
      await sleep(action.settle ?? 800)
      return
    }
    case 'waitForText': {
      const seconds = await waitForText(page, action.text, action.timeout ?? 60000)
      if (seconds !== null) log(`    "${action.text}" appeared after ${seconds}s`)
      await sleep(action.settle ?? 1200)
      return
    }
    case 'scrollTo': {
      const el = target(page, action)
      try {
        await el.waitFor({ state: 'visible', timeout: action.timeout ?? 12000 })
      } catch {
        // Never leave a scene frozen on the frame the previous one ended on — a static
        // shot under 20s of narration reads as a broken demo. Scroll blind instead.
        log(`    scrollTo "${action.text ?? action.selector}" not found; scrolling ${action.fallback ?? 600}px instead`)
        await scrollBy(page, action.fallback ?? 600, action.settle ?? 2200)
        return
      }
      // scrollIntoViewIfNeeded is a no-op when the element is already a sliver at the
      // viewport edge, which silently produces identical frames. Force it to the middle,
      // and smoothly, because this is being filmed.
      await el.evaluate((node, block) => node.scrollIntoView({ block, inline: 'nearest', behavior: 'smooth' }), action.block ?? 'center')
      await sleep(action.settle ?? 2200)
      if (action.highlight) await glow(el, action, 2500)
      else await cue(action.at)   // no glow: the scroll is the reveal; hold it until the word
      return
    }
    case 'scroll': {
      await scrollBy(page, action.amount ?? 300, action.ms ?? 2500)
      await sleep(action.settle ?? 1000)
      return
    }
    case 'scrollTop': {
      await scrollTop(page)
      return
    }
    case 'wait':
      await sleep(action.ms ?? 1000)
      return
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

/** Dismiss whatever the app throws over the top of the content, and clear stale composer text. */
export async function clearOverlays(page, extraSelectors = []) {
  try {
    await page.evaluate((selectors) => {
      for (const sel of selectors) document.querySelector(sel)?.click()
    }, [
      '[role="dialog"] button[aria-label*="lose" i]',
      '.cookie-banner button',
      '[data-testid="close"]',
      ...(config.overlaySelectors ?? []),
      ...extraSelectors,
    ])
  } catch { /* nothing to clear */ }

  // Chat-style apps keep the last draft in the composer, which reads as confusing on
  // screen. Clear it with real keys so React's state follows. Never press Enter here.
  try {
    const box = page.locator('[contenteditable="true"]').first()
    if (await box.isVisible({ timeout: 1200 }).catch(() => false)) {
      const value = await box.innerText().catch(() => '')
      if (value.trim()) {
        await box.click()
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Delete')
        await page.mouse.move(VIEW.width / 2, 200)
        await sleep(300)
      }
    }
  } catch { /* the composer is cosmetic */ }
}
