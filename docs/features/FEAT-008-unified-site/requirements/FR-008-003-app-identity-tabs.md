---
id: FR-008-003
title: The existing app identity keeps Marketing and the Task Manager working
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-002, FEAT-004]
---

# FR-008-003 — The existing app identity keeps Marketing and the Task Manager working

The system SHALL keep the existing Data App ID, reference data and storage namespace, and SHALL keep the Marketing tabs and the Meeting & Task Manager working under that ID.

## Acceptance criteria
- AC-008-003-01 — Given the unified site, then the packaged Data App has the app ID `dashboard:354c0a91-d04c-431c-9fe5-06bc3f703be1`.
- AC-008-003-02 — Given the Marketing tabs and the Meeting & Task Manager, when they are used on the unified site, then they work through that same app ID.
- AC-008-003-03 — Given the unified site is served in preview, then it is served from the origin `http://127.0.0.1:4319` used before, so that data entered there stays readable.

## Implementation
- `scripts/site/build_unified_site.py` (`APP_ID`; `app_files` refuses a snapshot with another ID).
- Build and browser checks of the five Marketing tabs and Meeting: [verification](../verification.md), “ผลตรวจ”. The identity is also protected by `apps/web/protected-runtime.json` (see [FR-008-008](FR-008-008-protected-runtime.md)).

## Notes
- Spec trace ([spec.md](../spec.md)): “หน้าเว็บและเมนู” and “ข้อมูลและการย้ายไป URL จริง”, first two bullets (AC-01, AC-03); US03 (AC-02). Legacy label: US03.
- The “five Marketing tabs” of the spec are the tabs of the Business Overview and campaign context since [FEAT-001](../../FEAT-001-business-overview/feature.md).
