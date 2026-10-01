---
id: FR-003-015
title: Search, category browse and a detail panel that explain each term
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-015 — Search, category browse and a detail panel that explain each term

The Graph View SHALL let a term be found by search and by category, SHALL open the same node’s details in a right-hand panel from a click, a search result or a category entry, SHALL fill that panel from the guide card of the term, SHALL export the embedded term data and refresh it from the guide, and SHALL change the panel into a drawer on a narrow screen.

## Acceptance criteria
- AC-003-015-01 — Given a click on a node, a search result or a category entry, then the detail panel of that same node opens on the right.
- AC-003-015-02 — Given the detail panel, then it shows the name, the full name, the description, the formula, the unit, a hypothetical example, how to read the result and a link back to the related guide page.
- AC-003-015-03 — Given the export button, then it downloads the embedded term data, and the refresh button re-reads the guide on the page and does not claim a live source.
- AC-003-015-04 — Given a narrow screen, then the panel is a drawer, and a keyboard or the buttons can select a node.
- AC-003-015-05 — Given the category list, then it selects the same node as the graph does, with the node count and the controls kept where the reference layout has them.

## Implementation
- The graph UI in `scripts/metrics/build_metrics_map.py`; `scripts/metrics/verify_metrics_map_static.py` checks the interaction hooks.
- Browser: search and detail of CTR, MQL, SQL, Media Spend, Revenue and Overstock SKU, category filter, export and refresh, at 1440 and 390 px: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev03/browser-checks.json), [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json); CTR detail in the production browser ([FEAT-008 verification](../../FEAT-008-unified-site/verification.md), “Production”).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “ข้อเสนอการทำงาน” items 4 to 7 and “เกณฑ์รับงาน”, second bullet (AC-01 to AC-05). No AC label.
