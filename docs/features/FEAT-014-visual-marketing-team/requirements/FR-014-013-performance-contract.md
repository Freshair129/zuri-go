---
id: FR-014-013
title: Separate measurements from interpretation
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-013 — Separate measurements from interpretation

The system SHALL read permitted campaign measurements and write only creative interpretations/recommendations in phase F.

## Acceptance criteria

- AC-014-013-01 — Given observation references and formula version, when learning is generated in F, then raw measurement, derived metric, AI interpretation and recommendation stay distinct.

- AC-014-013-02 — Given an agent-requested metric mutation, when attempted, then no allowed tool writes it; phase C registers but does not execute the analyst.
