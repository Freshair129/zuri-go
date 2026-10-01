---
id: FR-005-010
title: A file is at most 2 MiB and a task holds at most 5 active files
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-005-014]
---

# FR-005-010 — A file is at most 2 MiB and a task holds at most 5 active files

The system SHALL accept a file of at most 2 MiB and at most 5 active files per task, SHALL enforce both on the server under a lock that serializes concurrent uploads of the Business, and SHALL NOT count a removed file among the 5.

## Acceptance criteria
- AC-005-010-01 — Given a file of 2,097,153 bytes, when it is uploaded, then the answer is 413 “ไฟล์ต้องไม่เกิน 2 MB” and nothing is stored.
- AC-005-010-02 — Given a task with 5 active files, when a sixth is uploaded, then the answer is 422 “แนบได้สูงสุด 5 ไฟล์ต่องาน”.
- AC-005-010-03 — Given a task with 4 active files, when two uploads run at once, then exactly one succeeds and the task holds 5 files, never 6.
- AC-005-010-04 — Given a task with 5 files of which one was removed, then a new upload is accepted.

## Implementation
- `apps/api/attachments.mjs` — `MAX_ATTACHMENT_BYTES` and `decodeAttachment` (the 413), `attachmentAction` (the count of rows with `deleted_at IS NULL`, and `UPDATE businesses SET domain_revision=domain_revision+1` first, which makes a concurrent transaction fail to serialize instead of passing the count); `apps/web/src/content/meeting/TaskAttachments.jsx` (the same bound in the browser).
- Test: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes, follow their task visibility, enforce bounds and become unavailable after removal”) covers AC-005-010-01 to -03 (the parallel pair ends with 5 files). Run on 2026-10-01 by the author of this file: passed. AC-005-010-04 rests on reading the count query; no committed test uploads again after a removal.

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullets 1 and 4 (“the server enforces size/count under task lock”), bullet 6.
- The spec says “under task lock”; the code serializes on the Business row, which is stricter and satisfies the same outcome. Not a change of meaning.
- A file over 2 MiB goes in the existing link field instead ([guest review](../../../history/zuri-go-guest-review/verification.md), “Operating limits”).
