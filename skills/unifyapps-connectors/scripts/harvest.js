/*
 * UnifyApps connector harvester — run SAME-ORIGIN in a browser tab that is signed in to the
 * tenant (Claude's built-in browser javascript_tool, Claude in Chrome, or DevTools console).
 *
 * No credentials live here. It uses the session cookie the browser already has; the cookie is
 * httpOnly and is never read by this script.
 *
 * Output: a TSV snapshot on the clipboard-friendly `result.tsv`, plus counts in `result.summary`.
 *   columns: appName  displayName  kind  connections  resources
 *   kind:    app | internal | custom
 *   connections / resources are blank for connectors that were not probed (see DEEP below).
 *
 * Feed the TSV to scripts/refresh_catalogue.py to diff it against the shipped catalogue.
 *
 * Tunables -----------------------------------------------------------------------------------
 *   DEEP = 'connected'  probe connection + resource counts only for connectors that have at
 *                       least one connection (304 on UAT, ~40 s). The default.
 *          'none'       catalogue only, no probing (~2 s).
 *          'all'        probe every connector (1,200+ round trips — slow, avoid on a shared tenant).
 */
(async () => {
  const DEEP = 'connected';
  const CONCURRENCY = 12;

  const jget = async (path) => {
    const r = await fetch(path, { credentials: 'include', headers: { Accept: 'application/json' } });
    const text = await r.text();
    if (!r.ok) return { __err: r.status };
    if (!text) return { __empty: true };
    try { return JSON.parse(text); } catch (e) { return { __nonjson: true }; }
  };
  const jpost = async (path, body) => {
    const r = await fetch(path, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body) });
    const text = await r.text();
    if (!r.ok) return { __err: r.status };
    try { return JSON.parse(text); } catch (e) { return { __nonjson: true }; }
  };

  // 0. confirm the session is alive before doing anything slow
  const me = await jget('/api/user-context?includeRoles=true');
  if (me.__err) throw new Error('Not signed in (HTTP ' + me.__err + '). Sign in and retry.');

  // 1. the catalogue
  const cat = await jget('/api/workflow-builder/nodes'
    + '?fields=name,displayName,tags,type,needsAuthentication,custom,hidden');
  const nodes = cat.objects || [];
  const kindOf = (n) => n.custom ? 'custom'
    : (n.tags || []).includes('Internal') ? 'internal' : 'app';

  // 2. which connectors have connections at all
  const wc = await jget('/api/workflow-builder/find-nodes-with-connections?fields=name');
  const connected = new Set((Array.isArray(wc) ? wc : (wc.objects || [])).map(n => n.name));

  // 3. probe counts
  const probe = DEEP === 'all' ? nodes
              : DEEP === 'connected' ? nodes.filter(n => connected.has(n.name))
              : [];
  const counts = {};
  for (let i = 0; i < probe.length; i += CONCURRENCY) {
    await Promise.all(probe.slice(i, i + CONCURRENCY).map(async (n) => {
      const agg = await jpost('/api/aggregation?entityType=Connection&group=STANDARD', {
        entityType: 'Connection', group: 'STANDARD', includeTotalHits: true,
        filter: { op: 'AND', values: [{ field: 'appName', op: 'EQUAL', values: [n.name] }] },
        projections: [{ name: 'id' }], sorts: [{ field: 'cTm', order: 'DESC' }],
        page: { limit: 1, offset: 0 } });
      const res = await jget('/api/workflow-builder/node/' + n.name + '/resources');
      counts[n.name] = { c: agg.totalHits ?? '', a: (res.objects || []).length };
    }));
  }

  // 4. TSV, sorted by kind then name
  const rank = { app: 0, internal: 1, custom: 2 };
  const rows = nodes.slice()
    .sort((a, b) => (rank[kindOf(a)] - rank[kindOf(b)]) || (a.name < b.name ? -1 : 1))
    .map(n => {
      const k = counts[n.name] || {};
      return [n.name, n.displayName, kindOf(n), k.c ?? '', k.a ?? ''].join('\t');
    });

  const summary = {
    tenant: location.origin,
    date: new Date().toISOString().slice(0, 10),
    total: cat.totalHits ?? nodes.length,
    app: nodes.filter(n => kindOf(n) === 'app').length,
    internal: nodes.filter(n => kindOf(n) === 'internal').length,
    custom: nodes.filter(n => kindOf(n) === 'custom').length,
    withConnections: connected.size,
    probed: probe.length,
  };

  // Header lines are comments so refresh_catalogue.py can keep provenance with the data.
  const tsv = ['# unifyapps connector snapshot',
               '# tenant\t' + summary.tenant,
               '# date\t' + summary.date,
               '# appName\tdisplayName\tkind\tconnections\tresources',
               ...rows].join('\n');

  return { summary, lines: rows.length, tsv };
})()
