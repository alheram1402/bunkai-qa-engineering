# Comments for BK-35

[View in Jira](https://jira.upexgalaxy.com/browse/BK-35)

---

### Benjamin Segovia - 6/8/2026, 8:35:12 PM

Shift-Left QA Refinement handoff comment — test from acli

---

### Benjamin Segovia - 6/8/2026, 8:35:39 PM

## Shift-Left QA Refinement — DRAFT ready for review

The ATP DRAFT content is in the comment body below. Story [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) has been refined pre-sprint.

***Risk level:*** HIGH
***Refined on:*** 2026-06-08

***Summary:***

- 8 gaps found (G1–G8)
- 7 ambiguities found (A1–A7)
- 23 test outlines drafted (10 Positive / 6 Negative / 3 Boundary / 4 Integration)
- 8 open questions for PO + Dev

***Blockers before Ready For Dev:***

- Q1 (PO): ATC verdict behavior when steps remain pending — state machine matrix is incomplete without this
- Q5 (Dev): Real-time transport mechanism + latency SLA — integration outlines cannot be written without this

***Story Points:*** Current estimate is SP=1. QA assessment: this story contains a state machine (8 step-combination scenarios), real-time sync, and race condition handling. Recommend re-estimating at SP=5 or higher.

***Note:*** Custom field updates (AC / ATP fields) and status transitions require elevated project permissions. The full refined content is captured in the shift-left-refinement.md file locally at `.context/PBI/epics/EPIC-BK-30-manual-execution-runs/stories/STORY-BK-35-tms-run-execution-mark-each-step-pass-fail-or-bloc/shift-left-refinement.md`.

Next step: when this story reaches **Ready For QA**, run /sprint-testing — it will short-circuit Phases 1-3 thanks to the shift-left refinement already completed.

---

### Benjamin Segovia - 6/8/2026, 8:48:15 PM

@@Ely hola! Estoy trabajando en el shift-left de [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) (TMS-Run Execution | Mark each step pass/fail/block). Hice el análisis de refinamiento pero mi cuenta (`benjasegoviafsa@gmail.com`) no tiene permisos para editar el ticket ni hacer transiciones en el proyecto BK.

¿Podés otorgarme `EDIT*ISSUES` y `TRANSITION*ISSUES` para poder subir el ATP DRAFT y mover [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) de Backlog a Shift-Left QA?

Gracias!

---

### Ely - 6/24/2026, 12:48:24 PM

Re-estimated 1 -> 5 SP per shift-left QA (state machine, real-time sync, race conditions). Provisional — still BLOCKED for Ready For Dev by 2 open questions: Q1 (PO) ATC verdict behavior when steps remain pending; Q5 (Dev) real-time transport mechanism + latency SLA.

---

### Benjamin Segovia - 7/13/2026, 5:54:15 AM

## PO Estimation Session — [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35)

Story Points updated from 5 to ***8*** (provisional), following up on the shift-left refinement from 2026-06-08.

### Resolved

- ***Q1 — ATC verdict while steps remain pending***: verdict stays `unrun` until every step in the ATC is resolved. Verdict (passed/failed/blocked) is only computed once the last pending step is marked.

### Still open

- ***Q5 (Dev)*** — real-time transport mechanism is unconfirmed. SP=8 assumes an existing real-time channel is reused. If [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) turns out to be the first real-time use case in the product, this should be re-estimated upward (likely 13).
- ***Q3 (cross-team, BK-39 owner)*** — whether reaching 100% progress auto-triggers the run finish, or stays manual. Not blocking this estimate; flagging for whoever picks up [https://jira.upexgalaxy.com/browse/BK-39#icft=BK-39](https://jira.upexgalaxy.com/browse/BK-39#icft=BK-39).

### Next step

Move to Ready For Dev once Dev confirms Q5. Re-estimate if the real-time answer changes the scope.

---

### Benjamin Segovia - 7/13/2026, 6:12:47 AM

> ***WARNING:**** ****Blocker — Q5 unresolved.**** This story stays in ****Estimation*** until Dev answers this. Story Points (8) are provisional and depend on the answer below.

## Q5 — Real-time transport mechanism

***Question:*** Does a real-time channel (Supabase Realtime, SSE, WebSocket) already exist in the product for another feature, or would [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) be the first real-time use case?

***Why it blocks Ready For Dev:***

- SP=8 assumes an ***existing*** channel gets reused for the "teammate watching the same Run sees updates live" requirement (DoD item 5 / AC4).
- If this is net-new infrastructure for the product, the story is closer to ***13 SP*** — a 5-point swing that would break sprint commitment if discovered mid-sprint instead of now.

***What we need from Dev:*** confirm whether a real-time transport already exists and is reusable, or flag this as a spike/infra dependency before [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) can move to Ready For Dev.

---

### Benjamin Segovia - 7/13/2026, 7:45:12 AM

> ***ERROR:**** ****Escalating — flagged as sprint bottleneck #1.*** Ely's latest sprint status report names [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) (along with [https://jira.upexgalaxy.com/browse/BK-37#icft=BK-37](https://jira.upexgalaxy.com/browse/BK-37#icft=BK-37), [https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38](https://jira.upexgalaxy.com/browse/BK-38#icft=BK-38), [https://jira.upexgalaxy.com/browse/BK-90#icft=BK-90](https://jira.upexgalaxy.com/browse/BK-90#icft=BK-90)) as stalled 28–45 days despite [https://jira.upexgalaxy.com/browse/BK-27#icft=BK-27](https://jira.upexgalaxy.com/browse/BK-27#icft=BK-27) and [https://jira.upexgalaxy.com/browse/BK-34#icft=BK-34](https://jira.upexgalaxy.com/browse/BK-34#icft=BK-34) being dev-done and ES3 already unblocked. This story is the one holding back visible sprint progress right now.

## Still blocked on the same open item

***Q5 — real-time transport mechanism*** is the only thing standing between this story and Ready For Dev. Story Points (8, provisional) already account for the "reuse an existing channel" scenario; if that assumption is wrong, this jumps to ~13.

***Ask:*** given this is now the sprint's top bottleneck per the status report, can Dev confirm Q5 this week so [https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35](https://jira.upexgalaxy.com/browse/BK-35#icft=BK-35) can move out of Estimation? Happy to jump on a quick sync if that unblocks it faster than async.

---

### Ely - 7/31/2026, 12:31:54 AM

## Q5 resolved — real-time transport = Supabase Realtime

***Decision**** (delegated to AI advisor by the product owner, 2026-07-31, explicit): use ****Supabase Realtime**** (Postgres Changes on `run*steps`/`runs`, scoped per `run*id`) for AC4's live verdict/progress push. Full reasoning, alternatives considered, and consequences recorded in ****ADR-0010*** (`.context/ADR/ADR-0010-realtime-transport-supabase-realtime.md`), status `Proposed` pending the usual human sign-off — does not block implementation starting now.

Why: this is a Supabase-backed stack with zero existing real-time usage. Supabase Realtime is the lowest-effort option that meets AC4 (no new vendor, reuses existing infra), and becomes the standing mechanism future stories ([https://jira.upexgalaxy.com/browse/BK-90#icft=BK-90](https://jira.upexgalaxy.com/browse/BK-90#icft=BK-90), [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209)) reuse instead of each reinventing their own transport.

Mechanics: enable Realtime replication on the relevant table(s) via migration, RLS-scoped subscription client-side. Reconnection/reconciliation-on-reconnect is called out explicitly in the ADR as a real implementation detail for Stage 1 planning, not to be assumed away.

***Not resolved here, non-blocking***: the SP re-estimate question (8 → possibly 13, per the 2026-06-08 shift-left note) and whether the 2026-07-28 Estimation → Ready For Dev transition was intentional. Neither blocks coding — flagging for whoever owns estimation to reconcile separately.

`queue.md` (`avalanche-2026-07`) updated — this ticket is unblocked, proceed with Stage 1 planning.

---

### Ely - 7/31/2026, 9:49:35 AM

## Workload Forecast gate — resolved

The Stage 1 plan's forecast came back `risk=High` (1791 lines) with `Chain strategy: pending`. Resolved via `/git-flow-master` §Chained-PR decision tree:

```
Chain strategy: feature-branch-chain
Decision trace: Q1=No (new domain logic) · Q2=No (DB migration + its own co-located test combine to ~440 lines, just over budget -- splitting a migration from the test that verifies it into separate chain slices would satisfy the line-count metric while violating this repo's own "tests stay with the behaviour they verify" convention for no real review-quality gain, so the natural DB slice stays together, over budget) · Q3=Yes (bunkai*mark*run_step is shared RPC scaffolding API/UI both consume; more significantly, realtime-run-channel.ts is the FIRST real-time primitive in this codebase per ADR-0010 -- no existing pattern to validate against, so partial merges would expose an unvalidated new primitive before the slice that exercises it lands) -> feature-branch-chain
Decided by: /git-flow-master §Chained-PR decision tree (branching-strategies.md)
```

***Branch plan***: integration branch `feat/BK-35-mark-run-step` cut from `staging`.

- Child 1 – DB layer (migrations 0042+0043, mark-step.test.ts) -> merges into the integration branch.
- Child 2 – API layer (route pair + validation/errors/rpc touches) -> merges into the integration branch.
- Child 3 – Realtime layer (realtime-run-channel.ts + test) -> merges into the integration branch.
- Child 4 – UI layer (RunnerView.tsx wiring, the dominant cost driver) -> merges into the integration branch.
- Final PR – integration branch -> `staging`.

Mirrors BK-38's own DB -> API -> UI chain shape, with Realtime inserted as its own slice given it's genuinely new, unprecedented infrastructure in this codebase.

Full updated forecast block lives in the canonical implementation plan (`spec*implementation*plan` field / synced `implementation-plan.md`).

---

### Automation for Jira - 7/31/2026, 11:14:02 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 7/31/2026, 11:46:02 AM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 7/31/2026, 11:55:31 AM

## Ready for QA

Merged to `staging`: [https://github.com/upex-galaxy/upex-bunkai-tms/pull/73](https://github.com/upex-galaxy/upex-bunkai-tms/pull/73) (merge commit `f0ad316`).

Assignee already correct (Benjamin Segovia, the shift-left QA owner for this story) — no reassignment needed.

Summary for QA: all 8 AC2 verdict combinations, the pending-steps-stay-`unrun` rule (Q1), the finished/aborted guard (AC5), last-write-wins re-marking (AC6), the 1-step boundary, and a genuine concurrent finish-vs-mark race are covered by `lib/runs/mark-step.test.ts` (22/22). This ships the product's first real-time feature (Supabase Realtime, ADR-0010) — a teammate watching the same run should see step marks, verdict, and progress update live without refreshing.

One thing worth a close look on staging since live-UI/browser validation was suspended for this batch run (throughput decision): AC4's live-push behavior only has pure-logic test coverage (the channel-config/debounce/reconnection module), never an actual two-session live observation. Also flagging a known, separately-tracked gap (not a defect in this story): a run closing via Finish or Abort with zero pending steps produces no realtime push today (those RPCs shipped before realtime existed) — a teammate watching would need to reload to see a run go from running to finished/aborted, even though step marks themselves push live correctly.

---

### Benjamin Segovia - 8/3/2026, 1:30:35 PM

## QA Retest — PASSED

***Verified against ****`staging`**** API (PR #73 feature merge, BK-35), via ****`POST /api/v1/runs/{id}/steps/{stepId}/mark`**** + supporting endpoints.***

Test data: 2 seeded Runs (environment `QA Staging`, module `BK-35 Retest`) chaining 3 fresh ATCs (2 steps each) to exercise all three verdict outcomes plus the terminal-run guard.

| DoD item | Result |
| --- | --- |
| Mark a pending step passed / failed / blocked | ✅ PASS — all 3 statuses accepted via `mark` |
| Optional note + evidence_url on a step result | ✅ PASS — both persisted verbatim on the step |
| ATC verdict — all steps passed → `passed` | ✅ PASS (ATC-A) |
| ATC verdict — any step failed → `failed` | ✅ PASS (ATC-B: 1 failed + 1 passed → `failed`) |
| ATC verdict — any step blocked, none failed → `blocked` | ✅ PASS (ATC-C: 1 blocked + 1 passed → `blocked`) |
| Reporting on a finished Run is blocked with a clear message | ✅ PASS — `409 {"code":"conflict","message":"This run is already closed and cannot accept new step results."}` |
| Latest reported result for a step is the one shown | ✅ PASS — re-marked a step `passed` → `blocked`; the run reflected `blocked` (last write wins) |

***Not exercised this session (residual, non-blocking)******:*** AC — "a teammate watching the same Run sees the verdict/progress update live without refreshing" (the Realtime/Supabase-channel leg). Would need a second concurrent session/browser tab to observe; API-level behavior for every other DoD line is confirmed correct.

Retested via API only (Test Runs UI nav is still marked SOON in the app; the underlying `/api/v1/runs/*` surface is fully implemented and working).

---

### Benjamin Segovia - 8/3/2026, 6:36:06 PM

## QA Follow-up — Realtime (AC4) verified

The one item flagged as "not exercised" in the earlier PASSED comment is now confirmed via a live two-tab session on a fresh Run:

| Check | Result |
| --- | --- |
| Tab A marks Step 1 passed → Tab B reflects it without refresh | ✅ PASS — 50%/1-2 steps appeared live in Tab B |
| Tab B marks Step 2 passed → Tab A reflects it without refresh | ✅ PASS — 100%/2-2 steps + ATC verdict "Passed" appeared live in Tab A, in both directions |

All 8/8 DoD items for BK-35 are now verified, including the Realtime leg (Supabase channel, per ADR-0010 and the implementation plan's own "flagged for QA — automation cannot cover this" note). No further QA action pending on this story.

---


_Synced from Jira by sync-jira-issues_
