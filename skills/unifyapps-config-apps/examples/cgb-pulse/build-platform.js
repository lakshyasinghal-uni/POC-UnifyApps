// CGB Pulse — recreate the platform layer (objects, automations, agent) from the JSON in ./platform.
// Paste scripts/ua_cfg.js first, then this file, then:
//   const P = { objects: <platform/objects.json>, workflows: { query: <workflow_query.json>,
//               insights: <workflow_insights.json>, scenario: <workflow_scenario.json>,
//               ingest: <workflow_ingest_document.json> }, agent: <agent.json> };
//   const ids = await buildCgbPulsePlatform(P);        // -> { WF: {...}, AGENT }
//   await cgbpLoad(cgbpGenerate());                     // seed.js
//
// Tenant-specific values to check before running elsewhere:
//   - workflow_insights.json n_llm.inputs.parameters.modelId (an e_… LLM model entity on orbit.uat)
//   - workflow_ingest_document.json n_ocr.inputs.parameters.modelId — must be a model in the TEXT_EXTRACTION
//     group: POST /api/lookup?ByQuery=ENTITY_ID:ai_agent_llm_model, filter properties.modelGroup IN [textExtraction, TEXT_EXTRACTION]
//   - every node's context.resourceVersion (resolve with cfg.resourceVersion if a save reports violations)
async function buildCgbPulsePlatform({ objects, workflows, agent }) {
  const api = cfg.api;
  const getET = async id => { const t = await (await fetch('/api/entity-type?entityType=' + id, { credentials: 'include' })).text(); return t ? JSON.parse(t) : null; };
  // 1. objects: create, then write the schema through BOTH carriers (input + schema) — see API-SPEC §27
  for (const [id, o] of Object.entries(objects)) {
    if (!(await getET(id))) await api('POST', '/api/entity-type', { id, name: o.name, pluralName: o.pluralName, description: o.description, metadata: { storeDetails: { store: 'MONGO' } }, tags: ['CGB_PULSE'] });
    const et = await getET(id);
    et.input = { type: 'SCHEMA_AND_LAYOUT', schema: o.schema, layout: { 'ui:order': o.order || Object.keys(o.schema.properties) } };
    et.schema = { dynamic: false, type: 'SCHEMA', schema: o.schema };
    await api('POST', '/api/entity-type/update', et);
  }
  // 2. workflows: create -> save (check violations) -> deploy the live version
  const WF = {};
  for (const [key, def] of Object.entries(workflows)) {
    const c = await api('POST', '/api/workflow-definition', { ...def, tags: ['CGB_PULSE'] });
    const s = await api('POST', '/api/workflow-definition/saveAndReturnViolations', { ...c, ...def, id: c.id, version: c.version, schemaReferences: [], standard: false });
    if (s.violations) console.warn(key, 'violations', s.violations);
    const w = s.workflowDefinition;
    await api('POST', `/api/workflow-definition/${w.id}/deploy?version=${w.version}`, { deploymentNotes: 'CGB Pulse', _type: 'WORKFLOW_DEPLOY_OPTIONS' });
    WF[key] = w.id;
  }
  // 3. agent + its QueryData tool (-> cgbp_query) + task, then publish
  const ag = await api('POST', '/api/entity', { entityType: 'ai_agent', properties: agent.properties });
  for (const t of agent.tools) {
    const p = { ...t, aiAgentId: ag.id, enabled: true };
    if (p.inputs?.automationId) p.inputs = { ...p.inputs, automationId: WF.query };
    await api('POST', '/api/entity', { entityType: 'e_action_ai_agent', properties: p });
  }
  for (const t of agent.topics) await api('POST', '/api/entity', { entityType: 'e_topic_ai_agent', properties: { ...t, aiAgentId: ag.id } });
  const full = await api('GET', '/api/entity/ai_agent/' + ag.id);
  await api('POST', '/api/entity/action/saveAndDeploy', { ...full, deploymentNotes: 'CGB Pulse analyst' });
  return { WF, AGENT: ag.id };
}
window.buildCgbPulsePlatform = buildCgbPulsePlatform;
