#!/usr/bin/env node
/**
 * enable-autoupdate.mjs — turn on background auto-update for the poc-unifyapps marketplace in
 * Claude Code's user settings (~/.claude/settings.json), the documented place for it:
 *
 *   "extraKnownMarketplaces": { "poc-unifyapps": { "source": {...}, "autoUpdate": true } }
 *
 * marketplace.json has no field for this, so it is set per person. Idempotent: an existing
 * entry keeps its source and only gains autoUpdate; every other setting is left as it is.
 * A settings file that is not plain JSON is never rewritten. Prints one JSON line.
 * Exit 0 on or already on, 2 skipped (not Claude Code on a machine, or unreadable settings).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const NAME = "poc-unifyapps";
const SOURCE = { source: "github", repo: "shubhankargarg-lang/POC-UnifyApps" };
const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + "\n"); process.exit(code); };

if (process.env.CLAUDE_CODE_REMOTE === "true") out({ ok: false, skipped: "Cloud session: auto-update is a Claude Code setting on your own machine." }, 2);

const file = process.env.CLAUDE_SETTINGS_FILE || path.join(os.homedir(), ".claude", "settings.json");
let settings = {};
if (fs.existsSync(file)) {
  try { settings = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { out({ ok: false, skipped: `${file} is not plain JSON (${e.message}); add the entry by hand.`, file }, 2); }
}
settings.extraKnownMarketplaces ||= {};
const entry = settings.extraKnownMarketplaces[NAME] || {};
if (entry.autoUpdate === true && entry.source) out({ ok: true, alreadyOn: true, file });
settings.extraKnownMarketplaces[NAME] = { ...entry, source: entry.source || SOURCE, autoUpdate: true };
fs.mkdirSync(path.dirname(file), { recursive: true });
if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak-poc-studio`);
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + "\n");
out({ ok: true, turnedOn: true, file, backup: fs.existsSync(`${file}.bak-poc-studio`) ? `${file}.bak-poc-studio` : null });
