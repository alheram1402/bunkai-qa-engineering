# Comments for BK-51

[View in Jira](https://jira.upexgalaxy.com/browse/BK-51)

---

### Automation for Jira - 6/10/2026, 5:36:43 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:37:09 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:41:22 PM

## Root Cause Analysis

POST `/api/v1/workspaces/{id}/projects` had no reserved-slug guard anywhere in its pipeline — the only such guard lived in the workspace create route and was never replicated or shared. The AC-11 agreed 18-word reserved list (ratified in the [https://jira.upexgalaxy.com/browse/BK-8#icft=BK-8](https://jira.upexgalaxy.com/browse/BK-8#icft=BK-8) Dev Q8 comment) was never implemented, so names like `api` / `new` / `settings` passed every existing check and returned 201.

## Fix Applied

- New pure helper `lib/projects/validation.ts`: `RESERVED*PROJECT*SLUGS` (the exact AC-11 18-word list — deliberately separate from the workspace route's list, different collision surface) + `isReservedProjectSlug()`.
- The route now rejects on the ***final derived slug*** (so `API`, {{ New }}, `Settings!` are caught) with 422 `validation*failed` and `details.reason: 'slug*reserved'` — the route's established hybrid error model. Note: the Dev Q8 comment had proposed a top-level `400 SLUG_RESERVED`; the shipped shape follows this bug's Expected Result and the route's contract.
- Create-project form maps `slug_reserved` to the design-ratified copy: "This name is reserved. Try a different one."
- OpenAPI descriptions updated.

PR #36 (merged to staging, deploy verified).

## Verification Performed

- Unit: table-driven suite over all 18 words + slugify-derivation cases + near-miss negatives (`api-tests`, `newest`, …) + list-parity guard (`size === 18`). Full suite 227/227 green.
- Staging smoke (zero residue — 422s create nothing): `{"name":"api"`} → 422 `slug*reserved`; `{"name":"Settings!"`} → 422 `slug*reserved`.

## How to Verify

POST `/api/v1/workspaces/{your-ws-id}/projects` with `{"name":"api"`} (or any AC-11 word, any casing/punctuation that derives it) → 422 with `details.reason = "slug_reserved"`; the create-project form shows the reserved-name message. Non-reserved names still create normally.

**Fix ready for QA verification.**

---

### Ely - 6/25/2026, 8:59:25 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | El defecto vive en `app/api/v1/workspaces/[id]/projects/route.ts`: falta validación de slugs reservados al crear proyectos. Es jerarquía de proyectos/módulos. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Reproducido en `staging-upexbunkai.vercel.app` (API /api/v1). |
| Severity | Mayor | Slugs reservados (`api`, `new`, `settings`, {{admin}}…) colisionan con segmentos de ruta de Next.js; AC-11 falla y proyectos quedarían inaccesibles. Funcionalidad principal rota sin workaround claro. |
| Priority | High | Alineada a Severity Mayor. |
| Error Type | Functional | Validación ausente: comportamiento funcional incorrecto, no visual/contenido. |
| Root Cause | Code Error | Confirmado en código: la guarda de slug reservado existe sólo en la ruta de workspaces; `SLUG*RESERVED` ni siquiera está en `API*ERROR_CODES`. Causa de origen establecida. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---


_Synced from Jira by sync-jira-issues_
