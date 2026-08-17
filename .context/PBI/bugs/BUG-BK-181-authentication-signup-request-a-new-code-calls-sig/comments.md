# Comments for BK-181

[View in Jira](https://jira.upexgalaxy.com/browse/BK-181)

---

### Ely - 6/25/2026, 8:59:45 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componente | Tenancy & Identity | Pantalla de verificación de email del signup (flujo de auth [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166)). Sin Epic Link previo: inferido del contenido. |
| Epic padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado a gestión de defectos. |
| Entorno de prueba | Staging | Indicado en la descripción. |
| Severidad | Mayor | Conservada. "Request a new code" no funciona: el usuario que necesita un código nuevo no puede obtenerlo (intención de reenvío rota) y se filtra un mensaje técnico crudo (info-disclosure menor). |
| Prioridad | High | Alineada a Severidad Mayor. |
| Tipo de error | Functional | Conservado. El control llama al endpoint equivocado (signup en vez de resend). |
| Causa raíz | Code Error | El control está cableado a POST /api/v1/auth/signup en lugar de un endpoint de reenvío, y no envuelve el error de validación; lógica de frontend incorrecta. |

---

### Benjamin Segovia - 7/13/2026, 7:33:18 AM

## Dev hand-off

***Context:*** found incidentally while probing BK-23's staging-login blocker ([https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175](https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175)) — not part of a dedicated test session, so it hasn't been confirmed whether it blocks signup completion entirely or only the resend convenience action.

***What's wrong:*** on the email-verification screen of the signup flow ([https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166)), "Request a new code" calls `POST /api/v1/auth/signup` again instead of a resend-verification endpoint. That call fails with a 422, and the raw backend validation message (`"Request body failed validation."` / field-level details) is rendered verbatim in the UI alert instead of a user-friendly resend confirmation or error.

***Impact:*** users needing a fresh code (e.g. expired original) can't get one through this control. The raw validation text in a user-facing alert is also a minor info-disclosure smell (exposes internal field/validation naming).

***Ask:*** wire the control to an actual resend-verification endpoint, and wrap any backend validation failure in a user-friendly message before it reaches the UI. Not currently blocking other QA work — pick up when there's room.

---

### Ely - 8/1/2026, 7:30:09 PM

## 🔧 Bug Fix Documentation

### Root Cause Analysis

***Category******:*** Code Error
***Location******:*** `app/(auth)/login/email-first-form.tsx` (`resendCode`), `app/api/v1/auth/signup/route.ts` (`BodySchema`)

`resendCode()` re-posted `{ email, password }` to `POST /api/v1/auth/signup`, reusing signup's own Zod schema (`password: min(8)`). Resend has no legitimate need for a password — reusing that schema meant any path into the verify step where the `password` state was not a valid 8+ char string would fail validation before ever reaching Supabase, and the generic error mapping in `lib/api/handler.ts` surfaced the raw envelope (`"Request body failed validation."`) straight to the UI alert — exactly the network log captured in this ticket.

### Fix Applied

***Branch******:*** `fix/BK-181-resend-verification-endpoint`
***PR******:*** https://github.com/upex-galaxy/upex-bunkai-tms/pull/102 (merged to `staging`)
***Fix Type******:*** Bugfix

***Changes******:***

| File | Change |
| --- | --- |
| `app/api/v1/auth/resend/route.ts` | New endpoint — email only, calls `supabase.auth.resend({ type: 'signup', email })` |
| `app/api/v1/auth/resend/route.openapi.ts` | OpenAPI registration |
| `app/api/v1/auth/resend/route.test.ts` | Regression test against the real handler + real Supabase call |
| `app/(auth)/login/email-first-form.tsx` | `resendCode()` now calls `/api/v1/auth/resend`, friendly confirmation message |
| `scripts/openapi-gen.ts`, `public/openapi.json` | Route registration + regenerated spec |

### Verification Performed

- [x] Root cause confirmed against current `staging` code, not assumed from the 5-week-old report
- [x] Regression test exercises the real exported handler + a real Supabase Auth call (not mocked)
- [x] `types:check` / `lint:check` / `format:check` clean
- [x] Full `bun test`: 1041 pass; 2 pre-existing failures in `lib/atcs/search-isolation.test.ts` confirmed unrelated (different domain, reproduces identically on a clean `staging` checkout without this change)
- [x] Independent adversarial code review: no BLOCKER/MAJOR/MINOR/NIT findings

### How to Verify

1. Navigate to `https://staging-upexbunkai.vercel.app/login`
2. Sign up with a fresh email + password, reach the verify-code screen
3. Click "Request a new code"
4. ***Expected******:*** the network call goes to `POST /api/v1/auth/resend` (not `/signup`), returns `202`, and the UI shows "A new code has been sent to your email." — no raw backend text, no re-triggered signup

---

**Fix ready for QA verification. Reassigned to Benjamin Segovia (shift-left QA owner for the BK-166 auth flow this defect belongs to).**

---

### Benjamin Segovia - 8/3/2026, 1:20:00 PM

## QA Retest — PASSED

***Verified against ****`staging`**** (PR #102, commit ****`4ee7763`**** — ****`fix(BK-181): resend verification code via dedicated endpoint`****).***

| Check | Result |
| --- | --- |
| Frontend wiring | ✅ PASS — `resendCode()` in `email-first-form.tsx` now calls `POST /api/v1/auth/resend` with only `{email}`, not `/auth/signup` with a password |
| Endpoint — valid email | ✅ PASS — `202 {"status":"sent","email":...}` |
| Endpoint — no upstream/Zod message leak | ✅ PASS — errors are mapped by HTTP status only; verified no raw Supabase message reaches the response |
| Anti-enumeration | ✅ PASS — a nonexistent email returns the identical `202 sent` response as a real one (no existence signal) |
| Friendly UI confirmation | ✅ PASS (code-verified) — success path shows `toast.success('A new code has been sent to your email.')` instead of a raw alert |

Root cause and fix match the ticket's technical analysis exactly: the old `resendCode()` re-called `/auth/signup` (which requires a password), and when password state was stale at the verify step, signup's `min(8)` Zod rule 422'd and leaked the raw validation message. The new dedicated `/auth/resend` endpoint takes no password, so that failure mode is structurally eliminated, not just message-wrapped.

---


_Synced from Jira by sync-jira-issues_
