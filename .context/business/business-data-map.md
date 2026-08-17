# Business Data Map — Bunkai

> Generated: 2026-08-12 · Synthesis of Phase 1-4 discovery outputs (`domain-glossary.md`, `business-model.md`, `user-journeys.md`, `architecture.md`, `functional-specs.md`, `backend.md`) — read-only reverse-engineering of `upex-bunkai-tms`. This document does not re-derive facts; it synthesizes the "what this system does" narrative from evidence already gathered and cited in those files. `upex-bunkai-tms/.context/` was not read at any point in this discovery.

```
+--------------------------------------------------------------------+
|                                                                      |
|   B U N K A I                                                       |
|   Test Management System for QA teams that think in                |
|   reusable test cases, not freeform scripts.                        |
|                                                                      |
|   Story -> Criterion -> ATC -> Test -> Run -> Bug                   |
|   -- one anchored chain, queryable in both directions --            |
|                                                                      |
+--------------------------------------------------------------------+
```

---

## 1. Executive Summary

Bunkai is a workspace-based Test Management System where the unit of value is not a document but a structured, reusable **Acceptance Test Case (ATC)**. Its own explainer page frames the problem directly: *"Test management tools store documents. They don't teach how to test."* (`business-model.md` §1). The product answers four concrete pains — duplicated test steps, coverage drift, scattered traceability, and bugs that lose their QA context the moment they leave the tool — each with a matching structural mechanism in the schema, not just a marketing claim: ATCs are *referenced*, not copied, into Tests; coverage is computed from the FK graph, not eyeballed; the Story → AC → ATC → Test → Run → Bug chain is anchored by real foreign keys; and a Bug carries its filing-time provenance (module, run, run step, ATC) frozen forever, independent of whether it also syncs to an external tracker like Jira.

Every workspace is a multi-tenant root. Inside it, three actor tiers do fundamentally different work on the same data: a **Viewer** only ever reads; a **Member** (the primary QA-engineer persona) authors ATCs, assembles Test chains, executes Runs, and files Bugs; an **Admin/Owner** additionally manages workspace membership, invites, and Personal Access Tokens. A fourth caller type — an **AI Agent or CI runner** authenticated via a scoped Personal Access Token — is architecturally a first-class peer of a human Member, not a bolted-on integration: it calls the exact same REST API, and `runs.executor_mode` (`human`/`agent`/`ci`) exists specifically to record which kind of actor drove a given execution (`business-model.md` §2, `architecture.md` §2).

The system's dominant cross-cutting risk, and the reason the architecture leans so heavily on Postgres-native enforcement (Row-Level Security plus hand-written `SECURITY DEFINER` RPC functions raising custom `45xxx` SQLSTATE codes) rather than TypeScript-layer checks, is multi-tenant isolation: nearly every table's authorization ultimately resolves back through `workspace_members` (`domain-glossary.md` §9). A second-order risk this document tracks throughout is snapshot integrity — Runs and the Bugs filed from them freeze a point-in-time copy of the Test/ATC/Step content specifically so that later edits or deletions never retroactively corrupt history.

```
+-------------------+     +----------------------+     +------------------------+
|      VIEWER       |     |       MEMBER          |     |     ADMIN / OWNER       |
|  (read-only)       |     |  (QA Engineer)         |     |  (workspace steward)    |
+-------------------+     +----------------------+     +------------------------+
| - Browse ATCs,     |     | - Author ATCs anchored |     | - Everything a Member   |
|   Tests, Runs, Bugs|     |   to >=1 AC             |     |   can do, plus:         |
| - Watch a live Run |     | - Chain ATCs into Tests|     | - Invite / manage       |
|   (no controls)    |     | - Start & mark Runs    |     |   workspace members     |
| - Read Milestones, |     | - File Bugs from a     |     | - Issue / revoke        |
|   traceability,    |     |   failed step           |     |   Personal Access       |
|   coverage reports |     | - Transition / assign  |     |   Tokens                |
|                     |     |   Bugs                  |     | - Set Milestone dates   |
| Value: confidence   |     | Value: write-once ATC  |     | Value: controls who     |
| the suite reflects  |     | library eliminates     |     | can act, and how much   |
| reality, without    |     | duplicated maintenance;|     | blast radius each seat  |
| risk of accidental  |     | in-context bug filing  |     | carries                 |
| writes              |     | preserves QA context   |     |                         |
+-------------------+     +----------------------+     +------------------------+
```

Two actors are structurally excluded from certain actions by design, not by convention: a Viewer's write attempts are rejected at both the UI (no affordance rendered) and the RLS/RPC layer independently (`architecture.md` §8); and a Bug can never be assigned to a Viewer (`bug_assignee_view_only`, SQLSTATE `45313`) because a Viewer cannot act on it (FR-010, `functional-specs.md`).

---

## 2. Entity Map

The schema defines 31 tables. Ten carry the primary business nouns a QA engineer authors or executes against; the remaining 21 are cross-cutting support tables (security hardening, auditing, notifications, imports). Full column-level detail for every table lives in `domain-glossary.md` §1 — this map adds the narrative of *why* each cluster exists and how the clusters connect.

```
WORKSPACE (tenant root)
  |-- WORKSPACE_MEMBER (role: viewer|member|admin|owner)
  |-- WORKSPACE_INVITE ---------> (redeemed into) WORKSPACE_MEMBER
  |-- ACCESS_TOKEN (PAT, scoped)
  |-- TEST (workspace-scoped, NOT project-scoped)
  |     `-- TEST_STEP --(references, not copies)--> ATC
  |-- NOTIFICATION / NOTIFICATION_PREFERENCE
  |
  `-- PROJECT (Application Under Test)
        |-- PROJECT_ENVIRONMENT (e.g. Staging, Production)
        |-- MILESTONE (release target date)
        |-- MODULE (self-referential tree, depth <= 6)
        |     |-- USER_STORY
        |     |     `-- ACCEPTANCE_CRITERION (ordered)
        |     |            `--<M:N, >=1 required>--> ATC
        |     |-- ATC (project-scoped)
        |     |     |-- ATC_STEP (ordered)
        |     |     `-- ATC_ASSERTION (ordered)
        |     `-- BUG (module-anchored)
        |
        `-- RUN (started from a TEST, targets a PROJECT_ENVIRONMENT)
              |-- RUN_ATC (frozen snapshot of one chain position)
              |     `-- RUN_STEP (frozen snapshot of one ATC step + execution evidence)
              `-- BUG (optional provenance: run_id / run_step_id / atc_id)
```

### Core entities

| Entity | Business Role | Why It Exists |
|---|---|---|
| Workspace | Multi-tenant root (tenant/org/team) | Every other row resolves its access back to a `workspace_id` — the single unit of billing-tier (`plan`) and isolation. |
| Workspace Member | Role assignment (viewer/member/admin/owner) at active/invited/suspended status | Ascending-permission RBAC join between a `Workspace` and an `auth.users` row; the row RLS ultimately walks back to on every table. |
| Project | Application Under Test (AUT) container | One project per real product being tested; scopes Modules, ATCs, Environments, Bugs, Milestones. |
| Module | Test-suite / feature-area folder (self-referential tree, depth <= 6) | Organizes Stories, ATCs, and Bugs into a navigable hierarchy mirroring how QA teams think about a product's surface area. |
| User Story | Unit of business intent | Anchors a testable slice of requirement, optionally imported from Jira; gates into `ready_to_test` before ATCs should be trusted against it (BK-15). |
| Acceptance Criterion | One ordered, individually testable condition of a Story | The unit an ATC must anchor to — this is the traceability chain's second link. |
| ATC (Acceptance Test Case) | "One observable behaviour, executable by humans or agents" | The atomic, reusable, versioned test-case building block — write once, reference everywhere; the product's primary differentiator. |
| Test | Named, workspace-scoped ordered chain of ATC *references* | Assembles reusable ATCs into an executable flow; the same ATC may appear at multiple chain positions. |
| Run | A started Test — a frozen, point-in-time snapshot | Preserves exactly what was executed and against what content, immune to later edits/deletes of the source Test/ATCs. |
| Project Environment | Named execution target (e.g. Staging, Production) | Scopes a Run to a real deployment target; one per Project. |
| Bug (Defect) | TMS-native defect record | Files a defect in-context (module + optional run/step/ATC provenance frozen at filing time), so QA context survives even if a tracker sync is optional or absent. |
| Milestone | Project-scoped release-target date | Lets a team track a date deadline against a Project without importing an external planning tool. |

### Supporting / cross-cutting entities

| Table | Purpose |
|---|---|
| `workspace_invites` | Hashed-token email+role invite, 7-day expiry, redeemed via `/api/v1/invites/accept`. |
| `access_tokens` | Personal Access Tokens (`bk_pat_<prefix>.<secret>`) for CLI/agent bearer auth; allow-listed scopes, soft-revoked only. |
| `import_jobs` | Async one-way Jira import job (by JQL), processed by a service-role worker. |
| `activity_log` | Audit-light event stream backing the in-app activity feed; also the source events for the notification triggers (§6). |
| `notifications` | Per-recipient personal inbox, 90-day visibility retention, realtime-replicated. |
| `notification_preferences` | Personal opt-out grid (`run_lifecycle`/`bug_lifecycle` x `in_app`/`email`), plus a structurally-locked `mentions` row reserved for a future Team Chat epic. |
| `idempotency_keys` | HTTP-level POST replay protection, 24h TTL, per-user. |
| `feature_flags` | Global or per-workspace boolean gates. |
| `user_view_state` | Per-user, per-project, per-view persisted UI state. |
| `magic_link_tokens` | Server-side audit trail of magic-link issuance/consumption. |
| `access_token_secrets`, `workspace_invite_secrets`, `magic_link_token_secrets` | Security-hardening split (`0011_split_token_secrets.sql`): the actual secret hash lives here, separate from its parent table's now-nullable hash column, so reading the parent alone cannot yield a usable secret. |

### Key relationships, narrated

- **The anchoring moat (Story -> AC -> ATC).** An ATC must reference at least one Acceptance Criterion, and every AC it references must belong to the exact User Story the ATC is anchored to (BR-004/BR-005, `functional-specs.md`). This is the traceability chain's foundation: without it, "coverage" would be an unenforceable claim.
- **Reference, not copy (ATC -> Test).** `test_steps.atc_id` is a foreign key, not a duplicated payload — editing an ATC's steps propagates to every Test that chains it, and `on delete restrict` on that FK means a chained ATC cannot be silently deleted out from under a Test (`domain-glossary.md` §1.8).
- **Snapshot, not live join (Test -> Run).** Starting a Test freezes `run_atcs.atc_title` and `run_steps.content/input_data/expected` as copies at that instant. A Run in progress is immune to a concurrent edit of its source Test/ATC — a deliberate design invariant, not an oversight.
- **Provenance, not ownership transfer (Run/Bug).** `bugs.run_id`/`run_step_id`/`atc_id` are nullable and frozen at filing time — a Bug remembers where it came from without depending on that Run/Step/ATC continuing to exist unchanged.
- **Workspace-scoped Tests vs. project-scoped ATCs.** Tests live one level higher in the tenancy tree than ATCs (`domain-glossary.md` §1.8) — a Test can chain ATCs from any Project inside the same Workspace, which is why Test creation's ATC picker loads the *whole workspace's* library (`user-journeys.md` Journey 2, step 5), not just the current Project's.

---

## 3. Business Flows

### 3.1 Workspace, Project & Module Hierarchy Setup

```
/  --(unauth)-->  /login  --(signup+OTP)-->  /projects (0 workspaces)
                                                   |
                                                   v
                                             /onboarding
                                       (create workspace, seeded owner)
                                                   |
                                                   v
                                             /projects (1 workspace, 0 projects)
                                                   |
                                                   v
                                            /projects/new
                                                   |
                                                   v
                                       /projects/[slug]  (Modules created
                                                           inline from here)
```

1. An unauthenticated visit to `/` redirects to `/login` (`app/page.tsx:14`).
2. The user enters an email; `check-email` (an intentional, documented exception to the app's own non-disclosure norm — BR-001) routes them to sign-in, OTP verification, or account creation.
3. A new account requires OTP confirmation (`signup` -> `202` -> `confirm` -> `200`) before a session is granted (FR-001).
4. `/projects` server-checks the user's `workspaces` (RLS-scoped); zero memberships redirects to `/onboarding` (`app/(app)/projects/page.tsx:38-39`).
5. `/onboarding` itself redirects *away* to `/projects` if the user already has a membership — the inverse gate (`onboarding/page.tsx:23`).
6. Submitting the onboarding form creates the Workspace and seeds the creator as `owner` (BR-002).
7. `/projects` now renders its empty state; the user navigates to `/projects/new`.
8. Project creation (name 3-200 chars, >=1 alphanumeric, workspace-unique non-reserved slug — BR-003) lands the user *inside* the new Project's detail page directly, not back on the index (an explicit fix referenced by code comment as BK-266, `functional-specs.md` FR-003).
9. From inside a Project, Modules are created as a self-referential tree (max depth 6, BR-7 in `domain-glossary.md`) to organize Stories, ATCs, and Bugs.

**Business rules**: BR-001 (email-existence disclosure, accepted tradeoff), BR-002 (creator seeded owner), BR-003 (Project name/slug validation), BR-7 (Module tree depth <= 6, `domain-glossary.md`).

**Code involved**: `app/page.tsx`, `app/(auth)/login/email-first-form.tsx`, `app/(app)/onboarding/onboarding-form.tsx`, `app/(app)/projects/create-project-form.tsx`, `supabase/migrations/0001_tenancy.sql`, `0002_projects_modules.sql`, `0006_bootstrap_workspace.sql` (filename-only evidence).

**Discovery Gap** (carried from `user-journeys.md`): the explicit Module create/edit form flow (as opposed to the resulting tree structure) was not traced step-by-step this session — only inferred from `project-explorer.tsx`'s post-create navigation pattern.

---

### 3.2 Author an ATC and Chain It Into a Test

```
/projects/[slug] --Create ATC--> /projects/[slug]/atcs/new?story=&ac=
                                          |
                                   POST /api/v1/atcs (201)
                                          |
                                          v
                              /projects/[slug]/atcs/[atcId]

/projects/[slug] --Create Test--> /projects/[slug]/tests/new
                                          |
                          (pick >=1 ATC from WHOLE workspace library)
                                          |
                                   POST /api/v1/tests (201)
                                          |
                                          v
                              /projects/[slug]/tests/[testId]
```

1. A Member clicks "Create ATC," optionally deep-linked from a Story/AC (`?story=<id>&ac=<id>`).
2. The form pre-loads non-archived Modules, Stories, and their ACs; a stale/hand-edited deep-link never pre-anchors to foreign-project content (`user-journeys.md` success criteria).
3. The Member fills title (3-200 chars), `layer` (`UI`/`API`/`Unit`), >=1 ordered step (content <=2048 UTF-8 bytes, strictly-increasing positions from 1), optional assertions, and anchors >=1 Acceptance Criterion.
4. `POST /api/v1/atcs` -> `bunkai_create_atc` RPC re-validates at the DB layer: workspace write-membership, every AC belongs to the given User Story (BR-005), the Module is the Story's own or a descendant in the same Project (BR-006).
5. On success (`201`), the client navigates to the ATC's own detail page; edits later are optimistically locked via `version` (BR-007).
6. Separately, a Member opens the Test builder (`/projects/[slug]/tests/new`); because Tests are workspace-scoped and ATCs are project-scoped, the ATC library loaded here spans the *entire workspace*, not just the current Project.
7. The Member picks >=1 ATC, orders the chain (the same ATC legally reusable at multiple positions — `test_steps` uses a surrogate PK specifically to allow this), and submits.
8. `bunkai_create_test` RPC validates, in order: chain non-empty (else `chain_empty`, `45120`), then every `atc_id` resolves to a non-archived ATC in the same workspace (else `atc_not_in_workspace`, `45122` — identical error for a foreign-workspace id and a nonexistent one, a deliberate non-disclosure design).

**Business rules**: BR-004 (ATC anchoring moat, application/RPC-layer only — no DB CHECK exists), BR-005 (AC must belong to the ATC's Story), BR-006 (Module must be inside the Story's Project subtree), BR-007 (optimistic locking on ATC edit), BR-008 (Test chain non-empty + same-workspace).

**Code involved**: `app/(app)/projects/[projectSlug]/atcs/new/page.tsx`, `app/(app)/projects/[projectSlug]/tests/new/page.tsx`, `lib/atcs/validation.ts`, `lib/atcs/errors.ts`, `supabase/migrations/0004_atcs.sql`, `0024_tests.sql:203-225`.

---

### 3.3 Execute a Manual Run and File a Bug from a Failed Step (P0)

```
/projects/[slug]/tests/[testId] --pick Environment, Start run-->
        POST /api/v1/runs (Idempotency-Key header)
                    |
        201 (new) or 200 (idempotent replay within 24h)
                    |
                    v
        /projects/[slug]/runs/[runId]  (Runner — frozen snapshot)
                    |
          mark each step: pass / fail / blocked / skipped
                    |
              any step failed? ---- no ----> Finish run -> passed/failed
                    |
                   yes
                    |
                    v
        Report-bug dialog (pre-filled: ATC title, step content,
        evidence URL, default severity P3)
                    |
        POST /api/v1/bugs  -->  Bug filed, provenance frozen
        (run_id / run_step_id / atc_id, status='open')
```

1. A Member+ selects an Environment and clicks "Start run"; the client sends an `Idempotency-Key` header alongside `{test_id, environment_id}`.
2. `bunkai_create_run` RPC validates, in this load-bearing order: (a) actor can write the workspace, (b) `executor_mode` is one of `human`/`agent`/`ci`, (c) the Environment belongs to the Test's own Project, (d) the Test resolves to >=1 executable ATC step.
3. A repeated call with the identical `(test_id, start_token)` pair inside a 24-hour window returns the *original* Run tagged `"replayed": true` instead of creating a duplicate (BR-010) — the Project row is locked (`for update`) first so concurrent identical-token starts serialize.
4. The Member lands on the Runner, which renders every ATC/step from the Run's frozen snapshot, and marks each step's verdict — never back to `pending` (BR-011).
5. If a step is `failed`, a "Report bug" button renders (structurally absent otherwise) and pre-fills the dialog from that step's content.
6. Submitting `POST /api/v1/bugs` derives `project_id`/`module_id`/`run_id`/`atc_id` **server-side** from `run_step_id` — a run-linked Bug body can never leak a client-supplied provenance id even if one is sent (Zod strips unknown keys on the discriminated-union schema).
7. `bunkai_bugs_check_consistency` — a `BEFORE INSERT/UPDATE` trigger that fires on *any* write path, RPC or direct REST — independently re-verifies the Project/Module/Run/Run-Step/ATC chain is internally consistent (BR-013), a defense against an RPC-bypassing direct write.
8. The Member finishes the Run once every step has a terminal verdict; abort/finish/mark-step are each rejected with `409 conflict` once the Run's header status is already terminal (BR-012, "one-way door").

**Business rules**: BR-009 (Run needs a valid same-Project Environment + >=1 executable step), BR-010 (24h idempotent Run start), BR-011 (Run Step never re-marks to `pending`), BR-012 (terminal Run is a one-way door), BR-013 (Bug provenance internal consistency, enforced at two independent layers), BR-014 (a Bug is always filed `status='open'`).

**Code involved**: `components/tests/StartRunButton.tsx`, `components/runs/RunnerView.tsx`, `lib/runs/report-bug-view.ts`, `lib/runs/validation.ts`, `lib/runs/errors.ts`, `lib/bugs/validation.ts`, `lib/bugs/errors.ts`, `supabase/migrations/0031_runs.sql:299-408`, `0046_bugs.sql:162-215`.

---

### 3.4 Bug Lifecycle Management — Status Transition & Assignment

*(Not covered by a PRD journey — surfaced from `functional-specs.md` FR-009/FR-010, which extend Flow 3.3's happy path into the Bug's own post-filing lifecycle.)*

```
open --(rank 1->2)--> in_progress --(rank 2->3)--> resolved --(rank 3->4)--> closed

  Any skip-ahead (e.g. open->resolved) ......... REJECTED  (45310)
  Any backward move or same-status no-move ...... REJECTED  (45311)
```

1. A Member+ moves a Bug's status via `POST /api/v1/bugs/{id}/status`.
2. `bunkai_transition_bug_status` computes old/new rank from a fixed `open=1, in_progress=2, resolved=3, closed=4` mapping.
3. A skip of >=2 stages forward is rejected (`bug_status_transition_skipped`, `45310`); any same-or-backward move — including a same-status no-op resubmit — is rejected (`bug_status_transition_backward`, `45311`).
4. `bunkai_bugs_check_consistency` (as extended by `0054_bug_assignment_status.sql`) re-runs the *identical* rank comparison as a trigger-level backstop, so the RPC and the trigger structurally cannot disagree.
5. Separately, assigning a Bug (`POST /api/v1/bugs/{id}/assign`) requires the target user to hold an *active* `workspace_members` row in the Bug's own workspace and to *not* be a `viewer` — a Viewer cannot act on a Bug, so assigning them one is rejected (`bug_assignee_view_only`, `45313`).

**Business rules**: BR-015 (Bug status forward-only, exactly one rank per move), BR-016 (Bug assignee must be active + non-viewer).

**Code involved**: `lib/bugs/validation.ts:81-89`, `lib/bugs/errors.ts:43-86`, `supabase/migrations/0054_bug_assignment_status.sql:60-72,140-174`.

---

### 3.5 Accept a Workspace Invite

```
/invites/accept?token=...  --signed in?--
        |no                        |yes
        v                          v
  /login?next=...          POST /api/v1/invites/accept
        |                          |
        `----sign in-------------->|
                                    v
                        2xx: router.replace(nextPath)
                        error: inline error, "Back to sign-in"
```

1. A prospective teammate follows an invite link; the page checks `supabase.auth.getUser()`.
2. If unauthenticated, the round-trip preserves the exact URL: `router.push('/login?next=/invites/accept?token=<token>')`, so a sign-in lands the user back on the identical invite-accept page rather than a generic landing route.
3. Once authenticated, clicking "Accept invite" calls `POST /api/v1/invites/accept` with the token.
4. On success, the invite's role (`viewer`/`member`/`admin` — `owner` is deliberately excluded from the invitable role set) is granted, never silently escalated or downgraded.

**Business rules**: workspace invites expire in 7 days; the redeemed role is exactly what the inviter specified (`domain-glossary.md` §1.12, `user-journeys.md` Journey 4 success criteria).

**Code involved**: `app/invites/accept/accept-client.tsx`, `app/api/v1/invites/accept/route.ts`, `supabase/migrations/0010_workspace_invites.sql`.

**Discovery Gap** (carried from `user-journeys.md`): whether the server independently confirms the accepting session's email matches the invite's target email was not confirmed this session — the client only checks *whether* a session exists.

---

### 3.6 Milestone Tracking

```
/projects/[slug]/milestones --Create/Edit--> bunkai_create_milestone /
                                              bunkai_update_milestone
                                                       |
                                target_date bound checked ONLY when
                                target_date is actually being changed
                                  (today-or-later, <= 5 years out)
```

1. An Admin/Owner (per the product's own roadmap, Milestones is listed `'próximo'`/upcoming despite the table and API already existing — `business-model.md` §Key Activities) sets a Project-scoped Milestone: name (1-100 chars, whitespace-normalized, unique per project case-insensitively), a `target_date`, and an optional description (<=500 chars).
2. `target_date` must be today-or-later and no more than 5 years out (BR-6, `domain-glossary.md`) — but this bound is re-checked *only when the date itself changes*. A description-only edit of an already-past-dated Milestone succeeds without tripping the bound, a deliberate design decision documented inline (a CHECK constraint would have re-evaluated on every UPDATE, which would have made this impossible).
3. There is no delete path for a Milestone — deletion is explicitly out of scope.

**Business rules**: BR-6 (`target_date` bounds, re-checked only on change).

**Code involved**: `app/(app)/projects/[projectSlug]/milestones/*`, `supabase/migrations/0064_milestones.sql:112-274`.

**Discovery Gap**: the full create/edit step-by-step UI flow (form fields, client validation copy) was not traced this session — only the `canEdit` gate and the RPC-level rules are confirmed (`user-journeys.md` §9).

---

### 3.7 Coverage & Traceability Reporting

```
/projects/[slug]/traceability  --------->  GET .../traceability
        (Story -> AC -> ATC -> Test -> Run -> Bug, both directions)

/projects/[slug]  (home/coverage widgets) ----> GET .../coverage
        (uncovered criteria / never-run Tests surfaced as a list)
```

1. Coverage and traceability are **read-only reporting** — no state-changing business rule of their own surfaced in this session's FR derivation (`functional-specs.md` explicitly declines to give this a dedicated FR for that reason).
2. Coverage is computed from the FK graph itself (`atc_acceptance_criteria`, `test_steps`, `run_atcs`, `bugs.atc_id`), not manually tracked — this is the product's stated fix for "coverage drift" (`business-model.md` §1, pain point 2).
3. Traceability navigates the full anchored chain — Story -> AC -> ATC -> Test -> Run -> Bug — in both directions from a single view.

**Code involved**: `app/(app)/projects/[projectSlug]/traceability/page.tsx`, `app/(app)/projects/[projectSlug]/metrics/page.tsx`; dedicated reporting migrations `0048_project_coverage_report.sql`, `0050_project_coverage_report_real_execution_source.sql`, `0052_defect_heatmap_report.sql`, `0068_story_traceability_report.sql` (filenames only — RPC bodies not read this session).

**Discovery Gap**: the exact query shape/params (e.g. date-range filters) behind the coverage and traceability endpoints were not read this session — a future FR-011 could formalize this if reporting-specific validation surfaces.

> API endpoint paths/request-response shapes for all flows above are the ownership of `architecture.md` / `functional-specs.md` (and, when synced, `bun run api:sync`'s `api/schemas/` output) — not repeated here beyond the illustrative call shapes shown in each flow diagram.

---

## 4. State Machines

### 4.1 Bug (Defect) status — CONFIRMED at enforcement-code level

```
[*] --> open (bunkai_create_bug always inserts status='open')
open --> in_progress   : rank 1->2, allowed
in_progress --> resolved : rank 2->3, allowed
resolved --> closed     : rank 3->4, allowed

open --> resolved       : REJECTED (45310, skips in_progress)
open --> closed         : REJECTED (45310, skips 2 stages)
in_progress --> closed  : REJECTED (45310, skips resolved)
in_progress --> open    : REJECTED (45311, backward)
resolved --> in_progress: REJECTED (45311, backward)
closed --> resolved     : REJECTED (45311, backward)
open --> open           : REJECTED (45311, same-status no-move)
```

| From | To | Triggering Event | Effects |
|---|---|---|---|
| (none) | `open` | `bunkai_create_bug` | Always the initial value — no "file directly as resolved/closed" path exists. |
| `open` | `in_progress` | `bunkai_transition_bug_status` | Allowed (rank+1). |
| `in_progress` | `resolved` | `bunkai_transition_bug_status` | Allowed (rank+1). |
| `resolved` | `closed` | `bunkai_transition_bug_status` | Allowed (rank+1). |
| any | any (skip >=2 ranks forward) | `bunkai_transition_bug_status` | Rejected, `45310`. |
| any | any (same rank or backward) | `bunkai_transition_bug_status` | Rejected, `45311`. |

**Correction carried forward from Phase 2** (`functional-specs.md` FR-009): the domain-glossary's original Phase-1 diagram showed bidirectional arrows and a direct `open -> closed` shortcut as an unconfirmed illustrative guess. This session read `bunkai_bugs_check_consistency`'s actual rank-comparison logic (`0054_bug_assignment_status.sql:140-156`) — both of those illustrative paths are in fact rejected. Enforced identically at two independent layers (the `bunkai_transition_bug_status` RPC and the trigger backstop), so a direct write bypassing the RPC cannot diverge from the RPC's own behavior.

**Business rule**: BR-015.

---

### 4.2 ATC status — value set confirmed, transition guard NOT confirmed

```
[*] --> unrun
unrun --> running
running --> pass | fail | blocked | skipped
pass|fail|blocked|skipped --> running : re-run
```

`atcs.status` is CHECK-constrained to `('pass','fail','blocked','skipped','running','unrun')` (`0004_atcs.sql:63`). The arrows above are the conventional shape implied by the enum, not confirmed enforcement — no state-machine-enforcing trigger or RPC was located across either Phase 1 or Phase 2 discovery. **Do not write a negative-path test asserting a specific rejected ATC-status transition** until this gap is closed.

---

### 4.3 Run (header) status — value set + terminal-state lockout confirmed; full graph not confirmed

```
[*] --> running
running --> passed | failed | aborted
```

`runs.status` is CHECK-constrained to 4 values (`0031_runs.sql:80`). Phase 2 (`functional-specs.md` FR-007) confirmed that abort/finish/mark-step are *all* rejected with `409 conflict` once the Run is in any terminal state (`45204`/`45206`/`45212`) — a Run is a one-way door once closed, and this is directly enforced code, not a guess. What remains unconfirmed is whether `passed`/`failed` can be reached by any path *other than* `bunkai_finish_run` (i.e. whether a direct table UPDATE could bypass it).

---

### 4.4 Run ATC status — snapshot verdict per chain position

```
[*] --> pending
pending --> passed | failed | blocked | skipped
```

`run_atcs.status` CHECK (`0031_runs.sql:127`) — reflects the aggregate verdict of a chain position's steps within one Run.

---

### 4.5 Run Step status — snapshot verdict per executable step

```
[*] --> pending
pending --> passed | failed | blocked
```

`run_steps.status` — the actual mark-step action only permits `passed`/`failed`/`blocked` (never a re-mark to `pending`, BR-011 — confirmed by `lib/runs/validation.ts:75,92-93`), narrower than the raw CHECK constraint's full value set (`0031_runs.sql:174`), which also technically allows `skipped`. This is the one state machine in this cluster with a directly-read validation-layer confirmation, not just a CHECK-constraint inference.

---

### 4.6 User Story status — "ready to test" gate

```
[*] --> draft
draft --> ready_to_test
```

Source: `0017_acceptance_criteria_ordering.sql:19-24` (the "BK-15 gate"). Only a forward transition was found; whether a Story can move back to `draft` after promotion was not confirmed in either discovery phase.

---

### 4.7 Import Job status — Jira import lifecycle

```
[*] --> queued
queued --> running
running --> completed | failed
```

Source: `import_jobs.status` CHECK (`queued`,`running`,`completed`,`failed`) — `0019_import_jobs.sql:15`. Backs the async, one-way JQL-driven Jira Story import (§7.2 below).

---

## 5. Automatic Processes

### 5.1 Database Triggers

| Trigger | Fires On | Function | Why It Exists |
|---|---|---|---|
| `atcs_set_updated_at` | `BEFORE UPDATE` on `atcs` | `bunkai_set_updated_at()` | Keeps `updated_at` accurate without relying on every write path to set it manually. |
| `atcs_refresh_tsv` | `BEFORE INSERT/UPDATE OF title, tags` on `atcs` | `bunkai_atcs_refresh_tsv()` | Maintains the GIN full-text-search column (`tsv`) so ATC search stays correct without an app-layer re-index step. |
| `tests_set_updated_at` | `BEFORE UPDATE` on `tests` | `bunkai_set_updated_at()` | Same `updated_at` maintenance pattern, applied consistently across domains. |
| `runs_set_updated_at` | `BEFORE UPDATE` on `runs` | `bunkai_set_updated_at()` | Same pattern. |
| `bugs_set_updated_at` | `BEFORE UPDATE` on `bugs` | `bunkai_set_updated_at()` | Same pattern. |
| `bugs_check_consistency` (referred to elsewhere as `bunkai_bugs_check_consistency`) | `BEFORE INSERT/UPDATE` on `bugs` | `bunkai_bugs_check_consistency()` | The system's most load-bearing trigger: independently re-verifies Bug provenance consistency (BR-013) AND — as extended by `0054_bug_assignment_status.sql` — re-runs the exact status-transition rank check (BR-015) and the assignee active/non-viewer check (BR-016) as a backstop that fires regardless of write path (RPC or a direct, RPC-bypassing REST write). |
| `notification_preferences_set_updated_at` | `BEFORE UPDATE` on `notification_preferences` | `bunkai_set_updated_at()` | Same `updated_at` pattern. |
| `milestones_set_updated_at` | `BEFORE UPDATE` on `milestones` | `bunkai_set_updated_at()` | Same `updated_at` pattern. |
| `activity_log_notify_bug_event` | `AFTER INSERT` on `activity_log`, `WHEN entity_type='bug' AND action IN ('bug.assigned','bug.reassigned','bug.unassigned','bug.status_changed')` | `bunkai_notify_bug_event()` | Converts a Bug-domain audit event into per-recipient rows in `notifications`, deduplicated via `ON CONFLICT (source_event_id, recipient_user_id) DO NOTHING` — the mechanism behind Bug-lifecycle notifications reaching the right teammates without a separate notification-dispatch service. |
| `activity_log_notify_run_event` | `AFTER INSERT` on `activity_log`, `WHEN` a `run.finished`/`run.aborted`-shaped event | `bunkai_notify_run_event()` | Same pattern as above, for Run-lifecycle notifications (finish verdict / abort reason). |

Every business-rule-enforcing "workflow" the product performs (creating an ATC/Test/Run/Bug, transitioning a Bug's status, assigning a Bug) is actually driven by hand-written `SECURITY DEFINER` RPC functions invoked via `supabase.rpc()` (e.g. `bunkai_create_run`, `bunkai_create_bug`, `bunkai_create_test`, `bunkai_transition_bug_status`, `bunkai_assign_bug`, `bunkai_mark_run_step`, `bunkai_finish_run`, `bunkai_abort_run`) — not by additional triggers. Those RPCs are documented per-flow in §3 and per-FR in `functional-specs.md`; this table lists only the *trigger*-mechanism automatic processes, confirmed via a direct `grep -in "create trigger"` sweep of all 69 migrations this session (no trigger outside this list exists in the schema).

### 5.2 Cron Jobs

| Job | Schedule | Purpose |
|---|---|---|
| — | — | — |

~~**Discovery Gap**: no `pg_cron`/`cron.schedule` reference was found anywhere in `supabase/migrations/*.sql` (confirmed via a repo-wide case-insensitive grep this session). No scheduled/periodic backend job exists in this system as currently discoverable from source. If a scheduled job (e.g. notification-retention pruning at the 90-day mark, `access_token` expiry sweeps) exists, it would have to live outside this repo (Supabase platform-level cron, or an external scheduler) — not evidenced here.~~ **RESOLVED 2026-08-13**: re-verified — still zero `pg_cron`/`cron.schedule` hits, no `supabase/functions/` directory, no `vercel.json` crons array at the target repo root. Both retention mechanisms exist but as LAZY-CHECK-ON-READ patterns, not scheduled jobs: notification 90-day retention is enforced by the RLS `select` policy's `created_at >= now() - interval '90 days'` filter (`0053_notifications.sql:113`), whose own comment (lines 143-147) states the physical purge job "is explicitly out of scope for this story... when built, it runs as a service-role job" — rows are hidden past 90 days but never deleted today. PAT/access-token expiry is checked only at auth time (`expires_at < now()` rejected on use, `0008_access_tokens.sql:17`), no sweep deletes expired rows. Confirmed genuinely absent as a scheduled job; present as lazy/query-time enforcement.

### 5.3 Incoming Webhooks

| Source | Endpoint | Purpose |
|---|---|---|
| — | — | — |

**Discovery Gap**: `N8N_API_URL`/`N8N_API_KEY` and `RESEND_API_KEY` are declared in `.env.example`, but no runtime call site (`app/`/`lib/`) was found for either across Phase 3 or this session's independent re-check (`backend.md` §Environment Variables, `architecture.md` §7 — both confirm the same negative result). Neither is confirmed to represent an *incoming* webhook receiver in this codebase at all:
- **n8n** is more plausibly an AI-tooling/dev-side MCP integration (`.mcp.json`) than an application webhook signal — no `app/api/**/webhook` route or n8n-shaped payload handler was found.
- **Resend** may be delegated entirely to Supabase Auth's (GoTrue's) own SMTP configuration, which this repo does not implement — GoTrue can be pointed at a custom email provider outside this codebase, unconfirmable from source alone.

No `app/api/**/webhook*` route or equivalent inbound-signal handler was found in the route tree during Phase 2/3 discovery. Treat both env vars as **not confirmed to be live integrations** until the team clarifies.

---

## 6. External Integrations

### 6.1 Supabase (Postgres + Auth + Realtime + Storage)

```
Browser/Agent --HTTPS--> Next.js (middleware -> route handlers)
                                |
                    +-----------+-----------+
                    |                       |
              Supabase Auth           Supabase Postgres
              (GoTrue: password,      (RLS on every table,
               magic-link, OAuth,      SECURITY DEFINER RPCs,
               OTP)                    31 tables)
                    |                       |
                    +----------+------------+
                               |
                        Supabase Realtime
              (WebSocket: run_atcs, run_steps, notifications —
               NOT the `runs` header row itself, RESOLVED 2026-08-13)
```

Supabase is the system's entire data layer, authentication provider, and live-update transport — there is no separate backend service. **What it does**: stores every business entity; enforces multi-tenant authorization via RLS (the system of record for "who can see/write what," not a TypeScript layer); runs the hand-written PL/pgSQL RPC functions that carry every business rule in §3-5; issues and refreshes session cookies (password, magic-link, and GitHub/Google OAuth); and pushes live updates over WebSocket. ~~to at least `runs` and `notifications` (confirmed realtime-enabled tables — whether `bugs`/`activity_log` also are was not independently re-checked this session, carried Discovery Gap).~~ **RESOLVED 2026-08-13**: the definitive `supabase_realtime` publication membership is exactly 3 tables — `run_atcs`, `run_steps` (`0043_run_realtime_replication.sql:43-44`) and `notifications` (`0053_notifications.sql:154`). This corrects the prior claim: `runs` itself (the header row) is NOT in the publication — `0043`'s own header comment states "`runs` is deliberately excluded from the publication: BK-35 never mutates a `runs` row" (progress is client-derived from its `run_atcs`/`run_steps` children instead). `bugs` and `activity_log` are confirmed absent from the publication. **Which flows depend on it**: literally all of them — every flow in §3 writes through a Supabase Postgres RPC and reads through an RLS-scoped Supabase client.

### 6.2 Atlassian / Jira — One-Way Story Import

```
Bunkai --(JQL query)--> import_jobs (queued)
   |                          |
   |                     service-role worker
   |                          |
   `<--(User Stories, external_id/url)---'
```

**What it does**: pulls existing requirements *into* Bunkai as User Stories via a JQL-scoped, asynchronous job — never writes back to Jira. **Which flows depend on it**: an optional, alternative entry point into Flow 3.1's Story-authoring step (a Story can be hand-authored or Jira-imported); nothing downstream (ATC authoring, Test assembly, Runs, Bugs) branches on which path a Story came from. **Env**: `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` — missing/invalid credentials surface as a failed `import_jobs` row (`jira_unauthorized`), never an app-boot failure.

### 6.3 n8n — Declared, Not Confirmed at Runtime

**What it declares**: `N8N_API_URL`/`N8N_API_KEY` in `.env.example`. **What was found**: no reference in `app/`/`lib/` across two independent discovery passes (Phase 3 and this session). Most plausibly an AI-tooling/MCP-side integration for this QA-engineering repo's own automation, not a Bunkai application feature. **Which flows depend on it**: none confirmed. See Discovery Gaps.

### 6.4 Resend — Declared, Not Confirmed at Runtime

**What it declares**: `RESEND_API_KEY` in `.env.example`. **What was found**: no `resend` SDK import in `app/`/`lib/`. Transactional email (OTP codes, invite emails, magic links) is plausibly delegated entirely to Supabase Auth's own configurable SMTP/email-provider setting, which sits outside this repo's source and cannot be confirmed either way from static analysis. **Which flows depend on it**: Flow 3.1 (signup OTP) and Flow 3.5 (invite email) both need *some* email-delivery mechanism — this may or may not be Resend.

### 6.5 Vercel — Hosting

**What it does**: builds and serves the single Next.js deployment; no separate infra. **Which flows depend on it**: all of them, as the hosting platform — not a business-logic dependency.

---

## 7. Discovery Gaps

- ~~**Cron jobs**: no scheduled/periodic job (`pg_cron`, `cron.schedule`, or equivalent) exists anywhere in the 69 migrations — confirmed via a fresh repo-wide grep this session. If retention sweeps (e.g. the 90-day notification window) or token-expiry cleanup happen at all, they are not implemented as an in-repo scheduled job.~~ **RESOLVED 2026-08-13**: confirmed absent (also re-checked `supabase/functions/` and `vercel.json` crons — both absent). Both retention sweeps use a LAZY-CHECK-ON-READ pattern instead: notification 90-day retention is an RLS query-time filter (`0053_notifications.sql:113`, purge job explicitly deferred per lines 143-147); PAT/token expiry is checked at auth time only (`0008_access_tokens.sql:17`). See §5.2.
- **Incoming webhooks**: no `n8n`/`resend` runtime call site was found in `app/`/`lib/` across two independent discovery passes. Both env vars remain unconfirmed as live application integrations — see §6.3/§6.4.
- ~~**ATC status transition enforcement**: only the CHECK-constrained value set is confirmed; no transition-guarding RPC/trigger was located in either discovery phase (§4.2).~~ **RESOLVED 2026-08-13**: confirmed — no transition-guarding RPC/trigger exists anywhere in the 69 migrations; only `atcs_set_updated_at`/`atcs_refresh_tsv` triggers exist on `atcs` (`0004_atcs.sql:78,85`, neither status-related), and no RPC body was found that writes `atcs.status` at all.
- ~~**Run header status full transition graph**: the terminal-state lockout (abort/finish/mark-step all reject once closed) is confirmed; whether `bunkai_finish_run` is the *only* path that can set `passed`/`failed` was not confirmed (§4.3).~~ **RESOLVED 2026-08-13**: confirmed `bunkai_finish_run`/`bunkai_abort_run` (`0067_run_finish_abort_via.sql`) are the only paths; `public.runs` RLS has only `select`/`insert` policies (`0031_runs.sql:100-114`), no `update` policy for `authenticated` — a raw client UPDATE is blocked entirely by RLS default-deny.
- ~~**ATC anchoring-moat RPC-layer enforcement**: the Zod `.min(1)` gate at the API edge is confirmed; whether `bunkai_create_atc`'s own RPC body independently re-enforces "≥1 AC" was not located in the portion of `0004_atcs.sql` read across either session (BR-004).~~ **RESOLVED 2026-08-13**: confirmed — `bunkai_create_atc` guards `if coalesce(array_length(p_ac_ids, 1), 0) = 0 then raise exception 'ac_outside_user_story' using errcode = '45020'; end if;` (`0021_atc_create_update.sql:158-160`), repeated in `bunkai_update_atc` (`0021_atc_create_update.sql:295-297`).
- ~~**Realtime replication scope**: `runs` and `notifications` are confirmed realtime-enabled; whether `bugs`/`activity_log` also are was not re-checked this session.~~ **RESOLVED 2026-08-13**: definitive full publication list is `run_atcs`, `run_steps` (`0043_run_realtime_replication.sql:43-44`), `notifications` (`0053_notifications.sql:154`) — 3 tables total. Corrects the prior claim: `runs` itself is deliberately NOT in the publication (per `0043`'s own header comment); `bugs`/`activity_log` confirmed absent too.
- **Module and Milestone creation UI flows**: the resulting data shape and RPC-level rules are confirmed; the step-by-step form/validation UX for both was not traced in any discovery phase.
- **Invite email-match enforcement**: whether the server verifies the accepting session's email matches the invite's target email (vs. any authenticated user being able to redeem any invite link) was not confirmed.
- **Coverage/Traceability endpoint parameters**: read-only reporting confirmed to exist and to be FK-graph-derived; exact query/filter shape not read.
- ~~**RLS policy enumeration**: this and prior sessions spot-checked policies on `atcs`, `access_tokens`, `workspace_members`; the remaining ~28 tables' policies were not individually re-read (relying on the consistent, confirmed multi-tenancy pattern).~~ **RESOLVED 2026-08-13**: full sweep complete. All 31 tables have RLS enabled (cross-checked CREATE TABLE vs. `enable row level security` statements — zero diff). No `using(true)`/`with check(true)` permissive policy and no anon/public grant found anywhere. Pattern is 3 consistent sub-patterns: workspace-scoped (`bunkai_is_workspace_member`/`bunkai_can_write_workspace`) for shared entities, user-scoped (`auth.uid() = user_id`) for personal data (`idempotency_keys`, `user_view_state`, `notification_preferences`, `notifications`), and zero-policy default-deny for the 3 secrets tables (`access_token_secrets`, `magic_link_token_secrets`, `workspace_invite_secrets` — `0011_split_token_secrets.sql`, RPC-only access). No deviation found — this fully de-risks the Multi-Tenant Isolation rating rather than merely re-confirming it.
- **Full CI/monitoring picture**: no `.github/workflows/` exists; `bun test` (132 files, 34 requiring live Supabase credentials) is not wired into any automated gate, including the repo's own pre-commit hook (`backend.md`).

---

*Synthesis complete. This document does not duplicate API endpoint catalogs (see `architecture.md` / a future `business-api-map.md`) or dump RLS policies verbatim (existence + high-level rule only, per doctrine). Re-run this discovery step after any migration that changes a CHECK constraint's allowed values or adds a new SQLSTATE code — those are the two highest-signal triggers for staleness.*
