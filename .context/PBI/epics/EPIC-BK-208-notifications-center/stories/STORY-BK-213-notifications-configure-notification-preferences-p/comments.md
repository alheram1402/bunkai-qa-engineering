# Comments for BK-213

[View in Jira](https://jira.upexgalaxy.com/browse/BK-213)

---

### Ely - 7/11/2026, 9:52:25 AM

## PO Ratification — 2026-07-11

- N3 — The email digest ([https://jira.upexgalaxy.com/browse/BK-214#icft=BK-214](https://jira.upexgalaxy.com/browse/BK-214#icft=BK-214)) is ratified as enabled by default, and this story's preferences grid is the opt-out surface for it. Turning the digest's email channel off here stops future digest sends; existing inbox items are untouched, consistent with the current rules.

---

### Carlos Alberto Chiavassa - 7/18/2026, 6:21:06 AM

## Shift-Left QA Close-Out — Estimation & Handoff

### PO Questions Resolved (with evidence)

***Authorization boundary (Q1/Q2, AMB-1/GAP-1) — RESOLVED.*** Every notification-preferences endpoint is self-scoped: the target `userId` is always derived from the authenticated session token, never accepted as a request parameter. No admin UI surface anywhere in Bunkai lets one user view or mutate another user's preferences. The Business Rule ("no role can edit another user's preferences") is guaranteed structurally by this pattern. Refined AC-6 stays in scope as a defensive negative test, downgraded from HIGH to LOW priority.

***Inbox scope (Q4, AMB-2 — shared with BK-209) — RESOLVED.*** BK-209's inbox is confirmed per-workspace, for consistency with other workspace-scoped resources.

### QA Refinement Decisions (revisable by PO)

1. ***Preference grid granularity stays GLOBAL, not per-workspace.*** Despite BK-209's inbox being per-workspace, this story's ratified text already states preferences apply across every workspace the user belongs to. Keeping the grid global avoids scope creep introduced by the inbox's own scoping.
2. ***Instant-save concurrency:**** ****last-write-wins, no lock.*** Standard pattern for instant-save toggles (no explicit Save button), consistent with [PRF-03] optimistic UI. Adding lock/conflict-resolution would be over-engineering relative to this story's risk profile.

### Estimation: 3 (Fibonacci)

| ***Perspective**** | ****Assessment*** |
| --- | --- |
| PO | Bounded scope: global grid, no new admin surface, both couplings ([https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209), [https://jira.upexgalaxy.com/browse/BK-214#icft=BK-214](https://jira.upexgalaxy.com/browse/BK-214#icft=BK-214)) are read-only from BK-213's side |
| Dev | Self-contained CRUD: toggle + persistence + session read. Self-scoped auth pattern already exists (reuse, no new code). Last-write-wins adds no extra implementation work |
| QA | 6 ATCs (3 UI + 3 API), one 6-row decision table + one locked-row special case — moderate surface, no combinatorial explosion |

Kept at 3 rather than 5 because today's resolutions removed the two drivers that would have pushed it up: the cross-role authorization surface (now structurally out of scope) and a forced per-workspace grid variant (explicitly rejected in Decision 1 above).

### Open — Q3 (non-retroactivity fixture)

Still open, not resolved in this session. This is a test-fixture implementation question (Mid-Game), not a PO decision, and does not block Dev from building this story. Will be resolved when this story's ACs are automated.

Full detail: `shift-left-refinement.md` §5 / §5.1.

---

### Ely - 7/30/2026, 10:29:39 AM

Mockup — Settings — Notification preferences. Source: .context/designs/bunkai-test-management-tool/bk-208-notifications/settings-notifications.html · spec: master-design-plan §4.13



---

### Automation for Jira - 8/4/2026, 12:54:52 PM

✅ Test Suite is successfully AUTOMATED and MERGED for Regression Runs. 
QA Task is Done.

---

### Ely - 8/4/2026, 12:59:30 PM

Dev handoff: merged to staging.

PR: https://github.com/upex-galaxy/upex-bunkai-tms/pull/127 (merge commit 2e91ad95)
Branch: feature/BK-213-notification-preferences
Migration: supabase/migrations/0062*notification*preferences.sql (additive - new table + RLS)
Tests: 26 new/updated, all passing; write-path test asserts against the real RLS-scoped insert/update via an independent service-role read
Staging: deployed, route verified live at /settings/notifications

Known gap (not in this story's scope, flagged for follow-up): preference checks are not yet wired into any notification producer - BK-212's bug trigger still fires unconditionally, and BK-211 (run-lifecycle producer) doesn't exist yet. AC2/AC3's end-to-end suppression isn't real until that follow-up lands.

Status moved to Ready For QA, reassigned to shift-left QA owner.

---


_Synced from Jira by sync-jira-issues_
