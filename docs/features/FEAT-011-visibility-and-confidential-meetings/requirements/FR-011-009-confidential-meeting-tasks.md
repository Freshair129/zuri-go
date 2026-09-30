---
id: FR-011-009
title: Tasks from a confidential meeting
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  decided_by: [ADR-004]
---

# FR-011-009 — Tasks from a confidential meeting

The system SHALL create every task that comes from a restricted meeting as `restricted`, with the meeting’s participants as viewers, and SHALL show that task’s evidence quotes only to people who may read the meeting.

## Acceptance criteria
- AC-011-009-01 — Given a restricted meeting with three participants, when a draft task is committed from it, then the task is `restricted` and the three participants are its viewers.
- AC-011-009-02 — Given such a task, when its R is not a meeting participant, then they see the task with a note that its evidence comes from a confidential meeting, and without the quotes.
- AC-011-009-03 — Given such a task, when its visibility is widened, then its evidence quotes stay with the meeting’s audience.

## Implementation
- Not built.
- The meeting’s audience is handed over at commit time through the FEAT-011-P03 boundary; the quotes live in `meeting_task_links.evidence`.
