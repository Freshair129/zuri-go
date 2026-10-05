---
id: FR-011-019
title: Visibility of campaigns that exist before the change
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [FR-011-012]
---

# FR-011-019 — Visibility of campaigns that exist before the change

> **Current access rule — ADR-008 (approved 2026-10-05):** schema 12 changes authorization without converting campaign audience values. Guests read every non-secret existing campaign record in the selected Business, and all active Members have equal CRUD and internal approval rights regardless of audience metadata. The production schema-11 access behavior remains unchanged until separately authorized migration 012 and release. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; the audience backfill and criteria below are historical and superseded.

The system SHALL give every campaign that exists when this feature is released the level `business`, without changing any other field and without deleting or rewriting any row.

## Acceptance criteria
- AC-011-019-01 — Given the campaigns in production, when the migration runs, then every one is `business`: every Member still reads it and Guests no longer do until someone with the right marks it `public`.
- AC-011-019-02 — Given the migration, then the counts of `campaigns`, `campaign_states`, `campaign_channels`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series` and `metric_observations` per Business are equal before and after, IDs, codes and `payload_hash` are unchanged, and a reconciliation report shows the counts.
- AC-011-019-03 — Given production, then the migration runs only after `npm run backup` and with the owner's specific authorization.
- AC-011-019-04 — Given the migration file, then it adds columns, a table, a function and policies, and contains no `DROP`, `TRUNCATE`, `DELETE`, type change or `UPDATE` of existing rows.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `ADD COLUMN … DEFAULT 'business'` in a new migration (schema 8; SDD-011 “Data”); the reconciliation query runs before and after on a QA Business first, then on production.
- Historical baseline at the initial FEAT-011 release (2026-10-01): production had reached schema 7 with migration `007_tasks_projects.sql`. Production is now schema 11 after FEAT-015 migration 011; ADR-008 targets migration 012 to schema 12.

## Notes
- Q-V2 of [ADR-005](../../../architecture/decisions.md) is the open choice: `business`, or `public` to change nothing for Guests.
- Follows the pattern of [FR-011-012](FR-011-012-existing-data.md).
