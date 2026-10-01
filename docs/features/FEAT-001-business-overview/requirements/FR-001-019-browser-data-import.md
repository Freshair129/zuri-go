---
id: FR-001-019
title: Existing browser data is imported only after a preview that checks counts and totals
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-004, FEAT-008, ARCH-002]
---

# FR-001-019 — Existing browser data is imported only after a preview that checks counts and totals

The system SHALL import the data of the browser (campaigns, tasks, Members, RACI, MoSCoW and FUNG evidence) into the Business only after a preview that the user confirms and after counts and totals are checked, SHALL leave the browser originals untouched, and SHALL keep earlier data readable.

## Acceptance criteria
- AC-001-019-01 — Given browser data, when the user opens the import, then a preview lists the campaigns, tasks, Members and meetings it holds and nothing is imported yet.
- AC-001-019-02 — Given a confirmed import, then the counts and sums before and after are checked and the browser data is still there.
- AC-001-019-03 — Given earlier data with RACI, MoSCoW and FUNG evidence, then it is still readable after the move to the server.
- AC-001-019-04 — Given the same import is sent again, then no duplicate is created.

## Implementation
- `importPreview` and `importCommit` in `apps/api/workspace.mjs`; the import screen “ตรวจข้อมูลเดิมก่อนนำเข้า PostgreSQL” in `apps/web/src/content/business/BusinessWorkspace.jsx`; tables `migration_batches` and `migration_keys`.
- Test: `apps/api/test/database.test.mjs` (“legacy preview/import/retry preserves campaign totals, task identity, RACI, MoSCoW and meeting evidence”). Preview of 1 campaign, 6 tasks, 4 Members and 0 meetings ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”); import of 1 campaign, 11 tasks and 4 Members into the local and hosted databases with reconciliation ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “State and persistence”).

## Notes
- Spec trace ([spec.md](../spec.md)): §3 [ASSUMPTIONS] item 6 (AC-01, AC-02); ZGO-09 (AC-02, AC-03); §1 bullet 7 (AC-03). Legacy label: ZGO-09.
- The import was an explicit user action on each of the two databases; it is not repeated by a release.
