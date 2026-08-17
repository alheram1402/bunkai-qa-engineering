# Comments for BK-58

[View in Jira](https://jira.upexgalaxy.com/browse/BK-58)

---

### Automation for Jira - 6/10/2026, 5:15:26 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:21:15 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:22:42 PM

## Root Cause Analysis

The remote `supabase*migrations.schema*migrations` ledger drifted from the repo's `supabase/migrations/` files — a process artifact, not a schema bug:

- ***3 ledger rows for one file (0014)***: during [https://jira.upexgalaxy.com/browse/BK-10#icft=BK-10](https://jira.upexgalaxy.com/browse/BK-10#icft=BK-10), each iteration of the in-flight `0014*module*soft*delete.sql` was applied via Supabase MCP `apply*migration`, which mints a new ledger row per call (`module*soft*delete`, `module*update*fn*param*defaults`, `module*update*fn*slug*guard`).
- ***Unprefixed rows***: `module*move`, `user*story*uniqueness`, `atc*create*update` lacked the repo `NNNN*` basename.
- ***Missing rows***: `0019*import*jobs` / `0020*import*jobs*one*active` existed remotely but had no ledger rows (applied outside `apply_migration`).

The remote schema itself always matched the repo end-state (verified live before repair) — drift was ledger metadata only.

## Fix Applied

Full ledger normalization in one DML transaction (scope ratified by Tech Lead):

| ***Action**** | ****Detail*** |
| --- | --- |
| Deleted 2 amendment rows | `20260604224136`, `20260604225156` — SQL fully subsumed by final 0014 file |
| Normalized surviving 0014 row | name → `0014*module*soft_delete`, `statements` → final file content |
| Renamed 3 unprefixed rows | `0015*module*move`, `0016*user*story*uniqueness`, `0021*atc*create*update` |
| Backfilled 2 missing rows | `20260607000019` / `20260607000020` with file content (synthetic in-window versions) |

Convention + repair log documented in `supabase/migrations/README.md` (PR #35, merged to staging).

## Verification Performed

- Post-repair `list_migrations`: exactly 22 rows, 1:1 with repo files `0001}}–{{0022`, all named by file basename, chronological order intact.
- Zero schema impact: repair touched only `supabase*migrations.schema*migrations` metadata; no app code, no RLS, no functions.

## How to Verify

Compare the ledger against `supabase/migrations/` filenames (e.g. Supabase MCP `list*migrations` or a dashboard query on `supabase*migrations.schema_migrations`): every row name must equal a repo file basename, one row per file, 22/22.

**Fix ready for QA verification.**

---

### Ely - 6/25/2026, 8:59:32 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | Ledger de migraciones del soft-delete de módulos (`0014*module*soft_delete`); pertenece al dominio de módulos. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Marcado Staging como entorno estándar; se trata del ledger remoto de Supabase. |
| Severity | Trivial | Tech-debt, no es defecto funcional: un `db reset` desde el repo produce el estado final correcto; sólo el ledger remoto es más ruidoso (3 entradas vs 1 archivo). Sin impacto en usuario. |
| Priority | Lowest | Alineada a Severity Trivial. |
| Error Type | Data | El síntoma es inconsistencia en el ledger de migraciones (metadatos de migración), no un fallo funcional. |
| Root Cause | Configuration Error | Se conserva el valor existente: es un asunto de despliegue/manifiesto de migraciones (consolidar/documentar el ledger), corregible por configuración y no por código de la app. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---


_Synced from Jira by sync-jira-issues_
