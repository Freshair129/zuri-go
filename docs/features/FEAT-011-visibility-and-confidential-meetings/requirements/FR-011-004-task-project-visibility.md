---
id: FR-011-004
title: Visibility of tasks and projects
part: FEAT-011-P02
owner: DOM-TSK
delivery: implemented
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
- Built locally 2026-10-01: columns `visibility`, `team_id` on `tasks`; `canRead` in `apps/web/src/content/shared/visibility.mjs`; application filter `apps/api/audience.mjs`; row-level security `audience_read` in `006_visibility.sql`; UI `VisibilityFields` in the task form. `projects` follows with FEAT-010.
- Tests: `apps/api/test/visibility.test.mjs`, `apps/api/test/visibility-db.test.mjs`.
- Planned columns `visibility` and `team_id` on `tasks`, and on `projects` when FEAT-010 adds them.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- The people named on a task are defined in FR-011-005.
