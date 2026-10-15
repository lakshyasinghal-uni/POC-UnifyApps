// CGB Pulse — deterministic synthetic seed data for the config-app sample.
// Paste into a signed-in tab AFTER scripts/ua_cfg.js. Single-select fields (cluster, risk_band)
// must use the object's option values or the write fails with 'oneOf fail'. Every figure is invented; region
// coordinates are the public centroids of Qatar's municipalities. Re-running produces the
// identical dataset (fixed PRNG seed), and the loader upserts, so it is safe to repeat.
//
//   const data = cgbpGenerate();            // inspect first
//   await cgbpLoad(data);                   // write to the cgbp_* objects
(() => {
  const rng = (seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296))(20260923);
  const pick = a => a[Math.floor(rng() * a.length)];
  const r1 = v => Math.round(v * 10) / 10;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const PERIOD = '2026-08';
  const months = (() => { const out = []; for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(2026, 7 - i, 1)); out.push(d.toISOString().slice(0, 7)); } return out; })();

  const ENTITIES = [
    ['HEALTH', 'Health Services', 'HEALTH_EDUCATION', 84.2, 'Appointment reminders and same-day release of unused slots would recover capacity at busy centres.'],
    ['EDUCATION', 'Education Services', 'HEALTH_EDUCATION', 86.9, 'Certificate issuance is still paper-first; a digital certificate would remove most counter visits.'],
    ['MUNICIPAL', 'Municipal Permits', 'MUNICIPAL_TRANSPORT', 76.4, 'A checklist that shows every document up front would cut repeat visits.'],
    ['TRANSPORT', 'Transport & Vehicles', 'MUNICIPAL_TRANSPORT', 81.9, 'Plate-renewal self-service is under-used; a nudge at the counter would shift volume online.'],
    ['LABOUR', 'Labour Services', 'ECONOMY_LABOUR', 64.1, 'Contract attestation queues drive most complaints; a 30-day backlog plan is the lever.'],
    ['JUSTICE', 'Justice Services', 'SECURITY_JUSTICE', 79.3, 'Citizens cannot see case status; a tracker would answer the most common question.'],
    ['INTERIOR', 'Residency & ID', 'SECURITY_JUSTICE', 83.5, 'Peak-hour staffing at two centres drives nearly all of the waiting time.'],
    ['COMMERCE', 'Commercial Registration', 'ECONOMY_LABOUR', 78.8, 'Renewal errors on the portal generate repeat contacts; fix the save step.'],
    ['HOUSING', 'Housing Services', 'GOVERNMENT_SERVICES', 74.6, 'Applicants are not told where they are in the queue; publish the position.'],
    ['SOCIAL', 'Social Support', 'GOVERNMENT_SERVICES', 82.7, 'Strong human service; keep the named-caseworker model as volume grows.'],
    ['CUSTOMS', 'Customs Clearance', 'ECONOMY_LABOUR', 72.9, 'Clearance time has drifted for three months; approaching the escalation trigger.'],
    ['DIGITAL', 'National Portal', 'GOVERNMENT_SERVICES', 80.5, 'Adoption is high but authentication failures push users back to counters.'],
  ];
  const REGIONS = [
    ['DOHA', 'Doha', 25.2854, 51.531, 956000, 14],
    ['RAYYAN', 'Al Rayyan', 25.2919, 51.4244, 605000, 9],
    ['WAKRAH', 'Al Wakrah', 25.1715, 51.6034, 300000, 5],
    ['DAAYEN', 'Al Daayen', 25.578, 51.4822, 120000, 3],
    ['UMMSALAL', 'Umm Salal', 25.4152, 51.4065, 110000, 3],
    ['KHOR', 'Al Khor', 25.6839, 51.5058, 205000, 4],
    ['SHAMAL', 'Al Shamal', 26.1293, 51.2009, 12000, 2],
    ['SHAHANIYA', 'Al Shahaniya', 25.371, 51.22, 190000, 3],
  ];
  const ENTITY_BASE_FIELDS = ['satisfaction', 'health_score', 'sentiment', 'completion', 'resolution', 'response_hours', 'digital_adoption', 'risk_band', 'narrative_en'];
  const REGION_BASE_FIELDS = ['satisfaction', 'risk_score', 'sentiment', 'response_ratio', 'issue_volume', 'digital_adoption', 'note_en', 'action_en'];
  const band = h => (h >= 80 ? 'LOW' : h >= 70 ? 'MEDIUM' : 'HIGH');

  function cgbpGenerate() {
    const entities = ENTITIES.map(([code, name, cluster, sat, opp], i) => {
      const health = r1(clamp(sat - 4 + rng() * 8, 50, 96));
      const e = {
        entity_code: code, name_en: name, cluster, period: PERIOD, satisfaction: sat, health_score: health,
        sentiment: Math.round((sat - 75) * 2.2 + (rng() * 10 - 5)), completion: r1(clamp(sat + 6 + rng() * 6, 60, 99)),
        resolution: r1(clamp(sat - 2 + rng() * 8, 50, 98)), response_hours: r1(2 + (100 - sat) / 6 + rng() * 2),
        digital_adoption: Math.round(clamp(45 + rng() * 45, 30, 95)), accessibility: Math.round(clamp(65 + rng() * 30, 50, 98)),
        employee_quality: Math.round(clamp(sat - 5 + rng() * 12, 55, 97)), assessments: 300 + Math.round(rng() * 900),
        monthly_volume: 2000 + Math.round(rng() * 14000), risk_band: band(health), opportunity_en: opp,
        narrative_en: `${name} is at ${sat}% satisfaction, ${sat >= 80 ? 'above' : 'below'} the 80% service target.`,
      };
      return e;
    }).sort((a, b) => b.health_score - a.health_score).map((e, i) => ({ ...e, rank: i + 1 }));
    entities.forEach(e => { e.baseline_json = JSON.stringify(Object.fromEntries(ENTITY_BASE_FIELDS.map(k => [k, e[k]]))); });

    const regions = REGIONS.map(([code, name, lat, lon, pop, centers]) => {
      const sat = r1(clamp(74 + rng() * 15, 60, 95));
      const r = {
        region_code: code, name_en: name, lat, lon, population: pop, centers, period: PERIOD, satisfaction: sat,
        risk_score: Math.round(clamp(100 - sat + rng() * 20 - 5, 5, 95)), sentiment: Math.round((sat - 78) * 2 + rng() * 8 - 4),
        response_ratio: r1(0.6 + (90 - sat) / 12 + rng() * 0.4), issue_volume: Math.round(pop / 1000 * (1.2 + rng())),
        service_volume: Math.round(pop / 40 * (0.8 + rng() * 0.4)), digital_adoption: Math.round(55 + rng() * 35),
        assessments: 80 + Math.round(rng() * 500), employee_quality: Math.round(70 + rng() * 25),
        note_en: `${name}: ${centers} service centres for ${pop.toLocaleString('en')} residents.`,
        action_en: sat < 80 ? `Add peak-hour capacity at the busiest ${name} centre.` : `Share the ${name} playbook with lower-scoring regions.`,
      };
      return r;
    });
    // Make Al Rayyan the obvious problem region, as in the source story.
    Object.assign(regions.find(r => r.region_code === 'RAYYAN'), { satisfaction: 71.2, risk_score: 68, response_ratio: 2.4, sentiment: -14, action_en: 'Open a second counter at the Al Rayyan centre and move 20% of bookings online.' });
    regions.forEach(r => { r.baseline_json = JSON.stringify(Object.fromEntries(REGION_BASE_FIELDS.map(k => [k, r[k]]))); });

    const kpis = [];
    const series = (scope, code, metric, end, drift) => {
      let v = end - drift * 11;
      months.forEach((p, i) => {
        const val = i === 11 ? end : r1(v + (rng() * 2 - 1) * 1.2);
        kpis.push({ snapshot_code: `${p}|${scope}|${code}|${metric}`, period: p, scope_type: scope, scope_code: code, metric,
          value: val, baseline_value: val, delta: 0, baseline_delta: 0, sort_order: kpis.length + 1 });
        v += drift;
      });
    };
    const nat = r1(entities.reduce((s, e) => s + e.satisfaction, 0) / entities.length);
    series('NATIONAL', 'NATIONAL', 'satisfaction', nat, 0.25);
    series('NATIONAL', 'NATIONAL', 'sharek_index', r1(nat - 1.5), 0.3);
    entities.forEach(e => series('ENTITY', e.entity_code, 'satisfaction', e.satisfaction, e.entity_code === 'LABOUR' || e.entity_code === 'CUSTOMS' ? -0.6 : 0.2 + rng() * 0.3));

    const CH = ['CH-X', 'CH-IG', 'CH-APP', 'CH-CALL', 'CH-WEB'];
    const T = {
      COMPLAINT: ['The queue at the {c} counter took over two hours and nobody explained why.', 'I submitted my {c} request three times; the portal lost it every time.', 'Nobody answers the {c} hotline after 1 pm.', 'The {c} centre sent me home for a document that was never on the list.'],
      SUGGESTION: ['A checklist on the {c} page would save everyone a second visit.', 'Let us book {c} appointments on the app instead of queueing.', 'Show the queue position for {c} requests online.'],
      PRAISE: ['The {c} officer solved my case in ten minutes — thank you.', 'Very smooth {c} experience on the new app.', 'Excellent follow-up from the {c} team, they called me back.'],
      QUESTION: ['How long does a {c} renewal take now?', 'Which documents do I need for {c}?', 'Is the {c} fee changing next month?'],
    };
    const voices = [];
    for (let i = 0; i < 420; i++) {
      const e = pick(entities); const r = pick(regions);
      const w = e.satisfaction < 75 ? [0.55, 0.2, 0.1, 0.15] : [0.25, 0.2, 0.35, 0.2];
      const x = rng(); const kind = x < w[0] ? 'COMPLAINT' : x < w[0] + w[1] ? 'SUGGESTION' : x < w[0] + w[1] + w[2] ? 'PRAISE' : 'QUESTION';
      const days = Math.floor(rng() * 120);
      const sentiment = kind === 'COMPLAINT' ? -40 - Math.round(rng() * 50) : kind === 'PRAISE' ? 40 + Math.round(rng() * 50) : Math.round(rng() * 40 - 15);
      voices.push({ voice_code: `V-${String(i + 1).padStart(4, '0')}`, entity_code: e.entity_code, center_code: r.region_code,
        channel_code: pick(CH), kind, sentiment, rating: clamp(Math.round((sentiment + 100) / 40), 1, 5),
        posted_days_ago: days, period: months[11 - Math.min(11, Math.floor(days / 30))],
        text_en: pick(T[kind]).replace('{c}', e.name_en.toLowerCase()), topic_code: `T-${e.entity_code}`, category_code: `CAT-${e.cluster}` });
    }

    const scen = (code, name, family, icon, desc, payload) => ({ scenario_code: code, name_en: name, family, icon, description_en: desc,
      payload_json: JSON.stringify(payload), is_active: false, applied_at: '' });
    const scenarios = [
      scen('SC-RAYYAN-ESC', 'Al Rayyan: the capacity gap widens', 'ESCALATION', 'TrendDown01', 'Two centres lose a shift each; waiting time doubles and sentiment turns.',
        { region: [{ code: 'RAYYAN', satisfaction: -6.5, risk_score: 14, sentiment: -18, response_ratio: 0.9, note_en: 'Al Rayyan: two centres short-staffed; waits have doubled.' }],
          entity: [{ code: 'MUNICIPAL', satisfaction: -3.1, health_score: -4, sentiment: -12, narrative_en: 'Municipal Permits is absorbing the Al Rayyan backlog and falling further below target.' }] }),
      scen('SC-RAYYAN-REC', 'Al Rayyan: capacity relief takes hold', 'RECOVERY', 'TrendUp01', 'A second counter opens and 20% of bookings move online.',
        { region: [{ code: 'RAYYAN', satisfaction: 9.4, risk_score: -30, sentiment: 22, response_ratio: -1.2, note_en: 'Al Rayyan: second counter open; waits back within target.' }],
          entity: [{ code: 'MUNICIPAL', satisfaction: 4.2, health_score: 5, sentiment: 14, narrative_en: 'Municipal Permits is recovering as the Al Rayyan queue clears.' }] }),
      scen('SC-LABOUR-ESC', 'Labour Services: the spiral continues', 'ESCALATION', 'AlertTriangle', 'Attestation backlog grows for a seventh week.',
        { entity: [{ code: 'LABOUR', satisfaction: -5.2, health_score: -6, sentiment: -20, resolution: -6, narrative_en: 'Labour Services has fallen for seven weeks; attestation backlog is the driver.' }] }),
      scen('SC-LABOUR-REC', 'Labour Services: the 30-day plan lands', 'RECOVERY', 'CheckCircle', 'Backlog cleared, extended hours, proactive SMS updates.',
        { entity: [{ code: 'LABOUR', satisfaction: 11.3, health_score: 12, sentiment: 26, resolution: 9, narrative_en: 'Labour Services recovered after the 30-day backlog plan.' }] }),
      scen('SC-DIGITAL', 'National digital adoption push', 'LAUNCH', 'Phone01', 'Portal login fixed; every entity promotes self-service.',
        { entity: entities.map(e => ({ code: e.entity_code, digital_adoption: 6, satisfaction: 1.2 })), region: regions.map(r => ({ code: r.region_code, digital_adoption: 7 })) }),
      scen('SC-BASELINE', 'Restore August 2026 baseline', 'BASELINE', 'RefreshCcw01', 'Put every figure back exactly as loaded.', { reset: true }),
    ];
    return { entities, regions, kpis, voices, scenarios };
  }

  async function cgbpLoad(data, workers = 10) {
    const call = async (method, path, body) => {
      const r = await fetch(path, { method, credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: body && JSON.stringify(body) });
      const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`); return t ? JSON.parse(t) : null;
    };
    const upsert = async (type, pk, rows) => {
      let ok = 0, upd = 0, fail = 0; const q = [...rows];
      const w = async () => { while (q.length) { const p = q.shift();
        try { await call('POST', '/api/entity', { entityType: type, properties: p }); ok++; }
        catch (e) {
          if (!/E11000|duplicate/i.test(String(e))) { fail++; continue; }
          try { const cur = await call('GET', `/api/entity/${type}/${encodeURIComponent(p[pk])}`);
            await call('POST', '/api/entity/update', { ...cur, properties: { ...cur.properties, ...p } }); upd++; } catch { fail++; }
        } } };
      await Promise.all(Array.from({ length: workers }, w));
      return `${type}: created ${ok}, updated ${upd}, failed ${fail}`;
    };
    return [
      await upsert('cgbp_entity', 'entity_code', data.entities),
      await upsert('cgbp_region', 'region_code', data.regions),
      await upsert('cgbp_scenario', 'scenario_code', data.scenarios),
      await upsert('cgbp_kpi', 'snapshot_code', data.kpis),
      await upsert('cgbp_voice', 'voice_code', data.voices),
    ];
  }
  // Follow-up actions for the Kanban / Timeline / AvatarGroup on the Performance Studio page.
  function cgbpActions() {
    const A = [
      ['LABOUR', 'Run a 30-day attestation backlog sprint', 'Labour Services ops', 'HIGH', 'IN_PROGRESS', 30],
      ['LABOUR', 'Send proactive SMS status updates', 'National Portal team', 'MEDIUM', 'OPEN', 21],
      ['MUNICIPAL', 'Publish one complete document checklist', 'Service design', 'HIGH', 'IN_PROGRESS', 14],
      ['MUNICIPAL', 'Second counter at the Al Rayyan centre', 'Municipal operations', 'HIGH', 'OPEN', 45],
      ['CUSTOMS', 'Clearance-time root-cause review', 'Customs quality office', 'MEDIUM', 'OPEN', 28],
      ['HOUSING', 'Show queue position to applicants', 'Housing digital team', 'MEDIUM', 'DONE', 0],
      ['JUSTICE', 'Launch case-status tracker', 'Justice digital team', 'MEDIUM', 'IN_PROGRESS', 35],
      ['COMMERCE', 'Fix the renewal save-step error', 'National Portal team', 'HIGH', 'DONE', 0],
      ['DIGITAL', 'Mobile upload reliability fix', 'National Portal team', 'HIGH', 'IN_PROGRESS', 10],
      ['HEALTH', 'Same-day release of unused slots', 'Health operations', 'LOW', 'OPEN', 60],
      ['EDUCATION', 'Digital certificate issuance', 'Education e-services', 'MEDIUM', 'DONE', 0],
      ['TRANSPORT', 'Counter nudge to plate-renewal self-service', 'Transport service desk', 'LOW', 'OPEN', 30],
    ];
    return A.map(([entity_code, title, owner, priority, status, due_days], i) => ({ action_code: `ACT-SEED-${String(i + 1).padStart(2, '0')}`,
      title, entity_code, owner, priority, status, due_days, source: 'seed', notes: '', created_by: 'CGB Pulse seed' }));
  }
  window.cgbpGenerate = cgbpGenerate; window.cgbpLoad = cgbpLoad; window.cgbpActions = cgbpActions;
})();
