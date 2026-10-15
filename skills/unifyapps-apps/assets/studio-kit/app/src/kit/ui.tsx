import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, MessageSquareText, RotateCw } from 'lucide-react'
import { useAskAgent } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'
import { formatNumber, isMoney, label, tone } from './records'

/**
 * Talk to the data: every tile, chart, row, card and AI result carries one of these. It hands the
 * item to the docked agent with its context written out in plain words; the agent explains and the
 * person keeps asking. It stops propagation so a surrounding link or row still works.
 */
export function AskIcon({ question, scope, className, label: text = 'Ask the agent about this' }: { question: string; scope?: string; className?: string; label?: string }) {
  const ask = useAskAgent()
  return (
    <button
      type="button"
      aria-label={text}
      title={text}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        ask(question, scope)
      }}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring',
        className,
      )}
    >
      <MessageSquareText className="size-3.5" aria-hidden="true" />
    </button>
  )
}

const TONES = {
  good: 'bg-success-subtle text-success-subtle-foreground ring-success-border',
  bad: 'bg-destructive-subtle text-destructive-subtle-foreground ring-destructive-border',
  warn: 'bg-warning-subtle text-warning-subtle-foreground ring-warning-border',
  info: 'bg-info-subtle text-info-subtle-foreground ring-info-border',
  none: 'bg-secondary text-secondary-foreground ring-border',
}

export function StatusPill({ value, className }: { value: unknown; className?: string }) {
  if (value == null || value === '') return <span className="text-muted-foreground">—</span>
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset', TONES[tone(value)], className)}>{label(value)}</span>
}

export function Loading({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      ))}
    </div>
  )
}

export function Empty({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center', className)}>
      <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium">{title}</p>
      {children ? <div className="max-w-[48ch] text-[13px] text-muted-foreground">{children}</div> : null}
    </div>
  )
}

export function ErrorNote({ error, onRetry, what }: { error: unknown; onRetry?: () => void; what: string }) {
  const msg = String((error as Error)?.message ?? error ?? '')
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive-border bg-destructive-subtle px-4 py-3 text-[13px] text-destructive-subtle-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Could not load {what}.</p>
        {msg ? <p className="mt-0.5 break-words opacity-90">{msg.slice(0, 240)}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-destructive/10">
          <RotateCw className="size-3.5" aria-hidden="true" /> Retry
        </button>
      ) : null}
    </div>
  )
}

/** The dark band every screen opens with: what this screen is for, and its live counts. */
export function PageHeader({ eyebrow, title, purpose, children, aside }: { eyebrow?: string; title: string; purpose?: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="kit-band relative overflow-hidden rounded-xl px-6 py-5 text-white motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-[70ch]">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">{eyebrow}</p> : null}
          <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight">{title}</h1>
          {purpose ? <p className="mt-1 text-pretty text-[14px] leading-relaxed text-white/75">{purpose}</p> : null}
        </div>
        {aside}
      </div>
      {children ? <div className="relative mt-5">{children}</div> : null}
    </header>
  )
}

/** One live number on a glass tile, with its own Ask. */
export function KpiTile({ label: title, value, unit, loading, question, onClick, glass = true }: { label: string; value: number; unit?: string; loading?: boolean; question: string; onClick?: () => void; glass?: boolean }) {
  const money = isMoney(title.toLowerCase(), unit)
  const pct = unit === '%'
  const text = pct ? `${formatNumber(value)}%` : formatNumber(value, money, unit)
  const Tag = onClick ? 'button' : 'div'
  return (
    <div className={cn('group relative rounded-lg px-4 py-3', glass ? 'kit-glass text-white' : 'border bg-card text-card-foreground')}>
      <Tag {...(onClick ? { type: 'button' as const, onClick } : {})} className={cn('block w-full text-left', onClick && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-white/70')}>
        <span className={cn('block text-[12px] font-medium', glass ? 'text-white/70' : 'text-muted-foreground')}>{title}</span>
        <span className="mt-1 block text-[26px] font-semibold leading-tight tracking-tight tabular-nums">
          {loading ? <span className={cn('inline-block h-7 w-16 animate-pulse rounded motion-reduce:animate-none', glass ? 'bg-white/15' : 'bg-muted')} /> : text}
        </span>
      </Tag>
      <AskIcon
        question={question}
        scope={title}
        className={cn('absolute right-2 top-2 opacity-70 group-hover:opacity-100', glass && 'text-white/70 hover:bg-white/10 hover:text-white')}
      />
    </div>
  )
}
