---
id: NFR-002-001
title: The campaign views are readable and fit desktop and phone
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-009]
---

# NFR-002-001 — The campaign views are readable and fit desktop and phone

The campaign views SHALL be readable at 14–16 px body text, SHALL not scroll sideways as a page at desktop and phone widths, and SHALL keep exact-value tables scrolling inside their own container.

## Measurement
- At 1440 px and 390 px wide, each of the five views has no page-level horizontal overflow.
- Body text is 14 to 16 px and no UI text is smaller than 11 px.
- A wide table of exact values scrolls inside its own container with a hint, and the whole page does not.
- The desktop opening viewport shows the current decision and phase; on a phone the order is decision, headline outcomes, trend, work.
- The result is recorded in the verification note of the release that changes a view.

## Implementation
- All five views at 1440 px and 390 px with no page overflow, mascot assets loaded and UI text at least 11 px ([verification](../verification.md), “Evidence”, “Brand QC”); 26 browser checks passed with 0 runtime page errors ([browser-results.json](../../../history/campaign-mission-control-review/browser-results.json)).

## Notes
- Spec trace ([spec.md](../spec.md)): §9, the bullets on the desktop opening viewport, mobile order and “readable 14–16 px body text” (the 11 px floor is the verification’s). §10 AC-18. Legacy label: AC-18 (part).
- The 14–16 px body text of the spec is not measured by a recorded check; the 0.2.0 record reports the 11 px minimum only.
