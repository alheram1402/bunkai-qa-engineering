# Business Model — Bunkai

> Generated: 2026-08-12 · Discovery method: reverse-engineering from `upex-bunkai-tms` source code (read-only). No claim below is invented — every row cites a file. Confidence levels are mandatory per doctrine; product-copy claims are downgraded to Medium, illustrative/example numbers are excluded entirely.

**Overall confidence: Medium.** The strongest evidence is structural (database schema, RLS policies, RPC validation logic) — High confidence. The softest evidence is the public `/about` marketing/explainer page — Medium confidence, since it is first-party copy, not independently verified user research; illustrative example numbers on that page are explicitly self-labelled by its own code comment as non-real ("Nothing here queries the database — every number is illustrative") and are excluded from this document entirely.

---

## 1. Problem Statement

Bunkai is a Test Management System (TMS) built for QA teams who work with structured, reusable test cases rather than freeform manual scripts. The product's own explainer page states its core problem directly: *"Las herramientas de gestión de pruebas guardan documentos. No enseñan a testear."* ("Test management tools store documents. They don't teach how to test.") — Source: `app/about/page.tsx:77`.

The page's `PainSolution` component enumerates four concrete pain points the product claims to address, each paired with the specific data-model mechanism that resolves it:

1. **Duplicated test steps** — "the same step, copied forty times… you change the flow and edit forty places, or twelve slip through." Bunkai's fix: an ATC (Acceptance Test Case) is authored once and *referenced* — not copied — by every Test that chains it, so one edit propagates everywhere. — Source: `app/about/_components/sections.tsx:100-103`; structurally confirmed by `test_steps.atc_id` being a foreign key to `atcs(id)` rather than a copy, and by the "edit propagation" RPC referenced in `supabase/migrations/0035_atc_update_propagation.sql` (filename only, content not read this session).
2. **Coverage drift** — "nobody knows what's still valid… release after release the suite drifts from the app." Fix: coverage is computed, not eyeballed — uncovered criteria and never-run tests surface as a list. — Source: `sections.tsx:106-110`; corroborated by dedicated coverage-reporting migrations (`0048_project_coverage_report.sql`, `0050_project_coverage_report_real_execution_source.sql`, `0068_story_traceability_report.sql` — filenames only).
3. **Scattered traceability** — "story → criterion → ATC → test → run → defect" living across a spreadsheet, a Confluence page, and someone's memory. Fix: the chain is anchored structurally in the schema itself (`atc_acceptance_criteria`, `test_steps`, `run_atcs`, `bugs.atc_id`) so it is queryable in both directions. — Source: `sections.tsx:112-116`, cross-checked against the actual FK graph in `supabase/migrations/0003_authoring.sql`, `0004_atcs.sql`, `0024_tests.sql`, `0031_runs.sql`, `0046_bugs.sql`.
4. **Bugs leaving the QA context** — "the tool hands off to the tracker the moment something fails, and which ATC failed under what conditions gets lost." Fix: a bug is anchored to module/run/step/ATC at filing time, with tracker sync being optional, not a transfer of ownership. — Source: `sections.tsx:118-122`; structurally confirmed — `bugs.run_id` / `bugs.run_step_id` / `bugs.atc_id` are nullable *provenance* columns frozen at filing time (`supabase/migrations/0046_bugs.sql:98-103`).

**Confidence: Medium** (product's own framing of the problem it solves — directionally trustworthy since it is corroborated by matching schema mechanisms, but not independently validated against real user complaints).

---

## 2. Business Model Canvas

### Customer Segments
QA / software delivery teams that manage test cases, executions, and defects as part of a formal testing practice — explicitly framed as "para equipos de QA" (for QA teams). The login page targets "QA engineers who think in reusable test cases, not freeform steps." — Source: `app/about/page.tsx:137` (footer), `app/(auth)/login/page.tsx:118`.

Two access modes are supported for the same tenant: human testers (manual runs) and AI agents (agentic runs authenticated via Personal Access Token) — both are described as "first-class consumers" of the same API. — Source: `app/(auth)/login/email-first-form.tsx` login flow + `sections.tsx:154-158` ("Una IA opera exactamente la misma API que opera una persona… El agente es un consumidor de primera clase, no un chatbot pegado al costado.")

**Confidence: Medium** — product framing, not verified against actual customer interviews.

### Value Propositions
1. Write-once, reference-everywhere ATC library — eliminates duplicated test-step maintenance. — Source: `sections.tsx:100-103`
2. Computed coverage (uncovered criteria/modules surfaced automatically, not manually tracked). — Source: `sections.tsx:106-110`
3. Bidirectional, structurally-anchored traceability (Story → AC → ATC → Test → Run → Bug), navigable in one view. — Source: `sections.tsx:112-116`
4. Defects filed in context (module + ATC + run), with tracker sync optional rather than a hand-off. — Source: `sections.tsx:118-122`
5. Three execution modes converging on one schema: **Manual** (human, keyboard-driven step verdicts), **Agentic** (AI agent via PAT, same API as a human), **CI** (automated result ingestion). — Source: `app/(auth)/login/page.tsx:14` (`FEATURE_TICKS`), `supabase/migrations/0031_runs.sql:81` (`executor_mode in ('human','agent','ci')`)
6. Open-source / self-hostable posture: "Your test specifications stay on your servers — Bunkai never reaches for the cloud unless you tell it to." — Source: `app/(auth)/login/page.tsx:219`

**Confidence: High** for items 1-5 (each has a matching structural/schema mechanism, not just copy); **Medium** for item 6 (stated intent, self-hosting deployment path itself not verified in this session — no `docker-compose.yml` was found in the target repo root, which is a mild tension with the "one docker compose" claim on the same login page at line 133 — flagged in Discovery Gaps).

### Channels
- Web application (Next.js app, primary UI) — Source: `app/(app)/` route group
- REST API under `app/api/v1/*`, documented via a Scalar-rendered OpenAPI reference at `app/api/docs` — Source: directory listing, `package.json` (`@scalar/api-reference-react`, `api:sync`/`openapi:gen` scripts)
- CLI / programmatic access via scoped Personal Access Tokens (`bk_pat_*`) — Source: `supabase/migrations/0008_access_tokens.sql`
- Public unauthenticated explainer page (`/about`) — Source: `app/about/page.tsx:20-22` ("Public explainer surface — no auth gate")
- In-app testability guide (`/qa` route) — Source: `app/qa/` directory listing (page exists; content not read this session)

**Confidence: High** (all directly observed in the route tree).

### Customer Relationships
Self-service: sign-up via email/password, magic link, or OAuth (GitHub/Google); workspace creation and teammate invitation are in-app, self-serve flows (`app/(app)/settings/workspaces`, `app/(app)/onboarding`). No evidence of an assisted/sales-led onboarding flow (no CRM integration, no "contact sales" surface found). — Source: `app/(auth)/login/page.tsx:175`, `app/(app)/onboarding/page.tsx`, `app/(app)/settings/workspaces/page.tsx`

**Confidence: High** for the self-service mechanics observed; **Unknown** whether an enterprise/sales-assisted tier exists outside the code (plausible given the `enterprise` plan value — see Revenue Streams below — but not evidenced beyond the enum).

### Revenue Streams
`workspaces.plan` is a constrained enum: `'community' | 'cloud' | 'enterprise'`, defaulting to `'community'` — Source: `supabase/migrations/0001_tenancy.sql:32-33`. This is a real schema constraint, not copy — it structurally supports a tiered/open-core model. The login page corroborates the same split narratively: *"OSS · Apache-2.0. Self-host with one docker compose, or use Cloud."* — Source: `app/(auth)/login/page.tsx:15`, `:66` ("v0.1.0 · self-hosted-ready"), `:207-211` ("Self-hosted instance… Connect to your own Bunkai server (Community edition)").

However, **no billing/payment integration was found** — no Stripe, Paddle, or LemonSqueezy in `package.json` dependencies, and the product's own roadmap page lists "Asientos, tiers y facturas" (seats, tiers, and invoicing) as `'próximo'` (upcoming), not shipped. — Source: `app/about/_components/Capabilities.tsx:18`

**Confidence: Low-Medium.** The `plan` column and the OSS/Cloud narrative establish *intent* for an open-core (free self-hosted Community tier + paid Cloud/Enterprise tiers) revenue model, but actual pricing, billing mechanics, and monetization status are **Unknown — requires user input**.

### Key Resources
- Supabase Postgres — the entire data layer, RLS-enforced multi-tenancy, and business-rule enforcement (via `SECURITY DEFINER` PL/pgSQL RPCs) — Source: `supabase/migrations/*.sql` (69 files)
- Vercel hosting — Source: `.agents/project.yaml` (`webapp_domain: upexbunkai.vercel.app`)
- The KATA/IQL methodology itself, described as the product's origin: *"Esto no empezó como producto. Empezó como arquitectura."* ("This didn't start as a product. It started as architecture.") — Source: `app/about/page.tsx:126`; `app/(auth)/login/page.tsx:11-13` defines KATA ("Komponent Action Test Architecture") and IQL ("Integrated Quality Lifecycle")
- One-way Jira import pipeline for pulling existing requirements in — Source: `supabase/migrations/0019_import_jobs.sql`

**Confidence: High** (all directly observed as code/infra dependencies).

### Key Activities
Mapped directly to the core entities discovered in the schema (full detail in `domain-glossary.md`):
- Requirements authoring: User Stories + ordered Acceptance Criteria — Source: `supabase/migrations/0003_authoring.sql`
- ATC (Acceptance Test Case) authoring, anchored to ≥1 Acceptance Criterion, with step/assertion detail — Source: `0004_atcs.sql`
- Test chain assembly (ordered ATC references into a Test) — Source: `0024_tests.sql`
- Manual / Agentic / CI Run execution, with a full snapshot of the chain at start time — Source: `0031_runs.sql`
- Defect (Bug) filing, anchored to Module + optional Run/Step/ATC provenance — Source: `0046_bugs.sql`
- Coverage and traceability reporting — Source: `0048_project_coverage_report.sql`, `0068_story_traceability_report.sql` (filenames)
- Milestone planning against a target date — Source: `0064_milestones.sql`

**Confidence: High.**

### Key Partners
- Supabase (database, auth, realtime) — Source: `package.json` (`@supabase/ssr`, `@supabase/supabase-js`), `.env.example`
- Vercel (hosting/deploy) — Source: `.agents/project.yaml`
- Atlassian/Jira (one-directional import of stories via JQL; no evidence of two-way sync) — Source: `supabase/migrations/0019_import_jobs.sql`
- GitHub / Google (OAuth identity providers) — Source: `app/(auth)/login/page.tsx:175`, `app/auth/oauth/[provider]/` route

**Confidence: High.**

### Cost Structure
Inferred, not stated: Supabase project hosting + Vercel hosting are the two infrastructure dependencies observed. No explicit cost/pricing data exists in the codebase.

**Confidence: Unknown — requires user input.**

---

## 3. Discovery Gaps

- Actual pricing for Cloud/Enterprise tiers — **Unknown — requires user input.**
- Whether a `docker-compose.yml` self-hosting path actually exists — the login page references `$ docker compose up` (`app/(auth)/login/page.tsx:133`) but no `docker-compose*.yml` or `Dockerfile` was found anywhere under the target repo root during Phase 1 detection. Either the file exists deeper in the tree (not searched exhaustively this session) or the claim is aspirational/roadmap copy that shipped ahead of the tooling.
- Frontend state-management pattern — no global store library found; not independently confirmed.
- CI/CD and monitoring — none found (see `project-config.md` Discovery Gaps); unclear how release quality gates are currently enforced beyond Vercel's build step.
- Enterprise/sales-assisted customer relationship — plausible given the `enterprise` plan enum value, but no CRM/sales-contact surface was found to corroborate it.
- Real usage/adoption data (customer count, workspace count, actual revenue) — none of this exists in source code by definition; **Unknown — requires user input.**

---

## 4. QA Relevance

| Business aspect | Testing implication |
|---|---|
| Multi-tenant workspaces with role-based RLS (`viewer` / `member` / `admin` / `owner`) | Every entity's test suite needs per-role access-matrix coverage — confirm viewers are read-only everywhere, and that RLS truly isolates one workspace's data from another's (cross-tenant leak is the highest-severity failure class this architecture is designed to prevent). |
| ATC reuse + edit propagation (`atc_id` referenced, not copied, by `test_steps`) | Test that editing an ATC's steps/assertions correctly propagates to every Test that chains it, and that a Run already in progress still reflects its *frozen snapshot*, not the live edit. |
| Anchoring moat — an ATC must reference ≥1 Acceptance Criterion | Test the enforcement path for a zero-AC ATC (currently application-layer per the migration comment in `0004_atcs.sql:5`, not yet a DB constraint) — this is the exact seam where the rule could silently regress. |
| Three execution modes (`human` / `agent` / `ci`) sharing one schema | Each mode needs its own coverage: manual UI-driven runs, PAT-authenticated agentic runs (scope enforcement: `atc:read`, `atc:write`, `run:execute`, `workspace:admin`), and CI result ingestion (marked `'próximo'` — not yet shippable to test). |
| Run/Bug snapshot immutability (`run_atcs.atc_title`, `run_steps.content`, `bugs.run_step_id` frozen at write time) | Test that deleting/archiving a source ATC, Test, or Module after a Run/Bug references it does NOT retroactively corrupt or blank the historical record — this is a stated design invariant across multiple migrations. |
| Idempotent Run creation (`start_token`, 24h dedupe window) | Boundary/race-condition testing on the replay window: same token inside vs. just outside 24h, concurrent double-submits. |
| Cross-project/cross-workspace injection guards on Bug filing (error codes 45300–45307) | Negative-path testing: attempt to file a bug whose `run_id`/`atc_id`/`module_id` belong to a different project than the target — each of the seven distinct error codes should be independently reachable and tested. |
| Milestone `target_date` bounds (today-or-later on write; ≤5 years out; re-validated only when the date actually changes) | Classic BVA candidate: yesterday vs. today vs. tomorrow; exactly 5 years vs. 5 years + 1 day; editing only the description of an already-past milestone should NOT trip the date-bound check. |
| Open-core plan tiers (`community` / `cloud` / `enterprise`) with no billing wired up yet | Until billing ships, there is no monetization-enforcement surface to test — flag this as a future test area, not a current one. |
| Notification 90-day retention window | Boundary testing at day 90 vs. day 91 of a notification's visibility. |

---

## 5. Sources Used

- `app/about/page.tsx` — public explainer page copy, problem statement, page structure
- `app/about/_components/sections.tsx` — `PainSolution` (pain→fix pairs), `ExecutionModes`
- `app/about/_components/Capabilities.tsx` — feature/roadmap catalogue (shipped vs. `'próximo'`)
- `app/(auth)/login/page.tsx` — brand narrative, IQL/KATA/ATC definitions, OSS/Cloud/self-hosted framing, auth methods
- `app/(auth)/login/email-first-form.tsx` — auth flow UI labels
- `supabase/migrations/0001_tenancy.sql` — `workspaces.plan` enum, workspace/member roles
- `supabase/migrations/0003_authoring.sql` — user_stories, acceptance_criteria
- `supabase/migrations/0004_atcs.sql` — atcs, atc_steps, atc_assertions, atc_acceptance_criteria (anchoring moat)
- `supabase/migrations/0008_access_tokens.sql` — PAT scopes
- `supabase/migrations/0019_import_jobs.sql` — Jira JQL import
- `supabase/migrations/0024_tests.sql` — tests, test_steps, edit-propagation precedent
- `supabase/migrations/0031_runs.sql` — runs, run_atcs, run_steps, executor_mode, snapshot model
- `supabase/migrations/0046_bugs.sql` — bugs, cross-project injection guards
- `supabase/migrations/0053_notifications.sql` — 90-day retention rule
- `supabase/migrations/0064_milestones.sql` — target_date bounds
- `package.json` — dependency inventory (no billing SDK found)
- `.agents/project.yaml` — environment URLs, project key
- `.env.example` — Supabase/infra credential shape (key names only, no values read)
