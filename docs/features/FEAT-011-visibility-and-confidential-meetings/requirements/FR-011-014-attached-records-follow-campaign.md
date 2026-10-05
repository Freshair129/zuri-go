---
id: FR-011-014
title: Records attached to a campaign follow it
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [FR-011-008, NFR-011-002]
---

# FR-011-014 — Records attached to a campaign follow it

> **Current access rule — ADR-008 (approved 2026-10-05):** linked and unlinked campaign records follow the selected Business boundary, not campaign audience metadata. Guests read every non-secret record; active Members have equal CRUD and internal approval rights. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; the audience restrictions and acceptance criteria below are historical and superseded.

The system SHALL serve the channel links, ledger, content items, publications, goals, goal series, metric series and metric observations of a campaign only to the viewers who may read the campaign, SHALL serve content items, goals and metric series that belong to no campaign only to signed-in Members, and SHALL refuse to attach a record to a campaign the actor cannot read.

## Acceptance criteria
- AC-011-014-01 — Given a campaign a Member may not read, when that Member reads `/state` and `/workspace`, then no content item, publication, goal, series, observation, channel link or ledger collection of that campaign appears, and no count includes it.
- AC-011-014-02 — Given a Member who cannot read a campaign, when they try to create a content item, goal or metric series that names that campaign, or to move one to it, then the save is refused and nothing changes, also when the write bypasses the API and reaches the database directly.
- AC-011-014-03 — Given a content item, goal or metric series that names no campaign, then a Guest reads none of them and a signed-in Member reads all of them, as today.
- AC-011-014-04 — Given a Member named as the owner of a content item or goal of a campaign they may not read, then the ownership gives no access to the campaign or its records.
- AC-011-014-05 — Given a publication, then it is readable exactly when its content item is.
- AC-011-014-06 — Given the channel accounts, then they are readable as today, Guests included, because they name public pages.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. Restrictive policies `follows_campaign` on `campaign_channels`, `content_items`, `goals` and `metric_series`, and through the parent on `publications`, `goal_series` and `metric_observations` (SDD-011 “Row-level security”); `scopeCampaignRecords` filters the snapshot in the application.
- Today (0.5.1): all of them carry `business_scope` only. A foreign-key check bypasses row-level security, so `tasks` and `meetings` need an application check (FR-011-017).

## Notes
- Q-V1 and Q-V4 of [ADR-005](../../../architecture/decisions.md) are the open choices.
