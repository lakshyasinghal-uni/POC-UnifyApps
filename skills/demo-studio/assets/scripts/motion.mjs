// The film's motion graphics, rendered with HyperFrames (HeyGen's open-source HTML-to-video engine, Apache 2.0).
// build.py runs this; run it alone to look at the clips before a full build:
//
//   node scripts/motion.mjs            render everything the film needs (cached; only what changed re-renders)
//   node scripts/motion.mjs --open     the same, then print where the clips are
//   node scripts/motion.mjs --diagram  only the architecture act (diagram.json), and its stills in build/shots
//
// What it makes, and where build.py puts it:
//   head_<act>     the opening card (first act) and the act card, ending on the act's real first screen: the card
//                  hands over to the app with a focus pull, so the film cuts onto live footage without a seam
//   tail_<act>     the last act's final screen pulling back into the closing lockup (logo, tagline, optional pill)
//   seat_<act>     a lower third over the footage when the act changes whose seat we are in (transparent)
//   callout_<step> a count-up stat card over the footage on the word that names the figure (transparent, opt-in
//                  per step: "callout" in steps.json)
//   diagram_<act>  the architecture act: diagram.json drawn and animated on the narration's words (scripts/diagram.mjs).
//                  It is rendered first, its first and last frames become the act's boundary frames, and a still of
//                  each line goes to build/shots/<step>.jpg so the script, the manual and the stills include it
// Their moves are adapted from the HyperFrames registry: lt-kicker-name (seat), mk-progress-stat (callout),
// logo-outro and cta-lockup (closing), and the transitions guide's corporate grammar — push and focus pull, the
// transition is the exit, only the final scene fades out.
//
// The boundary frames come from build.py (build/motion/frames/<act>_first.png, <act>_last.png). Without them (this
// script run on its own before any recording) a card ends on its own last frame and build.py dissolves instead.
// `"motion": false` in demo.config.json switches all of it off and the recorder draws the old static cards.
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { config, BRAND, ROOT, BUILD, VIEW, SHOTS, steps, bySegment, actMeta, personaOf, durations, words, logTo, log, fs, path, isDiagramAct, diagramSpec } from './config.mjs'
import { prepareDiagram, diagramTiming, diagramHtml } from './diagram.mjs'

const require = createRequire(import.meta.url)
const MOTION_DIR = path.join(BUILD, 'motion')
const FRAMES_DIR = path.join(MOTION_DIR, 'frames')
const MANIFEST = path.join(MOTION_DIR, 'cards.json')
const FPS = 25
const MOTION = config.motion || {}
// an Arabic (right-to-left) film mirrors the overlays and never letter-spaces: tracking breaks the joined letters
const RTL = Boolean(config.captions?.rtl)
const START = RTL ? 'right' : 'left'
const END = RTL ? 'left' : 'right'
const { openingHoldMs, actHoldMs, closingHoldMs } = config.pacing
// the card lengths keep the film's old rhythm: the static cards held for these plus their fades
const OPENING_S = (openingHoldMs + 1200) / 1000
const ACT_S = (actHoldMs + 1200) / 1000
const CLOSING_S = (closingHoldMs + 2900) / 1000
const PUSH_S = 0.6        // opening → act: a push, the corporate primary
const PULL_S = 0.9        // card ↔ app: a focus pull
const APP_HOLD_S = 0.25   // the app frame holds this long at the end of a head card before the cut to footage
const SEAT_S = 4.2
const CALLOUT_S = 5.0

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
// headings arrive word by word, so each word is its own block that can rise out of a clipped line
const wordsOf = (s, cls) => String(s ?? '').trim().split(/\s+/).filter(Boolean)
  .map((w) => `<span class="w"><span class="${cls}">${esc(w)}</span></span>`).join(' ')
const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]+/gu, '').split(/\s+/).filter(Boolean)

/** The size an act's picture is in the film, which everything laid over it has to match. */
function frameFor(segment) {
  if (isDiagramAct(segment)) return VIEW
  const persona = config.personas[personaOf(segment)]
  if (persona.framed) return { width: VIEW.width, height: VIEW.height, ...(config.frame ?? {}) }
  return persona.viewport ?? VIEW
}

const frameFile = (segment, which) => {
  const f = path.join(FRAMES_DIR, `${segment}_${which}.png`)
  return fs.existsSync(f) ? f : null
}

/** Where `at` (a phrase of the line, or milliseconds) falls in the line, from narrate.py's word timings. */
function cueMs(step, at) {
  if (typeof at === 'number') return at
  const spoken = (words()[step.id] ?? []).map(([s, , t]) => [s, norm(t).join(' ')]).filter((w) => w[1])
  const want = norm(at)
  for (let i = 0; i < spoken.length; i += 1) {
    if (want.every((w, k) => spoken[i + k]?.[1] === w)) return spoken[i][0]
  }
  // voiced before words.json existed: estimate from where the phrase sits in the line
  const line = norm(step.narration)
  const idx = line.join(' ').indexOf(want.join(' '))
  if (idx < 0) return 0
  const lineMs = (durations()[step.id] ?? 0) * 1000
  return Math.round((line.join(' ').slice(0, idx).split(' ').length / Math.max(1, line.length)) * lineMs)
}

/** Every clip the film needs. */
function plan() {
  const acts = Object.keys(bySegment())
  const clips = []
  let previousPersona = null
  acts.forEach((segment, i) => {
    const frame = frameFor(segment)
    const scenes = []
    let t = 0
    if (i === 0 && config.opening) {
      scenes.push({ kind: 'opening', start: t, dur: OPENING_S, heading: config.opening.heading, sub: config.opening.sub })
      t += OPENING_S
    }
    const act = actMeta(segment)
    // a later act starts on the previous act's last screen and pulls back from it: the film never hard-cuts
    const previousLast = i > 0 && act.card !== false ? frameFile(acts[i - 1], 'last') : null
    if (previousLast) {
      scenes.push({ kind: 'app', start: 0, dur: PULL_S, image: previousLast })
      t = PULL_S * 0.35
    }
    if (act.card !== false) {
      scenes.push({ kind: 'act', start: t, dur: ACT_S, heading: act.heading ?? act.title, kicker: (config.actWord ?? 'Act') + ' ' + act.n, index: i, of: acts.length })
      t += ACT_S
    }
    const first = frameFile(segment, 'first')
    if (scenes.length) {
      if (first) {
        scenes.push({ kind: 'app', start: t, dur: PULL_S + APP_HOLD_S, image: first })
        t += PULL_S + APP_HOLD_S
      }
      clips.push({ id: `head_${segment}`, segment, role: 'head', scenes, duration: t, frame, join: first ? 'cut' : 'dissolve', after: previousLast ? 'cut' : 'dissolve' })
    }
    if (i === acts.length - 1 && config.closing) {
      const last = frameFile(segment, 'last')
      const tail = []
      if (last) tail.push({ kind: 'app', start: 0, dur: PULL_S, image: last })
      tail.push({ kind: 'closing', start: last ? PULL_S * 0.35 : 0, dur: CLOSING_S, heading: config.closing.heading, sub: config.closing.sub, cta: config.closing.cta })
      const duration = tail[tail.length - 1].start + CLOSING_S
      clips.push({ id: `tail_${segment}`, segment, role: 'tail', scenes: tail, duration, frame, join: last ? 'cut' : 'dissolve' })
    }
    // a lower third whenever the film changes seats (and on the first act); the architecture act has no seat
    if (isDiagramAct(segment)) return
    const persona = config.personas[personaOf(segment)]
    if (MOTION.seat !== false && persona.id !== previousPersona && !persona.framed) {
      clips.push({ id: `seat_${segment}`, segment, role: 'seat', overlay: true, at: 0.35, duration: SEAT_S, frame,
        // the kicker is copy in the film's language: an Arabic film shows it only when the config gives one
        kicker: MOTION.seatKicker ?? (RTL ? '' : 'Seen by'), name: persona.label })
    }
    previousPersona = persona.id
    // stat callouts the story asked for
    for (const step of steps.filter((s) => s.segment === segment && s.callout)) {
      const c = step.callout
      clips.push({ id: `callout_${step.id}`, segment, role: 'callout', overlay: true, step: step.id, atMs: c.at === undefined ? 600 : cueMs(step, c.at),
        duration: (c.ms ?? CALLOUT_S * 1000) / 1000, frame, value: c.value, prefix: c.prefix ?? '', suffix: c.suffix ?? '', max: c.max,
        label: c.label ?? '', caption: c.caption ?? '' })
    }
  })
  return clips
}

// ---------- cards: head and tail ----------

function sceneHtml(s, n, logo) {
  const id = `s${n}`
  const logoTag = logo ? `<img class="logo ${s.kind === 'act' ? 'small' : ''}" src="${logo}" alt="">` : ''
  let body
  if (s.kind === 'app') body = `<img class="app" src="${path.basename(s.image)}" alt="">`
  else if (s.kind === 'act') {
    body = `<div class="stack">
         ${logoTag}
         <div class="kicker">${esc(s.kicker)}</div>
         <h1>${wordsOf(s.heading, 'wi')}</h1>
         <div class="rule"></div>
         <div class="progress">${Array.from({ length: s.of }, (_, k) => `<i class="${k < s.index ? 'done' : k === s.index ? 'now' : ''}"><b></b></i>`).join('')}</div>
       </div>`
  } else {
    body = `<div class="stack">
         ${s.kind === 'closing' && logo ? `<div class="logo-wrap"><div class="glow"></div>${logoTag}</div>` : logoTag}
         <h1 class="big">${wordsOf(s.heading, 'wi')}</h1>
         ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}
         <div class="rule"></div>
         ${s.cta ? `<div class="pill">${esc(s.cta)}</div>` : ''}
       </div>`
  }
  return `<section id="${id}" class="clip scene ${s.kind}" data-start="${s.start.toFixed(3)}" data-duration="${s.dur.toFixed(3)}"><div class="stage">${body}</div></section>`
}

/** Entrances, at the scene's own start. The clip itself belongs to the runtime; every move is on a child. */
function sceneEntrance(s, n, logo) {
  const q = (sel) => `"#s${n} ${sel}"`
  const at = (x) => (s.start + x).toFixed(3)
  const out = []
  if (s.kind === 'act' || s.kind === 'opening') {
    const base = s.kind === 'act' ? 0.2 : 0.25
    if (logo) out.push(`tl.fromTo(${q('.logo')}, {opacity:0, y:22, scale:0.94}, {opacity:1, y:0, scale:1, duration:0.9, ease:"power3.out"}, ${at(base)});`)
    if (s.kind === 'act') {
      out.push(RTL
        ? `tl.fromTo(${q('.kicker')}, {opacity:0, y:10}, {opacity:1, y:0, duration:0.8, ease:"power3.out"}, ${at(0.2)});`
        : `tl.fromTo(${q('.kicker')}, {opacity:0, letterSpacing:"0.62em"}, {opacity:1, letterSpacing:"0.32em", duration:1.0, ease:"power3.out"}, ${at(0.2)});`)
      out.push(`tl.fromTo(${q('.wi')}, {yPercent:115}, {yPercent:0, duration:0.8, ease:"power4.out", stagger:0.07}, ${at(0.45)});`)
      out.push(`tl.fromTo(${q('.rule')}, {scaleX:0}, {scaleX:1, duration:0.7, ease:"power2.inOut"}, ${at(0.8)});`)
      out.push(`tl.fromTo(${q('.progress i')}, {opacity:0, y:8}, {opacity:1, y:0, duration:0.4, ease:"power2.out", stagger:0.05}, ${at(0.9)});`)
      out.push(`tl.fromTo(${q('.progress i.now b')}, {scaleX:0}, {scaleX:1, duration:${Math.max(0.6, s.dur - 1.6).toFixed(3)}, ease:"power1.inOut"}, ${at(1.1)});`)
    } else {
      out.push(`tl.fromTo(${q('.wi')}, {yPercent:115}, {yPercent:0, duration:0.9, ease:"power4.out", stagger:0.08}, ${at(0.85)});`)
      if (s.sub) out.push(`tl.fromTo(${q('.sub')}, {opacity:0, y:14}, {opacity:1, y:0, duration:0.8, ease:"power2.out"}, ${at(1.45)});`)
      out.push(`tl.fromTo(${q('.rule')}, {scaleX:0}, {scaleX:1, duration:0.8, ease:"power2.inOut"}, ${at(1.6)});`)
    }
  }
  if (s.kind === 'closing') {
    // logo-outro: the mark slides in, overshoots and settles while a glow blooms behind it; then the words; then the pill
    const t0 = s.start + 0.25
    if (logo) {
      out.push(`tl.fromTo(${q('.logo')}, {opacity:0, x:120}, {opacity:1, x:0, duration:1.1, ease:"power4.out"}, ${t0.toFixed(3)});`)
      out.push(`tl.to(${q('.logo')}, {scale:1.08, duration:0.4, ease:"back.out(1.7)"}, ${(t0 + 1.0).toFixed(3)});`)
      out.push(`tl.to(${q('.logo')}, {scale:1, duration:0.35, ease:"power2.inOut"}, ${(t0 + 1.35).toFixed(3)});`)
      out.push(`tl.fromTo(${q('.glow')}, {opacity:0, scale:0.5}, {opacity:0.9, scale:1.2, duration:0.4, ease:"power2.out"}, ${(t0 + 1.0).toFixed(3)});`)
      out.push(`tl.to(${q('.glow')}, {opacity:0, scale:1.9, duration:1.3, ease:"power2.out"}, ${(t0 + 1.4).toFixed(3)});`)
    }
    const words = t0 + (logo ? 1.3 : 0.4)
    out.push(`tl.fromTo(${q('.wi')}, {yPercent:115}, {yPercent:0, duration:0.9, ease:"power4.out", stagger:0.08}, ${words.toFixed(3)});`)
    if (s.sub) out.push(`tl.fromTo(${q('.sub')}, {opacity:0, y:14}, {opacity:1, y:0, duration:0.8, ease:"power3.out"}, ${(words + 0.55).toFixed(3)});`)
    out.push(`tl.fromTo(${q('.rule')}, {scaleX:0}, {scaleX:1, duration:0.8, ease:"power2.inOut"}, ${(words + 0.7).toFixed(3)});`)
    if (s.cta) out.push(`tl.fromTo(${q('.pill')}, {opacity:0, y:16, scale:0.9}, {opacity:1, y:0, scale:1, duration:0.6, ease:"back.out(2)"}, ${(words + 1.0).toFixed(3)});`)
    // the final scene is the one place a fade-out belongs: the film ends on a clean colour field
    out.push(`tl.to(${q('.stack')}, {opacity:0, duration:0.9, ease:"power2.inOut"}, ${(s.start + s.dur - 2.0).toFixed(3)});`)
  }
  return out
}

/** The handoff between two scenes: both move at the same instant, and that motion is the exit. */
function transition(a, ai, b, bi) {
  const A = `"#s${ai} .stage"`, B = `"#s${bi} .stage"`
  const T = b.start
  const out = []
  if (a.kind === 'app' && b.kind !== 'app') {
    // the reverse pull: the screen sinks back and blurs as the card or the closing comes forward
    out.push(`tl.fromTo(${A}, {scale:1, opacity:1, filter:"blur(0px)"}, {scale:0.9, opacity:0, filter:"blur(14px)", duration:${PULL_S}, ease:"power2.inOut"}, ${a.start.toFixed(3)});`)
    out.push(`tl.fromTo(${B}, {opacity:0}, {opacity:1, duration:${PULL_S}, ease:"power2.out"}, ${T.toFixed(3)});`)
  } else if (b.kind === 'act') {
    // push: the opening rises away as the act card rises in
    out.push(`tl.fromTo(${A}, {yPercent:0, filter:"blur(0px)"}, {yPercent:-100, filter:"blur(8px)", duration:${PUSH_S}, ease:"power3.in"}, ${T.toFixed(3)});`)
    out.push(`tl.fromTo(${B}, {yPercent:100}, {yPercent:0, duration:${PUSH_S}, ease:"power3.out"}, ${T.toFixed(3)});`)
  } else if (b.kind === 'app') {
    // focus pull into the app: the card swells and blurs away, the screen sharpens into place
    out.push(`tl.fromTo(${A}, {scale:1, opacity:1, filter:"blur(0px)"}, {scale:1.14, opacity:0, filter:"blur(12px)", duration:${PULL_S}, ease:"power2.inOut"}, ${T.toFixed(3)});`)
    out.push(`tl.fromTo(${B}, {scale:1.07, opacity:0, filter:"blur(16px)"}, {scale:1, opacity:1, filter:"blur(0px)", duration:${PULL_S}, ease:"power2.inOut"}, ${T.toFixed(3)});`)
  }
  return out
}

function cardHtml(card, logo, font) {
  const { width: W, height: H } = card.frame
  const k = H / 900   // the static cards were drawn for a 900-pixel-high frame; everything scales from that
  const px = (v) => `${Math.round(v * k)}px`
  // each scene stays on screen through the handoff into the next one, so both are there while they move
  const scenes = card.scenes.map((s, n) => {
    const next = card.scenes[n + 1]
    const end = next ? Math.max(s.start + s.dur, next.start + (next.kind === 'act' ? PUSH_S : PULL_S)) : s.start + s.dur
    return { ...s, dur: Math.min(end, card.duration) - s.start }
  })
  const html = scenes.map((s, n) => sceneHtml(s, n, logo)).join('\n      ')
  const moves = []
  scenes.forEach((s, n) => moves.push(...sceneEntrance(s, n, logo)))
  for (let n = 1; n < scenes.length; n += 1) moves.push(...transition(scenes[n - 1], n - 1, scenes[n], n))
  return page(W, H, card.duration, font, `
      .glow-bg { position: absolute; border-radius: 50%; filter: blur(${px(90)}); pointer-events: none; }
      #glow-a { width: ${px(760)}; height: ${px(760)}; left: ${px(-180)}; top: ${px(-260)}; background: ${BRAND.accent}; opacity: 0.16; }
      #glow-b { width: ${px(680)}; height: ${px(680)}; right: ${px(-200)}; bottom: ${px(-300)}; background: ${BRAND.muted}; opacity: 0.10; }
      #grid { position: absolute; inset: 0; opacity: 0.07;
        background-image: radial-gradient(circle, #fff ${px(1.2)}, transparent ${px(1.6)});
        background-size: ${px(36)} ${px(36)};
        -webkit-mask-image: radial-gradient(ellipse at center, #000 20%, transparent 72%);
        mask-image: radial-gradient(ellipse at center, #000 20%, transparent 72%); }
      .scene { position: absolute; inset: 0; overflow: hidden; }
      .stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
      .stack { display: flex; flex-direction: column; align-items: center; gap: ${px(18)}; text-align: center; padding: 0 12%; }
      .app { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .logo { height: ${px(132)}; width: auto; margin-bottom: ${px(10)}; position: relative; }
      .logo.small { height: ${px(64)}; margin-bottom: ${px(4)}; }
      .logo-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
      .glow { position: absolute; width: 140%; height: 220%; border-radius: 50%; background: radial-gradient(closest-side, ${BRAND.accent}, transparent); filter: blur(${px(24)}); opacity: 0; }
      .kicker { font-size: ${px(RTL ? 19 : 15)}; letter-spacing: ${RTL ? '0' : '0.32em'}; text-transform: ${RTL ? 'none' : 'uppercase'}; color: ${BRAND.accent}; font-weight: 700; }
      h1 { margin: 0; font-size: ${px(50)}; font-weight: 600; line-height: 1.18; max-width: 22ch; text-wrap: balance; }
      h1.big { font-size: ${px(60)}; }
      .w { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; }
      .wi { display: inline-block; }
      .sub { font-size: ${px(21)}; color: ${BRAND.muted}; letter-spacing: ${RTL ? '0' : '0.02em'}; }
      .rule { width: ${px(64)}; height: ${px(3)}; background: ${BRAND.accent}; border-radius: 2px; margin-top: ${px(6)}; }
      .pill { margin-top: ${px(14)}; padding: ${px(10)} ${px(22)}; border-radius: 999px; background: ${BRAND.accent}; color: ${BRAND.ink}; font-size: ${px(18)}; font-weight: 700; letter-spacing: 0.02em; }
      .progress { display: flex; gap: ${px(8)}; margin-top: ${px(10)}; }
      .progress i { display: block; width: ${px(34)}; height: ${px(4)}; border-radius: 2px; background: rgba(255,255,255,0.16); overflow: hidden; }
      .progress i.done { background: ${BRAND.accent}; opacity: 0.55; }
      .progress i b { display: block; width: 100%; height: 100%; background: ${BRAND.accent}; transform-origin: ${START} center; }
      .progress i:not(.now) b { display: none; }`, `
      <div id="glow-a" class="glow-bg"></div>
      <div id="glow-b" class="glow-bg"></div>
      <div id="grid"></div>
      ${html}`, [
    // the light moves the whole time, slowly, so even a held card is never a still frame
    `tl.fromTo("#glow-a", { x: 0, y: 0 }, { x: ${Math.round(220 * k)}, y: ${Math.round(140 * k)}, duration: ${card.duration.toFixed(3)}, ease: "sine.inOut" }, 0);`,
    `tl.fromTo("#glow-b", { x: 0, y: 0 }, { x: ${Math.round(-200 * k)}, y: ${Math.round(-120 * k)}, duration: ${card.duration.toFixed(3)}, ease: "sine.inOut" }, 0);`,
    `tl.fromTo("#grid", { backgroundPosition: "0px 0px" }, { backgroundPosition: "${Math.round(36 * k)}px ${Math.round(72 * k)}px", duration: ${card.duration.toFixed(3)}, ease: "none" }, 0);`,
    ...moves,
  ], BRAND.ink)
}

// ---------- overlays: seat lower third and stat callout (transparent) ----------

function seatHtml(c, font) {
  const { width: W, height: H } = c.frame
  const k = H / 900
  const px = (v) => `${Math.round(v * k)}px`
  const D = c.duration
  return page(W, H, D, font, `
      .lt { position: absolute; ${START}: 4%; bottom: 30%; display: flex; flex-direction: column; align-items: flex-start; gap: ${px(9)};
        padding: ${px(14)} ${px(20)} ${px(16)}; border-radius: ${px(12)}; background: color-mix(in srgb, ${BRAND.ink} 90%, transparent);
        box-shadow: 0 ${px(14)} ${px(40)} rgba(0,0,0,0.35); }
      .kick-wrap { overflow: hidden; }
      .kick { display: inline-block; font-size: ${px(RTL ? 17 : 14)}; font-weight: 700; letter-spacing: ${RTL ? '0' : '0.14em'}; text-transform: ${RTL ? 'none' : 'uppercase'};
        color: ${BRAND.ink}; background: ${BRAND.accent}; padding: ${px(4)} ${px(10)}; white-space: nowrap; }
      .name-wrap { overflow: hidden; padding-bottom: ${px(4)}; padding-inline-end: ${px(4)}; }
      .name { display: inline-block; font-size: ${px(40)}; font-weight: 700; color: #fff; line-height: 1; white-space: nowrap;
        text-shadow: 0 ${px(2)} ${px(18)} rgba(0,0,0,0.55), 0 0 ${px(2)} rgba(0,0,0,0.6); }
      .base { height: ${px(4)}; width: 100%; background: ${BRAND.accent}; border-radius: 2px; transform-origin: ${START} center; }`, `
      <div class="clip lt-clip" data-start="0" data-duration="${D.toFixed(3)}">
        <div class="lt" id="lt">
          ${c.kicker ? `<div class="kick-wrap"><span class="kick" id="kick">${esc(c.kicker)}</span></div>` : ''}
          <div class="name-wrap"><span class="name" id="name">${esc(c.name)}</span></div>
          <div class="base" id="base"></div>
        </div>
      </div>`, [
    // lt-kicker-name's moves on lt-dark-card's panel (readable over a busy screen): the panel slides up, the kicker
    // drops in, the name rises, the accent baseline draws; out the same way, last
    'tl.fromTo("#lt", {opacity:0, y:18}, {opacity:1, y:0, duration:0.45, ease:"power3.out"}, 0);',
    `tl.to("#lt", {opacity:0, y:10, duration:0.3, ease:"power2.in"}, ${(D - 0.35).toFixed(3)});`,
    ...(c.kicker ? ['tl.fromTo("#kick", {yPercent:-110}, {yPercent:0, duration:0.42, ease:"back.out(2)"}, 0.1);'] : []),
    'tl.fromTo("#name", {yPercent:105, opacity:0}, {yPercent:0, opacity:1, duration:0.5, ease:"back.out(1.5)"}, 0.3);',
    'tl.fromTo("#base", {scaleX:0}, {scaleX:1, duration:0.55, ease:"power4.out"}, 0.5);',
    `tl.to("#base", {scaleX:0, duration:0.3, ease:"power2.in"}, ${(D - 0.55).toFixed(3)});`,
    `tl.to("#name", {yPercent:-30, opacity:0, duration:0.32, ease:"power2.in"}, ${(D - 0.5).toFixed(3)});`,
    ...(c.kicker ? [`tl.to("#kick", {yPercent:-110, duration:0.3, ease:"power2.in"}, ${(D - 0.48).toFixed(3)});`] : []),
  ], 'transparent')
}

function calloutHtml(c, font) {
  const { width: W, height: H } = c.frame
  const k = H / 900
  const px = (v) => `${Math.round(v * k)}px`
  const D = c.duration
  const numeric = typeof c.value === 'number'
  const track = numeric && c.max ? Math.max(0, Math.min(1, c.value / c.max)) : null
  const decimals = numeric ? (String(c.value).split('.')[1] ?? '').length : 0
  return page(W, H, D, font, `
      .card { position: absolute; ${END}: 3.5%; top: 13%; min-width: ${px(250)}; max-width: ${px(380)}; padding: ${px(18)} ${px(22)} ${px(20)};
        border-radius: ${px(16)}; background: color-mix(in srgb, ${BRAND.ink} 90%, transparent);
        border: 1px solid color-mix(in srgb, ${BRAND.accent} 45%, transparent);
        box-shadow: 0 ${px(18)} ${px(48)} rgba(0,0,0,0.35); color: #fff; }
      .num { font-size: ${px(58)}; font-weight: 700; line-height: 1; letter-spacing: -0.02em; color: #fff; font-variant-numeric: tabular-nums; }
      .label { margin-top: ${px(8)}; font-size: ${px(17)}; font-weight: 600; color: #fff; }
      .track { margin-top: ${px(14)}; height: ${px(5)}; border-radius: 3px; background: rgba(255,255,255,0.14); overflow: hidden; }
      .fill { height: 100%; width: 100%; background: ${BRAND.accent}; transform-origin: ${START} center; }
      .cap { margin-top: ${px(10)}; font-size: ${px(14)}; color: ${BRAND.muted}; line-height: 1.35; }
      .bar { position: absolute; ${START}: 0; top: ${px(18)}; bottom: ${px(18)}; width: ${px(4)}; border-radius: ${RTL ? '3px 0 0 3px' : '0 3px 3px 0'}; background: ${BRAND.accent}; transform-origin: 50% 0%; }`, `
      <div class="clip co-clip" data-start="0" data-duration="${D.toFixed(3)}">
        <div class="card" id="card">
          <div class="bar" id="bar"></div>
          <div class="num" id="num">${esc(c.prefix)}${numeric ? (0).toFixed(decimals) : esc(c.value)}${esc(c.suffix)}</div>
          ${c.label ? `<div class="label">${esc(c.label)}</div>` : ''}
          ${track !== null ? '<div class="track"><div class="fill" id="fill"></div></div>' : ''}
          ${c.caption ? `<div class="cap">${esc(c.caption)}</div>` : ''}
        </div>
      </div>`, [
    // mk-progress-stat: the card rises in, the figure counts up while the track fills on the same ease
    'tl.fromTo("#card", {opacity:0, y:24, scale:0.97}, {opacity:1, y:0, scale:1, duration:0.6, ease:"power3.out"}, 0.05);',
    'tl.fromTo("#bar", {scaleY:0}, {scaleY:1, duration:0.5, ease:"power3.out"}, 0.3);',
    ...(numeric ? [
      `const st = { v: 0 }; const num = document.getElementById("num");`,
      `tl.to(st, { v: ${c.value}, duration: 1.4, ease: "power2.out", onUpdate: () => { num.textContent = ${JSON.stringify(c.prefix)} + st.v.toFixed(${decimals}) + ${JSON.stringify(c.suffix)} } }, 0.35);`,
    ] : ['tl.fromTo("#num", {opacity:0, y:12}, {opacity:1, y:0, duration:0.6, ease:"power3.out"}, 0.35);']),
    ...(track !== null ? [`tl.fromTo("#fill", {scaleX:0}, {scaleX:${track.toFixed(4)}, duration:1.4, ease:"power2.out"}, 0.35);`] : []),
    `tl.to("#card", {opacity:0, y:-16, duration:0.4, ease:"power2.in"}, ${(D - 0.5).toFixed(3)});`,
  ], 'transparent')
}

/** One standalone HyperFrames composition. */
function page(W, H, D, font, css, body, moves, background) {
  return `<!doctype html>
<html lang="${RTL ? 'ar' : 'en'}" dir="${RTL ? 'rtl' : 'ltr'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="gsap.min.js"></script>
    <style>
${font ? `      @font-face { font-family: "${font.family}"; src: url("${font.file}"); font-display: block; }\n` : ''}      body { margin: 0; background: ${background}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${background}; color: #fff; font-family: ${BRAND.font}; }
      ${css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="clip" data-start="0" data-width="${W}" data-height="${H}" data-fps="${FPS}" data-duration="${D.toFixed(3)}">
      ${body}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${moves.join('\n      ')}
      window.__timelines["clip"] = tl;
    </script>
  </body>
</html>
`
}

// ---------- rendering ----------

/** ffmpeg and ffprobe for HyperFrames: a system install on PATH wins, else the copies npm installed with the project. */
function binaries() {
  const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1' }   // customer titles never leave the machine
  if (!env.HYPERFRAMES_FFMPEG_PATH) { try { env.HYPERFRAMES_FFMPEG_PATH = require('ffmpeg-static') } catch { /* PATH */ } }
  if (!env.HYPERFRAMES_FFPROBE_PATH) { try { env.HYPERFRAMES_FFPROBE_PATH = require('ffprobe-static').path } catch { /* PATH */ } }
  return env
}

function hyperframesBin() {
  try {
    return path.join(path.dirname(require.resolve('hyperframes/package.json')), require('hyperframes/package.json').bin.hyperframes)
  } catch {
    throw new Error('HyperFrames is not installed in this project. Run: npm install   (it is in package.json), '
      + 'or set "motion": false in demo.config.json for the static cards.')
  }
}

// ---------- the architecture act ----------

/** Render every diagram act, then cut its boundary frames and one still per line out of it. */
function renderDiagrams({ previous, gsap, bin, env, font, fontBytes }) {
  const acts = Object.keys(bySegment()).filter(isDiagramAct)
  if (!acts.length) return {}
  const dotsFile = path.join(ROOT, 'brand', 'ua-mark-dots.json')
  const markDots = fs.existsSync(dotsFile) ? JSON.parse(fs.readFileSync(dotsFile, 'utf-8')) : null
  const dur = durations()
  const LEAD = config.pacing.narrationLeadMs
  const ffmpeg = env.HYPERFRAMES_FFMPEG_PATH || 'ffmpeg'
  const out = {}
  for (const segment of acts) {
    const d = prepareDiagram(diagramSpec(segment))
    const actSteps = steps.filter((s) => s.segment === segment)
    for (const s of actSteps) if (dur[s.id] === undefined) throw new Error(`No narration for ${s.id} — run: python scripts/narrate.py`)
    const timing = diagramTiming(d, actSteps, (id) => dur[id], cueMs, config.pacing.cueLeadMs ?? 250)
    const act = actMeta(segment)
    const { width: W, height: H } = VIEW
    const { html, never } = diagramHtml({ d, timing, W, H, brand: BRAND, font, kicker: act.kicker ?? act.title, markDots, page })
    if (never.length) log(`  diagram_${segment}: never shown by a cue: ${never.join(', ')}`)
    const id = `diagram_${segment}`
    const dir = path.join(MOTION_DIR, id)
    const file = path.join(MOTION_DIR, `${id}.mp4`)
    const digest = createHash('sha256').update(html).update(gsap).update(fontBytes ?? '').digest('hex').slice(0, 16)
    const entry = {
      segment, role: 'diagram', file, ms: Math.round(timing.duration * 1000), width: W, height: H, hash: digest,
      // when each line starts, in the recorder's terms (build.py adds the narration lead back)
      steps: timing.lines.map((l) => ({ id: l.id, startMs: Math.round(l.start * 1000) - LEAD })),
    }
    if (previous[id]?.hash === digest && fs.existsSync(file)) {
      log(`  ${id}: unchanged, kept`)
    } else {
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'index.html'), html)
      fs.writeFileSync(path.join(dir, 'gsap.min.js'), gsap)
      if (fontBytes) fs.writeFileSync(path.join(dir, font.file), fontBytes)
      log(`  ${id}: rendering ${timing.duration.toFixed(1)}s at ${W}x${H} (${timing.cues.length} cues)…`)
      const t0 = Date.now()
      const run = spawnSync(process.execPath, [bin, 'render', dir, '--output', file, '--fps', String(FPS), '--quality', 'looks', '--quiet'], { env, encoding: 'utf-8', cwd: dir })
      if (run.status !== 0 || !fs.existsSync(file)) {
        log((run.stdout ?? '').slice(-1500) + (run.stderr ?? '').slice(-1500))
        throw new Error(`HyperFrames could not render ${id} (see build/motion.log). Check with: npx hyperframes check build/motion/${id}`)
      }
      log(`  ${id}: done in ${Math.round((Date.now() - t0) / 1000)}s`)
    }
    // the boundary frames the cards hand over to and from, and a still per line for the documents
    fs.mkdirSync(FRAMES_DIR, { recursive: true })
    fs.mkdirSync(SHOTS, { recursive: true })
    const grab = (at, to) => spawnSync(ffmpeg, ['-y', '-v', 'error', '-ss', at.toFixed(3), '-i', file, '-frames:v', '1', ...(to.endsWith('.jpg') ? ['-q:v', '3'] : []), to])
    grab(0.04, path.join(FRAMES_DIR, `${segment}_first.png`))
    grab(Math.max(0, timing.duration - 0.12), path.join(FRAMES_DIR, `${segment}_last.png`))
    for (const l of timing.lines) grab(Math.max(0, l.end - 0.4), path.join(SHOTS, `${l.id}.jpg`))
    out[id] = entry
  }
  return out
}

export function renderCards() {
  if (config.motion === false) return null
  logTo('motion')
  fs.mkdirSync(MOTION_DIR, { recursive: true })
  const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf-8')) : {}
  const logoFile = config.brand.logo ? path.resolve(ROOT, config.brand.logo) : null
  const logoBytes = logoFile && fs.existsSync(logoFile) ? fs.readFileSync(logoFile) : null
  const logoName = logoBytes ? 'logo' + path.extname(logoFile).toLowerCase() : null
  // the render browser draws only fonts the composition ships: a named brand font needs its file (brand.fontFile)
  const fontFile = config.brand.fontFile ? path.resolve(ROOT, config.brand.fontFile) : null
  if (fontFile && !fs.existsSync(fontFile)) throw new Error(`brand.fontFile not found: ${fontFile}`)
  const fontBytes = fontFile ? fs.readFileSync(fontFile) : null
  const font = fontBytes
    ? { family: BRAND.font.split(',')[0].replace(/["']/g, '').trim(), file: 'brand-font' + path.extname(fontFile).toLowerCase() }
    : null
  const gsap = fs.readFileSync(require.resolve('gsap/dist/gsap.min.js'))
  const bin = hyperframesBin()
  const env = binaries()
  const manifest = {}
  Object.assign(manifest, renderDiagrams({ previous, gsap, bin, env, font, fontBytes }))
  if (process.argv.includes('--diagram')) {
    // the architecture act alone, to look at it before a full build; every other clip stays as it was
    fs.writeFileSync(MANIFEST, JSON.stringify({ ...previous, ...manifest }, null, 2))
    return { ...previous, ...manifest }
  }

  for (const clip of plan()) {
    const html = clip.overlay ? (clip.role === 'seat' ? seatHtml(clip, font) : calloutHtml(clip, font)) : cardHtml(clip, logoName, font)
    const images = (clip.scenes ?? []).filter((s) => s.image).map((s) => s.image)
    const hash = createHash('sha256').update(html).update(logoBytes ?? '').update(fontBytes ?? '').update(gsap)
    for (const img of images) hash.update(fs.readFileSync(img))
    const digest = hash.digest('hex').slice(0, 16)
    const dir = path.join(MOTION_DIR, clip.id)
    // overlays carry an alpha channel: ProRes 4444 in a .mov, which ffmpeg composites over the act
    const file = path.join(MOTION_DIR, `${clip.id}.${clip.overlay ? 'mov' : 'mp4'}`)
    const entry = {
      segment: clip.segment, role: clip.role, file, ms: Math.round(clip.duration * 1000), width: clip.frame.width, height: clip.frame.height,
      join: clip.join, step: clip.step, atMs: clip.role === 'seat' ? Math.round(clip.at * 1000) : clip.atMs, hash: digest,
    }
    if (previous[clip.id]?.hash === digest && fs.existsSync(file)) {
      log(`  ${clip.id}: unchanged, kept`)
      manifest[clip.id] = entry
      continue
    }
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html)
    fs.writeFileSync(path.join(dir, 'gsap.min.js'), gsap)
    if (logoBytes) fs.writeFileSync(path.join(dir, logoName), logoBytes)
    if (fontBytes) fs.writeFileSync(path.join(dir, font.file), fontBytes)
    for (const img of images) fs.copyFileSync(img, path.join(dir, path.basename(img)))
    log(`  ${clip.id}: rendering ${clip.duration.toFixed(1)}s at ${clip.frame.width}x${clip.frame.height}${clip.overlay ? ' (transparent)' : ''}…`)
    const t0 = Date.now()
    const args = [bin, 'render', dir, '--output', file, '--fps', String(FPS), '--quality', 'looks', '--quiet', ...(clip.overlay ? ['--format', 'mov'] : [])]
    const run = spawnSync(process.execPath, args, { env, encoding: 'utf-8', cwd: dir })
    if (run.status !== 0 || !fs.existsSync(file)) {
      log((run.stdout ?? '').slice(-1500) + (run.stderr ?? '').slice(-1500))
      throw new Error(`HyperFrames could not render ${clip.id} (see build/motion.log). `
        + 'Check with: npx hyperframes doctor   — or set "motion": false in demo.config.json for the static cards.')
    }
    log(`  ${clip.id}: done in ${Math.round((Date.now() - t0) / 1000)}s`)
    manifest[clip.id] = entry
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))
  log(`Wrote build/motion/cards.json (${Object.keys(manifest).length} clip${Object.keys(manifest).length === 1 ? '' : 's'})`)
  return manifest
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = renderCards()
  if (!manifest) console.log('"motion" is off in demo.config.json — the recorder draws the static cards.')
  else if (process.argv.includes('--open')) for (const c of Object.values(manifest)) console.log('  ' + c.file)
}
