/**
 * The SC Native copilot island — the UnifyApps copilot SDK, compiled ahead of time.
 *
 * WHY: the SDK copilot is always bundled (never CDN-delivered) and needs ~1.7 GB to build. The
 * UnifyApps cloud builder runs out of memory on it ("memory allocation … failed" at "rendering
 * chunks"). So this is built LOCALLY (`bun run build:island`) into `public/copilot-island/`,
 * committed as static files and framed by `@/components/copilot-host`. The cloud build only copies it.
 * Pattern ported from an earlier agentic-assistant build.
 *
 * The frame is its own document styled by the SDK stylesheet + island/index.html (UnifyApps Gold),
 * so the SDK's global utilities never restyle the host app.
 */
import { StrictMode, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AppBuilderProvider } from '@unifyapps/app-builder-sdk'
import { CopilotChat, CopilotHistory, CopilotNewChatButton, CopilotProvider } from '@unifyapps/app-builder-sdk/copilot'
import '@unifyapps/app-builder-sdk/copilot.css'
import { sendToComposer } from './composer'
import { installInlineChartLib } from './inline-chart-lib'
import { mountCharts } from './ua-chart/mount'
import { animateBrandMarks } from './brand-mark'

installInlineChartLib()

/** How long a handed-over question waits for the composer to appear. */
const SEND_TIMEOUT_MS = 30_000

export type IslandOptions = {
  interfaceId: string
  /** the ai_agent (or team agent) this copilot talks to */
  agentId: string
  baseUrl?: string
  isPreview?: boolean
  appAuthToken?: string
  initialPrompt?: string
  welcomeText?: string
  placeholder?: string
  /** the narrow side-panel layout (a dock) rather than the full-width one */
  compact?: boolean
  /** Opening questions, offered until the conversation starts. Sent only on click. */
  starters?: string[]
}

/**
 * Has the conversation begun?
 *
 * The starters are an overlay sitting where the SDK draws its welcome block, so getting this
 * wrong does not merely leave a stale affordance on screen — it paints three buttons on top of
 * the agent's answer. A single signal is not good enough for that, and the first version proved
 * it: it watched for the SDK's welcome block, the block went away on the first message, and the
 * starters stayed. So this takes three independent signals and hides on ANY of them.
 *
 *   1. a latch, set the moment anything is handed to the composer;
 *   2. a capture-phase listener for the user typing and pressing Enter themselves;
 *   3. a poll for rendered message blocks, which also covers a restored conversation.
 *
 * Polling rather than observing: a MutationObserver on this subtree demonstrably did not fire
 * for the SDK's own re-render, and a 400 ms interval that only runs while the chat is empty
 * costs nothing and cannot miss.
 */
function useConversationBegun(host: React.RefObject<HTMLElement | null>, latched: boolean) {
  const [begun, setBegun] = useState(false)

  useEffect(() => {
    if (latched || begun) return
    const read = () => {
      const chat = host.current?.querySelector<HTMLElement>('.copilot-chat-theme')
      // Visible text in the chat means a conversation, including one restored from history. The
      // SDK's welcome block is hidden in compact mode and `innerText` does not report hidden
      // text, so an empty chat reads as genuinely empty.
      //
      // Two earlier signals were tried and removed. `[data-block-id]` is on composer chrome too,
      // so it was true on a brand-new chat. "the welcome block was here and is now gone" flickers
      // during the SDK's own re-render after New chat, which hid the starters on an empty chat.
      // Visible text is the only one that is both sufficient and stable.
      if ((chat?.innerText ?? '').trim().length > 0) setBegun(true)
    }
    read()
    const timer = window.setInterval(read, 400)
    return () => window.clearInterval(timer)
  }, [host, latched, begun])

  // the user typing into the composer never passes through sendToComposer, so catch it here
  useEffect(() => {
    if (begun) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) setBegun(true)
    }
    const onSubmit = () => setBegun(true)
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('submit', onSubmit, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('submit', onSubmit, true)
    }
  }, [begun])

  // stable, so the message listener that calls it does not re-subscribe on every render
  const reset = useCallback(() => setBegun(false), [])

  return { begun, reset }
}

/** Sends a handed-over question exactly once, through the composer itself. */
function AutoSend({ message }: { message: string }) {
  const sent = useRef(false)
  useEffect(() => {
    if (!message || sent.current) return
    sent.current = true
    void sendToComposer(message, SEND_TIMEOUT_MS)
  }, [message])
  return null
}

function IslandCopilot({ options }: { options: IslandOptions }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const fillRef = useRef<HTMLDivElement>(null)
  const newChatRef = useRef<HTMLDivElement>(null)
  // set the instant anything is handed to the composer, including the host's own questions
  const [sent, setSent] = useState(Boolean(options.initialPrompt))
  const { begun, reset } = useConversationBegun(fillRef, sent)
  const starters = options.starters ?? []

  // the host dock owns the chrome in compact mode, and asks for these through postMessage
  useEffect(() => {
    if (!options.compact) return
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const type = (event.data as { type?: string })?.type
      if (type === 'ua-copilot:history') setHistoryOpen((open) => !open)
      // The SDK owns "start a new conversation" — reaching for its button is how the host
      // triggers it without this island keeping a second, divergent copy of chat state.
      if (type === 'ua-copilot:send') setSent(true)
      if (type === 'ua-copilot:new-chat') {
        newChatRef.current?.querySelector('button')?.click()
        // a fresh conversation is empty again, so the starters come back with it
        setSent(false)
        reset()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [options.compact, reset])

  const ask = useCallback((text: string) => {
    setSent(true)
    void sendToComposer(text)
  }, [])

  return (
    <CopilotProvider
      agentId={options.agentId}
      allowAttachments
      appearance={{ messageVariant: 'DEFAULT' }}
      className={`island-root${options.compact ? ' island-compact' : ''}`}
      colorScheme="light"
      placeholder={options.placeholder ?? 'Ask anything…'}
      showMessageActions
      size={options.compact ? 'sm' : 'lg'}
      welcomeText={options.welcomeText}
    >
      <div className="island-layout">
        {historyOpen ? (
          <aside className="island-history">
            <CopilotHistory className="island-fill" />
          </aside>
        ) : null}
        <div className="island-main">
          {/* In the dock the host header already carries the name and the controls; a second
              toolbar here would be the same chrome twice in a 30rem-wide panel. */}
          {options.compact ? (
            <div className="island-offscreen" ref={newChatRef}>
              <CopilotNewChatButton />
            </div>
          ) : (
            <div className="island-toolbar">
              <button className="island-link" onClick={() => setHistoryOpen((open) => !open)} type="button">
                {historyOpen ? 'Hide conversations' : 'Conversations'}
              </button>
              <CopilotNewChatButton />
            </div>
          )}
          <div className="island-fill" ref={fillRef}>
            <CopilotChat />
            {/* The starters live here, inside the chat, sitting directly above the composer —
                not in the host panel above the frame. An opening question belongs next to the
                box you would type it into; anywhere else it reads as decoration. */}
            {!sent && !begun && starters.length ? (
              <div className="island-starters">
                <p className="island-starters-lede">{options.welcomeText ?? 'Ask anything about the live records.'}</p>
                {starters.map((text) => (
                  <button className="island-starter" key={text} onClick={() => ask(text)} type="button">
                    {text}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {options.initialPrompt ? <AutoSend message={options.initialPrompt} /> : null}
        </div>
      </div>
    </CopilotProvider>
  )
}

/** Mounts the copilot into `element`; returns the unmount function. */
export function mount(element: HTMLElement, options: IslandOptions) {
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
  const stopCharts = mountCharts({ lang: 'en', onDrill: (question) => void sendToComposer(question) })
  // the island page lives at <app>/copilot-island/, the animated mark at the app root
  const stopMarks = animateBrandMarks(new URL('../ua-mark-build.svg', window.location.href).pathname)
  // the host can hand over further questions to a copilot that is already open
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    const data = event.data as { type?: string; text?: string }
    if (data?.type === 'ua-copilot:send' && data.text) void sendToComposer(data.text)
  }
  window.addEventListener('message', onMessage)
  const root = createRoot(element)
  root.render(
    <StrictMode>
      <AppBuilderProvider
        appAuthToken={options.appAuthToken}
        baseUrl={options.baseUrl}
        interfaceId={options.interfaceId}
        isPreview={options.isPreview}
      >
        <IslandCopilot options={options} />
      </AppBuilderProvider>
    </StrictMode>,
  )
  return () => {
    window.removeEventListener('message', onMessage)
    stopCharts()
    stopMarks()
    root.unmount()
  }
}
