---
id: FR-008-004
title: Saved work survives navigation and reload; backup and restore stay usable
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-004, FEAT-006, ARCH-003]
---

# FR-008-004 — Saved work survives navigation and reload; backup and restore stay usable

The system SHALL keep the tasks and Members that have been saved after the user moves to the guide and back and after a reload, SHALL keep Backup and Restore (version 2) usable, and SHALL NOT claim that a deployment moves data a browser stores for another origin.

## Acceptance criteria
- AC-008-004-01 — Given saved tasks and Members, when the user goes to the guide and returns, then they are still shown.
- AC-008-004-02 — Given saved tasks and Members, when the page is reloaded, then they are still shown.
- AC-008-004-03 — Given a backup made in Backup JSON format version 2, when it is restored after review, then it is accepted.
- AC-008-004-04 — Given data kept in the browser storage of one origin, when the production origin is opened, then it holds none of it until a backup is restored with Backup JSON → Restore backup; the deployment itself moves no data.

## Implementation
- Local mode: `apps/web/src/content/meeting/repository.mjs` (IndexedDB), the combined backup (`schemaVersion:2`, `restoreBoth`) in `apps/web/src/content/meeting/MeetingWorkspace.jsx`, and `restoreWorkspace` in `apps/web/src/content/shared/model.mjs`; tests `apps/web/src/content/meeting/model.test.mjs` (backup validation) and `tests/campaign/model.test.mjs` (“valid local workspace round-trips; malformed backups rejected”).
- Browser check that the 5 tasks and 4 Members were still there after the guide and back: [verification](../verification.md), “ผลตรวจ”. Backup/Restore through the UI was not re-run in that round (stated there).

## Notes
- Spec trace ([spec.md](../spec.md)): “ข้อมูลและการย้ายไป URL จริง”, third bullet (AC-04); US04 (AC-01, AC-02, AC-03). Legacy label: US04.
- Superseded in part by later approved work: since 0.3.0 the hosted site keeps the workspace in PostgreSQL ([ARCH-003](../../../architecture/ARCH-003-hosted-deployment.md), [FEAT-006](../../FEAT-006-member-identity/feature.md)), so the spec’s “no shared database or login” and “Members are a browser register” no longer describe production. AC-01 and AC-02 hold against the server workspace too; AC-04 describes browser-stored (local) data only.
