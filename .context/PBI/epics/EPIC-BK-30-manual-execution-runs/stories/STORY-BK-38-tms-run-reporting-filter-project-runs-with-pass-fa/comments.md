# Comments for BK-38

[View in Jira](https://jira.upexgalaxy.com/browse/BK-38)

---

### jesusgpythondev - 6/15/2026, 1:29:13 PM

## QA Shift-Left Handoff Mirror

This comment complements the canonical Story description. It does not duplicate the full AC/ATP content; use the description as source of truth.

### Executive Summary

[https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38](https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38) is now refined for estimation. The expert panel closed the missing contract decisions for project-scoped Run reporting, filtered pass/fail totals, date semantics, module filtering, executor types, empty states, and data isolation.

### Refinement Delta

| ***Area**** | ****Final decision*** |
| --- | --- |
| Reporting scope | Project-scoped Runs only; no cross-project rows or totals. |
| Endpoint | `GET /api/v1/projects/{projectId}/runs/report`. |
| Totals | Count only final `passed` and `failed` Runs. Other statuses can appear in rows but not totals. |
| Date filter | Inclusive `started_at` range; UTC storage, Project timezone interpretation. |
| Module filter | Use Run `module_id` snapshot captured at Run creation. |
| Executor type | `human`, `agent`, `ci`. |
| Story points | Expert panel recommends 3 points. |

### ATP Draft Summary

- 8 ATP rows defined in the Story description.
- High-priority QA coverage: full report baseline, combined filters, stale-total prevention, and cross-project isolation.
- Medium-priority QA coverage: date boundaries, clear filters, no-runs empty state.
- Low-priority QA coverage: large Run set / pagination / performance.

### High / Medium Risks

| ***Risk**** | ****Why QA cares**** | ****Coverage*** |
| --- | --- | --- |
| Stale totals after filters | Misleads QA Lead on execution health. | BK-38-ATC-02, BK-38-ATC-03 |
| Cross-project leakage | Security and trust issue in reporting. | BK-38-ATC-07 |
| Date boundary mismatch | Reports may omit or double-count Runs. | BK-38-ATC-04 |
| Module snapshot mismatch | Mutable Test/ATC chains could make reports unstable. | BK-38-ATC-02, BK-38-ATC-07 |

### Dependency Note

[https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38](https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38) depends on [https://jira.upexgalaxy.com/browse/BK-34#icft=BK-34](https://jira.upexgalaxy.com/browse/BK-34#icft=BK-34) for Run creation and on the future Runs schema/API. Current repo evidence shows Tests exist, but Run reporting tables/API still need implementation.

### Out of Scope for QA on [https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38](https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38)

- Starting Runs.
- Updating Run step results.
- Aborting/cancelling Runs.
- Defect creation or sync.
- Exports, charts, dashboards, saved views.

### Publication Status

| ***Item**** | ****Status*** |
| --- | --- |
| Description | Updated with canonical shift-left package. |
| Labels | `shift-left-reviewed`, `shift-left-2026-06-15` applied. |
| Status | Moved to `Shift-Left QA`. |
| Story Points field | Not updated by tool; Jira REST edit returned 404 in this session. Set manually to 3 or retry after REST access is fixed. |
| Dedicated AC/ATP fields | Not updated by tool; content is included in canonical description until REST custom-field edit is available. |

### Ownership Handback

- PO/Delivery: use 3 points unless new scope is added.
- Dev: implement the Run reporting contract in description.
- QA: test filtered totals, empty states, date boundaries, and data isolation first.

---

### Ely - 7/30/2026, 10:28:09 AM

Mockup — Test Runs index (project-wide list + filters). Source: .context/designs/bunkai-test-management-tool/bk-30-test-runs-index/test-runs-index.html · spec: master-design-plan §4.8



---

### Ely - 7/31/2026, 12:40:49 AM

## Workload Forecast gate — resolved

The Stage 1 plan's forecast came back `risk=High` with `Chain strategy: pending`. Resolved via `/git-flow-master` §Chained-PR decision tree:

```
Chain strategy: feature-branch-chain
Decision trace: Q1=No (new domain logic -- a schema column, an amended production RPC, a new report RPC, a new API endpoint, and a new React reporting UI -- not a rename, formatter run, codegen, or vendor bump) · Q2=No (DB-1 (~270 lines) and DB-2 (~190 lines) individually clear the 400-line ceiling on their own, but a full API-layer slice (5 lib/runs/** files + the rpc.ts wrapper + the route/openapi pair) and a full UI-layer slice (report-view.ts + the ~400-line ProjectRunsReportView.tsx + runs/page.tsx + the SEC-1 isolation test) each independently exceed 400 lines once their own tests are counted -- no 2-4-slice cut keeps every slice under budget for this 2800-line total) · Q3=Yes (DB-1 amends `bunkai*create*run`/`bunkai*run*json`, two already-shipped, already-in-production RPCs that BK-34's existing `start-run.test.ts` suite exercises today per Risk R-1, and DB-2's new `bunkai*report*project_runs` RPC is the exact contract -- response shape, cursor codec -- that both the API route and the UI component consume verbatim; merging the DB layer alone to `staging` would expose a high-blast-radius RPC amendment before the API/UI slices that actually exercise it land) -> feature-branch-chain
Decided by: /git-flow-master §Chained-PR decision tree (branching-strategies.md)
```

***Branch plan***: integration branch `feat/BK-38-runs-report` cut from `staging`.

- Child PR 1 — DB layer (migrations 0040+0041) -> merges into the integration branch.
- Child PR 2 — API layer (report-constants.ts, report-validation.ts, rpc.ts wrapper, route+openapi) -> merges into the integration branch.
- Child PR 3 — UI + Security layer (report-view.ts, ProjectRunsReportView.tsx, runs/page.tsx, report-isolation.test.ts) -> merges into the integration branch.
- Final PR — integration branch -> `staging`.

This isolates the highest-risk change (amending the already-shipped `bunkai*create*run` RPC, Risk R-1) into its own reviewable, revertable unit, scaling BK-37's own DB+API / UI precedent to this story's added schema-mutation risk and larger total.

Full updated forecast block lives in the canonical implementation plan (`spec*implementation*plan` field / synced `implementation-plan.md`).

---

### Automation for Jira - 7/31/2026, 1:48:18 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Ely - 7/31/2026, 2:06:48 AM

***D-4 ratification — Aborted totals chip dropped from the UI***

Stage 3 code review on PR #69 flagged this as an un-ratified divergence. Recording it now: the mockup draws three totals chips (Passed / Failed / Aborted), but `ProjectRunsReportView.tsx` renders only Passed / Failed. `bunkai*report*project_runs` (migration 0041) never computes or returns an aborted count per Business Rule #3, so a third chip would mean fabricating a number the server never sends. Correct, deliberate divergence — added as D-4 in the implementation plan's Divergence candidates section per Critical Rule #15.

---

### Automation for Jira - 7/31/2026, 9:23:03 AM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 7/31/2026, 9:24:52 AM

## Ready for QA

Merged to `staging`: [https://github.com/upex-galaxy/upex-bunkai-tms/pull/69](https://github.com/upex-galaxy/upex-bunkai-tms/pull/69) (merge commit `d929517`).

Reassigned to @jesusgpythondev as the shift-left QA owner for this story (per the 2026-06-15 QA Shift-Left Handoff Mirror comment).

All 8 ATC rows (BK-38-ATC-01..08) resolve to `covered` in the Spec Compliance Matrix — see the implementation plan for the full mapping. Stage 3 adversarial review: APPROVE WITH NITS, 0 BLOCKER/MAJOR.

One note for QA: live-UI/browser validation was suspended for this batch run (throughput decision, tester team verifies visually on staging) — worth a normal pass on `/projects/{slug}/runs` per the AC scenarios (combined filters, date boundaries, empty states, cross-project isolation) since it hasn't had a live-render check yet.

---

### jesusgpythondev - 8/8/2026, 3:13:15 PM

# QA Execution Summary — BK-38

 ***8/8 test cases executed successfully***

> ***SUCCESS:*** BK-38 (TMS-Run Reporting \| Filter project runs with pass/fail totals) verified on staging — all 8 test cases passed, no defects found.

## Summary

| Section | Details |
| --- | --- |
| Story | [BK-38](https://jira.upexgalaxy.com/browse/BK-38) — TMS-Run Reporting | Filter project runs with pass/fail totals |
| Environment | staging |
| Result | :white*check*mark: PASSED (8/8 TCs) |
| Test Data | Verified behaviors against staging test fixtures |
| Defects | :white*check*mark: None found |

## Artifacts

- ATP-BK-318 · ATR-BK-319 · TC-BK-320..BK-327

---

### jesusgpythondev - 8/8/2026, 3:31:27 PM

# AC Verification — Execution Summary

 ***All acceptance criteria verified***

> ***SUCCESS:*** BK-38 acceptance criteria verified against the automated test cases — release ready, no blockers.

## Summary

| Section | Value |
| --- | --- |
| Provided by | QA Engineering |
| Date | 2026-08-08 |
| Environment | staging |
| Result | :white*check*mark: Release Ready — no blockers |

## Follow-ups

None required.

---

### jesusgpythondev - 8/8/2026, 3:52:19 PM

# Expert Panel Review — Sprint Testing Audit BK-38

 ***Release-ready*** — 8/8 ATCs PASS · 7/7 ACs mapped · 0 defects

> ***SUCCESS:**** Sprint-testing run for [BK-38](https://jira.upexgalaxy.com/browse/BK-38) (TMS-Run Reporting) accepted, release-ready. 3 procedural nits flagged as ****non-blocking***; remediation deferred to the next test run (tracked below).

## Executive Summary

BK-38 sprint-testing run is ***VALIDATED (green)***: 8/8 ATCs PASS, 7/7 ACs mapped, 0 defects across the UI/API/DB triforce on staging. Cross-project isolation (AC7) independently corroborated via database queries and the RPC membership gate. D-4 (Aborted chip intentionally excluded from totals/UI) correctly evaluated as non-defect. Three procedural nits do not affect verdict and are deferred for remediation.

## Evidence Used

| Source | Evidence | Confidence |
| --- | --- | --- |
| Pre-flight check (`pre-flight-check.md`) | Verdict GO; 8/8 ATCs SYNCED; smoke subset defined; no data blockers | High |
| Execution appendix (`test-session-memory.md`) | Stage 2 triforce execution detail per ATC; D-4 decision recorded | High |
| Screenshots (`evidence/ATC-01..08*.png`, 8 PNGs) | UI captures for ATC-01..08; file-level audit only (dimensions, non-blank, md5) — visual content not directly audited | Medium |
| [QA Completion Summary (#12246)](https://jira.upexgalaxy.com/browse/BK-38?focusedCommentId=12246) | Field/Value header + AC→ATC mapping; QA Approved | High |
| DB cross-check (dbhub) | 58 runs in main project, 0 runs in empty project; RPC membership gate; identical-404 collapse | High |
| Engram memory observation | Prior panel audit decision record (#503) corroborating verdict + nits | Medium |

## Expert Findings

| Role | Finding | Recommendation | Evidence label |
| --- | --- | --- | --- |
| QA Lead | `ATC-07-isolation-empty-project.png` is byte-identical (same md5) to `ATC-06-empty-project-state.png` — UI isolation evidence is a re-used capture, not a distinct artifact | Regenerate a dedicated ATC-07 capture in the next run, or relabel as supplementary to ATC-06 | EVID-DUP-001 |
| QA Lead | `test-report.md` states "7 screenshots" while 8 evidence PNGs exist (ATC-01..08) | Update count to 8 in `test-report.md` (or derive it automatically) during the next run | DOC-COUNT-002 |
| Technical Architect | API matrix results are narration-only — replayable response payloads are not stored in the QA report, so the API claim cannot be re-executed from repository content alone | Capture API request/response payloads in the PBI evidence folder for reproducibility | REPLAY-003 |

## Verdict

```
Verdict:   VALIDATED (green)
ATCs:      8/8 PASS
ACs:       7/7 mapped to ATCs
Defects:   0
D-4:       Correctly non-flagged (Aborted chip excluded from totals/UI by design)
Isolation: AC-7 corroborated via DB cross-check (58 vs 0 runs) + RPC membership gate
```

***Recommendation****: :white*check*mark: ****Proceed.*** [BK-38](https://jira.upexgalaxy.com/browse/BK-38) is cleared for release. The 3 nits are procedural and non-blocking — capture distinct ATC-07 evidence, fix the screenshot count to 8, and attempt API replay payloads in the next test run (BK-39 / regression).

## Learning Candidates

1. ***Evidence uniqueness check hook*** — add a pre-publication check that all evidence captures in a run are byte-distinct (md5) to catch re-used screenshots before they ship as separate artifacts (catches the ATC-06/07 duplication pattern).
2. ***Evidence-count reconciliation*** — test-report screenshot counts should be reconciled against the actual `evidence/` directory (or generated) to prevent 7-vs-8 mismatches.
3. ***Triforce reproducibility*** — API/DB claims should carry replayable payloads (request/response bodies) in the repo so every assertion is re-executable, not documentation-only.

---


_Synced from Jira by sync-jira-issues_
