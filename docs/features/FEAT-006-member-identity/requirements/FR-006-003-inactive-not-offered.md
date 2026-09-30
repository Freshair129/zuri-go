---
id: FR-006-003
title: An Inactive Member is not offered for new assignments
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-003 — An Inactive Member is not offered for new assignments

The Task Manager SHALL NOT offer an Inactive Member as a choice for a new assignment (R, A, C, I, a named viewer, or R and A of a meeting draft) and SHALL refuse to save one, while a Member who is already assigned keeps the assignment.

## Acceptance criteria
- AC-006-003-01 — Given an Inactive Member, when R, A, C, I or a named viewer of a task is chosen, then the Member is not listed, except on a task that already names them, where they stay listed so the assignment is not lost (marked “(Inactive)” in the R, A, C and I lists of the task form and the boards).
- AC-006-003-02 — Given an Inactive Member, when a save would add them to a task as R, A, C, I or named viewer, then it is refused with “สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active” and nothing changes.
- AC-006-003-03 — Given a task whose R is now Inactive, when another field of that task is saved, then the save succeeds and R is unchanged.
- AC-006-003-04 — Given a meeting draft, when R or A is chosen, then only Active Members are listed, and the server’s meeting commit refuses an Inactive R or A with the same message (422).

## Implementation
- `apps/web/src/content/meeting/model.mjs:person` (called by `saveTask` for R, A, C, I and named viewers, and by `commitBatch` through `saveTask`) — refuses an Inactive Member unless that Member is already on the task.
- Choice lists: `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` (R, A, C, I), `apps/web/src/content/meeting/Boards.jsx:memberOptions` and `TaskEditor` (owner, C, I and viewers on boards and projects), `apps/web/src/content/meeting/Visibility.jsx:VisibilityFields` (named viewers), `apps/web/src/content/meeting/Meetings.jsx` (draft table: R and A list Active Members only).
- `apps/api/meeting-commit.mjs:commitMeeting` — runs the shared `commitBatch` on the server and answers 422 with its message.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“duplicate names remain separate; inactive cannot take new assignments”: R refused, the old task still editable with R kept). No committed test covers C, I, named viewers, the choice lists or the server commit.
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) confirmed that R, C and a named viewer are refused for an Inactive Member. The choice lists and the server commit were read, not run; no browser check was run for this file.

## Notes
- Origin: FEAT-004 MT-22 (Inactive is not in the choice list for new work).
- The rule is enforced by the shared client model and by the server’s meeting commit, which reuses it. The per-task API (`apps/api/tasks.mjs:checkPeople` checks only that the Member exists) and the whole-workspace save (`writeDomain`) do not check status, so a request made outside the app’s forms can still name an Inactive Member. Whether the server must refuse it is an open question for the owner.
- An Inactive Member cannot sign in or write ([FR-006-004](FR-006-004-inactive-history-and-reactivation.md) AC-006-004-04), and provisioning issues no new credential to an Inactive Member (`apps/api/provision-members.mjs`).
