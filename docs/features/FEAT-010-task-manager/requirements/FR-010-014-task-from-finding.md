---
id: FR-010-014
title: Create a task from a metric finding
part: FEAT-010-P02
owner: DOM-CAM
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-014 — Create a task from a metric finding

The system SHALL let a person create a task from a metric finding with the campaign, gate, offer and hypothesis already filled in, as one idempotent save of the task and its campaign details.

## Acceptance criteria
- AC-010-014-01 — Given a finding for the gate `cvr` of a campaign, when a person creates a task from it, then the task is linked to that campaign and its details hold the gate, the offer of the finding’s scope and the hypothesis text.
- AC-010-014-02 — Given that creation submitted twice with the same idempotency key, then one task exists.
- AC-010-014-03 — Given that the details cannot be saved, then no task is created.

## Implementation
- Not built as one save. The seed of the form is built in `apps/web/src/content/dashboard/DashboardContent.jsx:108` (`onTask` → `{gate, title, offer, hypothesis, …}`) and saved as a campaign record.
- Depends on FR-010-009 and FR-010-012.

## Notes
- The finding itself stays campaign data; only the task it produces is a task record.
