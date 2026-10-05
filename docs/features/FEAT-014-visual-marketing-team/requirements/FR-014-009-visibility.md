---
id: FR-014-009
title: Enforce viewer scope on all creative records
owner: DOM-VIS
status: approved
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006, ADR-008]
---
# FR-014-009 — Enforce viewer scope on all creative records

The system SHALL enforce Business scope and forced RLS on reads and writes while exposing every non-secret Visual record to Guests and active Members in the configured Business. Guests are read-only; every active Member has equal CRUD and internal approval rights. Project audience, ownership, team and named-viewer metadata SHALL NOT filter Business-record access. Secrets remain hidden and audit events remain append-only.

> **Supersession:** [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) replaces audience filtering and owner/named-member access gates, including inherited content and Guest public-projection-only reads. This changed policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; the historical implementation evidence below remains unchanged.

## Acceptance criteria

- AC-014-009-01 — Given a Guest or active Member and any Project audience value, when reading an in-Business non-secret Visual record through HTTP or the runtime role, then the record is returned; Guest writes remain denied.

- AC-014-009-02 — Given revoked credentials or inactive membership during a run, when committing, then identity is rechecked and the unauthorized commit is refused; audience narrowing does not revoke Business access.

- AC-014-009-03 — Given foreign Business IDs or credential/session/provider/operator secrets, when listing, counting or downloading, then no unauthorized content leaks.

- AC-014-009-04 — Given an in-Business non-secret input whose audience metadata changes, when a Guest or active Member reads, then it remains readable; external provider use still requires its separate grant.
