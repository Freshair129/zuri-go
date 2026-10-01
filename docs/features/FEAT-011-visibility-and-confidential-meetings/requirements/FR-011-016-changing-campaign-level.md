---
id: FR-011-016
title: Changing the level of a campaign
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004]
  relates_to: [FR-011-011, FR-011-017]
---

# FR-011-016 — Changing the level of a campaign

The system SHALL let only the campaign's owner, as stored before the request, or the local operator widen its level or move a `team` campaign to another team, with a non-empty reason; SHALL let any Member who can read the campaign narrow it without a reason; SHALL audit every change; and SHALL keep the stored owner when a workspace save carries the same owner text.

## Acceptance criteria
- AC-011-016-01 — Given a `restricted` campaign, when its owner widens it to `business` with a reason, then the level changes and one audit event records the old and new level, the reason and the session actor.
- AC-011-016-02 — Given a Member who is named on the campaign but is not its owner, when they widen it, then the answer is 403 `WIDEN_DENIED`; given the owner without a reason, 422 `REASON_REQUIRED`; in both cases nothing changes.
- AC-011-016-03 — Given a `business` campaign, when any Member who can read it narrows it to `team` with a team, then it changes without a reason.
- AC-011-016-04 — Given a narrowing after which the actor could no longer read the campaign, then it is refused with 422 `SELF_EXCLUDED` and nothing changes.
- AC-011-016-05 — Given a campaign with no owner, when a Member other than the operator widens it, then the answer is 403; the operator may widen it with a reason.
- AC-011-016-06 — Given a workspace save whose owner text equals the display name of the stored owner, then `owner_member_id` is unchanged, also when another Member shares that name; given owner text that names one other Member, then that Member becomes the owner and an audit event records it.
- AC-011-016-07 — Given a Business admin who is not named on a `restricted` campaign, then they cannot read or change it.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `visibilityChange` (`apps/web/src/content/shared/visibility.mjs`) is reused with the stored owner as `accountableId`; `keepOwner` and the level fields in `writeCampaigns` (`apps/api/workspace.mjs`); `visibility`, `team_id`, `viewer_ids` and `visibility_reason` in `save()` for campaigns (`apps/api/service.mjs`).
- Today (0.5.1): `writeCampaigns` rebinds `owner_member_id` from the owner text on every save and writes NULL unless exactly one Member matches (`apps/api/workspace.mjs:74`).

## Notes
- Q-V5 and Q-V9 of [ADR-005](../../../architecture/decisions.md) are the open choices: who may widen, and whether the owner stays rebound from the text.
- Extends [ADR-004](../../../architecture/decisions.md) D8 and [FR-011-011](FR-011-011-widening-visibility.md) to campaigns.
