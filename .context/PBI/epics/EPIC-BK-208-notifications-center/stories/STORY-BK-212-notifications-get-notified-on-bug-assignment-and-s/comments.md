# Comments for BK-212

[View in Jira](https://jira.upexgalaxy.com/browse/BK-212)

---

### Ely - 7/11/2026, 9:52:25 AM

## PO Ratification — 2026-07-11

- N5 — The bug status vocabulary remains DEFERRED to the Bugs epic ([https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31)) lifecycle definitions; this deferral is itself the ratified decision. The dependency note in the Business Rules field stands as-is; no change needed.

---

### yxsinell acosta zambrano - 7/19/2026, 1:32:05 PM

## Shift-Left Handoff — [https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212](https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212) ready for estimation review

Shift-Left refinement is complete for ***BK-212 — Notifications | Get notified on bug assignment and status changes***.

What was updated:

- Refined Acceptance Criteria were written to the Acceptance Criteria field.
- ATP DRAFT was written to the Acceptance Test Plan field.
- Labels added: `shift-left-reviewed`, `shift-left-2026-07-19`.
- Story Points set to ***8***.

Why these decisions were taken:

- This Story is not only UI copy in the inbox. It owns recipient decision logic for bug assignment/status events, self-notification suppression, dedupe, visibility enforcement, and deep links.
- [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) owns bug lifecycle/status vocabulary, so [https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212](https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212) must consume those events instead of inventing a parallel status model.
- [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) owns inbox rendering, so [https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212](https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212) must produce notifications compatible with that substrate instead of building a separate surface.

Implementation gate:

- Estimate is valid assuming [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) exposes bug events and [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) provides inbox persistence/rendering.
- If those dependencies are missing at implementation time, split or re-estimate as 13 SP.

---

### yxsinell acosta zambrano - 7/19/2026, 1:32:06 PM

## Shift-Left Role Decisions — PO / Dev / Design answers

### PO decisions

| ***Question**** | ****Answer**** | ****Why*** |
| --- | --- | --- |
| Can [https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212](https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212) be developed before [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) ships bug lifecycle events? | No. Estimate now, but start implementation only after [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) exposes assignment/status events. | Without source events, QA cannot validate real notification behavior. |
| What happens when a bug has no run/test context attached? | Deep link lands on bug detail and shows available context only. | Prevents broken links while preserving the Story promise. |
| Should previous assignees be notified when reassigned away? | No. Only the new assignee is notified in this Story. | Keeps scope aligned with current Business Rules. |

### Dev decisions

| ***Question**** | ****Answer**** | ****Why*** |
| --- | --- | --- |
| Which event contract powers this Story? | `bug.assigned` and `bug.status_changed` from [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31). | Keeps notification logic tied to the bug domain source of truth. |
| How is duplicate delivery prevented? | Unique key: source event id + recipient id; build recipients as a set before insert. | Prevents duplicate inbox rows when reporter and assignee are the same user or retries happen. |
| Where is visibility enforced? | At recipient resolution and again when reading/opening inbox notifications. | Prevents stale notifications leaking inaccessible bug metadata. |

### Design decisions

| ***Question**** | ****Answer**** | ****Why*** |
| --- | --- | --- |
| What should the notification row show? | Bug icon, bug title, `Assigned to you` or `Status changed: <old> -> <new>`, and [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) severity chip when available. | Gives Sara enough context without opening the bug. |
| What if only next status is available? | Render `Status changed to <new>`. | Keeps UI robust if [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) event payload is minimal. |
| How should inaccessible bug links behave? | Hide inaccessible rows; stale clicked links use permission-safe not-found state. | Avoids bug metadata leakage. |

---

### yxsinell acosta zambrano - 7/19/2026, 1:32:06 PM

## Estimate Rationale — [https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212](https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212) = 8 SP

Recommended and applied estimate: ***8 Story Points***.

Why not 5 SP:

- The work is more than rendering a notification row. Recipient logic changes by event type and must exclude the actor.
- Dedupe is required when reporter and assignee are the same person.
- Visibility must be checked so project/workspace access changes do not leak bug metadata.
- Deep links must land on bug detail with run/test context when available.

Why not 13 SP:

- [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) owns bug lifecycle/event source.
- [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) owns inbox surface/persistence/rendering.
- [https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212](https://jira.upexgalaxy.com/browse/BK-212#icft=BK-212) should consume those contracts, not build them.

Re-estimation trigger:

- If [https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31](https://jira.upexgalaxy.com/browse/BK-31#icft=BK-31) or [https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209](https://jira.upexgalaxy.com/browse/BK-209#icft=BK-209) foundations are not available when development starts, this becomes ***13 SP*** or should be split into event-source/inbox-consumer work.

---

### Ely - 7/30/2026, 10:29:35 AM

Mockup — Notifications inbox — bug events. Source: .context/designs/bunkai-test-management-tool/bk-208-notifications/notifications-inbox.html · spec: master-design-plan §4.13



---

### Automation for Jira - 8/3/2026, 5:30:15 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 8/3/2026, 9:40:52 AM

✅ Test Suite is successfully AUTOMATED and MERGED for Regression Runs. 
QA Task is Done.

---

### Ely - 8/3/2026, 9:48:33 AM

## Workload Forecast — Resolved (git-flow-master Step 4)

The Stage 1 plan forecast this change at ~585 lines (High risk per the >400 threshold) and left `Chain strategy: pending`. Resolved via the git-flow-master chained-PR decision tree:

Chain strategy: stacked-to-main

Decision trace: Q1=No (new domain logic — a trigger reading BK-264's activity*log writes and producing Notification rows — not a mechanical rename/format/codegen sweep) · Q2=Yes (the work splits cleanly into 2 independent, self-contained slices, each comfortably under 400 lines: Slice 1 = the DB trigger/RPC that turns a bug.assigned/reassigned/unassigned/status*changed activity*log row into a notifications row + its isolation tests (~300-350 lines); Slice 2 = any UI rendering delta for bug-type notifications (~100-150 lines, and possibly near-zero since BK-209 already ships a generic "entity no longer available" fallback for entity*type='bug' that degrades safely). Slice 1 is independently valuable and mergeable to staging on its own — bug-event notifications start appearing in the inbox even before any UI polish lands — so the strategy's own bar ("base always works after each merge") holds without needing a shared long-lived integration branch) → stacked-to-main

Decided by: /git-flow-master §Chained-PR decision tree (branching-strategies.md)

### Branch plan

- Slice 1 (DB producer): migration `0056*...` (trigger/function reading `activity*log` bug-lifecycle rows, writing `notifications` rows per BK-209's schema) + isolation tests → its own PR, branched off `staging`, merged to `staging` directly.
- Slice 2 (UI, only if a real gap remains after Slice 1 lands): any rendering delta for bug-type notifications beyond BK-209's existing fallback → its own PR, branched off `staging` (post-Slice-1), merged to `staging` directly.

Gate cleared. Stage 2 implementation may proceed under this branch plan.

---

### Ely - 8/3/2026, 12:29:59 PM

## Ready for QA

Merged to `staging` via [PR #115](https://github.com/upex-galaxy/upex-bunkai-tms/pull/115), branch `feat/BK-212-bug-notifications`. Deployed and READY on staging: https://staging-upexbunkai.vercel.app

Depends on BK-209 (inbox) and BK-264 (bug assignment/status) — both already on staging.

@yxsinell acosta zambrano — shift-left owner for this story, assigned for QA verification.

---


_Synced from Jira by sync-jira-issues_
