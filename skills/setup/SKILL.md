---
name: setup
description: >
  This skill should be used when the user types /poc-studio:setup, asks to "set up POC Studio",
  "connect POC Studio", "connect the objects", "set up the gates" or "fix the Slack connection",
  and whenever a build reports that Slack, the UnifyApps objects, Calendar or Drive is not
  connected. Run once per person, and again whenever a connection breaks. It checks the Slack,
  Google Calendar and Google Drive connectors, checks that the Orbit Studio API accepts calls, finds your personal Slack chat for gate messages, runs one
  test gate end to end, and saves the settings (no secrets) in poc-studio.yml.
metadata:
  version: "0.6.0"
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

## 2. Orbit write-back

Every POC, document, change, feedback ticket and event is written to five Orbit objects
(`orbit_studio_poc`, `orbit_studio_document`, `orbit_studio_iteration`, `orbit_studio_activity`,
`orbit_studio_feedback`) through the Orbit Studio API hosted on Orbit ([objects.md](../build/references/objects.md)),
which needs no token. Load the `poc-studio:connect` skill with the Skill tool and follow it.
When it ends with write-back on, carry on. When the API refuses or cannot be reached, say in one
line `Orbit write-back is off: <why>; records are kept in the working folder.` and carry on:
write-back is not a stop. Setup never signs in to Orbit and never asks for a cookie, password
or token.

## 3. Your personal Slack chat for gates

Slack is used for one thing: when a gate is ready, a notification goes to **your personal
Slack chat** (your own direct-message conversation, posted as you through the Slack connection
you set up) asking you to approve it in the Claude chat. You approve in the Claude chat; Slack
replies are not read. Every other question stays in the Claude chat. Nothing is asked about channels: the person
running POC Studio is the gate owner, and the only other approver is their manager (step 3).

1. Find your own Slack user with the Slack user search (by your email or name) and keep its
   user ID. If more than one user matches, ask which one is you; never guess.
2. The test gate in step 5 posts to that user ID, which opens your personal chat; keep the
   conversation ID the post returns as the gate chat.
3. **Your manager.** Every gate also needs your manager's approval in the Orbit Studio app;
   it passes when you both have approved. Ask once, in the Claude chat, header `Manager`: their
   name and email (free text), or `No manager` (your approval alone then passes a gate). Look
   the person up with the Slack user search to confirm the email when you can. Keep it in the
   settings; a build can change it for one POC.

## 4. Nebula

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/nebula-root.mjs"` and name its version and whether it
can build code apps (`codeBuilder`). If it cannot, say that the first build will run
`/nebula:update` to the code-builder version. Nebula missing is named, not a stop: setup does
not need it, the build does.

## 5. One test gate, end to end

Every write is a call to the Orbit Studio API as objects.md says. Every `message` and `title`
here starts with `[TEST]` (connect § Guardrails). When write-back is off, the bodies are kept as
pending files and the Slack half still runs.

1. **Reuse this person's setup row.** When `poc-studio.yml` has a `setup_row`, `poc-get` it and
   use it if it is found. Only when there is none, create one with `poc-create`:
   `client_name: Setup test`, `client_slug: setup-test`, `use_case: Connection test`, `tier:
   express`, `brief: [TEST] setup connection test`, owner and `started_by` this person, the
   manager from step 3, `slack_channel`, `build_mode: sonic`. Keep its `poc_id` as `setup_row`.
   Never create a second setup row for the same person.
2. Save a one-line test document with `document-save` (stage `0_kickoff`, slug `setup-test`,
   type `brief`, content `[TEST] setup connection test`, `created_by` this person).
3. `poc-get` the row and check that the document is listed.
4. Send a test gate the way [gate-delivery.md](../build/references/gate-delivery.md) sends a
   real one, header `Test gate`, with `gate: none`: the notification to your personal Slack chat,
   then `log-activity` (`type: gate_posted`, `gate: none`, message `[TEST] Test gate posted`,
   `posted_to` the chat), and the question in the Claude chat (`approve` or `stop`). Save the
   conversation ID the Slack post returns as your gate chat, and ask you to confirm the
   notification arrived. The four real gates are never opened on the setup row.
5. Take the answer from the Claude chat and write it with `poc-update`: `changes: {status:
   stopped, blocked_on: setup test row}`, activity `gate_decided`, `gate: none`, `decision`
   `approve` or `stop`, message `[TEST] Test gate <answer> · connection test passed <date>`.

The setup row stays as the record that setup passed; nothing is deleted.

## 6. Settings

Write the settings to `poc-studio.yml` in the working folder. **No secret goes in it.**

```yaml
version: 0.6.0
checked: <ISO date and time>
setup_row: <poc_id of the person's setup row>
orbit:
  writeback: on | off     # from /poc-studio:connect
  api: <url>
  objects: [orbit_studio_poc, orbit_studio_document, orbit_studio_iteration, orbit_studio_activity, orbit_studio_feedback]
manager: { name: <name>, email: <email> }   # or: manager: none
slack:
  owner: { name: <name>, id: <U…> }
  gate_chat: { type: personal, id: <D…> }    # your own direct-message conversation
connectors: { slack: ok, calendar: ok | missing, drive: ok | missing }
nebula: { version: <v>, code_builder: true | false }
poc_studio: { version: <v>, auto_update: on | off | not applicable }
test_gate: { poc: <setup row>, notified: true, at: <ISO> }
```

Finish with five lines at most: what is connected, what is missing and what that costs, that
gate notifications will come to your personal Slack chat, that you approve here and your manager
in the Orbit Studio app, and that
`/poc-studio:build <request>` is ready.

## When to run it again

Whenever the build's save check cannot reach the objects, a Slack post fails, or the user
changes Slack accounts. Re-running keeps everything that still
passes and redoes only what fails; it never creates a second copy of an object or a second
setup row.
