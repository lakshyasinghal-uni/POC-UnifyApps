#!/usr/bin/env node
/**
 * Finds the installed Nebula plugin and checks its version against the range
 * Demo Studio was written for. Prints one JSON line:
 *
 *   { "ok": true, "root": "<folder>", "version": "3.47.0", "supported": true,
 *     "cli": "bash \"<root>/scripts/run-node.sh\" \"<root>/scripts/nebula.mjs\"",
 *     "browser": "<root>/skills/app-verify/scripts/browser.mjs",
 *     "lookCheck": "<root>/skills/app-craft/scripts/app-look-args.mjs" }
 *
 * Exit 0 when Nebula is found and supported, 2 when found but outside the
 * range (the JSON still holds the root, so a person may go on knowingly), 1
 * when no Nebula is installed. Set NEBULA_ROOT to point at a folder by hand.
 *
 * It also reports whether this Nebula can build code-first apps (the code
 * builder MCP, first shipped in 3.55.4-beta.31.feat-code-builder-mcp):
 *   "codeBuilder": true | false, "codeBuilderTarget": "<version to update to>"
 * Set POC_NEBULA_TARGET to change the target version.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const WRITTEN_AGAINST = "3.47.0";
const MIN = [3, 46, 0];
const MAX_EXCLUSIVE = [4, 0, 0];
const CODE_BUILDER_TARGET = process.env.POC_NEBULA_TARGET || "3.55.4-beta.31.feat-code-builder-mcp";
const CODE_BUILDER_TAG = "code-builder";

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const parse = (v) => String(v || "").split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => { for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); } return 0; };

const home = os.homedir();
const candidates = [];
if (process.env.NEBULA_ROOT) candidates.push(process.env.NEBULA_ROOT);
const installed = readJson(path.join(home, ".claude", "plugins", "installed_plugins.json"));
for (const [key, entries] of Object.entries(installed?.plugins || {})) {
  if (!key.startsWith("nebula@")) continue;
  for (const e of entries || []) if (e?.installPath) candidates.push(e.installPath);
}
const known = readJson(path.join(home, ".claude", "plugins", "known_marketplaces.json"));
if (known?.nebula?.installLocation) candidates.push(known.nebula.installLocation);
const cache = path.join(home, ".claude", "plugins", "cache", "nebula", "nebula");
if (fs.existsSync(cache)) {
  const versions = fs.readdirSync(cache).filter((d) => /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/u.test(d)).sort((a, b) => cmp(parse(b), parse(a)) || (a.includes("-") ? 1 : 0) - (b.includes("-") ? 1 : 0));
  for (const v of versions) candidates.push(path.join(cache, v));
}

let found = null;
for (const c of candidates) {
  const manifest = readJson(path.join(c, ".claude-plugin", "plugin.json"));
  if (manifest?.name !== "nebula") continue;
  if (!fs.existsSync(path.join(c, "scripts", "nebula.mjs"))) continue;
  found = { root: c, version: manifest.version || "0.0.0" };
  break;
}

if (!found) {
  console.log(JSON.stringify({ ok: false, error: "Nebula is not installed. Install the Nebula plugin first, then run Demo Studio again.", writtenAgainst: WRITTEN_AGAINST }));
  process.exit(1);
}

const v = parse(found.version);
const supported = cmp(v, MIN) >= 0 && cmp(v, MAX_EXCLUSIVE) < 0;
const target = parse(CODE_BUILDER_TARGET);
// Ready when the version names the code builder, or is a release past the beta's base.
const codeBuilder = String(found.version).includes(CODE_BUILDER_TAG) || cmp(v, target) > 0 ||
  fs.existsSync(path.join(found.root, "skills", "code-builder"));
const out = {
  ok: true,
  root: found.root,
  version: found.version,
  supported,
  codeBuilder,
  codeBuilderTarget: CODE_BUILDER_TARGET,
  writtenAgainst: WRITTEN_AGAINST,
  cli: `bash "${found.root}/scripts/run-node.sh" "${found.root}/scripts/nebula.mjs"`,
  browser: path.join(found.root, "skills", "app-verify", "scripts", "browser.mjs"),
  lookCheck: path.join(found.root, "skills", "app-craft", "scripts", "app-look-args.mjs"),
  note: supported ? undefined : `Demo Studio was written against Nebula ${WRITTEN_AGAINST} and checked for ${MIN.join(".")} up to (not including) ${MAX_EXCLUSIVE.join(".")}. Nebula ${found.version} may have moved a command or a file. Go on only if the person says so.`,
};
console.log(JSON.stringify(out));
process.exit(supported ? 0 : 2);
