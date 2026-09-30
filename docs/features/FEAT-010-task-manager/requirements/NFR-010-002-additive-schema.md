---
id: NFR-010-002
title: The schema change is additive and reconcilable
part: FEAT-010-P01
delivery: implemented
status: approved
relations:
  decided_by: [ADR-003]
---

# NFR-010-002 — The schema change is additive and reconcilable

The schema change of FEAT-010 SHALL only add tables, columns, indexes and policies, SHALL delete and rewrite no existing row, and SHALL leave the code of the previous release able to run against it.

## Measurement
- Given the migration file, then it contains no `DROP`, no `TRUNCATE`, no `DELETE` or `UPDATE` of existing rows and no change of the type of an existing column; a review of the file records this.
- Given a local QA Business before and after the migration, then the counts of tasks, `task_roles`, `weekly_plan_tasks`, `task_attachments`, `change_events` and `members` per Business are equal, and every existing task keeps its ID, code, status and `legacy_metadata`.
- Given the `npm test` suite of the previous release run against the migrated local database, then it passes.
- In production the migration runs only after `npm run backup` and with the owner’s specific authorization (AGENTS.md). A source rollback after a later schema change is assessed first, not assumed compatible.

## Implementation
- Built: `apps/api/migrations/007_tasks_projects.sql` contains no DROP, TRUNCATE, DELETE, UPDATE of existing rows or type change (reviewed 2026-10-01).
- Measured on the local database 2026-10-01 after a backup: counts equal before and after (non-QA Businesses: tasks 17, task_roles 86, weekly_plan_tasks 17, change_events 73, members 8); the previous release's `npm test` passed on schema 7 (121 tests, Python, metrics, extraction). Production not migrated.

## Notes
- An NFR carries a measurement, not AC IDs: STD-002 R1 defines AC IDs under an FR only.
- Follows the method of FR-011-012 and AC-011-012-02.
