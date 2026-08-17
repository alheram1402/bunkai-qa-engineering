# Comments for BK-257

[View in Jira](https://jira.upexgalaxy.com/browse/BK-257)

---

### Automation for Jira - 8/4/2026, 12:33:51 AM

🔎 Pull Request created. Task is pending to ANALYZE and REVIEW by the team. Waiting for PR Approval.

---

### Automation for Jira - 8/4/2026, 1:02:41 AM

✅ Test Suite is successfully AUTOMATED and MERGED for Regression Runs. 
QA Task is Done.

---

### Ely - 8/4/2026, 1:03:34 AM

## AC3 — how it is implemented, and why it differs from the literal Gherkin

> ***NOTE:**** Read this before writing the acceptance test plan. AC3's literal wording and the shipped behaviour differ ****deliberately***. A test written straight from the Gherkin will fail on chosen behaviour.

***AC3 as written******:**** **Given a workspace only has one project with any activity / Then the recent projects list shows just that project.*

***As shipped******:**** creating a project ****counts as activity****. Every project's sort key is floored at its own `created_at`, so a workspace with three projects where only one has been authored in shows ****all three*** rows, the touched one first, not one row.

### Why the literal reading was rejected

A freshly created, still-empty project would be ***invisible from Home*** — the one screen whose entire purpose is getting a member back into their work. Someone who just created a project and cannot find it on the landing screen has been failed by the widget that exists to prevent exactly that.

### What to test instead

| Setup | Expected |
| --- | --- |
| 3 projects, ATCs authored in exactly one | 3 rows; the authored project is ***first*** |
| A project created just now, never touched | Present in the list, ordered by its creation time |
| More than 5 projects | Exactly 5 rows; `View all` links to `/projects` for the rest |
| A workspace with no projects at all | Empty state (`No projects yet`), not an error |

### Ratification

Recorded as `master-design-plan.md` §5 ***D21(e)*** (Critical Rule #15), and in `lib/home/recent-projects.ts`. Ordering is verifiable by API as well as by eye: `GET /api/v1/workspaces/{id}/recent-projects` calls the same function the screen does.

***Also worth knowing while testing******:**** last-activity is composed from ATC revisions, module additions and run start/finish/abort. Two things do ****not*** advance it, both schema-imposed and documented in the OpenAPI contract — module renames or moves, and marking a step inside an in-progress run.

---


_Synced from Jira by sync-jira-issues_
