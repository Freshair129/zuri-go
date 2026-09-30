---
id: FR-012-002
title: Audio intake through FUNG
delivery: building
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
---

# FR-012-002 — Audio intake through FUNG

The system SHALL send an audio or video file to FUNG’s import only when the user chooses a file and starts the import, SHALL show the job state FUNG reports, and SHALL NOT treat a failed import or an empty transcript as a ready meeting.

## Acceptance criteria
- AC-012-002-01 — Given a connected FUNG, when the user chooses a file with one of the extensions wav, mp3, m4a, mp4, webm, ogg, flac, aac, mpeg or mov and a size above 0 bytes and up to 512 MiB, then one `POST /recordings/import` is sent with the file, its type and a filename header that contains only ASCII (another name is sent as `meeting-upload.<extension>`); nothing is sent before the file is chosen.
- AC-012-002-02 — Given a file of another type, empty, or larger than 512 MiB, then it is refused before any request with “ชนิดไฟล์นี้ยังไม่รองรับ” or “เลือกไฟล์เสียง/วิดีโอขนาดมากกว่า 0 และไม่เกิน 512 MiB”.
- AC-012-002-03 — Given an import answer without `jobId`, `recordingId` or `projectId`, then the screen shows “FUNG ไม่ส่ง receipt ของการนำเข้า” and no job is recorded, so a retry is never reported as done without a receipt.
- AC-012-002-04 — Given an accepted import, when the user chooses “ตรวจสถานะถอดเสียง”, then the state is read from `GET /jobs/{id}` and shown as FUNG reports it, with its error message when there is one, and no percentage the system made up.
- AC-012-002-05 — Given a recording with no transcript segments, when the user chooses “นำเข้า / ตรวจฉบับใหม่”, then it is refused with “ยังไม่มีข้อความถอดเสียง ไม่สร้างประชุม Ready จาก transcript ว่าง” and no meeting is created.

## Implementation
- `apps/web/src/content/meeting/fung-client.mjs`: `createFungClient().upload` (type, size, filename header, receipt check; AC-012-002-01 to -03) and `.job` (AC-012-002-04).
- `apps/web/src/content/meeting/Meetings.jsx`: the upload control “＋ อัปโหลดเสียงไป FUNG”, the job line with “ตรวจสถานะถอดเสียง”, and `importRecording` (the empty-transcript refusal, AC-012-002-05).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “audio defaults to server channel and import sends safe Unicode filename header” covers the filename header and one accepted upload. AC-012-002-02 to -05 have no test of their own.

## Notes
- Origin: FEAT-004 MT-06. Delivery is `building`: the [verification](../../FEAT-004-meeting-task-manager/verification.md) row says the client, the receipt and the contract are implemented but a real upload and Whisper transcription are NOT_RUN.
- Not run: an upload to an installed FUNG, real transcription, and the failed-job and empty-transcript paths against a real FUNG. The spec’s four states (Uploading, Transcribing, Ready, Failed) are shown as the raw status text FUNG returns, not as four labelled states.
- How a meeting becomes a stored source snapshot is FR-012-003.
