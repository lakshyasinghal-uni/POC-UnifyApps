#!/usr/bin/env node
/**
 * orbit-api.mjs — POC Studio's direct client for Orbit (UnifyApps), no browser.
 *
 * Auth (environment secrets, never pasted in chat, never printed):
 *   ORBIT_COOKIE                      the whole Cookie header of a signed-in session, or
 *   ORBIT_USERNAME + ORBIT_PASSWORD   a LOCAL (non-SSO) account; logs in each run
 *   ORBIT_BASE      default https://orbit.uat.unifyapps.com
 *   ORBIT_IDP       local identity provider id (UAT default 65d2f4cf672d16da08efc3d0)
 *   ORBIT_BUCKET    upload bucket (default uat-uploads.unifyapps.com)
 *   ORBIT_EXPECT    the Orbit user (email or username) setup recorded; `check` warns on a mismatch
 *   ORBIT_QUEUE     queued-writes file (default studio/.orbit-queue.jsonl); writes that can never be
 *                   replayed move to the same path with .dead.jsonl, each with a feedback ticket
 *   ORBIT_TAKEOVER_HOURS   a heartbeat younger than this belongs to a live session (default 2)
 *
 * Commands (every result is one JSON line on stdout; exit 0 ok, 1 error, 3 queued for later,
 * 4 another session holds the POC):
 *   check                                      who is signed in, and whether the three objects exist
 *   schema   <objectId>                        the live object definition
 *   refresh-schemas [--file <orbit-objects.json>]  write the live schemas of the three objects into the file
 *   ensure-objects [--file <orbit-objects.json>]   create any missing object, never alter one
 *   new-poc  <json | @file>                    create a POC row; Orbit generates poc_id (POC-_1001 …), returned
 *   find-poc <text> [--limit n]                POCs whose id, name, client or use case match, newest first
 *   claim    --poc <id> --session <link> [--force]   take the row for this session; exit 4 if another
 *                                              session's heartbeat is younger than ORBIT_TAKEOVER_HOURS
 *   heartbeat --poc <id> --session <link> [--run-state s] [--resume-from r] [--stall-reason r]
 *            [--stage s] [--current-gate g]    keep the run fields current
 *   get      <objectId> <recordId>
 *   find     <objectId> [--field f --value v]... [--in f=v1,v2] [--limit n] [--sort f:desc]
 *   create   <objectId> <json | @file>
 *   update   <objectId> <recordId> <json | @file>   read, merge properties, write the full record
 *   upload   <path> [--name n] [--mime m]      returns the File-field value
 *   save-doc --poc <pocId> --stage <stage> --slug <slug> --title <t> --type <docType> --file <path>
 *            [--status draft|in_review|approved] [--gate G1..G4] [--by <name>]
 *   fetch-doc --poc <pocId> --slug <slug> --out <path>   the latest version's text (or file) to a local path
 *   readback --poc <pocId>                     every latest document: file uploaded, version, status
 *   sync-counts --poc <pocId>                  recompute document_count and open_feedback_count on the POC row
 *   flush                                      replay queued writes in order; one that can never succeed
 *                                              (its local file is gone, or Orbit rejects it) is skipped
 *                                              and becomes a feedback ticket
 *
 * It never deletes: there is no delete command, and superseding a document is a status change.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.ORBIT_BASE || "https://orbit.uat.unifyapps.com").replace(/\/$/, "");
const IDP = process.env.ORBIT_IDP || "65d2f4cf672d16da08efc3d0";
const BUCKET = process.env.ORBIT_BUCKET || "uat-uploads.unifyapps.com";
const QUEUE = path.resolve(process.env.ORBIT_QUEUE || path.join("studio", ".orbit-queue.jsonl"));
const DEAD = QUEUE.replace(/\.jsonl$/, "") + ".dead.jsonl";
const TAKEOVER_MS = Number(process.env.ORBIT_TAKEOVER_HOURS || 2) * 3600_000;
const OBJ = { poc: "poc_studio_poc", doc: "poc_studio_document", fb: "poc_studio_feedback" };
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

// ---------- records ----------
const getObject = (id) => api(`/api/entity-type?entityType=${encodeURIComponent(id)}`);
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
const createRecord = (obj, properties) => api("/api/entity", { method: "POST", body: JSON.stringify({ entityType: obj, properties }) });
async function updateRecord(obj, id, patch) {
  const cur = await getRecord(obj, id);
  if (!cur) throw new Error(`${obj}/${id} not found`);
  const properties = { ...(cur.properties || {}), ...patch };
  return api("/api/entity/update", { method: "POST", body: JSON.stringify({ id: cur.id, entityType: obj, properties, version: cur.version }) });
}

const OPEN_RUN = new Set(["running", "waiting_gate"]);
function pocSummary(r) {
  const p = r.properties || {};
  return { poc_id: p.poc_id || r.id, poc_name: p.poc_name || null, client: p.client || null, use_case: p.use_case || null,
    stage: p.stage || null, run_state: p.run_state || null, build_mode: p.build_mode || null, current_gate: p.current_gate || null,
    resume_from: p.resume_from || null, stall_reason: p.stall_reason || null, active_session: p.active_session || null,
    last_activity: p.last_heartbeat_at || p.updated_at || null };
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
async function upload(file, name, mime) {
  const buf = fs.readFileSync(file);
  name ||= path.basename(file);
  mime ||= guessMime(name);
  const ctx = await userContext();
  const customer = ctx?.customer?.id ?? ctx?.customerId;
  if (customer === undefined) throw new Error("Could not read the customer id from user-context.");
  const uppy = JSON.stringify({ useExternalApi: false, bucketDetails: { directory: `user-uploads/${customer}`, bucket: BUCKET }, isPublicUpload: false, isBuilderAsset: false });
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
  return { name, source, sourceType: "CLOUD_STORAGE", mimeType: mime, fileType: mime, size: buf.length, type: "FILE", url: signed?.url || done?.location || null };
}
function guessMime(n) {
  const e = path.extname(n).toLowerCase();
  return ({ ".md": "text/markdown", ".txt": "text/plain", ".html": "text/html", ".htm": "text/html", ".json": "application/json", ".csv": "text/csv", ".css": "text/css",
    ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".srt": "text/plain",
    ".zip": "application/zip", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".yml": "text/yaml", ".yaml": "text/yaml" })[e] || "application/octet-stream";
}
const isText = (mime) => /^text\/|json|yaml|svg|markdown/.test(mime);

// ---------- documents ----------
async function saveDoc(o) {
  for (const k of ["poc", "stage", "slug", "title", "type", "file"]) if (!o[k]) throw new Error(`save-doc needs --${k}`);
  const poc = await getRecord(OBJ.poc, o.poc);
  if (!poc) throw new Error(`POC ${o.poc} not found in Orbit; create the POC row first.`);
  const prev = await findRecords(OBJ.doc, [
    { op: "EQUAL", field: "properties.poc_id", values: [o.poc] },
    { op: "EQUAL", field: "properties.file_slug", values: [o.slug] },
  ], 200);
  const latest = prev.sort((a, b) => (b.properties?.version || 0) - (a.properties?.version || 0))[0];
  const version = (latest?.properties?.version || 0) + 1;
  const file = await upload(o.file, o.name);
  const raw = isText(file.mimeType) ? fs.readFileSync(o.file, "utf8") : "";
  const docId = `${o.poc}__${o.stage}__${o.slug}__v${version}`;
  const properties = {
    doc_id: docId, title: o.title, poc_id: o.poc, stage: o.stage, file_slug: o.slug, version, doc_type: o.type,
    gate: o.gate || "none", status: o.status || "draft", file, content: raw.length > TEXT_MAX ? raw.slice(0, TEXT_MAX) : raw,
    mime_type: file.mimeType, size_bytes: file.size, supersedes: latest?.properties?.doc_id || "", created_by: o.by || "POC Studio", created_at: Date.now(),
  };
  await createRecord(OBJ.doc, properties);
  if (latest && latest.properties?.status !== "superseded") await updateRecord(OBJ.doc, latest.id, { status: "superseded" });
  const all = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.poc_id", values: [o.poc] }], 1000);
  await updateRecord(OBJ.poc, o.poc, { document_count: all.length, updated_at: Date.now() });
  return { doc_id: docId, version, supersedes: properties.supersedes || null, file: { name: file.name, source: file.source, size: file.size }, contentChars: properties.content.length, truncated: raw.length > TEXT_MAX };
}

async function readback(pocId) {
  const docs = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.poc_id", values: [pocId] }], 1000);
  const latestBySlug = {};
  for (const d of docs) { const p = d.properties || {}; if (!latestBySlug[p.file_slug] || p.version > latestBySlug[p.file_slug].version) latestBySlug[p.file_slug] = p; }
  const rows = Object.values(latestBySlug).map((p) => ({
    doc_id: p.doc_id, version: p.version, status: p.status,
    fileUploaded: Boolean(p.file?.source) && (p.file?.size ?? 0) > 0 && (p.size_bytes ? p.file.size === p.size_bytes : true),
  }));
  const queued = fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, "utf8").split("\n").filter(Boolean).length : 0;
  const skippedWrites = fs.existsSync(DEAD) ? fs.readFileSync(DEAD, "utf8").split("\n").filter(Boolean).length : 0;
  const bad = rows.filter((r) => !r.fileUploaded || r.status === "superseded");
  return { poc: pocId, documents: rows.length, queued, skippedWrites, problems: bad, ok: bad.length === 0 && queued === 0, rows };
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
      const poc = (e.flags?.poc || [])[0] || e.args?.find?.((a) => a && typeof a === "object" && a.poc_id)?.poc_id || e.args?.[1];
      const words = `A queued Orbit write could not be replayed and was skipped: ${e.cmd} ${(e.flags?.slug || [""])[0] || ""} (queued ${e.queuedAt}). Reason: ${err.message}`.slice(0, 2000);
      let ticket = null;
      try {
        const r = await createRecord(OBJ.fb, { poc_id: poc, summary: "Queued write skipped", words, given_by: "POC Studio", giver_role: "other", ledger_tag: "COMMENT",
          channel: "chat", category: "process", severity: "high", status: "open", created_at: Date.now() });
        ticket = r?.id || r?.properties?.ticket || null;
      } catch (te) { if (te instanceof NetError || te instanceof AuthError) { left.push(e); results.push({ failed: e.cmd, error: te.message }); continue; } }
      fs.appendFileSync(DEAD, JSON.stringify({ ...e, skippedAt: new Date().toISOString(), reason: err.message, ticket }) + "\n");
      skipped.push({ cmd: e.cmd, reason: err.message, ticket });
    }
  }
  fs.writeFileSync(QUEUE, left.map((l) => JSON.stringify(l)).join("\n") + (left.length ? "\n" : ""));
  return { replayed: done, remaining: left.length, skipped, results };
}

// ---------- commands ----------
const WRITES = new Set(["create", "update", "save-doc", "heartbeat", "new-poc"]);
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
      case "schema": { const o = await getObject(p[0]); if (!o) throw new Error(`object ${p[0]} not found`); return o; }
      case "ensure-objects": {
        const file = F("file", path.join(path.dirname(new URL(import.meta.url).pathname), "..", "skills", "build", "references", "orbit-objects.json"));
        const spec = JSON.parse(fs.readFileSync(file, "utf8"));
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
        const file = F("file", path.join(path.dirname(new URL(import.meta.url).pathname), "..", "skills", "build", "references", "orbit-objects.json"));
        const spec = JSON.parse(fs.readFileSync(file, "utf8"));
        const changed = [];
        for (const o of spec.objects) {
          const live = await getObject(o.id);
          if (!live) { changed.push({ id: o.id, action: "not on the tenant, left as written" }); continue; }
          const s = live.schema?.schema || live.input?.schema;
          if (s) o.schema = s;
          const order = live.input?.layout?.["ui:order"] || live.layout?.["ui:order"];
          if (order) o.layout = { "ui:order": order };
          changed.push({ id: o.id, action: "replaced with the live schema", fields: Object.keys(o.schema?.properties || {}).length });
        }
        spec._about = `POC Studio's three Orbit objects, read from ${BASE} on ${new Date().toISOString().slice(0, 10)} with refresh-schemas.`;
        fs.writeFileSync(file, JSON.stringify(spec, null, 2) + "\n");
        return { file, objects: changed };
      }
      case "new-poc": {
        const props = { ...(typeof p[0] === "object" ? p[0] : readJsonArg(p[0])) };
        delete props.poc_id; // Orbit generates it
        const now = Date.now();
        props.created_at ??= now; props.updated_at = now; props.last_heartbeat_at ??= now; props.run_state ??= "running";
        const r = await createRecord(OBJ.poc, props);
        const id = r?.properties?.poc_id || r?.id;
        if (!id) throw new Error("Orbit created the POC row but returned no poc_id; find it with find-poc before retrying, never create a second one.");
        return { poc_id: id, version: r?.version };
      }
      case "find-poc": {
        const q = (p.join(" ") || "").toLowerCase().trim();
        const exact = q ? await getRecord(OBJ.poc, p.join(" ").trim()) : null;
        const recent = await findRecords(OBJ.poc, [], Number(F("scan", 300)), "updated_at:desc");
        const hits = recent.filter((r) => { const x = r.properties || {};
          return !q || [x.poc_id, x.poc_name, x.client, x.client_slug, x.use_case, x.use_case_slug].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)); });
        const rows = [exact, ...hits].filter(Boolean).filter((r, i, a) => a.findIndex((s) => (s.properties?.poc_id || s.id) === (r.properties?.poc_id || r.id)) === i);
        return { count: rows.length, matches: rows.slice(0, Number(F("limit", 10))).map(pocSummary) };
      }
      case "claim": {
        const id = F("poc"), session = F("session");
        if (!id || !session) throw new Error("claim needs --poc and --session");
        const r = await getRecord(OBJ.poc, id); if (!r) throw new Error(`POC ${id} not found`);
        const x = r.properties || {};
        const age = Date.now() - (x.last_heartbeat_at || 0);
        const other = x.active_session && x.active_session !== session;
        if (other && OPEN_RUN.has(x.run_state) && age < TAKEOVER_MS && F("force") !== "true") {
          const e = new Error(`Another session is working on ${id}: ${x.active_session}, last heartbeat ${Math.round(age / 60000)} min ago. Ask before taking over.`);
          e.code = 4; e.extra = { busy: true, active_session: x.active_session, minutesAgo: Math.round(age / 60000), run_state: x.run_state, resume_from: x.resume_from || null }; throw e;
        }
        const sessions = [session, ...String(x.sessions || "").split("\n").filter((s) => s && s !== session)].join("\n");
        await updateRecord(OBJ.poc, id, { active_session: session, last_heartbeat_at: Date.now(), updated_at: Date.now(), sessions,
          ...(x.run_state === "stalled" || x.run_state === "failed" || !x.run_state ? { run_state: "running" } : {}) });
        return { poc_id: id, claimed: true, tookOverFrom: other ? x.active_session : null, previous: pocSummary(r) };
      }
      case "heartbeat": {
        const id = F("poc"); if (!id) throw new Error("heartbeat needs --poc");
        const patch = { last_heartbeat_at: Date.now(), updated_at: Date.now() };
        if (F("session")) patch.active_session = F("session");
        if (F("run-state")) patch.run_state = F("run-state");
        if (F("resume-from")) patch.resume_from = F("resume-from");
        if (F("stall-reason") !== undefined) patch.stall_reason = F("stall-reason") === "none" ? "" : F("stall-reason");
        if (F("stage")) patch.stage = F("stage");
        if (F("current-gate")) patch.current_gate = F("current-gate");
        const r = await updateRecord(OBJ.poc, id, patch);
        return { poc_id: id, version: r?.version, ...patch };
      }
      case "fetch-doc": {
        const id = F("poc"), slug = F("slug"), outPath = F("out");
        if (!id || !slug || !outPath) throw new Error("fetch-doc needs --poc, --slug and --out");
        const docs = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.poc_id", values: [id] }, { op: "EQUAL", field: "properties.file_slug", values: [slug] }], 200);
        const latest = docs.filter((d) => d.properties?.status !== "superseded").sort((a, b) => (b.properties?.version || 0) - (a.properties?.version || 0))[0]
          || docs.sort((a, b) => (b.properties?.version || 0) - (a.properties?.version || 0))[0];
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
      case "update": { const r = await updateRecord(p[0], p[1], typeof p[2] === "object" ? p[2] : readJsonArg(p[2])); return { id: r?.id, version: r?.version }; }
      case "upload": return await upload(p[0], F("name"), F("mime"));
      case "save-doc": return await saveDoc({ poc: F("poc"), stage: F("stage"), slug: F("slug"), title: F("title"), type: F("type"), file: F("file"), status: F("status"), gate: F("gate"), by: F("by"), name: F("name") });
      case "readback": return await readback(F("poc"));
      case "sync-counts": {
        const id = F("poc");
        const docs = await findRecords(OBJ.doc, [{ op: "EQUAL", field: "properties.poc_id", values: [id] }], 1000);
        const open = await findRecords(OBJ.fb, [{ op: "EQUAL", field: "properties.poc_id", values: [id] }, { op: "IN", field: "properties.status", values: ["open", "acknowledged", "in_progress"] }], 1000);
        await updateRecord(OBJ.poc, id, { document_count: docs.length, open_feedback_count: open.length, updated_at: Date.now() });
        return { poc: id, document_count: docs.length, open_feedback_count: open.length };
      }
      case "flush": return await flush();
      default: throw new Error(`unknown command "${c}". Commands: check, schema, refresh-schemas, ensure-objects, new-poc, find-poc, claim, heartbeat, get, find, create, update, upload, save-doc, fetch-doc, readback, sync-counts, flush`);
    }
  } catch (e) {
    if (canQueue && WRITES.has(c) && (e instanceof NetError || e instanceof AuthError)) {
      // A write that could not reach Orbit is kept, in order, for `flush`. A local file must still exist then.
      const pinned = ["create", "update", "new-poc"].includes(c) ? p.map((x) => (typeof x === "string" && x.startsWith("@") ? readJsonArg(x) : x)) : p;
      const fl = { ...f }; if (fl.file) fl.file = fl.file.map((x) => path.resolve(x));
      enqueue({ cmd: c, args: pinned, flags: fl });
      const err = new Error(e.message); err.queued = true; err.reconnect = e instanceof AuthError; throw err;
    }
    throw e;
  }
}

run(cmd, pos, flags)
  .then((r) => out({ ok: true, ...((r && typeof r === "object" && !Array.isArray(r)) ? r : { result: r }) }))
  .catch((e) => (e.queued
    ? out({ ok: false, queued: true, reconnect: e.reconnect, error: e.message, next: "Reconnect Orbit, then run: node scripts/orbit-api.mjs flush" }, 3)
    : e.code === 4 ? out({ ok: false, error: e.message, ...e.extra }, 4) : fail(e.message)));
