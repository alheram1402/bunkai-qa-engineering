# Non-Functional Specifications — Bunkai

> Generated: 2026-08-12 · Discovery method: read-only reverse-engineering of `upex-bunkai-tms` source (`package.json`, `next.config.ts`, `middleware.ts`, `lib/api/*`, `lib/pagination/*`, grep across `app/` and `lib/` for caching/rate-limit/retry/observability signals). No numeric target below is invented — every claim is either evidenced with a `path:line` or explicitly marked absent/"Not implemented." `upex-bunkai-tms/.context/` was NOT read this session.

---

## NFR Summary

| Category | Implemented | Maturity |
|---|---|---|
| 1. Performance | Partial (indexing, keyset pagination) | No caching layer, no rate limiter for most routes — Low-Medium |
| 2. Security | Strong on authN/authZ (RLS + unified principal); weak on transport-level hardening (no CSP/security headers) | Medium |
| 3. Reliability | Strong on idempotency + structured error envelope; no circuit breakers, no health-check depth, no retry logic | Medium |
| 4. Scalability | Stateless app tier (serverless-ready), but DB access is 100% synchronous/direct (no async job queue for user-facing writes) | Medium |
| 5. Observability | Structured request logging only — no APM/tracing/metrics SDK | Low |

---

## 1. Performance

### NFR-PERF-001: Database Query Indexing

| Aspect | Value |
|--------|-------|
| **Target** | Not benchmarked — no query-latency SLO found in code |
| **Implementation** | Every high-traffic foreign key spot-checked this session has a dedicated B-tree index; `atcs.tsv` has a GIN index backing full-text search |
| **Evidence** | `supabase/migrations/0004_atcs.sql:71-74` (`atcs_project_id_idx`, `atcs_module_id_idx`, `atcs_user_story_id_idx`, `atcs_tsv_gin_idx`), `0024_tests.sql:51,72`, `0031_runs.sql:92-94,131,181`, `0046_bugs.sql:118-121` |

No query-latency target (e.g. "P95 < 500ms") exists anywhere in this codebase. Any such number would be invented — flagged instead as a Discovery Gap below.

### NFR-PERF-002: Pagination Strategy

| Aspect | Value |
|--------|-------|
| **Target** | Constant-time page fetches regardless of offset depth (implied by the choice of keyset over offset pagination — not independently benchmarked) |
| **Implementation** | Keyset (cursor-based) pagination via a generic `(timestamp, id)` base64url-opaque cursor codec, shared across Bugs list and Run history | 
| **Evidence** | `lib/pagination/keyset-cursor.ts`; extracted from Runs-specific code into a field-neutral module (inline comment, BK-49/Decision 4); cursor deliberately does not leak raw timestamp/id in the token (`keyset-cursor.test.ts:26-28`) |

### NFR-PERF-003: Caching

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented.** No Redis, no Next.js `revalidate`/`unstable_cache`, no in-memory memoization layer found anywhere in `app/` or `lib/` — recommend adding if read-heavy endpoints (coverage/traceability reports) show latency under load |
| **Evidence** | `grep -rln "revalidate\|unstable_cache\|redis\|Redis" app/ lib/` → 2 incidental string matches only (`atcs/[atcId]/actions.ts`, `lib/home/coverage.ts`), neither confirmed as an actual caching mechanism this session |

### NFR-PERF-004: Rate Limiting

| Aspect | Value |
|--------|-------|
| **Target** | N/A — no numeric threshold found |
| **Implementation** | Partial. 5 auth routes (`check-email`, `magic-link`, `signup`, `confirm`, `resend`) throw a `429 rate_limited` `ApiError`, but the actual throttling is delegated to Supabase Auth's (GoTrue's) internal limits — this app does not implement its own limiter. `check-email` specifically bypasses GoTrue (reads `auth.users` via a service-role RPC) and its own code comment states the real mitigation — an app-level rate limiter — is "a documented follow-up in ADR-0007, not yet shipped." The remaining ~40+ non-auth `/api/v1/*` routes have NO rate limiting of any kind found in source. |
| **Evidence** | `lib/api/error-envelope.ts:27` (`RATE_LIMITED: 'rate_limited'`); `app/api/v1/auth/check-email/route.ts:14-25,68`; grep confirms exactly 5 call sites of `throw new ApiError('rate_limited', ...)` |

### NFR-PERF-005: Connection Pooling

| Aspect | Value |
|--------|-------|
| **Target** | N/A — not independently configured in app code |
| **Implementation** | `.env.example` exposes standard Supabase pgbouncer pooling vars (`POSTGRES_URL` pooled port 6543, `POSTGRES_URL_NON_POOLING` direct port 5432, `POSTGRES_PRISMA_URL`), but no application code in `lib/` connects via raw `POSTGRES_URL` — all DB access goes through `@supabase/supabase-js`/`@supabase/ssr` clients, which manage their own HTTP-based (PostgREST) connection handling, not a raw Postgres connection pool the app configures directly |
| **Evidence** | `.env.example:117-123`; `lib/supabase/{client,server,admin}.ts` (all use the Supabase JS client, never `pg`/`postgres` npm packages — none found in `package.json`) |

---

## 2. Security

### NFR-SEC-001: Authentication

| Aspect | Value |
|--------|-------|
| **Target** | Unified identity resolution for every authenticated route, regardless of auth method |
| **Implementation** | Supabase Auth (GoTrue) for browser sessions (password/magic-link/OAuth); Personal Access Tokens (SHA-256-hashed secret) for machine/agent bearer auth; both collapse into one `Principal` via `resolveIdentity()` (ADR-0001, per inline comment) |
| **Evidence** | `lib/api/principal.ts:12-74`; `supabase/migrations/0008_access_tokens.sql:1-11` |

### NFR-SEC-002: Authorization (RLS as system of record)

| Aspect | Value |
|--------|-------|
| **Target** | Every table's access is governed by Postgres RLS, not a TypeScript permission layer |
| **Implementation** | RLS enabled on every table (confirmed on `access_tokens`, `atcs`, `workspace_members` this session); role hierarchy `viewer < member < admin/owner`; PAT scope allow-list (`atc:read`\|`atc:write`\|`run:execute`\|`workspace:admin`) is DB-CHECK-enforced non-empty + subset |
| **Evidence** | `supabase/migrations/0004_atcs.sql:110-123`, `0008_access_tokens.sql:29-51`, `0001_tenancy.sql:44`; full detail in `architecture.md` §8 |

### NFR-SEC-003: Security Headers / CSP

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented.** `next.config.ts` defines no `headers()` function at all — no CSP, no `X-Frame-Options`, no `Strict-Transport-Security`, no `X-Content-Type-Options`. No Helmet or equivalent package in `package.json`. Recommend adding a security-review pass before production hardening. |
| **Evidence** | `next.config.ts` (full file read this session — 12 lines, only `reactStrictMode`, `outputFileTracingRoot`, `typedRoutes`, `images.remotePatterns`); `grep -rn "helmet\|Helmet"` → no matches in `package.json` |

### NFR-SEC-004: Input Sanitization

| Aspect | Value |
|--------|-------|
| **Target** | Markdown-bearing user content must not carry through unsanitized HTML/script into rendered output |
| **Implementation** | Write-path: `sanitizeMarkdown()` (`lib/markdown/sanitize.ts`) applied to ATC step/assertion `content` before persistence (confirmed for the ATC domain this session; the same convention is referenced as applying to "every sibling write route" per inline comment, implying Story/AC descriptions etc. follow it too — not independently re-verified for every domain). Read-path: `rehype-sanitize` package used when rendering Markdown back to HTML. Literal test-data fields (`input_data`, `expected`) are deliberately left unsanitized (they are values under test, not prose). |
| **Evidence** | `lib/atcs/sanitize.ts:1-16`; `package.json:72` (`rehype-sanitize`) |

### NFR-SEC-005: Secret Storage

| Aspect | Value |
|--------|-------|
| **Target** | A read of a "public" secret-bearing table alone must not yield a usable credential |
| **Implementation** | PAT secrets: SHA-256 hash (`pgcrypto`) stored in `access_tokens.hash`, raw secret shown exactly once at issuance. Three dedicated `*_secrets` tables (`access_token_secrets`, `workspace_invite_secrets`, `magic_link_token_secrets`) split the actual hash from the parent table's now-nullable column, added specifically as a hardening measure (migration `0011_split_token_secrets.sql`). Passwords: hashing delegated entirely to Supabase Auth (GoTrue) — no bcrypt/argon2 in this codebase because this app never touches raw passwords itself. |
| **Evidence** | `supabase/migrations/0008_access_tokens.sql:1-11`; `domain-glossary.md` §1.12 (filename-only for `0011`, not independently re-read this session) |

### NFR-SEC-006: Enumeration / Non-Disclosure

| Aspect | Value |
|--------|-------|
| **Target** | Error responses should not leak whether a resource exists to a caller without access to it |
| **Implementation** | Widely and deliberately applied: foreign-workspace vs. nonexistent Test id → identical `atc_not_in_workspace` (Tests domain); missing vs. non-member Run → identical `404`; missing bug vs. bug in an inaccessible workspace → identical `404`. ONE explicit, documented exception: `POST /api/v1/auth/check-email` intentionally reveals account existence (ADR-0007 tradeoff, accepted for email-first UX), with the acknowledgment that its real mitigation (rate limiting) is not yet shipped. |
| **Evidence** | `functional-specs.md` FR-005, FR-006, FR-009 Edge Cases tables; `app/api/v1/auth/check-email/route.ts:14-25` |

### NFR-SEC-007: Idempotency as a Replay-Safety Control

| Aspect | Value |
|--------|-------|
| **Target** | A retried POST with the same `Idempotency-Key` must never execute the underlying write twice |
| **Implementation** | SHA-256 payload hash keyed on `(user_id, endpoint, key)`; concurrent duplicate inserts lose on a unique constraint (409); a `failed`→`pending` atomic compare-and-set lets exactly one retry proceed after a prior failure |
| **Evidence** | `lib/api/idempotency.ts:1-40` |

---

## 3. Reliability

### NFR-REL-001: Structured Error Envelope

| Aspect | Value |
|--------|-------|
| **Target** | Every API error response, across all ~50 routes, has one consistent shape a client can branch on programmatically |
| **Implementation** | `withApiHandler` centrally maps `ApiError` → its envelope, `ZodError` → generic `422`, any other thrown value → `500` with a `request_id` the user can quote back — no route hand-rolls its own error shape |
| **Evidence** | `lib/api/handler.ts:94-134`; `lib/api/error-envelope.ts:97-110` |

### NFR-REL-002: Request Correlation / Structured Logging

| Aspect | Value |
|--------|-------|
| **Target** | Every request/response pair is traceable across the edge→server→Supabase boundary via a single id |
| **Implementation** | `x-request-id` propagated from the inbound header (or freshly minted UUID) on every response; single-line JSON logs on stdout (Vercel-indexable) for every request, including `duration_ms`, `status`, and (on error) `error_code` |
| **Evidence** | `lib/api/request-id.ts`; `lib/api/logging.ts`; `lib/api/handler.ts:66,84-107` |

### NFR-REL-003: Error Boundaries (Frontend)

| Aspect | Value |
|--------|-------|
| **Target** | A rendering failure in one route segment should not crash the whole app |
| **Implementation** | Minimal. Only ONE `not-found.tsx` found in the entire `app/` tree (`app/(app)/projects/[projectSlug]/not-found.tsx`); **no `error.tsx` (Next.js App Router error boundary) and no `global-error.tsx` exist anywhere in the repo.** A client-side exception in a Server/Client Component would fall through to Next.js's default (unstyled) error page rather than a Bunkai-branded recovery UI. |
| **Evidence** | `find app -iname "error.tsx" -o -iname "not-found.tsx" -o -iname "global-error.tsx"` → single result, `not-found.tsx` only |

### NFR-REL-004: Retry Logic

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented.** No retry/backoff pattern found for external calls (Supabase, Jira import) in `app/` or `lib/`. The two grep hits for "retry"/"Retry" that exist are UI copy strings (a user-facing "retry" button/prompt), not programmatic retry logic. |
| **Evidence** | `grep -rln "retry\|Retry\|backoff\|Backoff" app/ lib/` → matches confined to UI components' button labels (e.g. the checkout-declined-card example in `domain-glossary.md`'s illustrative data uses "Retry prompt" as UI copy, unrelated to network retry) |

### NFR-REL-005: Health Endpoint

| Aspect | Value |
|--------|-------|
| **Target** | An operator/monitor can confirm the app is up without exercising business logic |
| **Implementation** | `GET /api/v1/health` exists (route + its OpenAPI sibling). Depth of the check (DB ping vs. static `200`) was not read this session. |
| **Evidence** | `app/api/v1/health/route.ts`, `route.openapi.ts` (files found; content not opened this session — Discovery Gap on depth) |

### NFR-REL-006: Run/Bug State Consistency Under Concurrency

| Aspect | Value |
|--------|-------|
| **Target** | Concurrent conflicting writes must not corrupt Run/Bug/ATC state |
| **Implementation** | ATC edits use optimistic locking (`version` column, `45022` conflict on mismatch). Run start under a race is serialized via `for update` row locking on the Project during the idempotency check. Run finish/abort races are "first-wins" — the loser re-reads the now-terminal status and is rejected (`409`), not silently overwritten. |
| **Evidence** | `lib/atcs/errors.ts:24-32`; `supabase/migrations/0031_runs.sql:380-397`; `lib/runs/errors.ts:52-59` |

---

## 4. Scalability

### NFR-SCALE-001: Stateless Application Tier

| Aspect | Value |
|--------|-------|
| **Target** | The Next.js app process holds no server-affinity state, so it can scale horizontally / run serverless |
| **Implementation** | No in-memory session store found — auth state lives in HTTP-only cookies (browser) or is derived per-request from a Bearer token (PAT); no server-side session cache. Consistent with Vercel's serverless deployment model. |
| **Evidence** | `middleware.ts` (cookie-based session refresh, no server memory); `lib/api/principal.ts` (per-request identity resolution, no cached session store) |

### NFR-SCALE-002: Async Processing

| Aspect | Value |
|--------|-------|
| **Target** | Long-running or bulk operations should not block the request/response cycle |
| **Implementation** | Exactly ONE async job pattern found: the Jira `import_jobs` table (`queued → running → completed/failed`), processed by "a service-role worker" per `domain-glossary.md` §1.12 — no BullMQ/pg-boss/Celery/Sidekiq or comparable queue library in `package.json`. **All user-facing writes (ATC/Test/Run/Bug creation) are synchronous request/response RPC calls, not queued.** |
| **Evidence** | `supabase/migrations/0019_import_jobs.sql`, `0020_import_jobs_one_active.sql` (filenames — content not independently re-read this session); `package.json` dependencies (no queue library present) |

### NFR-SCALE-003: Database Scaling

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | Single Supabase Postgres instance per environment; no read-replica or sharding configuration found (`.env.example` exposes only one `POSTGRES_HOST`). Connection pooling is delegated to Supabase's own pgbouncer, not independently tuned in app code (see NFR-PERF-005). |
| **Evidence** | `.env.example:117-123` |

### NFR-SCALE-004: Multi-Tenancy Isolation at Scale

| Aspect | Value |
|--------|-------|
| **Target** | Every entity's RLS policy resolves membership through `workspace_members`, so tenant isolation does not degrade as workspace/table count grows |
| **Implementation** | Confirmed pattern on every table spot-checked this session; this is the architecture's primary scaling AND security assumption — see `architecture.md` §8, `domain-glossary.md` §9 |
| **Evidence** | `supabase/migrations/0004_atcs.sql:93-123` and consistent pattern cited throughout `domain-glossary.md` |

---

## 5. Observability

### NFR-OBS-001: APM / Error Tracking

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented.** No Sentry, Datadog, New Relic, or comparable APM/error-tracking SDK in `package.json`. This confirms and carries forward the identical Discovery Gap already flagged in Phase 1 (`project-config.md` §Discovery Gaps: "No monitoring/observability library in `package.json`") and Phase 2 PRD (`executive-summary.md` §3: "no `track()`/`analytics.event()` call site exists anywhere in `app/` or `lib/`"). |
| **Evidence** | `grep -rln "sentry\|Sentry\|datadog\|Datadog\|opentelemetry\|OpenTelemetry\|newrelic\|prom-client" package.json app/ lib/` → zero matches |

### NFR-OBS-002: Distributed Tracing

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented.** No OpenTelemetry spans/traces. `x-request-id` propagation (NFR-REL-002) provides basic log correlation but is NOT distributed tracing (no span hierarchy, no cross-service trace visualization). |
| **Evidence** | Same grep as NFR-OBS-001; `lib/api/request-id.ts` confirms the correlation-id-only pattern |

### NFR-OBS-003: Metrics

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented** as a metrics/telemetry system. Note: a `lib/metrics/` directory DOES exist, but it computes product-facing analytics (e.g. defect heatmap, recovery-cycle isolation — `lib/metrics/defect-heatmap-isolation.test.ts`, `lib/metrics/recovery-cycle-isolation.test.ts`) for in-app reporting features, NOT operational/infrastructure metrics (no `prom-client`, no counters/gauges/histograms exported for an ops dashboard). Do not conflate the two. |
| **Evidence** | `lib/metrics/` directory listing (product-domain test file names); `package.json` (no `prom-client` or comparable) |

### NFR-OBS-004: Structured Logging (the one observability control that IS implemented)

| Aspect | Value |
|--------|-------|
| **Target** | Every API request produces one greppable/indexable JSON log line |
| **Implementation** | `logRequest()` — single-line JSON to stdout, level-routed (`info`/`warn`/`error`), fields: `request_id`, `method`, `path`, `status`, `duration_ms`, and on error `error_code`/`message`. Vercel captures and indexes stdout by default, so this is a real (if minimal) observability floor even without a dedicated APM. |
| **Evidence** | `lib/api/logging.ts:1-32`; called from `lib/api/handler.ts:85-107` |

### NFR-OBS-005: Alerting

| Aspect | Value |
|--------|-------|
| **Target** | N/A |
| **Implementation** | **Not implemented.** No alerting configuration found (no PagerDuty/Opsgenie integration, no Vercel monitor config in the repo). A logical consequence of NFR-OBS-001 being absent — there is nothing to alert FROM beyond raw stdout logs. |
| **Evidence** | Absence confirmed by the same searches as NFR-OBS-001; no `.github/workflows/` (no CI-triggered alert path either, per `project-config.md`) |

---

## Compliance

| Framework | Status |
|---|---|
| GDPR | **Needs Review** — not verifiable from source alone. `notifications` has a documented 90-day retention policy (`domain-glossary.md` §1.12) and `access_tokens`/`workspace_invites` use soft-delete/revocation for audit-trail purposes, which are GDPR-adjacent patterns, but no explicit data-subject-request (export/erasure) flow was found. |
| SOC2 | **Needs Review** — RLS-enforced tenant isolation and structured audit logging (`activity_log` table) are relevant controls, but no formal SOC2 control mapping exists in this repo. |
| HIPAA | **Not applicable** (no health-data domain concepts found) — **Needs Review** only if the target's actual customer base includes regulated health data outside this codebase's visibility. |
| PCI-DSS | **Not applicable** — no payment/card-data handling found anywhere in `app/`/`lib/`. |

None of the above should be read as a compliance CERTIFICATION or its absence — this is a code-derived signal only, per doctrine ("security posture is never complete/failing, only observed-present or observed-absent").

---

## Discovery Gaps

| Gap | Category | Why It Matters | Suggested Next Step |
|---|---|---|---|
| No numeric performance SLO (response time, throughput) anywhere in source | Performance | Cannot assert "P95 < Xms" or similar without inventing a number | Ask the team for a load-test report or SLO doc, if one exists outside this repo |
| No general-purpose rate limiter beyond 5 auth routes (delegated to GoTrue) | Performance/Security | The other ~40+ routes have no throttling — a resource-exhaustion risk under abuse | Recommend the team evaluate Upstash/Vercel Edge rate limiting for `/api/v1/*` broadly |
| No security headers / CSP configured | Security | XSS/clickjacking mitigations rely entirely on React's default escaping + `rehype-sanitize` for Markdown, with no defense-in-depth header layer | Recommend a `next.config.ts` `headers()` pass (CSP, `X-Frame-Options`, HSTS) before a production security review |
| No `error.tsx`/`global-error.tsx` anywhere in `app/` | Reliability | An unhandled render exception falls through to Next.js's default error page, not a branded recovery UI | Ask the team if this is intentional (e.g. relying on `withApiHandler`'s API-layer safety net) or a gap |
| `app/api/v1/health/route.ts` content not read this session | Reliability | Depth of the health check (dependency ping vs. static `200`) is unknown | Read the file in a follow-up pass before relying on it as a real liveness signal |
| No APM/tracing/metrics/alerting SDK | Observability | Carried forward from Phase 1 + Phase 2 PRD — production incidents would be diagnosed from raw Vercel stdout logs only | Ask the team what (if anything) watches production; recommend Sentry or equivalent if genuinely absent |
| Async processing limited to Jira import only | Scalability | Every user-facing write (ATC/Test/Run/Bug) is synchronous — under heavy concurrent load this is a direct DB-round-trip-per-request model with no queue buffer | Not necessarily a defect (RPC-per-request is simple and correct) — flag for the team as a scaling question, not a bug |
| Compliance posture (GDPR/SOC2/HIPAA/PCI-DSS) | Compliance | None independently verifiable from source | Ask the team directly; this category is structurally unanswerable from code alone |

---

## QA Relevance

### Which NFRs are testable, and how

| NFR | Testable? | Suggested approach/tool |
|---|---|---|
| NFR-PERF-001 (indexing) | Yes | `EXPLAIN ANALYZE` via `[DB_TOOL]` on the top 5 list/report queries under realistic row counts |
| NFR-PERF-002 (keyset pagination) | Yes | Confirm cursor stability under concurrent inserts (a row inserted between two page fetches should not duplicate/skip) — an integration test, not a load test |
| NFR-PERF-004 (rate limiting) | Partially | The 5 GoTrue-backed auth routes can be black-box tested for `429` under rapid repeat calls; the un-throttled remainder cannot be "tested for a limit that doesn't exist" — instead, flag as a risk-acceptance conversation with the team |
| NFR-SEC-002 (RLS) | Yes — highest QA priority | Direct authenticated `curl`/API calls as each of the 4 roles against write endpoints they should NOT have access to (per `user-personas.md` §8 Edge Cases) — this is the single highest-value NFR test class in this codebase |
| NFR-SEC-003 (headers) | Yes | `curl -I` against any route, or an OWASP ZAP passive scan, to confirm current (absent) header posture — useful as a baseline before the team adds them |
| NFR-SEC-006 (enumeration) | Yes | For each non-disclosure pair (existing-but-foreign vs. nonexistent resource), assert the response bodies are byte-identical |
| NFR-REL-001/002 (error envelope, request-id) | Yes | Contract-test every documented `ApiErrorCode` returns its documented shape + a `x-request-id` header |
| NFR-REL-003 (error boundaries) | Yes | Force a render exception in a Client Component (e.g. via a malformed prop in a dev build) and confirm what actually renders — currently expected to be Next.js's generic page, not a Bunkai one |
| NFR-OBS-* | Not meaningfully testable | There is nothing to assert against — these are "absent," not "present but wrong" |

### Suggested tools for a future NFR test pass

- **Performance**: k6 or Artillery against the Coverage/Traceability report endpoints (the most query-heavy reads) once realistic seed data volume exists.
- **Security**: OWASP ZAP passive scan for header posture; direct `curl` scripts (per `agentic-qa-core/references/api-testing-doctrine.md`'s curl-execute pattern) for the RLS/role matrix — this is the single most valuable NFR test investment given the codebase's RLS-first authorization model.
- **Reliability**: manual chaos test (kill the network mid-Run-start) to confirm the idempotency/`start_token` replay behavior actually holds end-to-end, not just at the RPC-logic level already read this session.
