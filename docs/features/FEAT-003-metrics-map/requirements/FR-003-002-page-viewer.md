---
id: FR-003-002
title: The guide shows one page at a time with previous, next and a linkable hash
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-002 — The guide shows one page at a time with previous, next and a linkable hash

The guide SHALL show one page at a time once its viewer starts, with previous and next controls, a current-page indicator, selection from the table of contents and a URL hash for each page, and SHALL keep every page readable when script does not run.

## Acceptance criteria
- AC-003-002-01 — Given the viewer is started, then exactly one guide page is visible.
- AC-003-002-02 — Given the previous and next controls, the page indicator and a table-of-contents link, when each is used, then they select the same page as a direct link does.
- AC-003-002-03 — Given navigation inside the guide, then the URL hash is updated so that each page is linkable and a direct link opens that page.
- AC-003-002-04 — Given script that does not run, then all 18 pages remain readable in order.

## Implementation
- `scripts/metrics/build_metrics_map.py` (the one-page viewer and hash navigation); `scripts/metrics/verify_metrics_map_static.py` checks the viewer hooks (previous / next, hash navigation, all pages available).
- REV 03 and REV 04 browser checks of page navigation, direct links and exactly one visible guide page: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev03/browser-checks.json), [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json); production guide opened from the menu and by deep link ([FEAT-008 verification](../../FEAT-008-unified-site/verification.md), “Production”).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “REV 03 implementation”, “Implemented behavior” item 1 and “Acceptance and verification”, first bullet (AC-01 to AC-04). No AC label.
- The no-script reading of AC-04 is checked by the structure of the generated HTML (every page is a `section` in the document), not by a run without script.
