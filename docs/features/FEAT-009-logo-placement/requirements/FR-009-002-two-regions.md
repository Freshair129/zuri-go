---
id: FR-009-002
title: The logo is shown as a full lockup or as a small navigation mark
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-001]
---

# FR-009-002 — The logo is shown as a full lockup or as a small navigation mark

The system SHALL show the logo as one of two regions of the brand sheet: the full lockup, the source rectangle x=45, y=438, width=334, height=120 with its original tagline, or the small navigation mark, the source rectangle x=48, y=447, width=326, height=80, which holds the same complete wordmark without a tiny tagline.

## Acceptance criteria
- AC-009-002-01 — Given the full lockup, then its viewport shows the rectangle (45, 438, 334 × 120) of the 1448 × 1086 sheet and the tagline is visible.
- AC-009-002-02 — Given the small navigation mark, then its viewport shows the rectangle (48, 447, 326 × 80) and the complete wordmark is visible without a tagline.

## Implementation
- `apps/web/src/content/shared/zuri-go-logo.css` — `.zgo-logo` has `aspect-ratio:334/120` and `span.zgo-logo>img{width:433.532934%;left:-13.473054%;top:-365%}` (1448/334, 45/334, 438/120); `.zgo-logo--compact` has `aspect-ratio:326/80` and `width:444.171779%;left:-14.723926%;top:-558.75%` (1448/326, 48/326, 447/80). `ZuriGoLogo` takes `compact`.
- Checked 2026-10-01 by the author of this file: the percentages above equal the ratios of the two rectangles to the 1448 × 1086 sheet (the sheet size was read from the PNG header). The archived production screenshot of 2026-09-30 shows the full lockup with its tagline in the business header and the small mark in the navigation ([production-overview.png](../../../history/zuri-go-cloud-review/production-overview.png)); no committed test checks the viewport.

## Notes
- Spec: [spec.md](../spec.md) “Approved source and scope”, the bullets “Full lockup: source rectangle…” and “Small navigation placements: source rectangle…”.
- Which placement uses which region is in [FR-009-003](FR-009-003-placements.md); the spec says only that the small region is for “small navigation placements”.
