---
id: FR-010-018
title: RACI rules — one R, one A, Members only
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-007, FR-010-008, FR-010-019]
---

# FR-010-018 — RACI rules — one R, one A, Members only

The system SHALL keep at most one R and one A on a task and any number of C and I, SHALL let R, A, C and I name only Members of the Business and never free text, SHALL keep an A unconfirmed until a person confirms it, and SHALL show a name that is only a proposal as a proposal.

## Acceptance criteria
- AC-010-018-01 — Given a task whose R is Member X, when it is saved with Member Y as R, then the task has exactly one R, Y; the same holds for A; and a task may hold any number of C and I.
- AC-010-018-02 — Given a C or I list that names the same Member twice, then the Member is stored once in that role.
- AC-010-018-03 — Given a save that names as R, A, C or I an ID that is not a Member of the Business, then it is refused — “ไม่พบสมาชิกที่อ้างอิงในธุรกิจนี้” from the task API with 422 `MEMBER_NOT_FOUND`, “ไม่พบ Member ที่อ้างอิง” from the workspace model — and nothing changes.
- AC-010-018-04 — Given a name that is only text — a Workboard owner (FR-010-008), a speaker label of a transcript, or a name in an imported file that matches no Member — then the task has no R for it and shows “รอยืนยัน”; the text is never turned into a verified person.
- AC-010-018-05 — Given a task with an A, when the A is set or changed, then the A is unconfirmed (“· รอยืนยัน” in the lists) until a person confirms it with “ยืนยัน A ที่ระบุไว้” (task API: `roles.A_confirmed` sent with the roles); a changed A never keeps the earlier confirmation unless the same save confirms it.
- AC-010-018-06 — Given C and I names that came from a proposal (`raciProposed`), then the RACI view shows them with “(เสนอ)” until a person confirms them with “C/I มาจากข้อเสนอเดิม — กดเพื่อยืนยันรายชื่อ”.

## Implementation
- Workspace model: `apps/web/src/content/meeting/model.mjs:saveTask` (single `responsibleId` and `accountableId`, C and I as sets, A confirmation reset when A changes) and `:person` (“ไม่พบ Member ที่อ้างอิง”); `:validateState` refuses a reference to a missing Member in a backup. Form: `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` (pickers, “ยืนยัน A ที่ระบุไว้”, “C/I มาจากข้อเสนอเดิม”). Lists: `apps/web/src/content/meeting/MeetingWorkspace.jsx` (the RACI layout shows “รอยืนยัน” and “(เสนอ)”; `memberName` shows “รอยืนยัน” for no person).
- Task API: `apps/api/tasks.mjs:cleanInput` (`roles` takes one Member ID for R and one for A, lists for C and I), `:checkPeople` (422 `MEMBER_NOT_FOUND`), `:writePeople` (one row per Member and role; `A_confirmed` decides the A’s `confirmation`). Database: `apps/api/migrations/001_core.sql` — table `task_roles` with the unique index `single_r_a` (one R row and one A row per task) and foreign keys to `members`.
- Tests: `apps/api/test/tasks-api.test.mjs` (422 `MEMBER_NOT_FOUND` for an unknown R; A confirmed before Done), `apps/web/src/content/meeting/model.test.mjs` (“backup validates all member and weekly references”, “duplicate names remain separate; inactive cannot take new assignments”). No test asserts AC-010-018-01, -02, -05 or -06 directly; the PostgreSQL tests need a local PostgreSQL and were not re-run for this record. The pure model suite (36 tests) passed on 2026-10-01.
- In production since 0.5.0 (code commit `7bb538c`). Not run: Member checks and browser checks on production ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-04 (verification row PASS on the local browser workspace and model tests).
- The third clause of MT-04, “Done checks the real criteria”, is FR-010-007 (AC-010-007-01 needs an R, a confirmed A, a confirmed acceptance criterion and evidence); it is not restated here.
- Nothing forbids the same Member being both R and A (`apps/api/test/tasks-api.test.mjs` creates such a task); whether that should be refused is not decided.
- The task API writes R, C and I rows as `proposed` and only the A row as `confirmed`; the workspace save writes the R, C and I rows as `proposed` only when `raciProposed` is set. Only the A confirmation is read back by the task rules.
