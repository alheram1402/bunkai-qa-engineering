# Format Reference — User Story

> Canonical shape only. NOT a per-ticket authoring target — per-ticket story content is synced from Jira (source of truth) by `/sprint-testing` (`bun run jira:sync-issues get <KEY> --include-comments`) into `.context/PBI/epics/EPIC-<KEY>-<slug>/stories/STORY-<KEY>-<slug>/story.md`. This file documents the shape a Bunkai `Historia` (Story) issue should have so authors and reviewers share one reference.

## Story Statement

As a **[persona]** (`viewer` / `member` / `admin`+`owner` — see `.context/PRD/user-personas.md`)
I want to **[action]**
So that **[benefit]**

## Acceptance Criteria

Numbered, Given/When/Then, one scenario per AC:

- **AC1**: Given [context], When [action], Then [expected outcome].
- **AC2**: Given [context], When [action], Then [expected outcome].

**AC checklist to enforce**:
- [ ] Specific and measurable
- [ ] Testable (can be automated)
- [ ] Independent (doesn't assume other ACs)
- [ ] Business-focused (not implementation detail)

## Technical Notes

- [ ] API changes
- [ ] DB / migration changes (this project: raw SQL under `supabase/migrations/`)
- [ ] UI changes
- [ ] Dependencies on other stories/epics

## Out of Scope

- [item explicitly excluded from this story]

## Design / Mockups

- [link, if any]

## Related Stories

- Blocked by: [KEY]
- Related to: [KEY]

---

## Bunkai-specific field mapping

Custom fields this repo's methodology expects on a Story (`.agents/jira-required.yaml`):

| Field | Jira field name | Fallback if absent |
|---|---|---|
| `acceptance_criteria` | ✅ Acceptance Criteria (Gherkin) | Comment `## Acceptance Criteria` |
| `business_rules_specification` | 🚩Business Rules Specification | Comment `## Business Rules Specification` |
| `acceptance_test_results` | 🧪 Acceptance Test Results (ATR) | Comment `## Acceptance Test Results (ATR)` |

Workflow (`UPEX Feature (US) Workflow`): `Backlog → Estimation → Ready For Dev → In Progress → In Review → Shift-Left QA → Ready For QA → In Test → QA Approved → Ready For Release → Deployed to Production`, with `BLOCKED` and `ABORTED` side-states. Full diagram: `.context/PBI/README.md` §4.
