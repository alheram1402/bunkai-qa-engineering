# Comments for BK-142

[View in Jira](https://jira.upexgalaxy.com/browse/BK-142)

---

### Ely - 6/21/2026, 7:57:02 AM

## 🔧 Fix applied — environment configuration (no code change)

> ***NOTE:**** This was ****not*** a UI/API defect. Root cause is environment configuration: the Jira integration credentials were missing from the deployment runtime.

### Root cause (confirmed)

`Config/Env Error`. The credentials `ATLASSIAN*URL`, `ATLASSIAN*EMAIL`, `ATLASSIAN*API*TOKEN` were ***absent from every Vercel scope**** on project `upex-bunkai-tms`. The import worker reads them at runtime (`lib/jira/client.ts:120` → `searchIssues()`), so every job threw `JiraAuthError('Jira credentials are not configured.')` → `jira_unauthorized`. The credential ****values*** were never the problem (already proven `200 OK` against Jira Cloud in the report).

### Why the earlier QA attempt didn't stick

The `staging` deployment runs under a Vercel ***Custom Environment named**** `staging` (bound to the `staging` branch) — ****not**** the generic `Preview` scope. Vars added to "Preview" never reached the staging runtime. Verified before this fix: `ATLASSIAN_**` existed in ***zero*** scopes.

### Fix

| ***Variable**** | ****Scopes set**** | ****Encrypted*** |
| --- | --- | --- |
| ATLASSIAN_URL | Production, staging (custom env) | yes |
| ATLASSIAN_EMAIL | Production, staging (custom env) | yes |
| ATLASSIAN*API*TOKEN | Production, staging (custom env) | yes |

Set via `vercel env add` (values sourced from the project `.env`, never hardcoded).

### Deployment

Redeployed the latest `staging` deployment so the new vars are injected → new deployment `target=staging`, status ***Ready***. Credentials are now live in the staging runtime.

### Notes

- ***Production scope*** set too; it takes effect on the next `main` promotion (no forced prod redeploy was requested).
- ***Generic**** `Preview` ****scope**** could not be set non-interactively (Vercel CLI 54.5 loops on the "all-preview-branches vs specific-branch" prompt in agent mode). Does ****not*** affect staging or production. Follow-up only if feature-branch previews must exercise the Jira import.

### For QA

Ready to re-run the [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) import flow on staging (the 6-job `jira_unauthorized` repro). No application code shipped — purely environment configuration.

---

### Andrés Daniel Cumare Morales - 6/21/2026, 4:23:51 PM

## Retest Result: PASS

***Date:*** 2026-06-21
***Environment:*** Staging (`staging-upexbunkai.vercel.app`)
***Tester:*** QA (automated session)

### Verification

| ***Step**** | ****Action**** | ****Expected**** | ****Actual**** | ****Status*** |
| --- | --- | --- | --- | --- |
| 1 | `POST /api/v1/imports` with `{project*id, jql: "key in (BK-8, BK-9)"`} | 202 `{status: "queued"`} | 202 `{import*job*id: "88cb5749-...", status: "queued"`} | :white*check_mark: PASS |
| 2 | Poll `GET /api/v1/imports/{id`} after 5s | `status: "completed"`, `errors: []` | `{status: "completed", imported*count: 2, created*count: 2, updated*count: 0, errors: []`} | :white*check_mark: PASS |

### Conclusion

Staging `ATLASSIAN**` credentials are now properly configured. Import jobs complete successfully — no `jira*unauthorized` errors. The 10+ day regression window (2026-06-09 to 2026-06-21) is closed.

***Verdict:**** ****ReTest PASSED*** — closing this bug. [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) Stage 2 execution can resume.

---

### Ely - 6/25/2026, 9:01:12 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componentes | User Stories & Acceptance Criteria | El defecto pertenece a la importación Jira ([https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17)), cuya story padre cuelga del épica [https://jira.upexgalaxy.com/browse/BK-12#icft=BK-12](https://jira.upexgalaxy.com/browse/BK-12#icft=BK-12) (User Stories & AC); se mapea por consistencia con ese módulo. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Severidad | Crítica | Bloquea por completo [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17): 21 de 22 outlines de ATP no ejecutables en staging; todo job de import falla. |
| Prioridad | Highest (ajustada desde Medium) | Medium subestimaba un bloqueo total de feature; alineada a severidad Crítica. |
| Tipo de error | Integration | El síntoma es el fallo de la integración con Jira (jira_unauthorized) en el worker de importación. |
| Causa raíz | Configuration Error | El ticket lo establece a nivel código: ATLASSIAN*URL/EMAIL/API*TOKEN ausentes en el deployment de staging (vars opcionales sin setear), no un bug de lógica. |
| Entorno | Staging | 6 jobs consecutivos confirmados en staging. |
| Frecuencia | (sin cambios) | Campo no tocado por política. |

---


_Synced from Jira by sync-jira-issues_
