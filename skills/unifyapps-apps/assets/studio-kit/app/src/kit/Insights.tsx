import { useEffect, useMemo, useState } from 'react'
import { AlertOctagon, ArrowRight, Info, RotateCw, Sparkles, TrendingUp, TriangleAlert } from 'lucide-react'
import { useWorkflow, type WorkflowName } from '@/data/solution'
import { APP } from '@/data/app-spec'
import { useAskAgent } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'
import { AskIcon } from './ui'
import type { Row } from './records'

type Severity = 'critical' | 'warning' | 'opportunity' | 'info'
export type Insight = { title: string; detail: string; severity: Severity; evidence: string[]; record?: string; ask?: string }

const SEV: Record<Severity, { icon: typeof Info; tone: string; label: string }> = {
  critical: { icon: AlertOctagon, tone: 'text-destructive border-l-destructive', label: 'Critical' },
  warning: { icon: TriangleAlert, tone: 'text-warning border-l-warning', label: 'Watch' },
  opportunity: { icon: TrendingUp, tone: 'text-success border-l-success', label: 'Opportunity' },
  info: { icon: Info, tone: 'text-info border-l-info', label: 'Note' },
}

// one reading per screen per session: moving between screens never re-asks the model
const cache = new Map<string, { at: number; insights: Insight[] }>()

function parse(response: Record<string, unknown>): Insight[] {
  let list: unknown = response.insights ?? response.insights_json
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      list = []
    }
  }
  if (!Array.isArray(list)) return []
  return list
    .map((x) => x as Partial<Insight>)
    .filter((x) => x && typeof x.title === 'string' && typeof x.detail === 'string')
    .map((x) => ({
      title: String(x.title),
      detail: String(x.detail),
      severity: (['critical', 'warning', 'opportunity', 'info'].includes(String(x.severity)) ? x.severity : 'info') as Severity,
      evidence: Array.isArray(x.evidence) ? x.evidence.map(String).slice(0, 3) : [],
      record: x.record ? String(x.record) : undefined,
      ask: x.ask ? String(x.ask) : undefined,
    }))
    .slice(0, 4)
}

const DT = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
function readable(field: string, v: unknown): unknown {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{12,13}$/.test(v) ? Number(v) : NaN
  return Number.isFinite(n) && n > 1e11 && n < 1e13 && /(_at|_date|date|deadline|eta|etd|due|time)$/.test(field) ? DT.format(new Date(n)).replace(',', '') : v
}

/**
 * Live AI insights for one screen: the rows the screen shows go to the solution's insights workflow,
 * which answers with ranked findings that quote their evidence. Each finding has one real action:
 * open the record it is about, or hand the question to the agent. Nothing here is written by hand.
 */
export function InsightPanel({ screen, rows, fields, onOpen }: { screen: string; rows: Row[]; fields: string[]; onOpen?: (key: string) => void }) {
  const wf = APP.insightsWorkflow as WorkflowName | undefined
  // the hook must always run; a solution without an insights workflow renders nothing
  const { run, isRunning, error } = useWorkflow((wf ?? Object.keys(APP.objects)[0]) as WorkflowName)
  const ask = useAskAgent()
  const [state, setState] = useState(() => cache.get(screen))
  // what the model reads: dates as local date-times, not epoch milliseconds ("deadline=1790360785182" reached a finding)
  const sample = useMemo(
    () => rows.slice(0, 60).map((r) => Object.fromEntries(fields.filter((f) => r[f] != null && r[f] !== '').map((f) => [f, readable(f, r[f])]))),
    [rows, fields],
  )

  const load = async (force = false) => {
    if (!wf || (!force && cache.has(screen))) return
    try {
      const res = await run({ screen, records_json: JSON.stringify(sample) } as never)
      const next = { at: Date.now(), insights: parse(res) }
      cache.set(screen, next)
      setState(next)
    } catch {
      /* error is shown below */
    }
  }

  useEffect(() => {
    if (sample.length) void load()
    // one reading when the screen's rows first arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample.length > 0, screen])

  if (!wf) return null
  return (
    <section aria-label={`AI insights for ${screen}`} className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold">AI insights</h2>
        <span className="text-xs text-muted-foreground">
          {isRunning ? 'Reading the live records…' : state ? `from ${sample.length} live record${sample.length === 1 ? '' : 's'}, ${new Date(state.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
        <button type="button" onClick={() => void load(true)} disabled={isRunning || !sample.length} className="ms-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50">
          <RotateCw className={cn('size-3.5', isRunning && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" /> Refresh
        </button>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2" aria-live="polite">
        {error && !state ? (
          <p className="bg-card px-4 py-3 text-[13px] text-destructive sm:col-span-2">The insights could not be read: {error.slice(0, 200)}</p>
        ) : !state ? (
          Array.from({ length: 2 }, (_, i) => <div key={i} className="h-24 animate-pulse bg-card motion-reduce:animate-none" />)
        ) : !state.insights.length ? (
          <p className="bg-card px-4 py-3 text-[13px] text-muted-foreground sm:col-span-2">Nothing on this screen needs attention right now.</p>
        ) : (
          state.insights.map((x, i) => {
            const s = SEV[x.severity]
            const Icon = s.icon
            return (
              <article key={i} className={cn('flex flex-col gap-1.5 border-l-2 bg-card px-4 py-3', s.tone)}>
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <h3 className="min-w-0 flex-1 text-[13.5px] font-semibold text-foreground">{x.title}</h3>
                  <AskIcon question={`${x.title}. ${x.detail} Explain this and what I should do about it.`} scope={screen} />
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{x.detail}</p>
                {x.evidence.length ? (
                  <ul className="space-y-0.5 text-[12px] text-muted-foreground">
                    {x.evidence.map((e, j) => (
                      <li key={j} className="font-mono">· {e}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-1 flex gap-2">
                  {x.record && onOpen ? (
                    <button type="button" onClick={() => onOpen(x.record!)} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
                      Open {x.record} <ArrowRight className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" onClick={() => ask(x.ask ?? `${x.title}: what should I do?`, screen)} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
                      Ask the agent <ArrowRight className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
