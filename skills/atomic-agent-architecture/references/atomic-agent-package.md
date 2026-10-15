# Atomic-agent package (for the reusable library)

An atomic agent is reusable when its one action is described independently of the use case that first needed it.
Each agent in the library is one folder:

```
atomic-agents/<domain>/<key>/
  agent.json        # the manifest below
  README.md         # what it does, what it never does, examples, known failure modes
  agent.ai_agent.json # the UnifyApps AI Agent (one Task; ids stripped) — atomic agents are AI Agents (2026-09-26)
  tools/            # the callable workflows it uses as tools (ids stripped), resourceVersions resolved at install
  golden/           # labelled input → expected envelope cases; the promotion gate when present (optional)
  CHANGELOG.md
```

```jsonc
{
  "key": "unit-economics-normalizer",            // stable, kebab-case, never reused for another action
  "version": "1.2.0",                             // semver; the version is part of the idempotency key
  "name": "Unit Economics Normalizer",
  "class": "D",                                   // D | E | J
  "action": "Convert every price to a comparable price per unit weight",   // exactly one action
  "domain": "commerce",
  "inputs":  { "type": "object", "required": ["price", "pack"], "properties": { } },    // JSON Schema
  "value":   { "type": "object", "properties": { } },                                    // the envelope's value
  "confidence": { "method": "verification", "ceiling": 100, "abstainReasons": ["MISSING_PACK_SIZE", "CURRENCY_UNKNOWN"] },
  "dependencies": { "connections": [], "objects": [], "models": [] },   // what the installer must bind
  "golden": { "cases": 40, "threshold": 1.0 },    // pass rate needed to reach production
  "usedIn": [ { "solution": "<solution-key>", "id": "AG-25" } ]
}
```

Rules
- The manifest names one action. A second action is a second package.
- Class D packages contain no LLM step; class J packages declare their ceiling (≤ 97) and, when one exists, their
  calibration set.
- Inputs and value are JSON Schema; the workflow validates both.
- When the package has a golden set, a new version is promoted only after it passes at `golden.threshold`; the
  previous version stays installable.
- When a blueprint reuses a library agent, its `agents[].library` is `"<key>@<version>"` and its build status is
  `reused`; the install binds the dependencies to the solution's connections and objects.
