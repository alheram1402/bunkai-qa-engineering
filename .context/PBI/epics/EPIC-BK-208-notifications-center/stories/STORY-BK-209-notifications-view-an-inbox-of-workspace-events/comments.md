# Comments for BK-209

[View in Jira](https://jira.upexgalaxy.com/browse/BK-209)

---

### Ely - 7/11/2026, 9:52:24 AM

## PO Ratification — 2026-07-11

- N1 — Notification retention is ratified at 90 days, after which notifications are auto-purged regardless of read state. The Business Rules field already reflects this value; no change needed.
- N2 — The unread badge caps its display at "99+". Already reflected in the Business Rules field; no change needed.

---

### yxsinell acosta zambrano - 7/11/2026, 10:03:44 AM

Trabajo en esta US 🤓 

---

### yxsinell acosta zambrano - 7/15/2026, 11:58:24 AM

## Acceptance Test Plan (ATP) - Shift-Left DRAFT ready for review

ATP DRAFT lives in the Acceptance Test Plan (ATP) field.

Key Phase 2 findings:

- 34 outline-level ATP checks identified.
- Main blocker: top-bar notification entry point conflicts with current sidebar shell evidence.
- Main risk: notification metadata must not leak inaccessible workspace/entity data.
- PO/Dev/Design questions are included in the ATP field and local refinement artifact.

---

### yxsinell acosta zambrano - 7/15/2026, 10:36:16 PM

## PO Answers - [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) Open Questions

***Original Question:*** Should [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) count and display notifications for the active workspace only, or across all workspaces?

***Answer:*** Active workspace only. Bunkai already uses active workspace as the operating context; mixing workspaces in one inbox increases confusion and data-leak risk.

***Original Question:*** Should loss of access hide old notifications entirely, or keep redacted rows with no entity metadata?

***Answer:*** Hide them entirely. If the user no longer has access, the product should not reveal that an entity or event exists.

***Original Question:*** What exact copy should appear for deleted or unavailable target entities?

***Answer:*** Use: "This item is no longer available." If the target is inaccessible, do not show entity-specific metadata. If it was deleted but still belongs to an accessible context, the original notification summary may remain.

***Original Question:*** Should retention purge run exactly after 90 days, or can notifications on day 90 remain until the next scheduled cleanup?

***Answer:*** Day 90 remains visible; day 91 is outside retention. The purge can run asynchronously, but UI/API visibility must apply the 90-day filter.

***Original Question:*** Is mark-all-as-read scoped to active workspace only?

***Answer:*** Yes. Mark-all affects only visible notifications in the active workspace. Hidden or inaccessible notifications must not be mutated by that action.

---

### yxsinell acosta zambrano - 7/15/2026, 10:36:16 PM

## Dev Answers - [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) Open Questions

***Original Question:*** Will [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) create a dedicated notifications table with per-recipient read state, or derive notifications from activity_log plus user-specific state?

***Answer:*** Create dedicated notification storage for recipient delivery and read-state. activity_log can feed events, but it should not be the only source because it does not model personal delivery, read/unread state, retention visibility, or per-recipient copies cleanly.

***Original Question:*** Which endpoint(s) will support list, mark-one-read, and mark-all-read?

***Answer:*** Use GET /api/v1/workspaces/{id}/notifications, POST /api/v1/notifications/{id}/read, and POST /api/v1/workspaces/{id}/notifications/read-all. All must be RBAC/RLS-safe and non-disclosing.

***Original Question:*** What is the route map for deep links by entity type: run, bug, test?

***Answer:*** Run: /projects/{projectSlug}/runs/{runId}. Test: /projects/{projectSlug}/tests/{testId}. Bug: route depends on the [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) Bugs & Defect Heatmap implementation; Dev must define the final bug route before this story reaches Ready For QA.

***Original Question:*** How will sibling event producers seed notification test data before they are fully implemented?

***Answer:*** Provide a seed/factory path that creates notifications directly for QA and automated tests. [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) should not be blocked by sibling event producers being unfinished.

***Original Question:*** How will retention be implemented: scheduled purge, query filter, or both?

***Answer:*** Both. API queries must filter out notifications older than 90 days, and an async purge can physically remove old rows later. Security and product correctness must not depend on the purge job running exactly on time.

---

### yxsinell acosta zambrano - 7/15/2026, 10:36:17 PM

## Design Answers - [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) Open Questions

***Original Question:*** Does the bell belong in a top bar as written, or should the current sidebar/account-menu shell be updated?

***Answer:*** Adapt to the current shell: place the notification entry point in the persistent sidebar near the account/user area or another global sidebar affordance. A top bar would be a broader shell change and should be estimated separately if desired.

***Original Question:*** What are the visual differences for read vs unread rows?

***Answer:*** Unread rows should use a small unread dot, stronger text weight, and subtle surface emphasis. Read rows should remove the dot and use normal text weight/lower emphasis. Do not rely on color alone.

***Original Question:*** What are the approved empty-state illustration and copy?

***Answer:*** Copy: "No notifications yet. Important workspace events will appear here." Illustration is optional for MVP and should match existing empty-state style if available.

***Original Question:*** How should a 400px anchored panel behave on narrow/mobile viewports?

***Answer:*** Desktop uses the anchored panel. Narrow/mobile should use a full-screen sheet/drawer so content remains readable and touch-friendly.

***Original Question:*** Should the panel close after row click, mark-one-read, or mark-all-read?

***Answer:*** Row click closes because it navigates. Mark-one-read does not close. Mark-all-read does not close; it should update the panel state in place.

---

### yxsinell acosta zambrano - 7/15/2026, 10:49:25 PM

## Estimation Rationale — 13 Story Points

[https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) was estimated as ***13 SP*** because this is not only a visual inbox/bell change. The story defines the minimum notification substrate needed for a safe MVP.

Main drivers:

- ***UI work***: notification entry point, unread badge, anchored panel/drawer, read/unread visual states, empty state, day grouping, responsive behavior.
- ***Per-recipient state***: each user needs their own read/unread state; one user's read action must not affect another user.
- ***Backend/API work***: list notifications, mark one as read, mark all visible notifications as read.
- ***Storage decision***: dedicated notification storage is needed; activity_log can feed events but is not enough for recipient delivery and read state.
- ***Security/RBAC***: notifications must never leak workspace/entity metadata after access is lost or for entities the user cannot access.
- ***Deep links***: notifications must route safely to runs/tests/bugs and handle deleted or unavailable targets without broken navigation.
- ***Retention and boundaries***: 90-day visibility rule and 99+ badge cap must be enforced.
- ***QA setup risk***: sibling event-producing stories are not implemented yet, so Dev must provide a seed/factory path for test data.

Planning note:

- If this were only UI with mocked data, it would be closer to 5 SP, but that would not satisfy the accepted ACs.
- If it included full run/bug event producers, it would likely become 21 SP and should be split.
- Current scope is the inbox substrate + safe user-facing experience, so 13 SP is the balanced estimate.

---

### Ely - 7/30/2026, 10:29:28 AM

Mockup — Notifications inbox (bell + panel). Source: .context/designs/bunkai-test-management-tool/bk-208-notifications/notifications-inbox.html · spec: master-design-plan §4.13



---

### Ely - 8/1/2026, 4:18:27 PM

## PO + Dev Ratification — explicit live authorization, 2026-08-01 (supersedes the 2026-07-11 pre-dated batch ratification for THIS story)

Delegated by Ely (project owner) in a live conversation on 2026-08-01. This is a genuine per-story re-verification, not a rubber stamp of the earlier batch comment — see reasoning below for what was affirmed, corrected, or added.

## a) Timeline finding

Verified against the Jira REST API (`created`/`updated` timestamps, not the acli summary view):

| Comment | Author | Posted | Content |
| --- | --- | --- | --- |
| 11554 "PO Ratification — 2026-07-11" | Ely | 2026-07-11 12:52:24 | Narrow: only N1 (90-day retention) and N2 (99+ badge cap) |
| 11555 "Trabajo en esta US" | yxsinell acosta zambrano | 2026-07-11 13:03:44 | Not Q&A — a work-start note, 11 min after 11554 |
| 11556 ATP draft | yxsinell acosta zambrano | 2026-07-15 14:58:24 | — |
| 11557 PO Answers | yxsinell acosta zambrano | 2026-07-16 01:36:16.093 | — |
| 11558 Dev Answers | yxsinell acosta zambrano | 2026-07-16 01:36:16.572 | — |
| 11559 Design Answers | yxsinell acosta zambrano | 2026-07-16 01:36:17.045 | — |
| 11560 Estimation Rationale | yxsinell acosta zambrano | 2026-07-16 01:49:25 | — |

The pre-dating is real, and worse than the "11 minutes" figure carried in `dev-roadmap.md`: that 11-minute gap sits between the ratification (11554) and a work-start note (11555), not the actual Q&A. The genuine PO/Dev/Design Q&A (11557–11559) landed ***5 days after**** the ratification comment, not 11 minutes — `dev-roadmap.md` conflated the two gaps and should be corrected. Separately, all three role answers (PO, Dev, Design) were posted by the ****same single account***, one second apart, which is a simulated three-amigos pass, not three independent stakeholders. The ratifying account (Ely) never touched the actual Q&A content. Both problems are structurally real: a comment cannot ratify content that did not exist yet, and one account cannot stand in for three independent reviewers. This supersession comment is the first genuine per-story sign-off of the Q&A content itself.

## b) Independent evaluation of the existing answers

***Affirmed, with my own reasoning******:***

- N1 (90-day retention) and N2 (99+ badge cap) — sound, narrowly ratified by Ely on 07-11, consistent with the Business Rules field.
- Active-workspace-only scoping (list + mark-all-read) — matches Bunkai's existing workspace-scoped operating model used throughout the product; cross-workspace mixing would be a new pattern with no precedent.
- Hide notifications entirely on loss of access, no redacted rows — this is the correct non-disclosure posture; it matches the same-error-as-not-found principle already binding on this codebase for RPCs (`rpc-authorization.md` §3), applied at the notification layer.
- "This item is no longer available" copy, with no entity-specific metadata on inaccessible targets — reasonable, consistent with the above.
- Retention boundary (day 90 visible, day 91 not) enforced by the query filter independent of the async purge job's actual run time — correct: security/correctness must not depend on a cron job's timing, same principle already applied project-wide.
- Design answers (sidebar placement, unread-dot + weight for read/unread, empty-state copy, mobile full-screen drawer, row-click-closes-but-mutations-don't) — all sound, standard, no gaps. Ely's later mockup comment (11553, 2026-07-30) delivered the visual artifact backing this.

***Affirmed with added grounding (verified against the actual codebase, not just the Q&A text)******:***

- Dev's call to build dedicated notification storage rather than reading `activity*log` directly — I verified this independently. `activity*log` (`supabase/migrations/0009*cross*cutting.sql`) is a broadcast audit trail: one row per event, RLS-visible to every workspace member, no per-recipient column. A personal inbox needs per-recipient delivery + individual read state, which this table cannot express without a second table. The Dev Answer is correct on its merits, not just because it was asserted.
- Bug deep-link route left open pending the Bugs epic — I checked the live codebase: `app/(app)/projects/[projectSlug]/bugs/page.tsx` exists but no `[bugId]` detail route yet. The caveat is still accurate today and is correctly scoped as a Ready-For-QA gate, not a Ready-For-Dev blocker.

***Corrected******:***

- Dev's "seed/factory path needed because sibling event producers aren't implemented yet" is now stale. BK-36 (abort run), BK-39 (finish run with verdict), and BK-40 (file defect) — the three real event sources this inbox would read from — are all confirmed merged to `staging` (`dev-roadmap.md` ES3/ES4). A seed/factory path for QA is still good practice for isolated testing, but the story is no longer blocked on non-existent producers and can wire against real events for at least these three types.
- Dev's endpoint list ("must be RBAC/RLS-safe and non-disclosing") is a correct goal stated too generally — see the RLS/scoping check below.

## c) Scope-size recommendation

13 SP, first-of-epic, new substrate: I checked this and largely affirm the existing Estimation Rationale's own logic (5 SP with mocked data would fail the accepted AC; 21 SP would mean building event producers that already exist as separate stories). That reasoning is sound on its own terms.

My addition: some of the "first-of-epic" risk priced into 13 SP on 2026-07-16 has since been retired. `bunkai*list*activity` (migration `0045`, merged 2026-07-31, BK-49) already ships a workspace-scoped, RLS-safe, keyset-paginated read pattern over an audit-style table — this is a directly reusable template for the notification list RPC, not a from-scratch design. I am not cutting the estimate on that basis (re-estimation is a Dev/Design call at Stage 1, not mine to impose), but I recommend one concrete scope trim: ship the async retention-purge job as a fast-follow rather than in this story. The PO Answer already established that query-time filtering (day 90 visible / day 91 not) is what carries correctness, and the purge is explicitly allowed to run asynchronously — so deferring the purge job itself removes real scope from the critical path without weakening any accepted AC. Build the rest as scoped.

## d) RLS / scoping check (ADR-0012 + rpc-authorization.md)

Gap confirmed: none of the existing answers cite ADR-0012 or answer its Stage-1 six-question checklist (DEFINER vs INVOKER, actor-bind location, result-scoping, non-disclosing failure path, test contract). This must be answered explicitly in the `/sprint-development` Stage 1 plan before any migration SQL is written — the ADR's trigger is mechanical (any story touching `supabase/migrations/`) and already fires regardless of whether this story is recognized as "security work."

My own read on the shape: this notification inbox likely does ***not*** need a caller-supplied actor parameter at all. Reads and mark-read/mark-all-read mutations only ever touch rows where `recipient*user*id = auth.uid()` — a `SECURITY INVOKER` function (or plain RLS-scoped table access) with an ownership policy on the notification-recipient table covers both list and mutation paths, following the same posture as `bunkai*list*activity` (INVOKER, no actor param, RLS does the isolation). That would remove the entire actor-bind risk class per ADR-0012's own stated preference, rather than requiring a guard. This is a recommendation for Stage 1 to confirm, not a substitute for it.

## Refinement status: READY at 13 SP, with the retention-purge job recommended (not required) to split into a fast-follow. The ADR-0012 six-question checklist is a mandatory Stage 1 planning item before SQL — already enforced by existing process, not a new blocker to readiness.

---

### Ely - 8/3/2026, 3:05:23 AM

## Spec Implementation Plan (Dev)

# Implementation Plan: STORY-BK-209 - Notifications | View an inbox of workspace events

## Overview

Build the Notification Inbox substrate: bell + unread badge, a panel listing the signed-in member's own Notifications (newest-first, day-grouped), read/unread state, mark-one and mark-all-as-read, deep links to the referenced run/bug/test, and a graceful fallback when that entity no longer exists. Does ***not*** build the run-lifecycle (BK-211) or bug-lifecycle (BK-212) producers — only the generic surface, a `notifications` schema wide enough for an `event_type` discriminator, and a test-only seed path so QA isn't blocked on those siblings.

***ACs*** (`acceptance-criteria.md`; refined into 13 Gherkin scenarios + 5 boundary/security scenarios in `acceptance-test-plan.md`): AC1 badge+panel newest-first, unread visually distinct; AC2 mark-one decrements badge; AC3 mark-all clears badge; AC4 deep-link marks read and navigates; AC5 deleted/unavailable entity stays in inbox with inline fallback, marked read, no broken route.

Ratified business rules (`business-rules.md`, PO Ratification 2026-07-11): personal per-recipient copies, access-loss hides notifications, no self-notification, 90-day retention, badge caps "99+".

---

## Technical Approach

***Chosen****: dedicated `notifications` table (Dev Answer, `comments.md` 2026-07-16: "Create dedicated notification storage... activity*log should not be the only source"), `payload jsonb` snapshot captured at write time so the inbox never joins live `runs`/`bugs`/`tests` to render a summary. One `SECURITY INVOKER` RPC `bunkai*list*notifications` (modeled on `bunkai*list*activity`, `0045*activity_stream.sql`) for keyset list + unread count + per-row entity-availability. Both mutations (mark-one, mark-all) are plain RLS-scoped PostgREST updates through `ctx.db` (ADR-0001 Path B) — ****no RPC, no SECURITY DEFINER, no identity parameter anywhere in the write path.***

***Alternatives rejected***: (a) derive from `activity*log` + a read-state join table — rejected per the Dev Answer, `activity*log` has no per-recipient delivery concept; (b) a `SECURITY DEFINER` RPC with explicit `p*actor*user*id` for the mutations (the `bunkai*list*test*runs` shape) — rejected, ADR-0012 prefers deleting the identity parameter over guarding it, and a bare RLS-scoped UPDATE needs no escalation; (c) resolve entity availability reactively via the destination page's own `notFound()` — rejected, AC5 requires staying in the inbox with an inline message, so availability must be known server-side before navigating.

***Why***: zero DEFINER surface added (ADR-0012 gate does not even trigger); snapshot payload survives entity deletion (mirrors `runs` snapshotting `run*atcs`/`run*steps`); one SELECT RLS policy structurally satisfies personal-copy + access-loss-hiding + retention at once. Trade-off: `bunkai*list*notifications` needs one more `LEFT JOIN` arm per future `entity_type` a sibling story introduces — documented forward-maintenance note, not a blocker.

---

## UI/UX Design

***Placement (Rule #14, ratified as master-design-plan.md §5 D17 this session)****: the mockup (`notifications-inbox.html`, §4.13) anchors the bell in a topbar. This exact question was already asked and answered for this story (`comments.md`, 2026-07-16 Design Answer): "Adapt to the current shell: place the entry point in the persistent sidebar near the account/user area... A top bar would be a broader shell change." Live-code check confirms why: `AppSidebar.tsx` is the only shell element mounted globally (`app/(app)/layout.tsx`); `Topbar.tsx` is per-page, only used today inside `project-shell.tsx`. ****Decision******:****** bell + badge ship in ****`AppSidebar.tsx`**** above the User block, opening a right-anchored panel (****`side="right"`****)*** instead of a topbar slide-out. Panel content (badge cap, day grouping, entity chip + verdict, unread dot+weight, quiet mark-all text, empty-state copy) follows the mockup verbatim — only the anchor point changes.

***Components****: modified `AppSidebar.tsx` (Bell trigger + `99+`-capped badge above the User block, Radix `Popover`, badge SSR-seeded like the existing `projects.length` nav badge); new `components/notifications/NotificationsPanel.tsx` (header + count + quiet "Mark all as read", day groups Today/Yesterday/date, skeleton loading, approved empty-state copy "No notifications yet. Important workspace events will appear here.", keyset "load more"); new `components/notifications/NotificationRow.tsx` (reuses the existing `.status-chip`/signal-token classes already used by `RunHistoryView` — no new tokens; unread = dot + weight, never color alone; relative time; `entity_available === false` renders the mockup's muted "no longer available" row and skips navigation on click); new `lib/notifications/relative-time.ts` (no existing reusable formatter found); new `lib/notifications/entity-routes.ts` (`run` → `/projects/{slug}/runs/{id}`, `test` → `/projects/{slug}/tests/{id}`, both routes already live; `bug`**** deliberately unmapped*** — no `[bugId]` detail route exists yet, matches the Dev Answer's own caveat; unmapped/unknown types fall into the same "unavailable" rendering).

***States****: loading skeleton; empty (no badge, mark-all hidden); populated mixed read/unread; all-read (badge gone); entity-unavailable row (muted, marks read, no nav); error on mark-read/mark-all network failure (`E13`, never answered — ****assumption***: optimistic update with rollback + `sonner` toast, mirroring the existing workspace-switch error pattern in the same file).

***Responsiveness***: desktop ~380-400px anchored panel; mobile/narrow per the ratified Design Answer — full-screen sheet instead of a popover.

***Content***: domain vocabulary from `domain-glossary.md` §3; row copy mirrors the mockup verbatim; BK-209 writes no producer copy, only test-fixture rows.

---

## Types & Type Safety

`lib/types/supabase.ts` regenerated after the migration (no hand-written duplicate types). `NotificationRow`/query-param types co-located in `lib/notifications/list-validation.ts`, mirroring `ActivityQuery`/`ActivityCursor` in `lib/activity/history-validation.ts`. No Zod body schema for the mutations — id is a path param, no body.

---

## Implementation Steps

1. ***Schema + RLS + indexes**** — `supabase/migrations/0051*notifications.sql` (next-free after `0050`). Columns: `id`, `workspace*id` (fk workspaces, cascade), `recipient*user*id` (fk auth.users, cascade), `event*type text not null` (open, no CHECK — see Decision 3), `entity*type text not null` (open — `run`/`test` today), `entity*id uuid null` (****no FK**** — see Decision 2), `payload jsonb not null default '{}'`, `read*at timestamptz null` (null=unread, mirrors `runs.started*at`/`finished*at`'s nullable-timestamp pattern, not a boolean), `created*at timestamptz not null default now()`. Indexes: `(recipient*user*id, workspace*id, created*at desc, id desc)` for listing; partial `(recipient*user*id, workspace*id) where read*at is null` for badge/mark-all. RLS: SELECT `recipient*user*id = auth.uid() AND bunkai*is*workspace*member(workspace*id) AND created*at >= now() - interval '90 days'` (one policy, three business rules); UPDATE same minus retention. ****No client INSERT policy at all*** — mirrors `activity*log`'s posture (`0009`: "no client INSERT policy"); rows come only from future producer DEFINER functions or the Step 3 service-role factory. No DELETE policy (purge is out of scope — see Dependencies). Also enables Realtime replication (`ALTER PUBLICATION supabase*realtime ADD TABLE notifications`) per ADR-0010. Est: 0.5 day.
2. `bunkai*list*notifications`*** RPC*** — same migration, `SECURITY INVOKER` (no clause), modeled on `bunkai*list*activity`: no actor param, no explicit membership assert, RLS does the work. Keyset `(created*at desc, id desc)`, limit clamp 1..50. Per-row `entity*available` via `LEFT JOIN` arms per `entity*type` (`run`→`runs`, `test`→`tests`; `bug` always false until BK-212/BK-31 land) — being INVOKER, these joins are themselves RLS-scoped, so an inaccessible-but-existing entity also resolves `false`, for free. Returns `{items, unread*count, next*cursor}` (`unread*count` mirrors the `totals` pattern in `bunkai*list*test*runs`). `p*workspace*id` is a plain filter, not a trust boundary (RLS enforces `recipient*user*id`+membership regardless). DB-integration test: `lib/notifications/list-notifications-isolation.test.ts` (mirrors `list-activity-isolation.test.ts`) — cross-recipient isolation, access-loss hides rows, 90-day boundary, `entity*available` correctness. Est: 1 day.
3. ***Test-only seed/factory*** — `lib/notifications/test-factory.ts`, service-role insert helper for QA/test setup (Dev Answer: "provide a seed/factory path... should not be blocked by sibling producers"). Not a product route — sanctioned per `rpc-authorization.md` §5 ("service-role in tests for fixture seed... obtains no session"). DoD: zero importers outside test files. Est: 0.5 day.
4. `GET /api/v1/workspaces/{id}/notifications` — path-scoped per the ratified Dev Answer, matches the existing `workspaces/[id]/projects`/`/invites`/`/membership` convention. `route.ts` (`withApiHandler`, `auth:'required'`, `ctx.db` never admin), `response.ts` (pure `fetchNotificationsPage`, mirrors `activity/response.ts`), `lib/notifications/list-validation.ts` (limit/cursor, reuses `lib/pagination/keyset-cursor.ts` directly), `route.openapi.ts`. Malformed cursor → 400; out-of-range limit → 422; inaccessible/foreign workspace → same `{items:[],unread_count:0}` 200 as empty (RLS-filtered, non-disclosing, mirrors `GET /api/v1/activity`). Est: 1 day.
5. `POST /api/v1/notifications/{id}/read` — plain `ctx.db.from('notifications').update({read_at}).eq('id', id).select().maybeSingle()`, no RPC. Row returned whether already-read (idempotent, `E6`) or just transitioned (`E5`); no row (foreign/nonexistent/access-lost, all identical) → 404, non-disclosing. Est: 0.5 day.
6. `POST /api/v1/workspaces/{id}/notifications/read-all` — plain bulk `ctx.db` update, `.eq('workspace*id', id).is('read*at', null)` (optimization only, not correctness — RLS scopes regardless). Succeeds at 0 affected rows. Est: 0.5 day.
7. ***Shell integration*** — `app/(app)/layout.tsx`'s `getShellData()` gains one RLS-scoped `count`-only query (reuses the Step 1 partial index) so the badge renders SSR with zero client fetch waterfall, same rationale as the file's existing header comment. `AppSidebar.tsx` gets the bell + badge + `Popover`. Est: 1 day.
8. `NotificationsPanel`*** + ****`NotificationRow`**** UI*** — full anatomy per UI/UX Design above; click: `entity_available===true` → mark-read (optimistic) then `router.push`; `false`/unmapped → mark-read only, no navigation (AC5 satisfied by never attempting the broken route, not by catching a 404). Est: 1.5 days.
9. ***Realtime wiring*** (ADR-0010, which explicitly names "BK-209's workspace-event inbox" as a reuse case) — client subscribes to `postgres_changes` on `notifications` filtered to the recipient; reconnect triggers one reconciliation fetch (ADR-0010's own noted trade-off). Testable today via the Step 3 factory (a plain insert already exercises replication). Est: 0.5 day.
10. ***Integration + DB isolation tests*** — full flow: seed 3 unread + 2 read → list newest-first with correct `unread_count`; mark-one idempotent; mark-all clears badge; deep-link to a run; deleted-test notification renders fallback; membership removal hides rows; day-90/91 retention boundary. Est: 1 day.

***Total******:****** ******~******8 days / 13 SP*** (matches the ratified Jira estimate, `comments.md` "Estimation Rationale — 13 Story Points").

---

## Technical Decisions

***Decision 1 — Zero ****`SECURITY DEFINER`**** functions; the RPC-authorization gate does not trigger.*** `bunkai*list*notifications` is `SECURITY INVOKER`; both mutations are plain RLS-scoped table updates. Six-question walkthrough (ADR-0012 / `rpc-authorization.md` §4), answered for completeness even though the gate targets DEFINER functions only:

1. Needs DEFINER? No — RLS does the entire job; the one DEFINER precedent in this codebase (`bunkai*resolve*activity_actors`, ADR-0011) exists only because `auth.users` isn't PostgREST-exposed, and this story never reads `auth.users`.
2. Can the identity parameter be removed? There is none — `p*workspace*id` is a filter, `auth.uid()` (via RLS) is the only identity anywhere.
3. Actor bind at step 0? N/A, no actor param.
4. Which returned rows cross a tenant boundary? None — every query is independently constrained by `recipient*user*id = auth.uid() AND bunkai*is*workspace*member(workspace*id)`, not merely asserted once (the BK-49/ADR-0011 failure mode).
5. Same error as not-found? Yes — foreign/nonexistent/access-lost notification ids all collapse to the same 404; foreign/nonexistent workspaces collapse to the same empty-200.
6. Which test proves it against the real DB? `list-notifications-isolation.test.ts` (Step 2/10).

Reasoning: removes the bug class ADR-0012 exists to prevent rather than guarding it; matches the codebase's strongest precedent (`bunkai*list*activity`) over the weaker actor-param precedent (`bunkai*list*test_runs`). No trade-off identified — this is the ADR's own preferred outcome.

***Decision 2 — ****`entity*id`**** is a plain ****`uuid`****, no foreign key.**** AC5 requires a deleted entity's row to **survive* with a fallback; an FK with cascade would delete it (the opposite of AC5), and `entity*id` is polymorphic across run/test/(future bug) so a single-table FK can't express it anyway. Availability is computed at read time instead (Step 2's joins), which also correctly handles "exists but no longer RLS-visible," not just "deleted." Trade-off: no DB-level integrity check on `entity_id` at insert — acceptable, only trusted producers and the test factory ever write it.

***Decision 3 — ****`event*type`****/****`entity*type`**** are open ****`text`****, no CHECK enum.*** Matches the explicit brief: generic enough for BK-211/212/213/214 to extend via the `event*type` discriminator without a schema migration per sibling. Trade-off: no DB-level typo protection — mitigated at the app layer (each producer owns an allowlist constant, mirrors `ACTIVITY*ALLOWED_ACTIONS`).

***Decision 4 — Bell placement******:****** ****`AppSidebar`****, not ****`Topbar`****.*** See UI/UX Design; ratified as master-design-plan.md §5 D17 this session — spec-only departure, no ADR (fully reversible, touches no schema/auth/cross-cutting invariant).

***Decision 5 — Realtime in scope now, per ADR-0010, despite zero live producers.*** ADR-0010 explicitly names this story; building the subscription now means BK-211/212 need zero realtime work later. Trade-off: ADR-0010 is still `Proposed`, not `Accepted` — flagged under Risks, not silently assumed.

---

## Dependencies

- None blocking — free, first-buildable story of the cluster (`dev-roadmap.md` §3.1).
- `bug` entity detail route: genuinely blocked on BK-31/BK-212, not this story — documented gap in `entity-routes.ts`.
- Scheduled 90-day purge job: explicitly out of scope (Dev Answer separates "visibility filter now" from "async purge later"; correctness never depends on the purge running on time).
- ADR-0010 status is `Proposed`, not `Accepted` — proceeding anyway since it's the standing, PO-delegated decision naming this exact story.

## Risks & Mitigations

- ***ADR-0010 not yet Accepted*** — Low impact; only Step 9 (additive) would change if revised.
- ***No live ****`bug`**** route yet*** — Low impact for this story (zero real bug notifications produced here); `entity-routes.ts` leaves it unmapped by design.
- ***E13/E14 never answered by PO/Dev*** — Medium; reasoned assumptions taken and stated (optimistic-rollback; `(created_at desc, id desc)` tie-break, already the house convention).
- ***Large story (schema+RPC+3 routes+new global UI+realtime+isolation tests)*** — High review-workload risk, see Forecast; steps are already sliced along chainable seams, but the chain decision is deliberately left to the Stage 2 gate.

---

## Definition of Done

- [ ] All 5 ACs + all 13 refined Gherkin scenarios passing (coverage table below)
- [ ] Types regenerated, zero hand-duplicated types
- [ ] Zero `SECURITY DEFINER` functions added (reviewer verifies against the migration diff)
- [ ] `entity_id` carries no FK; deleted-entity scenario leaves the row intact
- [ ] `test-factory.ts` has zero non-test importers
- [ ] DB-integration isolation test passes against the real database, not a mock
- [ ] Approved copy verbatim (empty state, "no longer available"); no color-only state signals
- [ ] Unit + component + route (×3) + isolation tests all passing; lint/types:check clean (read `package.json` for exact scripts)
- [ ] Deployed to staging; manual smoke (badge, panel, mark-one/all, deep link, deleted-entity fallback, cross-session realtime bump)
- [ ] master-design-plan.md §5 D17 present in the merged diff

### Coverage map (13 refined scenarios + 5 original ACs — none omitted)

| Scenario | Step(s) |
| --- | --- |
| AC1 badge+panel, active-workspace scope, unread distinct, day grouping (+ empty state, + cross-workspace scope variant) | 1, 2, 4, 7, 8 |
| AC2 mark-one decrements (+ personal per-recipient variant) | 1, 5, 8, 10 |
| AC3 mark-all clears badge (+ active-workspace-only variant) | 6, 8, 10 |
| AC4 deep-link marks read + navigates (+ hide-after-access-loss variant) | 1, 2, 5, 8, 10 |
| AC5 deleted/unavailable entity fallback, marked read, no broken route | 2, 8, 10 |
| No self-notification | producer-side (BK-211/212), schema doesn't block it |
| Badge boundary 0/99/100+ | 7, 8 |
| Retention boundary 89/90/91 days | 1, 10 |

### ATP axis rollup (34 outlines)

| Axis | Count | Steps |
| --- | --- | --- |
| Positive | 7 | 1,2,4,5,6,7,8 |
| Negative | 6 | 1,2,5,8 |
| Boundary | 5 | 1,7 |
| Integration | 5 | 2,4,5,7,10 |
| Security-RBAC | 6 | 1,2,5 |
| State-Transition | 5 | 5,6,8,10 |

---

## Open Questions

- ***E13*** (network failure mid-mark-read) — never answered; assumption: optimistic + rollback + toast.
- ***E14*** (same-timestamp tie-break) — never answered; assumption: `(created_at desc, id desc)`, the house convention.
- ***Bug entity route*** — blocked on BK-31/BK-212, not resolvable here.

---

## Review Workload Forecast

Estimated: 2650 additions + 30 deletions = 2680 total lines
400-line budget risk: High
Chain strategy: pending
Decision trace: n/a (risk High — left to the Stage 1→2 gate; do not pick a strategy without walking /git-flow-master's chained-PR decision tree)
Decided by: n/a (pending)
Decision needed before apply: Yes

Notes: new-file weight dominates (migration+RPC, 3 API routes each with response/openapi/test, a seed factory, 2 components, 2 isolation/route test suites) — consistent with a 13 SP story building an entire new domain end-to-end. Chain seams already exist along the Step boundaries if /git-flow-master resolves toward feature-branch-chain or stacked-to-main; this plan does not presume which.

---

### Ely - 8/3/2026, 3:17:58 AM

## Workload Forecast — Resolved (git-flow-master Step 4)

The Stage 1 plan forecast this change at ~2680 lines (High risk) and left `Chain strategy: pending`. Resolved via the git-flow-master chained-PR decision tree:

Chain strategy: feature-branch-chain

Decision trace: Q1=No (new domain logic — new table, RLS, RPC, API routes, UI components — not a mechanical rename/format/codegen sweep) · Q2=No (total estimate ~2680 lines; even split into 4 layer-slices — DB+RPC, reads-API, writes-API, UI+realtime — averages ~670 lines/slice, still over the 400-line review budget per slice, so it does not fit the stacked-to-main "2-4 slices each under 400" shape) · Q3=Yes (the brand-new `notifications` table + RLS policies + generated `lib/database.types.ts` types are shared scaffolding that both the API slice and the UI slice depend on; unlike BK-37 which extended the existing `runs` table, this is a new domain area, so the schema stays subject to review-driven revision until the whole chain lands — a partial merge to staging would commit that shared schema before downstream slices have proven it fits) → feature-branch-chain

Decided by: /git-flow-master §Chained-PR decision tree (branching-strategies.md)

### Branch plan

- Integration branch `feat/BK-209-notifications-inbox`, cut from `origin/staging`.
- Slice 1 (DB): migration 0051 (`notifications` table + RLS + indexes + Realtime publication) + `bunkai*list*notifications` RPC + isolation test → PR into `feat/BK-209-notifications-inbox`.
- Slice 2 (API): GET list route, mark-one-read route, mark-all-read route + validation + tests → PR into `feat/BK-209-notifications-inbox`.
- Slice 3 (UI): bell/badge in `AppSidebar`, `NotificationsPanel` + `NotificationRow`, Realtime subscription wiring → PR into `feat/BK-209-notifications-inbox`.
- Final PR: `feat/BK-209-notifications-inbox` → `staging`.

Gate cleared. Stage 2 implementation may proceed under this branch plan.

---

### Automation for Jira - 8/3/2026, 5:30:15 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 8/3/2026, 9:40:52 AM

✅ Test Suite is successfully AUTOMATED and MERGED for Regression Runs. 
QA Task is Done.

---

### Ely - 8/3/2026, 9:44:30 AM

## Ready for QA

Merged to `staging` via [PR #113](https://github.com/upex-galaxy/upex-bunkai-tms/pull/113), branch `feat/BK-209-notifications-inbox`. Deployed and READY on staging: https://upex-bunkai-7ubksz9by-upexgalaxy-saiotest.vercel.app

No distinct shift-left QA owner identified on this ticket (single-contributor project) — left unassigned per the standard hand-off rule rather than guessing.

---


_Synced from Jira by sync-jira-issues_
