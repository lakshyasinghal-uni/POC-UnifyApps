# A storyline

The Ideator writes three of these to `$STUDIO/storylines.md`: one **safe** (the obvious
version of the request, built from what the tenant already has), one **bold** (the version
that spends the budget on the lean-forward moment), one **unexpected** (a different angle on
the same request that the audience would not predict). The Stand-in scores fit; the Scout
scores feasibility and size; the Judge picks or merges.

## Shape

```markdown
## <Title, in the client's words>  · <safe | bold | unexpected>

- Intent: <use-case | platform | both> · <what the audience wants out of the demo, in their words from the context notes or the request>
- Audience and moment: <who watches> · leans forward when <the one thing they remember>
- Presenter's seat: <whose role the presenter plays, where they are>
- Story row: <the one record the beats revolve around, with the values that make the beats work>

### Beats
1. <presenter does> → <screen shows>  · page <name>
2. …
5. <the failure path: a rule refuses something> → <what the screen shows about it>
6. <the lean-forward moment> → <what appears>

### Hood beats (platform or both only)
H1. open <automation name> in the builder → <what the canvas shows: the nodes by name, the branch on <value>>
H2. open <object name> → <the fields by name, the picklist's values>

### Entities
- object · <name> · <new or existing id> · <the fields the beats need, one line>
- automation · <name> · <new or existing> · <called from, inputs, result vocabulary>
- page · <name> at <path> · <what it shows>
- ai-agent · <name> · <what it answers from>
- connection · <system> · <existing | sandbox | client> · <the external beat it carries, when the storyline has one; a bonus, never on the critical path>

### Needs
- <connection, credential or platform ability the storyline assumes; "none" when none>

### Risk
- <the one thing most likely to fall flat, and what to do if it does>

### Open rows
- <subject.decision>: <the question> · candidates <a> / <b>
```

## Rules

- 5 to 7 beats. Beat 1 opens on the home page; one beat is a failure path; the last beat is
  the lean-forward moment.
- Follow the intent (demo-defaults.md § Demo intent): a `platform` demo keeps the use case
  small and plain and carries 2 to 4 hood beats that open the configuration; a `use-case` demo
  has none; `both` has one or two, after the lean-forward moment.
- Every entity under Entities is named by a beat, and every field on it is shown by a beat or
  needed by a rule. Delete any line no beat uses before you finish; nothing is added for
  completeness.
- The request wins; Slack fills what it leaves open. Where they disagree, say so under Open
  rows.
- Entities stay inside the profile's budget line. A storyline that needs more says so in
  `Needs` rather than hiding it.
- Every page a beat names appears under Entities, and every object a page shows has a
  story row value.
- Names are the client's terms (the profile's `voice` line). No real people or companies.
- The three storylines must differ in their lean-forward moment, not only in wording. If two
  share one, replace the second.
- `Open rows` lists only decisions the storyline cannot settle itself: a threshold the
  request did not give, a role name, a value that changes meaning at a point.

## Scores, added by others

The Stand-in appends `fit: <1-5> because <one line>` under each storyline. The Scout appends
`feasibility: <1-5> because <one line>` and `size: <n> pages / <n> objects / <n> automations /
<n> agents`, with any `no tool` line it found. The Judge reads all three.
