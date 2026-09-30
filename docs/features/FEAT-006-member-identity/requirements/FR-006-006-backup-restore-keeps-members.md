---
id: FR-006-006
title: Export and restore keep Member references and never merge Members by name
delivery: building
status: approved
relations:
  relates_to: [FEAT-004, SDD-004]
---

# FR-006-006 — Export and restore keep Member references and never merge Members by name

The system SHALL export Members with their IDs so that every R, A, C and I in the backup refers to a Member in the backup by ID, SHALL refuse to restore a backup whose references name a Member that is not in it, and SHALL restore Members that share a display name as separate Members, never merging them by name. A backup SHALL carry no credential.

## Acceptance criteria
- AC-006-006-01 — Given a workspace export, then it holds the Members and tasks, each R, A, C and I is a Member ID found in the same file, and the file holds no sign-in code, password hash, session or connector token.
- AC-006-006-02 — Given a backup in which a task’s R, A, C or I names a Member that is missing from it, when it is restored in the browser workspace or previewed for import into PostgreSQL, then it is refused with “งานอ้างสมาชิกที่ไม่มีอยู่ กรุณาแก้ backup ก่อน” and nothing is written.
- AC-006-006-03 — Given two Members with the same display name who are R of different tasks, when the workspace is exported and restored, then two Members come back and each task is on the same Member ID as before.
- AC-006-006-04 — Given a backup imported into an empty Business through the import API, when the same backup is committed again, then nothing is added, and the Members and their references come out as in the backup.

## Implementation
- Export: `apps/web/src/content/meeting/MeetingWorkspace.jsx:MeetingWorkspace` (`backup`, file `mission-control-backup-<date>.json`, schema 2 with `meetingTaskManager`). On PostgreSQL the state comes from `apps/api/workspace.mjs:readLegacy`, which reads no credential table.
- Restore in the browser workspace: `importBackup` and `confirmRestore` in the same file (the current data is downloaded first), `apps/web/src/content/meeting/repository.mjs:restoreBoth` and `recoverRestore`; `apps/web/src/content/meeting/model.mjs:validateState` checks every R, A, C and I against the Members.
- Import into PostgreSQL: `apps/api/workspace.mjs:importPreview` (`decodeBackup` runs `validateState`), `importCommit` (only into a Business with no campaign; a repeated commit of the same backup answers `alreadyCommitted`), `writeDomain` (`memberId`; IDs come from `safeId`, never from the display name).
- Tests: `apps/web/src/content/meeting/model.test.mjs` (“backup validates all member and weekly references”); `apps/api/test/database.test.mjs` (“legacy preview/import/retry preserves campaign totals, task identity, RACI, MoSCoW and meeting evidence”); `apps/api/test/tasks-api.test.mjs` (“a backup restored into an empty Business becomes task records with details”); `apps/web/src/content/meeting/tests/repository.browser.mjs` (manual browser harness for the restore journal, not part of `npm test`).
- Checked 2026-10-01 by the author of this file: `node --test apps/web/src/content/meeting/model.test.mjs` passed (36 tests), and a throw-away script (not committed) confirmed that two same-named Members survive a JSON round trip through `validateState` with each task on its own Member, and that a dangling reference is refused. The PostgreSQL tests were read, not run.
- Not run: a restore on production (the 0.5.0 release made a production backup but did not restore it, [verification](../../../releases/0.5.0/verification.md)) and a browser check of the backup and restore dialogs.

## Notes
- Origin: FEAT-004 MT-23 (export and restore keep references and do not merge same names wrongly). The combined Backup v2 as a whole (campaigns, meetings, v1 compatibility, no secrets or audio) is MT-14 and stays with FEAT-004; this requirement covers the Members in it.
- Why `building`: “Restore backup” on a PostgreSQL workspace does not restore over current data; it answers “PostgreSQL เก็บข้อมูลร่วมในเครื่องแล้ว การ Restore ทับชุดปัจจุบันยังไม่รองรับ ใช้ Backup เพื่อเก็บสำเนา”. Members can be restored from a backup only in the browser workspace, or by the import API into an empty Business. The acceptance above is therefore not reachable from the hosted screen, and no restore has been run on production.
- A restore into PostgreSQL does not read PIDs from the backup: the database assigns them (`member_pid`), so a restored Member may get a different PID than in the file, and no credential comes back, so the operator provisions sign-in again ([FEAT-006 spec](../spec.md) §2). Whether a PID must survive a restore is not decided.
- A campaign’s owner text is bound to a Member during import only when exactly one Member has that display name (`apps/api/workspace.mjs:writeCampaigns`); with same-named Members it stays unbound. This is read in the code, not tested.
