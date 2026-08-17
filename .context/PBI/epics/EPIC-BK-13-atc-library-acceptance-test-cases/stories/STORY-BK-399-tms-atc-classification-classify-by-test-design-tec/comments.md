# Comments for BK-399

[View in Jira](https://jira.upexgalaxy.com/browse/BK-399)

---

### Ely - 8/12/2026, 1:48:18 AM

## AI Product Owner / Business Analyst — Decision: does ATC classification metadata fall inside EPIC BK-13's "ATC parameterization editors, Phase 3" out-of-scope note

***Question***: EPIC BK-13's Out of Scope section defers "ATC parameterization editors (equivalence partitions, boundary values, decision tables, state transitions) — Phase 3." Does storing which test-design technique produced an ATC, plus a priority, fall inside that deferral, or is it a distinct, in-scope capability?

### Candidates considered

1. ***It IS out of scope — wait for Phase 3.*** Treat "technique" as inseparable from "parameterization" and defer the whole idea.
2. ***It is distinct and in scope now.*** A classification label (technique name + priority) is a constrained enum column plus a list filter — the same shape as the existing `layer` field — not an authoring surface for technique-specific test data (input tables, boundary grids, decision matrices, state diagrams).
3. ***Split******:****** ship technique now, priority later.*** Ship the technique field alone as the smaller half, defer priority to a follow-up.
4. ***File under a different epic*** (e.g. a future "ATC Quality Metadata" epic) rather than BK-13.

### Scoring (1-5, higher is better)

| Option | Product value | Consistency with precedent | Implementation cost | Reversibility | Risk of scope conflict | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Wait for Phase 3 | 1 | 3 | 5 | 5 | 5 | 19 |
| 2. Distinct, in scope now | 5 | 5 | 4 | 5 | 4 | 23 |
| 3. Split technique/priority | 3 | 3 | 3 | 5 | 4 | 18 |
| 4. Different epic | 3 | 2 | 3 | 4 | 3 | 15 |

Notes on the scoring:

- ***Option 1*** scores lowest on product value: it blocks a cheap, immediately useful coverage signal behind an unrelated future feature, for no real safety gain.
- ***Option 2*** wins on precedent (the ATC header already carries one classification enum, `layer`, in exactly this shape) and on reversibility (both fields are additive and nullable).
- ***Option 3*** was the split considered and rejected in the story brief itself: technique and priority share the same edit surface and the same shape, so shipping them together is more efficient without expanding scope — splitting only doubles review overhead for half the value each time.
- ***Option 4*** loses on consistency: ATC-level classification metadata belongs alongside the rest of the ATC header work already grouped under BK-13 (BK-18/19/21/23), not a new epic that would need its own cross-references back into BK-13 immediately.

### Winner: Option 2 — distinct and in scope now

BK-13's Phase-3 deferral targets **parameterization editors** — UI surfaces for authoring the technique-specific test ***data**** itself (an equivalence-partition input table, a boundary-value data grid, a decision-table matrix, a state-transition diagram). This story targets a ****classification label***: which technique produced the case, and how urgent it is. These are different features with different implementation shapes — a constrained enum column plus a list filter, versus a structured data-authoring surface — and conflating them would block a cheap, valuable coverage signal behind an unrelated and much larger future feature.

This story (BK-399) ships the technique and priority fields plus the corresponding ATC-list filter. Coverage **reporting** broken down by technique or priority on the Metrics screen remains explicitly out of scope for this story and is the natural follow-up.

---


_Synced from Jira by sync-jira-issues_
