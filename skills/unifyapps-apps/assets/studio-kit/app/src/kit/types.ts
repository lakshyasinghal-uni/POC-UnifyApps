// UnifyApps Studio app kit: the shape of `@/data/app-spec`, which the Studio writes from the approved
// plan. Pages are rendered from this spec by the kit; every number comes from a real object or workflow.

export type Scalar = string | number | boolean
/** field → value (equals), [values] (one of), or an operator object; the same rules the config apps use */
export type Where = Record<string, Scalar | Scalar[] | { gt?: number; gte?: number; lt?: number; lte?: number; ne?: Scalar; within_days?: number; before_now?: boolean }>

export type FieldMeta = {
  name: string
  title: string
  type: 'string' | 'text' | 'number' | 'integer' | 'boolean' | 'date' | 'select'
  options?: string[]
  primaryKey?: boolean
}

export type ObjectMeta = {
  title: string
  /** the business key (a primary-key field), shown as the record's code */
  key?: string
  fields: FieldMeta[]
}

export type Kpi = { label: string; object: string; where?: Where; agg?: 'count' | 'sum' | 'avg' | 'pct'; field?: string; unit?: string }
export type ChartDef = { title: string; object: string; group_by: string; field?: string; where?: Where; type?: string; value_label?: string }
export type ParamValue = string | number | boolean
export type ActionDef = {
  label: string
  workflow: string
  /** `row.<field>` (the selected record), `notes` (the notes box), `user` (the signed-in user's name) or a literal */
  params?: Record<string, ParamValue>
  confirm?: boolean
  /** 'danger' draws a destructive button; any other style is a normal one */
  style?: string
  /** a plan may carry more (a success message, a hint): kept, not read */
  [extra: string]: unknown
}

type PageBase = { name: string; route: string; purpose?: string; content?: string[]; states?: string[] }
export type DashboardPage = PageBase & { type: 'dashboard'; kpis?: Kpi[]; charts?: ChartDef[]; attention?: { title: string; object: string; where?: Where; fields?: string[] } }
export type QueuePage = PageBase & { type: 'queue'; object: string; columns?: string[]; title_field?: string; detail_fields?: string[]; actions?: ActionDef[] }
export type ListPage = PageBase & { type: 'list'; object: string; columns?: string[]; actions?: ActionDef[] }
export type FormPage = PageBase & { type: 'form'; object?: string; fields: string[]; submit: { workflow: string; label?: string; params?: Record<string, ParamValue> } }
export type UploadPage = PageBase & { type: 'upload'; workflow: string; params?: Record<string, ParamValue>; accept?: string[] }
export type AssistantPage = PageBase & { type: 'assistant'; agent: string; suggestions?: string[] }
export type PageSpec = DashboardPage | QueuePage | ListPage | FormPage | UploadPage | AssistantPage

export type AppSpec = {
  title: string
  summary?: string
  /** the north star of the design, used as the command centre's eyebrow */
  northStar?: string
  signature?: string
  principles?: string[]
  currency?: string
  pages: PageSpec[]
  objects: Record<string, ObjectMeta>
  /** an event or log object, if the solution has one: the live ticker reads it */
  eventObject?: string
  /** the agent the dock talks to by default (a key of AGENTS) */
  dockAgent?: string
  /** starter questions offered by the dock; they send only on click */
  starters?: string[]
  /** the solution's live-insights workflow (screen + records in, ranked findings out) */
  insightsWorkflow?: string
  /** every workflow's inputs (name, required, description): upload and form screens ask for the ones a page does not fill */
  workflowInputs?: Record<string, Array<{ name: string; required?: boolean; description?: string }>>
}
