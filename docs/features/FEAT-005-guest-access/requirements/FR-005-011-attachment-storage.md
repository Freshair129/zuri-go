---
id: FR-005-011
title: Files are stored in PostgreSQL with their metadata and hash, scoped to the Business
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-011-008]
---

# FR-005-011 — Files are stored in PostgreSQL with their metadata and hash, scoped to the Business

The system SHALL store each file in the PostgreSQL table `task_attachments` with a UUID primary key, a composite foreign key (`business_id`, `task_id`) to its task, the file name, the verified display type, the byte size, the SHA-256 of the bytes, the bytes, timestamps and a soft-delete marker, under forced Business row-level security and with every query scoped to the Business.

## Acceptance criteria
- AC-005-011-01 — Given an uploaded file, then its row holds the file name, a display type verified from the bytes, the byte size, the SHA-256 of the bytes and the bytes, and its task belongs to the same Business.
- AC-005-011-02 — Given an uploaded file, when it is downloaded, then the bytes and the SHA-256 equal those uploaded.
- AC-005-011-03 — Given another Business, when it queries the table, then it reads no row of this Business’s files.

## Implementation
- `apps/api/migrations/004_task_attachments.sql` (table, composite foreign key, `FORCE ROW LEVEL SECURITY`, policy `business_scope`); `005_member_identity.sql` (adds `uploaded_by_member_id`, `deleted_by_member_id`); `006_visibility.sql` (policy `follows_task`); `apps/api/attachments.mjs` (`decodeAttachment`, `attachmentAction`).
- Tests: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes…”): the downloaded bytes equal the PNG uploaded, the display type is `image/png`, and a query under another Business returns no row. Run on 2026-10-01 by the author of this file: passed. The stored hash is compared with the bytes in the 0.3.1 production check (“independent HTTP downloads match both stored SHA-256 hashes”, [guest review](../../../history/zuri-go-guest-review/verification.md)); no committed test compares it.

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 2, bullet 6 (“byte hash”, “foreign-business denial”).
- Who may read a row follows the task’s visibility since 0.5.0 ([FR-011-008](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md)).
- `uploaded_by_member_id` and `deleted_by_member_id` came with 0.4.0 ([FEAT-006](../../FEAT-006-member-identity/feature.md)); the 0.3.1 spec lists neither.
