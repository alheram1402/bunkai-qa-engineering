# BK-398 — Acceptance Criteria

> Jira field: `customfield_10097` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-398)

## AC-01 — Open via the keyboard shortcut

```gherkin
Scenario: ⌘K opens the command palette from any screen in the app shell
  Given I am signed in and viewing any screen inside the app shell
  When I press ⌘K (or Ctrl+K on non-Mac)
  Then the command palette opens as an overlay
  And the search field is focused and ready for typing
```

---

## AC-02 — Open via the sidebar search control

```gherkin
Scenario: The sidebar's search button opens the same command palette
  Given I am signed in and viewing any screen inside the app shell
  When I select the search control in the sidebar
  Then the command palette opens as an overlay
  And the search field is focused and ready for typing
```

---

## AC-03 — Results grouped by entity type

```gherkin
Scenario: Matching results are grouped under their entity type
  Given the command palette is open
  And my workspace has matching ATCs, Tests, Projects, Modules, Bugs, and Runs
  When I type a query that matches items across more than one entity type
  Then the results render under one heading per entity type
  And each result shows enough context to tell it apart from a sibling result
```

---

## AC-04 — Selecting a result navigates

```gherkin
Scenario: Selecting a result takes me straight to that entity
  Given the command palette is open with results showing
  When I select one of the results
  Then the palette closes
  And I land on that result's own screen
```

---

## AC-05 — Keyboard-only operation

```gherkin
Scenario: The palette is fully operable without a mouse
  Given the command palette is open with results showing
  When I press the down arrow key
  Then the highlighted result moves to the next one in the list
  When I press Enter
  Then I land on the highlighted result's own screen
```

```gherkin
Scenario: Esc closes the palette without navigating
  Given the command palette is open
  When I press Esc
  Then the palette closes
  And I remain on the screen I was viewing before I opened it
```

---

## AC-06 — Empty-query state

```gherkin
Scenario: The palette guides me before I type anything
  Given I just opened the command palette
  And I have not typed a query yet
  Then I see a state that tells me what I can search for
  And no entity-type group headings are shown
```

---

## AC-07 — No-results state

```gherkin
Scenario: A query that matches nothing reads as "nothing found," not an error
  Given the command palette is open
  When I type a query that matches no entity in my workspace
  Then I see an explicit "no results" message
  And nothing on the screen suggests something went wrong
```

---

## AC-08 — Workspace scoping

```gherkin
Scenario: Results never leak another workspace's entities
  Given I belong to more than one workspace
  And I am currently working inside Workspace A
  When I search for a term that also matches entities that live in Workspace B
  Then only Workspace A's matching entities appear in the results
```

---
_Synced from Jira by sync-jira-issues_
