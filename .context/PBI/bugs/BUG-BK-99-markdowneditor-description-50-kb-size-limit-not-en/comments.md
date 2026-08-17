# Comments for BK-99

[View in Jira](https://jira.upexgalaxy.com/browse/BK-99)

---

### Automation for Jira - 6/10/2026, 9:53:25 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/10/2026, 9:54:29 AM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 6/10/2026, 10:46:06 AM

## 🔧 Bug Fix Documentation

### Root Cause Analysis

***Category:*** Code Error
***Location:*** `lib/user-stories/validation.ts`, `lib/acceptance-criteria/validation.ts`, `components/markdown/markdown-editor.tsx`, `user-story-form.tsx`, `acceptance-criteria-panel.tsx`

***KiB/KB unit mismatch — one root cause behind both BK-99 and BK-100.**** Every cap site used `50 ** 1024` = ***51,200 bytes (50 KiB)**** while the AC5 contract and the UI label mean ****50 KB = 50,000 bytes***:

- The 51,000-byte repro payload sat UNDER the implemented 51,200-byte cap → the client submit gate (which already existed: `!overCap → disabled`) never fired, and the server guard (which also already existed on POST + PATCH) accepted it. Not a missing-guard bug — a wrong-constant bug.
- The 90% warning threshold computed to 46,080 bytes, so the 45,500-byte probe of [https://jira.upexgalaxy.com/browse/BK-100#icft=BK-100](https://jira.upexgalaxy.com/browse/BK-100#icft=BK-100) stayed neutral.

### Fix Applied

***Branch:*** `fix/BK-99-markdown-size-limit`
***PR:*** [https://github.com/upex-galaxy/upex-bunkai-tms/pull/33](https://github.com/upex-galaxy/upex-bunkai-tms/pull/33) (merged to `staging`, commit `e61cf15`, deployed)
***Fix Type:*** Bugfix

| ***File**** | ****Change*** |
| --- | --- |
| `lib/user-stories/validation.ts` | `MAX*STORY*DESCRIPTION_BYTES` 51,200 → ***50,000*** |
| `lib/acceptance-criteria/validation.ts` | `MAX*CRITERION*DESCRIPTION_BYTES` 51,200 → ***50,000*** |
| `components/markdown/markdown-editor.tsx` | `DEFAULT*MAX*BYTES` → 50,000; size counter + error message now divide by 1000 (true decimal KB) |
| `user-story-form.tsx` / `acceptance-criteria-panel.tsx` | Local `50 * 1024` redeclarations replaced with imports of the shared server constants — client gate and API reject at the same byte |
| `lib/*/validation.test.ts` | 4 regression tests: constants pinned to 50,000; the 51,000-byte QA payload; the exact 50,000/50,001 boundary |

Post-fix behavior: ***warning (amber) at >45,000 bytes · hard block (red counter + inline error + disabled submit + server 422) at >50,000 bytes · counter shows true KB.***

### Verification Performed

- [x] `bun test` 184/184 (4 new regression tests) · `tsc` clean · `eslint` clean
- [x] Staging smoke (2026-06-10, post-deploy): POST user-story with 51,000-byte description → ***HTTP 422**** `validation*failed` ****/*** `description*too_long` (was 201 + persisted)
- [x] Staging smoke with 50,500 bytes (the exact gap zone that the old KiB cap admitted) → ***HTTP 422*** as well
- [x] No DB rows created during verification

### How to Verify

1. Open the user-story form on staging, inject 51,000 chars into the Description (QA's JS snippet)
2. ***Expected:*** counter red, inline "exceeds the maximum size of 50 KB" error, Create button disabled
3. Bypass the client (curl POST with 51,000-byte description) → ***Expected:**** ****422*** `description*too*long`
4. At 45,500 bytes → counter shows ***45.5 KB*** in the amber warning state (this also closes [https://jira.upexgalaxy.com/browse/BK-100#icft=BK-100](https://jira.upexgalaxy.com/browse/BK-100#icft=BK-100))

---

**Fix ready for QA verification.**

---

### Facu Barea - 6/10/2026, 4:57:06 PM

## :test_tube: Acceptance Test Plan (ATP) — [https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99](https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99)

***Type:**** Bug Retest | ****Priority:**** High | ****Environment:**** Staging | ****Date:*** 2026-06-10

---

### Bug Summary

Submit button remained enabled when description exceeded 50KB. Server accepted and persisted a 51,000-byte payload to the database with no error. Dual-layer failure: missing client-side submit guard and missing server-side size validation.

### Veto Check

No veto — data integrity concern (oversized payload persisted to DB). Retesting REQUIRED regardless of risk score.

### Risk Score

***[ HIGH ]*** — data persistence bypass. Both client-side and server-side validations were absent. Client may have been partially fixed (counter turns red) but server-side unverified.

---

### Test Approach

| ***Layer**** | ****What to verify**** | ****Method*** |
| --- | --- | --- |
| UI — Client block | Submit button disabled when >50KB | Playwright |
| UI — Error feedback | Inline error message shown to user | Playwright |
| API — Server reject | POST with 51KB payload returns HTTP 400 | OpenAPI MCP |
| DB — No persistence | No row saved with description > 50,000 bytes | DBHub MCP |

---

### Test Cases

***BK-99 TC-01 — Client-side block:**** ****submit disabled at >50KB***

- Open story creation form on staging
- Inject 51,000 chars via JS into the description textarea
- Expected: submit button has `disabled` attribute (cannot be clicked)
- Expected: inline error message visible in the UI

***BK-99 TC-02 — Server-side block:**** ****API returns 400 on oversized payload***

- Submit a POST to the story creation endpoint with `description` = 51,000 chars
- Expected: HTTP 400 response with validation error message
- Note: test both via UI submit attempt and direct API call

***BK-99 TC-03 — At-limit boundary:**** ****50,000 chars allowed***

- Inject exactly 50,000 chars into the description
- Expected: submit button remains ENABLED
- Expected: story is created successfully, no error

***BK-99 TC-04 — DB confirmation:**** ****no oversized row persisted***

- After TC-01 blocked submit attempt, query DB for the most recent story created by the test user
- Expected: no row exists with description length > 50,000 bytes

---

### Test Data

```javascript
// Inject 51KB (over-limit)
const el = document.querySelector('textarea[placeholder="Describe the story in Markdown."]');
const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
setter.call(el, 'A'.repeat(51000));
el.dispatchEvent(new Event('input', { bubbles: true }));
```

### Pass / Fail Criteria

> ***SUCCESS:*** PASS — submit button disabled, API returns 400, DB has no oversized row, inline error shown.

> ***ERROR:*** FAIL — any layer still accepts the oversized payload.

---

### Facu Barea - 6/10/2026, 5:11:55 PM

## :test_tube: Acceptance Test Results (ATR) — [https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99](https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99)

***Type:**** Bug Retest | ****Verdict:**** ****[ PASS — BUG FIXED ]**** | ****Environment:**** Staging | ****Date:*** 2026-06-10

---

### Summary

All 4 test cases passed. The 50 KB size limit is now enforced at both client and server layers. No oversized payload was persisted to the database during the retest session.

---

### Test Execution Results

| ***TC**** | ****Description**** | ****Result**** | ****Notes*** |
| --- | --- | --- | --- |
| TC-01 | Client-side block: submit disabled at >50KB | :white*check*mark: PASS | `buttonDisabled: true` · inline error "The description exceeds the maximum size of 50 KB." · counter class `text-signal-fail` |
| TC-02 | Server-side block: API returns error on 51KB payload | :white*check*mark: PASS | HTTP 422 · `code: validation*failed` · `message: "Description must be at most 50 KB."` · `reason: description*too_long` |
| TC-03 | At-limit boundary: 50,000 chars allowed | :white*check*mark: PASS | Submit button enabled at exactly 50,000 bytes |
| TC-04 | DB: no oversized row persisted | :white*check*mark: PASS | Latest row in `user_stories`: 36 bytes. No 51KB row created in this session |

---

### Evidence

- `bk99-story-form-before.png` — form at 0.0 KB, button enabled (baseline)
- `bk99-tc01-button-disabled-51kb.png` — form at 51.0 KB, button disabled, inline error visible

---

### Observations

> ***INFO:*** At exactly 50,000 chars (50.0 KB), the counter shows `text-signal-blocked` CSS class but the submit button remains enabled. This is an edge-case cosmetic inconsistency (TC-03): the counter color suggests "blocked" but submission is allowed. Not a bug — just a visual note for the dev team.

> ***INFO:*** Pre-fix rows with 51,000-byte descriptions persist in the database from the original [https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16](https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16) Stage 2 session (2026-06-09). These are historical evidence and do not affect the current fix verdict.

---

### Root Cause — Resolved

Missing client-side submit guard and missing server-side size validation have both been addressed. The fix covers:

1. ***Client***: submit button is disabled when `bytes > 50,000`; inline error message is shown
2. ***Server***: POST to `/api/v1/modules/{id}/user-stories` returns HTTP 422 when description exceeds 50 KB

---

### Verdict

***[ PASS ]**** — Bug is ****fixed***. Ready to close. [https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16](https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16) unblock depends on [https://jira.upexgalaxy.com/browse/BK-100#icft=BK-100](https://jira.upexgalaxy.com/browse/BK-100#icft=BK-100) also passing.

---

### Facu Barea - 6/10/2026, 5:12:19 PM

## :white*check*mark: QA Sign-Off — [https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99](https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99) VERIFIED FIXED

***Tester:**** Facu Barea | ****Date:**** 2026-06-10 | ****Environment:*** Staging

The fix for [https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99](https://jira.upexgalaxy.com/browse/BK-99#icft=BK-99) has been verified. The 50 KB size limit is now enforced at both layers:

- ***Client***: submit button is disabled when description exceeds 50 KB; inline error message displayed
- ***Server***: POST returns HTTP 422 `description*too*long` for oversized payloads
- ***DB***: no oversized row was persisted during the retest session

All 4 test cases passed. Closing this bug. :closed*lock*with_key:

---

### Ely - 6/25/2026, 9:01:07 PM

## 🤖 Curación de campos QA (estándar Bunkai)

| ***Campo**** | ****Valor**** | ****Justificación*** |
| --- | --- | --- |
| Componentes | User Stories & Acceptance Criteria | El defecto está en el editor Markdown de la descripción de User Story (formulario de creación de historia). |
| Épica padre | [https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183](https://jira.upexgalaxy.com/browse/BK-183#icft=BK-183) (Defect Management) | Reparentado al épica de gestión de defectos según estándar. |
| Severidad | Mayor | Se omite la validación de tamaño (AC5): un payload de 51.000 bytes se persiste sin bloqueo cliente ni servidor. |
| Prioridad | High | Alineada a severidad Mayor. |
| Tipo de error | Functional | Validación de límite no aplicada; el propio ticket declara Error Type: Functional. |
| Causa raíz | Code Error | El ticket establece "Missing client-side..." validación + el servidor tampoco rechaza: gap de código. |
| Entorno | Staging | Reproducido en staging-upexbunkai.vercel.app. |
| Frecuencia | (sin cambios) | Campo no tocado por política. |

---


_Synced from Jira by sync-jira-issues_
