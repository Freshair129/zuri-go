---
id: FR-014-008
title: Authorize attributable human decisions
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-008 — Authorize attributable human decisions

The system SHALL require an authorized human decision over each final artifact hash and preserve append-only audit.

## Acceptance criteria

- AC-014-008-01 — Given authenticated Project owner and current passing QA, when approved, then actor/hash/decision/stage persist atomically.

- AC-014-008-02 — Given Guest, another Member, agent identity, stale hash or blocking QA, when approval is attempted, then no decision authorizes the artifact.

- AC-014-008-03 — Given a local operator decision, when displayed, then it explicitly says operator rather than authenticated Member.

- AC-014-008-04 — Given changed brief or artifact, when revisited, then old approval remains historical and new revision requires review.
