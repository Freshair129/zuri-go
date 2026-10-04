---
id: FR-015-004
title: Send with bounded recovery and durable receiver receipt
delivery: declared
status: draft
superseded_by: null
relations:
  specified_by: [SDD-015]
---

# FR-015-004 — Delivery and receipts

The system SHALL send only an explicitly requested frozen report to a fixed approved origin, retain bounded attempts, and mark ACKNOWLEDGED only after validating and durably storing the receiver's matching committed receipt.

## Acceptance criteria

- AC-015-004-01 — Given a valid committed receipt, when handling the response, then report/hash/binding/target references agree and the Go state/receipt update is atomic.
- AC-015-004-02 — Given timeout after receiver commit, when retrying, then identical bytes/key return the original receipt without another report/audit; before retry the sender remains UNKNOWN.
- AC-015-004-03 — Given 429, network/5xx, conflicting receipt, exhausted retries or interrupted attempt, when recovery runs, then it follows bounded delay/lease/age states and never infers success from transport alone.
- AC-015-004-04 — Given concurrent send requests, redirects, user URLs or browser credential fields, when dispatching, then one attempt wins the lease, redirects/unapproved destinations are refused and no secret is exposed.

## Implementation

NOT_IMPLEMENTED. No parent credential or sender worker is configured; proposed limits and states are in [the contract](../contract.md#sender-delivery-states-and-bounded-recovery).
