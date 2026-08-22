# ACCEPTANCE TEST PLAN (ATP): ATP: BK-202: TMS-Test Plan | Create a test plan grouping tests for a goal

**Jira Key:** [BK-573](https://jira.upexgalaxy.com/browse/BK-573)
**Status:** Planificación
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

## Acceptance Test Plan (ATP) — BK-202

Story: TMS-Test Plan | Create a test plan grouping tests for a goal
Env: staging | Modality: jira-xray | Format: Cucumber (Gherkin)

Ratified business rules (short form): name 1-100 chars inclusive, whitespace-collapsed
then trimmed on POSIX `\s` classes only (tab/newline/etc — NOT U+00A0); description max
500 chars; goal max 100 chars; uniqueness scoped per project via DB-level unique index
`(project_id, lower(name))`; no per-project plan count cap; edit allowed to any member
role or higher (not creator-restricted); no Delete ever (Close is the sole exit from
Open); server-side role gate re-checked live on every write via `bunkai*can*write_workspace`.

| # | Test | Scenario(s) covered |
| --- | --- | --- |
| 1 | Should create a test plan with name, description, and goal | 1.1 |
| 2 | Should create a minimal test plan with name only | 1.2 |
| 3 | Should validate a test plan name at the 100-character boundary | 1.3, 1.4 |
| 4 | Should accept a test plan name that trims to exactly 1 character | 1.5 |
| 5 | Should reject a duplicate plan name differing only by case | 2.1 |
| 6 | Should reject a duplicate name padded with leading/trailing spaces | 2.2 |
| 7 | Should allow the same plan name to be reused in a different project | 2.3 |
| 8 | Should apply the tab-vs-non-breaking-space distinction to duplicate detection | 2.4 |
| 9 | Should reject a plan rename that collides with another existing plan's name | 2.5 |
| 10 | Should reject one of two concurrent create requests for the same plan name | 2.6 |
| 11 | Should reject a blank test plan name | 3.1, 3.2, 3.3 |
| 12 | Should hide the create-plan option from a viewer-role user | 4.1 |
| 13 | Should reject a direct API create-plan request from a viewer-role user | 4.2 |
| 14 | Should allow a member-role user to edit an existing plan they did not create | 4.3 |
| 15 | Should reject a viewer's inline-edit attempt on an existing plan | 4.4 |
| 16 | Should re-verify role server-side even with a stale client-cached role | 4.5 |

19 AC scenarios formalized into 16 Xray Tests. Two collapses, both justified:

- Tests 3 and 11 each merge a Boundary/Negative pair or triple that shares one expected-behavior

  partition (100/101-char boundary; the three blank-name variants) into a single Scenario Outline.

- Test 8 is NOT a collapse — it formalizes Scenario 2.4 (originally one inferred outcome,

  "NEEDS PO/DEV CONFIRMATION") into a Scenario Outline with two data rows, because the ratified
  whitespace rule makes tab-padding and NBSP-padding produce DIFFERENT outcomes (tab is trimmed
  away -> duplicate rejected; U+00A0 is not trimmed -> distinct name, created successfully).

Real code anchors: `supabase/migrations/0073*test*plans.sql` (RPCs), `lib/test-plans/validation.ts`,
`lib/test-plans/errors.ts`, `app/api/v1/projects/[id]/test-plans/route.ts` (GET/POST),
`app/api/v1/test-plans/[id]/route.ts` (PATCH only), `app/(app)/projects/[projectSlug]/plans/page.tsx`.

---

## Related Issues

- tests: [BK-202](https://jira.upexgalaxy.com/browse/BK-202) - TMS-Test Plan | Create a test plan grouping tests for a goal
- designs: [BK-574](https://jira.upexgalaxy.com/browse/BK-574) - Should create a minimal test plan with name only
- designs: [BK-575](https://jira.upexgalaxy.com/browse/BK-575) - Should validate a test plan name at the 100-character boundary
- designs: [BK-576](https://jira.upexgalaxy.com/browse/BK-576) - Should accept a test plan name that trims to exactly 1 character
- designs: [BK-577](https://jira.upexgalaxy.com/browse/BK-577) - Should reject a duplicate plan name differing only by case
- designs: [BK-578](https://jira.upexgalaxy.com/browse/BK-578) - Should reject a duplicate name padded with leading/trailing spaces
- designs: [BK-579](https://jira.upexgalaxy.com/browse/BK-579) - Should allow the same plan name to be reused in a different project
- designs: [BK-580](https://jira.upexgalaxy.com/browse/BK-580) - Should apply the tab-vs-non-breaking-space distinction to duplicate detection
- designs: [BK-581](https://jira.upexgalaxy.com/browse/BK-581) - Should reject a plan rename that collides with another existing plan's name
- designs: [BK-582](https://jira.upexgalaxy.com/browse/BK-582) - Should reject one of two concurrent create requests for the same plan name
- designs: [BK-583](https://jira.upexgalaxy.com/browse/BK-583) - Should reject a blank test plan name
- designs: [BK-584](https://jira.upexgalaxy.com/browse/BK-584) - Should hide the create-plan option from a viewer-role user
- designs: [BK-585](https://jira.upexgalaxy.com/browse/BK-585) - Should reject a direct API create-plan request from a viewer-role user
- designs: [BK-586](https://jira.upexgalaxy.com/browse/BK-586) - Should allow a member-role user to edit an existing plan they did not create
- designs: [BK-587](https://jira.upexgalaxy.com/browse/BK-587) - Should reject a viewer's inline-edit attempt on an existing plan
- designs: [BK-588](https://jira.upexgalaxy.com/browse/BK-588) - Should re-verify role server-side even with a stale client-cached role
- designs: [BK-589](https://jira.upexgalaxy.com/browse/BK-589) - Should create a test plan with name, description, and goal

---

## Metadata

- **Created:** 8/20/2026
- **Updated:** 8/20/2026
- **Reporter:** Alfonso Hernandez
- **Assignee:** Unassigned

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Plan [BK-573](https://jira.upexgalaxy.com/browse/BK-573) description · ATP · synced by sync-jira-issues_
