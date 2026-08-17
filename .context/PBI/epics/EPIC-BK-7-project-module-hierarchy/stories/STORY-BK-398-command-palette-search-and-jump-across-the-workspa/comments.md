# Comments for BK-398

[View in Jira](https://jira.upexgalaxy.com/browse/BK-398)

---

### Ely - 8/12/2026, 1:47:14 AM

## AI Product Owner / Business Analyst — Decision: which entity types the first cut of the command palette spans

### Question

`components/layout/CommandPalette.tsx` ships the overlay shell (⌘K/Esc handler, both mount points) but the results area is a stub. FR-031 (Command palette search) describes a union search across Modules, US, AC, ATCs, Tests, Runs, Bugs. The palette's own placeholder copy says "Search ATCs, modules, user stories…". Before authoring this story's scope, a decision was needed: which entity types does the first shipped cut actually span?

### Candidates considered

1. ***ATCs only.*** Smallest slice; matches the current placeholder copy literally.

1. ***The six entities with shipped routes today******:****** ATCs, Tests, Projects, Modules, Bugs, Runs.**** Every one of these already has a live, addressable screen in the app (verified: `/projects/{slug}`, `/projects/{slug}/atcs/**`, `/projects/{slug}/tests/*`, `/projects/{slug}/runs`, `/projects/{slug}/bugs`, plus the Module tree inside a Project). Jumping to any of them is a real, testable navigation today.

1. ***All entities including User Stories and Milestones.*** Matches FR-031's full list plus the post-MVP Milestone entity.

1. ***Defer the whole story until BK-267 (ATC Library) ships.*** Wait for the cross-project ATC index before building the palette, on the theory the palette could reuse its search backend.

### Decision

***Option 2 — the six entity types with shipped routes today (ATCs, Tests, Projects, Modules, Bugs, Runs).*** It is the only candidate that delivers the palette's actual value (fast cross-entity, cross-project navigation) without inventing landing behavior for entities that have no screen to land on yet. User Stories and Milestones are explicitly deferred to a follow-up story once they have their own destinations — this keeps the scope honest about what "search and jump" can mean today instead of quietly building a broken or half-working entry for an entity type this story cannot finish correctly.

---


_Synced from Jira by sync-jira-issues_
