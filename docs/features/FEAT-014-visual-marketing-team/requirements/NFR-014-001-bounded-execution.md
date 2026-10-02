---
id: NFR-014-001
title: Bound request and provider execution
status: proposed
delivery: declared
relations:
  decided_by: [ADR-006]
---
# NFR-014-001 — Bound request and provider execution

Enqueue and status requests SHALL finish within 2 seconds p95 for 20 concurrent local clients, excluding DB outage. Provider calls have a 25-second timeout and two total attempts per stage.

## Measurement

Measure isolated QA requests with a delayed fake provider; verify attempt budget, cancellation, lease recovery and absence of DB transactions during network wait.
