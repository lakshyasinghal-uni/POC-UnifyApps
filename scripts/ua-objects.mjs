#!/usr/bin/env node
/**
 * ua-objects.mjs — read and write UnifyApps object records over the REST API, from the shell.
 * No browser tab, no mapping layer, no queue: what you pass is what is sent, and what the
 * server answers is what you get back.
 *
 * Environment (set as secrets; never paste them into a chat, never printed):
 *   UA_BASE        tenant origin, default https://orbit.uat.unifyapps.com
 *   UA_COOKIE      the whole Cookie header of a signed-in session, or
 *   UA_USERNAME + UA_PASSWORD   a local (non-SSO) account; the script logs in on each run
 *   UA_IDP         the tenant's local identity provider id (orbit.uat: 65d2f4cf672d16da08efc3d0)
 *   UA_DEBUG=1     same as --debug
 *   UA_LOG=<file>  same as --log <file>
 *
 * Commands. Each prints one JSON line on stdout. Exit 0 ok, 1 error, 2 not signed in.
 *   whoami                                    the signed-in user (the cheapest session check)
 *   schema <object>                           the object's definition: fields, required, options
 *   get    <object> <id>                      one record
 *   find   <object> [--where field=value]... [--limit n | --all] [--sort field:asc|desc]
 *   next-id <object> --field <primary key> --prefix <text>
 *                                             the next free key: <prefix><highest number after it + 1>,
 *                                             reading every record (e.g. --prefix FB- gives FB-1017)
 *   exists <object> <id>                      {"exists": true|false} without failing on a missing record
 *   create <object> <json | @file>            properties of a new record
 *   update <object> <id> <json | @file>       reads the record, merges these properties, writes it
 *                                             back with its current version
 *   upload <path> [--name n] [--mime m]       uploads a file; prints the value for a File field
 *
 * Flags for every command:
 *   --debug        print every request and response to stderr (method, path, status, time,
 *                  bodies cut at 2,000 characters; the password and cookie are never printed)
 *   --log <file>   append every request and response as one JSON line to <file>
 *
 * There is no delete command.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.UA_BASE || "https://orbit.uat.unifyapps.com").replace(/\/+$/, "");
const IDP = process.env.UA_IDP || "65d2f4cf672d16da08efc3d0";
const PART = 8 * 1024 * 1024;

// ---------- arguments ----------
const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--debug") { flags.debug = ["true"]; continue; }
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    (flags[k] ||= []).push(v);
  } else pos.push(a);
}
const flag = (k, d) => (flags[k] ? flags[k][flags[k].length - 1] : d);
const DEBUG = flag("debug") === "true" || process.env.UA_DEBUG === "1";
const LOG = flag("log") || process.env.UA_LOG || "";

const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(code); };
const fail = (msg, extra = {}, code = 1) => out({ ok: false, error: msg, ...extra }, code);
class AuthError extends Error {}

function readJson(arg) {
  if (!arg) fail("Missing the JSON argument (inline JSON or @file).");
  const txt = arg.startsWith("@") ? fs.readFileSync(arg.slice(1), "utf8") : arg;
  try { return JSON.parse(txt); } catch (e) { fail(`Not valid JSON: ${e.message}`); }
}

// ---------- request log ----------
const cut = (s, n = 2000) => (s && s.length > n ? `${s.slice(0, n)}… (${s.length} chars)` : s);
function redact(body) {
  if (typeof body !== "string") return body ? "<binary>" : "";
  return body.replace(/("password"\s*:\s*)"[^"]*"/g, '$1"<redacted>"');
}
function trace(entry) {
  if (DEBUG) {
    const line = entry.dir === "→"
      ? `→ ${entry.method} ${entry.url}${entry.body ? `\n  ${cut(entry.body)}` : ""}`
      : `← ${entry.status} ${entry.method} ${entry.url} (${entry.ms} ms)${entry.body ? `\n  ${cut(entry.body)}` : ""}`;
    process.stderr.write(line + "\n");
  }
  if (LOG) fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
}

// ---------- HTTP ----------
let cookie = process.env.UA_COOKIE || "";

async function send(p, init = {}, { withCookie = true } = {}) {
  const url = p.startsWith("http") ? p : BASE + p;
  const headers = { Accept: "application/json", ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) };
  if (withCookie && cookie && url.startsWith(BASE)) headers.Cookie = cookie;
  const method = init.method || "GET";
  const shown = url.startsWith(BASE) ? url.slice(BASE.length) : url.split("?")[0];
  trace({ dir: "→", method, url: shown, body: redact(init.body) });
  const t0 = Date.now();
  let r;
  try { r = await fetch(url, { ...init, headers, redirect: "manual" }); }
  catch (e) { throw new Error(`Could not reach ${BASE}: ${e.cause?.code || e.message}`); }
  const text = await r.text().catch(() => "");
  trace({ dir: "←", method, url: shown, status: r.status, ms: Date.now() - t0, body: text });
  return { r, text };
}

async function login() {
  const u = process.env.UA_USERNAME, p = process.env.UA_PASSWORD;
  if (!u || !p) throw new AuthError("Not signed in: set UA_COOKIE, or UA_USERNAME and UA_PASSWORD for a local account, as environment secrets.");
  const { r } = await send("/auth/workflow/execute/node?name=emailAndPassLoginRequest", {
    method: "POST",
    body: JSON.stringify({
      id: "emailAndPassLoginRequest",
      context: { appName: "auth_by_unifyapps", resourceName: "auth_by_unifyapps_login" },
      inputs: { returnTo: "/", failureReturnTo: `${BASE}/login`, formData: { username: u, password: p, rememberMe: true }, identityProviderId: IDP },
      options: { cacheConfig: {} },
    }),
  }, { withCookie: false });
  if (r.status !== 200) throw new AuthError(`Login failed (${r.status}). Check UA_USERNAME, UA_PASSWORD and UA_IDP; SSO accounts cannot log in this way, use UA_COOKIE.`);
  const set = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")].filter(Boolean);
  cookie = set.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new AuthError("Login returned no session cookie.");
}

async function api(p, init = {}, retried = false) {
  if (!cookie) await login();
  const { r, text } = await send(p, init);
  const ct = r.headers.get("content-type") || "";
  if (r.status === 401 || (r.status >= 300 && r.status < 400) || ct.includes("text/html")) {
    if (!retried && process.env.UA_USERNAME && process.env.UA_PASSWORD) { cookie = ""; await login(); return api(p, init, true); }
    throw new AuthError(`Not signed in (${r.status} on ${init.method || "GET"} ${p}). Refresh UA_COOKIE or check UA_USERNAME / UA_PASSWORD.`);
  }
  if (!r.ok) {
    const e = new Error(`${init.method || "GET"} ${p} returned ${r.status}`);
    e.status = r.status;
    try { e.response = JSON.parse(text); } catch { e.response = text.slice(0, 2000); }
    throw e;
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

// ---------- records ----------
const enc = encodeURIComponent;
const getRecord = (obj, id) => api(`/api/entity/${enc(obj)}/${enc(id)}`);

function parseWhere(list = []) {
  return list.map((w) => {
    const i = w.indexOf("=");
    if (i < 1) fail(`--where needs field=value, got "${w}"`);
    const field = w.slice(0, i);
    return { op: "EQUAL", field: field.includes(".") ? field : `properties.${field}`, values: [w.slice(i + 1)] };
  });
}

// The list endpoint pages by offset (feeding its cursor back repeats page 1), so --all walks offsets.
async function findRecords(obj, { where = [], limit = 50, sort, all = false } = {}) {
  const base = {};
  if (where.length === 1) base.filter = where[0];
  else if (where.length > 1) base.filter = { op: "AND", values: where };
  if (sort) {
    const [f, d = "asc"] = sort.split(":");
    base.sorts = [{ field: f.includes(".") ? f : `properties.${f}`, order: d.toUpperCase() }];
  }
  const page = all ? 200 : limit;
  const records = [];
  for (let offset = 0; ; offset += page) {
    const res = await api(`/api/entity/${enc(obj)}`, { method: "POST", body: JSON.stringify({ ...base, page: { limit: page, offset } }) });
    const got = res?.objects || [];
    records.push(...got);
    if (!all || !res?.hasMore || !got.length || offset > 100000) return { records, hasMore: !all && !!res?.hasMore };
  }
}

async function updateRecord(obj, id, patch) {
  const cur = await getRecord(obj, id);
  if (!cur) throw new Error(`${obj}/${id} not found`);
  const properties = { ...(cur.properties || {}), ...patch };
  return api("/api/entity/update", { method: "POST", body: JSON.stringify({ id: cur.id, entityType: obj, properties, version: cur.version }) });
}

// ---------- files (S3 multipart, as the UnifyApps UI uploads) ----------
function guessMime(n) {
  return ({ ".md": "text/markdown", ".txt": "text/plain", ".html": "text/html", ".htm": "text/html", ".json": "application/json",
    ".csv": "text/csv", ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml", ".mp4": "video/mp4", ".zip": "application/zip", ".yml": "text/yaml", ".yaml": "text/yaml",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })[path.extname(n).toLowerCase()] || "application/octet-stream";
}

async function uploadFile(file, name, mime) {
  if (!fs.existsSync(file)) throw new Error(`No file at ${file}`);
  const buf = fs.readFileSync(file);
  name ||= path.basename(file);
  mime ||= guessMime(name);
  const target = await api("/api/file/upload-bucket");
  let directory = target?.directory || target?.bucketDetails?.directory;
  const bucket = target?.bucket || target?.bucketDetails?.bucket;
  if (!directory) {
    const me = await api("/api/user-context?includeRoles=true");
    const customer = me?.customer?.id ?? me?.customerId;
    if (customer !== undefined) directory = `user-uploads/${customer}`;
  }
  if (!bucket || !directory) throw new Error("GET /api/file/upload-bucket returned no bucket or directory.");
  const h = { "x-ua-uppy-upload": JSON.stringify({ useExternalApi: false, bucketDetails: { directory, bucket }, isPublicUpload: false, isBuilderAsset: false }) };
  const start = await api("/api/uploads/s3/multipart", { method: "POST", headers: h, body: JSON.stringify({ filename: name, type: mime, metadata: { name, type: mime } }) });
  const { uploadId, key } = start || {};
  if (!uploadId || !key) throw new Error("Upload start returned no uploadId or key.");
  const parts = [];
  for (let n = 1, off = 0; ; n++, off += PART) {
    const slice = buf.subarray(off, Math.min(off + PART, buf.length));
    const signed = await api(`/api/uploads/s3/multipart/${enc(uploadId)}/${n}?key=${enc(key)}`, { headers: h });
    const { r } = await send(signed.url, { method: "PUT", body: slice, headers: { "Content-Type": mime } }, { withCookie: false });
    if (!r.ok) throw new Error(`Upload part ${n} returned ${r.status}`);
    parts.push({ PartNumber: n, ETag: r.headers.get("etag") });
    if (off + PART >= buf.length) break;
  }
  const done = await api(`/api/uploads/s3/multipart/${enc(uploadId)}/complete?key=${enc(key)}`, { method: "POST", headers: h, body: JSON.stringify({ parts }) });
  return { name, source: done?.key || key, sourceType: "CLOUD_STORAGE", mimeType: mime, fileType: mime, size: buf.length, type: "FILE" };
}

// ---------- commands ----------
const need = (v, what) => { if (!v) fail(`Missing ${what}. Run with no command to see usage.`); return v; };

async function main() {
  switch (cmd) {
    case "whoami": {
      const me = await api("/api/user-context?includeRoles=true");
      const u = me?.user || me || {};
      return out({ ok: true, base: BASE, user: u.email || u.username || u.name || null, name: u.name || null, customerId: me?.customer?.id ?? null });
    }
    case "schema": {
      const obj = need(pos[0], "<object>");
      const o = await api(`/api/entity-type?entityType=${enc(obj)}`);
      if (!o) fail(`Object ${obj} not found on ${BASE}`);
      const s = o?.schema?.schema || o?.input?.schema || {};
      const fields = Object.fromEntries(Object.entries(s.properties || {}).map(([k, f]) => [k, {
        type: f.format || f.type, title: f.title, ...(f.enum ? { options: f.enum } : {}),
        ...(f.oneOf ? { options: f.oneOf.map((x) => x.const ?? x.value) } : {}),
        ...(f.primaryKey ? { primaryKey: true } : {}), ...(f.format === "auto-generate" ? { generated: true } : {}),
      }]));
      return out({ ok: true, object: obj, required: s.required || [], fields });
    }
    case "get":
      return out({ ok: true, record: await getRecord(need(pos[0], "<object>"), need(pos[1], "<id>")) });
    case "find": {
      const res = await findRecords(need(pos[0], "<object>"), { where: parseWhere(flags.where), limit: Number(flag("limit", 50)), sort: flag("sort"), all: flag("all") === "true" });
      return out({ ok: true, count: res.records.length, hasMore: res.hasMore, records: res.records });
    }
    case "next-id": {
      const obj = need(pos[0], "<object>"), field = need(flag("field"), "--field"), prefix = need(flag("prefix"), "--prefix");
      const { records } = await findRecords(obj, { all: true });
      const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`^${esc}(\\d+)$`);
      let max = 0;
      for (const r of records) { const m = String(r.properties?.[field] ?? "").match(re); if (m) max = Math.max(max, Number(m[1])); }
      return out({ ok: true, id: `${prefix}${max + 1}`, highest: max ? `${prefix}${max}` : null, scanned: records.length });
    }
    case "exists": {
      try { const r = await getRecord(need(pos[0], "<object>"), need(pos[1], "<id>")); return out({ ok: true, exists: !!r }); }
      catch (e) { if (e.status === 404 || e.status === 400) return out({ ok: true, exists: false }); throw e; }
    }
    case "create": {
      const obj = need(pos[0], "<object>");
      const rec = await api("/api/entity", { method: "POST", body: JSON.stringify({ entityType: obj, properties: readJson(pos[1]) }) });
      return out({ ok: true, id: rec?.id ?? null, record: rec });
    }
    case "update": {
      const rec = await updateRecord(need(pos[0], "<object>"), need(pos[1], "<id>"), readJson(pos[2]));
      return out({ ok: true, id: rec?.id ?? null, version: rec?.version ?? null, record: rec });
    }
    case "upload":
      return out({ ok: true, file: await uploadFile(need(pos[0], "<path>"), flag("name"), flag("mime")) });
    default: {
      const usage = fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*\*?/, "").replace(/^ \* ?/gm, "");
      process.stderr.write(usage + "\n");
      process.exit(cmd ? 1 : 0);
    }
  }
}

main().catch((e) => {
  if (e instanceof AuthError) fail(e.message, {}, 2);
  fail(e.message, e.status ? { status: e.status, response: e.response } : {});
});
