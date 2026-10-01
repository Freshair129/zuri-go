---
id: NFR-011-002
title: Row-level security enforces the campaign audiences
part: FEAT-011-P04
delivery: declared
status: proposed
relations:
  decided_by: [ADR-005, ADR-004]
  relates_to: [NFR-011-001]
---

# NFR-011-002 — Row-level security enforces the campaign audiences

The database SHALL enforce the audiences of FR-011-013, FR-011-014 and FR-011-015 with row-level security on every table that holds campaign records, so that a read path that misses a filter still returns no row outside the viewer's audience.

## Measurement
- Given a test that queries `campaigns`, `campaign_viewers`, `campaign_states`, `campaign_channels`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series` and `metric_observations` directly as a Guest and as a Member outside the audience, with the application filter bypassed, then no row outside the audience is returned.
- Given a Guest, then a direct query of `campaign_states` returns no row at any level, and content items, goals and metric series with no campaign are not returned.
- Given a direct insert of a content item, goal or metric series that names a campaign the actor cannot read, then the database refuses it.
- Given a direct query of `change_events` as a Member outside the audience, then no row whose entity type is `campaigns`, `campaign_viewers`, `campaign_visibility`, `content_items`, `publications`, `goals` or `metric_observations` names a record the Member cannot read; after V2b, no `members` row names another Member's contact change.
- Given the runtime role, then it stays non-superuser and NOBYPASSRLS; given the local operator viewer, then every row of the local database is visible, as today.
- Given the migration, then a test creates the policies and queries each table once, so a policy that refers back to itself fails.

## Implementation
- Proposed 2026-10-01; not built. Layers L0 (membership), L1 (`campaigns`), L2 (attached records, ledger), L3 (derived records) and the history policy in SDD-011 “Row-level security”; the test extends `apps/api/test/visibility-db.test.mjs`.

## Notes
- Extends [NFR-011-001](NFR-011-001-row-level-security.md) to campaign records. An NFR carries a measurement, not AC IDs (STD-002 R1).
- Contact fields of Members are outside this requirement: a policy cannot withhold one column, so [FR-011-020](FR-011-020-member-contact-visibility.md) is enforced in the application.
