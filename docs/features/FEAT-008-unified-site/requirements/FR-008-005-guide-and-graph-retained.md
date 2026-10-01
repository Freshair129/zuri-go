---
id: FR-008-005
title: The merge leaves the guide and the Graph View unchanged
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-003]
---

# FR-008-005 — The merge leaves the guide and the Graph View unchanged

The system SHALL keep the guide at 18 pages and the Graph View at 40 terms working after the merge — switch between 2D and 3D, rotation, zoom, background, search and the detail panel — and SHALL NOT change the layout of a node or an existing description.

## Acceptance criteria
- AC-008-005-01 — Given the merged site, then the guide has 18 pages and the graph 40 terms.
- AC-008-005-02 — Given the merged site, then the 2D/3D switch, rotation, zoom, background, search and detail panel work as specified in FR-003-014, FR-003-015 and FR-003-016.
- AC-008-005-03 — Given the merge, then the layout of a node and the existing descriptions are unchanged.

## Implementation
- `scripts/metrics/verify_metrics_map_static.py` (18 pages, 38 cards, 40 terms; run by `npm test` and `npm run build`).
- The Graph JavaScript, CSS and HTML and the guide CSS equalled the pre-merge copy byte for byte ([verification](../verification.md), “Version diff”, with [preserved-graph.json](../../../history/unified-site-review/preserved-graph.json)); production browser check of 2D/3D and the CTR detail ([verification](../verification.md), “Production”).

## Notes
- Spec trace ([spec.md](../spec.md)): “แหล่งอ้างอิงและผลกระทบ”, peer row for the Metrics Map (18 pages, 40 terms, 2D/3D, rotation, background, hover labels, panel) (AC-01, AC-02); “หน้าเว็บและเมนู”, last bullet (AC-03); US05. Legacy label: US05.
- The behaviors themselves belong to [FEAT-003](../../FEAT-003-metrics-map/feature.md): [FR-003-001](../../FEAT-003-metrics-map/requirements/FR-003-001-guide-structure.md), [FR-003-013](../../FEAT-003-metrics-map/requirements/FR-003-013-graph-terms-categories.md), [FR-003-014](../../FEAT-003-metrics-map/requirements/FR-003-014-graph-modes-rotation.md), [FR-003-015](../../FEAT-003-metrics-map/requirements/FR-003-015-graph-search-detail.md) and [FR-003-016](../../FEAT-003-metrics-map/requirements/FR-003-016-graph-backgrounds.md); this requirement only keeps them intact through the merge.
- Rotation was checked by static checks and the full-turn drag of REV 03/REV 04, not as a measured 360° gesture on the production origin (the verification says so).
