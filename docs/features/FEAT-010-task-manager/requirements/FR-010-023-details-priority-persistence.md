---
id: FR-010-023
title: Details and priority survive a backup and restore
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-011, FR-010-017, FR-010-022, FR-011-008]
---

# FR-010-023 — Details and priority survive a backup and restore

The system SHALL keep the details of Members and tasks, each week’s priority and note, the history and every reference between them through a backup and a restore, SHALL validate a backup before it changes anything, SHALL NOT apply the weekly seed over restored or filled-in values, and SHALL NOT report a save as done when it failed.

## Acceptance criteria
- AC-010-023-01 — Given a workspace with a multi-line Thai task description, a Member phone number with a leading zero, priorities and notes in two weeks, history entries, and R, A, C and I references, when “Backup JSON” (“Backup แคมเปญและงาน” in the hosted workspace) is exported and then restored into the browser workspace or imported into a PostgreSQL Business that has no campaign (“ตรวจข้อมูลเดิมก่อนนำเข้า PostgreSQL”), then every detail, every reference and every week entry is the same, and the task and Member IDs are the same.
- AC-010-023-02 — Given a backup in which a task names a Member that is not in it, a week entry has a value outside the MoSCoW scale or names a task that does not exist, a text field is not text, or a date is invalid, then it is refused before anything is stored, and the current data is unchanged.
- AC-010-023-03 — Given a workspace restored from a backup that holds the seed key, when the weekly seed is applied again, then nothing is added and no restored or filled-in value changes (FR-010-017, AC-010-017-04).
- AC-010-023-04 — Given a save of task or Member details, of a week entry or of a priority that fails — a storage error, a server error, or a stale version (409 or “ข้อมูลถูกแก้แล้ว กรุณาปิดแล้วเปิดรายการใหม่ก่อนบันทึก”) — then the form shows the error, no “บันทึกงานแล้ว” notice appears, and the stored values are unchanged.

## Implementation
- Export and restore in the browser workspace: `apps/web/src/content/meeting/MeetingWorkspace.jsx` (`backup`, `importBackup`, `confirmRestore`) with `apps/web/src/content/meeting/repository.mjs` (`restoreBoth`, the restore journal) and `apps/web/src/content/meeting/model.mjs:validateState` (member references, week entries, enums, text fields, dates). Import into PostgreSQL: `apps/api/workspace.mjs:importPreview`, `:importCommit` (`decodeBackup` runs `validateState`; refused when the Business already has a campaign; a committed import replays as already committed); UI `apps/web/src/content/business/BusinessWorkspace.jsx` (`previewImport`, `commitImport`).
- Save failures: `MeetingWorkspace.jsx:change` reports success only after `repo.mutate` returns, and `TaskForm` shows the error and stays open; the model refuses a stale `version` (`checkVersion`) and the server answers 409 (`apps/api/workspace.mjs:saveLegacy`, `apps/api/tasks.mjs:updateTask`).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “backup validates all member and weekly references”, “backup rejects malformed text, dates and dangling source references before render”, “member phone stays a string and rename keeps task references”, “later details preserve ID, R, state and week; omitted differs from null”, “stale form version cannot overwrite concurrent edits”, “seed repeats preserve 5 tasks, 4 members, names and user edits”; `apps/api/test/database.test.mjs` — “legacy preview/import/retry preserves campaign totals, task identity, RACI, MoSCoW and meeting evidence”; `apps/web/src/content/meeting/tests/repository.browser.mjs` (the IndexedDB round trip of 0.3.0). The PostgreSQL test needs a local PostgreSQL and the browser harness a browser; neither was re-run for this record. The pure model suite (36 tests) passed on 2026-10-01.
- In production since 0.5.0 (code commit `7bb538c`). Not run: a restore or an import on production, Member checks and browser checks ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-29 (verification row PASS on the local browser workspace, model, IndexedDB and backup checks). The combined Backup v2 and its v1 compatibility (MT-14) stay with FEAT-004 (decided in its “Proposed split”); this requirement states only what must survive them.
- Scope of delivery: in the PostgreSQL workspace the page answers a restore with “PostgreSQL เก็บข้อมูลร่วมในเครื่องแล้ว การ Restore ทับชุดปัจจุบันยังไม่รองรับ” (`importBackup`), so a backup file cannot be restored over a populated PostgreSQL workspace; the paths that exist are the browser-workspace restore and the import into a Business that has no campaign. Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D9): a restore over a populated PostgreSQL workspace stays unsupported.
- A restore into an empty Business assigns new PIDs and restores no credentials; decided 2026-10-01 (D7): intended, a restore is not an identity migration ([FR-006-006](../../FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md)). AC-010-023-01’s “Member IDs are the same” refers to the Member ID, not the PID.
- History events written from 2026-10-01 by 0.5.1 and later keep no evidence quote that `meeting_task_links` holds (D14, [FR-011-009](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-009-confidential-meeting-tasks.md) AC-011-009-05), so a backup’s history carries those references without their evidence (the links hold it); older events stay as stored and are withheld on read. Released 2026-10-01 in 0.5.1.
- A backup taken from the PostgreSQL workspace holds only what the person may read (FR-011-008, AC-011-008-04), so it is not a full copy of a Business; the operator’s database dump is the full copy and is private.
- A backup restored into an empty Business also turns its campaign tasks into task records (FR-010-015, AC-010-015-04).
