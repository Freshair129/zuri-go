---
id: NFR-003-001
title: The guide and the graph fit a phone and a desktop in both themes
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# NFR-003-001 — The guide and the graph fit a phone and a desktop in both themes

The guide and the graph SHALL show without overlapping text or a missing image at 1440 px and 390 px wide, in the light and the dark theme, SHALL NOT scroll sideways as a page, and SHALL keep wide tables readable by scrolling inside their own container.

## Measurement
- At 1440 px and 390 px, in light and dark, no guide page and no graph view has a horizontal document overflow, a missing local file or a missing anchor.
- The smallest text shown on screen is at least 11 px.
- A wide table (the RACI and the Budget) scrolls inside its own container, which can be reached with the keyboard and carries a Thai scroll hint; the whole page does not scroll sideways.
- The result is recorded with the release evidence.

## Implementation
- REV 04 browser run at 1440 and 390 px in light and dark: no overflow, no console error, no failed request ([browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json)); the RACI region scrolled to 290 of 290 px and is keyboard-focusable ([qc.md](../qc.md), “Acceptance results — REV 02 baseline”); production guide at 390 px ([mobile-guide.png](../../../history/unified-site-review/mobile-guide.png)).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §14, “Responsive” bullet; §15 AC-09; [spec-graph.md](../spec-graph.md) “REV 03 … Acceptance” (“no horizontal overflow on mobile”). Legacy label: AC-09 of [spec-content.md](../spec-content.md) §15.
- An NFR carries a measurement, not AC IDs (STD-002 R1). The 11 px minimum comes from the QC record; the spec sets none.
