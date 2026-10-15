# Native workflow nodes: the code-node audit (2026-09-25)

**Source:** transcript `b70bad8d…`.

**Trigger:** Maher said the workflows we generate have "a lot of code nodes", and asked that native nodes be used and AI Insights load fast.

**Already recorded in:**
- builder `references/workflows.md` §5a;
- builder SKILL rule 10;
- the apps SKILL build-quality rules;
- `ai-app-patterns.md` §2 "Latency budget";
- API-SPEC §56–57.

## Audit method

1. **List the workflows (read-only, signed-in Orbit tab).**
   - Call `POST /api/aggregation?entityType=WorkflowDefinition&group=STANDARD` once per build prefix, with a `CONTAINS name` filter.
   - Keep only names that start with the prefix. That gave 357 workflows.
2. **Classify each node** from `GET /api/workflow-definition/{id}`, skipping START and STOP:

   | Class | Rule |
   |---|---|
   | code | `context.resourceName` starts with `code_by` |
   | control | IF_ELSE, LOOP, BRANCH, CALL_WORKFLOW, BREAK or DELAY |
   | ai | resource name contains `conv_ai` |
   | native | everything else |

   For each code node, also record:
   - its line count, from `inputs.code`;
   - whether it runs over 60 lines;
   - whether it is a no-op (`return [ok: true]`).
3. **Roll up per prefix:** code %, lines, big nodes, and the number of workflows where code ≥ native.
4. **Cluster the code-node titles** to see what the code actually does.
5. **Prove each replacement before writing a rule.** A scratch probe workflow (`mnp_native_node_probe`) ran against real rows (`cig_claim`).
6. **Time insights on the builder preview** (`/agent-api/preview/b/<app>/main/`), using resource timings. The published app would need its own login.

## Numbers

### Before

| Builds | Code nodes | Groovy lines |
|---|---|---|
| Mars `pao_` | 416/909 (46%) | 15,733 |
| Studio `scc_` | 353/740 (48%) | 6,256 |
| Hand-built apps | 15–20% | — |

- **Mars:** 99 of its code nodes run over 60 lines.
- **Hand-built apps:** single nodes reach 283 lines.
- **Mars code nodes did:** joins ("Lookups", 92), branching ("Act", 78) and the response ("Envelope", 78).
- **Studio code nodes were engine wrappers:**
  - "(rows)" 68;
  - "(record)" and "(changes)" 70;
  - 30 around LLM calls;
  - "Continue" no-ops.

### After: Studio engine 1.7.0, hospital plan

| | Before | After |
|---|---|---|
| Nodes | 187 | 142 |
| Groovy nodes | 95 (51%) | 26 (18%) |
| Wrappers | 70 | 1 |

Step tests were unchanged: 14 pass, 1 skip, 1 fail both before and after.

### Insights latency

- Scope: 8 workflows moved from Sonnet 4.6 to GPT-4.1 mini.
- Result: **16.5–35.9 s → 3.6–5.5 s** per screen.
- Cause: our own skill had told builders to copy the slow model's id.

## Rules

- **Native first.** Use the node that does the job before writing code:

  | Job | Native node |
  |---|---|
  | Filter | the fetch `triggerInputCondition` |
  | Count | `count_records` |
  | Group or join | `run_sql_query_on_list` |
  | Sort | `sort_list` |
  | Parse | `to_json_object` |
  | Branch | `IF_ELSE`; two incoming edges rejoin, no no-op needed |
  | Iterate | `LOOP` |
  | Bulk update | `update_records` MULTIPLE |
  | Response | the STOP `result` map |
  | Counters | Variable formulas |

- **What a Code node may be.** One real computation, titled with why no native node fits, and kept to about 40 lines. Over 60 lines needs a stated reason.
- **What a Code node may never be:** a flattener, a renamer, a filter-builder, an envelope, or a branch-join.
- **Avoid:**
  - `aggregate_records`: it doesn't group, so the sums are plausible but wrong.
  - `filter_list`: it returned nothing.
- **Traps:**
  - SQL-on-list fails on an empty list.
  - Templates have no `[*]`.
  - An upsert with a blank id inserts a record.
  - `''` into a number field fails silently.
- **Insights:**
  - Use a fast model with `maxTokens` ≤ 1,600 and 2–3 findings.
  - Cap input at 30 rows or 8,000 characters.
  - Aim for under ~8 s on first load and an instant revisit.
  - Record the measured time in the test report.
  - Add "quote only figures in the data; never count, add or average rows". The fast model miscounted 26 vs 30.
  - Reset the model on any cloned insights workflow.

## Mechanical check (gate before "done")

Run the step-2 classifier over the build's prefix. **Fail the build if any of these is true:**
- code ≥ native in any workflow;
- a code node over 60 lines with no stated reason;
- any `return [ok: true]` no-op;
- a code node titled rows, record, changes, envelope, lookup or next item;
- any `aggregate_records` or `filter_list` node;
- an insights `conv_ai` node on a slow model, or with `maxTokens` over 1,600.

Report code % per build.

**Gaps:**
- The classifier lives only in the transcript. Save it as `unifyapps-builder/scripts/audit-code-nodes.js`.
- Msheireb's Groovy `msh_rollup` predates SQL-on-list and is the first refactor candidate.
