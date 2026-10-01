---
id: FR-003-012
title: The guide follows the brand tokens, fonts, wordmark and tone
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-009]
---

# FR-003-012 — The guide follows the brand tokens, fonts, wordmark and tone

The guide SHALL use the brand tokens and the Manrope, IBM Plex Sans Thai and IBM Plex Mono fonts, an original outlined SVG wordmark with its clear space on a white plate at least 110 px wide, a dotted texture on every page with amber as a signal, Thai prose with English metric names, and SHALL add no new tagline or capability claim.

## Acceptance criteria
- AC-003-012-01 — Given the guide, then the amber is exactly `#E8820C` and the ink `#1F2937` in the interface, with no color sampled from an image and no brand gradient, glow or shadow.
- AC-003-012-02 — Given the headings, labels and body, then they use the three bundled fonts, with Manrope for English headings and IBM Plex Sans Thai for Thai text.
- AC-003-012-03 — Given the wordmark, then it is an original outlined SVG with no live text, at least 110 px wide, with the clear space of the cap height, on a white plate that keeps its contrast in the dark theme.
- AC-003-012-04 — Given each page, then the dot field is visible, white cards keep the reading surfaces clear and amber marks section labels, formulas, page numbers and actions.
- AC-003-012-05 — Given the copy, then prose reads in Thai with metric and framework names in English, `zuri` in prose and the wordmark ZURI; newly written marketing text is proposed copy and no new tagline or capability claim is added.

## Implementation
- `scripts/metrics/build_metrics_map.py` (CSS tokens and fonts) and `apps/web/src/content/assets/` (font files and licenses).
- REV 02 brand checklist review: [qc.md](../qc.md), “Full image-checklist review” (PASS with two stated limitations); fonts bundled and no network request failed ([qc.md](../qc.md), “Verification issues resolved”).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §14, the requirement list (AC-01 to AC-05); §15 AC-11 (all) (Legacy label: AC-11 of [spec-content.md](../spec-content.md) §15); [brief.md](../brief.md), “Visual direction”.
- Since 0.2.1 the masthead of the guide and the graph use the Zuri-Go main logo asset unchanged, not the ZURI outlined wordmark of the spec ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”; [FEAT-009](../../FEAT-009-logo-placement/feature.md)). AC-03 therefore describes the spec’s wordmark; for the current logo FEAT-009 governs and its clear-space and size rules replace this one. Recorded for the owner.
