---
id: FR-001-018
title: PostgreSQL keeps the data whole, scoped to one Business and free of duplicates
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-002, FEAT-011, NFR-011-001]
---

# FR-001-018 — PostgreSQL keeps the data whole, scoped to one Business and free of duplicates

The system SHALL keep the Business data in PostgreSQL with IDs, primary keys and foreign keys that stop orphan rows and links across Businesses, SHALL create no duplicate when a request or an import is retried, and SHALL NOT let concurrent edits overwrite one another silently.

## Acceptance criteria
- AC-001-018-01 — Given a row that refers to another Business or to a missing parent, then the database refuses it.
- AC-001-018-02 — Given a read, write or foreign key that crosses Businesses, then it is rejected.
- AC-001-018-03 — Given a retry of a request or an import, then no duplicate is created and the stable identities remain.
- AC-001-018-04 — Given two edits made on the same version of a row, then the later one is refused with a conflict and nothing is overwritten silently.

## Implementation
- `apps/api/migrations/001_core.sql` to `007_tasks_projects.sql` (UUID keys, composite `(business_id, id)` keys, forced row-level security, `row_version`); `apps/api/db.mjs`, `apps/api/service.mjs`.
- Tests: `apps/api/test/database.test.mjs` (“actual PostgreSQL permissions, RLS, FK and RACI uniqueness”; “legacy preview/import/retry preserves …”). Real PostgreSQL tests of the role, cross-Business reads and writes and conflicts: [zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”; production role checked in [zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “Access and packaging”.

## Notes
- Spec trace ([spec.md](../spec.md)): §1 bullet 6 (AC-01); ZGO-08 (AC-01 to AC-04). Legacy label: ZGO-08.
- Table definitions and keys: [ARCH-002](../../../architecture/ARCH-002-postgresql-data-model.md). Visibility rules on rows are [FEAT-011](../../FEAT-011-visibility-and-confidential-meetings/feature.md)’s ([NFR-011-001](../../FEAT-011-visibility-and-confidential-meetings/requirements/NFR-011-001-row-level-security.md)).
