---
id: FR-010-005
title: Boards for all work, a campaign, a project, a team, unlinked work and my tasks
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FR-011-004, FR-011-007]
---

# FR-010-005 — Boards for all work, a campaign, a project, a team, unlinked work and my tasks

The system SHALL show the task records as boards of the five existing lanes — for all work, one campaign, one project, one team, unlinked work and “my tasks” — and SHALL keep Weekly To-do, List and RACI showing the same records.

## Acceptance criteria
- AC-010-005-01 — Given a campaign board, then it lists exactly the tasks linked to that campaign that the viewer may read, whatever other contexts they carry.
- AC-010-005-02 — Given a project board or a team board, then it lists exactly the tasks linked to that project or team that the viewer may read.
- AC-010-005-03 — Given the unlinked board, then it lists exactly the readable tasks that have no campaign, project, team, content item or goal.
- AC-010-005-04 — Given a Member who is R of task X and is not named on task Y, then “my tasks” contains X and does not contain Y (“mine” means the Member is the task’s R or A — owner, 2026-10-01).
- AC-010-005-05 — Given a Guest, then every board shows only public tasks and “my tasks” is not offered.
- AC-010-005-06 — Given any board, then its lane counts and cards come from the same set of readable tasks as the list, the RACI view and search (AC-011-004-05).
- AC-010-005-07 — Given Weekly To-do, List and RACI after this change, then each shows the same tasks, statuses and per-week MoSCoW priorities as before (FEAT-004 MT-03, MT-27, MT-28).

## Implementation
- API built locally 2026-10-01: `listTasks` with `board=all|campaign|project|team|unlinked|mine` (`apps/api/tasks.mjs`), `onBoard` (`shared/task-rules.mjs`); “mine” is R or A.
- Tests: `apps/api/test/task-rules.test.mjs`, `apps/api/test/tasks-api.test.mjs`. UI: Boards view (all, campaign, project, team, unlinked, mine for a signed-in Member) in `apps/web/src/content/meeting/Boards.jsx`; Weekly To-do, List and RACI unchanged.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Decided — PLAN-002 Q9 (owner, 2026-10-01): the site menu names are “Task Manager” and “Meetings”.
- PLAN-002 Q10 (decided 2026-10-01, “later”): dragging a card to reorder it within a lane is not part of this requirement.
- A board is a filter of the records, never a copy of them (ADR-003 D1).
