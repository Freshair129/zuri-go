---
id: NFR-001-001
title: The Overview works on a phone, with a keyboard and with enough contrast
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-009]
---

# NFR-001-001 — The Overview works on a phone, with a keyboard and with enough contrast

The Business Overview SHALL be usable on a phone and with a keyboard, with readable contrast and both mascots present, and SHALL NOT make the whole page scroll sideways.

## Measurement
- At a 390 px wide viewport (375 CSS px of content), the Overview and the content calendar have `scrollWidth` equal to `clientWidth`.
- On desktop the Overview shows four summary cards and two goal columns; on a phone the cards are 2 × 2 and the order is goals, summary, action queue, calendar.
- Every control can be reached and operated with the keyboard, and the focus is visible.
- The text and the buttons meet the contrast of the brand tokens in the visual check.
- Both mascots are visible on the page and the Campaign gates, the guide and the graph pass their regression checks.
- The result is recorded with the release evidence.

## Implementation
- Mobile viewport 390 × 844 checked for the Overview and the content calendar, with the mascots loaded ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”; [overview-qa-mobile.png](../../../history/zuri-go-review/overview-qa-mobile.png), [content-qa-mobile.png](../../../history/zuri-go-review/content-qa-mobile.png)); production overview and guide at 390 px with no page overflow ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”).

## Notes
- Spec trace ([spec.md](../spec.md)): §5, the paragraph after the sketch (layout on desktop and mobile); ZGO-10. Legacy label: ZGO-10.
- The keyboard and contrast checks were reported as a visual check in the 0.2.0 record, without a measured contrast ratio; the spec sets none.
