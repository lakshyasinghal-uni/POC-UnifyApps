#!/usr/bin/env node
/**
 * studio-api.mjs — POC Studio's caller for the Orbit Studio API: automations hosted on Orbit,
 * published in API Manager under the group `orbit-studio` with a No Auth access profile. It is
 * the only way POC Studio writes to Orbit: no token, no cookie, no password, no browser.
 *
 * Settings:
 *   POC_STUDIO_API_URL   default https://orbit.uat.unifyapps.com/api-endpoint/orbit-studio
 *
 * Commands (each prints one JSON line on stdout):
 *   status                               which API it points at
 *   check                                asks the API whether it accepts calls from here,
 *                                        without writing anything
 *   call <path> <json|@file> [--debug]   POST to <url>/<path>, e.g. log-activity
 *
 * Exit codes: 0 ok, 1 error from the endpoint, 2 the API refused the call (401/403),
 * 3 API not reachable.
 */
import fs from "node:fs";

const URL_BASE = (process.env.POC_STUDIO_API_URL || "https://orbit.uat.unifyapps.com/api-endpoint/orbit-studio").replace(/\/+$/, "");

const argv = process.argv.slice(2);
const cmd = argv.shift();
const DEBUG = argv.includes("--debug");
const pos = argv.filter((a) => a !== "--debug");
const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(code); };

async function post(endpoint, text) {
  const url = `${URL_BASE}/${endpoint.replace(/^\/+/, "")}`;
  if (DEBUG) process.stderr.write(`→ POST ${url}\n  ${text.slice(0, 2000)}\n`);
  const t0 = Date.now();
  let r;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: text });
  } catch (e) {
    return { reachable: false, error: e.cause?.code || e.message };
  }
  const raw = await r.text().catch(() => "");
  if (DEBUG) process.stderr.write(`← ${r.status} (${Date.now() - t0} ms)\n  ${raw.slice(0, 2000)}\n`);
  let json = null;
  try { json = raw ? JSON.parse(raw) : null; } catch { /* not JSON */ }
  return { reachable: true, status: r.status, body: json ?? raw.slice(0, 2000) };
}

async function main() {
  switch (cmd) {
    case "status":
      return out({ ok: true, url: URL_BASE });
    case "check": {
      // An empty body fails the endpoint's own input check before anything is written, so the
      // status says only whether the API accepts calls: 401/403 means refused.
      const r = await post("log-activity", "{}");
      if (!r.reachable) out({ ok: false, url: URL_BASE, reason: `Orbit could not be reached (${r.error}).` }, 3);
      if (r.status === 401 || r.status === 403) out({ ok: false, url: URL_BASE, status: r.status, reason: "The API refused the call: the Orbit Studio API group needs its No Auth access profile in API Manager." }, 2);
      return out({ ok: true, url: URL_BASE, status: r.status });
    }
    case "call": {
      const [endpoint, arg] = pos;
      if (!endpoint || !arg) out({ ok: false, reason: "Usage: call <path> <json|@file> [--debug]" }, 1);
      const body = arg.startsWith("@") ? fs.readFileSync(arg.slice(1), "utf8") : arg;
      try { JSON.parse(body); } catch (e) { out({ ok: false, reason: `Not valid JSON: ${e.message}` }, 1); }
      const r = await post(endpoint, body);
      if (!r.reachable) out({ ok: false, reason: `Orbit could not be reached (${r.error}).` }, 3);
      if (r.status === 401 || r.status === 403) out({ ok: false, status: r.status, reason: "The API refused the call. Run /poc-studio:connect to see why." }, 2);
      const ok = r.status >= 200 && r.status < 300;
      return out({ ok, status: r.status, response: r.body }, ok ? 0 : 1);
    }
    default: {
      const usage = fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*\*?/, "").replace(/^ \* ?/gm, "");
      process.stderr.write(usage + "\n");
      process.exit(cmd ? 1 : 0);
    }
  }
}

main().catch((e) => out({ ok: false, reason: e.message }, 1));
