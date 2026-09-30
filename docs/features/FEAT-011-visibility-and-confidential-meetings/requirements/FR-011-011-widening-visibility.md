---
id: FR-011-011
title: Widening the visibility of a task or project
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  decided_by: [ADR-004]
---

# FR-011-011 — Widening the visibility of a task or project

The system SHALL let only a task’s A, or a project’s owner, widen its visibility, with a reason; SHALL let any editor who can see it narrow it; and SHALL audit both.

## Acceptance criteria
- AC-011-011-01 — Given a restricted task, when its R tries to change it to `business`, then the request is refused; when its A does so with a reason, then it succeeds.
- AC-011-011-02 — Given any visibility change, then an audit event records the old and new levels, the reason and the session actor.
- AC-011-011-03 — Given a `business` task, when an editor narrows it to `team`, then no reason is needed.

## Implementation
- Not built.

## Notes
- Meetings follow the same rule through their organizer (FR-011-006).
