# ACCEPTANCE TEST RESULTS (ATR): [ATR] BK-42 — TMS-Defect Heatmap | View count and week-over-week trend per module

**Jira Key:** [BK-350](https://jira.upexgalaxy.com/browse/BK-350)
**Status:** Close
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

# [ATR] BK-42 - TMS-Defect Heatmap | View count and week-over-week trend per module

Test Execution - Defect Heatmap, full ATP set (ATP-1..20). Environment: staging (staging-upexbunkai.vercel.app). Executed via API/DB/code trifuerza on 2026-08-11. Result: 20/20 PASSED.

| TC | ATP | Result | Evidence layer |
| --- | --- | --- | --- |
| BK-351 | ATP-1 Default 30d count | PASSED | API 200 + DB 9 (3+6) |
| BK-352 | ATP-2 Window switch 7d/30d/90d | PASSED | API 200 windows match DB counts |
| BK-353 | ATP-3 Archived subtrees excluded | PASSED | DB e207917d archived modules absent |
| BK-354 | ATP-4 UTC start boundary | PASSED | RPC [start,end) half-open verified |
| BK-355 | ATP-5 End boundary now excluded | PASSED | RPC boundary verified |
| BK-356 | ATP-6 Rising trend + pct | PASSED | API rising delta 3/6; unit tests |
| BK-357 | ATP-7 Falling trend + negative pct | PASSED | Unit tests computeDefectTrend |
| BK-358 | ATP-8 Prev 0 / curr>0 rising pct null | PASSED | API pct null (zero baseline) + unit |
| BK-359 | ATP-9 0/0 flat pct 0 | PASSED | Unit tests no Infinity/NaN |
| BK-360 | ATP-10 Curr 0 / prev>0 falling -100 | PASSED | Unit tests |
| BK-361 | ATP-11 Parent rollup path-prefix | PASSED | DB qa-bk41-l1 77 incl descendants |
| BK-362 | ATP-12 Child keeps own cell | PASSED | DB qa-bk41-l2 own cell verified |
| BK-363 | ATP-13 Hotspot not color-only | PASSED | Frontend count+tag+legend+a11y |
| BK-364 | ATP-14 Trend word+delta+icon | PASSED | Frontend render verified |
| BK-365 | ATP-15 module*path disambiguation | PASSED | API full module*path returned |
| BK-366 | ATP-16 Freshness live RPC | PASSED | API generated_at=now() beats 5s |
| BK-367 | ATP-17 generated*at rendered | PASSED | API generated*at + frontend stamp |
| BK-368 | ATP-18 Unauthenticated 401 | PASSED | API no token 401 |
| BK-369 | ATP-19 Unauthorized identical 404 | PASSED | API e207917d 404 not_found |
| BK-370 | ATP-20 Unsupported window 400 | PASSED | API 365d 400 bad_request |

Evidence: per-layer trifuerza results attached to each test run (evidence/trifuerza-bk42-results.md). 20/20 PASSED. No defects.

---

## Related Issues

- is tested by: [BK-42](https://jira.upexgalaxy.com/browse/BK-42) - TMS-Defect Heatmap | View count and week-over-week trend per module
- is executed by: [BK-351](https://jira.upexgalaxy.com/browse/BK-351) - BK-42: TC01: Default heatmap returns active module cells
- is executed by: [BK-352](https://jira.upexgalaxy.com/browse/BK-352) - BK-42: TC02: Selected-window counts update for 7d/30d/90d
- is executed by: [BK-353](https://jira.upexgalaxy.com/browse/BK-353) - BK-42: TC03: Archived modules hidden by default
- is executed by: [BK-354](https://jira.upexgalaxy.com/browse/BK-354) - BK-42: TC04: UTC start boundary included
- is executed by: [BK-355](https://jira.upexgalaxy.com/browse/BK-355) - BK-42: TC05: UTC end boundary excluded
- is executed by: [BK-356](https://jira.upexgalaxy.com/browse/BK-356) - BK-42: TC06: Rising trend
- is executed by: [BK-357](https://jira.upexgalaxy.com/browse/BK-357) - BK-42: TC07: Falling trend
- is executed by: [BK-358](https://jira.upexgalaxy.com/browse/BK-358) - BK-42: TC08: Previous zero current positive
- is executed by: [BK-359](https://jira.upexgalaxy.com/browse/BK-359) - BK-42: TC09: Both weeks zero
- is executed by: [BK-360](https://jira.upexgalaxy.com/browse/BK-360) - BK-42: TC10: Current zero previous positive
- is executed by: [BK-361](https://jira.upexgalaxy.com/browse/BK-361) - BK-42: TC11: Parent rollup includes descendants
- is executed by: [BK-362](https://jira.upexgalaxy.com/browse/BK-362) - BK-42: TC12: Child cell still visible
- is executed by: [BK-363](https://jira.upexgalaxy.com/browse/BK-363) - BK-42: TC13: Hotspot is not color-only
- is executed by: [BK-364](https://jira.upexgalaxy.com/browse/BK-364) - BK-42: TC14: Trend cue accessible
- is executed by: [BK-365](https://jira.upexgalaxy.com/browse/BK-365) - BK-42: TC15: Duplicate names disambiguated by path
- is executed by: [BK-366](https://jira.upexgalaxy.com/browse/BK-366) - BK-42: TC16: New defect updates heatmap count
- is executed by: [BK-367](https://jira.upexgalaxy.com/browse/BK-367) - BK-42: TC17: Freshness metadata updates
- is executed by: [BK-368](https://jira.upexgalaxy.com/browse/BK-368) - BK-42: TC18: Unauthenticated heatmap request
- is executed by: [BK-369](https://jira.upexgalaxy.com/browse/BK-369) - BK-42: TC19: Cross-project unauthorized request
- is executed by: [BK-370](https://jira.upexgalaxy.com/browse/BK-370) - BK-42: TC20: Unsupported window rejected

---

## Metadata

- **Created:** 8/10/2026
- **Updated:** 8/11/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Execution [BK-350](https://jira.upexgalaxy.com/browse/BK-350) description · ATR · synced by sync-jira-issues_
