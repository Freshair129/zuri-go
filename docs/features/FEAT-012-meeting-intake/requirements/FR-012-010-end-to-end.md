---
id: FR-012-010
title: From a chosen recording to a weekly task, end to end
delivery: building
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  relates_to: [FR-012-001, FR-012-003, FR-012-004, FR-012-005, FR-012-008, FR-010-005]
---

# FR-012-010 — From a chosen recording to a weekly task, end to end

The system SHALL let a user take a test recording from FUNG to a task in Weekly To-do — import, correct the transcript, save the reviewed revision, draft, name the R, commit — so that after a reload the task is still there and its source link opens the meeting it came from.

## Acceptance criteria
- AC-012-010-01 — Given a connected FUNG and a recording with a transcript, when the user imports it, corrects the text, saves the reviewed revision, requests drafts, sets an item to create with an R, a week and a MoSCoW priority, and commits, then the batch shows “สร้างงานแล้ว” with a link to the task, and the task is in Weekly To-do for that week with that R and priority.
- AC-012-010-02 — Given that task, when the page is reloaded, then the task, its week entry, the receipt and the meeting are still there, and sending the same commit again returns the same task (FR-012-008).
- AC-012-010-03 — Given that task opened from Weekly To-do, then “ที่มาจากประชุม” shows its evidence for someone who may read the meeting, and “เปิดประชุมต้นทาง” opens that meeting in Meetings; for someone who may not, the task says its evidence comes from a confidential meeting and shows no quote (FR-011-009).

## Implementation
- The chain is the composition of FR-012-001 to FR-012-008: `Meetings`, `ReviewEditor` and `ActionBatch` (`apps/web/src/content/meeting/Meetings.jsx`), `commitMeeting` (`apps/api/meeting-commit.mjs`), the source link in `TaskForm` (`apps/web/src/content/meeting/TaskForms.jsx`) and `openSource` in `MeetingWorkspace` (`apps/web/src/content/meeting/MeetingWorkspace.jsx`).
- Parts tested separately: the model tests of `apps/web/src/content/meeting/model.test.mjs` and, against local PostgreSQL, `apps/api/test/meeting-commit.test.mjs` (commit, replay and reading the task back afterwards). The whole chain in one run is not tested.

## Notes
- Origin: FEAT-004 MT-18. Delivery is `building`: the [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PARTIAL — the browser chain ran after a supplied transcript against a fixture, and the installed FUNG Desktop, real audio transcription and the configured model were not run.
- The browser chain of 2026-09-30 ran on the IndexedDB build; no record shows the chain run in a browser on the PostgreSQL build, locally or on the production site, and on the production site it needs a real Member’s sign-in ([verification](../../../releases/0.5.0/verification.md)).
- The Weekly To-do list is FEAT-010’s ([FR-010-005](../../FEAT-010-task-manager/requirements/FR-010-005-boards.md) keeps Weekly To-do, List and RACI showing the same records); this requirement only asks that the committed task appears there.
