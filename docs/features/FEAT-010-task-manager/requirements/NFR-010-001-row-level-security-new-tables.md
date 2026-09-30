---
id: NFR-010-001
title: Row-level security covers the new task tables
part: FEAT-010-P01
delivery: implemented
status: approved
relations:
  decided_by: [ADR-003]
  relates_to: [NFR-011-001]
---

# NFR-010-001 — Row-level security covers the new task tables

The database SHALL enforce, with row-level security on `projects` and `campaign_task_details`, the same audiences as NFR-011-001 enforces on tasks, so that a read path that misses a filter still returns no row outside the viewer’s audience.

## Measurement
- Given a test that queries `projects` and `campaign_task_details` directly as a Guest and as a Member outside the audience, with the application filter bypassed, then no row outside the audience is returned.
- Given a `campaign_task_details` row, then it is returned only when its task is (the policy follows the task, as the attachment policy does).
- Given the runtime role, then it stays non-superuser and NOBYPASSRLS.
- Given the local operator viewer, then every row of the local database is visible, as today.
- The result is recorded with the release evidence of PLAN-002 P2. The `projects` policy cannot be measured until the owner decides who is named on a restricted project (FR-010-003 Notes).

## Implementation
- Built locally 2026-10-01: `project_audience` and restrictive policies on `projects`, `signed_in` on `project_viewers`, `follows_task` on `campaign_task_details`, `follows_project` on `change_events` (`007_tasks_projects.sql`).
- Measured: `apps/api/test/tasks-api.test.mjs` (direct queries as owner, listed viewer, outsider, admin, Guest and operator).

## Notes
- An NFR carries a measurement, not AC IDs: STD-002 R1 defines AC IDs under an FR only.
- Extends `006_visibility.sql` (layers L1 and L2, SDD-011 “Row-level security”), which reserved “later `projects`” in layer L1.
