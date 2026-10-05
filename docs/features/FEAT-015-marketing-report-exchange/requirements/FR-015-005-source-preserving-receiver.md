---
id: FR-015-005
title: Preserve parent ownership and receipt evidence
delivery: building
status: approved
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

The separately approved parent first-slice candidate is implemented under fresh FR-281–283/SDD-112 in paired draft PR633. Its native SQLite tests and full paired PostgreSQL sender case pass authority/replay, atomic receipt/audit and source-preservation checks. Parent readiness remains planned/partial/not_ready and the Phase B compatibility gate is open. AC-015-005-04 correction-pointer behavior is deferred: wire0.1 accepts only original reportRevision1 with no superseding report. This requirement remains building; no real receiver migration, binding, send or release is claimed. [Verification](../verification.md) records the paired evidence without allocating or renaming parent identities.
