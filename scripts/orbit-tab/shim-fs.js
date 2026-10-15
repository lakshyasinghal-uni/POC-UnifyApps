// node:fs for orbit-api.mjs inside an Orbit tab: an in-memory file system for one run.
// It is seeded with the plugin's contract files and the local files the command reads;
// every file written is returned to scripts/orbit-tab.mjs, which writes it on disk.
import { Buffer } from "buffer";
import path from "path-browserify";

const ctx = () => globalThis.__ORBIT_CTX__;
const key = (p) => path.resolve("/work", String(p));
const missing = (p) => Object.assign(new Error(`ENOENT: no such file or directory, open '${p}'`), { code: "ENOENT" });
const bytes = (d) => (typeof d === "string" ? Buffer.from(d, "utf8") : Buffer.from(d));
const enc = (o) => (typeof o === "string" ? o : o && o.encoding);

function readFileSync(p, o) {
  const b = ctx().files.get(key(p)); if (!b) throw missing(p);
  const e = enc(o); return e ? Buffer.from(b).toString(e) : Buffer.from(b);
}
function writeFileSync(p, d) { const k = key(p); ctx().files.set(k, bytes(d)); ctx().written.add(k); }
function appendFileSync(p, d) {
  const k = key(p); const cur = ctx().files.get(k);
  ctx().files.set(k, cur ? Buffer.concat([Buffer.from(cur), bytes(d)]) : bytes(d)); ctx().written.add(k);
}
const existsSync = (p) => ctx().files.has(key(p));
function statSync(p) { const b = ctx().files.get(key(p)); if (!b) throw missing(p); return { size: b.length, isFile: () => true, isDirectory: () => false }; }
const mkdirSync = () => undefined;

export { readFileSync, writeFileSync, appendFileSync, existsSync, statSync, mkdirSync };
export default { readFileSync, writeFileSync, appendFileSync, existsSync, statSync, mkdirSync };
