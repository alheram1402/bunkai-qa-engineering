# Comments for BK-57

[View in Jira](https://jira.upexgalaxy.com/browse/BK-57)

---

### Automation for Jira - 6/10/2026, 5:50:38 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:50:54 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:53:50 PM

## Root Cause Analysis

`PATCH /api/v1/modules/{id`} accepted rename/description fields AND `parent*module*id` in one body, then executed them as TWO independent RPC round-trips (`bunkai*update*module`, then `bunkai*move*module`). Each RPC is atomic internally, but the two calls are separate PostgREST requests = separate transactions. If the move failed (45003 parent*invalid, 45001 move*cycle, 45002 depth_exceeded, or a path collision) after the update committed, the client received an error envelope while the rename/description change had already persisted — a half-applied PATCH. Exposure was API-only: the UI always sends rename and move as separate requests.

## Fix Applied

Ratified option: ***reject the combined request*** (the alternative — a new atomic combined RPC — was declined as non-minimal).

- New pure helper `modulePatchShapeError({hasName, hasDescription, hasParent})` in `lib/modules/validation.ts` (also replaces the inline `no_fields` guard; presence semantics unchanged — `description: null` still means "clear").
- Combined rename/description+move → 422 `validation*failed`, `details.reason: 'combined*update*and*move'`, message: "Rename/description edits and a move cannot be combined in one request — send them as separate PATCH calls."
- OpenAPI updated: `parent*module*id` documented as mutually exclusive with `name`/`description` (field, operation, and 422 descriptions). Note: this narrows the previously advertised contract — external bearer-token consumers combining the fields now get 422 by design.

PR #37 (merged to staging, deploy verified).

## Verification Performed

- Unit: full shape matrix in `lib/modules/validation.test.ts` (no_fields / each field alone / rename+description legal / every combined-with-move shape rejected). Suite 237/237 green.
- Staging smoke (zero data writes): PATCH with `{name, parent*module*id`} → 422 `combined*update*and_move`; single-purpose rename PATCHes still 200.

## How to Verify

PATCH a module with `{"name":"X","parent*module*id":"<other-module-id>"`} → 422 `combined*update*and_move`, and confirm neither the rename nor the move persisted. Separate rename-only and move-only PATCHes keep working.

**Fix ready for QA verification.**

---

### Ely - 6/25/2026, 8:59:31 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | `PATCH /api/v1/modules/{id`} combinando rename+move; operación sobre el árbol de módulos. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Defecto de API en el entorno de pruebas estándar (Staging). |
| Severity | Moderada | Riesgo latente: la UI separa las operaciones, así que hoy no se dispara, pero la API permite un request combinado que puede aplicarse a medias. Hay workaround (la UI ya evita el caso). |
| Priority | Medium | Alineada a Severity Moderada. |
| Error Type | Data | El síntoma es pérdida de atomicidad entre dos `rpc()` → estado inconsistente / aplicación parcial de datos del módulo. |
| Root Cause | Code Error | El handler ejecuta dos llamadas `rpc()` (`bunkai*update*module` + `bunkai*move*module`) no atómicas entre sí; falta envolver en una transacción o rechazar el request combinado. Causa en código establecida. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---

### Nahuel Gomez - 7/6/2026, 5:50:42 PM

1. 

Module PATCH evidence attached (JSON). Single-field updates atomic (200). Combined rename+move requires second module for full E2E.

---


_Synced from Jira by sync-jira-issues_
