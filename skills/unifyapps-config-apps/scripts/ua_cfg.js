// ua_cfg.js — build UnifyApps CONFIG (no-code) applications over REST from a signed-in tab.
//
// Paste the whole file into the browser JavaScript tool while the active tab is on the tenant
// (e.g. https://orbit.uat.unifyapps.com) and the user is signed in. It defines window.cfg.
// Nothing here stores or reads credentials: every call rides the tab's httpOnly session.
//
//   const V = cfg.vars({ region: ['string', ''], busy: ['boolean', 'false'] });   // -> { region: 'var_region', ... }
//   const page = cfg.page({ appId, name: 'Overview', slug: 'overview', vars: V.defs,
//     body: [ cfg.stack({ gap: 'gap-lg' }, [ cfg.text('Hello {{ userContext[\'name\'] }}', { variant: 'display-sm' }) ]) ] });
//   await cfg.savePage(page);
//
// Block trees are plain objects: { type, id?, name?, content, appearance, styles, children, body,
// item, tabs, events, visible, css }. cfg.flatten() turns a tree into the platform's flat block map
// and computes dpOn / dP / cP / dataSourceIds from every {{ }} expression, which is what makes a
// block re-render when its data source, variable or sibling block changes.
(() => {
  // ------------------------------------------------------------------ HTTP
  const api = async (method, path, body) => {
    const r = await fetch(path, { method, credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body) });
    const t = await r.text();
    if (!r.ok) throw new Error(`${method} ${path} -> HTTP ${r.status} ${t.slice(0, 500)}`);
    if (!t) return null;
    try { return JSON.parse(t); } catch { return t; }
  };
  const rand = (n = 5) => Array.from({ length: n }, () => 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 57)]).join('');
  const clone = o => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------------ dependency extraction
  // Scopes an expression can read. Data sources are e_<24 hex>; the global page id is not a scope.
  const REF = /\b(e_[0-9a-f]{24}|var_[A-Za-z0-9_]+|b_[A-Za-z0-9_]+|func_[A-Za-z0-9_]+|pageInputs|userContext|sessionStorage|localStorage|location|mediaUploads)((?:\s*\??\.?\s*\[\s*(?:'[^']*'|"[^"]*"|\d+)\s*\])*)/g;
  const normPath = s => s.replace(/\s+/g, '').replace(/\?\./g, '').replace(/\.\[/g, '[').replace(/\["([^"]*)"\]/g, "['$1']");
  function refsIn(str) {
    const out = [];
    for (const m of String(str).matchAll(/\{\{([\s\S]*?)\}\}/g)) {
      for (const r of m[1].matchAll(REF)) out.push({ id: r[1], p: r[1] + normPath(r[2] || '') });
    }
    return out;
  }
  // Walk an object; call cb(path, string) for every string that holds an expression.
  function walk(obj, base, cb) {
    if (obj == null) return;
    if (typeof obj === 'string') { if (obj.includes('{{')) cb(base, obj); return; }
    if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, `${base}[${i}]`, cb)); return; }
    if (typeof obj === 'object') for (const [k, v] of Object.entries(obj)) walk(v, base ? `${base}.${k}` : k, cb);
  }
  function condPaths(obj, base, acc) {
    if (!obj || typeof obj !== 'object') return acc;
    if (Array.isArray(obj)) { obj.forEach((v, i) => condPaths(v, `${base}[${i}]`, acc)); return acc; }
    for (const [k, v] of Object.entries(obj)) {
      const p = base ? `${base}.${k}` : k;
      if (k === 'conditions' && v && v.type === 'filter') acc.push({ p });
      else condPaths(v, p, acc);
    }
    return acc;
  }
  // Compute the dependency bookkeeping for one block, or for a data source / page function.
  function deps(target, roots) {
    const dP = []; const byId = new Map(); const ds = new Set();
    for (const [key, val] of Object.entries(roots)) {
      walk(val, key, (path, s) => {
        dP.push({ p: path });
        for (const r of refsIn(s)) {
          if (r.id === target.id) continue;
          if (!byId.has(r.id)) byId.set(r.id, new Set());
          byId.get(r.id).add(r.p);
          if (/^e_[0-9a-f]{24}$/.test(r.id)) ds.add(r.id);
        }
      });
    }
    return { dP, dpOn: [...byId].map(([id, ps]) => ({ id, p: [...ps] })), dataSourceIds: [...ds] };
  }

  // ------------------------------------------------------------------ conditions & actions
  const C = {
    // A single filter. value may itself be an expression: C.f("{{ b_x['value'] }}", 'EQUAL', 'A')
    f: (property, operator, value) => ({ property, filter: value === undefined ? { operator } : { operator, value } }),
    eq: (p, v) => C.f(p, 'EQUAL', v), ne: (p, v) => C.f(p, 'NOT_EQUAL', v), gt: (p, v) => C.f(p, 'GT', v),
    lt: (p, v) => C.f(p, 'LT', v), exists: p => C.f(p, 'EXISTS'), missing: p => C.f(p, 'MISSING'),
    and: (...filters) => ({ operator: 'AND', filters }), or: (...filters) => ({ operator: 'OR', filters }),
  };
  const act = (actionType, payload, extra = {}) => ({ id: 'act_' + rand(), actionType, executionType: 'delay', payload, ...extra });
  const A = {
    setVar: (variableId, value) => act('setPageVariable', { variableId, method: 'setPageVariable', operationDetails: { operation: 'SET', value } }),
    runDs: dataSourceId => act('controlDataSource', { dataSourceId, method: 'trigger' }),
    goto: (pageId, pageInputs = {}, history = 'push') => act('navigateToPage', { pageId, target: '_self', pageInputs, history, overridePageAnimation: false }),
    back: () => act('navigateBack', {}),
    url: (path, newTab = true) => act('navigate', { path, history: 'push', preserveSearchParams: false, target: newTab ? '_blank' : '_self' }),
    modal: (modalId, operation = 'show') => act('controlModal', { method: 'trigger', modalId, operation }),
    drawer: (drawerId, operation = 'show') => act('controlDrawer', { method: 'trigger', drawerId, operation }),
    notify: (title, type = 'success', description) => act('showNotification', { title, type, ...(description ? { description } : {}) }),
    script: script => act('executeScript', { script, method: 'trigger' }),
    fn: functionId => act('triggerFunction', { functionId }),
    emit: (eventType, eventPayload = {}) => act('emitPageEvent', { eventType, eventPayload }),
    copy: value => act('copyToClipboard', { value }),
    download: (url, fileName) => act('downloadFile', { url, fileName }),
    method: (blockId, methodName, methodPayload) => act('controlBlockMethod', { blockId, methodName, ...(methodPayload !== undefined ? { methodPayload } : {}) }),
    submitForm: formId => act('submitForm', { formId, method: 'trigger' }),
    setUrl: (pageInputs, merge = true) => act('setURLParameters', { pageInputs, mergeWithExistingQueryParams: merge, history: 'push' }),
    session: (path, value) => act('setInterfaceSessionStorage', { operation: 'SET_IN', path, value, method: 'trigger' }),
    local: (key, value) => act('setLocalStorage', { operation: 'SET', key, value, method: 'trigger' }),
    // Composition: A.then(a, b, c) runs b and c after a succeeds; A.fail(a, x) runs x if a fails;
    // A.when(a, C.eq(...)) runs a only if the condition holds; A.delay(a, ms).
    then: (a, ...next) => ({ ...a, onSuccessActions: [...(a.onSuccessActions || []), ...next] }),
    fail: (a, ...next) => ({ ...a, onErrorActions: [...(a.onErrorActions || []), ...next] }),
    when: (a, condition) => ({ ...a, runCondition: { type: 'filter', payload: condition.operator ? condition : C.and(condition) } }),
    delay: (a, ms) => ({ ...a, delayDuration: ms }),
  };
  // events: { onClick: action | [actions], onChange: ... }  ->  platform events array
  // Or pass a raw array [{eventType, action, targetId?, hidden?}] — targetId addresses one sub-control
  // of a block (e.g. the send button inside a CopilotInput).
  const toEvents = ev => Array.isArray(ev) ? ev.map(e => ({ id: 'evt_' + rand(), ...e }))
    : Object.entries(ev || {}).flatMap(([eventType, a]) => (Array.isArray(a) ? a : [a]).map(action => ({ id: 'evt_' + rand(), eventType, action })));

  // ------------------------------------------------------------------ block tree -> flat map
  const CONTAINERS = new Set(['Stack', 'Container', 'Pressable', 'Scrollable']);
  const SLOTTED = new Set(['Card', 'Modal', 'Drawer', 'ContextualDialog', 'BottomSheet']);
  const visibility = v => v === undefined || v === true ? { value: true } : v === false ? { value: false }
    : { value: 'conditions', conditions: { type: 'filter', payload: v.operator ? v : C.and(v) } };

  function flatten(node, parentId, out) {
    const id = node.id || 'b_' + rand();
    const component = { componentType: node.type, content: clone(node.content || {}), appearance: clone(node.appearance || {}) };
    if (node.styles) component.appearance.styles = { ...(component.appearance.styles || {}), ...node.styles };
    if (node.slots) component.slots = clone(node.slots);
    // Named slots holding block trees (Timeline.timelineItem, Copilot.followUpPrompts, PDFViewer.toolbar …)
    if (node.slotTrees) for (const [slot, tree] of Object.entries(node.slotTrees)) component.slots = { ...(component.slots || {}), [slot]: { blockId: flatten(tree, id, out), wrappedInLayout: true } };
    const block = { id, displayName: node.name || id.replace(/^b_/, ''), parentId, component, visibility: visibility(node.visible), v: 0 };
    if (node.events) block.events = toEvents(node.events);
    if (node.css) block.additional = { customCSS: node.css.replaceAll('&', `[data-block-id='${id}']`), isCustomCSSValid: true };
    // htmlAttributes: [{key, value}] → additional.htmlAttributes (aria-label, role, aria-level…) — lands on Typography and IconButton ✅ 2026-09-25
    if (node.htmlAttributes && node.htmlAttributes.length) block.additional = { ...(block.additional || {}), htmlAttributes: node.htmlAttributes };
    out[id] = block;
    if (CONTAINERS.has(node.type)) {
      component.content.blockIds = [...(node.children || []).map(c => flatten(c, id, out)), '__PLACEHOLDER__'];
    } else if (SLOTTED.has(node.type) && node.body) {
      component.slots = { ...(component.slots || {}), body: { blockId: flatten(node.body, id, out), wrappedInLayout: true } };
    } else if (node.type === 'Copilot' && node.input) {
      component.slots = { ...(component.slots || {}), messageInputPanel: { blockId: flatten(node.input, id, out), wrappedInLayout: true } };
    } else if (['Repeatable', 'Kanban', 'Carousel', 'OrganizationChart', 'TreeView'].includes(node.type) && node.item) {
      // item template rendered per row/card; it reads {{ <thisId>['context']['item'] }}
      component.content.blockId = flatten(node.item, id, out);
    } else if (node.type === 'Tabs' && node.tabs) {
      component.content.items = node.tabs.map((t, i) => { const tid = t.id || `tab_${i + 1}`;
        return { id: tid, value: tid, label: t.label, disabled: false, error: false, visibility: { value: true }, blockId: flatten(t.body, id, out) }; });
      component.content.tabType = component.content.tabType || 'manual';
      component.content.defaultValue = component.content.defaultValue || component.content.items[0]?.id;
    }
    const d = deps(block, { content: component.content, appearance: component.appearance, visibility: block.visibility });
    block.dataSourceIds = d.dataSourceIds; block.dpOn = d.dpOn;
    if (d.dP.length) block.dP = d.dP.filter(x => !x.p.startsWith('content.blockIds'));
    const cP = condPaths({ visibility: block.visibility, appearance: component.appearance }, '', []);
    if (cP.length) block.cP = cP;
    return id;
  }

  // ------------------------------------------------------------------ block helpers
  // Style tokens are the platform's Tailwind-like classes (gap-md, p-xl, bg-primary, rounded-lg,
  // w-full, h-full) or {custom: '<css value>'}. Anything the tokens cannot express goes in css:
  // '& { ... }' — '&' becomes [data-block-id='<id>'].
  const cfg = {};
  const typo = (value, o = {}) => ({ type: 'Typography', content: { type: o.markdown ? 'MARKDOWN' : 'PLAIN_TEXT', value },
    appearance: { variant: o.variant || 'text-sm', weight: o.weight || 'regular', color: o.color || 'text-primary', align: o.align || 'left', ...(o.appearance || {}) }, ...o.node });
  Object.assign(cfg, {
    api, rand, clone, C, A, refsIn, deps, flatten, toEvents,
    stack: (o = {}, children = []) => ({ type: 'Stack', ...o.node, id: o.id, name: o.name, visible: o.visible, events: o.events, css: o.css, children,
      appearance: { direction: o.dir || 'column', alignItems: o.align || 'stretch', justifyContent: o.justify || 'flex-start', wrapContent: !!o.wrap, reverseOrder: false, theme: o.theme || 'inherit' },
      styles: { width: 'w-full', gap: { all: o.gap || 'gap-md' }, ...(o.p ? { padding: { all: o.p } } : {}), ...(o.bg ? { backgroundColor: o.bg } : {}), ...(o.styles || {}) } }),
    row: (o = {}, children = []) => cfg.stack({ ...o, dir: 'row', align: o.align || 'center' }, children),
    text: (value, o = {}) => ({ ...typo(value, o), id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events, htmlAttributes: o.htmlAttributes }),
    md: (value, o = {}) => cfg.text(value, { ...o, markdown: true }),
    button: (label, o = {}) => ({ type: 'Button', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events,
      content: { contentMode: 'text', value: label, type: 'default' },
      appearance: { variant: o.variant || 'solid', color: o.color || 'brand', size: o.size || 'md', ...(o.icon ? { startDecorator: o.icon } : {}), ...(o.loading ? { loading: o.loading } : {}), ...(o.disabled ? { disabled: o.disabled } : {}), styles: o.styles || {} } }),
    // label becomes the accessible name (additional.htmlAttributes aria-label): the platform's default name is the ICON name.
    // hit44 (default on): a 44 px minimum hit target — size 'sm' renders 28 px. Verified 2026-09-25 (API-SPEC §51.5).
    iconButton: (icon, o = {}) => ({ type: 'IconButton', id: o.id, name: o.name, visible: o.visible, events: o.events,
      css: `${o.hit44 === false ? '' : '& { min-width: 44px; min-height: 44px; }'} ${o.css || ''}`.trim() || undefined,
      htmlAttributes: [...(o.label ? [{ key: 'aria-label', value: o.label }] : []), ...(o.htmlAttributes || [])],
      content: { icon, ...(o.label ? { label: o.label } : {}) }, appearance: { variant: o.variant || 'ghost', color: o.color || 'neutral', size: o.size || 'sm', ...(o.disabled ? { disabled: o.disabled } : {}) } }),
    icon: (icon, o = {}) => ({ type: 'Icon', id: o.id, visible: o.visible, css: o.css, content: { icon }, appearance: { size: o.size || 'sm', variant: 'transparent', transparent: { color: o.color || 'text-primary' } } }),
    tag: (label, o = {}) => ({ type: 'Tag', id: o.id, visible: o.visible, css: o.css, content: { label },
      appearance: { size: o.size || 'sm', variant: o.variant || 'soft', shape: 'rounded', color: o.color || 'neutral', ...(o.dot ? { decorators: { statusDot: true } } : {}) } }),
    divider: (o = {}) => ({ type: 'Divider', id: o.id, visible: o.visible, appearance: { orientation: o.vertical ? 'vertical' : 'horizontal' } }),
    image: (src, o = {}) => ({ type: 'Image', id: o.id, visible: o.visible, css: o.css, content: { src, alt: o.alt || '', type: 'URL' }, appearance: { objectFit: o.fit || 'object-contain' }, styles: o.styles || {} }),
    loader: (o = {}) => ({ type: 'Loader', id: o.id, visible: o.visible, content: {}, appearance: { type: 'DEFAULT', size: o.size || 'sm' } }),
    alert: (description, o = {}) => ({ type: 'Alert', id: o.id, visible: o.visible, content: { title: o.title || '', description, descriptionType: 'MARKDOWN' },
      appearance: { variant: o.variant || 'info', startDecorator: o.icon || 'InfoCircle', styles: { width: 'w-full' } } }),
    // StatCard: type NUMBER | PERCENT | CURRENCY | STRING. value is usually an expression.
    stat: (label, value, o = {}) => ({ type: 'StatCard', id: o.id, visible: o.visible, css: o.css, events: o.events,
      content: { label, value, type: o.kind || 'NUMBER', decimalPlaces: o.dp ?? 1, notation: 'standard', style: 'decimal', enableTrendColor: false, thresholdValue: 0, invertTrend: false, ...(o.description ? { description: o.description } : {}), addOns: {} },
      appearance: { size: o.size || 'md', label: { variant: 'text-sm', weight: 'medium', color: o.labelColor || 'text-tertiary', truncate: true },
        value: { variant: o.valueVariant || 'display-sm', weight: 'semi-bold', color: o.valueColor || 'text-primary' },
        description: { variant: 'text-xs', weight: 'regular', color: 'text-quaternary' },
        styles: { width: 'w-full', padding: { all: 'p-lg' }, ...(o.styles || {}) } } }),
    progress: (value, o = {}) => ({ type: 'ProgressBar', id: o.id, visible: o.visible, css: o.css,
      content: { type: o.circle ? 'Circle' : 'Line', progress: value, min: 0, max: o.max ?? 100, decimalPlaces: o.dp ?? 0, notation: 'standard', ...(o.label ? { label: o.label } : {}) },
      appearance: { color: o.color || 'var(--palette-brand-500)', trackColor: o.track || 'var(--palette-gray-300)', size: o.size || 'sm', styles: o.styles || { width: 'w-full' } } }),
    // Chart. data: expression -> array of rows. x: row key for the x axis. series: [{key, label, color?}].
    chart: (data, o = {}) => {
      const series = (o.series || []).map((s, i) => ({ id: s.id || `series_${i + 1}`, label: s.label || s.key,
        value: { path: s.key, key: s.key, originalPath: s.key, originalKey: s.key }, dataLabels: { enabled: !!o.labels },
        appearance: { visibility: { value: true }, ...(o.type === 'LINE' || o.type === 'AREA' ? { line: { lineWidth: 2, fillUnderLine: o.type === 'AREA' ? 'gradient' : 'none', showPointMarkers: true } } : {}) } }));
      const colours = Object.fromEntries((o.series || []).map((s, i) => [s.id || `series_${i + 1}`, s.color || ['var(--palette-brand-500)', 'var(--palette-brand-300)', 'var(--palette-warning-500)', 'var(--palette-error-500)'][i % 4]]));
      return { type: 'Chart', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events,
        content: { chartType: o.type === 'AREA' ? 'LINE' : (o.type || 'BAR'), data,
          xAxis: { label: o.xLabel || '', plotPeriodicValues: false, scale: 'category', tickLabels: {}, xAxisValue: { path: o.x, key: o.x, originalPath: o.x, originalKey: o.x } },
          yAxis: { seriesMode: 'MANUAL', label: o.yLabel || '', series, tickLabels: { type: o.yType || 'NUMBER', notation: 'standard', decimalPlaces: o.yDp ?? 0 }, ...(o.yDomain ? { domain: o.yDomain } : {}) },
          summary: { items: [] }, yAxisRight: { series: [] } },
        appearance: { legends: { position: o.legend || 'top' }, stacked: !!o.stacked, interpolation: 'monotoneX', ...(o.horizontal ? { layout: 'horizontal' } : {}),
          xAxis: { gridLines: { enabled: false }, axisLine: { enabled: true }, ticks: { enabled: true }, labelsOrientation: 'horizontal' },
          yAxis: { gridLines: { enabled: true }, axisLine: { enabled: false }, ticks: { enabled: true } },
          chartColours: { colourBy: 'SERIES', colourMapping: colours },
          styles: { width: { custom: '100%' }, height: { custom: o.height || '260px' }, padding: { all: 'p-sm' } } } };
    },
    // Table. columns: [{key, label, type?: TEXT|NUMBER|TAG|DATE, width?, colors?: {value: color}}]
    table: (data, columns, o = {}) => ({ type: 'Table', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events,
      content: { data, source: 'mapped', rowSelection: o.select || 'NONE', identifier: { path: o.idKey || 'id', key: o.idKey || 'id' }, rowActions: o.rowActions || [], bulkActions: [],
        columns: columns.map((c, i) => ({ id: c.id || `col_${i + 1}`, label: c.label, type: c.type || 'TEXT', fieldKey: { path: c.key, key: c.key },
          ...(c.colors ? { addOns: { colorMapping: c.colors, labelMapping: c.labels || {} } } : {}),
          columnComponentProps: { appearance: { width: c.width || 160, minWidth: c.minWidth || 90, ...(c.grow ? { grow: true } : {}), ...(c.type === 'TAG' ? { tagColorvariant: 'soft' } : {}) } } })),
        addOns: { layoutMode: 'grid', ...(o.pageSize ? { page: { type: 'PAGINATION', size: o.pageSize } } : {}) } },
      appearance: { rowHeight: o.rowHeight || 'comfortable', gridLineAxis: 'xBetween', enableStickyHeader: true, styles: { width: 'w-full', ...(o.styles || {}) } } }),
    // Repeatable: item is ONE block tree rendered per row; inside it read the row as
    // {{ <repeatableId>['context']['item']['field'] }} — so the repeatable needs an explicit id.
    repeat: (id, data, item, o = {}) => ({ type: 'Repeatable', id, name: o.name, visible: o.visible, css: o.css, item,
      content: { data, primaryKey: { key: o.key || '__index__', path: o.key || '__index__', originalKey: o.key || '__index__', originalPath: o.key || '__index__' }, autoSelect: 'none', scrollable: false },
      appearance: { layout: o.grid ? 'grid' : 'list', direction: o.horizontal ? 'horizontal' : 'vertical', ...(o.grid ? { columns: o.grid } : {}), separator: { enabled: false }, styles: { width: 'w-full', gap: { all: o.gap || 'gap-md' } } } }),
    card: (body, o = {}) => ({ type: 'Card', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events, body,
      content: { collapsible: { enabled: false, isInitiallyExpanded: true } },
      appearance: { showDivider: false, theme: o.theme || 'inherit', styles: { width: 'w-full', padding: { all: o.p || 'p-lg' }, borderRadius: { all: o.radius || 'rounded-xl' }, ...(o.styles || {}) } } }),
    // Modal/Drawer: leave the BLOCK visible — open/closed is the overlay's own state, driven by
    // A.modal/A.drawer. visibility:false removes the block, and controlModal 'show' then does nothing.
    modal: (id, body, o = {}) => ({ type: 'Modal', id, name: o.name, visible: o.visible, css: o.css, body,
      content: { variant: 'card', hideOnEscape: true, hideOnClickOutside: o.clickOutside !== false, pageId: '' },
      appearance: { width: { custom: o.width || '560px' }, height: 'h-auto', styles: { borderRadius: { all: 'rounded-xl' } } } }),
    // Drawer with inline content: variant 'card' (variant 'page' renders ANOTHER page, given content.pageId,
    // and shows an empty panel if you give it a body slot instead).
    drawer: (id, body, o = {}) => ({ type: 'Drawer', id, name: o.name, visible: o.visible, css: o.css, body,
      content: { variant: 'card', containerId: 'root_id', hideOnClickOutside: true, allowResize: true },
      appearance: { position: o.position || 'right', type: 'fixed', defaultHeight: 'h-full', defaultWidth: { custom: o.width || '480px' },
        // o.backdrop {backgroundColor, blurRadius} tints it; the Drawer stays modal either way (showBackdrop:false still blocks the page) — API-SPEC §51.8
        backdrop: { showBackdrop: true, backdropStyles: { backgroundColor: o.backdrop?.backgroundColor || 'var(--palette-background-backdrop)', blurRadius: o.backdrop?.blurRadius ?? 8 } }, styles: {} } }),
    tabs: (tabs, o = {}) => ({ type: 'Tabs', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events, tabs,
      content: {}, appearance: { variant: o.variant || 'line', tabItemAppearance: { variant: 'text-sm', weight: 'semi-bold' }, styles: { width: 'w-full', gap: { all: 'gap-lg' } } } }),
    select: (options, o = {}) => ({ type: 'SingleSelect', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events,
      content: Array.isArray(options)
        ? { optionsType: 'STATIC', options: options.map(x => (typeof x === 'string' ? { value: x, label: x } : x)), placeholder: o.placeholder || 'Select…', label: o.label || '', ...(o.default !== undefined ? { defaultValue: o.default } : {}) }
        : { optionsType: 'DYNAMIC', options, placeholder: o.placeholder || 'Select…', label: o.label || '', ...(o.default !== undefined ? { defaultValue: o.default } : {}) },
      appearance: { size: o.size || 'md', styles: { width: 'w-full', maxWidth: 'none', ...(o.styles || {}) } } }),
    input: (o = {}) => ({ type: 'TextInput', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events,
      content: { placeholder: o.placeholder || '', ...(o.default !== undefined ? { defaultValue: o.default } : {}), ...(o.label ? { label: o.label } : {}), addOns: o.search ? { prefixIcon: { name: 'SvgSearchMd', visibility: { value: true } } } : {} },
      appearance: { size: o.size || 'md', variant: 'outlined', styles: { width: 'w-full' } } }),
    textarea: (o = {}) => ({ type: 'TextArea', id: o.id, name: o.name, visible: o.visible, events: o.events,
      content: { placeholder: o.placeholder || '', ...(o.default !== undefined ? { defaultValue: o.default } : {}) }, appearance: { minRows: o.rows || 3, maxRows: 8, size: 'md' } }),
    // Form from a flat field list: [{key, title, type: string|number|select|textarea, options?, required?}]
    form: (id, fields, o = {}) => {
      const props = {}, layout = { 'ui:order': fields.map(f => f.key) }, required = fields.filter(f => f.required).map(f => f.key);
      for (const f of fields) {
        if (f.type === 'select') { props[f.key] = { type: 'string', title: f.title, oneOf: f.options.map(x => (typeof x === 'string' ? { const: x, title: x } : x)) }; layout[f.key] = { 'ua:fieldType': 'SINGLE_SELECT', 'ui:widget': 'SelectWidget', 'ui:label': f.title, 'ua:width': f.width || '100%' }; }
        else if (f.type === 'number') { props[f.key] = { type: 'number', title: f.title }; layout[f.key] = { 'ua:fieldType': 'NUMBER', 'ui:label': f.title, 'ua:width': f.width || '100%' }; }
        else if (f.type === 'textarea') { props[f.key] = { type: 'string', title: f.title }; layout[f.key] = { 'ua:fieldType': 'STRING', 'ui:widget': 'TextareaWidget', 'ui:label': f.title, 'ua:width': '100%' }; }
        else { props[f.key] = { type: 'string', title: f.title }; layout[f.key] = { 'ua:fieldType': 'STRING', 'ui:label': f.title, 'ui:placeholder': f.placeholder || '', 'ua:width': f.width || '100%' }; }
        if (f.default !== undefined) props[f.key].default = f.default;
      }
      layout['ua:wrap'] = true;
      return { type: 'Form', id, name: o.name, visible: o.visible, css: o.css, events: o.events,
        content: { source: 'custom', fieldsType: 'manual', schema: { schema: { type: 'object', additionalProperties: false, properties: props, required }, layout }, ...(o.initial ? { initialFormData: o.initial } : {}) },
        appearance: { layout: 'column', fieldTitle: { variant: 'text-sm', weight: 'medium', color: 'text-secondary' }, fieldDescription: { variant: 'inline' }, styles: { width: 'w-full' } } };
    },
    // KeyValue: fields [{label, value}]
    kv: (fields, o = {}) => ({ type: 'KeyValue', id: o.id, visible: o.visible, css: o.css,
      content: { fields: fields.map((f, i) => ({ id: `kv_${i + 1}`, content: { label: f.label, type: 'STRING', value: f.value, editable: { value: false } } })) },
      appearance: { groupLayout: 'LIST', columns: o.columns || 1, size: 'md', divider: { enabled: true }, label: { position: 'LEFT', widthRatio: '1_1', valueAlignment: 'RIGHT' } } }),
    iframe: (src, o = {}) => ({ type: 'Iframe', id: o.id, visible: o.visible, css: o.css, content: o.html ? { srcDoc: src } : { src }, appearance: { styles: { width: 'w-full', height: { custom: o.height || '320px' } } } }),
    // Native agent chat. aiAgentId = the ai_agent entity id. runtimeContext is extra context text
    // the agent receives with every message (expressions allowed).
    // The chat INPUT is a separate CopilotInput block in the Copilot's messageInputPanel slot — without
    // it the Copilot renders a header and no box. Its send button runs
    // controlBlockMethod(<copilotId>, 'submitMessage', {message}), and so can ANY button on the page:
    // A.method(copilotId, 'submitMessage', { message: '...' }) asks the agent a question for the user.
    copilotInput: (copilotId, o = {}) => { const id = o.id || `${copilotId}_in`; const send = 'messageInputAct_send';
      return { type: 'CopilotInput', id, content: { placeholder: o.placeholder || 'Ask anything…', mode: 'comfortable', enterKeyBehavior: 'SEND_MESSAGE', linkedBlockId: copilotId, autoFocus: !!o.autoFocus, autocomplete: false,
          actions: [
            // o.attachments: a paperclip that lets the user attach files; they travel with submitMessage.
            ...(o.attachments ? [{ id: 'messageInputAct_attach', label: 'Add Attachments', alignment: 'start', type: 'STANDARD', action: 'addAttachments', icon: 'Plus',
              supportedFileTypes: ['application/*', 'text/*', 'image/*', 'text/markdown', '.tsv'], multipleFiles: true }] : []),
            { id: send, label: 'Send message', icon: 'ArrowUp', variant: 'icon', alignment: 'end', type: 'STANDARD', action: 'sendMessage' }] },
        appearance: { attachmentListAlignment: 'top', minNumberOfLines: 1, styles: { width: 'w-full' } },
        events: [
          { eventType: 'onClick', targetId: send, hidden: true, action: A.when(A.method(copilotId, 'stopResponseGeneration', {}), C.eq(`{{ Boolean(${copilotId}['isGeneratingResponse']) }}`, 'true')) },
          { eventType: 'onClick', targetId: send, action: A.when(A.method(copilotId, 'submitMessage', { message: `{{ ${id}['value'] }}`, ...(o.attachments ? { attachments: `{{ ${id}['attachments'] }}` } : {}) }), C.ne(`{{ ${copilotId}['isGeneratingResponse'] }}`, 'true')) }] }; },
    copilot: (aiAgentId, o = {}) => ({ type: 'Copilot', id: o.id || 'b_copilot', name: o.name, visible: o.visible, css: o.css, events: o.events,
      input: o.input === false ? undefined : cfg.stack({ p: 'p-sm' }, [cfg.copilotInput(o.id || 'b_copilot', { placeholder: o.placeholder, attachments: o.attachments })]),
      content: { variant: 'AI_AGENT', aiAgentId, welcomeText: o.welcome || 'How can I help?', shouldPollInfinitely: true, maxPollDuration: 1800000, enableCycleThinkingWords: true, showJumpToLatest: true,
        ...(o.context ? { runtimeContext: o.context } : {}), allowedSpaceRoleIds: [],
        voiceModeParams: { separateVoiceMode: true, fetchInitialMessagesOnConnect: false, enableVideo: false, enableScreenshare: false, separateVoiceModeControls: false } },
      appearance: { size: o.size || 'sm', styles: { width: 'w-full', height: o.height ? { custom: o.height } : 'h-full', position: 'relative', backgroundColor: 'bg-inherit' } } }),
    // A custom component instance. componentType = the component's manifest.type.
    custom: (componentType, entityId, data, o = {}) => ({ type: componentType, id: o.id, name: o.name, visible: o.visible, events: o.events,
      css: o.css || `& { height: ${o.height || '360px'}; } & iframe { height: 100% !important; }`,
      content: { type: 'CUSTOM_BLOCK_TYPE', entityId, version: o.version || '-1', data } }),
    module: (moduleId, appId, inputs = {}, o = {}) => ({ type: 'Module', id: o.id, visible: o.visible, content: { moduleId, moduleInterfaceRecordId: appId, inputs }, appearance: { styles: { width: 'w-full' } } }),
  });

  // ------------------------------------------------------------------ variables & functions
  // cfg.vars({ region: ['string', ''] }) -> { region: 'var_region', defs: {...} }
  cfg.vars = spec => {
    const out = { defs: {} };
    for (const [name, [type, initial]] of Object.entries(spec)) {
      const id = 'var_' + name;
      out[name] = id;
      out.defs[id] = { id, name, type, ...(initial !== undefined ? { initialValue: String(initial) } : {}) };
    }
    return out;
  };
  // cfg.fns({ fmt: 'return {{ var_x[\'value\'] }} * 2' }) -> { fmt: 'func_fmt', defs }
  cfg.fns = spec => {
    const out = { defs: {} };
    for (const [name, body] of Object.entries(spec)) {
      const id = 'func_' + name; out[name] = id;
      const d = deps({ id }, { functionBody: body });
      out.defs[id] = { id, name, functionBody: body, runBehaviour: 'manual', dataSourceIds: d.dataSourceIds, dpOn: d.dpOn };
    }
    return out;
  };

  // ------------------------------------------------------------------ pages
  const rootStack = (id, name, kids, styles, visible) => ({ id, displayName: name, dataSourceIds: [], dpOn: [], additional: { isRootBlock: true },
    visibility: { value: visible }, component: { componentType: 'Stack', content: { blockIds: [...kids, '__PLACEHOLDER__'] },
      appearance: { direction: id === 'root_id' ? 'column' : 'row', alignItems: 'stretch', justifyContent: 'flex-start', wrapContent: false, reverseOrder: false, theme: 'inherit',
        styles: { width: 'w-full', flexWrap: 'flex-nowrap', gap: { all: 'gap-md' }, padding: { all: 'p-xl' }, ...styles } } } });

  // spec: { appId, id?, name, slug, body: [trees], overlays: [modal/drawer trees], vars: V.defs,
  //         fns: F.defs, onLoad: [actions], inputs: {name: 'string'|'number'}, rootStyles, header: [trees],
  //         events: [{eventType, label, payload?}] (page events other blocks can emit),
  //         customBlocks: { blockId: entityId } (set automatically for cfg.custom blocks) }
  cfg.page = spec => {
    const blocks = {};
    const body = (spec.body || []).map(t => flatten(t, 'root_id', blocks));
    const overlays = (spec.overlays || []).map(t => flatten(t, 'root_id', blocks));
    const header = (spec.header || []).map(t => flatten(t, 'header_id', blocks));
    blocks.root_id = rootStack('root_id', 'body', [...body, ...overlays], { height: 'h-full', backgroundColor: 'bg-workspace', ...(spec.rootStyles || {}) }, true);
    if (spec.rootCss) blocks.root_id.additional.customCSS = spec.rootCss.replaceAll('&', "[data-block-id='root_id']");
    blocks.header_id = rootStack('header_id', 'header', header, {}, header.length > 0);
    blocks.footer_id = rootStack('footer_id', 'footer', [], {}, false);
    const counter = {};
    Object.values(blocks).forEach(b => { const t = b.component.componentType; counter[t] = (counter[t] || 0) + 1; });
    const custom = {};
    Object.values(blocks).forEach(b => { if (b.component.content?.type === 'CUSTOM_BLOCK_TYPE') custom[b.id] = { entityId: b.component.content.entityId, version: -1 }; });
    const props = {
      componentType: 'PAGE', interfaceId: spec.appId, interfaceType: 'application', name: spec.name, slug: spec.slug,
      publicAccess: !!spec.public, layout: { header: 'header_id', body: 'root_id', footer: 'footer_id' }, blocks,
      pageVariables: spec.vars || {}, pageFunctions: spec.fns || {}, dataSources: {},
      flags: { shouldUseBuiltDependencies: true }, documentTitle: spec.title || spec.name,
      metadata: { _version: 2, _blockCounter: counter },
      ...(Object.keys(custom).length ? { customBlocksVersionsMap: custom } : {}),
      ...(spec.onLoad ? { interactions: { events: spec.onLoad.map(a => ({ id: 'evt_' + rand(), eventType: 'onPageLoad', action: a })) } } : {}),
      ...(spec.events ? { events: spec.events.map(e => ({ payload: e.payload || {}, eventType: e.eventType, label: e.label || e.eventType })) } : {}),
      ...(spec.inputs ? { inputSchema: { type: 'SCHEMA_AND_LAYOUT', dynamic: false,
        schema: { type: 'object', additionalProperties: false, required: [], properties: Object.fromEntries(Object.entries(spec.inputs).map(([k, t]) => [k, { type: t, title: k }])) },
        layout: { 'ui:order': Object.keys(spec.inputs) } } } : {}),
    };
    return { id: spec.id, entityType: 'e_component', properties: props };
  };

  // Create (no id) or replace (id) a page. Returns the saved page entity.
  cfg.savePage = async page => {
    if (!page.id) {
      const r = await api('POST', '/api/entity', { entityType: 'e_component', properties: page.properties });
      return r;
    }
    const cur = await api('GET', `/api/entity/e_component/${page.id}`);
    const saved = await api('POST', '/api/entity/create-update-or-delete/hierarchical', {
      entity: { ...cur, properties: { ...cur.properties, ...page.properties } }, requestType: 'UPDATED',
      parentEntities: [{ type: 'e_interface', id: page.properties.interfaceId }] });
    return Array.isArray(saved) ? saved[0] : saved;
  };

  // ------------------------------------------------------------------ data sources
  const resVersion = {};
  cfg.resourceVersion = async (app, resource) => {
    const k = app + '/' + resource;
    if (!resVersion[k]) resVersion[k] = (await api('GET', `/api/workflow-builder/node/${app}/resource/${resource}`)).version;
    return resVersion[k];
  };
  const ADV = { auto: { runBehaviour: 'automatic', refetchOnWindowFocus: false, timing: { runQueryOnPageLoad: true, runQueryPeriodically: false } },
    manual: { runBehaviour: 'manual', refetchOnWindowFocus: false, timing: { runQueryOnPageLoad: false, runQueryPeriodically: false } } };
  // Generic: any connector action. ctx = {appName, resourceName, connectionId?}. inputs may hold {{ }}.
  // opts: { run: 'auto'|'manual', transform: 'js returning the new data (input is `data`)', onSuccess: [actions], onError: [actions], outputSchema }
  // disabledWhen: a condition (C.eq / C.and ...) — while it holds, an automatic data source does NOT run.
  // This is how to make a data source wait for other data sources (advancedOptions.queryDisabled):
  // an onPageLoad chain "runDs(A) then runDs(B)" evaluates B's inputs BEFORE A's data is in the store.
  cfg.createDs = async ({ appId, pageId, name, ctx, inputs, run = 'auto', transform, onSuccess, onError, outputSchema, poll, disabledWhen, dry }) => {
    const context = { appName: ctx.appName, resourceName: ctx.resourceName, resourceVersion: ctx.resourceVersion || await cfg.resourceVersion(ctx.appName, ctx.resourceName), ...(ctx.connectionId ? { connectionId: ctx.connectionId } : {}) };
    const advancedOptions = { ...clone(ADV[run] || ADV.auto), ...(poll ? { timing: { runQueryOnPageLoad: true, runQueryPeriodically: true, interval: poll } } : {}),
      ...(disabledWhen ? { queryDisabled: { type: 'filter', payload: disabledWhen.operator ? disabledWhen : C.and(disabledWhen) } } : {}) };
    const d = deps({ id: '__ds__' }, { inputs, ...(disabledWhen ? { advancedOptions } : {}) });
    const props = { name, type: 'APPLICATION', interfaceId: appId, interfacePageId: pageId || `e_global_${appId}`, context, inputs,
      dP: d.dP.filter(x => !x.p.startsWith('advancedOptions')), dpOn: d.dpOn, metadata: { isManuallyRenamed: true },
      advancedOptions,
      options: { cacheConfig: {}, ...(transform ? { transformerConfig: { enabled: true, includeOriginalOutput: false, id: 'transformer', type: 'javascript', fallbackMode: 'FAIL',
        context: { type: 'APPLICATION', appName: 'code_by_unifyapps', resourceName: 'code_by_unifyapps_javascript' }, inputs: { code: transform, compile_static: false } } } : {}) },
      callbacks: { successEvents: toEvents({ onSuccess: onSuccess || [] }), failureEvents: toEvents({ onFailure: onError || [] }) },
      ...(outputSchema ? { outputSchema } : {}), ...(!pageId ? { target: 'app' } : {}) };
    if (dry) return props;
    return api('POST', '/api/entity', { entityType: 'e_data_source', properties: props });
  };
  // Idempotent: create the data source, or overwrite the one with the same name on the same page.
  // maker = one of cfg.dsFetch / dsAutomation / dsHttp / dsCreateRecord / createDs. Returns the id.
  cfg.ensureDs = async (maker, spec) => {
    const props = await maker({ ...spec, dry: true });
    const existing = (await cfg.dataSources([props.interfacePageId])).find(d => d.properties.name === props.name);
    if (!existing) return (await api('POST', '/api/entity', { entityType: 'e_data_source', properties: props })).id;
    await api('POST', '/api/entity/update', { ...existing, properties: props });
    return existing.id;
  };
  // Read an object (storage). filter: C.and(...) with property 'properties_<field>' (NOTE the underscore form).
  cfg.dsFetch = async ({ appId, pageId, name, object, filter, limit = 200, sort, single, ...rest }) => cfg.createDs({ appId, pageId, name, ...rest,
    ctx: { appName: 'storage_by_unifyapps', resourceName: 'storage_by_unifyapps_fetch_records' },
    inputs: { object_type: object, triggerInputCondition: filter || {}, numberOfRecordsToFetch: single ? 'SINGLE' : 'MULTIPLE',
      page: { paginateBy: 'OFFSET', limit }, sortBy: sort || [], includeTotalCount: true, shouldSearchInAnalyticsStore: false,
      includeRoleMappings: false, includeCurrentUserPermissions: false, translationsOption: 'DEFAULT', readThroughSessionVariables: false, fields: [], fetchDeployedEntity: false } });
  cfg.dsCreateRecord = async ({ appId, pageId, name, object, record, ...rest }) => cfg.createDs({ appId, pageId, name, run: 'manual', ...rest,
    ctx: { appName: 'storage_by_unifyapps', resourceName: 'storage_by_unifyapps_create_record' },
    inputs: { object_type: object, record, writeThroughSessionVariables: false } });
  // Call a deployed CALLABLE automation. params: { name: value-or-{{expr}} }
  cfg.dsAutomation = async ({ appId, pageId, name, automationId, params, ...rest }) => cfg.createDs({ appId, pageId, name, ...rest,
    ctx: { appName: 'callables', resourceName: 'callables_call_automation' },
    inputs: { automationId, version: '-1', runtimeConnections: {}, parameters: params || {}, synchronous: true } });
  // Plain HTTP call through the Custom HTTP connector — no connection needed for a public API.
  // The URL is split: baseUrl + path, with query params as [{key, value}] (a single `url` field
  // fails "Base URL must start with http(s)"). Output: data = {status, result: <parsed body>}.
  cfg.dsHttp = async ({ appId, pageId, name, baseUrl, path = '/', method = 'GET', query = {}, headers = {}, ...rest }) => cfg.createDs({ appId, pageId, name, ...rest,
    ctx: { appName: 'custom_http_endpoint', resourceName: 'custom_http_endpoint_execute' },
    inputs: { baseUrl, path, httpMethod: method, queryParamsList: Object.entries(query).map(([key, value]) => ({ key, value: String(value) })),
      headersList: Object.entries(headers).map(([key, value]) => ({ key, value })), pathParamsList: [],
      httpVersion: 'HTTP_2', responseContentType: 'HEADER_BASED', followRedirects: 'NORMAL', isAsync: false, enableProxy: false,
      requestTimeoutInSecs: -1, authType: 'NO_AUTH', requestContentType: 'application/json', ignoreTrailingSlashes: false, connectionType: 'DIRECT', sslVerify: true } });
  // Execute a data source the way a page does (design-time check). overrides replace templated inputs.
  cfg.runDs = async (dsId, overrides = {}) => {
    const ds = await api('GET', `/api/entity/e_data_source/${dsId}`);
    const p = ds.properties; const inputs = clone(p.inputs);
    const setPath = (o, path, v) => { const ks = path.split('.'); let x = o; ks.slice(0, -1).forEach(k => { x = x[k] = x[k] ?? {}; }); x[ks.at(-1)] = v; };
    for (const [path, v] of Object.entries(overrides)) setPath(inputs, path, v);
    return api('POST', `/api/workflow/execute/node?name=${encodeURIComponent(p.name)}&requestId=${dsId}`, { context: p.context, id: dsId, inputs, options: {} });
  };

  // ------------------------------------------------------------------ app, theme, navigation, publish
  // Theme: a brand seed colour becomes the platform's --palette-brand-* scale.
  cfg.palette = (hex, prefix = 'brand') => {
    const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const mix = (t, w) => '#' + c.map(v => Math.round(v + (t - v) * w).toString(16).padStart(2, '0')).join('');
    const steps = { 25: [255, .96], 50: [255, .92], 100: [255, .84], 200: [255, .68], 300: [255, .5], 400: [255, .28], 500: [255, .12], 600: [0, 0], 700: [0, .18], 800: [0, .34], 900: [0, .5], 950: [0, .66] };
    const out = {};
    for (const [k, [t, w]] of Object.entries(steps)) out[`--palette-${prefix}-${k}`] = mix(t, w);
    out[`--palette-${prefix}-600-seed`] = hex;
    return out;
  };
  cfg.createTheme = async ({ name, brand, secondary, scheme = 'light', extra = {} }) => {
    const vars = { ...cfg.palette(brand), ...(secondary ? cfg.palette(secondary, 'brand-secondary') : {}), ...extra };
    return api('POST', '/api/entity', { entityType: 'e_theme', properties: { name, standard: false, defaultScheme: scheme, cssVars: { ...vars, dark: { ...vars } }, styleOverrides: {} } });
  };
  const navAppearance = () => {
    const bar = (pos, type, nav) => ({ position: pos, type: 'fixed', navigatorType: nav, overflowDetails: { icon: 'Menu01', label: 'More' } });
    const side = { styles: { width: { custom: '56px' }, height: 'h-auto', borderWidth: { r: 'border-e' }, borderColor: 'border-secondary', borderRadius: { all: 'rounded-none' }, gap: { y: 'gap-y-3xl' }, padding: { t: 'pt-lg' }, gapSecondary: { y: 'gap-y-lg' } } };
    return {
      SM: { primary: [], secondary: [], navigationBar: bar('bottom', 'fixed', 'BottomTabsNavigator'), navigationItem: { selectionVariant: 'stroke', labelVariant: 'none' }, styles: { width: 'w-auto', height: { custom: '56px' }, borderWidth: { t: 'border-t' }, borderColor: 'border-secondary', borderRadius: { all: 'rounded-none' }, padding: { all: 'p-0' } } },
      MD: { primary: [], secondary: [], navigationBar: bar('start', 'fixed', 'Standard'), navigationItem: { selectionVariant: 'stroke', labelVariant: 'none' }, ...side },
      LG: { primary: [], secondary: [], navigationBar: bar('start', 'fixed', 'Standard'), navigationItem: { selectionVariant: 'stroke', labelVariant: 'none' }, ...side },
      XL: { primary: [], secondary: [], navigationBar: bar('start', 'fixed', 'Standard'), navigationItem: { selectionVariant: 'stroke', labelVariant: 'expandable' }, ...side },
    };
  };
  // Creates e_interface + its global page + the domain mapping. host: e.g. 'orbit.matrix-uat.unifyapps.com'
  cfg.createApp = async ({ appId, name, description = '', themeId, host, logo }) => {
    const props = { type: 'application', name, description, standard: false, manifest: { type: 'WEB', mode: 'config' }, deviceDetails: { base: 'desktop' },
      locale: { defaultLocale: 'en-US' }, flags: { shouldReEvaluateUsingEntityIds: true }, provisionApp: false,
      // defaultPageId is REQUIRED on create ("required defaultPageId"); point it at the global page
      // until registerPages() sets the real home page.
      navigation: { primary: [], secondary: [{ type: 'USER_MENU', name: 'Profile', id: 'userMenu' }], defaultPageId: `e_global_${appId}`, appearance: navAppearance() },
      metadata: { logo: logo || { small: 'https://assets.unifyapps.com/interface/brand-logo/brand-logo-sm-3-comp.svg', large: 'https://assets.unifyapps.com/interface/brand-logo/brand-logo-lg-4.svg', favicon: 'https://assets.unifyapps.com/interface/brand-logo/brand-logo-sm-3-comp.svg' },
        _counter: { _pageCount: 0, _moduleCount: 0, _templateComponentCount: 0, _mqttTopicCounter: 0 } },
      ...(themeId ? { theme: { defaultThemeId: themeId } } : {}),
      entityDetailsMap: {}, interfacePageIdVsSlugMap: {}, paths: { f_root: { id: 'f_root', segment: '', path: '/', children: [] } } };
    const saved = await api('POST', '/api/entity/create-update-or-delete/hierarchical', { entity: { id: appId, entityType: 'e_interface', tags: [], properties: props }, requestType: 'CREATED', ignoreVersion: true });
    const gid = `e_global_${appId}`, gslug = `global-page-of-${appId}`;
    const g = cfg.page({ appId, name: gslug, slug: gslug });
    await api('POST', '/api/entity/create-update-or-delete/hierarchical', { entity: { id: gid, entityType: 'e_component', properties: g.properties }, requestType: 'CREATED', ignoreVersion: true, parentEntities: [{ type: 'e_interface', id: appId }] });
    if (host) await api('POST', '/api/domain-mapping/interface', { domain: `${appId}-${host}`, module: 'INTERFACE', applicationId: appId });
    return Array.isArray(saved) ? saved[0] : saved;
  };
  // Register pages on the app: nav = [{pageId, slug, name, icon, nav?:false}] in order; first is the default.
  cfg.registerPages = async (appId, pagesSpec) => {
    const app = await api('GET', `/api/entity/e_interface/${appId}`);
    const p = app.properties; const gid = `e_global_${appId}`;
    p.entityDetailsMap = { [gid]: { slug: `global-page-of-${appId}`, isPublic: false, type: 'PAGE' } };
    p.interfacePageIdVsSlugMap = { [gid]: `global-page-of-${appId}` };
    p.paths = { f_root: { id: 'f_root', segment: '', path: '/', children: pagesSpec.map(x => x.pageId) } };
    const primary = [];
    for (const x of pagesSpec) {
      p.entityDetailsMap[x.pageId] = { slug: x.slug, isPublic: !!x.public, type: 'PAGE', name: x.name };
      p.interfacePageIdVsSlugMap[x.pageId] = x.slug;
      if (x.nav !== false) primary.push({ id: 'nav_' + x.slug.replace(/[^a-z0-9]/gi, '').slice(0, 12), name: x.name, icon: x.icon || 'Zap', type: 'PAGE', pageId: x.pageId, slug: x.slug });
    }
    p.navigation.primary = primary;
    for (const k of ['SM', 'MD', 'LG', 'XL']) if (p.navigation.appearance?.[k]) p.navigation.appearance[k].primary = primary.map(n => ({ id: n.id, hiddenInOverflow: false }));
    p.navigation.defaultPageId = pagesSpec[0].pageId;
    p.metadata._counter._pageCount = pagesSpec.length;
    const saved = await api('POST', '/api/entity/create-update-or-delete/hierarchical', { entity: app, requestType: 'UPDATED' });
    return Array.isArray(saved) ? saved[0] : saved;
  };
  cfg.publish = async (appId, notes = 'Published over the API') => api('POST', `/api/entity/e_interface/${appId}/deploy`, { deploymentNotes: notes });
  cfg.pages = async appId => (await api('POST', '/api/entity/e_component', { filter: { op: 'AND', values: [{ field: 'properties.interfaceId', op: 'EQUAL', values: [appId] }] }, page: { limit: 200, offset: 0 } })).objects;
  cfg.dataSources = async pageIds => (await api('POST', '/api/entity/e_data_source', { filter: { op: 'AND', values: [{ field: 'properties.interfacePageId', op: 'IN', values: pageIds }] }, page: { limit: 500, offset: 0 } })).objects;

  window.cfg = cfg;
})();

// ------------------------------------------------------------------ more components (v2, 2026-09-23)
// Shapes copied from real apps (references/component-catalogue.md) and verified in CGB Pulse (examples/cgb-pulse/).
// Depends only on cfg, so this section can also be pasted on its own into a tab that has cfg.
(cfg => {
  const K = key => ({ path: key, key, originalPath: key, originalKey: key });
  const PAL = ['var(--palette-brand-600)', 'var(--palette-brand-secondary-500)', 'var(--palette-blue-500)', 'var(--palette-teal-500)',
    'var(--palette-warning-500)', 'var(--palette-error-500)', 'var(--palette-violet-500)', 'var(--palette-gray-500)'];
  const base = (o, content, appearance) => ({ type: 'Chart', id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events,
    content: { summary: { items: [] }, yAxisRight: { series: [] }, ...content },
    appearance: { legends: { position: o.legend || 'top' }, styles: { width: { custom: '100%' }, height: { custom: o.height || '260px' }, padding: { all: 'p-sm' } }, ...appearance } });
  const seriesOf = (list, o, extra = () => ({})) => (list || []).map((s, i) => ({ id: s.id || s.key, label: s.label || s.key, value: K(s.key),
    dataLabels: { enabled: !!(o.labels || s.labels) }, appearance: { visibility: { value: true } }, ...extra(s, i) }));
  const colours = (list, by = 'SERIES') => ({ colourBy: by, colourMapping: Object.fromEntries((list || []).map((s, i) => [s.id || s.key, s.color || PAL[i % PAL.length]])) });
  const axes = { xAxis: { gridLines: { enabled: false }, axisLine: { enabled: true }, ticks: { enabled: true }, labelsOrientation: 'horizontal' },
    yAxis: { gridLines: { enabled: true }, axisLine: { enabled: false }, ticks: { enabled: true } } };

  // Every chartType seen in real apps. type: LINE | AREA | COLUMN (vertical) | BAR (horizontal) | STACKED_COLUMN |
  // PIE | DONUT | DUAL_AXES | RADAR | WATERFALL | BUBBLE | HEATMAP. data = array of rows (expression).
  cfg.chartX = (data, o = {}) => {
    const t = (o.type || 'COLUMN').toUpperCase();
    const x = { label: o.xLabel || '', plotPeriodicValues: false, scale: o.xScale || 'category', tickLabels: {}, xAxisValue: K(o.x) };
    const ticks = { type: o.yType || 'NUMBER', notation: 'standard', decimalPlaces: o.yDp ?? 0 };
    if (t === 'PIE' || t === 'DONUT') {
      // one value series; one colour per slice: colourBy X_AXIS_VALUES, mapping keyed by the slice label.
      return base(o, { chartType: 'PIE', data, xAxis: { xAxisValue: K(o.x) }, yAxis: { series: seriesOf([o.value], o) } },
        { sliceWidth: t === 'DONUT' ? 'sm' : 'lg', legends: { position: o.legend || 'bottom' },
          chartColours: { colourBy: 'X_AXIS_VALUES', colourMapping: o.colors || {} } });
    }
    if (t === 'HEATMAP') {
      // NESTED data is grouped BY COLUMN: the outer key is the column, the nested key the row.
      // data = [{ <col>: '26-08', <cells>: [{ <row>: 'Labour', <value>: 64.1 }, ...] }, ...]
      // Grouping by row instead collapses the whole grid into one cell (seen: a single "79" tile).
      return base(o, { chartType: 'HEATMAP', chartLayout: 'TABULAR', data, xAxis: {}, yAxis: { series: [] },
        rows: { dataFormat: 'NESTED', category: K(o.row), data: K(o.cells || 'data'), value: K(o.value), valueFormat: { type: 'NUMBER', decimalPlaces: o.yDp ?? 0, notation: 'standard' } },
        columns: { category: K(o.col) } },
        { showDataLabels: true, categoryLabels: { variant: 'text-sm', weight: 'regular', maxNumberOfLines: 2 }, valueLabels: { variant: 'text-sm', weight: 'semi-bold' },
          heatmapColors: { colorBy: 'CONTINUOUS', colors: { start: { color: o.from || 'var(--palette-brand-25)' }, end: { color: o.to || 'var(--palette-brand-800)' } } }, legends: { position: 'bottom' } });
    }
    if (t === 'DUAL_AXES') {
      // left: o.series drawn as o.left (COLUMN), right: o.right drawn as o.rightAs (LINE)
      return base(o, { chartType: 'DUAL_AXES', data, xAxis: x,
        yAxis: { series: seriesOf(o.series, o), label: o.yLabel || '', visualisation: o.left || 'COLUMN', tickLabels: ticks },
        yAxisRight: { series: seriesOf(o.rightSeries, o), label: o.yRightLabel || '', visualisation: o.rightAs || 'LINE' } },
        { ...axes, chartColours: colours([...(o.series || []), ...(o.rightSeries || [])]) });
    }
    if (t === 'RADAR') return base(o, { chartType: 'RADAR', data, xAxis: { xAxisValue: K(o.x), scale: 'category' },
      yAxis: { series: seriesOf(o.series, o), ...(o.yDomain ? { domain: o.yDomain } : {}) } }, { chartColours: colours(o.series) });
    if (t === 'WATERFALL') return base(o, { chartType: 'WATERFALL', data, xAxis: { xAxisValue: K(o.x), scale: 'category' },
      yAxis: { series: seriesOf([o.value], { labels: true }, () => ({ barType: K(o.barType || o.x) })), tickLabels: ticks, ...(o.yDomain ? { domain: o.yDomain } : {}) } },
      { ...axes, barWidth: { value: 'lg' }, chartColours: colours([o.value]) });
    if (t === 'BUBBLE') return base(o, { chartType: 'BUBBLE', data, xAxis: { ...x, scale: 'linear' },
      yAxis: { series: seriesOf([{ ...o.y, id: o.y.id || o.y.key }], o, () => ({ bubbleSize: { label: o.size.label || o.size.key, value: K(o.size.key) } })), label: o.yLabel || '', tickLabels: ticks },
      tooltip: { header: { title: o.tooltipTitle || '' } } },
      { ...axes, chartColours: colours([o.y]), bubbleSize: { min: 8, max: 48 },
        ...(o.xDomain ? { xAxis: { ...axes.xAxis, min: o.xDomain.min, max: o.xDomain.max } } : {}), ...(o.yDomain ? { yAxis: { ...axes.yAxis, min: o.yDomain.min, max: o.yDomain.max } } : {}) });
    // LINE / AREA / COLUMN / BAR / STACKED_COLUMN
    const chartType = t === 'AREA' ? 'LINE' : t === 'STACKED_COLUMN' ? 'COLUMN' : t;
    const line = t === 'LINE' || t === 'AREA';
    return base(o, { chartType, data, xAxis: x,
      yAxis: { seriesMode: 'MANUAL', label: o.yLabel || '', tickLabels: ticks, ...(o.yDomain ? { domain: o.yDomain } : {}),
        series: seriesOf(o.series, o, () => (line ? { appearance: { visibility: { value: true }, line: { lineWidth: 2, fillUnderLine: t === 'AREA' ? 'gradient' : 'none', showPointMarkers: true } } } : {})) } },
      { ...axes, interpolation: 'monotoneX', stacked: t === 'STACKED_COLUMN' || !!o.stacked, ...(line ? {} : { barWidth: { value: o.barWidth || 'md' } }),
        chartColours: o.colourByX ? { colourBy: 'X_AXIS_VALUES', colourMapping: o.colors || {} } : colours(o.series) });
  };

  const node = (type, o, content, appearance) => ({ type, id: o.id, name: o.name, visible: o.visible, css: o.css, events: o.events, content, appearance: appearance || {} });
  Object.assign(cfg, {
    // File upload. The block's state: {{ b_up['files'] }} — each file is {id, name, source, sourceType:'CLOUD_STORAGE',
    // url:'/api/file/download/…' (session-authenticated), mimeType, fileType, size, isUploaded, progress, meta} ✅ —
    // plus {{ b_up['files']['length'] }} and {{ b_up['isUploading'] }}. files[0].source is the storage key a workflow
    // reads (as fileObject {source, sourceType:'CLOUD_STORAGE', name, fileType}). There is no 'key' field.
    fileUpload: (id, o = {}) => node('FileUpload', { ...o, id }, { label: o.label || 'Click or drag a file', selectionVariant: o.multiple ? 'multiple' : 'single',
      supportedFileTypes: o.types || ['.pdf', 'image/*'], maxFileSize: o.maxMb || 20, ...(o.multiple ? { maxFiles: o.maxFiles || 5 } : {}),
      allowDownload: true, fileVisibility: o.visibility || 'RESTRICTED', addOns: {} }, { styles: { width: 'w-full' } }),
    // Inline PDF viewer; src = a URL expression (e.g. the stored file_url).
    pdf: (src, o = {}) => node('PDFViewer', o, { data: { type: 'URL', src } }, { scalePageTo: 'WIDTH', styles: { width: 'w-full', height: { custom: o.height || '520px' } } }),
    // Segmented toggle. Value: {{ b_bg['selectedOptionId'] }} (also ['selectedOption']['label']). Event: onClick.
    buttonGroup: (id, options, o = {}) => node('ButtonGroup', { ...o, id }, { mode: 'manual', type: 'toggle', initialSelectedItemId: o.initial || options[0]?.id,
      options: { data: options.map(x => ({ id: x.id, label: x.label, ...(x.icon ? { appearance: { startDecorator: x.icon } } : {}) })) } },
      { color: o.color || 'neutral', size: o.size || 'sm', variant: o.variant || 'outline', styles: { width: { custom: 'fit-content' } } }),
    // Toggle / Checkbox. Value: {{ b_x['value'] }}. Events: Toggle onChange, Checkbox onCheckChange.
    toggle: (id, label, o = {}) => node('Toggle', { ...o, id }, { label, showToggleLabel: true, defaultValue: o.default ?? false }, { size: o.size || 'md', color: 'brand' }),
    checkbox: (id, label, o = {}) => node('Checkbox', { ...o, id }, { label, defaultValue: o.default ?? false }, { size: o.size || 'sm' }),
    radio: (id, label, o = {}) => node('RadioButton', { ...o, id }, { label, defaultValue: o.default ?? '' }, { size: 'md' }),
    // Star rating (read-only by default).
    rating: (value, o = {}) => node('Rating', o, { icon: 'StarBackground', maxRating: o.max || 5, defaultValue: value, editable: { value: !!o.editable } },
      { size: o.size || 'sm', starGap: 'gap-xs', ratedColor: { custom: o.color || '#C9A227' }, unratedColor: 'fill-[var(--palette-gray-300)]' }),
    // Timeline: type 'custom' + a timelineItem slot = the template drawn for every row; inside it read
    // {{ <timelineId>['context']['item'] }}. (type 'mapped' without the slot renders nothing — 0 px.)
    timeline: (id, data, item, o = {}) => ({ ...node('Timeline', { ...o, id }, { type: 'custom', data, title: o.title || `{{ ${id}['context']['item']['title'] }}`,
        timeStamp: o.time || `{{ ${id}['context']['item']['timeStamp'] }}`, dateTimeFormat: o.format || 'dd MMM yyyy', addOns: o.groupByDay ? { grouping: { groupBy: 'day', dayFormat: 'MMMM dd, yyyy' } } : {} },
      { styles: { width: 'w-full', minHeight: 'min-h-[200px]' } }), slotTrees: { timelineItem: item } }),
    // Avatars from rows (initials of a field).
    avatarGroup: (data, field, o = {}) => node('AvatarGroup', o, { type: 'DYNAMIC', mappedAvatars: { type: 'initials', data, avatarId: K(field), fallbackText: K(field) } },
      { size: o.size || 'sm', maxVisibleAvatars: o.max || 5, initialsType: 'double' }),
    avatar: (text, o = {}) => node('Avatar', o, { type: 'initials', fallbackText: text, initialsType: 'double' }, { size: o.size || 'md', color: o.color || 'brand' }),
    // Static stepper: steps [{label, description}], value = index/id expression of the current step.
    stepper: (steps, o = {}) => node('Stepper', o, { type: 'STATIC', defaultStepValue: o.current || 'step_1',
      steps: steps.map((s, i) => ({ id: s.id || `step_${i + 1}`, value: s.id || `step_${i + 1}`, label: s.label, description: s.description || '', level: 0, subTreeDepth: 0, path: `[${i}]`, subSteps: [] })) },
      { orientation: o.vertical ? 'vertical' : 'horizontal', size: 'sm', stepDetails: { clickable: false, orientation: 'vertical',
        label: { variant: 'text-sm', weight: 'semi-bold', color: 'text-secondary', align: 'center' }, description: { variant: 'text-xs', weight: 'regular', color: 'text-tertiary', align: 'center' } },
        styles: { width: o.width ? { custom: o.width } : 'w-full' } }),
    // Kanban: data = [{category, items:[…]}]; card = one block tree reading {{ <kanbanId>['context']['item'] }}.
    kanban: (id, data, card, o = {}) => ({ ...node('Kanban', { ...o, id }, { mode: 'mapped', data,
      category: { mapping: K(o.category || 'category'), categoryType: 'STRING', formattingOptions: { dateFormat: 'd MMM yyyy' } },
      itemsConfig: { mapping: K(o.items || 'items'), id: K(o.itemId || 'id') } },
      { column: { minWidth: { custom: o.colWidth || '240px' } }, styles: { width: 'w-full', height: { custom: o.height || '420px' }, gap: { all: 'gap-lg' } } }), item: card }),
    calendar: (id, o = {}) => node('Calendar', { ...o, id }, { valueType: 'dateOnly', firstDay: 'Sunday' }, { periodType: 'singleMonth', viewOnlyMode: !!o.readOnly,
      styles: { width: 'w-full', padding: { all: 'p-md' }, borderWidth: { all: 'border' }, borderColor: 'border-secondary', borderRadius: { all: 'rounded-xl' } } }),
    link: (label, url, o = {}) => node('Link', o, { label, type: 'url', url, openInNewTab: o.newTab !== false }, { variant: 'text-sm', underline: 'hover', color: o.color || 'text-brand-primary' }),
    timer: (o = {}) => node('Timer', o, { startValue: 0, endValue: o.end || 3600000, interval: 1000, mode: o.mode || 'countUp', format: o.format || 'mm:ss', autostart: o.autostart !== false },
      { variant: o.variant || 'text-sm', weight: 'semi-bold', color: o.color || 'text-primary' }),
    // A Card whose body can be collapsed (accordion behaviour).
    accordion: (title, body, o = {}) => ({ ...cfg.card(body, o), content: { collapsible: { enabled: true, isInitiallyExpanded: !!o.open }, ...(title ? { title } : {}) } }),
  });
})(window.cfg);
