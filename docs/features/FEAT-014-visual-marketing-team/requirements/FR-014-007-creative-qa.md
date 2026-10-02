---
id: FR-014-007
title: Return structured creative findings
owner: DOM-VIS
status: approved
delivery: implemented
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-007 — Return structured creative findings

The system SHALL produce category findings, blockers and suggestions for exact artifact revisions.

## Acceptance criteria

- AC-014-007-01 — Given unsupported claims or wrong offer evidence, when QA executes, then blocking findings include evidence references.

- AC-014-007-02 — Given prompt-only output, when reviewed, then image-only checks are not_assessed and never presented as verified pixel quality.
