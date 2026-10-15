/**
 * The `ua-chart` chart block SC Native agents write into their answers (legacy fence `gspc` also accepted):
 *
 *   ```ua-chart
 *   {"kind":"chart","type":"bar","title":"…","subtitle":"…","labels":[…],
 *    "series":[{"name":"…","data":[…]}],"unit":"employees","currency":"USD",
 *    "source":"Oracle EBS · maher_ebs_get_departments · BG 202","insight":"…"}
 *   ```
 *
 * One model step instead of the code-sandbox chart tool (~1 min) — and the island renders it
 * natively, so it is interactive, filterable, re-typeable and exportable.
 */
export type ChartType = 'bar' | 'hbar' | 'line' | 'area' | 'doughnut' | 'pie' | 'stacked'
export const CHART_TYPES: ChartType[] = ['bar', 'hbar', 'line', 'area', 'doughnut', 'pie', 'stacked']

/** `missing`: label indexes the agent left empty (drawn as 0, left out of lowest / average) */
export type Series = { name: string; data: number[]; missing?: number[] }

export type ChartSpec = {
  type: ChartType
  title: string
  subtitle?: string
  labels: string[]
  series: Series[]
  unit?: string
  currency?: string
  source?: string
  insight?: string
  /** false: the values are alternatives or running totals, so adding them up is meaningless */
  total?: boolean
}

const MAX_POINTS = 60
const MAX_SERIES = 8

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    let text = value.trim().replace(/\u2212/g, '-') // Unicode minus
    const accounting = /^\(.*\)$/.test(text) // (1,200) = -1200
    if (accounting) text = text.slice(1, -1)
    // plain forms first ("1.2e6", "-3.5", "1,200", "45%", "$885K" handled below)
    let parsed = Number(text.replace(/[,\s%]/g, ''))
    if (!Number.isFinite(parsed)) {
      const cleaned = text.replace(/[^\d.eE-]/g, '').replace(/^[eE]+|[eE]+$/g, '')
      if (!cleaned) return null
      parsed = Number(cleaned)
      if (!Number.isFinite(parsed)) return null
      const suffix = /([kmb])\s*$/i.exec(text)?.[1]?.toLowerCase()
      if (suffix) parsed *= suffix === 'k' ? 1e3 : suffix === 'm' ? 1e6 : 1e9
    }
    return accounting ? -Math.abs(parsed) : parsed
  }
  return null
}

/** Numbers plus the indexes that had no usable value. */
function toData(values: unknown[], length: number) {
  const data: number[] = []
  const missing: number[] = []
  for (let index = 0; index < length; index++) {
    const value = index < values.length ? toNumber(values[index]) : null
    if (value == null) missing.push(index)
    data.push(value ?? 0)
  }
  return { data, ...(missing.length ? { missing } : {}) }
}

const TYPE_ALIASES: Record<string, ChartType> = {
  bar: 'bar', column: 'bar', vbar: 'bar',
  hbar: 'hbar', horizontalbar: 'hbar', horizontal: 'hbar', 'horizontal-bar': 'hbar', row: 'hbar',
  line: 'line', trend: 'line',
  area: 'area',
  doughnut: 'doughnut', donut: 'doughnut',
  pie: 'pie',
  stacked: 'stacked', stackedbar: 'stacked', 'stacked-bar': 'stacked', grouped: 'bar',
}

/** Parse and normalise; returns null for anything that is not a usable chart (the raw block then stays visible). */
export function parseChartSpec(text: string): ChartSpec | null {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, unknown>
  // `kind` says "this block is a chart"; `type` says which shape. Agents mix the two up — a reply
  // with four charts carried "kind":"chart" once and "kind":"hbar" / "kind":"bar" on the other
  // three, and a strict check here dropped three drawable charts. A kind that names a chart shape
  // is a chart of that shape; only a kind that names something else (a table, a card) is not ours.
  const kind = typeof input.kind === 'string' ? input.kind.toLowerCase().replace(/\s+/g, '') : undefined
  const kindAsType = kind ? TYPE_ALIASES[kind] : undefined
  if (input.kind !== undefined && kind !== 'chart' && !kindAsType) return null

  const labels = Array.isArray(input.labels) ? input.labels.map((label) => String(label ?? '')).slice(0, MAX_POINTS) : []
  let series: Series[] = []
  if (Array.isArray(input.series)) {
    series = input.series
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item, index) => ({
        name: String(item.name ?? item.label ?? `Series ${index + 1}`),
        ...toData(Array.isArray(item.data) ? item.data : [], labels.length),
      }))
      .slice(0, MAX_SERIES)
  } else if (Array.isArray(input.data)) {
    // tolerate the flat shape {"labels":[…],"data":[…]}
    series = [{ name: String(input.seriesName ?? input.unit ?? ''), ...toData(input.data, labels.length) }]
  }
  if (labels.length === 0 || series.length === 0) return null

  let requested = TYPE_ALIASES[String(input.type ?? kindAsType ?? 'bar').toLowerCase().replace(/\s+/g, '')] ?? kindAsType ?? 'bar'
  // a pie of negative values has no meaning (shares above 100% or below 0)
  if ((requested === 'pie' || requested === 'doughnut') && series.some((item) => item.data.some((value) => value < 0))) requested = 'bar'
  const text2 = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)
  return {
    type: requested,
    title: text2(input.title) ?? '',
    subtitle: text2(input.subtitle),
    labels,
    series,
    unit: text2(input.unit),
    currency: text2(input.currency)?.toUpperCase(),
    source: text2(input.source),
    insight: text2(input.insight),
    total: showsTotal(input.total, text2(input.title), text2(input.subtitle), text2(input.unit)),
  }
}

/**
 * A header total only makes sense for parts of a whole: not for options compared side by side,
 * running totals, or values that don't add up (averages, rates, shares, scores, growth).
 */
const NO_TOTAL = /cumulative|running total|\boptions?\b|scenario|compar|alternative|\bvs\.?\b|versus|before and after|average|\bavg\b|\bmean\b|median|\brates?\b|ratio|percent|%|margin|growth|\byoy\b|index|score/i
function showsTotal(flag: unknown, title?: string, subtitle?: string, unit?: string) {
  if (flag === false || flag === 'false') return false
  if (flag === true || flag === 'true') return true
  if (unit === '%') return false
  return !NO_TOTAL.test(`${title ?? ''} ${subtitle ?? ''}`)
}

/** Parts-of-a-whole charts only make sense for one series. */
export function isRadial(type: ChartType) {
  return type === 'doughnut' || type === 'pie'
}
