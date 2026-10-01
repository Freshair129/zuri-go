---
id: FR-001-021
title: The Overview follows the brand tokens and places the two mascots by role
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-009]
---

# FR-001-021 — The Overview follows the brand tokens and places the two mascots by role

The system SHALL use the brand colors `#E8820C`, `#1F2937`, `#FFF8F0` and `#F7F8FA`, Manrope for headings, IBM Plex Sans Thai for text and tabular figures for numbers, SHALL keep a thin dotted texture with amber on calls to action and key states, and SHALL show Zuri near the summary and น้องวางใจ near the data-quality and attention areas, with both on every logical page and not always in one pose.

## Acceptance criteria
- AC-001-021-01 — Given the Overview, then its colors come from the brand tokens and are not sampled from an image.
- AC-001-021-02 — Given the Overview, then headings use Manrope, text IBM Plex Sans Thai and numbers tabular figures.
- AC-001-021-03 — Given a logical page, then it shows both mascots; Zuri sits by the summary and น้องวางใจ by the signals to watch, and the pose and the corner differ between pages.
- AC-001-021-04 — Given the product lockup, then no low-resolution crop of the attached image is used and no new lockup is drawn; the corporate wordmark in its asset is unchanged.

## Implementation
- Tokens in `apps/web/src/content/business/business.css` (`--text:#1f2937`, `--surface:#f7f8fa`, `--control-hover:#fff8f0`); fonts in `apps/web/src/content/assets/`; mascot images in `BusinessWorkspace.jsx` (`pairAnalysis`, `pairChart`, `pairClipboard`).
- Desktop and mobile fixture screenshots and the brand review ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Visual / brand review”). The tabular figures are set for the campaign tables (`font-variant-numeric` in `dashboard/example.css`); the Overview stylesheet sets none of its own.

## Notes
- Spec trace ([spec.md](../spec.md)): §10 bullets 3 to 6 (AC-01 to AC-04); §1 bullet 8. No ZGO label.
- Logo and wordmark placement is [FEAT-009](../../FEAT-009-logo-placement/feature.md). No automatic check measures the tokens; the brand review is a manual one. Gap: the tabular figures of AC-02 are set for the campaign tables only. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
