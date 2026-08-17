# Comments for BK-47

[View in Jira](https://jira.upexgalaxy.com/browse/BK-47)

---

### Nahuel Gomez - 6/29/2026, 8:29:21 PM

## Shift-Left QA Refinement — 2026-06-29

### Quality Gaps Found

| ***Gap**** | ****Severity*** |
| --- | --- |
| No ACs exist | HIGH |
| No DoD | HIGH |
| "Failing" undefined (per-step/per-ATC/run verdict?) | HIGH |
| "Passing" undefined | HIGH |
| Bug impact on metric unclear | HIGH |
| Calendar vs business hours | MEDIUM |
| Multi-Test US consolidation | MEDIUM |
| Never-passing scenario | MEDIUM |
| Only-passing scenario | MEDIUM |

### Open Questions for PO

1. ***Failing boundary:*** Run status=failed? Or any Run where at least one ATC failed?
2. ***Bug reopening:*** Does re-opening a bug after a "passing" Run reset the time-to-green clock?
3. ***Multi-Test consolidation:*** Union (earliest fail → latest pass across all Tests) or per-Test rollup?
4. ***Blocked steps:*** Do blocked `run_steps` count as "failing" for the metric?
5. ***Calendar or business hours*** for duration computation?

### Open Questions for Dev

1. ***Query path:*** US→ATC→test*steps→runs, or add a direct FK (`run.user*story_id`)?
2. ***Materialized view*** or live computation?
3. ***Aborted runs:*** Excluded or counted as neutral?

### ATP DRAFT — 11 outlines

1. TTC01 — Time-to-green first fail to first pass
2. TTC02 — Earliest failing run selected
3. TTC03 — Only passing runs shows N/A
4. TTC04 — No passing run shows "Still failing"
5. TTC05 — Aborted run skipped
6. TTC06 — Multi-Test consolidation
7. TTC07 — Bug fix window in breakdown
8. TTC08 — Re-opened bug resets time-to-green
9. TTC09 — New run triggers data refresh
10. TTC10 — Workspace isolation
11. TTC11 — Single passing run N/A

Full refinement: `shift-left-bk47.md` in QA repo.

---

### Juan Ignacio Marmo - 7/24/2026, 3:29:32 PM

## Acceptance Test Plan (ATP) — Shift-Left DRAFT ready for review

ATP DRAFT is now in the ***🧪 Acceptance Test Plan (ATP)*** field on this Story.

***Refined by:*** Juan Ignacio Marmo — 2026-07-24
***Prior refinement:*** Nahuel Gomez, 2026-06-29

---

### Summary

- ***3 of 9 original gaps resolved*** by the new ACs (added after Nahuel's refinement)
- ***2 gaps partially resolved*** — ACs exist but still ambiguous (failing/passing definition)
- ***2 gaps still open*** — calendar vs business hours, multi-test consolidation
- ***3 new ACs added*** (AC-4, AC-5, AC-6) — marked NEEDS PO/DEV CONFIRMATION
- ***22 ATP outlines*** (8 Positive / 7 Negative / 3 Boundary / 4 Integration)

---

### Blocking items — do NOT move to Ready For Dev until resolved

***For PO:***

1. Multi-Test consolidation rule — union or per-Test rollup?
2. Does bug re-opening reset the "recovered" status?
3. Do `blocked`/`skipped` run_atcs satisfy "all passing"?
4. Display format for elapsed time (HH:MM? Xd Yh?)
5. What label shows when a story has zero runs?

***For Dev:***

1. Confirmed RPC for cycle-time computation — does `bunkai*compute**` exist or need to be created?
2. Defect-to-run link mechanism — no confirmed FK in current schema
3. Clock timestamp field — `runs.created*at` or a separate `started*at`?
4. Aborted run handling — excluded, neutral, or in-progress time?

---

### Ely - 7/30/2026, 10:28:34 AM

Mockup — Metrics dashboard (time-to-green). Source: .context/designs/bunkai-test-management-tool/bk-44-metrics-coverage/metrics-dashboard.html · spec: master-design-plan §4.7



---

### Juan Ignacio Marmo - 7/31/2026, 2:45:25 PM

@@Ely antes de que el equipo de dev comience la implementación, quedan preguntas abiertas del refinement de QA que necesitan tu definición. Las dejamos acá para no bloquear el sprint una vez que el dev levante la story.

## Preguntas para PO — [https://jira.upexgalaxy.com/browse/BK-47#icft=BK-47](https://jira.upexgalaxy.com/browse/BK-47#icft=BK-47)

> ***WARNING:*** Las siguientes preguntas impactan directamente la condición de "recuperación" del AC-1. Sin respuesta, el dev deberá tomar decisiones de producto mid-sprint.

***1. Multi-Test consolidation***
Cuando los ATCs de una story están distribuidos en múltiples Tests con runs independientes, ¿cuál run cuenta como "primer fallo"?

- ***Opción A:*** la falla más temprana entre todos los Tests (union global)
- ***Opción B:*** rollup por Test independiente (promedio / mín / máx)

***2. ¿El defecto reabierto resetea el clock?***
Si una story ya mostró "Recovered" y el defecto vinculado se reabre, ¿vuelve a "Not yet green"? ¿El clock reinicia o continúa?

***3. ¿****`blocked` ****/**** `skipped` ****en**** `run_atcs` ****satisfacen "all passing"?***
El AC-1 requiere que "all of the story's test coverage passes". ¿Los `run_atcs` con outcome `blocked` o `skipped` cuentan como passing, o deben ser estrictamente `pass`?

---

Story pasada a ***Ready For Dev*** con ATP DRAFT de 22 outlines en el campo QA.

---

### Ely - 7/31/2026, 9:19:21 PM

## Scope resolution — run-data only, before Stage 1

Found a real tension between two of this story's own fields before planning: `scope.md`/the AC describe cycle time as purely "first failing run -> first all-passing run" per user story (readable entirely from the `runs` table, no dependency on the Bugs domain — which doesn't exist yet; [https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40) is still in progress). But `business-rules.md` says a story counts as "recovered" only "after the failure that opened the cycle has a resolved defect AND a subsequent all-passing run" — literally read, that requires an actual defect record.

***Resolved with the repo owner: run-data only.*** Cycle time = first failing run -> first all-passing run per user story, computed entirely from run history. The "resolved defect" language in the business rule is narrative from shift-left refinement, not a literal defect-table dependency — this story does not read from any Bugs-domain table. Proceeding on that basis; `business-rules.md`'s wording will read as slightly imprecise against the shipped behavior, but the AC/scope fields (the more literal, testable source) already matched this reading.

Not blocked on [https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40)/[https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31). Starting Stage 1.

---

### Ely - 7/31/2026, 9:42:05 PM

## Chain strategy decision — /git-flow-master §Chained-PR decision tree

***Chain strategy: feature-branch-chain***

Decision trace:

- Q1=No — new domain logic (an aggregate RPC computing cycle times from run history, a new Metrics UI section); not mechanical.
- Q2=No — DB/API/UI are not independently shippable slices to `staging`: a migration+RPC with no caller, or an API route with no UI, has zero standalone product value until the chain completes. The UI slice directly imports the API slice's generated response shape — a UI PR opened before the API slice merges would not compile against `staging`.
- Q3=Yes — the RPC's jsonb aggregate shape + generated Supabase TS types are shared scaffolding the API slice defines and the UI slice directly imports and renders.
→ feature-branch-chain

Decided by: `/git-flow-master` §Chained-PR decision tree (branching-strategies.md)

Same shape as [https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40) and [https://jira.upexgalaxy.com/browse/BK-49#icft=BK-49](https://jira.upexgalaxy.com/browse/BK-49#icft=BK-49) (both DB→API→UI, both resolved feature-branch-chain for the identical Q2/Q3 reasoning). Executing per this run's standing rule: long-lived integration branch `feat/BK-47-time-to-green`, each slice its own real PR into it (self-reviewed/merged, unprotected branch), final integration→{{staging}} PR through Agent 4 with a full-diff adversarial review.

---

### Automation for Jira - 7/31/2026, 10:11:39 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 7/31/2026, 10:13:08 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 8/1/2026, 12:42:54 AM

## QA handoff — shipped to staging

Merged to `staging`: [PR #98](https://github.com/upex-galaxy/upex-bunkai-tms/pull/98), commit `08d57e3`. Built as a 3-slice chain (DB → API → UI), each independently reviewed, plus a full-diff review of the assembled whole before this merge.

***What to re-check on staging*** (`/projects/[projectSlug]/metrics`, sits alongside BK-46's Coverage section on the same page):

1. ***AC-1 (Recovered)***: a user story with a failing run, later a fully-passing run → cycle time shown, "Recovered" chip.
2. ***AC-2 (Still failing)***: latest run still failing → "Not yet green" chip, elapsed time "so far", no First-green timestamp.
3. ***AC-3 (Never failed)***: always-passing runs → "No cycle · never failed" chip, no timestamps at all.
4. ***Cross-workspace isolation***: a project in workspace A must never leak into workspace B's report (covered by a live-DB isolation test, but worth a two-account spot-check per this run's usual practice).
5. ***Median recovery cycle KPI***: shows the correct median across only `Recovered` stories, and shows an explicit empty-state message (not "0h 0m") when zero stories have recovered yet.

***Known, deliberate scope note***: the Metrics link in the main left-nav sidebar is still disabled ("soon" tag) — the sidebar has no mechanism yet to link into a specific project's Metrics page from outside that project's own context (same gap affects the ATC Library and Bug Reports nav items too, which are also fully shipped but still disabled there). The Metrics page itself is fully reachable by URL. This is flagged as a separate, real gap — not something either this story or [https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46](https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46) was scoped to fix.

***Business-rule note for QA***: `business-rules.md`'s "resolved defect" wording was explicitly NOT implemented — Bugs doesn't exist in this codebase yet ([https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40](https://jira.upexgalaxy.com/browse/BK-40#icft=BK-40) in progress). Ratified with the repo owner as run-data-only: cycle time is purely first-failing-run → first-all-passing-run, computed entirely from run history. If a test case expects a "resolved defect" gate, that's against the superseded reading — check against the current AC/scope docs instead.

---

### Juan Ignacio Marmo - 8/5/2026, 4:12:14 PM

## QA Sign-Off — BK-47

***QA******:*** Juan Ignacio Marmo
***Date******:*** 2026-08-06
***Environment******:*** Staging
***Verdict******:*** PASSED ✓

All 6 acceptance criteria verified. 12 test cases executed — 10 PASS, 2 deferred to automation (same-timestamp boundary + RPC error mock).

No blocking defects found. Story is ready for release.

***Key notes for the team******:***

- Scope confirmed run-data-only (no bug/defect dependency) per Ely's 2026-08-01 clarification.
- Left-nav "Metrics" link disabled ("soon") is confirmed out of scope for this story.
- Metrics page is fully reachable via direct URL: `/projects/{slug}/metrics`.

***Key discovery during execution******:***
The RPC `bunkai*report*project*recovery*cycles` reads `run*atcs.outcome`, NOT `run.verdict` alone. Any test data seeding (manual or automated) must follow the full flow: `create run → mark each step → finish run`. Calling finish without marking steps produces all-skipped outcomes and the RPC returns `no*cycle` for every story regardless of the run verdict.

***Full ATR on******:*** BK-283

---


_Synced from Jira by sync-jira-issues_
