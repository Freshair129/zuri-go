---
id: FR-010-001
title: Create a task from a title alone
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-001 — Create a task from a title alone

The system SHALL let a signed-in Member create a task in any department from a title alone, and fill in the rest later without changing the task’s ID, code or RACI.

## Acceptance criteria
- AC-010-001-01 — Given a signed-in Member, when they save a task with only a title, then it is created with status `planned`, the next `TSK-nnnn` code, visibility `business` (FR-011-004) and no context.
- AC-010-001-02 — Given a task created from a title, when its description, deliverable, due date, acceptance criterion or R/A/C/I are added later, then its ID, code and existing RACI are unchanged and every field left blank stays blank (FEAT-004 MT-25).
- AC-010-001-03 — Given a title that is empty or only spaces, when the task is saved, then it is refused and nothing is stored.
- AC-010-001-04 — Given a Guest, when they try to create a task, then it is refused with 401 (FR-010-010).

## Implementation
- Built 2026-10-01 (schema 7): `createTask` / `updateTask` in `apps/api/tasks.mjs`, routes `POST /tasks` and `PATCH /tasks/:id` in `apps/api/api.mjs`; `TSK-nnnn` from `allocate`.
- Tests: `apps/api/test/tasks-api.test.mjs` (create from a title, fill in later, Guest 401).
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- A department is a team context of the task (FR-010-002), so “in any department” is satisfied by giving the team at creation or later; it is never required.
