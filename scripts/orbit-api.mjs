#!/usr/bin/env node
/**
 * orbit-api.mjs — POC Studio's direct client for Orbit (UnifyApps), no browser.
 *
 * Auth (environment secrets, never pasted in chat, never printed) — or none at all when it runs inside
 * a signed-in Orbit tab through scripts/orbit-tab.mjs, where the browser sends the session itself:
 *   ORBIT_COOKIE                      the whole Cookie header of a signed-in session, or
 *   ORBIT_USERNAME + ORBIT_PASSWORD   a LOCAL (non-SSO) account; logs in each run
 *   ORBIT_BASE      default https://orbit.uat.unifyapps.com
 *   ORBIT_IDP       local identity provider id (UAT default 65d2f4cf672d16da08efc3d0)
 *   ORBIT_BUCKET    overrides the upload bucket; by default it is read from GET /api/file/upload-bucket
 *   ORBIT_EXPECT    the Orbit user (email or username) setup recorded; `check` warns on a mismatch
 *   ORBIT_QUEUE     queued-writes file (default studio/.orbit-queue.jsonl); writes that can never be
 *                   replayed move to the same path with .dead.jsonl, each with a feedback ticket
 *   ORBIT_TAKEOVER_HOURS   a heartbeat younger than this belongs to a live session (default 2)
 *
 * The Orbit contract (skills/build/references/orbit-contract.json) holds the field names, the options and
 * one table from each internal value to its Orbit value. Every create and update maps through it, then the
 * whole record is checked against the live schema (required fields, names, options, reference ids); on any
 * failure nothing is sent and the problems are listed.
 *
 * Commands (every result is one JSON line on stdout; exit 0 ok, 1 error, 3 queued for later,
 * 4 another session holds the POC, 5 the live schema does not match what the plugin writes):
 *   check                                      who is signed in, and whether the three objects exist
 *   schema-check                               compare the live schemas with the fields and options the
 *                                              plugin writes; exit 5 with the list when they differ
 *   schema   <objectId>                        the live object definition
 *   refresh-schemas [--file <orbit-objects.json>]  write the live schemas of the three objects into the file
 *   ensure-objects [--file <orbit-objects.json>]   create any missing object, never alter one
 *   new-poc  <json | @file>                    create a POC row; Orbit generates poc_id (POC-_1001 …), returned
 *   find-poc <text> [--limit n]                POCs whose id, name, client or use case match, newest first
 *   claim    --poc <id> --session <link> [--force]   take the row for this session; exit 4 if another
 *                                              session's heartbeat is younger than ORBIT_TAKEOVER_HOURS
 *   heartbeat --poc <id> --session <link> [--run-state s] [--resume-from r] [--stall-reason r]
 *            [--stage s] [--current-gate g] [--activity <one line>]   keep the run fields current
 *   get      <objectId> <recordId>
 *   find     <objectId> [--field f --value v]... [--in f=v1,v2] [--limit n] [--sort f:desc]
 *   create   <objectId> <json | @file>
 *   update   <objectId> <recordId> <json | @file>   read, merge properties, write the full record
 *   upload   <path> [--name n] [--mime m]      returns the File-field value
 *   save-doc --poc <pocId> --stage <stage> --slug <slug> --name <title> --type <docType> --file <path>
 *            [--status draft|in_review|approved] [--gate G1..G4] [--summary <one line>] [--by <name>]
 *   fetch-doc --poc <pocId> --slug <slug> --out <path>   the latest version's text (or file) to a local path
 *   readback --poc <pocId>                     every latest document: file uploaded, version, status
 *   new-ticket --poc <pocId> --feedback <words | @file> --title <t> [--by-name n] [--by-email e]
 *            [--by-slack-id u] [--stage s] [--gate g] [--category c] [--severity s] [--doc <doc_id>]
 *            [--source-link url] [--channel chat]   a feedback ticket; Orbit generates ticket_no (FB-_1001 …)
 *   close-ticket --ticket <ticket_no> --action <what was done> [--status done|wont_do]
 *   sync-counts --poc <pocId>                  recompute documents_count and open_feedback_count on the POC row
 *   flush                                      replay queued writes in order; one that can never succeed
 *                                              (its local file is gone, or Orbit rejects it) is skipped
 *                                              and becomes a feedback ticket
 *   contract-test                              on the real tenant: every value the plugin can produce, for every
 *                                              mapped field, written to [TEST] rows and read back; references,
 *                                              file formats and bad-write stops too; a pass list in studio/contract-test/
 *   selftest [--poc <pocId>]                   on the real tenant: schema-check, then a write and a read-back
 *                                              on all three objects and one file upload; prints a results table
 *
 * It never deletes: there is no delete command, and superseding a document is a status change.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.ORBIT_BASE || "https://orbit.uat.unifyapps.com").replace(/\/$/, "");
const IDP = process.env.ORBIT_IDP || "65d2f4cf672d16da08efc3d0";
const BUCKET_OVERRIDE = process.env.ORBIT_BUCKET || "";
const QUEUE = path.resolve(process.env.ORBIT_QUEUE || path.join("studio", ".orbit-queue.jsonl"));
const DEAD = QUEUE.replace(/\.jsonl$/, "") + ".dead.jsonl";
const TAKEOVER_MS = Number(process.env.ORBIT_TAKEOVER_HOURS || 2) * 3600_000;
const OBJ = { poc: "poc_studio_poc", doc: "poc_studio_document", fb: "poc_studio_feedback" };
const SCHEMA_CACHE = path.resolve(path.dirname(QUEUE), ".orbit-schema-cache.json");
const SCHEMA_TTL = 10 * 60_000;

// ---------- the Orbit contract: field names, options and the internal → Orbit map ----------
// One table for every write: skills/build/references/orbit-contract.json. Change values there only.
const CONTRACT_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "skills", "build", "references", "orbit-contract.json");
const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_FILE, "utf8"));
const FIELDS = CONTRACT.objects;
const OPEN_TICKET = ["open", "in_progress"]; // Orbit values, used in reads
const GATE_DOC_TYPES = new Set(["gate_pack", "gate_decision"]);

// Map one internal value to its Orbit value. An Orbit value passes as is. Anything else is an error.
function mapValue(obj, field, v) {
  const sel = FIELDS[obj]?.selects?.[field];
  if (!sel || v === undefined || v === null || v === "") return { value: v };
  if (Object.prototype.hasOwnProperty.call(sel.map, v)) return { value: sel.map[v] };
  if (sel.options.includes(v)) return { value: v };
  return { error: `${field}: ${JSON.stringify(v)} is not a value POC Studio knows (internal: ${Object.keys(sel.map).join(", ")})` };
}
function toOrbit(obj, props) {
  const out = {}; const errors = [];
  for (const [k, v] of Object.entries(props)) { const m = mapValue(obj, k, v); if (m.error) errors.push(m.error); else out[k] = m.value; }
  return { props: out, errors };
}
const docTypeFor = (file) => FIELDS[OBJ.doc].selects.doc_type.fromExtension[path.extname(String(file)).toLowerCase()] || "other";
const TEXT_MAX = 1_000_000;
const PART = 8 * 1024 * 1024;

const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(code); };
const fail = (msg, extra = {}) => out({ ok: false, error: msg, ...extra }, 1);

// ---------- args ----------
const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags = {}; const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    (flags[k] ||= []).push(v);
  } else pos.push(a);
}
const flag = (k, d) => (flags[k] ? flags[k][flags[k].length - 1] : d);
const readJsonArg = (s) => {
  if (!s) fail("missing JSON argument");
  const txt = s.startsWith("@") ? fs.readFileSync(s.slice(1), "utf8") : s;
  try { return JSON.parse(txt); } catch (e) { fail(`not valid JSON: ${e.message}`); }
};

// ---------- session ----------
// TAB: this file is running inside a signed-in Orbit tab (scripts/orbit-tab.mjs). The browser sends
// the session cookie itself on same-origin calls, so there is no login and no Cookie header.
const TAB = globalThis.__ORBIT_TAB__ === true;
let cookie = process.env.ORBIT_COOKIE || "";
class AuthError extends Error {}
class NetError extends Error {}

async function login() {
  const u = process.env.ORBIT_USERNAME, p = process.env.ORBIT_PASSWORD;
  if (!u || !p) throw new AuthError("No Orbit session: set ORBIT_COOKIE, or ORBIT_USERNAME and ORBIT_PASSWORD for a local account, as environment secrets.");
  const r = await rawFetch("/auth/workflow/execute/node?name=emailAndPassLoginRequest", {
    method: "POST",
    body: JSON.stringify({
      id: "emailAndPassLoginRequest",
      context: { appName: "auth_by_unifyapps", resourceName: "auth_by_unifyapps_login" },
      inputs: { returnTo: "/", failureReturnTo: `${BASE}/login`, formData: { username: u, password: p, rememberMe: true }, identityProviderId: IDP },
      options: { cacheConfig: {} },
    }),
  }, false);
  if (r.status !== 200) throw new AuthError(`Orbit login failed (${r.status}). Check the username, password and that the account is local, not SSO.`);
  const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")].filter(Boolean);
  cookie = set.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new AuthError("Orbit login returned no session cookie.");
}

async function rawFetch(p, init = {}, withCookie = true) {
  const headers = { Accept: "application/json", ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) };
  if (withCookie && cookie && !TAB) headers.Cookie = cookie;
  try {
    return await fetch(p.startsWith("http") ? p : BASE + p, { ...init, headers, redirect: "manual", ...(TAB ? { credentials: "same-origin" } : {}) });
  } catch (e) {
    throw new NetError(`Orbit could not be reached: ${e.cause?.code || e.message}`);
  }
}

async function api(p, init = {}, retried = false) {
  if (!cookie && !TAB) await login();
  const r = await rawFetch(p, init);
  const ct = r.headers.get("content-type") || "";
  // status 0 is a redirect the browser hid (redirect: "manual"), i.e. the login page
  if (r.status === 401 || r.status === 0 || (r.status >= 300 && r.status < 400) || ct.includes("text/html")) {
    if (TAB) throw new AuthError("The Orbit tab is not signed in. Sign in to Orbit in the browser tab, then run the command again.");
    if (!retried && process.env.ORBIT_USERNAME) { cookie = ""; await login(); return api(p, init, true); }
    throw new AuthError("The Orbit session has expired or is not signed in. Sign in again (or refresh ORBIT_COOKIE).");
  }
  const text = await r.text();
  if (!r.ok) { const err = new Error(`Orbit ${init.method || "GET"} ${p} → ${r.status}: ${text.slice(0, 300)}`); err.status = r.status; err.body = text; throw err; }
  if (!text) return null; // empty body = not found for entity-type reads (API-SPEC §28)
  try { return JSON.parse(text); } catch { return text; }
}

// ---------- live schemas ----------
const schemaMem = {};
async function getObject(id) { return api(`/api/entity-type?entityType=${encodeURIComponent(id)}`); }
const liveSchemaOf = (o) => o?.schema?.schema || o?.input?.schema || null;
function readCache() { try { const c = JSON.parse(fs.readFileSync(SCHEMA_CACHE, "utf8")); if (c.base === BASE && Date.now() - c.at < SCHEMA_TTL) return c; } catch {} return { base: BASE, at: Date.now(), objects: {}, refs: {} }; }
function writeCache(mut) { try { const c = readCache(); mut(c); c.refs ||= {}; fs.mkdirSync(path.dirname(SCHEMA_CACHE), { recursive: true }); fs.writeFileSync(SCHEMA_CACHE, JSON.stringify(c)); } catch {} }
async function liveSchema(obj) {
  if (schemaMem[obj]) return schemaMem[obj];
  const c = readCache(); if (c.objects?.[obj]) return (schemaMem[obj] = c.objects[obj]);
  const s = liveSchemaOf(await getObject(obj));
  if (!s) throw new Error(`Object ${obj} is not on ${BASE}. Run setup (ensure-objects) first.`);
  schemaMem[obj] = s; writeCache((x) => { x.objects[obj] = s; });
  return s;
}
// The allowed values of a single-select, wherever the schema keeps them; null when it lists none (a reference).
function optionsOf(def = {}) {
  const pick = (arr) => (Array.isArray(arr) ? arr.map((o) => (o && typeof o === "object" ? (o.const ?? o.value ?? o.id) : o)).filter((v) => v !== undefined) : null);
  return pick(def.oneOf) || pick(def.anyOf) || pick(def.enum) || pick(def.items?.oneOf) || pick(def.items?.enum) || pick(def.options) || null;
}
const isAuto = (def = {}) => def.format === "auto-generate" || Boolean(def.autoGeneratedFieldDefinition);
const pkOf = (schema) => Object.entries(schema?.properties || {}).find(([, d]) => d.primaryKey)?.[0] || null;

// ---------- references: which id does each reference field hold? ----------
// Read from one existing row that has the field set: the target's record id, or its primary key
// (poc_id, doc_id). Cached with the schemas. With no row to read yet it is "unconfirmed" and the
// record id is used.
const refMem = {};
async function refMode(obj, field) {
  const key = `${obj}.${field}`;
  if (refMem[key]) return refMem[key];
  const c = readCache(); if (c.refs?.[key]) return (refMem[key] = c.refs[key]);
  const target = FIELDS[obj].refs[field];
  const pk = pkOf(await liveSchema(target));
  let mode = { holds: "record id", confirmed: false, from: "no existing row with this field yet" };
  const rows = await findRecords(obj, [], 50, null);
  const row = rows.find((r) => r.properties?.[field] !== undefined && r.properties?.[field] !== null && r.properties?.[field] !== "");
  if (row) {
    const v = row.properties[field];
    const byId = typeof v === "string" ? await getRecord(target, v) : null;
    if (byId && byId.id === v && pk && byId.properties?.[pk] === v) mode = { holds: "record id", sameAsPrimaryKey: true, confirmed: true, from: row.id };
    else if (byId && byId.id === v) mode = { holds: "record id", confirmed: true, from: row.id };
    else if (pk) {
      const [hit] = await findRecords(target, [{ op: "EQUAL", field: `properties.${pk}`, values: [v] }], 1);
      mode = hit ? { holds: "primary key", pk, confirmed: true, from: row.id } : { holds: "record id", confirmed: false, from: `${row.id} holds ${JSON.stringify(v)}, which matches no ${target} record` };
    }
  }
  if (mode.confirmed) writeCache((x) => { x.refs[key] = mode; });
  return (refMem[key] = mode);
}
async function refValue(obj, field, rec) {
  if (!rec) return null;
  const m = await refMode(obj, field);
  return m.holds === "primary key" ? rec.properties?.[m.pk] ?? null : rec.id ?? null;
}
async function resolveRef(obj, field, v) {
  const target = FIELDS[obj].refs[field];
  const m = await refMode(obj, field);
  if (m.holds === "primary key") { const [hit] = await findRecords(target, [{ op: "EQUAL", field: `properties.${m.pk}`, values: [v] }], 1); return hit || null; }
  return typeof v === "string" ? getRecord(target, v) : null;
}

// Compare the live schemas with the contract. Returns { ok, objects: { id: { problems: [...] } } }.
async function schemaCheck() {
  const report = {}; let ok = true;
  for (const [obj, want] of Object.entries(FIELDS)) {
    const problems = []; let s = null;
    try { s = liveSchemaOf(await getObject(obj)); } catch (e) { if (e instanceof NetError || e instanceof AuthError) throw e; }
    if (!s) { report[obj] = { problems: [{ problem: "object not on the tenant" }] }; ok = false; continue; }
    schemaMem[obj] = s; writeCache((x) => { x.objects[obj] = s; });
    const props = s.properties || {}; const required = s.required || [];
    for (const f of want.auto) {
      if (!props[f]) problems.push({ field: f, problem: "auto-generated field the plugin reads is not on the tenant" });
      else if (!isAuto(props[f])) problems.push({ field: f, problem: "the contract says Orbit generates this field; on the tenant it is not auto-generate" });
    }
    for (const f of want.fields) if (!props[f]) problems.push({ field: f, problem: "in the contract; the tenant has no such field" });
    for (const f of required) if (!want.fields.includes(f) && !want.auto.includes(f) && !isAuto(props[f])) problems.push({ field: f, problem: "required on the tenant; the plugin never writes it" });
    for (const f of want.required) if (props[f] && !required.includes(f)) problems.push({ field: f, problem: "the contract says required; the tenant does not", severity: "info" });
    const extraOptions = {};
    for (const [f, sel] of Object.entries(want.selects)) {
      if (!props[f]) continue;
      const opts = optionsOf(props[f]);
      if (!opts) { problems.push({ field: f, problem: "the contract has options for this field; the tenant field lists none", contract: sel.options }); continue; }
      const targets = [...new Set(Object.values(sel.map))];
      const missing = targets.filter((v) => !opts.includes(v));
      if (missing.length) problems.push({ field: f, problem: "the plugin maps values to these, but they are not options on the tenant", notOptions: missing, liveOptions: opts });
      const notInContract = opts.filter((v) => !sel.options.includes(v));
      if (notInContract.length) extraOptions[f] = notInContract;
    }
    const refs = {};
    for (const f of Object.keys(want.refs)) if (props[f]) { try { refs[f] = await refMode(obj, f); } catch (e) { refs[f] = { error: e.message }; } }
    const real = problems.filter((p) => p.severity !== "info");
    report[obj] = { fields: Object.keys(props).length, required, problems, refs, ...(Object.keys(extraOptions).length ? { liveOptionsNotUsed: extraOptions } : {}) };
    if (real.length) ok = false;
  }
  return { ok, base: BASE, contract: path.relative(process.cwd(), CONTRACT_FILE), objects: report };
}

// Every write goes through here. `props` are internal values; the result is the Orbit record to send.
// Checks: field names (contract and tenant), never an auto field, options, required fields on the
// whole record, and every reference pointing at a record that exists. On any failure nothing is sent.
async function prepareWrite(obj, props, current = null) {
  const s = await liveSchema(obj); const live = s.properties || {};
  const want = FIELDS[obj]; const errs = [];
  const mapped = toOrbit(obj, props); errs.push(...mapped.errors);
  for (const [k, v] of Object.entries(mapped.props)) {
    const def = live[k];
    if (!want.fields.includes(k)) { errs.push(`${k}: not a field POC Studio writes on ${obj}`); continue; }
    if (!def) { errs.push(`${k}: no such field on ${obj} on the tenant`); continue; }
    if (isAuto(def)) { errs.push(`${k}: Orbit generates this field; never write it`); continue; }
    const opts = optionsOf(def) || want.selects[k]?.options || null;
    if (opts && !want.refs[k] && v !== undefined && v !== null && v !== "" && typeof v !== "object" && !opts.includes(v)) errs.push(`${k}: ${JSON.stringify(v)} is not an option (allowed: ${opts.join(", ")})`);
  }
  const whole = { ...(current || {}), ...mapped.props };
  for (const f of s.required || []) if (!isAuto(live[f]) && (whole[f] === undefined || whole[f] === null || whole[f] === "")) errs.push(`${f}: required on the tenant and missing`);
  for (const f of Object.keys(want.refs)) {
    if (!(f in mapped.props)) continue;
    const v = mapped.props[f];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string") { errs.push(`${f}: a reference must be one id, got ${JSON.stringify(v)}`); continue; }
    const hit = await resolveRef(obj, f, v);
    if (!hit) errs.push(`${f}: ${JSON.stringify(v)} is not a ${want.refs[f]} record`);
  }
  if (errs.length) { const e = new Error(`Orbit write to ${obj} stopped before sending; it does not match the contract:\n- ${errs.join("\n- ")}`); e.schema = true; e.problems = errs; throw e; }
  return mapped.props;
}

// ---------- records ----------
const getRecord = async (obj, id) => {
  try { return await api(`/api/entity/${obj}/${encodeURIComponent(id)}`); }
  catch (e) { if (e.status === 404 || e.status === 400) return null; throw e; }
};
async function findRecords(obj, filters = [], limit = 50, sort) {
  const body = { page: { limit, offset: 0 } };
  if (filters.length === 1) body.filter = filters[0];
  else if (filters.length > 1) body.filter = { op: "AND", values: filters };
  if (sort) { const [f, d] = sort.split(":"); body.sorts = [{ field: `properties.${f}`, order: (d || "asc").toUpperCase() }]; }
  const res = await api(`/api/entity/${obj}`, { method: "POST", body: JSON.stringify(body) });
  return res?.objects || [];
}
// Every create and update: internal values are mapped and the whole record is checked before sending.
async function createRecord(obj, properties) {
  const props = await prepareWrite(obj, properties);
  return api("/api/entity", { method: "POST", body: JSON.stringify({ entityType: obj, properties: props }) });
}
async function updateRecord(obj, id, patch) {
  const cur = await getRecord(obj, id);
  if (!cur) throw new Error(`${obj}/${id} not found`);
  // A row written before a field was renamed on the tenant can still carry the old key; the tenant would
  // reject the whole record, so keys the live schema no longer has are left out (and reported).
  const live = (await liveSchema(obj)).properties || {};
  const kept = {}; const stale = [];
  for (const [k, v] of Object.entries(cur.properties || {})) (live[k] ? (kept[k] = v) : stale.push(k));
  const props = await prepareWrite(obj, patch, kept);
  const r = await api("/api/entity/update", { method: "POST", body: JSON.stringify({ id: cur.id, entityType: obj, properties: { ...kept, ...props }, version: cur.version }) });
  if (stale.length && r && typeof r === "object") r.droppedStaleFields = stale;
  return r;
}
async function pocRecord(id) {
  const r = await getRecord(OBJ.poc, id);
  if (r) return r;
  const [hit] = await findRecords(OBJ.poc, [{ op: "EQUAL", field: "properties.poc_id", values: [id] }], 1);
  return hit || null;
}
const docsOf = (pocRef, limit = 1000) => findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.poc", values: [pocRef] }], limit);
// doc_id is <poc_id>__<stage>__<slug>__v<n>; the slug is read from it (the tenant keeps no slug field).
const slugOf = (docId = "") => { const parts = String(docId).split("__"); return parts.length >= 4 ? parts[parts.length - 2] : null; };

const OPEN_RUN = new Set(["running", "waiting_gate"]);
function pocSummary(r) {
  const p = r.properties || {};
  return { poc_id: p.poc_id || r.id, poc_name: p.poc_name || null, client_name: p.client_name || null, use_case: p.use_case || null,
    stage: p.stage || null, run_state: p.run_state || null, build_mode: p.build_mode || null, current_gate: p.current_gate || null,
    resume_from: p.resume_from || null, stall_reason: p.stall_reason || null, active_session: p.active_session || null,
    last_activity: p.last_activity || null, last_activity_at: p.last_activity_at || p.last_heartbeat_at || null };
}
async function downloadFile(file) {
  const fileDetails = { fileType: file.mimeType || file.fileType, name: file.name, size: file.size, source: file.source, sourceType: "CLOUD_STORAGE", "ua:type": "FILE" };
  const signed = await api("/api/file/signed-url?preview=true&expiryTime=1", { method: "POST", body: JSON.stringify({ fileDetails }) });
  const r = await rawFetch(`${signed.url}&isPublic=false&preview=true`);
  if (!r.ok) throw new Error(`File download → ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// ---------- upload (Uppy S3 multipart, as the Orbit UI does) ----------
async function userContext() { return api("/api/user-context?includeRoles=true"); }
// Bucket and directory come from the tenant (GET /api/file/upload-bucket); ORBIT_BUCKET only overrides the bucket.
async function uploadTarget() {
  let live = null;
  try { live = await api("/api/file/upload-bucket"); } catch (e) { if (e instanceof NetError || e instanceof AuthError) throw e; }
  let directory = live?.directory || live?.bucketDetails?.directory || null;
  const bucket = BUCKET_OVERRIDE || live?.bucket || live?.bucketDetails?.bucket || null;
  if (!directory) {
    const ctx = await userContext();
    const customer = ctx?.customer?.id ?? ctx?.customerId;
    if (customer !== undefined) directory = `user-uploads/${customer}`;
  }
  if (!bucket || !directory) throw new Error("Could not read the upload bucket from GET /api/file/upload-bucket. Set ORBIT_BUCKET to override.");
  return { bucket, directory, from: BUCKET_OVERRIDE ? "ORBIT_BUCKET" : "upload-bucket" };
}
async function upload(file, name, mime) {
  const buf = fs.readFileSync(file);
  name ||= path.basename(file);
  mime ||= guessMime(name);
  const target = await uploadTarget();
  const uppy = JSON.stringify({ useExternalApi: false, bucketDetails: { directory: target.directory, bucket: target.bucket }, isPublicUpload: false, isBuilderAsset: false });
  const h = { "x-ua-uppy-upload": uppy };
  const start = await api("/api/uploads/s3/multipart", { method: "POST", headers: h, body: JSON.stringify({ filename: name, type: mime, metadata: { name, type: mime } }) });
  const { uploadId, key } = start || {};
  if (!uploadId || !key) throw new Error("Upload start returned no uploadId/key.");
  const parts = [];
  for (let n = 1, off = 0; off < buf.length || n === 1; n++, off += PART) {
    const slice = buf.subarray(off, Math.min(off + PART, buf.length));
    const signed = await api(`/api/uploads/s3/multipart/${encodeURIComponent(uploadId)}/${n}?key=${encodeURIComponent(key)}`, { headers: h });
    // From a tab the PUT goes cross-origin to storage: no extra header, so there is no CORS preflight (as the Orbit UI does).
    const put = await fetch(signed.url, { method: "PUT", body: slice, ...(TAB ? {} : { headers: { "Content-Type": mime } }) }).catch((e) => { throw new NetError(`Upload part ${n} failed: ${e.message}`); });
    if (!put.ok) throw new Error(`Upload part ${n} → ${put.status}`);
    parts.push({ PartNumber: n, ETag: put.headers.get("etag") });
    if (off + PART >= buf.length) break;
  }
  const done = await api(`/api/uploads/s3/multipart/${encodeURIComponent(uploadId)}/complete?key=${encodeURIComponent(key)}`, { method: "POST", headers: h, body: JSON.stringify({ parts }) });
  const source = done?.key || key;
  const fileDetails = { fileType: mime, name, size: buf.length, source, sourceType: "CLOUD_STORAGE", "ua:type": "FILE" };
  const signed = await api("/api/file/signed-url?preview=true&expiryTime=1", { method: "POST", body: JSON.stringify({ fileDetails }) });
  return { name, source, sourceType: "CLOUD_STORAGE", mimeType: mime, fileType: mime, size: buf.length, type: "FILE",
    url: done?.location || signed?.url || null, bucket: target.bucket, directory: target.directory, bucketFrom: target.from };
}
function guessMime(n) {
  const e = path.extname(n).toLowerCase();
  return ({ ".md": "text/markdown", ".txt": "text/plain", ".html": "text/html", ".htm": "text/html", ".json": "application/json", ".csv": "text/csv", ".css": "text/css",
    ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".srt": "text/plain",
    ".zip": "application/zip", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".yml": "text/yaml", ".yaml": "text/yaml" })[e] || "application/octet-stream";
}
const isText = (mime) => /^text\/|json|yaml|svg|markdown/.test(mime);
const firstLine = (txt) => (String(txt).split("\n").map((l) => l.replace(/^#+\s*/, "").trim()).find(Boolean) || "").slice(0, 200);

// ---------- documents ----------
async function saveDoc(o) {
  for (const k of ["poc", "stage", "slug", "name", "type", "file"]) if (!o[k]) throw new Error(`save-doc needs --${k}`);
  if (String(o.slug).includes("__")) throw new Error("save-doc --slug may not contain a double underscore");
  const poc = await pocRecord(o.poc);
  if (!poc) throw new Error(`POC ${o.poc} not found in Orbit; create the POC row first.`);
  const pocId = poc.properties?.poc_id || poc.id;
  const pocRef = await refValue(OBJ.doc, "poc", poc);
  const prev = (await docsOf(pocRef)).filter((d) => slugOf(d.properties?.doc_id) === o.slug);
  const latest = prev.sort((a, b) => (b.properties?.version || 0) - (a.properties?.version || 0))[0];
  const version = (latest?.properties?.version || 0) + 1;
  // What the document is (research, brd, gate_pack …) goes in the summary; doc_type is the file's format.
  const contentTypes = FIELDS[OBJ.doc].selects.doc_type.contentTypes;
  if (!contentTypes.includes(o.type)) throw new Error(`save-doc --type ${o.type} is not a document kind POC Studio knows (${contentTypes.join(", ")})`);
  const stage = GATE_DOC_TYPES.has(o.type) ? "gates" : o.stage;
  const docStage = mapValue(OBJ.doc, "stage", stage);
  if (docStage.error) throw new Error(`save-doc --stage: ${docStage.error}`);
  const docId = `${pocId}__${docStage.value}__${o.slug}__v${version}`;
  const replaces = latest?.properties?.doc_id ? ` · replaces ${latest.properties.doc_id}` : "";
  const properties = {
    doc_id: docId, poc: pocRef, name: o.name, stage, version, doc_type: docTypeFor(o.fileName || o.file),
    gate: o.gate || "none", status: o.status || "draft", source_path: path.resolve(o.file),
    size_bytes: fs.statSync(o.file).size, created_by: o.by || "POC Studio", created_at: Date.now(),
  };
  // Check the whole record before uploading, so a mismatch leaves no stray file behind.
  await prepareWrite(OBJ.doc, properties);
  const file = await upload(o.file, o.fileName);
  const raw = isText(file.mimeType) ? fs.readFileSync(o.file, "utf8") : "";
  Object.assign(properties, { file, file_url: file.url || "", size_bytes: file.size, content: raw.length > TEXT_MAX ? raw.slice(0, TEXT_MAX) : raw,
    summary: `${o.type} · ${(o.summary || firstLine(raw) || o.name).slice(0, 300)}${replaces}` });
  await createRecord(OBJ.doc, properties);
  if (latest && latest.properties?.status !== "superseded") await updateRecord(OBJ.doc, latest.id, { status: "superseded" });
  const all = await docsOf(pocRef);
  await updateRecord(OBJ.poc, poc.id, { documents_count: all.length, last_activity: `Saved ${o.name} v${version}`, last_activity_at: Date.now() });
  return { doc_id: docId, version, doc_type: properties.doc_type, stage: docStage.value, replaces: latest?.properties?.doc_id || null, poc: properties.poc, file: { name: file.name, source: file.source, size: file.size, bucket: file.bucket, directory: file.directory },
    contentChars: properties.content.length, truncated: raw.length > TEXT_MAX };
}

async function readback(pocId) {
  const poc = await pocRecord(pocId);
  if (!poc) throw new Error(`POC ${pocId} not found`);
  const docs = await docsOf(await refValue(OBJ.doc, "poc", poc));
  const latestBySlug = {};
  for (const d of docs) { const p = d.properties || {}; const sl = slugOf(p.doc_id) || p.doc_id; if (!latestBySlug[sl] || p.version > latestBySlug[sl].version) latestBySlug[sl] = p; }
  const rows = Object.values(latestBySlug).map((p) => ({
    doc_id: p.doc_id, version: p.version, status: p.status,
    fileUploaded: Boolean(p.file?.source) && (p.file?.size ?? 0) > 0 && (p.size_bytes ? p.file.size === p.size_bytes : true),
  }));
  const queued = fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, "utf8").split("\n").filter(Boolean).length : 0;
  const skippedWrites = fs.existsSync(DEAD) ? fs.readFileSync(DEAD, "utf8").split("\n").filter(Boolean).length : 0;
  const bad = rows.filter((r) => !r.fileUploaded || r.status === "superseded");
  return { poc: pocId, documents: rows.length, queued, skippedWrites, problems: bad, ok: bad.length === 0 && queued === 0, rows };
}

// ---------- feedback ----------
async function newTicket(o) {
  if (!o.poc || !o.feedback) throw new Error("new-ticket needs --poc and --feedback");
  const poc = await pocRecord(o.poc);
  if (!poc) throw new Error(`POC ${o.poc} not found`);
  const words = String(o.feedback).startsWith("@") ? fs.readFileSync(String(o.feedback).slice(1), "utf8") : String(o.feedback);
  let byName = o.byName, byEmail = o.byEmail;
  if (!byName) { const u = await userContext().catch(() => null); byName = u?.name || u?.displayName || "POC Studio"; byEmail ||= u?.email; }
  let related;
  if (o.doc) { const [d] = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.doc_id", values: [o.doc] }], 1); if (!d) throw new Error(`Document ${o.doc} not found`); related = await refValue(OBJ.fb, "related_document", d); }
  const props = { poc: await refValue(OBJ.fb, "poc", poc), client_name: poc.properties?.client_name, title: (o.title || firstLine(words)).slice(0, 200), feedback: words,
    given_by_name: byName, given_by_email: byEmail, given_by_slack_id: o.bySlackId, channel: o.channel || "chat", source_link: o.sourceLink,
    poc_stage: o.stage || poc.properties?.stage, gate: o.gate || "none", category: o.category || "process", severity: o.severity || "medium",
    status: "open", related_document: related, created_at: Date.now() };
  for (const k of Object.keys(props)) if (props[k] === undefined || props[k] === null) delete props[k];
  const r = await createRecord(OBJ.fb, props);
  const ticket = r?.properties?.ticket_no || r?.id;
  if (!ticket) throw new Error("Orbit created the ticket but returned no ticket_no.");
  return { ticket_no: ticket, record_id: r?.id, poc: props.poc };
}
async function ticketRecord(t) {
  const r = await getRecord(OBJ.fb, t);
  if (r) return r;
  const [hit] = await findRecords(OBJ.fb, [{ op: "EQUAL", field: "properties.ticket_no", values: [t] }], 1);
  return hit || null;
}

// ---------- queue ----------
function enqueue(entry) {
  fs.mkdirSync(path.dirname(QUEUE), { recursive: true });
  fs.appendFileSync(QUEUE, JSON.stringify({ ...entry, queuedAt: new Date().toISOString() }) + "\n");
}
async function flush() {
  if (!fs.existsSync(QUEUE)) return { replayed: 0, remaining: 0, skipped: [] };
  const lines = fs.readFileSync(QUEUE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const left = []; let done = 0; const results = []; const skipped = [];
  for (const e of lines) {
    if (left.length) { left.push(e); continue; } // keep order: stop replaying at the first write that may still succeed later
    try { results.push(await run(e.cmd, e.args, e.flags, false)); done++; }
    catch (err) {
      if (err instanceof NetError || err instanceof AuthError) { left.push(e); results.push({ failed: e.cmd, error: err.message }); continue; }
      // This write can never succeed as queued (its local file is gone, or Orbit rejects it): skip it and raise a ticket.
      const poc = (e.flags?.poc || [])[0] || (e.cmd === "update" && e.args?.[0] === OBJ.poc ? e.args?.[1] : null);
      const words = `A queued Orbit write could not be replayed and was skipped: ${e.cmd} ${(e.flags?.slug || [""])[0] || ""} (queued ${e.queuedAt}). Reason: ${err.message}`.slice(0, 2000);
      let ticket = null;
      try {
        if (poc) ticket = (await newTicket({ poc, feedback: words, title: "Queued write skipped", byName: "POC Studio", category: "process", severity: "high" })).ticket_no;
      } catch (te) { if (te instanceof NetError || te instanceof AuthError) { left.push(e); results.push({ failed: e.cmd, error: te.message }); continue; } }
      fs.appendFileSync(DEAD, JSON.stringify({ ...e, skippedAt: new Date().toISOString(), reason: err.message, ticket }) + "\n");
      skipped.push({ cmd: e.cmd, reason: err.message, ticket });
    }
  }
  fs.writeFileSync(QUEUE, left.map((l) => JSON.stringify(l)).join("\n") + (left.length ? "\n" : ""));
  return { replayed: done, remaining: left.length, skipped, results };
}

// ---------- self-test on the real tenant ----------
async function selftest(f) {
  const rows = []; const t0 = Date.now(); const stamp = new Date().toISOString();
  const step = async (name, fn) => {
    try { const detail = await fn(); rows.push({ step: name, ok: detail?.ok !== false, detail: detail?.text ?? detail }); return detail; }
    catch (e) { rows.push({ step: name, ok: false, detail: e.message }); return null; }
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const compare = (wrote, rec, obj = OBJ.poc) => { const p = rec?.properties || {}; const w = toOrbit(obj, wrote).props; return Object.keys(w).filter((k) => !same(w[k], p[k])); };

  const me = await step("Signed in", async () => { const u = await userContext(); return { ok: Boolean(u), text: `${u?.name || u?.username || "?"} <${u?.email || "?"}> on ${BASE}`, u }; });
  const u = me?.u || {};
  await step("Schema check (fields and options)", async () => {
    const r = await schemaCheck();
    const n = Object.values(r.objects).reduce((a, o) => a + o.problems.length, 0);
    return { ok: r.ok, text: r.ok ? "live schemas match every field and option the plugin writes" : `${n} difference(s); run schema-check for the list` };
  });
  await step("Upload bucket", async () => { const t = await uploadTarget(); return `${t.bucket} · ${t.directory} (from ${t.from})`; });

  // POC row: reuse the self-test row (or --poc), create it the first time.
  let poc = null;
  await step("POC · write", async () => {
    if (f.poc) { poc = await pocRecord(f.poc); if (!poc) throw new Error(`POC ${f.poc} not found`); return `using ${f.poc}`; }
    const [hit] = await findRecords(OBJ.poc, [{ op: "EQUAL", field: "properties.poc_name", values: ["POC Studio · self-test"] }], 1);
    if (hit) { poc = hit; return `reusing ${hit.properties?.poc_id || hit.id} (created by an earlier self-test)`; }
    const now = Date.now();
    const wrote = { client_name: "POC Studio self-test", poc_name: "POC Studio · self-test", use_case: "Orbit write-back self-test",
      request: "Self-test of POC Studio's Orbit write-back. Safe to ignore.", owner_name: u.name || u.username || "POC Studio", owner_email: u.email,
      tier: "sprint", build_mode: "sonic", stage: "0_kickoff", status: "running", run_state: "done", current_gate: "none",
      started_at: now, last_heartbeat_at: now, last_activity: "Self-test row created", last_activity_at: now };
    for (const k of Object.keys(wrote)) if (wrote[k] === undefined) delete wrote[k];
    const r = await createRecord(OBJ.poc, wrote);
    const id = r?.properties?.poc_id || r?.id;
    if (!id) throw new Error("created, but Orbit returned no poc_id");
    poc = await pocRecord(id);
    const diff = compare(wrote, poc);
    return { ok: !diff.length, text: diff.length ? `created ${id}; read back differs on ${diff.join(", ")}` : `created ${id}; every field read back as written` };
  });
  await step("POC · update and read back", async () => {
    if (!poc) throw new Error("no POC row");
    const patch = { last_activity: `Self-test ${stamp}`, last_activity_at: Date.now(), last_heartbeat_at: Date.now() };
    const r = await updateRecord(OBJ.poc, poc.id, patch);
    poc = await getRecord(OBJ.poc, poc.id);
    const diff = compare(patch, poc);
    const stale = r?.droppedStaleFields?.length ? `; left out old fields ${r.droppedStaleFields.join(", ")}` : "";
    return { ok: !diff.length, text: diff.length ? `read back differs on ${diff.join(", ")}` : `${poc.properties?.poc_id || poc.id}: poc_id ${poc.properties?.poc_id ? "generated" : "missing"}, update read back${stale}` };
  });

  // Document with a file: save-doc, read the record back, filter by the poc reference, download the file.
  let doc = null;
  await step("Document · write with file upload", async () => {
    if (!poc) throw new Error("no POC row");
    const dir = path.resolve("studio", "selftest"); fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "orbit-selftest.md");
    fs.writeFileSync(file, `# POC Studio self-test\n\nWritten ${stamp} to check that documents and files reach Orbit and read back.\n`);
    const r = await saveDoc({ poc: poc.properties?.poc_id || poc.id, stage: "0_kickoff", slug: "selftest", name: "Orbit self-test", type: "other", file, status: "draft", summary: "Self-test document" });
    doc = { ...r, local: file };
    return `${r.doc_id} · ${r.file.size} bytes to ${r.file.bucket}/${r.file.directory}`;
  });
  await step("Document · read back", async () => {
    if (!doc) throw new Error("no document written");
    const [rec] = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.doc_id", values: [doc.doc_id] }], 1);
    if (!rec) throw new Error(`${doc.doc_id} not found by doc_id`);
    const p = rec.properties || {};
    const byRef = (await docsOf(await refValue(OBJ.doc, "poc", poc))).some((d) => d.properties?.doc_id === doc.doc_id);
    const local = fs.readFileSync(doc.local);
    const okFields = p.name === "Orbit self-test" && p.stage === "0_kickoff" && p.version === doc.version && p.content === local.toString("utf8");
    return { ok: okFields && byRef, text: `name, stage, version, content ${okFields ? "match" : "DIFFER"}; poc holds ${JSON.stringify(p.poc)}; filter by poc ${byRef ? "finds it" : "does NOT find it"}` };
  });
  await step("File · download and compare", async () => {
    if (!doc) throw new Error("no document written");
    const [rec] = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.doc_id", values: [doc.doc_id] }], 1);
    const bytes = await downloadFile(rec.properties.file);
    const local = fs.readFileSync(doc.local);
    return { ok: Buffer.compare(bytes, local) === 0, text: Buffer.compare(bytes, local) === 0 ? `${bytes.length} bytes, identical to the uploaded file` : `downloaded ${bytes.length} bytes, uploaded ${local.length}; they differ` };
  });

  // Feedback ticket: create, read back, close, read back.
  let ticket = null;
  await step("Feedback · write", async () => {
    if (!poc) throw new Error("no POC row");
    const r = await newTicket({ poc: poc.properties?.poc_id || poc.id, feedback: `Self-test ticket ${stamp}. Safe to ignore.`, title: "Orbit self-test", category: "process", severity: "low", stage: "0_kickoff", doc: doc?.doc_id });
    ticket = r.ticket_no;
    return `${r.ticket_no} created`;
  });
  await step("Feedback · read back and close", async () => {
    if (!ticket) throw new Error("no ticket written");
    const rec = await ticketRecord(ticket);
    if (!rec) throw new Error(`${ticket} not found`);
    const p = rec.properties || {};
    const okFields = p.feedback?.startsWith("Self-test ticket") && p.title === "Orbit self-test" && same(p.poc, await refValue(OBJ.fb, "poc", poc)) && Boolean(p.given_by_name);
    await updateRecord(OBJ.fb, rec.id, { status: "done", action_taken: "Self-test closed", resolved_at: Date.now() });
    const after = (await getRecord(OBJ.fb, rec.id))?.properties || {};
    return { ok: okFields && after.status === "resolved" && Boolean(after.resolved_at),
      text: `feedback, title, poc, given_by_name ${okFields ? "match" : "DIFFER"}; related_document holds ${JSON.stringify(p.related_document ?? null)}; closed: ${after.status}` };
  });
  await step("POC · counts", async () => {
    if (!poc) throw new Error("no POC row");
    const docs = await docsOf(await refValue(OBJ.doc, "poc", poc));
    const open = await findRecords(OBJ.fb, [{ op: "EQUAL", field: "properties.poc", values: [await refValue(OBJ.fb, "poc", poc)] }, { op: "IN", field: "properties.status", values: OPEN_TICKET }], 1000);
    await updateRecord(OBJ.poc, poc.id, { documents_count: docs.length, open_feedback_count: open.length });
    const p = (await getRecord(OBJ.poc, poc.id))?.properties || {};
    return { ok: p.documents_count === docs.length, text: `documents_count ${p.documents_count}, open_feedback_count ${p.open_feedback_count}` };
  });

  const ok = rows.every((r) => r.ok);
  const table = ["| Step | Result | Detail |", "|---|---|---|", ...rows.map((r) => `| ${r.step} | ${r.ok ? "pass" : "FAIL"} | ${String(typeof r.detail === "object" ? JSON.stringify(r.detail) : r.detail).replace(/\|/g, "/")} |`)].join("\n");
  process.stderr.write(table + "\n");
  return { ok, base: BASE, seconds: Math.round((Date.now() - t0) / 1000), poc: poc?.properties?.poc_id || poc?.id || null, rows };
}

// ---------- contract test on the real tenant ----------
// Writes every value the plugin can produce for every mapped field onto test rows, reads each back,
// checks references and that bad writes are stopped before sending. Deletes nothing: the rows are
// reused on every run and marked [TEST].
async function contractTest() {
  const rows = []; const t0 = Date.now(); const stamp = new Date().toISOString();
  const add = (object, field, internal, expected, got, ok, note = "") => rows.push({ object, field, internal, expected, got, ok, note });
  const tryStep = async (object, field, fn) => { try { await fn(); } catch (e) { add(object, field, "", "", "", false, e.message.split("\n").slice(0, 3).join(" / ")); } };
  const TEST = "[TEST] POC Studio contract test";
  const u = await userContext();
  const sc = await schemaCheck();
  for (const [obj, r] of Object.entries(sc.objects)) {
    const real = (r.problems || []).filter((p) => p.severity !== "info");
    add(obj, "(schema)", "", "matches the contract", real.length ? real.map((p) => `${p.field || ""} ${p.problem}${p.notOptions ? ": " + p.notOptions.join(", ") : ""}`).join("; ") : "matches", !real.length);
  }
  // Which id each reference holds, read from existing rows before anything is written.
  for (const [obj, f] of [[OBJ.doc, "poc"], [OBJ.fb, "poc"], [OBJ.fb, "related_document"]]) {
    const m = await refMode(obj, f);
    add(obj, `${f} (reference)`, "", "read from an existing row", `${m.holds}${m.sameAsPrimaryKey ? " (same as the primary key)" : ""}${m.confirmed ? `, from row ${m.from}` : ` — not confirmed: ${m.from}`}`, true, m.confirmed ? "" : "confirmed after this run's rows exist; run again to read it from them");
  }

  // POC test row.
  let poc = (await findRecords(OBJ.poc, [{ op: "EQUAL", field: "properties.poc_name", values: [TEST] }], 1))[0] || null;
  await tryStep(OBJ.poc, "(create)", async () => {
    if (poc) { add(OBJ.poc, "(create)", "", "test row", `reusing ${poc.properties?.poc_id || poc.id}`, true); return; }
    const r = await createRecord(OBJ.poc, { client_name: TEST, owner_name: u?.name || u?.username || "POC Studio", owner_email: u?.email, poc_name: TEST,
      request: "Contract test of POC Studio's Orbit writes. Test row; safe to ignore.", stage: "0_kickoff", status: "running", run_state: "running", started_at: Date.now() });
    poc = await pocRecord(r?.properties?.poc_id || r?.id);
    add(OBJ.poc, "(create)", "", "poc_id generated", poc?.properties?.poc_id || "none", Boolean(poc?.properties?.poc_id));
  });
  const sweep = async (obj, rec, field, sel) => {
    for (const internal of Object.keys(sel.map)) {
      const expected = sel.map[internal];
      try {
        await updateRecord(obj, rec.id, { [field]: internal });
        const got = (await getRecord(obj, rec.id))?.properties?.[field];
        add(obj, field, internal, expected, got, got === expected);
      } catch (e) { add(obj, field, internal, expected, "", false, e.message.split("\n").slice(0, 3).join(" / ")); }
    }
  };
  if (poc) for (const [field, sel] of Object.entries(FIELDS[OBJ.poc].selects)) await sweep(OBJ.poc, poc, field, sel);

  // Documents: one per file format (doc_type from the extension), one gate pack (stage "gates").
  let doc = null;
  if (poc) {
    const dir = path.resolve("studio", "contract-test"); fs.mkdirSync(dir, { recursive: true });
    const samples = { ".md": "# Contract test\n", ".html": "<p>Contract test</p>\n", ".json": "{\"test\":true}\n", ".csv": "a,b\n1,2\n", ".pdf": "%PDF-1.4\n% test\n",
      ".png": "PNG test bytes", ".mp4": "MP4 test bytes", ".txt": "plain text\n" };
    for (const [ext, body] of Object.entries(samples)) {
      const expected = docTypeFor(`x${ext}`);
      await tryStep(OBJ.doc, `doc_type from ${ext}`, async () => {
        const file = path.join(dir, `contract-test${ext}`); fs.writeFileSync(file, body);
        const r = await saveDoc({ poc: poc.properties?.poc_id || poc.id, stage: "0_kickoff", slug: `contract-test-${ext.slice(1)}`, name: TEST, type: "other", file, status: "draft", summary: "Test row" });
        const [rec] = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.doc_id", values: [r.doc_id] }], 1);
        const p = rec?.properties || {};
        const fileOk = Buffer.compare(await downloadFile(p.file), fs.readFileSync(file)) === 0;
        add(OBJ.doc, "doc_type", ext, expected, p.doc_type, p.doc_type === expected && fileOk, fileOk ? "file uploaded and downloaded identical" : "file differs");
        if (ext === ".md") doc = rec;
      });
    }
    await tryStep(OBJ.doc, "stage for gate packs", async () => {
      const file = path.join(dir, "contract-test-gate.md"); fs.writeFileSync(file, "# Gate pack test\n");
      const r = await saveDoc({ poc: poc.properties?.poc_id || poc.id, stage: "3_scope", slug: "contract-test-gate", name: TEST, type: "gate_pack", gate: "G2", file, status: "in_review" });
      const [rec] = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.doc_id", values: [r.doc_id] }], 1);
      add(OBJ.doc, "stage", "gate_pack (any stage)", "gates", rec?.properties?.stage, rec?.properties?.stage === "gates");
    });
    if (doc) {
      const pocRef = await refValue(OBJ.doc, "poc", poc);
      const target = await resolveRef(OBJ.doc, "poc", doc.properties.poc);
      add(OBJ.doc, "poc (reference)", "", pocRef, doc.properties.poc, doc.properties.poc === pocRef && target?.id === poc.id, target ? "resolves to the test POC row" : "does not resolve");
      for (const [field, sel] of Object.entries(FIELDS[OBJ.doc].selects)) if (field !== "doc_type") await sweep(OBJ.doc, doc, field, sel);
      await updateRecord(OBJ.doc, doc.id, { stage: "0_kickoff", status: "draft" });
    }
  }

  // Feedback ticket on the test POC, about the test document.
  let fb = null;
  if (poc) await tryStep(OBJ.fb, "(create)", async () => {
    const r = await newTicket({ poc: poc.properties?.poc_id || poc.id, feedback: `${TEST}. Test row; safe to ignore. ${stamp}`, title: TEST, category: "process", severity: "low", stage: "0_kickoff", doc: doc?.properties?.doc_id });
    fb = await ticketRecord(r.ticket_no);
    add(OBJ.fb, "(create)", "", "ticket_no generated", r.ticket_no, Boolean(fb?.properties?.ticket_no || r.ticket_no));
    const p = fb?.properties || {};
    const pocRef = await refValue(OBJ.fb, "poc", poc);
    add(OBJ.fb, "poc (reference)", "", pocRef, p.poc, p.poc === pocRef && (await resolveRef(OBJ.fb, "poc", p.poc))?.id === poc.id);
    if (doc) { const docRef = await refValue(OBJ.fb, "related_document", doc); add(OBJ.fb, "related_document (reference)", "", docRef, p.related_document, p.related_document === docRef && (await resolveRef(OBJ.fb, "related_document", p.related_document))?.id === doc.id); }
  });
  if (fb) for (const [field, sel] of Object.entries(FIELDS[OBJ.fb].selects)) await sweep(OBJ.fb, fb, field, sel);

  // Bad writes must stop before sending and leave the row unchanged.
  const mustStop = async (label, obj, rec, fn) => {
    const before = rec ? (await getRecord(obj, rec.id))?.version : null;
    try { await fn(); add(obj, "(validation)", label, "stopped before sending", "it was sent", false); }
    catch (e) {
      const after = rec ? (await getRecord(obj, rec.id))?.version : null;
      add(obj, "(validation)", label, "stopped before sending", e.schema ? "stopped" : `other error: ${e.message.slice(0, 80)}`, Boolean(e.schema) && before === after);
    }
  };
  if (poc) {
    await mustStop("stage = not_a_stage", OBJ.poc, poc, () => updateRecord(OBJ.poc, poc.id, { stage: "not_a_stage" }));
    await mustStop("unknown field", OBJ.poc, poc, () => updateRecord(OBJ.poc, poc.id, { client: "old name" }));
    await mustStop("required client_name emptied", OBJ.poc, poc, () => updateRecord(OBJ.poc, poc.id, { client_name: "" }));
    await mustStop("writing poc_id", OBJ.poc, poc, () => updateRecord(OBJ.poc, poc.id, { poc_id: "POC-_1" }));
  }
  await mustStop("document without name", OBJ.doc, null, () => createRecord(OBJ.doc, { doc_id: `contract-test-missing-name-${Date.now()}`, poc: "x", stage: "0_kickoff" }));
  if (fb) await mustStop("poc pointing at no POC", OBJ.fb, fb, () => updateRecord(OBJ.fb, fb.id, { poc: "POC-_does-not-exist" }));
  if (fb) await mustStop("severity = critical", OBJ.fb, fb, () => updateRecord(OBJ.fb, fb.id, { severity: "critical" }));

  // Leave the rows marked as test.
  try {
    if (poc) await updateRecord(OBJ.poc, poc.id, { stage: "0_kickoff", status: "stopped", run_state: "abandoned", current_gate: "none",
      stall_reason: "TEST ROW: POC Studio contract test; safe to ignore", last_activity: `Contract test ${stamp}`, last_activity_at: Date.now() });
    if (fb) await updateRecord(OBJ.fb, fb.id, { status: "wont_do", action_taken: "TEST ROW: contract test; nothing to do", resolved_at: Date.now() });
  } catch (e) { add("(all)", "(mark as test)", "", "rows marked as test", e.message.slice(0, 120), false); }

  const ok = rows.every((r) => r.ok);
  const passed = rows.filter((r) => r.ok).length;
  const md = [`# POC Studio contract test`, ``, `${BASE} · ${stamp} · ${passed} of ${rows.length} passed · test POC ${poc?.properties?.poc_id || "none"}`, ``,
    "| Object | Field | Internal value | Orbit value expected | Read back | Result | Note |", "|---|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.object} | ${r.field} | ${r.internal ?? ""} | ${r.expected ?? ""} | ${r.got ?? ""} | ${r.ok ? "pass" : "FAIL"} | ${String(r.note || "").replace(/\|/g, "/")} |`)].join("\n");
  const outDir = path.resolve("studio", "contract-test"); fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `contract-test-${stamp.replace(/[:.]/g, "-")}`);
  fs.writeFileSync(`${base}.md`, md + "\n"); fs.writeFileSync(`${base}.json`, JSON.stringify({ base: BASE, at: stamp, ok, passed, total: rows.length, rows }, null, 2));
  process.stderr.write(md + "\n");
  return { ok, passed, total: rows.length, failed: rows.filter((r) => !r.ok).map((r) => `${r.object} ${r.field} ${r.internal}: ${r.got || r.note}`), seconds: Math.round((Date.now() - t0) / 1000), report: `${base}.md`, poc: poc?.properties?.poc_id || null };
}

// ---------- commands ----------
const WRITES = new Set(["create", "update", "save-doc", "heartbeat", "new-poc", "claim", "new-ticket", "close-ticket", "sync-counts"]);
const objectsFile = (F) => F("file", path.join(path.dirname(new URL(import.meta.url).pathname), "..", "skills", "build", "references", "orbit-objects.json"));
async function run(c, p, f, canQueue = true) {
  const F = (k, d) => (f[k] ? f[k][f[k].length - 1] : d);
  try {
    switch (c) {
      case "check": {
        const u = await userContext();
        const who = { name: u?.name || u?.displayName || null, email: u?.email || null, username: u?.username || null, customer: u?.customer?.id ?? null };
        const expect = process.env.ORBIT_EXPECT;
        const mismatch = expect && ![who.email, who.username, who.name].filter(Boolean).map((s) => s.toLowerCase()).includes(expect.toLowerCase());
        const objects = {};
        for (const id of Object.values(OBJ)) objects[id] = Boolean(await getObject(id));
        return { base: BASE, user: who, expectedUser: expect || null, userMismatch: Boolean(mismatch), objects, missing: Object.keys(objects).filter((k) => !objects[k]) };
      }
      case "schema-check": {
        const r = await schemaCheck();
        if (!r.ok) { const e = new Error("The live Orbit schema does not match the fields and options POC Studio writes. Nothing was written."); e.code = 5; e.extra = r; throw e; }
        return r;
      }
      case "schema": { const o = await getObject(p[0]); if (!o) throw new Error(`object ${p[0]} not found`); return o; }
      case "ensure-objects": {
        const spec = JSON.parse(fs.readFileSync(objectsFile(F), "utf8"));
        const report = [];
        for (const o of spec.objects) {
          if (await getObject(o.id)) { report.push({ id: o.id, action: "exists, left as is" }); continue; }
          await api("/api/entity-type", { method: "POST", body: JSON.stringify({ id: o.id, name: o.name, pluralName: o.pluralName, description: o.description, metadata: o.metadata, tags: o.tags }) });
          const cur = await getObject(o.id);
          await api("/api/entity-type/update", { method: "POST", body: JSON.stringify({ ...cur, input: { type: "SCHEMA_AND_LAYOUT", schema: o.schema, layout: o.layout }, schema: { dynamic: false, type: "SCHEMA", schema: o.schema } }) });
          report.push({ id: o.id, action: "created" });
        }
        return { objects: report };
      }
      case "refresh-schemas": {
        const file = objectsFile(F);
        const spec = JSON.parse(fs.readFileSync(file, "utf8"));
        const changed = [];
        for (const o of spec.objects) {
          const live = await getObject(o.id);
          if (!live) { changed.push({ id: o.id, action: "not on the tenant, left as written" }); continue; }
          const s = liveSchemaOf(live);
          if (s) o.schema = s;
          const order = live.input?.layout?.["ui:order"] || live.layout?.["ui:order"];
          if (order) o.layout = { "ui:order": order };
          const props = o.schema?.properties || {};
          const options = {};
          for (const [k, d] of Object.entries(props)) { const opts = optionsOf(d); if (opts) options[k] = opts; }
          changed.push({ id: o.id, action: "replaced with the live schema", required: o.schema?.required || [], fields: Object.keys(props), options });
        }
        spec._about = `POC Studio's three Orbit objects, read from ${BASE} on ${new Date().toISOString().slice(0, 10)} with refresh-schemas.`;
        fs.writeFileSync(file, JSON.stringify(spec, null, 2) + "\n");
        return { file, objects: changed };
      }
      case "new-poc": {
        const props = { ...(typeof p[0] === "object" ? p[0] : readJsonArg(p[0])) };
        delete props.poc_id; // Orbit generates it
        const now = Date.now();
        if (!props.owner_name || !props.owner_email) { const u = await userContext().catch(() => null); props.owner_name ||= u?.name || u?.username; props.owner_email ||= u?.email; }
        props.started_at ??= now; props.last_heartbeat_at ??= now; props.last_activity_at ??= now; props.last_activity ??= "POC started"; props.run_state ??= "running";
        for (const k of Object.keys(props)) if (props[k] === undefined || props[k] === null) delete props[k];
        const r = await createRecord(OBJ.poc, props);
        const id = r?.properties?.poc_id || r?.id;
        if (!id) throw new Error("Orbit created the POC row but returned no poc_id; find it with find-poc before retrying, never create a second one.");
        return { poc_id: id, record_id: r?.id, version: r?.version };
      }
      case "find-poc": {
        const q = (p.join(" ") || "").toLowerCase().trim();
        const exact = q ? await pocRecord(p.join(" ").trim()) : null;
        const recent = await findRecords(OBJ.poc, [], Number(F("scan", 300)), "last_activity_at:desc");
        const hits = recent.filter((r) => { const x = r.properties || {};
          return !q || [x.poc_id, x.poc_name, x.client_name, x.client_slug, x.use_case, x.use_case_slug].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)); });
        const rows = [exact, ...hits].filter(Boolean).filter((r, i, a) => a.findIndex((s) => (s.properties?.poc_id || s.id) === (r.properties?.poc_id || r.id)) === i);
        return { count: rows.length, matches: rows.slice(0, Number(F("limit", 10))).map(pocSummary) };
      }
      case "claim": {
        const id = F("poc"), session = F("session");
        if (!id || !session) throw new Error("claim needs --poc and --session");
        const r = await pocRecord(id); if (!r) throw new Error(`POC ${id} not found`);
        const x = r.properties || {};
        const age = Date.now() - (x.last_heartbeat_at || 0);
        const other = x.active_session && x.active_session !== session;
        if (other && OPEN_RUN.has(x.run_state) && age < TAKEOVER_MS && F("force") !== "true") {
          const e = new Error(`Another session is working on ${id}: ${x.active_session}, last heartbeat ${Math.round(age / 60000)} min ago. Ask before taking over.`);
          e.code = 4; e.extra = { busy: true, active_session: x.active_session, minutesAgo: Math.round(age / 60000), run_state: x.run_state, resume_from: x.resume_from || null }; throw e;
        }
        const session_ids = [session, ...String(x.session_ids || "").split("\n").filter((s) => s && s !== session)].join("\n");
        await updateRecord(OBJ.poc, r.id, { active_session: session, last_heartbeat_at: Date.now(), last_activity_at: Date.now(), last_activity: other ? "Taken over by a new session" : "Session started", session_ids,
          ...(x.run_state === "stalled" || x.run_state === "failed" || !x.run_state ? { run_state: "running" } : {}) });
        return { poc_id: id, claimed: true, tookOverFrom: other ? x.active_session : null, previous: pocSummary(r) };
      }
      case "heartbeat": {
        const id = F("poc"); if (!id) throw new Error("heartbeat needs --poc");
        const r = await pocRecord(id); if (!r) throw new Error(`POC ${id} not found`);
        const patch = { last_heartbeat_at: Date.now(), last_activity_at: Date.now() };
        if (F("session")) patch.active_session = F("session");
        if (F("run-state")) patch.run_state = F("run-state");
        if (F("resume-from")) patch.resume_from = F("resume-from");
        if (F("stall-reason") !== undefined) patch.stall_reason = F("stall-reason") === "none" ? "" : F("stall-reason");
        if (F("stage")) patch.stage = F("stage");
        if (F("current-gate")) patch.current_gate = F("current-gate");
        patch.last_activity = F("activity") || (F("resume-from") ? `At ${F("resume-from")}` : "Working");
        const u = await updateRecord(OBJ.poc, r.id, patch);
        return { poc_id: id, version: u?.version, ...patch, ...(u?.droppedStaleFields ? { droppedStaleFields: u.droppedStaleFields } : {}) };
      }
      case "fetch-doc": {
        const id = F("poc"), slug = F("slug"), outPath = F("out");
        if (!id || !slug || !outPath) throw new Error("fetch-doc needs --poc, --slug and --out");
        const poc = await pocRecord(id); if (!poc) throw new Error(`POC ${id} not found`);
        const docs = (await docsOf(await refValue(OBJ.doc, "poc", poc), 1000)).filter((d) => slugOf(d.properties?.doc_id) === slug);
        const byVer = (a, b) => (b.properties?.version || 0) - (a.properties?.version || 0);
        const latest = docs.filter((d) => d.properties?.status !== "superseded").sort(byVer)[0] || docs.sort(byVer)[0];
        if (!latest) throw new Error(`No document ${slug} for ${id}`);
        const x = latest.properties;
        fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
        const whole = x.content && (!x.size_bytes || Buffer.byteLength(x.content) >= x.size_bytes);
        const bytes = whole ? Buffer.from(x.content) : await downloadFile(x.file);
        fs.writeFileSync(outPath, bytes);
        return { doc_id: x.doc_id, version: x.version, status: x.status, out: path.resolve(outPath), bytes: bytes.length, from: whole ? "content" : "file" };
      }
      case "get": { const r = await getRecord(p[0], p[1]); if (!r) throw new Error(`${p[0]}/${p[1]} not found`); return r; }
      case "find": {
        const filters = [];
        const asOrbit = (k, v) => mapValue(p[0], k, v).value ?? v; // internal values are mapped for reads too
        (f.field || []).forEach((fl, i) => filters.push({ op: "EQUAL", field: `properties.${fl}`, values: [asOrbit(fl, (f.value || [])[i])] }));
        for (const s of f.in || []) { const [k, v] = s.split("="); filters.push({ op: "IN", field: `properties.${k}`, values: v.split(",").map((x) => asOrbit(k, x)) }); }
        const rows = await findRecords(p[0], filters, Number(F("limit", 50)), F("sort"));
        return { count: rows.length, rows };
      }
      case "create": { const r = await createRecord(p[0], typeof p[1] === "object" ? p[1] : readJsonArg(p[1])); return { id: r?.id, version: r?.version, properties: r?.properties }; }
      case "update": { const r = await updateRecord(p[0], p[1], typeof p[2] === "object" ? p[2] : readJsonArg(p[2])); return { id: r?.id, version: r?.version, droppedStaleFields: r?.droppedStaleFields }; }
      case "upload": return await upload(p[0], F("name"), F("mime"));
      case "save-doc": return await saveDoc({ poc: F("poc"), stage: F("stage"), slug: F("slug"), name: F("name", F("title")), type: F("type"), file: F("file"),
        status: F("status"), gate: F("gate"), summary: F("summary"), by: F("by"), fileName: F("file-name") });
      case "readback": return await readback(F("poc"));
      case "new-ticket": return await newTicket({ poc: F("poc"), feedback: F("feedback"), title: F("title"), byName: F("by-name"), byEmail: F("by-email"), bySlackId: F("by-slack-id"),
        stage: F("stage"), gate: F("gate"), category: F("category"), severity: F("severity"), doc: F("doc"), sourceLink: F("source-link"), channel: F("channel") });
      case "close-ticket": {
        const t = F("ticket"); if (!t || !F("action")) throw new Error("close-ticket needs --ticket and --action");
        const r = await ticketRecord(t); if (!r) throw new Error(`Ticket ${t} not found`);
        const status = F("status", "done");
        const closed = ["resolved", "wont_fix"].includes(mapValue(OBJ.fb, "status", status).value);
        await updateRecord(OBJ.fb, r.id, { status, action_taken: F("action"), ...(closed ? { resolved_at: Date.now() } : {}) });
        return { ticket_no: r.properties?.ticket_no || t, status: mapValue(OBJ.fb, "status", status).value };
      }
      case "sync-counts": {
        const id = F("poc");
        const poc = await pocRecord(id); if (!poc) throw new Error(`POC ${id} not found`);
        const docs = await docsOf(await refValue(OBJ.doc, "poc", poc));
        const open = await findRecords(OBJ.fb, [{ op: "EQUAL", field: "properties.poc", values: [await refValue(OBJ.fb, "poc", poc)] }, { op: "IN", field: "properties.status", values: OPEN_TICKET }], 1000);
        await updateRecord(OBJ.poc, poc.id, { documents_count: docs.length, open_feedback_count: open.length, last_activity_at: Date.now() });
        return { poc: id, documents_count: docs.length, open_feedback_count: open.length };
      }
      case "flush": return await flush();
      case "contract-test": { const r = await contractTest(); if (!r.ok) { const e = new Error(`Contract test: ${r.total - r.passed} of ${r.total} failed; see ${r.report}.`); e.extra = r; throw e; } return r; }
      case "selftest": { const r = await selftest({ poc: F("poc") }); if (!r.ok) { const e = new Error("Self-test found problems; see the table."); e.extra = r; throw e; } return r; }
      default: throw new Error(`unknown command "${c}". Commands: check, schema-check, schema, refresh-schemas, ensure-objects, new-poc, find-poc, claim, heartbeat, get, find, create, update, upload, save-doc, fetch-doc, readback, new-ticket, close-ticket, sync-counts, flush, selftest, contract-test`);
    }
  } catch (e) {
    if (canQueue && WRITES.has(c) && (e instanceof NetError || e instanceof AuthError)) {
      // A write that could not reach Orbit is kept, in order, for `flush`. A local file must still exist then.
      const pinned = ["create", "update", "new-poc"].includes(c) ? p.map((x) => (typeof x === "string" && x.startsWith("@") ? readJsonArg(x) : x)) : p;
      const fl = { ...f }; if (fl.file) fl.file = fl.file.map((x) => path.resolve(x));
      if (fl.feedback) fl.feedback = fl.feedback.map((x) => (x.startsWith("@") ? fs.readFileSync(x.slice(1), "utf8") : x));
      enqueue({ cmd: c, args: pinned, flags: fl });
      const err = new Error(e.message); err.queued = true; err.reconnect = e instanceof AuthError; throw err;
    }
    if (e.schema) e.code = 5;
    throw e;
  }
}

run(cmd, pos, flags)
  .then((r) => out({ ok: true, ...((r && typeof r === "object" && !Array.isArray(r)) ? r : { result: r }) }))
  .catch((e) => (e.queued
    ? out({ ok: false, queued: true, reconnect: e.reconnect, error: e.message, next: "Reconnect Orbit, then run: node scripts/orbit-api.mjs flush" }, 3)
    : e.code === 4 || e.code === 5 ? out({ ok: false, error: e.message, ...(e.extra || {}) }, e.code) : fail(e.message, e.extra || {})));
