/**
 * KATA Framework - Type Facade: ATC Domain
 *
 * Type definitions for Bunkai's ATC (Acceptance Test Case) endpoints,
 * derived from the live OpenAPI spec (`bun run api:sync --url .../api/openapi`)
 * via `@openapi`.
 *
 * Consumed by: tests/components/api/AtcsApi.ts (Phase 6)
 *
 * ATC = Workspace → Project → Module → User Story → Acceptance Criterion →
 * ATC → Test (chain of ATCs) → Run → Bug. First entity wired in this
 * adaptation. No `GET /api/v1/atcs/{id}` endpoint exists — the read path
 * goes through `search` / `usage` only.
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

/** Full ATC resource: id, project/module/user-story refs, slug, title, layer, version, status, steps, assertions, AC bindings. */
export type Atc = components['schemas']['Atc'];

/** A single ATC step (position, content, optional input_data/expected). */
export type AtcStep = components['schemas']['AtcStep'];

/** A single ATC assertion (position, content). */
export type AtcAssertion = components['schemas']['AtcAssertion'];

/** Slim projection returned by `GET /api/v1/atcs/search`. */
export type AtcSearchResult = components['schemas']['AtcSearchResult'];

/** `GET /api/v1/atcs/{id}/usage` response body: `{ count, used_in[] }`. */
export type AtcUsageReport = components['schemas']['AtcUsageReport'];

/** One entry in `AtcUsageReport.used_in` — a Test that chains the ATC, with the positions it occupies. */
export type AtcUsageEntry = components['schemas']['AtcUsageEntry'];

/** Shared error envelope for every `/api/v1/*` route: `{ error: { code, message, details?, request_id? } }`. */
export type AtcErrorResponse = components['schemas']['ErrorEnvelope'];

// ============================================================================
// Endpoint Types - POST /api/v1/atcs (create)
// ============================================================================
// Requires ≥1 acceptance_criterion_ids (all must belong to user_story_id) —
// an empty array is rejected with error.code `422` (validation_failed);
// the RPC-side guard surfaces as Postgres SQLSTATE 45020.

type CreateAtcPath = paths['/api/v1/atcs']['post'];

/** Request body for `POST /api/v1/atcs`. */
export type CreateAtcRequest = CreateAtcPath['requestBody']['content']['application/json'];

/** Successful (201) create response: `{ atc: Atc }`. */
export type CreateAtcResponse = CreateAtcPath['responses']['201']['content']['application/json'];

// ============================================================================
// Endpoint Types - PATCH /api/v1/atcs/{id} (update — optimistic lock)
// ============================================================================
// PUT-style full replace (omitted children are cleared), but the HTTP verb
// is PATCH. Optimistic locking uses the custom `X-If-Match` request header
// (NOT the standard `If-Match`) — the Vercel edge intercepts `If-Match` and
// rewrites the response to 412 (BK-96). A version mismatch returns 409 with
// error.code `conflict` / `details.reason: version_conflict`.

type UpdateAtcPath = paths['/api/v1/atcs/{id}']['patch'];

/** Request body for `PATCH /api/v1/atcs/{id}`. Optional in the spec (an empty body is a valid 200 no-op), hence `NonNullable`. */
export type UpdateAtcRequest = NonNullable<UpdateAtcPath['requestBody']>['content']['application/json'];

/** Successful (200) update response: `{ atc, version, affected_test_count }`. */
export type UpdateAtcResponse = UpdateAtcPath['responses']['200']['content']['application/json'];

/** Version conflict (409) — same shape as `AtcErrorResponse`, called out for the optimistic-lock ATC. */
export type UpdateAtcConflictResponse = UpdateAtcPath['responses']['409']['content']['application/json'];

// ============================================================================
// Endpoint Types - POST /api/v1/atcs/{id}/duplicate
// ============================================================================
// Deep-copies steps, assertions, and AC bindings into a new ATC (fresh slug,
// version = 1). `new_title` is optional — defaults to `<source> (copy)`.

type DuplicateAtcPath = paths['/api/v1/atcs/{id}/duplicate']['post'];

/** Request body for `POST /api/v1/atcs/{id}/duplicate` (optional `new_title`). The whole body is optional in the spec, hence `NonNullable`. */
export type DuplicateAtcRequest = NonNullable<DuplicateAtcPath['requestBody']>['content']['application/json'];

/** Successful (201) duplicate response: `{ atc: Atc }`. */
export type DuplicateAtcResponse = DuplicateAtcPath['responses']['201']['content']['application/json'];

// ============================================================================
// Endpoint Types - GET /api/v1/atcs/{id}/usage
// ============================================================================
// "used in N tests" report. A reachable ATC with no chaining Tests returns
// count: 0 + empty used_in (never 404).

type AtcUsagePath = paths['/api/v1/atcs/{id}/usage']['get'];

/** Successful (200) usage response: `{ count, used_in[] }` — same shape as `AtcUsageReport`. */
export type AtcUsageResponse = AtcUsagePath['responses']['200']['content']['application/json'];

// ============================================================================
// Endpoint Types - GET /api/v1/atcs/search
// ============================================================================
// Project-scoped full-text search over title + tags. Zero matches return an
// empty items array (never 404). `query` and `project_id` are required.

type SearchAtcsPath = paths['/api/v1/atcs/search']['get'];

/** Query parameters for `GET /api/v1/atcs/search`. */
export type SearchAtcsQuery = SearchAtcsPath['parameters']['query'];

/** Successful (200) search response: `{ items: AtcSearchResult[] }`. */
export type SearchAtcsResponse = SearchAtcsPath['responses']['200']['content']['application/json'];
