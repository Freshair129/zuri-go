---
id: FR-009-004
title: No typeset substitute or corporate ZURI SVG stands in for the logo
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-009, FR-009-001]
---

# FR-009-004 — No typeset substitute or corporate ZURI SVG stands in for the logo

The system SHALL NOT use a typeset substitute or the corporate ZURI SVG in the product-logo placements of FR-009-003.

## Acceptance criteria
- AC-009-004-01 — Given the application source and the generated guide, then no placement of FR-009-003 renders text styled as the logo or an SVG wordmark.
- AC-009-004-02 — Given the guide HTML, then it holds no reference to the corporate wordmark SVG.

## Implementation
- `apps/web/src/content/shared/ZuriGoLogo.jsx` is the only logo component; `scripts/metrics/build_metrics_map.py:logo` is the only logo markup of the guide.
- Checked 2026-10-01 by the author of this file: `apps/metrics/index.html` holds 0 references to `zuri-wordmark`, and no `.jsx`, `.mjs` or `.css` file under `apps/web/src` references it. `scripts/site/build_unified_site.py` still carries a rule that rewrites and copies `assets/logos/zuri-wordmark.svg`; that file is not in the repository and no placement uses it. No committed test checks the rule.

## Notes
- Spec: [spec.md](../spec.md) “Acceptance and verification” item 1.
- The unused rule in `build_unified_site.py` is a leftover of the earlier typeset identity; removing it is outside this record.
