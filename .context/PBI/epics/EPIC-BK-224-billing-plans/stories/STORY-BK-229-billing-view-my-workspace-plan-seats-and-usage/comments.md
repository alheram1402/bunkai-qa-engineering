# Comments for BK-229

[View in Jira](https://jira.upexgalaxy.com/browse/BK-229)

---

### Ely - 7/11/2026, 9:52:49 AM

## PO Ratification — 2026-07-11

- B1 ratified: Cloud tier ladder is Free / Team / Enterprise; Free is a real entry tier.
- B2 ratified (v1 targets, may be tuned pre-GA): Free = 5 seats, 3 projects, 90-day run-history retention. Team = unlimited projects, unlimited run history, per-seat billing (prices intentionally unpublished). Enterprise = custom terms. These are the values the seat and usage meters render against.
- B3 confirmed: owner manages billing; admins get a read-only billing view.

---

### Ely - 7/30/2026, 10:30:17 AM

Mockup — Settings — Billing overview (plan, seats, usage). Source: .context/designs/bunkai-test-management-tool/bk-224-billing/billing-overview.html · spec: master-design-plan §4.15



---

### pinto.lucas.nahuel - 8/13/2026, 5:04:37 PM

## Acceptance Test Plan (ATP) — Shift-Left DRAFT ready for review

***Shift-Left refinement completado el 2026-08-13.***

### Resumen

- ***ACs refinados******:*** 17 escenarios (5 originales + 12 nuevos)
- ***ATP outlines******:*** 18 (7 Positive / 3 Negative / 8 Boundary)
- ***Risk level******:*** MEDIUM

### Decisiones PO/Dev aplicadas

1. Admin PUEDE ver billing
2. Exceso de seats muestra "11 of 10" en estado limit-reached
3. Free plan: 3 projects, 5 seats, 30-day retention
4. Seat counting: solo `status = 'active'`
5. Sin auto-refresh
6. Usar tokens existentes del design system

### Gaps cubiertos

- Exacto 80% boundary (warning state)
- Run history retention meter (paid + free)
- API timeout (loading → error)
- Enterprise plan (Custom price)
- Suspended members
- Zero active members
- Exceeded seat limit

### Próximos pasos

Cuando esta story llegue a ***Ready For QA***, ejecutar `/sprint-testing` — detectará el label `shift-left-reviewed` y acortará las fases 1-3.

***QA Assignee******:*** pinto.lucas.nahuel

---

### pinto.lucas.nahuel - 8/13/2026, 6:50:12 PM

@@Ely Ready For Dev

---


_Synced from Jira by sync-jira-issues_
