# ACCEPTANCE TEST RESULTS (ATR): [ATR] BK-38 — TMS-Run Reporting | Filter project runs with pass/fail totals

**Jira Key:** [BK-319](https://jira.upexgalaxy.com/browse/BK-319)
**Status:** Close
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

# BK-38 ATR — Test Results

 ***8/8 Test Cases*** — tested 2026-08-08 · environment `staging`

> ***SUCCESS:**** Executed the full ATP (8 ATCs) for ****TMS-Run Reporting \| Filter project runs with pass/fail totals**** on staging via ****UI + API + DB*** triforce. All acceptance criteria verified against the expected contract; no defects found.

## Summary

| Field | Value |
| --- | --- |
| Tested | 2026-08-08 |
| Environment | staging |
| Tester | jesusgpythondev@gmail.com |
| Result | :white*check*mark: PASSED (8/8) |

## Test Cases

| # | Test Case | Result |
| --- | --- | --- |
| [BK-320](https://jira.upexgalaxy.com/browse/BK-320) | ATC-01 Happy baseline (nullable totals, 58 runs) | :white*check*mark: PASSED |
| [BK-321](https://jira.upexgalaxy.com/browse/BK-321) | ATC-02 Filter contract (status + module combined recompute) | :white*check*mark: PASSED |
| [BK-322](https://jira.upexgalaxy.com/browse/BK-322) | ATC-03 Empty state (0 rows / 0 totals, no stale) | :white*check*mark: PASSED |
| [BK-323](https://jira.upexgalaxy.com/browse/BK-323) | ATC-04 Date boundary inclusive (single day includes all) | :white*check*mark: PASSED |
| [BK-324](https://jira.upexgalaxy.com/browse/BK-324) | ATC-05 Clear filters resets to full list + totals | :white*check*mark: PASSED |
| [BK-325](https://jira.upexgalaxy.com/browse/BK-325) | ATC-06 No-runs project empty state (0/0) | :white*check*mark: PASSED |
| [BK-326](https://jira.upexgalaxy.com/browse/BK-326) | ATC-07 Cross-project isolation (0 leakage rows/totals) | :white*check*mark: PASSED |
| [BK-327](https://jira.upexgalaxy.com/browse/BK-327) | ATC-08 Scalability (58 runs, pagination stable) | :white*check*mark: PASSED |

## Test Data

| Entity | Name | ID |
| --- | --- | --- |
| Project | `bk-38-final-report-project` | `9611b8f3-1eb8-427f-b585-b5d265668b0c` |
| Workspace | — | `988e342e-28a7-49d1-b254-4cd44226ad71` |
| Isolation project | `bk-38-atc06-empty` | `fc8212d5-5382-4499-bcb3-7c0338a2b3dc` |

## Bugs Found

:white*check*mark: None

## Observations

- Seeded 2026-08-08: 58 runs (`running=53`, `passed=2`, `failed=2`, `aborted=1`; `Test A=30`, `Test B=28`).
- Status filter is multi-select; OR state combination within a key, AND state combination across keys; totals computed from `passed` / `failed`.
- `started_at` date filter is inclusive (a single day includes all that day's runs).
- Isolation project holds the same 2 tests with 0 runs; no cross-project data leaks (rows/totals).

## Recommendations

ATC-01..08 are strong automation candidates (Run Reporting / filter contract) for the Stage 4 ROI queue. Staging-only seeded data; keep the isolation structure in place.

---

## Related Issues

- is tested by: [BK-38](https://jira.upexgalaxy.com/browse/BK-38) - TMS-Run Reporting | Filter project runs with pass/fail totals
- is executed by: [BK-320](https://jira.upexgalaxy.com/browse/BK-320) - BK-38: TC01: should view all project Runs with row details and totals given authenticated workspace member
- is executed by: [BK-321](https://jira.upexgalaxy.com/browse/BK-321) - BK-38: TC02: should narrow Run list and recompute totals when combined filters applied
- is executed by: [BK-322](https://jira.upexgalaxy.com/browse/BK-322) - BK-38: TC03: should show zero rows and zero totals when empty filter result
- is executed by: [BK-323](https://jira.upexgalaxy.com/browse/BK-323) - BK-38: TC04: should include start and end dates in started_at date range boundaries
- is executed by: [BK-324](https://jira.upexgalaxy.com/browse/BK-324) - BK-38: TC05: should restore full list and totals when filters cleared
- is executed by: [BK-325](https://jira.upexgalaxy.com/browse/BK-325) - BK-38: TC06: should show first-use empty state when project has no Runs
- is executed by: [BK-326](https://jira.upexgalaxy.com/browse/BK-326) - BK-38: TC07: should exclude cross-project Runs from rows and totals
- is executed by: [BK-327](https://jira.upexgalaxy.com/browse/BK-327) - BK-38: TC08: should return paginated performant report for large Run set

---

## Metadata

- **Created:** 8/8/2026
- **Updated:** 8/8/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Execution [BK-319](https://jira.upexgalaxy.com/browse/BK-319) description · ATR · synced by sync-jira-issues_
