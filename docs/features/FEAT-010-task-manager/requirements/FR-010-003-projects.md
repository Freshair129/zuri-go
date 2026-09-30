---
id: FR-010-003
title: Projects
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FR-011-004, FR-011-011]
---

# FR-010-003 — Projects

The system SHALL let a signed-in Member create, change and archive projects that gather work outside a campaign, each with a `PRJ-nnnn` code, a name, a description, a status (`active`, `on_hold`, `done` or `archived`), an owner Member, a team and dates, and SHALL show each project’s tasks and how many are in each status.

## Acceptance criteria
- AC-010-003-01 — Given a signed-in Member, when they save a project with only a name, then it is created with the next `PRJ-nnnn` code of the Business, status `active` and visibility `business` (FR-011-004).
- AC-010-003-02 — Given a project, when its status is set to any value other than the four above, then the save is refused.
- AC-010-003-03 — Given planned dates, when the end is before the start, then the save is refused.
- AC-010-003-04 — Given a project with tasks, when it is archived, then its tasks stay, keep their link to it and stay readable by their own audience.
- AC-010-003-05 — Given a project, when its page is opened, then it lists the tasks the viewer may read and the number of them in each of the five statuses.
- AC-010-003-06 — Given a project code that was used once, when any later project is created, then the code is not reused.
- AC-010-003-07 — Given a Guest, when they try to create or change a project, then it is refused with 401.

## Implementation
- Built locally 2026-10-01: table `projects` and `project_viewers` (`apps/api/migrations/007_tasks_projects.sql`), `apps/api/projects.mjs` (list, page with counts, create, update), routes `/projects`; `PRJ-nnnn` from `allocate`.
- Tests: `apps/api/test/tasks-api.test.mjs`. UI: Projects view and project page in `apps/web/src/content/meeting/Boards.jsx`.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- **Progress** is the task count per status (AC-010-003-05); no percentage (SDD-010 Decisions, P2 default).
- **Named on a project** (owner, 2026-10-01): its owner and its listed viewers (`project_viewers`); a project must have an owner Member.
- Creating a project from a name alone follows the rule of FR-010-001 by analogy; the owner may require an owner Member at creation.
