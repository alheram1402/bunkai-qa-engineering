# Comments for BK-14

[View in Jira](https://jira.upexgalaxy.com/browse/BK-14)

---

### Ely - 5/19/2026, 6:54:30 PM

1. 🧱 Architect Annotation

1. 

- ****DB****: new table `user*stories` (id uuid pk, module*id uuid fk -> modules, title varchar(200), description text, external*id text nullable, external*url text nullable, status text default 'draft', created*at, updated*at, deleted*at). Indexes: `(module*id, deleted*at)`, partial unique `(project*id, upper(external*id)) WHERE external*id IS NOT NULL` — project_id derived via module join (materialize as denormalized column to keep unique constraint local).
- ****API surface****: `POST /api/user-stories`, `GET /api/user-stories/:id`, `GET /api/modules/:module*id/user-stories`, `PATCH /api/user-stories/:id`, `DELETE /api/user-stories/:id`. Return shape `{ user*story: UserStory }`. Status codes 200/201/403/404/409/422.
- ****Server validation****: Zod schemas `UserStoryCreateSchema`, `UserStoryUpdateSchema`. Length checks via `.min(3).max(200)` for title, byte-length check for description via `Buffer.byteLength(value, 'utf8') <= 51200`. `external_id` validated against `/^[A-Z]-\d$/` and normalized to uppercase before persist.
- ****RLS****: row-level policy joins `user*stories -> modules -> projects -> workspace*members` to enforce caller membership. PATCH/DELETE require same RLS path.
- ****Client****: form is a server component with a client-side react-hook-form island. PATCH treats `external_id` as immutable when previous value is non-null (server enforces 409; client disables field).
- ****Performance****: list endpoint paginates by `(module*id, created*at desc)` with default page size 50.

1. 

- Upstream: ****BK-7***** "Project & Module Hierarchy" (modules table must exist), *****BK-1..BK-6**** "Tenancy & Identity" (workspace membership + RLS plumbing).
- Downstream: ****BK-15***** "Acceptance Criterion CRUD" depends on `user*stories.id`. *****BK-17***** "Jira import" upserts into this same table via `external*id`. *****BK-16**** "Markdown editor" feeds the `description` field through its sanitizer.
- External: none beyond Supabase Postgres + Next.js route handlers.

1. 

- [ ] Supabase migration applied + verified reversible via `supabase db reset`
- [ ] OpenAPI updated; `bun run api:sync` regenerates client types without diff noise
- [ ] Unit tests cover happy path, RLS rejection, external_id regex, immutability, soft-delete filtering (≥80% branch coverage)
- [ ] Integration test verifies cross-workspace insert is rejected
- [ ] `bun run lint` + `bun run typecheck` pass
- [ ] Manual smoke: create a Story under a Module via the SPA, verify it lists under that Module only
- [ ] PR description cross-references each AC by Gherkin scenario name

1. 

- PRD: `.context/PRD/mvp-scope.md` § EPIC-BK-003 / US 3.1
- SRS: `.context/SRS/functional-specs.md` § FR-007
- Business map: `.context/business/business-data-map.md` § user_stories entity
- API contract: `.context/SRS/api-contracts.yaml` § `/api/user-stories`

---

### Ely - 6/4/2026, 8:37:11 PM

## Ready For QA — [https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14](https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14) (Manage user stories anchored to a module)

Merged to staging and deployed. Ready for testing on staging.

### Links

- PR: [https://github.com/upex-galaxy/upex-bunkai-tms/pull/13](https://github.com/upex-galaxy/upex-bunkai-tms/pull/13) (merged)
- Staging: [https://staging-upexbunkai.vercel.app](https://staging-upexbunkai.vercel.app/) — deploy READY
- Merge commit: 8a19b1f

### What shipped

- Per-module "New User Story" action in the project tree; per-story edit and remove actions on the story rows.
- The story form takes a title, a Markdown description (the [https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16](https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16) editor, up to 50 KB, sanitized), and an optional Jira key. The Jira key is locked once set.
- Stories that are removed are archived (hidden from the module's default list, retained).

### As-built contract (observable)

- Create: POST /api/v1/modules/{moduleId}/user-stories. List: GET same path. Single + edit + remove: GET/PATCH/DELETE /api/v1/user-stories/{id}.
- Title required, 3–200. Jira key must read as LETTERS-NUMBER (e.g. [https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42](https://jira.upexgalaxy.com/browse/BK-42#icft=BK-42)), unique per project (case-insensitive), immutable once set (409). Description Markdown ≤ 50 KB. Removing archives (409 on re-remove).

### Suggested QA focus

- Create a story under a module with title + Markdown description → appears in that module's list; preview renders the Markdown.
- Title "Re" (2 chars) → rejected ("at least 3 characters").
- Link a story to "BK-42"; try linking a second story in the same project to "BK-42" → rejected (already linked). Try "bk-42" (case) → same conflict.
- Malformed key "not a key" → rejected.
- Edit a story whose key is set → the key field is locked.
- Remove a story → it leaves the module's list.

### Notes / known follow-ups

- The Jira key shows as a visible reference but is not yet a clickable hyperlink (no Jira base URL is configured app-side) — follow-up.
- "Re-import updates instead of duplicating" is [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) (Jira import); [https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14](https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14) stores the key + provides the uniqueness index that enables it.
- The story description is shown via the editor's preview; a dedicated read-only story detail view arrives with later work.

---

### Nahuel Gomez - 6/30/2026, 8:14:37 PM

## QA Automation Session — Complete Report (2026-06-30)

### Tally

| ***Ticket**** | ****Tests**** | ****Status*** |
| --- | --- | --- |
| [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166) | 8 | ✅ PASS |
| [https://jira.upexgalaxy.com/browse/BK-4#icft=BK-4](https://jira.upexgalaxy.com/browse/BK-4#icft=BK-4) | 4 | ✅ PASS |
| [https://jira.upexgalaxy.com/browse/BK-8#icft=BK-8](https://jira.upexgalaxy.com/browse/BK-8#icft=BK-8) | 4 | ✅ PASS |
| [https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17](https://jira.upexgalaxy.com/browse/BK-17#icft=BK-17) | 6 | ✅ PASS |
| [https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14](https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14) | 5 | ✅ PASS |
| [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18) (prev) | 17 | ✅ PASS |
| ***Total**** | ****44 + 1 fixme*** |  |

### Infrastructure changes

- ***loginEndpoint**** fixed: `/auth/login` → `/api/v1/auth/signin`. The old endpoint 404s ([https://jira.upexgalaxy.com/browse/BK-177#icft=BK-177](https://jira.upexgalaxy.com/browse/BK-177#icft=BK-177)). The [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166) endpoint works. ****Integration project is now unblocked.***
- ***AuthApi*** updated to use sign-in PAT (not session token) for API auth — matches [https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166](https://jira.upexgalaxy.com/browse/BK-166#icft=BK-166) coexistence pattern.
- ***meEndpoint*** fixed to `/api/v1/me` (actual path).
- ***auth.types.ts*** updated to match real API response shapes.
- ***jira-attach-evidence.ts*** script created for attaching screenshots to Jira tickets via REST API.

### CI/CD

- All tests pass in sandbox project. Allure reports at:

[https://nelgoez.github.io/bunkai-qa-engineering/staging/sanity/](https://nelgoez.github.io/bunkai-qa-engineering/staging/sanity/)

### Known gaps (unchanged)

- [https://jira.upexgalaxy.com/browse/BK-150#icft=BK-150](https://jira.upexgalaxy.com/browse/BK-150#icft=BK-150) 403 scope test — blocked on restricted-scope PAT
- Sandbox → `.test.ts` promotion — now feasible since api-setup works
- Nightly regression doesn't include sandbox tests yet (PR gate + manual only)

### Next-step candidates

| ***Priority**** | ****Ticket**** | ****Summary**** | ****Est. time*** |
| --- | --- | --- | --- |
| 1 | [https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182](https://jira.upexgalaxy.com/browse/BK-182#icft=BK-182) | Bearer run can't resolve active workspace | ~15 min |
| 2 | [https://jira.upexgalaxy.com/browse/BK-22#icft=BK-22](https://jira.upexgalaxy.com/browse/BK-22#icft=BK-22) | ATC "Used in N tests" report | ~15 min |
| 3 | [https://jira.upexgalaxy.com/browse/BK-57#icft=BK-57](https://jira.upexgalaxy.com/browse/BK-57#icft=BK-57) | PATCH /modules/{id} atomicity | ~20 min |
| 4 | [https://jira.upexgalaxy.com/browse/BK-36#icft=BK-36](https://jira.upexgalaxy.com/browse/BK-36#icft=BK-36) | Abort a run in progress | ~20 min |

---

### Nahuel Gomez - 7/6/2026, 4:59:02 PM

1. 

****Verdict: PASSED WITH FINDINGS****

1. 

- ****8/9 API tests PASSED**** — CRUD, validation boundaries, Jira key linking, duplicate rejection, soft-delete
- ****3/3 UI tests PASSED**** — Edit form renders, Markdown editor ([https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16](https://jira.upexgalaxy.com/browse/BK-16#icft=BK-16)) present, Jira key field visible
- ****Prior automation (30 Jun):**** 5/5 PASSED

1. 

1. 

- AC1 (Create): ✅ | AC2 (Short title): ✅ | AC3 (Jira link): ✅
- AC4 (Malformed key): ✅ | AC5 (Duplicate): ✅ | AC6 (Archive): ✅
- Boundary: ✅ | Security: ✅ | State transitions: ✅

1. 

1. 

---

### Nahuel Gomez - 7/6/2026, 5:50:38 PM

1. 

Allure report from QA automation session covering 5 API tests for [https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14](https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14):

[https://nelgoez.github.io/bunkai-qa-engineering/staging/sanity/](https://nelgoez.github.io/bunkai-qa-engineering/staging/sanity/)

All 5 tests PASSED. Tests validated: create story, title validation, Jira key link, duplicate key rejection, soft-delete.

---

### Nahuel Gomez - 7/10/2026, 6:01:21 PM

## [https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14](https://jira.upexgalaxy.com/browse/BK-14#icft=BK-14) — QA Close-out

***Verdict:*** QA Approved ✅
***ATP:*** 23 test outlines. See local PBI folder for full detail.
***QA Framework:*** Playwright JavaScript (field blocked by QA Approved screen — set when editable)

***Handing off to Ely for release triage.***

---

### Nahuel Gomez - 7/22/2026, 7:09:06 PM

## QA Automation — Sandbox Promoted to KATA Component

***UserStoriesApi*** component created — 5 ATCs refactored from raw `api.apiPOST()` calls to proper KATA component methods.

### Tests (5/5 ✅)

- Create user story → 201
- Title < 3 chars → 422
- Empty body → 422
- Unauthenticated → 401
- Non-existent module → 404

### ATC Count

32 → 37 (+5 UserStoriesApi methods)

---


_Synced from Jira by sync-jira-issues_
