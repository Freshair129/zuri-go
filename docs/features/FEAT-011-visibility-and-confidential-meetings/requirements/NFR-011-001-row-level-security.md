---
id: NFR-011-001
title: Row-level security enforces the same audiences
part: FEAT-011-P01
delivery: implemented
status: approved
relations:
  decided_by: [ADR-004]
---

# NFR-011-001 — Row-level security enforces the same audiences

The database SHALL enforce the audiences of FR-011-004, FR-011-006 and FR-011-007 with row-level security on every table that holds task or meeting content, so that a read path that misses a filter still returns no row outside the viewer’s audience.

## Measurement
- Given a test that queries each task and meeting table directly as a Guest and as a Member outside the audience, with the application filter bypassed, then no row outside the audience is returned.
- Given the runtime role, then it stays non-superuser and NOBYPASSRLS.
- Given the local operator viewer, then every row of the local database is visible, as today.
- Given a new history event of a task with meeting evidence, stored at a commit or at a later edit, then a direct query of `change_events` finds no evidence quote of that meeting: row-level security decides who reads a row, so the quote is kept out of the row itself ([FR-011-009](FR-011-009-confidential-meeting-tasks.md) AC-011-009-05; [PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D14). Events stored earlier are not rewritten and stay withheld on read.

## Implementation
- Built locally 2026-10-01: restrictive policies layered L0 (membership) → L1 (tasks, meetings) → L2 (attachments, weekly entries, revisions, batches, links, history) in `006_visibility.sql`.
- Measured: `apps/api/test/visibility-db.test.mjs` queries each layer directly as a Guest and as Members outside the audience; the runtime role stays `NOSUPERUSER NOBYPASSRLS`.
- Extends the `business_scope` policies of `001_core.sql:166-176` with the viewer settings of FR-011-003.
- Released 2026-10-01 in 0.5.1, for the quote measurement: `apps/api/workspace.mjs:writeDomain` (`bareEvent`); measured, written with the change and not run for this record, by `apps/api/test/meeting-commit.test.mjs` (“history events keep no quote text, after a commit or a later edit…”).
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- The direct-query test runs in `npm test` against a QA Business.
- An NFR carries a measurement, not AC IDs: STD-002 R1 defines AC IDs under an FR only.
