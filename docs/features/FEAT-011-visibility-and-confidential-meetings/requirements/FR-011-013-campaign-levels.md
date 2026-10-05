---
id: FR-011-013
title: Visibility levels of a campaign
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [FR-011-004, FR-011-007, FR-011-011]
---

# FR-011-013 — Visibility levels of a campaign

> **Current access rule — ADR-008 (approved 2026-10-05):** campaign visibility and viewer fields remain business metadata, not access grants. A Guest reads every non-secret campaign record in the configured Business, and every active Member has equal CRUD and internal approval rights regardless of those fields. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; the access rules and acceptance criteria below are historical and superseded.

The system SHALL give every campaign one of the levels `public`, `business`, `team` or `restricted`, with the owner and the listed viewers as the people named on it, and SHALL serve the campaign only to the viewers the level allows: anyone for `public`, signed-in Members for `business`, the team's Members and the named people for `team`, the named people for `restricted`. The local operator reads every level and a Business admin gains no reading by being admin. A new campaign is `business`.

## Acceptance criteria
- AC-011-013-01 — Given a campaign created without a level, then it is `business`: every signed-in Member reads it and a Guest does not.
- AC-011-013-02 — Given a `team` campaign, then the Members of its team and the people named on it read it; any other Member gets 404 for it by ID and finds it in no list, the same answer as for a campaign that does not exist.
- AC-011-013-03 — Given a `restricted` campaign with an owner and two viewers, then only those three and the operator read it; a Business admin who is not named does not.
- AC-011-013-04 — Given a `team` campaign without a team, or a `restricted` campaign that names nobody, when it is saved, then the save is refused with 422 (`TEAM_REQUIRED`, `NAMED_REQUIRED`) and nothing changes; the first is also refused by a database CHECK.
- AC-011-013-05 — Given a workspace save that carries a campaign whose ID exists but is hidden from the signed-in Member, then the answer is the generic 409 “reload” answer, not a 500, and nothing changes.
- AC-011-013-06 — Given a new `restricted` campaign created by a Member who is not named on it, then it is refused with 422 (`SELF_EXCLUDED`).

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `campaigns.visibility`, `campaigns.team_id`, `campaign_viewers` and `campaign_audience()` in a new migration (SDD-011 “Data”); `scopeCampaignRecords` and `campaignNames` (`apps/api/audience.mjs`); `writeCampaigns` and `save()` carry the level, with the write order of SDD-011 “Row-level security”.
- Today (0.5.1): campaigns carry the Business boundary only (`001_core.sql:166-176`); a Guest reads every campaign (`apps/api/service.mjs:18`, `apps/api/workspace.mjs:46`).

## Notes
- Extends [ADR-004](../../../architecture/decisions.md) D1 to campaigns; the open choices are Q-V1, Q-V2 and Q-V5 of [ADR-005](../../../architecture/decisions.md).
