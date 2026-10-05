---
id: FR-011-004
title: Task and Project audience metadata
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-004 — Visibility of tasks and projects

The system SHALL retain task and Project audience fields as business metadata, but SHALL NOT use them to filter access. Guests read all non-secret records in the configured Business; every active Member has identical CRUD and internal approval rights for mutable non-secret records, regardless of level, team, owner, assignment or named viewer.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes the audience-based access criteria below. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap; production remains on schema 11 pending separately authorized migration 012 and deployment; implementation evidence remains historical.

## Acceptance criteria
- AC-011-004-01 — Given a new task saved without a visibility, then its visibility is `business` (PLAN-002 Q2).
- AC-011-004-02 — Given a task with visibility `team` and no team, when it is saved, then it is refused.
- AC-011-004-03 — Given a task with any audience or team value, when a Guest or active Member in the Business reads it, then the non-secret task is present.
- AC-011-004-04 — Given a task with any owner, RACI or named-viewer values, when any active Member reads or changes it, then those values do not restrict access.
- AC-011-004-05 — Given any board, list, RACI view, search or “my tasks” view, then it shows all non-secret records in the configured Business, subject to the Business boundary.

## Implementation
- Built locally 2026-10-01: columns `visibility`, `team_id` on `tasks`; `canRead` in `apps/web/src/content/shared/visibility.mjs`; application filter `apps/api/audience.mjs`; row-level security `audience_read` in `006_visibility.sql`; UI `VisibilityFields` in the task form. `projects` follows with FEAT-010.
- Tests: `apps/api/test/visibility.test.mjs`, `apps/api/test/visibility-db.test.mjs`.
- Planned columns `visibility` and `team_id` on `tasks`, and on `projects` when FEAT-010 adds them.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- The people named on a task are defined in FR-011-005.
