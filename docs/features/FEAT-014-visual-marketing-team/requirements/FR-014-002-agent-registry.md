---
id: FR-014-002
title: Register independent marketing roles
owner: DOM-VIS
status: approved
delivery: implemented
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-002 — Register independent marketing roles

The system SHALL register all eight defined roles with independent contracts, permissions, memory scopes and model policy.

## Acceptance criteria

- AC-014-002-01 — Given the registry, when listed, then eight distinct VIS-MKT roles expose every required definition field without secrets or provider-bound identity.

- AC-014-002-02 — Given an unknown role or tool, when dispatch is requested, then it fails before any provider call.
