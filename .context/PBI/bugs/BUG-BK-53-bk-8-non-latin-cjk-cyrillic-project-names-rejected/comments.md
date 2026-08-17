# Comments for BK-53

[View in Jira](https://jira.upexgalaxy.com/browse/BK-53)

---

### Automation for Jira - 6/10/2026, 5:36:43 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:37:09 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:41:27 PM

## Root Cause Analysis

Two stacked ASCII-only layers in the shared slug helper rejected non-Latin names:

1. `hasAlphanumeric` was `/[a-z0-9]/i` — a CJK/Cyrillic name (zero ASCII alphanumerics) failed the guard with 422 `name*no*alphanumeric`.
2. Even past that, `slugify` strips every non-ASCII character, so CJK/Cyrillic input slugified to `''` and tripped the same error via the slug-length check.

The same defect propagated to module create and module rename (same shared helper).

## Fix Applied

- `hasAlphanumeric` is now Unicode-aware: `/[\p{L}\p{N}]/u` (letters/numbers in any script; emoji/symbol-only names still rejected).
- New `slugifyWithFallback(name, prefix, minLength)`: returns the real `slugify(name)` when it meets the minimum length; otherwise a deterministic ASCII fallback `<prefix>-<fnv1a32hex>` hashed from the trimmed, NFKC-normalized, lowercased name (no new dependencies; determinism preserves duplicate-name → 409 semantics; whitespace variants of the same name produce the same slug).
- Wired into: projects POST (`'project'`, min 3), module create + rename (`'module'`, min 1), and the three UI slug previews (preview shows exactly what gets stored).
- Ratified decision: deterministic generated fallback (option a) over transliteration or Unicode-preserving slugs.
- Noted widenings: module routes ride the same fix (same root cause, slightly beyond the written repro scope); ASCII names with a 1–2 char derived slug now get a fallback instead of 422 on the project route.

PR #36 (merged to staging, deploy verified).

## Verification Performed

- Unit: `hasAlphanumeric` true for 日本語プロジェクト / Проект / 中文123 / éé, false for `!!!` / whitespace / emoji-only; `slugifyWithFallback` Latin passthrough, CJK → `project-[0-9a-f]{8`}, determinism + trim-parity; module-name Unicode regressions in `lib/modules/path.test.ts`. Full suite 227/227 green.
- Staging smoke (zero residue): POST with name `日本語プロジェクト` + an oversized description → 422 `description*too*large` — i.e. the request passed the name guards (pre-fix it failed with `name*no*alphanumeric`) and was stopped only by the unrelated, deliberate size guard. No data created.

## How to Verify

Create a project named `日本語プロジェクト` (or `Проект Бункай`) → 201, slug like `project-a1b2c3d4`, project usable end-to-end. Same for module create/rename with non-Latin names. `Café Münchën` still derives `cafe-munchen` (accent-stripping path unchanged).

**Fix ready for QA verification.**

---

### Ely - 6/25/2026, 8:59:27 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | Validación del nombre en la ruta de creación de proyectos. Es jerarquía de proyectos/módulos. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Reproducido en `staging-upexbunkai.vercel.app` (API /api/v1). |
| Severity | Menor | Impacto de i18n/usabilidad: nombres CJK/Cirílico se rechazan, pero los nombres Latinos funcionan; afecta a un subconjunto de usuarios sin bloquear el flujo principal. |
| Priority | Low | Alineada a Severity Menor. |
| Error Type | Functional | Regla de validación incorrecta (no es defecto visual ni de contenido). |
| Root Cause | Code Error | Confirmado: `hasAlphanumeric` usa clase ASCII `[a-z0-9]`; las letras no latinas fallan y `slugify` las vaciaría. Causa en código establecida. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---


_Synced from Jira by sync-jira-issues_
