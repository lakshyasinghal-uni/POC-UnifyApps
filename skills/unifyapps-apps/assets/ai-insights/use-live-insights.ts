import { useEffect, useMemo } from 'react'
import { useExecuteWorkflowNode } from '@unifyapps/app-builder-sdk/hooks/workflow'

import { CALLABLE_RESOURCE_VERSION, DATA_SOURCES, AUTOMATIONS } from './datasources'
import { parseChartSpec, type ChartSpec } from '@/components/charts/spec'
import { useLanguage } from '@/lib/i18n'

/**
 * Live AI insights.
 *
 * Every screen hands the records it is currently showing to the `<uc>_ai_insights`
 * automation, whose LLM step returns ranked, evidence-cited findings. Each finding names ONE
 * action from the list the screen offered, so a recommendation is never a dead end: it opens
 * the record it is about, applies a scenario, records itself into the data layer, or hands
 * the question to the agent with the context already written.
 *
 * Two things make this trustworthy rather than decorative:
 *   - the model only ever sees rows that were just read from the platform, and it is told to
 *     quote them; an insight that cites a record you can click is checkable.
 *   - an action the screen did not offer is dropped rather than guessed at, so the model
 *     cannot invent a button that does nothing.
 */

export type Severity = 'critical' | 'warning' | 'opportunity' | 'info'

export interface InsightAction {
  id: string
  label: string
  params: Record<string, string | number>
  prompt?: string
}

export interface LiveInsight {
  title: string
  detail: string
  severity: Severity
  metric?: string
  evidence: string[]
  action?: InsightAction
  /**
   * An optional chart, when the insight IS a shape rather than a number. Parsed through the
   * same `parseChartSpec` the agent's chat blocks use, so a malformed one is dropped rather
   * than rendered half-drawn — and so a chart in an insight card looks identical to a chart
   * on a dashboard and a chart in the chat.
   */
  chart?: ChartSpec
}

export interface InsightReport {
  headline: string
  insights: LiveInsight[]
}

/** What a screen lets the model recommend. Anything else it returns is discarded. */
export type ActionSpec =
  | { id: string; kind: 'navigate'; to: string; label: string; params: string[] }
  | { id: string; kind: 'select'; label: string; params: string[] }
  | { id: string; kind: 'scenario'; label: string; params: string[] }
  | { id: string; kind: 'record'; label: string; params: string[] }
  | { id: 'ask_agent'; kind: 'agent'; label: string; params: string[] }

/** The hand-over-to-the-agent action, with a label naming this solution's agent. */
export function askAgentAction(label = 'Ask the agent'): ActionSpec {
  return { id: 'ask_agent', kind: 'agent', label, params: [] }
}

export const ASK_AGENT: ActionSpec = askAgentAction()

const MAX_ROWS_PER_SET = 30
// smaller input, faster read: 8k characters is ~2k tokens (measured 2026-09-25: 14k made every screen wait)
const MAX_PAYLOAD_CHARS = 8_000
/** A report is reused for 30 minutes unless the underlying rows change, or the user regenerates. */
const STALE_MS = 30 * 60_000
const CACHE_PREFIX = 'ua-insight:'
const CACHE_LIMIT = 40

const SEVERITIES: Severity[] = ['critical', 'warning', 'opportunity', 'info']
const PAGE_SLUG = `global-page-of-${import.meta.env.VITE_APPLICATION_ID}`

/** FNV-1a — a stable key for "this screen, this language, these exact rows". */
function hashText(text: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

interface Cached {
  data: unknown
  at: number
}

function readCache(key: string): Cached | undefined {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return undefined
    const cached = JSON.parse(raw) as Cached
    return Date.now() - cached.at < STALE_MS ? cached : undefined
  } catch {
    return undefined
  }
}

function writeCache(key: string, entry: Cached) {
  try {
    const keys = Object.keys(window.localStorage).filter((name) => name.startsWith(CACHE_PREFIX))
    if (keys.length >= CACHE_LIMIT) {
      keys
        .map((name) => ({ name, at: (JSON.parse(window.localStorage.getItem(name) ?? '{}') as Cached).at ?? 0 }))
        .sort((a, b) => a.at - b.at)
        .slice(0, keys.length - CACHE_LIMIT + 1)
        .forEach(({ name }) => window.localStorage.removeItem(name))
    }
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // storage blocked or full — the report still shows, it just is not remembered
  }
}

const LANGUAGE_INSTRUCTION: Record<string, string> = {
  ar: 'LANGUAGE: Write the headline and every title, detail, metric, evidence line, action label and agent prompt in Modern Standard Arabic. Keep record codes, object names and numbers exactly as they appear. Keep action "id" values unchanged.',
}

/** Trim to what the model needs: the payload is capped, largest set shrinks first. */
function compact(datasets: Record<string, Array<Record<string, unknown>>>) {
  const trimmed: Record<string, Array<Record<string, unknown>>> = {}
  for (const [name, rows] of Object.entries(datasets)) {
    trimmed[name] = rows.slice(0, MAX_ROWS_PER_SET).map((row) =>
      Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null && value !== undefined && value !== '')),
    )
  }
  let text = JSON.stringify(trimmed)
  while (text.length > MAX_PAYLOAD_CHARS) {
    const largest = Object.entries(trimmed).sort((a, b) => b[1].length - a[1].length)[0]
    if (!largest || largest[1].length <= 4) break
    trimmed[largest[0]] = largest[1].slice(0, Math.floor(largest[1].length * 0.7))
    text = JSON.stringify(trimmed)
  }
  return text
}

/**
 * A reply cut off by the model's output limit ends mid-string. Keep every insight that closed
 * before the cut, so a long answer degrades to a shorter one instead of to nothing.
 */
function salvageTruncated(text: string): { headline?: unknown; insights?: unknown } | null {
  const arrayStart = text.indexOf('[', text.indexOf('"insights"'))
  if (arrayStart < 0) return null
  const complete: string[] = []
  let depth = 0
  let inString = false
  let escaped = false
  let elementStart = -1
  for (let index = arrayStart + 1; index < text.length; index++) {
    const char = text[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') {
      if (depth === 0) elementStart = index
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && elementStart >= 0) complete.push(text.slice(elementStart, index + 1))
    } else if (char === ']' && depth === 0) break
  }
  if (complete.length === 0) return null
  const headline = /"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(text)?.[1]
  try {
    return JSON.parse(
      `{"headline":${JSON.stringify(headline ? JSON.parse(`"${headline}"`) : '')},"insights":[${complete.join(',')}]}`,
    )
  } catch {
    return null
  }
}

function parseReport(raw: unknown, allowed: Set<string>): InsightReport | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  let parsed: { headline?: unknown; insights?: unknown }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const salvaged = salvageTruncated(cleaned)
    if (!salvaged) return null
    parsed = salvaged
  }
  const list = Array.isArray(parsed.insights) ? parsed.insights : []
  const insights: LiveInsight[] = list
    .map((item: Record<string, unknown>) => {
      const action = item.action as Record<string, unknown> | undefined
      const actionId = typeof action?.id === 'string' ? action.id : ''
      // the chart goes through the shared parser, which normalises types, coerces numbers and
      // returns null for anything unusable — so a bad chart costs the card nothing
      const chart = item.chart ? (parseChartSpec(JSON.stringify(item.chart)) ?? undefined) : undefined
      return {
        chart,
        title: String(item.title ?? '').trim(),
        detail: String(item.detail ?? '').trim(),
        severity: (SEVERITIES.includes(item.severity as Severity) ? item.severity : 'info') as Severity,
        metric: item.metric ? String(item.metric) : undefined,
        evidence: Array.isArray(item.evidence) ? item.evidence.map(String).slice(0, 3) : [],
        // an action the screen did not offer is dropped, never guessed at
        action: allowed.has(actionId)
          ? {
              id: actionId,
              label: String(action?.label ?? '').trim() || 'Take action',
              params: (action?.params && typeof action.params === 'object' ? action.params : {}) as Record<string, string | number>,
              prompt: typeof action?.prompt === 'string' ? action.prompt : undefined,
            }
          : undefined,
      }
    })
    .filter((insight) => insight.title && insight.detail)
  if (insights.length === 0) return null
  return { headline: String(parsed.headline ?? '').trim(), insights }
}

export function useLiveInsights({
  screen,
  context,
  datasets,
  actions,
  enabled = true,
}: {
  screen: string
  context: string
  datasets: Record<string, Array<Record<string, unknown>>>
  actions: ActionSpec[]
  enabled?: boolean
}) {
  const lang = useLanguage()
  const allowed = useMemo(() => new Set(actions.map((action) => action.id)), [actions])
  const payload = useMemo(
    () => ({
      p_screen: screen,
      p_context: LANGUAGE_INSTRUCTION[lang] ? `${context} ${LANGUAGE_INSTRUCTION[lang]}` : context,
      p_actions: JSON.stringify(actions.map(({ id, label, params }) => ({ id, label, params }))),
      p_data: compact(datasets),
    }),
    [screen, context, actions, datasets, lang],
  )
  const rowCount = useMemo(() => Object.values(datasets).reduce((sum, rows) => sum + rows.length, 0), [datasets])
  const cacheKey = useMemo(
    () => hashText(`${lang}|${payload.p_screen}|${payload.p_context}|${payload.p_actions}|${payload.p_data}`),
    [lang, payload],
  )
  // A cached report is replayed only if it still parses — a bad one must not stick for 30 minutes.
  const cached = useMemo(() => {
    const entry = readCache(cacheKey)
    const insights = (entry?.data as { response?: { insights?: unknown } } | undefined)?.response?.insights
    return entry && parseReport(insights, allowed) ? entry : undefined
  }, [cacheKey, allowed])

  const query = useExecuteWorkflowNode(
    {
      id: DATA_SOURCES.aiInsights,
      context: { appName: 'callables', resourceName: 'callables_call_automation', resourceVersion: CALLABLE_RESOURCE_VERSION },
      inputs: {
        automationId: AUTOMATIONS.aiInsights,
        version: '-1',
        runtimeConnections: {},
        synchronous: true,
        parameters: { __internals__: { m: 'BUILDER', s: PAGE_SLUG, c: 'PLATFORM', p: 'browser' }, ...payload },
      },
    },
    {
      query: {
        enabled: enabled && rowCount > 0,
        staleTime: STALE_MS,
        gcTime: STALE_MS,
        retry: 1,
        initialData: cached?.data,
        initialDataUpdatedAt: cached?.at,
      },
    } as never,
  )

  const response = (query.data as { response?: { insights?: unknown; tokensUsed?: unknown } } | undefined)?.response
  const report = useMemo(() => parseReport(response?.insights, allowed), [response, allowed])

  useEffect(() => {
    if (report && query.data && query.dataUpdatedAt && query.dataUpdatedAt !== cached?.at) {
      writeCache(cacheKey, { data: query.data, at: query.dataUpdatedAt })
    }
  }, [report, query.data, query.dataUpdatedAt, cacheKey, cached?.at])

  return {
    report,
    tokensUsed: Number(response?.tokensUsed ?? 0) || undefined,
    rowCount,
    datasetNames: Object.keys(datasets),
    isLoading: enabled && rowCount > 0 && (query.isLoading || (query.isFetching && !query.data)),
    isRefreshing: query.isFetching && Boolean(query.data),
    unreadable: Boolean(query.data) && !report,
    error: query.error ?? null,
    regenerate: () => query.refetch(),
    generatedAt: query.dataUpdatedAt || undefined,
  }
}
