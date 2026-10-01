---
id: FR-011-019
title: Visibility of campaigns that exist before the change
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004]
  relates_to: [FR-011-012]
---

# FR-011-019 — Visibility of campaigns that exist before the change

The system SHALL give every campaign that exists when this feature is released the level `business`, without changing any other field and without deleting or rewriting any row.

## Acceptance criteria
- AC-011-019-01 — Given the campaigns in production, when the migration runs, then every one is `business`: every Member still reads it and Guests no longer do until someone with the right marks it `public`.
- AC-011-019-02 — Given the migration, then the counts of `campaigns`, `campaign_states`, `campaign_channels`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series` and `metric_observations` per Business are equal before and after, IDs, codes and `payload_hash` are unchanged, and a reconciliation report shows the counts.
- AC-011-019-03 — Given production, then the migration runs only after `npm run backup` and with the owner's specific authorization.
- AC-011-019-04 — Given the migration file, then it adds columns, a table, a function and policies, and contains no `DROP`, `TRUNCATE`, `DELETE`, type change or `UPDATE` of existing rows.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `ADD COLUMN … DEFAULT 'business'` in a new migration (schema 8; SDD-011 “Data”); the reconciliation query runs before and after on a QA Business first, then on production.
- Today (0.5.1): production schema is 7; the last migration is `007_tasks_projects.sql`.

## Notes
- Q-V2 of [ADR-005](../../../architecture/decisions.md) is the open choice: `business`, or `public` to change nothing for Guests.
- Follows the pattern of [FR-011-012](FR-011-012-existing-data.md).
