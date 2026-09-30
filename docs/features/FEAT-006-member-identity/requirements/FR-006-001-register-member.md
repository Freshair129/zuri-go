---
id: FR-006-001
title: Register a Member from a display name alone
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-001 — Register a Member from a display name alone

The system SHALL let a signed-in person register a Member with only a display name, SHALL refuse a blank display name, and SHALL store each optional field (full name, nickname, team label, position, email, phone, notes) as entered, leaving it empty when nothing was entered and never filling it in.

## Acceptance criteria
- AC-006-001-01 — Given a blank or whitespace-only display name, when a Member is saved, then it is refused with “กรุณากรอกชื่อที่ใช้แสดง” and no Member is added.
- AC-006-001-02 — Given only a display name, when the Member is saved, then the Member is Active and every optional field is empty; the system invents no value.
- AC-006-001-03 — Given optional values, when the Member is saved, then each is stored as typed apart from trimming; a blank value is stored as empty, a phone number with a leading zero stays text, and notes keep their line breaks.
- AC-006-001-04 — Given an email that is not of the form name@host.domain, or a phone number that is not 3 to 30 characters of digits, “+”, spaces, dots, dashes and parentheses, when the Member is saved, then it is refused with “รูปแบบ Email ไม่ถูกต้อง” or “รูปแบบเบอร์ติดต่อไม่ถูกต้อง” and nothing is saved.
- AC-006-001-05 — Given a Guest, when they try to register or edit a Member, then sign-in is requested in the app and the API refuses the write with 401.
- AC-006-001-06 — Given a Member saved in the PostgreSQL workspace, then the server assigns the PID, and a request that names a PID cannot set or change it (a `PATCH` of a Member that carries `pid` answers 422).

## Implementation
- `apps/web/src/content/meeting/model.mjs:saveMember` — `required` (display name), `text` (trim, empty to `null`), the email and phone checks; `validateState` repeats the name, status and text checks when a stored or restored state is read.
- `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` — dialog “ลงทะเบียน Member”, required field “ชื่อที่ใช้แสดง”, hint “กรอกภายหลังได้” on the optional fields; `apps/web/src/content/meeting/MeetingWorkspace.jsx:MeetingWorkspace` — button “＋ ลงทะเบียน Member”, `setModal` (asks a Guest to sign in) and `change` (saves through `repo.mutate`).
- `apps/api/workspace.mjs:writeDomain` — the Members loop writes `display_name` and the optional columns, never `pid`, and removes credential keys from the stored metadata; `apps/api/service.mjs:save` with resource `members` refuses unknown fields such as `pid`; `apps/api/member-auth.mjs:authorizeWrite` answers 401 `AUTH_REQUIRED` without a Member session.
- `apps/api/migrations/001_core.sql` — `members.display_name` CHECK (not blank); `apps/api/migrations/005_member_identity.sql` — trigger `member_pid` (server-assigned, immutable, `ZGO-P` plus at least four digits).
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“title-only tasks and name-only members keep optional values null”, “member phone stays a string and rename keeps task references”); `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable…”); `apps/api/test/cloud-handler.test.mjs` (`PATCH` of a Member with `pid` answers 422). No committed test covers AC-006-001-04.
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) reproduced AC-006-001-01 to -04 on the current model. The PostgreSQL tests above were read, not run; the Guest write check of AC-006-001-05 is the hosted one of release 0.5.0 (Guest writes answered 401, [verification](../../../releases/0.5.0/verification.md)); no browser check of the form was run for this file.

## Notes
- Origin: FEAT-004 MT-20.
- Registering a Member creates no sign-in: the credential is issued only by the trusted operator (`apps/api/provision-members.mjs`, [FEAT-006 spec](../spec.md) §1 assumption 4). A Member without a credential can be assigned work but cannot sign in.
- In production Guests still read Member profiles, so an email, phone or note entered there is readable by Guests until the Member-profile level of PLAN-002 Q1 is built; keep HR, salary and customers’ personal data out of it ([release verification](../../../releases/0.5.0/verification.md)).
- The optional field `team` is a free-text label; it is not a Team of [FR-011-001](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-001-teams.md) and nothing converts it.
- In the browser workspace a Member has no PID; the Members view says “PID จะกำหนดเมื่อบันทึกใน PostgreSQL”.
