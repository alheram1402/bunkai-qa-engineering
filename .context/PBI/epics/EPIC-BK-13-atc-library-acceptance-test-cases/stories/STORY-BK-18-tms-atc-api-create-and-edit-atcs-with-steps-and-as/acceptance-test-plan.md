# ACCEPTANCE TEST PLAN (ATP): [ATP] BK-18 — ATC create/edit REST API

**Jira Key:** [BK-94](https://jira.upexgalaxy.com/browse/BK-94)
**Status:** Listo
**Components:** None

> Run results / coverage are NOT synced — read those via xray-cli. This file mirrors the issue description.

---

## Description

# ATP — [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18): ATC create/edit REST API (POST/PATCH /atcs)

> ***INFO:**** Acceptance Test Plan for ****BK-18**** — transactional ATC create + edit REST API. API-only (UI is [https://jira.upexgalaxy.com/browse/BK-19#icft=BK-19](https://jira.upexgalaxy.com/browse/BK-19#icft=BK-19)). Modality ****jira-xray****. This revision (2026-06-20, re-run) refactors the original 14 flat outlines into ****12 parametrized test cases*** using equivalence partitioning + boundary-value analysis, and corrects the optimistic-lock contract to `X-If-Match` (see Contract notes). Source of truth for scope, scenarios, risk and the formal Xray Test set.

## Scope under test

- `POST /api/v1/atcs` → ***201*** — create ATC header + ordered steps + assertions, atomically.
- `PATCH /api/v1/atcs/{id`} → ***200*** — full-replace (PUT-style) edit, version-bumped, cascade child replace.
- Auth: Bearer PAT, scope `atc:write` (read-only token → 403).
- DB integrity: transactional rollback (zero rows on any failure), slug uniqueness `(project*id, slug)`, monotonic version, `activity*log` events (`atc.created` / `atc.updated`).
- ***OUT***: UI ([https://jira.upexgalaxy.com/browse/BK-19#icft=BK-19](https://jira.upexgalaxy.com/browse/BK-19#icft=BK-19)), GET ([https://jira.upexgalaxy.com/browse/BK-20#icft=BK-20](https://jira.upexgalaxy.com/browse/BK-20#icft=BK-20)), DELETE/duplicate (future — DELETE returns 405), real `affected*test*ids` (EPIC-BK-5; MVP emits null/[]).

## Test environment + data

| ***Item**** | ****Value*** |
| --- | --- |
| Environment | Staging — `https://staging-upexbunkai.vercel.app/api/v1` |
| Auth | Bearer PAT scope `atc:write` (openapi-testing user; `.env` API_TOKEN). Read-only PAT for the scope-gate case. |
| Project | Openapi Test Project — `269850ea-a759-44a1-a45e-3a6187cac5ec` |
| User Story | FSX-45 "Add Support for American Express CC" — `b1f68acf-855a-4320-95f0-e81df5e948c3` |
| Module (in subtree) | Credit Cards `8da2b639-5e65-4c91-9238-e92d0977d484` (path `billing/credit-cards`) |
| AC for happy path | AC1 `58f143d1-7522-4933-bbc6-2db7d4493436` (AC2–AC7 also under the US) |
| Cross-subtree module (negative) | `2c4175d7-d449-40f7-abf1-7c7e429c51c7` (project `ae10a3bd-...`, "BK-9 Module Test Project") |

> ***WARNING:*** Test-data gap (owned by Stage 2): "Openapi Test Project" has only ONE User Story, so there is no clean same-project second US to drive `ac*outside*user_story`. Workaround: use an AC under a US in a different project (the cross-entity check rejects any AC not under the target US). Do NOT seed at planning time.

## Contract notes (implementation is source of truth)

- ***Optimistic lock — UPDATED****: the version token travels in a custom `X-If-Match: <version>` header. Standard `If-Match` is intercepted by Vercel's edge (returns a `412 PRECONDITION_FAILED` platform page on a matching version — `x-vercel-error` header, non-JSON) and is kept only as an off-Vercel fallback. ****All optimistic-lock test cases use**** `X-If-Match`****.*** This corrects [https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96](https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96) (fix PR #30, commit `421a917`; verified E2E in this run).
- Step shape: {{{ position:int (strictly-increasing from 1), content, input_data?, expected? }}}.
- Assertion shape: {{{ content }}} — server auto-assigns `position` in the response.
- Required POST body: `title` (3..200), `layer` ∈ {UI, API, Unit}, `steps[]` (min 1), `acceptance*criterion*ids[]` (uuid, min 1), `module*id` (uuid), `user*story_id` (uuid). Optional: `assertions[]`, `tags[]` (≤10).
- Error codes: `ac*outside*user*story` (422), `module*outside*project*subtree` (422), `steps*position*invalid` (422), `validation*failed` (422), `conflict` (409), `unauthorized` (401), `forbidden` (403), `not*found` (404).
- Slug: `<module-slug>/atc-<8 hex>`, immutable across edits, regex `^[a-z0-9-]+\/atc-[a-z0-9]{8}$`.
- PATCH semantics: full-replace; omitted children cleared; empty body {{{}}} = 200 no-op (no version bump, no event). `user*story*id` / `module_id` / `slug` immutable on PATCH.

## Risk triage (12 parametrized cases)

ATC authoring = HIGH impact + the anchoring moat (master-test-plan §1, INV-1/INV-2); PAT scope = CRITICAL. Distribution: ***P0 = 6, P1 = 4, P2 = 2***.

| ***Priority**** | ****Cases**** | ****Rationale*** |
| --- | --- | --- |
| P0 | TC01, TC02, TC03, TC04, TC07, TC08 | Anchoring-moat validation (AC→US, module→subtree), transactional rollback, auth/scope gate, happy create, happy PATCH ([https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96](https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96) retest) |
| P1 | TC05, TC06, TC09, TC10 | Contract correctness — step-position rule, request-validation boundaries, optimistic lock, 404 |
| P2 | TC11, TC12 | Empty-body no-op, immutable-field protection |

## Test design technique map

- ***Equivalence Partitioning*** — auth state (TC02), step-position validity (TC05), lock state (TC09), layer enum (TC06).
- ***Boundary-Value Analysis*** — title length, steps count, tags count (TC06).
- ***State transition*** — version monotonicity + cascade replace across PATCH (TC08, TC09, TC11).
- ***Decision/cross-entity*** — AC→US and module→subtree anchoring (TC03, TC04, TC07).
- ***Parametrization*** — one case carries multiple data series instead of duplicate cases (TC02, TC05, TC06, TC09).

## Test cases (formal — materialized as Xray Test issues)

### TC01 — Validate POST /atcs creates an ATC and returns 201 with steps, assertions, slug and version 1 (parametrized over layer)

***Type**** Positive / ****Priority**** P0 / ****Maps to*** AC1.
***Data series (layer):*** `UI`, `API`, `Unit` — each → 201.
***Steps:*** POST a valid body (title 3..200, module Credit Cards, US FSX-45, AC1, 3 steps, 2 assertions) for each layer value.
***Expected:*** 201; `atc.id` uuid; `slug` matches regex; `version`=1; 3 steps positions 1..3; 2 assertions with server-assigned positions; rows in `atcs`/`atc*steps`/`atc*assertions`/`atc*acceptance*criteria`; `atc.created` in `activity_log`.

### TC02 — Validate POST /atcs auth + scope gate (parametrized over authorization state)

***Type**** Negative / ****Priority**** P0 / ****Maps to*** auth + scope gate (escalation surface).
***Data series:**** (a) no `Authorization` header → ****401**** `unauthorized`; (b) malformed/invalid bearer → ****401**** `unauthorized` "Invalid token", zero DB writes; (c) valid PAT but scope `atc:read` only → ****403*** `forbidden` "Missing required capability: atc:write".
***Expected:*** each row returns its code; no ATC row is created in any case.

### TC03 — Validate POST /atcs rejects with 422 ac*outside*user_story when an AC belongs to a different user story

***Type**** Negative / ****Priority**** P0 / ****Maps to*** AC2 (cross-entity AC→US, INV-2).
***Steps:*** POST with US FSX-45 + an `acceptance*criterion*ids` entry under a different US.
***Expected:*** 422 `ac*outside*user*story`; zero new rows in `atcs`/`atc*steps`/`atc_assertions` (rollback).

### TC04 — Validate POST /atcs rejects with 422 module*outside*project_subtree when the module is outside the US project subtree

***Type**** Negative / ****Priority**** P0 / ****Maps to*** AC3 (cross-entity module→subtree).
***Steps:*** POST US FSX-45 + cross-project module `2c4175d7-...`.
***Expected:*** 422 `module*outside*project_subtree`; zero new rows (rollback).

### TC05 — Validate POST /atcs rejects with 422 steps*position*invalid when step positions are not strictly increasing from 1 (parametrized)

***Type**** Negative / ****Priority**** P1 / ****Maps to*** AC4.
***Data series (positions):*** `[1,3,2]` (not increasing); `[2,3,4]` (does not start at 1); `[1,1,2]` (not strictly increasing); `[0,1,2]` (starts at 0). Plus a positive control `[1,2,3]` → 201.
***Expected:*** each invalid series → 422 `steps*position*invalid` with offending positions in the body; control → 201.

### TC06 — Validate POST /atcs request-body boundaries (parametrized BVA over title / steps / tags / layer)

***Type**** Boundary / ****Priority**** P1 / ****Maps to*** business rules (title 3..200, steps≥1, tags≤10, layer enum).
***Data series:*** title len `2` → 422 `validation_failed`; title len `3` → 201; title len `200` → 201; title len `201` → 422; steps `[]` → 422; steps 1 → 201; tags `10` → 201; tags `11` → 422; layer `"E2E"` (invalid enum) → 422.
***Expected:*** each row returns the stated code; no partial rows persisted on any 422.

### TC07 — Validate POST /atcs writes zero rows across all three tables when a post-validation cross-entity check fails (transactional rollback, DB-verified)

***Type**** Integration / ****Priority**** P0 / ****Maps to*** transactional rollback (the moat guarantee).
***Steps:*** capture baseline counts (`atcs`/`atc*steps`/`atc*assertions`); POST a body that passes Zod but fails AC→US; re-count.
***Expected:**** 422; `count(**)` unchanged on all three tables; no orphan children.

### TC08 — Validate PATCH /atcs/{id} happy-path full-replace returns 200, bumps version and cascade-replaces children ([https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96](https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96) retest, X-If-Match)

***Type**** Positive / ****Priority**** P0 / ****Maps to*** AC5 (+ [https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96](https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96) regression).
***Steps:*** create ATC v1 (3 steps, 2 assertions); PATCH with `X-If-Match: 1`, new title + 2-step replacement array, no assertions.
***Expected:**** ****200*** (JSON, `x-request-id`, NOT a 412 edge page); `version`=2; exactly 2 steps; 0 assertions; old children deleted in the same txn as the inserts; `atc.updated` in `activity*log`; `affected*test_ids` present (null/[] in MVP — confirm).

### TC09 — Validate PATCH /atcs/{id} optimistic lock via X-If-Match (parametrized over lock state)

***Type**** Negative/State / ****Priority**** P1 / ****Maps to*** optimistic lock.
***Data series:*** `X-If-Match` = current version → 200, version +1; `X-If-Match` = stale version → 409 `conflict` + `details.current_version`; `X-If-Match` absent → 200 (lock skipped). Document control: legacy `If-Match: <current>` → 412 `x-vercel-error` (edge limitation, informational).
***Expected:*** each row returns the stated code/behavior.

### TC10 — Validate PATCH /atcs/{id} returns 404 not_found for a non-existent ATC id

***Type**** Negative / ****Priority**** P1 / ****Maps to*** 404.
***Steps:*** PATCH `/atcs/00000000-0000-0000-0000-000000000000` with a valid body.
***Expected:*** 404 `not_found`.

### TC11 — Validate PATCH /atcs/{id} with an empty body is a 200 no-op (no version bump, no event)

***Type**** State / ****Priority**** P2 / ****Maps to*** PATCH empty-body semantics.
***Steps:*** create ATC; PATCH {{{}}} (empty body) with matching `X-If-Match`.
***Expected:*** 200; version unchanged; children unchanged; no new `activity_log` row.

### TC12 — Validate PATCH /atcs/{id} keeps slug, user*story*id and module_id immutable across an edit

***Type**** Negative/Edge / ****Priority**** P2 / ****Maps to*** immutability rules.
***Steps:*** create ATC; PATCH attempting to change `slug`/`user*story*id`/`module_id` (e.g. to the cross-subtree module).
***Expected:*** edit either ignores the immutable fields or rejects; the persisted `slug`/`user*story*id`/`module_id` are unchanged after the call.

## Traceability

- Story ***BK-18*** — ATC create/edit REST API (this ATP's parent).
- Epic ***BK-13*** — ATC Library.
- ATP ***BK-94**** (Test Plan) and ATR ****BK-95*** (Test Execution) link to [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18) via the "Test" relationship (is tested by).
- TC ↔ Story: each TC01–TC12 Xray Test is added to Test Plan BK-94 and linked to [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18) for board coverage.
- Regression: [https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96](https://jira.upexgalaxy.com/browse/BK-96#icft=BK-96) (fixed) is permanently covered by TC08 + TC09.

## Notes / open items

- `affected*test*ids` observed `null` (MVP contract said `[]`) — confirm in execution; flag as a minor contract note, not a defect, if it persists.
- Cleanup: created ATCs cannot be removed via API (DELETE → 405); Stage 2 cleans via DBHub, per [https://jira.upexgalaxy.com/browse/BK-15#icft=BK-15](https://jira.upexgalaxy.com/browse/BK-15#icft=BK-15)/[https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) precedent.

---

## Related Issues

- tests: [BK-18](https://jira.upexgalaxy.com/browse/BK-18) - TMS-ATC API | Create and edit ATCs with steps and assertions

---

## Metadata

- **Created:** 6/8/2026
- **Updated:** 6/25/2026
- **Reporter:** Ely
- **Assignee:** Ely

---

_Synced from Jira by sync-jira-issues_

---
_Source: Xray Test Plan [BK-94](https://jira.upexgalaxy.com/browse/BK-94) description · ATP · synced by sync-jira-issues_
