import { useCallback } from 'react'
import { create } from 'zustand'

/**
 * The agent dock — the embedded copilot as a panel beside whatever screen is open.
 *
 * It is a store rather than page state for one reason: a question asked from the map must not
 * navigate away from the map, and the conversation has to survive moving to another screen.
 * The dock mounts once, stays mounted after its first open, and every screen hands questions
 * to it through `useAskAgent()`.
 *
 * `nonce` is what makes an identical question re-send. Without it, clicking the same insight
 * twice would look broken.
 */
interface DockState {
  open: boolean
  /** Set once the dock has been opened, so the copilot stays mounted (and keeps the chat) after closing. */
  started: boolean
  question?: { text: string; nonce: number }
  /** The screen that last handed over a question — shown in the dock header. */
  scope?: string
  show: (scope?: string) => void
  hide: () => void
  toggle: (scope?: string) => void
  send: (text: string, scope?: string) => void
}

export const useAgentDock = create<DockState>()((set) => ({
  open: false,
  started: false,
  show: (scope) => set((state) => ({ open: true, started: true, scope: scope ?? state.scope })),
  hide: () => set({ open: false }),
  toggle: (scope) => set((state) => ({ open: !state.open, started: true, scope: scope ?? state.scope })),
  send: (text, scope) =>
    set((state) => ({ open: true, started: true, scope: scope ?? state.scope, question: { text, nonce: Date.now() } })),
}))

/**
 * Hand a question to the agent from anywhere.
 *
 * The question is sent as written — never wrapped in tool names, ids or JSON. A user-voice
 * message that reads like an internal instruction is rejected by the person reading it, and
 * the agent does not need the help: which tool to call is in its own instructions.
 */
export function useAskAgent() {
  const send = useAgentDock((state) => state.send)
  return useCallback((question: string, scope?: string) => send(question, scope), [send])
}
