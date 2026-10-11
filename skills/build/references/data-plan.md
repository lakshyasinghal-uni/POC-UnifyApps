# The data plan: what data the demo runs on, how much, and where it lives

Every demo stands on data, and the questions about it are the ones that embarrass a presenter
when they go unanswered: is this their data or ours, how many rows, where does it actually
sit, what happens to the real names. The Data Assumer settles all of it before the brief, as
`data-plan.md`, so the seeds, the storyline, the explainer and the runbook all say the same
thing.

## The four questions, per entity

1. **Source: given or assumed.** Given means the client (or the team) handed over something:
   a CSV or spreadsheet in the working folder (`studio/data/` or anything the request names),
   a file linked in the context notes (Drive, an email attachment), a screenshot of their
   system, a described schema. Assumed means Studio invents it. Never write `given` for data
   nobody gave; a request that says "use their SAP data" without a file is `assumed, shaped
   like SAP`, and the runbook says so.
2. **Volume.** How many rows the demo shows, and whether volume itself is part of the story.
   A `use-case` demo wants 15 to 20 rows that read well. A `platform` demo that claims scale
   wants enough rows that a table paginates and a search matters (200 to 2,000). The budget
   and Nebula's limits decide how they get in (below).
3. **Where it is, and where it will be.** The client's system of record today (SAP, Salesforce,
   a Postgres database, spreadsheets), and where the demo's copy lives: UnifyApps Storage
   objects (the default), an external database reached through a connection (when the
   Connector builds one), or both (a nightly pipeline is an idea for the Innovator, not a
   default).
4. **Masking.** Given data carries real people and real money. Before a row is seeded, names
   become invented names, emails and phones become fictional, identifiers are re-keyed, and
   amounts are kept or jittered by a stated rule, so totals still make sense. A masked copy is
   written beside the original; the original is never seeded and never leaves the folder.

## How rows get in, by volume

| Rows per object | How | Who |
|---|---|---|
| up to 20 | a `record · seed` line that names every row | Nebula's fde-agent |
| 21 to 200 | a `record · seed` line that names the masked file as the source and the count | Nebula's fde-agent, from the file |
| over 200 | an automation that generates or imports the rows, listed as its own `automation · create` line and run once before the demo | Nebula's automation-agent |
| any, in the client's database | no seed: the rows stay where they are and a connection reads them (external-connections.md) | the Connector proposes, Nebula builds the step |

The story row is always in the first 20, named, with the values the beats depend on.

## Reading what was given

- Files in the working folder: open each with a small script (row count, columns, a sample
  of five rows, empty columns, obvious identifiers and personal fields). Never load a file
  over 50 MB whole; sample it.
- Links in the context notes: fetch through the connector that holds them (Drive, Gmail) when
  the session has it; otherwise list them as `given, not fetched` with the link.
- A screenshot or a described schema: record the fields it shows as the shape to assume.
- Existing objects on the tenant (`scout.md`): their row counts are facts; a demo that reuses
  one says so.

## Output: `data-plan.md`

```markdown
# Data plan — <client>

## Summary
<Three lines: what was given, what is assumed, where the demo's data lives.>

## Entities
| Entity | Source | Rows | Lives in | Gets in by | Masking | Story row |
|---|---|---|---|---|---|---|
| Vehicle | given: fleet.xlsx (412 rows, 14 cols) | 40 shown | Storage object | file, 40 rows | names → invented; plates re-keyed | Truck 214 |
| Repair | assumed, shaped like their SAP PM orders | 18 | Storage object | named rows | none, fictional | Repair 7731, $6,400 |
| Ticket | assumed | created live | Jira sandbox (connection) | the automation creates it | none | — |

## Client's systems of record
- <system> · holds <what> · reached by <connection | not reached, data copied> · <what the presenter can say about it>

## Masking rules
- <field>: <rule>

## Files
- studio/data/fleet.xlsx · given · 412 rows · masked copy studio/data/fleet.masked.csv
## Open rows
- <data.decision>: <question> · candidates <a> / <b>
## Not given
- <what the storyline would like and nobody provided; the assumption made instead>
```

## Rules

- `given` only for a file, link, screenshot or schema that exists. The word "their data" in a
  request is not a file.
- Nothing personal from a given file reaches a seed, a mockup, a script or an explainer.
- Volume follows the intent and the budget, not ambition: more rows than a beat shows is
  cost without story.
- Where data lives is a sentence the presenter will be asked to say; write it so they can.
