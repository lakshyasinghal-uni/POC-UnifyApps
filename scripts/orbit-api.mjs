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
 *   ORBIT_QUEUE     queued-writes file (default studio/.orbit-queue.jsonl)
 *
 * Commands (every result is one JSON line on stdout; exit 0 ok, 1 error, 3 queued for later):
 *   check                                      who is signed in, and whether the three objects exist
 *   schema   <objectId>                        the live object definition
 *   ensure-objects [--file <orbit-objects.json>]   create any missing object, never alter one
 *   get      <objectId> <recordId>
 *   find     <objectId> [--field f --value v]... [--in f=v1,v2] [--limit n] [--sort f:desc]
 *   create   <objectId> <json | @file>
 *   update   <objectId> <recordId> <json | @file>   read, merge properties, write the full record
 *   upload   <path> [--name n] [--mime m]      returns the File-field value
 *   save-doc --poc <pocId> --stage <stage> --slug <slug> --title <t> --type <docType> --file <path>
 *            [--status draft|in_review|approved] [--gate G1..G4] [--by <name>]
 *   readback --poc <pocId>                     every latest document: file uploaded, version, status
 *   sync-counts --poc <pocId>                  recompute document_count and open_feedback_count on the POC row
 *   flush                                      replay queued writes in order
 *
 * It never deletes: there is no delete command, and superseding a document is a status change.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.ORBIT_BASE || "https://orbit.uat.unifyapps.com").replace(/\/$/, "");
const IDP = process.env.ORBIT_IDP || "65d2f4cf672d16da08efc3d0";
const BUCKET = process.env.ORBIT_BUCKET || "uat-uploads.unifyapps.com";
const QUEUE = process.env.ORBIT_QUEUE || path.join("studio", ".orbit-queue.jsonl");
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
  const bad = rows.filter((r) => !r.fileUploaded || r.status === "superseded");
  return { poc: pocId, documents: rows.length, queued, problems: bad, ok: bad.length === 0 && queued === 0, rows };
}

// ---------- queue ----------
function enqueue(entry) {
  fs.mkdirSync(path.dirname(QUEUE), { recursive: true });
  fs.appendFileSync(QUEUE, JSON.stringify({ ...entry, queuedAt: new Date().toISOString() }) + "\n");
}
async function flush() {
  if (!fs.existsSync(QUEUE)) return { replayed: 0, remaining: 0 };
  const lines = fs.readFileSync(QUEUE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const left = []; let done = 0; const results = [];
  for (const e of lines) {
    if (left.length) { left.push(e); continue; } // keep order: stop replaying at the first failure
    try { results.push(await run(e.cmd, e.args, e.flags, false)); done++; }
    catch (err) { left.push(e); results.push({ failed: e.cmd, error: err.message }); }
  }
  fs.writeFileSync(QUEUE, left.map((l) => JSON.stringify(l)).join("\n") + (left.length ? "\n" : ""));
  return { replayed: done, remaining: left.length, results };
}

// ---------- commands ----------
const WRITES = new Set(["create", "update", "save-doc"]);
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
      case "get": { const r = await getRecord(p[0], p[1]); if (!r) throw new Error(`${p[0]}/${p[1]} not found`); return r; }
      case "find": {
        const filters = [];
        (f.field || []).forEach((fl, i) => filters.push({ op: "EQUAL", field: `properties.${fl}`, values: [(f.value || [])[i]] }));
        for (const s of f.in || []) { const [k, v] = s.split("="); filters.push({ op: "IN", field: `properties.${k}`, values: v.split(",") }); }
        const rows = await findRecords(p[0], filters, Number(F("limit", 50)), F("sort"));
        return { count: rows.length, rows };
      }
      case "create": { const r = await createRecord(p[0], typeof p[1] === "object" ? p[1] : readJsonArg(p[1])); return { id: r?.id, version: r?.version }; }
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
      default: throw new Error(`unknown command "${c}". Commands: check, schema, ensure-objects, get, find, create, update, upload, save-doc, readback, sync-counts, flush`);
    }
  } catch (e) {
    if (canQueue && WRITES.has(c) && (e instanceof NetError || e instanceof AuthError)) {
      // A write that could not reach Orbit is kept, in order, for `flush`. A local file must still exist then.
      const pinned = c === "create" || c === "update" ? p.map((x) => (typeof x === "string" && x.startsWith("@") ? readJsonArg(x) : x)) : p;
      enqueue({ cmd: c, args: pinned, flags: f });
      const err = new Error(e.message); err.queued = true; err.reconnect = e instanceof AuthError; throw err;
    }
    throw e;
  }
}

run(cmd, pos, flags)
  .then((r) => out({ ok: true, ...((r && typeof r === "object" && !Array.isArray(r)) ? r : { result: r }) }))
  .catch((e) => (e.queued
    ? out({ ok: false, queued: true, reconnect: e.reconnect, error: e.message, next: "Reconnect Orbit, then run: node scripts/orbit-api.mjs flush" }, 3)
    : fail(e.message)));
