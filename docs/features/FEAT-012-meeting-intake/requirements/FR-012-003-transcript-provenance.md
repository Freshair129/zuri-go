---
id: FR-012-003
title: Transcript source snapshot and its provenance
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  relates_to: [FR-011-010]
---

# FR-012-003 — Transcript source snapshot and its provenance

The system SHALL store each transcript it imports as a source snapshot that records where it came from — source instance, project, recording, source mode, source revision (or none), content hash, capture time, coverage, and each segment’s ID and millisecond time span — and SHALL NOT present a transcript without a native revision as one that has it.

## Acceptance criteria
- AC-012-003-01 — Given a snapshot whose source mode is `native` or `legacy`, with a source instance, a recording and a content hash, and whose segments have an ID, text and finite, non-negative start and end times with end not before start, when it is imported, then the meeting for that source instance, project and recording is found or created and the snapshot is stored with those fields.
- AC-012-003-02 — Given a snapshot with any other mode, a segment that breaks those rules, or a missing source instance, recording or hash, then the import is refused (“รูปแบบ source snapshot ไม่ถูกต้อง”, “ช่วงข้อความต้นทางไม่ถูกต้อง” or a “กรุณากรอก…” message) and nothing is stored.
- AC-012-003-03 — Given a snapshot with the same content hash for the same meeting, then no second meeting and no second snapshot are created.
- AC-012-003-04 — Given a FUNG that offers no snapshot route, when the user has confirmed “ยืนยันว่าเป็น FUNG เครื่องเดิม” and imports a recording, then the snapshot has `sourceMode` `legacy`, `sourceRevision` and `sourceCursor` null, `nativeRevisionId` null on every segment and coverage status `unknown`, and it is not numbered as a revision; without the confirmation the import is refused with “ยืนยัน FUNG instance เดิมก่อนนำเข้า Legacy”.
- AC-012-003-05 — Given a stored snapshot, then a later import with other content adds a new snapshot and leaves the earlier one unchanged, and the server refuses to rewrite a stored revision with different content (“ห้ามเขียนทับ transcript revision เดิม”).
- AC-012-003-06 — Given a meeting’s transcript, then the review screen states its source mode (“Native revision” or “Legacy · ไม่ยืนยัน native revisions”), the number of segments and the coverage status, with `unknown` shown as `unknown`.

## Implementation
- `apps/web/src/content/meeting/model.mjs`: `addSource` (AC-012-003-01 to -03; one meeting per source instance, project and recording; one snapshot per content hash).
- `apps/web/src/content/meeting/fung-client.mjs`: `createFungClient().snapshot` builds the legacy snapshot of AC-012-003-04; `apps/web/src/content/meeting/Meetings.jsx`: the confirmation checkbox, `importRecording`, and the heading of `ReviewEditor` (AC-012-003-06).
- Server: `putRevision` in `writeDomain` (`apps/api/workspace.mjs`) writes each source into `meeting_revisions` (`kind` `source`; `content_hash`, `source_revision`, `source_cursor`, `source_mode`, `coverage`, `captured_at`) and refuses to overwrite a stored one (AC-012-003-05).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “source import replay does not create duplicate meetings or snapshots”; `apps/api/test/visibility-db.test.mjs` — “a stub cannot be overwritten, and only custody can mark a revision withheld (FR-011-010)” shows a stored stub is not rewritten. The legacy branch of `snapshot`, AC-012-003-02 and the rewrite refusal for a full revision have no test of their own.

## Notes
- Origin: FEAT-004 MT-07. The [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS (unit tests, FUNG Rust fixtures and the browser fixture, 2026-09-30); native snapshots were only exercised against fixtures.
- Where the transcript of a restricted meeting is kept is [FR-011-010](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-010-transcript-custody.md): the hosted database then holds a stub with the hashes and no segments, which this requirement does not restate.
- The snapshot contract is [SDD-004](../../FEAT-004-meeting-task-manager/design.md#33-source-snapshot-contract) section 3.3 (Thai).
