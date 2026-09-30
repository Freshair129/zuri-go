---
id: FR-010-019
title: Assigning people to a task by Member
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-001, FR-010-018]
---

# FR-010-019 — Assigning people to a task by Member

The system SHALL record each person on a task as a reference to a Member chosen from the Members of the Business, SHALL let a Member be added from the task form without creating the task, and SHALL NOT assign a person to a draft task from a meeting until a person chooses the R.

## Acceptance criteria
- AC-010-019-01 — Given a task saved with R, A, C and I chosen in the form, then what is stored for each is a Member ID, and two Members with the same display name are two Members: the task refers to exactly the one chosen, and the pickers show the team and the first four characters of the ID to tell them apart.
- AC-010-019-02 — Given the task form, when the person uses “＋ เพิ่ม Member จากฟอร์มนี้” with a name and “เพิ่มและเลือกเป็น R”, then a Member with that name is created and chosen as R in the form, and no task exists until “บันทึกงาน” is pressed.
- AC-010-019-03 — Given a task saved without choosing anyone, then R and A are empty and the task shows “รอยืนยัน”; nobody is assigned by default.
- AC-010-019-04 — Given a draft task from a meeting with no R chosen, when the person asks to create or update tasks, then it is refused with “เลือกรายชื่อ R ก่อนสร้างงานจากประชุม”, no task is created, and a speaker label is never used as the R.
- AC-010-019-05 — Given an Inactive Member, when a task is created or updated through the task API or saved through the whole-workspace save (the meeting commit included) and the save would name them in a new R, A, C or I, then it is refused with 422 `MEMBER_INACTIVE` (“สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active”) and nothing is stored; a role the task already held with that Member is kept, and a named viewer may be Inactive ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D2; the Member-side statement is [FR-006-003](../../FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md) AC-006-003-05 and -06).
- AC-010-019-06 — Given the task form, then “＋ เพิ่ม Member จากฟอร์มนี้” is offered only to the Business admin and the local operator; any other signed-in Member picks from the registered Members, and the API refuses a Member added by them with 403 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D3; [FR-006-001](../../FEAT-006-member-identity/requirements/FR-006-001-register-member.md) AC-006-001-07).

## Implementation
- `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` — the R, A, C and I pickers (`choices`), `quickMember` (AC-010-019-02), option labels with team and `m.id.slice(0,4)` (AC-010-019-01); `apps/web/src/content/meeting/model.mjs:saveTask` and `:commitBatch` (the R is required for `create` and `update` choices, AC-010-019-04; the server’s meeting commit `apps/api/meeting-commit.mjs` runs the same `commitBatch`); `apps/web/src/content/meeting/Meetings.jsx` starts each draft choice with an empty R.
- Task API: `apps/api/tasks.mjs:createTask`, `:updateTask` store the roles as Member IDs (`task_roles.member_id`).
- Released 2026-10-01 in 0.5.1, for AC-010-019-05 and -06: `apps/api/tasks.mjs:checkActive` (after `checkPeople` in `createTask` and `updateTask`); `apps/api/workspace.mjs:writeDomain` (the same rule on the workspace save and so on the meeting commit); `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` (`canAddMember` gates the quick add); `apps/api/service.mjs:checkMemberWrite` for the 403. Tests, written with the change and not run for this record: `apps/api/test/tasks-api.test.mjs` (“an Inactive Member takes no new R, A, C or I through the API or the workspace save…”), `apps/api/test/meeting-commit.test.mjs` (“a restricted meeting with an Inactive participant commits…”), `apps/api/test/cloud-handler.test.mjs` (“the registry rules hold on the hosted workspace save…”); the quick-add gate was not browser-checked.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“duplicate names remain separate; inactive cannot take new assignments” for the two-Members part of AC-010-019-01). The rest of AC-010-019-01 and AC-010-019-02, -03 and -04 have no test of their own. The pure model suite (36 tests) passed on 2026-10-01.
- In production since 0.5.0 (code commit `7bb538c`). Not run: Member checks and browser checks on production ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-21 (verification row PASS on the local browser workspace, model and IndexedDB checks).
- A Member’s own data and lifecycle (registration, rename keeping the task reference, Inactive not offered for new work) are MT-20 and MT-22–24, which the split assigns to DOM-IAM; they are not restated here. The task form offers Active Members and any Inactive Member already on the task. Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D2): the API refuses an Inactive Member in a new R, A, C or I and keeps a role the task already had (AC-010-019-05); named viewers may be Inactive. Built locally and not released: on 0.5.0 `checkPeople` checks only that the Member exists, so a client that skips the form can still assign an Inactive Member.
- The meeting side of assignment — checking the R and the list before the commit (MT-11) — belongs to the DOM-MTG feature; this requirement states only that the task is not assigned by default.
