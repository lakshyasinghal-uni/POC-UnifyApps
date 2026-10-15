// Every project-specific fact lives in demo.config.json. Everything else reads it from here.
// Nothing below this file should contain a URL, a username, a brand colour or an act title.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
export const { chromium } = require('playwright-core')

export const SCRIPTS = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(SCRIPTS, '..')
export const BUILD = path.join(ROOT, 'build')
export const OUT = path.join(ROOT, 'out')
export const AUTH_DIR = path.join(ROOT, 'auth')
export const SHOTS = path.join(BUILD, 'shots')
export const AUDIO = path.join(BUILD, 'audio')
export const RAW = path.join(BUILD, 'raw')

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'))
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// A recording is long, unattended and hard to watch. Every stage keeps a log so a failure
// at minute nine can be read afterwards instead of reconstructed.
let logFile = null
export function logTo(name) {
  fs.mkdirSync(BUILD, { recursive: true })
  logFile = path.join(BUILD, `${name}.log`)
  fs.writeFileSync(logFile, `\n=== ${name} ${new Date().toISOString()} ===\n`, { flag: 'a' })
}
export const log = (...a) => {
  const line = `${new Date().toISOString().slice(11, 19)} ${a.join(' ')}`
  console.log(line)
  if (logFile) { try { fs.appendFileSync(logFile, line + '\n') } catch { /* logging must never fail a take */ } }
}

const DEFAULT_BRAND = {
  ink: '#0d1a33',        // title cards, cover, caption chip
  accent: '#d6a04a',     // rules, kickers, the pointer ring
  muted: '#9fb0c9',      // subtitles on the dark background
  font: '"Segoe UI", system-ui, sans-serif',
}

function load() {
  const file = process.env.DEMO_CONFIG ? path.resolve(process.env.DEMO_CONFIG) : path.join(ROOT, 'demo.config.json')
  if (!fs.existsSync(file)) throw new Error(`No demo.config.json found at ${file}`)
  const c = readJson(file)

  if (!c.slug) throw new Error('demo.config.json: "slug" is required — it names every output file.')
  if (!c.personas || !Object.keys(c.personas).length) throw new Error('demo.config.json: at least one persona is required.')

  c.title ??= c.slug.replace(/_/g, ' ')
  c.subtitle ??= ''
  c.viewport = { width: 1440, height: 900, ...(c.viewport ?? {}) }
  c.brand = { ...DEFAULT_BRAND, ...(c.brand ?? {}) }
  c.voice = { name: 'en-GB-SoniaNeural', rate: '-4%', ...(c.voice ?? {}) }
  c.pacing = { tailMs: 700, narrationLeadMs: 300, cueLeadMs: 250, openingHoldMs: 5000, actHoldMs: 3400, closingHoldMs: 7000, ...(c.pacing ?? {}) }
  // "chip": a short caption bottom-left. "panel": the PlatformX card — act, title and the
  // spoken line, so the demo reads with the sound off.
  c.captions = { style: 'chip', ...(c.captions ?? {}) }
  c.opening ??= { heading: c.title, sub: c.subtitle }
  // The title cards are animated motion graphics rendered by HyperFrames (scripts/motion.mjs) and cross-faded into
  // the acts by build.py. `"motion": false` puts back the static cards the recorder draws into the page.
  c.motion = c.motion === false ? false : { engine: 'hyperframes', ...(typeof c.motion === 'object' ? c.motion : {}) }
  c.closing ??= null
  c.manual ??= {}
  c.runbook ??= {}

  let windowNo = 0
  for (const [id, p] of Object.entries(c.personas)) {
    if (!p.base) throw new Error(`Persona "${id}": "base" (the site's origin) is required.`)
    p.id = id
    p.base = p.base.replace(/\/$/, '')
    p.label ??= id.charAt(0).toUpperCase() + id.slice(1)
    p.user ??= id
    p.home ??= '/'
    p.login ??= '/login'
    p.auth ??= true
    p.colour ??= c.brand.ink
    p.window ??= `Window ${++windowNo}`
  }
  return c
}

export const config = load()
export const BRAND = config.brand

/**
 * The customer's logo as a data URI (config.brand.logo, a path relative to the project), so the
 * title cards and the document covers carry it without any network access. It sits on the ink
 * colour everywhere it is used, so supply the version drawn for a dark ground.
 */
export const LOGO = (() => {
  const rel = config.brand.logo
  if (!rel) return null
  const file = path.resolve(ROOT, rel)
  if (!fs.existsSync(file)) { console.warn(`brand.logo not found: ${file}`); return null }
  const ext = path.extname(file).slice(1).toLowerCase()
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' }[ext] ?? 'image/png'
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
})()
export const VIEW = config.viewport
/** Who "plays" the architecture act in the documents: nobody signs in; the presenter shows the picture. */
export const DIAGRAM_SEAT = { id: 'diagram', label: 'The architecture picture', colour: config.brand.accent, window: 'The film (its opening) or the picture as a still', user: 'no sign-in' }
export const BASES = Object.fromEntries(Object.entries(config.personas).map(([id, p]) => [id, p.base]))

/** Replace {{personaId}} in any string with that persona's base URL. */
export const fill = (s) =>
  String(s).replace(/\{\{(\w+)\}\}/g, (m, id) => config.personas[id]?.base ?? m)

function loadSteps() {
  const file = path.join(ROOT, 'steps.json')
  if (!fs.existsSync(file)) throw new Error(`No steps.json found at ${file}`)
  const steps = readJson(file)
  const seen = new Set()
  steps.forEach((s, i) => {
    const where = `steps.json[${i}]${s.id ? ` (id "${s.id}")` : ''}`
    // a step of the architecture act carries "diagram" cues instead of an action, and no persona: nothing is filmed
    const required = s.diagram ? ['id', 'segment', 'caption', 'narration'] : ['id', 'segment', 'persona', 'caption', 'narration', 'action']
    for (const key of required) {
      if (!s[key]) throw new Error(`${where}: missing "${key}".`)
    }
    if (seen.has(s.id)) throw new Error(`${where}: duplicate id.`)
    seen.add(s.id)
    if (s.diagram) return
    if (!config.personas[s.persona]) {
      throw new Error(`${where}: persona "${s.persona}" is not in demo.config.json (have: ${Object.keys(config.personas).join(', ')}).`)
    }
  })
  // an act is either all diagram or all screen
  for (const seg of new Set(steps.map((s) => s.segment))) {
    const kinds = new Set(steps.filter((s) => s.segment === seg).map((s) => Boolean(s.diagram)))
    if (kinds.size > 1) throw new Error(`steps.json: act "${seg}" mixes diagram steps with screen steps — give the diagram its own act.`)
  }
  return steps
}

export const steps = loadSteps()

/** The architecture act(s): drawn and voiced by motion.mjs from diagram.json, never recorded. */
export const isDiagramAct = (segment) => steps.some((s) => s.segment === segment && s.diagram)

/** diagram.json next to steps.json, or null when the film has no architecture act. */
export const diagramSpec = (segment) => {
  // an act may carry its own picture: diagram.<act>.json (e.g. diagram.S.json), else diagram.json
  const own = segment ? path.join(ROOT, `diagram.${segment}.json`) : null
  const file = own && fs.existsSync(own) ? own : path.join(ROOT, 'diagram.json')
  if (!fs.existsSync(file)) {
    if (steps.some((s) => s.diagram)) throw new Error('steps.json has diagram steps but there is no diagram.json next to it.')
    return null
  }
  return readJson(file)
}

/** Steps grouped by act, in the order the acts first appear. */
export function bySegment(list = steps) {
  return list.reduce((acc, s) => ((acc[s.segment] ??= []).push(s), acc), {})
}

/** An act's persona is whoever its steps belong to — the config never restates it. */
export function personaOf(segment) {
  const step = steps.find((s) => s.segment === segment)
  if (!step) throw new Error(`No steps for act "${segment}".`)
  return step.persona ?? null   // null: the architecture act, which no one signs in to
}

export function actMeta(segment) {
  const declared = config.acts?.[segment] ?? {}
  const index = Object.keys(bySegment()).indexOf(segment)
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return {
    n: declared.n ?? ROMAN[index] ?? String(index + 1),
    title: declared.title ?? `Act ${segment}`,
    goal: declared.goal ?? '',
    ...declared,
  }
}

export const durations = () => {
  const file = path.join(BUILD, 'durations.json')
  if (!fs.existsSync(file)) throw new Error('No build/durations.json — run: python scripts/narrate.py')
  return readJson(file)
}

/** When each word of each line is spoken (narrate.py). Empty for a build voiced before it existed. */
export const words = () => {
  const file = path.join(BUILD, 'words.json')
  return fs.existsSync(file) ? readJson(file) : {}
}

export function storageFor(persona) {
  const p = config.personas[persona]
  if (!p.auth) return undefined
  // `session` lets several personas share one saved sign-in (e.g. one build account that writes on camera)
  const file = path.join(AUTH_DIR, `${p.session ?? persona}.json`)
  if (!fs.existsSync(file)) throw new Error(`No saved session for "${persona}". Run: node scripts/auth.mjs`)
  return file
}

/**
 * Context options for a persona: its saved session, its viewport, and any browser state
 * the app needs before the first paint — a stored UI preference, a language, a demo-admin
 * flag that must be OFF on camera. Seeded through addInitScript so it is in place before
 * the app boots, not applied visibly afterwards.
 */
export function contextOptions(persona, extra = {}) {
  const p = config.personas[persona]
  const options = {
    viewport: p.viewport ?? VIEW,
    // any other Playwright context option the persona needs: a position ("geolocation"), a phone ("isMobile", "hasTouch",
    // "deviceScaleFactor"), a "locale" or "timezoneId" — passed through as given
    ...(p.context ?? {}),
    ...(storageFor(persona) ? { storageState: storageFor(persona) } : {}),
    ...extra,
  }
  return options
}

/** Apply a persona's seeded browser state to a context. Call right after creating it. */
export async function seedContext(context, persona) {
  const p = config.personas[persona]
  if (p.permissions?.length) {
    await context.grantPermissions(p.permissions, { origin: p.base }).catch(() => { /* not all origins allow it */ })
  }
  if (p.localStorage || p.sessionStorage) {
    await context.addInitScript(({ local, session }) => {
      try {
        for (const [k, v] of Object.entries(local ?? {})) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        }
        for (const [k, v] of Object.entries(session ?? {})) {
          sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        }
      } catch { /* storage can be blocked; the demo still runs */ }
    }, { local: p.localStorage, session: p.sessionStorage })
  }
}

export function launch(extra = {}) {
  return chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? 'chrome',
    headless: false,
    args: [`--window-size=${VIEW.width},${VIEW.height + 120}`, '--hide-scrollbars'],
    ...extra,
  })
}

export { fs, path }
