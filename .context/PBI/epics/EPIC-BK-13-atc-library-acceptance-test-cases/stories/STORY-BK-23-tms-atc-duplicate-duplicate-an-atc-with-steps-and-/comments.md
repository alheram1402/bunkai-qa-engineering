# Comments for BK-23

[View in Jira](https://jira.upexgalaxy.com/browse/BK-23)

---

### Ely - 5/19/2026, 6:57:38 PM

1. 🧱 Architect Annotation

1. 

- DB tables touched: `atcs` (INSERT new row), `atc*steps` (bulk INSERT copying source rows), `atc*assertions` (bulk INSERT copying source rows). All within one transaction.
- API surface: `POST /atcs/{source*id}/duplicate` with optional `{ new*title }` body. Returns 201 `{ atc_id }`. Returns 403 on insufficient role, 422 on title validation failure, 404 on cross-workspace source lookup.
- Service flow: BEGIN → `SELECT * FROM atcs WHERE id = $source*id AND workspace*id = $session.workspace*id` (404 if not found) → compute `new*title = $new*title ?? (source.title || ' (copy)')` → validate `new*title` length 3..200 → INSERT new atcs row inheriting `module*id, user*story*id, acceptance*criterion*ids, layer, tags`, `version = 1`, `slug = compute*slug(new*atc*id, module*id)` → INSERT atc*steps from `SELECT position, content, input*data, expected FROM atc*steps WHERE atc*id = $source*id` → INSERT atc*assertions from `SELECT position, content FROM atc*assertions WHERE atc*id = $source*id` → COMMIT.
- Event emission: `atc.created` (NOT `atc.duplicated`) with the full new ATC payload. Downstream consumers (search index, etc.) need no special handling — duplicate looks like a normal create.
- Slug is freshly computed from the new atc_id. Slugs are never cloned.
- No FK link between source and duplicate after creation — they are fully independent rows. Edits to one do not propagate to the other.
- No re-validation of cross-entity rules (AC↔US, module↔project subtree) — the source already passed those rules at its creation time. If the source's relationships have become invalid since (rare, only via admin operations), this is acknowledged as out-of-scope cleanup.

1. 

- Upstream: ****BK-18 (FR-010a)**** — reuses the insert path, slug computation, and event emission. Strongly prefer landing [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18) first and extracting an internal `createAtc(payload)` service function that this story calls.
- Downstream: ATC list/detail UI gets a "Duplicate" action that calls this endpoint and redirects to the new ATC's detail page.
- External: same event bus as [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18).

1. 

- [ ] OpenAPI entry for `POST /atcs/{source_id}/duplicate` with optional body and response shape
- [ ] `bun run api:sync` passes
- [ ] Unit tests: default title with `(copy)` suffix, custom new_title overrides, title-too-short rejection, viewer-role rejection, multi-position assertions copied correctly
- [ ] Integration test: edit the duplicate, verify source is unchanged (independence guarantee)
- [ ] Integration test: emitted event is `atc.created` with full payload (not a separate event type)
- [ ] Lint + typecheck pass
- [ ] Manual smoke: duplicate an ATC via curl, verify steps and assertions counts match source
- [ ] PR description references each AC by Gherkin scenario name

1. 

- PRD: `.context/PRD/mvp-scope.md` § EPIC-BK-004 (US 4.6)
- SRS: `.context/SRS/functional-specs.md` § FR-014
- Business map: `.context/business/business-data-map.md` § atcs / atc*steps / atc*assertions
- API contract: `.context/SRS/api-contracts.yaml` § paths./atcs/{source_id}/duplicate

---

### Benjamin Segovia - 6/2/2026, 5:39:37 PM

# ATP DRAFT — [https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23](https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23): TMS-ATC Duplicate

***Shift-Left refinement completed****: 2026-06-02 | ****Mode****: Jira-native | ****Source spec***: FR-014

---

## Story Quality Verdict: Needs Improvement

The 4 original ACs cover only the happy path and independence invariant. All error paths (404, 403, 422), title boundary constraints, and edge states are absent from the spec.

---

## Phase 3 — Refined Acceptance Criteria (Summary)

| Scenario  | Type  | Priority  | Notes  |
| --- | --- | --- | --- |
| ---------- | ------ | ---------- | ------- |
| 1.1 Copy with steps + assertions (default title)  | Positive  | Critical  | Full DB + UI assertions defined  |
| 2.1 Default "(copy)" suffix title  | Positive  | High  | No trailing space, no double suffix  |
| 3.1 Custom title overrides default  | Positive  | High  | Source ATC unchanged  |
| 4.1 Independence: editing copy does not affect source  | Positive  | Critical  | FK isolation verified  |
| E1: Cross-workspace → 404  | Negative  | Critical  | ***NEEDS PO/DEV CONFIRMATION***  |
| E2: Insufficient role → 403  | Negative  | Critical  | ***NEEDS PO/DEV CONFIRMATION***  |
| E3: Title < 3 chars → 422  | Negative  | High  | ***NEEDS PO/DEV CONFIRMATION***  |
| E4: Title > 200 chars → 422  | Boundary  | High  | ***NEEDS PO/DEV CONFIRMATION***  |
| E5: Title = 3 chars → 201  | Boundary  | Medium  | ***NEEDS PO/DEV CONFIRMATION***  |
| E6: Title = 200 chars → 201  | Boundary  | Medium  | ***NEEDS PO/DEV CONFIRMATION***  |
| E7: Source with 0 steps → 0-step copy  | Edge  | Medium  | ***NEEDS PO/DEV CONFIRMATION***  |
| E8: Source title ≥197 chars (overflow)  | Edge  | High  | ***NEEDS PO/DEV CONFIRMATION***  |
| E9: Empty string new_title treatment  | Edge  | Medium  | ***NEEDS PO/DEV CONFIRMATION***  |
| E10: Transaction rollback on step INSERT fail  | Integration  | High  | ***NEEDS PO/DEV CONFIRMATION***  |

---

## Phase 4 — Test Outlines: 16 total

| Type  | Count  |
| --- | --- |
| ------ | ------- |
| Positive  | 5  |
| Negative  | 4  |
| Boundary  | 4  |
| Integration  | 3  |
| ***Total****  | ****16***  |

***Estimated QA effort***: ~3–4 story points

---

## Critical Questions Blocking Sprint Planning

***Q1 — Role gate***: Business Rule says "any workspace member can duplicate" but architect annotation says "403 on insufficient role". Which workspace roles are allowed?

***Q2 — Title overflow***: If source title ≥197 chars, appending " (copy)" exceeds 200 chars. Truncate to 193 chars OR return 422 prompting custom title?

---

## Key Gaps (missing from original spec)

- ***G1***: No AC for 404, 403, or 422 error paths — add negative ACs with exact status codes + response body shapes
- ***G2***: Title uniqueness rule undefined — is it enforced within a module?
- ***G3***: No AC for duplicating archived/soft-deleted ATC
- ***G5***: Slug collision window on concurrent duplicates — confirm deterministic (UUID-based) vs title-based generation

---

## Upstream Dependency

[https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18) (FR-010a) must be merged before [https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23](https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23) can be tested. ***Do not pull BK-23 into sprint until BK-18 is merged.***

---

**Full ATP DRAFT stored locally:** `.context/PBI/tms-atc/BK-23-atc-duplicate/shift-left-refinement.md`
**Next step:** `/sprint-testing` **will short-circuit Phase 1–3 refinement when story reaches Ready For QA (label** `shift-left-reviewed` **detected).**

---

### Ramiro Majdalani - 6/2/2026, 6:03:39 PM

Shift-Left QA review for [https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23](https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23) - TMS-ATC Duplicate

I reviewed [https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23](https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23) against the local product context, SRS, architect annotation, and OpenAPI contract. Recommendation: refine before sprint planning.

Key findings:

- The business flow is clear: duplicate an existing ATC with all steps and assertions so QA can create a variant from a known-good template.
- Main risk: the duplicate must be a deep copy. Steps/assertions cannot be shared references with the source ATC.
- Contract mismatch: technical notes/SRS use `POST /atcs/{source*id}/duplicate` with body {{{ new*title }}} and response {{201 { atc_id }}}.
- OpenAPI currently documents `POST /atcs/{atc_id}/duplicate` with body {{{ title }}} and response `201 ATC`.
- OpenAPI only documents `201`; technical notes mention 403, 404, and 422.
- Story does not define what happens when the default title `<source title> (copy)` already exists.
- Role behavior is underspecified. "Workspace members" needs a matrix for owner/admin/member/viewer.
- Archived source ATC behavior is not defined.
- Event behavior says emit `atc.created`, not `atc.duplicated`; payload expectations should be explicit.

Critical PO/Dev decisions needed:

1. Final API path: `/atcs/{source*id}/duplicate` or `/atcs/{atc*id}/duplicate`?
2. Final request field: `new_title` or `title`?
3. Final response: {{{ atc_id }}} or full `ATC` object?
4. Are duplicate ATC titles allowed? If the default copy title exists, should the system allow it, reject it, or auto-suffix it?
5. Which roles can duplicate: owner, admin, member, viewer?
6. Can archived ATCs be duplicated?
7. Should the UI redirect/open the newly created ATC after duplication?

Suggested refined ACs:

```
Scenario: Duplicate ATC copies fields and child rows
  Given an authenticated workspace member
  And an ATC with layer, tags, User Story anchor, Acceptance Criteria anchors, three steps, and two assertions
  When they duplicate the ATC
  Then a new ATC row is created
  And the new ATC has the same layer, tags, anchors, steps, and assertions in the same order
  And the source ATC remains unchanged

Scenario: Default title uses copy suffix
  Given an ATC titled "Login happy path"
  When I duplicate it without providing a custom title
  Then the new ATC title is "Login happy path (copy)"

Scenario: Custom title overrides default title
  Given an ATC titled "Login happy path"
  When I duplicate it with custom title "Login with remember-me"
  Then the new ATC title is "Login with remember-me"

Scenario: Custom title is validated
  Given an authenticated workspace member
  When they duplicate an ATC with a custom title shorter than 3 chars or longer than 200 chars after trim
  Then the request is rejected with a validation error
  And no rows are created

Scenario: Duplicate is independent from source
  Given I duplicated an ATC
  When I edit a step, assertion, title, tag, or layer in the copy
  Then the source ATC is unchanged

Scenario: Duplicate is a fresh ATC entity
  Given I duplicate an ATC
  Then the new ATC has a new id
  And a freshly computed slug
  And version 1
  And no shared step/assertion rows with the source

Scenario: Workspace authorization is enforced
  Given a source ATC in another workspace or a user with viewer-only access
  When duplication is attempted
  Then the request is rejected
  And no rows are created

Scenario: Duplicate operation is transactional
  Given duplication starts
  When copying parent, steps, assertions, or anchors fails
  Then the full transaction rolls back
  And no partial duplicate remains

Scenario: Duplicate emits create event
  Given duplication succeeds
  When the transaction commits
  Then `atc.created` is emitted for the new ATC
  And `atc.duplicated` is not emitted unless explicitly added to scope
```

Draft test focus:

- API happy path copies title/layer/tags/anchors/steps/assertions.
- Default title and custom title behavior.
- Title trim and 3..200 boundary validation.
- New id, new slug, version reset.
- Deep-copy verification for step/assertion rows.
- Edit duplicate and verify source remains unchanged.
- Edit source and verify duplicate remains unchanged.
- Viewer and cross-workspace authorization failures.
- Missing or archived source behavior.
- Transaction rollback on child-copy failure.
- `atc.created` event payload.
- OpenAPI contract match for path/body/response/errors.
- UI smoke for Duplicate action and redirect/open-new-ATC behavior, if UI is in scope.

Recommendation: keep [https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23](https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23) in Shift-Left QA until API contract, role matrix, title collision behavior, archived source behavior, and error/response shapes are clarified.

---

### Automation for Jira - 6/20/2026, 9:03:01 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 6/20/2026, 9:03:07 AM

✅ Pull Request is successfully MERGED. Task is Done.

---

### Benjamin Segovia - 6/22/2026, 7:40:01 AM

## QA session paused — blocked by [https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175](https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175)

QA started a sprint-testing session on this story today but could not reach the ATC library to verify any of the 4 ACs.

> ***WARNING:**** ****Blocker:**** the staging login flow (magic-link) is broken — the OTP email has no matching code-entry field on the "Check your inbox" screen. Filed as ****BK-175**** (links as **Blocks* this story). Confirmed by reproducing twice with independent OTP emails; see [https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175](https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175) for full repro + evidence.

***Separately, worth a check once unblocked:*** a static review of `upex-bunkai-tms` (git log + branches) found no commits, routes, migrations, or RPC related to duplicating an ATC, despite automated comments on this ticket reporting a PR merged on 2026-06-20. Please confirm the feature is actually deployed to staging before QA resumes — testing against code that isn't there would just waste another pass.

***Status:**** leaving this ticket at **Ready For QA* — nothing about the duplicate-ATC feature itself has been disproven, we simply couldn't reach it. QA will resume once [https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175](https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175) is resolved and the deployment status above is confirmed.

---

### Ely - 6/24/2026, 12:49:03 PM

Dev clarification: the ATC Duplicate feature IS merged to staging — PR #45, merge commit 5f02be9 (files app/api/v1/atcs/[id]/duplicate, migration 0028, tests). The "PR merged" automation that fired earlier was correct for this ticket. It was also blocked by [https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175](https://jira.upexgalaxy.com/browse/BK-175#icft=BK-175) on the QA side. If staging shows no feature, this is a staging DEPLOYMENT/refresh gap (cf. [https://jira.upexgalaxy.com/browse/BK-142#icft=BK-142](https://jira.upexgalaxy.com/browse/BK-142#icft=BK-142) Vercel staging env), not missing code — please re-verify against the latest staging deploy before sending back to Dev.

---

### Benjamin Segovia - 6/28/2026, 4:32:16 PM

QA Testing Complete - [https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23](https://jira.upexgalaxy.com/browse/BK-23#icft=BK-23)

Environment: Staging ([https://staging-upexbunkai.vercel.app](https://staging-upexbunkai.vercel.app/))
Result: FAILED (14/18 TCs — 1 FAILED, 2 BLOCKED)

TEST DATA USED:

- ATC: "Login happy path" (created via API during session)

VERIFIED BEHAVIORS:

- AC1: Steps and assertions fully copied to duplicate — VERIFIED (API)
- AC2: Default title = source + "(copy)" — VERIFIED
- AC3: Title boundary validation (3–200 chars) — VERIFIED
- AC4: Copy independence — editing copy does not change original — VERIFIED (API)

FAILED VERIFICATION:

- AC3 (TC11): Custom title via new_title field — FAILED

Expected: {"new_title":"Custom Title"} applies the custom title per FR-014

Actual: new_title silently ignored; default title applied; no error signal
Impact: API clients following the spec get wrong title with no feedback

DEFECTS:

- [https://jira.upexgalaxy.com/browse/BK-185#icft=BK-185](https://jira.upexgalaxy.com/browse/BK-185#icft=BK-185): ATC Library: Duplicate: No UI Duplicate action (MAJOR — DoD blocker)
- [https://jira.upexgalaxy.com/browse/BK-184#icft=BK-184](https://jira.upexgalaxy.com/browse/BK-184#icft=BK-184): ATC Library: Duplicate: API field name mismatch new_title vs title (MEDIUM)

OBSERVATIONS:

- DB leg not executed: staging-dhhub MCP not configured (DBHUB_* empty in .env)
- TC02/TC03 BLOCKED: 0-step ATC test data cannot be created via UI

Artifacts: ATP (customfield*10067), ATR (customfield*10147)

Next: Fix [https://jira.upexgalaxy.com/browse/BK-185#icft=BK-185](https://jira.upexgalaxy.com/browse/BK-185#icft=BK-185) (UI action) + [https://jira.upexgalaxy.com/browse/BK-184#icft=BK-184](https://jira.upexgalaxy.com/browse/BK-184#icft=BK-184) (field name) → re-test Stage 2 on failed TCs

---

### Benjamin Segovia - 8/7/2026, 8:58:32 AM

## Retest complete — corrected verdict: PASSED (blocked only by a Jira permission gap, not by app behavior)

Retested against staging (`https://staging-upexbunkai.vercel.app`) now that BK-184 and BK-185 are both Cerrada.

An earlier same-day pass mis-read TC11/TC10 as a regression (tested the `title` field). That was a mistake in how the retest was briefed, not a real finding: BK-184's shipped fix (PR #107, commit `c74f36c`) renamed the request field from `title` to `new*title` to match the SRS spec — `new*title` applying and `title` being silently ignored is the correct, documented post-fix behavior. A combined-body probe (`{"title":"AAAA","new_title":"BBBB"}` → applied `"BBBB"`) confirms this directly.

***Corrected results — 17/17 applicable TCs PASSED******:***

- TC11 / TC10 (custom title via `new_title`) — PASSED
- UI Duplicate action, both entry points (BK-185 fix) — PASSED
- TC02 (0-step ATC duplicate) — DESCOPED: a 0-step ATC cannot exist anywhere in the system (`POST /atcs` with `steps:[]` → `422 validation_failed`, API-level `min(1)`). Structural, not a gap.
- TC03 (0-assertion ATC duplicate) — PASSED (previously BLOCKED on missing test data, now seeded and verified)
- AC1 / AC4 / TC17 regression sanity — PASSED, no collateral damage from either fix

***Known gap (non-blocking)******:**** the DB leg (row-level isolation check for AC4) could not be run — `DBHUB_**` is unset in `.env` for the staging DB MCP, same gap hit during today's BK-175 retest. UI-level evidence for AC4 stands in as the available signal; a DB spot-check is recommended once DBHub access is configured.

***Why this ticket isn't transitioned yet******:*** the authenticated QA account currently lacks `EDIT*ISSUES` / `TRANSITION*ISSUES` on this specific issue type (Historia/Story) in project BK — confirmed via `mypermissions`, and reproducible on both the ATR custom-field write and the status transition. The same account has full edit/transition rights on Bug-type BK issues (used earlier today on BK-175). This reads as an issue-type-scoped permission-scheme gap, likely a leftover from the upexgalaxy71 site migration. Flagging for whoever has permission-scheme access on project BK — once granted, this ticket moves straight to QA Approved with no re-testing needed.

---

### Benjamin Segovia - 8/10/2026, 5:53:46 AM

## QA note — the "blocked" signal on this story is stale link data, not an active blocker

> ***INFO:*** Posting this so the analysis does not have to be redone the next time an automated sprint report flags BK-23 as blocked. Verified live on 2026-08-10 against `upexgalaxy71`.

### Current state

BK-23 is ***QA Approved*** (resolved 2026-08-07). Retest covered 17/17 applicable TCs, all PASS. Nothing on this story is waiting on QA.

### Why reports still call it blocked

Closing a defect does not remove its issue link — it only changes the status on the other end. BK-23 therefore still carries link records whose counterparts are all closed:

| Link type | Counterpart | Counterpart status | Closed on |
| --- | --- | --- | --- |
| Blocks (outward) | BK-185 | Cerrada | 2026-08-03 |
| Blocks (inward) | BK-175 | Cerrada | 2026-08-07 |
| Problem/Incident (inward) | BK-184 | Cerrada | 2026-08-03 |
| Problem/Incident (inward) | BK-185 | Cerrada | 2026-08-03 |
| Dependencies (outward) | BK-18 | Ready For Release | — |

Any check that walks `issuelinks` and counts blockers ***without*** filtering on `statusCategory != done` will read those records as active blockers. That is the false positive: it confirms the link exists, not that the blocker is open.

### Evidence that nothing was reopened

JQL `project = BK AND updated >= -2d` returns 34 work items. BK-23, BK-184 and BK-185 are ***absent*** from that result — their last modification remains 3 and 7 August respectively. There has been no reopen and no regression.

### Recommendation

Fix the reporting filter rather than the data. Adding `statusCategory != done` to the blocker walk resolves this permanently and keeps the `Problem/Incident` links intact, which are the only record tying defects BK-184 and BK-185 back to this story. The stale links are being left in place deliberately.

---


_Synced from Jira by sync-jira-issues_
