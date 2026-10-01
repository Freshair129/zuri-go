---
id: FR-001-003
title: Tabs, deep links and card drill-downs
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-002, FEAT-008, PRD-001]
---

# FR-001-003 — Tabs, deep links and card drill-downs

The system SHALL offer the tabs ภาพรวมธุรกิจ, แคมเปญ, คอนเทนต์, เป้าหมาย, งานและประชุม and เรียนรู้ / Graph, SHALL open each by its link, SHALL keep the campaign views and their existing deep links working in the campaign context, and SHALL open from a card a list that uses the same filter as the number on the card.

## Acceptance criteria
- AC-001-003-01 — Given the app, then the tabs listed above are offered, and `tab=content`, `tab=goals`, `tab=meeting-task-manager` and `/metrics/` open their sections.
- AC-001-003-02 — Given `tab=campaign-overview&campaign=<id>`, then the Overview of that campaign opens; it is the Overview moved from the previous app.
- AC-001-003-03 — Given Performance, Plan & Gates, Workboard and Review & Decisions, then they stay in the campaign context and their earlier deep links still open, falling back to the selected campaign.
- AC-001-003-04 — Given a card of the Business Overview, when its drill-down is followed, then the list opens with the same filter as the card’s number.

## Implementation
- `TABS` in `apps/web/src/content/meeting/MeetingWorkspace.jsx` (ids `overview`, `campaigns`, `content`, `goals`, `campaign-overview`, `performance`, `plan`, `work`, `review`, `meeting-task-manager`); `go(tab, filter)` in `apps/web/src/content/business/BusinessWorkspace.jsx`.
- The Business card drill-down selected the active filter and the campaign detail loaded the selected campaign ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”).

## Notes
- Spec trace ([spec.md](../spec.md)): §4, the tab line and the route list (AC-01 to AC-03) and the last paragraph (“ลิงก์เจาะจาก card เปิดรายการที่ใช้ตัวกรองเดียวกับตัวเลขบน card”) (AC-04). No ZGO label.
- The product-wide navigation is indexed in [PRD-001](../../../product/PRD-001-zuri-go.md). The Workboard of the campaign context is a view of the task records since [FR-010-013](../../FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md).
