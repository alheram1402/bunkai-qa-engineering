> Generated: 2026-08-13
> Project: Bunkai TMS
> Status: COMPLETED (2026-08-13)

# Adapt Framework — Implementation Plan

## Results (Phase 9 close-out)

**All 11 Phase 8 validation-gate steps passed** (`repo:check` exit 0; 5 `@critical` tests pass live against staging; both `api-setup`/`ui-setup` Playwright projects pass; `api:login staging` populates `.auth/tokens.env`).

**Files created**: `api/schemas/atcs.types.ts`, `tests/components/api/AtcsApi.ts`, `tests/integration/atcs/smoke.test.ts`, `api/.openapi-config.json`.

**Files substantially rewritten**: `api/openapi-types.ts` (real 316KB live-synced types), `api/schemas/auth.types.ts`, `api/schemas/index.ts`, `config/variables.ts`, `tests/components/api/AuthApi.ts`, `tests/components/ui/LoginPage.ts`, `tests/components/ApiFixture.ts`, `tests/components/UiFixture.ts`, `scripts/api-login.ts`, `tests/setup/{api-auth,ui-auth}.setup.ts`, `tests/data/{DataFactory,types}.ts`, `tests/integration/auth/user-session.test.ts`, `kata-manifest.json`, `.mcp.json`, `opencode.jsonc`, `allurerc.mjs`, `.context/infrastructure/backend.md` (stray `{{ VAR }}`-style fix).

**Files deleted**: `tests/components/api/ExampleApi.ts`, `tests/components/ui/ExamplePage.ts`, `tests/components/steps/ExampleSteps.ts`, `api/schemas/example.types.ts`, `tests/e2e/module-example/`, `tests/integration/module-example/`, `tests/data/fixtures/example.json`, `tests/e2e/dashboard/dashboard.test.ts`.

**Gaps remaining** (see CLAUDE.md §Framework Adaptation for the durable record):
- `DBHUB_*` connection string still owed by the user's dev team — DB MCP servers deferred.
- `LOCAL_USER_*` still empty — `local` env scaffolded but unverified.
- `gh-pages` not enabled on this repo.
- `bun run api:sync`'s type-gen step breaks in any path containing `#` (this repo's parent dir does) — worked around manually this run, unresolved as a framework defect. Candidate for a `/framework-development` fix.
- `/sync-ai-memory` recommended but not run this session.

**GitHub Secrets the user still owes**: `LOCAL_USER_EMAIL`, `LOCAL_USER_PASSWORD` (push once `.env` has them). Already pushed: `STAGING_USER_EMAIL`, `STAGING_USER_PASSWORD`, `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `AUTO_SYNC`.

## 1. Project Summary

- **Product**: Bunkai — internal TMS (Test Management System) for the UPEX Galaxy QA org. Next.js 15 + React 19 + Supabase (Postgres + Auth + Realtime), single-package monorepo (no separate frontend/backend split).
- **Target repo**: `../upex-bunkai-tms` (sibling dir). Read-only from this adaptation.
- **Auth system**: HYBRID — Supabase SSR cookie session for the browser (`@supabase/ssr`), Bearer PAT (`bk_pat_<prefix>.<secret>`) for API/agentic callers. See §2.
- **Main entities**: Workspace → Project → Module → User Story → Acceptance Criterion → **ATC** (Acceptance Test Case) → Test (chain of ATCs) → Run → Bug. First entity wired this run: **ATC**.
- **OpenAPI source**: runtime-generated at `/api/openapi` (via `lib/openapi/registry.ts`), not a static file. Not previously detected because it isn't reachable unless the app is deployed/running. Plan: attempt `bun run api:sync --url https://staging-upexbunkai.vercel.app/api/openapi -t` in Phase 4; fall back to hand-written facades if unreachable (log as Discovery Gap, do not block).
- **Environments this run**: `local` + `staging` only (per user decision). `production` stays out of scope for CI options / `config/variables.ts` / `validateTestEnv.ts` this run — `project.yaml` already lists it; that 1-file/3-file drift is accepted and logged, not closed today.
- **Testing maturity**: 132 `bun test` unit/integration files, zero E2E, zero CI/CD (`.github/workflows/` doesn't exist in the *target* repo — this boilerplate's own workflows are what we're wiring here, in `bunkai-qa-engineering`).

## 2. Auth Strategy

**Classification: HYBRID** (cookie session for UI, Bearer PAT for API/agentic) — confirmed at code level, not inferred.

### Cookie session (UI path)
- `middleware.ts` (target): Supabase SSR refreshes the session cookie via `getUser()` on every request. Protected prefixes: `/home`, `/projects`, `/onboarding`, `/settings`, `/activity`. Unauthenticated → 302 to `/login?next=<original>`.
- **Login form is two-step**, real `data-testid`s (from `app/(auth)/login/email-first-form.tsx`):
  - Step 1: `login-email` input → click `login-continue`
  - Step 2 (existing+confirmed branch — **the only branch wired this run**, per user decision): `login-password` input → click `login-signin`
  - Error surface: `login-error` (`role="alert"`)
  - **Deferred, not wired this run**: `login-create` (signup branch), `login-otp`/`login-verify`/`login-resend` (OTP branch) — logged as a follow-up in §11.
- None of these testids match the boilerplate's placeholder (`login-email-input`/`login-password-input`/`login-submit-button`) — **every locator in `LoginPage.ts` is rewritten, not just the `@atc` key.**

### Bearer PAT (API/agentic path)
- Endpoint: `POST /api/v1/auth/signin` (public). Body: `{ email, password }` — field names already match `scripts/api-login.ts`'s default `buildAuthPayload()`, no change needed there.
- **Response shape is nested** — the critical mismatch vs. the boilerplate template:
  ```json
  {
    "user": { "id": "...", "email": "..." },
    "session": { "access_token": "...", "refresh_token": "...", "expires_at": 172..., "token_type": "bearer" },
    "pat": { "token": "bk_pat_<prefix>.<secret>", "id": "...", "name": "cli-signin", "scopes": ["atc:read","atc:write","run:execute"], "expires_at": null },
    "warning": "Store the PAT token now — it cannot be retrieved later."
  }
  ```
  `scripts/api-login.ts`'s `extractTokenFromResponse()` **must read `body.pat.token`**, not `body.access_token`.
- Auth header: standard `Authorization: Bearer <token>` (`lib/api/middleware/bearer.ts`, `requireBearerToken`). No custom header/API-key scheme.
- **TTL**: `pat.token.expires_at` is `null` by default (headless signin never passes `pat_expires_in_days`) — **the PAT does not expire unless explicitly issued with a TTL.** Still follow the boilerplate's per-run-mint default (simplest, safest) rather than persisting across sessions. `session.access_token`'s exact TTL was not read from live Supabase project config — logged as a Discovery Gap (§11), does not block: cookie sessions are re-minted by `ui-auth.setup.ts` every run anyway.
- **Verify endpoint**: `GET /api/v1/me` (not `/auth/me`) — works with either auth method. Response: `{ user, workspaces[], active_workspace_id, active_workspace_role, auth: { source: 'cookie'|'bearer', scopes[] } }`.
- **Human PAT issuance** (distinct from headless signin): `POST /api/v1/tokens`, cookie-session only (a PAT cannot mint another PAT — server rejects `principal.via === 'bearer'`). Not wired this run (not needed for the ATC-only first cut), noted for the "PAT issuance" follow-up entity.
- **Error envelope** (all `/api/v1/*`): `{ error: { code, message, details?, request_id? } }` — nested, not the boilerplate's flat `{error, message?}`. Facades in Phase 4 reshape to match.
- **No 2FA/MFA/captcha** on the signin path. `signup`/`confirm`/`resend` are GoTrue-rate-limited (429), not an app gate — no CI bypass needed since those routes aren't exercised this run.
- **Multi-tenant scope**: workspace binding is a PAT property (set at `POST /api/v1/tokens` time), not a header/subdomain. Headless-signin PATs carry `workspace_id: null` (global scope, works across the user's own workspaces, cannot hit `workspace:admin` routes).
- **Test user**: user confirmed a staging Member-role user with active workspace membership already exists — they will populate `.env` (`STAGING_USER_EMAIL`/`STAGING_USER_PASSWORD`) after this session. No provisioning step added to Phase 5/8.

**Token strategy decision**: per-run mint, no staleness check (§1.4 branch: TOKEN, response-body field, no refresh-endpoint wiring needed since the PAT effectively doesn't expire and the session cookie is re-minted each run).

## 3. OpenAPI Strategy

- **Source**: attempt live sync — `bun run api:sync --url https://staging-upexbunkai.vercel.app/api/openapi -t` (Phase 4.1). Per user decision.
- **If unreachable** (404, staging not deployed with that route active, network failure): fall back to hand-written facades per the command's §4.2 fallback — curl the 5 real ATC endpoints below first, then hand-write `api/schemas/atcs.types.ts` mirroring the actual JSON shapes. Log the failure + fallback explicitly in Discovery Gaps, do not silently retry indefinitely.
- **Facades to create this run**:
  | Facade | Domain | Consumed by |
  |---|---|---|
  | `api/schemas/auth.types.ts` (rewrite) | `POST /api/v1/auth/signin`, `GET /api/v1/me` | `AuthApi.ts` |
  | `api/schemas/atcs.types.ts` (new) | `POST/PATCH/duplicate/usage/search /api/v1/atcs*` | `AtcsApi.ts` |
- `api/schemas/example.types.ts` deleted (§5).
- MCP `openapi` server: **stays enabled**, pointed at `API_BASE_URL=https://staging-upexbunkai.vercel.app` / `OPENAPI_SPEC_PATH=https://staging-upexbunkai.vercel.app/api/openapi` in `.env` — schema-read-only, per doctrine (never injects `API_TOKEN`).

## 4. Identity + Variables

### 4.1 `.agents/project.yaml`
Already populated (prior commit): `project_key: BK`, `webapp_domain`, repos, `db_type: Supabase Postgres`, `issue_tracker: Jira`, `environments.{local,staging,production}`. **No changes needed** except the per-env MCP server names (§7.3) — `production` block stays as-is (already correct, just unused by code/CI this run per §1 scope decision).

**Pre-existing defect to fix alongside this phase** (independent of adaptation, but blocks a clean `repo:check` either way): `.context/infrastructure/backend.md:42` has an unresolved `{{ VAR }}`-style reference causing `bun run vars:check` to exit 1. Fix: open the file, resolve or remove the stray `{{ VAR }}` token.

### 4.2 `.env`
Populate (values supplied by user after this session, not pasted into chat):
- `TEST_ENV=staging` (default)
- `LOCAL_USER_EMAIL` / `LOCAL_USER_PASSWORD`, `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` — the confirmed existing Member-role staging user goes under `STAGING_USER_*`
- `API_BASE_URL=https://staging-upexbunkai.vercel.app`, `OPENAPI_SPEC_PATH=https://staging-upexbunkai.vercel.app/api/openapi`
- `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` — already populated (confirmed working this session via live `acli`/REST calls)
- `AUTO_SYNC` / `TMS_PROVIDER` — jira-native modality (no Xray on this instance, confirmed in `.context/PBI/README.md`)
- `DBHUB_TYPE=postgres`, `DBHUB_HOST`, `DBHUB_PORT`, `DBHUB_DATABASE`, `DBHUB_USER`, `DBHUB_PASSWORD` — per env (`LOCAL_DBHUB_*` / `STAGING_DBHUB_*` if the manifest supports env-prefixed DB vars; else single `DBHUB_*` pointed at staging) — user will supply values
- `API_TOKEN` — leave blank (legacy/unused per doctrine; the agentic token comes from `bun run api:login` → `.auth/tokens.env`, never `.env`)

### 4.3 `config/variables.ts`
- `envDataMap`: replace `dojo.upexgalaxy.com` / `localhost:3000` placeholders with real URLs for `local` and `staging` only (per scope decision):
  ```ts
  local:   { base: 'http://localhost:3000',                  api: 'http://localhost:3000/api/v1' }
  staging: { base: 'https://staging-upexbunkai.vercel.app',  api: 'https://staging-upexbunkai.vercel.app/api/v1' }
  ```
  (`production` key intentionally NOT added this run — `Environment` union type stays `'local' | 'staging'`.)
- `auth.loginEndpoint = '/api/v1/auth/signin'`, `auth.meEndpoint = '/api/v1/me'`, `auth.tokenLifetimeSeconds` — set to a conservative default (e.g. 3600) since the PAT itself doesn't expire and the session cookie is re-minted per run; document the assumption inline.

### 4.4 Env-enum reconciliation (4-way drift)
Only 2 of the 4 sources currently agree (`config/variables.ts` and `config/validateTestEnv.ts` both already `local`/`staging`-only — no `production` to strip). Confirm all 4 stay `local`/`staging` this run:
1. `config/variables.ts` — no change to the union (already 2-env)
2. `.agents/project.yaml` — leave `production` block as-is (unused, not a drift *this run* since nothing in code claims to support it)
3. `config/validateTestEnv.ts` — no change (already 2-env)
4. `.github/workflows/*.yml` — no change (already `[local, staging]`)

No 4-way drift to close this run — it was already resolved by a prior commit for the 2-env scope. Only `project.yaml`'s dormant `production` block is out of sync with the rest, which is accepted per the user's scope decision.

### 4.5 Validate
```
bun run vars:check
bun run vars:env:check
bun run test:env:check
```

## 5. Components to Create / Modify

### API layer
| File | Action | Notes |
|---|---|---|
| `tests/components/api/AuthApi.ts` | Modify | Real endpoints (`/api/v1/auth/signin`, `/api/v1/me`), nested response parsing, `@atc('BK-NNN')` |
| `tests/components/api/AtcsApi.ts` | **Create** | 5 ATCs: create, update (optimistic-lock conflict), duplicate, search, usage. No `getAtcById` — endpoint doesn't exist (§1.6 finding); read path goes through `search`/`usage` only |
| `tests/components/api/ExampleApi.ts` | Delete | — |
| `api/schemas/auth.types.ts` | Rewrite | Nested `{user,session,pat}` + `{error:{code,message,details?,request_id?}}` |
| `api/schemas/atcs.types.ts` | Create | Per §3 facade table |
| `api/schemas/example.types.ts` | Delete | — |
| `api/schemas/index.ts` | Modify | Add `atcs.types` re-export |

### UI layer
| File | Action | Notes |
|---|---|---|
| `tests/components/ui/LoginPage.ts` | Modify | Two-step form, real testids (`login-email`/`login-continue`/`login-password`/`login-signin`/`login-error`) — happy path only this run |
| `tests/components/ui/ExamplePage.ts` | Delete | — |
| `tests/components/steps/ExampleSteps.ts` | Delete | — |

### Fixtures
- `tests/components/ApiFixture.ts`: register `AtcsApi`, forward `setAuthToken`/`clearAuthToken`; remove `ExampleApi` registration.
- `tests/components/UiFixture.ts`: remove `ExamplePage` registration.
- `tests/components/TestFixture.ts`: wire `{ api }`-only fixture for `AtcsApi` (API-only entity, no UI component this run per §1.6 recommendation).

### Deleted example artifacts
```
tests/components/api/ExampleApi.ts
tests/components/ui/ExamplePage.ts
tests/components/steps/ExampleSteps.ts
api/schemas/example.types.ts
tests/e2e/module-example/
tests/integration/module-example/
tests/data/fixtures/example.json
```
Plus: remove `testIgnore: ['**/module-example/**']` from `playwright.config.ts:24`.

### Data layer
- `tests/data/DataFactory.ts`: drop `createHotel`/`createBooking`, add `createAtc()` (fields: title, description, AC-anchor array — ≥1 required, mirrors the `45020` RPC guard); keep `createUser`/`createCredentials`.
- `tests/data/types.ts`: drop `TestHotel`/`TestBooking`, add `TestAtc`; keep `TestUser`/`TestCredentials`/`ApiState`.

### Setups
- `tests/setup/api-auth.setup.ts`: parse nested response, extract `body.pat.token`.
- `tests/setup/ui-auth.setup.ts`: remove the fictional "NextAuth sign-in" comment (target uses Supabase Auth/GoTrue, not NextAuth); adapt to the two-step form flow (happy path only).
- `scripts/api-login.ts`: `extractTokenFromResponse()` → read `body.pat.token` (the one required code change in this script; `buildAuthPayload()` needs no change — field names already match).

### First smoke test
`tests/integration/atcs/smoke.test.ts` (API-only, `@critical` tag) — create an ATC anchored to a real AC, assert 201 + shape; assert the `45020` rejection when AC-anchor array is empty.

### Reference specs to reconsider
- `tests/e2e/dashboard/dashboard.test.ts` (`UPEX-200`, hits `/api/auth/me`) → endpoint doesn't exist on target (`/api/v1/me` does) — **delete**, superseded by the new `AuthApi`/`AtcsApi` smoke coverage.
- `tests/integration/auth/user-session.test.ts` (`UPEX-100`) → rewrite to target `/api/v1/auth/signin` + `/api/v1/me`, replace `@atc` key with `BK-NNN`.

## 6. Env Vars + Secrets

**`.env` keys the user populates** (see §4.2 — not pasted into chat):
`STAGING_USER_EMAIL`, `STAGING_USER_PASSWORD`, `LOCAL_USER_EMAIL`, `LOCAL_USER_PASSWORD`, `DBHUB_*` (staging connection info).

**GitHub repo Secrets** (external, `gh secret set` — user opted for automatic push once `.env` has real values, see §7.2):
`STAGING_USER_EMAIL`, `STAGING_USER_PASSWORD`, `LOCAL_USER_EMAIL`, `LOCAL_USER_PASSWORD`, `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` (TMS is jira-native, no Xray secrets needed). No `SLACK_WEBHOOK_URL` unless the user adds one later.

## 7. CI + MCP + Reporting

### 7.1 KATA manifest
```
bun run kata:manifest
bun run kata:manifest:check
```
Removes `ExampleApi`/`ExamplePage`/`PROJ-101/102/103` entries; adds `AtcsApi` + its 5 `@atc('BK-2xx')` IDs (exact numbers assigned during Phase 6, checked against `kata-manifest.json` per Rule #12 before use).

### 7.2 GitHub workflows
`.github/workflows/{regression,sanity,smoke,build}.yml` — env options already `[local, staging]` (no change, §4.4). Secret names reconciled to `<ENV>_USER_EMAIL`/`<ENV>_USER_PASSWORD` scheme. Smoke filter stays `@critical`.

**gh-pages / GitHub Pages status: unconfirmed** (user did not mark it as already enabled). Phase 7 will check `gh api repos/{owner}/{repo}/pages` and, if not enabled, run the maneuver in `regression-testing/references/github-pages-setup.md` — flagged here so it isn't a surprise mid-phase.

**CI secrets**: push automatically via `gh secret set <NAME>` once `.env` has real values (user opted in) — `gh auth status` will be checked first; any `.env` key still blank at that point is surfaced instead of silently skipped.

### 7.3 MCP registry — dual-file, per-env servers (user opted for full per-env split)
**Amended 2026-08-13**: `DBHUB_*` connection info is not available this run (dev needs to supply the staging DB connection string — see §11). DB MCP servers are **deferred**, not created with empty vars (would trigger CLAUDE.md Rule #10's hard session stop on first use). Only the OpenAPI pair is created this run:
- `local-openapi`, `staging-openapi` (both can point at the same live staging spec URL if no local OpenAPI endpoint is run separately — local dev would need `next dev` running for a true local spec; document this nuance rather than assume)
- `local-dbhub`, `staging-dbhub` — **not created this run**. `project.yaml`'s `environments.*.db_mcp` keeps referencing these names (harmless — unused until the servers exist), and `dbhub.toml` keeps only the generic `primary` source with no values. Revisit once the dev provides the connection string.

`project.yaml`'s `environments.<env>.api_mcp` already reference `local-openapi`/`staging-openapi` — no `project.yaml` change needed, only registering those two servers.

Syntax reminder: `.mcp.json` uses `${VAR}`, `opencode.jsonc` uses `{env:VAR}` — every var referenced in a new server entry must exist in `.env` with the exact name used, in both files, or the missing/empty var triggers CLAUDE.md Rule #10 (hard session stop, not silent 401).

Only Claude Code confirmed in use this run (OpenCode/Cursor/Codex not marked) — dual-file sync is still maintained as standard practice (cheap, prevents future drift), not because OpenCode is active today.

### 7.4 `dbhub.toml`
Add `[[sources]]` blocks for `local` and `staging` (currently only `primary`) once `DBHUB_*` values are supplied.

### 7.5 `allurerc.mjs`
`name: 'Agentic QA Boilerplate'` → `name: 'Bunkai QA Reports'` (confirmed).

### 7.6 `playwright.config.ts`
Remove the `module-example` `testIgnore` line (§5). Smoke grep stays `@critical`. No baseURL/env-mapping change beyond what §4.3 already covers.

## 8. Implementation Phases

Maps directly to the command's Phase 3-8 numbering:
- **Phase 3**: `.env` population (user-supplied values) + `config/variables.ts` + fix the stray `{{ VAR }}` in `backend.md:42` + validate (`vars:check`/`vars:env:check`/`test:env:check`).
- **Phase 4**: `bun run api:sync --url https://staging-upexbunkai.vercel.app/api/openapi -t` → on success, generate `atcs.types.ts`/`auth.types.ts` from real types; on failure, hand-write both from the confirmed route inventory (§3).
- **Phase 5**: `AuthApi.ts`, `LoginPage.ts` (happy-path only), both setups, `scripts/api-login.ts` token-extraction fix → verify via the 4-command chain in the command's §5.3 (Playwright api-setup, ui-setup, `api:login`, curl smoke).
- **Phase 6**: `AtcsApi.ts`, fixture wiring, delete all example artifacts, `DataFactory`/`types.ts` domain-data swap, first `@critical` smoke test, reconsider the 2 reference specs.
- **Phase 7**: kata-manifest regen, CI workflow secret-name reconciliation + gh-pages check, MCP 4 per-env servers (dual-file), `dbhub.toml`, `allurerc.mjs` rename.
- **Phase 8**: full validation gate, in order, per the command's 11-step list — stop on first failure, report diagnostics, no auto-fix without approval.

## 9. AI Guidelines

- ATC atomicity: `AtcsApi`'s 5 methods never call each other; any future chained flow (e.g. "create ATC → duplicate it → assert both exist") goes in a Steps module, not inline.
- Inline locators in `LoginPage.ts`; extract to a `private readonly` accessor only if a locator is reused 2+ times.
- Max 2 positional params — `AtcsApi.updateAtc()`'s version+id+payload collapses to one object param.
- All imports via alias (`@api/AtcsApi`, `@schemas/atcs.types`, etc.) — no relative imports.
- `AtcsApi` is API-only → `{ api }` fixture, no `{ test }`/browser overhead.
- Golden facade rule: `AtcsApi.ts` imports only from `@schemas/atcs.types`, never `@openapi` directly.
- Tuple returns: `search`/`usage` (GET) → `[response, body]`; `create`/`update`/`duplicate` → `[response, body, sentPayload]`.
- `ApiFixture` auth propagation: `AtcsApi` registration must forward `setAuthToken`/`clearAuthToken`, or every call silently 401s post-Phase-5.

## 10. Questions Answered

1. **OpenAPI strategy**: attempt live sync against staging `/api/openapi`; fall back to hand-written facades on failure.
2. **Login UI scope**: happy path only (existing+confirmed branch); OTP/signup branches deferred.
3. **Environment scope**: local + staging only; production stays unadapted in code/CI this run.
4. **Test user**: already exists in staging; user populates `.env` directly, no provisioning step added.
5. **DB MCP credentials**: user has staging Supabase connection info, will populate `.env`; dbhub MCP stays enabled.
6. **Per-env MCP servers**: create the full 4-server split (`local-dbhub`, `staging-dbhub`, `local-openapi`, `staging-openapi`) in both `.mcp.json` and `opencode.jsonc`.
7. **Allure report name**: `Bunkai QA Reports`.
8. **CI secrets**: push automatically via `gh secret set` once `.env` has real values (not the manual copy-paste block).
9. **gh-pages**: not confirmed enabled — Phase 7 checks and runs the setup maneuver if missing.
10. **OpenCode/other agents**: not in use currently; dual-file MCP sync maintained anyway as standard practice.

## 11. Discovery Gaps

- **`DBHUB_*` connection string not available this run** — user must request it from the dev team; not a blocker for Phases 3-8 (DB MCP wiring simply deferred, see §7.3 amendment). Revisit `dbhub.toml` + the `local-dbhub`/`staging-dbhub` MCP servers once supplied.
- **`local` environment has no real credentials** (`LOCAL_USER_EMAIL`/`PASSWORD` intentionally left empty — user confirmed local isn't needed right now). `local` stays scaffolded in `config/variables.ts`/`project.yaml` but `ui-auth.setup.ts`/`api-auth.setup.ts` will only be verified against `staging` in Phase 5/8. Do not treat a `local`-targeted test run as a real validation signal until `LOCAL_USER_*` exists.

- **`session.access_token` TTL** not read from live Supabase project config — assumed short-lived/standard, does not block since cookie sessions are re-minted every test run regardless.
- **OpenAPI live-sync outcome unknown until Phase 4 actually runs** — the `/api/openapi` route's existence is confirmed in source, but whether it's reachable on the deployed staging URL (vs. only in a running local dev server) was not verified this session. Phase 4 will resolve this definitively; a failure here is expected-possible, not a plan defect.
- **`DBHUB_*` env-prefixing** (`LOCAL_DBHUB_*` vs. a single shared `DBHUB_*`) — whether `config/validateTestEnv.ts` / the vars manifest actually supports per-env DB var prefixes wasn't confirmed against this specific manifest; Phase 3 will check and fall back to a single `DBHUB_*` set (pointed at staging) if per-env prefixing isn't supported, noting the local-server naming would then be cosmetic only.
- **`local-openapi` MCP server's actual spec source** — no local dev server is assumed running by default; this server will likely point at the same staging spec URL as `staging-openapi` unless the user runs `next dev` locally, which is a nuance to surface rather than silently resolve.
- **OTP/signup login branches** — deferred by explicit user decision, not an oversight; tracked here so a future adaptation pass doesn't have to rediscover the testids (`login-create`, `login-otp`, `login-verify`, `login-resend`) already catalogued in §2.
- **Follow-up entities** (not built this run, per §1.6): Test (ATC-chain assembly), Run (P0 execution flow), Bug (lifecycle + heatmap). Endpoint inventories for all three are already confirmed in `business-feature-map.md`/`business-api-map.md` — no fresh discovery needed when picked up later.
- **Pre-existing `vars:check` failure** at `.context/infrastructure/backend.md:42` — being fixed as a side-effect of Phase 3 (§4.1), not a genuine adaptation gap, but flagged so its resolution doesn't get missed if Phase 3 is ever re-scoped.
- **Story workflow transition matrix** (carried over from `/project-discovery`) — still blocked by Jira admin permissions (403 on `/rest/api/3/workflow/search`). Irrelevant to KATA adaptation itself, noted only for completeness.

## 12. Genericness Baseline (Phase 0 snapshot — this run's work-list)

| Subsystem | Status | Closes this run? |
|---|---|---|
| project.yaml identity | ADAPTED | — (already done) |
| ATC keys (`PROJ-`/`UPEX-`) | GENERIC | Yes — rewritten to `BK-NNN` in Phase 5/6 |
| Example components | GENERIC | Yes — deleted in Phase 6 |
| Example specs | GENERIC | Yes — deleted in Phase 6 |
| Example domain data (hotel/booking) | GENERIC | Yes — replaced in Phase 6 |
| OpenAPI types | GENERIC | Yes (live sync) or partially (hand-write, logged) — Phase 4 |
| Facade boundary (`@openapi` scope) | ADAPTED | — (already correct, no violations found) |
| Auth URLs (`dojo.upexgalaxy.com`) | GENERIC | Yes — Phase 3 |
| `.env` values | GENERIC (structure OK, values blank) | Partially — user populates after this session |
| Smoke tag wiring | ADAPTED | — (already correct) |
| kata-manifest | GENERIC | Yes — Phase 7 |
| Auth setups (`.auth/*`) | GENERIC (nothing has run yet) | Yes — Phase 5/8 |
| Agentic curl auth | GENERIC (nothing has run yet) | Yes — Phase 5/8 |
| Business context placeholders | ADAPTED | — (false-positive grep hits, content is real) |
| CI workflows (env options/secrets) | GENERIC (secret names) / ADAPTED (env options, already 2-env) | Yes — Phase 7 |
| MCP dual-file (per-env servers) | GENERIC | Yes — Phase 7 (4 new servers) |
| dbhub | GENERIC | Yes — Phase 3/7 once user supplies `DBHUB_*` |
| allurerc | GENERIC | Yes — Phase 7 |
| CLAUDE.md (resolved strategy recorded) | GENERIC | Yes — Phase 9 |
| Full gate (`repo:check`) | GENERIC (fails on pre-existing `backend.md:42` issue) | Yes — Phase 3 fix + Phase 8 gate |

## 13. Approval Checklist

- [ ] Auth strategy (§2) matches your understanding of the real login/PAT flow
- [ ] OpenAPI live-sync attempt (§3) approved; comfortable with the hand-write fallback if staging's `/api/openapi` isn't reachable
- [ ] First entity = ATC, API-only, no UI component this run (§1.6/§5) — agreed
- [ ] Environment scope = local + staging only (§1, §4.4) — agreed, production deferred
- [ ] Login UI scope = happy path only (§2, §5) — agreed, OTP/signup deferred
- [ ] 4 per-env MCP servers to be created in both `.mcp.json` and `opencode.jsonc` (§7.3) — agreed
- [ ] Allure report name `Bunkai QA Reports` (§7.5) — agreed
- [ ] CI secrets pushed automatically via `gh secret set` once `.env` is populated (§7.2) — agreed
- [ ] You will populate `.env` (`STAGING_USER_*`, `LOCAL_USER_*`, `DBHUB_*`) before Phase 5/8 verification steps run
- [ ] Discovery Gaps (§11) reviewed — none block starting Phase 3

---

**WAIT for explicit user approval before starting Phase 3. Do not write code yet.**
