---
id: FR-014-006
title: Persist and reconcile durable jobs
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-006 — Persist and reconcile durable jobs

The system SHALL enqueue work and fence output commits by durable lease, current authorization and input revision.

## Acceptance criteria

- AC-014-006-01 — Given concurrent identical run requests, when enqueued, then only one job is created and replay returns it.

- AC-014-006-02 — Given restart or expired lease, when recovered, then stale workers cannot commit and ambiguous provider submissions are reconciled before retry.

- AC-014-006-03 — Given hosted mode without an approved executor, when run is requested, then 503 EXECUTOR_UNAVAILABLE is returned without a runnable job.
