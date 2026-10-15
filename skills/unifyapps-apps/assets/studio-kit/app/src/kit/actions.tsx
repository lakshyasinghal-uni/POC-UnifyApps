import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGetApiUserContext } from '@unifyapps/app-builder-sdk/hooks/user'
import { useWorkflow, type WorkflowName } from '@/data/solution'
import { cn } from '@/lib/utils'
import type { ActionDef, ParamValue } from './types'
import { human, label, type Row } from './records'

/** the signed-in person's name as the platform returns it; never a made-up fallback */
export function useUserName(): string {
  const { data } = useGetApiUserContext()
  const u = (data as { user?: { name?: string; email?: string } } | undefined)?.user
  return u?.name || u?.email || ''
}

/**
 * The person signed in to the platform: id, display name and username (the platform gives no email). Match the
 * solution's person records to this (their platform_user_id, else username or name), never to a data flag or the
 * first row: with a flag, everyone who opened the app acted as the same sample person.
 */
export function useSignedInUser(): { id: string; name: string; username: string; loading: boolean } {
  const { data, isLoading } = useGetApiUserContext() as { data?: unknown; isLoading?: boolean }
  const u = (data as { user?: { id?: string | number; name?: string; username?: string } } | undefined)?.user
  return { id: u?.id != null ? String(u.id) : '', name: u?.name ?? '', username: u?.username ?? '', loading: !!isLoading }
}

/** the plan's param rules: `row.<field>`, `notes`, `user`, or a literal */
export function resolveParams(params: Record<string, ParamValue> | undefined, row: Row | undefined, notes: string, user: string) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params ?? {})) {
    if (typeof v === 'string' && v.startsWith('row.')) out[k] = row?.[v.slice(4)] ?? ''
    else if (v === 'notes') out[k] = notes
    else if (v === 'user') out[k] = user
    else out[k] = v
  }
  return out
}

/** what a workflow answered, as one readable line (its summary or message when it has one) */
export function outcome(res: Record<string, unknown>): string {
  for (const k of ['message', 'summary', 'result', 'outcome']) {
    const v = res[k]
    if (typeof v === 'string' && v.trim()) return v.length > 200 ? v.slice(0, 200) + '…' : label(v)
  }
  // the status first, then what explains it (what blocks it, the figures): "Draft" alone told the person nothing
  const parts: string[] = []
  if (typeof res.status === 'string' && res.status.trim()) parts.push(label(res.status))
  for (const [k, v] of Object.entries(res)) {
    if (k === 'status' || v == null || v === '' || (typeof v === 'object' && !Array.isArray(v))) continue
    parts.push(`${human(k)}: ${label(v)}`)
    if (parts.length >= 6) break
  }
  const s = parts.join(' · ')
  return s ? (s.length > 320 ? s.slice(0, 320) + '…' : s) : 'Done.'
}

/**
 * One planned action as a button: it runs its workflow with the selected record, the notes box and the
 * signed-in user, then reports the workflow's own answer. `confirm` actions ask first, in place.
 */
export function ActionButton({ action, row, notes, onDone, disabled }: { action: ActionDef; row?: Row; notes: string; onDone?: () => void; disabled?: boolean }) {
  const { run, isRunning } = useWorkflow(action.workflow as WorkflowName)
  const user = useUserName()
  const [confirming, setConfirming] = useState(false)
  const needsNotes = Object.values(action.params ?? {}).includes('notes')
  const go = async () => {
    setConfirming(false)
    try {
      const res = await run(resolveParams(action.params, row, notes, user) as never)
      toast.success(action.label, { description: outcome(res) })
      onDone?.()
    } catch (e) {
      toast.error(`${action.label} did not complete`, { description: String((e as Error)?.message ?? e).slice(0, 240) })
    }
  }
  const base = cn(
    'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] motion-reduce:active:scale-100',
    action.style === 'danger' ? 'bg-destructive text-white hover:bg-destructive/90' : 'border bg-background hover:bg-accent',
  )
  if (confirming)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-warning-border bg-warning-subtle px-2 py-1 text-[12.5px] text-warning-subtle-foreground" role="group" aria-label={`Confirm ${action.label}`}>
        {action.label}?
        <button type="button" onClick={() => void go()} className="rounded bg-foreground px-2 py-0.5 font-medium text-background">
          Yes
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded px-2 py-0.5 hover:bg-background/60">
          Cancel
        </button>
      </span>
    )
  return (
    <button
      type="button"
      className={base}
      disabled={disabled || isRunning || (needsNotes && !notes.trim())}
      title={needsNotes && !notes.trim() ? 'Write a note first' : undefined}
      onClick={() => (action.confirm ? setConfirming(true) : void go())}
    >
      {isRunning ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {action.label}
    </button>
  )
}
