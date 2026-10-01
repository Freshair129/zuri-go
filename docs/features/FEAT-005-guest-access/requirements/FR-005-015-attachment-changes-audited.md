---
id: FR-005-015
title: Attachment changes are explicit saves, audited without bytes; removal is a soft delete
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-006-019]
---

# FR-005-015 — Attachment changes are explicit saves, audited without bytes; removal is a soft delete

The system SHALL treat each upload and each removal of a file as its own explicit save, SHALL audit it without the file bytes, and SHALL make a removed file unavailable by marking it deleted, not by erasing its row.

## Acceptance criteria
- AC-005-015-01 — Given an upload, then it is one request that adds one row and one audit event, and neither the response nor the event holds the file bytes.
- AC-005-015-02 — Given a removal, then the row’s `deleted_at` is set, the file leaves the list and its download answers 404.
- AC-005-015-03 — Given an upload or a removal by a Member, then the row and the event record that Member.

## Implementation
- `apps/api/attachments.mjs:attachmentAction` — `POST` inserts and calls `audit`; `PATCH` with `{deleted:true}` updates `deleted_at` and `deleted_by_member_id` and calls `audit`; the listed `columns` exclude `payload`.
- Test: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes…”): the response holds no `payload`, `uploaded_by_member_id` is the Member, a removal answers 200 and the download then answers 404, the list drops from 5 to 4. Run on 2026-10-01 by the author of this file: passed. The test does not read the audit event; that was read from the code.

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 4 (the last two sentences), bullet 6 (“removal”).
