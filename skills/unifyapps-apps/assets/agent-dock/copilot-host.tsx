import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The island document is fetched as TEXT and injected, not loaded by URL.
 *
 * On the deployed tensor host every request whose path ends in `.html` is answered with the
 * application's own shell — its SPA fallback — so framing the island by URL loads the app
 * inside itself and no chat ever appears. Every other extension is served normally, which is
 * why the island build also writes the document as `agent-page.txt`.
 *
 * It is written into an about:blank frame with document.write rather than handed to `srcdoc`:
 * a srcdoc document gets an OPAQUE origin (`origin === "null"`), which would cost the frame the
 * platform session, the `/api` cookies and `postMessage` origin checks all at once. An
 * about:blank frame created by same-origin script inherits this origin, so everything that
 * worked when the island was loaded by URL still works.
 *
 * Asset links are rewritten to absolute URLs on the way in, because the written document's own
 * URL is `about:blank` and a relative `./assets/…` would resolve against nothing.
 */
const ISLAND_DIR = 'copilot-island/'
const ISLAND_DOC = `${ISLAND_DIR}agent-page.txt`

function islandBase() {
  return new URL(`${import.meta.env.BASE_URL}${ISLAND_DIR}`, document.baseURI).href
}

async function loadIslandDocument(): Promise<string> {
  const base = islandBase()
  /* `no-store` on the document, always. Its asset references are content-hashed, so the heavy chunks
     stay cacheable — but the little document that names them must never be: served from cache it
     points at the PREVIOUS build's hashes and the frame silently runs the old island. */
  const response = await fetch(new URL(`${import.meta.env.BASE_URL}${ISLAND_DOC}`, document.baseURI).href, {
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`island document ${response.status}`)
  const html = await response.text()
  // Every asset reference becomes absolute. A <base> tag is not enough: a module script in a
  // srcdoc frame resolves its specifier against its OWN url, and the document's url there is
  // `about:srcdoc`, so a relative `./assets/…` never loads and the island stays blank with no
  // error. With an absolute src the module and its own internal imports all resolve normally.
  return html.replace(/(src|href)=(["'])\.?\/?assets\//gi, (_match, attribute, quote) => `${attribute}=${quote}${base}assets/`)
}

export type CopilotQuestion = { text: string; nonce: number }
/** A control the host asks the framed SDK to perform — new chat, history — with a nonce so it can repeat. */
export type CopilotCommand = { type: string; nonce: number }

/**
 * Frames the prebuilt UnifyApps copilot (island/ + src/copilot-island/entry.tsx) and hands it the
 * same app identity and credentials this app was started with. Same origin, so the frame shares
 * the platform session; its own document keeps the SDK stylesheet from restyling this app.
 * Full SDK chat: token streaming, thinking/tool status, approvals, history, and ```ua-chart blocks.
 */
export function CopilotHost({
  agentId,
  welcomeText,
  placeholder,
  initialPrompt,
  question,
  command,
  starters,
  compact,
  title = 'UnifyApps agent',
  lang = 'en',
  className,
}: {
  agentId: string
  welcomeText?: string
  placeholder?: string
  initialPrompt?: string
  question?: CopilotQuestion
  command?: CopilotCommand
  starters?: string[]
  compact?: boolean
  title?: string
  className?: string
  /** Only the frame's own loading and failure lines; the chat inside is the SDK's. */
  lang?: 'en' | 'ar'
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadIslandDocument()
      .then((html) => {
        const frame = frameRef.current
        if (cancelled || !frame) return
        const doc = frame.contentDocument
        if (!doc) throw new Error('frame document unavailable')
        doc.open()
        doc.write(html)
        doc.close()
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(String((error as Error)?.message ?? error))
      })
    return () => {
      cancelled = true
    }
  }, [agentId])
  // questions are posted once the frame reports ready (the first one after a short settle)
  const sentNonce = useRef<number | undefined>(undefined)
  const readyAt = useRef(0)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return
      if ((event.data as { type?: string })?.type !== 'ua-copilot:ready') return
      frameRef.current?.contentWindow?.postMessage(
        {
          type: 'ua-copilot:init',
          options: {
            interfaceId: import.meta.env.VITE_APPLICATION_ID,
            agentId,
            baseUrl: import.meta.env.VITE_ENTITY_API_BASE || undefined,
            isPreview: import.meta.env.VITE_IS_PREVIEW === '1',
            appAuthToken: import.meta.env.VITE_APP_AUTH_TOKEN || undefined,
            // Only an explicit initialPrompt rides on init. A question that arrived while the frame
            // was loading is posted after ready (below): sent as the initial prompt it raced the SDK's
            // session start on the deployed host and was dropped, leaving the dock on its empty state.
            initialPrompt,
            welcomeText,
            placeholder,
            compact,
            starters,
          },
        },
        window.location.origin,
      )
      readyAt.current = Date.now()
      setIsReady(true)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [agentId, initialPrompt, welcomeText, placeholder, compact, starters])

  useEffect(() => {
    if (!isReady || !question || question.nonce === sentNonce.current) return
    sentNonce.current = question.nonce
    // Delivery is verified, not assumed. On a cold load the SDK re-renders its composer once its chat
    // session opens, which silently wipes text inserted a moment earlier — so the host reads the
    // frame (same origin) for the new user turn and re-posts until it appears.
    const frame = frameRef.current
    const userTurns = () => frame?.contentDocument?.querySelectorAll('[data-message-type="user"]').length ?? 0
    const baseline = userTurns()
    let attempts = 0
    let timer = 0
    const post = () => {
      if (userTurns() > baseline || attempts >= 5) return
      attempts += 1
      frame?.contentWindow?.postMessage({ type: 'ua-copilot:send', text: question.text }, window.location.origin)
      timer = window.setTimeout(post, 3500)
    }
    timer = window.setTimeout(post, Math.max(0, 2500 - (Date.now() - readyAt.current)))
    return () => window.clearTimeout(timer)
  }, [isReady, question])

  const commandNonce = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!isReady || !command || command.nonce === commandNonce.current) return
    commandNonce.current = command.nonce
    frameRef.current?.contentWindow?.postMessage({ type: command.type }, window.location.origin)
  }, [isReady, command])

  return (
    <div className={cn('relative', className)}>
      {loadError ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {lang === 'ar' ? `تعذّر تحميل لوحة الوكيل (${loadError}).` : `The agent panel could not be loaded (${loadError}).`}
        </div>
      ) : !isReady ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {lang === 'ar' ? `جارٍ تحميل ${title}…` : `Loading ${title}…`}
        </div>
      ) : null}
      <iframe className="size-full border-0" key={agentId} ref={frameRef} title={title} />
    </div>
  )
}
