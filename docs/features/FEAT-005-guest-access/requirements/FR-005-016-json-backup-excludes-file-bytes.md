---
id: FR-005-016
title: The JSON export carries no file bytes; the full PostgreSQL backup does
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-006-006]
---

# FR-005-016 — The JSON export carries no file bytes; the full PostgreSQL backup does

The system SHALL keep file bytes out of the v2 JSON workspace export, SHALL include them in the full PostgreSQL backup, and SHALL keep the local and the hosted databases separate.

## Acceptance criteria
- AC-005-016-01 — Given a workspace with attachments, when the legacy v2 workspace (`/workspace`) is read for export, then it holds no file bytes.
- AC-005-016-02 — Given `npm run backup`, then the private dump covers the whole `zuri_go` database, including `task_attachments` and its bytes.
- AC-005-016-03 — Given the local and the hosted databases, then neither is synchronized with the other.

## Implementation
- `apps/api/workspace.mjs:readLegacy` — builds the v2 shape from Members, tasks, weeks, meetings and campaigns and does not read `task_attachments`; `apps/api/backup-local.mjs` — `pg_dump` of the local database inside the container.
- Evidence: read from the code on 2026-10-01; no committed test asserts either half. The separation of the databases is stated in [AGENTS.md](../../../../AGENTS.md) (“Identity and data custody”) and in the 0.3.1 and 0.3.0 records. The hosted database was never dumped by this command.

## Notes
- Spec: [spec.md](../spec.md) “Evidence attachments” bullet 5.
- Restoring a backup over a PostgreSQL workspace is not supported from the screen ([FR-006-006](../../FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md)); no restore of attachments has been run.
