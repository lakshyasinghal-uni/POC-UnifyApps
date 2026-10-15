---
name: setup
description: >
  This skill should be used when the user types /poc-studio:setup, asks to "set up POC Studio",
  "connect POC Studio", "connect Orbit", "set up the gates" or "fix the Slack connection", and
  whenever a build reports that Slack, Orbit, Calendar or Drive is not connected. Run once per
  person, and again whenever a connection breaks. It checks the Slack, Google Calendar and
  Google Drive connectors, connects Orbit by direct API or a signed-in browser tab, creates any
  missing Orbit object, finds your personal Slack chat for gate messages, runs one test
  gate end to end, and saves the settings (no secrets) in Orbit with a local copy in
  poc-studio.yml, so a new chat does not need setup again.
metadata:
  version: "0.4.9"
---

# POC Studio: setup

Make every connection the build needs, once, and prove it with one test gate. The build
refuses to start research or write anything until Slack and Orbit pass here.

Say one line at the start: `Setting up POC Studio: connectors, Orbit, your Slack chat, then one
test gate.` Keep a task list with the steps below.

## 0. Auto-update

In Claude Code, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/enable-autoupdate.mjs"` so new
releases arrive by themselves, and say in one line whether it turned auto-update on or found it
already on. This only edits the local Claude settings file; setup makes no call to GitHub.

## 1. Connectors

Check each with one ToolSearch (`+slack`, `+calendar`, `+drive`) and one cheap read: a
channel search for Slack, today's events for Calendar, a recent-files list for Drive.

| Connector | Needed for | If missing |
|---|---|---|
| Slack | gate messages, replies, feedback, signal capture | **required** |
| Google Calendar | the demo date and who is in the room | named, the build goes on without it |
| Google Drive | client files and past decks in signal capture | named, the build goes on without it |

For every missing one, show one connector card: SearchMcpRegistry with the product name, then
SuggestConnectors with what it returns, all missing ones in one card. Where those tools do not
exist, name the connector and where to add it in one line. Stop at this step only for Slack.

## 2. Orbit

Orbit holds every document, decision and feedback ticket
([orbit-records.md](../build/references/orbit-records.md)). Try, in order:

1. **Direct API.** `node "${CLAUDE_PLUGIN_ROOT}/scripts/orbit-api.mjs" check`. It uses
   `ORBIT_COOKIE`, or `ORBIT_USERNAME` and `ORBIT_PASSWORD` for a local (non-SSO) account, from
   environment secrets. When one is set and `check` passes, record `auth: env-cookie` or
   `auth: env-local-account`. **Do not paste a cookie or password into this chat.** Never echo,
   log or write them.
2. **The signed-in Orbit tab (the usual way).** When no secret is set, or `check` fails on
   auth, do not ask for a cookie: open orbit.uat.unifyapps.com in the built-in browser (else
   Claude in Chrome), let the user sign in, and run every Orbit command through
   `scripts/orbit-tab.mjs` (orbit-records.md § The signed-in tab). It runs the same
   `orbit-api.mjs` commands inside the tab, so the browser sends the session itself and the
   cookie never leaves the browser. Load it once (`orbit-tab.mjs loader`), then run `check`
   through it. Record `auth: tab`. Every later step in this setup (`ensure-objects`,
   `schema-check`, `contract-test`, the test gate's writes, the settings document) runs the
   same way.

**Never start a local server or relay for Orbit.** A page cannot reach anything on this
machine (the browser blocks localhost), so a relay always fails. If the tab transport itself
fails, say what failed in one line and stop.

Read who is signed in. When the saved settings (Orbit, else `poc-studio.yml`) already name an
Orbit user and this is someone else, or the user says they are someone else, warn in one line: everything will be written as
`<signed-in user>`. Ask whether to carry on or sign in as themselves.

Then `ensure-objects` (through `orbit-tab.mjs call` when `auth: tab`). It creates any of
`poc_studio_poc`, `poc_studio_document` and `poc_studio_feedback` that is missing, from
`skills/build/references/orbit-objects.json`, and never alters one that exists. Report which
existed and which were created.

Then `orbit-api.mjs schema-check`. It compares the three live schemas with the field names and
single-select values the plugin writes (orbit-records.md § Field names). Exit 5 means they
differ: show the list it returns, one line per difference, say that the plugin and the Orbit
objects need to be brought back in line, and stop setup there. Never change an object and
never rename a field to make it pass.

When the schema check passes, run `orbit-api.mjs contract-test` (a few minutes). It writes every
value the plugin can produce to `[TEST]` rows, reads each back, checks references, file formats
and that bad writes are stopped, and prints a pass list. Show the counts in one line
(`Contract test: <passed> of <total> passed.`) and save them in the settings
(`contract_test`). Any failure stops setup with the failing lines. It is skipped when the saved
settings already record a passing contract test for this POC Studio version and the schema
check found nothing new.

## 3. Your personal Slack chat for gates

Slack is used for one thing: when a gate is ready, a notification goes to **your personal
Slack chat** (your own direct-message conversation, posted as you through the Slack connection
you set up) asking you to approve it in the Claude chat. You approve in the Claude chat; Slack
replies are not read. Every other question stays in the Claude chat. Nothing is asked about approvers or channels: the person
running POC Studio is the gate owner.

1. Find your own Slack user with the Slack user search (by your email or name) and keep its
   user ID. If more than one user matches, ask which one is you; never guess.
2. The test gate in step 5 posts to that user ID, which opens your personal chat; keep the
   conversation ID the post returns as the gate chat.

## 4. Nebula

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/nebula-root.mjs"` and name its version and whether it
can build code apps (`codeBuilder`). If it cannot, say that the first build will run
`/nebula:update` to the code-builder version. Nebula missing is named, not a stop: setup does
not need it, the build does.

## 5. One test gate, end to end

1. **Reuse this person's setup row.** `find-poc setup-test` and keep the row whose
   `client_slug` is `setup-test` and whose `owner_email` (or `owner_name`) is the signed-in
   Orbit user (for Harshal, the existing `POC-setup-test-20261015`). Only when there is none,
   create one with `new-poc` (`client_name: Setup test`, `client_slug: setup-test`,
   `poc_name: Setup test · <user>`, `use_case: Connection test`, `owner_name` and
   `owner_email` the Orbit user, `owner_slack_id`, `slack_destination`, `stage: 0_kickoff`,
   `status: running`, `build_mode: sonic`); Orbit generates its ID. Never create a
   second setup row for the same person.
2. Save a one-line test document with `save-doc` (stage `0_kickoff`, slug `setup-test`, type
   `gate_pack`).
3. Run the write-back check from orbit-records.md.
4. Send a test gate exactly as [gate-delivery.md](../build/references/gate-delivery.md) says,
   header `Test gate`: the notification to your personal Slack chat, and the question in the
   Claude chat (`approve` or `stop`). Save the conversation ID the Slack post returns as your
   gate chat, and ask you to confirm the notification arrived.
5. Take the answer from the Claude chat, save the decision as a
   `gate_decision` document (a new version on each run), set the row's status to `stopped`,
   `run_state: done`, `last_activity: Connection test passed <date>`, and run the write-back check
   again.

The setup row stays in Orbit as the record that setup passed, and as the home of the person's
settings; nothing is deleted.

## 6. Settings, in Orbit

The settings below are saved **in Orbit** as the `settings` document on the person's setup row
(`save-doc --slug settings --type other --stage 0_kickoff`, YAML, a new version each time), so
a new chat on any machine finds them without running setup again: the build reads them with
`fetch-doc --poc <setup row> --slug settings`. A copy is also written to `poc-studio.yml` in the
working folder as a local cache; Orbit's version wins when they differ. **No secret goes in
either.**

```yaml
version: 0.4.9
checked: <ISO date and time>
setup_row: <poc_id of the person's setup row>
orbit:
  base: https://orbit.uat.unifyapps.com
  auth: env-cookie | env-local-account | tab
  user: <email or username signed in>
  objects: [poc_studio_poc, poc_studio_document, poc_studio_feedback]
slack:
  owner: { name: <name>, id: <U…> }
  gate_chat: { type: personal, id: <D…> }    # your own direct-message conversation
connectors: { slack: ok, calendar: ok | missing, drive: ok | missing }
nebula: { version: <v>, code_builder: true | false }
poc_studio: { version: <v>, auto_update: on | off | not applicable }
test_gate: { poc: <setup row>, notified: true, at: <ISO> }
contract_test: { version: <v>, passed: <n>, total: <n>, at: <ISO>, report: <path> }
```

Finish with five lines at most: what is connected, what is missing and what that costs, that
gate notifications will come to your personal Slack chat and approvals happen here, and that `/poc-studio:build <request>`
is ready.

## When to run it again

Whenever the build's write-back check cannot reach Orbit, a Slack post fails, or the user
changes Slack accounts. Re-running keeps everything that still
passes and redoes only what fails; it never creates a second copy of an object or a second
setup row.
