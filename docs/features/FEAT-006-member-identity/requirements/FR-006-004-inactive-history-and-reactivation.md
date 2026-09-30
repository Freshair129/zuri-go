---
id: FR-006-004
title: An Inactive Member keeps their history and can be made Active again
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-004 — An Inactive Member keeps their history and can be made Active again

The system SHALL keep every Member, and the tasks, RACI roles, weekly entries and history events that refer to them, when the Member is set Inactive, SHALL NOT delete a Member, and SHALL let an Inactive Member be set Active again.

## Acceptance criteria
- AC-006-004-01 — Given a Member set Inactive, then they remain in the Members view labelled “Inactive”, and their tasks, RACI roles and history events are unchanged and still show their name.
- AC-006-004-02 — Given a whole-workspace save that leaves out an existing Member, then it is refused with 409 “Workspace ขาดสมาชิกเดิม กรุณาโหลดข้อมูลล่าสุด”; setting Inactive is the only way a Member leaves the choice lists.
- AC-006-004-03 — Given an Inactive Member set Active, then they are offered again and can be assigned to a new task.
- AC-006-004-04 — Given an Inactive Member, then they cannot sign in and an existing session stops at its next request; given the Member set Active, then their existing credential works again, because the status does not change the credential.

## Implementation
- `apps/web/src/content/meeting/model.mjs:saveMember` (status `active` or `inactive`; no delete) and `person` (the assignment rule of [FR-006-003](FR-006-003-inactive-not-offered.md)); history is `events` in the same state and is never rewritten.
- `apps/web/src/content/meeting/MeetingWorkspace.jsx:MeetingWorkspace` — the Members view shows every Member with “Active” or “Inactive” and the count of tasks where they are R; `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` — field “สถานะสมาชิก”.
- `apps/api/workspace.mjs:writeDomain` — refuses a save that omits a stored Member (409); `apps/api/member-auth.mjs:loginMember` and `resolveMember` — sign-in and every write require status Active and an enabled credential of the current version.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“duplicate names remain separate; inactive cannot take new assignments”: the old task keeps R); `apps/api/test/member-auth.test.mjs` (an Inactive Member cannot sign in). No committed test covers history after Inactive, the 409 of AC-006-004-02, set-Active again or the sign-in return of AC-006-004-04.
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) confirmed that history events stay, the task keeps R, and an Active Member can be assigned again. AC-006-004-02 and the sign-in part of AC-006-004-04 were read in the code, not run; no browser check was run for this file.

## Notes
- Origin: FEAT-004 MT-22 (old work and history stay; re-activation).
- There is no screen or endpoint that removes a Member. Any signed-in Member can set any Member Inactive or Active, because [FEAT-006](../feature.md) left granular roles out of scope; that is an open question for the owner, not a requirement here.
