---
id: FR-003-017
title: The graph is self-contained and shows no live data
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-017 — The graph is self-contained and shows no live data

The Graph View SHALL run without external scripts, a daemon, an API or outside data, fonts and images, SHALL read its terms from the guide cards, SHALL show hypothetical examples and no live performance, and SHALL show Zuri and น้องวางใจ with their names in the graph section.

## Acceptance criteria
- AC-003-017-01 — Given the Graph View, then it loads no Next.js or other external script, calls no daemon or API and uses no outside data, font or image.
- AC-003-017-02 — Given a term, then its definition is read from the guide card and its example is hypothetical; the graph shows no live performance data and makes no claim of a live source.
- AC-003-017-03 — Given the graph section, then it shows both mascots and both names, the dotted texture and the amber accent of the guide.

## Implementation
- The graph in `scripts/metrics/build_metrics_map.py` (embedded script, no external reference); `scripts/metrics/verify_metrics_map_static.py` checks that every local reference exists and that the graph shows both mascot names.
- The static audit found no missing local file; the REV 04 browser run recorded no console error and no failed network request ([static-checks.json](../../../history/campaign-01_metrics-map-review-rev04/static-checks.json), [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json)).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “หลักฐานและขอบเขต” bullet 3, “ข้อเสนอการทำงาน” item 8 and “เกณฑ์รับงาน”, sixth bullet (AC-01 to AC-03); “ความเสี่ยงและข้อจำกัด” (AC-02). No AC label.
- The page carries the site menu, whose links go to the app on the same origin; they are navigation, not data.
