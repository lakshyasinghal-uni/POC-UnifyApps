import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { ChartBlock } from '@/components/charts/ChartBlock'
import { APP } from '@/data/app-spec'
import { useAskAgent } from '@/lib/agent-dock'
import { InsightPanel } from './Insights'
import { chartSpec, field, formatNumber, isMoney, keyOf, kpiValue, matches, show, titleOf, useRows, type Row } from './records'
import type { DashboardPage, Kpi, QueuePage } from './types'
import { AskIcon, Empty, ErrorNote, KpiTile, Loading, PageHeader, StatusPill } from './ui'

/**
 * The rows of every object a dashboard reads, keyed by object; each object is read once. Six slots of
 * hooks, always called in the same order (a slot with no object reads nothing), keep the hook rules.
 */
function useObjectRows(objects: string[]) {
  const r0 = useRows(objects[0])
  const r1 = useRows(objects[1])
  const r2 = useRows(objects[2])
  const r3 = useRows(objects[3])
  const r4 = useRows(objects[4])
  const r5 = useRows(objects[5])
  const reads = [r0, r1, r2, r3, r4, r5]
  return new Map(objects.slice(0, 6).map((o, i) => [o, reads[i]] as const))
}

const queueFor = (object: string) => APP.pages.find((p): p is QueuePage => p.type === 'queue' && p.object === object)

export function DashboardView({ page }: { page: DashboardPage }) {
  const navigate = useNavigate()
  const ask = useAskAgent()
  const objects = useMemo(() => [...new Set([...(page.kpis ?? []).map((k) => k.object), ...(page.charts ?? []).map((c) => c.object), ...(page.attention ? [page.attention.object] : []), ...(APP.eventObject ? [APP.eventObject] : [])])], [page])
  const data = useObjectRows(objects)
  const loading = [...data.values()].some((d) => d.loading)
  const failed = [...data.entries()].find(([, d]) => d.error)

  const values = (page.kpis ?? []).map((k) => ({ k, v: kpiValue(k, data.get(k.object)?.rows ?? []) }))
  const thesis = values.length
    ? values
        .slice(0, 3)
        .map(({ k, v }) => `${fmtKpi(k, v)} ${k.label.toLowerCase()}`)
        .join(' · ')
    : ''

  const attention = page.attention
  const attentionRows = attention ? (data.get(attention.object)?.rows ?? []).filter((r) => matches(r, attention.where)).slice(0, 8) : []
  const events = APP.eventObject ? (data.get(APP.eventObject)?.rows ?? []).slice(0, 12) : []
  const allRows = useMemo(() => [...data.values()].flatMap((d) => d.rows.slice(0, 20)), [data])

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={APP.northStar ?? APP.title} title={page.name} purpose={page.purpose}>
        {thesis ? (
          <p className="mb-4 text-pretty text-[15px] font-medium leading-relaxed text-white/90" aria-live="polite">
            {loading ? 'Reading the live records…' : thesis}
          </p>
        ) : null}
        {values.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {values.map(({ k, v }) => {
              const q = queueFor(k.object)
              return (
                <KpiTile
                  key={k.label}
                  label={k.label}
                  value={k.agg === 'avg' ? Math.round(v * 10) / 10 : v}
                  unit={k.agg === 'pct' ? '%' : k.unit}
                  loading={data.get(k.object)?.loading}
                  onClick={q ? () => navigate(q.route) : undefined}
                  question={`${k.label} is ${fmtKpi(k, v)} right now. What is behind this number and what should we do about it?`}
                />
              )
            })}
          </div>
        ) : null}
      </PageHeader>

      {failed ? <ErrorNote error={failed[1].error} onRetry={failed[1].refetch} what={APP.objects[failed[0]]?.title ?? failed[0]} /> : null}

      <InsightPanel screen={page.name} rows={allRows} fields={[...new Set(objects.flatMap((o) => (APP.objects[o]?.fields ?? []).slice(0, 8).map((f) => f.name)))]} />

      {page.charts?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {page.charts.map((c) => {
            const rows = data.get(c.object)?.rows ?? []
            const spec = chartSpec(c, rows)
            return (
              <div key={c.title} className="relative rounded-xl border bg-card p-3 motion-safe:animate-in motion-safe:fade-in">
                <AskIcon className="absolute right-3 top-3 z-10" scope={c.title} question={`Explain the chart "${c.title}": ${spec.labels.slice(0, 8).map((l, i) => `${l} ${spec.series[0]?.data[i]}`).join(', ')}. What stands out?`} />
                {data.get(c.object)?.loading ? (
                  <Loading rows={5} />
                ) : spec.labels.length ? (
                  <ChartBlock spec={spec} lang="en" height={240} dense onDrill={(q) => ask(q, c.title)} />
                ) : (
                  <Empty title={`No ${APP.objects[c.object]?.title.toLowerCase() ?? 'records'} yet`}>The chart fills as records arrive.</Empty>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {attention ? (
          <section className="rounded-xl border bg-card" aria-labelledby="attention-title">
            <h2 id="attention-title" className="border-b px-4 py-2.5 text-[13px] font-semibold">
              {attention.title}
            </h2>
            {data.get(attention.object)?.loading ? (
              <Loading className="p-4" />
            ) : attentionRows.length ? (
              <ul className="divide-y">
                {attentionRows.map((r) => (
                  <AttentionRow key={r.id} object={attention.object} row={r} fields={attention.fields} />
                ))}
              </ul>
            ) : (
              <Empty className="m-4" title="Nothing needs attention">
                {(page.states ?? []).find((s) => s.startsWith('empty'))?.replace(/^empty:\s*/, '') ?? 'New items appear here as soon as they match.'}
              </Empty>
            )}
          </section>
        ) : null}
        {APP.eventObject ? (
          <section className="rounded-xl border bg-card" aria-labelledby="ticker-title">
            <h2 id="ticker-title" className="flex items-center gap-2 border-b px-4 py-2.5 text-[13px] font-semibold">
              <Activity className="size-4 text-primary" aria-hidden="true" /> Live activity
            </h2>
            {events.length ? (
              <ol className="max-h-[360px] divide-y overflow-y-auto" aria-live="polite">
                {events.map((e) => (
                  <li key={e.id} className="flex gap-3 px-4 py-2 text-[12.5px]">
                    <time className="w-28 shrink-0 tabular-nums text-muted-foreground">{when(e.at ?? e.created_at ?? e.createdTime)}</time>
                    <span className="min-w-0 flex-1">{eventText(e)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty className="m-4" title="No activity yet">Every action taken in the app is logged here.</Empty>
            )}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function fmtKpi(k: Kpi, v: number) {
  if (k.agg === 'pct') return `${formatNumber(v)}%`
  return formatNumber(k.agg === 'avg' ? Math.round(v * 10) / 10 : v, isMoney(k.label.toLowerCase() + ' ' + (k.field ?? ''), k.unit), k.unit)
}

const TIME = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
/** an event's moment, whether it arrives as epoch milliseconds or as a date string */
function when(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  const t = Number.isFinite(n) && n > 1e11 ? n : new Date(String(v ?? '')).getTime()
  return Number.isFinite(t) ? TIME.format(new Date(t)) : '—'
}

function eventText(e: Row) {
  const parts = ['kind', 'event_type', 'action', 'type', 'note', 'message', 'summary', 'detail', 'description']
    .map((f) => e[f])
    .filter((v) => v != null && v !== '')
    .map(String)
  const who = e.actor ?? e.user ?? e.created_by
  return `${parts.slice(0, 2).join(': ') || 'Update'}${who ? ` · ${String(who)}` : ''}`
}

function AttentionRow({ object, row, fields }: { object: string; row: Row; fields?: string[] }) {
  const navigate = useNavigate()
  const q = queueFor(object)
  const title = titleOf(object, row, q?.title_field)
  const cols = (fields ?? []).filter((f) => f !== APP.objects[object]?.key).slice(0, 3)
  const statusField = cols.find((f) => field(object, f).type === 'select')
  return (
    <li className="group flex items-center gap-3 px-4 py-2.5">
      <button type="button" onClick={() => q && navigate(`${q.route}?open=${encodeURIComponent(keyOf(object, row))}`)} className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-ring" disabled={!q}>
        <span className="block truncate text-[13.5px] font-medium">{title}</span>
        <span className="block truncate text-[12px] text-muted-foreground">
          {keyOf(object, row)}
          {cols
            .filter((f) => f !== statusField)
            .map((f) => ` · ${show(object, f, row[f])}`)
            .join('')}
        </span>
      </button>
      {statusField ? <StatusPill value={row[statusField]} /> : null}
      <AskIcon question={`Tell me about ${APP.objects[object]?.title.toLowerCase() ?? 'record'} ${keyOf(object, row)} (${title}): why does it need attention and what is the next step?`} scope={title} />
    </li>
  )
}
