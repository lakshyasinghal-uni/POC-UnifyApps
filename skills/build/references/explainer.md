# The explainer: a document a person can read and understand

The runbook tells the presenter what to click. The explainer tells anyone, including someone
who has never opened UnifyApps, what was built and how the data moves: what each object holds,
what each automation does and when, what each agent answers from, which page calls what. It is
written after the build and the rehearsal, from what actually exists on the tenant, never from
the brief. The Scribe writes it; a script turns it into a page that opens in any browser.

## Files

- `<Client> Demo Explainer.md` in the working folder: Markdown with Mermaid diagrams. It
  renders in most Markdown viewers and editors.
- `<Client> Demo Explainer.html` beside it: the same content as one self-contained page, made
  with `node "$STUDIO_ROOT/scripts/explainer-html.mjs" "<md>" "<html>"`. It loads two small
  libraries from a public CDN and needs nothing else.
- `studio/explainer/<client-slug>/`: the rehearsal shots copied in, so both files can show them
  with a relative path.

## Where the facts come from

Every statement is read, not remembered. Cache first, through the Nebula CLI: `entity context
solution` for the list; `cache obj <id>` for an object's fields, picklists and indexes;
`cache wf <id>` for an automation's nodes and trigger and `cache wf <id> --contract` for its
inputs and outputs; `cache agent <id>` for an agent; `cache outline`, `cache ds` and
`cache events <page> --app-id <app>` for what a page shows and which button calls what. Live
tools only on `miss` or `stale`, or for what the cache never holds (records: the story row is
read with `get_records`). The entity table from `plan finish` gives the links. Nothing from the
brief or the storyline is stated as fact unless a read confirms it; what could not be read is
marked `unverified`.

## Reading order and contents

1. **What this demo shows.** Three sentences: who the client is, what goes wrong in their
   world, what the audience sees fixed. Then the intent in one line (use case, platform, or
   both) and who the demo is for.

2. **The whole thing in one picture.** A Mermaid `flowchart LR` with every page, automation,
   object and agent as a node, grouped in subgraphs (`Pages`, `Automations`, `Data`,
   `Assistant`), and edges labelled with plain verbs: `saves a repair`, `reads trucks`,
   `asks about overdue trucks`, `approves or rejects`. One picture, under 20 nodes; a bigger
   demo gets one picture per storyline beat instead.

3. **What exists.** One table: name, kind, one plain sentence of what it is for, link.

4. **The data.** A Mermaid `erDiagram` of the objects and their relations (a reference field
   is a relation). Then, per object, three lines: what one row is in the client's words, the
   fields that matter and their values (picklist labels, not codes), who writes it (which
   automation or page).

5. **The automations.** Per automation: a one-line job; a Mermaid `flowchart TD` of its
   steps from the nodes `cache wf` lists, with branches labelled by their condition in words;
   then five short lines: runs when, reads, writes, returns, what can go wrong (the error
   branches and the result vocabulary). No node ids, no JSON, no tool names.

6. **The assistant** (when there is one). What it answers, what it answers from (the
   automations and objects it is bound to, the documents it can read), its guardrails in one
   line, and the three questions the script asks with the answers the rehearsal got.

7. **The pages.** Per page: what the person sees (the rehearsal shot), what each button or
   action does and which automation it calls, the states it shows.

8. **Follow one record.** A Mermaid `sequenceDiagram` of the story row's journey through the
   beats: presenter → page → automation → object → page, with the values at each step
   ("repair estimate $6,400 → over the $5,000 limit → waits for a manager").

9. **Words.** A short glossary of the client's terms used above, each with the platform word
   it maps to (truck → Vehicle object), so the audience and our team mean the same thing.

10. **Not shown and unverified.** What was cut by the Judge, what could not be read, what the
    rehearsal left unverified.

## How to write it

- Plain words, short sentences, the client's vocabulary from the profile and the context
  notes. No tool names, no ids in prose (ids go in the table's link column only), no JSON.
- A diagram's labels are the words a presenter would say. A label that needs the diagram to
  be understood is wrong.
- One idea per diagram. A flowchart over 20 nodes is split.
- Every section a reader could skip is marked so in its first line ("For the technical
  audience:" on the automation steps).
- Mermaid fences are ```mermaid blocks. Node labels with brackets, quotes or pipes go in
  double quotes: `A["Approve (over $5,000)"]`.
- Shots are referenced as `![Fleet overview](studio/explainer/<client-slug>/beat-1.png)`.
- Under two screens of prose plus the diagrams and shots. Length comes from pictures, not
  paragraphs.
