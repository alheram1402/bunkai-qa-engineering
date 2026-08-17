# Master Test Plan — Bunkai

```
+--------------------------------------------------------------------+
|                                                                      |
|   B U N K A I  —  M A S T E R   T E S T   P L A N                  |
|   What to test in this system, and why it matters                  |
|                                                                      |
+--------------------------------------------------------------------+
```

> Generated 2026-08-13, synthesized from `.context/business/business-data-map.md`, `.context/business/business-feature-map.md`, `.context/business/business-api-map.md`, `.context/SRS/functional-specs.md`, `.context/SRS/architecture.md`, `.context/SRS/non-functional-specs.md`, `.context/PRD/user-journeys.md`, and `git log` from `upex-bunkai-tms` (recent-change signal). This is the **test-strategy layer** on top of those maps — it does not repeat flow diagrams, feature catalogs, or endpoint inventories. See §10 for exactly where each of those lives.

---

## 1. Executive Risk Map

Bunkai's riskiest surface isn't any single screen — it's the chain that makes the product's whole pitch true: an ATC you write once has to survive being chained into a Test, frozen into a Run, and turned into a Bug with its provenance intact, all while Postgres RLS keeps one workspace from ever seeing another's data. Every one of those steps is enforced by hand-written RPCs and trigger backstops rather than TypeScript `if` branches, which is exactly why this plan treats a "negative-path API test" as testing a SQLSTATE contract, not a UI validation message. Two things push the risk further than the schema alone would suggest: this repo's own test suite has **zero coverage on the entire `components/**` layer and zero E2E anywhere** (`CLAUDE.md` Project Assessment; `business-feature-map.md` §8), and recent commits in `upex-bunkai-tms` (BK-316, BK-211, BK-187) show the auth-parity, Run-notification, and ATC-search corners of this system have all shipped real bugs recently — not hypothetically fragile, actually-broken-and-fixed fragile. Multi-tenant isolation sits underneath everything else as the one failure class severe enough to matter even when nothing else in a flow is broken.

| Priority | Flow | Why it matters | Depends on / Affects |
|---|---|---|---|
| CRITICAL | Execute a Run & File a Bug from a Failed Step (P0) | The system's core value proposition; snapshot-freeze + double idempotency + terminal-state lockout are all RPC/trigger-enforced with zero component or E2E coverage; recently touched by BK-211 | Feeds Bug Lifecycle, Notifications, Coverage/Traceability |
| CRITICAL | Author an ATC & Assemble into a Test | The product's primary differentiator (write-once, reference-everywhere); BK-187 shipped a real spec-mismatch bug here recently; the anchoring-moat RPC-layer enforcement is confirmed as of 2026-08-13 (defense-in-depth guard in `bunkai_create_atc`/`bunkai_update_atc`, see §10) | Feeds Run Execution; anchors to User Story/AC |
| CRITICAL | Bug Lifecycle — Status Transition & Assignment | The defect audit trail the product's value rests on; forward-only state machine enforced at two independent layers (RPC + trigger) | Consumes Run Execution's output; feeds Notifications |
| CRITICAL | Multi-Tenant Isolation (RLS across all entities) | Highest-severity failure class in the system — a leak affects every workspace, not one flow; **RESOLVED 2026-08-13**: full sweep confirms all 31 tables have RLS enabled with a consistently-applied tenant-isolation pattern, zero deviation found (see §10) — rating held at CRITICAL on severity-of-failure grounds, no longer provisional on unverified coverage | Underlies every flow in this table |
| CRITICAL | Auth Parity — Cookie Session vs. Bearer PAT (AI Agent/CI) | ADR-0001's entire premise is "no second code path to forget"; BK-316 shipped a real bearer-caller authorization bug on this exact seam | Gates every capability-checked route |
| HIGH | Workspace / Project / Module Bootstrap (Onboarding) | Activation-critical — a user who can't get through this never becomes a working customer | Gates literally everything past `/onboarding` |
| HIGH | Workspace Invite Acceptance | Every teammate seat after the workspace creator flows through here; email-match enforcement is an open Discovery Gap | Feeds Bug Assignment eligibility (assignee must be an active member) |
| HIGH | Notification Delivery (Bug/Run lifecycle triggers) | The only signal a teammate gets that a Bug moved or a Run finished; failure is invisible — no error, just silence | Consumes Run Execution + Bug Lifecycle events |

Anything below HIGH is covered as a short list in §8, not a dedicated subsection.

---

## 2. What to Test First and Why

### Execute a Run & File a Bug from a Failed Step (P0)

**Why it matters**: this is the moment a QA engineer's prep work actually gets exercised against a real environment, and if a failure here can't be trusted to file a bug with the right evidence attached, the whole product's traceability promise collapses. It's also the one flow this repo's own commit history shows still moving (BK-211 rewired the finish/abort notification path) while carrying zero component or E2E test coverage.

**What commonly breaks**: idempotent replay under a double "Start run" click looking like it worked but silently creating a second Run; the "Report bug" control rendering (or not rendering) on the wrong step status; a Bug's provenance drifting from the step that actually failed once multiple ATCs share a Module.

**Dependencies**: needs a Test with ≥1 executable ATC step and a Project Environment already provisioned; its output (a filed Bug) is the direct input to Bug Lifecycle and to every notification a teammate receives about it.

**What an experienced QA would check**: run the same `(test_id, start_token)` pair twice inside and outside the 24-hour window and confirm exactly one Run exists in the first case and a genuinely new one in the second; try to report a bug on a step that is `passed`/`blocked` and confirm the control is structurally absent, not just disabled; verify a Run's rendered content stays frozen even if you edit the source Test concurrently; confirm a filed Bug's `run_id`/`run_step_id`/`atc_id` point at the exact step that failed, not chain position 1.

### Author an ATC & Assemble into a Test

**Why it matters**: this is the product's stated reason to exist — a written-once, reusable test case instead of a disposable script. BK-187 already shipped a real bug in this domain (ATC search response spec mismatch), which is direct evidence this area is more fragile than its clean RPC design suggests.

**What commonly breaks**: ~~the anchoring moat (an AC that doesn't actually belong to the ATC's own User Story) is enforced at the API-edge Zod layer but its RPC-body enforcement was never confirmed read this session — a bypass path is plausible until someone reads that RPC body~~ **RESOLVED 2026-08-13**: the anchoring moat IS independently re-enforced at the RPC layer — `bunkai_create_atc`/`bunkai_update_atc` both guard `if coalesce(array_length(p_ac_ids, 1), 0) = 0 then raise exception ... errcode = '45020'` (`0021_atc_create_update.sql:158-160,295-297`), so a direct RPC/REST caller bypassing Zod still gets rejected — no bypass path exists; Test chains legally reuse the same ATC at multiple positions, which is exactly the kind of case a naive uniqueness assumption breaks.

**Dependencies**: requires a User Story with ≥1 Acceptance Criterion already authored; its output feeds every downstream Run.

**What an experienced QA would check**: submit an ATC anchored to an AC from a *different* User Story and confirm the `45020` rejection fires even via a direct RPC call, not just through the UI form; submit a Test chain referencing an ATC from a foreign workspace and a nonexistent ATC id side-by-side and confirm both collapse into the identical `atc_not_in_workspace` response (a deliberate non-disclosure pattern, not a bug); edit a chained ATC's steps and confirm the change propagates to every Test that references it.

### Bug Lifecycle — Status Transition & Assignment

**Why it matters**: the forward-only `open → in_progress → resolved → closed` state machine is the one state machine in this whole codebase confirmed enforced at the actual code level, at two independent layers (RPC + trigger) specifically so a direct-write bypass can't diverge from the RPC's own behavior. That redundancy is a strong signal the team already considers this the highest-consequence state machine in the product.

**What commonly breaks**: a skip-ahead transition returning the wrong "required next stage" in its error message; a same-status resubmit being treated as a no-op success instead of the `45311` rejection it should be; assigning a Bug to a Viewer slipping through if only the RPC path is tested and not the trigger backstop.

**Dependencies**: consumes Bugs filed from Run Execution; assignment depends on Workspace Invite having granted the target user an active, non-Viewer membership.

**What an experienced QA would check**: walk the full 4×4 transition matrix (every from/to pair, not just the happy forward chain) and confirm every illegal cell rejects with the documented SQLSTATE; attempt a direct-write bypass of the RPC (if the test harness can reach the trigger layer independently) and confirm it's caught identically; assign a Bug to an inactive member and to a Viewer separately and confirm each produces its own distinct rejection code.

### Multi-Tenant Isolation (RLS across all entities)

**Why it matters**: nearly every table's authorization ultimately resolves back through `workspace_members` — this is the architecture's single dominant cross-cutting risk, called out explicitly in the data-map's executive summary. A leak here isn't a feature bug, it's a tenant-data breach, and only `atcs`, `access_tokens`, `workspace_members`, and part of `runs`/`bugs` have had their RLS policies independently spot-checked; the remaining ~27 tables rely on "the pattern is consistent elsewhere" as their only evidence.

**What commonly breaks**: a newly-added table (Milestones, Traceability reporting — both recently shipped) forgetting to wire the same `workspace_members` resolution its siblings use; a read endpoint that's technically gated by a capability scope but not independently RLS-checked underneath.

**Dependencies**: every other flow in this document inherits this risk; it doesn't cascade *from* anything, everything cascades *through* it.

**What an experienced QA would check**: as each of the 4 roles, attempt to read and write every core entity (ATC, Test, Run, Bug, Milestone) belonging to a workspace you're not a member of, via direct authenticated API calls, not just the UI; specifically re-test this against the two most recently added entities (Milestones, Traceability report) rather than assuming the pattern holds because it holds elsewhere; confirm a Viewer's blocked write is rejected identically whether it's attempted through the rendered UI or a raw API call.

### Auth Parity — Cookie Session vs. Bearer PAT (AI Agent/CI)

**Why it matters**: this is what makes "an AI agent is a first-class peer of a human Member" a real, testable claim instead of marketing copy — and BK-316 already shipped a real bug on exactly this seam (a bearer caller wasn't correctly rejected on the active-workspace-switch route). ADR-0001's whole design premise is that a regression here is a security-relevant parity bug, not a cosmetic one.

**What commonly breaks**: a new route shipping with a capability check that behaves correctly for a cookie session but not for a scoped PAT (or vice versa); a PAT pinned to one workspace slipping through on a cross-workspace call; `workspace:admin` scope being reachable through a path other than the one explicit, session-authenticated `POST /api/v1/tokens` call.

**Dependencies**: gates every capability-checked route in the system; nothing downstream works correctly if this seam is wrong.

**What an experienced QA would check**: for every new write endpoint, run the identical request as a cookie session and as a correctly-scoped PAT and confirm identical authorization outcomes; issue a PAT scoped to Workspace A and confirm every call against Workspace B is rejected, not silently scoped-down; confirm a PAT with no workspace binding cannot reach any `workspace:admin` route at all.

### Workspace / Project / Module Bootstrap (Onboarding)

**Why it matters**: activation-critical — per `user-journeys.md`, a user who can't get through signup → workspace → project never becomes a customer at all. It's simple CRUD with no recent breakage signal, which is exactly why it's HIGH rather than CRITICAL, but the blast radius of getting it wrong (nobody past the front door) is total.

**What commonly breaks**: the inverse gate (a user with ≥1 membership landing back on `/onboarding` instead of being redirected away) regressing silently; a slug-collision error surfacing as a generic network error instead of the friendly copy.

**Dependencies**: gates every other flow in this document — nothing else is reachable without a workspace and a project.

**What an experienced QA would check**: create a second workspace attempt from an account that already has one and confirm the inverse redirect fires; create a Project with a name that has zero alphanumeric characters and confirm the specific `name_no_alphanumeric` reason surfaces, not a generic validation error; confirm project creation lands the user directly inside the new project (BK-266), not back on the index.

### Workspace Invite Acceptance

**Why it matters**: every teammate seat after the workspace creator flows through this exact path, and whether the server actually confirms the accepting session's email matches the invite's target email is an open Discovery Gap — today's evidence only confirms the client checks *whether* a session exists, not *which* session.

**What commonly breaks**: an invite accepted by a signed-in user whose email doesn't match the invited email (if the gap above is a real gap, not just an unread code path); an expired invite failing with a generic error instead of a clean "expired" message; the round-trip through `/login?next=...` dropping the original invite URL.

**Dependencies**: the resulting active, non-Viewer membership is a prerequisite for that user ever being a legal Bug assignee.

**What an experienced QA would check**: accept an invite while signed in as a *different* account than the one it was sent to, and confirm the outcome — this is currently unverified, so the answer itself is the test result worth recording; let an invite sit past its 7-day expiry and confirm the failure is clean, not a silent partial-success; confirm the round-trip preserves the exact accept URL through an unauthenticated visit.

### Notification Delivery (Bug/Run lifecycle triggers)

**Why it matters**: this is the only signal a teammate gets that a Bug moved or a Run finished without actively polling — and it's entirely trigger-driven (`activity_log_notify_bug_event`/`activity_log_notify_run_event`), which means a silent failure here produces no error anywhere, just a teammate who never finds out.

**What commonly breaks**: an event shape that doesn't match what the `WHEN` clause on the trigger expects, silently producing zero notification rows instead of an error; the `ON CONFLICT (source_event_id, recipient_user_id) DO NOTHING` dedup swallowing a legitimate second notification if an id gets reused.

**Dependencies**: consumes events from both Run Execution (finish/abort) and Bug Lifecycle (status/assignment changes) — a regression in either producer starves this consumer silently.

**What an experienced QA would check**: after a Run finishes, confirm a notification row actually lands in the recipient's inbox, not just that the RPC call itself returned success; confirm a Bug reassignment produces a notification for the *new* assignee and not a stale one for the old assignee; recently added BK-211 wiring specifically deserves a fresh pass here rather than trusting the unit tests that shipped alongside it.

---

## 3. State Machines That Matter

### Bug (Defect) Status — `open → in_progress → resolved → closed`

**Why the transitions matter**: this is the one state machine that determines whether the product's defect audit trail can be trusted at all. A skip-ahead or backward move that slips through corrupts the historical record of what actually happened to a bug, which is the exact thing customers are paying for.

**Transitions most likely to be broken**: a same-status resubmit being silently accepted as a no-op instead of rejected (`45311` is supposed to catch this, but it's an easy case to under-test); a skip-ahead move's error message naming the wrong "required next stage" if the `BUG_STATUS_VALUES` array order ever changes.

**Terminal / forbidden states to guard**: `closed` has no forward transition — confirm nothing lets a closed Bug reopen through any path, including a direct table write.

**How corruption would be detected — or not**: detected immediately today, because both the RPC and the trigger independently reject the same illegal move — but only if both layers are actually exercised in testing. A test suite that only calls the RPC and never attempts a direct-write bypass would never notice if the trigger backstop silently drifted out of sync with the RPC.

### Run (header) Status — `running → passed | failed | aborted`

**Why the transitions matter**: a Run is described as "a one-way door once closed" — abort/finish/mark-step are all confirmed rejected once terminal. Getting this wrong means execution history could be silently mutated after the fact, undermining the same "frozen snapshot" guarantee the whole Run/Bug provenance design depends on.

**Transitions most likely to be broken**: ~~whether `bunkai_finish_run` is the *only* path that can set `passed`/`failed` is an open Discovery Gap — if a direct table UPDATE can bypass it, the one-way-door guarantee has a hole nobody's tested for.~~ **RESOLVED 2026-08-13**: confirmed `bunkai_finish_run`/`bunkai_abort_run` (`0067_run_finish_abort_via.sql`) are the only paths to a terminal status; `public.runs` RLS defines only `select`/`insert` policies (`0031_runs.sql:100-114`), no `update` policy for `authenticated`, so a raw client UPDATE is blocked entirely by RLS default-deny. No bypass hole exists.

**Terminal / forbidden states to guard**: `passed`/`failed`/`aborted` — all three confirmed to reject every further write action with `409`.

**How corruption would be detected — or not**: the "already closed" rejection is confirmed and visible; a bypass of that rejection is not possible for a client caller (RESOLVED above) — RLS itself is the backstop, not test-suite coverage of a direct-write attempt.

### ATC Status — value set confirmed, transition guard confirmed absent (RESOLVED 2026-08-13)

**Why the transitions matter**: `atcs.status` drives which Run/Test surfaces show an ATC as currently passing/failing. ~~but no state-machine-enforcing trigger or RPC was ever located for it across any discovery pass — this is explicitly flagged in `functional-specs.md` as "do not write a negative-path test asserting a specific rejected transition" until the enforcement code is actually read.~~ **RESOLVED**: confirmed — no state-machine-enforcing trigger or RPC exists. The only triggers on `atcs` are `atcs_set_updated_at`/`atcs_refresh_tsv` (`0004_atcs.sql:78,85`, neither status-related), and no RPC body anywhere in the 69 migrations was found to write `atcs.status` at all beyond its `'unrun'` default.

**Transitions most likely to be broken**: not applicable — no code path was found that writes this column, so there is no transition to break via any RPC surface found in source.

**Terminal / forbidden states to guard**: none — confirmed no enforcement exists, only the CHECK-constrained value domain (`0004_atcs.sql:62-63`).

**How corruption would be detected — or not**: still not detectable via a negative-path test, but for a now-confirmed reason rather than an open question — there is no enforced transition to assert against. Still do not write a test asserting a specific rejected ATC-status transition.

---

## 4. Silent Killers — Automated Processes

### `activity_log_notify_bug_event` / `activity_log_notify_run_event` (AFTER INSERT triggers)

**What it does and which flow depends on it**: converts a Bug or Run lifecycle audit event into per-recipient rows in `notifications` — the entire mechanism behind Bug/Run lifecycle notifications reaching a teammate.

**What breaks if it misses a run, runs twice, or runs out of order**: misses a run → a teammate simply never finds out their bug was reassigned or a run finished, with zero error surfaced anywhere; runs twice → the `ON CONFLICT (source_event_id, recipient_user_id) DO NOTHING` dedup should absorb it, but that dedup key itself has never been independently stress-tested for a source-event-id collision.

**How failure is detected today**: not at all from the product's own signals — there's no APM, no error tracking, no alerting (`non-functional-specs.md` NFR-OBS-001/005, both confirmed absent). The only detection mechanism is a human teammate noticing they didn't get expected news.

**Recommended QA strategy**: a synthetic probe — fire a real Bug status transition and a real Run finish/abort in a test workspace, then assert the notification row actually exists for the expected recipient, on a scheduled cadence, not just as a one-time test-suite assertion.

### Supabase Realtime (WebSocket push for Run children and Notifications)

**What it does and which flow depends on it**: pushes live updates to the Runner view and the notification inbox without a page refresh; explicitly documented as having a "Silent" failure mode in `business-api-map.md` §5 — a dropped WebSocket just stops live-updating until the next poll/refresh, with no user-visible error. **Correction 2026-08-13**: the realtime publication covers `run_atcs`/`run_steps` (the Run's child tables the Runner view actually renders) and `notifications` — the `runs` header row itself is deliberately excluded (`0043_run_realtime_replication.sql:43-44`, `0053_notifications.sql:154`); `bugs`/`activity_log` confirmed absent from the publication.

**What breaks if it misses a run, runs twice, or runs out of order**: a teammate watching a live Run sees stale step statuses and has no indication the feed has stopped; nothing prevents them from making a decision based on outdated information.

**How failure is detected today**: nothing — this is stated as a confirmed silent-degradation mode, not a hypothesis.

**Recommended QA strategy**: a scheduled audit comparing the Runner UI's rendered state against a fresh API poll of the same Run, on an interval, to catch drift a human wouldn't notice mid-session.

### Absence of CI/CD (meta-level silent killer)

**What it does and which flow depends on it**: nothing runs the target repo's own 132 existing `*.test.ts`/`*.test.tsx` files automatically — no `.github/workflows/` exists, and Vercel's build-on-push does not execute the test suite (`architecture.md` §10; `CLAUDE.md` Project Assessment, flagged HIGH severity this same session).

**What breaks if it misses a run, runs twice, or runs out of order**: every flow described above — a regression in the Run/Bug state machines, the RLS isolation, or the auth-parity seam can merge to `main` with zero automated signal, relying entirely on a human remembering to run `bun test` locally first.

**How failure is detected today**: not at all — this is the one silent killer this plan can state with full confidence has no detection mechanism whatsoever, because none is even claimed to exist.

**Recommended QA strategy**: this is the single highest-leverage recommendation in this entire document — wire a minimal GitHub Actions workflow that runs `bun test` on every push/PR before anything else in this plan gets meaningfully safer over time.

---

## 5. External Integrations — Failure Points

### Supabase (Postgres + Auth + Realtime)

**Which business flow stops if the service is down**: all of them — this is the entire data layer, auth provider, and live-update transport; there is no separate backend to fail over to.

**Critical timeouts and retry boundaries**: none confirmed in source — no retry/backoff pattern exists anywhere in `app/` or `lib/` for any external call, Supabase included (`non-functional-specs.md` NFR-REL-004).

**Acceptable degradation**: none — a Postgres outage is a hard 500/timeout across the whole API; a GoTrue outage fails Journey 1 (sign-up/sign-in) entirely, which then blocks every downstream flow since nothing works unauthenticated.

**Known quirks**: RLS is the actual authorization system of record, not a TypeScript layer — a test that only checks the HTTP response code without also confirming the underlying row was (or wasn't) written is not actually testing the isolation guarantee.

### Jira (Atlassian) — one-way Story import

**Which business flow stops if the service is down**: only the optional Jira-import entry point into Story authoring — a Story can always be hand-authored instead, so this integration degrades gracefully by design.

**Critical timeouts and retry boundaries**: not confirmed — the import runs as an async Vercel `after()` background job with no documented timeout.

**Acceptable degradation**: full — missing/invalid credentials surface as a failed `import_jobs` row (`jira_unauthorized`), never an app-boot failure, and nothing downstream (ATC/Test/Run/Bug) branches on whether a Story came from Jira or was hand-authored.

**Known quirks**: never writes back to Jira — a one-way pull only; the import runner (`lib/jira/client.ts`) is a hand-written HTTP client, not a wrapped SDK.

### n8n / Resend — declared, not confirmed at runtime

**Which business flow stops if the service is down**: unknown — neither integration has a confirmed runtime call site anywhere in `app/`/`lib`/`components` across multiple independent discovery passes. Email delivery for signup OTP and invite emails may be delegated entirely to Supabase Auth's own SMTP configuration instead.

**Critical timeouts and retry boundaries**: not applicable — cannot document behavior for an integration whose runtime existence is itself unconfirmed.

**Acceptable degradation**: unknown — this is the actual risk. If the team believes Resend is live and it isn't (or vice versa), a QA plan built on the wrong assumption would test the wrong failure mode entirely.

**Known quirks**: worth a direct team confirmation before writing a single test against either integration — see §11.

---

## 6. Dependency Cascade Between Flows

```
Auth (Cookie|PAT) ──► Workspace Bootstrap ──► ATC Authoring ──► Test Assembly ──► Run Execution ──► Bug Filing ──► Bug Lifecycle
      │                                                                                │                              │
      │                                                                                ├──────────► Notifications ◄──┘
      │                                                                                └──────────► Coverage / Traceability Reports
      │
      └── underlies every arrow above — a regression here breaks the whole chain, not one link
```

**Multi-Tenant Isolation (RLS)** isn't drawn as a node in this chain because it isn't a step — it's the substrate every node above sits on. A test suite that walks the happy path top-to-bottom but never attempts a cross-workspace read at any single node would miss the system's highest-severity failure class entirely.

The two chains worth calling out specifically:

1. **ATC Authoring → Test Assembly → Run Execution**: testing ATC creation in isolation hides a class of bug that only surfaces once that ATC is chained into a Test and a Run is actually started against it — the anchoring-moat and same-workspace checks are both re-verified at each hop, so a bug that slips the first check can still be caught (or missed) at the second.
2. **Run Execution → Bug Filing → Bug Lifecycle → Notifications**: a failed Run Step is the *only* path into filing a run-linked Bug, and every subsequent Bug-lifecycle test (status transitions, assignment) is meaningless if the upstream Run→Bug link itself carries corrupted provenance — test this chain end-to-end at least once per release, not just its individual links.

---

## 7. Edge Cases Developers Commonly Forget

**Concurrency**: ATC edits use optimistic locking (`version` column, `45022` on mismatch) — test two overlapping edits, not just one edit followed by a stale read. Run start under a race is serialized via a `for update` row lock on the Project; Run finish/abort races are explicitly "first-wins," where the loser re-reads the now-terminal status and is rejected rather than silently overwritten — test the loser's exact rejection, not just the winner's success.

**Idempotency**: there are *two independent* replay guards on Run start — the HTTP-level `Idempotency-Key` header and the domain-level `(test_id, start_token)` 24-hour window. Testing one does not exercise the other; a bug in either layer alone would ship undetected if only the combined happy path is tested.

**Data limits / boundaries**: ATC step/assertion content is capped at 2048 bytes measured via `byteLength`, not Zod's default UTF-16 `.max()` — this is specifically to handle multibyte input correctly, so the boundary test needs actual emoji/CJK content, not just ASCII padding to the byte limit.

**Permission boundaries**: Viewer write-blocking is enforced at *both* the UI (no affordance rendered) and the RLS/RPC layer independently — testing only the UI's absent button proves nothing about whether a direct API call would also be rejected, and this is precisely the kind of defense-in-depth that's easy to accidentally test only once.

**Orphaned / inconsistent states**: a run-linked Bug's provenance ids (`project_id`/`module_id`/`run_id`/`atc_id`) are derived server-side and re-verified by `bunkai_bugs_check_consistency` regardless of write path — the RPC and the trigger check the *same* five SQLSTATEs, so a test suite that only calls the RPC never actually confirms the trigger backstop does its job.

**State-transition assumptions**: the Bug status machine is fully enforced and safe to write negative-path tests against; the ATC and Run-header status machines are explicitly *not* — carrying that same negative-path-test confidence over to ATC/Run status transitions without re-verification would be inventing a claim the codebase doesn't actually support.

**Multi-tenancy at the edges**: a Test chain referencing a foreign-workspace ATC and one referencing a nonexistent ATC id both collapse into the identical `atc_not_in_workspace` error, by design — a test asserting "the error message tells you which case happened" would be asserting a behavior that doesn't exist and shouldn't.

---

## 8. Pre-Release Checklist

1. Verify a Run started twice with the same `Idempotency-Key` never creates two Run rows.
2. Verify Bug status transitions reject every skip-ahead and every backward/no-op move, at both the RPC and the direct-write trigger backstop independently.
3. Verify a Viewer cannot perform any write (ATC/Test/Run/Bug) via a direct API call, not only via the absent UI affordance.
4. Verify cross-workspace RLS isolation on both read and write, across ATC/Test/Run/Bug, using two genuinely separate workspaces — including the two most recently added entities (Milestones, Traceability reporting).
5. Verify a Bearer PAT caller receives identical authorization outcomes to the cookie-session owner of that token, on every capability-checked route touched this release.
6. Verify the ATC anchoring moat rejects an Acceptance Criterion that doesn't belong to the ATC's own User Story, via a direct RPC call, not only the API-edge Zod check.
7. Verify a Run's rendered content stays frozen even when its source Test/ATC is edited concurrently mid-execution.
8. Verify a Bug filed from a failed Run Step derives all provenance server-side — a client-supplied project/module/run/atc id must be ignored, never trusted.
9. Verify the "Report bug" control is structurally absent, not merely disabled, on any Run Step that is not `failed`.
10. Verify Bug assignment rejects an inactive member and a Viewer-role member as two separately testable, distinctly coded rejections.
11. Verify a real Bug status change and a real Run finish/abort each produce an actual notification row for the expected recipient, not just an RPC success response.
12. Verify sole-owner leave-workspace rejection versus a second owner's successful leave.
13. Verify the full signup → workspace → project → ATC → Test → Run → Bug happy path end-to-end with zero manual database intervention.
14. Verify ATC step/assertion content at exactly the 2048 UTF-8 byte boundary using multibyte (emoji/CJK) input, not ASCII padding.
15. Verify `bun test` passes cleanly before merge — there is no CI gate enforcing this today, so this check currently has to be performed manually every time.

---

## 9. What Is NOT in This Plan

- Flow-level diagrams and state-machine transition tables → `.context/business/business-data-map.md`
- Feature catalog, CRUD matrix, feature flags → `.context/business/business-feature-map.md`
- API endpoint inventory / contracts → `.context/business/business-api-map.md`; typed schemas via `bun run api:sync` (not yet run against the target's live `/api/openapi` endpoint)
- Detailed test case definitions and traceability → TMS (see `/test-documentation`)
- Sprint-level execution order → `.context/reports/SPRINT-{N}-TESTING.md` (see `/sprint-testing`)

---

## 10. Discovery Gaps

- ~~**ATC anchoring-moat (BR-004) RPC-body enforcement** — only the API-edge Zod `.min(1)` gate is confirmed; whether `bunkai_create_atc`'s own RPC body independently re-enforces "≥1 AC" was never located across any discovery pass. §2 and §8 item 6 both treat this as an open question, not a settled guarantee.~~ **RESOLVED 2026-08-13**: confirmed — `bunkai_create_atc`/`bunkai_update_atc` both guard `if coalesce(array_length(p_ac_ids, 1), 0) = 0 then raise exception 'ac_outside_user_story' using errcode = '45020'; end if;` (`0021_atc_create_update.sql:158-160,295-297`). Defense in depth confirmed.
- ~~**Run header status full transition graph** — the terminal-state lockout is confirmed; whether `bunkai_finish_run` is the *only* path that can set `passed`/`failed` (i.e., whether a direct table UPDATE could bypass it) was never confirmed. Flagged explicitly in §3.~~ **RESOLVED 2026-08-13**: confirmed — `bunkai_finish_run`/`bunkai_abort_run` are the only paths; `public.runs` RLS has no `update` policy for `authenticated` (`0031_runs.sql:100-114`), so a raw client UPDATE is blocked entirely.
- ~~**ATC status transition enforcement** — no state-machine-enforcing trigger or RPC was ever located; only the CHECK-constrained value set is confirmed. Do not write a negative-path test asserting a specific rejected ATC-status transition until this is closed.~~ **RESOLVED 2026-08-13**: confirmed absent — no trigger/RPC enforces transitions; only `atcs_set_updated_at`/`atcs_refresh_tsv` triggers exist on `atcs` (`0004_atcs.sql:78,85`, unrelated to status), and no RPC body writes `atcs.status` at all. Still do not write a negative-path test asserting a specific rejected transition — confirmed as a genuine absence, not an unread code path.
- **Invite email-match enforcement** — whether `POST /api/v1/invites/accept` independently confirms the accepting session's email matches the invite's target email, versus any authenticated user being able to redeem any invite link they hold the token for, was never confirmed. §2's Workspace Invite Acceptance section treats this as the test result to establish, not an assumed behavior.
- ~~**RLS policy enumeration** — only `atcs`, `access_tokens`, `workspace_members`, and part of `runs`/`bugs` have had their policies independently spot-checked out of 31 tables. This plan's CRITICAL rating for Multi-Tenant Isolation rests on "the pattern is consistent elsewhere," not an exhaustive per-table verification — treat that CRITICAL rating as provisional until a fuller policy sweep exists.~~ **RESOLVED 2026-08-13**: full sweep complete, all 31 tables. All have RLS enabled (zero diff vs. the CREATE TABLE list), no permissive `using(true)` policy or anon/public grant anywhere, and the tenant-isolation pattern (workspace-scoped / user-scoped / RPC-only zero-policy for the 3 secrets tables) applies with no deviation. The CRITICAL rating for Multi-Tenant Isolation is no longer provisional — it now rests on an exhaustive per-table verification, and holds on severity-of-failure grounds regardless.
- ~~**Realtime replication scope** — `runs` and `notifications` are confirmed realtime-enabled; whether `bugs`/`activity_log` also are was never re-checked. Relevant if a future flow depends on live Bug updates.~~ **RESOLVED 2026-08-13**: definitive full publication list is `run_atcs`, `run_steps` (`0043_run_realtime_replication.sql:43-44`), `notifications` (`0053_notifications.sql:154`) — 3 tables. Corrects the prior claim: `runs` itself is deliberately excluded from the publication (its own migration's header comment confirms this — progress is derived from its `run_atcs`/`run_steps` children instead); `bugs`/`activity_log` confirmed absent.
- **n8n / Resend runtime status** — both declared in `.env.example`, neither has a confirmed runtime call site anywhere in `app/`/`lib`/`components` across multiple independent discovery passes. §5 flags this as an unresolved risk, not a settled "these are dev-tooling only" conclusion.
- ~~**No scheduled/periodic job exists anywhere in the 69 migrations** (confirmed via repo-wide grep) — whether notification 90-day retention or PAT/token expiry sweeps happen at all, and if so where, is unconfirmed. Could mean silent unbounded table growth, or handling entirely outside this repo (Supabase platform-level cron) — this plan cannot distinguish the two from source alone.~~ **RESOLVED 2026-08-13**: re-confirmed absent (also checked `supabase/functions/`, `vercel.json` crons — both absent). Both mechanisms use LAZY-CHECK-ON-READ instead of a sweep: notification 90-day retention is an RLS query-time filter (`0053_notifications.sql:113`; the migration's own comment states the purge job "is explicitly out of scope," rows are hidden but never deleted); PAT/token expiry is checked only at auth time (`0008_access_tokens.sql:17`). Confirms unbounded table growth IS a real (if likely low-severity for now) risk — expired/retained rows are never physically purged by anything in this repo.
- **`GET /api/v1/bugs`'s auth requirement** — this session's grep returned `atc:write` (a write scope) on what should be a read/list endpoint, inconsistent with every other list endpoint in the inventory. Not independently re-verified against the route body — could be a grep artifact or a real asymmetry worth a team question before writing a permission test around it.
- **No numeric performance or reliability SLO exists anywhere in source** (no P95 target, no rate-limit threshold, no cache TTL) — this plan ranks flows by structural and business signal only; it cannot and does not claim any measured latency or error-rate risk.
- **Feature-map coverage was available and used this session** — no warning needed here; both hard and soft source requirements (`business-data-map.md`, `business-feature-map.md`) were present at generation time.
