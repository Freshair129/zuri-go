---
id: FR-011-012
title: Visibility of data that exists before the change
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
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
- Not built.
- Additive schema change: PLAN-002 WI-02.
