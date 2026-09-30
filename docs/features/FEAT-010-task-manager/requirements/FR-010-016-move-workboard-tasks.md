---
id: FR-010-016
title: Moving the existing Workboard tasks
part: FEAT-010-P02
owner: DOM-CAM
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-016 — Moving the existing Workboard tasks

The system SHALL move the existing Workboard tasks into the new model by a reviewed backfill — a backup, a count per campaign and status, a dry run, the owner’s authorization for production, a reconciliation and an idempotent replay — without losing, duplicating or rewriting any task or stored snapshot.

## Acceptance criteria
- AC-010-016-01 — Given a Business, when the dry run is executed, then it reports the number of Workboard tasks per campaign and status and the mapping of every field, and writes nothing.
- AC-010-016-02 — Given a backfill that has been run, when it is run again, then nothing changes.
- AC-010-016-03 — Given a backfill, then the counts per campaign and status equal the dry run, no task is lost or duplicated, and task IDs and codes are unchanged.
- AC-010-016-04 — Given a backfill, then `legacy_metadata` of every task row and every stored evidence snapshot are unchanged, and every attachment still resolves.
- AC-010-016-05 — Given a Workboard task with an owner written as text, then the backfill keeps the text as the owner label and binds no Member (FR-010-008).
- AC-010-016-06 — Given production, then the backfill runs only after `npm run backup`, with the count of Workboard tasks in production recorded first, and with the owner’s specific authorization (PLAN-002 Q12).

## Implementation
- Not built. Workboard tasks are already `tasks` rows with `source_kind = 'campaign-legacy'` (`apps/api/workspace.mjs:68`), so the backfill writes `campaign_task_details`, the owner label and the completion marker for rows that exist; it does not create the rows.
- How many Workboard tasks production holds was never recorded (ARCH-003).

## Notes
- Delivered in PLAN-002 P4 (WI-10). Deployment is not a database migration or rollback authorization (AGENTS.md).
- Open — how a Blocked Workboard task with no blocker text is treated (FR-010-006 Notes).
