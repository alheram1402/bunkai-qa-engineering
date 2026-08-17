# Comments for BK-68

[View in Jira](https://jira.upexgalaxy.com/browse/BK-68)

---

### Automation for Jira - 6/10/2026, 6:18:32 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 6:18:33 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 6:34:20 PM

## Root Cause Analysis

The Create Module form's submit gate only checked non-empty input (`name.trim().length > 0`), while the API enforces `MIN*NAME*LENGTH = 2` — so a 1-character name enabled Submit and burned a server round-trip just to receive the 422 `name*too*short`.

## Fix Applied — already fixed before this pass

This was structurally fixed on ***2026-06-08*** (two days after the report) by commit `df47918` — "fix(forms): align client min-length validation with the server":

```
- const isValid = name.trim().length > 0 && !submitting;
+ const isValid = trimmedName.length >= 2 && !submitting;
```

The Submit button is now disabled until the trimmed name reaches 2 characters, matching the server constraint — the Expected Result's "disable submit" option. No additional code change was needed in this pass; the current staging build (PRs #36/#37 era) carries the fix.

## Verification Performed

- Code verified on current `staging`: `create-module-form.tsx` gates `isValid = trimmedName.length >= 2 && !submitting` and the button binds `disabled={!isValid`}.
- Full suite green on staging HEAD (243/243).

## How to Verify

Open New Module, type exactly 1 character → Submit stays disabled (no server call, no 422). Type 2+ characters → Submit enables.

**Fix ready for QA verification.**

---

### Andrés Daniel Cumare Morales - 6/14/2026, 1:50:28 PM

QA Bug Verification - [https://jira.upexgalaxy.com/browse/BK-68#icft=BK-68](https://jira.upexgalaxy.com/browse/BK-68#icft=BK-68)

Environment: Staging
Result: VERIFIED - Bug fix confirmed

TEST DATA USED:

- Project: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) Module Test Project (ID: ae10a3bd-574f-4caf-8076-f19a8e80f5a6)

VERIFICATION:

- Original bug scenario: No longer reproduces. Typing a 1-character name ("X") into the create-module name field no longer allows submission.
- Expected behavior: Now works correctly. The form shows the inline validation message "Name must be at least 2 characters." and disables the "Create module" submit button.
- Regression check: No issues found. Typing a 2-character name ("XY") clears the validation message, re-enables the submit button, and the create succeeds end-to-end (API returns 201).

---

### Ely - 6/25/2026, 9:00:24 PM

## 🤖 Curación de campos QA (estándar Bunkai)

Curación automática de campos QA según el estándar Bunkai. Justificación:

| ***Campo**** | ****Valor aplicado**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | Sin Epic Link previo. Inferido del contenido: validación del formulario de creación de módulos (relacionado a [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9)), dominio de Proyectos y Jerarquía de Módulos. |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al epic de gestión de defectos. |
| Test Environment | Staging | El ticket indica entorno staging. |
| Severity | Menor | Solo provoca un round-trip extra al servidor y mala UX (error 422 en vez de feedback inline). Sin pérdida de datos ni bloqueo. |
| Priority | Low | Alineada a Severity Menor. |
| Error Type | Functional | Validación cliente insuficiente (`length > 0` en vez de `>= 2`). |
| Root Cause | Code Error | Causa establecida: chequeo `isValid` en `create-module-form.tsx` línea 90 solo valida no-vacío. |

Ningún campo quedó en blanco.

---


_Synced from Jira by sync-jira-issues_
