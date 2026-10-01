---
id: FR-009-005
title: The logo has an accessible Zuri-Go label, with the tagline on a full lockup
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-002]
---

# FR-009-005 — The logo has an accessible Zuri-Go label, with the tagline on a full lockup

The system SHALL give every logo placement an accessible Zuri-Go label, and SHALL include the tagline in the accessible name of a full lockup.

## Acceptance criteria
- AC-009-005-01 — Given a full lockup, then its accessible name is “Zuri-Go — Let’s Go to Market. Together.”.
- AC-009-005-02 — Given a small navigation mark, then its accessible name is “Zuri-Go”.
- AC-009-005-03 — Given the image inside a placement, then it is hidden from assistive technology (`alt=""`, `aria-hidden`) so that the label is read once.

## Implementation
- `apps/web/src/content/shared/ZuriGoLogo.jsx` — `role="img"` and `aria-label={compact?'Zuri-Go':'Zuri-Go — Let’s Go to Market. Together.'}`, inner `<img alt="" aria-hidden="true">`; `scripts/metrics/build_metrics_map.py:logo` — the same label and attributes.
- Checked 2026-10-01 by the author of this file by reading both sources; no accessibility test or browser check was run for this record, and none is recorded for 0.3.0.

## Notes
- Spec: [spec.md](../spec.md) “Approved source and scope”, the bullet “Keep an accessible Zuri-Go label. Full lockups include the tagline in the accessible name.”
- The tagline text is the brand’s (“Let’s Go to Market. Together.”); this requirement does not set it.
