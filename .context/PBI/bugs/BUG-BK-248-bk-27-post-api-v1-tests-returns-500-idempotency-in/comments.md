# Comments for BK-248

[View in Jira](https://jira.upexgalaxy.com/browse/BK-248)

---

### Nahuel Gomez - 7/22/2026, 7:57:54 PM

Found during QA automation on [BK-27](https://jira.upexgalaxy.com/browse/BK-27). Reproduced on staging with authenticated PAT. All create-Test requests with Idempotency-Key header return 500.

Blocks 4 KATA integration tests:

- POST /tests creates test chaining 3 ATCs (expects 201)
- POST /tests allows duplicate ATC IDs (expects 201)
- POST /tests returns 404 for non-existent ATC IDs (expects 404)
- POST /tests with Idempotency-Key returns same test on retry (expects 201)

Fix in lib/api/idempotency.ts — likely missing migration or DB constraint on idempotency_keys table.

---

### Automation for Jira - 7/31/2026, 4:21:21 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 7/31/2026, 4:30:52 PM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Ely - 7/31/2026, 4:45:57 PM

## QA Handoff — [https://jira.upexgalaxy.com/browse/BK-248#icft=BK-248](https://jira.upexgalaxy.com/browse/BK-248#icft=BK-248)

Fixed and merged to `staging`: [PR #81](https://github.com/upex-galaxy/upex-bunkai-tms/pull/81), merge commit `1b41f47`.

### Root cause

`beginIdempotentRequest` (`lib/api/idempotency.ts`) only special-cased Postgres error `23505` (unique-constraint violation, a genuine concurrent retry) on its INSERT into `idempotency*keys`. Every other Postgres error — including a foreign-key violation on `idempotency*keys.workspace*id` (`23503`, whenever the caller-supplied `workspace*id` doesn't reference an existing workspace) — fell through to a generic `internal_error` (500), which is exactly the reported symptom.

Reproduced directly against the live Supabase project (raw SQL, then the actual JS admin client) before writing the fix, to confirm the exact failure mode.

### Fix

That specific foreign-key violation now maps to `validation_failed` (422) instead of the generic 500. Fixed inside the shared `beginIdempotentRequest` middleware, so every current and future consumer benefits, not just `POST /api/v1/tests`.

### Review

Independent adversarial review, 2 lenses (correctness/regression, security/scope-completeness): ***0 BLOCKER, 0 MAJOR***, 1 MINOR + 4 NIT, all fixed (orphaned-test-row cleanup, an error-matching fallback, explicit test timeouts, a documentation comment, and a corrected test-comment claim). Full adjudication in the PR body.

### ⚠️ Known, deliberately out-of-scope gap (flagged, not fixed here)

> ***WARNING:**** `POST /api/v1/tests` still accepts a caller-supplied `workspace*id` with ****no existence-or-membership pre-validation***. This fix only corrects the HTTP status code for a `workspace*id` that doesn't exist at all. A `workspace*id` that DOES exist, but that the caller isn't a member of, still passes this check (the foreign key is satisfied) and only gets rejected downstream by the `createTest` RPC's own membership guard — no Test data is ever actually written, but an orphaned `idempotency*keys` row can be created for a workspace the caller doesn't belong to.
Spun off as its own follow-up rather than expanding this bug-fix PR's scope. If you want it closed, it needs a small, separate change to `app/api/v1/tests/route.ts` adding an explicit membership check before the idempotency-key insert.

### Suggested re-check steps

1. Authenticate with a PAT.
2. `POST /api/v1/atcs` to create an ATC.
3. `POST /api/v1/tests` with an `Idempotency-Key` header and a valid body referencing a real, member workspace — confirm `201 Created` (this was the original blocked scenario: all 4 of the QA automation's KATA integration tests should now pass).
4. Repeat with a syntactically valid but nonexistent `workspace*id` — confirm a clean `422 validation*failed` ("workspace_id does not reference an existing workspace."), not a 500.
5. Repeat the same request twice with the same `Idempotency-Key` and same body — confirm the second call replays the stored response rather than creating a duplicate Test.

---

### Nahuel Gomez - 8/5/2026, 7:20:53 PM

## [BK-248](https://jira.upexgalaxy.com/browse/BK-248) — Acceptance Test Results (ATR)

***Result: PASSED*** · Tested: 2026-08-05 · Environment: Staging · Tester: Nahuel Gomez

### Verification Results

| # | Checkpoint | Expected | Actual | Status |
| --- | --- | --- | --- | --- |
| 1 | POST /tests + Idempotency-Key + valid workspace + ATCs | 201 Created | 201 | PASS |
| 2 | POST /tests + Idempotency-Key + nonexistent workspace*id | 422 validation*failed | 422 | PASS |
| 3 | Same request x2 with same Idempotency-Key (replay) | Same test ID | Match confirmed | PASS |
| 4 | No Idempotency-Key header (regression guard) | 400 | 400 | PASS |
| 5 | KATA test-builder.test.ts — all 8 tests | 8/8 pass | 8/8 pass | PASS |

### KATA Test Results

All 8 test scenarios pass:

- [BK-305](https://jira.upexgalaxy.com/browse/BK-305): POST /tests creates a test chaining 3 ATCs — PASS
- [BK-305](https://jira.upexgalaxy.com/browse/BK-305): POST /tests allows duplicate ATC IDs in chain — PASS
- [BK-306](https://jira.upexgalaxy.com/browse/BK-306): POST /tests rejects empty atc_ids with 422 — PASS
- [BK-307](https://jira.upexgalaxy.com/browse/BK-307): POST /tests rejects whitespace-only title with 422 — PASS
- [BK-307](https://jira.upexgalaxy.com/browse/BK-307): POST /tests rejects 201-character title with 422 — PASS
- [BK-308](https://jira.upexgalaxy.com/browse/BK-308): POST /tests returns 404 for non-existent ATC IDs — PASS
- [BK-309](https://jira.upexgalaxy.com/browse/BK-309): POST /tests with Idempotency-Key returns same test on retry — PASS
- [BK-310](https://jira.upexgalaxy.com/browse/BK-310): POST /tests rejects unauthenticated request with 401 — PASS

### Test Suite Fixes Applied

- Fixed workspace_id: project UUID replaced with actual workspace UUID (dfdd3fb7-0724-4eb5-b970-1498e949beb9)
- Added Idempotency-Key header to createTestEmptyChain and createTestWithInvalidTitle
- Fixed response schema: atc*ids → steps, id → atc*id

### Verdict

***PASSED.*** Idempotency fix confirmed — FK violation 23503 now returns 422 instead of 500. All 4 previously blocked KATA tests pass. [BK-27](https://jira.upexgalaxy.com/browse/BK-27) automation unblocked.

---


_Synced from Jira by sync-jira-issues_
