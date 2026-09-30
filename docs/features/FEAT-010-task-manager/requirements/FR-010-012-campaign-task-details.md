---
id: FR-010-012
title: Campaign task details
part: FEAT-010-P02
owner: DOM-CAM
delivery: declared
status: proposed
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
- Not built. Today these fields live in `legacy_metadata` of the `campaign-legacy` row (`apps/api/workspace.mjs:68`); their form is `apps/web/src/content/dashboard/Forms.jsx:39` and `:54`; the Low/Medium/High scale is not MoSCoW (FEAT-004 spec, MoSCoW section).
- Planned table `campaign_task_details`, owned by DOM-CAM (ADR-002 D4, ADR-003 D4); SDD-010 Data.

## Notes
- Open — what happens to a task’s details when its campaign link is removed (SDD-010 Open items).
