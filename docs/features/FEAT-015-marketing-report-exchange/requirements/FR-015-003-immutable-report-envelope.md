---
id: FR-015-003
title: Build an immutable envelope with explicit binding
delivery: declared
status: draft
superseded_by: null
relations:
  specified_by: [SDD-015]
---

# FR-015-003 — Immutable report envelope

The system SHALL freeze the strict versioned report, source revision tuple, explicit source deployment/Business and target binding/initiative into one immutable canonical payload with an idempotent report identity.

## Acceptance criteria

- AC-015-003-01 — Given the same captured preview/time and source revision, when freezing or replaying, then bytes/hash stay unchanged and report/outbox are created atomically; retry never rebuilds current measurements.
- AC-015-003-02 — Given unknown fields, duplicate JSON keys, non-finite values, oversize arrays/bytes, unsupported version or missing binding, when validating, then it rejects before persistence or delivery.
- AC-015-003-03 — Given different local/hosted deployments or similarly named campaigns, when associating, then explicit registered identities remain distinct; no name/code/UUID coincidence supplies a mapping.

## Implementation

Durable envelope, binding and atomic freeze remain NOT_IMPLEMENTED. P1 supplies only a `zuri-marketing-preview/0.1` hash, bounded request parsing and sanitized preview. It has no reportId, deployment/target binding, frozenAt, outbox or receipt and cannot be sent as the proposed wire envelope. Logical storage and binding remain proposed in [SDD-015](../design.md) and [the contract](../contract.md#envelope--strict-whitelist).
