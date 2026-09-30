---
id: FR-006-008
title: A failed Member save is never reported as saved
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-008 — A failed Member save is never reported as saved

The system SHALL report a Member save as done only after the store has confirmed it; when a save fails, the form SHALL stay open with the error, no success notice SHALL appear, and the Members view SHALL keep showing the stored data.

## Acceptance criteria
- AC-006-008-01 — Given a save refused by a rule (blank name, malformed email or phone, or a Member changed since the form was opened: “ข้อมูลถูกแก้แล้ว กรุณาปิดแล้วเปิดรายการใหม่ก่อนบันทึก”), then the form stays open showing the message and no success notice appears.
- AC-006-008-02 — Given the PostgreSQL workspace, when the API refuses the save (401 sign-in needed, 409 changed elsewhere) or cannot be reached (“เชื่อมต่อ workspace ไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่”), then the same holds and the workspace is not changed.
- AC-006-008-03 — Given the browser workspace, when its store cannot be opened or the write aborts (“เปิดข้อมูลในเครื่องไม่ได้”, “บันทึกไม่สำเร็จ: …”), then the same holds and nothing was written.
- AC-006-008-04 — Given a save the store confirmed, then the form closes, the list shows the saved Member and the notice “บันทึกงานแล้ว” appears. *The notice text is superseded on 2026-10-01 by AC-006-008-05 (“บันทึกสมาชิกแล้ว”, owner approval, PLAN-002 D6); the rest holds.*
- AC-006-008-05 — Given a Member save the store confirmed, from the Member form or from “เพิ่มและเลือกเป็น R” in the task form, then the notice reads “บันทึกสมาชิกแล้ว”; a task save keeps “บันทึกงานแล้ว” ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D6).

## Implementation
- `apps/web/src/content/meeting/MeetingWorkspace.jsx:change` — sets the notice and the new state only after `repo.mutate` returns, and throws “กรุณาเข้าสู่ระบบก่อนแก้ไข” when the viewer may not write; `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` (`submit`) closes only after `onSave` succeeds and otherwise shows the error in an alert.
- `apps/web/src/content/business/api.mjs:openServerRepository` (`mutate`, `request`) — a failed `PUT /workspace` throws with the server’s message; `apps/web/src/content/meeting/repository.mjs:openRepository` (`transact`) — a thrown error or aborted transaction rejects and stores nothing.
- `apps/api/api.mjs:sendError` — maps a rule or database failure to a 4xx message or the generic “บันทึกไม่สำเร็จ กรุณาลองใหม่” (500), never a success.
- Released 2026-10-01 in 0.5.1, for AC-006-008-05: `apps/web/src/content/meeting/MeetingWorkspace.jsx:MeetingWorkspace` passes the message “บันทึกสมาชิกแล้ว” to `change` from the `onSave` of `MemberForm` and the `onMember` of `TaskForm`. No test; not browser-checked.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (blank name refused, “stale form version cannot overwrite concurrent edits” for tasks); `apps/web/src/content/meeting/tests/repository.browser.mjs` (“validation failure aborts before transaction completion”, “a failed multi-entity mutation rolls back every write”; a manual browser harness that is not part of `npm test`). No committed test drives the Member form itself.
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) confirmed the refusals of AC-006-008-01 on the model, including the stale-version message for a Member. The form, the notice and the hosted and browser-store failures were read in the code, not run; no browser check was run for this file.

## Notes
- Origin: FEAT-004 MT-24 (a storage error is not reported as saved).
- On 0.5.0 the success notice for a Member save is the task wording “บันทึกงานแล้ว”, because `change` has one default message. Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D6): a Member save says “บันทึกสมาชิกแล้ว” (AC-006-008-05), built locally and not released.
- AC-006-008-04's notice text is superseded by AC-006-008-05; the owner approved the new acceptance criteria on 2026-10-01.
