# Frontend Infrastructure — Bunkai

> Generated: 2026-08-12 · Discovery method: read-only reverse-engineering of `upex-bunkai-tms` (`next.config.ts`, `middleware.ts`, `app/layout.tsx`, `app/(auth)/login/*`, `app/auth/*`, `public/`, `tsconfig.json`, `package.json`). `upex-bunkai-tms/.context/` was NOT read this session. Extends `.context/SRS/architecture.md` §8 (Security Architecture / Auth) rather than re-deriving the auth model from zero — this file adds the concrete integration-point detail `/adapt-framework` needs to wire fixtures against.

---

## Build Configuration

| Property | Value | Source |
|---|---|---|
| Framework | Next.js `^15`, App Router | `package.json`, `app/` directory structure (no `pages/` dir found — single routing model, no migration-era coexistence) |
| Bundler | **Webpack (default)** — not Turbopack | `package.json` `dev`/`build` scripts are plain `next dev` / `next build`, no `--turbo`/`--turbopack` flag |
| Output mode | Server-rendered (SSR) + Server Components by default; no `output: 'standalone'` | `next.config.ts` (key absent) |
| TypeScript | `strict: true`, `target: ES2022`, `moduleResolution: bundler`, `jsx: preserve` | `tsconfig.json` |
| Path aliases | `@/*` → `./*`, `@app/*` → `./app/*`, `@components/*` → `./components/*`, `@lib/*` → `./lib/*` | `tsconfig.json` `compilerOptions.paths` |
| Typed routes | `typedRoutes: true` | `next.config.ts:7` |
| `reactStrictMode` | `true` | `next.config.ts:5` |
| Custom webpack/plugin additions | None found | `next.config.ts` is 13 lines total, no `webpack()` function override |

### `next.config.ts` (full file, 13 lines — reproduced verbatim since it's this short)

```ts
import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  typedRoutes: true,
  images: {
    remotePatterns: [],
  },
};

export default config;
```

---

## Client Environment Variables

`grep -rhoE "NEXT_PUBLIC_[A-Z_]+" app/ components/ lib/ middleware.ts` → exactly 3 distinct keys browser-exposed:

| Key | Purpose | Consumer |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `lib/supabase/client.ts`, `middleware.ts`, `lib/env.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/RLS-scoped key | `lib/supabase/client.ts`, `middleware.ts`, `lib/env.ts` — **note**: `.env.example` does not declare this exact key name; see `backend.md` §Environment Variables gotcha for the full explanation (new-style vs. legacy-style Supabase key coexistence) |
| `NEXT_PUBLIC_APP_URL` | Base URL for auth redirects / OAuth callbacks / invite links | `lib/env.ts` (Zod-validated, defaults to `http://localhost:3000`) |

**Security check** (per doctrine — scan for secret-looking names inside the public prefix): none found. All three `NEXT_PUBLIC_*` names are appropriately browser-safe (URL, anon/RLS-scoped key, app base URL) — no `NEXT_PUBLIC_*_SECRET`/`NEXT_PUBLIC_*_SERVICE_ROLE` pattern exists anywhere in the codebase.

**Static-access requirement** (documented in `lib/env.ts`'s own header comment, worth carrying into any test-fixture design): Next.js inlines `NEXT_PUBLIC_*` vars only via **static** member access (`process.env.NEXT_PUBLIC_X`); dynamic access (`process.env[name]`) resolves to `undefined` in the browser bundle. `lib/supabase/client.ts` reads them statically for exactly this reason and explicitly avoids importing `@lib/env` (which also touches the service-role key) into browser code.

### Environment-Specific Values

| Environment | `NEXT_PUBLIC_APP_URL` (from `lib/urls.ts` `APP_URLS` map) | Detection mechanism |
|---|---|---|
| Local | `http://localhost:3000` | Default when `VERCEL_ENV` is unset |
| Staging (Vercel preview) | `https://staging-upexbunkai.vercel.app` | `VERCEL_ENV === 'preview'` → mapped to `'staging'` |
| Production | `https://upexbunkai.vercel.app` | `VERCEL_ENV === 'production'` |

Source: `lib/urls.ts` (full file read this session, 45 lines) — `getEnvironment()` reads Vercel's own system env var `VERCEL_ENV` (available server- and client-side without needing a `.env` declaration), not a custom app env var. These three URLs match `.agents/project.yaml` → `environments.*` exactly (cross-checked, no drift).

---

## Static Assets

```
public/
└── openapi.json          # generated OpenAPI spec, served statically (not app/api/openapi/route.ts's live-generated version — a checked-in snapshot)

app/                       # Next.js App Router convention: icon/favicon files live IN app/, not public/
├── icon.png
├── icon.svg
├── apple-icon.png
```

**Note**: `public/` contains only `openapi.json` — no `favicon.ico`, `robots.txt`, `sitemap.xml`, `manifest.json`, fonts, or locale files were found there. This is not a gap — Next.js's App Router convention resolves `favicon`/`icon`/`apple-icon` from special files directly under `app/` (found: `app/icon.png`, `app/icon.svg`, `app/apple-icon.png`), and no `robots.ts`/`sitemap.ts`/`manifest.ts` special files were found under `app/` either (confirmed: `find app -maxdepth 1 -type f` returned only `icon.png`, `apple-icon.png`, `icon.svg`, `layout.tsx`, `page.tsx`, `globals.css`).

### Image Handling

| Setting | Value | Source |
|---|---|---|
| `next/image` remote domains | `[]` (empty — no external image sources allow-listed) | `next.config.ts:8-10` |
| Custom loader | None found | — |
| Format optimization (AVIF/WebP) | Next.js default (`next/image` auto-negotiates), no explicit `formats` override in config | `next.config.ts` (key absent) |

---

## Code Splitting Strategy

| Signal | Count | Detail |
|---|---|---|
| `next/dynamic` usage | 2 files | `grep -rl "next/dynamic" app/ components/` — limited, most components load eagerly |
| `React.lazy` | Not searched separately — App Router's own per-route code-splitting (each `page.tsx`/`route.ts` is its own chunk) is the dominant splitting mechanism, not manual `lazy()` |

---

## Bundle Size Notes

**Discovery Gap** — no `@next/bundle-analyzer` or equivalent (`webpack-bundle-analyzer`, `rollup-plugin-visualizer`) found in `package.json` dependencies, and no `ANALYZE=true` env-gated config branch in `next.config.ts`. Bundle size has not been measured by this repo's own tooling; if it matters for a performance budget, it needs to be added (`@next/bundle-analyzer` is the standard Next.js-native option) before it can be tracked.

---

## Performance Configuration

| Aspect | Configuration | Source |
|---|---|---|
| Font optimization | `next/font/google` — `Inter`, `JetBrains_Mono`, `Noto_Serif_JP` | `app/layout.tsx:2` (self-hosted, preloaded by Next's font optimizer; no `@fontsource/*` or manual `<link>` font loading) |
| Image optimization | `next/image` with empty `remotePatterns` (only local/same-origin images optimized) | `next.config.ts` |
| Prefetching | Next.js App Router default (`<Link>` auto-prefetch on viewport entry) — no custom override found | — |
| Script optimization | Not independently verified — no `next/script` usage grep run this session | **Discovery Gap** |
| Core Web Vitals measurement | No `web-vitals` package, Lighthouse CI config, or Sentry Performance found in `package.json` | Matches `architecture.md` §10's "no monitoring/observability tool detected" finding |

---

## SEO Configuration

| Property | Value | Source |
|---|---|---|
| `metadata.title` | `'Bunkai — Test Management System'` | `app/layout.tsx:26` |
| `metadata.metadataBase` | `new URL('http://localhost:3000')` | `app/layout.tsx:29` — **hardcoded to localhost, not derived from `NEXT_PUBLIC_APP_URL`/`lib/urls.ts`'s environment-aware `getBaseUrl()`**. Flagged below as a Discovery Gap: OG-image and canonical-URL resolution in staging/production builds may silently resolve against `localhost:3000` rather than the deployed domain, unless overridden per-page. |
| `robots.ts` / `sitemap.ts` special files | Not present under `app/` | `find app -maxdepth 1 -type f` (see Static Assets above) |
| OG image | Not independently verified (`opengraph-image.*` special file not searched for explicitly) | **Discovery Gap** |

---

## Browser Support / Polyfills

**Discovery Gap** — no `browserslist` config in `package.json`, no explicit polyfill package (`core-js`, etc.) in dependencies. Next.js 15's default target (modern evergreen browsers, automatic differential loading) applies with no project-specific override found.

---

## Routing + State + Auth Integration Points

> This is the section `/adapt-framework` will lean on most heavily per the skill's own doctrine ("Auth flow is the single most important input for downstream `/adapt-framework`") — captured as concretely as this session's file reads allow.

### Router

Next.js **App Router only** — `app/(app)/*` (authenticated route group: projects, ATCs, tests, runs, bugs, milestones, settings — 31 `page.tsx` files, 67 `route.ts` API handlers total across the app), `app/(auth)/*` (`/login`), plus `app/about`, `app/qa` (public marketing/teaching pages) and `app/invites/accept`. No `pages/` directory exists — no legacy-router coexistence to account for.

### State management

No global state library declared (`grep -E "zustand|redux|jotai|recoil|swr|@tanstack/react-query|react-query" package.json` → zero matches). Component-local `useState`/`useReducer` plus Next.js Server Components/Server Actions is the inferred pattern — **not verified by reading component internals this session**, carried forward as a Discovery Gap from `architecture.md`/`project-config.md`.

### Data fetching

No TanStack Query / SWR / Apollo / Relay / RTK Query dependency found. Client components call the app's own `/api/v1/*` routes via native `fetch()`; Server Components/Server Actions call `lib/<domain>/` service modules directly (per `architecture.md` §3/§6).

### Auth client — the concrete mechanism (read directly from source this session)

**Session transport**: HTTP-only cookies managed entirely by `@supabase/ssr`. Three separate Supabase client constructors exist, each scoped to its execution context — this three-way split is itself a fixture-design signal:

| Client | File | Context | Auth |
|---|---|---|---|
| `createClient()` | `lib/supabase/client.ts` | Browser (Client Components) | `createBrowserClient` — reads `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` via static `process.env` access; module-level singleton (`cached`) to avoid duplicate `GoTrueClient` instances under React Strict Mode double-mount |
| `createClient()` | `lib/supabase/server.ts` | Server Components / Route Handlers / Server Actions | `createServerClient` — reads cookies via `next/headers` `cookies()`; write-back wrapped in try/catch because Server Components cannot set cookies (only Route Handlers/Server Actions can — the middleware is what actually persists the refreshed session) |
| `createAdminClient()` | `lib/supabase/admin.ts` | Server-only, privileged (test seeding, admin operations) | Uses `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS entirely; `persistSession: false`, `autoRefreshToken: false` |

**Middleware gate** (`middleware.ts`, full 62-line file read this session):

- `PROTECTED_PREFIXES = ['/home', '/projects', '/onboarding', '/settings', '/activity']` — exported (not module-private) specifically so `middleware.test.ts` can assert the gate directly without a full `NextRequest`/`NextResponse` round-trip.
- `PUBLIC_PREFIXES = ['/login', '/auth', '/api/auth']` — explicitly bypassed even if they'd otherwise match a protected prefix.
- `isProtected(pathname)`: exact match or prefix match (`pathname === prefix || pathname.startsWith(prefix + '/')`).
- The file's own inline comment is a hard operational warning: **"do not run any logic between `createServerClient` and `getUser()`; doing so risks the session not being refreshed before route logic runs."** — a real footgun for anyone modifying this file, worth preserving in any adapted fixture.
- Unauthenticated visits to a protected, non-public path redirect to `/login?next=<original-path-and-query>`.
- `config.matcher`: `['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']` — runs on every request except Next internals, the favicon, and any path containing a dot (static files).
- **API routes are self-gated, not middleware-gated**: `/api/v1/*` is not in `PROTECTED_PREFIXES`; each Route Handler enforces its own auth via `withApiHandler(..., { auth: 'required' | 'public' })` (`architecture.md` §4/§6) — the middleware's job is purely session-cookie refresh + UI-route redirect.

**Login flow** (email-first, multi-step — `app/(auth)/login/*`, files confirmed present this session: `email-first-form.tsx`, `magic-link-form.tsx`, `magic-link-disclosure.tsx`, `oauth-buttons.tsx`, `login-error-toast.tsx`, `page.tsx`):

1. User enters email → `POST /api/v1/auth/check-email` → a service-role RPC (`auth_email_status`) determines `{exists, confirmed}` **without** going through GoTrue directly (deliberately bypasses GoTrue's own rate-limiting, per `architecture.md` §7/§8 — an accepted, documented enumeration tradeoff with its real mitigation "not yet shipped").
2. Branches: existing+confirmed → password field renders, `POST /api/v1/auth/signin` (`signInWithPassword`); existing+unconfirmed → OTP verify step; new → signup step.
3. OAuth path: `app/auth/oauth/[provider]/route.ts` (GitHub, Google) + `app/auth/callback/route.ts` for the exchange.
4. On success: session cookie set, client-side `router.push(next ?? '/projects')` — the `next` query param is validated through `safeInternalPath()` (`lib/urls.ts`), an open-redirect guard that only accepts root-relative in-app paths, shared by the login form, OTP callback, and magic-link route so the guard logic cannot drift between the three consumers.

**Secondary auth (machine/CLI/AI-agent)**: Bearer Personal Access Tokens, format `bk_pat_<prefix>.<secret>` — not a browser/UI concern, but relevant for any API-level test fixture (`architecture.md` §7/§8 has the full detail: SHA-256 hash storage, scope model, `resolveIdentity()` unification).

### Test-ID strategy

**Already established in the codebase** — `data-testid` is the convention in active use: `grep -rl "data-testid" app/ components/ lib/` → **84 files**, including high-traffic surfaces (`app/(app)/projects/page.tsx`, `create-project-form.tsx`, `atc-search-filter.tsx`, `create-environment-form.tsx`, `create-module-form.tsx`, `import-from-jira-dialog.tsx`, `project-shell.tsx`, and more). No `data-cy` or other selector-library convention found. **This is a strong, ready-to-use signal for `/adapt-framework`** — Page-object locators built against this target should prefer `data-testid` selectors first, matching the project's own established pattern, rather than introducing a new selector convention.

---

## Discovery Gaps

- [ ] State-management pattern was not verified by reading component internals — only confirmed no global state library is a dependency. Carried forward from `project-config.md`.
- [ ] `app/layout.tsx`'s `metadata.metadataBase` is hardcoded to `new URL('http://localhost:3000')` rather than derived from `lib/urls.ts`'s environment-aware `getBaseUrl()` — OG-image/canonical-URL metadata resolution in staging/production may resolve against the wrong origin unless individually overridden per-page. Not confirmed whether any page does override it.
- [ ] Script optimization (`next/script` usage, loading strategies) not independently grepped this session.
- [ ] OG image (`opengraph-image.*` special file) presence/absence not explicitly checked.
- [ ] Bundle size has never been measured — no analyzer tooling present.
- [ ] Browser support target relies entirely on Next.js 15 defaults — no explicit `browserslist` to confirm against.
