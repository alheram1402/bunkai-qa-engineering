# Format Reference — Test Plan (Story-scoped ATP)

> Canonical shape only. NOT a per-ticket authoring target — per-ticket ATP content is authored during `/sprint-testing` Stage 1 and written to the Story's `acceptance_test_plan.md` (synced field or fallback comment), or to a native Jira `Test Plan` work item on this project (Modality jira-native — Bunkai's Jira instance uses native `Test Plan`/`Test Execution`/`Precondition` issue types, not the Xray add-on).

## Header

| Field | Value |
|---|---|
| Story Key | [BK-XXX] |
| Title | [story title] |
| Sprint | [sprint name/number] |

## AC → TC Mapping

| AC | TC(s) | Notes |
|---|---|---|
| AC1 | TC-001, TC-002 | [1:N by default — see test-design-doctrine.md] |
| AC2 | TC-003 | |

## Scope

**In scope**: [list]
**Out of scope**: [list]

## Test Types

| Type | Required? | Reason |
|---|---|---|
| Functional | | |
| UI | | |
| API | | |
| Performance | | |
| Security | | |
| Accessibility | | |

## Test Environments

- Local / Staging / Prod-smoke — pick per risk, see `.agents/project.yaml` `testing.default_env` (currently `staging`).

## Test Data Requirements

- [test accounts needed — map to `.env` keys; this project currently lacks role-suffixed test users (`LOCAL_VIEWER_EMAIL` etc.), flagged in `.context/PRD/user-personas.md` Discovery Gaps]

## Test Cases

| ID | Priority | Type | AC Ref | Automatable? |
|---|---|---|---|---|
| TC-001 | P0/P1/P2 | Functional/EP/BVA/... | AC1 | Yes/No |

## Edge Cases & Negative Tests

- [derived per test-design-doctrine.md technique triggers: EP always, BVA on ranges, State-Transition on status fields, Decision Table on 2+ conditions, Pairwise on 3+ factors]

## Dependencies / Blockers / Risks

- [list]

## Execution Checklist + Sign-off

- [ ] All P0/P1 TCs executed
- [ ] Defects filed for failures (per defect-management-doctrine.md)
- [ ] ATR written back to Story
- [ ] QA sign-off

---

## Bunkai-specific notes

- Bug/Defect status transitions relevant to run-linked test failures are **forward-only, one rank at a time** (`open → in_progress → resolved → closed` for the generic Bug lifecycle; `Open → In Progress → In Review → Ready For QA → Closed` for this project's native Defect workflow) — confirmed enforced at two independent layers (RPC + trigger) per `.context/SRS/functional-specs.md` FR-009. Negative-path tests attempting to skip a stage or move backward should expect rejection (`45310`/`45311`), not silent acceptance.
- `Test` issue type in this Jira instance carries its own automation-status workflow (`Draft/Candidate → In Design → In Automation → Pull Request → In Review → READY/MANUAL/AUTOMATED → DEPRECATED`) — separate from the Story workflow. Full catalog: `.context/PBI/README.md` §4.
