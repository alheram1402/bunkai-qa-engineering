# Comments for BK-59

[View in Jira](https://jira.upexgalaxy.com/browse/BK-59)

---

### Automation for Jira - 6/10/2026, 5:50:38 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 5:50:54 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 5:53:53 PM

## Root Cause Analysis

The three SECURITY DEFINER module-mutation RPCs (`bunkai*update*module`, `bunkai*archive*module*subtree` — 0014; `bunkai*move*module` — 0015) contained no `activity*log` insert, so module rename/move/soft-delete left no audit trail. The route layer cannot compensate: `activity_log` deliberately has no client INSERT policy (0009), and the modules route uses a user-scoped client on both auth paths. The only sanctioned write path is an in-function DEFINER insert — the precedent established by 0021 for ATC events.

## Fix Applied

Migration `0023*module*activity_log.sql` (applied to the remote project and mirrored in the repo) re-creates the three functions with one audit insert each, atomic with the mutation (single plpgsql transaction — denied/failed calls roll the audit row back):

| ***Action**** | ****Payload*** |
| --- | --- |
| `module.renamed` | `{name, old*path, new*path`} |
| `module.description_updated` | {{{}}} (no content leak) |
| `module.moved` | `{old*path, new*path, old*parent*id, new*parent*id`} |
| `module.archived` | the per-table archived counts the RPC returns |

- `entity*type` = `module`, `entity*id` = module id, `workspace_id` = owning workspace, actor = `auth.uid()` (user-scoped client on both auth paths; role-gate guarantees non-null on success).
- No-op paths (same-parent move, already-archived subtree) emit nothing.
- Function signatures unchanged (no typegen); bodies otherwise identical to 0014/0015 (review-verified).
- Scope note: module CREATE is intentionally not audited — it is a direct RLS table insert, not an RPC; auditing it would require converting the create path (follow-up candidate, out of this bug's title scope).
- Taxonomy documented in `.context/business/events.md` (Module events section).

PR #37 (merged to staging, deploy verified). Sequencing: applied on the freshly normalized ledger ([https://jira.upexgalaxy.com/browse/BK-58#icft=BK-58](https://jira.upexgalaxy.com/browse/BK-58#icft=BK-58)), so the `0023*module*activity_log` row landed clean.

## Verification Performed

- Staging smoke via the live API (user-scoped path): rename round-trip on the smoke workspace module produced exactly two `module.renamed` rows with non-null actor and correct `{name, old*path, new*path`} payloads (`payments` → `payments-smoke` → `payments`); module restored to its original state — the only residue is the genuine audit evidence of the smoke itself.
- Combined-PATCH rejection ([https://jira.upexgalaxy.com/browse/BK-57#icft=BK-57](https://jira.upexgalaxy.com/browse/BK-57#icft=BK-57)) confirmed no audit row is written when the request is rejected.

## How to Verify

Rename, move, or soft-delete a module, then read the workspace's `activity_log` (workspace members have SELECT via RLS): one row per mutation with the payloads above; repeated no-ops (same-parent move, re-archive) add no rows.

**Fix ready for QA verification.**

---

### Ely - 6/25/2026, 8:59:34 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Project & Module Hierarchy | Faltan escrituras a `activity_log` en las rutas de mutación de módulos (rename/move/soft-delete). Dominio de módulos. |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Test Environment | Staging | Entorno estándar; afecta rutas de mutación de módulos. |
| Severity | Menor | Mejora/tech-debt: no hay malfuncionamiento actual; falta la traza de auditoría (quién cambió el árbol y cuándo). Importante para un TMS pero sin bloquear flujo. |
| Priority | Low | Alineada a Severity Menor. |
| Error Type | Functional | Funcionalidad faltante (no se escribe el audit trail), no visual ni de contenido. |
| Root Cause | Code Error | La tabla `activity_log` existe (migración 0009) pero las escrituras se omitieron para el MVP; el arreglo es añadir las escrituras en las rutas de mutación. Causa establecida en la descripción. |
| Frequency | (sin tocar) | Fuera de alcance de esta curación. |

---


_Synced from Jira by sync-jira-issues_
