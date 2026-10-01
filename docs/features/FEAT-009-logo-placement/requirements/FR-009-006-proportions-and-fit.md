---
id: FR-009-006
title: The logo and its tagline keep their proportions and fit desktop and mobile layouts
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-002]
---

# FR-009-006 — The logo and its tagline keep their proportions and fit desktop and mobile layouts

The system SHALL show the original logo and its tagline with the proportions of their source region and SHALL fit desktop and mobile layouts without overflowing the page.

## Acceptance criteria
- AC-009-006-01 — Given a placement, then its box keeps the aspect ratio of its region (334:120 or 326:80) at every width, and never exceeds its container (`max-width:100%`).
- AC-009-006-02 — Given the Overview and the guide at a 390 px viewport, then the page does not scroll horizontally.

## Implementation
- `apps/web/src/content/shared/zuri-go-logo.css` — `aspect-ratio`, `width` in `px` capped by `max-width:100%`, `flex-shrink:0`, and per-placement widths (`.mt-domain>.zgo-logo`, `.mc-campaign>.zgo-logo`, `.logo-pad>.zgo-logo`, `.mg-brandlock>.zgo-logo`).
- Evidence: the 0.3.0 record states that Overview and the guide at 390 px have 375 px content width with no page overflow, and that the screenshots were saved ([cloud review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”; `production-overview.png`, `production-mobile.png`, `guide-mobile.png`, `graph-mobile.png`). The 0.5.1 production check at 375 px as a Guest found no horizontal scroll ([0.5.1 verification](../../../releases/0.5.1/verification.md)). The record names page overflow, not the logo’s own fit at each placement; no committed test checks it.

## Notes
- Spec: [spec.md](../spec.md) “Acceptance and verification” item 2 (and the browser views and screenshots of item 4).
