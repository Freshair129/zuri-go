---
id: FR-010-001
title: Create a task from a title alone
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
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
- Not built as a per-task operation. Today a task is created by replacing the whole workspace: `saveTask` (`apps/web/src/content/meeting/model.mjs:35`) requires only the title (`required(input.title…,'ชื่องาน')`), defaults the status to `planned`, and `writeDomain` (`apps/api/workspace.mjs:74`) allocates the code through `allocate` (`apps/api/service.mjs:32`).
- The per-task operation is FR-010-009.

## Notes
- A department is a team context of the task (FR-010-002), so “in any department” is satisfied by giving the team at creation or later; it is never required.
