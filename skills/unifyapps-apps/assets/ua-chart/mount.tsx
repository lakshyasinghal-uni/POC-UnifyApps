import { createRoot, type Root } from 'react-dom/client'

// One chart implementation for the whole app: the dashboards and the agent's answers
// render through exactly the same component, so a chart in chat looks like a chart on a page.
import { ChartBlock } from '@/components/charts/ChartBlock'
import { parseChartSpec } from '@/components/charts/spec'

type Lang = 'en' | 'ar'
type Mounted = { host: HTMLElement | null; root: Root | null; text: string; changed: number }

/** How long a block may stay unparseable (or a paragraph chart-looking) before we show the raw text again. */
const SETTLE_MS = 2500

const PENDING = { en: 'Building the chart…', ar: 'جارٍ إعداد الرسم البياني…' }

/** The chat renders ```ua-chart (and legacy ```gspc) fences as `div.codeHighlighter > pre > code.language-gspc`. */
function isChartCode(code: Element) {
  // some renderers cut the fence language at the hyphen ("language-ua"), and agents may pretty-print the JSON
  const text = code.textContent ?? ''
  if ([...code.classList].some((c) => c === 'language-gspc' || c.startsWith('language-ua'))) return /^\s*\{/.test(text)
  // no language class: a JSON object that says it is a chart, or has a chart's shape (labels and
  // series) — an agent that wrote the shape into "kind" still wrote a chart
  return /^\s*\{/.test(text) && (/"kind"\s*:\s*"chart"/.test(text) || (/"labels"\s*:\s*\[/.test(text) && /"series"\s*:\s*\[/.test(text)))
}

function containerOf(code: Element): HTMLElement | null {
  return (code.closest('.codeHighlighter') as HTMLElement | null) ?? (code.closest('pre')?.parentElement as HTMLElement | null)
}

/**
 * While an answer streams, a chart block is plain text until its closing fence arrives: the opening
 * "```ua-chart" and the half-written JSON show up as a paragraph. Those paragraphs are hidden and a
 * skeleton stands in until the real code block (and then the chart) takes over.
 */
const STREAMING_CHART = /```\s*(ua-chart|gspc)|\{\s*"kind"\s*:\s*"(chart|bar|hbar|line|area|doughnut|donut|pie|stacked)"/
function isStreamingChartText(el: Element) {
  if (el.querySelector('code, pre, .gc-host, .gc-skeleton')) return false
  if (el.closest('.gc-host, .gc-skeleton, pre, code')) return false
  // only the tail of a message can still be streaming: a paragraph with real content after it is finished text
  for (let next = el.nextElementSibling; next; next = next.nextElementSibling) if (!next.classList.contains('gc-host') && (next.textContent ?? '').trim()) return false
  return STREAMING_CHART.test(el.textContent ?? '')
}

/** A chart-shaped loading card: title bar and bars that grow, so the space is held without raw text. */
function Skeleton({ lang }: { lang: Lang }) {
  return (
    <div aria-busy="true" aria-label={PENDING[lang]} className="gc-skeleton" role="status">
      <div className="gc-skel-title" />
      <div className="gc-skel-sub" />
      <div className="gc-skel-bars">
        {[46, 72, 58, 88, 64, 38, 80].map((h, i) => (
          <span key={i} style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
      <div className="gc-skel-caption">{PENDING[lang]}</div>
    </div>
  )
}

/**
 * Replaces every chart block in the chat with a native, interactive chart. Idempotent and
 * streaming-safe: a block whose JSON is still incomplete shows a skeleton and is re-parsed as
 * more text arrives; re-rendered messages get a fresh chart; orphans are unmounted.
 */
export function mountCharts({ lang, onDrill }: { lang: Lang; onDrill: (question: string) => void }) {
  const mounted = new Map<HTMLElement, Mounted>()
  const streaming = new Map<HTMLElement, { host: HTMLElement; root: Root; text: string; changed: number }>()
  // paragraphs that looked like a chart but settled as plain text: shown as they are, until their text changes
  const settled = new WeakMap<HTMLElement, string>()
  let scheduled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const recheckLater = () => {
    if (timer) return
    timer = setTimeout(() => {
      timer = undefined
      schedule()
    }, SETTLE_MS)
  }

  function sync() {
    scheduled = false
    for (const code of document.querySelectorAll('code')) {
      if (!isChartCode(code)) continue
      const container = containerOf(code)
      if (!container) continue
      const text = code.textContent ?? ''
      let entry = mounted.get(container)
      if (!entry) {
        entry = { host: null, root: null, text: '\u0000', changed: Date.now() }
        mounted.set(container, entry)
      }
      const spec = entry.text === text ? undefined : parseChartSpec(text)
      if (entry.text !== text) {
        entry.text = text
        entry.changed = Date.now()
        if (!entry.host || !entry.root) {
          const host = document.createElement('div')
          host.className = 'gc-host'
          container.after(host)
          entry.host = host
          entry.root = createRoot(host)
        }
        container.style.display = 'none'
        entry.root.render(spec ? <ChartBlock key={text.length} lang={lang} onDrill={onDrill} spec={spec} /> : <Skeleton lang={lang} />)
        if (!spec) recheckLater()
      } else if (entry.root && entry.host && !parseChartSpec(text) && Date.now() - entry.changed >= SETTLE_MS) {
        // finished but not a usable chart: give the reader the raw block back
        entry.root.unmount()
        entry.host.remove()
        entry.host = null
        entry.root = null
        container.style.display = ''
      } else if (entry.root && !parseChartSpec(text)) recheckLater()
    }

    // half-streamed chart text shown as paragraphs: hide it behind a skeleton
    for (const el of document.querySelectorAll<HTMLElement>('p, li')) {
      if (streaming.has(el) || settled.get(el) === el.textContent || !isStreamingChartText(el)) continue
      const host = document.createElement('div')
      host.className = 'gc-host'
      el.style.display = 'none'
      el.after(host)
      const root = createRoot(host)
      root.render(<Skeleton lang={lang} />)
      streaming.set(el, { host, root, text: el.textContent ?? '', changed: Date.now() })
      recheckLater()
    }
    for (const [el, s] of streaming) {
      const now = el.textContent ?? ''
      if (now !== s.text) {
        s.text = now
        s.changed = Date.now()
      }
      // still growing: keep the skeleton; stopped growing for a while: it's plain text after all
      const stale = Date.now() - s.changed >= SETTLE_MS
      if (el.isConnected && STREAMING_CHART.test(now) && !stale) {
        recheckLater()
        continue
      }
      if (stale && el.isConnected) settled.set(el, now)
      s.root.unmount()
      s.host.remove()
      if (el.isConnected) el.style.display = ''
      streaming.delete(el)
    }

    // messages the SDK re-rendered or removed
    for (const [container, entry] of mounted) {
      if (container.isConnected) continue
      entry.root?.unmount()
      entry.host?.remove()
      mounted.delete(container)
    }
  }

  function schedule() {
    if (scheduled) return
    scheduled = true
    /**
     * A frame when the document is visible, a timer when it is not.
     *
     * `requestAnimationFrame` does not run in a hidden document — a background tab, a collapsed
     * panel, an iframe in a pane that is not on screen. Scheduling the mount on rAF alone meant
     * that in those states `sync` never ran, and every chart the agent wrote stayed a raw block
     * of JSON in the transcript. The agent was doing its job perfectly and the reader saw a wall
     * of braces.
     *
     * `sync` clears `scheduled` before doing anything, so whichever of these lands first wins and
     * the other returns immediately.
     */
    const run = () => {
      if (scheduled) sync()
    }
    requestAnimationFrame(run)
    setTimeout(run, 80)
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  schedule()
  return () => {
    observer.disconnect()
    if (timer) clearTimeout(timer)
    for (const entry of mounted.values()) {
      entry.root?.unmount()
      entry.host?.remove()
    }
    for (const s of streaming.values()) {
      s.root.unmount()
      s.host.remove()
    }
    mounted.clear()
    streaming.clear()
  }
}
