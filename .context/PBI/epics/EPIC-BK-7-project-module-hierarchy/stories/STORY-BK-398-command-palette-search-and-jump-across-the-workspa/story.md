# Command Palette | Search and jump across the workspace

**Jira Key:** [BK-398](https://jira.upexgalaxy.com/browse/BK-398)
**Epic:** [BK-7](https://jira.upexgalaxy.com/browse/BK-7) (Project & Module Hierarchy)
**Type:** Historia
**Status:** Shift-Left QA
**Priority:** Medium
**Story Points:** 1

---

## Overview

***Source spec******:*** FR-031

## User story

***As a*** Senior QA Engineer
***I want to*** search and jump to any ATC, Test, Project, Module, Bug, or Run from a single keyboard-driven overlay, no matter which screen I am on
***So that*** I can move through the workspace without hunting through nested project trees or memorizing routes

## Definition of done

- [ ] Feature works end-to-end against staging
- [ ] Covered by an ATC chain anchored to a User Story + Acceptance Criterion
- [ ] Acceptance Criteria verified by QA
- [ ] Demoed to the team

## Technical notes

### Current state (verified at `origin/staging@4924f48`)

`components/layout/CommandPalette.tsx` already ships the shell of this feature: the ⌘K / Esc key handler (lines ~44-60), the open/close state contract (controlled + uncontrolled), and both mount points — `project-shell.tsx:115` (`<CommandPalette ownsHotkey={false} />`, topbar) and `AppSidebar.tsx:746` (`<CommandPalette trigger={false} open={paletteOpen} onOpenChange={setPaletteOpen} />`, the hotkey owner, driven by the sidebar's own search button). What is missing is everything behind the input: line 95 renders the literal placeholder string "Command palette is a stub. Wire up cmdk + fuzzy search in Phase D." `cmdk` (`package.json:64`, `^1.1.1`) is a declared dependency with zero imports repo-wide (`components/tests/AtcChainPicker.tsx:37` notes the same gap). This story wires the real search behavior into the existing shell and mount points; it does not re-architect how or where the palette opens.

### Design note — no dedicated mockup (spec-only, per Critical Rule #14)

`.context/design/master-design-plan.md` §4 describes the global App Shell (sidebar + topbar) but draws no dedicated screen for the command palette overlay itself — it is a cross-cutting affordance, not a routed screen with its own §8 US→Screen row. Per Critical Rule #14 (LIVE-UI-FIRST), the live `CommandPalette.tsx` markup (overlay container, input styling, `.kbd` hint chips) is the fidelity source for this story, used as-is; the only visual work is populating the results area beneath the existing input. This mirrors the same spec-only path Activity (BK-49) and other cross-cutting, mockup-less screens took in §5 of the design plan — built against `DESIGN.md`'s frozen §2 tokens plus the component's own existing markup, no new colors/radii/fonts/spacing invented.

---

## Fields

> Each rich-text field is a separate file in this folder.

- [Acceptance Criteria](./acceptance-criteria.md)
- [Business Rules](./business-rules.md)
- [Scope](./scope.md)
- [Out Of Scope](./out-of-scope.md)
- [Workflow](./workflow.md)

---

## Traceability

### Mejora (1)

- [BK-265](https://jira.upexgalaxy.com/browse/BK-265): App Shell | Reach Runs, Bugs and Metrics from a project sub-nav _(Ready For QA)_

---

## Metadata

- **Created:** 8/12/2026
- **Updated:** 8/12/2026
- **Reporter:** Ely
- **Assignee:** Unassigned
- **Labels:** app-shell, command-palette, navigation

---

_Synced from Jira by sync-jira-issues_
