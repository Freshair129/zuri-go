---
id: FR-014-001
title: Validate and persist a structured brief
owner: DOM-VIS
status: approved
delivery: implemented
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-001 — Validate and persist a structured brief

The system SHALL validate and persist an immutable brief and confirmed brand-context revision linked to existing same-Business identities.

## Acceptance criteria

- AC-014-001-01 — Given a readable Project and confirmed brand context, when the same brief and idempotency key are submitted twice, then exactly one revision exists.

- AC-014-001-02 — Given invalid UUID/date, unknown fields, oversized text or cross-Business reference, when submitted, then 422 is returned and nothing is created.
