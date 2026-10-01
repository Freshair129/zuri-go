---
id: FR-009-003
title: The logo appears in the Business header, the campaign toolbar, the site navigation, the 18 guide mastheads and the graph header
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-002, FEAT-001, FEAT-003]
---

# FR-009-003 — The logo appears in the Business header, the campaign toolbar, the site navigation, the 18 guide mastheads and the graph header

The system SHALL show the Zuri-Go logo in the Business header (and the fallback shown while it cannot load), the campaign selector toolbar, the common site navigation, all 18 guide mastheads and the graph header.

## Acceptance criteria
- AC-009-003-01 — Given the Business Overview, then its header shows the logo, and so does the fallback shown when the workspace cannot load.
- AC-009-003-02 — Given the campaign selector toolbar, then it shows the logo.
- AC-009-003-03 — Given the site navigation, on the hosted site and in the guide, then it shows the logo.
- AC-009-003-04 — Given the metrics guide, then each of its 18 mastheads shows the logo.
- AC-009-003-05 — Given the Graph view, then its header shows the logo.

## Implementation
- `apps/web/src/content/business/BusinessWorkspace.jsx` (`<ZuriGoLogo/>` in `zg-header` and in the error fallback); `apps/web/src/content/dashboard/DashboardContent.jsx` (`<ZuriGoLogo compact/>` in `mc-campaign`); `apps/web/src/content/meeting/MeetingWorkspace.jsx` (`<ZuriGoLogo compact/>` in `mt-domain`); `scripts/metrics/build_metrics_map.py` (`logo()` in `SITE_NAV`, in each masthead, and in `mg-brandlock` of the graph header).
- Checked 2026-10-01 by the author of this file: `apps/metrics/index.html` holds 20 `class="zgo-logo` elements, which is 18 mastheads, the site navigation and the graph header (18 `class="mast"`, 2 compact), and no reference to a corporate wordmark. The 0.3.0 record states that Overview, navigation, campaign detail, all 18 guide mastheads and the graph branding use the source, verified on production ([cloud review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”). No committed test counts the placements; the metrics static audit of 18 pages ran for 0.3.0 and was not rerun for this record.

## Notes
- Spec: [spec.md](../spec.md) “Approved source and scope”, the bullet “Use in business header/fallback, campaign selector toolbar, common site navigation, all 18 guide masts and graph header.”
- The Meeting & Task Manager navigation (`mt-domain`) also shows the small mark; the spec’s “common site navigation” is read to include it.
