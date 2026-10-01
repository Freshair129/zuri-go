---
id: FR-011-017
title: Tasks and meetings of a campaign
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: proposed
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004]
  relates_to: [FR-010-013, FR-011-004, FR-011-006, FR-011-009]
---

# FR-011-017 — Tasks and meetings of a campaign

The system SHALL keep the audience of a task or meeting independent of its campaign's level, SHALL serve a task or meeting whose campaign the viewer cannot read with the campaign's ID and no other campaign field, and SHALL start a task created on the Workboard of a `team` or `restricted` campaign at that campaign's level, with its team or its named people, unless the creator picks another level.

## Acceptance criteria
- AC-011-017-01 — Given a `restricted` campaign and a `business` task linked to it, when a Member who cannot read the campaign reads the task, then the task is served, with its `campaign_id` and no campaign code, name, state or figure, and the campaign's Workboard is not served to that Member.
- AC-011-017-02 — Given a `restricted` campaign with an owner and two viewers, when a Member creates a task on its Workboard without a level, then the task is `restricted` and the three people are its viewers.
- AC-011-017-03 — Given a `team` campaign, when a task is created on its Workboard without a level, then it is `team` with the campaign's team.
- AC-011-017-04 — Given a `business` or a `public` campaign, when a task is created on its Workboard, then it is `business`, as today.
- AC-011-017-05 — Given a campaign narrowed to `restricted` that has three linked tasks of level `business`, then the tasks are unchanged, the response of the change reports 3 tasks broader than the campaign, and each task can be narrowed by any Member who can read it.
- AC-011-017-06 — Given a task or meeting that names a campaign the actor cannot read, when a link is newly set through `PUT /workspace` or `PATCH /tasks`, then it is refused (409 or 422 `CONTEXT_NOT_FOUND`); when the link is unchanged, a save of another field succeeds.
- AC-011-017-07 — Given a meeting that names a campaign, then it follows the same rules as a task.

## Implementation
- Proposed 2026-10-01; not built. `workboardDefault` and `broaderTasks` (`apps/web/src/content/shared/visibility.mjs`); `saveCampaignTask` and `writeWorkboardEntry` (`apps/api/campaign-tasks.mjs`); `checkContexts` (`apps/api/tasks.mjs`) looks up the campaign, content item and goal only when that link changes; `writeDomain` (`apps/api/workspace.mjs`) refuses a new link to a hidden campaign.
- Today (0.5.1): `checkContexts` runs `SELECT id FROM campaigns` on every create and update, and the Workboard default is `business`. [SDD-011](../design.md) (“Audience rule”) says the API refuses another level for `campaign-legacy` tasks; the code has no such check.

## Notes
- Q-V6 of [ADR-005](../../../architecture/decisions.md) is the open choice: independent audiences with a default, fully independent, or never broader than the campaign.
- Keeps [ADR-003](../../../architecture/decisions.md) D1: a task is one record with its own audience.
