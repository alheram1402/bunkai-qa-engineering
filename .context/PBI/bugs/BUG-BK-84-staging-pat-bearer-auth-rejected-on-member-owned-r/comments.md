# Comments for BK-84

[View in Jira](https://jira.upexgalaxy.com/browse/BK-84)

---

### Ely - 6/10/2026, 9:37:16 AM

## 🔧 Bug Fix Documentation

> ***SUCCESS:**** ****Already fixed and verified on staging.*** The defect was resolved by the unified auth gateway (ADR-0001) merged on 2026-06-08 — one day AFTER this bug was reported (2026-06-07). Live re-verification on staging (2026-06-10) confirms every affected route now accepts PAT bearer auth.

### Root Cause Analysis

***Category:*** Code Error
***Location:*** `lib/api/` route-handler tier (pre-fix state)

Bearer (PAT) support was wired ***per-handler instead of as a project invariant****. Only 4 handlers called the bearer-aware `requireAuth()` (GET /me, GET /workspaces, POST/PATCH /atcs). The remaining ~29 handlers across 18 route files called `createClient().auth.getUser()` directly — that helper reads ONLY the Supabase SSR session cookie and ****silently ignores the Authorization header***, so any PAT caller got `401 unauthorized`. This matches the reporter's hypothesis (a): an effective identity-tier allowlist. It was NOT a scope mismatch — scopes were never evaluated on those routes.

### Fix Applied

***Commit:*** `226fc9d` — `feat(api): route all endpoints through the unified auth gateway` (merged to `staging` 2026-06-08, deployed)
***Decision record:*** `ADR-0001-unified-api-authentication.md`
***Fix Type:*** Bugfix (structural)

| ***Mechanism**** | ****What it does*** |
| --- | --- |
| `resolveIdentity()` → `Principal` | Single normalizer: bearer-first, cookie fallback — both collapse into one identity object |
| `withApiHandler({ auth: 'required' })` | Secure-by-default wrapper on EVERY /api/v1 route; `auth: 'public'` is an explicit opt-out |
| Impersonating client | PAT callers get a short-lived user-scoped JWT so RLS (`auth.uid()`) applies identically to both auth methods |
| ESLint ban | `createClient().auth.getUser()` forbidden in `app/api/**` — the bug class cannot silently recur |

***Deliberate exceptions (PAT rejected by design, not bugs):*** POST /tokens + DELETE /tokens/{id} (a PAT must not mint/revoke PATs — privilege escalation) and POST /invites/accept (browser-session flow).

### Verification Performed (staging, 2026-06-10)

Fresh PAT minted via browser-session flow, then exercised with `Authorization: Bearer` only (mutating routes probed with intentionally invalid bodies so auth outcome is observable without creating data):

| ***Route**** | ****Before**** | ****Now**** | ****Meaning*** |
| --- | --- | --- | --- |
| GET /api/v1/me | 200 | 200 | control |
| GET /api/v1/workspaces | 200 | 200 | control |
| GET /api/v1/tokens | 401 | ***200*** | fixed |
| POST /api/v1/me/active-workspace | 401 | ***200*** | fixed |
| POST /api/v1/imports (invalid body) | 401 | ***422 validation_failed*** | auth layer passed |
| GET /api/v1/imports/{unknown-id} | 401 | ***404 not_found*** | auth layer passed |
| POST /api/v1/workspaces/{id}/projects (invalid body) | 401 | ***422 validation_failed*** | auth layer passed |
| POST /api/v1/projects/{id}/modules (invalid body) | 401 | ***422 validation_failed*** | auth layer passed |

Verification PAT was revoked after the run (204).

### How to Verify

1. `POST /api/v1/auth/signin` with valid staging credentials → take `pat.token`
2. Call any previously failing route with `Authorization: Bearer <pat>` — e.g. `GET /api/v1/tokens`
3. ***Expected:*** 200 (or domain-level 4xx), never `401 {"code":"unauthorized"`}
4. [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) Jira-Import ATP (22 outlines) is now executable via PAT

### Related

- ***BK-92 / BK-93*** are duplicates of this defect (same root cause, reported pre-fix) — closed as Duplicated, linked here.
- ***Known limitation (tracked separately, BK-97):*** per-route PAT capability enforcement on non-ATC routes is deferred — a narrowly-scoped PAT currently gets full member access on those routes (auth = valid PAT + RLS membership). That is the ADR-0001 follow-up, not this bug.
- ***NOTE for QA:**** while re-testing we confirmed `POST /me/active-workspace` still responds `{"ok":true,"active*workspace*id":...`} ****without**** the workspace fields (id, slug, name, role) — that is bug ****BK-83***, being fixed next.

---

**Fix ready for QA verification.**

---

### Andrés Daniel Cumare Morales - 6/15/2026, 12:57:33 PM

## QA Retest — ReTest Passed

Re-ran the smoke gate against ***staging**** (`https://staging-upexbunkai.vercel.app/api/v1`) with a freshly-minted PAT (`bk*pat***`) via `POST /auth/signin`. All 6 routes that previously returned `401 "You must be signed in."` with a valid PAT now pass the auth gate:

| ***Route**** | ****Before**** | ****After*** |
| --- | --- | --- |
| `GET /me` (control) | 200 | 200 |
| `GET /workspaces` (control) | 200 | 200 |
| `GET /tokens` | 401 | 200 |
| `GET /imports/{nil-uuid`} | 401 | 404 `not_found` |
| {{POST /imports {}}} | 401 | 422 `validation_failed` |
| {{POST /projects/{id}/modules {}}} | 401 | 422 `validation_failed` |
| {{POST /me/active-workspace {}}} | 401 | 422 `validation_failed` |
| {{POST /workspaces/{id}/projects {}}} | 401 | 422 `validation_failed` |

No `401 unauthorized` responses observed on any route. Each probe used a nil-UUID path param or an empty {{{}}} body — auth resolution runs before handler validation (`lib/api/handler.ts`), so a 404/422 response confirms the auth gate passed without side effects (no import job created, no real mutation).

***Verdict:**** ****GO*** — unified auth gateway fix (commit `226fc9d`, ADR-0001) confirmed working on staging. Closing.

PAT minted for this verification was a `cli-signin` token (id `efdaf2df-...`) — could not be revoked via Bearer PAT (POST/DELETE `/tokens/*` are deliberately rejected for PAT bearer, privilege-escalation guard). Pre-existing hygiene debt on leftover `cli-signin` tokens noted separately, not actionable here.

---

### Ely - 6/25/2026, 9:00:27 PM

## 🤖 Curación de campos QA (estándar Bunkai)

Curación automática de campos QA según el estándar Bunkai. Justificación:

| ***Campo**** | ****Valor aplicado**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Tenancy & Identity | El Epic Link previo ([https://jira.upexgalaxy.com/browse/BK-12#icft=BK-12](https://jira.upexgalaxy.com/browse/BK-12#icft=BK-12) → User Stories & AC) ***no corresponde*** a la naturaleza del defecto: es una regresión del middleware `requireAuth` (autenticación PAT bearer). Se asigna por contenido a Identidad y Tenencia, que es el dominio real del defecto. |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al epic de gestión de defectos. |
| Test Environment | Staging | Regresión confirmada en staging. |
| Severity | Crítica | Defecto staging-wide: bloquea por completo la QA de [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) (0/22 ATP ejecutables) y todo acceso programático a Projects/Modules/Tokens; impacto en producción afectaría a integraciones de usuarios reales. |
| Priority | Highest | Alineada a Severity Crítica. |
| Error Type | Integration | Contrato de autenticación roto entre la capa PAT-bearer y las rutas `requireAuth` (el token válido es aceptado solo en un allowlist de Identity-tier). |
| Root Cause | ***Pendiente / tentativo*** | El ticket marca la causa como NO confirmada ("Set as TENTATIVE; do not treat as final"), con hipótesis de nivel config/allowlist en el middleware. No se fija un valor definitivo a falta de triage de desarrollo; el valor preexistente "Code Error" queda como tentativo, sin confirmación concluyente. |

***Campo señalado:*** Root Cause permanece sin evidencia concluyente (tentativo) — requiere confirmación del equipo de desarrollo.

---


_Synced from Jira by sync-jira-issues_
