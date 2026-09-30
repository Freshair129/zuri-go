---
id: FR-010-016
title: Moving the existing Workboard tasks
part: FEAT-010-P02
owner: DOM-CAM
delivery: implemented
status: approved
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
- Built 2026-10-01: `apps/api/backfill-workboard.mjs` (operator CLI, never packaged). Dry run by default in a read-only transaction; `--run` writes details, the owner label, the Done marker and empty mapped columns of existing rows, reconciles the counts and rolls back on any difference; a production run also needs `--production-authorized`. The full report stays private under `.local/backfill/`.
- Rehearsed: `apps/api/test/backfill.test.mjs` on a QA Business (dry run writes nothing; the run matches it; IDs, codes, `legacy_metadata`, snapshots and counts unchanged; the owner text is not bound; a replay changes nothing).
- **Recorded counts, 2026-10-01 (dry runs, read-only):** production (schema 5) holds **0** Workboard tasks — no `campaign-legacy` rows and no tasks inside `campaign_states` — among 12 tasks (7 manual, 5 weekly-plan); the local Business also holds 0. There is nothing to move today; the dry run is repeated after the release migrates production, before any run.

## Notes
- Delivered in PLAN-002 P4 (WI-10). Deployment is not a database migration or rollback authorization (AGENTS.md).
- A Blocked Workboard task with no blocker text stays valid (FR-010-006 Notes).
