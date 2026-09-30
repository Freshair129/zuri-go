---
id: FR-012-007
title: Assignment and choices are checked before a meeting commit
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  relates_to: [FR-010-009, FR-010-019]
---

# FR-012-007 — Assignment and choices are checked before a meeting commit

The system SHALL refuse a meeting commit unless every task to create or update names an R who is an active Member chosen by the user, SHALL NOT take a speaker label or a name suggested by a draft as a person, and SHALL check the list of choices itself before it stores anything.

## Acceptance criteria
- AC-012-007-01 — Given a choice to create or update a task without an R, when the user commits, then it is refused with 422 “เลือกรายชื่อ R ก่อนสร้างงานจากประชุม” and nothing is stored.
- AC-012-007-02 — Given an R or A that is not a Member of the Business, or a Member who is inactive, then the commit is refused (“ไม่พบ Member ที่อ้างอิง”, “สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active”) and nothing is stored.
- AC-012-007-03 — Given a draft item with a suggested name, then the form shows it as a hint (“ชื่อที่เสนอ: …”) and leaves R empty (“เลือกผู้รับผิดชอบ”); a speaker label of the transcript is never copied into R or A.
- AC-012-007-04 — Given a list of choices that repeats a proposal, names a proposal that is not in the batch, uses a handling other than create, link, update or skip, selects nothing but skips, carries a week that does not start on a Monday or a priority outside Must, Should, Could and Won’t, or is not an array, then the commit is refused with 422 and nothing is stored.
- AC-012-007-05 — Given a link or update target that does not exist or that the user cannot read, then the commit answers 404 “ไม่พบงาน” (the same answer for both); given a target whose `taskVersion` is not the task’s current version, then it answers 409 “ข้อมูลถูกแก้แล้ว กรุณาโหลดใหม่”; in both cases nothing is stored, including tasks the same request would have created. A `taskVersion` of null is no guard.
- AC-012-007-06 — Given the form before the user commits, then it lists every draft item with its handling and, for each item to create, link or update, the fields of that handling (the existing task for link and update; title, R, A and due date for create and update; week and MoSCoW for all three), and the button reads “สร้างและมอบหมาย N งาน”; committing sends no message to anyone.

## Implementation
- `apps/web/src/content/meeting/model.mjs`: `commitBatch` (the R check, duplicate and unknown proposals, handling, at least one non-skip choice, week through `setPriority`; AC-012-007-01, -04) and `person` (existence and active status, through `saveTask`; AC-012-007-02).
- `apps/api/meeting-commit.mjs`: `commitMeeting` runs `commitBatch` on the viewer’s readable state and checks the `link` and `update` targets (AC-012-007-05); an error of the pure rules is answered as 422.
- `apps/web/src/content/meeting/Meetings.jsx`: `ActionBatch` (the hint from `suggestedResponsibleLabel`, R starting as `''`, the button label; AC-012-007-03, -06).
- Tests: `apps/api/test/meeting-commit.test.mjs` — “a bad choice, an unknown or hidden target, and an error in the middle leave nothing behind (atomicity)” covers no R, a repeated and an unknown proposal, a bad handling, a non-Monday week, a non-array, an unknown and a hidden target and a version mismatch; `apps/web/src/content/meeting/model.test.mjs` — “duplicate proposal selection is refused” and “duplicate names remain separate; inactive cannot take new assignments” (the inactive check through `saveTask`). No test commits with an inactive or unknown Member, and AC-012-007-03 and -06 have no test.

## Notes
- Origin: FEAT-004 MT-11 (the DOM-MTG side; the task side of assignment is FEAT-010, for example [FR-010-009](../../FEAT-010-task-manager/requirements/FR-010-009-task-api-create-update.md) AC-010-009-04 for row versions). The [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS (2026-09-30, browser-side commit); the server commit of PLAN-002 WI-09 re-runs the same rules and is tested against local PostgreSQL.
- The refusal of a draft without an R, and the rule that a speaker label is not an R, are also stated from the task side in [FR-010-019](../../FEAT-010-task-manager/requirements/FR-010-019-assign-by-member.md) (AC-010-019-04). This requirement keeps them because the meeting commit is where the server enforces them; the two describe one behavior, and a change to it is made in both.
- Who may commit: anyone who can read the meeting; a Guest is refused (FR-012-008). A restricted meeting with an inactive participant cannot commit (422) until that person is removed or reactivated ([SDD-004 amendment](../../FEAT-004-meeting-task-manager/design.md#open-items-from-the-wi-09-build)).
- The line under the button still reads “บันทึกผู้รับผิดชอบในเครื่องนี้ ไม่ส่งข้อความถึงทีม”, which dates from the local build; with the server workspace the record is on the server.
- Not run: a Member’s commit on the hosted site and the form in a browser ([verification](../../../releases/0.5.0/verification.md)).
