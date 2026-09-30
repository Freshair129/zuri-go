---
id: FR-010-013
title: The Workboard as a view of the task records
part: FEAT-010-P02
owner: DOM-CAM
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FEAT-002]
---

# FR-010-013 — The Workboard as a view of the task records

The system SHALL show a campaign’s Workboard and its “งานที่ต้องไปต่อ” panel from the task records linked to that campaign, in the five lanes of the Task Manager, with the original Workboard status shown as a badge.

## Acceptance criteria
- AC-010-013-01 — Given a campaign, then its Workboard lists exactly the tasks linked to it that the viewer may read, including tasks that also belong to a project.
- AC-010-013-02 — Given a Workboard task whose original status is `Ready`, then it is in the lane `planned` with the badge “Ready”; given `Backlog`, the badge is “Backlog” (assumption — PLAN-002 Q8, open).
- AC-010-013-03 — Given a card moved on the Workboard, then the same task is moved on the Task Manager boards: there is one record.
- AC-010-013-04 — Given the “งานที่ต้องไปต่อ” panel, then it is built from the same records as the Workboard.
- AC-010-013-05 — Given a Workboard task, when its campaign fields are edited, then they are saved as campaign task details (FR-010-012).

## Implementation
- Not built. Today the Workboard reads `campaign.tasks`, rebuilt from the `legacy_metadata` of `campaign-legacy` rows (`apps/api/workspace.mjs:37`) and shown in `apps/web/src/content/dashboard/DashboardContent.jsx:91`; the panel is `:57`. Workboard statuses are Backlog, Ready, Doing, Blocked, Review and Done (`apps/web/src/content/shared/model.mjs:88`); Backlog and Ready are stored as `planned` (`workspace.mjs:68`).

## Notes
- FEAT-002 keeps its approved text until these FR files supersede it; its Workboard views are delivered by FEAT-010-P02.
- Open — whether the campaign task form still lets a person choose Backlog or Ready, now that the lanes are the five statuses (SDD-010 Open items).
