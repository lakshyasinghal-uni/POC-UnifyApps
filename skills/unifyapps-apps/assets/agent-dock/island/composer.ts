/**
 * Puts a message into the SDK composer and presses its own Send button — the same path a user's
 * typing takes. (`useCopilotActions().sendMessage` stayed a no-op in the framed build.)
 * Resolves true once sent, false if the composer never appeared within `timeoutMs`.
 */
const POLL_MS = 300
const SETTLE_MS = 350

export function sendToComposer(message: string, timeoutMs = 30_000): Promise<boolean> {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer)
        resolve(false)
        return
      }
      const editor = document.querySelector<HTMLElement>('.ProseMirror')
      const send = document.querySelector<HTMLButtonElement>('button[aria-label="Send message"]')
      if (!editor || !send) return
      clearInterval(timer)
      editor.focus()
      // replace whatever was half-typed, so a drill-down never merges with a draft
      document.execCommand('selectAll', false)
      document.execCommand('insertText', false, message)
      // let the editor publish its value before the SDK reads it
      setTimeout(() => {
        send.click()
        resolve(true)
      }, SETTLE_MS)
    }, POLL_MS)
  })
}
