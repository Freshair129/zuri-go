---
id: FR-011-012
title: Visibility of data that exists before the change
part: FEAT-011-P02
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-012 — Visibility of data that exists before the change

The system SHALL give every task and meeting that exists when this feature is released the visibility `business`, without changing any other field.

## Acceptance criteria
- AC-011-012-01 — Given the 11 tasks in production, when the migration runs, then all 11 are `business`, Guests no longer see them and every Member still does (PLAN-002 Q5).
- AC-011-012-02 — Given the migration, then task IDs, codes, RACI, MoSCoW entries, attachments and history are unchanged, and a reconciliation report shows the counts before and after.
- AC-011-012-03 — Given production, then the migration runs only after a backup and with the owner’s specific authorization.

## Implementation
- Built: `ADD COLUMN … DEFAULT 'business'` in `006_visibility.sql`. Applied to the local database 2026-10-01 after a backup, with the owner's authorization: counts before and after were equal (tasks 17, task_roles 86, weekly_plan_tasks 17, change_events 73, members 8 in the non-QA Businesses) and every task became `business`. Applied to production on 2026-10-01 (next bullet).
- Additive schema change: PLAN-002 WI-02.
- Released to production on 2026-10-01: migration 006 applied after a backup. Production held 12 tasks (the 11 in AC-011-012-01 was an earlier count), all `business`, and every pre-existing table kept its row count ([verification](../../../releases/0.5.0/verification.md), [database-preservation.json](../../../releases/0.5.0/database-preservation.json)); Guests no longer see them. The Member side is not yet checked on the hosted site.
