---
id: FR-010-011
title: The whole-workspace save stays compatible
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-011 — The whole-workspace save stays compatible

The system SHALL keep accepting `PUT /workspace` from a client that does not know the new task fields, without losing or overwriting them, and SHALL stop writing task rows through it once meeting commits run on the server.

## Acceptance criteria
- AC-010-011-01 — Given a task with a project, an owner label, campaign details and a completion marker, when a client that does not know those fields saves the workspace, then all four are unchanged.
- AC-010-011-02 — Given such a client that saves a change to a Workboard task, then the change is stored and the task still appears on the campaign board.
- AC-010-011-03 — Given the release in which meeting commits run on the server (PLAN-002 P3), when `PUT /workspace` carries a change to a task, then no task row changes.

## Implementation
- Built locally 2026-10-01: new columns stay outside `T_FIELDS`; `writeCampaigns` saves each Workboard entry through `writeWorkboardEntry`, which finds the existing record (never a duplicate) and keeps its project, owner label, details and marker.
- Tests: `apps/api/test/tasks-api.test.mjs`. AC-010-011-03 belongs to P3.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- What `PUT /workspace` answers once it no longer writes tasks is decided with WI-09 in P3; AC-010-011-03 holds either way.
- ADR-003 D8.
