#!/usr/bin/env node
/**
 * version-check.mjs — is this POC Studio the latest on GitHub main, and where is it running?
 *
 *   node version-check.mjs            report only
 *   node version-check.mjs --apply    in Claude Code on your machine, when behind: update the
 *                                     marketplace and the plugin with the claude CLI
 *   --timeout <seconds>               how long to wait for GitHub (default 8); /poc-studio:start uses 5
 *
 * Prints one JSON line:
 *   { installed, latest, behind, surface: "claude-code" | "claude-app" | "unknown",
 *     pluginRoot, updated?, steps?, error? }
 * Exit 0 current (or latest unknown), 10 behind (not updated), 11 updated (start a fresh
 * session), 1 the update was attempted and failed.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const MARKETPLACE = "poc-unifyapps";
const PLUGIN = "poc-studio";
const TIMEOUT_MS = (() => { const i = process.argv.indexOf("--timeout"); const n = i > -1 ? Number(process.argv[i + 1]) : 8; return (Number.isFinite(n) && n > 0 ? n : 8) * 1000; })();
const LATEST_URL = process.env.POC_STUDIO_LATEST_URL ||
  "https://raw.githubusercontent.com/shubhankargarg-lang/POC-UnifyApps/main/.claude-plugin/plugin.json";

const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(code); };
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const parse = (v) => String(v || "0").split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => { const x = parse(a), y = parse(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

const here = path.dirname(new URL(import.meta.url).pathname);
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(here, "..");
const installed = readJson(path.join(pluginRoot, ".claude-plugin", "plugin.json"))?.version || "0.0.0";

// Where is this running? Claude Code on a machine lists the plugin in installed_plugins.json
// under its marketplace; the Claude app syncs account plugins into plugins/synced and marks
// the session remote.
function surface() {
  const reg = readJson(path.join(os.homedir(), ".claude", "plugins", "installed_plugins.json"));
  const key = `${PLUGIN}@${MARKETPLACE}`;
  const listed = Boolean(reg?.plugins?.[key]);
  if (process.env.CLAUDE_CODE_REMOTE === "true" || pluginRoot.includes(`${path.sep}plugins${path.sep}synced${path.sep}`)) return "claude-app";
  if (listed) return "claude-code";
  try { execFileSync("claude", ["--version"], { stdio: "ignore", timeout: 3000 }); return "claude-code"; } catch { return "unknown"; }
}

async function latest() {
  try {
    const r = await fetch(LATEST_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!r.ok) return { error: `GitHub answered ${r.status}` };
    return { version: (await r.json()).version };
  } catch (e) { return { error: e.name === "TimeoutError" ? `GitHub did not answer within ${TIMEOUT_MS / 1000}s` : `GitHub not reachable: ${e.cause?.code || e.message}` }; }
}

const where = surface();
const l = await latest();
if (!l.version) out({ installed, latest: null, behind: null, surface: where, pluginRoot, error: l.error });
const behind = cmp(installed, l.version) < 0;
const base = { installed, latest: l.version, behind, surface: where, pluginRoot };
if (!behind || !process.argv.includes("--apply")) out(base, behind ? 10 : 0);
if (where !== "claude-code") out({ ...base, updated: false, error: "Not Claude Code on a machine: update the plugin where it is installed." }, 10);

const steps = [];
try {
  for (const args of [["plugin", "marketplace", "update", MARKETPLACE], ["plugin", "update", `${PLUGIN}@${MARKETPLACE}`]]) {
    const res = execFileSync("claude", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 });
    steps.push({ command: `claude ${args.join(" ")}`, ok: true, output: res.trim().slice(-400) });
  }
} catch (e) {
  steps.push({ command: e.cmd || "claude", ok: false, output: String(e.stderr || e.message).trim().slice(-400) });
  out({ ...base, updated: false, steps, error: "The update did not finish." }, 1);
}
out({ ...base, updated: true, steps, next: "Start a fresh Claude Code session (or run /reload-plugins) and run your command again." }, 11);
