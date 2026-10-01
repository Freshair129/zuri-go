---
id: FR-008-002
title: Four routes and deep links that survive a reload
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-003]
---

# FR-008-002 — Four routes and deep links that survive a reload

The system SHALL serve the four sections at `/?view=1&tab=overview`, `/?view=1&tab=meeting-task-manager`, `/metrics/#overview` and `/metrics/#metrics-graph`, SHALL keep the existing tab query links and the guide category links working, and SHALL load every asset and snapshot of a section reached directly or after a reload.

## Acceptance criteria
- AC-008-002-01 — Given each of the four routes, when it is opened directly and when the page is reloaded, then the section opens.
- AC-008-002-02 — Given an existing tab query link of Mission Control, when it is opened, then it still opens that tab.
- AC-008-002-03 — Given a guide category link such as `/metrics/#consideration` or `/metrics/#conversion`, when it is opened, then the related page opens.
- AC-008-002-04 — Given any section opened directly, then its assets and snapshot load and none answers 404.

## Implementation
- Routes and tabs: `apps/web/src/content/meeting/MeetingWorkspace.jsx` (`shell.exploreDashboard(...)`), the guide hash pages built by `scripts/metrics/build_metrics_map.py`.
- Static serving: `apps/api/test/http.test.mjs` (“static site serves guide and graph without exposing private files”). Production: all payload files answered 200 with matching SHA-256 ([unified-site-review](../../../history/unified-site-review/production-http-checks.json)); the four URLs were opened ([verification](../verification.md), “Production”).

## Notes
- Spec trace ([spec.md](../spec.md)): “หน้าเว็บและเมนู” table (AC-01) and its first two bullets (AC-02, AC-03); US02 (AC-01, AC-04). Legacy label: US02.
- The Business Overview and the tabs it adds (`tab=campaign-overview`, `tab=content`, `tab=goals`) are specified in [FEAT-001](../../FEAT-001-business-overview/feature.md).
