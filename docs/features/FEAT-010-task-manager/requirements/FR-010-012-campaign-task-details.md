---
id: FR-010-012
title: Campaign task details
part: FEAT-010-P02
owner: DOM-CAM
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-002, ADR-003]
  relates_to: [FR-011-004]
---

# FR-010-012 — Campaign task details

The system SHALL keep a campaign task’s gate, offer, hypothesis, action, estimate, outcome, Low/Medium/High priority and original Workboard status in campaign-owned details, SHALL write them in the same transaction as the task through the campaign’s endpoint, and SHALL never convert the Low/Medium/High priority to MoSCoW.

## Acceptance criteria
- AC-010-012-01 — Given a campaign task saved with a gate and a hypothesis, then the task row and its details row both exist; if either write fails, then neither exists.
- AC-010-012-02 — Given a task with no campaign context, then it has no details row.
- AC-010-012-03 — Given a campaign task with priority `High`, then `High` is stored as given and the task’s MoSCoW entry for any week is unchanged (empty for a new task).
- AC-010-012-04 — Given a details row, then it is read and hidden together with its task, by the task’s audience (NFR-010-001; FR-011-004).
- AC-010-012-05 — Given a body sent to the general task operation (FR-010-009) that carries a campaign-only field, then it is refused and nothing changes.

## Implementation
- Built locally 2026-10-01: table `campaign_task_details`; `saveCampaignTask` and routes `POST /campaigns/:id/tasks`, `PATCH /campaigns/:id/tasks/:taskId` (`apps/api/campaign-tasks.mjs`); details follow the task's audience (row-level security).
- Tests: `apps/api/test/tasks-api.test.mjs`.

## Notes
- When a task’s campaign link is removed, its details row is kept and no longer shown, so re-linking restores it (SDD-010 Decisions, P2 default).
