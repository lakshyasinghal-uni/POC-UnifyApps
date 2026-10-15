// CGB Pulse — every page of the config-app sample, built with scripts/ua_cfg.js.
// Paste ua_cfg.js first, then this file, then:
//   await buildCgbPulse({ APP, PG, DS, AGENT, WF, CC });
// where PG = page ids, DS = global data-source ids, AGENT = ai_agent id, WF = workflow ids,
// CC = { id, type } of the uploaded custom component. Safe to re-run: pages are overwritten and
// page-level data sources are upserted by name (cfg.ensureDs).
//
// It deliberately exercises one of everything a config app has: global and page data sources
// (storage, automation, HTTP connector, create-record), JS output transformers, success
// callbacks, page variables, page inputs, onPageLoad, Repeatables reading their row, a Table
// with row select, conditional visibility and conditional colours, a Modal with a Form, charts,
// stat cards, dark-themed hero bands, the native Copilot, and a custom component whose onChange
// drives a page variable.
async function buildCgbPulse({ APP, PG, DS, AGENT, WF, CC }) {
  const { C, A } = cfg;
  // A data source's value in the page runtime is {{ <dsId>['data'] }}. With a JS transformer, 'data' IS
  // the transformer's return value (the server wraps it in 'result'; the runtime unwraps it).
  const r = (ds, path = '') => `${ds}['data']${path}`;
  const x = (s) => `{{ ${s} }}`;                                             // wrap an expression
  const ENT = r(DS.entities), REG = r(DS.regions), TREND = r(DS.trend), SCN = r(DS.scenarios);

  // ---------------------------------------------------------------- shared styling
  const HERO_CSS = `& { background: radial-gradient(120% 140% at 0% 0%, #6a1330 0%, #2c0a15 48%, #12070a 100%); border-radius: 22px; box-shadow: 0 18px 40px -24px rgba(60,10,25,.8); }`;
  const BAND_CSS = `& { background: linear-gradient(115deg, #3a0c1b 0%, #1a0a0f 70%); border-radius: 18px; }`;
  const GLASS_CSS = `& { background: rgba(255,255,255,.06) !important; border: 1px solid rgba(255,255,255,.14); border-radius: 16px; backdrop-filter: blur(6px); }`;
  const CARD_CSS = `& { border: 1px solid var(--border-secondary); box-shadow: 0 1px 2px rgba(16,24,40,.05); }`;
  const SERIF = `& { font-family: Spectral, Georgia, serif; letter-spacing: -.01em; }`;
  const EYEBROW = `& { letter-spacing: .14em; text-transform: uppercase; }`;
  const sevColor = expr => ({ defaultValue: 'brand', conditionalValueFilters: [
    { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(expr, 'critical')) } },
    { propertyValue: 'warning', conditions: { type: 'filter', payload: C.and(C.eq(expr, 'warning')) } },
    { propertyValue: 'success', conditions: { type: 'filter', payload: C.and(C.eq(expr, 'opportunity')) } } ] });
  const band = (title, sub, extra = []) => cfg.stack({ theme: 'dark', p: 'p-2xl', gap: 'gap-sm', css: BAND_CSS }, [
    cfg.text('CGB PULSE', { variant: 'text-xs', weight: 'semi-bold', color: 'text-tertiary', css: EYEBROW }),
    cfg.text(title, { variant: 'display-sm', weight: 'semi-bold', css: SERIF }),
    cfg.text(sub, { variant: 'text-md', color: 'text-secondary' }), ...extra ]);
  const card = (children, o = {}) => cfg.card(cfg.stack({ gap: o.gap || 'gap-md' }, children), { css: CARD_CSS, ...o });
  const h3 = t => cfg.text(t, { variant: 'text-lg', weight: 'semi-bold' });
  const lineage = t => cfg.tag(t, { size: 'sm', color: 'neutral', variant: 'outline' });

  // Chat with the data: open the docked agent and ask it a question on the user's behalf.
  const askDock = message => A.then(A.drawer('b_askDrawer', 'show'), A.delay(A.method('b_dock', 'submitMessage', { message }), 1500));
  const dock = context => cfg.drawer('b_askDrawer', cfg.stack({ gap: 'gap-md', p: 'p-lg', styles: { height: 'h-full' } }, [
    cfg.row({ justify: 'space-between' }, [cfg.text('CGB Pulse Analyst', { variant: 'text-lg', weight: 'semi-bold' }),
      cfg.iconButton('XClose', { events: { onClick: A.drawer('b_askDrawer', 'hide') } })]),
    cfg.copilot(AGENT, { id: 'b_dock', height: '78vh', welcome: 'Ask me about anything on this screen.', context })]), { width: '520px' });
  const save = (key, spec) => cfg.savePage(cfg.page({ id: PG[key], appId: APP, ...spec }));
  const out = {};

  // ================================================================ COMMAND CENTRE
  {
    const V = cfg.vars({ region: ['string', ''] });
    const ACTIONS = JSON.stringify([
      { id: 'open_entity', label: 'Open the entity', params: ['entity_code'] },
      { id: 'focus_region', label: 'Focus the municipality', params: ['region_code'] },
      { id: 'open_voices', label: 'Read citizen voices', params: ['entity_code'] },
      { id: 'open_control', label: 'Open the control room', params: [] },
      { id: 'ask_agent', label: 'Ask the analyst', params: [] }]);
    // Automatic, but disabled until all three inputs have data: it runs once on arrival, and again
    // whenever a scenario changes the records. (An onPageLoad "runDs(A) then runDs(B)" chain does NOT
    // work — B's inputs are evaluated before A's data reaches the store, and the LLM reads nothing.)
    const ins = await cfg.ensureDs(cfg.dsAutomation, { appId: APP, pageId: PG.command, name: 'ds_cc_insights', automationId: WF.insights, run: 'auto',
      disabledWhen: C.eq(x(`!((${ENT}?.['rows'] || []).length && (${REG}?.['rows'] || []).length && (${TREND}?.['series'] || []).length)`), 'true'),
      params: {
        p_screen: 'Command Centre — national overview',
        p_context: x(`'Viewer: ' + userContext['name'] + '. Period: August 2026. Service target: 80% satisfaction.'`),
        p_actions: ACTIONS,
        p_data: x(`JSON.stringify({ entities: (${ENT}?.['rows'] || []).map(e => ({ entity_code: e.entity_code, name: e.name_en, satisfaction: e.satisfaction, health: e.health_score, sentiment: e.sentiment, risk: e.risk_band, digital: e.digital_adoption })), regions: (${REG}?.['rows'] || []).map(g => ({ region_code: g.region_code, name: g.name_en, satisfaction: g.satisfaction, risk: g.risk_score, response_ratio: g.response_ratio })), national_trend: ${TREND}?.['series'] })`),
      },
      transform: `const raw = data?.insights ?? data?.result?.insights; let o = {};
try { o = typeof raw === 'string' ? JSON.parse(raw) : (raw || {}); } catch (e) { o = { headline: 'The insight engine returned an unreadable answer — refresh to try again.', insights: [] }; }
return { headline: o.headline || '', insights: (o.insights || []).map((i, n) => ({ ...i, n, action: { id: 'ask_agent', label: 'Ask the analyst', params: {}, prompt: '', ...(i.action || {}) } })) };` });
    const I = `b_insRep['context']['item']`;
    const regionSel = `(${REG}?.['rows'] || []).find(g => g.region_code === var_region['value'])`;
    const page = {
      name: 'Command Centre', slug: 'command-centre', vars: V.defs, rootStyles: { gap: { all: 'gap-xl' } },
      body: [
        // ---- hero
        cfg.stack({ theme: 'dark', p: 'p-3xl', gap: 'gap-lg', css: HERO_CSS }, [
          cfg.row({ justify: 'space-between' }, [
            cfg.text('CGB PULSE · COMMAND CENTRE', { variant: 'text-xs', weight: 'semi-bold', color: 'text-tertiary', css: EYEBROW }),
            cfg.row({ gap: 'gap-sm', justify: 'flex-end', styles: { width: 'w-auto' } }, [
              cfg.tag(x(`${r(DS.weather, "?.['label']")} ?? 'Doha'`), { color: 'warning', variant: 'soft' }),
              cfg.tag('Live · 614 records', { color: 'success', dot: true }) ]) ]),
          cfg.text('Government service performance, live.', { variant: 'display-md', weight: 'semi-bold', css: SERIF }),
          cfg.text(x(`${r(ins, "?.['headline']")} || 'Reading 12 entities, 8 municipalities and 12 months of KPIs…'`), { variant: 'text-lg', color: 'text-secondary', css: `& { max-width: 900px; }` }),
          cfg.row({ gap: 'gap-md', align: 'stretch' }, [
            cfg.stat('National satisfaction', x(`${ENT}?.['avgSatisfaction']`), { description: 'Target 80%', css: GLASS_CSS }),
            cfg.stat('Entities below target', x(`${ENT}?.['belowTarget']`), { dp: 0, description: x(`'of ' + (${ENT}?.['count'] ?? 12) + ' entities'`), css: GLASS_CSS }),
            cfg.stat('High-risk entities', x(`${ENT}?.['highRisk']`), { dp: 0, description: 'Health score below 70', css: GLASS_CSS }),
            cfg.stat('Digital adoption', x(`${ENT}?.['avgDigital']`), { description: 'Average share of services online', css: GLASS_CSS }) ]),
          cfg.row({ gap: 'gap-sm' }, [
            cfg.button('Ask the analyst', { icon: 'Stars02', events: { onClick: A.goto(PG.analyst, { question: 'What should leadership worry about this month?' }) } }),
            cfg.button('Open the control room', { variant: 'outline', color: 'neutral', icon: 'Sliders04', events: { onClick: A.goto(PG.control) } }),
            cfg.button('Refresh AI read-out', { variant: 'ghost', color: 'neutral', icon: 'RefreshCcw01', loading: x(`${ins}['isLoading']`), events: { onClick: A.runDs(ins) } }) ]) ]),
        // ---- map + trend
        cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
          cfg.stack({ gap: 'gap-sm', styles: { width: { custom: '42%' } } }, [
            cfg.custom(CC.type, CC.id, x(`{ ...(${REG}?.['map'] || {}), selected: var_region['value'] || '' }`), { id: 'b_pulseMap', height: '460px',
              events: { onChange: A.setVar(V.region, x('code')) } }) ]),
          card([
            cfg.row({ justify: 'space-between' }, [h3('National satisfaction — 12 months'), lineage('cgbp_kpi · NATIONAL')]),
            cfg.chart(x(`${TREND}?.['series'] || []`), { type: 'LINE', x: 'period', height: '250px', yDomain: { min: 60, max: 90 },
              series: [{ key: 'satisfaction', label: 'Satisfaction %' }, { key: 'sharek_index', label: 'Service index', color: 'var(--palette-brand-secondary-500)' }, { key: 'target', label: 'Target', color: 'var(--palette-error-400)' }] }),
            cfg.divider(),
            cfg.stack({ gap: 'gap-xs', visible: C.eq(x(`!!var_region['value']`), 'true') }, [
              cfg.row({ justify: 'space-between' }, [
                cfg.text(x(`${regionSel}?.name_en`), { variant: 'text-md', weight: 'semi-bold' }),
                cfg.button('Clear', { variant: 'ghost', color: 'neutral', size: 'sm', events: { onClick: A.setVar(V.region, '') } }) ]),
              cfg.text(x(`'Satisfaction ' + ${regionSel}?.satisfaction + '% · risk ' + ${regionSel}?.risk_score + ' · response time ' + ${regionSel}?.response_ratio + 'x national'`), { color: 'text-secondary' }),
              cfg.text(x(`${regionSel}?.action_en`), { weight: 'medium' }),
              cfg.button('Ask the analyst about this municipality', { variant: 'soft', size: 'sm', icon: 'Stars02',
                events: { onClick: askDock(x(`'Tell me about ' + ${regionSel}?.name_en + ': why is it at ' + ${regionSel}?.satisfaction + '% and what would move it fastest?'`)) } }) ]),
            cfg.text('Click a municipality on the map to see its figures and recommended action.', { color: 'text-tertiary', visible: C.eq(x(`!!var_region['value']`), 'false') }) ], { styles: { width: { custom: '58%' } } }) ]),
        // ---- AI insights
        cfg.stack({ gap: 'gap-md' }, [
          cfg.row({ justify: 'space-between' }, [
            cfg.stack({ gap: 'gap-xs', styles: { width: 'w-auto' } }, [h3('What the AI sees right now'), cfg.text('Findings from the live records, each bound to one action on this screen.', { color: 'text-tertiary' })]),
            lineage('cgbp_ai_insights · LLM over cgbp_entity, cgbp_region, cgbp_kpi') ]),
          cfg.row({ gap: 'gap-sm', visible: C.eq(x(`${ins}['isLoading']`), 'true') }, [cfg.loader(), cfg.text('Reading entities… comparing with target and trend… ranking… binding actions…', { color: 'text-tertiary' })]),
          cfg.repeat('b_insRep', x(`${r(ins, "?.['insights']")} || []`), card([
            cfg.row({ justify: 'space-between' }, [
              cfg.tag(x(`${I}['severity']`), { color: sevColor(x(`${I}['severity']`)), dot: true }),
              cfg.text(x(`${I}['metric']`), { variant: 'text-md', weight: 'semi-bold', color: 'text-brand-primary' }) ]),
            cfg.text(x(`${I}['title']`), { variant: 'text-md', weight: 'semi-bold' }),
            cfg.text(x(`${I}['detail']`), { color: 'text-secondary' }),
            cfg.text(x(`(${I}['evidence'] || []).join(' · ')`), { variant: 'text-xs', color: 'text-tertiary' }),
            cfg.button(x(`${I}['action']['label'] || 'Ask the analyst'`), { variant: 'soft', size: 'sm', events: { onClick: [
              A.when(A.goto(PG.entity, { entity_code: x(`${I}['action']['params']['entity_code']`) }), C.eq(x(`${I}['action']['id']`), 'open_entity')),
              A.when(A.setVar(V.region, x(`${I}['action']['params']['region_code']`)), C.eq(x(`${I}['action']['id']`), 'focus_region')),
              A.when(A.goto(PG.voices, { entity_code: x(`${I}['action']['params']['entity_code'] || ''`) }), C.eq(x(`${I}['action']['id']`), 'open_voices')),
              A.when(A.goto(PG.control), C.eq(x(`${I}['action']['id']`), 'open_control')),
              A.when(askDock(x(`${I}['action']['prompt'] || ${I}['title']`)), C.or(C.eq(x(`${I}['action']['id']`), 'ask_agent'), C.eq(x(`${I}['action']['id']`), 'none'))) ] } }),
            cfg.button('Ask about this', { variant: 'ghost', color: 'neutral', size: 'sm', icon: 'Stars02',
              events: { onClick: askDock(x(`'Explain this finding and what I should do about it: ' + ${I}['title'] + ' — ' + ${I}['detail']`)) } }) ]),
            { grid: 2, gap: 'gap-md' }) ]),
        // ---- entities at risk
        card([
          cfg.row({ justify: 'space-between' }, [h3('Entities furthest below target'), lineage('cgbp_entity')]),
          cfg.table(x(`(${ENT}?.['rows'] || []).slice().sort((a, b) => a.satisfaction - b.satisfaction).slice(0, 5)`), [
            { key: 'name_en', label: 'Entity', width: 220, grow: true }, { key: 'satisfaction', label: 'Satisfaction %', type: 'NUMBER', width: 130 },
            { key: 'health_score', label: 'Health', type: 'NUMBER', width: 100 }, { key: 'sentiment', label: 'Sentiment', type: 'NUMBER', width: 110 },
            { key: 'risk_band', label: 'Risk', type: 'TAG', width: 110, colors: { HIGH: 'error', MEDIUM: 'warning', LOW: 'success' } } ],
          { id: 'b_riskTbl', select: 'SINGLE', events: { onRowSelect: A.goto(PG.entity, { entity_code: x(`b_riskTbl['context']['currentRow']['entity_code']`) }) } }) ]),
      ],
      overlays: [dock(x(`'The user is on the CGB Pulse Command Centre. National satisfaction ' + ${ENT}?.['avgSatisfaction'] + '%, ' + ${ENT}?.['belowTarget'] + ' entities below the 80% target. Selected municipality: ' + (var_region['value'] || 'none') + '.'`))],
    };
    out.command = await save('command', page);
    out.cc_insights = ins;
  }

  // ================================================================ ENTITIES
  {
    const V = cfg.vars({ cluster: ['string', ''] });
    const rows = `(${ENT}?.['rows'] || []).filter(e => !var_cluster['value'] || e.cluster === var_cluster['value'])`;
    out.entities = await save('entities', {
      name: 'Entities', slug: 'entities', vars: V.defs,
      body: [
        band('Entities', 'Twelve government service entities against the 80% satisfaction target. Select a row to open it.'),
        cfg.row({ gap: 'gap-md' }, [
          cfg.select([{ value: '', label: 'All clusters' }, 'HEALTH_EDUCATION', 'ECONOMY_LABOUR', 'SECURITY_JUSTICE', 'MUNICIPAL_TRANSPORT', 'GOVERNMENT_SERVICES'],
            { id: 'b_clusterSel', placeholder: 'All clusters', styles: { width: { custom: '280px' } }, events: { onChange: A.setVar(V.cluster, x(`b_clusterSel['value']`)) } }),
          cfg.text(x(`${rows}.length + ' entities · ' + ${rows}.filter(e => e.satisfaction < 80).length + ' below target'`), { color: 'text-secondary' }) ]),
        card([cfg.row({ justify: 'space-between' }, [h3('Satisfaction by entity'), lineage('cgbp_entity')]),
          cfg.chart(x(`${rows}.slice().sort((a, b) => a.satisfaction - b.satisfaction).map(e => ({ name: e.name_en, satisfaction: e.satisfaction, target: 80 }))`),
            { type: 'BAR', x: 'name', height: '300px', series: [{ key: 'satisfaction', label: 'Satisfaction %' }, { key: 'target', label: 'Target', color: 'var(--palette-gray-300)' }] }) ]),
        card([cfg.table(x(rows), [
          { key: 'name_en', label: 'Entity', width: 220, grow: true }, { key: 'cluster', label: 'Cluster', width: 190 },
          { key: 'satisfaction', label: 'Satisfaction %', type: 'NUMBER', width: 120 }, { key: 'health_score', label: 'Health', type: 'NUMBER', width: 90 },
          { key: 'digital_adoption', label: 'Digital %', type: 'NUMBER', width: 100 }, { key: 'response_hours', label: 'Response h', type: 'NUMBER', width: 110 },
          { key: 'risk_band', label: 'Risk', type: 'TAG', width: 100, colors: { HIGH: 'error', MEDIUM: 'warning', LOW: 'success' } } ],
          { id: 'b_entTbl', select: 'SINGLE', events: { onRowSelect: A.goto(PG.entity, { entity_code: x(`b_entTbl['context']['currentRow']['entity_code']`) }) } })]),
      ] });
  }

  // ================================================================ ENTITY (detail, page input entity_code)
  {
    const code = `pageInputs['entity_code']`;
    const flat = `const rows = (data?.objects || []).map(o => ({ id: o.id, ...o.properties }));`;
    const one = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.entity, name: 'ds_entity_one', object: 'cgbp_entity', limit: 1,
      filter: C.and(C.eq('id', x(code))), transform: flat + `return rows[0] || {};` });
    const trend = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.entity, name: 'ds_entity_trend', object: 'cgbp_kpi', limit: 24,
      filter: C.and(C.eq('properties_scope_code', x(code)), C.eq('properties_metric', 'satisfaction')), sort: [{ field: 'properties.period', order: 'ASC' }],
      transform: flat + `return rows.map(r => ({ period: r.period, satisfaction: r.value, target: 80 }));` });
    const voices = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.entity, name: 'ds_entity_voices', object: 'cgbp_voice', limit: 12,
      filter: C.and(C.eq('properties_entity_code', x(code))), sort: [{ field: 'properties.posted_days_ago', order: 'ASC' }], transform: flat + `return rows;` });
    const actions = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.entity, name: 'ds_entity_actions', object: 'cgbp_action', limit: 50,
      filter: C.and(C.eq('properties_entity_code', x(code))), transform: flat + `return rows;` });
    const F = `b_actForm['data']`;
    const create = await cfg.ensureDs(cfg.dsCreateRecord, { appId: APP, pageId: PG.entity, name: 'ds_create_action', object: 'cgbp_action',
      record: { action_code: x(`'ACT-' + Date.now()`), title: x(`${F}['title']`), entity_code: x(code), owner: x(`${F}['owner'] || userContext['name']`),
        priority: x(`${F}['priority'] || 'MEDIUM'`), status: 'OPEN', source: 'CGB Pulse app', notes: x(`${F}['notes'] || ''`),
        due_days: x(`Number(${F}['due_days'] || 14)`), created_by: x(`userContext['name']`) },
      onSuccess: [A.notify('Action raised', 'success'), A.runDs(actions), A.modal('b_actModal', 'hide')], onError: [A.notify('Could not save the action', 'error')] });
    const E = r(one);
    out.entity = await save('entity', {
      name: 'Entity', slug: 'entity', inputs: { entity_code: 'string' },
      body: [
        cfg.stack({ theme: 'dark', p: 'p-2xl', gap: 'gap-sm', css: BAND_CSS }, [
          cfg.row({ justify: 'space-between' }, [
            cfg.button('← All entities', { variant: 'ghost', color: 'neutral', size: 'sm', events: { onClick: A.goto(PG.entities) } }),
            cfg.row({ gap: 'gap-sm', justify: 'flex-end', styles: { width: 'w-auto' } }, [
              cfg.tag(x(`${E}?.['cluster']`), { color: 'neutral' }),
              cfg.tag(x(`(${E}?.['risk_band'] || '') + ' RISK'`), { color: { defaultValue: 'success', conditionalValueFilters: [
                { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(x(`${E}?.['risk_band']`), 'HIGH')) } },
                { propertyValue: 'warning', conditions: { type: 'filter', payload: C.and(C.eq(x(`${E}?.['risk_band']`), 'MEDIUM')) } }] } }) ]) ]),
          cfg.text(x(`${E}?.['name_en'] || pageInputs['entity_code']`), { variant: 'display-sm', weight: 'semi-bold', css: SERIF }),
          cfg.text(x(`${E}?.['narrative_en']`), { variant: 'text-md', color: 'text-secondary' }),
          cfg.row({ gap: 'gap-md', align: 'stretch' }, [
            cfg.stat('Satisfaction %', x(`${E}?.['satisfaction']`), { css: GLASS_CSS }), cfg.stat('Health score', x(`${E}?.['health_score']`), { css: GLASS_CSS }),
            cfg.stat('Sentiment', x(`${E}?.['sentiment']`), { dp: 0, css: GLASS_CSS }), cfg.stat('Digital adoption %', x(`${E}?.['digital_adoption']`), { dp: 0, css: GLASS_CSS }),
            cfg.stat('Response time (h)', x(`${E}?.['response_hours']`), { css: GLASS_CSS }) ]) ]),
        cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
          card([cfg.row({ justify: 'space-between' }, [h3('Satisfaction trend'), lineage('cgbp_kpi · ENTITY')]),
            cfg.chart(x(`${r(trend)} || []`), { type: 'AREA', x: 'period', height: '240px', yDomain: { min: 50, max: 100 },
              series: [{ key: 'satisfaction', label: 'Satisfaction %' }, { key: 'target', label: 'Target', color: 'var(--palette-error-400)' }] })], { styles: { width: { custom: '60%' } } }),
          card([h3('The opportunity'), cfg.text(x(`${E}?.['opportunity_en']`), { variant: 'text-md' }),
            cfg.stack({ gap: 'gap-sm' }, [
              cfg.button('Raise a follow-up action', { icon: 'Plus', events: { onClick: A.modal('b_actModal', 'show') } }),
              cfg.button('Ask the analyst about this entity', { variant: 'outline', color: 'neutral', icon: 'Stars02',
                events: { onClick: A.goto(PG.analyst, { entity_code: x(code), question: x(`'Why is ' + (${E}?.['name_en'] || '') + ' at ' + ${E}?.['satisfaction'] + '% and what would move it fastest?'`) }) } }),
              cfg.button('Read what citizens say', { variant: 'ghost', color: 'neutral', icon: 'MessageChatCircle', events: { onClick: A.goto(PG.voices, { entity_code: x(code) }) } }) ]) ],
            { styles: { width: { custom: '40%' } } }) ]),
        cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
          card([cfg.row({ justify: 'space-between' }, [h3('Latest citizen voices'), lineage('cgbp_voice')]),
            cfg.repeat('b_entVoices', x(`${r(voices)} || []`), cfg.stack({ gap: 'gap-xs', p: 'p-sm', css: `& { border-bottom: 1px solid var(--border-secondary); }` }, [
              cfg.row({ gap: 'gap-sm' }, [
                cfg.tag(x(`b_entVoices['context']['item']['kind']`), { color: { defaultValue: 'neutral', conditionalValueFilters: [
                  { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(x(`b_entVoices['context']['item']['kind']`), 'COMPLAINT')) } },
                  { propertyValue: 'success', conditions: { type: 'filter', payload: C.and(C.eq(x(`b_entVoices['context']['item']['kind']`), 'PRAISE')) } }] } }),
                cfg.text(x(`b_entVoices['context']['item']['channel_code'] + ' · ' + b_entVoices['context']['item']['posted_days_ago'] + ' days ago'`), { variant: 'text-xs', color: 'text-tertiary' }) ]),
              cfg.text(x(`b_entVoices['context']['item']['text_en']`)) ]), { gap: 'gap-xs' })], { styles: { width: { custom: '55%' } } }),
          card([cfg.row({ justify: 'space-between' }, [h3('Follow-up actions'), lineage('cgbp_action')]),
            cfg.table(x(`${r(actions)} || []`), [{ key: 'title', label: 'Action', width: 220, grow: true }, { key: 'owner', label: 'Owner', width: 130 },
              { key: 'priority', label: 'Priority', type: 'TAG', width: 100, colors: { HIGH: 'error', MEDIUM: 'warning', LOW: 'neutral' } },
              { key: 'status', label: 'Status', type: 'TAG', width: 110, colors: { OPEN: 'brand', IN_PROGRESS: 'warning', DONE: 'success' } }, { key: 'due_days', label: 'Due (d)', type: 'NUMBER', width: 90 }]),
            cfg.text('No actions raised yet for this entity.', { color: 'text-tertiary', visible: C.eq(x(`(${r(actions)} || []).length`), '0') }) ],
            { styles: { width: { custom: '45%' } } }) ]),
      ],
      overlays: [cfg.modal('b_actModal', cfg.stack({ gap: 'gap-lg', p: 'p-xl' }, [
        cfg.text('Raise a follow-up action', { variant: 'text-xl', weight: 'semi-bold' }),
        cfg.text(x(`'For ' + (${E}?.['name_en'] || '')`), { color: 'text-tertiary' }),
        cfg.form('b_actForm', [
          { key: 'title', title: 'What needs to happen', required: true, placeholder: 'e.g. Publish the document checklist online' },
          { key: 'owner', title: 'Owner', placeholder: 'Name or team' },
          { key: 'priority', title: 'Priority', type: 'select', options: [{ const: 'HIGH', title: 'High' }, { const: 'MEDIUM', title: 'Medium' }, { const: 'LOW', title: 'Low' }], default: 'MEDIUM', width: '50%' },
          { key: 'due_days', title: 'Due in (days)', type: 'number', default: 14, width: '50%' },
          { key: 'notes', title: 'Notes', type: 'textarea' }]),
        cfg.row({ justify: 'flex-end', gap: 'gap-sm' }, [
          cfg.button('Cancel', { variant: 'ghost', color: 'neutral', events: { onClick: A.modal('b_actModal', 'hide') } }),
          cfg.button('Save action', { loading: x(`${create}['isLoading']`), events: { onClick: A.runDs(create) } }) ]) ]))],
    });
    Object.assign(out, { entity_one: one, entity_trend: trend, entity_voices: voices, entity_actions: actions, create_action: create });
  }

  // ================================================================ CITIZEN VOICES
  {
    const V = cfg.vars({ kind: ['string', ''], entity: ['string', ''], search: ['string', ''] });
    const all = await cfg.ensureDs(cfg.dsFetch, { appId: APP, pageId: PG.voices, name: 'ds_voices', object: 'cgbp_voice', limit: 500,
      sort: [{ field: 'properties.posted_days_ago', order: 'ASC' }],
      transform: `const rows = (data?.objects || []).map(o => ({ id: o.id, ...o.properties }));
const kinds = ['COMPLAINT', 'SUGGESTION', 'PRAISE', 'QUESTION'];
return { rows, byKind: kinds.map(k => ({ kind: k, count: rows.filter(r => r.kind === k).length })) };` });
    const list = `(${r(all, "?.['rows']")} || []).filter(v => (!var_kind['value'] || v.kind === var_kind['value']) && (!var_entity['value'] || v.entity_code === var_entity['value']) && (!var_search['value'] || String(v.text_en).toLowerCase().includes(String(var_search['value']).toLowerCase())))`;
    const it = `b_voiceRep['context']['item']`;
    out.voices = await save('voices', {
      name: 'Citizen Voices', slug: 'citizen-voices', vars: V.defs, inputs: { entity_code: 'string' },
      onLoad: [A.when(A.setVar(V.entity, x(`pageInputs['entity_code']`)), C.eq(x(`!!pageInputs['entity_code']`), 'true'))],
      body: [
        band('Citizen voices', '420 comments across five channels. Filter them, and let the numbers follow.'),
        cfg.row({ gap: 'gap-md' }, [
          cfg.select([{ value: '', label: 'All kinds' }, 'COMPLAINT', 'SUGGESTION', 'PRAISE', 'QUESTION'], { id: 'b_kindSel', placeholder: 'All kinds',
            events: { onChange: A.setVar(V.kind, x(`b_kindSel['value']`)) } }),
          cfg.select([{ value: '', label: 'All entities' }, ...['HEALTH', 'EDUCATION', 'MUNICIPAL', 'TRANSPORT', 'LABOUR', 'JUSTICE', 'INTERIOR', 'COMMERCE', 'HOUSING', 'SOCIAL', 'CUSTOMS', 'DIGITAL']],
            { id: 'b_entSel', placeholder: 'All entities', default: x(`pageInputs['entity_code'] || ''`), events: { onChange: A.setVar(V.entity, x(`b_entSel['value']`)) } }),
          cfg.input({ id: 'b_search', placeholder: 'Search the text…', search: true, events: { onChange: A.setVar(V.search, x(`b_search['value']`)) } }) ]),
        cfg.row({ gap: 'gap-md', align: 'stretch' }, [
          cfg.stat('Matching comments', x(`${list}.length`), { dp: 0, css: CARD_CSS }),
          cfg.stat('Complaints', x(`${list}.filter(v => v.kind === 'COMPLAINT').length`), { dp: 0, css: CARD_CSS }),
          cfg.stat('Average sentiment', x(`Math.round(${list}.reduce((s, v) => s + v.sentiment, 0) / Math.max(1, ${list}.length))`), { dp: 0, css: CARD_CSS }),
          cfg.stat('Average rating', x(`Math.round(${list}.reduce((s, v) => s + v.rating, 0) / Math.max(1, ${list}.length) * 10) / 10`), { css: CARD_CSS }) ]),
        cfg.row({ gap: 'gap-lg', align: 'flex-start' }, [
          card([h3('By kind (all comments)'), cfg.chart(x(`${r(all, "?.['byKind']")} || []`), { type: 'BAR', x: 'kind', height: '240px', series: [{ key: 'count', label: 'Comments' }] }), lineage('cgbp_voice')],
            { styles: { width: { custom: '34%' } } }),
          cfg.stack({ gap: 'gap-sm', styles: { width: { custom: '66%' } } }, [
            cfg.repeat('b_voiceRep', x(`${list}.slice(0, 40)`), card([
              cfg.row({ gap: 'gap-sm' }, [
                cfg.tag(x(`${it}['kind']`), { color: { defaultValue: 'neutral', conditionalValueFilters: [
                  { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(x(`${it}['kind']`), 'COMPLAINT')) } },
                  { propertyValue: 'success', conditions: { type: 'filter', payload: C.and(C.eq(x(`${it}['kind']`), 'PRAISE')) } },
                  { propertyValue: 'warning', conditions: { type: 'filter', payload: C.and(C.eq(x(`${it}['kind']`), 'SUGGESTION')) } }] } }),
                cfg.text(x(`${it}['entity_code'] + ' · ' + ${it}['center_code'] + ' · ' + ${it}['channel_code'] + ' · ' + ${it}['posted_days_ago'] + 'd ago · ' + '★'.repeat(${it}['rating'] || 0)`), { variant: 'text-xs', color: 'text-tertiary' }) ]),
              cfg.text(x(`${it}['text_en']`), { variant: 'text-md' }) ], { p: 'p-md' }), { gap: 'gap-sm' }),
            cfg.text('No comments match these filters.', { color: 'text-tertiary', visible: C.eq(x(`${list}.length`), '0') }) ]) ]),
      ] });
    out.voices_ds = all;
  }

  // ================================================================ CONTROL ROOM
  {
    const V = cfg.vars({ scenario: ['string', ''] });
    const apply = await cfg.ensureDs(cfg.dsAutomation, { appId: APP, pageId: PG.control, name: 'ds_apply_scenario', automationId: WF.scenario, run: 'manual',
      params: { scenario_code: x(`var_scenario['value']`) },
      onSuccess: [A.runDs(DS.entities), A.runDs(DS.regions), A.runDs(DS.scenarios), A.notify('Scenario applied — every screen now reads the new figures', 'success')],
      onError: [A.notify('The scenario could not be applied', 'error')] });
    const S = `b_scnRep['context']['item']`;
    out.control = await save('control', {
      name: 'Control Room', slug: 'control-room', vars: V.defs,
      body: [
        band('Control room', 'Pull a lever: an automation rewrites the live records, and every screen follows. Restore the baseline to put it all back exactly.', [
          cfg.row({ gap: 'gap-sm' }, [cfg.text('Active scenario:', { color: 'text-tertiary' }),
            cfg.tag(x(`${SCN}?.['active']?.['name_en'] || 'Baseline — nothing applied'`), { color: 'warning', dot: true })]) ]),
        cfg.row({ gap: 'gap-md', align: 'stretch' }, [
          cfg.stat('National satisfaction', x(`${ENT}?.['avgSatisfaction']`), { css: CARD_CSS }),
          cfg.stat('Entities below target', x(`${ENT}?.['belowTarget']`), { dp: 0, css: CARD_CSS }),
          cfg.stat('High-risk entities', x(`${ENT}?.['highRisk']`), { dp: 0, css: CARD_CSS }),
          cfg.stat('Al Rayyan satisfaction', x(`(${REG}?.['rows'] || []).find(g => g.region_code === 'RAYYAN')?.satisfaction`), { css: CARD_CSS }) ]),
        cfg.row({ gap: 'gap-sm', visible: C.eq(x(`${apply}['isLoading']`), 'true') }, [cfg.loader(), cfg.text('Applying the scenario: reading records, computing deltas, writing entities and regions…', { color: 'text-tertiary' })]),
        cfg.repeat('b_scnRep', x(`${SCN}?.['rows'] || []`), card([
          cfg.row({ justify: 'space-between' }, [
            cfg.tag(x(`${S}['family']`), { color: { defaultValue: 'neutral', conditionalValueFilters: [
              { propertyValue: 'error', conditions: { type: 'filter', payload: C.and(C.eq(x(`${S}['family']`), 'ESCALATION')) } },
              { propertyValue: 'success', conditions: { type: 'filter', payload: C.and(C.eq(x(`${S}['family']`), 'RECOVERY')) } },
              { propertyValue: 'brand', conditions: { type: 'filter', payload: C.and(C.eq(x(`${S}['family']`), 'LAUNCH')) } }] } }),
            cfg.tag('ACTIVE', { color: 'warning', dot: true, visible: C.eq(x(`${S}['is_active']`), 'true') }) ]),
          cfg.text(x(`${S}['name_en']`), { variant: 'text-md', weight: 'semi-bold' }),
          cfg.text(x(`${S}['description_en']`), { color: 'text-secondary' }),
          cfg.button(x(`${S}['family'] === 'BASELINE' ? 'Restore baseline' : 'Apply scenario'`), { size: 'sm', variant: 'soft',
            events: { onClick: A.then(A.setVar(V.scenario, x(`${S}['scenario_code']`)), A.runDs(apply)) } }) ]), { grid: 3, gap: 'gap-md' }),
        card([cfg.row({ justify: 'space-between' }, [h3('Entity satisfaction — live'), lineage('cgbp_entity')]),
          cfg.chart(x(`${ENT}?.['bySatisfaction'] || []`), { type: 'BAR', x: 'name', height: '280px', series: [{ key: 'satisfaction', label: 'Satisfaction %' }, { key: 'target', label: 'Target', color: 'var(--palette-gray-300)' }] })]),
      ] });
    out.apply_ds = apply;
  }

  // ================================================================ ANALYST
  out.analyst = await save('analyst', {
    name: 'Analyst', slug: 'analyst', inputs: { question: 'string', entity_code: 'string' },
    // Arriving with ?question=… asks it straight away (onPageLoad -> submitMessage on the Copilot).
    onLoad: [A.when(A.delay(A.method('b_copilot', 'submitMessage', { message: x(`pageInputs['question']`) }), 2000), C.eq(x(`!!pageInputs['question']`), 'true'))],
    body: [
      band('Ask the analyst', 'An AI agent that reads the same cgbp_* objects as every screen, through one QueryData tool.'),
      cfg.row({ gap: 'gap-lg', align: 'stretch' }, [
        card([cfg.copilot(AGENT, { id: 'b_copilot', height: '640px', welcome: `Hello {{ userContext['name'] }} — ask me anything about entities, municipalities, citizen voices or the scenarios in play.`,
          context: x(`'The user opened the analyst from CGB Pulse. ' + (pageInputs['entity_code'] ? 'They were looking at entity ' + pageInputs['entity_code'] + '. ' : '') + (pageInputs['question'] ? 'Their question: ' + pageInputs['question'] : '')`) })],
          { styles: { width: { custom: '68%' } }, p: 'p-sm' }),
        cfg.stack({ gap: 'gap-md', styles: { width: { custom: '32%' } } }, [
          card([h3('Your question'), cfg.text(x(`pageInputs['question']`), { variant: 'text-md' }),
            cfg.button('Ask it again', { variant: 'soft', size: 'sm', icon: 'Stars02', events: { onClick: A.method('b_copilot', 'submitMessage', { message: x(`pageInputs['question']`) }) } })],
            { visible: C.eq(x(`!!pageInputs['question']`), 'true') }),
          card([h3('Try asking'), ...[
            'Which three entities are furthest below target, and what is driving each?',
            'Is Al Rayyan getting better or worse — and why?',
            'What are citizens complaining about most for Labour Services?',
            'Which scenario is active right now, and what did it change?'
          ].map(q => cfg.button(q, { variant: 'ghost', color: 'neutral', size: 'sm', css: `& { justify-content: flex-start; text-align: left; white-space: normal; height: auto; }`, events: { onClick: A.method('b_copilot', 'submitMessage', { message: q }) } }))]) ]) ]),
    ] });
  return out;
}
window.buildCgbPulse = buildCgbPulse;

// The five GLOBAL data sources (on e_global_<APP>, readable from every page). Returns their ids in the
// shape buildCgbPulse expects: { entities, regions, trend, scenarios, weather }.
async function buildCgbPulseGlobals(APP) {
  const { C } = cfg;
  const flat = `const rows = (data?.objects || []).map(o => ({ id: o.id, ...o.properties }));`;
  const DS = {};
  DS.entities = await cfg.ensureDs(cfg.dsFetch, { appId: APP, name: 'ds_entities', object: 'cgbp_entity', limit: 50,
    sort: [{ field: 'properties.health_score', order: 'DESC' }],
    transform: flat + `
const n = rows.length || 1;
const avg = k => Math.round(rows.reduce((s, r) => s + (Number(r[k]) || 0), 0) / n * 10) / 10;
const worst = [...rows].sort((a, b) => a.satisfaction - b.satisfaction)[0] || {};
return { rows, count: rows.length, avgSatisfaction: avg('satisfaction'), avgHealth: avg('health_score'), avgDigital: avg('digital_adoption'),
  belowTarget: rows.filter(r => Number(r.satisfaction) < 80).length, highRisk: rows.filter(r => r.risk_band === 'HIGH').length, worst,
  bySatisfaction: [...rows].sort((a, b) => a.satisfaction - b.satisfaction).map(r => ({ name: r.name_en, code: r.entity_code, satisfaction: r.satisfaction, health: r.health_score, target: 80 })) };` });
  DS.regions = await cfg.ensureDs(cfg.dsFetch, { appId: APP, name: 'ds_regions', object: 'cgbp_region', limit: 50,
    sort: [{ field: 'properties.satisfaction', order: 'ASC' }],
    transform: flat + `
return { rows, map: { title: 'Service satisfaction by municipality', metric: 'satisfaction', unit: '%', target: 80,
  regions: rows.map(r => ({ code: r.region_code, name: r.name_en, lat: r.lat, lon: r.lon, value: r.satisfaction, risk: r.risk_score, population: r.population, note: r.note_en, action: r.action_en })) } };` });
  DS.trend = await cfg.ensureDs(cfg.dsFetch, { appId: APP, name: 'ds_national_trend', object: 'cgbp_kpi', limit: 100,
    filter: C.and(C.eq('properties_scope_type', 'NATIONAL')), sort: [{ field: 'properties.period', order: 'ASC' }],
    transform: flat + `
const by = {};
rows.forEach(r => { by[r.period] = by[r.period] || { period: r.period }; by[r.period][r.metric] = r.value; });
const series = Object.values(by).sort((a, b) => a.period.localeCompare(b.period)).map(p => ({ ...p, target: 80 }));
const last = series[series.length - 1] || {}, prev = series[series.length - 2] || {};
return { series, latest: last, change: Math.round(((last.satisfaction || 0) - (prev.satisfaction || 0)) * 10) / 10 };` });
  DS.scenarios = await cfg.ensureDs(cfg.dsFetch, { appId: APP, name: 'ds_scenarios', object: 'cgbp_scenario', limit: 50,
    sort: [{ field: 'properties.family', order: 'ASC' }],
    transform: flat + `return { rows, active: rows.find(r => r.is_active === true || r.is_active === 'true') || null };` });
  DS.weather = await cfg.ensureDs(cfg.dsHttp, { appId: APP, name: 'ds_doha_weather', baseUrl: 'https://api.open-meteo.com', path: '/v1/forecast',
    query: { latitude: 25.2854, longitude: 51.531, current: 'temperature_2m,wind_speed_10m,relative_humidity_2m', timezone: 'Asia/Qatar' },
    transform: `const b = data?.result || {}; const c = b.current || {};
return { temp: c.temperature_2m, wind: c.wind_speed_10m, humidity: c.relative_humidity_2m, time: c.time, label: c.temperature_2m != null ? ('Doha ' + Math.round(c.temperature_2m) + '°C · wind ' + Math.round(c.wind_speed_10m) + ' km/h') : 'Doha' };` });
  return DS;
}
window.buildCgbPulseGlobals = buildCgbPulseGlobals;
