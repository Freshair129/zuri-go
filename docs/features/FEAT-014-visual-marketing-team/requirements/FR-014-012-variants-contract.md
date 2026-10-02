---
id: FR-014-012
title: Keep variants independent of parent approval
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-012 — Keep variants independent of parent approval

The system SHALL retain immutable parent lineage and require each phase-E variant to pass its own QA and human review.

## Acceptance criteria

- AC-014-012-01 — Given an approved parent, when an E branch is created, then parent is unchanged and child is unapproved.

- AC-014-012-02 — Given phase C without executable variants, when rendered, then Generate variants is disabled with an explicit reason.
