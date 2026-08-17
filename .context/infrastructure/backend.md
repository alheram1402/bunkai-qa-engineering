# Backend Infrastructure — Bunkai

> Generated: 2026-08-12 · Discovery method: read-only reverse-engineering of `upex-bunkai-tms` (`package.json`, `.env.example`, `lib/env.ts`, `lib/supabase/*.ts`, `middleware.ts`, `supabase/migrations/*.sql`, `cli/lib/variables-manifest.ts`, `.husky/pre-commit`, `.mcp.json`). `upex-bunkai-tms/.context/` was NOT read this session — every claim below cites a file this session opened directly. Extends `.context/SRS/architecture.md` §1/§7 rather than re-deriving stack facts already established there.
>
> **Phase Prioritization: Extended.** The target ships 132 `bun test` files with no wired `test` script in `package.json`, no CI/CD, and no pre-commit test gate (`.husky/pre-commit` runs `types:check` / `vars:check` / `skills:check` only — confirmed by reading the file, tests are absent from it). The "Test Execution" section below is deliberately more thorough than a standard Phase 3 pass to compensate — it is the primary reference downstream `/adapt-framework` and `/regression-testing` sessions will need until a real CI workflow exists.

---

## Runtime Environment

| Property | Value | Source |
|---|---|---|
| Runtime / package manager | Bun `1.3.5` (session's local `bun --version`) | `bun.lock` present; all `package.json` scripts invoke `bun`/`bunx` |
| Language | TypeScript `^5.9.3`, `strict: true` | `package.json`, `tsconfig.json` |
| Module system | ESM (`"type": "module"`) | `package.json:3` |
| `.nvmrc` / `.node-version` | **Not present** | `ls -la` on repo root |
| `engines` field in `package.json` | **Not present** — no pinned Node/Bun version range | `package.json` (no `engines` key) |
| `bunfig.toml` | **Not present** — Bun test runner uses 100% default behavior (no custom `[test]` config) | repo root listing |

**Discovery Gap**: no `.nvmrc`/`engines` means a fresh clone has no enforced minimum Bun version beyond "whatever `bun.lock`'s lockfile format implies." Recommend pinning `packageManager`/`engines.bun` if reproducibility becomes an issue.

---

## Package Scripts

Full `scripts` block, `package.json:7-43`:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local dev server (no `--turbo` flag → Webpack, not Turbopack — see `frontend.md` §Build Configuration) |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `typecheck` | `tsc --noEmit` | Type-check only |
| `setup` | `bun cli/doctor.ts --preflight && bun cli/install.ts` | First-time project bootstrap (this target repo is itself built on a sibling agentic-dev boilerplate — `cli/` is that tooling, not application code) |
| `setup:doctor` | `bun cli/doctor.ts` | Environment preflight checks |
| `agents:setup` | `bun scripts/agents-setup.ts` | Interactive `.agents/project.yaml` fill |
| `up` | `bun cli/update-boilerplate.ts` | Pull boilerplate updates |
| `onboarding` | `bun scripts/onboarding.ts` | Onboarding flow |
| `api:sync` | `bun scripts/sync-openapi.ts` | Pull generated OpenAPI spec into `api/schemas/` equivalent |
| `openapi:gen` | `bun scripts/openapi-gen.ts` | Generate OpenAPI spec from `lib/openapi/registry.ts` |
| `openapi:diff` | `bun scripts/openapi-diff.ts` | Diff spec against committed baseline |
| `vars:check` | `bun scripts/lint-vars.ts` | Lint `{{ VAR }}`-style template references |
| `vars:env:check` | `bun scripts/check-vars.ts` | Validate env var manifest consistency |
| `skills:check` | `bun scripts/lint-skills.ts` | Lint skill files |
| `skills:registry` / `skills:registry:check` | `bun scripts/build-skill-registry.ts [--check]` | Build/validate skill registry |
| `jira:sync-fields` / `jira:sync-workflows` / `jira:sync-issues` / `jira:sync-link-types` / `jira:check` | `bun scripts/sync-jira-*.ts` / `check-jira-setup.ts` | Jira integration tooling (dev/AI-agent side, not app runtime) |
| `format:fix` / `format:check` | `prettier --write/--check '**/*.{json,yml,yaml,css,scss,html}'` | Prettier (Note: does **not** cover `.ts`/`.tsx` — those are formatted via ESLint, see `lint:fix`) |
| `lint:check` / `lint:fix` | `eslint .` / `eslint --fix .` | ESLint (flat config, `@antfu/eslint-config`) |
| `types:check` | `tsc --noEmit` | Duplicate of `typecheck` (same command, two names) |
| `types:gen` | `bun scripts/gen-supabase-types.ts` | Regenerate `lib/types/supabase.ts` from live DB schema |
| `repo:check` | `format:check && lint:check && types:check && vars:check && vars:env:check && skills:check && skills:registry:check` | **The closest thing to a CI gate this repo has — and it does NOT include `bun test`.** |
| `repo:fix` | Same chain with `format:fix`/`lint:fix` | Auto-fix variant |
| `clean` | `rm -rf node_modules dist .next` | Clean build artifacts |
| `prepare` | `husky` | Installs git hooks |
| `claude` / `opencode` | `bash -c 'set -a; . ./.env; set +a; exec claude/opencode "$@"'` | Loads `.env` before launching the AI CLI (cross-platform alternative to direnv) |
| `env` | `set -a; source .env; set +a` | Shell helper to export `.env` into the current shell |

**No `test` script exists.** Confirmed absent from the `scripts` block above (Phase 1 finding, re-confirmed this session by reading `package.json` directly). See **Test Execution** below for the actual invocation.

---

## Core Dependencies

| Category | Package | Version | Purpose |
|---|---|---|---|
| Framework | `next` | `^15` | App Router, Route Handlers, Edge Middleware |
| UI runtime | `react` / `react-dom` | `^19` | — |
| Validation / schema | `zod` | `^4.4.3` | Request body validation, `lib/env.ts` env schema, `lib/openapi/registry.ts` source-of-truth |
| API-schema generation | `@asteasolutions/zod-to-openapi` | `^8.5.0` | Zod → OpenAPI 3 registry, consumed by `app/api/openapi/route.ts` |
| API docs UI | `@scalar/api-reference-react` | `^0.9.38` | Rendered at `app/api/docs/page.tsx` |
| DB client | `@supabase/ssr` | `^0.10.3` | Cookie-aware SSR client (`lib/supabase/server.ts`, `middleware.ts`) |
| DB client | `@supabase/supabase-js` | `^2.106.0` | Browser client (`lib/supabase/client.ts`) + admin/service-role client (`lib/supabase/admin.ts`) |
| ORM | **none** | — | Raw SQL migrations + hand-written `SECURITY DEFINER` RPC functions are the schema/business-rule authority (confirmed: no Prisma/TypeORM/Drizzle in `dependencies`) |
| Table/grid | `@tanstack/react-table` | `^8.21.3` | — |
| Drag-and-drop | `@dnd-kit/core`, `-sortable`, `-utilities` | `^6.3.1` / `^10.0.0` / `^3.2.2` | Module tree reorder, ATC chain reorder |
| Code editor | `@monaco-editor/react` | `^4.7.0` | — |
| Syntax highlighting | `shiki` | `^4.2.0` | — |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-sanitize` | `^10.1.0` / `^4.0.1` / `^6.0.0` | Author/render pipeline; `rehype-sanitize` is the render-side half of the sanitization pair documented in `architecture.md` §8 |
| Command palette | `cmdk` | `^1.1.1` | — |
| UI primitives | `@radix-ui/react-{dialog,dropdown-menu,tabs,tooltip}` | `^1.1.x` / `^2.1.x` | — |
| Toast | `sonner` | `^2.0.7` | — |
| CLI tooling (dev-side) | `@clack/prompts`, `@inquirer/prompts`, `boxen`, `cli-table3`, `figures`, `picocolors` | various | Used by `cli/`/`scripts/`, not app runtime |
| Linting | `eslint` `^9.28.0` + `@antfu/eslint-config` `^4.16.0` + `@next/eslint-plugin-next` `^16.2.6` | — | **Version note**: `@next/eslint-plugin-next` is pinned `^16.2.6` while the `next` runtime dependency itself is pinned `^15` — a one-major-version gap between the lint plugin and the framework it lints. Not verified to cause any actual lint failure this session; flagged as a Discovery Gap in case it produces false-positive/negative Next.js-specific lint rules. |
| Git hooks | `husky` `^9.1.7` + `lint-staged` `^16.2.7` | — | `.husky/pre-commit` |
| Formatting | `prettier` `^3.7.4` | — | JSON/YAML/CSS/HTML only (see Scripts table) |

---

## Environment Variables

Source: `.env.example` (repo root, ~30 declared keys across 7 sections) cross-checked against `grep -rhoE "process\.env\.[A-Z_0-9]+" app/ lib/ middleware.ts cli/ scripts/` and the runtime-enforced schema in `lib/env.ts`. **No values were read or copied — key names and formats only**, per Critical Rule #1/#8 of this repo and the doctrine cited in `.env.example`'s own header ("Never commit real values").

### Required (app throws at boot if missing — `lib/env.ts` Zod schema, `safeParse` + `throw` on failure)

| Key | Format (from `.env.example` comment) | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Also browser-exposed (`NEXT_PUBLIC_` prefix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable JWT | **Not declared in `.env.example`** — see "IMPORTANT gotcha" below |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role JWT, bypasses RLS | **Not declared in `.env.example`** — see gotcha below. Server-only (`server-only` import guard in `lib/env.ts`) |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` | Technically has a Zod `.default('http://localhost:3000')`, so the app *boots* without it, but every deployed env "must set it" per the schema's own comment — listed here rather than Optional for that reason |

### ⚠️ IMPORTANT GOTCHA — `.env.example` names do not match what `lib/env.ts` actually validates

This is a real, verified discrepancy — not a guess:

- `.env.example` (§"SUPABASE — Project Backend") declares only the **new-style** Supabase key names: `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`.
- `lib/env.ts` (the runtime Zod schema every server module imports through `@lib/env`) validates the **legacy-style** names instead: `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. Missing either throws `[bunkai/env] Invalid environment variables` at first import — the app will not boot.
- This is **not a bug** — `cli/lib/variables-manifest.ts:365-372` documents it explicitly as a deliberate vendor-coexistence period: Supabase's `Vercel↔Supabase` integration provisions **both** key pairs simultaneously (new + legacy), both remain valid "until the end of 2026," and the new-style pair is what `.mcp.json`'s Supabase MCP server bridge expects (`.mcp.json:16-19`: `SUPABASE_ANON_KEY: "${SUPABASE_PUBLISHABLE_KEY}"`, `SUPABASE_SERVICE_ROLE_KEY: "${SUPABASE_SECRET_KEY}"`).
- **Practical consequence for local dev**: copying only `.env.example`'s literal key list is insufficient — the app needs BOTH pairs present in `.env`. The `.env.example` file's own "TIP" (copy the full Vercel Quickstart snippet from the Supabase↔Vercel integration) already produces both pairs in one paste, which is why this has not surfaced as a reported bug.

### Optional (Zod `.optional()` — app boots without them, feature degrades gracefully)

| Key | Purpose | Behavior when absent |
|---|---|---|
| `SUPABASE_JWT_SECRET` | Verifies Supabase-issued JWTs for the Bearer-PAT impersonation path | PAT-authenticated requests needing `mintUserJwt` throw `internal_error` (per `architecture.md` §7) — a runtime 500 on that specific path, not a boot failure |
| `ATLASSIAN_URL` / `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` | Jira one-way Story import (`lib/jira/`) | Missing/invalid credentials surface as a failed import job (`errors[].code = jira_unauthorized`), never an app-boot error — explicit comment in `lib/env.ts:23-25` |

### External Service (not validated by `lib/env.ts` at all — declared in `.env.example` only, used by dev/AI tooling or unconfirmed at runtime)

| Key | Purpose | Runtime call site found? |
|---|---|---|
| `TAVILY_API_KEY` | Tavily web-search MCP | No — MCP-only (`.mcp.json`) |
| `SUPABASE_ACCESS_TOKEN` | Supabase MCP control plane (admin-scope: migrations, advisors) | No — MCP-only (`.mcp.json`), dev/AI tooling |
| `N8N_API_URL` / `N8N_API_KEY` | n8n workflow automation MCP | **No** — no `n8n` reference found in `app/`/`lib/` this session (matches `architecture.md` §7 Discovery Gap, carried forward) |
| `RESEND_API_KEY` | Transactional email | **No** `resend` SDK import found in `app/`/`lib/` this session — email may be delegated to Supabase Auth's own SMTP config outside this codebase, unconfirmed (carried from `architecture.md` §7) |
| `POSTGRES_HOST` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DATABASE` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` / `POSTGRES_PRISMA_URL` | Direct Postgres connection (pooled/non-pooled/Prisma-style) | **No** — no `process.env.POSTGRES_*` reference found anywhere in `app/`/`lib/`/`cli/`/`scripts/`. All DB access is via `@supabase/supabase-js`/`@supabase/ssr` client libraries, confirming `architecture.md` §9's "no application code connects via raw `POSTGRES_URL`" finding. Likely reserved for `[DB_TOOL]` (DBHub MCP, `dbhub.toml`) or direct psql access, not app code |
| `QA_E2E_USER_EMAIL` / `QA_E2E_USER_PASSWORD` | Dedicated non-production automation identity, logs in through the app's own `/login` path | No app runtime reference — consumed by this QA-engineering repo's own automation tooling, per `.env.example`'s comment pointing at `sprint-development/references/live-ui-identity.md` (a skill reference, not target-repo code) |
| `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` | New-style Supabase keys | Used by `.mcp.json`, `opencode.jsonc`, `cli/doctor.ts`, `cli/lib/variables-manifest.ts`, `cli/install.ts` — **MCP/CLI tooling only**, never read by `app/`/`lib/` runtime code (that reads the legacy names instead — see gotcha above) |

---

## Database Configuration

| Property | Value | Source |
|---|---|---|
| Type | PostgreSQL | `.env.example`, `dbhub.toml` |
| Provider | Supabase (managed) | `NEXT_PUBLIC_SUPABASE_URL` format, `dbhub.toml` header comment |
| ORM | None | No Prisma/TypeORM/Drizzle artifacts anywhere in the repo |
| Migration tool | Raw sequential `.sql` files under `supabase/migrations/` | Confirmed: **69 files** (`0001_tenancy.sql` … `0068_story_traceability_report.sql` + a `README.md`), re-counted this session (Phase 2's `architecture.md` said 68 — the discrepancy is the migrations-folder's own `README.md` being counted as a file in this session's `ls | wc -l`, not an actual +1 migration; the highest-numbered migration file is still `0068`) |
| `supabase/config.toml` | **Not present** | `cat supabase/config.toml` → no output, no such file |
| Business-rule layer | Hand-written `SECURITY DEFINER` PL/pgSQL RPC functions (e.g. `bunkai_create_run`, `bunkai_create_bug`, `bunkai_create_test`) enforce multi-table writes atomically, raising custom `45xxx` SQLSTATE codes on violation | `architecture.md` §1 (carried forward, not re-derived) |
| Row-Level Security | Enabled on every table | `architecture.md` §8 (carried forward) |
| Connection pooling | `.env.example` exposes `POSTGRES_URL` (pooled, port 6543) and `POSTGRES_URL_NON_POOLING` (direct, port 5432) — standard Supabase pgbouncer pattern — but **no application code connects via either** (see External Service table above); `dbhub.toml` documents QA should use the **session pooler (port 5432)** with a read-only role, explicitly avoiding the transaction pooler (6543) because it disallows prepared statements | `dbhub.toml` header comment |

### Migration Commands

**Discovery Gap** — no `supabase/config.toml`, no `db:migrate`/`db:push`/`db:reset` script in `package.json`, and no Supabase CLI invocation found in any `scripts/*.ts` file this session (`grep -rli "supabase db push\|supabase migration\|supabase link\|supabase start"` matched only two doc/skill files — `.agents/skills/supabase/SKILL.md` and `docs/agentic-development-engineering.md` — neither of which is target-repo application tooling). This means:

- There is no committed, repo-native command to apply the 69 migrations to a fresh database.
- The standard Supabase CLI pattern would apply (`supabase link --project-ref <ref>` then `supabase db push`, or `supabase start` for a fully local stack + `supabase db reset`), but this is **inferred from the Supabase platform convention, not confirmed from a script in this repo** — do not treat it as a copy-pasteable target-repo command.
- `types:gen` (`bun scripts/gen-supabase-types.ts`) regenerates `lib/types/supabase.ts` from a **live** DB schema — implying the expected workflow is "migrations are applied directly against a real (local or cloud) Supabase project via the Supabase CLI or dashboard, then this repo's own script pulls the resulting types," rather than this repo owning migration application itself.
- Seed mechanism: **not found**. No `supabase/seed.sql`, no `db/seeds/`, no seed script in `package.json`. `lib/tests/rls-isolation.test.ts` explicitly self-seeds and tears down its own fixture data at test time rather than relying on a pre-seeded DB state (see Test Execution below) — this is corroborating evidence that no repo-owned seed mechanism exists.

---

## Build Configuration

| Property | Value | Source |
|---|---|---|
| Framework config | `next.config.ts` | — |
| `reactStrictMode` | `true` | `next.config.ts:5` |
| `outputFileTracingRoot` | `path.resolve(import.meta.dirname)` | `next.config.ts:6` |
| `typedRoutes` | `true` | `next.config.ts:7` — typed `Link`/`router.push` targets |
| `images.remotePatterns` | `[]` (empty) — no external image domains allow-listed | `next.config.ts:8-10` |
| Output mode | Standard Next.js server build (`next build` → `next start`); **no `output: 'standalone'`** set | `next.config.ts` (key absent) |
| Bundler | Webpack (default) — `dev`/`build` scripts do not pass `--turbo`/`--turbopack` | `package.json:8-9` |

---

## Health Check Endpoints

| Endpoint | Method | Auth | Response shape | Source |
|---|---|---|---|---|
| `/api/v1/health` | `GET` | `public` (no auth required) | `{ ok: true, service: 'bunkai-tms', env: <local\|staging\|production>, ts: <ISO8601> }` | `app/api/v1/health/route.ts` (full file read this session — 10 lines, `export const dynamic = 'force-dynamic'` forces per-request evaluation, `getEnvironment()` from `lib/urls.ts` derives the reported env from `VERCEL_ENV`) |

No other `*health*`/`*ready*` route found in `app/api/`.

---

## Test Execution

> This section exists specifically to close the gap Phase 1 flagged: **132 `*.test.ts` files exist, but there is no `test` script in `package.json`, no CI/CD, and no pre-commit test gate.** Everything below is derived from reading actual test files and `bun test --help` — nothing here is invented.

### The actual invocation

```bash
bun test
```

That's it — no flags, no config file needed. Verified:

- **No `bunfig.toml`** exists at repo root → Bun's test runner uses its documented default file-discovery: it recursively scans the project (excluding `node_modules`) for files matching `*.test.{js,jsx,ts,tsx}` / `*_test.{js,jsx,ts,tsx}`, so **all 132 `*.test.ts` files are auto-discovered with zero configuration**.
- **All 132 test files import from `'bun:test'`** (`grep -rhoE "from '[a-z:@/-]+test[a-z-]*'" --include="*.test.ts" .` → every match is `from 'bun:test'`, no Jest/Vitest import found anywhere) — confirming Bun's built-in test runner (not a third-party runner shimmed through Bun) is the one and only test framework in use.
- `bun test --help` confirms the CLI contract used above: `bun test [flags] [<patterns>]`, with `--timeout`, `--coverage`, `--bail`, `-t/--test-name-pattern`, `--reporter=junit` (needs `--reporter-outfile`) all available for a future CI wiring.

### Running a subset

```bash
# All tests in one file
bun test lib/markdown/sanitize.test.ts

# All tests whose file path contains "atcs"
bun test atcs

# Only tests whose *name* matches a pattern
bun test --test-name-pattern "RLS isolation"

# JUnit output, for a future CI step
bun test --reporter=junit --reporter-outfile=./test-results.xml
```

### The DB-dependency split (important for anyone running this locally without Supabase credentials)

Of the 132 test files, **34 explicitly self-gate on live Supabase credentials** (`grep -rl "hasEnv\|describeOrSkip\|describe\.skip" --include="*.test.ts" . | wc -l` → 34). The pattern, read directly from `lib/tests/rls-isolation.test.ts` (34-line excerpt this session):

```ts
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const hasEnv = Boolean(url && anonKey && serviceKey && jwtSecret);
const describeOrSkip = hasEnv ? describe : describe.skip;
```

These DB-dependent suites (mostly RLS-isolation and RPC-parity tests under `lib/*/`) **self-seed their own fixtures via the service-role client and tear them down in `afterAll`** — there is no reliance on a pre-seeded database. When Supabase env vars are absent, `describe.skip` makes the whole suite report as skipped, not failed — so `bun test` is safe to run with **zero `.env` setup** and will still exercise the remaining ~98 pure-logic/unit suites (Zod validation, markdown sanitization, keyset-cursor pagination, `isProtected()` route gating, etc.) in full.

**This was not executed this session** — running `bun install` (no `node_modules/` present in the target repo at discovery time) or `bun test` was intentionally skipped to respect the read-only constraint on the target repo (installing dependencies is a filesystem write). `bun test --help` was run in isolation (prints usage only, touches no files) to confirm CLI flag syntax. Actually executing `bun install && bun test` to get a live pass/fail count is a **Discovery Gap** — first live QA/automation session should run it and record the baseline.

### What CI would need to run this (there is none today)

No `.github/workflows/` exists (confirmed: `find .github -type f` → no results, Phase 1 finding re-confirmed). A minimal workflow to close this gap would need, at minimum:

```yaml
# illustrative — not a committed file, no such workflow exists in the target repo
- uses: oven-sh/setup-bun@v2
- run: bun install
- run: bun run repo:check   # format:check, lint:check, types:check, vars:check, vars:env:check, skills:check, skills:registry:check
- run: bun test             # NOT currently part of repo:check — would need to be added explicitly
```

Two gaps stack here: (1) no CI/CD platform runs anything at all, and (2) even `repo:check` — the closest thing to a local "everything" gate, also run in `.husky/pre-commit` — **does not itself invoke `bun test`** (confirmed by reading `.husky/pre-commit` in full: it runs `lint-staged`, `types:check`, `vars:check`, `skills:check` only). Both were carried forward from Phase 1/2 and independently re-verified this session by opening the files directly.

---

## Local Development Setup

```bash
# 1. Clone and enter the repo
git clone https://github.com/upex-galaxy/upex-bunkai-tms.git
cd upex-bunkai-tms

# 2. Install dependencies (Bun only — no npm/yarn/pnpm lockfile present)
bun install

# 3. Set up environment
cp .env.example .env
# Edit .env — minimum viable set to boot the app locally:
#   NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<legacy anon key — NOT listed in .env.example, see backend.md gotcha above>
#   SUPABASE_SERVICE_ROLE_KEY=<legacy service-role key — NOT listed in .env.example, see gotcha above>
#   NEXT_PUBLIC_APP_URL=http://localhost:3000
# Recommended: also copy SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY from the same
# Vercel Quickstart snippet (.env.example's own "TIP") — the Supabase<->Vercel
# integration provisions BOTH key pairs at once, and the MCP tooling (.mcp.json)
# reads the new-style pair while the app itself reads the legacy pair.

# 4. Database
# No repo-native migration-apply command exists (Discovery Gap — see "Migration
# Commands" above). Standard Supabase-platform pattern (NOT a confirmed target-repo
# script):
#   supabase link --project-ref <your-project-ref>
#   supabase db push        # applies supabase/migrations/*.sql (69 files) to the linked project
# No seed script exists — DB-dependent tests self-seed their own fixtures (see
# Test Execution above), so an empty-but-migrated database is a valid starting state.

# 5. Start the development server
bun run dev
# -> http://localhost:3000 (Webpack, not Turbopack — no --turbo flag in the dev script)

# 6. Verify the app booted
curl http://localhost:3000/api/v1/health
# -> {"ok":true,"service":"bunkai-tms","env":"local","ts":"<ISO8601>"}

# 7. Run the test suite (132 bun:test files, zero config needed)
bun test
# 34 of the 132 files self-skip (describe.skip) any suite requiring live Supabase
# credentials when NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY /
# SUPABASE_JWT_SECRET are absent from the environment — the remaining ~98
# pure-logic suites always run. With a full .env in place, all 132 run for real.

# 8. Repo health gate (what pre-commit runs, plus format/lint fix variants)
bun run repo:check   # format:check + lint:check + types:check + vars:check + vars:env:check + skills:check + skills:registry:check
                      # NOTE: does not include `bun test` — see Test Execution above
```

---

## Discovery Gaps

- [ ] No `.nvmrc`/`engines` field pinning a minimum Bun version — a fresh clone has no enforced floor beyond what `bun.lock`'s format implies.
- [ ] `@next/eslint-plugin-next` is pinned `^16.2.6` while the `next` runtime dependency is pinned `^15` — a one-major-version gap between the lint plugin and the framework it lints against. Not confirmed to cause an actual lint discrepancy this session.
- [ ] No repo-native migration-apply command (`db:push`/`db:migrate`/`supabase db push` wrapper) exists in `package.json` or `scripts/`. The standard Supabase CLI pattern is inferred from platform convention, not confirmed from a target-repo script — flagged rather than presented as a real command.
- [ ] No seed script exists. DB-dependent tests self-seed/tear-down their own fixtures, which is corroborating (not conclusive) evidence no separate seed mechanism is expected.
- [ ] `bun install && bun test` was not actually executed this session (target repo has no `node_modules/`, and installing one is a filesystem write against a repo marked read-only for this discovery). The pass/fail baseline for the 132 tests is therefore unconfirmed — first live session should run it and record results.
- [ ] `N8N_API_URL`/`N8N_API_KEY` and `RESEND_API_KEY` are declared in `.env.example` with no runtime call site found in `app/`/`lib/` — carried forward from `architecture.md` §7, not independently resolved this session.
- [ ] Pool size / connection-pooling configuration for `POSTGRES_URL` is not independently configured anywhere in application code (all DB access goes through Supabase client libraries) — carried forward from `architecture.md` §9.
