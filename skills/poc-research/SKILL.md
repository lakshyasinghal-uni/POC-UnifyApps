---
name: poc-research
description: Research a new POC requirement on the web and produce a cited research document before scoping starts. Use when a use case arrives and the team needs to understand the client, the industry process, the rules and standards, existing products, and realistic demo data — or when the user asks to "research this requirement", "do background research for the POC", or "build the research doc".
metadata:
  stage: 1 — after "use case arrives", before scoping and the BRD
  output: research/<poc-slug>-research.md (a draft for PM review)
---

# POC research

Turn a POC requirement into a short, cited research document that the PM can review and that the
later stages (scoping, BRD, design, demo data) can build on.

The document answers one question: **what do we need to know about this client and this problem to
build a credible POC?** Every fact in it points to a source. Anything that could not be found is
listed as an open question, not guessed.

## Where this sits in the loop

```
use case arrives → [poc-research] → scoping → BRD → design → build (Nebula) → enhance → review → sanity + demo
```

- **Input:** the requirement as it arrived — a brief, an email, sales notes, Slack history, an RFP
  extract, or a few lines from the user.
- **Output:** `research/<poc-slug>-research.md`, status **Draft**, saved to the Orbit Studio objects
  as the POC's research document when run inside a POC Studio build. It is a draft until the PM approves it
  at the research gate. Nothing in this skill sends, publishes or contacts anyone.
- **Used by:** the scoping and BRD skills (problem, process, KPIs, rules), the design-system skill
  (client brand, industry look), and the demo-collateral skill (real entities, realistic sample data).

## Golden rules

1. **Never invent a fact, number, name or source.** If the web does not answer it, write it under
   *Open questions* and say what would answer it (a client document, a call, a sample file).
2. **Every factual sentence carries a link.** No link, no claim. Assumptions are allowed only in the
   *Assumptions* section and are marked as such.
3. **Paraphrase.** Write findings in plain English in your own words. A direct quote is the exception:
   under 15 words, at most one per source, only where the exact wording matters (a regulation, a
   contract term). Never copy paragraphs, tables or long lists from a source.
4. **Keep client information out of search queries.** Search for public facts (company, industry,
   regulation, products). Never put deal values, internal contacts, pricing or anything marked
   confidential into a query.
5. **Prefer the client's own region and market.** If the client is in one country and the end
   users are in another, research both and say which one the POC should assume. Flag the choice as
   an open question when it is not settled.
6. **Date everything that changes.** Prices, leadership, regulations, product versions and market
   figures get the date you found them and the date the source was published.
7. **Research serves the POC.** Each section ends with what it means for the build. Background that
   changes nothing in the POC is cut.
8. **Draft, then stop.** Hand the document to the research gate. Do not start scoping or the BRD
   until the PM has approved or edited it.

## Step 1 — Read the requirement and write the research questions

Read everything that came with the use case. Pull out:

- client name, industry, country or region, and the team asking
- the business problem in one sentence, and the outcome the client wants
- the users (roles) and the process the POC touches
- named systems, products, standards, competitors or partners
- anything that is unclear or contradicts itself

Then write 8 to 15 research questions across the six lenses below. Skip a lens only when it clearly
does not apply, and say why.

| Lens | What to find | Typical sources |
|---|---|---|
| **1. Client** | What the company does, size, markets, products, recent news, strategic priorities, any public statement about the problem area | Company site, annual report or filings, press releases, reputable news |
| **2. Process and domain** | How the process works today in this industry, the roles involved, the usual steps, where time is lost, the industry terms and KPIs | Industry bodies, standards organisations, practitioner guides, vendor documentation |
| **3. Rules and standards** | Regulations, compliance requirements, published standards, government data that the POC must respect or can use | Government and regulator sites, standards bodies, official registers |
| **4. Market and alternatives** | Products that already solve this, how they position it, what they automate, typical outcomes they claim | Vendor product pages, analyst summaries, case studies (treat vendor claims as claims) |
| **5. Demo realism** | Real entities and reference data to make the demo believable: locations, store or site types, product catalogues, public price lists, document formats, units, currencies, time zones | Official public lists, catalogues, open datasets |
| **6. Prior work** | Similar finished POCs or reusable assets | Earlier POCs' final documents in the Orbit Studio objects (`find orbit_studio_document --where status=final` with `scripts/ua-objects.mjs`, then filter by industry or use case), and this plugin's `unifyapps-solution-playbook` (eleven past UnifyApps builds and which to start from) |

When the user is present and the requirement is ambiguous in a way that changes the research (for
example, which country the pilot runs in), ask **one** question before searching. When the loop is
running unattended, take the most reasonable reading, write it at the top of the document under
*Reading of the requirement*, and continue.

## Step 2 — Search

- Start broad, then narrow. Short queries, 2 to 6 words. Each query should differ from the last.
- Search each named item separately (each competitor, each regulation, each product) rather than in
  one combined query.
- Open the page (fetch) for anything you will rely on. Do not build findings from search snippets.
- Expect roughly 15 to 30 searches for a typical POC. Stop when every research question either has a
  sourced answer or is clearly listed as open.
- If subagents are available, run one per lens in parallel and give each the research questions for
  its lens, the source rules below, and the finding format in Step 3. Merge and de-duplicate their
  results yourself.
- If a site refuses access, do not try to get around it. Use another source or list it as open.

### Source quality

| Tier | Examples | How to use |
|---|---|---|
| **A — primary** | Regulator and government sites, standards bodies, the client's own site and filings, official price lists, product documentation | Enough on its own |
| **B — reputable secondary** | Established news outlets, industry associations, analyst firms, academic papers | Good; confirm key numbers with a second source |
| **C — vendor marketing** | Competitor product pages, case studies, press releases from vendors | Use for what a product offers; treat outcome figures as the vendor's claim |
| **D — weak** | Forums, unattributed blogs, SEO listicles, AI-generated pages | Only to find a lead; never cite as the basis of a finding |

## Step 3 — Record findings

Record each finding in this shape while you work:

```
Finding: <one plain-English sentence>
Confidence: ✅ confirmed | 🟡 single source | ⚠️ conflicting | ❓ not found
Sources: [Title](URL) — publisher, published <date>, read <date>
Means for the POC: <one sentence>
```

- **✅ confirmed:** a tier A source, or two independent tier B sources that agree.
- **🟡 single source:** one tier B or C source. Usable, but say so.
- **⚠️ conflicting:** sources disagree. Give both and say which the POC should assume.
- **❓ not found:** searched and not answered. It moves to *Open questions*.

## Step 4 — Write the document

Write `research/<poc-slug>-research.md` using the template below. Keep it readable in ten minutes:
an executive summary the PM can read alone, then the detail.

Write outcome-first and in plain English. Lead each section with what it means for the POC, then the
evidence. No rhetorical phrasing. Do not describe screens or UI the reader cannot see.

```markdown
# <Client> — <use case>: research

Status: Draft for review · Prepared <date> · Requirement received <date>

## Reading of the requirement
<2–4 sentences: the problem, the outcome wanted, the users. Any assumption taken to resolve
ambiguity is stated here.>

## Executive summary
- **<Lead-in>:** <one line>          (5 to 7 bullets, the points that change the POC)

## 1. Client
## 2. Process and domain
   - How it works today (steps, roles)
   - Industry terms and KPIs (with the term the client's industry uses)
## 3. Rules and standards
## 4. Market and alternatives
   | Product | What it automates | How it is positioned | Source |
## 5. Demo realism
   - Real reference entities and data the demo can use (with sources)
   - What must be fictional (people's names, internal figures)
## 6. Prior work
   - Similar POCs or reusable assets, or "none found"

## What this means for the POC
- **Scope:** <what to include and leave out, and why>
- **KPIs or checks:** <candidates, each tied to a finding>
- **Data:** <what the demo data should look like>
- **Story:** <the one-line demo narrative the research supports>

## Assumptions
- <assumption> — why it was needed, and what would confirm it

## Open questions
| Question | Why it matters | Who or what can answer it |

## Sources
1. [Title](URL) — publisher, published <date>, read <date>, tier A/B/C
```

Each numbered section has 3 to 8 findings at most. Put the strongest first.

### A good finding, for reference

From a previous POC (retail brand compliance for a beverage-software client), the research found that
the client is headquartered in Vermont and that Vermont sells spirits through state agency stores
inside groceries, convenience stores and independents, with a published state price list. The
document turned that into three POC decisions: set the demo in Vermont as a "home market" pilot, use
the same three store types, and check the price KPI against the published list. It also raised one
open question: the client contact sat in India, so if the real pilot ran there, the towns, the price
source and the time-zone example would change while the KPIs stayed the same.

That is the pattern to follow: **a sourced fact → a concrete POC decision → the open question it
leaves.**

## Step 5 — Check before handing over

Go through the document once more and fix anything that fails:

- [ ] Every factual sentence has a link; every link opens to the page that supports it.
- [ ] No sentence closely copies a source; quotes are under 15 words and one per source at most.
- [ ] Numbers, prices and dates match their sources exactly.
- [ ] Anything that changes over time carries a date.
- [ ] Vendor outcome figures are labelled as vendor claims.
- [ ] Every research question from Step 1 is answered or listed under *Open questions*.
- [ ] *What this means for the POC* has at least one item tied to a finding in each relevant lens.
- [ ] No confidential client information appears in the document's sources or reasoning that came
      from public search.
- [ ] The executive summary stands on its own.

## Inside a POC Studio build

When `poc-studio:build` runs this skill, the Researcher agent does it in discovery and the
build owns the gate: the document is the one G1 · Path document, where the owner approves or
edits it before scoping starts. The build adds two closing sections to it: what the client and
team said (from Slack, email, Calendar and Drive) and the readiness verdict. G1 is never
skipped. The document is written to `research/<poc-slug>-research.md`, and its *Open
questions* become ledger rows.

## Step 6 — Hand over to the research gate

1. Save the document as `research/<poc-slug>-research.md` with status **Draft**.
2. Give the PM a three-line handover: the main finding, the biggest open question, and the decision
   the PM needs to make (for example, which market the pilot assumes).
3. Stop. Scoping starts only after the PM approves or edits the document. If the PM edits findings,
   their version is the source of truth for the later stages.

## What this skill does not do

- It does not contact the client, sales or anyone else, and does not send the document anywhere.
- It does not write the BRD, the scope or the design. It supplies their evidence.
- It does not access paid or login-only sources unless the user connects them.
- It does not estimate figures that were not found. A missing number is an open question.

## Learnings from past runs

Add a line here when a review at the research gate changes how research should be done, so the next
run applies it.

- Research the market the pilot will actually run in, not only where the client is headquartered.
  When the two differ, write it as an open question with what changes in each case.
