# Project Configuration

> Project: Bunkai
> Generated: 2026-08-12

## Repositories

| Repository | URL | Branch | Purpose |
|------------|-----|--------|---------|
| upex-bunkai-tms | https://github.com/upex-galaxy/upex-bunkai-tms.git | main | Full-stack monorepo — web application + API services (single Next.js app, no separate frontend/backend repos) |

Confirmed via `git remote -v` inside the target repo. `.agents/project.yaml` sets `backend_repo` and `frontend_repo` to the same relative path (`../upex-bunkai-tms`) — this is a single-repo product, not a split frontend/backend architecture.

## Tech Stack

### Frontend
- Framework: Next.js `^15` (App Router, route groups `(app)` / `(auth)`) — Source: `package.json`
- Language: TypeScript `^5.9.3`, `strict: true` — Source: `tsconfig.json`
- UI runtime: React `^19` / `react-dom ^19` — Source: `package.json`
- Styling: Tailwind CSS `^3.4` (custom design tokens: `surface-*`, `fg-*`, `stroke-*`, `accent`) — Source: `tailwind.config.ts`, `postcss.config.js`
- Component primitives: Radix UI (`@radix-ui/react-dialog`, `-dropdown-menu`, `-tabs`, `-tooltip`), `cmdk` (command palette), `@dnd-kit/*` (drag-and-drop — module tree reorder, ATC chain reorder), `@tanstack/react-table`, `@monaco-editor/react` (code editor), `shiki` (syntax highlighting), `react-markdown` + `remark-gfm` + `rehype-sanitize` (Markdown editor/preview), `sonner` (toasts), `lucide-react` (icons) — Source: `package.json`
- State: no global state library detected (no Redux/Zustand/Jotai in dependencies) — component-local state + Next.js server components/actions inferred as the pattern. **Discovery Gap** — not verified by reading component internals.

### Backend
- Framework: Next.js Route Handlers under `app/api/v1/*` (no separate Express/NestJS server) — Source: `app/api/v1/` directory listing
- Language: TypeScript, same codebase as frontend
- Validation / schema: Zod `^4.4.3`, OpenAPI generation via `@asteasolutions/zod-to-openapi` (`bun run openapi:gen`, `bun run api:sync`) — Source: `package.json` scripts
- API docs: Scalar API reference (`@scalar/api-reference-react`) served at `app/api/docs/page.tsx`; raw spec at `app/api/openapi/`
- ORM: none — direct Supabase client calls (`@supabase/ssr`, `@supabase/supabase-js`) plus hand-written `SECURITY DEFINER` PL/pgSQL RPC functions for multi-step transactional writes (e.g. `bunkai_create_run`, `bunkai_create_bug`, `bunkai_create_test`) — Source: `supabase/migrations/0024_tests.sql`, `0031_runs.sql`, `0046_bugs.sql`
- Auth: Supabase Auth — password, magic link, and OAuth (GitHub, Google) sign-in; a separate Personal Access Token (PAT) system (`bk_pat_<prefix>.<secret>`, scoped: `atc:read`, `atc:write`, `run:execute`, `workspace:admin`) authenticates CLI/AI-agent bearer requests — Source: `app/(auth)/login/page.tsx`, `supabase/migrations/0008_access_tokens.sql`
- `middleware.ts` at repo root — request-level guard (auth/session refresh); has its own test file `middleware.test.ts` — Source: file listing

### Database
- Type: PostgreSQL (via Supabase)
- Provider: Supabase — Source: `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), `dbhub.toml`
- Access: DBHub MCP, resolved per environment via `.agents/project.yaml` → `environments.<env>.db_mcp` (`local-dbhub`, `staging-dbhub`, `dbhub`)
- Schema authority: 69 sequential SQL migrations under `supabase/migrations/` (`0001_tenancy.sql` … `0068_story_traceability_report.sql`) — no ORM model files found, confirming migrations are the authoritative schema source
- Architecture pattern: Row-Level Security (RLS) enabled on every table, workspace-scoped tenancy; complex multi-table writes go through `SECURITY DEFINER` RPC functions rather than raw client inserts (mirrors the "Path A: explicit-actor SECURITY DEFINER" pattern documented inline across migrations, e.g. `0046_bugs.sql` header)

### Infrastructure
- Cloud: Vercel — Source: `.agents/project.yaml` (`webapp_domain: upexbunkai.vercel.app`), `.env.example` (`NEXT_PUBLIC_APP_URL`), production/staging URLs are both `*.vercel.app` domains
- CI/CD: **none found** — `find <repo>/.github -type f` returned no results; no `.github/workflows/` directory exists in the target repo. **Discovery Gap.**
- Monitoring: no monitoring/observability tool detected in `package.json` dependencies (no Sentry, Datadog, LogRocket, PostHog, etc.). **Discovery Gap.**
- Package manager / runtime: Bun (`bun.lock` present, all scripts run via `bun`/`bunx`) — Source: `package.json` scripts block

## Environments

| Environment | URL | Purpose | Access |
|-------------|-----|---------|--------|
| Local       | http://localhost:3000   | Dev | Direct (`bun run dev`) |
| QA          | https://staging-upexbunkai.vercel.app | Shares the staging deployment (same URL as Staging in `.agents/project.yaml`) | Not verified live this session |
| Staging     | https://staging-upexbunkai.vercel.app | Pre-prod testing | Not verified live this session — auth/VPN requirements unknown, **Discovery Gap** |
| Production  | https://upexbunkai.vercel.app | Live | Read-only; not verified live this session |

Source: `.agents/project.yaml` → `environments.*`. These values were pre-filled in this project's config and were cross-referenced, not re-derived — none of the four URLs were probed with a live request in this session.

## Tools and Access

- Issue tracker: Jira — resolved via `[ISSUE_TRACKER_TOOL]` (`/acli`). Atlassian site: `https://upexgalaxy71.atlassian.net/` — Source: `.agents/project.yaml`
- Project key: BK
- Database: resolved via `[DB_TOOL]` (DBHub MCP, per-environment server names in `.agents/project.yaml`)
- Docs: no Confluence/Notion link found in either repo. The target repo ships its own `docs/` directory (onboarding HTML, `agentic-development-engineering.md`) — that documents the *agentic-dev-boilerplate framework*, not Bunkai's own product docs. **Discovery Gap** — no external product-docs tool identified.

## Access Checklist

- [x] Repository read access — confirmed (full read of target repo's code, migrations, and README this session)
- [ ] Database access (MCP or direct) — `db_mcp` server names are configured in `.agents/project.yaml` but were not invoked/tested this session (Phase 1 sub-steps 1/3/4 are read-only-on-code by design)
- [ ] Issue tracker access — Jira URL is configured; `ATLASSIAN_API_TOKEN` presence was not checked (`.env` was not read, per credential-handling rule — only `.env.example` key names are known)
- [ ] Staging environment reachable — not probed this session (no live HTTP request made)
- [ ] CI/CD visibility — **N/A**, no CI/CD exists in the target repo to have visibility into (see Discovery Gaps)

## Discovery Gaps

- [ ] No `.github/workflows/` in the target repo — there is no CI/CD pipeline today. If this is unexpected, confirm with the team whether builds/tests run somewhere else (e.g. Vercel's own build-on-push is the only automated gate observed, and that only builds — it doesn't run `bun run repo:check` or the test suite).
- [ ] No monitoring/observability library in `package.json` — error tracking and APM status unknown. Ask the team what (if anything) watches production.
- [ ] State-management pattern on the frontend was not verified — no global state library is declared, but component-level patterns were not read in depth this session.
- [ ] Staging/Production reachability, auth requirements (VPN, IP-allowlist, SSO) were not tested — first live QA session against these URLs should confirm.
- [ ] Docs/knowledge-base tool (Confluence, Notion, GitHub Wiki) — none identified. If the team uses one, it was not discoverable from the codebase alone.
- [ ] `ATLASSIAN_API_TOKEN` / Jira credential validity was not checked — only the key name is known from `.env.example`; actual `.env` values were intentionally not read this session.
