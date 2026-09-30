---
id: FR-010-009
title: Task API — idempotent create and versioned update
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
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
- Built locally 2026-10-01: `idempotency_key` / `idempotency_hash` with a unique partial index; `idempotencyOutcome`; `row_version` compared before every update, which raises it by exactly one; one transaction per request.
- Tests: `apps/api/test/tasks-api.test.mjs`, `apps/api/test/cloud-handler.test.mjs` (hosted routes). AC-010-009-05 is met by the server-side meeting commit (WI-09, released with 0.5.0): `apps/api/meeting-commit.mjs:commitMeeting` with `apps/api/workspace.mjs:writeDomain`, tested in `apps/api/test/meeting-commit.test.mjs` ([FR-012-008](../../FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md)).
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- The whole-workspace save stays for compatibility (FR-010-011).
- Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D1): the meeting commit writes its tasks through `writeDomain`, not through `createTask`; the in-process call applies the same task rules, audit and single transaction, and counts as the task domain’s contract (ADR-002 D2). It derives one key per batch rather than one per draft item. No code change.
- Wording of AC-010-009-05, left as written: it speaks of “the same operation with the keys of its draft items”, which differs from that mechanism; its outcome (a replay returns the same tasks) holds. Re-approval of the wording is for the owner.
