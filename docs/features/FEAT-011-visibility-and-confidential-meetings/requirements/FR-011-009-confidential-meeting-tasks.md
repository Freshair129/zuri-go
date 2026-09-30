---
id: FR-011-009
title: Tasks from a confidential meeting
part: FEAT-011-P02
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-009 — Tasks from a confidential meeting

The system SHALL create every task that comes from a restricted meeting as `restricted`, with the meeting’s participants as viewers, and SHALL show that task’s evidence quotes only to people who may read the meeting.

## Acceptance criteria
- AC-011-009-01 — Given a restricted meeting with three participants, when a draft task is committed from it, then the task is `restricted` and the three participants are its viewers.
- AC-011-009-02 — Given such a task, when its R is not a meeting participant, then they see the task with a note that its evidence comes from a confidential meeting, and without the quotes.
- AC-011-009-03 — Given such a task, when its visibility is widened, then its evidence quotes stay with the meeting’s audience.

## Implementation
- Built locally 2026-10-01 (not deployed). `meetingAudience` (`apps/web/src/content/shared/visibility.mjs`) returns the audience of a restricted meeting. `writeDomain` (`apps/api/workspace.mjs`) applies it to every new task whose `sourceRefs` point to a restricted meeting in the same save: the task is stored `restricted` and the meeting’s participants are added to its viewers, whatever level and viewers the client sent. An existing task is never changed by it.
- Quotes: a person who can read the task but not the meeting gets `sourceRefsWithheld` and no quotes (`readLegacy`), and the quotes inside the task’s history events are withheld the same way (`withholdQuotes`). Widening the task changes neither. The quotes stay in the meeting’s revisions, draft batches and `meeting_task_links.evidence`, which follow the meeting.
- The commit still runs in the client (`commitBatch`, FEAT-004); the server enforces the audience when that client saves the task. Moving the commit to the server is PLAN-002 WI-09 and is not part of this change.
- Tests: `apps/api/test/visibility.test.mjs` (`meetingAudience`, acceptance and holdout); `apps/api/test/visibility-db.test.mjs` (AC-011-009-01, -02 and -03 for a Member-visible task, and a business-meeting holdout).
- The note on the task form (`apps/web/src/content/meeting/TaskForms.jsx`) was built but not browser-checked.
