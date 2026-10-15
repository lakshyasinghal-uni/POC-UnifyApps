import { useEffect, useRef, useState } from 'react'
import { MessageSquareText, X } from 'lucide-react'
import { AGENTS, islandSrc, type AgentKey } from '@/data/solution'
import { APP } from '@/data/app-spec'
import { useAgentDock } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'

const dockAgent = (APP.dockAgent && APP.dockAgent in AGENTS ? APP.dockAgent : Object.keys(AGENTS)[0]) as AgentKey | undefined

/**
 * The solution's agent, docked beside every screen. Opening it sends nothing: it says what it can
 * see (the scope line) and offers starter questions that send only on click. Once opened it stays
 * mounted, so the conversation survives closing the dock and moving between screens. Questions asked
 * from a tile, chart or row arrive through the dock store and are posted into the chat frame.
 */
/**
 * One agent conversation in a frame (the platform copilot, served prebuilt). A question handed in
 * through `question` is posted into the chat once the frame says it is ready; the nonce makes an
 * identical question re-send.
 */
export function IslandFrame({ agent, compact, question, className, onSent }: { agent: AgentKey; compact?: boolean; question?: { text: string; nonce: number }; className?: string; onSent?: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const pending = useRef<{ text: string; nonce: number } | null>(null)
  const sent = useRef(0)
  const src = islandSrc(agent, compact)
  const origin = new URL(src, window.location.href).origin

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return
      if ((e.data as { type?: string })?.type === 'ua-copilot:ready') setReady(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [origin])

  // hand over the latest question once the chat can take it; the nonce makes a repeat re-send
  useEffect(() => {
    if (question && question.nonce !== sent.current) pending.current = question
    const q = pending.current
    if (!ready || !q || !frame.current?.contentWindow) return
    frame.current.contentWindow.postMessage({ type: 'ua-copilot:send', text: q.text }, origin)
    sent.current = q.nonce
    pending.current = null
    onSent?.()
  }, [question, ready, origin, onSent])

  return <iframe ref={frame} src={src} title={`${AGENTS[agent].title} conversation`} className={cn('w-full border-0', className)} allow="clipboard-write" />
}

export function AgentDock() {
  const { open, started, question, scope, hide, send } = useAgentDock()
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hide])

  if (!dockAgent || !started) return null
  const agent = AGENTS[dockAgent]
  return (
    <aside
      aria-label={`${agent.title} chat`}
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-[min(420px,100vw)] flex-col border-l bg-background shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none xl:shadow-none',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
      inert={!open ? true : undefined}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{agent.title}</p>
          <p className="truncate text-xs text-muted-foreground">{scope ? `Looking at: ${scope}` : 'Ask about anything on screen'}</p>
        </div>
        <button type="button" onClick={hide} aria-label="Close the chat" className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {APP.starters?.length && !asked ? (
        <div className="flex flex-wrap gap-1.5 border-b px-4 py-2.5">
          {APP.starters.slice(0, 3).map((s) => (
            <button key={s} type="button" onClick={() => send(s, scope)} className="rounded-full border px-2.5 py-1 text-left text-[12px] hover:bg-accent">
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <IslandFrame agent={dockAgent} compact question={question} className="min-h-0 flex-1" onSent={() => setAsked(true)} />
    </aside>
  )
}

/** The button that opens the dock from the shell header. */
export function DockToggle() {
  const { open, toggle } = useAgentDock()
  if (!dockAgent) return null
  return (
    <button
      type="button"
      onClick={() => toggle()}
      aria-pressed={open}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <MessageSquareText className="size-4" aria-hidden="true" />
      {AGENTS[dockAgent].title}
    </button>
  )
}
