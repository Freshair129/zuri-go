---
id: FR-010-011
title: The whole-workspace save stays compatible
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
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
- Today `writeDomain` writes only the columns it names for each task (`apps/api/workspace.mjs:109`, `T_FIELDS` at `:12`) and refuses a save that omits an existing task (`:101`); `writeCampaigns` rewrites each Workboard task from the campaign JSON (`:68`).
- AC-010-011-01 and AC-010-011-02 therefore need the new columns to stay outside those column lists, and the campaign rewrite to stop replacing values that now live in `campaign_task_details` (SDD-010 Write paths).

## Notes
- Open — what `PUT /workspace` answers once it no longer writes tasks (a refusal, or a success that reports the ignored tasks). AC-010-011-03 holds in both cases; the owner chooses at approval (SDD-010 Open items).
- ADR-003 D8.
