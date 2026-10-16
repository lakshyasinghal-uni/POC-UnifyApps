---
name: start
description: >
  This skill should be used when the user types /poc-studio:start, with or without a request,
  or asks to "start POC Studio", "start a POC", "start the journey" or "kick off a POC build".
  It is the one front door: it checks GitHub for a newer POC Studio (5 seconds at most) and
  installs it in Claude Code, runs setup when this person has never run it, then hands over to
  the build, which checks the connectors and starts the POC. It also takes
  "resume <POC ID or name>" to carry on an existing POC.
metadata:
  version: "0.5.0"
---

# POC Studio: start

One command for the whole journey: **update → setup if needed → build**. Say one line first:
`Starting POC Studio: checking for an update, then your connections, then the build.` Keep a
task list with the three steps.

What the person typed after the command is the **request** (for example
`/poc-studio:start Build a POC for Acme Logistics: fleet approvals, demo Friday`), or
`resume <POC ID or name>`, or nothing.

## 1. Update (5 seconds at most)

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/version-check.mjs" --timeout 5`.

| Result | What to do |
|---|---|
| `behind: false` | One line: `POC Studio <version>, latest.` Go to step 2. |
| `latest: null` (GitHub slow or not reachable), `surface: claude-code` | Run the update anyway, as the next row says: `--apply` updates through the `claude` command, which fetches with git and often works where the check did not. Exit 11 with `now` higher than `installed`: updated, as the next row. Exit 0: say `POC Studio <installed>; the marketplace has nothing newer.` and go to step 2. |
| `latest: null`, any other surface | One line: `Could not check for an update (<error>); carrying on with <installed>.` Go to step 2. Never retry and never wait longer. |
| `behind: true` in Claude Code | Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/version-check.mjs" --apply`, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/enable-autoupdate.mjs"`. On exit 11, say: `POC Studio updated from <installed> to <now or latest>. Type /reload-plugins, then run /poc-studio:start <the same request> again.` Repeat the request in that line so it can be copied. **Stop there**: the new version only loads after the reload, and Claude cannot type `/reload-plugins` itself. On exit 1, show the failing step in one line and ask `Carry on with <installed>, or stop?` (`Stop`, `Carry on with <installed>`). |
| `behind: true` in the Claude app | Say `POC Studio <latest> is out; this chat has <installed>.` and ask `Stop here, or carry on with <installed>?` (`Stop`, `Carry on with <installed>`). |

## 2. Setup, only when it has never run

Look for `poc-studio.yml` in the working folder and its `setup_row`.

- **Settings found:** one line, `Setup found (<date it was saved>).` Go to step 3.
- **No settings:** say `Running setup first; it connects Slack once.` and load the `poc-studio:setup` skill with the Skill tool. Follow it to
  the end. When setup passes, go to step 3. When setup stops (a required connection missing,
  or an object is missing), stop here too; setup has already said why.

Do not run setup again when settings exist; a broken connection is caught in step 3.

## 3. The build

**The request.** When the person gave none, ask one plain question in the chat and wait:
`What is the POC? Name the client, their website if you have it, the use case, who will watch
and the demo date.` Take the answer as the request. When they typed `resume …`, that is the
request.

Then load the `poc-studio:build` skill with the Skill tool, passing the request as its
arguments, and follow it from Phase 0. Its first step checks the connectors (Slack, the
Orbit write-back, Calendar, Drive, Nebula) and prints one status line; a required one
failing stops the build there. Then it asks Sonic or Zen (new builds) or finds the POC
(resume), and the journey runs from there.

Say nothing more about this skill once the build has started.
