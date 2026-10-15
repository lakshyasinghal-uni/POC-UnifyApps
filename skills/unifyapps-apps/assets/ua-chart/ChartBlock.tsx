import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, type ChartConfiguration, type ChartType as CjsType, type Plugin, registerables } from 'chart.js'
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
  ChartArea,
  ChartBar,
  ChartColumn,
  ChartColumnStacked,
  ChartLine,
  ChartPie,
  Check,
  Copy,
  Donut,
  Download,
  FileSpreadsheet,
  FileText,
  Image,
  ListFilter,
  Maximize2,
  Minimize2,
  MousePointerClick,
  Printer,
  Sparkles,
  Table2,
} from 'lucide-react'

import { copyTable, exportCsv, exportPng, exportXlsx, type LegendItem, printChart, type TableData } from './export'
import { type ChartSpec, type ChartType, isRadial } from './spec'
import './chart.css'

Chart.register(...registerables)

type Lang = 'en' | 'ar'
type SortMode = 'none' | 'desc' | 'asc'

const COPY = {
  en: {
    eyebrow: 'Live chart', chart: 'Chart', table: 'Table', filter: 'Filter', sort: 'Sort', top: 'Top',
    all: 'All', expand: 'Expand', collapse: 'Close', export: 'Export', png: 'Image (PNG)', xlsx: 'Excel (.xlsx)', csv: 'CSV',
    copy: 'Copy data', copied: 'Copied', print: 'Print / PDF', total: 'Total', average: 'Average', highest: 'Highest', lowest: 'Lowest', items: 'Items',
    share: 'Share', label: 'Item', other: 'Other', drill: 'Click any bar or slice to ask the agent about it', reset: 'Show all',
    types: { bar: 'Columns', hbar: 'Bars', line: 'Line', area: 'Area', doughnut: 'Doughnut', pie: 'Pie', stacked: 'Stacked' },
    sorts: { none: 'Original order', desc: 'Highest first', asc: 'Lowest first' },
    drillAsk: (label: string, series: string, value: string, title: string) => `Drill into “${label}”${series ? ` (${series})` : ''} — ${value} in the chart “${title}”. What is behind this number?`,
    hidden: (count: number) => `${count} hidden`,
    source: 'Source',
  },
  ar: {
    eyebrow: 'رسم بياني مباشر', chart: 'رسم', table: 'جدول', filter: 'تصفية', sort: 'ترتيب', top: 'الأعلى',
    all: 'الكل', expand: 'تكبير', collapse: 'إغلاق', export: 'تصدير', png: 'صورة (PNG)', xlsx: 'إكسل (.xlsx)', csv: 'CSV',
    copy: 'نسخ البيانات', copied: 'تم النسخ', print: 'طباعة / PDF', total: 'الإجمالي', average: 'المتوسط', highest: 'الأعلى', lowest: 'الأدنى', items: 'العناصر',
    share: 'الحصة', label: 'البند', other: 'أخرى', drill: 'انقر على أي عمود أو شريحة لسؤال الوكيل عنها', reset: 'عرض الكل',
    types: { bar: 'أعمدة', hbar: 'أشرطة', line: 'خطي', area: 'مساحي', doughnut: 'حلقي', pie: 'دائري', stacked: 'مكدّس' },
    sorts: { none: 'الترتيب الأصلي', desc: 'الأعلى أولاً', asc: 'الأدنى أولاً' },
    drillAsk: (label: string, series: string, value: string, title: string) => `تعمّق في «${label}»${series ? ` (${series})` : ''} — ${value} في الرسم «${title}». ما الذي يقف وراء هذا الرقم؟`,
    hidden: (count: number) => `${count} مخفية`,
    source: 'المصدر',
  },
} as const

/**
 * Categorical palette, ordered so neighbours stay distinguishable. The default is the
 * UnifyApps Gold set (forest greens with bronze/champagne accents); an app overrides it
 * once at start-up with `setChartPalette` so every chart — dashboard tile and agent answer
 * alike — draws from the same colours. Canvas needs real values, so this cannot be a CSS
 * variable; keep it in step with the theme tokens by calling the setter from one place.
 */
const DEFAULT_PALETTE = ['#0F2805', '#847347', '#5B6B3A', '#A38B5A', '#8FA46A', '#C4B58C', '#0B1E04', '#B8C49A', '#B08D57', '#2F4A1C', '#D8C9A0', '#6E7F45']
let PALETTE: string[] = DEFAULT_PALETTE

/** Set the categorical palette for every chart. Call once, before the first render. */
export function setChartPalette(colors: string[]) {
  PALETTE = colors.length ? colors : DEFAULT_PALETTE
}

const INK = '#1F1C12'
const MUTED = '#6B6450'
const GRID = 'rgba(43,39,25,0.07)'

const TYPE_ICONS: Record<ChartType, typeof ChartColumn> = {
  bar: ChartColumn, hbar: ChartBar, line: ChartLine, area: ChartArea, doughnut: Donut, pie: ChartPie, stacked: ChartColumnStacked,
}

function withAlpha(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`
}

/** Long category names wrap onto lines instead of being cut off. */
function wrapLabel(label: string, max = 22): string | string[] {
  if (label.length <= max) return label
  const words = label.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

function useFormatters(lang: Lang, spec: ChartSpec) {
  return useMemo(() => {
    // Oracle figures read the same in both languages: Western digits, '.' decimals, ',' grouping
    const locale = 'en-US'
    const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
    const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
    let money: Intl.NumberFormat | null = null
    if (spec.currency && /^[A-Z]{3}$/.test(spec.currency)) {
      try {
        money = new Intl.NumberFormat(locale, { style: 'currency', currency: spec.currency, maximumFractionDigits: 2 })
      } catch {
        money = null
      }
    }
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
    const full = (value: number) => (money ? money.format(value) : `${plain.format(value)}${spec.unit ? ` ${spec.unit}` : ''}`)
    const axis = (value: number) => (money ? `${compact.format(value)}` : compact.format(value))
    return { full, axis, plain: (value: number) => plain.format(value), percent: (value: number) => percent.format(value) }
  }, [spec.currency, spec.unit])
}

/** Doughnut centre: the total of what is visible, with its unit. */
function centreTotalPlugin(label: string, format: (value: number) => string): Plugin {
  return {
    id: 'uaCentreTotal',
    afterDraw(chart) {
      const type = (chart.config as { type?: string }).type
      if (type !== 'doughnut') return
      const meta = chart.getDatasetMeta(0)
      const first = meta?.data?.[0] as unknown as { x: number; y: number; innerRadius: number } | undefined
      if (!first) return
      const data = chart.data.datasets[0]?.data as number[]
      const total = data.reduce((sum, value, index) => (chart.getDataVisibility(index) ? sum + (Number(value) || 0) : sum), 0)
      const { ctx } = chart
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = INK
      const size = Math.max(14, Math.min(28, first.innerRadius / 3))
      ctx.font = `600 ${size}px 'Spectral', 'Noto Naskh Arabic', serif`
      ctx.fillText(format(total), first.x, first.y - size * 0.35)
      ctx.fillStyle = MUTED
      ctx.font = `500 ${Math.max(10, size * 0.45)}px 'Poppins', 'IBM Plex Sans Arabic', sans-serif`
      ctx.fillText(label, first.x, first.y + size * 0.65)
      ctx.restore()
    },
  }
}

type View = { labels: string[]; series: { name: string; data: number[]; color: string; source: number }[]; sourceIndex: number[] }

export type ChartBlockProps = {
  spec: ChartSpec
  lang: Lang
  /**
   * Given: clicking a bar or slice asks this question. Omitted: the chart is read-only
   * (dashboard tiles), the click handler is inert and the "click to ask" hint is dropped —
   * a hint pointing at an agent that isn't there is worse than no hint.
   */
  onDrill?: (question: string) => void
  /** Replaces the "Live chart" eyebrow. `null` hides it — use on a page that already has a heading. */
  eyebrow?: string | null
  /** Plot height in px, overriding the per-type default. Ignored while expanded. */
  height?: number
  /**
   * Chrome off: no type switcher, no summary row. For a chart embedded in something that is
   * already a card — an insight card, a small tile — where the controls would take as much
   * room as the plot. Expanding restores everything, so nothing is lost, only deferred.
   */
  dense?: boolean
}

export function ChartBlock({ spec, lang, onDrill, eyebrow, height, dense = false }: ChartBlockProps) {
  const copy = COPY[lang]
  const rtl = lang === 'ar'
  const fmt = useFormatters(lang, spec)
  const multi = spec.series.length > 1
  const [type, setType] = useState<ChartType>(multi && isRadial(spec.type) ? 'bar' : spec.type)
  const [sort, setSort] = useState<SortMode>('none')
  const [topN, setTopN] = useState(0)
  const [hiddenLabels, setHiddenLabels] = useState<Set<number>>(new Set())
  const [hiddenSeries, setHiddenSeries] = useState<Set<number>>(new Set())
  const [mode, setMode] = useState<'chart' | 'table'>('chart')
  const [expanded, setExpanded] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [menu, setMenu] = useState<null | 'export' | 'sort'>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const drillRef = useRef(onDrill)
  drillRef.current = onDrill

  const colorFor = (index: number) => PALETTE[index % PALETTE.length]

  // a doughnut of 15+ slices is unreadable: radial views show the top 9 plus "Other" unless a Top-N was chosen
  const effectiveTop = topN || (isRadial(type) && spec.labels.length - hiddenLabels.size > 10 ? 9 : 0)

  /** Filter → sort → top-N (radial charts fold the remainder into "Other" so the whole stays whole). */
  const view: View = useMemo(() => {
    const visibleSeries = spec.series.map((series, index) => ({ ...series, color: colorFor(index), index })).filter((series) => !hiddenSeries.has(series.index))
    let order = spec.labels.map((_, index) => index).filter((index) => !hiddenLabels.has(index))
    const weight = (index: number) => visibleSeries.reduce((sum, series) => sum + (series.data[index] ?? 0), 0)
    if (sort !== 'none') order = [...order].sort((a, b) => (sort === 'desc' ? weight(b) - weight(a) : weight(a) - weight(b)))
    let labels = order.map((index) => spec.labels[index])
    let series = visibleSeries.map((item) => ({ name: item.name, color: item.color, source: item.index, data: order.map((index) => item.data[index] ?? 0) }))
    let sourceIndex = order
    if (effectiveTop > 0 && order.length > effectiveTop) {
      const ranked = [...order].sort((a, b) => weight(b) - weight(a))
      const keep = new Set(ranked.slice(0, effectiveTop))
      const kept = order.filter((index) => keep.has(index))
      if (isRadial(type)) {
        const rest = order.filter((index) => !keep.has(index))
        labels = [...kept.map((index) => spec.labels[index]), copy.other]
        series = visibleSeries.map((item) => ({ name: item.name, color: item.color, source: item.index, data: [...kept.map((index) => item.data[index] ?? 0), rest.reduce((sum, index) => sum + (item.data[index] ?? 0), 0)] }))
        sourceIndex = [...kept, -1]
      } else {
        labels = kept.map((index) => spec.labels[index])
        series = visibleSeries.map((item) => ({ name: item.name, color: item.color, source: item.index, data: kept.map((index) => item.data[index] ?? 0) }))
        sourceIndex = kept
      }
    }
    return { labels, series, sourceIndex }
  }, [spec, hiddenLabels, hiddenSeries, sort, effectiveTop, type, copy.other])

  const totals = useMemo(() => {
    const first = view.series[0]?.data ?? []
    const all = view.series.flatMap((series) => series.data)
    const total = all.reduce((sum, value) => sum + value, 0)
    // values the agent left empty are drawn as 0 but never count as the lowest or pull the average down
    const missing = new Set(spec.series[view.series[0]?.source ?? 0]?.missing ?? [])
    const present = first.map((_, index) => index).filter((index) => !missing.has(view.sourceIndex[index]))
    let maxIndex = present[0] ?? 0
    let minIndex = present[0] ?? 0
    present.forEach((index) => {
      if (first[index] > first[maxIndex]) maxIndex = index
      if (first[index] < first[minIndex]) minIndex = index
    })
    return {
      total,
      average: present.length ? present.reduce((sum, index) => sum + first[index], 0) / present.length : 0,
      maxLabel: view.labels[maxIndex],
      maxValue: first[maxIndex] ?? 0,
      minLabel: view.labels[minIndex],
      minValue: first[minIndex] ?? 0,
    }
  }, [view, spec.series])

  // ── Chart.js lifecycle ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'chart' || !canvasRef.current) return
    const radial = isRadial(type)
    const horizontal = type === 'hbar'
    const stacked = type === 'stacked'
    const cjsType: CjsType = radial ? (type as CjsType) : type === 'line' || type === 'area' ? 'line' : 'bar'
    const singleBar = !radial && view.series.length === 1 && cjsType === 'bar'
    const maxValue = Math.max(...(view.series[0]?.data ?? [0]))

    const datasets = radial
      ? [{
          label: view.series[0]?.name ?? '',
          data: view.series[0]?.data ?? [],
          backgroundColor: view.labels.map((_, index) => colorFor(index)),
          borderColor: '#FFFDF9',
          borderWidth: 2,
          hoverOffset: 10,
          borderRadius: type === 'doughnut' ? 4 : 0,
        }]
      : view.series.map((series) => ({
          label: series.name,
          data: series.data,
          borderColor: series.color,
          borderWidth: cjsType === 'line' ? 2.5 : 0,
          borderRadius: cjsType === 'bar' ? 6 : 0,
          borderSkipped: false as const,
          maxBarThickness: 46,
          tension: 0.35,
          pointRadius: cjsType === 'line' ? 3.5 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FFFDF9',
          pointBorderWidth: 2,
          fill: type === 'area' ? 'origin' : false,
          backgroundColor: (context: { chart: Chart; dataIndex: number }) => {
            const { chart, dataIndex } = context
            const area = chart.chartArea
            // a single ranking: the leader in gold, the rest in forest green
            const base = singleBar && view.series[0].data[dataIndex] === maxValue ? '#847347' : series.color
            if (!area) return base
            const gradient = horizontal
              ? chart.ctx.createLinearGradient(rtl ? area.right : area.left, 0, rtl ? area.left : area.right, 0)
              : chart.ctx.createLinearGradient(0, area.bottom, 0, area.top)
            if (type === 'area') {
              gradient.addColorStop(0, withAlpha(series.color, 0.02))
              gradient.addColorStop(1, withAlpha(series.color, 0.32))
            } else {
              gradient.addColorStop(0, withAlpha(base, 0.72))
              gradient.addColorStop(1, base)
            }
            return gradient
          },
        }))

    const tickFont = { family: rtl ? "'IBM Plex Sans Arabic', 'Poppins', sans-serif" : "'Poppins', 'IBM Plex Sans Arabic', sans-serif", size: 11.5 }
    const valueAxis = {
      beginAtZero: true,
      stacked,
      grid: { color: GRID },
      border: { display: false },
      ticks: { color: MUTED, font: tickFont, callback: (value: string | number) => fmt.axis(Number(value)) },
    }
    const categoryAxis = {
      stacked,
      grid: { display: false },
      border: { color: 'rgba(20,38,29,0.15)' },
      ticks: {
        color: INK,
        font: tickFont,
        autoSkip: false,
        maxRotation: horizontal ? 0 : 40,
        callback(this: { getLabelForValue: (value: number) => string }, value: string | number) {
          return wrapLabel(this.getLabelForValue(Number(value)), horizontal ? 26 : 16)
        },
      },
    }

    const config: ChartConfiguration = {
      type: cjsType,
      data: { labels: view.labels, datasets: datasets as never },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        locale: 'en-US',
        layout: { padding: { top: 8, bottom: 4, left: 4, right: 4 } },
        interaction: { mode: radial ? 'nearest' : 'index', intersect: radial },
        animation: {
          duration: 700,
          easing: 'easeOutQuart',
          delay: (context: { type: string; mode: string; dataIndex: number }) => (context.type === 'data' && context.mode === 'default' ? context.dataIndex * 35 : 0),
        },
        ...(radial ? { cutout: type === 'doughnut' ? '64%' : 0 } : {}),
        scales: radial
          ? {}
          : horizontal
            ? { x: { ...valueAxis, reverse: rtl }, y: { ...categoryAxis, position: rtl ? 'right' : 'left' } }
            : { x: { ...categoryAxis, reverse: rtl }, y: { ...valueAxis, position: rtl ? 'right' : 'left' } },
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl,
            textDirection: rtl ? 'rtl' : 'ltr',
            backgroundColor: '#0B1E04',
            titleColor: '#EDE6D7',
            bodyColor: '#FFFDF9',
            borderColor: 'rgba(201,162,39,0.5)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleFont: { family: tickFont.family, size: 12.5, weight: 600 },
            bodyFont: { family: tickFont.family, size: 12.5 },
            callbacks: {
              title: (items) => (items[0] ? String(view.labels[items[0].dataIndex] ?? '') : ''),
              label: (item) => {
                const value = Number(item.raw) || 0
                if (radial) {
                  const total = (item.dataset.data as number[]).reduce((sum, entry, index) => (item.chart.getDataVisibility(index) ? sum + (Number(entry) || 0) : sum), 0)
                  return ` ${fmt.full(value)} · ${fmt.percent(total ? value / total : 0)}`
                }
                return ` ${item.dataset.label ? `${item.dataset.label}: ` : ''}${fmt.full(value)}`
              },
            },
          },
        },
        onHover: (event, elements) => {
          const target = event.native?.target as HTMLElement | undefined
          if (target) target.style.cursor = elements.length && drillRef.current ? 'pointer' : 'default'
        },
        onClick: (_event, elements) => {
          const hit = elements[0]
          if (!hit) return
          const label = view.labels[hit.index]
          if (view.sourceIndex[hit.index] === -1) return // "Other" is a bucket, not a thing to drill into
          const series = radial ? '' : view.series[hit.datasetIndex]?.name ?? ''
          const value = radial ? view.series[0].data[hit.index] : view.series[hit.datasetIndex]?.data[hit.index]
          drillRef.current?.(copy.drillAsk(label, multi ? series : '', fmt.full(Number(value) || 0), spec.title || spec.subtitle || ''))
        },
      },
      plugins: [centreTotalPlugin(copy.total, fmt.plain)],
    }

    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, config)
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt whenever what is drawn changes
  }, [view, type, mode, lang, expanded])

  const table: TableData = { labels: view.labels, series: view.series.map(({ name, data }) => ({ name, data })) }
  const hiddenCount = hiddenLabels.size + hiddenSeries.size
  const hasNegative = spec.series.some((series) => series.data.some((value) => value < 0))
  const typeOptions: ChartType[] = multi ? ['bar', 'hbar', 'stacked', 'line', 'area'] : hasNegative ? ['bar', 'hbar', 'line', 'area'] : ['bar', 'hbar', 'line', 'area', 'doughnut', 'pie']
  const radialNow = isRadial(type)
  const exportCanvas = () => canvasRef.current

  function toggle(set: Set<number>, index: number, apply: (next: Set<number>) => void, limit: number) {
    const next = new Set(set)
    if (next.has(index)) next.delete(index)
    else if (next.size < limit - 1) next.add(index) // never hide everything
    apply(next)
  }

  async function runExport(kind: 'png' | 'xlsx' | 'csv' | 'copy' | 'print') {
    setMenu(null)
    // exports need the drawn chart; flip back from the table for a moment if needed
    const canvas = exportCanvas()
    if (kind === 'csv') return exportCsv(table, spec, copy.label)
    if (kind === 'copy') {
      await copyTable(table, copy.label)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      return
    }
    const chart = chartRef.current
    if (!canvas || !chart) return
    // re-render at print density for the export, then put the on-screen chart back
    const screenRatio = chart.options.devicePixelRatio
    chart.options.devicePixelRatio = 3
    chart.options.animation = false
    chart.resize()
    chart.update('none')
    const legend: LegendItem[] = radialNow
      ? view.labels.map((label, index) => {
          const value = view.series[0]?.data[index] ?? 0
          return { color: colorFor(index), label, detail: `${fmt.full(value)} · ${fmt.percent(grandTotal ? value / grandTotal : 0)}` }
        })
      : multi
        ? view.series.map((series) => ({ color: series.color, label: series.name, detail: fmt.full(series.data.reduce((a, b) => a + b, 0)) }))
        : []
    try {
      if (kind === 'png') exportPng(canvas, spec, rtl, legend)
      else if (kind === 'print') printChart(canvas, spec, rtl, legend)
      else await exportXlsx(canvas, table, spec, copy.label, copy.total, rtl, legend)
    } finally {
      chart.options.devicePixelRatio = screenRatio
      chart.resize()
      chart.update('none')
    }
  }

  const grandTotal = view.series[0]?.data.reduce((a, b) => a + b, 0) ?? 0

  return (
    <>
      {expanded ? <div className="gc-backdrop" onClick={() => setExpanded(false)} /> : null}
      <figure className={`gc-card${expanded ? ' gc-expanded' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
        <header className="gc-head">
          <div className="gc-titles">
            {eyebrow === null ? null : (
              <span className="gc-eyebrow">
                <Sparkles aria-hidden size={12} />
                {eyebrow ?? copy.eyebrow}
              </span>
            )}
            {spec.title ? <h3 className="gc-title">{spec.title}</h3> : null}
            {spec.subtitle ? <p className="gc-subtitle">{spec.subtitle}</p> : null}
          </div>
          <div className="gc-tools">
            <div className="gc-segment" role="group">
              <button aria-pressed={mode === 'chart'} className="gc-seg" onClick={() => setMode('chart')} title={copy.chart} type="button">
                {(() => {
                  const Icon = TYPE_ICONS[type]
                  return <Icon size={15} />
                })()}
              </button>
              <button aria-pressed={mode === 'table'} className="gc-seg" onClick={() => setMode('table')} title={copy.table} type="button">
                <Table2 size={15} />
              </button>
            </div>
            <button aria-pressed={showFilter} className="gc-icon" onClick={() => setShowFilter((open) => !open)} title={copy.filter} type="button">
              <ListFilter size={15} />
              {hiddenCount ? <span className="gc-dot" /> : null}
            </button>
            <div className="gc-menu-wrap">
              <button aria-expanded={menu === 'sort'} className="gc-icon" onClick={() => setMenu(menu === 'sort' ? null : 'sort')} title={copy.sort} type="button">
                {sort === 'desc' ? <ArrowDownWideNarrow size={15} /> : sort === 'asc' ? <ArrowUpNarrowWide size={15} /> : <ArrowUpDown size={15} />}
              </button>
              {menu === 'sort' ? (
                <div className="gc-menu" role="menu">
                  {(['none', 'desc', 'asc'] as SortMode[]).map((option) => (
                    <button className="gc-item" key={option} onClick={() => { setSort(option); setMenu(null) }} role="menuitemradio" aria-checked={sort === option} type="button">
                      {sort === option ? <Check size={14} /> : <span className="gc-spacer" />}
                      {copy.sorts[option]}
                    </button>
                  ))}
                  <div className="gc-sep" />
                  {[0, 5, 10].map((option) => (
                    <button className="gc-item" key={option} onClick={() => { setTopN(option); setMenu(null) }} role="menuitemradio" aria-checked={topN === option} type="button">
                      {topN === option ? <Check size={14} /> : <span className="gc-spacer" />}
                      {option ? `${copy.top} ${option}` : copy.all}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="gc-menu-wrap">
              <button aria-expanded={menu === 'export'} className="gc-icon" onClick={() => setMenu(menu === 'export' ? null : 'export')} title={copy.export} type="button">
                {copied ? <Check size={15} /> : <Download size={15} />}
              </button>
              {menu === 'export' ? (
                <div className="gc-menu" role="menu">
                  <button className="gc-item" disabled={mode !== 'chart'} onClick={() => void runExport('png')} role="menuitem" type="button"><Image size={14} />{copy.png}</button>
                  <button className="gc-item" disabled={mode !== 'chart'} onClick={() => void runExport('xlsx')} role="menuitem" type="button"><FileSpreadsheet size={14} />{copy.xlsx}</button>
                  <button className="gc-item" onClick={() => void runExport('csv')} role="menuitem" type="button"><FileText size={14} />{copy.csv}</button>
                  <button className="gc-item" disabled={mode !== 'chart'} onClick={() => void runExport('print')} role="menuitem" type="button"><Printer size={14} />{copy.print}</button>
                  <button className="gc-item" onClick={() => void runExport('copy')} role="menuitem" type="button"><Copy size={14} />{copy.copy}</button>
                </div>
              ) : null}
            </div>
            <button className="gc-icon" onClick={() => setExpanded((open) => !open)} title={expanded ? copy.collapse : copy.expand} type="button">
              {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </header>

        {mode === 'chart' && (!dense || expanded) ? (
          <div className="gc-types" role="group">
            {typeOptions.map((option) => {
              const Icon = TYPE_ICONS[option]
              return (
                <button aria-pressed={type === option} className="gc-type" key={option} onClick={() => setType(option)} type="button">
                  <Icon size={14} />
                  <span>{copy.types[option]}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        {!multi && (!dense || expanded) ? (
          <div className="gc-kpis">
            {spec.total !== false ? (
              <div className="gc-kpi">
                <span>{copy.total}</span>
                <strong>{fmt.full(totals.total)}</strong>
              </div>
            ) : (
              <div className="gc-kpi">
                <span>{copy.lowest}</span>
                <strong>{fmt.full(totals.minValue)}</strong>
                <em title={totals.minLabel}>{totals.minLabel}</em>
              </div>
            )}
            <div className="gc-kpi">
              <span>{copy.highest}</span>
              <strong>{fmt.full(totals.maxValue)}</strong>
              <em title={totals.maxLabel}>{totals.maxLabel}</em>
            </div>
            <div className="gc-kpi">
              <span>{copy.average}</span>
              <strong>{fmt.full(totals.average)}</strong>
            </div>
            <div className="gc-kpi">
              <span>{copy.items}</span>
              <strong>{fmt.plain(view.labels.length)}</strong>
            </div>
          </div>
        ) : null}

        {showFilter || hiddenCount > 0 || (multi && mode === 'chart') ? (
          <div className="gc-chips">
            {multi
              ? spec.series.map((series, index) => (
                  <button aria-pressed={!hiddenSeries.has(index)} className="gc-chip" key={`s${index}`} onClick={() => toggle(hiddenSeries, index, setHiddenSeries, spec.series.length)} type="button">
                    <i style={{ background: colorFor(index) }} />
                    {series.name}
                  </button>
                ))
              : null}
            {showFilter
              ? spec.labels.map((label, index) => (
                  <button aria-pressed={!hiddenLabels.has(index)} className="gc-chip gc-chip-cat" key={`l${index}`} onClick={() => toggle(hiddenLabels, index, setHiddenLabels, spec.labels.length)} type="button">
                    {radialNow ? <i style={{ background: colorFor(index) }} /> : null}
                    {label}
                  </button>
                ))
              : null}
            {hiddenCount ? (
              <button className="gc-reset" onClick={() => { setHiddenLabels(new Set()); setHiddenSeries(new Set()) }} type="button">
                {copy.reset} · {copy.hidden(hiddenCount)}
              </button>
            ) : null}
          </div>
        ) : null}

        {mode === 'chart' ? (
          <div className={`gc-body${radialNow ? ' gc-radial' : ''}`}>
            <div className="gc-canvas" style={{ height: expanded ? 'min(62vh, 620px)' : (height ?? (radialNow ? 290 : Math.min(460, Math.max(260, type === 'hbar' ? view.labels.length * 34 + 60 : 300)))) }}>
              <canvas aria-label={`${spec.title} — ${view.labels.map((label, index) => `${label}: ${fmt.full(view.series[0]?.data[index] ?? 0)}`).join(', ')}`} ref={canvasRef} role="img" />
            </div>
            {radialNow ? (
              <ul className="gc-legend">
                {view.labels.map((label, index) => {
                  const value = view.series[0]?.data[index] ?? 0
                  return (
                    <li key={`${label}-${index}`}>
                      <button
                        disabled={view.sourceIndex[index] === -1}
                        onClick={() => toggle(hiddenLabels, view.sourceIndex[index], setHiddenLabels, spec.labels.length)}
                        title={label}
                        type="button"
                      >
                        <i style={{ background: colorFor(index) }} />
                        <span className="gc-legend-label">{label}</span>
                        <span className="gc-legend-value">{fmt.full(value)}</span>
                        <span className="gc-legend-share">{fmt.percent(grandTotal ? value / grandTotal : 0)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="gc-table-wrap">
            <table className="gc-table">
              <thead>
                <tr>
                  <th>{copy.label}</th>
                  {view.series.map((series, index) => (
                    <th key={index}>{series.name || spec.unit || copy.total}</th>
                  ))}
                  {!multi ? <th>{copy.share}</th> : null}
                </tr>
              </thead>
              <tbody>
                {view.labels.map((label, row) => (
                  <tr key={`${label}-${row}`}>
                    <td>{label}</td>
                    {view.series.map((series, index) => (
                      <td className="gc-num" key={index}>{fmt.full(series.data[row] ?? 0)}</td>
                    ))}
                    {!multi ? <td className="gc-num">{fmt.percent(grandTotal ? (view.series[0].data[row] ?? 0) / grandTotal : 0)}</td> : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>{copy.total}</td>
                  {view.series.map((series, index) => (
                    <td className="gc-num" key={index}>{fmt.full(series.data.reduce((a, b) => a + b, 0))}</td>
                  ))}
                  {!multi ? <td className="gc-num">{fmt.percent(1)}</td> : null}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {spec.insight ? <p className="gc-insight">{spec.insight}</p> : null}

        <figcaption className="gc-foot">
          {spec.source ? (
            <span className="gc-source">
              {copy.source}: <bdi>{spec.source}</bdi>
            </span>
          ) : <span />}
          {mode === 'chart' && onDrill ? (
            <span className="gc-hint">
              <MousePointerClick size={13} />
              {copy.drill}
            </span>
          ) : null}
        </figcaption>
      </figure>
    </>
  )
}
