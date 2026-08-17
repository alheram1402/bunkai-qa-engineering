# Comments for BK-118

[View in Jira](https://jira.upexgalaxy.com/browse/BK-118)

---

### Ely - 6/25/2026, 9:01:09 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componentes | Account & Settings · Project & Module Hierarchy | Se conservan los componentes existentes: el endpoint POST /api/v1/me/active-workspace afecta la configuración de workspace activo del usuario y el contexto de workspace. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Severidad | Menor (ajustada desde Moderada) | El propio Impact indica "Additive — no current consumer is broken": limpieza de contrato sin ruptura. Severidad realineada a impacto real. |
| Prioridad | Low (ajustada desde Highest) | Highest no correspondía a un cambio sin impacto en consumidores; alineada a severidad Menor. |
| Tipo de error | Functional | Campos legacy ({ok, active*workspace*id}) presentes de más en la respuesta de la API. |
| Causa raíz | Code Error | El fix de [https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83](https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83) no removió los campos legacy en route.ts (limpieza incompleta en código). |
| Entorno | Staging | Observado en staging (2026-06-12). |
| Frecuencia | (sin cambios) | Campo no tocado por política. |

---

### Ely - 7/31/2026, 12:20:44 AM

## Root Cause

***Category:*** Code Error

The [https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83](https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83) fix added the required `{id, slug, name, role`} fields to the
`POST /api/v1/me/active-workspace` response but did not remove the legacy
`ok: true` and `active*workspace*id` keys the endpoint returned before that
fix. Both shapes ended up in the same `jsonResponse(...)` call, so the
response has carried duplicate/legacy data ever since.

## Fix Plan

- Remove `ok: true` and `active*workspace*id` from the `jsonResponse` call in

`app/api/v1/me/active-workspace/route.ts`, keeping `id`, `slug`, `name`,
`role` untouched.

- Update the sibling OpenAPI schema in

`app/api/v1/me/active-workspace/route.openapi.ts` (`ResponseSchema`) to drop
`ok` and `active*workspace*id` so the documented contract matches the real
response.

- Add a regression test asserting the response shape is exactly

`{id, slug, name, role`} with no legacy keys.

- No other code path reads `active*workspace*id` from this endpoint's

response — the sibling `GET /api/v1/me` endpoint keeps its own,
independent `active*workspace*id` field and is out of scope here.

***Branch:*** `fix/BK-118-remove-legacy-active-workspace-fields`

---

### Automation for Jira - 7/31/2026, 12:37:37 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 7/31/2026, 2:23:56 AM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 7/31/2026, 2:38:15 AM

## ✅ Ready for QA retest

Fix merged to `staging`: [PR #67](https://github.com/upex-galaxy/upex-bunkai-tms/pull/67)

***How to verify:***

1. Call `POST /api/v1/me/active-workspace` on staging with a valid `workspace_id`.
2. Confirm the response body is exactly `{id, slug, name, role`} — no `ok`, no `active*workspace*id`.

Regression test added at `app/api/v1/me/active-workspace/route.test.ts` (co-located, 2 cases).

---

### Luis Eduardo Flores Villarroel - 7/31/2026, 4:51:49 AM

## QA Bug Verification - [https://jira.upexgalaxy.com/browse/BK-118#icft=BK-118](https://jira.upexgalaxy.com/browse/BK-118#icft=BK-118)

***Environment:*** Staging
***Result:*** VERIFIED — Bug fix confirmed

### Test data used

- Workspace (member): Extra Test (`9a2c3de7-18af-45e5-a36f-e0ef9377af69`)
- Workspace (non-member): First Smoke Test (`27ef91be-83ae-41ef-9b2e-c3eaf4f69066`)

### Verification

- Original bug scenario: no longer reproduces — response is exactly `{id, slug, name, role`}, legacy `ok`/`active*workspace*id` fields are gone
- Expected behavior: now works correctly, matches the ticket's "Expected response shape after cleanup"
- Regression check: `bk*active*ws` cookie and the non-member 403 auth gate both unaffected

Artifacts: ATP (`customfield*10067`), ATR (`customfield*10147`)

---


_Synced from Jira by sync-jira-issues_
