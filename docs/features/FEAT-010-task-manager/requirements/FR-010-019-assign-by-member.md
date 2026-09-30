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

## Implementation
- `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` — the R, A, C and I pickers (`choices`), `quickMember` (AC-010-019-02), option labels with team and `m.id.slice(0,4)` (AC-010-019-01); `apps/web/src/content/meeting/model.mjs:saveTask` and `:commitBatch` (the R is required for `create` and `update` choices, AC-010-019-04; the server’s meeting commit `apps/api/meeting-commit.mjs` runs the same `commitBatch`); `apps/web/src/content/meeting/Meetings.jsx` starts each draft choice with an empty R.
- Task API: `apps/api/tasks.mjs:createTask`, `:updateTask` store the roles as Member IDs (`task_roles.member_id`).
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“duplicate names remain separate; inactive cannot take new assignments” for the two-Members part of AC-010-019-01). The rest of AC-010-019-01 and AC-010-019-02, -03 and -04 have no test of their own. The pure model suite (36 tests) passed on 2026-10-01.
- In production since 0.5.0 (code commit `7bb538c`). Not run: Member checks and browser checks on production ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-21 (verification row PASS on the local browser workspace, model and IndexedDB checks).
- A Member’s own data and lifecycle (registration, rename keeping the task reference, Inactive not offered for new work) are MT-20 and MT-22–24, which the split assigns to DOM-IAM; they are not restated here. The task form offers Active Members and any Inactive Member already on the task, but the task API (`checkPeople`) checks only that the Member exists in the Business, so a client that skips the form can assign an Inactive Member; whether the API should refuse it is not decided.
- The meeting side of assignment — checking the R and the list before the commit (MT-11) — belongs to the DOM-MTG feature; this requirement states only that the task is not assigned by default.
