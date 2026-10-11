# External connections: the bonus beat that proves it is not a toy

A demo that lives entirely inside UnifyApps leaves one question in the room: "does it talk to
our systems?" An external beat answers it on screen: an approval creates a ticket in Jira or
ServiceNow, a rejection sends an email from their mailbox, the fleet list is read live from a
Postgres database, a Slack message lands in a channel. These are nice to have, not the demo,
so the Connector proposes them, the Judge admits at most one unless the request asks for
more, and nothing about them is allowed to put the main storyline at risk.

## The three kinds of connection

| Kind | What it is | Credential | Stop |
|---|---|---|---|
| `existing` | a connection already on the tenant (`list_connections`), ours or the client's | none needed | none |
| `sandbox` | a system our team controls for demos: a free Postgres, a Jira or Zendesk sandbox, a test mailbox, a demo Slack workspace; named in the profile's `sandboxes` line | the team's, entered once by the person at the credential stop when the tenant does not hold it yet | one, unless a connection already exists |
| `client` | the client's own system, with credentials they provide for the PoC | the client's, entered once by the person | one |

The profile's `external` line says how far to go: `existing` (default, zero stops) uses only
connections already on the tenant; `sandbox` admits the team's sandboxes and allows one
credential stop; `client` admits the client's systems too; `off` skips the Connector.

## What the Connector does

1. **Inventory.** `list_connections` on the tenant (through the automation-code server's
   `list_connections` and the connection server's), with `active` status; the connector
   catalogue for the systems the client runs (from the context notes' constraints and the
   profile), through `list_apps` and `search_operations`; the operator skill
   `connector-catalogue` when the session lists it.
2. **Propose.** One to three external beats, each in the shape below: the system, the
   operation (`create issue`, `send email`, `select rows`), the connection kind, the beat it
   joins, what the audience sees in the external system, and the cost. Prefer the one that
   sharpens the lean-forward moment; prefer `existing` over `sandbox` over `client`.
3. **Probe, read-only.** For an `existing` connection, confirm the operation's schema with
   `get_operation_schema` and run a read with `run_connector_operation` (list projects, select
   one row, list labels) so the beat is promised on a working connection, never on hope.
   That tool refuses writes by design; the write (the ticket, the email) happens inside the
   automation Nebula builds, and its test run makes one clearly-labelled test record in the
   sandbox.
4. **Hand the lines to the brief.** For each admitted beat: a `connection` line (an existing
   id, or `create · <system> · <sandbox | client>` which Nebula makes a `manual` task), an
   `automation` line that names the connector, the operation, the inputs from the story row
   and the result vocabulary, and a `## Rules` line about the test record. Nebula's
   `external-data-inspection` skill is mandatory for the automation step and its agent loads
   it.
5. **Verify after the build** (`phase: verify`): read the external effect back with a read
   operation (`get issue` by the key the run returned, list sent messages, select the row) and
   report what exists there, so the Rehearsal's external beat passes on evidence.

## An external beat

```markdown
## <Title>: <system> · <operation>
- Connection: <existing: name (id) | sandbox: <name from the profile> | client: <system>>
- Joins beat: <n> · after <what the presenter does> · the audience sees: <what appears in the external system, and what comes back on screen: the ticket key, the sent status>
- Inputs from the story row: <field → parameter>
- Returns: <result vocabulary, such as created · duplicate · error, and the key or id shown on the page>
- Probe: <the read operation run, and what it returned> | not probed: <why>
- Cost: <entities added: one automation step, one page element>
- Risk: <the one way it falls flat on the day, and the fallback: the beat is skipped and the storyline still stands>
```

## The credential stop, when one is needed

Creating a connection is the main session's job, with Nebula's `connection-manager` skill on
the `connection` server, never a builder's. Read `get_connection_schema` first for the exact
fields. A non-OAuth connection takes the values the person gives at the stop (one question,
header `Connection`, naming the system and the fields the schema needs) and passes them to
`create_connection`, which tests them and saves only when the test passes; those values are
never written to any file or repeated in chat. An OAuth connection answers a `redirectUrl`;
give it to the person to open, then read the connection back with `list_connections`. A stop
the person declines skips the external beat; the storyline stands without it.

## Rules

- An external beat never sits on the critical path: the lean-forward moment must work even if
  the external system is down on the day. The script carries a fallback line.
- Test records are labelled (`DEMO-TEST` in the summary, the demo's date in the body) and
  listed in the runbook so someone can clean the sandbox.
- Never create, update or delete anything in an external system except through the
  automation's own run. `run_connector_operation` is for reads.
- A client system is `client` kind even when the client offered credentials in Slack; the
  person enters them at the stop, the agent never copies them out of a message.
- No external beat on a production system of the client's. A `client` connection in a demo
  points at their sandbox or test instance, and the profile's `sandboxes` line says which.
