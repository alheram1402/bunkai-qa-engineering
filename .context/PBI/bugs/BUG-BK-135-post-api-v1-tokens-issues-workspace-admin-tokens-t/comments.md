# Comments for BK-135

[View in Jira](https://jira.upexgalaxy.com/browse/BK-135)

---

### Automation for Jira - 6/21/2026, 8:53:50 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/21/2026, 9:25:05 AM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/21/2026, 9:27:12 AM

Fix merged to staging and deployed. Ready for QA.

PR: [https://github.com/upex-galaxy/upex-bunkai-tms/pull/51](https://github.com/upex-galaxy/upex-bunkai-tms/pull/51) (merged, commit dcdaf45)
Branch: fix/BK-135-pat-issuance-role-gate

## What changed (see ADR-0005)

- POST /api/v1/tokens now role-gates scopes: workspace:admin requires an explicit workspace*id AND caller admin/owner in that workspace; any workspace*id requires active membership. Otherwise 403.
- /api/v1/auth/signin and /auth/signup no longer default to workspace:admin and reject an explicit workspace:admin scope with 403 (this was the source of the auto-minted global admin tokens).
- Remediation migration 0033 applied to the database: active workspace:admin tokens went from 176 to 0 (scope-stripped; tokens stay valid for their remaining scopes — non-disruptive).

## QA test scenarios

1. As a member-role user, POST /api/v1/tokens with scopes:["workspace:admin"] (workspace-scoped or not) -> expect 403.
2. As an admin/owner, POST /api/v1/tokens with scopes:["workspace:admin"] + workspace_id of that workspace -> expect 201.
3. POST /api/v1/auth/signin without pat_scopes -> returned token must NOT contain workspace:admin.
4. POST /api/v1/auth/signin with pat_scopes including workspace:admin -> expect 403.
5. POST /api/v1/tokens with a workspace_id the caller is not a member of -> expect 403.

Note: this unblocks QA of [https://jira.upexgalaxy.com/browse/BK-88#icft=BK-88](https://jira.upexgalaxy.com/browse/BK-88#icft=BK-88). Remaining out-of-scope follow-up: consumption-side enforcement of the workspace:admin scope (separate ticket, noted in ADR-0005).

---

### Ely - 6/25/2026, 9:01:10 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componentes | Tenancy & Identity | El defecto está en POST /api/v1/tokens (emisión de PAT y enforcement de scopes por rol): dominio de autenticación/identidad. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Severidad | Crítica | Escalada de privilegios: un usuario member emite tokens workspace:admin sin 403. Confirmado a escala (136 PATs admin activos, 24 usuarios). |
| Prioridad | Highest (ajustada desde Medium) | Medium subestimaba un fallo de autorización crítico; alineada a severidad Crítica. |
| Tipo de error | Security | Falla de control de acceso que permite obtener privilegios admin sin autorización. |
| Causa raíz | Code Error | No hay enforcement de restricción de scope por rol en la ruta de creación de tokens (gap en código). |
| Entorno | Staging | Confirmado vía DB de staging (2026-06-12). |
| Frecuencia | (sin cambios) | Campo no tocado por política. |

---

### Carlos Alberto Chiavassa - 6/28/2026, 8:33:51 AM

## Verificación en capa de datos (DBHub) — 2026-06-28

Confirmado el fix de la migración 0033 contra staging:

***Tokens con scope**** `workspace:admin`****:*** 0 (activos y totales) — objetivo post-migración cumplido (de 176 → 0).

***Scopes legítimos intactos*** (tokens activos):

- atc:read: 246
- atc:write: 235
- run:execute: 232
- workspace:admin: 0 (purgado)

Migración quirúrgica: eliminó workspace:admin sin daño colateral a los scopes válidos. Sumado al retest funcional previo (signin/signup rechazan emisión de admin por headless con 403), el fix queda verificado funcional + en datos.

---


_Synced from Jira by sync-jira-issues_
