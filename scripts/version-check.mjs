#!/usr/bin/env node
/**
 * version-check.mjs — is this POC Studio the latest on GitHub main, and where is it running?
 *
 *   node version-check.mjs            report only
 *   node version-check.mjs --apply    in Claude Code on your machine, when behind: update the
 *                                     marketplace and the plugin with the claude CLI
 *   --timeout <seconds>               how long to wait for each GitHub source (default 15);
 *                                     /poc-studio:start uses 5
 *
 * The latest version is read from raw.githubusercontent.com, then from api.github.com, then
 * with `git ls-remote` + the claude CLI's marketplace copy. When none answers and --apply is
 * given in Claude Code, the update is run anyway: the claude CLI fetches with git, which often
 * works where the HTTPS check is slow or blocked.
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
const TIMEOUT_MS = (() => { const i = process.argv.indexOf("--timeout"); const n = i > -1 ? Number(process.argv[i + 1]) : 15; return (Number.isFinite(n) && n > 0 ? n : 15) * 1000; })();
const LATEST_URL = process.env.POC_STUDIO_LATEST_URL ||
  "https://raw.githubusercontent.com/lakshyasinghal-uni/POC-UnifyApps/main/.claude-plugin/plugin.json";

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

const API_URL = "https://api.github.com/repos/lakshyasinghal-uni/POC-UnifyApps/contents/.claude-plugin/plugin.json?ref=main";

async function fromUrl(url, headers = {}) {
  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!r.ok) return { error: `${new URL(url).host} answered ${r.status}` };
    const j = await r.json();
    const body = j.content ? JSON.parse(Buffer.from(j.content, "base64").toString("utf8")) : j;
    return body.version ? { version: body.version } : { error: `${new URL(url).host} gave no version` };
  } catch (e) {
    return { error: e.name === "TimeoutError" ? `${new URL(url).host} did not answer within ${TIMEOUT_MS / 1000}s` : `${new URL(url).host} not reachable: ${e.cause?.code || e.message}` };
  }
}

// The marketplace copy the claude CLI keeps on disk, refreshed with git.
function fromMarketplaceCopy() {
  const dir = path.join(os.homedir(), ".claude", "plugins", "marketplaces", MARKETPLACE);
  if (!fs.existsSync(path.join(dir, ".git"))) return { error: "no local marketplace copy" };
  try {
    execFileSync("git", ["-C", dir, "fetch", "--quiet", "origin"], { stdio: "ignore", timeout: TIMEOUT_MS });
    const txt = execFileSync("git", ["-C", dir, "show", "origin/HEAD:.claude-plugin/plugin.json"], { encoding: "utf8", timeout: 5000 });
    const v = JSON.parse(txt).version;
    return v ? { version: v } : { error: "marketplace copy gave no version" };
  } catch (e) { return { error: `git fetch of the marketplace failed: ${String(e.message).split("\n")[0]}` }; }
}

async function latest() {
  const errors = [];
  for (const get of [() => fromUrl(LATEST_URL), () => fromUrl(API_URL, { Accept: "application/vnd.github+json" }), async () => fromMarketplaceCopy()]) {
    const r = await get();
    if (r.version) return r;
    errors.push(r.error);
  }
  return { error: errors.join("; ") };
}

const where = surface();
const l = await latest();
const apply = process.argv.includes("--apply");
// Latest unknown: report it, or, with --apply in Claude Code, run the update anyway.
if (!l.version && !(apply && where === "claude-code")) out({ installed, latest: null, behind: null, surface: where, pluginRoot, error: l.error });
const behind = l.version ? cmp(installed, l.version) < 0 : true;
const base = { installed, latest: l.version || null, behind: l.version ? behind : null, surface: where, pluginRoot, ...(l.version ? {} : { checkError: l.error }) };
if (!behind || !apply) out(base, behind ? 10 : 0);
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
const reg = readJson(path.join(os.homedir(), ".claude", "plugins", "installed_plugins.json"));
const entries = [].concat(reg?.plugins?.[`${PLUGIN}@${MARKETPLACE}`] || []);
const now = entries.map((x) => x?.version).filter(Boolean).sort(cmp).pop() || null;
if (!l.version && now && cmp(now, installed) <= 0) out({ ...base, updated: false, now, steps, note: "Already the newest the marketplace has." }, 0);
out({ ...base, updated: true, now, steps, next: "Start a fresh Claude Code session (or run /reload-plugins) and run your command again." }, 11);
