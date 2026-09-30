---
id: FR-006-002
title: Renaming a Member keeps every reference
delivery: implemented
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-002 — Renaming a Member keeps every reference

The system SHALL let a Member’s display name and details change without changing the Member’s ID or PID, and every task, RACI role, weekly entry and history event that refers to that Member SHALL keep referring to the same person; a reference SHALL follow the Member’s ID, never the name.

## Acceptance criteria
- AC-006-002-01 — Given a Member who is R of a task, when the display name is changed, then the task’s R is the same Member and shows the new name.
- AC-006-002-02 — Given a renamed Member, then the Member’s ID and PID are unchanged.
- AC-006-002-03 — Given two Members with the same display name, then they stay two Members, each task keeps the Member it was given, and the form says “มีชื่อเหมือนกันในทะเบียน กรุณาตรวจทีม/ตำแหน่งเพื่อแยกคน ระบบจะเก็บเป็นคนละ Member”.

## Implementation
- `apps/web/src/content/meeting/model.mjs:saveMember` — an existing Member is updated in place under the same `id`; tasks hold `responsibleId`, `accountableId`, `consultedIds` and `informedIds` as Member IDs; `memberName` resolves the name at display time.
- `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` — the duplicate-name notice.
- `apps/api/workspace.mjs:writeDomain` (`memberId`) — resolves a Member by ID or legacy ID, never by name; `apps/api/migrations/005_member_identity.sql` — trigger `member_pid` keeps the PID when a row changes.
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“member phone stays a string and rename keeps task references”, “duplicate names remain separate; inactive cannot take new assignments”); `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable…”: a rename leaves the PID unchanged).
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests). The PostgreSQL test was read, not run; no browser check was run for this file.

## Notes
- Origin: FEAT-004 MT-22 (rename keeps the task reference).
- Editing a Member never exposes or resets a sign-in code ([FEAT-006 spec](../spec.md) §1 assumption 4).
- Sign-in by a single code is unaffected by a rename: the code selects the Member, not the name ([FEAT-007](../../FEAT-007-single-code-login/feature.md)).
