---
id: FR-006-004
title: An Inactive Member keeps their history and can be made Active again
delivery: declared
status: approved
relations:
  decided_by: [ADR-008]
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-004 — An Inactive Member keeps their history and can be made Active again

The system SHALL preserve a Member's UUID/PID identity and all task, RACI, weekly-entry, foreign-key and audit references when the Member is deactivated or retired. A Member removal request is logical deactivation/retirement, never a hard delete or cascade-delete. Any active Member may make that status change; an Inactive Member may be made Active again. Inactive Members cannot sign in or perform new work.

## Acceptance criteria
- AC-006-004-01 — Given a Member set Inactive, then they remain in the Members view labelled “Inactive”, and their tasks, RACI roles and history events are unchanged and still show their name.
- AC-006-004-02 — Given a whole-workspace save that leaves out an existing Member, then it is refused with 409 “Workspace ขาดสมาชิกเดิม กรุณาโหลดข้อมูลล่าสุด”; setting Inactive is the only way a Member leaves the choice lists.
- AC-006-004-03 — Given an Inactive Member set Active, then they are offered again and can be assigned to a new task.
- AC-006-004-04 — Given an Inactive Member, then they cannot sign in and an existing session stops at its next request; given the Member set Active, then their existing credential works again, because the status does not change the credential.
- AC-006-004-05 — Given any active signed-in Member, when they set any Member's status to Inactive or Active, including their own, then the status change succeeds in the configured Business and preserves the UUID/PID, foreign keys, work and audit history.
- AC-006-004-06 — Given a Member removal request, then the identity is logically deactivated/retired and never hard-deleted; existing work and audit events retain their actor/reference history, and the PID is never reassigned.

## Implementation
- `apps/web/src/content/meeting/model.mjs:saveMember` (status `active` or `inactive`; no delete) and `person` (the assignment rule of [FR-006-003](FR-006-003-inactive-not-offered.md)); history is `events` in the same state and is never rewritten.
- `apps/web/src/content/meeting/MeetingWorkspace.jsx:MeetingWorkspace` — the Members view shows every Member with “Active” or “Inactive” and the count of tasks where they are R; `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` — field “สถานะสมาชิก”.
- Released 2026-10-01 in 0.5.1 (before it, on 0.5.0, any signed-in Member can change any status, their own included), for AC-006-004-05 and -06: `apps/api/service.mjs:checkMemberWrite` (own status refused first, then the admin-only rule; `canEditMembers` is the admin or operator test), applied by `save` (per-record route) and `apps/api/workspace.mjs:writeDomain` (workspace save); `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` (the `disabled` and `hint` props of the status field). Tests, written with the change and not run for this record: `apps/api/test/visibility-db.test.mjs` (“Member registry: adding a Member and any status change need the admin or the operator; own details yes, own status no”, which also shows the admin refused on their own status and the operator allowed) and `apps/api/test/cloud-handler.test.mjs` (“the registry rules hold on the hosted workspace save…”); the form was not browser-checked.
- `apps/api/workspace.mjs:writeDomain` — refuses a save that omits a stored Member (409); `apps/api/member-auth.mjs:loginMember` and `resolveMember` — sign-in and every write require status Active and an enabled credential of the current version.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“duplicate names remain separate; inactive cannot take new assignments”: the old task keeps R); `apps/api/test/member-auth.test.mjs` (an Inactive Member cannot sign in). No committed test covers history after Inactive, the 409 of AC-006-004-02, set-Active again or the sign-in return of AC-006-004-04.
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) confirmed that history events stay, the task keeps R, and an Active Member can be assigned again. AC-006-004-02 and the sign-in part of AC-006-004-04 were read in the code, not run; no browser check was run for this file.

## Notes
- Supersession: [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) removes the Business-admin and own-record status gates. Member delete means logical deactivation/retirement, preserving UUID/PID, foreign keys, work and audit history. This changed access contract is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; release evidence below records the former restriction.
- Origin: FEAT-004 MT-22 (old work and history stay; re-activation).
- There is no screen or endpoint that removes a Member.
- Historical 0.5.1 restriction: status changes needed the Business admin or operator and Members could not change their own status. ADR-008 supersedes the access restriction; its prior implementation evidence remains historical.
