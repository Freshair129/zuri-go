---
id: FR-014-009
title: Enforce viewer scope on all creative records
owner: DOM-VIS
status: approved
delivery: implemented
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-009 — Enforce viewer scope on all creative records

The system SHALL enforce Business scope, resolved viewer and forced RLS on reads and writes.

## Acceptance criteria

- AC-014-009-01 — Given Guest and public/business/team/restricted Projects, when reading HTTP and direct runtime-role SQL, then only the approved public projection is exposed.

- AC-014-009-02 — Given revoked credentials or narrowed audience during a run, when committing, then access is rechecked and unauthorized commit is refused.

- AC-014-009-03 — Given foreign Business IDs or private linked context, when listing, counting or downloading, then no unauthorized content leaks.

- AC-014-009-04 — Given a private production input then parent visibility widened, when a broader viewer reads, then the original audience constraint still prevents disclosure.
