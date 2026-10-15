import { useData } from '@/lib/data'
import { APP } from '@/data/app-spec'
import type { ChartSpec } from '@/components/charts/spec'
import type { ChartDef, FieldMeta, Kpi, Where } from './types'

export type Row = Record<string, unknown> & { id: string }

/** how many rows one object read brings back; KPIs and charts are computed over them, as in the config apps */
export const ROW_LIMIT = 1000

/**
 * Every row of one object, read once and shared: each screen that asks for the same object gets the
 * same query from the cache, so a dashboard with six KPIs over one object makes one call.
 */
export function useRows(object: string | undefined) {
  const r = useData<Row[]>(`rows:${object ?? ''}`, 'storage', { object: object ?? '', limit: ROW_LIMIT, sort: [{ field: 'createdTime', order: 'DESC' }] })
  return { rows: r.data ?? [], loading: r.loading, error: r.error, refetch: r.refetch, total: r.total }
}

export function field(object: string | undefined, name: string): FieldMeta {
  const f = object ? APP.objects[object]?.fields.find((x) => x.name === name) : undefined
  return f ?? { name, title: human(name), type: /(_at|_date|date|deadline)$/.test(name) ? 'date' : 'string' }
}

const ACRONYMS = new Set(['id', 'ai', 'po', 'sla', 'kpi', 'vat', 'aed', 'usd', 'eur', 'sar', 'cif', 'fob', 'eta', 'etd', 'hs', 'awb', 'bl', 'mrn', 'cpt', 'icd', 'iban', 'trn', 'sku', 'pdf', 'url', 'api', 'crm', 'erp', 'hr', 'kyc', 'aml'])
export function human(name: string): string {
  const words = name.replace(/_/g, ' ').trim().split(/\s+/).filter(Boolean)
  const s = words.map((w, i) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')
  return s || name
}

/**
 * a code-like value (snake_case, kebab, a single lowercase word such as "invoice") shown as words; a list, or a
 * workflow's JSON text of one (["exchange_rate","cif_value_aed"]), as "Exchange rate, CIF value AED"; free text stays
 */
export function label(v: unknown): string {
  if (Array.isArray(v)) return v.map(label).join(', ')
  const s = String(v ?? '')
  if (/^\[[\s\S]*\]$/.test(s.trim())) {
    try {
      const a = JSON.parse(s)
      if (Array.isArray(a) && a.every((x) => x == null || typeof x !== 'object')) return a.length ? a.map(label).join(', ') : 'None'
    } catch {
      /* not JSON: shown as written */
    }
  }
  return /^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/.test(s) ? human(s.replace(/-/g, '_')) : s
}

const time = (v: unknown) => {
  if (v == null || v === '') return NaN
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n > 1e11 ? n : new Date(String(v)).getTime()
}

export function matches(row: Row, where?: Where): boolean {
  if (!where) return true
  for (const [f, cond] of Object.entries(where)) {
    const v = row[f]
    if (Array.isArray(cond)) {
      if (!cond.map(String).includes(String(v))) return false
    } else if (cond && typeof cond === 'object') {
      const n = Number(v)
      if ('gt' in cond && cond.gt != null && !(n > cond.gt)) return false
      if ('gte' in cond && cond.gte != null && !(n >= cond.gte)) return false
      if ('lt' in cond && cond.lt != null && !(n < cond.lt)) return false
      if ('lte' in cond && cond.lte != null && !(n <= cond.lte)) return false
      if ('ne' in cond && cond.ne != null && String(v) === String(cond.ne)) return false
      if ('within_days' in cond && cond.within_days != null && !(time(v) > Date.now() - cond.within_days * 86400000)) return false
      if ('before_now' in cond && cond.before_now && !(time(v) < Date.now())) return false
    } else if (String(v) !== String(cond)) return false
  }
  return true
}

/** one KPI over the rows it names: count (default), sum/avg of a field, or the % of rows that match */
export function kpiValue(k: Kpi, rows: Row[]): number {
  const hit = rows.filter((r) => matches(r, k.where))
  const agg = k.agg ?? (k.field ? 'sum' : 'count')
  const num = (r: Row) => Number(r[k.field ?? '']) || 0
  if (agg === 'sum') return hit.reduce((s, r) => s + num(r), 0)
  if (agg === 'avg') return hit.length ? hit.reduce((s, r) => s + num(r), 0) / hit.length : 0
  if (agg === 'pct') return rows.length ? (hit.length / rows.length) * 100 : 0
  return hit.length
}

/** a chart definition turned into the house chart spec (ua-chart), from the live rows */
export function chartSpec(c: ChartDef, rows: Row[]): ChartSpec {
  const by = new Map<string, number>()
  for (const r of rows) {
    if (!matches(r, c.where)) continue
    const k = r[c.group_by] == null || r[c.group_by] === '' ? 'Not set' : label(r[c.group_by])
    by.set(k, (by.get(k) ?? 0) + (c.field ? Number(r[c.field]) || 0 : 1))
  }
  const entries = [...by.entries()].sort((a, b) => b[1] - a[1])
  const t = String(c.type ?? '').toLowerCase()
  const type = t === 'donut' || t === 'doughnut' || t === 'pie' ? 'doughnut' : t === 'line' ? 'line' : entries.length > 6 ? 'hbar' : 'bar'
  const meta = APP.objects[c.object]
  return {
    type,
    title: c.title,
    subtitle: `${meta?.title ?? human(c.object)} by ${field(c.object, c.group_by).title.toLowerCase()}`,
    labels: entries.map(([k]) => k),
    series: [{ name: c.value_label ?? (c.field ? field(c.object, c.field).title : 'Records'), data: entries.map(([, n]) => Math.round(n * 100) / 100) }],
    unit: c.field ? undefined : 'records',
    currency: c.value_label && /^[A-Z]{3}$/.test(c.value_label) ? c.value_label : undefined,
    source: `${meta?.title ?? c.object} · live`,
  }
}

// KPIs round to one decimal; a record's own value keeps its precision (an exchange rate of 3.67 read as 3.7)
const NUM = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 })
const NUM_LARGE = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const DATE = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const DATE_TIME = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** amounts: a field or KPI whose name says money is shown in the solution's currency */
export const isMoney = (name: string, unit?: string) => /^[A-Z]{3}$/.test(unit ?? '') || /(amount|price|cost|value|revenue|billed|paid|denied|recovered|budget)/.test(name)

/**
 * the currency an amount field is in: the one its name carries (cif_value_aed), else the solution's own currency
 * unless the solution records a currency per record (then an unnamed amount is in that record's currency, which
 * a cell cannot see: an invoice's USD 310 was shown as "AED 310")
 */
const MULTI_CURRENCY = Object.values(APP.objects).some((o) => o.fields.some((x) => x.name === 'currency'))
export function currencyOf(name: string): string | undefined {
  const m = /(?:^|_)([a-z]{3})$/.exec(name)
  if (m && /^(aed|usd|eur|gbp|sar|qar|kwd|omr|bhd|inr|egp|jod|cny|jpy|chf)$/.test(m[1])) return m[1].toUpperCase()
  return MULTI_CURRENCY ? undefined : APP.currency
}

export function formatNumber(n: number, money = false, unit?: string) {
  if (!Number.isFinite(n)) return '—'
  const cur = /^[A-Z]{3}$/.test(unit ?? '') ? unit : APP.currency
  if (money && cur) return `${cur} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n)}`
  return NUM_LARGE.format(n)
}

/** a cell as a person reads it; never invents a value */
export function show(object: string | undefined, name: string, v: unknown): string {
  if (v == null || v === '') return '—'
  const f = field(object, name)
  if (f.type === 'date') {
    const t = time(v)
    if (!Number.isFinite(t)) return String(v)
    const d = new Date(t)
    return d.getHours() || d.getMinutes() ? DATE_TIME.format(d) : DATE.format(d)
  }
  if (f.type === 'boolean') return v === true || v === 'true' ? 'Yes' : 'No'
  if (f.type === 'number' || f.type === 'integer') {
    const cur = currencyOf(name)
    return isMoney(name) && cur ? formatNumber(Number(v), true, cur) : Number.isFinite(Number(v)) ? NUM.format(Number(v)) : String(v)
  }
  if (/(emirates_id|national_id|passport|iban|card_number)/.test(name)) return mask(String(v))
  if (Array.isArray(v)) return label(v)
  if (typeof v === 'object') return JSON.stringify(v)
  // a workflow's JSON text of a list (["exchange_rate","cif_value_aed"]) reads as words
  return f.type === 'select' || /^\s*\[[\s\S]*\]\s*$/.test(String(v)) ? label(v) : String(v)
}

/**
 * A date as a person says it, counted in local calendar days: "today, 09:40", "yesterday, 18:05", "3 days ago",
 * "tomorrow at 10:00", then the date. A screen's own "hours / 24" arithmetic called yesterday 18:05 "today" at 06:00.
 */
export function whenAgo(v: unknown, now = Date.now()): string {
  if (v == null || v === '') return '—'
  const t = time(v)
  if (!Number.isFinite(t)) return String(v)
  const d = new Date(t)
  const n = new Date(now)
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(n) - day(d)) / 86400000)
  const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(d)
  // a record written a moment ago can read a few seconds ahead of this browser's clock: only a real future says "at"
  if (diff === 0) return t > now + 60_000 ? `today at ${hm}` : `today, ${hm}`
  if (diff === 1) return `yesterday, ${hm}`
  if (diff === -1) return `tomorrow at ${hm}`
  if (diff > 1 && diff < 7) return `${diff} days ago`
  if (diff < -1 && diff > -7) return `in ${-diff} days`
  return DATE.format(d)
}

/** identifiers people should not read in full are shown with only their last four characters */
export function mask(s: string) {
  return s.length <= 4 ? s : `${'•'.repeat(Math.min(8, s.length - 4))}${s.slice(-4)}`
}

/** the value that names a record in lists and in the detail header */
export function titleOf(object: string, row: Row, titleField?: string): string {
  const meta = APP.objects[object]
  const pick = titleField ?? meta?.fields.find((f) => /(name|title|subject)$/.test(f.name))?.name ?? meta?.key
  const v = pick ? row[pick] : undefined
  return v == null || v === '' ? String(row[meta?.key ?? 'id'] ?? row.id) : String(v)
}

export function keyOf(object: string, row: Row): string {
  const k = APP.objects[object]?.key
  return String((k && row[k]) ?? row.id)
}

/** status-like fields get a tone; everything else stays neutral */
export function tone(v: unknown): 'good' | 'bad' | 'warn' | 'info' | 'none' {
  const s = String(v ?? '').toLowerCase()
  if (/(approved|resolved|paid|done|complete|clean|won|active|ready|recovered|passed|success|closed)/.test(s)) return 'good'
  if (/(denied|rejected|failed|breach|overdue|error|lost|blocked|critical|urgent|expired)/.test(s)) return 'bad'
  if (/(pending|review|waiting|draft|hold|at_risk|warning|new|open|in_progress|submitted|queried)/.test(s)) return 'warn'
  return 'none'
}
