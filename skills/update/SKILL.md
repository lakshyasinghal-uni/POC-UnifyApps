---
name: update
description: >
  This skill should be used when the user types /poc-studio:update, asks to "update POC Studio",
  "check for a new version of POC Studio" or "is POC Studio up to date". /poc-studio:start runs
  the same check with a 5-second limit; build and setup do not run it. It compares the installed POC Studio version with
  GitHub main; in Claude Code on the person's machine it updates the marketplace and the plugin
  itself, turns on auto-update for the poc-unifyapps marketplace, and stops so the next session
  runs the new version; in the Claude app it shows the newer version and how to update, then
  asks whether to stop or carry on.
metadata:
  version: "0.4.8"
---

# POC Studio: update

Make sure the person runs the latest POC Studio. A running session keeps the version it loaded,
so an update always ends with a fresh session (or `/reload-plugins` in Claude Code).

## The check (only when the person runs /poc-studio:update)

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/version-check.mjs"`. It prints one JSON line:
`installed`, `latest` (from GitHub main's `.claude-plugin/plugin.json`), `behind`, and
`surface` (`claude-code` on a machine, `claude-app` for the Claude app and cloud sessions,
`unknown`).

| Result | What to do |
|---|---|
| `behind: false` | Say nothing beyond `POC Studio <version>, latest.` and carry on. |
| `latest: null` (GitHub not reachable) | Say `Could not check for a newer POC Studio (<error>); carrying on with <installed>.` and carry on. |
| `behind: true`, `surface: claude-code` (or `unknown` with the `claude` command available) | § Update in Claude Code. |
| `behind: true`, `surface: claude-app` | § Update in the Claude app. |

## Update in Claude Code (the default)

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/version-check.mjs" --apply`. It runs
   `claude plugin marketplace update poc-unifyapps`, then
   `claude plugin update poc-studio@poc-unifyapps`, and reports each step.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/enable-autoupdate.mjs`, so later releases arrive by
   themselves (§ Auto-update).
3. **Exit 11 (updated):** say, in three lines at most:
   `POC Studio updated from <installed> to <latest>. Start a fresh Claude Code session (or run
   /reload-plugins) and run your command again.` Name what is new in one line from the
   CHANGELOG's top entry when it is at hand. **Then stop.** Do not run the build or setup on
   the old version.
4. **Exit 1 (the update failed):** show the failing command and its last lines, give the two
   commands to run by hand in a terminal, and ask one question, `Carry on with <installed>, or
   stop?` (`Stop`, `Carry on with <installed>`).
5. A sign-in, network or permission prompt from the `claude` command is the person's to answer;
   never work around one.

## Update in the Claude app

A chat cannot update a plugin installed on the person's account. Say:

`POC Studio <latest> is out; this chat has <installed>. To update, update the POC Studio plugin
in your account with the latest package (or refresh it from its marketplace if it was added
from there), then start a new chat.`

Then ask one question, header `Update`: `Stop here, or carry on with <installed>?` (`Stop`,
`Carry on with <installed>`). Carry on only on that answer, and say once in the run's first
gate message that an older version ran.

## Auto-update

Background auto-update is off by default for marketplaces like `poc-unifyapps`, and
`marketplace.json` has no field to turn it on; it is a per-person Claude Code setting:

```json
"extraKnownMarketplaces": {
  "poc-unifyapps": {
    "source": { "source": "github", "repo": "shubhankargarg-lang/POC-UnifyApps" },
    "autoUpdate": true
  }
}
```

`enable-autoupdate.mjs` adds it to `~/.claude/settings.json`, keeping every other setting and
an existing source, with a backup beside the file; it never rewrites a file that is not plain
JSON. Setup and this skill run it in Claude Code; say in one line when it turned the setting on.
With it on, Claude Code checks the marketplace in the background during a session and offers
`/reload-plugins` when a new version arrived; the check above still catches a session that
started before an update. Environment settings that turn off updates (`DISABLE_AUTOUPDATER`,
`DISABLE_UPDATES`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`) win over it.

## When run on its own

`/poc-studio:update` runs the check and, when behind, the update for the surface. When current,
it also runs `enable-autoupdate.mjs` in Claude Code and says `POC Studio <version> is the latest;
auto-update is on.`
