---
id: FR-014-004
title: Enforce delegation lineage and scope
owner: DOM-VIS
status: approved
delivery: implemented
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-004 — Enforce delegation lineage and scope

The system SHALL validate and persist parent/root lineage with default delegation maximum two.

## Acceptance criteria

- AC-014-004-01 — Given root depth zero and child depth one, when an allowed grandchild executes, then depth two and the same Project/root are recorded.

- AC-014-004-02 — Given depth two, a cycle, foreign Project parent or permission expansion, when a child is requested, then dispatch is denied before execution.
