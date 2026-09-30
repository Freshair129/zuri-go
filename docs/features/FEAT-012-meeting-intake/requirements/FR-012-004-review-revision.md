---
id: FR-012-004
title: Reviewed revision of a transcript
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  relates_to: [FR-011-010]
---

# FR-012-004 — Reviewed revision of a transcript

The system SHALL let a user correct a transcript’s text and speaker names in a working copy, SHALL save it as a new reviewed revision that leaves the source snapshot and every segment’s time span unchanged, and SHALL stop a draft made from a revision or source that is no longer the meeting’s current one from being committed.

## Acceptance criteria
- AC-012-004-01 — Given a source snapshot, when the user edits a segment’s text or speaker label, then the imported text stays unchanged and is shown beside the edit (“ต้นฉบับ / สิ่งที่แก้”); the autosaved working copy is labelled “ร่างข้อความยังไม่ใช่ฉบับตรวจแล้ว” until the user chooses “บันทึกฉบับตรวจแล้ว”.
- AC-012-004-02 — Given a review with another number of segments, or another segment ID, start time or end time, when it is saved, then it is refused (“จำนวน segment ไม่ตรงกับต้นทาง”, “ห้ามเปลี่ยน segment หรือ timecode”) and the source is unchanged.
- AC-012-004-03 — Given a saved review, then it records its source, its parent revision and a hash of its segments, and the review history (“ประวัติฉบับตรวจ”) lists every earlier revision of the meeting.
- AC-012-004-04 — Given a meeting whose recording changed in FUNG after the first import, when it is imported again, then a new snapshot is added and the screen shows “มีต้นฉบับใหม่จาก FUNG” with the two texts side by side; the meeting keeps its current source and review, and earlier tasks are not rewritten, until the user chooses “ใช้ฉบับใหม่และตรวจอีกครั้ง”.
- AC-012-004-05 — Given a draft batch made from a review or a source that is no longer the meeting’s current one, then it is shown as “Stale · ต้องตรวจใหม่” and cannot be committed (“ร่างเก่าใช้สร้างงานไม่ได้ กรุณาตรวจฉบับใหม่”); the server’s answer is FR-012-008.
- AC-012-004-06 — Given a connected FUNG, when the user loads reference audio, then the audio comes from an authenticated request for the selected recording and channel only, played from a temporary object URL that is released when the audio is replaced or the view closes; without a connection the control is disabled.

## Implementation
- `apps/web/src/content/meeting/model.mjs`: `saveReview` (AC-012-004-02, -03), `adoptSource` (AC-012-004-04), `isBatchStale` (AC-012-004-05), `reviewHash`.
- `apps/web/src/content/meeting/Meetings.jsx`: `ReviewEditor` (working copy with a 650 ms autosave into `meeting.workingCopy`, `save`, `loadAudio`, the history list) and the “มีต้นฉบับใหม่จาก FUNG” panel in `Meetings`.
- Server: `putRevision` (`apps/api/workspace.mjs`) stores each review with its parent in `meeting_revisions` (`kind` `review`) and refuses to rewrite one.
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “review preserves raw source/timecodes and blocks changing spans”, “review fingerprint is deterministic and text-sensitive”, “refreshed source invalidates old draft without rewriting committed task”, “new review makes draft stale and prevents commit”, “audio defaults to server channel and import sends safe Unicode filename header”. The autosave label and the release of the object URL have no test.

## Notes
- Origin: FEAT-004 MT-08. The [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS (2026-09-30); the browser check of that date ran on the IndexedDB build, and the review screen has not been browser-checked again on the PostgreSQL build.
- A revision kept on the recording machine (a stub, [FR-011-010](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-010-transcript-custody.md)) cannot be reviewed or drafted from on another machine: the client refuses with “transcript ของประชุมลับเก็บไว้ที่เครื่องที่บันทึกการประชุม …”.
- Saving the review goes through the whole-workspace save (FR-010-011), so the ordinary save rules apply to it.
