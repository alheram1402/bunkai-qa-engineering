# Comments for BK-67

[View in Jira](https://jira.upexgalaxy.com/browse/BK-67)

---

### Automation for Jira - 6/10/2026, 5:50:38 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:50:54 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:53:56 PM

## Root Cause Analysis

Pure UI bug in the create-module form's 201 handler. The API correctly returns 201 with the created module AND an additive `warning` string when the resulting depth is ≥ 5 (threshold 5, max depth 6). The client treated `warning` as mutually exclusive with success: {{if (body.warning) { toast.warning(...) } else { toast.success('Module created') }}} — so every successful create at depth 5–6 showed only the advisory and never the positive confirmation. The module was created and the tree refreshed; only the success feedback was suppressed. Single occurrence — no other surface has this pattern.

## Fix Applied

- New pure helper `moduleCreateToasts(warning?)` in `lib/modules/validation.ts`: always returns the success toast first, appends the warning toast only when the advisory is a non-empty string.
- The form maps the helper output to the sonner calls — success always fires, the depth advisory is additive. No API/OpenAPI/DB change (server contract was already correct).

PR #37 (merged to staging, deploy verified).

## Verification Performed

- Unit (`lib/modules/validation.test.ts`): no warning → exactly one success toast; warning present → success FIRST then warning verbatim; empty string → success only; ordering invariant `result[0].kind === 'success'` for every input (the suppression bug cannot reappear via reordering). Suite 237/237 green.

## How to Verify

Create a module at depth 5 or 6: both toasts appear — "Module created" plus the deep-nesting advisory. Create at depth < 5: success toast only. Depth 7 still rejected (`depth_exceeded`).

**Fix ready for QA verification.**

---

### Andrés Daniel Cumare Morales - 6/14/2026, 1:50:26 PM

QA Bug Verification - [https://jira.upexgalaxy.com/browse/BK-67#icft=BK-67](https://jira.upexgalaxy.com/browse/BK-67#icft=BK-67)

Environment: Staging
Result: VERIFIED - Bug fix confirmed

TEST DATA USED:

- Project: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) Module Test Project (ID: ae10a3bd-574f-4caf-8076-f19a8e80f5a6)
- Chain: login/oauth/google/token/refresh/session

VERIFICATION:

- Original bug scenario: No longer reproduces. Created a sub-module under "Token" (depth 4), resulting in a path at depth 5.
- Expected behavior: Now works correctly. Both the "Module created" success toast AND the deep-nesting warning toast fire simultaneously, as expected.
- Regression check: No issues found. A depth-1 root module create still shows only the success toast, with no warning — unaffected by the fix.

---

### Ely - 6/25/2026, 9:00:23 PM

## 🤖 Curación de campos QA (estándar Bunkai)

Curación automática de campos QA según el estándar Bunkai. Justificación:

| ***Campo**** | ****Valor aplicado**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | Sin Epic Link previo. Inferido del contenido: defecto en el formulario de creación de módulos (`create-module-form.tsx`), dominio de Proyectos y Jerarquía de Módulos (relacionado a [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9)). |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al epic de gestión de defectos. |
| Test Environment | Staging | El ticket indica entorno staging. |
| Severity | Menor | El módulo SÍ se crea (HTTP 201); el único impacto es la falta del toast de confirmación. Impacto pequeño, sin pérdida de funcionalidad. |
| Priority | Low | Alineada a Severity Menor. |
| Error Type | Functional | Defecto de lógica `if/else`: la rama de warning suprime la rama de éxito. |
| Root Cause | Code Error | Causa establecida: `create-module-form.tsx` líneas 116-121 usa `if/else` excluyente. |

Ningún campo quedó en blanco.

---


_Synced from Jira by sync-jira-issues_
