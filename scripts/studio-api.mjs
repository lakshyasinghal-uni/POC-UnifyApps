#!/usr/bin/env node
/**
 * studio-api.mjs — POC Studio's caller for the Orbit Studio API (automations hosted on Orbit,
 * published in API Manager). It is the only way POC Studio writes to Orbit: no cookie, no
 * password, no browser. The token never appears in its output.
 *
 * Where the token comes from (first found wins):
 *   1. POC_STUDIO_API_TOKEN               environment variable
 *   2. ~/.config/poc-studio/credentials.json   written by `save` (file mode 600)
 * Other settings (environment, else the credentials file, else the default):
 *   POC_STUDIO_API_URL      default https://orbit.uat.unifyapps.com/api-endpoint/orbit-studio
 *   POC_STUDIO_API_HEADER   default api-token
 *
 * Commands (each prints one JSON line on stdout):
 *   status                   is a token set, where it comes from, which API it points at
 *   check                    asks the API whether the token is accepted, without writing anything
 *   save [--url u]           run by the person in their own terminal: asks for the token with the
 *                            input hidden (or reads it from stdin), checks it, then stores it
 *   call <path> <json|@file> [--debug]   POST to <url>/<path> with the token, e.g. log-activity
 *
 * Exit codes: 0 ok, 1 error, 2 no token or token rejected, 3 API not reachable.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const DEFAULT_URL = "https://orbit.uat.unifyapps.com/api-endpoint/orbit-studio";
const DEFAULT_HEADER = "api-token";
const CRED_DIR = process.env.POC_STUDIO_CONFIG_DIR || path.join(os.homedir(), ".config", "poc-studio");
const CRED_FILE = path.join(CRED_DIR, "credentials.json");

const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    flags[k] = v;
  } else pos.push(a);
}
const DEBUG = flags.debug === "true";
const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(code); };

function readCreds() {
  try { return JSON.parse(fs.readFileSync(CRED_FILE, "utf8")); } catch { return null; }
}
function settings() {
  const file = readCreds();
  const fromEnv = (process.env.POC_STUDIO_API_TOKEN || "").trim();
  const token = fromEnv || (file?.token || "").trim();
  return {
    token,
    source: fromEnv ? "environment (POC_STUDIO_API_TOKEN)" : token ? `file (${CRED_FILE})` : null,
    url: (process.env.POC_STUDIO_API_URL || file?.url || DEFAULT_URL).replace(/\/+$/, ""),
    header: process.env.POC_STUDIO_API_HEADER || file?.header || DEFAULT_HEADER,
    savedAt: file?.saved_at || null,
  };
}
const hint = (t) => (t && t.length > 8 ? `…${t.slice(-4)}` : t ? "(short)" : null);

async function post(s, endpoint, body) {
  const url = `${s.url}/${endpoint.replace(/^\/+/, "")}`;
  const text = typeof body === "string" ? body : JSON.stringify(body);
  if (DEBUG) process.stderr.write(`→ POST ${url}\n  ${s.header}: <hidden>\n  ${text.slice(0, 2000)}\n`);
  const t0 = Date.now();
  let r;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", [s.header]: s.token }, body: text });
  } catch (e) {
    return { reachable: false, error: e.cause?.code || e.message };
  }
  const raw = await r.text().catch(() => "");
  if (DEBUG) process.stderr.write(`← ${r.status} (${Date.now() - t0} ms)\n  ${raw.slice(0, 2000)}\n`);
  let json = null;
  try { json = raw ? JSON.parse(raw) : null; } catch { /* not JSON */ }
  return { reachable: true, status: r.status, body: json ?? raw.slice(0, 2000) };
}

// An empty body fails the endpoint's own input check before anything is written, so the status
// tells us about the token alone: 401 means rejected; any other answer means accepted.
async function check(s) {
  if (!s.token) return { ok: false, code: 2, reason: "No token set." };
  const r = await post(s, "log-activity", {});
  if (!r.reachable) return { ok: false, code: 3, reason: `The API could not be reached (${r.error}).` };
  if (r.status === 401 || r.status === 403) return { ok: false, code: 2, status: r.status, reason: "The token was rejected." };
  return { ok: true, status: r.status };
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stderr.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stderr.write("\n"); resolve(answer); });
  });
}
async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

async function main() {
  switch (cmd) {
    case "status": {
      const s = settings();
      return out({ ok: true, tokenSet: !!s.token, source: s.source, token: hint(s.token), url: s.url, header: s.header, savedAt: s.savedAt });
    }
    case "check": {
      const s = settings();
      const r = await check(s);
      return out({ ...r, source: s.source, token: hint(s.token), url: s.url }, r.ok ? 0 : r.code);
    }
    case "save": {
      const raw = process.stdin.isTTY ? await askHidden("Paste your POC Studio API token (hidden): ") : await readStdin();
      const token = String(raw || "").trim();
      if (!token || /\s/.test(token)) out({ ok: false, reason: "Nothing saved: the token was empty or contained spaces." }, 1);
      const s = { ...settings(), token };
      if (flags.url) s.url = flags.url.replace(/\/+$/, "");
      const r = await check(s);
      if (!r.ok) out({ ok: false, reason: `Nothing saved: ${r.reason}`, url: s.url }, r.code);
      fs.mkdirSync(CRED_DIR, { recursive: true, mode: 0o700 });
      fs.writeFileSync(CRED_FILE, JSON.stringify({ token, url: s.url, header: s.header, saved_at: new Date().toISOString() }, null, 2) + "\n", { mode: 0o600 });
      fs.chmodSync(CRED_FILE, 0o600);
      return out({ ok: true, saved: CRED_FILE, token: hint(token), url: s.url, note: "Token checked and saved. New Claude sessions on this computer will use it." });
    }
    case "call": {
      const endpoint = pos[0];
      if (!endpoint || !pos[1]) out({ ok: false, reason: "Usage: call <path> <json|@file> [--debug]" }, 1);
      const s = settings();
      if (!s.token) out({ ok: false, reason: "No token set. Run /poc-studio:connect." }, 2);
      const body = pos[1].startsWith("@") ? fs.readFileSync(pos[1].slice(1), "utf8") : pos[1];
      try { JSON.parse(body); } catch (e) { out({ ok: false, reason: `Not valid JSON: ${e.message}` }, 1); }
      const r = await post(s, endpoint, body);
      if (!r.reachable) out({ ok: false, reason: `The API could not be reached (${r.error}).` }, 3);
      if (r.status === 401 || r.status === 403) out({ ok: false, status: r.status, reason: "The token was rejected. Run /poc-studio:connect." }, 2);
      return out({ ok: r.status >= 200 && r.status < 300, status: r.status, response: r.body }, r.status >= 200 && r.status < 300 ? 0 : 1);
    }
    default: {
      const usage = fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*\*?/, "").replace(/^ \* ?/gm, "");
      process.stderr.write(usage + "\n");
      process.exit(cmd ? 1 : 0);
    }
  }
}

main().catch((e) => out({ ok: false, reason: e.message }, 1));
