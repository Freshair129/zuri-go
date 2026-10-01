---
id: FR-003-016
title: Three approved backgrounds for the graph stage only
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-016 — Three approved backgrounds for the graph stage only

The Graph View SHALL offer three approved background presets — the dark `#12161C`, the canvas `#F7F8FA` and the warm `#FFF8F0` — through a labelled selector, SHALL apply them to the graph stage only, and SHALL keep the dots visible, the labels readable and the node category colors unchanged in every preset.

## Acceptance criteria
- AC-003-016-01 — Given the selector, then it offers exactly the three presets and no free color picker.
- AC-003-016-02 — Given a preset, then it changes the stage background and the dot contrast of the graph only; the guide pages and the node category colors are not recolored.
- AC-003-016-03 — Given each preset, then the dotted texture stays visible and the labels and the spherical nodes stay readable.

## Implementation
- The graph stage presets in `scripts/metrics/build_metrics_map.py`; `scripts/metrics/verify_metrics_map_static.py` lists the presets `dark`, `canvas` and `warm`.
- REV 03 and REV 04 browser checks of the three textured backgrounds ([graph-warm.png](../../../history/campaign-01_metrics-map-review-rev03/graph-warm.png), [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json)).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “REV 03 implementation”, [ASSUMPTIONS] item 4 and “Implemented behavior” item 4 (AC-01 to AC-03). No AC label.
