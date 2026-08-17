/**
 * KATA Framework - Type Facade: Auth Domain
 *
 * Type definitions for Bunkai's auth endpoints, derived from the live
 * OpenAPI spec (`bun run api:sync --url .../api/openapi`) via `@openapi`.
 *
 * Consumed by: tests/components/api/AuthApi.ts
 *
 * Auth is HYBRID: cookie session (Supabase SSR, UI path) + Bearer PAT
 * (headless sign-in, API/agentic path). See .context/reports/adapt-framework-plan.md §2.
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

/** Shared error envelope for every `/api/v1/*` route: `{ error: { code, message, details?, request_id? } }`. */
export type AuthErrorResponse = components['schemas']['ErrorEnvelope'];

/** Raw `/api/v1/me` schema — the signed-in principal + workspace memberships + auth source. */
export type MeSchema = components['schemas']['MeResponse'];

// ============================================================================
// Endpoint Types - POST /api/v1/auth/signin
// ============================================================================
// Headless password sign-in + auto-minted PAT. Body: { email, password } —
// field names already match scripts/api-login.ts's default buildAuthPayload().
// Response is NESTED: { user, session, pat, warning } — NOT a flat
// { access_token, token_type, expires_in }. AuthApi.ts must read `pat.token`.

type SigninPath = paths['/api/v1/auth/signin']['post'];

/** Request body for `POST /api/v1/auth/signin`. */
export type LoginPayload = SigninPath['requestBody']['content']['application/json'];

/** Successful (200) sign-in response: `{ user, session, pat, warning }`. */
export type LoginSuccessResponse = SigninPath['responses']['200']['content']['application/json'];

/** Invalid credentials (401). */
export type LoginErrorResponse = SigninPath['responses']['401']['content']['application/json'];

/** Convenience alias — the `session` slice of `LoginSuccessResponse` (Supabase SSR cookie session). */
export type LoginSession = LoginSuccessResponse['session'];

/** Convenience alias — the `pat` slice of `LoginSuccessResponse` (the Bearer token to use in `Authorization: Bearer <pat.token>`). */
export type LoginPat = LoginSuccessResponse['pat'];

// ============================================================================
// Endpoint Types - GET /api/v1/me
// ============================================================================
// Verify endpoint (works with either cookie or Bearer auth). NOT `/auth/me`.

type MePath = paths['/api/v1/me']['get'];

/** Successful (200) identity snapshot: `{ user, workspaces[], active_workspace_id, active_workspace_role, auth: { source, scopes[] } }`. */
export type UserInfoResponse = MePath['responses']['200']['content']['application/json'];

/** Caller is not signed in (401). */
export type MeErrorResponse = MePath['responses']['401']['content']['application/json'];
