---
id: FR-011-005
title: Named viewers of a task
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  decided_by: [ADR-004]
---

# FR-011-005 — Named viewers of a task

The system SHALL treat the R, A, C and I of a task, with its explicit viewers, as the people named on it, and SHALL let an editor who can see the task add or remove explicit viewers.

## Acceptance criteria
- AC-011-005-01 — Given a `restricted` task, when a Member is added as I, then they can read it; when removed, then they no longer can.
- AC-011-005-02 — Given a `restricted` task, when an explicit viewer without a RACI role is added, then they can read it and take on no RACI duty.
- AC-011-005-03 — Given a Member removed from a task’s RACI and viewers, when they reload, then the task is gone from every view and from the API.
- AC-011-005-04 — Given any change to viewers, then an audit event records it with the session actor.

## Implementation
- Not built.
- Planned table `task_viewers`; RACI stays in `task_roles`.
