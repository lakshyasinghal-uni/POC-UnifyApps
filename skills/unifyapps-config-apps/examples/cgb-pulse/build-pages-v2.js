// CGB Pulse v2 — Performance Studio and Documents pages. Paste scripts/ua_cfg.js first, then:
//   await buildCgbPulseV2({ APP, PG, DS, AGENT, WF, CC })
// PG needs studio + documents (+ entity for navigation); DS the global ids (entities, regions, trend);
// WF.ingest = cgbp_ingest_document; CC = { gauge:{id,type}, heatmap:{id,type} }.
//
// Studio exercises the prebuilt components: ButtonGroup, every Chart type (COLUMN, STACKED_COLUMN, PIE,
// DUAL_AXES, RADAR, WATERFALL, BUBBLE, native HEATMAP, LINE), Tabs, Kanban, Timeline, AvatarGroup,
// Stepper, Toggle, Checkbox, Rating, ProgressBar, Calendar, KeyValue, collapsible Card, Link, plus the
// PulseGauge and PulseHeatmap custom components. Documents: FileUpload -> automation (OCR + LLM) ->
// record -> analysis UI with PDF viewer, recommendations that become actions, and an agent dock that
// accepts file attachments.
async function buildCgbPulseV2({ APP, PG, DS, AGENT, WF, CC }) {
  const { C, A } = cfg;
  const x = s => `{{ ${s} }}`;
  const ENT = `${DS.entities}['data']`, TREND = `${DS.trend}['data']`;
  const flat = `const rows = (data?.objects || []).map(o => ({ id: o.id, ...o.properties }));`;
  const NAMES = { HEALTH: 'Health', EDUCATION: 'Education', MUNICIPAL: 'Municipal', TRANSPORT: 'Transport', LABOUR: 'Labour', JUSTICE: 'Justice',
    INTERIOR: 'Residency', COMMERCE: 'Commerce', HOUSING: 'Housing', SOCIAL: 'Social', CUSTOMS: 'Customs', DIGITAL: 'Portal' };
  const BAND_CSS = `& { background: linear-gradient(115deg, #3a0c1b 0%, #1a0a0f 70%); border-radius: 18px; }`;
  const CARD_CSS = `& { border: 1px solid var(--border-secondary); box-shadow: 0 1px 2px rgba(16,24,40,.05); }`;
  const SERIF = `& { font-family: Spectral, Georgia, serif; letter-spacing: -.01em; }`;
  const EYEBROW = `& { letter-spacing: .14em; text-transform: uppercase; }`;
  const band = (title, sub, extra = []) => cfg.stack({ theme: 'dark', p: 'p-2xl', gap: 'gap-sm', css: BAND_CSS }, [
    cfg.text('CGB PULSE', { variant: 'text-xs', weight: 'semi-bold', color: 'text-tertiary', css: EYEBROW }),
    cfg.text(title, { variant: 'display-sm', weight: 'semi-bold', css: SERIF }), cfg.text(sub, { variant: 'text-md', color: 'text-secondary' }), ...extra]);
  const card = (children, o = {}) => cfg.card(cfg.stack({ gap: o.gap || 'gap-md' }, children), { css: CARD_CSS, ...o });
  const h3 = t => cfg.text(t, { variant: 'text-lg', weight: 'semi-bold' });
  const note = t => cfg.text(t, { variant: 'text-xs', color: 'text-tertiary' });
  const lineage = t => cfg.tag(t, { size: 'sm', color: 'neutral', variant: 'outline' });
  const head = (t, l) => cfg.row({ justify: 'space-between' }, [h3(t), lineage(l)]);
  const askDock = message => A.then(A.drawer('b_askDrawer', 'show'), A.delay(A.method('b_dock', 'submitMessage', { message }), 1500));
  const dock = context => cfg.drawer('b_askDrawer', cfg.stack({ gap: 'gap-md', p: 'p-lg', styles: { height: 'h-full' } }, [
    cfg.row({ justify: 'space-between' }, [cfg.text('CGB Pulse Analyst', { variant: 'text-lg', weight: 'semi-bold' }),
      cfg.iconButton('XClose', { events: { onClick: A.drawer('b_askDrawer', 'hide') } })]),
    cfg.copilot(AGENT, { id: 'b_dock', height: '78vh', welcome: 'Ask me about anything on this screen — or attach a file.', context, attachments: true })]), { width: '520px' });
  const save = (key, spec) => cfg.savePage(cfg.page({ id: PG[key], appId: APP, ...spec }));
  const out = {};

  // ================================================================ PERFORMANCE STUDIO
  {
    const V = cfg.vars({ entity: ['string', 'LABOUR'], cellRow: ['string', 'LABOUR'], cellCol: ['string', ''] });
    const KPIS = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.studio, name: 'ds_studio_kpis', object: 'cgbp_kpi', limit: 300,
      filter: C.and(C.eq('properties_scope_type', 'ENTITY'), C.eq('properties_metric', 'satisfaction')), sort: [{ field: 'properties.period', order: 'ASC' }],
      transform: flat + `
const N = ${JSON.stringify(NAMES)};
const periods = [...new Set(rows.map(r => r.period))].sort(); const ents = [...new Set(rows.map(r => r.scope_code))].sort();
const cells = {}; rows.forEach(r => { (cells[r.scope_code] = cells[r.scope_code] || {})[r.period] = r.value; });
const last6 = periods.slice(-6);
return { heat: { title: 'Satisfaction by entity and month (click a cell)', rows: ents.map(e => ({ key: e, label: N[e] || e })), cols: periods, cells, target: 80, unit: '%' },
  native: last6.map(p => ({ month: p.slice(2), data: ents.map(e => ({ entity: N[e] || e, value: cells[e][p] })) })),
  series: Object.fromEntries(ents.map(e => [e, periods.map(p => ({ period: p, value: cells[e][p], target: 80 }))])), periods };` });
    const VOICES = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.studio, name: 'ds_studio_voices', object: 'cgbp_voice', limit: 500,
      transform: flat + `
const N = ${JSON.stringify(NAMES)}; const kinds = ['COMPLAINT', 'SUGGESTION', 'PRAISE', 'QUESTION'];
const ents = [...new Set(rows.map(r => r.entity_code))].sort();
const byEntity = ents.map(e => { const v = rows.filter(r => r.entity_code === e); const o = { code: e, entity: N[e] || e, n: v.length };
  kinds.forEach(k => { o[k] = v.filter(r => r.kind === k).length; });
  o.rating = Math.round(v.reduce((s, r) => s + (Number(r.rating) || 0), 0) / Math.max(1, v.length) * 10) / 10;
  o.complaintShare = Math.round(o.COMPLAINT / Math.max(1, v.length) * 100); return o; });
return { byKind: kinds.map(k => ({ kind: k, count: rows.filter(r => r.kind === k).length })), byEntity,
  avgRating: Math.round(rows.reduce((s, r) => s + (Number(r.rating) || 0), 0) / Math.max(1, rows.length) * 10) / 10, total: rows.length };` });
    const ACTS = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.studio, name: 'ds_studio_actions', object: 'cgbp_action', limit: 200,
      transform: flat + `
const order = ['OPEN', 'IN_PROGRESS', 'DONE']; const label = { OPEN: 'Open', IN_PROGRESS: 'In progress', DONE: 'Done' };
const now = Date.now();
const all = rows.map(r => ({ ...r, due: new Date(now + (Number(r.due_days) || 0) * 86400000).toISOString() }));
return { rows: all, kanban: order.map(s => ({ category: label[s], status: s, items: all.filter(r => r.status === s) })),
  timeline: all.filter(r => r.status !== 'DONE').sort((a, b) => (a.due_days || 0) - (b.due_days || 0)),
  owners: [...new Set(all.map(r => r.owner))].map(name => ({ name })),
  counts: Object.fromEntries(order.map(s => [s, all.filter(r => r.status === s).length])) };` });
    const metric = `(b_metric['selectedOptionId'] || 'satisfaction')`;
    const rowsE = `(${ENT}?.['rows'] || [])`;
    const selE = `${rowsE}.find(e => e.entity_code === var_entity['value'])`;
    const avgOf = k => `Math.round(${rowsE}.reduce((s, e) => s + (Number(e.${k}) || 0), 0) / Math.max(1, ${rowsE}.length) * 10) / 10`;
    const seriesSel = `${KPIS}['data']?.['series']?.[var_entity['value']] || []`;
    const prevNat = `(${TREND}?.['series'] || []).slice(-2)[0]?.['satisfaction']`;
    const gauge = (id, label, value, target, previous, caption) => cfg.custom(CC.gauge.type, CC.gauge.id,
      x(`{ label: '${label}', value: ${value}, target: ${target}, previous: ${previous}, unit: '%', caption: '${caption}' }`),
      { id, height: '252px', events: { onChange: [A.notify(x(`label + ': ' + value + '% (' + (gap >= 0 ? '+' : '') + gap + ' vs target)'`), 'info'),
        askDock(x(`'Explain the ' + label + ' reading of ' + value + '% against a target of ' + target + '%: what drives it and what would move it?'`))] } });
    const I = `b_kb['context']['item']`;
    out.studio = await save('studio', {
      name: 'Performance Studio', slug: 'studio', vars: V.defs, rootStyles: { gap: { all: 'gap-xl' } },
      body: [
        band('Performance Studio', 'Every prebuilt chart and widget, on the live cgbp_* objects. Click a gauge to ask the analyst about it.', [
          cfg.row({ gap: 'gap-md' }, [cfg.text('Compare entities by', { color: 'text-tertiary' }),
            cfg.buttonGroup('b_metric', [{ id: 'satisfaction', label: 'Satisfaction' }, { id: 'health_score', label: 'Health score' }, { id: 'digital_adoption', label: 'Digital adoption' }, { id: 'resolution', label: 'Resolution' }], { color: 'neutral' })])]),
        // --- custom component: four gauges
        cfg.row({ gap: 'gap-md', align: 'stretch' }, [
          gauge('b_g1', 'National satisfaction', `${ENT}?.['avgSatisfaction']`, 80, prevNat, 'cgbp_entity · 12 entities'),
          gauge('b_g2', 'Average health score', avgOf('health_score'), 80, 'null', 'composite of service health'),
          gauge('b_g3', 'Digital adoption', avgOf('digital_adoption'), 70, 'null', 'share of services online'),
          gauge('b_g4', 'Selected entity', `${selE}?.satisfaction ?? null`, 80, `(${seriesSel}).slice(-2)[0]?.value ?? null`, 'pick an entity below') ]),
        cfg.tabs([
          { id: 'tab_perf', label: 'Performance', body: cfg.stack({ gap: 'gap-lg' }, [
            cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
              card([head(x(`'Entities by ' + (b_metric['selectedOption']?.['label'] || 'Satisfaction')`), 'COLUMN · cgbp_entity'),
                cfg.chartX(x(`${rowsE}.map(e => ({ name: (${JSON.stringify(NAMES)})[e.entity_code] || e.name_en, value: e[${metric}] })).sort((a, b) => a.value - b.value)`),
                  { type: 'COLUMN', x: 'name', height: '280px', series: [{ key: 'value', label: 'Value' }], legend: 'remove' })], { styles: { width: { custom: '60%' } } }),
              card([head('Entity profile vs national', 'RADAR'),
                cfg.select(Object.keys(NAMES).map(k => ({ value: k, label: NAMES[k] })), { id: 'b_entPick', default: 'LABOUR', events: { onChange: A.setVar(V.entity, x(`b_entPick['value']`)) } }),
                cfg.chartX(x(`[['Satisfaction', 'satisfaction'], ['Health', 'health_score'], ['Completion', 'completion'], ['Resolution', 'resolution'], ['Digital', 'digital_adoption'], ['Accessibility', 'accessibility']].map(([a, k]) => ({ attribute: a, entity: ${selE}?.[k] ?? 0, national: Math.round(${rowsE}.reduce((s, e) => s + (Number(e[k]) || 0), 0) / Math.max(1, ${rowsE}.length)) }))`),
                  { type: 'RADAR', x: 'attribute', height: '260px', yDomain: { min: 0, max: 100 }, series: [{ key: 'entity', label: 'Selected entity' }, { key: 'national', label: 'National average' }] })],
                { styles: { width: { custom: '40%' } } })]),
            cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
              card([head('Where the gap to target comes from', 'WATERFALL'),
                cfg.chartX(x(`${rowsE}.slice().sort((a, b) => a.satisfaction - b.satisfaction).map(e => ({ step: (${JSON.stringify(NAMES)})[e.entity_code] || e.name_en, value: Math.round((e.satisfaction - 80) * 10) / 10 }))`),
                  { type: 'WATERFALL', x: 'step', height: '280px', value: { key: 'value', label: 'Points vs 80% target' } }),
                note(x(`'Each bar is one entity's satisfaction minus the 80% target; every bar is a step, so the running total ends at the combined gap of ' + Math.round(${rowsE}.reduce((s, e) => s + e.satisfaction - 80, 0) * 10) / 10 + ' points (12 × the national shortfall).'`))], { styles: { width: { custom: '55%' } } }),
              card([head('Digital adoption vs satisfaction', 'BUBBLE · size = monthly volume'),
                cfg.chartX(x(`${rowsE}.map(e => ({ name: e.name_en, digital: e.digital_adoption, sat: e.satisfaction, volume: e.monthly_volume }))`),
                  { type: 'BUBBLE', x: 'digital', xLabel: 'Digital adoption %', yLabel: 'Satisfaction %', height: '280px', y: { key: 'sat', label: 'Entities' }, size: { key: 'volume', label: 'Monthly volume' }, xDomain: { min: 30, max: 100 }, yDomain: { min: 55, max: 95 } })],
                { styles: { width: { custom: '45%' } } })]),
            card([head('National satisfaction and service index', 'DUAL_AXES · cgbp_kpi'),
              cfg.chartX(x(`${TREND}?.['series'] || []`), { type: 'DUAL_AXES', x: 'period', height: '260px', series: [{ key: 'satisfaction', label: 'Satisfaction %' }], rightSeries: [{ key: 'sharek_index', label: 'Service index', color: 'var(--palette-brand-secondary-500)' }] })]) ]) },
          { id: 'tab_trends', label: 'Trends', body: cfg.stack({ gap: 'gap-lg' }, [
            cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
              cfg.stack({ styles: { width: { custom: '62%' } } }, [
                cfg.custom(CC.heatmap.type, CC.heatmap.id, x(`{ ...(${KPIS}['data']?.['heat'] || {}), selected: { row: var_cellRow['value'], col: var_cellCol['value'] } }`),
                  { id: 'b_heat', height: '470px', events: { onChange: [A.setVar(V.cellRow, x('row')), A.setVar(V.cellCol, x('col'))] } })]),
              card([head(x(`(${JSON.stringify(NAMES)})[var_cellRow['value']] + ' — 12 months'`), 'LINE'),
                cfg.kv([{ label: 'Month', value: x(`var_cellCol['value'] || 'whole row'`) },
                  { label: 'Satisfaction', value: x(`var_cellCol['value'] ? ((${KPIS}['data']?.['heat']?.['cells']?.[var_cellRow['value']]?.[var_cellCol['value']] ?? '–') + '%') : '–'`) },
                  { label: 'Gap to target', value: x(`var_cellCol['value'] ? (Math.round(((${KPIS}['data']?.['heat']?.['cells']?.[var_cellRow['value']]?.[var_cellCol['value']] ?? 80) - 80) * 10) / 10 + ' pts') : '–'`) }]),
                cfg.chartX(x(`${KPIS}['data']?.['series']?.[var_cellRow['value']] || []`), { type: 'AREA', x: 'period', height: '220px', yDomain: { min: 50, max: 100 },
                  series: [{ key: 'value', label: 'Satisfaction %' }, { key: 'target', label: 'Target', color: 'var(--palette-error-400)' }] }),
                cfg.button('Open this entity', { variant: 'soft', size: 'sm', events: { onClick: A.goto(PG.entity, { entity_code: x(`var_cellRow['value']`) }) } })],
                { styles: { width: { custom: '38%' } } })]),
            card([head('The same data in the native HEATMAP chart (last 6 months)', 'HEATMAP · prebuilt'),
              cfg.chartX(x(`${KPIS}['data']?.['native'] || []`), { type: 'HEATMAP', row: 'entity', cells: 'data', col: 'month', value: 'value', height: '420px' })]) ]) },
          { id: 'tab_citizens', label: 'Citizens', body: cfg.stack({ gap: 'gap-lg' }, [
            cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
              card([head('Comments by kind', 'PIE · cgbp_voice'),
                cfg.chartX(x(`${VOICES}['data']?.['byKind'] || []`), { type: 'DONUT', x: 'kind', value: { key: 'count', label: 'Comments' }, height: '260px',
                  colors: { COMPLAINT: 'var(--palette-error-500)', SUGGESTION: 'var(--palette-warning-500)', PRAISE: 'var(--palette-success-500)', QUESTION: 'var(--palette-blue-500)' } })],
                { styles: { width: { custom: '35%' } } }),
              card([head('Comments per entity, by kind', 'STACKED_COLUMN'),
                cfg.chartX(x(`${VOICES}['data']?.['byEntity'] || []`), { type: 'STACKED_COLUMN', x: 'entity', height: '260px',
                  series: [{ key: 'COMPLAINT', label: 'Complaint', color: 'var(--palette-error-500)' }, { key: 'SUGGESTION', label: 'Suggestion', color: 'var(--palette-warning-500)' },
                    { key: 'PRAISE', label: 'Praise', color: 'var(--palette-success-500)' }, { key: 'QUESTION', label: 'Question', color: 'var(--palette-blue-500)' }] })],
                { styles: { width: { custom: '65%' } } })]),
            cfg.row({ gap: 'gap-md' }, [cfg.checkbox('b_lowOnly', 'Only entities rated below 3 stars'),
              cfg.text(x(`'Average rating across ' + (${VOICES}['data']?.['total'] ?? 0) + ' comments: ' + (${VOICES}['data']?.['avgRating'] ?? '–') + ' / 5'`), { color: 'text-secondary' })]),
            cfg.repeat('b_rateRep', x(`(${VOICES}['data']?.['byEntity'] || []).filter(e => !b_lowOnly['value'] || e.rating < 3).sort((a, b) => a.rating - b.rating)`),
              card([cfg.row({ justify: 'space-between' }, [cfg.text(x(`b_rateRep['context']['item']['entity']`), { weight: 'semi-bold' }), cfg.tag(x(`b_rateRep['context']['item']['n'] + ' comments'`))]),
                cfg.rating(x(`b_rateRep['context']['item']['rating']`)),
                cfg.text(x(`'Complaints: ' + b_rateRep['context']['item']['complaintShare'] + '%'`), { variant: 'text-xs', color: 'text-tertiary' }),
                cfg.progress(x(`b_rateRep['context']['item']['complaintShare']`), { color: 'var(--palette-error-500)' })], { p: 'p-md' }), { grid: 4, gap: 'gap-md' }) ]) },
          { id: 'tab_ops', label: 'Operations', body: cfg.stack({ gap: 'gap-lg' }, [
            cfg.row({ gap: 'gap-lg' }, [
              cfg.stepper([{ label: 'Raised', description: 'from an insight or a document' }, { label: 'In progress', description: 'owner assigned' }, { label: 'Done', description: 'impact tracked' }], { current: 'step_2' }),
              cfg.stack({ gap: 'gap-xs', styles: { width: 'w-auto' } }, [note('Owners'), cfg.avatarGroup(x(`${ACTS}['data']?.['owners'] || []`), 'name', { max: 6 })]),
              cfg.toggle('b_showDone', 'Show done') ]),
            card([head(x(`'Follow-up actions — ' + (${ACTS}['data']?.['counts']?.['OPEN'] ?? 0) + ' open, ' + (${ACTS}['data']?.['counts']?.['IN_PROGRESS'] ?? 0) + ' in progress'`), 'KANBAN · cgbp_action'),
              cfg.kanban('b_kb', x(`(${ACTS}['data']?.['kanban'] || []).filter(c => b_showDone['value'] || c.status !== 'DONE')`),
                cfg.stack({ gap: 'gap-xs', p: 'p-md', css: `& { background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: 12px; }` }, [
                  cfg.text(x(`${I}['title']`), { weight: 'semi-bold' }),
                  cfg.row({ gap: 'gap-xs' }, [cfg.tag(x(`${I}['entity_code']`)), cfg.tag(x(`${I}['priority']`), { color: { defaultValue: 'neutral', conditionalValueFilters: [
                    { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(x(`${I}['priority']`), 'HIGH')) } },
                    { propertyValue: 'warning', conditions: { type: 'filter', payload: C.and(C.eq(x(`${I}['priority']`), 'MEDIUM')) } }] } })]),
                  cfg.text(x(`${I}['owner'] + (${I}['status'] === 'DONE' ? ' · done' : ' · due in ' + ${I}['due_days'] + ' days')`), { variant: 'text-xs', color: 'text-tertiary' })]),
                { height: '420px' })]),
            cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
              card([head('What is due next', 'TIMELINE'),
                cfg.timeline('b_tl', x(`${ACTS}['data']?.['timeline'] || []`), cfg.stack({ gap: 'gap-xs' }, [
                    cfg.text(x(`b_tl['context']['item']['title']`), { weight: 'semi-bold' }),
                    cfg.text(x(`b_tl['context']['item']['owner'] + ' · ' + b_tl['context']['item']['entity_code'] + ' · due in ' + b_tl['context']['item']['due_days'] + ' days'`), { variant: 'text-xs', color: 'text-tertiary' })]),
                  { time: x(`b_tl['context']['item']['due']`) })],
                { styles: { width: { custom: '60%' } } }),
              card([head('Calendar', 'CALENDAR'), cfg.calendar('b_cal', { readOnly: false }), note(x(`b_cal['selectedDate'] ? 'Selected: ' + b_cal['selectedDate'] : 'Pick a date'`))], { styles: { width: { custom: '40%' } } })]) ]) },
        ], { id: 'b_studioTabs' }),
        cfg.accordion(null, cfg.stack({ gap: 'gap-xs' }, [
          cfg.text('How this page is built', { weight: 'semi-bold' }),
          note('Prebuilt: ButtonGroup, Tabs, Chart (COLUMN, RADAR, WATERFALL, BUBBLE, DUAL_AXES, AREA, HEATMAP, PIE, STACKED_COLUMN), SingleSelect, KeyValue, Checkbox, Rating, ProgressBar, Repeatable, Stepper, AvatarGroup, Toggle, Kanban, Timeline, Calendar, Card (collapsible), Drawer, Copilot. Custom: PulseGauge ×4, PulseHeatmap.'),
          cfg.link('The skill that built it: unifyapps-config-apps', 'https://orbit.uat.unifyapps.com/p/0/interfaces/cgb-pulse/builder/studio') ]), { open: false }),
      ],
      overlays: [dock(x(`'The user is on the CGB Pulse Performance Studio, comparing entities by ' + ${metric} + '. Selected entity: ' + var_entity['value'] + '.'`))],
    });
    Object.assign(out, { studio_kpis: KPIS, studio_voices: VOICES, studio_actions: ACTS });
  }

  // ================================================================ DOCUMENTS
  {
    const V = cfg.vars({ doc: ['string', ''] });
    const DOCS = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.documents, name: 'ds_documents', object: 'cgbp_document', limit: 100,
      sort: [{ field: 'properties.uploaded_at', order: 'DESC' }],
      transform: flat + `
const j = (s, d) => { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };
return { rows: rows.map(r => ({ ...r, key_points: j(r.key_points_json, []), metrics: j(r.metrics_json, []), risks: j(r.risks_json, []),
  recommendations: j(r.recommendations_json, []), mentioned: j(r.entities_json, { entities: [], regions: [] }) })), count: rows.length,
  analysed: rows.filter(r => r.status === 'ANALYSED').length };` });
    const U = `b_upload['files']?.[0]`;
    const INGEST = await cfg.ensureDs(cfg.dsAutomation, { appId: APP, pageId: PG.documents, name: 'ds_ingest_document', automationId: WF.ingest, run: 'manual',
      params: { title: x(`b_docForm['data']?.['title'] || ${U}?.['name'] || ''`), entity_code: x(`b_docForm['data']?.['entity_code'] || ''`),
        file_source: x(`${U}?.['source'] || ''`), file_name: x(`${U}?.['name'] || ''`), mime_type: x(`${U}?.['mimeType'] || 'application/pdf'`),
        file_url: x(`${U}?.['url'] || ''`), uploaded_by: x(`userContext['name']`) },
      onSuccess: [A.notify('Document analysed', 'success'), A.runDs(DOCS), A.setVar(V.doc, x(`e_INGEST['data']?.['doc_code']`))],
      onError: [A.notify('The document could not be analysed', 'error'), A.runDs(DOCS)] });
    // the success callback reads the ingest data source's own result — patch its id in now that we know it
    const ing = await cfg.api('GET', `/api/entity/e_data_source/${INGEST}`);
    const fixed = JSON.parse(JSON.stringify(ing).replaceAll('e_INGEST', INGEST));
    await cfg.api('POST', '/api/entity/update', fixed);
    const CREATE = await cfg.ensureDs(cfg.dsCreateRecord, { appId: APP, pageId: PG.documents, name: 'ds_doc_action', object: 'cgbp_action',
      record: { action_code: x(`'ACT-' + Date.now()`), title: x(`var_recTitle['value']`), entity_code: x(`var_recEntity['value']`), owner: x(`var_recOwner['value'] || userContext['name']`),
        priority: 'HIGH', status: 'OPEN', source: 'document', notes: x(`'From document ' + var_doc['value']`), due_days: 30, created_by: x(`userContext['name']`) },
      onSuccess: [A.notify('Action raised from the document', 'success')] });
    const V2 = cfg.vars({ recTitle: ['string', ''], recOwner: ['string', ''], recEntity: ['string', ''] });
    const D = `(${DOCS}['data']?.['rows'] || []).find(d => d.doc_code === var_doc['value'])`;
    const R = `b_recRep['context']['item']`;
    out.documents = await save('documents', {
      name: 'Documents', slug: 'documents', vars: { ...V.defs, ...V2.defs }, rootStyles: { gap: { all: 'gap-xl' } },
      body: [
        band('Documents', 'Upload a report, memo or letter. An automation reads it (OCR + LLM), stores the analysis in cgbp_document, and the analyst can use it.'),
        cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
          card([head('Upload and analyse', 'FileUpload → cgbp_ingest_document'),
            cfg.fileUpload('b_upload', { label: 'Click or drag a PDF or an image (max 20 MB)', types: ['.pdf', 'image/*'] }),
            cfg.form('b_docForm', [{ key: 'title', title: 'Title (optional)', placeholder: 'Defaults to the file name' },
              { key: 'entity_code', title: 'Entity it is about', type: 'select', options: Object.keys(NAMES).map(k => ({ const: k, title: NAMES[k] })) }]),
            cfg.text(x(`b_upload['isUploading'] ? 'Uploading…' : (${U}?.['name'] ? 'Ready: ' + ${U}['name'] + ' (' + Math.round((${U}['size'] || 0) / 1024) + ' KB)' : 'No file yet')`), { color: 'text-secondary' }),
            cfg.button('Analyse document', { icon: 'Stars02', loading: x(`${INGEST}['isLoading']`), disabled: x(`!${U}?.['source'] || b_upload['isUploading']`), events: { onClick: A.runDs(INGEST) } }),
            cfg.row({ gap: 'gap-sm', visible: C.eq(x(`${INGEST}['isLoading']`), 'true') }, [cfg.loader(), note('Reading the document… extracting text… analysing… saving (20–60 s)')]) ],
            { styles: { width: { custom: '40%' } } }),
          card([head(x(`'Library — ' + (${DOCS}['data']?.['count'] ?? 0) + ' documents, ' + (${DOCS}['data']?.['analysed'] ?? 0) + ' analysed'`), 'TABLE · cgbp_document'),
            cfg.table(x(`${DOCS}['data']?.['rows'] || []`), [
              { key: 'title', label: 'Title', width: 240, grow: true }, { key: 'entity_code', label: 'Entity', width: 110 }, { key: 'doc_type', label: 'Type', width: 90 },
              { key: 'status', label: 'Status', type: 'TAG', width: 110, colors: { ANALYSED: 'success', ANALYSING: 'warning', FAILED: 'error' } }, { key: 'uploaded_at', label: 'Uploaded', width: 170 }],
              { id: 'b_docTbl', select: 'SINGLE', idKey: 'doc_code', events: { onRowSelect: A.setVar(V.doc, x(`b_docTbl['context']['currentRow']['doc_code']`)) } }),
            cfg.button('Refresh', { variant: 'ghost', color: 'neutral', size: 'sm', icon: 'RefreshCcw01', events: { onClick: A.runDs(DOCS) } })],
            { styles: { width: { custom: '60%' } } })]),
        cfg.alert('Select a document in the library, or analyse a new one, to see its analysis.', { visible: C.eq(x(`!!var_doc['value']`), 'false') }),
        cfg.stack({ gap: 'gap-lg', visible: C.eq(x(`!!var_doc['value']`), 'true') }, [
          cfg.row({ justify: 'space-between' }, [
            cfg.stack({ gap: 'gap-xs', styles: { width: 'w-auto' } }, [cfg.text(x(`${D}?.title`), { variant: 'text-xl', weight: 'semi-bold', css: SERIF }),
              cfg.row({ gap: 'gap-xs' }, [cfg.tag(x(`${D}?.status`), { color: { defaultValue: 'warning', conditionalValueFilters: [
                { propertyValue: 'success', conditions: { type: 'filter', payload: C.and(C.eq(x(`${D}?.status`), 'ANALYSED')) } },
                { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(x(`${D}?.status`), 'FAILED')) } }] }, dot: true }),
                cfg.tag(x(`${D}?.doc_type`)), cfg.tag(x(`'sentiment: ' + ${D}?.sentiment`))])]),
            cfg.button('Ask the analyst about this document', { variant: 'soft', icon: 'Stars02',
              events: { onClick: askDock(x(`'I uploaded "' + ${D}?.title + '" (document ' + var_doc['value'] + ' in cgbp_document). Its summary: ' + ${D}?.summary + ' — how does this compare with the live data for ' + (${D}?.entity_code || 'the entities it mentions') + ', and what should we do?'`)) } }) ]),
          cfg.tabs([
            { id: 'tab_an', label: 'Analysis', body: cfg.stack({ gap: 'gap-lg' }, [
              cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
                card([h3('Summary'), cfg.text(x(`${D}?.summary`), { variant: 'text-md' }),
                  cfg.kv([{ label: 'File', value: x(`${D}?.file_name`) }, { label: 'Entity', value: x(`${D}?.entity_code || '–'`) },
                    { label: 'Mentions', value: x(`((${D}?.mentioned?.entities) || []).join(', ') || '–'`) }, { label: 'Regions', value: x(`((${D}?.mentioned?.regions) || []).join(', ') || '–'`) },
                    { label: 'Uploaded by', value: x(`${D}?.uploaded_by`) }, { label: 'Analysed at', value: x(`${D}?.analysed_at`) }])], { styles: { width: { custom: '50%' } } }),
                card([h3('Key points'),
                  cfg.repeat('b_kpRep', x(`${D}?.key_points || []`), cfg.row({ gap: 'gap-sm', align: 'flex-start' }, [cfg.icon('CheckCircle', { color: 'text-brand-primary' }), cfg.text(x(`b_kpRep['context']['item']`))]), { gap: 'gap-sm' }),
                  h3('Risks'),
                  cfg.repeat('b_riskRep', x(`${D}?.risks || []`), cfg.alert(x(`b_riskRep['context']['item']`), { variant: 'warning', icon: 'AlertTriangle' }), { gap: 'gap-sm' })],
                  { styles: { width: { custom: '50%' } } })]),
              card([head('Figures in the document', 'metrics_json'),
                cfg.table(x(`(${D}?.metrics || []).map((m, i) => ({ id: i, ...m }))`), [{ key: 'name', label: 'Metric', width: 260, grow: true }, { key: 'value', label: 'Value', width: 140 }, { key: 'period', label: 'Period', width: 140 }])]),
              card([head('Recommendations', 'turn one into a tracked action'),
                cfg.repeat('b_recRep', x(`${D}?.recommendations || []`), cfg.row({ justify: 'space-between', p: 'p-sm', css: `& { border-bottom: 1px solid var(--border-secondary); }` }, [
                  cfg.stack({ gap: 'gap-xs', styles: { width: 'w-auto' } }, [cfg.text(x(`${R}['action']`), { weight: 'medium' }), note(x(`'Owner: ' + (${R}['owner'] || '–')`))]),
                  cfg.button('Raise as action', { size: 'sm', variant: 'outline', color: 'neutral', icon: 'Plus',
                    events: { onClick: A.then(A.setVar(V2.recTitle, x(`${R}['action']`)), A.setVar(V2.recOwner, x(`${R}['owner'] || ''`)), A.setVar(V2.recEntity, x(`${D}?.entity_code || ''`)), A.delay(A.runDs(CREATE), 300)) } })]),
                  { gap: 'gap-xs' })]) ]) },
            { id: 'tab_pdf', label: 'Document', body: card([cfg.pdf(x(`${D}?.file_url`), { height: '640px' })]) },
            { id: 'tab_txt', label: 'Extracted text', body: card([cfg.text(x(`${D}?.extracted_text || '–'`), { css: `& { white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 12px; }` }),
              cfg.alert(x(`${D}?.error`), { variant: 'error', visible: C.eq(x(`!!(${D}?.error)`), 'true') })]) },
          ], { id: 'b_docTabs' }) ]),
      ],
      overlays: [dock(x(`'The user is on the CGB Pulse Documents page. Documents live in cgbp_document (read them with QueryData). Selected document: ' + (var_doc['value'] || 'none') + '.'`))],
    });
    Object.assign(out, { documents_ds: DOCS, ingest_ds: INGEST, doc_action_ds: CREATE });
  }
  return out;
}
window.buildCgbPulseV2 = buildCgbPulseV2;
