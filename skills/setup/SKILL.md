---
name: setup
description: >
  This skill should be used when the user types /poc-studio:setup, asks to "set up POC Studio",
  "connect POC Studio", "connect the objects", "set up the gates" or "fix the Slack connection",
  and whenever a build reports that Slack, the UnifyApps objects, Calendar or Drive is not
  connected. Run once per person, and again whenever a connection breaks. It checks the Slack,
  Google Calendar and Google Drive connectors, checks the UnifyApps sign-in and the three POC
  Studio objects (orbit_studio_poc, orbit_studio_document, orbit_studio_feedback,
  orbit_studio_activity) over the REST API, finds your personal Slack chat for gate messages, runs one
  test gate end to end, and saves the settings (no secrets) in poc-studio.yml.
metadata:
  version: "0.5.0"
---

# POC Studio: setup

Make every connection the build needs, once, and prove it with one test gate. The build
refuses to start research or write anything until Slack and the objects pass here.

Say one line at the start: `Setting up POC Studio: connectors, the UnifyApps objects, your Slack
chat, then one test gate.` Keep a task list with the steps below.

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

## 2. The UnifyApps objects

Every POC, document, feedback ticket and event is saved to four UnifyApps objects over the REST
API,
with one plain client ([objects.md](../build/references/objects.md)):
`node "${CLAUDE_PLUGIN_ROOT}/scripts/ua-objects.mjs"`. It runs from the shell only; no browser
tab is used.

1. **Sign-in.** Run `whoami`. It uses `UA_COOKIE`, or `UA_USERNAME` and `UA_PASSWORD` for a
   local (non-SSO) account, from environment secrets, against `UA_BASE` (default
   `https://orbit.uat.unifyapps.com`). Exit 2 means none is set or the session is not valid:
   tell the person which variables to set as environment secrets, and stop. **Do not ask for
   a cookie or password in this chat**, and never echo, log or write them.
2. **Who.** Say who is signed in. When `poc-studio.yml` already names a different user, or the
   person says they are someone else, warn in one line that everything will be written as
   `<signed-in user>` and ask whether to carry on.
3. **The objects.** Run `schema` for `orbit_studio_poc`, `orbit_studio_document`,
   `orbit_studio_feedback` and `orbit_studio_activity`. For each, compare its fields, required fields and dropdown options
   with objects.md § The four objects and list every difference in one line each. A missing
   object, or a required field objects.md does not know, stops setup: say what is missing and
   that the object must be created or fixed in the tenant first. Setup never creates or
   changes an object.

Any failing call: run it again with `--debug` and show the request and the server's answer.

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

Use the recipes in objects.md.

1. **Reuse this person's setup row.** `find orbit_studio_poc --where client_slug=setup-test`
   and keep the row whose `owner_email` (or `owner_name`) is the signed-in user. Only when there
   is none, create one with `poc_id: POC-setup-test-<YYYYMMDD>` (checked with `exists`),
   `client_name: Setup test`, `client_slug: setup-test`, `use_case: Connection test`, `tier:
   express`, `owner_name`, `owner_email`, `approvers` and `started_by` the signed-in user,
   `started_at` now, `slack_channel`, `stage: 0_kickoff`, `current_gate: none`, all four gate
   statuses `pending`, `status: running`, and record a `poc_started` activity (`build_mode:
   sonic`). Never create a second setup row for the same person.
2. Save a one-line test document (stage `0_kickoff`, slug `setup-test`, type `brief`, status
   `draft`).
3. Run the save check from objects.md.
4. Send a test gate exactly as [gate-delivery.md](../build/references/gate-delivery.md) says,
   header `Test gate`: the notification to your personal Slack chat, recorded as a
   `gate_posted` activity, and the question in the Claude chat (`approve` or `stop`). Save the
   conversation ID the Slack post returns as your gate chat, and ask you to confirm the
   notification arrived.
5. Take the answer from the Claude chat, record it as a `gate_decided` activity (`gate: none`,
   message `Test gate <answer>`), set the row's `status: stopped`, `blocked_on: setup test
   row`, `last_activity: Connection test passed <date>`, and run the save check again.

The setup row stays as the record that setup passed; nothing is deleted.

## 6. Settings

Write the settings to `poc-studio.yml` in the working folder. **No secret goes in it.**

```yaml
version: 0.5.0
checked: <ISO date and time>
setup_row: <poc_id of the person's setup row>
objects:
  base: https://orbit.uat.unifyapps.com
  auth: cookie | local-account
  user: <email or username signed in>
  names: [orbit_studio_poc, orbit_studio_document, orbit_studio_feedback, orbit_studio_activity]
slack:
  owner: { name: <name>, id: <U…> }
  gate_chat: { type: personal, id: <D…> }    # your own direct-message conversation
connectors: { slack: ok, calendar: ok | missing, drive: ok | missing }
nebula: { version: <v>, code_builder: true | false }
poc_studio: { version: <v>, auto_update: on | off | not applicable }
test_gate: { poc: <setup row>, notified: true, at: <ISO> }
```

Finish with five lines at most: what is connected, what is missing and what that costs, that
gate notifications will come to your personal Slack chat and approvals happen here, and that
`/poc-studio:build <request>` is ready.

## When to run it again

Whenever the build's save check cannot reach the objects, a Slack post fails, or the user
changes Slack accounts. Re-running keeps everything that still
passes and redoes only what fails; it never creates a second copy of an object or a second
setup row.
