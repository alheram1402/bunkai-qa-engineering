# Format Reference — Bug Report

> Canonical shape only. NOT a per-ticket authoring target — real defects are filed as Jira `Defect` (pre-release) or `Bug` (post-release, per this repo's lifecycle-stage classification, see `agentic-qa-core/references/defect-management-doctrine.md`) work items and synced read-only, never authored as a local `.md` first.

## Summary

[One-line bug summary — symptom, not root cause]

## Environment

| Field | Value |
|---|---|
| Environment | local / qa / staging / production |
| Browser | [if UI-relevant] |
| OS | [if relevant] |
| User type / persona | viewer / member / admin+owner |
| Date/Time | [ISO-8601] |

## Steps to Reproduce

1. [step]
2. [step]
3. [step]

## Expected vs Actual

- **Expected**: [what should happen]
- **Actual**: [what happens]

## Evidence

- Screenshot(s): [repo-relative path or Jira attachment]
- Console logs: [if applicable]
- Network requests: [if applicable]
- Video: [if applicable]

## Impact

| Field | Value |
|---|---|
| Severity | `critica` / `mayor` / `moderada` / `menor` / `trivial` (this project's `severity` field option values — Spanish-language, per `.agents/jira-required.yaml`) |
| Users affected | [estimate] |
| Workaround | [if any] |
| Frequency | Always / Intermittent / Rare |

**Severity guide**:

| Severity | Criteria | Example |
|---|---|---|
| `critica` | System down, data loss, security breach | Cannot login, RLS bypass |
| `mayor` | Major feature broken, no workaround | Cannot file a Bug from a failed Run step |
| `moderada` | Feature impaired, workaround exists | Filter broken, manual workaround works |
| `menor` | Cosmetic, minor | Alignment, typo |
| `trivial` | Negligible | Non-blocking polish |

## Regression Flag

- [ ] Worked before (regression)
- [ ] Never worked
- [ ] Unknown

## Related Issues

- [KEY, KEY]

---

## Bunkai-specific field mapping

| Field | Jira field name | Fallback |
|---|---|---|
| `severity` | Severity 🚩 | Comment `## Severity` |
| `qa_assignee` | QA Assignee | Comment `## QA Assignee` |
| Parent | QA Defect Management epic (`BK-183`) — NEVER a product epic, per three-axis parenting model | — |

Workflow (Defect): `Open → In Progress → In Review → Ready For QA → Closed`, with side-exits `Cannot Reproduce` / `Duplicated` / `Enhancement` / `REJECTED` / `Deferred` / `ABORTED`. Multiple terminal states exist — do not assume `Closed` is the only done-state when querying. Full catalog: `.context/PBI/README.md` §4.
