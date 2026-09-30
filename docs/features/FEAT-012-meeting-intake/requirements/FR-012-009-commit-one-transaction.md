---
id: FR-012-009
title: A meeting commit is stored in one transaction
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FR-010-009]
---

# FR-012-009 — A meeting commit is stored in one transaction

The system SHALL store the tasks, the receipt, the evidence links, the task history, the batch’s commit key and the audit event of a meeting commit in one database transaction, so that a failure leaves none of them behind and a success is already stored when the answer is sent.

## Acceptance criteria
- AC-012-009-01 — Given a commit that fails after its first task has been written — for example while the evidence links are written — then no task, TSK code number, link, week entry, history event, Business revision bump, `commit_key`, payload hash or receipt remains, and the same request then succeeds and creates the tasks once.
- AC-012-009-02 — Given a list of choices in which a later item is refused (an unknown or hidden link target, or a version mismatch) after an earlier item is valid, then nothing of the earlier item is stored.
- AC-012-009-03 — Given a successful commit, then a read made afterwards in a new transaction returns the receipt and the tasks, and exactly one audit event of type `commit` on the meeting exists for the batch, naming the actor (or the local operator) and holding IDs only — no quote and no title.

## Implementation
- `apps/api/db.mjs`: `transaction` runs one request in `BEGIN … COMMIT` (`ISOLATION LEVEL REPEATABLE READ`) and rolls back on any error; `apps/api/api.mjs`: the `meeting-commits` route runs `commitMeeting` inside `scopedTransaction`.
- `apps/api/meeting-commit.mjs`: `commitMeeting` writes through `writeDomain` (`apps/api/workspace.mjs`: tasks, roles, viewers, week entries, history, `meeting_task_links`, the batch’s `commit_key`), then the `commit` audit event (entity type `meetings`, IDs only) and the revision bump, all on the same client.
- Tests: `apps/api/test/meeting-commit.test.mjs` — “a bad choice, an unknown or hidden target, and an error in the middle leave nothing behind (atomicity)” (a database trigger forces a failure when the links are written; row counts, including the TSK counter, are equal before and after, and the retry succeeds) for AC-012-009-01 and -02; “five viewers …” (one audit event, IDs only, no quote, actor named, read afterwards) for AC-012-009-03.

## Notes
- Origin: FEAT-004 MT-13, DOM-MTG side. The [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS for the IndexedDB build (2026-09-30); this requirement describes the PostgreSQL commit of PLAN-002 WI-09 ([SDD-004 amendment](../../FEAT-004-meeting-task-manager/design.md#failure-modes)), tested against local PostgreSQL and released with 0.5.0 (schema 7).
- Not run: a restart of the server process after a commit (the tests read back in a new transaction, not after a restart); a Member’s commit on the hosted site; the commit in a browser ([verification](../../../releases/0.5.0/verification.md)).
- Open item of the WI-09 build, decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D14): the history events of a committed task carried the evidence quotes inside their snapshot, withheld on read but present in the table ([SDD-004 amendment](../../FEAT-004-meeting-task-manager/design.md#open-items-from-the-wi-09-build)). New events written by the local build keep no quote ([FR-011-009](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-009-confidential-meeting-tasks.md) AC-011-009-05; built locally, not released); events already stored on 0.5.0 keep theirs and stay withheld on read. This is the visibility matter of FEAT-011, not of atomicity.
- Without a server workspace (the browser-storage mode still in the code) the client writes tasks and receipt in one IndexedDB record instead; that path is not covered by this requirement.
