---
id: FR-002-024
title: Saving, backup and a reviewed restore never replace saved work silently
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-005, FEAT-011]
---

# FR-002-024 — Saving, backup and a reviewed restore never replace saved work silently

The system SHALL save the campaign workspace, SHALL provide a JSON backup and a restore that shows a review step first, SHALL NOT replace saved work silently or reset it when a build changes, and SHALL NOT present external execution, cloud synchronization or automated imports as working features of the campaign workspace.

## Acceptance criteria
- AC-002-024-01 — Given settings, a campaign selection, tasks, decisions and a release, then they survive a save, a reload and a backup.
- AC-002-024-02 — Given a backup file, when it is restored, then a review step shows what it holds and a malformed file is rejected before anything is replaced.
- AC-002-024-03 — Given a new build, then saved work is not reset.
- AC-002-024-04 — Given the campaign workspace, then no external execution, synchronization or automated data import is offered as working.

## Implementation
- `restoreWorkspace` in `apps/web/src/content/shared/model.mjs`; `doBackup`, `importBackup` and the “Backup JSON / Restore backup” controls in `apps/web/src/content/dashboard/DashboardContent.jsx`; the campaigns are saved to PostgreSQL through the workspace route (`saveLegacy` in `apps/api/workspace.mjs`) and, locally in a browser, to localStorage.
- Tests: `tests/campaign/model.test.mjs` (“valid local workspace round-trips; malformed backups rejected”). Browser: persistence across save, reload and backup ([verification](../verification.md), “Evidence”).

## Notes
- Spec trace ([spec.md](../spec.md)): §13, second and third paragraphs (AC-01 to AC-04). No AC label of §10.
- Since 0.2.0 the workspace is also kept in PostgreSQL ([FEAT-001](../../FEAT-001-business-overview/requirements/FR-001-018-persistence-integrity.md), [FEAT-006](../../FEAT-006-member-identity/feature.md)), so a Member’s save is a server write; the spec’s “local” wording describes the first release. Guests still read campaign records (PLAN-002 Q1); visibility levels for them are not decided ([FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md), Notes).
