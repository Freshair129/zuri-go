---
id: FR-003-014
title: A 2D and a 3D graph that rotate, zoom and fit
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-014 — A 2D and a 3D graph that rotate, zoom and fit

The Graph View SHALL offer an accessible 2D / 3D switch, SHALL rotate by auto-orbit and by drag — a flat layout spun through 360° in 2D and a full 360° horizontal orbit with bounded vertical tilt in 3D, by pointer and touch — SHALL offer pause, zoom and fit, SHALL stop the auto-orbit under reduced motion, and SHALL draw each node as a shaded sphere whose name shows on hover or keyboard focus.

## Acceptance criteria
- AC-003-014-01 — Given the 2D / 3D switch, when it is changed, then the 40 nodes, the category filter, the search and the detail panel behave the same in both modes.
- AC-003-014-02 — Given a drag, then it completes a visible full 360° spin in 2D and a full 360° horizontal orbit in 3D, with the vertical tilt bounded, by mouse and by touch.
- AC-003-014-03 — Given the controls, then pause of the orbit, zoom and fit view work and the active node is clearly shown.
- AC-003-014-04 — Given a reduced-motion preference, then no automatic rotation runs.
- AC-003-014-05 — Given a node, then it is a sphere with light and shade, clearly visible on the textured stage, its name appears in a tooltip on hover and on keyboard focus, and no label stays around the node.

## Implementation
- The graph script in `scripts/metrics/build_metrics_map.py`; `scripts/metrics/verify_metrics_map_static.py` checks the 2D and 3D modes, the sphere nodes, the textured stage, hover and focus names and yaw normalization.
- REV 03 and REV 04 browser checks of 2D and 3D, the full-turn drag in both modes, zoom and fit, hover label and responsive widths: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev03/browser-checks.json), [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json); 2D/3D in the production browser ([FEAT-008 verification](../../FEAT-008-unified-site/verification.md), “ผลตรวจ” and “Production”).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “ข้อเสนอการทำงาน” items 3, 7, 11 and 12, “REV 03 implementation” items 2 and 3 and its “Acceptance and verification” (AC-01 to AC-05); “เกณฑ์รับงาน”, third and fourth bullets. No AC label.
- The 360° rotation was verified by static checks and by Playwright drags on the local build; the unified-site record says a 360° gesture was not measured on the production origin.
