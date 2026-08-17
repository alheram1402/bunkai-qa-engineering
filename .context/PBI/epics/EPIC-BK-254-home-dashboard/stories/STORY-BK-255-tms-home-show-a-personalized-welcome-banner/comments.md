# Comments for BK-255

[View in Jira](https://jira.upexgalaxy.com/browse/BK-255)

---

### Ely - 7/31/2026, 4:19:48 PM

## Gap — Sprint/iteration entity

The `home.jsx` mockup shows a "SPRINT 24-Q2 · DAY 7/10" eyebrow line above the welcome greeting. No Sprint/iteration entity exists in this product's schema (`supabase/migrations/`) or in `.context/business/business-data-map.md` — the only "sprint" references in the codebase are to the `/sprint-development` methodology skill and to Master/Execution Sprint planning terminology, not a product-facing entity members would see on Home.

This story intentionally does not build that eyebrow line (see Out of Scope). Before anyone builds it, a human needs to decide: drop it permanently from the mockup, or design a real Sprint/iteration entity for the product (schema + ownership + relationship to Runs/Test Plans). Flagging for `/product-management` or a design review to resolve — not resolved here.

---

### Ely - 8/2/2026, 2:31:32 AM

***Resolved — Sprint/iteration entity gap***

Decision made via Discovery Inbox proposal P-2026-08-02-03 on BK-261, product-owner-ratified in chat (2026-08-02): ***option (b)*** — strike the sprint eyebrow line from the mockup contract, do not build a Sprint/iteration entity.

`.context/design/master-design-plan.md` §4.2 updated (eyebrow line removed from the Required list) and §5 D18 added recording the ratified departure (renumbered from an initial D17 — that number was independently taken by BK-209's own divergence entry, merged to staging while this was in flight). This story's existing Out of Scope wording already excluded the eyebrow line correctly — no field change needed there, only this closing note.

This story ships without the sprint-day eyebrow, no schema/entity work required.

---

### Automation for Jira - 8/3/2026, 11:36:55 PM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 8/4/2026, 12:05:29 AM

✅ Test Suite is successfully AUTOMATED and MERGED for Regression Runs. 
QA Task is Done.

---


_Synced from Jira by sync-jira-issues_
