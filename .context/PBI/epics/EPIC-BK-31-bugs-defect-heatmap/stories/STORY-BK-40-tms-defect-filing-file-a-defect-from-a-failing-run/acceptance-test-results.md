# ACCEPTANCE TEST RESULTS (ATR): [ATR] BK-40 — TMS-Defect Filing | File a defect from a failing run step

**Jira Key:** [BK-348](https://jira.upexgalaxy.com/browse/BK-348)
**Status:** Close
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

BK-40 TEST RESULTS

> ***SUCCESS:**** ****Result: PASSED (9/9)*** — all acceptance test cases verified on staging. No product defects found.

## Summary

| Field | Value |  |
| --- | --- |
| Tested | 2026-08-10 |  |
| Environment | Staging |  |
| Tester | bunkai-staging-user@xenievzoau.resend.app |  |
| Result | status:green | PASSED (9/9) |

***Scope under test:*** TMS bug/defect filing — run-linked "Report defect" action on failed run steps with prefilled module/steps/ATC/evidence, standalone defect filing, title 5-200 validation, required current-project module, P1-P4 severity, 10-evidence cap, open-state visibility, and TMS-native (no Jira sync) behavior. UI executed on staging; API contract previously verified live in preflight; DB cross-validated.

***Overall outcome:*** All 9 ATP scenarios PASS at the UI layer (API + DB layers cross-confirmed earlier). Story is ready for sign-off.

## Test Cases

|  | Test | Scenario | Status |
| --- | --- | --- |
| [BK-338: ATP-P1](https://jira.upexgalaxy.com/browse/BK-338) | Report bug action on failed step; dialog prefill | status:green | PASS |
| [BK-339: ATP-P2](https://jira.upexgalaxy.com/browse/BK-339) | Run-linked defect filed (ff31c7e1) | status:green | PASS |
| [BK-340: ATP-P3](https://jira.upexgalaxy.com/browse/BK-340) | Standalone defect filed (ebe7edd5) | status:green | PASS |
| [BK-341: ATP-N1](https://jira.upexgalaxy.com/browse/BK-341) | Non-failed step hides action + API 422 | status:green | PASS |
| [BK-342: ATP-N2](https://jira.upexgalaxy.com/browse/BK-342) | Title 4< chars blocked; 5-char valid | status:green | PASS |
| [BK-343: ATP-N3](https://jira.upexgalaxy.com/browse/BK-343) | Missing module -> "Select a module." | status:green | PASS |
| [BK-344: ATP-N4](https://jira.upexgalaxy.com/browse/BK-344) | UI exposes only P1-P4 | status:green | PASS |
| [BK-345: ATP-B1](https://jira.upexgalaxy.com/browse/BK-345) | 10/10 evidence cap | status:green | PASS |
| [BK-346: ATP-I1](https://jira.upexgalaxy.com/browse/BK-346) | TMS-native defect, no Jira sync | status:green | PASS |

***Result: 9/9 PASSED — 100% pass rate.***

## Test Data

- User: bunkai-staging-user@xenievzoau.resend.app (PAT-auth for API; UI session)
- Workspace: BK-34 Sprint QA; Project: BK-34 QA Seed
- Run-linked preconditions: run `866e6f5c` (running) with failed step `30fd6410`
- Defects created this run (test data, queued for cleanup): ff31c7e1-0397-46bb-ae07-8fb1785f5e11, ebe7edd5-f1f6-4ff1-b06f-f56c4bb08f55, ea659874-f43b-4b1c-9463-fcc128d763c0

## Bugs Found

- None. 9 bugs present in staging are TEST-SEED data (6 pre-existing + 3 created this run) and require cleanup via elevated DB access — not product defects.

## Observations

- [NEW] Failed step 01 badge displays "Unrun" while Fail is pressed (home shows "1 failed") — cosmetic UI quirk, out of AC scope, recorded only.
- [NEW] ATP-B1 gate UX: evidence add input removed at 10/10 rather than showing an inline error — acceptable given API maxItems backstop.
- OQ-1 resolved: Jira workflow status (Ready For QA → In Test) is authoritative; the stale "READY FOR DEV" came from an outdated impl-plan metadata snapshot (2026-06-17), superseded by shift-left status Ready For QA + live workflow.
- Cleanup: 9 test-seed bugs pending deletion (dbhub role lacks DELETE on public.bugs).

## Recommendations

- Automate the 9 ATP scenarios (KATA Api/Ui components) — high ROI, all API 422 backstops already confirmed.
- Clean up test-seed defect rows after Stage 3 with elevated DB access.
- Track the cosmetic failed-step "Unrun" badge quirk for a low-priority UI follow-up.

---

## Related Issues

- is tested by: [BK-40](https://jira.upexgalaxy.com/browse/BK-40) - TMS-Defect Filing | File a defect from a failing run step
- is executed by: [BK-338](https://jira.upexgalaxy.com/browse/BK-338) - BK-40: TC01: Open run-linked defect form (prefilled)
- is executed by: [BK-339](https://jira.upexgalaxy.com/browse/BK-339) - BK-40: TC02: Save valid run-linked defect
- is executed by: [BK-340](https://jira.upexgalaxy.com/browse/BK-340) - BK-40: TC03: Save standalone defect
- is executed by: [BK-341](https://jira.upexgalaxy.com/browse/BK-341) - BK-40: TC04: Non-failed step has no report action
- is executed by: [BK-342](https://jira.upexgalaxy.com/browse/BK-342) - BK-40: TC05: Reject invalid title length
- is executed by: [BK-343](https://jira.upexgalaxy.com/browse/BK-343) - BK-40: TC06: Reject missing/cross-project module
- is executed by: [BK-344](https://jira.upexgalaxy.com/browse/BK-344) - BK-40: TC07: Reject invalid severity
- is executed by: [BK-345](https://jira.upexgalaxy.com/browse/BK-345) - BK-40: TC08: Enforce evidence link limit
- is executed by: [BK-346](https://jira.upexgalaxy.com/browse/BK-346) - BK-40: TC09: Defect remains TMS-native without Jira sync

---

## Metadata

- **Created:** 8/10/2026
- **Updated:** 8/10/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Execution [BK-348](https://jira.upexgalaxy.com/browse/BK-348) description · ATR · synced by sync-jira-issues_
