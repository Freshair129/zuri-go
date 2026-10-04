---
id: FR-015-003
title: Build an immutable envelope with explicit binding
delivery: building
status: approved
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

P2 was approved on 2026-10-05. CMP-003/API-025 implement server preparation and atomic immutable report/QUEUED/audit through narrow DB finalizers in migration file 011. Server clock and registered deployment/binding/initiative are constructed from scoped persisted records; no caller envelope is accepted. The [strict wire whitelist](../contract.md#envelope--strict-whitelist) is generated and checked, with scalar UNKNOWN/null and legacy approval UNVERIFIED. P1 API-024 remains read-only.

TC-015-005/006 pass pure and disposable WASM SQL checks; TC-015-007 now passes native PostgreSQL 18.6 concurrency/waiting expiry and ACL interruption. Independent L2 found a migrator grant window, corrected by atomic reconciliation and regression proof; corrected code candidate `99ed23a` passed independent L2 review with an independent native six-case rerun and actual migration/rerun. Migration 011 is not applied to an application database; no real association/credentials, parent receipt or sending exists. This requirement stays building until reviewed cross-system binding and real operational acceptance close.
