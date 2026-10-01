---
id: FR-001-002
title: The product is named Zuri-Go with its tagline
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-009, FEAT-008]
---

# FR-001-002 — The product is named Zuri-Go with its tagline

The system SHALL present the product as Zuri-Go with the tagline “Let’s Go to Market. Together” in the app header and title, and in the guide and the graph, SHALL keep the existing app ID and published destination, and SHALL NOT rename the mascots Zuri and น้องวางใจ.

## Acceptance criteria
- AC-001-002-01 — Given the app, then its header and title show the product name Zuri-Go with the tagline.
- AC-001-002-02 — Given the guide and the Graph View, then the product name in them agrees with the app.
- AC-001-002-03 — Given the rename, then the app ID and the published destination are the same as before.
- AC-001-002-04 — Given the rename, then the mascots keep the names Zuri and น้องวางใจ.

## Implementation
- `apps/web/src/content/shared/ZuriGoLogo.jsx` (logo with the tagline); `scripts/metrics/build_metrics_map.py` (`SITE_NAV`); app ID checked by `scripts/site/build_unified_site.py`.
- Production logo, Overview and guide masts: [zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”.

## Notes
- Spec trace ([spec.md](../spec.md)): §1 bullet 1 (AC-01); §10 bullets 1 and 2 (AC-01 to AC-04). No ZGO label.
- The placement and form of the logo are [FEAT-009](../../FEAT-009-logo-placement/feature.md)’s (the approved logo asset is shown unchanged); this requirement fixes only the name and tagline.
