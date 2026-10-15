// The architecture act: a narrated, animated diagram of the solution, rendered with HyperFrames by motion.mjs.
//
// diagram.json (next to steps.json) draws the picture: groups (the platform panel, the customer's systems), the rows
// inside the platform (Apps, Agents, Workflows, Data), the nodes and the edges between them, each node with a status:
//
//   built       built and running on UnifyApps today (solid, the platform's gold)
//   simulated   a stand-in today, with sample data (dashed violet); its "live" face is what replaces it at go-live
//   planned     not there today, connected in the implementation (marching sky-blue outline)
//   external    the customer's world (the people who write in), neutral glass
//
// The act's steps (in steps.json, "diagram" in place of "action") carry cues, each fired on the word that names it
// ("at": a phrase of the line, exactly like a highlight). What a cue can do:
//
//   show    ["platform", "row-agents", "router", "e-router-verify"]   groups, rows (with their nodes), nodes, edges
//   focus   ["router", "verify"] (null clears)       spotlight: the rest dims
//   swap    ["qcontact"]                             a stand-in turns over to its live face ("connected at go-live")
//   token   {"id": "k", "label": "Khanyisile · WhatsApp", "on": "clients"}   a scenario token appears on a node
//   move    ["qcontact", "trigger", "router", ["crm", "network"], "lookups"]  it travels along the edges; an inner
//           array fans out in parallel and the next single node gathers it back. "token": "k" picks the token.
//   badge   {"on": "verify", "text": "2 of 3 details match"}   a pill over a node until the step ends
//   popup   {"on": "lab", "kicker": "Opportunity Lab", "title": "…", "lines": ["…"], "side": "right|left|above|below", "w": 330}
//           a card beside a node (title + up to three lines); the line's previous card leaves
//   camera  {"on": "platform", "scale": 1.18} (null resets)   a slow push in on a part of the picture
//   legend  true                                     the key: built / simulated / at go-live
//
// Everything is placed on a fixed design space (diagram.space, default 1440×900) and scaled to the film frame.
// Positions are computed here, in Node, and every move is a GSAP tween on one paused timeline: the clip is
// seek-safe frame by frame (no callbacks, no clocks), which is what HyperFrames needs.
import { ICONS } from './icons.mjs'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const r1 = (v) => Math.round(v * 10) / 10
const f3 = (v) => Number(v).toFixed(3)

export const DIAGRAM_DEFAULTS = {
  space: [1440, 900],
  colors: { built: '#C9B37C', simulated: '#A78BFA', planned: '#38BDF8', external: '#B9C1CC' },
  legend: {
    built: 'Built and running on UnifyApps',
    simulated: 'Simulated today, with sample data',
    planned: 'Connected at go-live',
  },
  chips: { simulated: 'Simulated', planned: 'At go-live' },
  leadInMs: 1400,   // the empty stage before the first line: the card has just handed over to it
  gapMs: 650,       // between two lines
  holdMs: 2400,     // the finished picture holds this long after the last line, before the next act pulls back from it
  hopMs: 750,       // one hop of a scenario token along an edge
}

export function isDiagramStep(step) {
  return Boolean(step.diagram)
}

// ---------------------------------------------------------------- layout

function layout(d) {
  const [SW, SH] = d.space
  const rects = {}
  const rows = {}
  const groupOf = {}
  for (const g of d.groups ?? []) {
    rects[g.id] = { x: g.x, y: g.y, w: g.w, h: g.h, kind: 'group' }
    const pad = g.pad ?? 18
    const headH = g.headH ?? 62
    if (g.rows) {
      const gutter = g.gutter ?? 128
      const top = g.y + headH
      const bottom = g.y + g.h - pad
      const pitch = (bottom - top) / g.rows.length
      const nodeH = Math.min(g.nodeH ?? 84, pitch - 34)
      const cols = Math.max(...g.rows.map((r) => r.nodes.length))
      const gap = g.gap ?? 16
      const x0 = g.x + gutter
      const x1 = g.x + g.w - pad
      const w = (x1 - x0 - gap * (cols - 1)) / cols
      g.rows.forEach((row, i) => {
        const cy = top + pitch * (i + 0.5)
        rects[row.id] = { x: x0, y: cy - nodeH / 2, w: x1 - x0, h: nodeH, kind: 'row' }
        rows[row.id] = { ...row, group: g.id, labelX: g.x + pad + 4, cy, labelW: gutter - pad - 12 }
        row.nodes.forEach((id, k) => {
          rects[id] = { x: x0 + k * (w + gap), y: cy - nodeH / 2, w, h: nodeH, kind: 'node' }
          groupOf[id] = g.id
        })
      })
    }
    if (g.stack) {
      const top = g.y + headH
      const bottom = g.y + g.h - pad
      const nodeH = g.nodeH ?? 76
      const pitch = (bottom - top) / g.stack.length
      g.stack.forEach((item, i) => {
        const id = typeof item === 'string' ? item : item.id
        const cy = typeof item === 'object' && item.cy !== undefined ? item.cy : top + pitch * (i + 0.5)
        rects[id] = { x: g.x + pad, y: cy - nodeH / 2, w: g.w - 2 * pad, h: nodeH, kind: 'node' }
        groupOf[id] = g.id
      })
    }
  }
  for (const n of d.nodes) {
    if (n.x !== undefined) rects[n.id] = { x: n.x, y: n.y, w: n.w ?? 190, h: n.h ?? 80, kind: 'node' }
    if (!rects[n.id]) throw new Error(`diagram.json: node "${n.id}" has no place — put it in a group's rows or stack, or give it x, y.`)
  }
  return { SW, SH, rects, rows, groupOf }
}

// ---------------------------------------------------------------- edges

function anchor(r, side, at = 0.5) {
  if (side === 'left') return { x: r.x, y: r.y + r.h * at, nx: -1, ny: 0 }
  if (side === 'right') return { x: r.x + r.w, y: r.y + r.h * at, nx: 1, ny: 0 }
  if (side === 'top') return { x: r.x + r.w * at, y: r.y, nx: 0, ny: -1 }
  return { x: r.x + r.w * at, y: r.y + r.h, nx: 0, ny: 1 }
}

function autoSides(a, b) {
  const hgap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w))
  const vgap = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h))
  const dx = b.x + b.w / 2 - (a.x + a.w / 2)
  const dy = b.y + b.h / 2 - (a.y + a.h / 2)
  if (hgap >= vgap) return dx >= 0 ? ['right', 'left'] : ['left', 'right']
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom']
}

const cubicAt = (p0, c1, c2, p1, t) => {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x,
    y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y,
  }
}
const quadAt = (p0, c, p1, t) => {
  const u = 1 - t
  return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }
}

/** An edge's SVG path, plus a dense polyline of it for its length and for a token to ride along. */
function edgeGeometry(e, rects) {
  const a = rects[e.from]
  const b = rects[e.to]
  const [sa, sb] = autoSides(a, b)
  const p0 = anchor(a, e.fromSide ?? sa, e.fromAt)
  const p1 = anchor(b, e.toSide ?? sb, e.toAt)
  const pts = []
  let d
  if (e.via?.length) {
    // a routed edge: straight runs through the given points, every corner rounded
    const corners = [p0, ...e.via.map(([x, y]) => ({ x, y })), p1]
    const R = e.radius ?? 16
    d = `M${r1(p0.x)} ${r1(p0.y)}`
    pts.push(p0)
    for (let i = 1; i < corners.length - 1; i += 1) {
      const prev = corners[i - 1]
      const c = corners[i]
      const next = corners[i + 1]
      const l1 = Math.hypot(c.x - prev.x, c.y - prev.y)
      const l2 = Math.hypot(next.x - c.x, next.y - c.y)
      const r = Math.min(R, l1 / 2, l2 / 2)
      const s = { x: c.x - ((c.x - prev.x) / l1) * r, y: c.y - ((c.y - prev.y) / l1) * r }
      const t = { x: c.x + ((next.x - c.x) / l2) * r, y: c.y + ((next.y - c.y) / l2) * r }
      d += ` L${r1(s.x)} ${r1(s.y)} Q${r1(c.x)} ${r1(c.y)} ${r1(t.x)} ${r1(t.y)}`
      pts.push(s)
      for (let k = 1; k <= 6; k += 1) pts.push(quadAt(s, c, t, k / 6))
    }
    d += ` L${r1(p1.x)} ${r1(p1.y)}`
    pts.push(p1)
  } else {
    const horizontal = p0.nx !== 0
    const span = horizontal ? Math.abs(p1.x - p0.x) : Math.abs(p1.y - p0.y)
    const k = Math.max(22, span * (e.bend ?? 0.5))
    const c1 = { x: p0.x + p0.nx * k, y: p0.y + p0.ny * k }
    const c2 = { x: p1.x + p1.nx * k, y: p1.y + p1.ny * k }
    d = `M${r1(p0.x)} ${r1(p0.y)} C${r1(c1.x)} ${r1(c1.y)} ${r1(c2.x)} ${r1(c2.y)} ${r1(p1.x)} ${r1(p1.y)}`
    for (let i = 0; i <= 48; i += 1) pts.push(cubicAt(p0, c1, c2, p1, i / 48))
  }
  // dense polyline → cumulative length
  const cum = [0]
  for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  const length = cum[cum.length - 1]
  /** points at even spacing along the edge, for a token's keyframes */
  const samples = (n) => {
    const out = []
    let j = 1
    for (let i = 0; i <= n; i += 1) {
      const want = (length * i) / n
      while (j < cum.length - 1 && cum[j] < want) j += 1
      const seg = cum[j] - cum[j - 1] || 1
      const f = Math.min(1, Math.max(0, (want - cum[j - 1]) / seg))
      out.push({ x: pts[j - 1].x + (pts[j].x - pts[j - 1].x) * f, y: pts[j - 1].y + (pts[j].y - pts[j - 1].y) * f })
    }
    return out
  }
  return { d, length, samples }
}

// ---------------------------------------------------------------- validation and timing

export function prepareDiagram(raw) {
  const d = {
    ...DIAGRAM_DEFAULTS,
    ...raw,
    colors: { ...DIAGRAM_DEFAULTS.colors, ...(raw.colors ?? {}) },
    legend: { ...DIAGRAM_DEFAULTS.legend, ...(raw.legend ?? {}) },
    chips: { ...DIAGRAM_DEFAULTS.chips, ...(raw.chips ?? {}) },
  }
  d.nodes = raw.nodes ?? []
  d.groups = raw.groups ?? []
  const ids = new Set()
  const add = (id, what) => {
    if (ids.has(id)) throw new Error(`diagram.json: duplicate id "${id}" (${what}).`)
    ids.add(id)
  }
  d.groups.forEach((g) => { add(g.id, 'group'); (g.rows ?? []).forEach((r) => add(r.id, 'row')) })
  d.nodes.forEach((n) => add(n.id, 'node'))
  const nodeIds = new Set(d.nodes.map((n) => n.id))
  for (const g of d.groups) {
    for (const r of g.rows ?? []) for (const id of r.nodes) if (!nodeIds.has(id)) throw new Error(`diagram.json: row "${r.id}" lists "${id}", which is not a node.`)
    for (const it of g.stack ?? []) {
      const id = typeof it === 'string' ? it : it.id
      if (!nodeIds.has(id)) throw new Error(`diagram.json: group "${g.id}" stacks "${id}", which is not a node.`)
    }
  }
  d.edges = (raw.edges ?? []).map((e) => {
    const id = e.id ?? `e-${e.from}-${e.to}`
    for (const end of [e.from, e.to]) if (!ids.has(end)) throw new Error(`diagram.json: edge ${id} names "${end}", which is not in the diagram.`)
    add(id, 'edge')
    return { ...e, id }
  })
  for (const n of d.nodes) {
    n.status ??= 'built'
    if (!['built', 'simulated', 'planned', 'external'].includes(n.status)) throw new Error(`diagram.json: node "${n.id}" has status "${n.status}" (built, simulated, planned or external).`)
    if (n.icon && !ICONS[n.icon]) throw new Error(`diagram.json: node "${n.id}" names icon "${n.icon}", which is not in scripts/icons.mjs.`)
    if (n.live?.icon && !ICONS[n.live.icon]) throw new Error(`diagram.json: node "${n.id}" names icon "${n.live.icon}", which is not in scripts/icons.mjs.`)
  }
  d.ids = ids
  return d
}

/**
 * When each line of the act is spoken and when each cue fires, in seconds from the clip's start.
 * cueMs(step, at) is motion.mjs's word timing; durationOf(id) is the line's length in seconds.
 */
export function diagramTiming(d, actSteps, durationOf, cueMs, cueLeadMs) {
  let t = d.leadInMs / 1000
  const lines = []
  const cues = []
  actSteps.forEach((step, i) => {
    const dur = durationOf(step.id)
    lines.push({ id: step.id, start: t, end: t + dur, caption: step.caption, index: i })
    for (const cue of step.diagram.cues ?? []) {
      const at = cue.at === undefined ? 0 : Math.max(0, cueMs(step, cue.at) - cueLeadMs) / 1000
      cues.push({ ...cue, t: t + at + (cue.delayMs ?? 0) / 1000, step: step.id, stepIndex: i })
    }
    t += dur + d.gapMs / 1000
  })
  const lastEnd = lines.length ? lines[lines.length - 1].end : t
  cues.sort((a, b) => a.t - b.t)
  return { lines, cues, duration: lastEnd + d.holdMs / 1000 }
}

// ---------------------------------------------------------------- the composition

const icon = (name, cls = 'ic') => (name && ICONS[name]
  ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
  : '')

function faceHtml(n, face, colors, chips, w, h) {
  const live = face === 'b'
  const status = live ? 'planned' : n.status
  const label = live ? n.live?.label ?? n.label : n.label
  const sub = live ? n.live?.sub ?? '' : n.sub ?? ''
  const ic = live ? n.live?.icon ?? 'plug' : n.icon
  const chip = live ? n.live?.chip ?? chips.planned : n.chip ?? chips[status] ?? ''
  const dashed = status === 'simulated' || status === 'planned'
  return `<div class="face face-${face} st-${status}">
        ${dashed ? `<svg class="ants" width="${r1(w)}" height="${r1(h)}"><rect x="1" y="1" width="${r1(w - 2)}" height="${r1(h - 2)}" rx="13" ry="13"/></svg>` : ''}
        ${live ? '<div class="clipper"><div class="sheen"></div></div>' : ''}
        <div class="icb">${icon(ic)}</div>
        <div class="txt"><div class="lb">${esc(label)}</div>${sub ? `<div class="sb">${esc(sub)}</div>` : ''}</div>
        ${chip ? `<span class="chip">${esc(chip)}</span>` : ''}
      </div>`
}

function markHtml(dots) {
  if (!dots) return ''
  return `<svg class="uam" viewBox="0 0 33 32"><g class="uam-g">${dots
    .map(([cx, cy, r, o]) => `<circle cx="${cx}" cy="${cy}" r="${r}" data-o="${o}"/>`).join('')}</g></svg>`
}

/**
 * The HyperFrames page for the act. `o` = { d, timing, W, H, brand, font, kicker, markDots, page }.
 * `page(W, H, D, font, css, body, moves, background)` is motion.mjs's composition wrapper.
 */
export function diagramHtml(o) {
  const { d, timing, W, H, brand, font, kicker, markDots, page } = o
  const { SW, SH, rects, rows, groupOf } = layout(d)
  const D = timing.duration
  const C = d.colors
  const s = Math.min(W / SW, H / SH)
  const nodeById = Object.fromEntries(d.nodes.map((n) => [n.id, n]))
  const edgeGeo = Object.fromEntries(d.edges.map((e) => [e.id, edgeGeometry(e, rects)]))
  const moves = []
  const add = (line) => moves.push(line)
  const sel = (id) => `"#${id}"`

  // ---- markup
  const groupsHtml = d.groups.map((g) => {
    const r = rects[g.id]
    const tone = g.tone ?? 'plain'
    const per = 2 * (r.w + r.h)
    return `<div class="grp tone-${tone}" id="g-${g.id}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">
      <svg class="gb" width="${r.w}" height="${r.h}"><rect x="1" y="1" width="${r.w - 2}" height="${r.h - 2}" rx="22" ry="22" stroke-dasharray="${r1(per)} ${r1(per)}" stroke-dashoffset="${r1(per)}"/></svg>
      <div class="gh">${g.mark && markDots ? markHtml(markDots) : ''}<div><div class="gl">${esc(g.label)}</div>${g.sub ? `<div class="gs">${esc(g.sub)}</div>` : ''}</div></div>
    </div>`
  }).join('\n')
  const rowsHtml = Object.entries(rows).map(([id, row]) => `<div class="rowl" id="r-${id}" style="left:${row.labelX}px;top:${r1(row.cy - 56)}px;width:${row.labelW}px">
      <div class="rn">${esc(row.label)}</div>${row.sub ? `<div class="rs">${esc(row.sub)}</div>` : ''}</div>`).join('\n')
  const edgesSvg = d.edges.map((e) => {
    const g = edgeGeo[e.id]
    const L = r1(g.length)
    return `<g class="edge" id="${e.id}"><g class="edim">
        <path class="base" d="${g.d}" stroke-dasharray="${L} ${L}" stroke-dashoffset="${L}"/>
        <path class="flow" d="${g.d}"/>
        <path class="hot" d="${g.d}" stroke-dasharray="${L} ${L}" stroke-dashoffset="${L}"/>
      </g></g>`
  }).join('\n')
  const nodesHtml = d.nodes.map((n) => {
    const r = rects[n.id]
    const swaps = Boolean(n.live)
    return `<div class="node" id="n-${n.id}" style="left:${r1(r.x)}px;top:${r1(r.y)}px;width:${r1(r.w)}px;height:${r1(r.h)}px">
      <div class="dim" id="d-${n.id}"><div class="pulse" id="p-${n.id}"></div><div class="ring" id="q-${n.id}"></div>
      <div class="flip">${faceHtml(n, 'a', C, d.chips, r.w, r.h)}${swaps ? faceHtml(n, 'b', C, d.chips, r.w, r.h) : ''}</div></div>
    </div>`
  }).join('\n')

  // ---- the state the cues build up, in time order
  const shown = new Set()
  const tokens = {}       // id -> { at: [node ids] }
  const tokenEls = []
  const sparkEls = []
  const badgeEls = []
  let sparkN = 0
  let badgeN = 0
  const dimTargets = () => [...shown].filter((id) => nodeById[id] || edgeGeo[id])
  const dimSel = (id) => (nodeById[id] ? `"#d-${id}"` : `"#${id} .edim"`)

  const showNode = (id, t) => {
    if (shown.has(id)) return
    shown.add(id)
    add(`tl.fromTo("#n-${id}", {opacity:0, y:14, scale:0.92}, {opacity:1, y:0, scale:1, duration:0.55, ease:"back.out(1.6)"}, ${f3(t)});`)
  }
  const showEdge = (id, t) => {
    if (shown.has(id)) return
    shown.add(id)
    add(`tl.fromTo("#${id}", {opacity:0}, {opacity:1, duration:0.2, ease:"none"}, ${f3(t)});`)
    add(`tl.to("#${id} .base", {strokeDashoffset:0, duration:0.7, ease:"power2.inOut"}, ${f3(t)});`)
  }
  const showRow = (id, t) => {
    if (shown.has(id)) return
    shown.add(id)
    add(`tl.fromTo("#r-${id}", {opacity:0, x:-12}, {opacity:1, x:0, duration:0.5, ease:"power3.out"}, ${f3(t)});`)
    rows[id].nodes.forEach((n, k) => showNode(n, t + 0.12 + k * 0.09))
  }
  const showGroup = (id, t) => {
    if (shown.has(id)) return
    shown.add(id)
    add(`tl.fromTo("#g-${id}", {opacity:0, scale:0.985}, {opacity:1, scale:1, duration:0.6, ease:"power2.out"}, ${f3(t)});`)
    add(`tl.to("#g-${id} .gb rect", {strokeDashoffset:0, duration:1.2, ease:"power2.inOut"}, ${f3(t)});`)
    add(`tl.fromTo("#g-${id} .gl, #g-${id} .gs", {opacity:0, y:10}, {opacity:1, y:0, duration:0.6, ease:"power3.out", stagger:0.1}, ${f3(t + 0.2)});`)
    const g = d.groups.find((x) => x.id === id)
    if (g.mark && markDots) {
      // the UnifyApps mark builds itself dot by dot while it turns into place, as the brand animation does
      add(`tl.fromTo("#g-${id} .uam-g", {rotation:-140, scale:0.35, svgOrigin:"16.2 16.41"}, {rotation:0, scale:1, svgOrigin:"16.2 16.41", duration:1.6, ease:"power3.out"}, ${f3(t + 0.1)});`)
      add(`tl.fromTo("#g-${id} .uam-g circle", {opacity:0}, {opacity:(i, el) => Number(el.dataset.o), duration:0.3, ease:"power1.out", stagger:{ amount:1.1 }}, ${f3(t + 0.1)});`)
    }
  }
  const showAny = (id, t) => {
    if (rows[id]) return showRow(id, t)
    if (rects[id]?.kind === 'group') return showGroup(id, t)
    if (nodeById[id]) return showNode(id, t)
    if (edgeGeo[id]) return showEdge(id, t)
    throw new Error(`diagram cue: "${id}" is not in diagram.json.`)
  }
  // edges appear on their own once both ends are on screen, unless "auto": false
  const autoEdges = (t) => {
    if (d.autoEdges === false) return
    for (const e of d.edges) {
      if (e.auto === false || shown.has(e.id)) continue
      const visible = (id) => shown.has(id) || (rows[id] && shown.has(id))
      if (visible(e.from) && visible(e.to)) showEdge(e.id, t)
    }
  }
  const findEdge = (a, b) => {
    const fwd = d.edges.find((e) => e.from === a && e.to === b)
    if (fwd) return { e: fwd, reverse: false }
    const back = d.edges.find((e) => e.from === b && e.to === a)
    if (back) return { e: back, reverse: true }
    throw new Error(`diagram cue: a token moves ${a} → ${b}, but diagram.json has no edge between them.`)
  }
  const centre = (id) => {
    const r = rects[id]
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 }
  }
  /** one rider (the token or a spark) along the edge a→b, starting at t */
  const ride = (el, a, b, t, dur) => {
    const { e, reverse } = findEdge(a, b)
    showEdge(e.id, t - 0.05)
    const g = edgeGeo[e.id]
    let pts = g.samples(Math.max(10, Math.round(g.length / 28)))
    if (reverse) pts = pts.reverse()
    const L = r1(g.length)
    // the edge lights up under the rider, drawn from the end it leaves
    add(`tl.fromTo("#${e.id} .hot", {strokeDashoffset:${reverse ? -L : L}, opacity:1}, {strokeDashoffset:0, duration:${f3(dur)}, ease:"power1.inOut", immediateRender:false}, ${f3(t)});`)
    add(`tl.to("#${e.id} .hot", {opacity:0.25, duration:1.4, ease:"power2.out"}, ${f3(t + dur + 0.6)});`)
    const kf = pts.map((p) => `{x:${r1(p.x)}, y:${r1(p.y)}}`).join(',')
    add(`tl.to("#${el}", {keyframes:[${kf}], easeEach:"none", duration:${f3(dur)}, ease:"power1.inOut"}, ${f3(t)});`)
    // arrival: the node it reaches answers with a pulse
    showNode(b, t + dur * 0.6)
    add(`tl.fromTo("#p-${b}", {opacity:0.85, scale:1}, {opacity:0, scale:1.32, duration:0.9, ease:"power2.out", immediateRender:false}, ${f3(t + dur - 0.05)});`)
  }

  let badgeOpen = []
  let popOpen = []
  let popN = 0
  let lastStep = -1
  for (const cue of timing.cues) {
    const t = cue.t
    if (cue.stepIndex !== lastStep) {
      // a new line: the previous line's badges leave
      const start = timing.lines[cue.stepIndex].start
      for (const b of badgeOpen) add(`tl.to("#${b} .bp", {opacity:0, y:-8, duration:0.35, ease:"power2.in"}, ${f3(Math.max(start - 0.2, 0))});`)
      badgeOpen = []
      for (const pid of popOpen) add(`tl.to("#${pid}", {opacity:0, y:-10, duration:0.35, ease:"power2.in"}, ${f3(Math.max(start - 0.2, 0))});`)
      popOpen = []
      lastStep = cue.stepIndex
    }
    if (cue.show) {
      ;[].concat(cue.show).forEach((id, k) => showAny(id, t + k * (cue.stagger ?? 0.12)))
      autoEdges(t + 0.35 + [].concat(cue.show).length * (cue.stagger ?? 0.12))
    }
    if (cue.swap) {
      ;[].concat(cue.swap).forEach((id, k) => {
        const n = nodeById[id]
        if (!n?.live) throw new Error(`diagram cue: swap "${id}" needs a node with a "live" face in diagram.json.`)
        const tt = t + k * 0.22
        showNode(id, tt - 0.3)
        add(`tl.fromTo("#n-${id} .face-a", {rotationX:0}, {rotationX:-90, duration:0.32, ease:"power2.in", immediateRender:false}, ${f3(tt)});`)
        add(`tl.set("#n-${id} .face-a", {opacity:0}, ${f3(tt + 0.32)});`)
        add(`tl.set("#n-${id} .face-b", {opacity:1}, ${f3(tt + 0.32)});`)
        add(`tl.fromTo("#n-${id} .face-b", {rotationX:90}, {rotationX:0, duration:0.55, ease:"back.out(1.8)", immediateRender:false}, ${f3(tt + 0.32)});`)
        add(`tl.fromTo("#p-${id}", {opacity:0.9, scale:1}, {opacity:0, scale:1.35, duration:1.0, ease:"power2.out", immediateRender:false}, ${f3(tt + 0.6)});`)
        // the stand-in's replacement is a placeholder until go-live: a light sweeps across it, again and again
        const cycle = 2.6
        const reps = Math.max(0, Math.floor((D - (tt + 0.9)) / cycle) - 1)
        add(`tl.fromTo("#n-${id} .face-b .sheen", {xPercent:-120}, {xPercent:260, duration:1.1, ease:"power1.inOut", repeat:${reps}, repeatDelay:${f3(cycle - 1.1)}}, ${f3(tt + 0.9)});`)
      })
    }
    if (cue.token) {
      const tk = { id: 'k', ...cue.token }
      const el = `tok-${tk.id}`
      if (!tokens[tk.id]) {
        tokens[tk.id] = { at: [] }
        tokenEls.push(`<div class="tok" id="${el}"><div class="tok-in"><span class="tdot"></span>${tk.label ? `<span class="tlab">${esc(tk.label)}</span>` : ''}</div></div>`)
      }
      // it appears on the card's bottom edge, its name below in the gap, so no card text is covered
      const r = rects[tk.on]
      const c = { x: r.x + r.w / 2, y: r.y + r.h }
      showNode(tk.on, t - 0.2)
      add(`tl.set("#${el}", {x:${r1(c.x)}, y:${r1(c.y)}}, ${f3(t)});`)
      if (tk.label) add(`tl.fromTo("#${el} .tlab", {opacity:0}, {opacity:1, duration:0.35, ease:"power2.out", immediateRender:${tokens[tk.id].at.length ? 'false' : 'true'}}, ${f3(t + 0.15)});`)
      tokens[tk.id].named = Boolean(tk.label)
      add(`tl.fromTo("#${el} .tok-in", {opacity:0, scale:0.4}, {opacity:1, scale:1, duration:0.45, ease:"back.out(2)", immediateRender:${tokens[tk.id].at.length ? 'false' : 'true'}}, ${f3(t)});`)
      tokens[tk.id].at = [tk.on]
    }
    if (cue.move) {
      const tid = cue.tokenId ?? (cue.token && typeof cue.token === 'object' ? cue.token.id ?? 'k' : 'k')
      const tk = tokens[tid]
      if (!tk) throw new Error(`diagram cue: "move" before any "token" (step ${cue.step}).`)
      const hop = (cue.hopMs ?? d.hopMs) / 1000
      let tt = t
      // once it travels, the name folds away: a label riding across the cards would cover them
      if (tk.named) {
        add(`tl.to("#tok-${tid} .tlab", {opacity:0, duration:0.3, ease:"power2.in"}, ${f3(t)});`)
        tk.named = false
      }
      for (const next of cue.move) {
        const from = tk.at
        if (Array.isArray(next)) {
          // fan out: the token takes the first branch, sparks take the others
          if (from.length !== 1) throw new Error('diagram cue: a fan-out has to start from one node.')
          next.forEach((b, k) => {
            if (k === 0) return ride(`tok-${tid}`, from[0], b, tt, hop)
            const sp = `spk-${++sparkN}`
            sparkEls.push(`<div class="tok spark" id="${sp}"><div class="tok-in"><span class="tdot"></span></div></div>`)
            const c = centre(from[0])
            add(`tl.set("#${sp}", {x:${r1(c.x)}, y:${r1(c.y)}}, ${f3(tt)});`)
            add(`tl.fromTo("#${sp} .tok-in", {opacity:0, scale:0.4}, {opacity:1, scale:1, duration:0.25, ease:"power2.out"}, ${f3(tt)});`)
            ride(sp, from[0], b, tt, hop)
            tk.sparks = [...(tk.sparks ?? []), { el: sp, at: b }]
          })
          tk.at = next.slice()
        } else {
          ride(`tok-${tid}`, from[0], next, tt, hop)
          for (const sp of tk.sparks ?? []) {
            ride(sp.el, sp.at, next, tt, hop)
            add(`tl.to("#${sp.el} .tok-in", {opacity:0, scale:0.4, duration:0.25, ease:"power2.in"}, ${f3(tt + hop - 0.1)});`)
          }
          tk.sparks = []
          tk.at = [next]
        }
        tt += hop + 0.12
      }
      if (cue.leave) add(`tl.to("#tok-${tid} .tok-in", {opacity:0, scale:0.5, duration:0.4, ease:"power2.in"}, ${f3(tt + 0.2)});`)
    }
    if (cue.hide) {
      ;[].concat(cue.hide).forEach((tid) => add(`tl.to("#tok-${tid} .tok-in", {opacity:0, scale:0.5, duration:0.4, ease:"power2.in"}, ${f3(t)});`))
    }
    if (cue.badge) {
      ;[].concat(cue.badge).forEach((b) => {
        const id = `bdg-${++badgeN}`
        const r = rects[b.on]
        const tone = b.tone ?? 'accent'
        badgeEls.push(`<div class="badge" id="${id}" style="left:${r1(r.x + r.w / 2 - 160)}px;top:${r1(r.y - 10)}px"><span class="bp tone-${tone}">${esc(b.text)}</span></div>`)
        add(`tl.fromTo("#${id} .bp", {opacity:0, y:10, scale:0.9}, {opacity:1, y:0, scale:1, duration:0.45, ease:"back.out(2)"}, ${f3(t)});`)
        if (!b.keep) badgeOpen.push(id)
      })
    }
    if (cue.popup) {
      // a card beside a node: a title and two or three lines on what it does; the previous card of the line leaves
      ;[].concat(cue.popup).forEach((pp) => {
        for (const pid of popOpen) add(`tl.to("#${pid}", {opacity:0, y:-10, duration:0.3, ease:"power2.in"}, ${f3(Math.max(t - 0.15, 0))});`)
        popOpen = []
        const id = `pop-${++popN}`
        const r = rects[pp.on]
        const w = pp.w ?? 330
        const side = pp.side ?? 'right'
        const gap = 18
        let x = side === 'left' ? r.x - w - gap : side === 'right' ? r.x + r.w + gap : r.x + r.w / 2 - w / 2
        let y = side === 'below' ? r.y + r.h + gap : side === 'above' ? r.y - gap - 30 - 26 * ((pp.lines || []).length + 1) : r.y - 6
        x = Math.max(16, Math.min(x, d.space[0] - w - 16))
        y = Math.max(110, Math.min(y, d.space[1] - 60 - 30 * ((pp.lines || []).length + 1)))
        const lines = (pp.lines || []).map((l) => `<li>${esc(l)}</li>`).join('')
        badgeEls.push(`<div class="popup" id="${id}" style="left:${r1(x)}px;top:${r1(y)}px;width:${w}px">${pp.kicker ? `<p class="pk">${esc(pp.kicker)}</p>` : ''}<p class="pt">${esc(pp.title)}</p>${lines ? `<ul>${lines}</ul>` : ''}</div>`)
        add(`tl.fromTo("#${id}", {opacity:0, y:14, scale:0.96}, {opacity:1, y:0, scale:1, duration:0.5, ease:"back.out(1.6)"}, ${f3(t)});`)
        add(`tl.fromTo("#${id} li", {opacity:0, x:-8}, {opacity:1, x:0, duration:0.35, stagger:0.22, ease:"power2.out"}, ${f3(t + 0.35)});`)
        if (!pp.keep) popOpen.push(id)
      })
    }
    if (cue.focus !== undefined) {
      const on = cue.focus ? [].concat(cue.focus).flatMap((id) => (rows[id] ? rows[id].nodes : [id])) : null
      const all = dimTargets()
      if (on) {
        const off = all.filter((id) => !on.includes(id))
        if (off.length) add(`tl.to([${off.map(dimSel).join(',')}], {opacity:0.26, duration:0.6, ease:"power2.inOut"}, ${f3(t)});`)
        add(`tl.to([${on.filter((id) => nodeById[id]).map((id) => `"#d-${id}"`).join(',')}], {opacity:1, duration:0.6, ease:"power2.inOut"}, ${f3(t)});`)
        add(`tl.to([${on.filter((id) => nodeById[id]).map((id) => `"#q-${id}"`).join(',')}], {opacity:1, duration:0.6, ease:"power2.out"}, ${f3(t)});`)
      } else if (all.length) {
        add(`tl.to([${all.map(dimSel).join(',')}], {opacity:1, duration:0.6, ease:"power2.inOut"}, ${f3(t)});`)
        add(`tl.to(".ring", {opacity:0, duration:0.5, ease:"power2.out"}, ${f3(t)});`)
      }
    }
    if (cue.camera !== undefined) {
      if (cue.camera === null) add(`tl.to("#world", {x:0, y:0, scale:1, duration:1.4, ease:"power2.inOut"}, ${f3(t)});`)
      else {
        const r = rects[cue.camera.on]
        if (!r) throw new Error(`diagram cue: camera on "${cue.camera.on}", which is not in diagram.json.`)
        const k = cue.camera.scale ?? 1.2
        const cx = r.x + r.w / 2
        const cy = r.y + r.h / 2
        // keep the push inside the picture: never show past the design space's edges
        const x = Math.min(0, Math.max(SW - SW * k, SW / 2 - cx * k))
        const y = Math.min(0, Math.max(SH - SH * k, (SH + 90) / 2 - cy * k))
        add(`tl.to("#world", {x:${r1(x)}, y:${r1(y)}, scale:${k}, duration:1.6, ease:"power2.inOut"}, ${f3(t)});`)
      }
    }
    if (cue.legend) add(`tl.fromTo("#legend .li", {opacity:0, y:10}, {opacity:1, y:0, duration:0.5, ease:"power3.out", stagger:0.14}, ${f3(t)});`)
  }
  for (const b of badgeOpen) add(`tl.to("#${b} .bp", {opacity:0, y:-8, duration:0.35, ease:"power2.in"}, ${f3(D - 1.0)});`)
  for (const pid of popOpen) add(`tl.to("#${pid}", {opacity:0, y:-10, duration:0.35, ease:"power2.in"}, ${f3(D - 1.0)});`)

  // ---- the header: the act's kicker, and each line's headline rising in as the line starts
  const heads = timing.lines.map((l, i) => `<div class="hl" id="hl-${i}">${String(l.caption ?? '').trim().split(/\s+/).filter(Boolean)
    .map((w) => `<span class="w"><span class="wi">${esc(w)}</span></span>`).join(' ')}</div>`).join('')
  const headMoves = []
  headMoves.push(`tl.fromTo("#kick", {opacity:0, x:-16}, {opacity:1, x:0, duration:0.9, ease:"power3.out"}, 0.35);`)
  timing.lines.forEach((l, i) => {
    const tin = i === 0 ? 0.6 : Math.max(0, l.start - 0.35)
    headMoves.push(`tl.fromTo("#hl-${i} .wi", {yPercent:115}, {yPercent:0, duration:0.7, ease:"power4.out", stagger:0.05}, ${f3(tin)});`)
    const next = timing.lines[i + 1]
    if (next) headMoves.push(`tl.to("#hl-${i} .wi", {yPercent:-115, duration:0.35, ease:"power2.in", stagger:0.02}, ${f3(Math.max(tin + 0.8, next.start - 0.75))});`)
  })

  const legend = `<div id="legend">${['built', 'simulated', 'planned']
    .filter((k) => d.legend[k])
    .map((k) => `<div class="li"><span class="sw sw-${k}"></span>${esc(d.legend[k])}</div>`).join('')}</div>`

  const css = `
      #stage { position: absolute; left: ${r1((W - SW * s) / 2)}px; top: ${r1((H - SH * s) / 2)}px; width: ${SW}px; height: ${SH}px; transform-origin: 0 0; transform: scale(${s.toFixed(5)}); }
      .glow-bg { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
      #glow-a { width: 760px; height: 760px; left: -180px; top: -260px; background: ${brand.accent}; opacity: 0.12; }
      #glow-b { width: 820px; height: 820px; right: -240px; bottom: -340px; background: ${C.built}; opacity: 0.10; }
      #grid { position: absolute; inset: 0; opacity: 0.07;
        background-image: radial-gradient(circle, #fff 1.2px, transparent 1.6px); background-size: 36px 36px;
        -webkit-mask-image: radial-gradient(ellipse at center, #000 25%, transparent 75%); mask-image: radial-gradient(ellipse at center, #000 25%, transparent 75%); }
      #head { position: absolute; left: 44px; top: 30px; right: 44px; height: 92px; }
      #kick { font-size: 14px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: ${brand.accent}; }
      .hl { position: absolute; left: 0; top: 26px; font-size: 32px; font-weight: 600; line-height: 1.2; color: #fff; white-space: nowrap; }
      .w { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: 0.08em; }
      .wi { display: inline-block; }
      #world { position: absolute; left: 0; top: 0; width: ${SW}px; height: ${SH}px; transform-origin: 0 0; }
      .grp { position: absolute; border-radius: 22px; }
      .grp.tone-platform { background: linear-gradient(160deg, color-mix(in srgb, ${C.built} 9%, transparent), rgba(255,255,255,0.015) 55%); }
      .grp.tone-plain { background: rgba(255,255,255,0.025); }
      .gb { position: absolute; inset: 0; overflow: visible; }
      .gb rect { fill: none; stroke: rgba(255,255,255,0.16); stroke-width: 1.5; }
      .tone-platform .gb rect { stroke: color-mix(in srgb, ${C.built} 70%, transparent); stroke-width: 1.8; }
      .gh { position: absolute; left: 20px; top: 14px; right: 20px; display: flex; align-items: center; gap: 12px; }
      .gl { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.01em; }
      .tone-platform .gl { color: ${C.built}; font-size: 20px; }
      .gs { font-size: 12px; color: rgba(255,255,255,0.58); margin-top: 1px; }
      .uam { width: 34px; height: 34px; overflow: visible; }
      .uam circle { fill: ${C.built}; }
      .rowl { position: absolute; height: 50px; display: flex; flex-direction: column; justify-content: flex-end; }
      .rn { font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: ${C.built}; }
      .rs { font-size: 11px; line-height: 1.3; color: rgba(255,255,255,0.55); margin-top: 3px; }
      #edges { position: absolute; left: 0; top: 0; overflow: visible; }
      .edge path { fill: none; stroke-linecap: round; }
      .edge .base { stroke: rgba(255,255,255,0.30); stroke-width: 1.6; }
      .edge .flow { stroke: color-mix(in srgb, ${C.built} 85%, white); stroke-width: 1.8; stroke-dasharray: 2 16; opacity: 0.75; }
      .edge .hot { stroke: ${brand.accent}; stroke-width: 3.2; filter: drop-shadow(0 0 6px ${brand.accent}); }
      .node { position: absolute; }
      .dim, .flip { position: absolute; inset: 0; }
      .flip { perspective: 700px; }
      .face { position: absolute; inset: 0; border-radius: 14px; display: flex; align-items: center; gap: 11px; padding: 10px 12px 10px 12px;
        background: rgba(22,24,28,0.82); box-shadow: 0 14px 34px -14px rgba(0,0,0,0.7); backface-visibility: hidden; }
      .clipper { position: absolute; inset: 0; border-radius: 14px; overflow: hidden; pointer-events: none; }
      .face-b { opacity: 0; }
      .st-built { border: 1.4px solid color-mix(in srgb, ${C.built} 85%, transparent); background: linear-gradient(150deg, color-mix(in srgb, ${C.built} 16%, rgba(22,24,28,0.9)), rgba(22,24,28,0.9) 70%); }
      .st-external { border: 1.4px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }
      .st-simulated { border: 0; background: color-mix(in srgb, ${C.simulated} 9%, rgba(22,24,28,0.9)); }
      .st-planned { border: 0; background: color-mix(in srgb, ${C.planned} 10%, rgba(22,24,28,0.9)); }
      .ants { position: absolute; left: 0; top: 0; overflow: visible; }
      .ants rect { fill: none; stroke-width: 1.6; stroke-dasharray: 6 5; }
      .st-simulated .ants rect { stroke: ${C.simulated}; }
      .st-planned .ants rect { stroke: ${C.planned}; }
      .sheen { position: absolute; top: -20%; bottom: -20%; left: 0; width: 45%; background: linear-gradient(100deg, transparent, color-mix(in srgb, ${C.planned} 28%, transparent), transparent); pointer-events: none; }
      .icb { flex: 0 0 auto; width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; position: relative; }
      .ic { width: 19px; height: 19px; }
      .st-built .icb { background: color-mix(in srgb, ${C.built} 20%, transparent); color: ${C.built}; }
      .st-external .icb { background: rgba(255,255,255,0.08); color: ${C.external}; }
      .st-simulated .icb { background: color-mix(in srgb, ${C.simulated} 20%, transparent); color: ${C.simulated}; }
      .st-planned .icb { background: color-mix(in srgb, ${C.planned} 20%, transparent); color: ${C.planned}; }
      .txt { min-width: 0; position: relative; }
      .lb { font-size: 14.5px; font-weight: 650; color: #fff; line-height: 1.2; }
      .sb { font-size: 11.5px; color: rgba(255,255,255,0.6); line-height: 1.3; margin-top: 3px; }
      .chip { position: absolute; right: 12px; top: -9px; z-index: 2; font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; }
      .st-simulated .chip { color: #1a1430; background: ${C.simulated}; }
      .st-planned .chip { color: #08202c; background: ${C.planned}; }
      .st-built .chip { color: #1b1a17; background: ${C.built}; }
      .st-external .chip { color: #111; background: ${C.external}; }
      .pulse { position: absolute; inset: -2px; border-radius: 16px; border: 2px solid ${brand.accent}; opacity: 0; }
      .ring { position: absolute; inset: -5px; border-radius: 18px; border: 2px solid ${brand.accent}; box-shadow: 0 0 24px -2px ${brand.accent}; opacity: 0; }
      .tok { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 5; }
      .tok-in { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; }
      .tlab { position: absolute; top: 24px; left: 9px; translate: -50% 0; white-space: nowrap; }
      .tdot { width: 18px; height: 18px; border-radius: 50%; background: ${brand.accent}; box-shadow: 0 0 0 4px color-mix(in srgb, ${brand.accent} 30%, transparent), 0 0 22px 4px ${brand.accent}; }
      .tdot { position: absolute; inset: 0; }
      .spark .tdot { inset: 3px; width: 12px; height: 12px; }
      .tlab { font-size: 13px; font-weight: 700; line-height: 1.2; color: #fff; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, ${brand.accent} 82%, black); box-shadow: 0 8px 20px -8px rgba(0,0,0,0.6); }
      .popup { position: absolute; z-index: 8; opacity: 0; padding: 14px 16px 12px; border-radius: 14px; background: color-mix(in srgb, #0b1410 88%, ${brand.accent}); border: 1.5px solid ${brand.accent}; box-shadow: 0 18px 40px -14px rgba(0,0,0,0.85), 0 0 0 4px color-mix(in srgb, ${brand.accent} 14%, transparent); }
      .popup .pk { margin: 0 0 3px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${brand.accent}; }
      .popup .pt { margin: 0 0 6px; font-size: 17px; font-weight: 700; line-height: 1.25; color: #fff; }
      .popup ul { margin: 0; padding: 0 0 0 16px; }
      .popup li { margin: 0 0 4px; font-size: 13.5px; line-height: 1.35; color: rgba(255,255,255,0.86); opacity: 0; }
      .badge { position: absolute; width: 320px; height: 0; display: flex; justify-content: center; align-items: flex-end; z-index: 6; }
      .bp { position: relative; flex: 0 0 auto; font-size: 13px; font-weight: 700; padding: 5px 12px; border-radius: 999px; white-space: nowrap; box-shadow: 0 10px 24px -10px rgba(0,0,0,0.7); }
      .bp.tone-accent { background: ${brand.accent}; color: #fff; }
      .bp.tone-built { background: ${C.built}; color: #1b1a17; }
      .bp.tone-planned { background: ${C.planned}; color: #0b1620; }
      .bp.tone-simulated { background: ${C.simulated}; color: #160f26; }
      #legend { position: absolute; left: 44px; bottom: 30px; display: flex; gap: 26px; }
      .li { display: flex; align-items: center; gap: 9px; font-size: 13px; color: rgba(255,255,255,0.78); opacity: 0; }
      .sw { width: 22px; height: 14px; border-radius: 4px; }
      .sw-built { background: color-mix(in srgb, ${C.built} 30%, transparent); border: 1.4px solid ${C.built}; }
      .sw-simulated { border: 1.6px dashed ${C.simulated}; }
      .sw-planned { border: 1.6px dashed ${C.planned}; }`

  const body = `
      <div id="dg-clip" class="clip dg-clip" data-start="0" data-duration="${f3(D)}">
        <div id="stage">
          <div id="glow-a" class="glow-bg"></div>
          <div id="glow-b" class="glow-bg"></div>
          <div id="grid"></div>
          <div id="world">
            ${groupsHtml}
            ${rowsHtml}
            <svg id="edges" width="${SW}" height="${SH}">${edgesSvg}</svg>
            ${nodesHtml}
            ${tokenEls.join('\n')}
            ${sparkEls.join('\n')}
            ${badgeEls.join('\n')}
          </div>
          <div id="head"><div id="kick">${esc(kicker)}</div>${heads}</div>
          ${legend}
        </div>
      </div>`

  const allMoves = [
    // everything starts hidden; the cues bring it in
    // (gsap.set, outside the timeline: a zero-length set at 0 does not render while the playhead sits on 0)
    'gsap.set(".grp, .rowl, .node, .edge", {opacity:0});',
    'gsap.set(".face-b", {opacity:0, rotationX:90});',
    'gsap.set(".tok-in", {opacity:0});',
    'gsap.set(".bp", {opacity:0});',
    `tl.fromTo("#glow-a", {x:0, y:0}, {x:220, y:140, duration:${f3(D)}, ease:"sine.inOut"}, 0);`,
    `tl.fromTo("#glow-b", {x:0, y:0}, {x:-200, y:-120, duration:${f3(D)}, ease:"sine.inOut"}, 0);`,
    `tl.fromTo("#grid", {backgroundPosition:"0px 0px"}, {backgroundPosition:"36px 72px", duration:${f3(D)}, ease:"none"}, 0);`,
    // data keeps moving along every edge that is on screen, and the stand-ins' outlines march: the picture is live
    `tl.fromTo(".edge .flow", {strokeDashoffset:0}, {strokeDashoffset:${-18 * Math.ceil(D * 1.6)}, duration:${f3(D)}, ease:"none"}, 0);`,
    `tl.fromTo(".ants rect", {strokeDashoffset:0}, {strokeDashoffset:${-11 * Math.ceil(D * 1.4)}, duration:${f3(D)}, ease:"none"}, 0);`,
    ...headMoves,
    ...moves,
  ]
  const never = d.nodes.filter((n) => !shown.has(n.id)).map((n) => n.id)
  return { html: page(W, H, D, font, css, body, allMoves, brand.ink), never }
}
