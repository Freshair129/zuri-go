---
id: FR-003-013
title: The graph holds 40 unique terms in three groups
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-013 — The graph holds 40 unique terms in three groups

The Graph View SHALL show 40 unique terms — the 38 metric cards and MQL and SQL — each with a category and a reference page, in three groups: Acquisition (10), Lead & Conversion (10) and Revenue & Operations (20).

## Acceptance criteria
- AC-003-013-01 — Given the graph, then it shows 40 nodes, none repeated, one for each guide card and for MQL and SQL.
- AC-003-013-02 — Given a node, then it has its term name, its category and its reference page of the guide.
- AC-003-013-03 — Given the groups, then the counts are Acquisition 10, Lead & Conversion 10 and Revenue & Operations 20, and the nodes of a group are spread around its centroid and radius.
- AC-003-013-04 — Given the node data, then no benchmark or result is made up: each term holds only what its guide card says.

## Implementation
- The graph builder in `scripts/metrics/build_metrics_map.py` (nodes from the metric cards); `scripts/metrics/verify_metrics_map_static.py` checks 40 terms and the category counts 10/10/20.
- Static audit with category counts 10/10/20 and mascot names in the graph ([static-checks.json](../../../migrations/verification/metrics/static-checks.json), [static-checks.json](../../../history/campaign-01_metrics-map-review-rev04/static-checks.json)); production Graph View opened ([FEAT-008 verification](../../FEAT-008-unified-site/verification.md), “Production”).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “ข้อเสนอการทำงาน” items 2 and 3 (AC-01 to AC-04); “เกณฑ์รับงาน”, first bullet (AC-01, AC-02); “REV 04 acceptance and verification”, second bullet (AC-03). No AC label.
