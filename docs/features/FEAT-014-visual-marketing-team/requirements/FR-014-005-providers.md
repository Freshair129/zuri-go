---
id: FR-014-005
title: Call replaceable bounded providers
owner: DOM-VIS
status: approved
delivery: implemented
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-005 — Call replaceable bounded providers

The system SHALL validate provider output and enforce configured capabilities, timeouts, attempts, fallback and budget.

## Acceptance criteria

- AC-014-005-01 — Given definite primary unavailability and authorized fallback, when attempted, then calls stay within the shared attempt/time/cost budget and each attempt is recorded.

- AC-014-005-02 — Given policy denial, malformed output or ambiguous paid submission, when it fails, then no automatic fallback evades policy or repeats chargeable work.

- AC-014-005-03 — Given no LLM configuration, when opened, then manual stages are available and fake AI completion is never displayed.
