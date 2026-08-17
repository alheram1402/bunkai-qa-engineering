# Business API Map — Bunkai

> Last verified against route-scanned source on 2026-08-13 — no static OpenAPI spec file exists in `upex-bunkai-tms` (confirmed: `find . -maxdepth 1 -iname "openapi*" -o -iname "swagger*"` returns nothing, per `architecture.md` §7). The spec is generated at build/sync time from `lib/openapi/registry.ts` + per-route `route.openapi.ts` siblings and served at runtime via `app/api/openapi/route.ts` — until `bun run api:sync` is pointed at that runtime endpoint, the technical API surface (types, exact request/response shapes) is not yet materialized in this QA repo. This document was produced by scanning `app/api/v1/**/route.ts` directly (~~67~~ **64 route files — corrected 2026-08-13**, see §7 Discovery Gaps) plus `middleware.ts`, `lib/api/*.ts`, and representative domain route handlers — a route-scannable Next.js App Router tree stood in for a spec, per the command's soft-gate rule. `upex-bunkai-tms/.context/` was NOT read at any point in this discovery (fresh, independent re-derivation).

```
+------------------------------------------------------------------------+
|                                                                          |
|   B U N K A I   —   T H E   A P I   S T O R Y                          |
|                                                                          |
|   A human clicks a button, or an AI agent sends a Bearer token —       |
|   either way they land on the SAME 67-route surface, gated by the      |
|   SAME Postgres RLS, and the API IS the product: there is no separate |
|   backend service to reason about.                                     |
|                                                                          |
+------------------------------------------------------------------------+
```

---

## 1. Executive Summary

Bunkai's API lets a QA team turn a written requirement into an executed, defect-traced test suite in four business moves, each one call chain deep: authenticate, author a reusable Acceptance Test Case anchored to a real Acceptance Criterion, chain it into a Test, and start a Run whose failed step files a Bug with its full context frozen. Every one of those moves is reachable identically by a person clicking through the browser or by an AI agent/CI runner calling the API directly with a scoped Bearer token — the API is not a secondary integration surface bolted onto a UI, it *is* the product's execution layer (`lib/api/principal.ts:12-25`, ADR-0001 per inline comment).

What makes this API distinctive from a QA-testing perspective is where its rules live: the TypeScript route handlers under `app/api/v1/**/route.ts` do request parsing, Zod validation, and error-mapping, but the actual business decisions — "does this Bug's provenance chain stay internally consistent," "did this Bug status move forward exactly one rank," "is this Test's ATC chain resolvable inside the caller's own workspace" — are made by hand-written `SECURITY DEFINER` PL/pgSQL RPC functions inside Postgres, re-checked a second time by BEFORE-trigger backstops on the same tables (`architecture.md` §1, §8). A negative-path API test in this system is therefore, more often than not, actually testing a database function's SQLSTATE contract, not a TypeScript `if` branch.

The API surface itself is a single Next.js 15 deployment (`app/api/v1/**/route.ts`, ~~67 route files scanned this session~~ **64 route files — corrected 2026-08-13 via a fresh `find app/api/v1 -name 'route.ts' | wc -l`, matching `business-feature-map.md`'s independently-derived count; see §7 Discovery Gaps**) — there is no separate backend service, no API gateway, and no committed OpenAPI spec file; the spec is generator-produced from a live Zod registry at sync time (`architecture.md` §7). Every route funnels through one shared gateway (`lib/api/handler.ts`'s `withApiHandler`), which is the single place that resolves who is calling, enforces capability scopes, and maps every thrown error into one JSON envelope — a QA engineer reviewing this API only has to understand one auth/error contract, not sixty-four bespoke ones.

---

## 2. Permission & Auth Model

### Tier table

| Tier | Who it applies to | How to acquire | Where enforced (code path) |
|---|---|---|---|
| **Public** | Anyone, unauthenticated | N/A — no credential needed | Route opts in explicitly via `withApiHandler(handler, { auth: 'public' })` (`lib/api/handler.ts:45-46`). Confirmed public routes: `/api/v1/health`, `/api/v1/openapi`, `/api/v1` (index), `/api/v1/auth/{check-email,signin,signup,confirm,magic-link,resend}`, `/api/v1/invites/accept` (per `lib/api/handler.ts` comment: "the API index, sign-in/sign-up/magic-link"). |
| **Cookie Session (human, browser)** | A Viewer/Member/Admin/Owner signed in via email-first login, OTP, magic-link, or GitHub/Google OAuth | `/login` → `check-email` routes to signin/verify/create → GoTrue issues an HTTP-only session cookie via `@supabase/ssr` | `middleware.ts:21-56` refreshes the cookie and redirects unauthenticated visits to `PROTECTED_PREFIXES` (`/home`, `/projects`, `/onboarding`, `/settings`, `/activity` — `middleware.ts:10`) to `/login`. On the API side, `resolveIdentity()` (`lib/api/principal.ts:61-73`) reads the same cookie and grants `ALL_CAPABILITIES` (`principal.ts:31`) — a cookie session is trusted as "the UI already gates writes," so the real authorization backstop for a cookie caller is Postgres RLS + each domain's `workspace_members` role check, not the capability list. |
| **Bearer PAT (machine — AI agent / CI runner / scripted client)** | An `agent`/`ci`/`human` caller holding a Personal Access Token (`bk_pat_<prefix>.<secret>`) | Session-issued via `POST /api/v1/tokens` (any role, scoped to a chosen workspace + explicit scope list), or auto-issued with `DEFAULT_PAT_SCOPES` (`atc:read`, `atc:write`, `run:execute` — excludes `workspace:admin`) at headless `signin`/`signup` (`lib/api/pat.ts:22-26`) | `resolveIdentity()`'s Bearer-first branch (`principal.ts:49-59`) validates the token via `requireBearerToken()`, then `requireCapability()` (`handler.ts:77-78`) enforces the route's declared `requires: [...]` scopes against `access_tokens.scopes[]`. `assertWorkspaceContext()` (`principal.ts:91-104`) additionally pins a PAT to the single workspace it was issued for — a token scoped to Workspace A gets `forbidden` on Workspace B, and a token with no workspace binding cannot touch any `workspace:admin` route at all. |

**Role sub-tier (applies within the Cookie-Session tier only)**: `workspace_members.role` ∈ `viewer < member < admin/owner`, ascending permissions, RLS-enforced on every table (`user-personas.md` §5-6). A Viewer's writes are rejected at both the UI (no create affordance rendered) and the RLS/RPC layer independently — defense-in-depth, not convention (`architecture.md` §8).

**Scope sub-tier (applies within the Bearer-PAT tier only)**: `access_tokens.scopes[]` ⊆ `{atc:read, atc:write, run:execute, workspace:admin}` (`lib/api/pat.ts:13-18`), DB-enforced non-empty + allow-listed (`supabase/migrations/0008_access_tokens.sql:29-33`). `workspace:admin` cannot be requested through headless auth at all — it requires an explicit `POST /api/v1/tokens` call against a specific workspace where the caller already holds `admin`/`owner` (`lib/api/pat.ts:29-35`, ADR-0005 per inline comment).

**Enforcement is layered, not single-point**: even after a caller clears `resolveIdentity()` + `requireCapability()`, every actual data read/write still goes through an RLS-scoped or impersonating-JWT Supabase client (`principal.db`, `principal.ts:39-42,110-123`) — so Postgres RLS is the final, structural authorization backstop for both tiers alike, not a TypeScript-only gate.

### Token flow — Cookie Session (primary human scheme)

```
Browser                    middleware.ts                 GoTrue (Supabase Auth)
   |                                                              
   |--- GET /projects (no session) -------------------------->|
   |                            |--- refresh via getUser() ------------------->|
   |                            |<-- no user -----------------------------------|
   |<-- 302 redirect to /login?next=/projects -------------------|
   |
   |--- POST /api/v1/auth/check-email {email} ----------------------------------------->  (public route)
   |<-- {exists, confirmed} -------------------------------------------------------------|
   |--- POST /api/v1/auth/signin {email, password} ------------------------------------->|
   |<-- 200, Set-Cookie: session --------------------------------------------------------|
   |
   |--- GET /projects (cookie attached) ---------------------->|
   |                            |--- refresh session (getUser(), on EVERY request) ----->|
   |                            |<-- user ---------------------------------------------|
   |<-- forwarded to route ------|
   |--- POST /api/v1/atcs (cookie) ---> withApiHandler --> resolveIdentity() cookie branch (principal.ts:61-73)
   |                                    --> Principal{capabilities: ALL, db: RLS-scoped SSR client}
   |                                    --> handler runs, RLS re-checks workspace_members role
```

### Token flow — Bearer PAT (machine / AI agent / CI)

```
Operator (human, admin/owner)                  Bunkai API                        Postgres
   |--- POST /api/v1/tokens {workspace_id, scopes} (cookie session) ------------->|
   |                                              |--- role-gate: caller is admin/owner
   |                                              |    in THIS workspace? (lib/api/pat.ts) --->|
   |<-- 201 { token: "bk_pat_<prefix>.<secret>" } (shown ONCE) -------------------|

AI Agent / CI runner
   |--- POST /api/v1/runs                                                          
   |    Authorization: Bearer bk_pat_<prefix>.<secret>
   |    ------------------------------------------------------------------------->|
   |                    resolveIdentity(): Bearer branch (principal.ts:49-59)
   |                       --> requireBearerToken() validates prefix + secret hash
   |                       --> Principal{capabilities: token.scopes, workspaceId: token's bound workspace}
   |                    requireCapability(principal, 'run:execute')  (handler.ts:77-78)
   |                    impersonatingClient(): mints a short-lived user-scoped JWT
   |                       (mintUserJwt, principal.ts:110-123) so RLS applies
   |                       IDENTICALLY to how it would for the human owner of that token
   |<-- 201 { run } --------------------------------------------------------------|
```

No per-endpoint listing appears here — the full 67-route inventory belongs to the (not-yet-synced) OpenAPI spec, per this document's own scope fence.

---

## 3. Critical Business Journeys

*(7 journeys selected — the doctrine cap. All 7 are P0/P1 flows independently confirmed this session or carried from this session's SRS discovery; none were invented. Feature-map `FEAT-NNN` pointers are omitted throughout this section because `.context/business/business-feature-map.md` does not exist yet — see §7 Discovery Gaps.)*

### Journey 1 — Email-First Sign-Up & Sign-In

**Business purpose**: gets a new or returning user from "has an email address" to "holds an authenticated session," routing them to the right step without ever asking "sign in or sign up?" explicitly.

```
Browser              check-email route         GoTrue                Postgres (auth_email_status RPC)
  |-- POST /api/v1/auth/check-email {email} -->|
  |                        |-- auth_email_status RPC (service-role, bypasses GoTrue throttling) -->|
  |                        |<-- {exists, confirmed} -----------------------------------------------|
  |<-- 200 {exists, confirmed} ------------------|
  |
  alt exists && confirmed:
     |-- POST /api/v1/auth/signin {email, password} -->|
     |                        |-- signInWithPassword -------------->|
     |<-- 200, session cookie set --------------------|
  else exists && !confirmed:
     |-- POST /api/v1/auth/confirm {email, otp} -->|  (after a resend if needed)
     |<-- 200, session cookie set ------------------|
  else !exists:
     |-- POST /api/v1/auth/signup {email, password} -->|
     |<-- 202, OTP issued ------------------------------|
     |-- POST /api/v1/auth/confirm {email, otp} ------->|
     |<-- 200, session cookie set ----------------------|
```

1. The client POSTs the email alone to `check-email` — a deliberate, documented exception to the rest of the auth surface's non-disclosure norm (BR-001, ADR-0007 per inline comment) — so the UI knows which of three steps to render next.
2. `auth_email_status` is a `SECURITY DEFINER` RPC specifically because it needs to read `auth.users` (normally PostgREST-restricted) using a service-role connection, bypassing GoTrue's own rate limiting for this one lookup.
3. Existing + confirmed → password sign-in; existing + unconfirmed → routes straight to OTP verification (never "wrong password"); unknown → account creation, which itself requires OTP confirmation before a session is granted.
4. Every one of `signup`/`confirm`/`magic-link`/`resend` throws the same `429 rate_limited` code when GoTrue's own throttling engages (`functional-specs.md` FR-001 Edge Cases) — this repo has no additional app-level limiter layered on top for these five routes specifically.

**Endpoints involved**: `POST /api/v1/auth/check-email`, `POST /api/v1/auth/signin`, `POST /api/v1/auth/signup`, `POST /api/v1/auth/confirm`, `POST /api/v1/auth/magic-link`, `POST /api/v1/auth/resend`.
**Entities touched**: `auth.users` (Supabase-managed, not a Bunkai table) → `.context/business/business-data-map.md` §2 Supporting entities note.
**Feature IDs**: not available — `business-feature-map.md` not yet generated.

---

### Journey 2 — Bootstrap: Create a Workspace, Then a Project

**Business purpose**: turns a bare authenticated account into a working tenant with somewhere to put test artifacts — the mandatory first-run path with no shortcut.

```
Browser                          /api/v1/workspaces              Postgres
  |-- GET /projects (0 memberships) ---->|
  |<-- redirect /onboarding --------------|
  |-- POST /api/v1/workspaces {name, slug} ------------------------------------>|
  |                                       |-- bootstrap_workspace: create + seed creator as owner (BR-002) -->|
  |<-- 2xx, workspace created ------------|
  |-- router.replace('/projects') -------|
  |-- GET /projects (1 workspace, 0 projects) -->|
  |-- POST /api/v1/workspaces/{id}/projects {name} ----------------------------->|
  |                                       |-- validate name 3-200 chars, >=1 alphanumeric, slug unique (BR-003) -->|
  |<-- 201, lands on /projects/[slug] directly (not the index) ------------------|
```

1. `/projects` server-checks RLS-scoped `workspaces`; zero memberships redirects to `/onboarding` (`business-data-map.md` §3.1 step 4, `app/(app)/projects/page.tsx:38-39`).
2. `/onboarding` itself redirects away to `/projects` if the user already holds ≥1 membership — the inverse gate, preventing a second workspace via this same form.
3. `POST /api/v1/workspaces` creates the row and seeds the creator as `owner` — structural, not a choice (BR-002).
4. `POST /api/v1/workspaces/{id}/projects` validates name length/alphanumeric-content and workspace-unique, non-reserved slug (BR-003) — success lands the user directly inside the new Project's detail page, an explicit fix referenced by code comment as BK-266 (`functional-specs.md` FR-003).

**Endpoints involved**: `POST /api/v1/workspaces`, `POST /api/v1/workspaces/{id}/projects`.
**Entities touched**: Workspace, Workspace Member, Project — `.context/business/business-data-map.md` §2 Core entities.
**Feature IDs**: not available.

---

### Journey 3 — Invite a Teammate, Then Accept the Invite

**Business purpose**: grows a workspace's roster without ever letting an Admin grant more power than they themselves hold, and without silently escalating whatever role the invite named.

```
Admin/Owner                 /api/v1/workspaces/{id}/invites        Prospective teammate         /api/v1/invites/accept
  |-- POST {email, role: viewer|member|admin} -------------->|
  |                                    |-- role-gate: caller admin/owner? -->|
  |<-- 201, invite (hashed token, 7-day expiry) --------------|
  |                                                                                              
                                          [invite link emailed / shared out-of-band]
                                                                    |
                                                                    |-- GET /invites/accept?token=... -->
                                                                    |   (unauthenticated) ------------>|
                                                                    |<-- redirect /login?next=/invites/accept?token=... --|
                                                                    |-- sign in -------------------------------------------|
                                                                    |-- POST /api/v1/invites/accept {token} -------------->|
                                                                    |<-- 2xx, role granted (exactly as specified) ----------|
```

1. An Admin/Owner (role-gated: `app/api/v1/workspaces/[id]/invites/route.ts:52` requires `['admin', 'owner']`) sends an invite naming an email and a role — `owner` is structurally excluded from the invitable role enum, so a co-owner can never be created via this path (`0010_workspace_invites.sql:18`).
2. The invite is stored hashed with a 7-day expiry (`workspace_invites`, `access_token_secrets`-style split pattern — `domain-glossary.md` §1.12).
3. An unauthenticated visitor's accept-link round-trips through `/login?next=...`, preserving the exact URL so a fresh sign-in lands back on the identical accept page.
4. `POST /api/v1/invites/accept {token}` grants exactly the role the inviter specified — never silently escalated or downgraded (`business-data-map.md` §3.5).

**Endpoints involved**: `POST /api/v1/workspaces/{id}/invites`, `POST /api/v1/invites/accept` (public route — no session required to load the accept page, though acceptance itself needs one).
**Entities touched**: Workspace Invite, Workspace Member.
**Feature IDs**: not available.

---

### Journey 4 — Author an ATC Anchored to an Acceptance Criterion, Then Chain It into a Test

**Business purpose**: the product's core differentiator — a QA engineer writes one reusable, traceable test case instead of a disposable script, and reuses it across as many executable flows as the suite needs.

```
Member+                    POST /api/v1/atcs              bunkai_create_atc (RPC)      POST /api/v1/tests    bunkai_create_test (RPC)
  |-- (fills title, layer, steps, assertions, AC ids) -->|
  |                              |-- Zod: AtcCreateBodySchema.parse (title 3-200, steps>=1, AC ids>=1) -->|
  |                              |-- step-position check: strictly increasing from 1 -------------------->|
  |                              |-- sanitizeAtcSteps/Assertions (markdown, NOT input_data/expected) ----->|
  |                              |-- createAtc(admin client) ------------------------------------------------------------------->|
  |                              |                                     |-- membership+write role check
  |                              |                                     |-- every AC belongs to the given User Story (BR-005)
  |                              |                                     |-- Module ∈ Story's Project subtree (BR-006)
  |                              |                                     |-- generate immutable slug, insert atc+steps+assertions
  |<-- 201, ATC (version=1) ---------------------------------------------------------------------------------|
  |
  |-- (picks >=1 ATC from the WHOLE workspace library, orders the chain) ------------------------------------------------------->|
  |                                                                                              |-- chain non-empty? else chain_empty (45120)
  |                                                                                              |-- every atc_id resolves to a non-archived,
  |                                                                                              |   same-workspace ATC? else atc_not_in_workspace (45122)
  |<-- 201, Test with ordered test_steps -----------------------------------------------------------------------------------------------|
```

1. `POST /api/v1/atcs` is Bearer-`atc:write` gated (or a cookie session) — `app/api/v1/atcs/route.ts:1-49` (full file read this session).
2. The route layer's Zod schema and step-position check run BEFORE any DB round-trip (fail-fast, no wasted RPC call on malformed input) — `AtcCreateBodySchema`, `stepPositionsError()` (`lib/atcs/validation.ts`).
3. Content sanitization runs on `steps[].content`/`assertions[].content` only — `input_data`/`expected` are deliberately left untouched because they are literal test data, not rendered prose (`lib/atcs/sanitize.ts:6-8`).
4. `bunkai_create_atc` is the actual authority: it re-validates workspace write-membership, that every AC belongs to the given Story (BR-005), and that the Module sits inside that Story's own Project subtree (BR-006) — a TypeScript bypass of the Zod layer would still be caught here.
5. Separately, because Tests are workspace-scoped while ATCs are project-scoped, the Test builder's ATC picker loads the entire workspace's library, not just the current Project's (`business-data-map.md` §2 "Key relationships, narrated").
6. `bunkai_create_test` enforces chain non-emptiness and same-workspace membership for every referenced ATC, collapsing "foreign-workspace" and "nonexistent" into the identical `atc_not_in_workspace` error — a deliberate non-disclosure pattern (BR-008).

**Endpoints involved**: `POST /api/v1/atcs`, `PATCH /api/v1/atcs/{id}`, `POST /api/v1/tests`.
**Entities touched**: ATC, ATC Step, ATC Assertion, Acceptance Criterion, User Story, Module, Test, Test Step — `.context/business/business-data-map.md` §2.
**Feature IDs**: not available.

---

### Journey 5 — Execute a Manual Run & File a Bug from a Failed Step (P0)

**Business purpose**: the moment a test actually runs against a real environment and, if it fails, the defect that results carries its own QA context forever — this is the flow the entire schema's "snapshot, not live join" design exists to protect.

```
Member+                POST /api/v1/runs          bunkai_create_run (RPC)     Runner (mark steps)    POST /api/v1/bugs
  |-- {test_id, environment_id}, Idempotency-Key header ---->|
  |                          |-- write-membership check
  |                          |-- executor_mode ∈ {human,agent,ci}
  |                          |-- environment ∈ Test's own Project (BR-009)
  |                          |-- Test resolves to >=1 executable step (BR-009)
  |                          |-- (test_id, start_token) seen in last 24h? --> replay original Run (BR-010)
  |<-- 201 (new) / 200 (replay, "replayed": true) -------------|
  |
  |-- PATCH .../run-steps/{id} {status: failed} ------------------------------------------->|
  |                                                             |-- Run header still 'running'? else 409 (BR-012)
  |                                                             |-- status never re-marks to 'pending' (BR-011)
  |<-- 200, step marked -------------------------------------------------------------------|
  |
  |-- (Report-bug dialog renders — ONLY because the step is 'failed') ---------------------|
  |-- POST /api/v1/bugs {run_step_id, title, severity, ...} (NO project/module/run/atc ids sent) -->|
  |                          |-- locateRunStepBugContext(): resolve run via bunkai_get_run_expanded
  |                          |   (the SAME membership-gated read the runner already used)
  |                          |-- derive project_id/module_id/run_id/atc_id SERVER-SIDE ------------->|
  |                          |-- bunkai_create_bug: status='open' unconditionally (BR-014) --------->|
  |                          |-- bunkai_bugs_check_consistency TRIGGER re-verifies the SAME chain,
  |                          |   fires on ANY write path (RPC or a bypassing direct REST write) --->|
  |<-- 201, Bug (status=open, provenance frozen) --------------------------------------------------|
```

1. `POST /api/v1/runs` requires an `Idempotency-Key` HTTP header on top of the domain-level `start_token` — two independent replay guards at two different layers (HTTP-level double-submit vs. domain-level 24h window, BR-010).
2. `bunkai_create_run`'s validation order is itself load-bearing: membership → executor-mode validity → Environment-belongs-to-Project → executable-step count — read directly from `app/api/v1/runs/route.ts` (full header comment + `resolveRunWorkspaceId` helper this session).
3. The Runner renders every ATC/step from the Run's frozen snapshot — later edits to the source Test/ATC cannot retroactively corrupt an in-progress or completed Run (`business-data-map.md` §2 "Snapshot, not live join").
4. A "Report bug" affordance is structurally absent unless the step is `failed` — confirmed both client-side (`shouldShowReportBugButton`) and server-side (`422 run_step_not_failed` backstop).
5. `POST /api/v1/bugs`' route-level comment (`app/api/v1/bugs/route.ts:1-27`, full file read this session) is explicit: a run-linked Bug body carries ONLY `run_step_id` — `project_id`/`module_id`/`run_id`/`atc_id` are never accepted from the client, derived instead from a membership-gated re-read of the Run (`locateRunStepBugContext`), then re-verified a second, independent time by the `bunkai_bugs_check_consistency` trigger, which fires on every write path regardless of whether it went through the RPC.
6. A Bug is always created `status='open'` — there is no "file directly as resolved" path (BR-014).

**Endpoints involved**: `POST /api/v1/runs`, `PATCH /api/v1/runs/{id}/steps/{stepId}/mark`, `POST /api/v1/runs/{id}/finish`, `POST /api/v1/runs/{id}/abort`, `POST /api/v1/bugs`.
**Entities touched**: Run, Run ATC, Run Step, Bug, Project Environment.
**Feature IDs**: not available.

---

### Journey 6 — Transition & Assign a Bug

**Business purpose**: keeps a filed defect moving through exactly one governed lifecycle, and keeps it always in the hands of someone who can actually act on it.

```
Member+          POST /api/v1/bugs/{id}/status     bunkai_transition_bug_status (RPC)   bugs_check_consistency (trigger)
  |-- {status: 'in_progress'} ---------------------->|
  |                              |-- rank(new) = rank(old)+1 ? ---------------------------->|
  |                              |   (identical rank check re-run as a trigger backstop
  |                              |    on ANY write path — RPC or direct)
  |<-- 200, updated status ------|

Admin/Member       POST /api/v1/bugs/{id}/assign
  |-- {assignee_user_id} --------------------------->|
  |                              |-- target holds an ACTIVE workspace_members row here? -->|
  |                              |-- target role != 'viewer'? (BR-016) -------------------->|
  |<-- 200, updated assignee -----|
```

1. `open(1) → in_progress(2) → resolved(3) → closed(4)` — exactly one rank per call; a skip (e.g. `open → resolved`) is `422 status_transition_skipped` (`45310`), any backward or same-status resubmit is `422 status_transition_backward` (`45311`) — the error message names the actual required next stage (BR-015, fully confirmed at the enforcement-code level this session's SRS phase).
2. The RPC and the `bunkai_bugs_check_consistency` trigger run the *identical* CASE-based rank comparison — a direct table UPDATE bypassing the RPC cannot diverge from the RPC's own behavior (`0054_bug_assignment_status.sql:140-156`).
3. Assignment independently requires the target hold an active membership in the Bug's own workspace and NOT be a `viewer` — a Viewer cannot act on a Bug, so assigning one is structurally rejected (`45313`, BR-016).

**Endpoints involved**: `POST /api/v1/bugs/{id}/status`, `POST /api/v1/bugs/{id}/assign`.
**Entities touched**: Bug, Workspace Member.
**Feature IDs**: not available.

---

### Journey 7 — Issue a Personal Access Token for a Machine Caller (AI Agent / CI)

**Business purpose**: this is the flow that makes "an AI agent is a first-class peer of a human Member" a real, testable claim rather than marketing copy — `runs.executor_mode` exists specifically to record whether a human, an agent, or a CI job drove a given execution.

```
Admin/Owner (cookie session)          POST /api/v1/tokens              Postgres (access_tokens)
  |-- {workspace_id, scopes: ['run:execute','atc:write']} -->|
  |                                       |-- caller admin/owner IN THIS workspace? --------->|
  |                                       |-- workspace:admin requested? extra role-gate ----->|
  |                                       |-- generate bk_pat_<prefix>.<secret>, store
  |                                       |   SHA-256(secret) + prefix only ------------------>|
  |<-- 201 { token } (shown exactly once, never retrievable again) --------------------------|
  |
                                                          AI Agent / CI runner
                                                            |-- Authorization: Bearer bk_pat_<prefix>.<secret>
                                                            |-- POST /api/v1/runs {test_id, environment_id, executor_mode: 'agent'}
                                                            |-------------------------------------------------->|
                                                            |    resolveIdentity(): Bearer branch, prefix lookup
                                                            |    then constant-time secret hash compare
                                                            |<-- 201, Run created (executor_mode='agent') -------|
```

1. Token issuance is role-gated to `admin`/`owner` of the SPECIFIC target workspace named in the request — there is no global-admin PAT (ADR-0005 per inline comment, `lib/api/pat.ts`).
2. `workspace:admin` scope specifically cannot be obtained through the headless bootstrap path (`signin`/`signup`'s auto-issued token) — only through this explicit, session-authenticated call (`assertNoGlobalAdminScope`, `lib/api/pat.ts:29-35`).
3. The server never stores the recoverable secret — only `SHA-256(secret)` plus a 12-char prefix for O(1) lookup before a constant-time compare (`0008_access_tokens.sql:1-11`).
4. Once minted, the agent authenticates identically to how a human Member's own session would for every capability it holds — the `impersonatingClient()` JWT-minting path (`principal.ts:110-123`) is what makes RLS apply the same way regardless of caller species.

**Endpoints involved**: `POST /api/v1/tokens`, `GET /api/v1/tokens`, `DELETE /api/v1/tokens/{id}`.
**Entities touched**: Access Token (PAT), Workspace Member.
**Feature IDs**: not available.

---

## 4. Architecture Behind the API

```
+----------------+     +---------------------+     +----------------------+     +------------------------+     +---------------------------------+
| Browser / Agent | --> | Edge: middleware.ts  | --> | Route Handlers        | --> | lib/<domain>/ services   | --> | Postgres (Supabase-managed)      |
| (cookie or       |     | - session refresh    |     | app/api/v1/**/route.ts|     | - validation.ts (Zod)    |     | - RLS on every table              |
|  Bearer PAT)      |     |   on EVERY request    |     | - withApiHandler       |     | - errors.ts (SQLSTATE     |     | - SECURITY DEFINER RPCs           |
|                    |     | - redirects            |     |   gateway (auth,        |     |   -> ApiError mapping)    |     |   (bunkai_create_*, bunkai_       |
|                    |     |   PROTECTED_PREFIXES    |     |   capability check,     |     | - *-view.ts (response     |     |   transition_*, bunkai_assign_*) |
|                    |     |   to /login when         |     |   error envelope,       |     |   shaping)                 |     | - BEFORE-trigger backstops        |
|                    |     |   unauthenticated          |     |   x-request-id)          |     |                             |     |   (bugs_check_consistency)        |
+----------------+     +---------------------+     +----------------------+     +------------------------+     +---------------------------------+
                                                                                          |                                              |
                                                                                          v                                              v
                                                                                 +------------------+                         +------------------------+
                                                                                 | Supabase Auth      |                         | Supabase Realtime        |
                                                                                 | (GoTrue) — password,|                         | (WebSocket: runs,         |
                                                                                 | magic-link, OAuth,  |                         | notifications)            |
                                                                                 | OTP                  |                         +------------------------+
                                                                                 +------------------+
                                                                                          |
                                                                                          v
                                                                                 +------------------+
                                                                                 | Jira (Atlassian)   |
                                                                                 | one-way JQL import |
                                                                                 | (lib/jira/, async  |
                                                                                 | Vercel after())    |
                                                                                 +------------------+
```

| Component | Role | Persistence / Integrations touched | Why it matters for QA |
|---|---|---|---|
| `middleware.ts` | Refreshes the Supabase session cookie on every request; redirects unauthenticated visits to a `PROTECTED_PREFIXES` route to `/login?next=...` | Supabase Auth (GoTrue) | If this file's `getUser()`-before-any-logic ordering regresses, sessions silently stop refreshing — the file's own inline comment warns against reordering it (`middleware.ts:44-45`); a good target for a dedicated regression test. |
| `lib/api/handler.ts` (`withApiHandler`) | Single gateway for all 64 routes (corrected 2026-08-13, see §7): resolves identity unless `auth:'public'`, enforces `requires` capability scopes, maps every thrown error to one JSON envelope, injects `x-request-id`, structured-logs every request | none directly — orchestrates `principal.ts` + `error-envelope.ts` | A bug here is system-wide, not per-route — the highest-leverage single file to smoke-test after any auth-related change. |
| `lib/api/principal.ts` (`resolveIdentity`) | Collapses cookie-session and Bearer-PAT auth into one `Principal` shape so no handler branches on auth method | Supabase Auth (cookie), `access_tokens` table + JWT minting (PAT) | The whole premise of "cookie/PAT parity" (ADR-0001) lives here — a regression is a security-relevant parity bug, not a cosmetic one (`architecture.md` §11). |
| `lib/<domain>/validation.ts` + `errors.ts` (per domain: `atcs`, `bugs`, `runs`, `tests`, `milestones`, `workspaces`, …) | Fail-fast Zod validation before any DB round-trip, then SQLSTATE→`ApiErrorCode` mapping on the way back out | none directly | Each `45xxx`/`42501`/`P0002` row in `functional-specs.md`'s Edge Cases tables is a directly testable negative-path scenario with a frozen error-code contract. |
| `supabase/migrations/*.sql` (69 files) | Schema DDL + `SECURITY DEFINER` RPC functions + RLS policies — the actual, enforced business-rule authority | Postgres itself | This is where the REAL rules live — a TypeScript-only test suite that never exercises the RPC/trigger layer is testing the shell, not the rulebook. |
| `lib/api/idempotency.ts` + Run `start_token` | `Idempotency-Key` HTTP header replay guard (any POST) plus a separate domain-level 24h `(test_id, start_token)` window specific to Run start | `idempotency_keys` table | Two independent double-submit guards at two layers — a QA suite should test both, not assume one covers the other. |
| `lib/jira/` (`client.ts`, `import-runner.ts`, `adf-to-markdown.ts`, `extract-acceptance-criteria.ts`) | One-way, async JQL-driven Story import, run via Vercel's `after()` background execution | Jira REST API (outbound only) | Confirmed this session: no Jira SDK dependency in `package.json` — `lib/jira/client.ts` is a hand-written HTTP client, not a wrapped library; failure surfaces as a failed `import_jobs` row, never an app-boot error. |

---

## 5. External Integrations

| Service | Trigger | Direction | Failure mode (user-visible) | Journeys affected |
|---|---|---|---|---|
| Supabase Auth (GoTrue) | Every `/login` step, OAuth callback, OTP verify | Outbound sync (from Bunkai's Next.js server) | `401`/`429` surfaced inline in the login form; a GoTrue outage would make Journey 1 fail entirely | Journey 1 (Sign-Up & Sign-In), indirectly every other journey (all require a session first) |
| Supabase Postgres (RLS + RPCs) | Every authenticated read/write | Outbound sync | RPC SQLSTATE → `ApiError` mapping (see `functional-specs.md` Edge Cases tables per FR); a Postgres outage is a hard 500/timeout across the whole API | All 7 journeys |
| Supabase Realtime | `runs`, `notifications` table changes (confirmed realtime-enabled; `bugs`/`activity_log` unconfirmed) | Outbound async (WebSocket push) | Silent — a dropped WebSocket just means the Runner/notification UI stops live-updating until the next poll/refresh; does not block the underlying write | Journey 5 (Run execution — live step verdicts), notification delivery for Journeys 5-6 |
| Jira (Atlassian) | `POST /api/v1/imports {project_id, jql}` | Outbound async (one-way pull, Vercel `after()` background job) | Missing/invalid credentials surface as a failed `import_jobs` row (`jira_unauthorized`), never an app-boot failure; never writes back to Jira | Alternative entry point into Journey 2's Story-authoring step (optional — a Story can also be hand-authored) |
| Vercel | Every request (hosting) | N/A (platform, not a business integration) | A Vercel-level outage/cold-start affects everything uniformly; not a business-logic dependency | All 7 journeys |
| n8n | Declared (`N8N_API_URL`/`N8N_API_KEY` in `.env.example`) | **Unconfirmed** — no runtime call site found in `app/`/`lib/` this session | N/A — not confirmed to be a live application integration at all | None confirmed |
| Resend | Declared (`RESEND_API_KEY` in `.env.example`) | **Unconfirmed** — no `resend` SDK import found in `app/`/`lib/`; email delivery may be delegated entirely to GoTrue's own SMTP configuration outside this codebase | N/A — not confirmed to be a live application integration at all | Plausibly Journey 1 (signup OTP) and Journey 3 (invite email), but not confirmable from source |

---

## 6. Cross-References

- **Entities exposed by this API** → `.context/business/business-data-map.md` §2 Entity Map (31 tables) — every entity named in §3's journeys above (Workspace, Project, Module, User Story, Acceptance Criterion, ATC, Test, Run, Bug, Milestone, Access Token, Workspace Invite) has its full column/constraint detail there, not repeated here.
- **State machines governing these endpoints** (Bug status, Run header status, Run ATC/Step status, User Story "ready to test" gate) → `.context/business/business-data-map.md` §4 and `.context/SRS/functional-specs.md` §"State Machines" (FR-009's Bug diagram is the one fully enforcement-confirmed state machine in the system).
- **Feature catalog / CRUD matrix this API backs** → `.context/business/business-feature-map.md` — **not generated yet**; every "Feature IDs: not available" note in §3 above resolves once that command runs.
- **Full endpoint inventory, exact request/response shapes** → not a committed static file; generated from `lib/openapi/registry.ts` + per-route `route.openapi.ts` siblings, served at runtime via `app/api/openapi/route.ts`, rendered at `app/api/docs/page.tsx` (Scalar UI). This QA repo's `bun run api:sync` has nothing to consume until it is pointed at that runtime endpoint (`architecture.md` §7).
- **TypeScript types for request/response shapes** → `api/schemas/` via `bun run api:sync`, once the above is wired.
- **Auth/architecture narrative this section summarizes** → `.context/SRS/architecture.md` §2-3 (C4 diagrams), §8 (Security Architecture) — the canonical source for anything beyond the business-first framing given here.

---

## 7. Discovery Gaps

- **`business-feature-map.md` does not exist yet** (soft gate, per command doctrine) — journey selection in §3 relied on code scan (route tree + this session's already-derived `business-data-map.md`/`functional-specs.md`/`architecture.md`) alone, with no feature-map cross-reference available. Every journey's "Feature IDs" line is consequently "not available" rather than a real `FEAT-NNN` pointer — re-run this document (or just patch §3/§6) once `/business-feature-map` has been run.
- **No committed OpenAPI spec file** — confirmed absent at the repo root and under `app/api/` (`architecture.md` §7). The 7 journeys' "Endpoints involved" lists were built by reading `app/api/v1/**/route.ts` file paths and, for 4 of the 7 journeys' primary write endpoints, the actual route handler source (`atcs/route.ts`, `runs/route.ts`, `bugs/route.ts`, `imports/route.ts` — all read in full or near-full this session). The remaining route files (health, tokens, invites, milestones, workspaces, modules, environments, notifications, coverage/traceability reporting, etc.) were confirmed to exist via `find` but their handler bodies were not individually opened this session — their presence in §3/§5 above is inferred from filename + the `functional-specs.md`/`architecture.md`/`backend.md` citations already carried from this same session's earlier discovery phases, not independently re-read.
- ~~n8n / Resend runtime status — both declared in `.env.example`, neither has a confirmed runtime call site in `app/`/`lib/` across this session or the prior architecture/backend discovery passes (`architecture.md` §7, `backend.md` §Environment Variables). Treat both as **not confirmed live integrations** — see §5 table.~~ **RESOLVED 2026-08-13**: confirmed dead/vestigial, neither is a live runtime integration. `N8N_API_URL`/`N8N_API_KEY` (`.env.example:68-70`) back only the `n8n` MCP server declared in `CLAUDE.md:217` (`[AUTOMATION_FLOWS_TOOL]`) — a repo-tooling MCP config, never referenced by any `app/`/`lib/`/`components/` source file (exhaustive case-insensitive repo-wide grep for `n8n`, `N8N_` found zero application call sites; all hits are `.agents/skills/n8n-*` community skill docs and config/README files). Resend: `RESEND_API_KEY` (`.env.example:76-80`) backs the `/resend-cli` community CLI skill only — `resend` is **not even an npm dependency** (absent from `package.json`), and the two in-app symbols whose names contain "resend" are false positives: `POST /api/v1/auth/resend` (`app/api/v1/auth/resend/route.ts:41`) calls `supabase.auth.resend({ type: 'signup', email })` — Supabase's own OTP resend, not the Resend service — and the local `resend()` handler in `app/(app)/workspaces/[id]/members/members-client.tsx:85-96` just POSTs to the workspace-invite-rotation endpoint and copies the new accept URL to the clipboard; it sends no email itself.
- ~~**ATC anchoring-moat (BR-004) RPC-body enforcement** — the Zod `.min(1)` gate on `acceptance_criterion_ids` at the API edge is confirmed (`lib/atcs/validation.ts:41`); whether `bunkai_create_atc`'s own RPC body independently re-enforces "≥1 AC" was not located in the portion of `0004_atcs.sql` read across any session to date (carried from `functional-specs.md` Discovery Gaps).~~ **RESOLVED 2026-08-13**: confirmed — `bunkai_create_atc` guards `if coalesce(array_length(p_ac_ids, 1), 0) = 0 then raise exception 'ac_outside_user_story' using errcode = '45020'; end if;` (`0021_atc_create_update.sql:158-160`), repeated in `bunkai_update_atc` (`0021_atc_create_update.sql:295-297`). Defense in depth confirmed.
- ~~**Run header status full transition graph** — the terminal-state lockout (abort/finish/mark-step all reject once `passed`/`failed`/`aborted`) is confirmed (Journey 5); whether `bunkai_finish_run` is the ONLY path that can set `passed`/`failed` (i.e., whether a direct table UPDATE could bypass it) was not confirmed — carried from `functional-specs.md`.~~ **RESOLVED 2026-08-13**: confirmed `bunkai_finish_run`/`bunkai_abort_run` (live bodies in `0067_run_finish_abort_via.sql`) are the only paths. `public.runs` RLS has only `select`/`insert` policies (`0031_runs.sql:100-114`), no `update` policy for `authenticated` — a raw client UPDATE is blocked entirely by RLS default-deny.
- ~~Invite email-match enforcement — whether `POST /api/v1/invites/accept` independently confirms the accepting session's email matches the invite's target email, vs. any authenticated user being able to redeem any invite link they hold the token for, was not confirmed this session (Journey 3) — carried from `business-data-map.md` §3.5.~~ **RESOLVED 2026-08-13**: confirmed — it DOES independently enforce email-match, and does not merely trust the token. `app/api/v1/invites/accept/route.ts:28-31` resolves the caller's own `auth.users` email via `admin.auth.admin.getUserById(principal.userId)` (works for both cookie and PAT callers), then line 77 does a case-insensitive compare `invite.email.toLowerCase() !== callerEmail.toLowerCase()` and throws `forbidden` ("This invite was sent to a different email address.") on mismatch — a token alone is not sufficient to redeem an invite addressed to someone else.
- **PAT `executor_mode` default-precedence decision** — `app/api/v1/runs/route.ts` references an internal "PO-pending §4" decision doc (per inline code comment) that is not present in this repo; the exact default/precedence rule when a PAT caller omits `executor_mode` on Run start (Journey 5) was not independently confirmed beyond "cookie session → `human` implicitly" — carried from `functional-specs.md`.
- **General-purpose API rate limiting** — `rate_limited` (429) is a declared `ApiErrorCode` thrown by 5 auth routes via GoTrue's own built-in limits (Journey 1); no general-purpose limiter (Upstash, in-memory token bucket, etc.) covers the rest of `/api/v1/*`, including every write endpoint named in Journeys 2-7 — carried from `architecture.md` §9.
- **Coverage & Traceability reporting endpoints** (`GET /api/v1/projects/{id}/coverage`, `.../traceability`) are read-only with no state-changing business rule and were deliberately NOT given their own journey in §3 (they don't fit the "critical business journey = a call chain that changes state" framing this document uses) — their exact query/filter parameter shape was not read this session, carried from `functional-specs.md`.
- ~~**RLS policy enumeration beyond the four spot-checked domains** (`atcs`, `access_tokens`, `workspace_members`, `runs`/`bugs` index/constraint layer) — the remaining ~27 tables' individual RLS policies were not re-read this session; §2's "RLS is the final backstop" claim relies on the consistent, already-confirmed multi-tenancy pattern rather than a table-by-table re-verification.~~ **RESOLVED 2026-08-13**: full sweep complete across all 31 tables (see `business-data-map.md` §7 for the citation detail). All 31 have RLS enabled, no permissive `using(true)` policy or anon/public grant found, and the tenant-isolation pattern (workspace-scoped, user-scoped, or RPC-only zero-policy for the 3 secrets tables) is applied with zero deviation. §2's "RLS is the final backstop" claim now rests on an exhaustive table-by-table verification, not an inferred pattern.
- **Monorepo shards**: none — confirmed single Next.js 15 deployment, no separate backend/frontend repo (`architecture.md` §1, `project-config.md` §Repositories via `git remote -v`).
- **Webhooks configured in external dashboards but not discoverable from code**: none found. No `app/api/**/webhook*` route exists (`business-data-map.md` §5.3) — if a Jira-side or Vercel-side webhook exists purely in an external dashboard, it would be invisible to this code-only discovery method by definition.

---

*This document narrates the business-level API story only — it is not an endpoint catalog, does not restate TypeScript types, and does not enumerate every route's request/response shape. See §6 Cross-References for where each of those lives. Re-run this discovery after any change to `middleware.ts`'s protected-prefix list, `lib/api/principal.ts`'s capability model, or any new `SECURITY DEFINER` RPC that introduces a new `45xxx` SQLSTATE block — those are the highest-signal triggers for staleness.*
