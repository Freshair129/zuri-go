---
id: FR-009-001
title: The logo is rendered from the unchanged bytes of the approved brand sheet
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FEAT-001]
---

# FR-009-001 — The logo is rendered from the unchanged bytes of the approved brand sheet

The system SHALL render the Zuri-Go logo from the unchanged image bytes of the approved brand sheet `assets/logos/zuri-go/download.png`, using a CSS viewport for display only, SHALL NOT redraw, recolour, stretch or regenerate the artwork, and SHALL keep the source and its byte-identical copies.

## Acceptance criteria
- AC-009-001-01 — Given the approved source, then the copy used by the application (`apps/web/src/content/assets/zuri-go-brand-sheet.png`) and the copy used by the guide (`apps/metrics/assets/logos/zuri-go-brand-sheet.png`) have the same SHA-256 as the source, `e29d1b6a161c87728671ea94575fa84680ac7a311ed9d6afa54556623b9460d8`.
- AC-009-001-02 — Given a placement, then the artwork is the whole brand-sheet image shown through a CSS viewport that crops and scales it, with no filter and no redrawn, recoloured or stretched artwork.
- AC-009-001-03 — Given a rebuild of the guide, then its copy is taken again from the source, not edited.

## Implementation
- `apps/web/src/content/shared/ZuriGoLogo.jsx` (the image `zuri-go-brand-sheet.png`, 1448 × 1086, inside `span.zgo-logo`); `apps/web/src/content/shared/zuri-go-logo.css` (`.zgo-logo` viewport, `filter:none`, `object-fit:fill`, the aspect ratio of the region); `scripts/metrics/build_metrics_map.py` (the copy loop at the top of the script copies `assets/logos/zuri-go/download.png` to `assets/logos/zuri-go-brand-sheet.png` and the stylesheet to the guide).
- Checked 2026-10-01 by the author of this file: `sha256sum` of the three files above gives the same value, equal to the hash recorded for 0.3.0 ([cloud review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”); `zuri-go-logo.css` of the application and of the guide hold the same rules. No committed test checks the bytes or the viewport.

## Notes
- Spec: [spec.md](../spec.md) “Approved source and scope” (first paragraph and the bullets “Use a CSS viewport for display only; retain the source and byte-identical copies”), “Acceptance and verification” item 5 (the source hash).
- The spec names the source as `D:/zuri-brand-kit/assets/logos/zuri-go/download.png`; the file is now `assets/logos/zuri-go/download.png` in this repository (AGENTS.md: the former checkout is a historical checkpoint).
