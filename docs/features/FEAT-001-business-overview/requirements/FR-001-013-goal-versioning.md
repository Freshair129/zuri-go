---
id: FR-001-013
title: A change of a target or account scope keeps its version, reason and author
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-002]
---

# FR-001-013 — A change of a target or account scope keeps its version, reason and author

The system SHALL record a version, a reason and the person who made the change whenever a target or the account scope of a goal changes in the middle of a period, SHALL recompute the goal from the one scope revision, and SHALL NOT overwrite the evidence of an earlier AI summary.

## Acceptance criteria
- AC-001-013-01 — Given a goal whose target or accounts change during the period, then the goal’s version increases, the reason is stored and the change is recorded with its author.
- AC-001-013-02 — Given the change, then the progress is recomputed from the one new scope revision, not from a mix of scopes.
- AC-001-013-03 — Given an AI summary made before the change, then its stored evidence is unchanged.

## Implementation
- `save` in `apps/api/service.mjs` (row version check, `change_reason`, `audit` into `change_events` with the actor); `ai_briefs.evidence_snapshot` in `apps/api/migrations/001_core.sql`.
- Tests: `apps/api/test/database.test.mjs` (“approval, scheduling, publication evidence and correction version conflicts”; “… briefs are immutable and repeatable”).

## Notes
- Spec trace ([spec.md](../spec.md)): §7, last bullet (AC-01 to AC-03). No ZGO label. Concurrent edits are [FR-001-018](FR-001-018-persistence-integrity.md) AC-04.
