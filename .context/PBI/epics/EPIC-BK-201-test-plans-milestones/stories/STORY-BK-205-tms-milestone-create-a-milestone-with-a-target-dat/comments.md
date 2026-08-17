# Comments for BK-205

[View in Jira](https://jira.upexgalaxy.com/browse/BK-205)

---

### Ely - 7/11/2026, 9:52:48 AM

## PO Ratification — 2026-07-11

- T1 ratified: milestone name 1–100 chars, unique per project (case-insensitive) — now a PO-final rule, no longer convention-derived. Business Rules field updated accordingly.
- T4 confirmed: target date must be today or a future date at creation; overdue signaling once the date passes with readiness incomplete is covered in the readiness story.

---

### Carlos Alcala - 7/22/2026, 8:31:04 PM

## Acceptance Test Plan (ATP) — Shift-Left DRAFT ready for review

The ATP DRAFT lives in the 🧪 Acceptance Test Plan (ATP) field on this Story.

Action Required: review ambiguities, answer critical questions, confirm edge-case behavior, validate parametrization.

Refined on: 2026-07-22 — QA Shift-Left batch session
Local working copy: `.context/PBI/epics/EPIC-BK-201-test-plans-milestones/stories/STORY-BK-205-tms-milestone-create-a-milestone-with-a-target-dat/shift-left-refinement.md`

---

### Carlos Alcala - 7/24/2026, 12:32:45 AM

## Acceptance Criteria updated after Three Amigos follow-up (2026-07-24)

@@Ely — 7 of the 9 remaining "needs confirmation" items were closed without a new decision, because they followed directly from things already agreed in the Three Amigos session (the name/date "required" rules already ratified, and Backend's exact uniqueness index `UNIQUE(project_id, lower(trim(name)))`). Only 2 genuinely need your call.

### Closed by inference (no action needed)

- Empty name / whitespace-only name / missing target date → rejected (already-ratified required-field rules)
- Target date exactly one day before today → rejected / exactly today → accepted (boundary of the already-answered "today or later" rule)
- Duplicate name differing only by leading/trailing whitespace → rejected (Backend's index trims edges)
- Same name allowed in two different projects → accepted (Backend's index is scoped by `project_id`)

### Still open — need your decision

1. ***Is there a maximum target date (upper bound), or is any future date acceptable?***

No existing decision answers this — PO capped the **description** at 500 characters, but the **target date** was never addressed, in shift-left or in Three Amigos.

1. ***Should a name that differs from an existing one only by internal whitespace (e.g. "Release 2.4" vs "Release  2.4") be allowed as a distinct milestone, or treated as a duplicate?***

This one is tied to the uniqueness requirement as a whole, not just the AC. Backend's current index — `UNIQUE(project_id, lower(trim(name)))` — only strips leading/trailing spaces, so "Release 2.4" and "Release  2.4" collide as distinct rows today. If the answer is "should be treated as duplicate", the index itself needs to change (e.g. collapse internal whitespace before comparing, not just trim edges) — this is a joint product + implementation call, not just an AC wording question. Kept open on purpose.

Full scenario-by-scenario detail: `acceptance_criteria` field on this Story.

---

### Ely - 7/30/2026, 10:29:17 AM

Mockup — Milestones board. Source: .context/designs/bunkai-test-management-tool/bk-201-test-plans-milestones/milestones-board.html · spec: master-design-plan §4.11



---

### Carlos Alcala - 8/4/2026, 8:50:34 PM

## Shift-Left Refresh — Mockup Cross-Reference (2026-08-04)

The BK-201 milestones-board mockup (added 2026-07-30) was reviewed live against the 2026-07-24 Three Amigos DRAFT and this Story's own `scope.md`/`acceptance_criteria`.

***Ratified (DRAFT, pending real sign-off)******:***

- No upper bound on target date.
- Internal-whitespace name variants allowed as distinct.
- Editing is inline, not a modal — corrects the 2026-07-24 Dev Frontend decision.

***New blocking question (C1)*** — needs a real PO/Dev/Design decision before Ready For Dev: the mockup's detail view always shows BK-206's Attach-plans/readiness UI, with no "BK-205-only" state. This Story's own `scope.md` says the detail view ships with an empty plans area only. Recommended default: `scope.md` wins, Frontend builds a reduced variant for this Story's release — but this needs explicit ratification, not AI inference.

Full writeup: Story description ("Three Amigos Session — Decisions (Refresh, 2026-08-04)") and the 🧪 Acceptance Test Plan (ATP) field. Local working copy: `.context/PBI/epics/EPIC-BK-201-test-plans-milestones/stories/STORY-BK-205-tms-milestone-create-a-milestone-with-a-target-dat/shift-left-refinement.md`.

---

### Carlos Alcala - 8/4/2026, 9:00:57 PM

## C1 resolved — 2026-08-05

BK-206 is still in Backlog and this Story's own `scope.md` already defines the release-1 deliverable ("an empty plans area"). Decision: `scope.md` wins over the combined BK-201 mockup — BK-205 ships the detail view without the Attach-plans button, readiness card, or attached-plans table; those arrive with the sibling story.

Added a new AC scenario to make this testable: "Should open a milestone's detail view showing only its own details and an empty plans area" (`@scope-boundary`).

All Critical Questions raised in this refinement (Q1, Q2, C1) are now closed. Remaining non-blocking items (character-counter confirmation with Design, "Editor access" copy alignment, stale `business-rules.md` Design-intent line) stay open as low-priority follow-ups — see the Story description and `shift-left-refinement.md`.

---

### Ely - 8/5/2026, 1:08:43 PM

> ***NOTE:**** ****Authored by the ****`AI Product Owner / Business Analyst`**** profile**** of the same AI team that designs, specifies and builds Bunkai TMS, per `CLAUDE.md` Critical Rule #18. This is ****not*** a human PO sign-off and must not be read as one. Each decision below enumerates its candidate answers, scores them, and writes out the reasoning, so a future agent run can implement without re-opening the question.

***Sources read before deciding******:*** `.context/PRD/`, `.context/SRS/`, `.context/business/domain-glossary.md` and `business-data-map.md`, `.context/design/master-design-plan.md` (§2 frozen tokens, §4.11, §5, §8), the actual mockup `.context/designs/bunkai-test-management-tool/bk-201-test-plans-milestones/milestones-board.html`, this Story's own Scope / Out of Scope / Business Rules / AC fields and its full comment trail, the sibling states (BK-206 Backlog, BK-202 Backlog), and the live application code.

***Scoring model*** (used identically in every block): five criteria, 1 to 5 each, 25 maximum. Product value · consistency with existing precedent · implementation cost (5 = cheapest) · reversibility (5 = easiest to change later) · risk (5 = lowest risk).

This comment closes the two items left open in the 2026-07-24 Three Amigos follow-up, ratifies the C1 mockup divergence resolved by inference on 2026-08-05, and settles two questions that were never asked but which a dev run would otherwise have to invent on the fly (countdown copy, navigation home).

---

## AI Product Owner — Decision: Is there a maximum target date (upper bound), or is any future date acceptable?

***DECISION******:****** there is an upper bound. The target date must be no more than 5 years after the date of the write (create or edit).*** A later date is refused with the message `Target date must be within the next 5 years.`, rendered inline under the date field exactly like the existing lower-bound refusal.

| # | Candidate | Value | Precedent | Cost | Reversibility | Risk | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | No upper bound (ratify the status quo: the mockup sets only `min`) | 2 | 2 | 5 | 5 | 2 | ***16*** |
| B | ***Cap at 5 years after the write date**** | 5 | 5 | 5 | 5 | 4 | ****24*** |
| C | Fixed absolute far date (e.g. `2100-12-31`) | 3 | 3 | 4 | 5 | 4 | ***19*** |
| D | Cap at 2 years after the write date | 4 | 4 | 4 | 3 | 3 | ***18*** |

***Rationale.*** Every other free-form field in this product is bounded: name 1 to 100 characters after trim, description capped at 500 by the Three Amigos PO decision, project environment names 1 to 50 after trim. An unbounded date would be the outlier, and this Story is the one that renders a countdown from it, so the consequence of a bad value is immediately visible: the realistic input error is an extra digit in the year, which produces a milestone centuries out and a days-remaining chip reading in the hundreds of thousands. That is a defect the user sees, not a theoretical concern.

Option D was rejected on reversibility, not on principle: refusing a legitimate long-horizon program date is a worse failure than accepting a slightly silly one, and 2 years is close enough to real multi-year roadmaps to bite. Option C blocks only the absurd and still accepts `2085`, which is not a planning artifact either. Option A scores lowest on precedent for the reason above.

Cost is 5 rather than 4 because this bound rides on a mechanism that must already exist: the ratified lower bound ("today or later") is equally relative to the current date, so whatever enforces that also enforces this. No new mechanism is introduced.

***Handed to the AI Tech Lead******:*** the enforcement shape. Both bounds are relative to `now()` and therefore cannot be immutable `CHECK` constraints. Tech Lead owns whether they live in a trigger, in the RPC body, or in the Zod edge layer with a DB backstop, following whatever pattern the lower bound adopts. Product only asserts that both bounds are enforced server-side, not client-only.

---

## AI Product Owner — Decision: Should a name that differs from an existing one only by internal whitespace ("Release 2.4" vs "Release  2.4") be allowed as a distinct milestone, or treated as a duplicate?

***DECISION******:****** DUPLICATE.**** Two names that differ only by runs of internal whitespace are the same milestone name and the second one is refused with the existing duplicate-name message. The product mechanism is ****normalize on write***: before persisting, every run of consecutive whitespace inside the name collapses to a single space (in addition to the already-ratified edge trim). The stored value is the normalized one.

| # | Candidate | Value | Precedent | Cost | Reversibility | Risk | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Distinct (keep edge-trim only, as the current index does) | 1 | 2 | 5 | 3 | 2 | ***13*** |
| B | Duplicate, by widening the comparison inside the unique index | 4 | 5 | 3 | 4 | 4 | ***20*** |
| C | ***Duplicate, by collapsing internal whitespace on write and storing the normalized name**** | 5 | 4 | 5 | 4 | 4 | ****22*** |

***Rationale.**** The duplicate rule is already case-insensitive. That is the product stating, in a decision nobody disputes, that two names which look the same to a reader ****are*** the same name. Internal whitespace is the same class of invisibility and arguably a worse one: `Release 2.4` and `Release  2.4` render identically in a proportional font, so a list whose entire stated purpose is scannability by date would carry two rows the user cannot tell apart, and BK-206 would later ask them to attach Test Plans to one of them. That is a defect wearing the costume of a rule, which is why A scores 1 on value.

C beats B because it reaches the same product answer more cheaply and with a better user outcome. Under B the double space survives into the stored name and keeps rendering forever; under C the name is clean in the list, in the detail header, and in every future export. C also leaves Backend's Three Amigos index untouched: with the stored value already collapsed, `UNIQUE(project_id, lower(trim(name)))` compares correctly as written. B's only edge over C is on precedent (4 vs 5), because "normalize the value the user typed" is one step beyond "normalize the comparison"; that is outweighed.

Timing note that removes the usual objection to normalization: no `milestones` table exists yet and there are zero rows anywhere, so there is no back-fill and no pre-existing collision to resolve. This is the cheapest moment this decision will ever be available.

> ***WARNING:**** ****Handed to the AI Tech Lead (this is the implementation consequence the QA refinement correctly flagged).*** The product answer "duplicate" does not by itself require an index change, but it does require the write path to collapse internal whitespace before the uniqueness comparison happens. Tech Lead owns where that normalization lives. Product's recommendation, for Tech Lead to accept or overrule: put it DB-side in the create/edit RPC rather than only in the app layer, matching the pattern `bunkai*finish*run` already documents (Zod is the primary guard at the HTTP edge, the DB is the backstop that also binds direct and PAT callers). If Tech Lead prefers app-layer-only normalization, the unique index must then widen to `lower(regexp_replace(trim(name), '\s+', ' ', 'g'))` instead, which is candidate B's shape. Either path satisfies this product decision; they must not be half-applied.

---

## AI Product Owner — Decision: The mockup renders BK-205 and BK-206 as one screen. Does BK-205 ship the Attach-plans button, readiness card and attached-plans table?

***DECISION******:****** NO. The departure from the mockup is CONFIRMED and ratified.**** BK-205 ships the Milestones list plus a detail view carrying only the milestone's own identity (name, target date, days-remaining chip, description, creator) over an empty plans area whose empty state names the sibling capability. The Attach-plans control, the readiness card and bar, the per-plan breakdown row and the overdue block are ****absent, not disabled***.

| # | Candidate | Value | Precedent | Cost | Reversibility | Risk | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | `scope.md`*** wins******:****** ship the reduced detail view, BK-206 elements absent**** | 4 | 5 | 5 | 5 | 5 | ****24*** |
| B | Mockup wins: pull BK-206's attach and readiness UI forward into BK-205 | 2 | 1 | 1 | 2 | 1 | ***7*** |
| C | Middle: render the mockup's slots with disabled controls and a "soon" placeholder readiness card | 2 | 3 | 4 | 4 | 3 | ***16*** |

***Rationale.*** None of the BK-206 elements has a data source. `milestone_plans` does not exist, BK-202 (Test Plans) is Backlog so there is nothing to attach, BK-206 is Backlog, and readiness is by definition derived from plan progress that cannot be computed from zero attached plans. This is the same situation D19 faced on the projects index and resolved the same way: it refused to render per-project counts rather than promise a figure no backend returns.

The overdue block falls out for a second, independent reason. The mockup defines overdue as `target date passed AND readiness < 100%`, a predicate BK-205 cannot evaluate, and the 2026-07-24 Three Amigos design decision already ruled that "the days-remaining counter uses neutral styling in every state for this Story, no urgency or overdue color treatment, that belongs to BK-206 so it is not built twice". Both routes reach the same answer.

B is not merely wrong on scope, it is expensive: it silently doubles an 8-point story by importing an unestimated Backlog story, and it contradicts `out-of-scope.md`, which has now been ratified three times (original authoring, the shift-left refinement, and the 2026-08-05 C1 close-out). C was rejected because a disabled control on the primary surface of a brand-new feature is chrome rather than value; the `soon` treatment is reserved by D18 for global nav aggregates that genuinely will exist, not for scattering placeholders inside a working screen.

BK-206 later restores the mockup's full detail composition without altering anything BK-205 ships, which is why reversibility scores 5.

***This elevates C1 from "recommended default, pending explicit ratification" to a ratified product decision.*** The AI-inference caveat in comment of 2026-08-05 is discharged.

### Required §5 Divergences row for `.context/design/master-design-plan.md`

Not applied by this decision (product decides, it does not edit the design plan). Paste verbatim as the next row after D24:

```
| D25 | Milestones board (BK-205), §4.11 `milestones-board.html`: the mockup renders BK-205 (create / edit / list / detail) and BK-206 (attach Test Plans + readiness) as ONE combined screen. Its detail view always shows the "Attach plans" button, the readiness card and the attached-plans table, with no BK-205-only state. BK-205's own `scope.md` ships the detail view with "an empty plans area", and `out-of-scope.md` assigns attaching and readiness aggregation to BK-206 (Backlog). | ***UI (spec-only departure)**** | ****Ratified DEPARTURE*** (2026-08-05, BK-205, AI Product Owner per Critical Rule #18). `scope.md` wins over the combined mockup: BK-205 ships the Milestones list plus a detail view carrying only the milestone's own identity (name, target date, days-remaining chip, description, creator) over an empty plans area whose empty state names the sibling capability. The Attach-plans control, the readiness card and bar, the per-plan breakdown row and the overdue block are absent, not disabled. Reason: none of them has a data source. `milestone_plans` does not exist, BK-202 (Test Plans) and BK-206 are both Backlog, and readiness is derived from plan progress that cannot be computed from zero attached plans. Same rule D19 applied when it refused per-project counts on `/projects` rather than promise a figure no backend returns. The overdue treatment stays out for that reason plus the 2026-07-24 Three Amigos design decision ("the days-remaining counter uses neutral styling in every state for this Story, that belongs to BK-206 so it is not built twice"): the mockup defines overdue as `target date passed AND readiness < 100%`, a predicate BK-205 cannot evaluate. Past-dated milestones instead render the neutral factual form "N days past target" (see the same ticket's countdown-copy decision), which BK-206 replaces with the mockup's real overdue block. BK-206 restores the mockup's full detail composition later without altering anything BK-205 ships. No ADR: no schema, auth model, or cross-cutting invariant is touched and the departure is fully reversible (fails ADR gate 1), same path as D18 and D19. |
```

***ADR needed? NO.*** Gate 1 fails on all three counts: no schema decision, no auth or tenancy model change, no cross-cutting invariant. It is a scope-boundary and screen-composition call, fully reversible by the sibling story that already owns the missing half. This matches the explicit reasoning D17, D18 and D19 each recorded for the same gate.

---

## AI Product Owner — Decision: What does the days-remaining counter read when the target date is today?

***DECISION******:****** ****`Due today`****.***

| # | Candidate | Value | Precedent | Cost | Reversibility | Risk | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | `Due today` | 5 | 5 | 5 | 5 | 5 | ***25*** |
| B | `0 days left` | 2 | 2 | 5 | 5 | 4 | ***18*** |
| C | `Today` | 3 | 2 | 5 | 5 | 4 | ***19*** |

***Rationale.**** A is already what the mockup emits. `milestones-board.html`'s `timeChip()` returns `Due today` for `d === 0`, so Critical Rule #15 fidelity is satisfied by simply not deviating, and there is no §5 row to write. B leaks arithmetic into copy and reads as an error state rather than a deadline. C is the interesting trap: `Today` is ****already in service in this product*** as a past-facing day-group label in the shipped notification inbox (`lib/notifications/group-by-day.ts` returns `Today` / `Yesterday`), so reusing the bare word for a future deadline chip would put two different meanings on one label in the same application.

### Ratified in full, so no part of the countdown vocabulary is invented at build time

| Condition | Chip text |
| --- | --- |
| Target date is today | `Due today` |
| Exactly one day out | `1 day left` |
| N days out, N > 1 | `N days left` |
| Target date already passed, exactly one day | `1 day past target` |
| Target date already passed, N days | `N days past target` |

The first three rows are the mockup's own strings. The last two are a ***deliberate departure recorded in the D25 row above****, and they matter: a milestone created with a valid future date becomes past-dated by the simple passage of time, with no edit involved, so BK-205 will absolutely render this state. The mockup's answer there is `Overdue by N days`, which BK-205 must not use because "overdue" asserts the milestone was not met, and per the domain glossary a Milestone is "Overdue when the target date passes ****unmet***" (readiness below 100%), which this Story cannot evaluate. `N days past target` states only what BK-205 knows. Styling stays neutral in every row of that table, per the Three Amigos design decision.

---

## AI Product Owner — Decision: Where does Milestones live in the live application's navigation?

***DECISION******:****** the project sub-nav.*** Add a fifth entry to `ENTRIES` in `app/(app)/projects/[projectSlug]/project-sub-nav.tsx`, rendered by `project-shell.tsx`, pointing at `/projects/{projectSlug}/milestones` (the route §4.11 already assigns to this screen).

| # | Candidate | Value | Precedent | Cost | Reversibility | Risk | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | ***Project sub-nav (****`project-sub-nav.tsx`****), fifth entry**** | 5 | 5 | 5 | 5 | 5 | ****25*** |
| B | Project explorer rail (`components/layout/Sidebar.tsx`), as `business-rules.md` says literally | 2 | 2 | 3 | 4 | 2 | ***13*** |
| C | Global sidebar (`AppSidebar.tsx`), as the mockup's own sidebar draws it | 2 | 1 | 4 | 4 | 2 | ***13*** |

***Rationale.*** Critical Rule #14 makes the live UI the source of truth for navigation and calls navigation paramount, and the live UI already has exactly the right home. D18 ratified the project sub-nav on 2026-08-04 for precisely this decision shape: project-scoped surfaces that have a real route, hosted in the persistent project shell so the nav survives every detail route without re-mounting. Milestones is that exact species. The route §4.11 already assigns, `/projects/[projectSlug]/milestones`, is the sub-nav's own href pattern, and the component's existing active-entry rule (exact match or any nested sub-route) keeps "Milestones" current on `/milestones/{id}` for free. Implementation is one array element.

B is what `business-rules.md` says, and it is unexecutable as written for two independent reasons. First, its stated neighbour does not exist: BK-202 is Backlog, so there is no "Test Plans" to sit next to. Second, that rail is the module to User Story to AC to ATC ***content tree****, so a section link inside it is a category error with no legal position among tree nodes. C contradicts D18 directly: the unbuilt global sidebar entries are deliberately held at `soon` because they are workspace-wide ****aggregates***, and a Milestone is per project by definition in the domain glossary, so it cannot resolve without a project in context.

***Exact placement, unambiguous******:***

- File: `app/(app)/projects/[projectSlug]/project-sub-nav.tsx`, appended to `ENTRIES` after `metrics`.
- Entry: `{ id: 'milestones', label: 'Milestones', icon: Flag, segment: 'milestones' }` (`Flag` from `lucide-react`, matching the one-icon-per-entry pattern already in that file; the icon choice is the only non-load-bearing part of this decision and Design may substitute).
- Resulting order: `All ATCs · Test Runs · Bug Reports · Metrics · Milestones`. When BK-202 ships, "Test Plans" is inserted immediately ***before*** Milestones, which restores the adjacency `business-rules.md` originally intended without any rework.
- Nothing is added to `AppSidebar.tsx`. No new nav surface is created.

***Consequence******:*** the "Milestones becomes a section in the project explorer rail next to Test Plans" line in this Story's `business_rules` Design-intent block is now stale and contradicts a ratified decision. It should read: "Milestones becomes an entry in the project sub-nav, alongside Test Runs, Bug Reports and Metrics." This closes the "stale `business-rules.md` Design-intent line" follow-up left open on 2026-08-05.

---

## Closed in passing (terminology conformance, not a scored choice)

The mockup's viewer note reads `Viewer role, read-only. Creating milestones requires Editor access.` ***"Editor" is not a Bunkai role.*** The role model is `viewer ⊂ member ⊂ admin ⊂ owner`. The copy must read `Creating milestones requires the member role or higher.` No alternatives are scored here because there is nothing to choose between: the domain glossary and the role model win over mockup copy by rule. This closes the "Editor access copy alignment" follow-up.

The live description character counter was already decided by Three Amigos (Dev Frontend decision 3) and needs no further ratification.

---

## Summary: everything handed to the AI Tech Lead

1. ***Enforcement shape of both target-date bounds.*** Both are relative to `now()` and therefore cannot be immutable `CHECK` constraints. Choose the mechanism (trigger, RPC body, or Zod edge plus DB backstop); product requires only that both are enforced server-side.
2. ***Where internal-whitespace normalization lives.*** Recommended DB-side in the create/edit RPC, leaving `UNIQUE(project*id, lower(trim(name)))` unchanged. If normalization is app-layer only, the index must instead widen to `lower(regexp*replace(trim(name), '\s+', ' ', 'g'))`. One or the other, never half of each.
3. ***Nothing else.*** No schema decision in this comment requires an ADR.

## Genuinely not decidable at product level

Nothing on this Story. Every open question above was answerable from the existing context surface. There is no dependency blocker (BK-205 has no upstream story, unlike BK-206) and no missing shift-left refinement (this Story has been through it twice).

---

### Ely - 8/5/2026, 1:31:21 PM

> ***NOTE:**** Authored by the ****AI Tech Lead**** profile of the same AI team that designs, specifies and builds Bunkai TMS, per `CLAUDE.md` Critical Rule #18. This is ****not*** a human tech-lead sign-off and must not be read as one. It closes the two implementation-shape items the AI Product Owner handed over on 2026-08-05 (comment 12168), plus the migration shape a dev run would otherwise invent.

***Scoring model***, identical in every block: six criteria, 1 to 5 each, 30 maximum. Correctness · consistency with shipped precedent · migration cost (5 = cheapest) · reversibility · security / ADR-0012 · performance.

***Verified, not quoted from the record.*** Live read-only SQL against project `fmbpikzpkafptqximhxn` (`information*schema`, `pg*indexes`, `pg*policies`, `pg*get_functiondef`); migrations `0021`, `0023`, `0031`, `0032`, `0036`, `0037`, `0045`, `0047`, `0053`, `0058`, `0062`, `0063`; ADR-0001 / ADR-0011 / ADR-0012; `rpc-authorization.md`; `lib/environments/errors.ts`; `lib/home/active-runs.ts`; this Story's fields and full comment trail.

---

## Three facts in the record that are wrong, corrected before anything is built on them

| # | Claim on the record | Verified truth | Consequence |
| --- | --- | --- | --- |
| F1 | "Backend's exact uniqueness index `UNIQUE(project*id, lower(trim(name)))`" (Three Amigos 2026-07-24, repeated in the PO ratification as the shape to leave untouched) | ***No index in this codebase uses ****`lower(trim(...))`****.**** The only shipped case-insensitive-unique-per-parent index is `project*environments*project*name*idx`, verified live as `UNIQUE (project*id, lower(name))`. The trim happens twice elsewhere: `btrim()` inside the RPC before insert, and a table CHECK `name = btrim(name)` (`0031_runs.sql:33,38-39`). | The precedent BK-205 claims to follow ****is*** normalize-on-write plus a plain index, which is Candidate C of the PO's own whitespace decision. PO scored C at 4 on precedent for being "one step beyond"; on the evidence it is 5, and the runner-up loses its only lead. See Decision 2. |
| F2 | `story.md` PO decision 1 (2026-08-04): "***No upper bound on target date****", and `acceptance-criteria.md` carries a boundary scenario ****accepting ****`today + 10 years` | Superseded by comment 12168 (2026-08-05), which ratifies a ****5-year cap**** | That AC now asserts the opposite of the ratified rule. Implement the AC and you ship a defect; implement the cap and the suite fails. ****The ratified cap wins*** (later, explicit, scored). Correcting the AC is a product-artifact fix, flagged here, not made here. |
| F3 | `story.md` PO decision 2 (2026-08-04) and the QA clarified rule: internal-whitespace variants are "***allowed as distinct****" / the rule "does ****not**** collapse internal whitespace" | Superseded by comment 12168: they are ****duplicates***, via collapse-on-write | Same class as F2. Two rule lines contradict the ratified decision and must be corrected before QA writes assertions against them. |

F1 changes an engineering answer. F2 and F3 are recorded so no dev run reconciles them by guessing.

---

## AI Tech Lead — Decision: where are the two now()-relative target-date bounds enforced, and what is the error surface?

***DECISION******:****** both bounds live in the RPC body, as a backstop under a Zod guard at the HTTP edge. No trigger. No CHECK. Create and edit run the identical validator, with one explicit rule******:****** the bounds are evaluated only when a target-date value is actually written.***

| # | Candidate | Corr | Prec | Cost | Rev | Sec | Perf | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | Zod at the HTTP edge only, nothing in the DB | 2 | 1 | 5 | 5 | 1 | 5 | ***19*** |
| B | ***Zod at the edge + ****`raise exception`**** in the create/edit RPC bodies**** | 5 | 5 | 5 | 5 | 5 | 5 | ****30*** |
| C | `BEFORE INSERT OR UPDATE` trigger on `milestones` | 1 | 2 | 3 | 3 | 4 | 4 | ***17*** |
| D | `CHECK (target*date between current*date and current_date + interval '5 years')` | 1 | 1 | 5 | 2 | 4 | 5 | ***18*** |

***B is the shipped convention, in the precedent's own words.*** `bunkai*abort*run` (`0036`) and `bunkai*finish*run` (`0037`) both carry "the Zod layer is the primary guard at the HTTP edge; this protects direct/PAT callers" over their `raise` backstops (45205, 45207). `bunkai*create*environment` (`0032`) does the same for the 1..50 name length while the table CHECK holds the wider immutable bound. BK-205 is that shape: an app-authoritative, time-relative rule with a DB backstop binding every caller ADR-0001 Path B admits, PATs included.

***C is not merely worse, it is wrong, and concretely so.**** A milestone created with a valid future date becomes past-dated by the passage of time, with no edit involved. The PO ratified that as a normal rendered row ("`N days past target`"). A `BEFORE UPDATE` trigger asserting `target*date >= current*date` would make every past-dated milestone ****permanently uneditable***: its name unfixable, its description uncorrectable, and its date unmovable, which is the exact action `business-rules.md` guarantees ("may be moved forward or backward while the milestone is active"). The feature breaks on its own timeline. Correctness 1.

***D fails for a reason that outlives the write.*** A CHECK is a row invariant, re-evaluated on every later `UPDATE` of that row, on `VALIDATE CONSTRAINT`, and on a `pg_dump` restore. A row valid the day it was written becomes a violation later, and restoring last year's dump fails wholesale. Reversibility 2: unwinding it means migrating a table that by then holds violating rows.

***A alone scores 1 on security.*** ADR-0001 Path B puts a PAT caller on the same PostgREST surface as the browser and these RPCs are granted to `authenticated`. A client-only bound is not a bound. Identical to PO decision 2 (2026-07-24) on RBAC, applied to validation.

### The rule the record does not contain: when the bounds are evaluated on edit

> ***WARNING:**** ****On edit, the bounds are evaluated if and only if the submitted ****`target*date`**** differs from the stored one*** (`p*target*date is distinct from v*current*target*date`). An edit leaving the date untouched never re-validates it.

Without this, editing the description of any past-dated milestone is impossible, which is candidate C's defect reappearing inside candidate B. With it, "create and edit are consistent" holds in the only coherent sense: ***whenever a target-date value is written, it is bounded***; an unchanged value is not a write. Moving a past date backward to another past date is refused (the value changed, the lower bound fires). Moving it forward into the window is accepted. Both fall out of the rule with no special case.

### "Today", and the one line that stops the timezone defect

`story.md` Dev Backend decision 2 already ratified: `target_date` is a `DATE` and "today" is server UTC. That stands. Its failure mode does not: a naive frontend computes the picker's `min` from browser-local getters, so a user at UTC-8 late in the evening is offered a date the server then rejects.

> ***Binding****: the picker's `min`, the Zod bound and the RPC backstop all derive "today" from ****UTC***, never local-time getters. In TypeScript that is `new Date().toISOString().slice(0, 10)`; `toLocaleDateString()` and `getFullYear()/getMonth()/getDate()` are forbidden here. Three layers, one definition, zero window.

### Error surface

The milestones domain opens the ***455xx*** SQLSTATE block (45400 is notifications, `0053`; 453xx is bugs).

| SQLSTATE | Raised name | Condition | HTTP | Copy (emitted by the mapper, not the RPC) |
| --- | --- | --- | --- | --- |
| `45500` | `milestone*name*length` | normalized name outside 1..100 | 422 | `Name must be between 1 and 100 characters.` |
| `45501` | `milestone*description*length` | description over 500 | 422 | `Description must be 500 characters or fewer.` |
| `45502` | `milestone*target*date*past` | `target*date < current_date` | 422 | `Target date must be today or later.` |
| `45503` | `milestone*target*date*too*far` | `> current_date + interval '5 years'` | 422 | `Target date must be within the next 5 years.` |
| `23505` | native `unique_violation` | duplicate name in project, post-normalization | 409 | `A milestone with this name already exists in this project.` |
| `P0002` | `milestone*not*found` / `project*not*found` | absent, or actor not a member of its workspace | 404 | `Milestone not found.` |
| `42501` | `forbidden` | member of the workspace, role is `viewer` | 403 | `You must be a member of this workspace with write access.` |

The RPC raises a ***machine token***, never prose. `lib/milestones/errors.ts` maps SQLSTATE to the `ApiError` envelope and owns every string in the last column, verbatim the split `lib/environments/errors.ts` (BK-148) already ships. Do not put the PO's ratified copy inside the migration.

---

## AI Tech Lead — Decision: does internal-whitespace normalization live in the RPC, or in a widened unique index?

***DECISION******:****** in the RPC, on write, storing the normalized value, with the index left in the precedent's plain shape ****`UNIQUE (project_id, lower(name))`**** and made correct by construction, not by discipline, via a table CHECK that structurally forbids a non-normalized ****`name`**** from existing.***

| # | Candidate | Corr | Prec | Cost | Rev | Sec | Perf | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | ***Normalize in the RPC + table CHECK pinning the invariant; index stays ****`lower(name)` | 5 | 5 | 5 | 4 | 5 | 5 | ****29*** |
| B | Widen the index to `lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))`, store the raw name | 4 | 2 | 4 | 3 | 5 | 3 | ***21*** |
| C | Normalize in the RPC ***and**** widen the index | 5 | 2 | 3 | 3 | 5 | 3 | ****21*** |
| D | Normalize in the app layer only, index stays `lower(name)` | 1 | 1 | 5 | 4 | 1 | 5 | ***17*** |

***F1 settles this.**** The PO recommended A and scored it 4 on precedent, on the reasonable assumption that normalizing the typed value is one step past the shipped convention. It is not one step past it, ****it is the shipped convention***: `project*environments` normalizes with `btrim` inside its create and rename RPCs, pins the invariant with `check (name = btrim(name) and char*length(name) between 1 and 60)`, and indexes plainly on `(project_id, lower(name))`. BK-205 does the identical thing with a wider normalizer.

***The table CHECK is the load-bearing half and is what makes A strictly dominate B.**** B's one real argument is that an index-side comparison is correct no matter which writer inserted the row, while RPC-side normalization is correct only while every writer remembers. `check (name = btrim(regexp*replace(name, '\s+', ' ', 'g')))` removes that argument: a non-normalized `name` ****cannot exist in the table***, from any write path, including a future RPC that forgets, a direct SQL fix-up, or a service-role backfill. The plain `lower(name)` index is then a provably correct duplicate test, not a hopeful one. Same defense-in-depth argument `0058*atc*title*min_length.sql` makes in its own header.

***B and C also lose on write performance and on the user outcome.*** An expression index over `regexp_replace` evaluates a regex on every insert, update and rebuild where `lower()` is a cheap builtin; and under B the double space survives into the stored name and renders forever, in the list, the detail header and every export, which is the defect the decision exists to remove.

***D is the shape the PO forbade*** ("one or the other, never half of each") and scores 1 on security for the Path B reason above: a PAT caller reaching the RPC directly bypasses an app-layer-only normalizer and writes a colliding row the index cannot see.

### The exact expression, and why the operand order is not arbitrary

```sql
btrim(regexp*replace(coalesce(p*name, ''), '\s+', ' ', 'g'))
```

***Collapse first, then trim. Not the reverse.**** Single-argument `btrim()` strips ****spaces only***, not tabs or newlines. A name pasted as `"\tRelease 2.4\t"` survives a leading `btrim()` untouched, so trim-then-collapse would store `" Release 2.4 "`. Collapsing first turns every whitespace run, tabs included, into one U+0020, after which `btrim` removes the now-plain edges. This is a latent hole in the `0032` precedent that BK-205 must not inherit. The identical expression appears in exactly two places and must stay byte-identical: the RPC, and the table CHECK.

### Display, and edit

***Settled, not open.**** The stored value ****is**** the normalized value, so every surface renders the collapsed form: list, detail header, edit prefill, export. ****No ****`original*name`**** or ****`display*name`**** column is added*** and there is no display-time re-normalization. The PO ruled this inside the decision itself, so no product question routes back.

`story.md` Dev Backend decision 4 asks that edit-time uniqueness "exclude the record's own current name". With a DB unique index that is ***automatic and needs no code***: updating a row to a value it already holds does not violate a unique index, because it is the same row. Do not write an app-layer self-exclusion; it would be dead code that only makes the check-then-write race visible again.

---

## AI Tech Lead — Decision: the authorization shape, and how ADR-0012 is satisfied

***DECISION******:****** two ****`SECURITY DEFINER`**** RPCs with NO caller-supplied identity parameter. The actor is ****`auth.uid()`****. ADR-0012's actor bind is satisfied by parameter removal, which is the reference's own preferred answer, not by a guard.***

| # | Candidate | Corr | Prec | Cost | Rev | Sec | Perf | ***Total*** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | ***DEFINER RPCs, no actor parameter, actor = ****`auth.uid()`**** (****`0023`**** shape)**** | 5 | 5 | 5 | 5 | 5 | 5 | ****30*** |
| B | DEFINER RPCs taking `p*actor*user_id` with the ADR-0012 bind at step 0 (`0032` + `0039`) | 5 | 4 | 4 | 5 | 4 | 5 | ***27*** |
| C | `SECURITY INVOKER` RPCs, no actor parameter, RLS does everything | 3 | 4 | 5 | 5 | 5 | 5 | ***27*** |
| D | No RPC: plain RLS-scoped PostgREST writes through `ctx.db` (`0062` shape) | 2 | 3 | 5 | 4 | 3 | 5 | ***22*** |

`rpc-authorization.md` §2 ranks these directly: "The strongest fix is deleting the parameter. A function that cannot be told who the caller is cannot be lied to. Reach for that before reaching for a guard." ADR-0012's Decision repeats it as the preferred outcome. ***A is that shape and it is already shipped here***: `0023*module*activity*log.sql` runs three DEFINER module-mutation RPCs with no actor parameter, gating on `bunkai*can*write*workspace(...)`, and its header gives the justification that applies to BK-205 unchanged: "these functions are invoked through a user-scoped client on both auth paths (cookie SSR session or PAT-minted user JWT)". ADR-0001 Path B guarantees that premise, proven by its recorded 2026-06-08 round-trip.

***B is not wrong; it is one parameter's worth of unnecessary attack surface.**** It scores 4 on security precisely because it re-introduces the class ADR-0012 exists to close and then defends it, for no capability gain. The two closest explicit-actor precedents, `bunkai*create*environment` and `bunkai*rename*environment`, are also ****members of ADR-0012's 22 unbound live functions***: copying the file copies the debt, and the ADR forbids growing that set.

***C loses on correctness, not security.**** Under INVOKER, `activity*log` is unwritable: `0009*cross*cutting.sql` gives it no client INSERT policy and the DEFINER insert is the only sanctioned path. Without an activity row the milestone creator ****cannot be resolved to a display name at all***: `bunkai*resolve*activity*actors` is the codebase's only peer-visible `auth.users` reader (ADR-0011), and after the `0047` scoping fix it resolves a user id only when that user already appears as an actor on that workspace's `activity_log` (verified live in the shipped body). A member whose first ever action is creating a milestone renders with no creator, and `scope.md` requires the list to show one. The alternative, a second `auth.users` reader, is what ADR-0011's consequences tell future stories not to build.

***D adds two more failures***: the client would supply `workspace*id`, spoofable against `project*id` without a trigger binding them, and normalization plus bounds would have nowhere server-side to live except the trigger Decision 1 rejected.

### The activity rows are load-bearing, not decoration

They are the mechanism that makes the creator column work. Per `.context/business/events.md` naming: `milestone.created`, payload `{ "name": <normalized>, "target*date": <iso> }`, and `milestone.updated` projecting ***only changed fields*** (`0055` "Decision 3 / Risk R3" positive-projection convention, never a blanket copy). No notification fires on them: `bunkai*notify*bug*event` is guarded by `when (new.entity_type = 'bug' ...)`, so a `milestone` row is inert, keeping `out-of-scope.md`'s "no notifications" true structurally rather than by omission.

### ADR-0012 six-question checklist

| # | Question | Answer for both milestone RPCs |
| --- | --- | --- |
| 1 | DEFINER, or does INVOKER do it? | ***DEFINER by necessity***: `activity_log` has no client INSERT policy (`0009`), and the audit row is the only reason. ADR-0001 sanctions Path A "where transactional integrity already demands an RPC" (mutation + audit commit as one plpgsql transaction); ADR-0011 owns the creator-resolution chain that row feeds. |
| 2 | Can the identity parameter be removed instead of guarded? | ***Yes, and it is.*** No `p*actor*user*id` on either signature. `auth.uid()` supplies the role gate, `created*by`, and `activity*log.actor*user_id`. |
| 3 | Where is the actor bind, at step 0? | ***Vacuous by construction**** — no caller-supplied identity exists to bind. This is §2's preferred resolution and ADR-0012's stated preference, not an exemption. This story adds ****zero*** functions to the closed set of 22, satisfying the forward-binding clause. |
| 4 | Which returned rows cross a tenant boundary, and what constrains each? | ***None.**** `bunkai*create*milestone` returns only the row it inserted, whose `workspace*id` was derived server-side from `public.projects`, never accepted from the caller. `bunkai*update*milestone` returns only the row whose id was passed, ****after*** that row's own `workspace*id` was gated. There is no set-returning function in this story: list and detail are plain RLS-scoped PostgREST selects through `ctx.db`, so `milestones*select*workspace_member` constrains every row independently on every call. |
| 5 | Does the failure path disclose existence? | ***No, and the id-only path gets the ****`0063`**** treatment explicitly.**** `p*milestone*id` is a caller-supplied identifier whose workspace is derived server-side, the exact shape BK-200 / `0063*environment*cross*workspace*404.sql` had to retrofit one migration ago. BK-205 ships it correct on day one, with the refinement `0063` did not need: ****not a member of the resolved workspace → ****`P0002`**** (404), indistinguishable from absent****; ****a member whose role is ****`viewer`**** → ****`42501`**** (403)***, disclosing nothing a viewer cannot already see on the list, which is what the `@release-gate` viewer AC asserts. `bunkai*create*milestone` takes `p*project*id`, which the caller knows from the URL, so `42501` there discloses nothing new (`0063`'s own reasoning for leaving the shared gate untouched). |
| 6 | Which test proves both against the real database? | `lib/milestones/milestone-rpc-isolation.test.ts`, shipping ***in the same slice as the migration**** (ADR-0012 Stage 2). Modeled on `bug-event-trigger-isolation.test.ts` and `report-isolation.test.ts`. Minimum: (a) a member creates and edits; (b) a `viewer` is refused 403 on create and on edit; (c) a member of workspace X passes a milestone id from workspace Y and gets ****404, never 403 and never a row****; (d) a name differing only by internal whitespace is refused 409; (e) `today - 1` and `today + 5 years + 1 day` are both refused; (f) ****a description-only edit of an already past-dated milestone succeeds***. Per `live-ui-identity.md`: sign in through the real auth path, never mint a JWT, service-role for fixture seed and teardown only. |

> ***ERROR:*** Item (f) is the regression test for Decision 1's edit rule and the only one a naive trigger implementation would pass. It is not optional.

---

## AI Tech Lead — Decision: the full migration shape

***DECISION******:****** one additive migration, ****`0064*milestones.sql`****, containing exactly what follows.*** Re-verify the number against the live ledger at Stage 2 start (`mcp**supabase**list*migrations`), per `0056`'s own note; `0063` is the last file on this branch.

> ***WARNING:**** Subject to `.agents/project.yaml` -> `autonomous*delivery.migrations: confirm`. The dev run ****writes*** the file and its test; a human approves and applies it, following the `0058*atc*title*min*length.sql` header convention. No `apply*migration` from the dev run.

```sql
create table if not exists public.milestones (
  id           uuid primary key default gen*random*uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id   uuid not null references public.projects(id)   on delete cascade,
  name         text not null
                 check (name = btrim(regexp_replace(name, '\s+', ' ', 'g'))
                        and char_length(name) between 1 and 100),
  target_date  date not null,
  description  text not null default '' check (char_length(description) <= 500),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

Four choices in there that are decisions, not defaults:

- `workspace*id`*** carried alongside ***`project*id`, denormalized from `projects`, exactly as `public.runs` and `public.bugs` both do (verified live). Every RLS policy then reads `bunkai*is*workspace*member(workspace*id)` with no join, where `0032` had to route all four environment policies through an `exists (select 1 from public.projects ...)` subquery because `project_environments` lacks the column. The RPC derives it server-side; it is never accepted from a caller.
- `target*date`*** is ****`date`****, not ***`timestamptz` (ratified, Dev Backend decision 2), which also makes `target*date - current_date` an exact integer day count with no rounding and no DST edge.
- `description`*** is ***`not null default ''`, mirroring `bugs.steps*to*reproduce`. The empty string is the absent state; nothing branches on `null` versus `''`.
- `created*by`*** nullable with ***`on delete set null`, mirroring `bugs.created*by` and `runs.executor*user*id` (both verified nullable live). A deleted account leaves the milestone intact with an unresolved creator, never an orphan and never a failed delete.

```sql
-- Duplicate test. Plain lower(), correct by construction because the table
-- CHECK guarantees `name` is already collapsed + trimmed. Same shape as
-- project*environments*project*name*idx (0031_runs.sql:38-39).
create unique index if not exists milestones*project*name_idx
  on public.milestones (project_id, lower(name));

-- Sole list access path: `where project*id = $1 order by target*date asc, id asc`.
-- `id` is the tie-break the ordering needs to be stable and the column a future
-- keyset page would seek on (same reasoning as 0053's notifications index).
create index if not exists milestones*project*target*date*id_idx
  on public.milestones (project*id, target*date, id);

create trigger milestones*set*updated_at
  before update on public.milestones
  for each row execute function public.bunkai*set*updated_at();
```

Two indexes, no more. There is no third access path in this story: nothing filters by `created*by`, nothing sorts by `created*at`, and a speculative index costs write throughput on every insert for a query nobody issues. The `updated*at` trigger reuses the shared `0004*atcs.sql` function; this story adds ***no*** new trigger function.

```sql
alter table public.milestones enable row level security;

-- Visibility is role-agnostic among members: a viewer sees list and detail
-- (business-rules.md). Same shape as runs*select*workspace_member.
create policy milestones*select*workspace_member
  on public.milestones for select
  using ( public.bunkai*is*workspace*member(workspace*id) );

-- Writes are member+. Defense in depth: the RPCs are DEFINER, but the policy
-- surface stays consistent with the module/environment precedent (0032 §1).
create policy milestones*insert*workspace*role*member_plus
  on public.milestones for insert
  with check ( public.bunkai*can*write*workspace(workspace*id) );

create policy milestones*update*workspace*role*member_plus
  on public.milestones for update
  using      ( public.bunkai*can*write*workspace(workspace*id) )
  with check ( public.bunkai*can*write*workspace(workspace*id) );
```

***No DELETE policy and no delete RPC.*** Deletion appears nowhere in `scope.md`, `business-rules.md` or `acceptance-criteria.md`, and `out-of-scope.md` defers "completing or archiving milestones" to a later refinement. Shipping an unreachable delete path is an unrequested, unreviewed capability. `0031*runs.sql` set this precedent when it created `project*environments` default-deny on writes and let BK-148 add them a story later.

```sql
create or replace function public.bunkai*create*milestone(
  p*project*id  uuid,
  p_name        text,
  p*target*date date,
  p_description text default ''
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v*workspace*id uuid;
  v_name         text;
  v*description  text := coalesce(p*description, '');
  v_row          public.milestones%rowtype;
begin
  -- 1. Resolve project -> workspace. p*project*id comes from the URL the
  --    caller already knows, so a 42501 here discloses nothing (0063).
  select workspace*id into v*workspace*id from public.projects where id = p*project_id;
  if v*workspace*id is null then
    raise exception 'project*not*found' using errcode = 'P0002';
  end if;

  -- 2. Role gate. auth.uid() internally; no actor parameter exists to spoof.
  if not public.bunkai*can*write*workspace(v*workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- 3. Normalize (collapse THEN trim, see Decision 2) + lengths.
  v*name := btrim(regexp*replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  if char*length(v*name) < 1 or char*length(v*name) > 100 then
    raise exception 'milestone*name*length' using errcode = '45500';
  end if;
  if char*length(v*description) > 500 then
    raise exception 'milestone*description*length' using errcode = '45501';
  end if;

  -- 4. Bounds. Zod is the primary guard at the edge; this binds direct/PAT
  --    callers. Both relative to server UTC current_date.
  if p*target*date is null or p*target*date < current_date then
    raise exception 'milestone*target*date_past' using errcode = '45502';
  end if;
  if p*target*date > current_date + interval '5 years' then
    raise exception 'milestone*target*date*too*far' using errcode = '45503';
  end if;

  -- 5. Insert. Duplicate name -> 23505 from milestones*project*name_idx -> 409.
  insert into public.milestones (workspace*id, project*id, name, target*date, description, created*by)
  values (v*workspace*id, p*project*id, v*name, p*target*date, v*description, auth.uid())
  returning * into v_row;

  -- 6. Audit. DEFINER-only writer, and what makes created_by resolvable via
  --    bunkai*resolve*activity_actors (ADR-0011 + 0047 scoping).
  insert into public.activity*log (workspace*id, actor*user*id, entity*type, entity*id, action, payload)
  values (v*workspace*id, auth.uid(), 'milestone', v_row.id, 'milestone.created',
          jsonb*build*object('name', v*row.name, 'target*date', v*row.target*date));

  return jsonb*build*object(
    'id', v*row.id, 'project*id', v*row.project*id, 'name', v_row.name,
    'target*date', v*row.target*date, 'description', v*row.description,
    'created*by', v*row.created*by, 'created*at', v*row.created*at
  );
end;
$$;

revoke execute on function public.bunkai*create*milestone(uuid, text, date, text) from public, anon;
grant  execute on function public.bunkai*create*milestone(uuid, text, date, text) to authenticated, service_role;
```

`bunkai*update*milestone(p*milestone*id uuid, p*name text, p*target*date date, p*description text)` is the same body with steps 1, 2 and 4 replaced by:

```sql
  -- 1. Resolve workspace + the CURRENT target_date under a row lock
  --    (0032/0036/0037 serialization convention).
  select workspace*id, target*date into v*workspace*id, v*current*target_date
    from public.milestones where id = p*milestone*id for update;
  if v*workspace*id is null then
    raise exception 'milestone*not*found' using errcode = 'P0002';
  end if;

  -- 2. Non-disclosure split (0063 shape, refined). Not a member at all -> 404,
  --    indistinguishable from absent. Member but viewer -> 403, which
  --    discloses nothing a viewer cannot already see on the list.
  if not public.bunkai*is*workspace*member(v*workspace_id) then
    raise exception 'milestone*not*found' using errcode = 'P0002';
  end if;
  if not public.bunkai*can*write*workspace(v*workspace_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- 4. Bounds evaluated ONLY when the date actually changes (Decision 1).
  --    Without this guard a description-only edit of a past-dated milestone
  --    is impossible.
  if p*target*date is distinct from v*current*target_date then
    if p*target*date is null or p*target*date < current_date then
      raise exception 'milestone*target*date_past' using errcode = '45502';
    end if;
    if p*target*date > current_date + interval '5 years' then
      raise exception 'milestone*target*date*too*far' using errcode = '45503';
    end if;
  end if;
```

and emits `milestone.updated` with a payload projecting only the changed fields.

### What is deliberately NOT an RPC

List and detail reads are ***plain RLS-scoped PostgREST selects through ****`ctx.db`, no function (ADR-0001 Path B; `0062` shipped a whole story that way). The creator column resolves through the ****existing**** `bunkai*resolve*activity*actors(p*workspace*id, p*user_ids[])`, batched exactly as `lib/home/active-runs.ts` already does for run executors. ****Do not add a second ****`auth.users`****-reading function*** — ADR-0011's consequences name that as the thing not to do.

### Slice boundary

***Slice 1 (DB)****: `0064_milestones.sql` + `lib/milestones/milestone-rpc-isolation.test.ts`, together. ****Slice 2 (API)****: `lib/milestones/errors.ts` (SQLSTATE to `ApiError`, modeled on `lib/environments/errors.ts`), Zod schemas carrying the same four bounds, `/api/v1/...` routes under `withApiHandler`. ****Slice 3 (UI)***: the list and detail at `/projects/[projectSlug]/milestones`, inline `#edit-form` edit card and `.overlay .modal` create, the fifth `ENTRIES` row in `project-sub-nav.tsx`, the ratified countdown vocabulary, and viewer-role structural absence of mutating controls.

---

## Summary

| # | Question handed over | Ruling | Runner-up rejected | Score |
| --- | --- | --- | --- | --- |
| 1 | Enforcement shape of both target-date bounds | Zod at the edge + `raise` backstop in the RPC body; on edit, bounds evaluated only when the date changes; `455xx` block; UTC in all three layers | A `BEFORE INSERT OR UPDATE` trigger, which makes every past-dated milestone permanently uneditable | 30 / 30 |
| 2 | Where internal-whitespace normalization lives | In the RPC: `btrim(regexp*replace(..., '\s+', ' ', 'g'))`, collapse before trim, pinned by a table CHECK; index stays `UNIQUE (project*id, lower(name))` | Widening the index, which loses on precedent (F1), on write performance, and leaves the double space in the stored name forever | 29 / 30 |
| 3 | Authorization shape + ADR-0012 | DEFINER RPCs with ***no*** actor parameter, actor = `auth.uid()` (`0023` shape); bind vacuous by construction; `0063` non-disclosure on the id-only path | Explicit `p*actor*user_id` + guard, re-introducing the class ADR-0012 exists to close for no capability gain | 30 / 30 |
| 4 | Migration shape | One additive `0064*milestones.sql`: table, 2 indexes, `updated*at` trigger reuse, 3 RLS policies, 2 RPCs, no delete path | — | — |

***Nothing on this Story is left to a dev run's judgement***, with three exceptions that are product-artifact corrections rather than engineering questions, all recorded above: the stale `today + 10 years` acceptance scenario (F2), the two stale "internal whitespace is distinct" lines (F3), and the stale `business-rules.md` navigation line the AI Product Owner already flagged. None blocks Stage 1; all three should be corrected in Jira before QA writes assertions against them.

---

### Automation for Jira - 8/5/2026, 2:20:59 PM

✅ Test Suite is successfully AUTOMATED and MERGED for Regression Runs. 
QA Task is Done.

---

### Ely - 8/5/2026, 2:22:41 PM

## Ready for QA — BK-205 Milestones (create/list/detail/edit)

Merged to `staging`: [PR #132](https://github.com/upex-galaxy/upex-bunkai-tms/pull/132) (merge commit `5054716`).

- Migration `0064*milestones.sql` applied to the live Supabase project (table, indexes, RLS, `bunkai*create*milestone` / `bunkai*update_milestone`).
- Route: `/projects/{projectSlug}/milestones` (list + create) and `/projects/{projectSlug}/milestones/{milestoneId}` (detail + edit). Fifth entry added to the project sub-nav.
- Detail view intentionally ships WITHOUT the attach-plans/readiness UI (BK-206, Backlog) — ratified departure, `master-design-plan.md` §5 D25.

### Flagging for QA before writing assertions

The `acceptance_criteria` field and `story.md`'s "Clarified Business Rules" still contain two lines the ratified decisions (see comments above) supersede:

1. Internal-whitespace name variants ("Release 2.4" vs "Release  2.4") are described as ***distinct**** — the ratified rule is ****duplicate*** (whitespace collapses on write, case-insensitive).
2. The navigation line says Milestones is "a section in the project explorer rail next to Test Plans" — the ratified/shipped placement is the ***project sub-nav***, alongside Test Runs / Bug Reports / Metrics.

Please write test assertions against the ratified versions above, not the stale field text.

@@Carlos Alcala — assigning to you as the shift-left QA owner for this story.

---


_Synced from Jira by sync-jira-issues_
