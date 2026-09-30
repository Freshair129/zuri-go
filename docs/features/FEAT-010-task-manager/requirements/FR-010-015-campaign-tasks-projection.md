---
id: FR-010-015
title: campaign.tasks stays complete as a projection
part: FEAT-010-P02
owner: DOM-CAM
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FR-011-007]
---

# FR-010-015 — campaign.tasks stays complete as a projection

The system SHALL build each campaign’s `tasks` array from the task records and their campaign details, so that campaign summaries, evidence snapshots and backups still hold every campaign task in the shape they hold today.

## Acceptance criteria
- AC-010-015-01 — Given a campaign, then its `tasks` array holds one entry per readable task linked to it, with the Workboard fields of today’s entries.
- AC-010-015-02 — Given an evidence snapshot or review stored before the change, then it is unchanged after it.
- AC-010-015-03 — Given a backup made after the change, then it contains every campaign task the exporting viewer may read, with the same Workboard fields.
- AC-010-015-04 — Given a backup made before the change, when it is restored into an empty Business, then the campaign tasks become the same task records and details that the backfill would produce, with no duplicate.
- AC-010-015-05 — Given a viewer who may not read some campaign tasks (FR-011-007), then their projection omits those tasks.

## Implementation
- Not built. Today the array is rebuilt from `legacy_metadata` (`apps/api/workspace.mjs:37`) and written back by `writeCampaigns` (`:68`); snapshots copy `c.tasks` into `records` (`apps/web/src/content/shared/model.mjs:233`) and the summary counts open and closed tasks (`:244`); frozen snapshots sit in the campaign state JSON, which never holds `tasks` itself (SDD-011 Data).
- Restore goes through `importCommit` (`workspace.mjs:158`).

## Notes
- Stored snapshots are data the change must not rewrite (ADR-003 D9).
