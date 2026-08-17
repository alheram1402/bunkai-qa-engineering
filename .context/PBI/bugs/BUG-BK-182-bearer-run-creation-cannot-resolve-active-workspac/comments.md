# Comments for BK-182

[View in Jira](https://jira.upexgalaxy.com/browse/BK-182)

---

### Ely - 6/25/2026, 8:59:46 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Manual Execution & Runs | Conservado (ya estaba). El defecto es la creación de Runs vía POST /api/v1/runs (historia [https://jira.upexgalaxy.com/browse/BK-39#icft=BK-39](https://jira.upexgalaxy.com/browse/BK-39#icft=BK-39)). Validado como correcto. |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado a gestión de defectos. |
| Entorno de prueba | Staging | Indicado en la descripción. |
| Severidad | Moderada | Conservada. La creación de Runs con Bearer/PAT falla, pero existe workaround vía cookie-session y el finish con Bearer funciona; bloquea solo el flujo API-first de automatización. |
| Prioridad | Medium | Alineada a Severidad Moderada. |
| Tipo de error | Integration | Conservado. Falla la resolución de contexto de workspace entre la capa de auth Bearer/PAT y el endpoint de Runs. |
| Causa raíz | Integration Error | Conservada. El resolver de active-workspace para Bearer/PAT no resuelve el workspace pese a membresía y scope válidos (contrato roto entre auth y POST /runs). |
| Frecuencia | Siempre (no modificada) | Campo preexistente; respetado sin cambios por instrucción. |

---

### jesusgpythondev - 7/4/2026, 3:09:23 PM

## Evidence attachments - [https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182](https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182)

> ***INFO:*** Scope: this comment only indexes evidence attachments for the existing [https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182](https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182) report. It does not modify the bug description, status, priority, or workflow classification.

Classification: ***QA-formal product defect*** represented operationally as Jira issue type `Bug` in the current UPEX BUG/DEFECT LIFE CYCLE.

### Evidence 01 - Bearer /api/v1/me resolves active workspace

Fresh PAT sign-in produced a Bearer token with `run:execute`. `GET /api/v1/me` returned HTTP 200, user `bunkai-staging-user@xenievzoau.resend.app`, active workspace `545d5efe-a168-4f32-a4be-a148a2fc96db`, role `owner`, and scopes `atc:read, atc:write, run:execute`.



### Evidence 02 - Bearer POST /api/v1/runs fails workspace resolution

Using the same auth model and [https://jira.upexgalaxy.com/browse/BK-39#icft=BK-39](https://jira.upexgalaxy.com/browse/BK-39#icft=BK-39) fixtures, `POST /api/v1/runs` returned HTTP 422 with `validation_failed`: `No active workspace could be resolved for this request.` Request ID: `4500785d-2e04-4a80-b0e4-50529d1c7edc`.



Security note: token/password values are intentionally omitted from images and this comment.

---

### Automation for Jira - 7/31/2026, 12:12:25 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 7/31/2026, 12:31:05 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 7/31/2026, 3:08:13 PM

## QA Handoff — [https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182](https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182)

***PR:*** [#76](https://github.com/upex-galaxy/upex-bunkai-tms/pull/76) (`fix/BK-182-bearer-run-creation-workspace` -> `staging`), merged `5316d96` (2026-07-31T18:30:59Z).

***Root cause:*** `app/api/v1/runs/route.ts`'s workspace-resolution fallback only ran for cookie sessions (gated behind `principal.via === 'cookie'`), so a Bearer/PAT caller with a non-workspace-scoped token had no fallback path at all and fell through to `No active workspace could be resolved for this request.`. `/api/v1/me` already resolved this correctly for both auth methods.

***Fix:*** extracted `resolveRunWorkspaceId`, dropped the cookie-only gate, reuses the existing null-cookie fallback from `resolveActiveWorkspaceId`. No new fallback logic was written.

***Regression coverage:*** `app/api/v1/runs/route.test.ts`, 7/7 passing.

***Suggested QA re-check on staging:*** repeat this bug's own repro steps 1-4 with a Bearer PAT that has `run:execute` but no workspace-scoped token. `POST /api/v1/runs` should now succeed (or return a specific membership/scope error) instead of the blanket 422 `No active workspace could be resolved for this request.`. Cookie-session Run creation (already working) should show no regression.

***Stage 3 review:*** APPROVE WITH NITS — 0 BLOCKER, 0 MAJOR, 1 NIT (3 positional params vs. this repo's 2-param convention; dismissed, matches existing precedent in `lib/jira/import-runner.ts`). Security traced end-to-end: `workspaceId` only namespaces the Idempotency-Key row, never reaches the RPC, which re-derives/re-validates workspace membership itself from `test_id`.

***Assignee:*** left as-is (`jesusgpythondev`, the reporter). No distinct shift-left QA owner is named anywhere on this bug report's comment trail (unlike the shift-left-refined stories in this same batch) — the reporter already doubles as the person who supplied this bug's own evidence, matching the same shape and resolution already applied to [https://jira.upexgalaxy.com/browse/BK-118#icft=BK-118](https://jira.upexgalaxy.com/browse/BK-118#icft=BK-118) in this run.

---


_Synced from Jira by sync-jira-issues_
