# Business Feature Map — Bunkai

> Generated: 2026-08-13 · Discovery method: read-only reverse-engineering of `upex-bunkai-tms` (64 `app/api/v1/**/route.ts` files, 31 `app/**/page.tsx` files, `components/`, `supabase/migrations/0009_cross_cutting.sql`, `package.json`, `.env.example`). Independent, fresh re-derivation — `upex-bunkai-tms/.context/` was **not** read at any point this session. Cross-referenced against this session's own `business-data-map.md` (31-entity schema) and `business-api-map.md` (7 critical journeys, auth model) rather than duplicating their narrative — this document's job is the feature/CRUD inventory angle only.

```
+------------------------------------------------------------------------+
|                                                                          |
|   B U N K A I   —   T H E   F E A T U R E   M A P                      |
|                                                                          |
|   42 features across 12 domains. 64 API routes, 31 pages.               |
|   Every capability a Viewer/Member/Admin/Owner — or an AI agent         |
|   holding a scoped PAT — can actually DO in this system.                |
|                                                                          |
+------------------------------------------------------------------------+
```

---

## 1. Inventory Summary

| Category  | Features | Status                                                             |
|-----------|----------|---------------------------------------------------------------------|
| Core      | 11       | Stable — the 7 P0 journeys' load-bearing capabilities                |
| Secondary | 31       | Stable — supporting CRUD, reporting, admin, and public/teaching pages |
| Beta      | 0        | None found — no beta/experimental flag mechanism exists (§7)         |
| Planned   | 0        | None found — no `TODO`/`FIXME`/`WIP` markers or stub handlers exist across `app/`, `lib/`, `components/` (§7); a genuine gap (workspace member re-role/removal, §9) exists but is not a marketed "planned" feature — it is simply absent from the API surface |

**Total: 42 features.** Source counts: 64 `route.ts` files under `app/api/v1/` (`find app/api/v1 -name route.ts | wc -l`), 31 `page.tsx` files under `app/` (`find app -name page.tsx | wc -l`). ~~`business-api-map.md` cites "67 route files" from an earlier pass that likely included non-`route.ts` route-adjacent files or the two `app/auth/**` OAuth handlers (`app/auth/callback/route.ts`, `app/auth/oauth/[provider]/route.ts`, outside `app/api/v1/`) — this document's 64 is a fresh `find` re-count scoped strictly to `app/api/v1/**/route.ts`; the discrepancy is noted, not silently reconciled.~~ **RESOLVED 2026-08-13**: re-ran `find app/api/v1 -name 'route.ts' | wc -l` fresh from a clean discovery session — result is 64, exactly matching this document's count. `business-api-map.md`'s "67" was the stale/incorrect figure and has been corrected there (§1, §2, §4) to 64. The root cause of the original 67 was not identifiable (adding the 2 `app/auth/**` OAuth handlers only reaches 66, not 67).

---

## 2. Feature Catalog (by Domain)

### Domain: Authentication & Identity

#### Feature: Email-First Sign-Up & OTP Verification

| Aspect | Value |
|---|---|
| **ID** | FEAT-001 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/auth/check-email`, `POST /api/v1/auth/signup`, `POST /api/v1/auth/confirm` |
| **UI** | `app/(auth)/login/page.tsx`, `app/(auth)/login/email-first-form.tsx` |
| **Users** | Anyone (Public/unauthenticated) |
| **Dependencies** | Supabase Auth (GoTrue) |
| **Evidence** | `.context/SRS/functional-specs.md` FR-001 |

**Capabilities:**
- [x] Route a returning user to sign-in vs. a new user to account creation from a single email field
- [x] Require OTP confirmation before a session is granted
- [x] Surface a `429 rate_limited` when GoTrue's own throttling engages

#### Feature: Password Sign-In

| Aspect | Value |
|---|---|
| **ID** | FEAT-002 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/auth/signin` |
| **UI** | `app/(auth)/login/email-first-form.tsx` |
| **Users** | Existing, confirmed account holders |
| **Dependencies** | Supabase Auth (GoTrue) |
| **Evidence** | `.context/SRS/functional-specs.md` FR-001 Processing Logic step 2 |

**Capabilities:**
- [x] `signInWithPassword` session issuance
- [x] Unconfirmed account routed to OTP verify instead of a generic wrong-password error

#### Feature: Magic Link Sign-In

| Aspect | Value |
|---|---|
| **ID** | FEAT-003 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST /api/v1/auth/magic-link` |
| **UI** | `app/(auth)/login/magic-link-form.tsx`, `app/(auth)/login/magic-link-disclosure.tsx` |
| **Users** | Anyone with a valid account email |
| **Dependencies** | Supabase Auth (GoTrue) |
| **Evidence** | `.context/infrastructure/frontend.md` §Login flow (files confirmed present this session) |

**Capabilities:**
- [x] Passwordless sign-in via emailed link
- [ ] Discovery gap: the exact magic-link redemption route (`app/auth/callback/route.ts`) body was not read this session — see §9

#### Feature: OAuth Sign-In (GitHub / Google)

| Aspect | Value |
|---|---|
| **ID** | FEAT-004 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `app/auth/oauth/[provider]/route.ts`, `app/auth/callback/route.ts` (outside `app/api/v1/` — these are the OAuth redirect/exchange handlers, not versioned REST endpoints) |
| **UI** | `app/(auth)/login/oauth-buttons.tsx` |
| **Users** | Anyone with a linked GitHub/Google account |
| **Dependencies** | Supabase Auth (GoTrue), GitHub OAuth, Google OAuth |
| **Evidence** | `.context/infrastructure/frontend.md` §Login flow — `find app/auth -name route.ts` confirms both files exist this session |

**Capabilities:**
- [x] `[provider]`-parameterized redirect initiation
- [x] Shared callback/exchange handler
- [ ] Discovery gap: provider-specific scope/consent configuration not read this session

#### Feature: Account Identity & Workspace Membership List

| Aspect | Value |
|---|---|
| **ID** | FEAT-005 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/me` (session probe) — the settings page itself reads Supabase directly server-side, no dedicated REST list route |
| **UI** | `app/(app)/settings/account/page.tsx` (code comment: "BK-87 — TC-AC1, TC-AC3 from PR1; TC-AC2/6/7 from PR2"), `components/settings/IdentityCard.tsx`, `components/settings/WorkspacesList.tsx` |
| **Users** | Any authenticated user (Viewer/Member/Admin/Owner) |
| **Dependencies** | Supabase Auth (`auth.users` admin lookup for `email`/`last_sign_in_at`) |
| **Evidence** | `app/(app)/settings/account/page.tsx:1-15` (header comment read this session) |

**Capabilities:**
- [x] Show identity (`role`, `joined_at`, `email`, `last_sign_in_at`)
- [x] List every workspace the user belongs to, with active-member counts per workspace

---

### Domain: Workspace & Tenancy Management

#### Feature: Workspace Bootstrap (Onboarding)

| Aspect | Value |
|---|---|
| **ID** | FEAT-006 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/workspaces` |
| **UI** | `app/(app)/onboarding/page.tsx`, `app/(app)/onboarding/onboarding-form.tsx` |
| **Users** | Any authenticated user with zero existing workspace memberships |
| **Dependencies** | Supabase Postgres (`bootstrap_workspace` seeding RPC) |
| **Evidence** | `.context/SRS/functional-specs.md` FR-002 |

**Capabilities:**
- [x] Create exactly one workspace (name + slug), seeding the creator as `owner`
- [x] Inverse gate: a user with ≥1 membership is redirected away from `/onboarding`
- [x] Friendly slug-collision error mapping

#### Feature: Active Workspace Switching

| Aspect | Value |
|---|---|
| **ID** | FEAT-007 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST /api/v1/me/active-workspace` |
| **UI** | (not independently located this session — likely a workspace-switcher control inside the app shell; see §9) |
| **Users** | Any authenticated user belonging to ≥2 workspaces |
| **Dependencies** | none beyond Postgres membership check |
| **Evidence** | `app/api/v1/me/active-workspace/route.ts:1-20` (full header comment read this session): "rotate the caller's active workspace" via an httpOnly `bk_active_ws` cookie, not a JWT change; non-members rejected `403` |

**Capabilities:**
- [x] Rotate the active-workspace cookie without touching the Supabase JWT
- [x] Reject a workspace the caller does not belong to

#### Feature: Workspace Settings (Membership List, Leave)

| Aspect | Value |
|---|---|
| **ID** | FEAT-008 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `DELETE /api/v1/workspaces/{id}/membership` (self-leave only — see CRUD matrix note), `GET/PATCH /api/v1/workspaces/{id}` |
| **UI** | `app/(app)/settings/workspaces/page.tsx` ("BK-89 — AC1-4; BK-90 Slice B adds the Leave action"), `components/settings/LeaveWorkspaceModal.tsx` |
| **Users** | Any authenticated member of the workspace (leave); Admin/Owner (rename via PATCH, gated per `business-api-map.md` §2 role sub-tier) |
| **Dependencies** | `bunkai_leave_workspace` RPC (sole-owner guard, PAT auto-revoke on leave) |
| **Evidence** | `app/api/v1/workspaces/[id]/membership/route.ts:1-19` (full header comment read this session) |

**Capabilities:**
- [x] Leave a workspace (own membership only)
- [x] Sole-owner leave attempt rejected (`45213`, per `.context/business/business-data-map.md` §4/§Discovery)
- [x] Active-workspace cookie auto-rotates to the caller's next-oldest remaining membership if the left workspace was active
- [ ] **No API path exists to remove or re-role another member** — see §9 gap

#### Feature: Workspace Member Invite

| Aspect | Value |
|---|---|
| **ID** | FEAT-009 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST/GET /api/v1/workspaces/{id}/invites`, `POST/DELETE /api/v1/workspaces/{id}/invites/{inviteId}` |
| **UI** | `app/(app)/workspaces/[id]/members/page.tsx`, `app/(app)/workspaces/[id]/members/members-client.tsx` |
| **Users** | Admin/Owner only (`requires: ['workspace:admin']`) |
| **Dependencies** | none beyond Postgres (hashed-token invite row, 7-day expiry) |
| **Evidence** | grep of `app/api/v1/workspaces/[id]/invites*` for `requires:` this session; `members-client.tsx:47,73,86` (fetch call sites confirmed) |

**Capabilities:**
- [x] Send an invite (email + role ∈ `viewer`/`member`/`admin` — `owner` structurally excluded)
- [x] List pending/active invites
- [x] Resend an invite (`POST /invites/{inviteId}`)
- [x] Revoke an invite (`DELETE /invites/{inviteId}`)

#### Feature: Invite Accept

| Aspect | Value |
|---|---|
| **ID** | FEAT-010 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/invites/accept` |
| **UI** | `app/invites/accept/page.tsx`, `app/invites/accept/accept-client.tsx` |
| **Users** | Anyone holding a valid invite token (must authenticate to complete) |
| **Dependencies** | Supabase Auth (session required to complete, page itself loads unauthenticated) |
| **Evidence** | `.context/business/business-data-map.md` §3.5 |

**Capabilities:**
- [x] Unauthenticated visit round-trips through `/login?next=...`, preserving the exact accept URL
- [x] Grants exactly the role the inviter specified — never escalated/downgraded

#### Feature: Personal Access Token Management

| Aspect | Value |
|---|---|
| **ID** | FEAT-011 |
| **Status** | Stable (Core — the mechanism that makes AI-agent/CI parity real) |
| **Endpoints** | `POST/GET /api/v1/tokens`, `DELETE /api/v1/tokens/{id}` |
| **UI** | `app/(app)/settings/tokens/page.tsx` ("BK-88 Slice A+B: list, revoke, issue"), `components/settings/IssueTokenModal.tsx`, `components/settings/RevokeTokenModal.tsx`, `components/settings/TokensList.tsx` |
| **Users** | Any authenticated user (own tokens, self-scoped); `workspace:admin` scope requires Admin/Owner of the target workspace |
| **Dependencies** | none beyond Postgres (`access_tokens`, SHA-256 hash storage) |
| **Evidence** | `app/(app)/settings/tokens/page.tsx:1-8` (header comment read this session); `.context/business/business-api-map.md` Journey 7 |

**Capabilities:**
- [x] Issue a PAT scoped to `atc:read`/`atc:write`/`run:execute`/`workspace:admin` (last one gated)
- [x] List own tokens
- [x] Revoke a token (no edit/rotate-secret path — see CRUD matrix)

---

### Domain: Product Structure (Project / Module / Environment / Milestone)

#### Feature: Project Creation

| Aspect | Value |
|---|---|
| **ID** | FEAT-012 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/workspaces/{id}/projects` |
| **UI** | `app/(app)/projects/new/page.tsx`, `app/(app)/projects/create-project-form.tsx` |
| **Users** | Member+ (write role) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-003 |

**Capabilities:**
- [x] Name 3-200 chars, ≥1 alphanumeric char, workspace-unique non-reserved slug
- [x] Lands directly inside the new Project's detail page (BK-266 fix)
- [ ] **No PATCH/DELETE route for Project exists** — see CRUD matrix and §9

#### Feature: Module Tree Management

| Aspect | Value |
|---|---|
| **ID** | FEAT-013 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST /api/v1/projects/{id}/modules`, `PATCH/DELETE /api/v1/modules/{id}` |
| **UI** | `app/(app)/projects/[projectSlug]/delete-module-dialog.tsx`, `app/(app)/projects/[projectSlug]/move-module-dialog.tsx` (`create-module-form.tsx` per `data-testid` grep in `frontend.md`) |
| **Users** | Member+ |
| **Dependencies** | none beyond Postgres (self-referential tree, depth ≤ 6) |
| **Evidence** | route-file grep this session; `.context/business/business-data-map.md` §2 |

**Capabilities:**
- [x] Create a Module (self-referential tree, max depth 6)
- [x] Move a Module (re-parent within the depth constraint)
- [x] Delete a Module
- [ ] **No dedicated `GET` route for a single Module or a Project's Module tree was found** — read is inferred to happen via the Project detail Server Component's direct Supabase query (`architecture.md`-cited pattern in `business-api-map.md` §4), not a REST route — see §9

#### Feature: Project Environment Management

| Aspect | Value |
|---|---|
| **ID** | FEAT-014 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET/POST /api/v1/projects/{id}/environments`, `PATCH/DELETE /api/v1/environments/{id}` |
| **UI** | `app/(app)/projects/[projectSlug]/delete-environment-dialog.tsx` (`create-environment-form.tsx` per `frontend.md` testid grep) |
| **Users** | Member+ |
| **Dependencies** | none beyond Postgres |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] Full CRUD (create/list/rename/delete) — the one Product-Structure entity with all four verbs confirmed

#### Feature: Milestone Tracking

| Aspect | Value |
|---|---|
| **ID** | FEAT-015 |
| **Status** | Stable (Secondary) — but see the roadmap-vs-code discrepancy note below |
| **Endpoints** | `GET/POST /api/v1/projects/{id}/milestones`, `PATCH /api/v1/milestones/{id}` |
| **UI** | `app/(app)/projects/[projectSlug]/milestones/page.tsx`, `app/(app)/projects/[projectSlug]/milestones/[milestoneId]/page.tsx`, `components/milestones/CreateMilestoneForm.tsx`, `components/milestones/EditMilestoneForm.tsx` |
| **Users** | Admin/Owner (per `.context/business/business-data-map.md` §3.6, though the RLS-layer role floor is not independently re-confirmed as Admin-only vs. Member+ this session) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` Discovery Gaps (BR-6 carried); `.context/business/business-data-map.md` §3.6 |
| **Note** | `business-data-map.md` §3.6 flags that the product's own roadmap content (`business-model.md` §Key Activities) still lists Milestones as *"'próximo'/upcoming"* despite the table, RPC, and full CRUD-minus-delete API already existing and being independently confirmed in this session's fresh route scan — a marketing/reality discrepancy worth a team callout, not a code gap |

**Capabilities:**
- [x] Create/edit (name 1-100 chars, `target_date` today-to-+5y bound, checked only when the date itself changes)
- [ ] **No delete path** — deliberate design decision (`business-data-map.md` §3.6), not a gap

---

### Domain: ATC Library

#### Feature: ATC Authoring & Editing

| Aspect | Value |
|---|---|
| **ID** | FEAT-016 |
| **Status** | Stable (Core — the product's primary differentiator) |
| **Endpoints** | `POST /api/v1/atcs`, `PATCH /api/v1/atcs/{id}` |
| **UI** | `app/(app)/projects/[projectSlug]/atcs/new/page.tsx`, `app/(app)/projects/[projectSlug]/atcs/[atcId]/page.tsx`, `components/atcs/StepEditor.tsx` (Monaco-editor-backed step/content editor — `@monaco-editor/react`, confirmed via `grep -rl "@monaco-editor" ...`) |
| **Users** | Member+ (`requires: ['atc:write']`) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-004 |

**Capabilities:**
- [x] Title 3-200 chars, `layer` ∈ `UI`/`API`/`Unit`, ≥1 ordered step (≤2048 UTF-8 bytes), optional assertions, ≥1 anchored Acceptance Criterion
- [x] Anchoring moat enforced (AC must belong to the given Story; Module must be inside the Story's Project subtree)
- [x] Optimistic-lock edit via `version`
- [ ] **No DELETE/archive REST endpoint exists** despite an `archived_at` column on the `atcs` table (confirmed via `lib/atcs/duplicate-rpc.test.ts:62` and `lib/atcs/usage-rpc.test.ts:69`, both filtering `.is('archived_at', null)`) — archiving is DB-column-ready but has no reachable API path in this route scan; see §9

#### Feature: ATC Duplication

| Aspect | Value |
|---|---|
| **ID** | FEAT-017 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST /api/v1/atcs/{id}/duplicate` |
| **UI** | (entry point not independently located this session — likely a table-row action in `components/atcs/AtcTable.tsx`) |
| **Users** | Member+ (`requires: ['atc:write']`) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] Clone an ATC's title/layer/steps/assertions/AC anchors into a new ATC

#### Feature: ATC Search & Usage Lookup

| Aspect | Value |
|---|---|
| **ID** | FEAT-018 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/atcs/search`, `GET /api/v1/atcs/{id}/usage` |
| **UI** | `components/atcs/AtcTable.tsx` (search/filter bar — `atc-search-filter.tsx` per `frontend.md` testid grep), `components/tests/AtcChainPicker.tsx` (uses `cmdk` command-palette pattern, confirmed via grep) |
| **Users** | Any workspace member incl. Viewer (`requires: ['atc:read']`) |
| **Dependencies** | Postgres full-text search (`tsv` GIN column, per `business-data-map.md` §5.1 `atcs_refresh_tsv` trigger) |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] Full-text/tag search across the workspace's ATC library
- [x] "Usage" lookup — which Tests reference a given ATC (feeds the Test builder's ATC picker, `AtcChainPicker.tsx`)

---

### Domain: User Story & Acceptance Criteria

#### Feature: User Story Management

| Aspect | Value |
|---|---|
| **ID** | FEAT-019 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST/GET /api/v1/modules/{id}/user-stories`, `GET/PATCH/DELETE /api/v1/user-stories/{id}` |
| **UI** | `app/(app)/projects/[projectSlug]/delete-user-story-dialog.tsx` (creation form entry point not independently located — likely embedded in the Module tree/explorer UI) |
| **Users** | Member+ |
| **Dependencies** | none beyond Postgres |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] Full CRUD (create/read/update/delete)
- [x] `draft → ready_to_test` gate ("BK-15 gate", per `business-data-map.md` §4.6) — only a forward transition confirmed; return-to-draft not confirmed either way

#### Feature: Acceptance Criteria Management

| Aspect | Value |
|---|---|
| **ID** | FEAT-020 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST/GET /api/v1/user-stories/{id}/acceptance-criteria`, `GET/PATCH/DELETE /api/v1/acceptance-criteria/{id}` |
| **UI** | (entry point not independently located this session — embedded in the User Story detail surface) |
| **Users** | Member+ |
| **Dependencies** | none beyond Postgres |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] Full CRUD, ordered ACs per Story (per `business-data-map.md` §2 "Acceptance Criterion — one ordered, individually testable condition")

#### Feature: Jira Story Import

| Aspect | Value |
|---|---|
| **ID** | FEAT-021 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `POST /api/v1/imports`, `GET /api/v1/imports/{id}` |
| **UI** | `app/(app)/projects/[projectSlug]/import-from-jira-dialog.tsx` |
| **Users** | Member+ |
| **Dependencies** | Atlassian/Jira REST API (`lib/jira/client.ts`, `lib/jira/import-runner.ts`, `lib/jira/adf-to-markdown.ts`, `lib/jira/extract-acceptance-criteria.ts`), Vercel `after()` background execution |
| **Evidence** | `import-from-jira-dialog.tsx:1-20` (full header read this session); `.context/business/business-data-map.md` §6.2 |

**Capabilities:**
- [x] Async, JQL-scoped, one-way pull of Jira issues into Bunkai User Stories
- [x] Poll a single import job's status (`GET /imports/{id}`)
- [ ] **No `GET /api/v1/imports` list-all route exists** — only single-job lookup by id; the dialog itself must track/poll the id it just created — see §9

---

### Domain: Test Assembly

#### Feature: Test Chain Builder

| Aspect | Value |
|---|---|
| **ID** | FEAT-022 |
| **Status** | Stable (Core) |
| **Endpoints** | `GET/POST /api/v1/tests`, `GET /api/v1/tests/{id}`, `PATCH /api/v1/tests/{id}/reorder`, `PUT /api/v1/tests/{id}/tags` |
| **UI** | `app/(app)/projects/[projectSlug]/tests/new/page.tsx`, `app/(app)/projects/[projectSlug]/tests/[testId]/page.tsx`, `components/tests/TestReorderClient.tsx` (drag-and-drop via `@dnd-kit`, confirmed via grep), `components/tests/AtcChainPicker.tsx` |
| **Users** | Member+ read/write split: read via `atc:read`, write via `atc:write` (both scopes required on `POST/GET /tests` per the combined `requires:` grep this session) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-005 |

**Capabilities:**
- [x] Assemble ≥1 ATC (workspace-wide library, not project-scoped) into an ordered chain
- [x] Same ATC legally reusable at multiple chain positions
- [x] Drag-and-drop reorder (`PATCH .../reorder`)
- [x] Tag management (`PUT .../tags`)
- [ ] **No DELETE route for a Test exists** — see CRUD matrix

---

### Domain: Test Execution (Runs)

#### Feature: Start a Run

| Aspect | Value |
|---|---|
| **ID** | FEAT-023 |
| **Status** | Stable (Core, P0) |
| **Endpoints** | `POST /api/v1/runs` |
| **UI** | `components/tests/StartRunButton.tsx`, launched from `app/(app)/projects/[projectSlug]/tests/[testId]/page.tsx` |
| **Users** | Member+ (`requires: ['run:execute']`); AI Agent/CI runner via scoped PAT (`executor_mode: 'agent'\|'ci'`) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-006 |

**Capabilities:**
- [x] Snapshot-freeze the Test's current ATC/step content at start time
- [x] Two-layer idempotent replay guard (HTTP `Idempotency-Key` header + domain `(test_id, start_token)` 24h window)
- [x] `executor_mode` records whether a human, AI agent, or CI runner drove the execution

#### Feature: Run Execution (Runner — mark step / finish / abort)

| Aspect | Value |
|---|---|
| **ID** | FEAT-024 |
| **Status** | Stable (Core, P0) |
| **Endpoints** | `PATCH .../runs/{id}/steps/{stepId}/mark` (route path is `POST /api/v1/runs/{id}/steps/{stepId}/mark` per this session's method grep — see note below), `POST /api/v1/runs/{id}/finish`, `POST /api/v1/runs/{id}/abort`, `GET /api/v1/runs/{id}` |
| **UI** | `components/runs/RunnerView.tsx`, `app/(app)/projects/[projectSlug]/runs/[runId]/page.tsx` |
| **Users** | Member+ (`requires: ['run:execute']`); Viewer has read-only access to the same page (`canManageRun` gate, per `.context/PRD/user-personas.md` §Persona 1) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-007; method-grep this session confirmed the mark-step route exports `POST`, not `PATCH` — `functional-specs.md`'s own table labels it `PATCH .../run-steps/{id}` (a slightly different path shape too — `run-steps/{id}` vs. this session's confirmed `runs/{id}/steps/{stepId}/mark`); both documents agree on the underlying capability, the exact verb/path is corrected here based on this session's direct route scan |

**Capabilities:**
- [x] Mark a step `passed`/`failed`/`blocked` (never back to `pending`)
- [x] Finish a Run with a final verdict `passed`/`failed`
- [x] Abort a Run with a 3-500 char reason
- [x] All three actions rejected with `409` once the Run's header status is terminal (one-way door)

#### Feature: File a Bug from a Failed Run Step

*(See Domain: Defect Management, FEAT-026 — the "Report bug" affordance is structurally part of the Runner, cross-referenced there to avoid duplicating the same capability under two IDs.)*

#### Feature: Run History per Test

| Aspect | Value |
|---|---|
| **ID** | FEAT-025 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/tests/{id}/runs` |
| **UI** | `app/(app)/projects/[projectSlug]/tests/[testId]/runs/page.tsx`, `app/(app)/projects/[projectSlug]/runs/page.tsx` (project-wide Runs list) |
| **Users** | Any workspace member incl. Viewer |
| **Dependencies** | none beyond Postgres |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] All-time Run history for one Test — deliberately the *opposite* aggregation convention from the filtered `GET .../runs/report` route below (per `.context/SRS/functional-specs.md` FR-006 area's "Technical Decision D2" comment surfaced in the `runs/report/route.ts` header)

---

### Domain: Defect Management

#### Feature: File a Bug

| Aspect | Value |
|---|---|
| **ID** | FEAT-026 |
| **Status** | Stable (Core, P0) |
| **Endpoints** | `POST /api/v1/bugs` |
| **UI** | Report-bug dialog embedded in `components/runs/RunnerView.tsx` (driven by `lib/runs/report-bug-view.ts`), `components/bugs/BugFormDialog.tsx` (standalone filing) |
| **Users** | Member+ (`requires: ['atc:write']` — note: Bug-domain write routes reuse the `atc:write` scope rather than a dedicated `bug:write` scope, confirmed via this session's `requires:` grep across all three `bugs/**` routes) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-008 |

**Capabilities:**
- [x] Run-linked filing (provenance server-derived from `run_step_id` — never client-supplied)
- [x] Standalone filing (`project_id` + `module_id` explicit)
- [x] Always created `status='open'` — no "file directly as resolved" path
- [x] Two independent consistency checks (RPC + `bugs_check_consistency` trigger)

#### Feature: Bug Status Transition

| Aspect | Value |
|---|---|
| **ID** | FEAT-027 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/bugs/{id}/status` |
| **UI** | `components/bugs/BugFormDialog.tsx` / the Bugs list detail view (`app/(app)/projects/[projectSlug]/bugs/page.tsx`) |
| **Users** | Member+ (`requires: ['atc:write']`) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-009 |

**Capabilities:**
- [x] Forward-only, exactly-one-rank-at-a-time (`open→in_progress→resolved→closed`)
- [x] Skip-ahead and backward/no-op moves both rejected (`45310`/`45311`)

#### Feature: Bug Assignment

| Aspect | Value |
|---|---|
| **ID** | FEAT-028 |
| **Status** | Stable (Core) |
| **Endpoints** | `POST /api/v1/bugs/{id}/assign` |
| **UI** | `app/(app)/projects/[projectSlug]/bugs/page.tsx` |
| **Users** | Member+ assigning (`requires: ['atc:write']`); assignee must be active + non-`viewer` |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `.context/SRS/functional-specs.md` FR-010 |

**Capabilities:**
- [x] Assign to any active, non-`viewer` workspace member
- [x] Unassign via `assignee_user_id: null`
- [x] Reject an inactive or `viewer`-role target (`45312`/`45313`)

#### Feature: Bug Heatmap

| Aspect | Value |
|---|---|
| **ID** | FEAT-029 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/projects/{id}/bugs/heatmap` |
| **UI** | (dedicated heatmap visualization not independently located this session — likely inside `app/(app)/projects/[projectSlug]/metrics/page.tsx` or the Bugs list) |
| **Users** | Any workspace member incl. Viewer |
| **Dependencies** | dedicated reporting migration `0052_defect_heatmap_report.sql` (filename-only evidence, per `business-data-map.md` §3.7) |
| **Evidence** | route-file grep this session; `.context/business/business-data-map.md` §3.7 |

**Capabilities:**
- [x] Module-level (or similar dimension) Bug density visualization, FK-graph-derived
- [ ] Discovery gap: exact dimension/grouping of the heatmap not read this session — see §9

---

### Domain: Reporting & Dashboards

#### Feature: Project Coverage Report

| Aspect | Value |
|---|---|
| **ID** | FEAT-030 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/projects/{id}/coverage` |
| **UI** | `app/(app)/projects/[projectSlug]/metrics/page.tsx`, `components/coverage/ProjectCoverageView.tsx` |
| **Users** | Any workspace member incl. Viewer, read-only |
| **Dependencies** | none beyond Postgres (FK-graph-derived, not manually tracked — `0048_project_coverage_report.sql`, `0050_project_coverage_report_real_execution_source.sql`) |
| **Evidence** | `metrics/page.tsx:1-11` (imports read this session); `.context/business/business-data-map.md` §3.7 |

**Capabilities:**
- [x] Uncovered-criteria / never-run-Test surfacing, computed from `atc_acceptance_criteria`/`test_steps`/`run_atcs`/`bugs.atc_id`

#### Feature: Workspace Coverage Report

| Aspect | Value |
|---|---|
| **ID** | FEAT-031 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/workspaces/{id}/coverage` |
| **UI** | (workspace-level rollup surface not independently located this session — likely `app/(app)/home/page.tsx`'s `CoverageSummaryCard`) |
| **Users** | Any workspace member incl. Viewer, read-only (`requires: ['atc:read']`) |
| **Dependencies** | same as FEAT-030, aggregated across Projects |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] Workspace-wide coverage rollup (cross-Project aggregation of FEAT-030's per-Project computation)

#### Feature: Traceability Report

| Aspect | Value |
|---|---|
| **ID** | FEAT-032 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/projects/{id}/traceability` |
| **UI** | `app/(app)/projects/[projectSlug]/traceability/page.tsx` |
| **Users** | Any workspace member incl. Viewer, read-only |
| **Dependencies** | dedicated reporting migration `0068_story_traceability_report.sql` (filename-only) |
| **Evidence** | `.context/business/business-data-map.md` §3.7 |

**Capabilities:**
- [x] Story → AC → ATC → Test → Run → Bug, both directions, single view

#### Feature: Recovery Cycle Metrics

| Aspect | Value |
|---|---|
| **ID** | FEAT-033 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/projects/{id}/metrics/recovery-cycles` |
| **UI** | `components/metrics/RecoveryCycleSection.tsx`, embedded in `metrics/page.tsx` |
| **Users** | Any workspace member incl. Viewer, read-only (no scope requirement — mirrors the Coverage/Runs report routes per the route's own header comment) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `app/api/v1/projects/[id]/metrics/recovery-cycles/route.ts:1-14` (full header comment read this session) |

**Capabilities:**
- [x] Per-User-Story elapsed time from first failing terminal Run to first subsequent all-passing terminal Run ("BK-47")

#### Feature: Runs Report (Filtered History)

| Aspect | Value |
|---|---|
| **ID** | FEAT-034 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/projects/{id}/runs/report` |
| **UI** | `app/(app)/projects/[projectSlug]/runs/page.tsx` |
| **Users** | Any workspace member incl. Viewer, read-only (no scope requirement yet — "the PAT catalog has no run-read scope", per route header) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `app/api/v1/projects/[id]/runs/report/route.ts:1-13` (full header comment read this session) |

**Capabilities:**
- [x] Date-range / module / status / executor filters, AND-composed
- [x] Pass/fail totals recomputed from the SAME filtered set — the opposite convention from FEAT-025's all-time totals ("BK-38, Business Rule #3", "Technical Decision D2")

#### Feature: Home Dashboard

| Aspect | Value |
|---|---|
| **ID** | FEAT-035 |
| **Status** | Stable (Core — first-landing surface for a returning user) |
| **Endpoints** | `GET /api/v1/workspaces/{id}/active-runs`, `GET /api/v1/workspaces/{id}/open-bugs`, `GET /api/v1/workspaces/{id}/recent-projects`, `GET /api/v1/workspaces/{id}/coverage` (FEAT-031) |
| **UI** | `app/(app)/home/page.tsx`, `components/home/ActiveRuns.tsx`, `components/home/CoverageSummary.tsx`, `components/home/OpenBugsCard` (module path inferred from import in `home/page.tsx`) |
| **Users** | Any authenticated user, workspace-scoped |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `app/(app)/home/page.tsx:1-20` (imports read this session) |

**Capabilities:**
- [x] Active-Runs widget (currently-running Runs across the workspace)
- [x] Open-Bugs widget
- [x] Coverage-Summary widget
- [x] Recent-Projects list

#### Feature: Activity Feed

| Aspect | Value |
|---|---|
| **ID** | FEAT-036 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/activity` |
| **UI** | `app/(app)/activity/page.tsx` ("BK-49 — the workspace Activity feed, §5 D15 — a standalone route, not Home"), `components/activity/ActivityView.tsx` |
| **Users** | Any authenticated user, workspace-scoped |
| **Dependencies** | `activity_log` table, populated as a byproduct of every write RPC (per `business-data-map.md` §5.1) |
| **Evidence** | `app/(app)/activity/page.tsx:1-12` (header comment read this session) |

**Capabilities:**
- [x] Paginated activity feed (`ACTIVITY_PAGE_SIZE` constant, cursor-based "load older")
- [x] First page server-rendered; subsequent pages client-fetched through the same API route

---

### Domain: Notifications

#### Feature: Notification Inbox

| Aspect | Value |
|---|---|
| **ID** | FEAT-037 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET /api/v1/workspaces/{id}/notifications`, `POST /api/v1/notifications/{id}/read`, `POST /api/v1/workspaces/{id}/notifications/read-all` |
| **UI** | `components/notifications/*` (directory confirmed to exist; individual component files not enumerated this session) |
| **Users** | Any authenticated user, workspace-scoped (personal inbox) |
| **Dependencies** | Supabase Realtime (confirmed realtime-enabled per `business-data-map.md` §6.1) |
| **Evidence** | route-file grep this session |

**Capabilities:**
- [x] List personal notifications (90-day visibility retention per `business-data-map.md` §2)
- [x] Mark one notification read
- [x] Mark all read
- [x] Bug-lifecycle and Run-lifecycle events populate this inbox via `activity_log_notify_bug_event`/`activity_log_notify_run_event` triggers (`business-data-map.md` §5.1)

#### Feature: Notification Preferences

| Aspect | Value |
|---|---|
| **ID** | FEAT-038 |
| **Status** | Stable (Secondary) |
| **Endpoints** | `GET/PATCH /api/v1/notification-preferences` |
| **UI** | `app/(app)/settings/notifications/page.tsx` ("BK-213 — AC1-AC5"), `components/settings/NotificationPreferencesGrid.tsx` |
| **Users** | Any authenticated user — personal + global, no workspace concept (per the page's own header comment) |
| **Dependencies** | none beyond Postgres |
| **Evidence** | `app/(app)/settings/notifications/page.tsx:1-13` (full header comment read this session) |

**Capabilities:**
- [x] Opt-out grid: `run_lifecycle`/`bug_lifecycle` × `in_app`/`email`
- [ ] `mentions` row is "structurally locked" — reserved for a future Team Chat epic, not user-editable today (per `business-data-map.md` §2 `notification_preferences` entry) — a confirmed, deliberate Planned-but-inert row, not a bug

---

### Domain: Public / Non-Authenticated Surfaces

#### Feature: API Docs (Scalar UI)

| Aspect | Value |
|---|---|
| **ID** | FEAT-039 |
| **Status** | Stable (Secondary — developer/QA-facing, not an end-user product feature) |
| **Endpoints** | consumes the live `GET /api/openapi` spec (outside `app/api/v1/`) |
| **UI** | `app/api/docs/page.tsx` |
| **Users** | Anyone (public, no auth gate — confirmed: page reads no session) |
| **Dependencies** | `@scalar/api-reference-react` (npm package, confirmed in `package.json`) |
| **Evidence** | `app/api/docs/page.tsx` (full 17-line file read this session) |

**Capabilities:**
- [x] Interactive OpenAPI documentation UI rendered client-side against the live spec

#### Feature: QA Testability Guide (Public Teaching Page)

| Aspect | Value |
|---|---|
| **ID** | FEAT-040 |
| **Status** | Stable (Secondary — QA-onboarding/teaching surface, not a product-CRUD feature) |
| **Endpoints** | none (static/config-driven page) |
| **UI** | `app/qa/page.tsx`, `app/qa/_components/QaShell.tsx`, `app/qa/qa-config.ts` |
| **Users** | Anyone (public, no auth gate — confirmed via the page's own comment: "Public teaching surface — no auth gate") |
| **Dependencies** | none |
| **Evidence** | `app/qa/page.tsx:1-33` (full file + header metadata block read this session — `skill-version=1.1.0`, `stack=next-15`, `auth-method=supabase-password+otp+cookie+bearer-pat`, `publisher=jira-epic`) |

**Capabilities:**
- [x] Documents Bunkai's own testability surface (DB/API/UI, three auth methods, two API-testing paths — OpenAPI MCP / Postman) for QA engineers and AI-assisted testers
- [x] Credentials for this guide are deliberately NOT inlined — sourced from a linked Jira Epic instead (per the page's own header)

#### Feature: About / Product Walkthrough (Public)

| Aspect | Value |
|---|---|
| **ID** | FEAT-041 |
| **Status** | Stable (Secondary — marketing/explainer surface) |
| **Endpoints** | none (static page) |
| **UI** | `app/about/page.tsx`, `app/about/_components/{BigPicture,Capabilities,Walkthrough,mockups,sections}.tsx` |
| **Users** | Anyone (public, no auth gate — "same posture as /qa" per the page's own comment) |
| **Dependencies** | none |
| **Evidence** | `app/about/page.tsx:1-20` (imports + header comment read this session) |

**Capabilities:**
- [x] Guided, illustrated walkthrough of the product's core concepts (Module tree, KATA `@atc()` methodology) and an end-to-end use case with real screens

#### Feature: Design Tokens Reference (Dev-Only)

| Aspect | Value |
|---|---|
| **ID** | FEAT-042 |
| **Status** | Stable (Secondary — internal design-system reference, not a product/QA feature) |
| **Endpoints** | none (static page) |
| **UI** | `app/design-tokens/page.tsx` |
| **Users** | Developers/designers (no explicit auth gate found — treat as effectively public unless middleware's `PROTECTED_PREFIXES` list, which does not include `/design-tokens`, changes) |
| **Dependencies** | none |
| **Evidence** | `app/design-tokens/page.tsx:1-19` (color-token table definitions read this session) |

**Capabilities:**
- [x] Enumerates the design system's color tokens (`--bg-*`, `--fg-*`, accents) for internal reference

---

## 3. CRUD Matrix

| Entity | Create | Read | Update | Delete | Evidence |
|---|---|---|---|---|---|
| Workspace | ✅ `POST /workspaces` | ✅ `GET /workspaces`, `GET /workspaces/{id}` | ✅ `PATCH /workspaces/{id}` | ❌ no route found | route grep this session |
| Workspace Member | ⚠️ only via Invite Accept, never a direct "add member" call | ✅ via `GET /workspaces/{id}/invites` + the Members page | ❌ **no re-role/promote/demote route exists** | ⚠️ self-leave only (`DELETE /workspaces/{id}/membership`) — no "admin removes another member" route found | `app/api/v1/workspaces/[id]/membership/route.ts:1-19` confirms self-only scope |
| Workspace Invite | ✅ `POST /workspaces/{id}/invites` | ✅ `GET /workspaces/{id}/invites` | ✅ `POST /invites/{inviteId}` (resend) | ✅ `DELETE /invites/{inviteId}` (revoke) | route grep this session |
| Access Token (PAT) | ✅ `POST /tokens` | ✅ `GET /tokens` | ❌ no route (scopes immutable post-issue) | ✅ `DELETE /tokens/{id}` | route grep this session |
| Project | ✅ `POST /workspaces/{id}/projects` | ⚠️ no dedicated REST `GET`; Project detail page reads via a direct server-side Supabase query (Server-Component-calls-service pattern, per `business-api-map.md` §4) | ❌ no route found | ❌ no route found | route grep this session |
| Module | ✅ `POST /projects/{id}/modules` | ⚠️ no dedicated `GET` route found; inferred read via the Project detail Server Component | ✅ `PATCH /modules/{id}` | ✅ `DELETE /modules/{id}` | route grep this session |
| User Story | ✅ `POST /modules/{id}/user-stories` | ✅ `GET /modules/{id}/user-stories`, `GET /user-stories/{id}` | ✅ `PATCH /user-stories/{id}` | ✅ `DELETE /user-stories/{id}` | route grep this session |
| Acceptance Criterion | ✅ `POST /user-stories/{id}/acceptance-criteria` | ✅ `GET /user-stories/{id}/acceptance-criteria`, `GET /acceptance-criteria/{id}` | ✅ `PATCH /acceptance-criteria/{id}` | ✅ `DELETE /acceptance-criteria/{id}` | route grep this session |
| ATC (+ Step, + Assertion, nested) | ✅ `POST /atcs` | ✅ `GET /atcs/search`, `GET /atcs/{id}/usage`; ⚠️ no dedicated `GET /atcs/{id}` single-item route found (ATC detail page likely reads directly, same pattern as Project) | ✅ `PATCH /atcs/{id}` | ❌ **no DELETE/archive route** despite an `archived_at` DB column already in use by RPC-side filters | `lib/atcs/duplicate-rpc.test.ts:62`, `lib/atcs/usage-rpc.test.ts:69` confirm the column; route grep confirms no reachable delete/archive endpoint |
| Test (+ Test Step, nested) | ✅ `POST /tests` | ✅ `GET /tests`, `GET /tests/{id}` | ✅ `PATCH /tests/{id}/reorder`, `PUT /tests/{id}/tags` | ❌ no route found | route grep this session |
| Run (+ Run ATC, + Run Step, nested) | ✅ `POST /runs` | ✅ `GET /runs/{id}`, `GET /tests/{id}/runs`, `GET /projects/{id}/runs/report` | ⚠️ state-transition only — `POST .../abort`, `POST .../finish`, `POST .../steps/{stepId}/mark` — no content edit | ❌ no route (by design — immutable execution history) | route grep this session |
| Project Environment | ✅ `POST /projects/{id}/environments` | ✅ `GET /projects/{id}/environments` | ✅ `PATCH /environments/{id}` | ✅ `DELETE /environments/{id}` | route grep this session — the only Product-Structure entity with all four verbs |
| Milestone | ✅ `POST /projects/{id}/milestones` | ✅ `GET /projects/{id}/milestones` | ✅ `PATCH /milestones/{id}` | ❌ no route (deliberate, per `business-data-map.md` §3.6) | route grep this session |
| Bug | ✅ `POST /bugs` | ✅ `GET /bugs`, `GET /projects/{id}/bugs`, `GET /projects/{id}/bugs/heatmap` | ⚠️ status/assignee only — `POST .../status`, `POST .../assign`; **no route to edit a Bug's own title/description/severity after filing** | ❌ no route found | route grep this session confirmed no `PATCH bugs/{id}` exists |
| Notification | ⚠️ system-generated only (via `activity_log_notify_*` triggers) — no user-facing create | ✅ `GET /workspaces/{id}/notifications` | ✅ `POST /notifications/{id}/read`, `POST .../read-all` | ❌ no route found | route grep this session |
| Notification Preference | ⚠️ presumed row-seeded at signup — no explicit create route found | ✅ `GET /notification-preferences` | ✅ `PATCH /notification-preferences` | n/a | route grep this session |
| Import Job | ✅ `POST /imports` | ⚠️ `GET /imports/{id}` single-item only — **no list-all route found** | ❌ no route (status is worker-driven, not user-editable) | ❌ no route found | route grep this session |
| Activity Log | ⚠️ system-generated, every write RPC's byproduct | ✅ `GET /activity` | n/a | n/a | route grep this session |
| Feature Flag | ❌ **no API route at all** | ❌ | ❌ | ❌ | `supabase/migrations/0009_cross_cutting.sql` defines the table; zero application-code call site found anywhere in `app/`/`lib`/`components` — a fully orphaned entity, see §7/§9 |

**Cross-reference with `business-data-map.md`'s 31-entity schema (Phase 5, per command doctrine)**: every one of the 10 "core" entities that document names (`business-data-map.md` §2) has ≥1 corresponding feature above. Two entities are **orphaned from the CRUD surface** in a load-bearing way: **Feature Flag** (DB table exists, zero API/UI reachability — flagged above and in §7/§9) and, more narrowly, **Workspace Member** (no update verb at all — re-role/demote is unreachable via this API). No feature above lacks a backing entity — every write endpoint in §4 maps to a named table in `business-data-map.md` §2.

---

## 4. API Endpoint Inventory

*(Grouped by domain. `Auth` column: `public` = no credential; `required` = cookie session or Bearer PAT; a bracketed scope means Bearer-PAT callers additionally need that `access_tokens.scopes[]` entry — cookie-session callers are exempt per the `ALL_CAPABILITIES` grant, `business-api-map.md` §2.)*

### Auth

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/check-email` | Determine sign-in vs. sign-up branch | public |
| POST | `/api/v1/auth/signup` | Create account, issue OTP | public |
| POST | `/api/v1/auth/confirm` | Verify OTP, grant session | public |
| POST | `/api/v1/auth/signin` | Password sign-in | public |
| POST | `/api/v1/auth/magic-link` | Request a magic sign-in link | public |
| POST | `/api/v1/auth/resend` | Resend an OTP/magic-link | public |

### Identity & Session

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/v1/me` | Current-session probe | required |
| POST | `/api/v1/me/active-workspace` | Rotate active-workspace cookie | required |
| POST | `/api/v1/invites/accept` | Redeem a workspace invite | required |

### Workspaces & Membership

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/workspaces` | Bootstrap a new workspace | required |
| GET | `/api/v1/workspaces` | List caller's workspaces | required |
| GET | `/api/v1/workspaces/{id}` | Workspace detail | required |
| PATCH | `/api/v1/workspaces/{id}` | Rename workspace | required `[workspace:admin]` |
| DELETE | `/api/v1/workspaces/{id}/membership` | Leave workspace (self only) | required |
| GET | `/api/v1/workspaces/{id}/invites` | List invites | required `[workspace:admin]` |
| POST | `/api/v1/workspaces/{id}/invites` | Send invite | required `[workspace:admin]` |
| POST | `/api/v1/workspaces/{id}/invites/{inviteId}` | Resend invite | required `[workspace:admin]` |
| DELETE | `/api/v1/workspaces/{id}/invites/{inviteId}` | Revoke invite | required `[workspace:admin]` |
| POST | `/api/v1/workspaces/{id}/projects` | Create Project | required |
| GET | `/api/v1/workspaces/{id}/recent-projects` | Recent Projects widget | required `[atc:read]` |
| GET | `/api/v1/workspaces/{id}/active-runs` | Home dashboard widget | required `[atc:read]` |
| GET | `/api/v1/workspaces/{id}/open-bugs` | Home dashboard widget | required `[atc:read]` |
| GET | `/api/v1/workspaces/{id}/coverage` | Workspace coverage rollup | required `[atc:read]` |
| GET | `/api/v1/workspaces/{id}/notifications` | List notifications | required |
| POST | `/api/v1/workspaces/{id}/notifications/read-all` | Mark all notifications read | required |

### Tokens (PAT)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/tokens` | Issue a PAT | required |
| GET | `/api/v1/tokens` | List own PATs | required |
| DELETE | `/api/v1/tokens/{id}` | Revoke a PAT | required |

### Product Structure

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/projects/{id}/modules` | Create Module | required |
| PATCH | `/api/v1/modules/{id}` | Update/move Module | required |
| DELETE | `/api/v1/modules/{id}` | Delete Module | required |
| GET/POST | `/api/v1/projects/{id}/environments` | List/create Environments | required |
| PATCH | `/api/v1/environments/{id}` | Update Environment | required |
| DELETE | `/api/v1/environments/{id}` | Delete Environment | required |
| GET/POST | `/api/v1/projects/{id}/milestones` | List/create Milestones | required |
| PATCH | `/api/v1/milestones/{id}` | Update Milestone | required |

### User Stories & Acceptance Criteria

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST/GET | `/api/v1/modules/{id}/user-stories` | Create/list User Stories | required |
| GET/PATCH/DELETE | `/api/v1/user-stories/{id}` | Read/update/delete a User Story | required |
| POST/GET | `/api/v1/user-stories/{id}/acceptance-criteria` | Create/list ACs | required |
| GET/PATCH/DELETE | `/api/v1/acceptance-criteria/{id}` | Read/update/delete an AC | required |

### ATC Library

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/atcs` | Create ATC | required `[atc:write]` |
| PATCH | `/api/v1/atcs/{id}` | Update ATC | required `[atc:write]` |
| POST | `/api/v1/atcs/{id}/duplicate` | Duplicate ATC | required `[atc:write]` |
| GET | `/api/v1/atcs/{id}/usage` | ATC usage lookup | required `[atc:read]` |
| GET | `/api/v1/atcs/search` | Search ATC library | required `[atc:read]` |

### Test Assembly

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET/POST | `/api/v1/tests` | List/create Tests | required `[atc:read]` (GET) / `[atc:write]` (POST) |
| GET | `/api/v1/tests/{id}` | Test detail | required |
| PATCH | `/api/v1/tests/{id}/reorder` | Reorder chain | required `[atc:write]` |
| PUT | `/api/v1/tests/{id}/tags` | Set tags | required `[atc:write]` |
| GET | `/api/v1/tests/{id}/runs` | Run history for this Test | required |

### Test Execution (Runs)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/runs` | Start a Run | required `[run:execute]` |
| GET | `/api/v1/runs/{id}` | Run detail | required |
| POST | `/api/v1/runs/{id}/steps/{stepId}/mark` | Mark a step's verdict | required `[run:execute]` |
| POST | `/api/v1/runs/{id}/finish` | Finish a Run | required `[run:execute]` |
| POST | `/api/v1/runs/{id}/abort` | Abort a Run | required `[run:execute]` |
| GET | `/api/v1/projects/{id}/runs/report` | Filtered Run history | required |

### Defect Management

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/bugs` | File a Bug | required `[atc:write]` |
| GET | `/api/v1/bugs` | List Bugs | required `[atc:write]`* |
| GET | `/api/v1/projects/{id}/bugs` | Project-scoped Bug list | required |
| GET | `/api/v1/projects/{id}/bugs/heatmap` | Bug heatmap | required |
| POST | `/api/v1/bugs/{id}/status` | Transition Bug status | required `[atc:write]` |
| POST | `/api/v1/bugs/{id}/assign` | Assign/unassign Bug | required `[atc:write]` |

*\* The `GET /api/v1/bugs` route shares the same `requires: ['atc:write']` grep result as its sibling `POST` in the same file — this is unusual for a list/read endpoint and was not independently re-verified against the route body; flagged for confirmation, see §9.*

### Reporting

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/v1/projects/{id}/coverage` | Project coverage | required |
| GET | `/api/v1/projects/{id}/traceability` | Traceability report | required |
| GET | `/api/v1/projects/{id}/metrics/recovery-cycles` | Recovery-cycle metrics | required |
| GET | `/api/v1/activity` | Activity feed | required |

### Notifications

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/notifications/{id}/read` | Mark one notification read | required |
| GET/PATCH | `/api/v1/notification-preferences` | Read/update preference grid | required |

### Imports (Jira)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/v1/imports` | Start a JQL import job | required |
| GET | `/api/v1/imports/{id}` | Import job status | required |

### System / Meta

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/v1/health` | Health check | public |
| GET | `/api/v1` | API index | public |

*(64 route files total, matching §1's re-count. OAuth's two handlers, `app/auth/callback/route.ts` and `app/auth/oauth/[provider]/route.ts`, live outside `app/api/v1/` and are intentionally excluded from this table — they are redirect/exchange handlers, not versioned JSON REST endpoints.)*

---

## 5. UI Component Inventory

### Forms

| Component | Feature | Evidence |
|---|---|---|
| `app/(auth)/login/email-first-form.tsx` | FEAT-001/002 | file path confirmed present |
| `app/(auth)/login/magic-link-form.tsx` | FEAT-003 | file path confirmed present |
| `app/(app)/onboarding/onboarding-form.tsx` | FEAT-006 | full file read this session (functional-specs.md FR-002) |
| `app/(app)/projects/create-project-form.tsx` | FEAT-012 | full file read this session (functional-specs.md FR-003) |
| create-module-form (path not independently opened; existence confirmed via `frontend.md`'s `data-testid` grep) | FEAT-013 | `frontend.md` §Test-ID strategy |
| create-environment-form (same as above) | FEAT-014 | `frontend.md` §Test-ID strategy |
| `components/milestones/CreateMilestoneForm.tsx` | FEAT-015 | `find components -iname "*form*"` |
| `components/milestones/EditMilestoneForm.tsx` | FEAT-015 | `find components -iname "*form*"` |
| `components/atcs/StepEditor.tsx` (Monaco-backed) | FEAT-016 | `grep -rl "@monaco-editor"` this session |
| `components/bugs/BugFormDialog.tsx` | FEAT-026 | `find components -iname "*form*"` |
| `components/settings/NotificationPreferencesGrid.tsx` | FEAT-038 | `settings/notifications/page.tsx` import |

### Dashboards / Views

| Component | Feature | Evidence |
|---|---|---|
| `components/home/ActiveRuns.tsx` | FEAT-035 | `home/page.tsx` import |
| `components/home/CoverageSummary.tsx` | FEAT-035 | `home/page.tsx` import |
| `components/coverage/ProjectCoverageView.tsx` | FEAT-030 | `metrics/page.tsx` import |
| `components/metrics/RecoveryCycleSection.tsx` | FEAT-033 | `metrics/page.tsx` import |
| `app/(app)/projects/[projectSlug]/traceability/page.tsx` | FEAT-032 | file path confirmed |
| `components/activity/ActivityView.tsx` | FEAT-036 | `activity/page.tsx` import |
| `components/atcs/AtcTable.tsx` (`@tanstack/react-table`-backed) | FEAT-018 | `grep -rl "@tanstack/react-table"` this session |
| `mind-map-view` (project explorer alt. view, `projects/[projectSlug]/page.tsx`) | FEAT-013/016 | `projects/[projectSlug]/page.tsx` full file read this session |
| `components/settings/TokensList.tsx` | FEAT-011 | `settings/tokens/page.tsx` import |
| `components/settings/WorkspacesList.tsx` | FEAT-005/FEAT-008 | `settings/account/page.tsx`, `settings/workspaces/page.tsx` imports |
| `members-client.tsx` | FEAT-009 | `workspaces/[id]/members/page.tsx` import |

### Actions (Modals / Dialogs / Confirmations)

| Component | Feature | Evidence |
|---|---|---|
| `app/(app)/projects/[projectSlug]/delete-environment-dialog.tsx` | FEAT-014 | `find ... -iname "*dialog*"` this session |
| `app/(app)/projects/[projectSlug]/delete-module-dialog.tsx` | FEAT-013 | same |
| `app/(app)/projects/[projectSlug]/move-module-dialog.tsx` | FEAT-013 | same |
| `app/(app)/projects/[projectSlug]/delete-user-story-dialog.tsx` | FEAT-019 | same |
| `app/(app)/projects/[projectSlug]/import-from-jira-dialog.tsx` | FEAT-021 | full file header read this session |
| `components/settings/IssueTokenModal.tsx` | FEAT-011 | `find` this session |
| `components/settings/RevokeTokenModal.tsx` | FEAT-011 | `find` this session |
| `components/settings/LeaveWorkspaceModal.tsx` | FEAT-008 | `find` this session |
| Report-bug dialog (`lib/runs/report-bug-view.ts`-driven, embedded in `RunnerView.tsx`) | FEAT-026 | `business-data-map.md` §3.3 |
| `components/layout/CommandPalette.tsx` (`cmdk`-backed) | cross-cutting navigation, not tied to one FEAT-NNN | `grep -rl "cmdk"` this session |
| `components/tests/AtcChainPicker.tsx` (`cmdk`-backed) | FEAT-018/022 | `grep -rl "cmdk"` this session |
| `components/tests/TestReorderClient.tsx` (`@dnd-kit`-backed) | FEAT-022 | `grep -rl "@dnd-kit"` this session |

---

## 6. Third-Party Integrations

| Service | Purpose | Package / Env | Status | Features Using It |
|---|---|---|---|---|
| Supabase (Postgres + Auth + Realtime) | Entire data layer, auth provider, live-update transport — no separate backend | `@supabase/ssr`, `@supabase/supabase-js`; `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET` (`.env.example`) | **Active** | All 42 features — foundational |
| Atlassian / Jira | One-way JQL-driven Story import | hand-written HTTP client (`lib/jira/client.ts` — no Jira SDK dependency); `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` (`.env.example`) | **Active** | FEAT-021 |
| Vercel | Hosting + `after()` background execution for the Jira import worker | platform-level, no npm package | **Active** | FEAT-021 (background execution specifically); hosting for all features |
| n8n | Declared automation-instance credentials | `N8N_API_URL`, `N8N_API_KEY` (`.env.example`) | **Declared, not confirmed at runtime** — no call site found in `app/`/`lib`/`components` this session; per `.env.example`'s own comment block this key family is scoped to "AI Agent MCP Servers," making it plausibly a dev-tooling integration for this QA-engineering repo's own automation rather than a Bunkai application feature | None confirmed |
| Resend | Transactional email | `RESEND_API_KEY` (`.env.example`, comment: "Used by application code AND for `resend` CLI authentication") | **Declared, not confirmed at runtime** — no `resend` SDK import found in `app/`/`lib`/`components`; email delivery for OTP (FEAT-001)/invites (FEAT-009) may be delegated entirely to Supabase Auth's own SMTP configuration, outside this repo's source | Plausibly FEAT-001, FEAT-009 — not confirmable from static analysis |
| GitHub / Google OAuth | Federated sign-in | handled via Supabase Auth, no direct SDK | **Active** | FEAT-004 |

**No payment, analytics, or observability/monitoring service integration was found** — confirmed via `package.json` dependency scan this session (no Stripe/Segment/Sentry/PostHog/Datadog-shaped package) and consistent with `.context/infrastructure/frontend.md`'s independent finding of "no `web-vitals` package, Lighthouse CI config, or Sentry Performance found."

---

## 7. Feature Flags and WIP

| Flag | Description | Default | Environment |
|---|---|---|---|
| — | — | — | — |

**No runtime feature-flag mechanism exists.** The `feature_flags` table is defined in `supabase/migrations/0009_cross_cutting.sql` (per `business-data-map.md` §2, described there as "Global or per-workspace boolean gates") but this session's fresh, repo-wide grep for `feature_flags`/`featureFlags` across `app/`, `lib/`, `components/` returned **zero matches outside the auto-generated `lib/types/supabase.ts` type definitions** — no application code reads or writes this table. It is a fully orphaned, schema-only entity (cross-referenced in §3's CRUD matrix and §9).

| Planned feature | Evidence (TODOs, stubs) | Estimated status |
|---|---|---|
| — | — | — |

**No `TODO`/`FIXME`/`WIP`/`HACK` marker or stub route handler was found anywhere in `app/`, `lib/`, `components/`.** A repo-wide case-insensitive grep this session returned only incidental false positives — the Spanish word *"Todo"* ("everything") appearing in marketing copy on `/qa` and `/about` pages, not a code marker. This is a genuinely clean-of-WIP-markers codebase, not a discovery gap.

**One roadmap-vs-implementation discrepancy is worth flagging as a WIP-adjacent finding** (not a code gap): per `business-data-map.md` §3.6, the product's own roadmap content (`business-model.md` §Key Activities) still lists **Milestones** (FEAT-015) as *"'próximo'/upcoming"* despite this session's fresh route scan confirming the table, RPC, and full create/read/update API already exist and work. This is a marketing-copy staleness issue for the team to reconcile, not a missing capability.

---

## 8. QA Relevance

### Feature Test Coverage Matrix

*(Project-wide: 132 `*.test.ts`/`*.test.tsx` files exist, colocated with source — 17 under `app/api/v1/**/route.test.ts`, 110 under `lib/**/*.test.ts`, **0** under `components/**/*.test.tsx` — confirmed via `find` this session. There is **no E2E automation anywhere in the project** — no Playwright/Cypress config or spec files exist (per this session's own Project Assessment in `CLAUDE.md`). That "E2E: none, project-wide" fact is stated once here and not repeated per row below.)*

| Feature ID | Unit (`lib/`) | Integration (`route.test.ts`) | E2E | Status |
|---|---|---|---|---|
| FEAT-001/002 (Auth) | ⚠️ `lib/auth/` tests exist | ✅ `auth/magic-link`, `auth/resend` route tests confirmed | ❌ | Needs E2E; `check-email`/`signup`/`confirm`/`signin` route-level tests not confirmed present this session |
| FEAT-006 (Workspace Bootstrap) | ⚠️ `lib/workspaces/` tests exist | ✅ `workspaces` route test confirmed | ❌ | Needs E2E |
| FEAT-008 (Leave Workspace) | ⚠️ `lib/workspaces/` tests exist | ✅ `workspaces/[id]/membership` route test confirmed | ❌ | Needs E2E |
| FEAT-016 (ATC Authoring) | ✅ `lib/atcs/` — largest test surface (17 `lib` test dirs total; `duplicate-rpc.test.ts`, `usage-rpc.test.ts`, `errors.test.ts` confirmed by filename) | ✅ `atcs/[id]/duplicate` route test confirmed | ❌ | Needs E2E — the product's core differentiator has the deepest existing unit coverage but zero browser-level verification |
| FEAT-023/024 (Runs) | ⚠️ `lib/runs/` tests exist | ✅ `runs` route test confirmed | ❌ | Needs E2E — this is the P0 "Execute a Run & file a Bug" journey; highest-risk gap given zero E2E anywhere |
| FEAT-026/027/028 (Bugs) | ⚠️ `lib/bugs/` tests exist | ✅ `bugs`, `bugs/[id]/assign`, `bugs/[id]/status`, `projects/[id]/bugs` route tests confirmed | ❌ | Needs E2E |
| FEAT-036 (Activity) | ⚠️ `lib/activity/` tests exist | ✅ `activity` route test confirmed | ❌ | Needs E2E |
| FEAT-037/038 (Notifications) | ⚠️ `lib/notifications/`, `lib/notification-preferences/` tests exist | ✅ `notification-preferences`, `notifications/[id]/read`, `workspaces/[id]/notifications`, `.../read-all` route tests confirmed | ❌ | Needs E2E |
| FEAT-022 (Test Assembly) | ⚠️ `lib/tests/` tests exist | ⚠️ no `tests/**/route.test.ts` found in this session's route-test listing | ❌ | Needs Integration + E2E |
| FEAT-012/013/014/015 (Product Structure) | ⚠️ `lib/projects/`, `lib/modules/`, `lib/environments/`, `lib/milestones/` test dirs all exist | ⚠️ no corresponding `route.test.ts` files found in this session's listing (17 route tests are concentrated in activity/atcs/auth/bugs/me/notifications/projects-bugs/runs/workspaces) | ❌ | Needs Integration + E2E |
| FEAT-039-042 (Public pages) | ❌ none found | ❌ none found | ❌ | No coverage — lowest risk (static/marketing content, no business logic) |
| **All UI components** (`components/**`) | — | — | ❌ | **0 of 132 test files touch `components/`** — the entire React component layer (forms, dialogs, dashboards, the Runner) has zero automated coverage of any kind, confirmed via `find components -name "*.test.tsx" -o -name "*.test.ts"` returning 0 this session |

### High-Risk Features (Prioritize Testing)

| Feature | Risk | Reason |
|---|---|---|
| FEAT-023/024 — Start/Execute a Run | **HIGH** | The system's P0 journey; snapshot-freeze + idempotency + terminal-state lockout are all independently RPC/trigger-enforced business rules with zero component-level or E2E coverage; a UI regression here (e.g. the "Report bug" button rendering when it shouldn't) would ship undetected today |
| FEAT-026/027/028 — Bug lifecycle | **HIGH** | Two-layer consistency enforcement (RPC + trigger) and a 16-cell forward-only state machine (FR-009) exist specifically because this domain is defect-record integrity-critical; a bypass here corrupts the audit trail the whole product's value proposition rests on |
| Multi-tenant isolation (cross-cutting, not one FEAT-NNN) | **HIGH** | Per `business-data-map.md` §1, RLS + `workspace_members` resolution is the dominant cross-cutting risk in the entire system — every feature above inherits this risk; a single RLS regression on any of the ~19 CRUD-matrix entities is a tenant-data leak, not a feature bug |
| FEAT-008 — Leave Workspace (sole-owner guard) | **MEDIUM-HIGH** | `45213` sole-owner rejection is a single-instance BVA case (1 owner vs. 2 owners) that, if it regresses, either locks a workspace with no way to add an owner or allows an ownerless workspace to exist — both are unrecoverable-without-support states |
| Workspace Member re-role/removal — **absent capability**, not a FEAT-NNN | **MEDIUM** | Not a bug to test, but a genuine product gap worth flagging to the team: there is no way, via this API surface, for an Admin/Owner to demote or remove an existing member short of that member leaving voluntarily — worth confirming this is intentional before writing negative-path tests that assume such a route should exist |
| The entire `components/**` layer | **MEDIUM** | Zero automated coverage of any kind (unit, integration, or E2E) across every form, dialog, and dashboard in the product — this is the layer a real user actually touches, and it is currently untested by any automated means |

---

## 9. Discovery Gaps

- ~~UI entry points not independently located for several features: FEAT-007 (Active Workspace Switching — no switcher component found), FEAT-017 (ATC Duplication — trigger button not located, presumed a row action in `AtcTable.tsx`), FEAT-019/FEAT-020 creation forms (User Story / Acceptance Criterion — presumed embedded in the Module tree/Story detail UI, not independently opened), FEAT-029's heatmap visualization component, FEAT-031's workspace-coverage UI surface (presumed folded into `CoverageSummaryCard`). None of these are capability gaps — the API routes and/or the DB evidence for each confirm the feature exists — only the exact UI file was not opened this session.~~ **RESOLVED 2026-08-13**, per-feature: FEAT-007 — the switcher exists at `components/layout/WorkspaceSwitcher.tsx` (fetches `/api/v1/me` for the workspace list, renders a dropdown with a Check-marked active workspace). FEAT-017 — the presumed `AtcTable.tsx` location was **wrong**; ATC Duplication actually has TWO trigger points: the Project Explorer's context menu (`app/(app)/projects/[projectSlug]/project-explorer.tsx:222-235`, `handleDuplicateAtc` → `onDuplicateAtc`) and a "Duplicate" button in the ATC detail editor itself (`components/atcs/AtcEditor.tsx:154-223`, `handleDuplicate`) — both call the same shared `duplicateAtc` client (`lib/atcs/duplicate-client.ts`). FEAT-019/FEAT-020 — confirmed embedded in the Module tree as presumed: `UserStoryForm` (`app/(app)/projects/[projectSlug]/user-story-form.tsx`) and `AcceptanceCriteriaPanel` (`app/(app)/projects/[projectSlug]/acceptance-criteria-panel.tsx`) are both rendered directly inside `project-explorer.tsx` (imports at lines 14/24, usage at 589/605/643) — no separate creation page exists for either. FEAT-029's heatmap component is `components/bugs/BugsHeatmapView.tsx` — see the dedicated Bug Heatmap resolution below for its grouping dimension. FEAT-031 — the `CoverageSummaryCard` presumption was correct: it is exported from `components/home/CoverageSummary.tsx:63`, renders the workspace-level AC coverage rollup (bound/awaiting-execution/unbound, three always-shown chips, no delta) — distinct from the separate project-level `components/coverage/ProjectCoverageView.tsx`.
- **Workspace Member has no update/re-role path and no "admin removes another member" path** — confirmed by direct route-body reading of `app/api/v1/workspaces/[id]/membership/route.ts` (self-only `DELETE`) and by the absence of any `PATCH .../members/{userId}` or equivalent route in the full 64-route inventory. This directly resolves (as a negative confirmation) the open question `.context/PRD/user-personas.md` §7 had flagged: *"Whether an admin can demote/remove an owner … not confirmed from the invite-role enum alone."* The answer, at the API-surface level, is: **there is no such route at all**, for any target role — not just `owner`. Worth a direct team confirmation before treating this as either an intentional MVP scope cut or a genuine missing feature.
- ~~`GET /api/v1/bugs`'s auth requirement — this session's `requires:` grep returned `['atc:write']` for both the `POST` and `GET` handlers in `app/api/v1/bugs/route.ts` (same grep match, same file). A write-scope requirement on a list/read endpoint would be an unusual, possibly unintentional pattern inconsistent with every other list endpoint in this inventory (which uniformly gate on the `:read` variant or no scope at all) — the route body itself was not opened to confirm whether the two handlers' `requires:` arrays are genuinely identical or whether the grep merged two separate declarations. Flag for direct code confirmation before treating this as a real asymmetry.~~ **RESOLVED 2026-08-13**: it was a grep artifact, not a real asymmetry. The prior grep matched the `POST` handler's `requires: ['atc:write']` and attributed it to `GET` by file proximity. Reading `app/api/v1/bugs/route.ts` in full: `POST` (line 210) is `{ auth: 'required', requires: ['atc:write'] }`; `GET` (line 279) is `{ auth: 'required' }` with **no scope requirement at all** — consistent with every other list endpoint in this inventory. The route's own comment block (lines 212-222) documents this as a deliberate choice ("Decision 2 — mirrors `GET /api/v1/activity` and `GET /api/v1/tests/{id}/runs`, neither of which gates on a scope; the AC's original 'PAT scope bugs:read' wording described a scope that was never implemented").
- **No dedicated single-item `GET` route for Project, Module, or ATC** — all three appear to be read via direct server-side Supabase queries from their respective Server Components (the pattern `business-api-map.md` §4 already documents architecturally: "Server Components/Server Actions call `lib/<domain>/` service modules directly"), not through `/api/v1/*`. This is architecturally consistent, not a bug, but means an API-only test client (e.g. an AI agent or CI runner holding only a PAT) has **no way to read a single Project, Module, or ATC by id** — only search/list/usage variants. Worth confirming whether this is an intentional API-surface scope cut for machine callers.
- ~~`app/auth/callback/route.ts` and `app/auth/oauth/[provider]/route.ts` bodies were not read this session — their existence is confirmed (`find app/auth -name route.ts`), backing FEAT-003 and FEAT-004, but the exact provider-scope/consent configuration and magic-link redemption logic were not independently verified.~~ **RESOLVED 2026-08-13**, both read in full. `app/auth/oauth/[provider]/route.ts` (initiation, BK-3): validates the `provider` param (`isOAuthProvider`), mints a CSRF `state`, calls `supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } })` to get the provider's authorize URL (PKCE — Supabase SDK persists its own `code_verifier` cookie), stores `state` in the `bk_oauth_state` cookie, then 302s to the provider; any Supabase-side error redirects to `/login?error=oauth_init_failed`. `app/auth/callback/route.ts` handles BOTH magic-link OTP and OAuth on one route: for OAuth it first validates `bkstate` against the stored cookie (one-time-use, deleted regardless of outcome) and returns a **403** `OAUTH_STATE_MISMATCH` JSON body on mismatch — never a silent redirect; a denied-consent (`?error=access_denied`) redirects to `/login?error=oauth_denied` before any code exchange is attempted; a successful `exchangeCodeForSession(code)` failure redirects to `/login?error=oauth_init_failed` (OAuth) or `/login?error=otp_exchange_failed&reason=<message>` (magic-link) — so OAuth failures surface as a generic error page, never an unhandled crash or raw provider error. QA-relevant observation on the open-redirect angle: both routes source their post-login destination (`next` / `safeNext`) through `safeInternalPath()` (`lib/urls.ts:51-56`), which only accepts a value starting with a single `/` (rejects `//...` protocol-relative and any absolute URL, falling back to `/projects`) — no open-redirect vector found in this pair of routes.
- ~~Bug Heatmap's exact grouping dimension (module? severity? time-bucket?) was not confirmed — only the endpoint's existence and the backing migration filename (`0052_defect_heatmap_report.sql`).~~ **RESOLVED 2026-08-13**: the grouping dimension is **Module** — one grid cell per active Module (`components/bugs/BugsHeatmapView.tsx:126-219`, `report.items.map(item => <HeatmapCell ... />)`, keyed on `item.module_id`, labeled with the module's full path to disambiguate identically-named nested modules). Severity is NOT a grouping axis — each cell shows a single rolled-up `defect_count` regardless of severity. Time is a **filter**, not a grouping axis: a toolbar window selector (7d/30d/90d, default 30d) re-fetches the whole grid, and each cell additionally carries a week-over-week trend indicator (rising/falling/flat + delta, latest 7 days vs. prior 7 days) — but there is no separate time-bucketed axis inside a cell. The per-cell heat tag (Clean/Low/Elevated/Hotspot) is a density bucket derived from `defect_count` within the selected window.
- **`feature_flags` table is fully orphaned** — defined in the schema, zero application-code reachability. Not necessarily a "bug" (it may be intentionally reserved for a future release-gating mechanism), but worth a direct team question: is this table dead weight to remove, or scaffolding for a near-term feature?
- **Component-layer test coverage is genuinely zero** (0 of 132 test files touch `components/**`) — confirmed via `find components -name "*.test.tsx" -o -name "*.test.ts"` this session. Combined with zero E2E project-wide, this means the entire user-facing interaction layer (every form, dialog, and the Runner itself) has no automated regression safety net today — the single highest-leverage finding for this QA repo's own roadmap.
- ~~n8n and Resend integration status — both remain unconfirmed at runtime (§6), carried forward from this session's earlier `business-api-map.md`/`business-data-map.md` findings, independently re-checked (not re-confirmed differently) via this session's own grep.~~ **RESOLVED 2026-08-13**: a fresh, exhaustive case-insensitive whole-repo grep (`n8n`, `resend`, `Resend(`, `N8N_`, `RESEND_` — beyond `app`/`lib`/`components`, also `scripts/`, root config, `middleware.ts`) confirms **neither is a live runtime integration**; both are dead/vestigial at the app-code level. n8n: `N8N_API_URL`/`N8N_API_KEY` exist only to configure the `n8n` MCP server (`CLAUDE.md:217`, `.env.example:68-70`); every other hit is `.agents/skills/n8n-*` community skill documentation, zero application call sites. Resend: `resend` is not an npm dependency at all (absent from `package.json`); `RESEND_API_KEY` backs only the `/resend-cli` CLI skill + installer/doctor scripts (`cli/doctor.ts`, `cli/install.ts`); the two in-app "resend" symbols are false positives — `POST /api/v1/auth/resend` wraps `supabase.auth.resend()` (OTP resend, unrelated to the Resend service) and `members-client.tsx`'s local `resend()` handler just rotates an invite token via `POST /api/v1/workspaces/{id}/invites/{inviteId}` and copies the link — it never sends an email itself. Full detail cross-referenced in `business-api-map.md` §7.
- ~~**`business-api-map.md`'s "67 route files" vs. this document's fresh count of 64** — noted in §1, not silently reconciled. Both counts are from direct `find` commands run in independent sessions against the same repo; the 3-file discrepancy was not chased down (possible explanations: a since-added/removed route, or the earlier count including the two `app/auth/**` OAuth handlers this document deliberately excludes from `app/api/v1/` scope).~~ **RESOLVED 2026-08-13**: a third independent `find app/api/v1 -name 'route.ts' | wc -l` run this session confirms **64** as the definitive, current count — matching this document, not `business-api-map.md`'s "67." `business-api-map.md` has been corrected to 64 accordingly.
- **Real per-feature usage/adoption data** — none of this discovery method (static code reading) can establish which of these 42 features are actually used in production, at what volume, or by which persona mix. Out of scope for a code-only pass; would require live analytics (none of which are integrated, per §6).

---

*This document is the feature-centric complement to `.context/business/business-data-map.md` (data-centric) and `.context/business/business-api-map.md` (journey/auth-centric). Re-run this discovery after any new `app/api/v1/**/route.ts` file, any new top-level `page.tsx`, or any change to `package.json` dependencies that could add/remove a third-party integration — those are the highest-signal triggers for staleness. `upex-bunkai-tms/.context/` was not read at any point in this discovery.*
