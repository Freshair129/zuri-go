---
id: FR-008-006
title: The site menu is hidden in print and no reviewed metric changes
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-003]
---

# FR-008-006 — The site menu is hidden in print and no reviewed metric changes

The system SHALL hide the site menu when the guide is printed while keeping every guide page in the printout, and SHALL NOT change a reviewed metric, a KPI definition or a metric formula, nor assume actual data.

## Acceptance criteria
- AC-008-006-01 — Given the guide is printed, then the site menu does not appear.
- AC-008-006-02 — Given the guide is printed, then every guide page is still in the printout.
- AC-008-006-03 — Given the merge, then no reviewed metric, KPI definition or metric formula has changed and no actual data has been assumed.

## Implementation
- `@media print{.site-nav{display:none!important}}` in `scripts/metrics/build_metrics_map.py`.
- The print CSS was checked to hide the menu and keep all guide pages; a PDF was not rendered again in that round ([verification](../verification.md), “ผลตรวจ”, row “Print”). The 18-page print of REV 04 is [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace ([spec.md](../spec.md)): “หน้าเว็บและเมนู”, last-but-one bullet and the paragraph before the table (“ไม่เปลี่ยนนิยาม KPI”) (AC-01, AC-03); US07 (AC-02). Legacy label: US07.
- Print behavior of the guide itself is [FR-003-018](../../FEAT-003-metrics-map/requirements/FR-003-018-print-output.md).
