---
id: FR-002-025
title: The campaign views follow the brand and the interaction rules
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-009, FEAT-001]
---

# FR-002-025 — The campaign views follow the brand and the interaction rules

The system SHALL follow the brand tokens, dotted texture, wordmark and fonts of the spec, SHALL show Zuri explaining the review and น้องวางใจ raising a check on every logical view without obstructing a table or shrinking mobile content, SHALL make the calls to action state what they do — view evidence, create task, record decision, execute an authorized change — without pretending to change an ad platform, and SHALL show empty, loading, stale and no-match states distinctly.

## Acceptance criteria
- AC-002-025-01 — Given any campaign view, then it uses the canvas `#F7F8FA`, white cards, ink `#1F2937` and amber `#E8820C` for the main action, semantic colors only for states and no amber flood.
- AC-002-025-02 — Given the canvas, then it shows a subtle dot texture with clear reading surfaces and contrast, the outlined wordmark, Manrope, IBM Plex Sans Thai and IBM Plex Mono.
- AC-002-025-03 — Given a desktop and a mobile render of a review, then both mascots, the texture, readable values, the focus, the detail navigation and the scoped table scrolling work.
- AC-002-025-04 — Given a call to action, then it says whether it views evidence, creates a task, records a decision or executes an authorized change, and none pretends to change an ad platform in a read-only implementation.
- AC-002-025-05 — Given a view with no data, loading, stale data or no match, then each state is distinct and keyboard focus and status text accompany any color.

## Implementation
- `apps/web/src/content/dashboard/DashboardContent.jsx`, `apps/web/src/content/dashboard/Views.jsx`, `dashboard.css`, `example.css`; the existing outlined wordmark and mascot assets in `apps/web/src/content/assets/`.
- Brand QC of the authored interface and the desktop and mobile renders of all five views ([verification](../verification.md), “Brand QC”, “Evidence”; [1440-1.png](../../../history/campaign-mission-control-review/1440-1.png), [390-1.png](../../../history/campaign-mission-control-review/390-1.png)); AC-18 was a browser check of 0.2.0, not a unit test, and the labels of the calls to action (AC-04) were not re-checked against the current screens.

## Notes
- Spec trace ([spec.md](../spec.md)): §9, bullets 1 to 4, 7 and 8 and the last bullet (AC-01 to AC-05); §10 AC-18 (AC-03). Legacy label: AC-18.
- The logo and the wordmark follow [FEAT-009](../../FEAT-009-logo-placement/feature.md) since 0.2.1. The mobile and desktop measures are in [NFR-002-001](NFR-002-001-responsive-readable.md).
