---
id: FR-010-009
title: Task API — idempotent create and versioned update
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-009 — Task API — idempotent create and versioned update

The system SHALL provide per-task operations to create a task with an idempotency key, read it, and update it with its row version, each in one transaction.

## Acceptance criteria
- AC-010-009-01 — Given a signed-in Member, when they create a task with a new idempotency key, then one task is created and returned with its ID, code and row version.
- AC-010-009-02 — Given a create that is replayed with the same key and the same body, then the same task is returned and no second task is created.
- AC-010-009-03 — Given a create with a key already used for a different body, then it is refused with 409 and nothing changes.
- AC-010-009-04 — Given an update that carries the task’s current row version, then the task is updated and its row version increases by one; given an update with an older version, then it is refused with 409 and nothing changes.
- AC-010-009-05 — Given a meeting commit (PLAN-002 WI-09) that creates tasks through the same operation with the keys of its draft items, when the commit is replayed, then the same tasks are returned (FEAT-004 MT-12).
- AC-010-009-06 — Given a body that carries a field the operation does not list, then it is refused and nothing changes.
- AC-010-009-07 — Given a create that fails after the task row is written — on its RACI, viewers or contexts — then no part of the task remains (FEAT-004 MT-13).

## Implementation
- Not built; there is no task endpoint. Tasks are written only by replacing the workspace (`PUT /workspace`, `apps/api/api.mjs:40`; `saveLegacy`, `apps/api/workspace.mjs:141`) under one Business-wide revision.
- Patterns to follow: the `publications` idempotency key (`001_core.sql:51-53`, `UNIQUE(business_id,idempotency_key)`), the row-version check in `save` (`apps/api/service.mjs:35`), and the unknown-field refusal in the same function.
- Contract outline: SDD-010 “API contract (proposed)”.

## Notes
- The whole-workspace save stays for compatibility (FR-010-011).
