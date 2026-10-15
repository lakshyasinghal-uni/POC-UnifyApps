import { useEffect } from 'react'
import { MessageSquareText, Sparkles, X } from 'lucide-react'

import { CopilotHost } from '@/components/copilot-host'
import { DEFAULT_AGENT_ID } from '@/data/datasources'
import { useAgentDock } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'
import { useLang } from './kit'

/**
 * The embedded agent, docked to the side of every screen.
 *
 * Opening the dock sends nothing. That is deliberate: an agent that starts talking because you
 * opened a panel is answering a question nobody asked. What the dock does instead is say what it
 * can see — the scope line in the header — and offer starter questions that send only on click.
 *
 * Once opened it stays mounted even while hidden, so the conversation survives closing the dock
 * and moving between screens. The copilot itself is a same-origin frame (see copilot-host): the
 * SDK's global stylesheet would otherwise restyle the host app.
 */

/**
 * On-screen text for the dock. Pass the solution's own agent name, starters in the customer's
 * words and a welcome that names their objects; the defaults are neutral.
 */
export type AgentDockLabels = {
  /** accessible name of the dock and the chat title, e.g. "Agent" */
  agent: string
  /** header eyebrow, e.g. "Executive analyst" */
  title: string
  /** scope line shown when no narrower scope is set */
  readingAll: string
  /** starter questions; each sends only when clicked */
  starters: string[]
  /** the chat's welcome text */
  welcome: string
}

const DEFAULT_LABELS: Record<'en' | 'ar', AgentDockLabels> = {
  en: {
    agent: 'Agent',
    title: 'Executive analyst',
    readingAll: "Reading this app's data objects",
    starters: [
      'What needs attention this week, and why?',
      'What changed most recently?',
      'Which single action would make the biggest difference?',
    ],
    welcome:
      'Ask me about anything on this screen. I answer from the same records you are looking at, and I say so when the data does not contain the answer.',
  },
  ar: {
    agent: 'الوكيل',
    title: 'المحلل التنفيذي',
    readingAll: 'يقرأ كائنات بيانات هذا التطبيق',
    starters: [
      'ما الذي يحتاج اهتماماً هذا الأسبوع، ولماذا؟',
      'ما الذي تغيّر أكثر مؤخراً؟',
      'أي إجراء منفرد سيُحدث الفرق الأكبر؟',
    ],
    welcome:
      'اسألني عن أي شيء على هذه الشاشة. أجيب من السجلات نفسها التي تراها، وأقول عندما لا تحتوي البيانات على الإجابة.',
  },
}

export function AgentDock({
  labels,
}: {
  /** optional per-language overrides, e.g. `{ en: { agent: 'Procurement agent' } }` */
  labels?: Partial<Record<'en' | 'ar', Partial<AgentDockLabels>>>
} = {}) {
  const lang = useLang()
  const ar = lang === 'ar'
  const text: AgentDockLabels = { ...DEFAULT_LABELS[ar ? 'ar' : 'en'], ...labels?.[ar ? 'ar' : 'en'] }
  const { open, started, question, scope, hide, send } = useAgentDock()

  // Escape closes the dock — it is an overlay on narrow screens, and a panel on wide ones.
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') hide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hide])

  if (!started) return null

  return (
    <>
      {open ? (
        <button
          aria-label={ar ? 'إغلاق' : 'Close'}
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
          onClick={hide}
          type="button"
        />
      ) : null}
      <aside
        aria-hidden={!open}
        aria-label={text.agent}
        className={cn(
          'fixed inset-y-0 end-0 z-50 flex w-full max-w-[min(30rem,100vw)] flex-col border-s border-border bg-card shadow-[-24px_0_60px_-40px_oklch(0.4_0.03_60_/_0.6)] transition-transform duration-300',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full rtl:-translate-x-full',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="qa-eyebrow flex items-center gap-1.5">
              <Sparkles aria-hidden size={12} />
              {text.title}
            </p>
            <p className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
              {scope
                ? ar
                  ? `يقرأ: ${scope}`
                  : `Reading: ${scope}`
                : text.readingAll}
            </p>
          </div>
          <button
            aria-label={ar ? 'إغلاق' : 'Close'}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={hide}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2.5">
          {text.starters.map((starter) => (
            <button
              className="rounded-full border border-border px-2.5 py-1 text-start text-[0.6875rem] text-muted-foreground transition-colors hover:border-[var(--gold)] hover:text-foreground"
              key={starter}
              onClick={() => send(starter)}
              type="button"
            >
              {starter}
            </button>
          ))}
        </div>

        <CopilotHost
          agentId={DEFAULT_AGENT_ID}
          className="min-h-0 flex-1"
          compact
          placeholder={ar ? 'اسأل عن أي رقم على الشاشة…' : 'Ask about any figure on this screen…'}
          question={question}
          title={text.agent}
          welcomeText={text.welcome}
        />
      </aside>
    </>
  )
}

/** The button that opens the dock. Lives in the app header. */
export function AgentDockButton({
  scope,
  label,
}: {
  scope?: string
  /** optional per-language button text; defaults to "Ask the agent" / "اسأل الوكيل" */
  label?: Partial<Record<'en' | 'ar', string>>
}) {
  const lang = useLang()
  const ar = lang === 'ar'
  const buttonText = (ar ? label?.ar : label?.en) ?? (ar ? 'اسأل الوكيل' : 'Ask the agent')
  const toggle = useAgentDock((state) => state.toggle)
  const open = useAgentDock((state) => state.open)
  return (
    <button
      aria-expanded={open}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      onClick={() => toggle(scope)}
      type="button"
    >
      <MessageSquareText aria-hidden size={13} />
      {buttonText}
    </button>
  )
}
