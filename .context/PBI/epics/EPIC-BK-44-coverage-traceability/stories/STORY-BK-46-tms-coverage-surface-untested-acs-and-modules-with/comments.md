# Comments for BK-46

[View in Jira](https://jira.upexgalaxy.com/browse/BK-46)

---

### Carlos Alberto Chiavassa - 6/26/2026, 4:08:00 AM

1. 

Análisis pre-sprint realizado. Artefacto local:

`.context/PBI/epics/EPIC-BK-44-coverage-traceability/stories/STORY-BK-46-surface-untested-acs/shift-left-refinement.md`

****Resultado:**** 3 ACs originales expandidos a 9 sub-scenarios. 20 outlines ATP DRAFT identificados.
Infraestructura faltante: coverage view route + API endpoint (ambos nuevos). Data model del SUT soporta la feature.

—

1. 

****Q1 — ¿Qué significa "never run"?****
¿Es `atcs.status = 'unrun'` (estado puntual en DB)? ¿O se necesita una tabla de historial de ejecuciones?
Si un ATC corrió, fue editado y se reseteó a `unrun`, ¿sigue apareciendo en el filtro "not run"? Impacta la query central de AC2.

****Q2 — ¿"Fully covered" = ATC vinculado, o ATC vinculado Y ejecutado?****
AC3 dice "executed test coverage." ¿Un módulo donde todos los ACs tienen ATCs pero todos están en `unrun` es "fully covered"?
O ¿deben tener `status ≠ unrun`? Impacta el threshold del indicador de AC3.

****Q3 — Multi-ATC por AC en filtro "not run": ¿unión o intersección?****
Si un AC tiene 2 ATCs y uno es `pass` y otro es `unrun`, ¿aparece en el filtro?
Propuesta QA: NO (si al menos uno corrió, el AC tiene cobertura ejecutada).
Impacta el predicado SQL del filtro de AC2.

—

6 preguntas adicionales (MEDIO/BAJO) documentadas en el artefacto local.
ATP DRAFT completo en campo Acceptance Test Plan (ATP) de este ticket.

---

### Carlos Alberto Chiavassa - 6/27/2026, 3:09:31 PM

PO Decisions — Q1, Q2, Q3 resolved (2026-06-27)

Q1 — "Not run" definition
"Not run" = atcs.status = 'unrun' (current point-in-time value). Distinguishing "never executed historically" from "reset to unrun" is out of MVP scope; if needed, a separate execution-history story.

Q2 — "Fully covered" definition
"Fully covered" = ATC linked AND executed (status != 'unrun'). A module with all ACs linked to unrun ATCs is NOT fully covered. Note: "covered" (was it run?) and "healthy" (did it pass?) are separate axes — this view measures coverage only.

Q3 — Multi-ATC per AC: union rule
An AC with N ATCs appears in "not run" if at least ONE linked ATC is 'unrun'. One executed ATC does not neutralize pending coverage on the others.

Story unblocked for estimation. Q4-Q9 remain open.

---

### Carlos Alberto Chiavassa - 7/13/2026, 2:04:14 PM

## Diagnosis — [https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46](https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46) is not QA-blocked

Shift-Left QA closed on 2026-06-26: the 3 original ACs were expanded into 9 sub-scenarios, with an ATP DRAFT of 20 outlines documented in the Acceptance Test Plan field. PO resolved the 3 blocking questions (Q1, Q2, Q3) on 2026-06-27 — the story was unblocked for estimation at that point.

***The current blocker is not QA — it's upstream dependencies.***

[https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46](https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46) has a `Dependencies` link to two Epics, both still in ***Planning***:

- [https://jira.upexgalaxy.com/browse/BK-13#icft=BK-13](https://jira.upexgalaxy.com/browse/BK-13#icft=BK-13) — ATC Library (Acceptance Test Cases)
- [https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30](https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30) — Manual Execution & Runs

No coverage route or API endpoint exists yet in the SUT for this feature.

Sprint testing's entry gate is ***Ready For QA***. Until [https://jira.upexgalaxy.com/browse/BK-13#icft=BK-13](https://jira.upexgalaxy.com/browse/BK-13#icft=BK-13)/[https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30](https://jira.upexgalaxy.com/browse/BK-30#icft=BK-30) progress and dev delivers the coverage view, there's nothing executable on the QA side for this ticket.

---

### Ely - 7/30/2026, 10:28:31 AM

Mockup — Metrics dashboard (untested ACs / coverage). Source: .context/designs/bunkai-test-management-tool/bk-44-metrics-coverage/metrics-dashboard.html · spec: master-design-plan §4.7



---

### Ely - 8/1/2026, 12:04:24 AM

## QA handoff — [https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46](https://jira.upexgalaxy.com/browse/BK-46#icft=BK-46) merged to `staging`

***PR***: [https://github.com/upex-galaxy/upex-bunkai-tms/pull/93](https://github.com/upex-galaxy/upex-bunkai-tms/pull/93) (merge commit `c9155e7`)
***Route***: `/projects/{projectSlug}/metrics` — Coverage section (KPI row, per-module table, no-coverage list, segment filter).

### What shipped

Whole-project coverage rollup: per-AC state (uncovered / not*run / executed), per-module status (uncovered / not*run / fully*covered / no*acs), and the "Never run" / "Coverage gaps" segment filter, matching `metrics-dashboard.html` (§4.7). PO decisions Q1 (not*run = current point-in-time value), Q2 (fully*covered = linked AND executed), Q3 (union rule — one executed ATC doesn't clear a sibling unrun ATC) are implemented as specified.

### Worth QA's first few minutes specifically

The final chain review caught and fixed a real defect in how "executed"/"fully covered" was computed (it was reading a DB column that never actually reflects execution results — details in the PR body if useful). The fix now sources it from real Run history instead. ***Because §9b suspended live-UI validation for this whole run, the "Executed coverage" / "Fully covered modules" KPI tiles and the per-AC "executed" state have never been observed rendering in a real browser against real data*** — only exercised via a DB-integration test suite. Recommend, as a priority check: mark an ATC's step passed in a real Run, then confirm the linked AC/module flips to executed/fully_covered on this screen without a page reload issue or stale count.

### Also worth a quick look

- Access level: any active workspace role (including viewer) can see this screen — same access level as the Runs report, not QA-only.
- Scope trim vs. the mockup (deliberate, documented): no "Open Traceability" button, no per-module Trace links, no "Last 30 days" chip, no "Median recovery cycle" KPI, no Recovery-cycle/Defect-density sections — those belong to sibling tickets ([https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45](https://jira.upexgalaxy.com/browse/BK-45#icft=BK-45)/47/48) or an unbuilt traceability route.
- AC2's literal text reads as wanting a per-criteria "not run" list; the shipped screen (matching the mockup) only itemizes per-AC detail for the **uncovered** state, and stays per-module for "not run" — documented as an intentional departure in `master-design-plan.md` §5 (D16).

---


_Synced from Jira by sync-jira-issues_
