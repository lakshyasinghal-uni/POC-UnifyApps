import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertOctagon,
  ArrowRight,
  Database,
  Info,
  RotateCw,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'

import { ChartBlock } from '@/components/charts/ChartBlock'
import { useAskAgent } from '@/lib/agent-dock'
import { useLang } from './kit'
import {
  ASK_AGENT,
  type ActionSpec,
  type LiveInsight,
  type Severity,
  useLiveInsights,
} from '@/data/insights-live'
import { cn } from '@/lib/utils'

/**
 * The AI band that sits at the top of every screen.
 *
 * It is given the records the screen is actually showing and the list of things the screen can
 * do, and it comes back with the two to four findings a director would raise first — each one
 * carrying its evidence and exactly one button that does something real. That is the whole
 * design: an insight with no action is an observation, and an action with no evidence is a
 * guess. This panel refuses to produce either.
 */

const SEVERITY: Record<
  Severity,
  { en: string; ar: string; icon: typeof Info; tone: string; rail: string }
> = {
  critical: {
    en: 'Critical', ar: 'حرج', icon: AlertOctagon,
    tone: 'bg-destructive-subtle text-destructive-subtle-foreground', rail: 'bg-destructive',
  },
  warning: {
    en: 'Attention', ar: 'انتباه', icon: TriangleAlert,
    tone: 'bg-warning-subtle text-warning-subtle-foreground', rail: 'bg-warning',
  },
  opportunity: {
    en: 'Opportunity', ar: 'فرصة', icon: TrendingUp,
    tone: 'bg-success-subtle text-success-subtle-foreground', rail: 'bg-success',
  },
  info: {
    en: 'Note', ar: 'ملاحظة', icon: Info,
    tone: 'bg-info-subtle text-info-subtle-foreground', rail: 'bg-info',
  },
}

const STEPS = {
  en: [
    "Reading live records from this app's data objects",
    'Comparing scores, trends and gaps',
    'Ranking what needs a decision',
    'Binding each finding to an action',
  ],
  ar: [
    'قراءة السجلات الحية من كائنات بيانات هذا التطبيق',
    'مقارنة الدرجات والاتجاهات والفجوات',
    'ترتيب ما يحتاج إلى قرار',
    'ربط كل نتيجة بإجراء',
  ],
}

const STEP_MS = 3800

function Analysing({ rowCount, datasetNames }: { rowCount: number; datasetNames: string[] }) {
  const lang = useLang()
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, STEPS.en.length - 1)), STEP_MS)
    return () => clearInterval(timer)
  }, [])
  return (
    <div aria-live="polite" className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div>
        <p className="text-sm text-primary-foreground/85">
          {lang === 'ar'
            ? `تحليل ${rowCount} سجلاً حياً من منصة UnifyApps.`
            : `Analysing ${rowCount} live records from the UnifyApps data layer.`}
        </p>
        <p className="mt-1 font-mono text-[10.5px] text-primary-foreground/55" dir="ltr">
          {datasetNames.join(' · ')}
        </p>
        <ol className="mt-4 space-y-2">
          {STEPS[lang].map((label, index) => (
            <li
              className={cn('flex items-center gap-2 text-xs transition-opacity', index > step ? 'opacity-35' : 'opacity-100')}
              key={label}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  index < step ? 'bg-[var(--gold-soft)]' : index === step ? 'animate-pulse bg-[var(--gold-soft)]' : 'bg-primary-foreground/35',
                )}
              />
              {label}
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2].map((index) => (
          <div className="h-16 w-full animate-pulse rounded-xl bg-primary-foreground/10" key={index} />
        ))}
      </div>
    </div>
  )
}

function InsightCard({
  insight,
  spec,
  onAct,
  className,
}: {
  insight: LiveInsight
  spec?: ActionSpec
  onAct: () => void
  className?: string
}) {
  const lang = useLang()
  const meta = SEVERITY[insight.severity]
  const Icon = meta.icon
  return (
    <article className={cn('relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 ps-5', className)}>
      <span aria-hidden className={cn('absolute inset-y-0 start-0 w-1', meta.rail)} />
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-[min(12rem,100%)] flex-1 flex-col gap-1.5">
          <span
            className={cn(
              'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]',
              meta.tone,
            )}
          >
            <Icon aria-hidden size={11} />
            {lang === 'ar' ? meta.ar : meta.en}
          </span>
          <h4 className="font-heading text-[1.0625rem] font-semibold leading-snug text-foreground">{insight.title}</h4>
        </div>
        {insight.metric ? (
          <span
            className={cn(
              'qa-num max-w-full rounded-lg bg-secondary px-2.5 py-1 font-heading font-semibold text-foreground [overflow-wrap:anywhere]',
              insight.metric.length > 14 ? 'text-sm' : 'text-lg',
            )}
            dir="auto"
          >
            {insight.metric}
          </span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
      {insight.evidence.length > 0 ? (
        <ul
          aria-label={lang === 'ar' ? 'الأدلة من كائنات البيانات' : 'Evidence from the data objects'}
          className="flex flex-wrap gap-1.5"
        >
          {insight.evidence.map((item) => (
            <li
              className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground"
              dir="ltr"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {insight.chart ? (
        <div className="-mx-1">
          <ChartBlock dense eyebrow={null} height={172} lang={lang} spec={insight.chart} />
        </div>
      ) : null}
      {insight.action && spec ? (
        <button
          className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          onClick={onAct}
          type="button"
        >
          {insight.action.label}
          <ArrowRight aria-hidden size={13} />
        </button>
      ) : null}
    </article>
  )
}

export interface InsightPanelProps {
  /** The screen name the model is told it is looking at. */
  screen: string
  /** Extra context: the period, the selection, anything that changes the reading. */
  context?: string
  /** The records the screen is showing, keyed by object name. */
  datasets: Record<string, Array<Record<string, unknown>>>
  /** What this screen can execute. `ASK_AGENT` is added automatically. */
  actions?: ActionSpec[]
  /** Called when the model picks a `select` action — the page decides what to select. */
  onSelect?: (action: { id: string; params: Record<string, string | number> }) => void
  /** Called for a `scenario` action. */
  onScenario?: (scenarioCode: string) => void
  className?: string
}

export function InsightPanel({
  screen,
  context = '',
  datasets,
  actions = [],
  onSelect,
  onScenario,
  className,
}: InsightPanelProps) {
  const lang = useLang()
  const navigate = useNavigate()
  const ask = useAskAgent()
  const allActions = useMemo(() => [...actions, ASK_AGENT], [actions])
  const specs = useMemo(() => new Map(allActions.map((action) => [action.id, action])), [allActions])

  const fullContext = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const base =
      lang === 'ar'
        ? `المستخدم: مدير في ديوان الخدمة المدنية والتطوير الحكومي. فترة التقرير: يوليو 2026. تاريخ اليوم: ${today}.`
        : `Viewer: a director at the Civil Service and Government Development Bureau. Reporting period: July 2026. Today is ${today}.`
    return context ? `${base} ${context}` : base
  }, [context, lang])

  const { report, isLoading, isRefreshing, rowCount, datasetNames, regenerate, error, unreadable, tokensUsed } =
    useLiveInsights({ screen, context: fullContext, datasets, actions: allActions })

  function act(insight: LiveInsight) {
    const action = insight.action
    if (!action) return
    const spec = specs.get(action.id)
    if (!spec) return
    if (spec.kind === 'agent') {
      ask(action.prompt?.trim() || `${insight.title} — ${insight.detail}`)
      return
    }
    if (spec.kind === 'navigate') {
      navigate(spec.to)
      return
    }
    if (spec.kind === 'scenario') {
      const code = String(action.params.scenario_code ?? '')
      if (code) onScenario?.(code)
      return
    }
    if (spec.kind === 'select') {
      onSelect?.({ id: action.id, params: action.params })
      return
    }
    if (spec.kind === 'record') {
      // Recording goes through the agent, so the write is approved by a human first and lands
      // with the evidence attached rather than as a bare title.
      ask(
        lang === 'ar'
          ? `سجّل هذه النتيجة كرؤية: «${insight.title}» — ${insight.detail} الأدلة: ${insight.evidence.join(' · ')}`
          : `Record this as an insight: "${insight.title}" — ${insight.detail} Evidence: ${insight.evidence.join(' · ')}`,
      )
    }
  }

  const failed = Boolean(error) || unreadable

  return (
    <section
      className={cn(
        'mb-10 overflow-hidden rounded-2xl border border-[var(--gold-soft)] shadow-[0_18px_40px_-28px_oklch(0.4_0.03_60_/_0.5)]',
        className,
      )}
    >
      <div className="bg-primary px-5 py-4 text-primary-foreground sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="qa-eyebrow flex items-center gap-1.5 text-[var(--gold-soft)]">
              <Sparkles aria-hidden size={12} />
              {lang === 'ar' ? 'رؤى الذكاء الاصطناعي' : 'AI insights'}
            </p>
            {report?.headline ? (
              <p className="mt-1.5 max-w-3xl font-heading text-[1.0625rem] leading-snug sm:text-lg">
                {report.headline}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 font-mono text-[10.5px] text-primary-foreground/75 sm:inline-flex" dir="ltr">
              <Database aria-hidden size={10} />
              {rowCount} records
              {tokensUsed ? ` · ${tokensUsed} tok` : ''}
            </span>
            <button
              aria-label={lang === 'ar' ? 'إعادة التحليل' : 'Regenerate'}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary-foreground/25 px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-primary-foreground/10 disabled:opacity-50"
              disabled={isLoading || isRefreshing}
              onClick={() => void regenerate()}
              type="button"
            >
              <RotateCw aria-hidden className={cn(isRefreshing && 'animate-spin')} size={12} />
              {lang === 'ar' ? 'إعادة التحليل' : 'Regenerate'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4">
            <Analysing datasetNames={datasetNames} rowCount={rowCount} />
          </div>
        ) : null}

        {failed && !isLoading ? (
          <p className="mt-3 text-sm text-primary-foreground/75">
            {lang === 'ar'
              ? 'تعذّر إنتاج التحليل هذه المرة. البيانات أدناه محمّلة كما هي — أعد المحاولة أو اسأل الوكيل مباشرة.'
              : 'The analysis could not be produced this time. The data below is loaded as normal — regenerate, or ask the agent directly.'}
          </p>
        ) : null}
      </div>

      {report && !isLoading ? (
        <div className="grid gap-3 bg-background p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
          {report.insights.map((insight, index) => (
            <InsightCard
              className={insight.chart ? 'md:col-span-2 xl:col-span-1' : undefined}
              insight={insight}
              key={`${insight.title}-${index}`}
              onAct={() => act(insight)}
              spec={insight.action ? specs.get(insight.action.id) : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
