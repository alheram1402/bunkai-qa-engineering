# BK-269 — Acceptance Criteria

> Jira field: `customfield_10097` · [View in Jira](https://jira.upexgalaxy.com/browse/BK-269)

```gherkin
Scenario: An idle Run past the inactivity threshold is closed by the sweep

  Given a Run is in "running" status with no step activity recorded for longer than the configured inactivity threshold
  When the scheduled sweep executes
  Then the Run's status becomes "aborted"
    And the Run's finish time is recorded as the moment the sweep closed it
```

```gherkin
Scenario: A Run with recent step activity is left running by the sweep

  Given a Run is in "running" status and one of its steps was recorded well within the configured inactivity threshold
  When the scheduled sweep executes
  Then the Run's status remains "running"
    And no reason is added to the Run
```

```gherkin
Scenario: A Run that already finished with a verdict is untouched by the sweep

  Given a Run already finished with a "passed" or "failed" verdict before the sweep runs
  When the scheduled sweep executes
  Then the Run's status and finish time are unchanged
```

```gherkin
Scenario: A Run a person already aborted is untouched by the sweep

  Given a Run was already aborted by a person, carrying that person's typed reason
  When the scheduled sweep executes
  Then the Run's status, finish time, and reason remain exactly as the person left them
```

```gherkin
Scenario: A swept Run disappears from the Home active-runs list

  Given a Run appears in the Home "active test runs" widget's list because it is "running"
  When the scheduled sweep closes that Run for exceeding the inactivity threshold
  Then the Run no longer appears in the Home "active test runs" widget's list on the next page load
```

```gherkin
Scenario: A swept Run no longer counts toward the Home active-runs count

  Given the Home "active test runs" widget shows a count of running Runs in a Workspace, one of which is idle past the inactivity threshold
  When the scheduled sweep closes that idle Run
  Then the widget's count for that Workspace decreases by one on the next page load
```

```gherkin
Scenario: Running the sweep repeatedly against an already-closed Run has no further effect

  Given a Run was closed by the sweep on its previous execution
  When the scheduled sweep executes again
  Then the Run's status, finish time, and reason are unchanged from the first sweep
```

```gherkin
Scenario: A swept Run's reason reads distinctly from a reason a person typed

  Given a Run is closed by the sweep for exceeding the inactivity threshold
  When a QA Lead opens that Run's detail
  Then the reason shown identifies the closure as an automatic sweep, not free text a person composed
    And that reason is visibly distinguishable from the reason on a Run a person aborted directly
```

```gherkin
Scenario: A sweep never closes a Run outside its own Workspace

  Given Workspace A has one Run idle past the inactivity threshold and Workspace B has one Run that is well within the threshold
  When the scheduled sweep executes
  Then Workspace A's idle Run is closed as "aborted"
    And Workspace B's Run remains "running", untouched by Workspace A's closure
```

---
_Synced from Jira by sync-jira-issues_
