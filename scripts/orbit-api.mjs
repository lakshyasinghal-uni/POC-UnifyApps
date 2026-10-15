#!/usr/bin/env node
/**
 * orbit-api.mjs — POC Studio's direct client for Orbit (UnifyApps), no browser.
 *
 * Auth (environment secrets, never pasted in chat, never printed):
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
 * Field names are the live tenant's (FIELDS below). Every write is checked against the live schema
 * first: a field the tenant does not have, or a single-select value that is not one of its options,
 * stops the write with a clear message. Nothing is renamed or changed on the fly.
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

// ---------- what the plugin writes (the live tenant's names; checked by schema-check) ----------
const STAGES = ["0_kickoff", "1_signal_capture", "2_research_assess", "3_scope", "4_design_system", "5_build", "6_finalize", "7_collaterals", "demo_ready"];
const GATES = ["none", "G1", "G2", "G3", "G4"];
const GATE_STATUS = ["not_started", "asked", "approved", "approved_partial", "approved_with_changes", "changes_requested", "blocked", "stopped", "held", "released"];
const FIELDS = {
  [OBJ.poc]: {
    auto: ["poc_id"],
    required: ["client_name", "owner_name"],
    fields: ["client_name", "client_slug", "use_case", "use_case_slug", "poc_name", "request", "owner_name", "owner_email", "owner_slack_id",
      "tier", "demo_date", "build_mode", "stage", "status", "run_state", "current_gate", "g1_status", "g2_status", "g3_status", "g4_status",
      "resume_from", "stall_reason", "active_session", "session_ids", "last_heartbeat_at", "started_at", "last_activity", "last_activity_at",
      "slack_destination", "last_gate_thread", "tenant_host", "solution_name", "documents_count", "open_feedback_count"],
    selects: { tier: ["sprint", "standard", "full"], build_mode: ["sonic", "zen"], stage: STAGES,
      status: ["running", "waiting_on_gate", "waiting_on_reconnect", "blocked", "stopped", "held", "released"],
      run_state: ["running", "waiting_gate", "stalled", "failed", "done", "abandoned"], current_gate: GATES,
      g1_status: GATE_STATUS, g2_status: GATE_STATUS, g3_status: GATE_STATUS, g4_status: GATE_STATUS },
    refs: {},
  },
  [OBJ.doc]: {
    auto: [],
    required: ["doc_id", "poc", "name", "stage"],
    fields: ["doc_id", "poc", "name", "stage", "version", "doc_type", "gate", "status", "file", "content", "summary", "source_path", "file_url",
      "size_bytes", "created_by", "created_at"],
    selects: { stage: STAGES, gate: GATES, status: ["draft", "in_review", "approved", "superseded"],
      doc_type: ["research", "assessment", "context_notes", "data_plan", "scope", "brd", "design_system", "evidence", "rehearsal", "checks",
        "runbook", "explainer", "video", "pdf", "field_note", "gate_pack", "gate_decision", "text2code_prompt", "other"] },
    refs: { poc: OBJ.poc },
  },
  [OBJ.fb]: {
    auto: ["ticket_no"],
    required: ["poc", "feedback", "given_by_name"],
    fields: ["title", "poc", "related_document", "client_name", "feedback", "given_by_name", "given_by_email", "given_by_slack_id", "channel",
      "source_link", "poc_stage", "gate", "category", "severity", "status", "action_taken", "created_at", "resolved_at"],
    selects: { channel: ["chat"], poc_stage: STAGES, gate: GATES,
      category: ["scope", "requirement", "design", "data", "build_defect", "content", "collateral", "process", "skill"],
      severity: ["low", "medium", "high", "blocker"], status: ["open", "acknowledged", "in_progress", "done", "wont_do"] },
    refs: { poc: OBJ.poc, related_document: OBJ.doc },
  },
};
const OPEN_TICKET = ["open", "acknowledged", "in_progress"];
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
  if (withCookie && cookie) headers.Cookie = cookie;
  try {
    return await fetch(p.startsWith("http") ? p : BASE + p, { ...init, headers, redirect: "manual" });
  } catch (e) {
    throw new NetError(`Orbit could not be reached: ${e.cause?.code || e.message}`);
  }
}

async function api(p, init = {}, retried = false) {
  if (!cookie) await login();
  const r = await rawFetch(p, init);
  const ct = r.headers.get("content-type") || "";
  if (r.status === 401 || (r.status >= 300 && r.status < 400) || ct.includes("text/html")) {
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
async function liveSchema(obj) {
  if (schemaMem[obj]) return schemaMem[obj];
  try {
    const c = JSON.parse(fs.readFileSync(SCHEMA_CACHE, "utf8"));
    if (c.base === BASE && c.objects?.[obj] && Date.now() - c.at < SCHEMA_TTL) return (schemaMem[obj] = c.objects[obj]);
  } catch {}
  const s = liveSchemaOf(await getObject(obj));
  if (!s) throw new Error(`Object ${obj} is not on ${BASE}. Run setup (ensure-objects) first.`);
  schemaMem[obj] = s;
  try {
    let c = {}; try { c = JSON.parse(fs.readFileSync(SCHEMA_CACHE, "utf8")); } catch {}
    if (c.base !== BASE || Date.now() - (c.at || 0) >= SCHEMA_TTL) c = { base: BASE, at: Date.now(), objects: {} };
    c.objects[obj] = s; fs.mkdirSync(path.dirname(SCHEMA_CACHE), { recursive: true }); fs.writeFileSync(SCHEMA_CACHE, JSON.stringify(c));
  } catch {}
  return s;
}
// The allowed values of a single-select, wherever the schema keeps them; null when it lists none (a reference).
function optionsOf(def = {}) {
  const pick = (arr) => (Array.isArray(arr) ? arr.map((o) => (o && typeof o === "object" ? (o.const ?? o.value ?? o.id) : o)).filter((v) => v !== undefined) : null);
  return pick(def.oneOf) || pick(def.anyOf) || pick(def.enum) || pick(def.items?.oneOf) || pick(def.items?.enum) || pick(def.options) || null;
}
const isAuto = (def = {}) => def.format === "auto-generate" || Boolean(def.autoGeneratedFieldDefinition);

// Compare the live schemas with FIELDS. Returns { ok, objects: { id: { problems: [...] } } }.
async function schemaCheck() {
  const report = {}; let ok = true;
  for (const [obj, want] of Object.entries(FIELDS)) {
    const problems = []; let s = null;
    try { s = liveSchemaOf(await getObject(obj)); } catch (e) { if (e instanceof NetError || e instanceof AuthError) throw e; }
    if (!s) { report[obj] = { problems: [{ problem: "object not on the tenant" }] }; ok = false; continue; }
    schemaMem[obj] = s;
    const props = s.properties || {}; const required = s.required || [];
    for (const f of want.auto) {
      if (!props[f]) problems.push({ field: f, problem: "auto-generated field the plugin reads is not on the tenant" });
      else if (!isAuto(props[f])) problems.push({ field: f, problem: "expected Orbit to generate this field, but it is not auto-generate on the tenant", live: props[f] });
    }
    for (const f of want.fields) if (!props[f]) problems.push({ field: f, problem: "the plugin writes this field; the tenant has no such field" });
    for (const f of required) if (!want.fields.includes(f) && !want.auto.includes(f) && !isAuto(props[f])) problems.push({ field: f, problem: "required on the tenant; the plugin never writes it" });
    for (const f of want.required) if (props[f] && !required.includes(f)) {/* the plugin always writes it; optional on the tenant is fine */}
    for (const [f, values] of Object.entries(want.selects)) {
      if (!props[f]) continue;
      const opts = optionsOf(props[f]);
      if (!opts) { problems.push({ field: f, problem: "the plugin writes fixed values here, but the tenant field lists no options", plugin: values, live: props[f] }); continue; }
      const missing = values.filter((v) => !opts.includes(v));
      if (missing.length) problems.push({ field: f, problem: "values the plugin writes that are not options on the tenant", notOptions: missing, liveOptions: opts });
    }
    const refs = {};
    for (const [f, target] of Object.entries(want.refs)) if (props[f]) refs[f] = { refersTo: target, live: props[f] };
    report[obj] = { fields: Object.keys(props).length, required, problems, refs };
    if (problems.length) ok = false;
  }
  return { ok, base: BASE, objects: report };
}

// Every write goes through here: fields and single-select values must exist on the live tenant.
async function checkWrite(obj, patch) {
  const s = await liveSchema(obj); const props = s.properties || {};
  const errs = [];
  for (const [k, v] of Object.entries(patch)) {
    const def = props[k];
    if (!def) { errs.push(`${k}: no such field on ${obj}`); continue; }
    if (isAuto(def)) { errs.push(`${k}: Orbit generates this field; never write it`); continue; }
    const opts = optionsOf(def);
    if (opts && v !== undefined && v !== null && v !== "") {
      const vals = Array.isArray(v) ? v : [v];
      const bad = vals.filter((x) => typeof x !== "object" && !opts.includes(x));
      if (bad.length) errs.push(`${k}: ${bad.map((b) => JSON.stringify(b)).join(", ")} is not an option (allowed: ${opts.join(", ")})`);
    }
  }
  if (errs.length) { const e = new Error(`Orbit write to ${obj} stopped; the live schema does not match:\n- ${errs.join("\n- ")}\nRun: node scripts/orbit-api.mjs schema-check`); e.schema = true; throw e; }
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
async function createRecord(obj, properties) {
  await checkWrite(obj, properties);
  return api("/api/entity", { method: "POST", body: JSON.stringify({ entityType: obj, properties }) });
}
async function updateRecord(obj, id, patch) {
  await checkWrite(obj, patch);
  const cur = await getRecord(obj, id);
  if (!cur) throw new Error(`${obj}/${id} not found`);
  // A row written before a field was renamed on the tenant can still carry the old key; the tenant would
  // reject the whole record, so keys the live schema no longer has are left out (and reported).
  const live = (await liveSchema(obj)).properties || {};
  const kept = {}; const stale = [];
  for (const [k, v] of Object.entries(cur.properties || {})) (live[k] ? (kept[k] = v) : stale.push(k));
  const r = await api("/api/entity/update", { method: "POST", body: JSON.stringify({ id: cur.id, entityType: obj, properties: { ...kept, ...patch }, version: cur.version }) });
  if (stale.length && r && typeof r === "object") r.droppedStaleFields = stale;
  return r;
}
// The value a reference field (poc, related_document) holds: the referenced record's id.
const refValue = (rec) => rec?.id ?? null;
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
    const put = await fetch(signed.url, { method: "PUT", body: slice, headers: { "Content-Type": mime } }).catch((e) => { throw new NetError(`Upload part ${n} failed: ${e.message}`); });
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
  const prev = (await docsOf(refValue(poc))).filter((d) => slugOf(d.properties?.doc_id) === o.slug);
  const latest = prev.sort((a, b) => (b.properties?.version || 0) - (a.properties?.version || 0))[0];
  const version = (latest?.properties?.version || 0) + 1;
  // Check the fixed values before uploading, so a mismatch leaves no stray file behind.
  await checkWrite(OBJ.doc, { stage: o.stage, doc_type: o.type, gate: o.gate || "none", status: o.status || "draft" });
  const file = await upload(o.file, o.fileName);
  const raw = isText(file.mimeType) ? fs.readFileSync(o.file, "utf8") : "";
  const docId = `${pocId}__${o.stage}__${o.slug}__v${version}`;
  const replaces = latest?.properties?.doc_id ? ` · replaces ${latest.properties.doc_id}` : "";
  const properties = {
    doc_id: docId, poc: refValue(poc), name: o.name, stage: o.stage, version, doc_type: o.type,
    gate: o.gate || "none", status: o.status || "draft", file, content: raw.length > TEXT_MAX ? raw.slice(0, TEXT_MAX) : raw,
    summary: `${(o.summary || firstLine(raw) || o.name).slice(0, 300)}${replaces}`, source_path: path.resolve(o.file), file_url: file.url || "",
    size_bytes: file.size, created_by: o.by || "POC Studio", created_at: Date.now(),
  };
  await createRecord(OBJ.doc, properties);
  if (latest && latest.properties?.status !== "superseded") await updateRecord(OBJ.doc, latest.id, { status: "superseded" });
  const all = await docsOf(refValue(poc));
  await updateRecord(OBJ.poc, poc.id, { documents_count: all.length, last_activity: `Saved ${o.name} v${version}`, last_activity_at: Date.now() });
  return { doc_id: docId, version, replaces: latest?.properties?.doc_id || null, poc: properties.poc, file: { name: file.name, source: file.source, size: file.size, bucket: file.bucket, directory: file.directory },
    contentChars: properties.content.length, truncated: raw.length > TEXT_MAX };
}

async function readback(pocId) {
  const poc = await pocRecord(pocId);
  if (!poc) throw new Error(`POC ${pocId} not found`);
  const docs = await docsOf(refValue(poc));
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
  if (o.doc) { const [d] = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.doc_id", values: [o.doc] }], 1); if (!d) throw new Error(`Document ${o.doc} not found`); related = refValue(d); }
  const props = { poc: refValue(poc), client_name: poc.properties?.client_name, title: (o.title || firstLine(words)).slice(0, 200), feedback: words,
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
  const compare = (wrote, rec) => { const p = rec?.properties || {}; const diff = Object.keys(wrote).filter((k) => !same(wrote[k], p[k])); return diff; };

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
    const byRef = (await docsOf(refValue(poc))).some((d) => d.properties?.doc_id === doc.doc_id);
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
    const okFields = p.feedback?.startsWith("Self-test ticket") && p.title === "Orbit self-test" && same(p.poc, refValue(poc)) && Boolean(p.given_by_name);
    await updateRecord(OBJ.fb, rec.id, { status: "done", action_taken: "Self-test closed", resolved_at: Date.now() });
    const after = (await getRecord(OBJ.fb, rec.id))?.properties || {};
    return { ok: okFields && after.status === "done" && Boolean(after.resolved_at),
      text: `feedback, title, poc, given_by_name ${okFields ? "match" : "DIFFER"}; related_document holds ${JSON.stringify(p.related_document ?? null)}; closed: ${after.status}` };
  });
  await step("POC · counts", async () => {
    if (!poc) throw new Error("no POC row");
    const docs = await docsOf(refValue(poc));
    const open = await findRecords(OBJ.fb, [{ op: "EQUAL", field: "properties.poc", values: [refValue(poc)] }, { op: "IN", field: "properties.status", values: OPEN_TICKET }], 1000);
    await updateRecord(OBJ.poc, poc.id, { documents_count: docs.length, open_feedback_count: open.length });
    const p = (await getRecord(OBJ.poc, poc.id))?.properties || {};
    return { ok: p.documents_count === docs.length, text: `documents_count ${p.documents_count}, open_feedback_count ${p.open_feedback_count}` };
  });

  const ok = rows.every((r) => r.ok);
  const table = ["| Step | Result | Detail |", "|---|---|---|", ...rows.map((r) => `| ${r.step} | ${r.ok ? "pass" : "FAIL"} | ${String(typeof r.detail === "object" ? JSON.stringify(r.detail) : r.detail).replace(/\|/g, "/")} |`)].join("\n");
  process.stderr.write(table + "\n");
  return { ok, base: BASE, seconds: Math.round((Date.now() - t0) / 1000), poc: poc?.properties?.poc_id || poc?.id || null, rows };
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
        const docs = (await docsOf(refValue(poc), 1000)).filter((d) => slugOf(d.properties?.doc_id) === slug);
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
        (f.field || []).forEach((fl, i) => filters.push({ op: "EQUAL", field: `properties.${fl}`, values: [(f.value || [])[i]] }));
        for (const s of f.in || []) { const [k, v] = s.split("="); filters.push({ op: "IN", field: `properties.${k}`, values: v.split(",") }); }
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
        await updateRecord(OBJ.fb, r.id, { status, action_taken: F("action"), ...(status === "done" || status === "wont_do" ? { resolved_at: Date.now() } : {}) });
        return { ticket_no: r.properties?.ticket_no || t, status };
      }
      case "sync-counts": {
        const id = F("poc");
        const poc = await pocRecord(id); if (!poc) throw new Error(`POC ${id} not found`);
        const docs = await docsOf(refValue(poc));
        const open = await findRecords(OBJ.fb, [{ op: "EQUAL", field: "properties.poc", values: [refValue(poc)] }, { op: "IN", field: "properties.status", values: OPEN_TICKET }], 1000);
        await updateRecord(OBJ.poc, poc.id, { documents_count: docs.length, open_feedback_count: open.length, last_activity_at: Date.now() });
        return { poc: id, documents_count: docs.length, open_feedback_count: open.length };
      }
      case "flush": return await flush();
      case "selftest": { const r = await selftest({ poc: F("poc") }); if (!r.ok) { const e = new Error("Self-test found problems; see the table."); e.extra = r; throw e; } return r; }
      default: throw new Error(`unknown command "${c}". Commands: check, schema-check, schema, refresh-schemas, ensure-objects, new-poc, find-poc, claim, heartbeat, get, find, create, update, upload, save-doc, fetch-doc, readback, new-ticket, close-ticket, sync-counts, flush, selftest`);
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
