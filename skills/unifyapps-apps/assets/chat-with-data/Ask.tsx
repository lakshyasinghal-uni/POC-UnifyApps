/**
 * Chat with the data — the default on every surface of a UnifyApps app.
 *
 * Anything a screen shows (a KPI, an insight, a chart, an AI result, a table row, a card) hands
 * itself to the docked agent with its own context written out in plain language. The agent
 * explains and elaborates; the user keeps asking. See references/ai-app-patterns.md §15.
 *
 * Needs `useAskAgent` from assets/agent-dock/agent-dock.ts (the dock store) and lucide-react.
 */
import { MessageSquareText } from 'lucide-react'

import { useAskAgent } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'

/** Icon button for tiles, rows and cards. Stops propagation so a surrounding link still works. */
export function AskIcon({
  question,
  scope,
  className,
  label = 'Ask the agent about this',
}: {
  question: string
  scope?: string
  className?: string
  label?: string
}) {
  const ask = useAskAgent()
  return (
    <button
      aria-label={label}
      className={cn('inline-flex size-7 items-center justify-center rounded-md transition-colors', className)}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        ask(question, scope)
      }}
      title={label}
      type="button"
    >
      <MessageSquareText size={14} />
    </button>
  )
}

/** Labelled button for AI results: board briefs, assessments, plans, triage runs, scenarios. */
export function DiscussButton({
  question,
  scope,
  label = 'Discuss with the agent',
}: {
  question: string
  scope?: string
  label?: string
}) {
  const ask = useAskAgent()
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary/40"
      onClick={() => ask(question, scope)}
      type="button"
    >
      <MessageSquareText size={13} /> {label}
    </button>
  )
}
