---
id: FR-005-012
title: A Guest lists and downloads evidence files; a Member uploads and removes them
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: [ADR-004]
  relates_to: [FEAT-005, FR-011-007, FR-011-008, FR-005-003]
---

# FR-005-012 — A Guest lists and downloads evidence files; a Member uploads and removes them

The system SHALL let a Guest list and download the evidence files of a task they may read, and SHALL require a signed-in Member to upload or remove a file; the task a Guest may read is decided by [FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) and [FR-011-008](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md).

## Acceptance criteria
- AC-005-012-01 — Given a task a Guest may read, when they list its files and download one, then both answer 200 with the file’s bytes.
- AC-005-012-02 — Given a task a Guest may not read, when they list or download its files by ID, then the answer is 404, the same as for a missing file.
- AC-005-012-03 — Given a Guest, when they upload or remove a file, then the answer is 401 and nothing changes.
- AC-005-012-04 — Given a signed-in Member, when they upload and then remove a file of a task they may read, then both succeed.

## Implementation
- `apps/api/attachments.mjs:attachmentAction` — the task must be readable by the viewer (`canRead`), else 404; `apps/api/api.mjs:handleApi` — `scopedTransaction` calls `authorizeWrite` for any method but GET.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes, follow their task visibility…”: a Guest gets 404 for a business task’s files, a Member downloads, a Guest PATCH answers 401, a Member PATCH answers 200; “guest write attempts…”). Run on 2026-10-01 by the author of this file: passed. No committed test reads the files of a public task as a Guest (AC-005-012-01); the 0.3.1 production check did so when every task was readable by Guests (“Reloaded in Guest and downloaded TXT”, [guest review](../../../history/zuri-go-guest-review/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 3 (the first and last sentences: “Guest may list/download evidence and view task details. Team login is required to upload/remove”).
- Amended by [FEAT-011](../../FEAT-011-visibility-and-confidential-meetings/feature.md): in 0.3.1 a Guest read every task’s files; since 2026-10-01 only those of public tasks (FR-011-007 AC-011-007-02). Production holds no public task, so a Guest reads no file there.
