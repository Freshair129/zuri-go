---
id: FR-010-006
title: Moving a task through the five statuses
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-006 — Moving a task through the five statuses

The system SHALL let a person move a task between `planned`, `doing`, `blocked`, `review` and `done` by drag or by keyboard with the same result, SHALL require a reason when the task is blocked, and SHALL check the move on the server.

## Acceptance criteria
- AC-010-006-01 — Given a card, when it is moved by drag and when it is moved from the keyboard menu, then the stored status is the same (FEAT-004 MT-03).
- AC-010-006-02 — Given a task, when it is moved to `blocked` with no blocker text, then the move is refused and the blocker is asked for.
- AC-010-006-03 — Given a move to `done`, then FR-010-007 decides whether it is allowed.
- AC-010-006-04 — Given a move whose save fails, then the board does not report success and the card returns to its lane (FEAT-004 MT-03).
- AC-010-006-05 — Given a move made from a stale copy of the task, then it is refused with 409 and the board reloads (FR-010-009).

## Implementation
- API built locally 2026-10-01: every save passes `saveError` / `moveError` on the server; a stale `row_version` answers 409.
- Tests: `apps/api/test/task-rules.test.mjs`, `apps/api/test/tasks-api.test.mjs`. UI: drag and a per-card status select both send one `PATCH`; a failure restores the card, a 409 reloads, Blocked asks for the blocker (`Boards.jsx`).

## Notes
- A Workboard task that is Blocked today has no blocker text (the Workboard has no such field, `apps/web/src/content/dashboard/Forms.jsx:39`). It stays valid after the change; the blocker is required only when a person moves a task into Blocked (SDD-010 Decisions, P2 default).
- Status names and lane labels stay as in `STATUSES` (`meeting/model.mjs:2`).
