---
name: setup
description: >
  This skill should be used when the user types /poc-studio:setup, asks to "set up POC Studio",
  "connect POC Studio", "connect Orbit", "set up the gates" or "fix the Slack connection", and
  whenever a build reports that Slack, Orbit, Calendar or Drive is not connected. Run once per
  person, and again whenever a connection breaks. It checks the Slack, Google Calendar and
  Google Drive connectors, connects Orbit by direct API or a signed-in browser tab, creates any
  missing Orbit object, records who approves gates and where gate messages go, runs one test
  gate end to end, and writes poc-studio.yml with no secrets in it.
metadata:
  version: "0.4.0"
---

# POC Studio: setup

Make every connection the build needs, once, and prove it with one test gate. The build
refuses to start research or write anything until Slack and Orbit pass here.

Say one line at the start: `Setting up POC Studio: connectors, Orbit, approvers, then one test
gate.` Keep a task list with the six steps below.

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
   environment secrets. If neither is set, tell the user how to set them as environment
   secrets in their environment's settings (or their shell profile on their own machine), and
   say plainly: **do not paste a cookie or password into this chat.** Never echo, log or
   write them.
2. **A signed-in tab.** If no secret is set, open orbit.uat.unifyapps.com in the built-in
   browser (else Claude in Chrome), let the user sign in, and run `ps('GET',
   '/api/user-context')` from the helpers in orbit-records.md. Record `auth: tab`.

Read who is signed in. When `poc-studio.yml` already names an Orbit user and this is someone
else, or the user says they are someone else, warn in one line: everything will be written as
`<signed-in user>`. Ask whether to carry on or sign in as themselves.

Then `orbit-api.mjs ensure-objects` (or the same calls from the tab). It creates any of
`poc_studio_poc`, `poc_studio_document` and `poc_studio_feedback` that is missing, from
`skills/build/references/orbit-objects.json`, and never alters one that exists. Report which
existed and which were created.

## 3. Approvers and where gate messages go

Ask once, with one AskUserQuestion (two questions):

1. `Who approves gates?` Options: `Just me`, `Me and my manager`, `Me and others` (free text:
   names). Their replies are the only ones that count at a gate.
2. `Where should gate messages go?` Options: `DM to me` (the default), `Group DM with the
   approvers`, `A channel` (free text: the channel name).

Resolve every person to a Slack user ID with the Slack user search, and a channel name to its
ID. A name that matches more than one person is asked back with the matches; never guess one.
Ask also `Remind after how many hours without an answer?` only when the user brings it up;
the default is 24.

## 4. Nebula

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/nebula-root.mjs"` and name its version and whether it
can build code apps (`codeBuilder`). If it cannot, say that the first build will run
`/nebula:update` to the code-builder version. Nebula missing is named, not a stop: setup does
not need it, the build does.

## 5. One test gate, end to end

1. Create a POC row `POC-setup-test-<yyyymmdd>` (client `Setup test`, use case `Connection
   test`, owner the user, approvers as answered, stage `0_kickoff`, status `running`).
2. Save a one-line test document with `save-doc` (stage `0_kickoff`, slug `setup-test`, type
   `gate_pack`).
3. Run the write-back check from orbit-records.md.
4. Send a test gate exactly as [gate-delivery.md](../build/references/gate-delivery.md) says,
   header `Test gate`, to the destination chosen, and ask in the chat at the same time. The
   reply words are `approve` or `stop`.
5. Take the first answer from either place, tell the other place, save the decision as a
   `gate_decision` document, set the row's status to `stopped` with use case `Connection test
   passed`, and run the write-back check again.

The test row stays in Orbit as the record that setup passed; nothing is deleted.

## 6. poc-studio.yml

Write `poc-studio.yml` in the working folder, with **no secret in it**:

```yaml
version: 0.4.0
checked: <ISO date and time>
orbit:
  base: https://orbit.uat.unifyapps.com
  auth: env-cookie | env-local-account | tab
  user: <email or username signed in>
  objects: [poc_studio_poc, poc_studio_document, poc_studio_feedback]
slack:
  owner: { name: <name>, id: <U…> }
  approvers: [{ name: <name>, id: <U…> }]
  gate_destination: { type: dm | group_dm | channel, id: <D… | C… | G…> }
  reminder_hours: 24
connectors: { slack: ok, calendar: ok | missing, drive: ok | missing }
nebula: { version: <v>, code_builder: true | false }
test_gate: { poc: POC-setup-test-<yyyymmdd>, answered_in: chat | slack, at: <ISO> }
```

Finish with five lines at most: what is connected, what is missing and what that costs, who
approves, where gates go, and that `/poc-studio:build <request>` is ready.

## When to run it again

Whenever the build's write-back check cannot reach Orbit, a Slack post fails, or the user
changes approvers or the gate destination. Re-running keeps everything that still passes and
redoes only what fails; it never creates a second copy of an object.
