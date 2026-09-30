---
id: FR-011-004
title: Visibility of tasks and projects
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-004 — Visibility of tasks and projects

The system SHALL store one visibility level on every task and project — `public`, `business`, `team` or `restricted` — defaulting to `business`. It SHALL show an item only to its audience: anyone for `public`; signed-in Members for `business`; the item’s team and the people named on it for `team`; only the people named on it for `restricted`.

## Acceptance criteria
- AC-011-004-01 — Given a new task saved without a visibility, then its visibility is `business` (PLAN-002 Q2).
- AC-011-004-02 — Given a task with visibility `team` and no team, when it is saved, then it is refused.
- AC-011-004-03 — Given a `team` task of the accounting team, when a sales Member who is not named on it reads the board, then the task is absent; when an accounting Member reads it, then it is present.
- AC-011-004-04 — Given a `restricted` task, when a Member who is its R, A, C, I or a named viewer reads it, then it is present; any other Member, an admin included, does not see it.
- AC-011-004-05 — Given any board, list, RACI view, search or “my tasks” view, then it shows exactly the items the viewer may read.

## Implementation
- Not built.
- Planned columns `visibility` and `team_id` on `tasks`, and on `projects` when FEAT-010 adds them.

## Notes
- The people named on a task are defined in FR-011-005.
