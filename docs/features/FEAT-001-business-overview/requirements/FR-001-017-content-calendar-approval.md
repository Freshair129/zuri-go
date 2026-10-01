---
id: FR-001-017
title: The content calendar and approval queue are the source of the content figures
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-002, ARCH-002]
---

# FR-001-017 — The content calendar and approval queue are the source of the content figures

The system SHALL keep a content list and calendar with an approval status and a scheduled time for each publication as the source of the content figures, SHALL let a schedule be saved as a plan, and SHALL NOT claim that the system posted to a social network.

## Acceptance criteria
- AC-001-017-01 — Given a content item, then it has an approval status and, for each channel, a publication with a status and a time.
- AC-001-017-02 — Given the content figures of the Overview, then they come from the content items and publications and not from numbers typed on the dashboard.
- AC-001-017-03 — Given the button that schedules a publication, when it is used, then a plan is saved and the screen says the table is a plan and the system does not post by itself.

## Implementation
- `save` (resources `content` and `publications`) in `apps/api/service.mjs`; tables `content_items`, `publications` in `apps/api/migrations/001_core.sql`; the weekly table and calendar in `apps/web/src/content/business/BusinessWorkspace.jsx` (“ตารางนี้เป็นแผน ระบบไม่โพสต์ลง social อัตโนมัติ”).
- Tests: `apps/api/test/database.test.mjs` (publication evidence and correction version conflicts). Browser: new content persisted after reload; the seven-day calendar at 375 px ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”).

## Notes
- Spec trace ([spec.md](../spec.md)): §9 item 1 and the closing sentence of §9 (AC-01, AC-02); §3 [ASSUMPTIONS] item 4 (AC-03); §12 version-diff row “Content items + publications + approvals + schedule” (AC-01); the content item is approved before it is scheduled (the re-check after an edit of approved content, `save` in `apps/api/service.mjs`, is the code’s and not a spec clause).
- Whether the content calendar becomes a feature of its own is open in [PLAN-001](../../../governance/plans/PLAN-001-document-standard-adoption.md) WI-14.
