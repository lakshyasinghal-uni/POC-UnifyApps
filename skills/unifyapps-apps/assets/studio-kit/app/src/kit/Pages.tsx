import { useState } from 'react'
import { FileUp, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useUppy } from '@unifyapps/app-builder-sdk/hooks/upload'
import { AGENTS, useWorkflow, type AgentKey, type WorkflowName } from '@/data/solution'
import { IslandFrame } from './AgentDock'
import { useAskAgent } from '@/lib/agent-dock'
import { cn } from '@/lib/utils'
import { outcome, resolveParams, useUserName } from './actions'
import { field, human, label, useRows } from './records'
import { APP } from '@/data/app-spec'
import type { AssistantPage, FormPage, UploadPage } from './types'
import { PageHeader } from './ui'

const input = 'mt-1 w-full rounded-md border bg-background px-3 py-2 text-[13.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring'
const input_ = input

/** A form whose fields are the inputs of its submit workflow; the workflow's own answer is shown. */
export function FormView({ page }: { page: FormPage }) {
  const { run, isRunning } = useWorkflow(page.submit.workflow as WorkflowName)
  const user = useUserName()
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    try {
      const res = await run({ ...values, ...resolveParams(page.submit.params, undefined, '', user) } as never)
      setResult(outcome(res))
      setValues({})
      toast.success(page.submit.label ?? 'Submitted', { description: outcome(res) })
    } catch (err) {
      toast.error(`${page.submit.label ?? 'Submit'} did not complete`, { description: String((err as Error)?.message ?? err).slice(0, 240) })
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader title={page.name} purpose={page.purpose} />
      <form onSubmit={(e) => void submit(e)} className="max-w-2xl space-y-4 rounded-xl border bg-card p-5">
        {page.fields.map((f) => {
          const meta = field(page.object, f)
          const id = `f-${f}`
          return (
            <div key={f}>
              <label htmlFor={id} className="text-[13px] font-medium">
                {meta.title || human(f)}
              </label>
              {meta.type === 'select' && meta.options?.length ? (
                <select id={id} required value={values[f] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))} className={input}>
                  <option value="" disabled>
                    Choose…
                  </option>
                  {meta.options.map((o) => (
                    <option key={o} value={o}>
                      {label(o)}
                    </option>
                  ))}
                </select>
              ) : meta.type === 'text' ? (
                <textarea id={id} rows={4} value={values[f] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))} className={input} />
              ) : (
                <input
                  id={id}
                  type={meta.type === 'number' || meta.type === 'integer' ? 'number' : meta.type === 'date' ? 'date' : 'text'}
                  value={values[f] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
                  autoComplete="off"
                  className={input}
                />
              )}
            </div>
          )
        })}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={isRunning} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13.5px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isRunning ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            {page.submit.label ?? 'Submit'}
          </button>
          {result ? (
            <p className="text-[13px] text-muted-foreground" role="status">
              {result}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  )
}

/** A document goes to its workflow as file_source / file_name (stored with USER scope, which AI extraction reads). */
export function UploadView({ page }: { page: UploadPage }) {
  const { run, isRunning } = useWorkflow(page.workflow as WorkflowName)
  const user = useUserName()
  const ask = useAskAgent()
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const { files, isUploading, addFiles, clearFiles } = useUppy({
    referenceId: `kit-upload-${page.route}`,
    accessScope: 'USER',
    maxNumberOfFiles: 1,
    maxFileSize: 20 * 1024 * 1024,
    allowedFileTypes: page.accept ?? ['application/pdf', 'image/*'],
  } as never) as unknown as { files: Array<{ key?: string; url?: string; name: string; status?: string }>; isUploading: boolean; addFiles: (f: FileList) => Promise<void>; clearFiles: () => void }
  const file = files[0]
  // the workflow's other inputs (which shipment, which kind of document): asked here unless the page fills them
  const extra = (APP.workflowInputs?.[page.workflow] ?? []).filter((i) => !/^(file_source|file_name|source_key|file_key)$/.test(i.name) && !(page.params && i.name in page.params))
  const [values, setValues] = useState<Record<string, string>>({})
  const missing = extra.filter((i) => i.required && !String(values[i.name] ?? '').trim())
  const process = async () => {
    if (!file || file.status !== 'success' || missing.length) return
    try {
      const res = await run({ ...values, file_source: file.key || file.url || '', file_name: file.name, ...resolveParams(page.params, undefined, '', user) } as never)
      setResult(res)
      toast.success(`${file.name} processed`, { description: outcome(res) })
      clearFiles()
    } catch (err) {
      toast.error(`${file.name} was not processed`, { description: String((err as Error)?.message ?? err).slice(0, 240) })
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader title={page.name} purpose={page.purpose} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border bg-card p-5" aria-label="Upload a document">
          <label className={cn('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center hover:bg-accent/50', isUploading && 'opacity-60')}>
            <FileUp className="size-6 text-primary" aria-hidden="true" />
            <span className="text-[14px] font-medium">{file ? file.name : 'Choose a document'}</span>
            <span className="text-[12px] text-muted-foreground">{isUploading ? 'Uploading…' : file?.status === 'success' ? 'Uploaded. Process it when ready.' : 'PDF or image, up to 20 MB'}</span>
            <input type="file" className="sr-only" accept={(page.accept ?? ['application/pdf', 'image/*']).join(',')} onChange={(e) => e.target.files?.length && void addFiles(e.target.files)} />
          </label>
          {extra.map((i) => (
            <InputField key={i.name} input={i} value={values[i.name] ?? ''} onChange={(v) => setValues((s) => ({ ...s, [i.name]: v }))} />
          ))}
          <button type="button" onClick={() => void process()} disabled={!file || file.status !== 'success' || isRunning || isUploading || missing.length > 0} title={missing.length ? `Fill ${missing.map((m) => human(m.name).toLowerCase()).join(', ')} first` : undefined} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13.5px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isRunning ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            {isRunning ? 'Reading the document…' : 'Process document'}
          </button>
        </section>
        <section className="rounded-xl border bg-card p-5" aria-label="What was read" aria-live="polite">
          <h2 className="text-[13px] font-semibold">What was read</h2>
          {result ? (
            <>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                {Object.entries(result)
                  .filter(([, v]) => v != null && v !== '' && (typeof v !== 'object' || (Array.isArray(v) && v.every((x) => x == null || typeof x !== 'object'))))
                  .slice(0, 16)
                  .map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[11.5px] text-muted-foreground">{human(k)}</dt>
                      <dd className="break-words">{label(v)}</dd>
                    </div>
                  ))}
              </dl>
              <button type="button" onClick={() => ask(`I just processed a document with ${page.name}. The result was: ${outcome(result)}. What should happen next?`, page.name)} className="mt-4 text-[12.5px] font-medium text-primary hover:underline">
                Ask the agent about this result
              </button>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted-foreground">The fields the workflow reads from the document appear here, exactly as it returned them.</p>
          )}
        </section>
      </div>
    </div>
  )
}

/** "One of invoice, packing_list or air_waybill" in an input's description becomes a pick list */
function optionsOf(description?: string): string[] {
  const m = /one of\s+([^.;:]+)/i.exec(description ?? '')
  return m ? m[1].split(/\s*(?:,|\bor\b|\/)\s*/).map((x) => x.trim()).filter((x) => /^[a-z0-9_-]+$/i.test(x)) : []
}

/** one workflow input: a pick list of live records when it is an object's key, a pick list when its description lists the values */
function InputField({ input, value, onChange }: { input: { name: string; required?: boolean; description?: string }; value: string; onChange: (v: string) => void }) {
  const keyOf = Object.entries(APP.objects).find(([, o]) => o.key === input.name)?.[0]
  const { rows } = useRows(keyOf)
  const opts = keyOf ? rows.map((r) => String(r[input.name] ?? '')).filter(Boolean) : optionsOf(input.description)
  const id = `in-${input.name}`
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium">
        {human(input.name)}
        {input.required ? '' : ' (optional)'}
      </label>
      {opts.length ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={input_}>
          <option value="">Choose…</option>
          {opts.map((o) => (
            <option key={o} value={o}>
              {keyOf ? o : label(o)}
            </option>
          ))}
        </select>
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" placeholder={input.description} className={input_} />
      )}
    </div>
  )
}

/** The agent, full size, with the questions the plan suggests (sent only on click). */
export function AssistantView({ page, agentKey }: { page: AssistantPage; agentKey: AgentKey }) {
  const agent = AGENTS[agentKey]
  const [question, setQuestion] = useState<{ text: string; nonce: number } | undefined>()
  return (
    <div className="flex h-[calc(100dvh-120px)] min-h-[520px] flex-col gap-4">
      <PageHeader title={page.name} purpose={page.purpose ?? agent.welcome}>
        {page.suggestions?.length ? (
          <div className="flex flex-wrap gap-2">
            {page.suggestions.slice(0, 4).map((s) => (
              <button key={s} type="button" onClick={() => setQuestion({ text: s, nonce: Date.now() })} className="rounded-full bg-white/10 px-3 py-1 text-left text-[12.5px] text-white hover:bg-white/20">
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        <IslandFrame agent={agentKey} question={question} className="h-full" />
      </div>
    </div>
  )
}
