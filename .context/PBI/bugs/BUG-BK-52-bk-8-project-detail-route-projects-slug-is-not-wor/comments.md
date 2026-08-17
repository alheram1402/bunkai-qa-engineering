# Comments for BK-52

[View in Jira](https://jira.upexgalaxy.com/browse/BK-52)

---

### Automation for Jira - 6/10/2026, 5:36:43 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:37:09 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:41:25 PM

## Root Cause Analysis

Four server-side sites resolved a project by slug only — `.from('projects').eq('slug', slug).limit(1)` with ***no workspace filter****: the project detail page, the ATC editor page, the new-ATC page, and the tree-view ATC detail action. The DB enforces slug uniqueness ****per workspace*** (`unique(workspace_id, slug)`), so a member of two workspaces can have 2+ rows for one slug; `.limit(1)` with no ordering returned an arbitrary row, and a slug existing only in WS2 resolved while WS1 was active. A code comment documented this as a knowingly deferred MVP shortcut that was never paid down after multi-workspace shipped.

## Fix Applied

- New pure helper `lib/workspaces/active.ts`: `resolveActiveWorkspaceId(cookieValue, visibleWorkspaceIds)` — the cookie's workspace when visible, else the first visible, else null.
- All four resolution sites now filter `.eq('workspace_id', activeWorkspaceId)`; when resolution is impossible they 404 (pages) / return null (action), per each site's existing contract.
- The three pre-existing inline copies of this resolution (app layout, projects list, `/api/v1/me`) were consolidated onto the helper — behavior-preserving.
- Ratified scope decision: URL shape stays `/projects/{slug`} scoped to the ***active workspace***; canonical workspace-scoped URLs (`/workspaces/{ws}/projects/{slug`}, AC step 9 wording) deferred as a future ADR candidate.

PR #36 (merged to staging, deploy verified).

## Verification Performed

- Unit: `lib/workspaces/active.test.ts` (cookie-visible / stale-cookie fallback / null cookie / empty list → null / first-element fallback). Full suite 227/227 green.
- Staging smoke: `/projects/smoke-checkout` resolves HTTP 200 under its owning active workspace; `/api/v1/me` returns the correct `active*workspace*id` after the helper consolidation.

## How to Verify

With membership in two workspaces and a project slug present only in workspace B: while workspace A is active, `/projects/{that-slug`} must 404; after switching to workspace B it must resolve. Two same-named projects (same slug) in both workspaces must each show their own content per the active workspace — breadcrumb workspace name must always match the active one.

**Fix ready for QA verification.**

---

### Ely - 6/25/2026, 8:59:26 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | La ruta de detalle `/projects/{slug`} no está scopeada por workspace; afecta direccionabilidad/navegación de proyectos. Es jerarquía de proyectos/módulos. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Reproducido en `staging-upexbunkai.vercel.app` con usuario miembro de dos workspaces. |
| Severity | Mayor | Un usuario multi-workspace no puede alcanzar todos sus proyectos: el mismo slug en dos workspaces deja uno inaccesible. Funcionalidad importante rota (no hay fuga cross-tenant, RLS protege). |
| Priority | High | Alineada a Severity Mayor. |
| Error Type | Functional | Defecto de resolución de ruta/navegación, comportamiento funcional. |
| Root Cause | Code Error | La URL de detalle omite el workspace, por lo que la resolución de slug cruza el límite del workspace activo. Causa en código establecida por la descripción. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---


_Synced from Jira by sync-jira-issues_
