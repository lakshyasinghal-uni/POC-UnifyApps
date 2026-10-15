import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { APP } from '@/data/app-spec'
import { cn } from '@/lib/utils'
import { ActionButton } from './actions'
import { InsightPanel } from './Insights'
import { field, keyOf, label, show, titleOf, useRows, type Row } from './records'
import type { ListPage, QueuePage } from './types'
import { AskIcon, Empty, ErrorNote, Loading, PageHeader, StatusPill } from './ui'

/**
 * A queue: the records on the left, the selected record and its actions on the right (a list and a
 * detail side by side, never a table behind a modal). Status-like fields become filter chips; the
 * search covers every column. A record can be opened by link (`?open=<key>`), which is how the
 * dashboard and the insights jump straight to it.
 */
export function QueueView({ page }: { page: QueuePage | ListPage }) {
  const { rows, loading, error, refetch } = useRows(page.object)
  const meta = APP.objects[page.object]
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const columns = (page.columns?.length ? page.columns : (meta?.fields ?? []).slice(0, 6).map((f) => f.name)).filter(Boolean)
  const facet = columns.find((c) => field(page.object, c).type === 'select' && /status/.test(c)) ?? columns.find((c) => field(page.object, c).type === 'select')
  const [chip, setChip] = useState<string | null>(null)
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    if (facet) for (const r of rows) m.set(String(r[facet] ?? ''), (m.get(String(r[facet] ?? '')) ?? 0) + 1)
    return [...m.entries()].filter(([k]) => k).sort((a, b) => b[1] - a[1])
  }, [rows, facet])
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => (!chip || String(r[facet ?? ''] ?? '') === chip) && (!needle || columns.some((c) => String(r[c] ?? '').toLowerCase().includes(needle))))
  }, [rows, chip, q, columns, facet])
  const openKey = params.get('open')
  const selected = rows.find((r) => keyOf(page.object, r) === openKey) ?? null
  const select = (r: Row | null) => {
    const next = new URLSearchParams(params)
    if (r) next.set('open', keyOf(page.object, r))
    else next.delete('open')
    setParams(next, { replace: true })
  }
  const isQueue = page.type === 'queue'

  return (
    <div className="space-y-5">
      <PageHeader title={page.name} purpose={page.purpose} aside={<p className="text-[13px] tabular-nums text-white/80">{loading ? '…' : `${rows.length} ${meta?.title.toLowerCase() ?? 'records'}`}</p>}>
        {counts.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Filter by ${field(page.object, facet!).title.toLowerCase()}`}>
            <Chip active={!chip} onClick={() => setChip(null)} text="All" n={rows.length} />
            {counts.slice(0, 8).map(([k, n]) => (
              <Chip key={k} active={chip === k} onClick={() => setChip(chip === k ? null : k)} text={label(k)} n={n} />
            ))}
          </div>
        ) : null}
      </PageHeader>

      {error ? <ErrorNote error={error} onRetry={refetch} what={meta?.title ?? page.object} /> : null}
      <InsightPanel screen={page.name} rows={visible} fields={columns} onOpen={(key) => select(rows.find((r) => keyOf(page.object, r) === key) ?? null)} />

      <div className={cn('grid gap-4', isQueue && selected ? 'lg:grid-cols-[minmax(320px,1fr)_minmax(380px,1.1fr)]' : '')}>
        <section className="min-w-0 rounded-xl border bg-card" aria-label={`${page.name} list`}>
          <label className="flex items-center gap-2 border-b px-4 py-2">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Search {page.name}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${meta?.title.toLowerCase() ?? 'records'}…`} autoComplete="off" className="h-8 w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground" />
          </label>
          {loading ? (
            <Loading className="p-4" rows={6} />
          ) : !visible.length ? (
            <Empty className="m-4" title={rows.length ? 'No record matches' : `No ${meta?.title.toLowerCase() ?? 'records'} yet`}>
              {rows.length ? 'Clear the search or the filter.' : ((page.states ?? []).find((s) => s.startsWith('empty'))?.replace(/^empty:\s*/, '') ?? 'Records appear here as they are created.')}
            </Empty>
          ) : isQueue ? (
            <ul className="max-h-[calc(100dvh-340px)] min-h-[320px] divide-y overflow-y-auto">
              {visible.map((r) => {
                const key = keyOf(page.object, r)
                const active = selected?.id === r.id
                const rest = columns.filter((c) => c !== facet && c !== meta?.key && c !== (page as QueuePage).title_field).slice(0, 3)
                return (
                  <li key={r.id} className={cn('group flex items-center gap-2 pe-2', active && 'bg-accent')}>
                    <button type="button" onClick={() => select(active ? null : r)} aria-current={active ? 'true' : undefined} className="min-w-0 flex-1 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-medium">{titleOf(page.object, r, (page as QueuePage).title_field)}</span>
                        <span className="shrink-0 font-mono text-[11.5px] text-muted-foreground">{key}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{rest.map((c) => `${field(page.object, c).title}: ${show(page.object, c, r[c])}`).join(' · ')}</span>
                    </button>
                    {facet ? <StatusPill value={r[facet]} /> : null}
                    <AskIcon question={`Tell me about ${meta?.title.toLowerCase() ?? 'record'} ${key}: where it stands and the next step.`} scope={key} />
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="max-h-[calc(100dvh-320px)] overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-card text-left text-[12px] text-muted-foreground">
                  <tr className="border-b">
                    {columns.map((c) => (
                      <th key={c} scope="col" className="px-4 py-2 font-medium">
                        {field(page.object, c).title}
                      </th>
                    ))}
                    <th scope="col" className="w-10 px-2">
                      <span className="sr-only">Ask</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visible.map((r) => (
                    <tr key={r.id} className="hover:bg-accent/50">
                      {columns.map((c) => (
                        <td key={c} className={cn('px-4 py-2 align-top', ['number', 'integer'].includes(field(page.object, c).type) && 'text-right tabular-nums')}>
                          {field(page.object, c).type === 'select' ? <StatusPill value={r[c]} /> : show(page.object, c, r[c])}
                        </td>
                      ))}
                      <td className="px-2">
                        <AskIcon question={`Tell me about this ${meta?.title.toLowerCase() ?? 'record'}: ${columns.map((c) => `${field(page.object, c).title} ${show(page.object, c, r[c])}`).join(', ')}.`} scope={page.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {isQueue && selected ? <Detail page={page as QueuePage} row={selected} onClose={() => select(null)} onChanged={refetch} /> : null}
      </div>
    </div>
  )
}

function Chip({ active, onClick, text, n }: { active: boolean; onClick: () => void; text: string; n: number }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors', active ? 'bg-white text-foreground' : 'bg-white/10 text-white hover:bg-white/20')}>
      {text}
      <span className={cn('tabular-nums', active ? 'text-muted-foreground' : 'text-white/60')}>{n}</span>
    </button>
  )
}

function Detail({ page, row, onClose, onChanged }: { page: QueuePage; row: Row; onClose: () => void; onChanged: () => void }) {
  const meta = APP.objects[page.object]
  const [notes, setNotes] = useState('')
  const fields = (page.detail_fields?.length ? page.detail_fields : (meta?.fields ?? []).map((f) => f.name)).filter((f) => f !== meta?.key)
  const long = fields.filter((f) => field(page.object, f).type === 'text' || String(row[f] ?? '').length > 80)
  const short = fields.filter((f) => !long.includes(f))
  const key = keyOf(page.object, row)
  const title = titleOf(page.object, row, page.title_field)
  const wantsNotes = (page.actions ?? []).some((a) => Object.values(a.params ?? {}).includes('notes'))
  return (
    <section aria-label={`${title} details`} className="min-w-0 rounded-xl border bg-card motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-start gap-2 border-b px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[12px] text-muted-foreground">{key}</p>
          <h2 className="text-[16px] font-semibold leading-snug">{title}</h2>
        </div>
        <AskIcon question={`Summarise ${meta?.title.toLowerCase() ?? 'record'} ${key} for me and tell me the next best action.`} scope={key} />
        <button type="button" onClick={onClose} aria-label="Close the details" className="inline-flex size-7 items-center justify-center rounded-md hover:bg-accent">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[calc(100dvh-300px)] space-y-4 overflow-y-auto px-5 py-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
          {short.map((f) => (
            <div key={f} className="min-w-0">
              <dt className="text-[11.5px] text-muted-foreground">{field(page.object, f).title}</dt>
              <dd className="mt-0.5 break-words">{field(page.object, f).type === 'select' ? <StatusPill value={row[f]} /> : show(page.object, f, row[f])}</dd>
            </div>
          ))}
        </dl>
        {long.map((f) => (
          <div key={f}>
            <h3 className="text-[11.5px] text-muted-foreground">{field(page.object, f).title}</h3>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{show(page.object, f, row[f])}</p>
          </div>
        ))}
      </div>
      {page.actions?.length ? (
        <div className="space-y-2 border-t px-5 py-3">
          {wantsNotes ? (
            <label className="block">
              <span className="text-[11.5px] text-muted-foreground">Notes (sent with the actions that need them)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-md border bg-background px-2.5 py-1.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {page.actions.map((a) => (
              <ActionButton
                key={a.label}
                action={a}
                row={row}
                notes={notes}
                onDone={() => {
                  setNotes('')
                  onChanged()
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
