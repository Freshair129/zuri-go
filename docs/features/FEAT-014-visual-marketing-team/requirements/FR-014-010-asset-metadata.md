---
id: FR-014-010
title: Store protected asset metadata
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-010 — Store protected asset metadata

The system SHALL persist validated asset metadata while keeping binaries outside PostgreSQL and downloads viewer-gated.

## Acceptance criteria

- AC-014-010-01 — Given verified bytes in configured storage, when registered, then MIME/dimensions/checksum/provenance persist and no binary enters PostgreSQL.

- AC-014-010-02 — Given traversal, an untrusted object key, bad MIME or unreadable Project, when registering/downloading, then it fails without unauthorized file/network access.
