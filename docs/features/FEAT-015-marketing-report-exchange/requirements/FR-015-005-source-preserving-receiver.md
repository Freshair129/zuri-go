---
id: FR-015-005
title: Preserve parent ownership and receipt evidence
delivery: declared
status: draft
superseded_by: null
relations:
  specified_by: [SDD-015]
  relates_to: [ADR-007, ARCH-005]
---

# FR-015-005 — Receiver boundary

The system SHALL require the separately reviewed parent Identity/Marketing receiver to authorize every ingestion/replay, atomically persist external reported evidence and its receipt, and preserve native Plan, independent review, decisions and verified owner measurements.

## Acceptance criteria

- AC-015-005-01 — Given missing/revoked/disabled binding, crossed Tenant/Business, hidden growth domain or unauthorized initiative, when accepting or replaying, then it fails before write or receipt disclosure; an Enterprise Tenant service account alone never becomes OWNER.
- AC-015-005-02 — Given simultaneous identical sends, when the receiver commits, then one evidence record, one receipt and one audit exist; same key/different bytes is a conflict with no overwrite.
- AC-015-005-03 — Given a report containing a local weekly review or release opinion, when accepted/read, then it remains reported/unverified evidence and leaves parent PlanVersion, MarketingReview, MarketingDecision, PM execution and Commerce verified totals unchanged.
- AC-015-005-04 — Given concurrent corrections or replay of an older accepted report, when updating the projection, then one correction of the latest report wins atomically and older replay never rolls the pointer backward.

## Implementation

NOT_IMPLEMENTED. Parent changes require their own governed records and source tests; this local requirement describes the end-to-end prerequisite, not an allocation or claim of implementation in Zuri-AI.
