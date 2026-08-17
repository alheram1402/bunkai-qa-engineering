# Shift-Left Refinement: BK-202 — TMS-Test Plan | Create a test plan grouping tests for a goal

**Status**: Refined — Awaiting PO Estimation
**Mode**: Shift-Left (pre-sprint, batch grooming)
**Refined on**: 2026-08-14
**Refined by**: QA — Shift-Left batch session
**Modality**: Xray

---

## Phase 1 — Critical Analysis

### Business context
- **Primary persona affected**: Mateo Silva, QA Lead — creates the plan container to declare a cycle's intended scope.
- **Secondary personas (if any)**: Elena Vargas, Senior QA Engineer — will curate the plan's Test membership in sibling story BK-203 (out of scope here, but she is a downstream consumer of the container this story creates).
- **Business value proposition**: replaces "assembling the picture by hand" (per epic BK-201 description) with a declared, named scope a QA Lead can point to before a cycle starts, instead of purely ad-hoc Runs.
- **KPI(s) influenced**: not explicitly stated in the Story; the epic frames it as an input to "what does this sprint actually cover" visibility — no numeric KPI defined at Story level.
- **User journey position**: planning step, upstream of Manual Execution & Runs (epic BK-30) and of Coverage & Traceability reporting (epic BK-44, per epic.md traceability note "Closed plans become read-only history, feeding the audit-evidence narrative of... Coverage & Traceability").

### Technical context
- **Frontend**: none exists yet for Test Plans. Design intent (business-rules.md + mockup.md): new "Test Plans" tab in the explorer rail following the app's existing persistent-tabs pattern (same as ATCs/Tests tabs); list view (table: name, goal, status chip, test count, creator); detail view (header + empty test area); create via a compact 3-field dialog; inline edit of name/description/goal from the detail header.
- **Backend**: **no existing endpoints.** A grep of `.context/business/business-api-map.md` (all 64 scanned `app/api/v1/**/route.ts` files) for "test plan" returns zero hits.
- **External services**: none.
- **Integration points specific to this Story**: Project entity (exists), Workspace member role / RBAC (exists per business-data-map.md). No integration with Test / ATC data in this Story — membership is explicitly out of scope (sibling story BK-203).

### Story complexity
| Axis | Rating | Why |
|------|--------|-----|
| Business logic | Low | CRUD container with a case-insensitive/trimmed uniqueness rule and a length range — no calculations, no state machine beyond a single "Open" starting state |
| Integration | Low (for this Story's own AC set) | No Test/ATC read or write in this Story; container only. Epic-level integration risk is High but belongs to sibling stories |
| Data validation | Medium | Name uniqueness (case-insensitive + trim) and 1–100 char range both need EP + BVA coverage; interacts with role (member vs viewer) |
| UI | Medium | Net-new tab + list + detail + dialog + inline edit, but follows an existing app-shell pattern (ATCs/Tests tabs) — lowers net-new UI risk |

**Estimated test effort**: Medium — a fairly small CRUD-container AC set, but elevated by (a) zero existing implementation to anchor against (fully greenfield) and (b) the role × name-validity × duplicate-check interaction needing a decision-table pass.

### Epic-level inheritance (if applicable)
- No `feature-test-plan.md` exists yet under `EPIC-BK-201-test-plans-milestones/` (only `epic.md` + `stories/`) — this is the first Story of the epic to go through Shift-Left, so there is nothing upstream to cite; findings here should seed that file when it is later generated.
- **Epic-level scope boundary restated**: epic.md is explicit that "A Test Plan is a curated set of references to existing Tests — it introduces no new authoring or execution surface." This Story must not introduce any Test/ATC-authoring UI — confirmed already absent from Scope.md.
- **Epic-level dependency restated**: epic.md's own Traceability section lists epic BK-24 (Tests) and epic BK-30 (Manual Execution & Runs) as prerequisites this epic "builds directly on" — consistent with this Story's own description line ("activates once its dependency epics... are live"). See **Data feasibility flags** below for the concrete risk this creates.

---

## Phase 2 — Story Quality Analysis

### Ambiguities
| # | Location in Story | Question for PO/Dev | Impact on testing | Suggested clarification |
|---|-------------------|---------------------|-------------------|--------------------------|
| 1 | Business rule "Creating and editing plans requires the member role or higher" | Is edit restricted to the plan's original creator, or can any project member (role ≥ member) edit any plan? | Determines whether a "non-creator member edits" scenario is a valid positive case or should be a negative/permission case | State explicitly: "any member with role ≥ member may edit any plan in the project, not only its creator" (or the opposite, if creator-only is intended) |
| 2 | Scope.md: "Name validation with a clear duplicate-name message" (general scope bullet, not scoped to create only) vs. AC3 (only exercises create) | Does renaming an existing plan re-trigger the same uniqueness check as creation? | Whole negative-outline branch (rename-collision) either exists or doesn't | Add an explicit AC or business-rule line: "the uniqueness check applies on both create and rename" |
| 3 | AC3 ("a message that a plan with that name already exists") / AC4 ("a validation message asking for a name") | What is the exact, verbatim UI copy for each message? | Cannot write a precise assertion — as written, both are paraphrases, not literal strings | Provide literal copy, e.g. `"A test plan named '{name}' already exists in this project."` |
| 4 | Business rule: "compared after trimming spaces" | Does "spaces" mean the ASCII space character only, or all whitespace (tabs, newlines, non-breaking space U+00A0)? | Changes expected outcome for whitespace-padded boundary/duplicate test data | Clarify scope of "trimming" — ASCII space only vs. Unicode-whitespace-aware trim |

### Gaps (missing info)
| # | Type | Why critical | What to add | Risk if omitted |
|---|------|---------------|--------------|------------------|
| 1 | AC / Scope | Neither this Story's Scope/Out-of-scope nor epic.md mention deleting a Test Plan anywhere | State whether Delete is intentionally never planned (Close, per BK-207, replaces it) or simply not yet scheduled | QA may later flag a missing Delete affordance as a defect when it was never intended, or a real gap ships silently |
| 2 | Technical detail | Story never states whether the create/edit validation (length, uniqueness, role) is enforced server-side independent of the UI hiding the button/dialog | Add an explicit rule: "all validation and the role gate are enforced at the API layer regardless of client state" | A viewer or a length/uniqueness violation could be pushed through a direct API call, bypassing the UI-only guard AC5 describes |
| 3 | Business rule | No maximum length is stated for description or goal (only name has the explicit 1–100 char rule) | Add an explicit max (or confirm "unbounded by design") | An untested/unbounded field can accept payloads that break the detail-header layout or storage limits |
| 4 | Business rule | No maximum count of Test Plans per project is stated | Confirm unlimited-by-design vs. an intended soft/hard cap | List/pagination behavior at scale is untested and undesigned |

### Edge cases not in Story
| # | Scenario | Expected behavior (best guess) | Criticality | Action |
|---|----------|-------------------------------|--------------|--------|
| 1 | Two members submit create requests for the same plan name within the same request window (race condition) | Exactly one create succeeds; the second is rejected as a duplicate even if it passed client-side/optimistic validation | High | Add to AC (**NEEDS PO/DEV CONFIRMATION**) |
| 2 | Double-click / double-submit on the create dialog's Save button | Idempotent — at most one plan is created per user intent | Medium | Test only |
| 3 | Plan name padded with tabs or a non-breaking space rather than plain ASCII spaces | Behavior depends on Ambiguity #4 — inferred: still trimmed/rejected as duplicate if whitespace-generic trim is used | Medium | Add to AC (**NEEDS PO/DEV CONFIRMATION**) |
| 4 | Description/goal field given a very long input (no stated max) | Undefined — inferred: either truncated, rejected, or stored unbounded | Medium | Add to AC (**NEEDS PO/DEV CONFIRMATION**) |
| 5 | A viewer-role user calls the create/edit API endpoint directly, bypassing the hidden UI button | Server rejects with 403, no plan created/updated | Critical | Add to AC (**NEEDS PO/DEV CONFIRMATION**) |
| 6 | A user is demoted from member to viewer mid-session; their client still shows a stale "New plan" button | Server re-checks the live role at submit time and rejects with 403 | High | Add to AC (**NEEDS PO/DEV CONFIRMATION**) |
| 7 | Renaming an existing plan to a name that collides with another plan already in the project | Rejected with the same duplicate-name message as create | High | Add to AC (**NEEDS PO/DEV CONFIRMATION**) |
| 8 | Plan name containing Unicode/emoji/RTL characters | Accepted as-is (no character-set restriction stated) | Low | Test only |

### Contradictions
No contradictions found. Description, Business Rules, Scope, Workflow, and Mockup are mutually consistent — notably Scope.md's "Edit a plan's name, description, and goal while the plan is open" and Mockup's "inline edit of name/description/goal from the detail header" both align with Business Rules' "Creating and editing plans requires the member role or higher," and comment T2 (Ely, 2026-07-11) confirms this reading was already PO-ratified: *"T2 confirmed: creating and editing plans stays member role and above."* (No question raised on this point — it is explicitly answered, per the anti-pattern-L7 rule against re-asking settled items.)

### Testability validation
**Verdict**: Partial

Issues:
- Exact error-message copy not given verbatim (AC3, AC4) — see Ambiguity #3.
- Server-side enforcement of validation + role is not stated independent of the UI — see Gap #2.
- Whether the uniqueness check applies to edit (rename), not just create, is unstated — see Ambiguity #2.
- No max length for description/goal — see Gap #3.

The 5 given ACs are otherwise concrete (specific names, roles, and expected list/status behavior), which is why this is Partial rather than No.

---

## Phase 3 — Refined Acceptance Criteria

### Original AC1 — Create a test plan with full details

#### Scenario 1.1: Should create a test plan with name, description, and goal (Type: Positive, Priority: High)
- **Given**: Mateo (member role) is signed in and viewing project "Bunkai Web" > Test Plans
- **When**: he submits name `"Release 2.4 regression"`, description `"Full regression before the 2.4 cut"`, goal `"Release 2.4"`
- **Then**:
  - UI: the plan appears in the Test Plans list with status chip "Open", test count 0, creator "Mateo Silva"
  - API: 201 Created with the plan's id, name, description, goal, status = open, created_by
  - DB: a new row exists in the Test Plan store, scoped to project "Bunkai Web"
  - System state: opening the plan's detail tab shows name, description, goal, creator, and an empty-state message ("This plan has no tests yet")

### Original AC2 — Create a minimal test plan with only a name

#### Scenario 1.2: Should create a minimal test plan with name only (Type: Positive, Priority: High)
- **Given**: Mateo is viewing the Test Plans section of a project
- **When**: he submits name `"Smoke pass"`, leaving description and goal empty
- **Then**: plan is created, listed with status "Open" and 0 tests; description/goal render as empty in the detail view without breaking layout

#### Scenario 1.3: Should accept a test plan name at exactly the 100-character boundary (Type: Boundary, Priority: Medium)
- **Given**: Mateo is creating a plan
- **When**: he submits a name of exactly 100 characters
- **Then**: plan is created successfully — the business rule's stated "1 to 100 characters" upper bound is inclusive

#### Scenario 1.4: Should reject a test plan name exceeding the 100-character boundary (Type: Boundary/Negative, Priority: High)
- **Given**: Mateo is creating a plan
- **When**: he submits a name of exactly 101 characters
- **Then**: plan is not created; a length-validation message is shown; no DB row is created

#### Scenario 1.5: Should accept a test plan name that trims to exactly 1 character (Type: Boundary, Priority: Medium)
- **Given**: Mateo is creating a plan
- **When**: he submits `" A "` (single character padded with spaces)
- **Then**: plan is created with name `"A"` — proves both the 1-char lower bound and the trim rule

### Original AC3 — Duplicate plan name in the same project is rejected

#### Scenario 2.1: Should reject a duplicate plan name differing only by case (Type: Negative, Priority: Critical)
- **Given**: a plan named `"Release 2.4 regression"` already exists in project "Bunkai Web"
- **When**: Mateo submits `"release 2.4 regression"`
- **Then**: plan is not created; message states a plan with that name already exists in the project; no new DB row; original plan unaffected

#### Scenario 2.2: Should reject a duplicate name padded with leading/trailing spaces (Type: Boundary/Negative, Priority: High)
- **Given**: a plan named `"Smoke pass"` already exists
- **When**: Mateo submits `"  Smoke pass  "`
- **Then**: rejected as a duplicate — proves the trim rule applies to the uniqueness check itself, not only to the min-length check

#### Scenario 2.3: Should allow the same plan name to be reused in a different project (Type: Positive, Priority: Medium)
- **Given**: a plan named `"Smoke pass"` exists in project "Bunkai Web"
- **When**: a member creates a plan named `"Smoke pass"` in a different project, "Bunkai Mobile"
- **Then**: plan is created successfully — uniqueness is scoped per project, not global (per business rule)

#### Scenario 2.4: Should reject a duplicate name padded with a tab or non-breaking space — **NEEDS PO/DEV CONFIRMATION** (Type: Boundary/Negative, Priority: Medium)
- **Given**: a plan named `"Smoke pass"` already exists
- **When**: a member submits `"Smoke pass\t"` (trailing tab) or a name padded with U+00A0
- **Then**: inferred — still rejected as a duplicate if "trimming spaces" is whitespace-generic; behavior depends on Ambiguity #4

#### Scenario 2.5: Should reject a plan rename that collides with another existing plan's name — **NEEDS PO/DEV CONFIRMATION** (Type: Negative, Priority: High)
- **Given**: plans `"Release 2.4 regression"` and `"Smoke pass"` both exist in the project
- **When**: a member edits `"Smoke pass"` and renames it to `"release 2.4 regression"`
- **Then**: inferred — rename rejected with the same duplicate-name message; edit not persisted

#### Scenario 2.6: Should reject one of two concurrent create requests for the same plan name (race condition) — **NEEDS PO/DEV CONFIRMATION** (Type: Negative/Edge, Priority: High)
- **Given**: no plan named `"Regression X"` exists yet in the project
- **When**: two members submit create requests for `"Regression X"` within the same request window
- **Then**: inferred — exactly one create succeeds; the other fails with the duplicate-name error even if it passed client-side validation first (requires a DB-level unique constraint, not an app-level check alone)

### Original AC4 — Blank name is rejected

#### Scenario 3.1: Should reject a whitespace-only plan name (Type: Negative, Priority: Critical)
- **Given**: Mateo is creating a test plan
- **When**: he submits `"   "` (spaces only)
- **Then**: plan is not created; validation message asks for a name; no DB row created

#### Scenario 3.2: Should reject an empty-string plan name (Type: Negative/Boundary, Priority: Critical)
- **Given**: Mateo is creating a test plan
- **When**: he submits `""` (the field is never touched)
- **Then**: same rejection as Scenario 3.1 — collapsed as a data row of the same partition (identical expected behavior), not a separate outline

#### Scenario 3.3: Should reject a name made only of tab/newline whitespace — **NEEDS PO/DEV CONFIRMATION** (Type: Negative/Boundary, Priority: Medium)
- **Given**: Mateo is creating a test plan
- **When**: he submits `"\t\n"`
- **Then**: inferred — also rejected as blank if trim treats all whitespace as blank-equivalent; depends on Ambiguity #4

### Original AC5 — Viewer cannot create a plan

#### Scenario 4.1: Should hide the create-plan option from a viewer-role user (Type: Negative/Permissions, Priority: Critical)
- **Given**: Lucia has the viewer role in the workspace/project
- **When**: she opens the Test Plans section of the project
- **Then**: the "New plan" option is not available/rendered to her

#### Scenario 4.2: Should reject a direct API create-plan request from a viewer-role user — **NEEDS PO/DEV CONFIRMATION** (Type: Negative/Security, Priority: Critical)
- **Given**: Lucia (viewer role) holds a valid session
- **When**: she calls the create-plan API endpoint directly, bypassing the UI
- **Then**: inferred — 403 Forbidden, no plan created; server enforces the role gate independent of the hidden button (AC5 as written only describes the UI affordance)

#### Scenario 4.3: Should allow a member-role user to edit an existing plan they did not create (Type: Positive, Priority: High)
- **Given**: Elena has member role in the project; plan "Smoke pass" was created by Mateo
- **When**: Elena edits the plan's description to `"Updated for sprint 12"`
- **Then**: plan updated (200, DB row updated) — the business rule states "member role or higher" with no owner qualifier, so editing is not restricted to the original creator (ties to Ambiguity #1 — confirm this reading)

#### Scenario 4.4: Should reject a viewer's inline-edit attempt on an existing plan (Type: Negative/Permissions, Priority: Critical)
- **Given**: Lucia (viewer) opens an existing plan's detail tab
- **When**: she attempts the inline edit affordance on name/description/goal
- **Then**: edit controls are not available to her — explicitly covered by business rule T2 ("creating and editing plans stays member role and above"), so content is not inferred, only the concrete Given/When/Then framing is derived

#### Scenario 4.5: Should re-verify role server-side even with a stale client-cached role — **NEEDS PO/DEV CONFIRMATION** (Type: Negative/Security, Priority: High)
- **Given**: a user held member role when their client last loaded, but has just been demoted to viewer server-side
- **When**: they submit a create or edit request using the stale client state
- **Then**: inferred — server rejects with 403 based on the live role, not the cached client role

---

## Phase 4 — Test Outlines (DRAFT — outline names only)

### Coverage estimate
| Type | Count | Notes |
|------|-------|-------|
| Positive | 6 | Happy-path create (full + minimal), boundary-accept variants, cross-project name reuse, non-creator member edit |
| Negative | 6 | Duplicate (case + padding), blank/empty name, viewer hidden from create, viewer blocked from edit |
| Boundary | 3 | 100/101-char name length + whitespace-class edge cases (2 of 3 are NEEDS PO/DEV CONFIRMATION) |
| Integration | 4 | Server-side enforcement + concurrency — ALL 4 are NEEDS PO/DEV CONFIRMATION |
| **Total** | **19** | (drives PO estimation) |

**Rationale**: the 5 given ACs are individually simple, but each hides at least one partition or boundary the AC text is silent on (Principle 5) — the name field alone needs 3 boundary outlines (1-char, 100-char, 101-char) beyond the literal blank-name AC, and the role gate needs 2 API-level integration outlines beyond the literal UI-hiding AC. Medium data-validation complexity (Phase 1) plus the role × validity × duplicate interaction (a 2+-condition Decision Table trigger) account for the rest.

### Outline list (NAMES ONLY — preconditions in 1 line, expected in 1 line)

#### Positive
- **Should create a test plan with name, description, and goal** — Pre: member role, project selected. Expected: plan listed status Open, 0 tests, detail shows all fields.
- **Should create a minimal test plan with name only** — Pre: member role. Expected: plan listed Open, 0 tests; empty description/goal render safely.
- **Should accept a test plan name at exactly the 100-character boundary** — Pre: member role. Expected: plan created (upper bound inclusive).
- **Should accept a test plan name that trims to exactly 1 character** — Pre: member role. Expected: plan created after trim (lower bound inclusive).
- **Should allow the same plan name to be reused in a different project** — Pre: plan "Smoke pass" exists in project A. Expected: plan "Smoke pass" creatable in project B.
- **Should allow a member-role user to edit a plan they did not create** — Pre: plan exists, editor has member role, not the creator. Expected: 200, fields updated and persisted.

#### Negative
- **Should reject a duplicate plan name differing only by case** — Pre: plan exists. Expected: rejected, duplicate message, no new DB row.
- **Should reject a duplicate name padded with leading/trailing spaces** — Pre: plan exists. Expected: rejected as duplicate (trim applies pre-uniqueness-check).
- **Should reject a whitespace-only plan name** — Pre: none. Expected: validation message asking for a name, no plan created.
- **Should reject an empty-string plan name** — Pre: none. Expected: same rejection as whitespace-only (same partition).
- **Should hide the create-plan option from a viewer-role user** — Pre: viewer role. Expected: "New plan" affordance absent.
- **Should reject a viewer's inline-edit attempt on an existing plan** — Pre: viewer role, plan exists. Expected: edit controls unavailable.

#### Boundary
- **Should reject a test plan name exceeding 100 characters (101 chars)** — Pre: member role. Expected: validation error, no plan created.
- **Should reject a name made only of tab/newline whitespace** — NEEDS PO/DEV CONFIRMATION — Pre: member role. Expected (inferred): treated as blank, rejected.
- **Should reject a duplicate name padded with a tab or non-breaking space** — NEEDS PO/DEV CONFIRMATION — Pre: plan exists. Expected (inferred): still caught as duplicate under a whitespace-generic trim.

#### Integration
- **Should reject a direct API create-plan request from a viewer-role session** — NEEDS PO/DEV CONFIRMATION — Pre: viewer holds a valid session. Expected (inferred): 403, server enforces role independent of the UI.
- **Should re-verify role server-side on submit despite a stale client-cached role** — NEEDS PO/DEV CONFIRMATION — Pre: role demoted mid-session. Expected (inferred): 403 based on live role.
- **Should reject one of two concurrent create requests for the same plan name** — NEEDS PO/DEV CONFIRMATION — Pre: two near-simultaneous requests, same name, same project. Expected (inferred): exactly one succeeds; backed by a DB unique constraint, not app-check alone.
- **Should reject a plan rename that collides with another existing plan's name** — NEEDS PO/DEV CONFIRMATION — Pre: two plans exist in the project. Expected (inferred): rename rejected with the same duplicate-name message as create.

> **NOT included here** (deferred to in-sprint planning by `/sprint-testing` Stage 1): parametrization tables, per-outline test-data JSON, numbered test steps, Faker generation strategies. Coverage estimate IS included because PO uses it for estimation.

---

## Phase 5 — Edge Cases (DRAFT)

| # | Edge case | In original Story? | Criticality | Action |
|---|-----------|---------------------|--------------|--------|
| 1 | Concurrent duplicate-name creation race | No | High | Add to AC (PO confirm) |
| 2 | Double-click / double-submit on create dialog (idempotency) | No | Medium | Test only |
| 3 | Name padded with tabs or non-breaking space | No | Medium | Add to AC (PO confirm trim scope) |
| 4 | Name at exactly 100 vs. 101 characters | Implied by the business rule's stated range, not by an AC | High | Test only — rule is already explicit |
| 5 | Description/goal with no stated max length | No | Medium | Add to AC (PO confirm max length) |
| 6 | Renaming a plan into collision with an existing name | No | High | Add to AC (PO confirm) |
| 7 | Viewer hitting the create/edit API directly, bypassing the UI | No | Critical | Add to AC (PO/security confirm) |
| 8 | Stale client-cached role after a mid-session demotion | No | High | Add to AC (PO/security confirm) |
| 9 | Unicode/emoji/RTL characters in the plan name | No | Low | Test only |
| 10 | Whether Delete is planned anywhere for a Test Plan | No | Medium | Ask PO — scope question, not a test outline |
| 11 | Maximum plan count per project (unlimited vs. capped) | No | Low | Ask PO |

> Test-data generation strategy + Faker recipes are NOT defined here. They land in `/sprint-testing` Stage 1 when the feature exists.

---

## Story Quality Assessment

**Verdict**: Needs Improvement

**Key findings**:
- The 5 given ACs are clear and testable for the happy paths they literally describe, but the Story is silent on server-side enforcement of validation and the role gate independent of the UI, on whether uniqueness re-checks on edit/rename, and on concurrency/idempotency — all genuine risk-beyond-AC gaps typical of a CRUD-container story (Principle 5, `test-design-doctrine.md`).
- The Story's own dependency note ("activates once its dependency epics... are live") combined with a confirmed zero footprint of "Test Plan" anywhere in the current data/API/feature maps is a data-feasibility risk that should be resolved with PO before this Story is estimated, independent of the AC quality issues above.

---

## Critical Questions for PO

> These BLOCK sprint planning until answered.

1. **Should BK-202 stay in Estimation until epic BK-24 (Tests) ships, or is the plan container decoupled enough to build and estimate now against a stub?**
   - **Context**: the Story description states it "activates once its dependency epics (Tests, Manual Execution & Runs) are live in the product," and BK-24 is currently at status "Planificación" (Planning) — its earliest lifecycle stage. However, BK-202's own AC set never reads or writes ATC/Test data — it is a pure container (name/description/goal); Test membership is explicitly out of scope (sibling story BK-203). A grep across `business-data-map.md` (31 entities), `business-api-map.md` (all 64 scanned routes), and `business-feature-map.md` (42 features) found zero references to "Test Plan" anywhere — this is fully greenfield, not a partially-built feature. By contrast, the epic's sibling Milestone half (same epic BK-201) is materially further along: BK-205 (Create a milestone) is already status "Ready For QA," and Milestone as an entity already has full CRUD (table, RPC, API, forms) live per `business-feature-map.md` FEAT-015 — so epic BK-201 is not uniformly blocked, only the Test Plan half is genuinely greenfield.
   - **Impact if unanswered**: Dev may over- or under-scope the Story, or estimation stalls waiting on an epic that is not actually a hard blocker for this specific Story's own AC set.
   - **Suggested answer**: none offered — this is a genuine sequencing call for PO.

2. **Is Delete ever planned for a Test Plan, or is Close (sibling story BK-207) the only way a plan leaves the "Open" state, making Delete permanently out of scope for the whole epic?**
   - **Context**: neither this Story's Scope/Out-of-scope sections nor `epic.md` mention Delete anywhere. `epic.md` states "Closed plans become read-only history," suggesting Delete may be intentionally absent by design in favor of Close.
   - **Impact if unanswered**: the ambiguity persists across every future Test Plan story; QA might later flag a missing Delete affordance as a defect when it was never intended, or a real gap ships silently.
   - **Suggested answer**: likely intentional (Close replaces Delete) — PO to confirm explicitly.

3. **Is the "member role or higher" gate on create/edit enforced server-side, independent of the UI hiding the affordance, and does it re-check the live role at submit time rather than trusting a client-cached role?**
   - **Context**: AC5 and business rule T2 only describe the UI affordance being absent for viewers; the Story is silent on API-level enforcement.
   - **Impact if unanswered**: unconfirmed, this is a real authorization gap — a viewer could create/edit plans via a direct API call, or a just-demoted member could push through a write before their client refreshes.
   - **Suggested answer**: enforce server-side on every write, independent of UI state (standard practice) — PO/Dev to confirm as an explicit rule rather than an assumption.

4. **Does renaming an existing plan re-trigger the same case-insensitive, trimmed uniqueness check as creation?**
   - **Context**: Scope.md lists "Name validation with a clear duplicate-name message" as a general scope bullet (not scoped to create-only), but all 5 given ACs and AC3's scenario only exercise creation.
   - **Impact if unanswered**: if uniqueness is create-only, the business rule's own invariant ("Plan names are unique per project") can be silently broken via rename, and no current AC protects against it.
   - **Suggested answer**: yes, apply the same check on edit to preserve the stated invariant — PO to confirm.

---

## Technical Questions for Dev

> These do not block PO but block implementation.

1. **What is the exact, verbatim error-message copy for the duplicate-name rejection (AC3) and the blank-name rejection (AC4)?** — the Story paraphrases both ("a message that a plan with that name already exists," "a validation message asking for a name") without literal UI strings; needed to write precise assertions.
2. **Does "compared after trimming spaces" mean ASCII space (0x20) only, or all whitespace (tabs, newlines, non-breaking space U+00A0)?** — affects the expected outcome of both the uniqueness check and the blank-name check on whitespace-class test data.
3. **Is plan edit restricted to the plan's original creator, or can any project member with role ≥ member edit any plan?** — the business rule states "member role or higher" without an owner qualifier, implying any member; please confirm this reading is correct before it's built either way.
4. **What is the intended max length for description and goal?** — name has an explicit 1–100 char rule; description/goal have none stated.
5. **Is per-project name uniqueness backed by a DB-level unique constraint, or an app-level check only?** — determines whether the concurrent-duplicate-creation race (Edge Case #1) is actually closed.
6. **Is there an intended maximum number of Test Plans per project, or is the list unbounded by design?** — affects whether list/pagination behavior needs its own test coverage.

---

## Suggested Story Improvements

| # | Current state | Suggested change | Benefit |
|---|----------------|-------------------|---------|
| 1 | AC3: "he sees a message that a plan with that name already exists in the project" | Specify exact copy, e.g. `"A test plan named '{name}' already exists in this project."` | Removes ambiguity when writing the assertion later |
| 2 | Business rule describes validation only from the UI dialog's perspective | Add an explicit line: "all validation and the role gate are enforced server-side, independent of client state" | Closes a bypass-via-API risk before Dev estimates |
| 3 | Scope.md: "Name validation with a clear duplicate-name message" doesn't state whether it applies on edit | State explicitly whether rename re-validates uniqueness | Avoids shipping a gap where two plans can end up with colliding names after a rename |
| 4 | No stated max length for description/goal | Add an explicit max (or confirm "unbounded by design") | Removes an otherwise-untested, undesigned boundary |

---

## Data feasibility flags

- **Entity / fixture missing**: "Test Plan" has zero footprint anywhere in the current codebase or data model — a grep across `business-data-map.md` (31-entity schema), `business-api-map.md` (all 64 scanned routes), and `business-feature-map.md` (42-feature catalog) returns 0 hits for "test plan" (case-insensitive). This is fully greenfield, not a partially-built feature.
- **API contract gap**: no `test-plan`-shaped route exists in the scanned API surface; no OpenAPI schema entries for a Test Plan resource in `api/openapi-types.ts` at the time of this refinement.
- **Required pre-work**: the Story's own description states it "activates once its dependency epics (Tests, Manual Execution & Runs) are live in the product." Epic BK-24 (Tests) is currently at status "Planificación" (Planning) — its earliest lifecycle stage. Note for contrast: the sibling Milestone half of the *same* epic (BK-201) is materially further along — BK-205 is already "Ready For QA" with Milestone as a fully-built entity (table, RPC, API, forms — `business-feature-map.md` FEAT-015) — so BK-201 as a whole is not uniformly blocked, only the Test Plan half is.
- **Practical nuance for PO**: BK-202 itself does not read or write any Tests/ATC data — it is a pure name/description/goal container; Test membership is explicitly out of scope here (BK-203). Whether the stated "dependency epic" gate is a strict data blocker for BK-202's own narrow AC set, or a broader epic-sequencing decision, is exactly Critical Question #1 above — this flag documents the evidence, the PO question decides the sequencing.

---

## Recommended testing strategy

### Pre-implementation
- Resolve the 4 Critical Questions with PO before this Story is estimated.
- Resolve the 6 Technical Questions with Dev before implementation starts, to avoid rework on error-copy, trim scope, and edit-ownership assumptions.

### During implementation
- Verify server-side validation and the role gate are exercised via direct API calls, not only through the UI — AC5 as literally written only covers the UI affordance.
- Verify per-project name uniqueness is backed by a DB-level unique constraint, not an app-level check alone, given the concurrent-duplicate-creation edge case.

### Post-implementation (in-sprint by /sprint-testing)
- Full manual + smoke pass against staging once the BK-24/BK-30 dependency sequencing is clarified.
- Parametrize the boundary and whitespace-class test data (Faker/static) — deferred here per shift-left scope.

---

## Risks & mitigation

| # | Risk | Likelihood | Impact | Mitigated by which outlines |
|---|------|------------|--------|-------------------------------|
| 1 | Data-feasibility risk — BK-24 dependency sequencing unresolved | Medium | High | Critical Question #1 (sequencing) |
| 2 | Server-side bypass of create/edit via direct API call | Low | High | Integration outlines "reject direct API create from viewer session" + "re-verify role server-side despite stale client role" |
| 3 | Concurrent duplicate-name race produces two same-named plans | Low | Medium | Integration outline "reject one of two concurrent create requests" |
| 4 | Silent uniqueness gap on rename | Medium | Medium | Negative outline "reject a plan rename that collides with another existing plan's name" |

---

## Next steps

- [ ] PO answers Critical Questions before sprint planning
- [ ] Dev answers Technical Questions before estimation
- [ ] Story enters sprint at status `Ready For Dev` once estimated
- [ ] When Story reaches `Ready For QA`, `/sprint-testing` will short-circuit refinement (label `shift-left-reviewed` detected)
