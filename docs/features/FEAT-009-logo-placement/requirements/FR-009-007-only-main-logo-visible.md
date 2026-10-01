---
id: FR-009-007
title: Only the Main Logo artwork is visible; the rest of the brand sheet is clipped
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-002]
---

# FR-009-007 — Only the Main Logo artwork is visible; the rest of the brand sheet is clipped

The system SHALL show only the Main Logo artwork of the brand sheet and SHALL clip the surrounding brand-sheet labels and illustrations outside the viewport.

## Acceptance criteria
- AC-009-007-01 — Given a placement, then the viewport hides everything of the sheet outside the region of FR-009-002 (`overflow:hidden`, the image positioned by percentages inside it).
- AC-009-007-02 — Given a placement on screen, then no label or illustration of the sheet is visible beside the logo.

## Implementation
- `apps/web/src/content/shared/zuri-go-logo.css` — `.zgo-logo{position:relative;overflow:hidden;isolation:isolate}` and the image `position:absolute` with the offsets of FR-009-002.
- Evidence: the archived production screenshot of 2026-09-30 shows the business header and the navigation mark with the wordmark only ([production-overview.png](../../../history/zuri-go-cloud-review/production-overview.png)); the 0.3.0 record states “CSS displays the Main Logo panel” ([cloud review](../../../history/zuri-go-cloud-review/verification.md)). The guide mastheads and the graph header were not viewed for this record; no committed test checks it.

## Notes
- Spec: [spec.md](../spec.md) “Acceptance and verification” item 3.
