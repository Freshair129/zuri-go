---
id: FR-010-014
title: Create a task from a metric finding
part: FEAT-010-P02
owner: DOM-CAM
delivery: implemented
status: approved
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
- Built locally 2026-10-01: `saveCampaignTask` creates the task and its details in one transaction with an idempotency key; the existing finding flow (Workboard entry through `PUT /workspace`) also writes the details in one transaction and finds its record on a repeat.
- Tests: `apps/api/test/tasks-api.test.mjs`.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- The finding itself stays campaign data; only the task it produces is a task record.
