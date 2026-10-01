---
id: FR-003-018
title: The guide prints as 18 sheets with both mascots, and nothing interactive
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-018 — The guide prints as 18 sheets with both mascots, and nothing interactive

The guide SHALL print every one of its 18 pages in order, one page to a printed A4 sheet with its page number and both mascots, without cutting content or shrinking text unreadably, and SHALL hide the graph, the viewer controls and the site menu in print.

## Acceptance criteria
- AC-003-018-01 — Given the guide is printed, then all 18 pages come out in order, one per sheet, and no content is cut.
- AC-003-018-02 — Given a printed sheet, then it shows its page number and both mascots with their names, and a long topic continues on a next sheet that also carries the pair.
- AC-003-018-03 — Given the graph, the viewer controls and the site menu, then none appears in print.
- AC-003-018-04 — Given a printed page, then the text is not shrunk below a readable size.

## Implementation
- Print CSS in `scripts/metrics/build_metrics_map.py` (`@media print`); `scripts/metrics/verify_metrics_map_static.py` checks that all pages stay available for print.
- REV 04 print render: 18 pages, each with zuri, น้องวางใจ, the folio and the paired image; pages 05, 10 and 17 checked by eye ([print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json), [spec-graph.md](../spec-graph.md) “REV 04 verification record”). The unified-site record checked the print CSS and did not render a new PDF ([FEAT-008 verification](../../FEAT-008-unified-site/verification.md), “ผลตรวจ”).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §14, the “Print” bullet and §15 AC-10 (AC-01, AC-02, AC-04); [spec-graph.md](../spec-graph.md) “REV 03 implementation”, “Implemented behavior” item 6 (AC-01, AC-03). Legacy label: AC-10 of [spec-content.md](../spec-content.md) §15.
- The print stylesheet sets `@page{size:A4 portrait}` with a 10 mm margin (5 mm for the compact sheets).
