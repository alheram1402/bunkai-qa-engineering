# Comments for BK-42

[View in Jira](https://jira.upexgalaxy.com/browse/BK-42)

---

### jesusgpythondev - 6/27/2026, 8:09:15 PM

> ***SUCCESS:*** [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) shift-left refinement published. QA/PO/Dev now have a testable contract before implementation.

| ***Area**** | ****Summary*** |
| --- | --- |
| Readiness | Ready for estimation from QA perspective; Dev start conditional on [https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40) and heatmap stats/MV contract. |
| Refined AC | 11 canonical Gherkin scenarios in the Acceptance Criteria field. |
| ATP Draft | 20 outline rows in the ATP field. |
| Contract decisions | Fixed windows 7d/30d/90d, default 30d, subtree rollup, active modules only, 5s freshness, 401/403 security behavior. |
| High risks | WoW ambiguity, aggregate leak, vague freshness, color-only hotspot cues. |
| QA SP | 3 SP, confidence 0.70. Advisory only; Jira Story Points unchanged. |
| Current Jira status | {status:blue | BACKLOG} - no transition performed. |

> ***WARNING:*** Dev readiness depends on [https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40) shipping the bugs schema / POST bug flow and on a heatmap stats or materialized-view contract. Split API/stats from UI only if that substrate is not ready at Dev start.

---

### jesusgpythondev - 6/27/2026, 8:41:30 PM

## Shift-Left Traceability & Bug Status Addendum

> ***NOTE:*** This addendum makes the [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) shift-left lineage explicit in Jira. No product bug was found during shift-left because [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) is pre-development/spec-only; the findings are dependency/specification gates to resolve before implementation.

| ***Trace item**** | ****Reference**** | ****Why it matters**** | ****Covered by*** |
| --- | --- | --- | --- |
| Epic | [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) - Bugs & Defect Heatmap | [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) contributes the heatmap/dashboard value of the defect epic. | Metadata, Scope, Readiness Gates |
| Source spec | BK-027 / FEAT-033 / FR 7.3 | Defines the defect heatmap by module with count and week-over-week trend. | AC-1 to AC-11, ATP-1 to ATP-20 |
| Upstream dependency | [https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40) - Defect Filing | Heatmap cannot be implemented/tested until defects can be filed and persisted with module_id/severity/status. | AC-10, ATP-16, Dev readiness gate |
| Sibling contract anchor | [https://jira.upexgalaxy.com/browse/BK-41#icft=BK-41](https://jira.upexgalaxy.com/browse/BK-41#icft=BK-41) - Defect List/Filter | [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) inherits active-module default, subtree/aggregate thinking, and 401/403 aggregate-leak handling. | AC-1, AC-2, AC-11, ATP-3, ATP-18, ATP-19 |
| Technical gate | OpenAPI heatmap schema expansion | Current source schema is too thin; implementation needs window metadata, freshness/as*of, current/previous week counts, trend*direction, nullable trend_pct. | Key Contract Decisions, ATP-6 to ATP-10 |
| Data gate | module*defect*stats / stats substrate | Required for 5-second freshness, trend math, and performance. | AC-10, ATP-16, ATP-17 |
| Security gate | Project membership before aggregate reads | Heatmap counts can leak module/project defect density; unauthorized users must get 403, not fake empty stats. | AC-11, ATP-18, ATP-19 |

| ***Question**** | ****Answer*** |
| --- | --- |
| Was a product bug found? | No. [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) is not implemented yet; no browser/API/DB execution was performed and no implemented behavior failed. |
| Was a report gap found? | Yes. The first Jira-visible mirror was too compact and did not expose the full traceability chain. This addendum fixes that visibility gap. |
| Is the local shift-left package complete? | Yes. Full package includes 11 AC scenarios, 20 ATP rows, risk matrix, dependency map, readiness gates, and QA advisory estimate. |
| Should Jira Story Points change now? | No automatic update. QA advisory remains 3 SP; Jira Story Points stay canonical unless PO/Dev explicitly update them. |
| Should status transition now? | No transition performed. PO/Dev own movement out of Backlog/Estimation. |

Full local package: .context/PBI/epics/EPIC-BK-31-bugs-defect-heatmap/stories/STORY-BK-42-tms-defect-heatmap-view-count-and-week-over-week-t/shift-left-refinement.md

---

### Ely - 7/30/2026, 10:28:21 AM

Mockup — Bug Reports index — Heatmap view ([https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42) placement). Source: .context/designs/bunkai-test-management-tool/bk-31-bug-reports/bug-reports-index.html · spec: master-design-plan §4.6



---

### Ely - 8/1/2026, 4:17:26 PM

## PO + Dev Ratification — explicit live authorization, 2026-08-01

Delegated by Ely (project owner) in a live conversation on 2026-08-01, NOT a blanket forward-dated batch comment. AI-authored, grounded in the evidence cited below. Answers are decisive engineering/product calls, not placeholders.

### 1. Is the BK-40 schema dependency actually satisfied, or is Dev start still blocked?

***Decision******:*** Satisfied. Dev start is unblocked on this gate.

***Evidence******:*** `supabase/migrations/0046*bugs.sql` (shipped on `staging`, confirmed ancestor of this branch) defines `public.bugs` with `module*id uuid not null`, `severity text not null check (... 'P1'..'P4')`, `status text not null default 'open'`, and `created*at timestamptz`. Every column BK-42's AC/ATP need to group and window by (module, severity is not used by the heatmap itself but status is available for a future filter) already exists and is populated by `bunkai*create_bug`. The shift-left note calling this "conditional on BK-40 schema" predates BK-40 merging to staging; that half of the gate is now closed by fact, not by decision.

### 2. Does the heatmap need a `module*defect*stats` materialized view / stats substrate before Dev can start, per the shift-left "Data gate"?

***Decision******:*** No. Build a live, unpaginated, project-scoped aggregate RPC (`bunkai*report*project*defect*heatmap` or equivalent), not an MV. Drop the MV as a Dev-start precondition.

***Evidence******:*** The two closest precedents in this codebase for "aggregate count/trend per entity" — `bunkai*report*project*coverage` (BK-46, `0048*project*coverage*report.sql`) and `bunkai*report*project*recovery*cycles` (BK-47, `0049*recovery*cycle_report.sql`) — both compute their rollups live via CTEs at read time, scoped to one project, unpaginated, with no materialized view or precomputed stats table anywhere in the schema. Both explicitly reason that project-scoped data here is "small and bounded," unlike the append-heavy Runs report. A `bugs` table filtered to one project and one 90-day window is the same shape. A live query also trivially satisfies the "5 second freshness" AC (AC-9/ATP-16/17) — there is no cache to invalidate, so "freshness" reduces to "re-fetch on view/poll," which is a client-side concern, not a server-side substrate.

### 3. What is "module" as the grouping dimension, and how does rollup work for nested/archived modules?

***Decision******:**** Module = the existing first-class Module tree entity (not a free-text label). Each cell = one active (non-archived) module. A parent module's count = its own directly-filed defects ****plus*** every descendant module's defects (subtree rollup), and the child module still gets its own separate cell with its own (non-rolled-up-into-parent-only) count. Archived modules are excluded from the heatmap by default, same as the list view's active-module default.

***Evidence******:**** `.context/business/domain-glossary.md`: "Module — First-class tree node (depth ≤ 6) partitioning features. Coverage rollups ****and defect heatmaps*** aggregate by Module." AC-2 and ATP-11/ATP-12 already encode subtree rollup with the child cell staying independently visible. ATP-3 encodes archived-branch exclusion by default. BK-41's list view (sibling contract anchor per the shift-left addendum) already established "module filter rolls up nested sub-modules by path prefix, active modules only" — BK-42 inherits that, not a new pattern.

### 4. What does "week-over-week trend" actually compute — rolling window, calendar week, timezone?

***Decision******:*** Fixed 7-day UTC bucket vs. the immediately preceding 7-day UTC bucket (a rolling trailing window anchored to "now," not an ISO calendar week, not localized to the viewer's timezone).

***Evidence******:*** Already decided and encoded in AC-4/AC-5/AC-6 ("latest 7-day UTC bucket versus the previous 7-day UTC bucket") and business-rules.md ("compares the most recent week against the prior week within the window"). This is a ratification of an existing, correctly-scoped decision, not a new call — flagging it here only because the audit's premise is that no PO/Dev ever affirmed it in writing.

### 5. Color/severity scale semantics for the heatmap — how are hotspots visually distinguished?

***Decision******:*** Four-tier text-labeled buckets — Clean / Low / Elevated / Hotspot — never color-only. Trend uses text, not just an arrow/color: zero-to-N reads "Rising +N", zero-to-zero reads "Flat ±0".

***Evidence******:*** `.context/design/master-design-plan.md` §4.6 (frozen mockup contract, `bug-reports-index.html`): "count buckets Clean/Low/Elevated/Hotspot with a text legend/tag (never color-only); zero-to-N trend reads 'Rising +N', zero-to-zero reads 'Flat ±0' (no infinite percentages)". AC-6/AC-7 and ATP-13/ATP-14 already require non-color-only accessible cues; the mockup supplies the exact four-tier vocabulary the AC left abstract ("visually emphasized").

### 6. What happens with zero-defect modules — shown as an empty/zero cell, or omitted?

***Decision******:*** Shown, not omitted. A zero-defect active module renders as the "Clean" tier with its own cell, distinct styling from Hotspot.

***Evidence******:**** AC-8/AC-9, business-rules.md ("a module with zero defects in the window is shown as clean, distinct from a hotspot"), and the mockup's "heatmap zero-flat boundary" state in the States strip (§4.6). Omitting zero-defect modules would defeat the story's own stated purpose — seeing where quality is **not* degrading is part of "at a glance."

### 7. Performance / query-cost concern for a live aggregate on every heatmap view?

***Decision******:*** Acceptable as scoped (one project, ≤ depth-6 module tree, single bugs table, indexed on `project_id`). No pagination, mirroring BK-46/BK-47. Revisit only if a project's module count or bug volume grows enough to show up in real latency — not a Dev-start blocker now, and out-of-scope.md already excludes trend windows beyond the chosen one, keeping the query shape fixed.

***Evidence******:*** `bugs*project*id*created*at*idx` already exists (0046*bugs.sql), covering the exact filter/sort this RPC needs. `bunkai*report*project*coverage`/`*recovery_cycles` set the "no pagination, project-bounded" precedent for reports of comparable or greater join complexity.

### 8. RLS / tenancy scoping for the new aggregate RPC — what does ADR-0012 require here?

***Decision******:*** The new RPC (`SECURITY DEFINER`, explicit `p*actor*user*id`) MUST open with the actor-bind guard (`auth.uid() is not null and auth.uid() <> p*actor*user*id → raise 'project*not*found' P0002`) before any table read, resolve the project and re-check read membership via `bunkai*assert*actor*can*read*workspace` (any active role, viewers included — same tier as the sibling Coverage/Recovery/Runs reports), and every CTE must re-assert `project*id = p*project*id` explicitly rather than trusting a denormalized column, per ADR-0012's "assert one resource, disclose a differently-scoped result" failure class (which hit BK-49 and BK-40 live on this exact project, hours before this ratification).

***Evidence******:*** ADR-0012 (`.context/ADR/ADR-0012-rpc-authorization-invariant.md`) is a binding cross-cutting invariant, mechanically triggered by any story touching `supabase/migrations/`, which BK-42 will. `0049*recovery*cycle_report.sql`'s header is the most complete worked example of the same reasoning applied to a project-scoped aggregate report — this is the pattern to copy, not re-derive.

### 9. AC-11 says unauthorized access returns 403 — does that hold, or does it conflict with existing convention?

***Decision******:*** No. Reject AC-11's literal "403" and replace it with the established non-disclosure convention: both a missing project and a non-member caller collapse into the identical `404 not*found` (P0002 → `ApiError('not*found', 'Project not found.')`). This is a required correction to the AC text before/at implementation time, not a new invention.

***Evidence******:**** Every sibling aggregate-report RPC in this codebase does this identically and explicitly documents **why* — `lib/metrics/errors.ts` for the Recovery-cycle report states "Projects all collapse into one identical 404 (`not*found`) — never 403" and the Coverage/Runs report routes mirror it (`app/api/v1/projects/[id]/runs/report/route.ts`, `0048*project*coverage*report.sql`). A distinct 403 for "project exists but you're not a member" is itself a disclosure (it confirms the project's existence to someone who cannot read it), which is precisely the aggregate-data-leak risk the shift-left refinement's own risk matrix flagged. AC-11 should still assert "no module names/paths/counts/zeroed aggregate data leak" — only the status code changes, from 403 to 404.

### 10. Are the fixed windows (7d/30d/90d, default 30d) still the right call?

***Decision******:*** Yes, ratified as-is. No custom/arbitrary date-range picker in this story's scope.

***Evidence******:*** AC-3, business-rules.md, ATP-2, and the mockup's §4.6 spec ("7d/30d/90d window (30d default)") all already agree, and out-of-scope.md explicitly excludes "trend windows other than the chosen one." Consistent across every source; no conflict to resolve.

### 11. Where does the heatmap live in the UI — separate screen or a toggle?

***Decision******:*** Ratified as already spec'd: a List/Heatmap view switch on the existing `/projects/[projectSlug]/bugs` screen (`bug-reports-index.html`), not a new route. BK-41 (list) and BK-42 (heatmap) are two view-states of one screen; build order should land BK-41's shell first since BK-42 renders into it.

***Evidence******:*** `.context/design/master-design-plan.md` §4.6 placement note: "BK-42 had no single natural screen in the nav... modeled as a selectable view (List/Heatmap)... since BK-42 was Ready For Dev and the epic pairs 'Bugs & Defect Heatmap' together by name," plus the explicit "Build order note: BK-41 and BK-42 both render `bug-reports-index.html`."

---

***Refinement status******:****** READY***

Every question the original shift-left package left open, plus the two extra gates a fresh audit surfaces (MV necessity, 403-vs-404 error contract), now has a decisive answer grounded in shipped code on `staging` (BK-40's schema, BK-46/BK-47's aggregate-RPC pattern), the frozen mockup contract (§4.6), the domain glossary, and ADR-0012. None of these decisions touch pricing, business model, or an irreversible security posture change — they are ordinary engineering/product calls within already-established project conventions, made with the PO/Dev authority explicitly and live delegated by Ely for this story. No open item requires Ely directly.

---

### Ely - 8/2/2026, 12:47:01 PM

## Dev status — 2026-08-02 (autonomous run)

Implementation is code-complete on PR [#108](https://github.com/upex-galaxy/upex-bunkai-tms/pull/108) (`feat/BK-42-defect-heatmap` -> `staging`), following the PO+Dev Ratification comment above verbatim (live SECURITY DEFINER aggregate RPC, subtree rollup, 7d/30d/90d windows, Clean/Low/Elevated/Hotspot tiers, 404 non-disclosure per Decision 9).

***Blocked, not Ready For QA***: implementing this required a new Postgres function (`bunkai*report*project*defect*heatmap`, migration `0052*defect*heatmap_report.sql`). Per this run's operating rules, a schema migration cannot be applied to the shared database without a human review/approval step — the migration file is written and reviewed (additive-only, no table/column/RLS change) but sits unapplied. The PR is opened as a draft for that reason. Once a maintainer reviews and applies the migration, the DB-integration test suite (currently skipping loudly, by design) will go green and this can move to Ready For QA.

Status left at ***In Review*** rather than Ready For QA, since the feature cannot be verified end-to-end yet.

---

### Ely - 8/2/2026, 3:03:39 PM

## Ready For QA — 2026-08-02

Blocker resolved: migration `supabase/migrations/0052*defect*heatmap_report.sql` was reviewed and applied to the shared Supabase project (owner-approved). Live definition + grants verified against the committed file — no drift.

While verifying end-to-end, found and fixed a real bug in the DB-integration test's own fixture (not the feature): it archived a module before filing a standalone bug into it, which `bunkai*create*bug` (BK-40) deliberately rejects. Reordered to file while active, archive after — matches the only realistic real-world sequence. Fix commit `4b08824`.

***PR***: [#108](https://github.com/upex-galaxy/upex-bunkai-tms/pull/108) — merged to `staging`, merge commit `c2fb9722` (confirmed ancestor of `origin/staging`).

***Tests***: `lib/metrics/defect-heatmap-isolation.test.ts` now passes for real, 8/8, against the applied migration (was previously skipping loudly by design). Full repo suite: 1116 pass / 2 fail — the 2 failures are in `lib/atcs/search-isolation.test.ts` (BK-20 full-text search), pre-existing and untouched by this branch (zero file overlap; matches the already-tracked BK-20/BK-187 defect).

Status moved to Ready For QA, reassigned to jesusgpythondev (shift-left refinement owner for this story).

---

### jesusgpythondev - 8/11/2026, 9:36:37 AM

# QA Completion Summary - BK-42

> ***SUCCESS:*** Result: 20/20 PASSED - Defect Heatmap is ready for QA Approved. No defects found. Evidence: API/DB/code trifuerza consistent across layers.

Executed the full ATP set (ATP-1..20) against staging (staging-upexbunkai.vercel.app) on 2026-08-11. Every test exercised the live endpoint GET /api/v1/projects/{id}/bugs/heatmap, the underlying RPC (bunkai*report*project*defect*heatmap, migration 0052), and the rendering code. All 20 test runs under the Test Execution are PASSED with per-layer evidence attached.

## Trifuerza summary

- API: HTTP 200 for member project d75e73ac; modules bk-39-qa (3, elevated, rising) and run-execution (6, hotspot, rising); pct null on zero baseline (AC-8). 401 unauthenticated, 404 non-disclosure (e207917d), 400 unsupported window verified.
- DB: total 9 bugs = 3 + 6 (ATP-1); rollup via path-prefix LIKE (qa-bk41-l1=77 incl descendants, l2 own cell); archived subtrees excluded (ATP-3).
- Code: defect-heatmap.ts clean at HEAD 75c28c9; heat boundaries Clean 0/Low 1-2/Elevated 3-4/Hotspot 5+; computeDefectTrend no Infinity/NaN; unit tests 12/12 (38 expect).

## Artifacts

- ATP (Test Plan): [BK-349](https://jira.upexgalaxy.com/browse/BK-349)
- ATR (Test Execution): [BK-350](https://jira.upexgalaxy.com/browse/BK-350) - 20/20 runs PASSED, env staging
- Tests: BK-351..BK-370 (one Cucumber per ATP)

## Observations

- UI rendering (BugsHeatmapView) not exercised by browser in this pass - covered by code review + unit tests; noted as out of scope, non-blocking.
- Repo note: transient injected worktree observed and resolved (pull fast-forward restored HEAD 75c28c9); no persistent corruption, non-blocking.

Recommendation: Approve.

---


_Synced from Jira by sync-jira-issues_
