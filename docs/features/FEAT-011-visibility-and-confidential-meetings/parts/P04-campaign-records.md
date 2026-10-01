---
id: FEAT-011-P04
title: Visibility, teams and confidential meetings — Campaign records
owner: DOM-CAM
runtime: SRV-001
delivery: declared
status: proposed
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004]
---

# FEAT-011-P04 — Visibility of campaign records

Part of [FEAT-011](../feature.md), owned by [DOM-CAM](../../../domains/campaign/README.md). **Proposed 2026-10-01 (PLAN-003 node V1); not approved, not built.** Declared by [ADR-005](../../../architecture/decisions.md) (proposed), which carries the owner's open questions; designed in [SDD-011](../design.md#proposed-visibility-of-campaign-records-and-member-profiles-v1-2026-10-01). It applies the levels of [ADR-004](../../../architecture/decisions.md) to the campaign records that Guests still read whole (PLAN-002 Q1).

## Scope
- A level (`public`, `business`, `team`, `restricted`) and named people on each campaign; the records attached to it follow.
- What a Guest reads of a public campaign: never its ledger (orders, leads, customer IDs).
- Who changes a campaign's level, and how a campaign's level meets its Workboard tasks and its meetings.
- The overview, the AI-summary input, exports and backups follow the campaigns the viewer may read.
- Existing campaigns become `business`; Members see no change.

## Data
- proposed: `visibility` and `team_id` on `campaigns`; table `campaign_viewers`; policies on `campaigns`, `campaign_channels`, `campaign_states`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series`, `metric_observations` and the matching `change_events` (migration 008)

## Boundary
Filters by the viewer from FEAT-011-P01; leaves tasks and meetings to their own audiences (FEAT-011-P02, FEAT-011-P03), which only read the campaign's level to choose a default for a new Workboard task.

## Requirements
- [FR-011-013](../requirements/FR-011-013-campaign-levels.md) — Visibility levels of a campaign
- [FR-011-014](../requirements/FR-011-014-attached-records-follow-campaign.md) — Records attached to a campaign follow it
- [FR-011-015](../requirements/FR-011-015-guest-public-campaign.md) — What a Guest reads of a public campaign
- [FR-011-016](../requirements/FR-011-016-changing-campaign-level.md) — Changing the level of a campaign
- [FR-011-017](../requirements/FR-011-017-campaign-tasks-meetings.md) — Tasks and meetings of a campaign
- [FR-011-018](../requirements/FR-011-018-overview-brief-exports.md) — Overview, brief, exports and backups follow campaign records
- [FR-011-019](../requirements/FR-011-019-existing-campaigns.md) — Visibility of campaigns that exist before the change
- [NFR-011-002](../requirements/NFR-011-002-campaign-row-level-security.md) — Row-level security enforces the campaign audiences
- [NFR-011-003](../requirements/NFR-011-003-campaign-read-cost.md) — The added policies keep reads fast
