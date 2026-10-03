---
id: FR-014-006
title: Persist and reconcile durable jobs
owner: DOM-VIS
status: approved
delivery: implemented
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

- AC-014-006-04 — Given a job reaches exhausted/stale failure or is cancelled by a new Brief revision, when the transaction commits, then its linked root run is failed/cancelled with `completed_at` in the same transaction and a stale worker cannot commit.

- AC-014-006-05 — Given an enqueue response, when the client follows `status_url`, then the scoped job GET returns 200 with the same job ID and current state.
