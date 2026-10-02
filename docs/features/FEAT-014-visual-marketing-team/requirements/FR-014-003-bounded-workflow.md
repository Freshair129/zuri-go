---
id: FR-014-003
title: Execute a finite creative workflow
owner: DOM-VIS
status: proposed
delivery: declared
relations:
  derived_from: [PRD-001]
  specified_by: [SDD-014, API-023]
  decided_by: [ADR-006]
---
# FR-014-003 — Execute a finite creative workflow

The system SHALL advance only legal workflow transitions after validating committed artifacts.

## Acceptance criteria

- AC-014-003-01 — Given a brief, when the configured workflow executes, then research, strategy, concept, copy, visual prompt and QA outputs persist before HUMAN_REVIEW.

- AC-014-003-02 — Given an illegal jump or exhausted limit, when advancement is attempted, then a conflict is returned with no provider invocation.

- AC-014-003-03 — Given missing optional image generation, when text stages complete, then deliverable is labelled prompt-only and never claims pixels exist.
