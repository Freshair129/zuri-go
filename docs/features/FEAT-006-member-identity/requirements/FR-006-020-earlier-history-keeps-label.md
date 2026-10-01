---
id: FR-006-020
title: History written before Member sign-in keeps its original label
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-019]
---

# FR-006-020 — History written before Member sign-in keeps its original label

The system SHALL keep every event written before Member sign-in immutable and labelled as it was (the shared team or the local operator), and SHALL NOT attribute it to a Member afterwards.

## Acceptance criteria
- AC-006-020-01 — Given the events that existed when Member sign-in began, then each still names its original actor label and has no actor Member.
- AC-006-020-02 — Given a new write to a task that has earlier events, then the earlier events are unchanged and only the new event names the Member.

## Implementation
- `apps/api/migrations/005_member_identity.sql` — adds the nullable `change_events.actor_pid` and updates no existing event; `apps/api/service.mjs:audit` and `apps/api/workspace.mjs:writeDomain` attribute new events only.
- Evidence: the 0.4.0 record states that previous events were retained and that existing task and Member data stayed identical ([member review](../../../history/zuri-go-member-review/verification.md)). Read from the migration on 2026-10-01; no committed test asserts it.

## Notes
- Spec: [spec.md](../spec.md) §1 assumption 3, §3 (“legacy shared/local events stay nullable”), §6 (“Existing shared/local historical events remain honestly labeled”).
