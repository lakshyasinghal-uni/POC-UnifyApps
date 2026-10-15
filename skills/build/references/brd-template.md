# The BRD

The business requirements document for the POC, written in phase 2 from the approved research,
the assessment, the chosen storyline, the ledger and the Scout's capability table. It is what
the build follows after G2: nothing is built that the BRD does not ask for, and nothing the BRD
asks for is left out without a ticket saying why.

Write it outcome-first and in plain English. Lead every requirement with the business outcome
it delivers, then what the solution does to get there. No screen tours, no feature lists, no
rhetorical phrasing. Every requirement traces to a source: the client's words (context notes),
a research finding, or a ledger decision with its tag.

Save it to Orbit as `save-doc --stage 3_scope --slug brd --type brd --status in_review`. A
change to a requirement after G2 is a new version, never an edit in place.

## Size by tier

| Section | sprint | standard | full |
|---|---|---|---|
| 1 Summary | ✓ | ✓ | ✓ |
| 2 Goals and success measures | 3 goals | ✓ | ✓ |
| 3 Users and roles | ✓ | ✓ | ✓ |
| 4 Process today and with the solution | one line each | ✓ | ✓ with the master flow |
| 5 Requirements | must-haves only | must and should | must, should, could |
| 6 Data | ✓ | ✓ | ✓ with sample rows |
| 7 AI agents | ✓ | ✓ | ✓ with test questions and expected answers |
| 8 Integrations | named | ✓ | ✓ with each operation |
| 9 Design | the design system's name | ✓ | ✓ |
| 10 Demo storyline | beats | ✓ | ✓ |
| 11 Out of scope | ✓ | ✓ | ✓ |
| 12 Assumptions and open questions | ✓ | ✓ | ✓ |
| 13 Acceptance at G3 | ✓ | ✓ | ✓ |

## Shape

```markdown
# <Client> — <use case>: business requirements

Version <n> · <date> · POC <poc_id> · tier <tier> · status <draft | in review | approved at G2 by <name> on <date>>
Sources: research v<n>, assessment v<n>, context notes v<n>, data plan v<n>

## 1. Summary
<three sentences: the client's problem in their words, the outcome the POC shows, how the
demo proves it>

## 2. Goals and success measures
| Goal | How the demo shows it | Measure | Source |

## 3. Users and roles
| Role | What they need from the solution | Seat in the demo |

## 4. Process
- **Today:** <steps, where time or money is lost>
- **With the solution:** <steps, who does what, what the agents decide>

## 5. Requirements
| ID | Priority | Outcome | What the solution does | Source | Demo beat |
| R1 | must | <outcome> | <behaviour> | <CLIENT · RESEARCH · OWNER · STAND-IN …> | <beat> |

## 6. Data
| Object | Given or assumed | Rows | Where it lives | Masking | Story row |

## 7. AI agents
| Agent | Answers or decides | Tools | Guardrails | Test question → expected answer |

## 8. Integrations
| System | Connection (existing, sandbox, client, simulated) | Operations | Fallback |

## 9. Design
Design system v<n> (<swatch>, <shipped face>), mockup <letter> as the reference, the app built
code-first.

## 10. Demo storyline
<the beats in order, each with the requirement IDs it proves>

## 11. Out of scope
- <item> — <why, and when it could come back>

## 12. Assumptions and open questions
| Item | Why it was needed | What would confirm it | Ticket |

## 13. Acceptance at G3
- Every `must` requirement is shown by a beat that passes rehearsal.
- Every check in the evidence pack passes, or is on the unverified list with a reason.
- <client-specific acceptance lines>
```
