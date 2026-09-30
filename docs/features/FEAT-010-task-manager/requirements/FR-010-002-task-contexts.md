---
id: FR-010-002
title: Contexts of a task
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FR-011-004, FR-011-011]
---

# FR-010-002 — Contexts of a task

The system SHALL let a task link to a campaign, a project, a team, a content item or a goal — several at once or none — and SHALL refuse a combination that contradicts itself or reaches into another Business.

## Acceptance criteria
- AC-010-002-01 — Given a task, when it is linked to a campaign and to a project, then both links are stored and the task appears on the board of each (PLAN-002 Q6, decided 2026-10-01).
- AC-010-002-02 — Given a task with no context, then it is valid and is shown as general work (งานทั่วไป) on the unlinked board (FR-010-005).
- AC-010-002-03 — Given a content item or goal that belongs to campaign A, when the task is linked to it and to campaign B, then the save is refused.
- AC-010-002-04 — Given a project, team, campaign, content item or goal of another Business, when a task is linked to it, then the save is refused.
- AC-010-002-05 — Given a task the viewer may read whose project the viewer may not read (FR-011-004), then the task is served without the project’s code and name.
- AC-010-002-06 — Given a task with visibility `team`, when its team is changed, then the widening rule of FR-011-011 applies: the A and a reason are needed.

## Implementation
- Built locally 2026-10-01: context columns checked by `checkContexts` (`apps/api/tasks.mjs`) and `contextError` (`apps/web/src/content/shared/task-rules.mjs`); a hidden project is served without code and name (`loadTasks`).
- Tests: `apps/api/test/task-rules.test.mjs`, `apps/api/test/tasks-api.test.mjs`.

## Notes
- `tasks.team_id` is the team context of the task and is also the team that FR-011-004 uses for visibility `team`. One column serves both (SDD-010 Data); FEAT-011 already owns its meaning.
- Visibility and named viewers are FR-011-004 and FR-011-005; this file does not restate them.
