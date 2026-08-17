# Comments for BK-401

[View in Jira](https://jira.upexgalaxy.com/browse/BK-401)

---

### Ely - 8/12/2026, 3:40:37 PM

## Fix shipped — handoff for QA verification

***Reproduced*** exactly as reported: `bun test lib/atcs/search-isolation.test.ts` gave 3 pass / 2 fail at `:100` and `:197`.

***Root cause******:****** test defect (data drift), not a product defect.*** The RPC's own hypothesis in this ticket — an asynchronous tsvector-indexing race — is refuted: `atcs*refresh*tsv` is a synchronous `BEFORE INSERT OR UPDATE` trigger (`supabase/migrations/0004_atcs.sql:83-88`), which cannot race by construction, and a live check found 0 of 1467 `atcs` rows with a null or stale `tsv`.

The real cause is rank-crowding. The two failing assertions picked an arbitrary pre-existing ATC from the shared dev/staging table and required its own token to rank in the RPC's ***top 50**** results. That table has grown past 1000 rows, with one title duplicated 90+ times. `bunkai*search*atcs` ranks by `ts*rank(tsv, query) ** exp(-elapsed/604800)` (a 7-day recency decay) then caps at `p*limit`. Live verification: the specific seed row the test happened to pick (`updated_at` 2026-07-03) ranks around position #142 of ~160 matches in its project — it **is** matched by `tsv @@ query`, it is simply rank-crowded out of the top 50 by ~140 newer same-title rows. The live RPC body is byte-identical to the committed migration, so this is not live-vs-file drift either.

***Fix***: `lib/atcs/search-isolation.test.ts` now seeds a fresh probe ATC with a guaranteed-unique random token for the two affected assertions, through the real write path (`title`/`tags` only — the same columns `bunkai*create*atc` writes), instead of asserting rank-topping on an arbitrary pre-existing row. The probe row is deleted after each test. No RPC change, no migration.

***Regression coverage***: verified live that the real RPC finds the probe row, and that a query mirroring the RPC's own predicate but with an intentionally-injected "drop the actor's own ATC" defect returns nothing for the same probe — confirming the assertion would fail under a genuine regression, not just pass vacuously.

***Shipped***: PR [#165](https://github.com/upex-galaxy/upex-bunkai-tms/pull/165), merged into `staging` (merge commit `b9f3fc6`).

***QA owner***: this ticket has no prior comments, so no shift-left QA owner could be identified from the comment trail. Leaving assignee as-is (Ely) rather than guessing one.

***Suggested verification***: `bun test lib/atcs/search-isolation.test.ts` on `staging` should now show 5 pass / 0 fail.

---


_Synced from Jira by sync-jira-issues_
