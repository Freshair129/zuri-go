---
id: NFR-011-001
title: Row-level security enforces Business scope
part: FEAT-011-P01
delivery: declared
status: approved
relations:
  decided_by: [ADR-004, ADR-008]
---

# NFR-011-001 — Row-level security enforces Business scope

The database SHALL enforce the selected Business boundary with row-level security on every table that holds task or meeting content. Guests read every non-secret row within the Business, and every active Member has equal rights to mutable rows regardless of former audience or assignment metadata. Guest mutations and internal approvals are denied; audit events stay append-only.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, replaces per-audience row filtering. The migration and checks below record the former schema 10 implementation; the new policy requires forward migration 012 to schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap; production remains on schema 11 pending separately authorized migration 012 and deployment.

## Measurement
- Given direct runtime-role queries to every task, meeting and linked-content table, then a Guest and active Members read all non-secret rows in the selected Business regardless of audience, team, ownership or participation, with no rows from another Business.
- Given a Guest direct write or internal-approval attempt, then it is denied without changing rows; given an active Member, then writes to mutable in-Business rows succeed and remain session-attributed.
- Given direct access to `change_events`, then both classes can read in-Business audit history, but neither can update or delete it.
- Given the runtime role, then it stays non-superuser and NOBYPASSRLS.
- Given the local operator viewer, then every row of the local database is visible, as today.
- Given a new history event of a task with meeting evidence, stored at a commit or at a later edit, then a direct query of `change_events` finds no evidence quote of that meeting: row-level security decides who reads a row, so the quote is kept out of the row itself ([FR-011-009](FR-011-009-confidential-meeting-tasks.md) AC-011-009-05; [PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D14). Events stored earlier are not rewritten and stay withheld on read.

## Implementation
- Former audience policies were built locally 2026-10-01 in schema 6: restrictive policies layered L0 (membership) → L1 (tasks, meetings) → L2 (attachments, weekly entries, revisions, batches, links, history) in `006_visibility.sql`. ADR-008's replacement requires forward migration 012 to schema 12.
- Measured: `apps/api/test/visibility-db.test.mjs` queries each layer directly as a Guest and as Members outside the audience; the runtime role stays `NOSUPERUSER NOBYPASSRLS`.
- Extends the `business_scope` policies of `001_core.sql:166-176` with the viewer settings of FR-011-003.
- Released 2026-10-01 in 0.5.1, for the quote measurement: `apps/api/workspace.mjs:writeDomain` (`bareEvent`); measured, written with the change and not run for this record, by `apps/api/test/meeting-commit.test.mjs` (“history events keep no quote text, after a commit or a later edit…”).
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- The direct-query test runs in `npm test` against a QA Business.
- An NFR carries a measurement, not AC IDs: STD-002 R1 defines AC IDs under an FR only.
