# Executive Summary — Bunkai

> Generated: 2026-08-12 · Discovery method: reverse-engineering from `upex-bunkai-tms` source code (read-only). Builds on Phase 1 (`business-model.md`, `domain-glossary.md`, `project-config.md`). No claim below is invented — every row cites a file. `upex-bunkai-tms/.context/` was deliberately not read this session (target's own prior discovery output) — everything here is re-derived independently from raw code.

---

## 1. Problem Statement

### The Challenge

Bunkai is a Test Management System (TMS) for QA teams who work with structured, reusable test cases rather than freeform manual scripts. Its own public explainer page states the problem directly:

> *"Las herramientas de gestión de pruebas guardan documentos. No enseñan a testear."* ("Test management tools store documents. They don't teach how to test.") — `app/about/page.tsx:77`

The page's `PainSolution` component names three pain points that describe the *current alternative* implicitly — a spreadsheet, a Confluence page, and institutional memory:

1. **Duplicated test steps** — "the same step, copied forty times… you change the flow and edit forty places, or twelve slip through." — `app/about/_components/sections.tsx:100-103`
2. **Coverage drift** — "nobody knows what's still valid… release after release the suite drifts from the app." — `sections.tsx:106-110`
3. **Scattered traceability** — the chain "story → criterion → ATC → test → run → defect" lives "across a spreadsheet, a Confluence page, and someone's memory." — `sections.tsx:112-116`

### Current Alternatives

Not independently discoverable beyond the product's own framing above (spreadsheets, Confluence, and other general-purpose TMS/document tools are implied, not named). **Discovery Gap** — no competitor comparison or named alternative tool was found in the codebase.

**Confidence: Medium** (product's own framing — see `business-model.md` §1 for the full pain→fix breakdown, already cross-checked against the schema).

---

## 2. Solution Overview

### Product Vision

A test management system where QA teams author reusable Acceptance Test Cases (ATCs) once, anchor them to acceptance criteria, and get computed coverage and traceability instead of a manually maintained spreadsheet — executable identically by a human, an AI agent, or a CI pipeline.

### Core Capabilities

| # | Feature | Problem Addressed | Evidence (route or component) |
|---|---|---|---|
| 1 | ATC Library — write-once, reference-everywhere test cases, anchored to ≥1 Acceptance Criterion | Duplicated test steps; requirements traceability | `app/(app)/projects/[projectSlug]/atcs/new/page.tsx`; `supabase/migrations/0004_atcs.sql` (`atc_acceptance_criteria` anchoring join, `test_steps.atc_id` FK not copy) |
| 2 | Test Chain Assembly — ordered chain of ATC references, workspace-scoped | Reuse of the same ATC across many Tests, at multiple positions | `app/(app)/projects/[projectSlug]/tests/new/page.tsx`, `components/tests/NewTestBuilder`; `supabase/migrations/0024_tests.sql` |
| 3 | Manual Run Execution with per-step verdicts, 3 executor modes (Manual/Agentic/CI) sharing one schema | Coverage drift — a Run is a frozen snapshot, not a re-interpretation of the live Test | `components/tests/StartRunButton.tsx`, `components/runs/RunnerView.tsx`; `supabase/migrations/0031_runs.sql:81` (`executor_mode in ('human','agent','ci')`) |
| 4 | In-context Defect Filing — a bug is filed directly from a failed Run step, carrying Module/Run/ATC provenance | Bugs "leaving the QA context" when handed to an external tracker | `lib/runs/report-bug-view.ts:20-22` (`shouldShowReportBugButton` — only on a `failed` step); `supabase/migrations/0046_bugs.sql` |
| 5 | Coverage & Traceability Reporting | Scattered traceability across spreadsheet/Confluence/memory | `app/api/v1/projects/[id]/coverage/route.ts`, `app/api/v1/projects/[id]/traceability/route.ts`; `sections.tsx:112-116` |

*(5 core capabilities — the maximum allowed by doctrine. The full feature catalog, including everything below this cut line, is deferred to `business-feature-map.md` — see §8.)*

### Key Differentiators

- **Reference, not copy**: an ATC is referenced by `test_steps.atc_id`, not duplicated — editing an ATC propagates to every Test that chains it. This is a real schema mechanism, not marketing copy — `supabase/migrations/0004_atcs.sql`, `0035_atc_update_propagation.sql` (filename).
- **Agent as a first-class consumer, not a chatbot bolted on**: "Una IA opera exactamente la misma API que opera una persona… El agente es un consumidor de primera clase" — `sections.tsx:154-158`; structurally backed by `runs.executor_mode` accepting `'agent'` on equal footing with `'human'`/`'ci'` — `0031_runs.sql:81`.
- **Open-core / self-hostable posture**: "OSS · Apache-2.0. Self-host with one docker compose, or use Cloud." — `app/(auth)/login/page.tsx:15`. **Caveat** (carried from Phase 1): no `docker-compose.yml`/`Dockerfile` was found anywhere in the target repo root this session — see Discovery Gaps.

---

## 3. Success Metrics

### Tracked Metrics

None found. `package.json` was searched for `sentry|datadog|newrelic|prometheus|posthog|amplitude|mixpanel` and no analytics/monitoring SDK is present (corroborates `project-config.md`'s existing Discovery Gap on monitoring). No `track()` / `analytics.event()` call site exists anywhere in `app/` or `lib/`.

### Inferred KPIs (from features, not real tracking)

| Metric | Type | Inferred From |
|---|---|---|
| Time-to-green per Story | Adoption/Engagement | "Tiempo hasta verde por historia" listed as shipped (`listo`) — `app/about/_components/Capabilities.tsx:78` (Cobertura y evidencia group) |
| % Criteria / Modules covered | Engagement | `app/api/v1/projects/[id]/coverage/route.ts`; "Criterios y módulos sin cubrir" — `Capabilities.tsx:75` |
| Defect trend (heatmap) | Quality/Engagement | `app/api/v1/projects/[id]/bugs/heatmap/route.ts`; "Heatmap con tendencia semanal" — `Capabilities.tsx:70` |

### Unknown Metrics

- Real usage/adoption data (customer count, workspace count, actual revenue) — **Unknown, requires user input** (carried from `business-model.md` §3, cannot be derived from source code by definition).
- Whether any of the above inferred KPIs are actually consulted by the team, vs. simply computable — **Unknown**.

---

## 4. Target Users

Full personas (Identity, Goals, Pain Points, Feature Access, Permission Matrix) live in `user-personas.md`. Brief:

| System Role | Need | Evidence |
|---|---|---|
| Viewer | Browse coverage, traceability, runs, and bugs without risk of accidental edits | `lib/types.ts:13` (`MemberRole`), RLS write policies excluding `viewer` — e.g. `supabase/migrations/0004_atcs.sql:110-123` |
| Member (QA Engineer) | Author ATCs, assemble Tests, execute Runs, file Bugs — the day-to-day IC | `app/(app)/projects/[projectSlug]/milestones/[milestoneId]/page.tsx:54` (`canEdit = ['member','admin','owner']`) |
| Admin / Owner (Workspace Manager) | Everything a Member can do, plus invite/manage teammates and workspace settings | `app/api/v1/workspaces/[id]/invites/route.ts:52` (`requires ['admin','owner']`) |

---

## 5. Product Scope

### What's Included (current capabilities, per the product's own shipped/`listo` roadmap)

Team & access (workspaces/roles/invites, password+magic-link+OAuth login, workspace switching, PATs), product structure (projects, nested modules, per-project environments, tree/table/mind-map views, command palette), requirements (stories anchored to modules, ordered ACs, Markdown editor, one-way Jira import), ATC library (builder, mandatory AC anchoring, edit propagation, usage report, duplicate+search), tests & execution (chain builder, reorder, tags, manual run with per-step verdict, abort/finish, filterable run history), defects (file-from-failed-step, filterable list, heatmap, one-way tracker sync), coverage & evidence (uncovered criteria/modules, full traceability chain, time-to-green, activity feed, chain export). — Source: `app/about/_components/Capabilities.tsx` (all items marked `listo`).

### What's Not Included (known limitations, per the same roadmap, marked `próximo`)

Seats/tiers/billing; automated-run submission + streaming; CI results-file upload; notifications inbox + per-event preferences; Test Plans and Milestones as a coordination surface (`milestones` table exists per the domain glossary, but the roadmap still lists "Test plans y milestones" as upcoming — a tension worth confirming with the team); chat channels with mentions; a home dashboard. — Source: `Capabilities.tsx` (all items marked `próximo`).

### Future Indicators

- Roadmap items above (`próximo` markers) are the clearest signal — they are first-party, not inferred.
- `app/api/v1/runs/route.ts` comment block references "PO-pending §4" decisions (executor-mode derivation, start-token handling) — evidence of an internal product-owner decision doc not present in this repo; its content is unknown.
- `notification_preferences.event_type` enum has a third value, `mentions`, that is *structurally locked* (no row may hold it yet) — a concrete DB-level placeholder for the future Team Chat epic. — `supabase/migrations/0062_notification_preferences.sql:45`

---

## 6. Discovery Gaps

| Gap | Impact | Suggested Source |
|---|---|---|
| No named competitor/alternative tool | Cannot benchmark differentiators against a concrete baseline | Product/market research doc, if one exists outside the repo |
| No analytics/monitoring SDK in `package.json` | Every "Tracked Metrics" claim is currently only a capability, never verified as measured | Confirm with the team whether metrics are tracked externally (e.g. a BI tool reading the DB directly) |
| `docker-compose.yml` self-hosting path referenced on the login page but not found in the repo root | The "OSS self-host in one command" differentiator may be aspirational/roadmap copy ahead of the tooling | Search deeper in the tree, or ask the team directly (carried from `business-model.md` §3) |
| "Test plans y milestones" listed as `próximo` even though a `milestones` table + full CRUD API already exists | Roadmap copy may be stale, or "Milestones" the coordination *surface* (dashboard/reminders) is distinct from the `milestones` table already shipped | Ask the team to clarify roadmap-copy freshness |
| Real usage/adoption/revenue data | Cannot validate any Inferred KPI against actual behavior | Product analytics, if any exists outside this codebase |

---

## 7. QA Relevance

### Critical Testing Areas

- **ATC anchoring moat** — an ATC must reference ≥1 Acceptance Criterion; enforced at the application layer only in MVP (not a DB constraint) per `0004_atcs.sql:5-6` — a strong candidate for a negative-path regression test.
- **Edit propagation** — editing an ATC's steps/assertions must correctly propagate to every Test that chains it, while a Run already in progress keeps its frozen snapshot.
- **Multi-tenant isolation (RLS)** — every entity's RLS policy resolves membership back through `workspace_members`; cross-tenant leakage is the highest-severity failure class this architecture exists to prevent.
- **Three execution modes on one schema** — Manual (covered), Agentic (PAT scope enforcement), CI (marked `próximo` — not yet shippable to test).

### Risk Areas

- **Viewer write-blocking is dual-enforced** (RLS policy + UI hide) — a regression that removes only the UI guard would still be caught by RLS, but a regression that removes RLS while UI stays would silently open a security hole invisible to UI-only testing. Both layers need independent coverage.
- **No CI/CD pipeline exists** in the target repo (`project-config.md` Discovery Gap) — no automated quality gate runs today beyond Vercel's build step.

Full risk/business-rule detail (SQLSTATE codes, Given/When/Then) already lives in `business-model.md` §4 and `domain-glossary.md` §3/§9 — not duplicated here.

---

## 8. Document References

| Document | Status |
|---|---|
| `.context/business/business-model.md` | Complete (Phase 1) |
| `.context/business/domain-glossary.md` | Complete (Phase 1) |
| `.context/project-config.md` | Complete (Phase 1) |
| `.context/PRD/user-personas.md` | Complete (this session) |
| `.context/PRD/user-journeys.md` | Complete (this session) |
| `.context/business/business-feature-map.md` | **Pending** — run `/business-feature-map` after discovery for the full feature catalog (FEAT-NNN IDs, CRUD matrix, API inventory, integrations, feature flags) |
| `.context/SRS/*` | Not in scope for this dispatch |

---

*Discovery method: read-only reverse-engineering of `upex-bunkai-tms` source (migrations, routes, components). Every claim above cites a file. `upex-bunkai-tms/.context/` was not read.*
