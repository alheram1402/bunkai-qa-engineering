# ACCEPTANCE TEST PLAN (ATP): [ATP] BK-38 — TMS-Run Reporting | Filter project runs with pass/fail totals

**Jira Key:** [BK-318](https://jira.upexgalaxy.com/browse/BK-318)
**Status:** Listo
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

ATP for [https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38](https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38): TMS-Run Reporting | Filter project runs with pass/fail totals

1. 

| ATC ID  | Type  | Scenario  | Coverage Target  | Priority  | Automation  |
| --- | --- | --- | --- | --- | --- |
| BK-38-ATC-01  | Happy  | View all project Runs with row details and totals  | Project report baseline  | High  | UI/API/DB  |
| BK-38-ATC-02  | Integration  | Combined filters narrow rows and recompute totals  | Filter contract  | High  | UI/API/DB  |
| BK-38-ATC-03  | Negative  | Empty filter result shows zero rows and zero totals  | Empty state and stale totals  | High  | UI/API  |
| BK-38-ATC-04  | Boundary  | started_at date range includes start/end dates and excludes outside dates  | Date semantics  | Medium  | API/DB  |
| BK-38-ATC-05  | Happy  | Clear filters restores full list and totals  | Reset behavior  | Medium  | UI/API  |
| BK-38-ATC-06  | Negative  | Project with no Runs shows first-use empty state  | No-runs state  | Medium  | UI  |
| BK-38-ATC-07  | Security  | Cross-project Runs are excluded from rows and totals  | Data isolation  | High  | API/DB  |
| BK-38-ATC-08  | Performance  | Large Run set returns paginated/performant report  | Scalability  | Low  | API/DB  |

1. 

- Reporting scope is one Project
- Rows and totals are calculated from the same filtered query
- Date range filters Run started_at inclusively; timestamps stored in UTC, interpreted from Project timezone
- Pass/fail totals count only final passed and failed Runs
- running, blocked, skipped, aborted Runs may appear in rows/status filters but excluded from pass/fail totals
- Each Run stores a module_id snapshot at creation time for reporting
- Executor type enum is human, agent, ci
- No-runs and no-matches empty states both show pass total 0 and fail total 0
- Report reads enforce Project/workspace access boundaries

1. 

1. 

---

## Related Issues

- is tested by: [BK-38](https://jira.upexgalaxy.com/browse/BK-38) - TMS-Run Reporting | Filter project runs with pass/fail totals
- is designed by: [BK-320](https://jira.upexgalaxy.com/browse/BK-320) - BK-38: TC01: should view all project Runs with row details and totals given authenticated workspace member
- is designed by: [BK-321](https://jira.upexgalaxy.com/browse/BK-321) - BK-38: TC02: should narrow Run list and recompute totals when combined filters applied
- is designed by: [BK-322](https://jira.upexgalaxy.com/browse/BK-322) - BK-38: TC03: should show zero rows and zero totals when empty filter result
- is designed by: [BK-323](https://jira.upexgalaxy.com/browse/BK-323) - BK-38: TC04: should include start and end dates in started_at date range boundaries
- is designed by: [BK-324](https://jira.upexgalaxy.com/browse/BK-324) - BK-38: TC05: should restore full list and totals when filters cleared
- is designed by: [BK-325](https://jira.upexgalaxy.com/browse/BK-325) - BK-38: TC06: should show first-use empty state when project has no Runs
- is designed by: [BK-326](https://jira.upexgalaxy.com/browse/BK-326) - BK-38: TC07: should exclude cross-project Runs from rows and totals
- is designed by: [BK-327](https://jira.upexgalaxy.com/browse/BK-327) - BK-38: TC08: should return paginated performant report for large Run set

---

## Metadata

- **Created:** 8/8/2026
- **Updated:** 8/8/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Plan [BK-318](https://jira.upexgalaxy.com/browse/BK-318) description · ATP · synced by sync-jira-issues_
