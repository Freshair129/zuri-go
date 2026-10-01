---
id: FEAT-009
title: Zuri-Go logo placement
type: domain-feature
owner: DOM-BRN
runtime: SRV-001
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FEAT-009 — Zuri-Go logo placement

The Zuri-Go logo is shown from the unchanged Main Logo region of the approved brand sheet — a full lockup with its tagline and a small navigation mark — in the Business header, the campaign selector toolbar, the site navigation, all 18 guide mastheads and the graph header.

## Scope
- Render the logo region from unchanged image bytes with a CSS viewport for display only; never redraw, recolour, stretch or regenerate it.
- No typeset substitute or corporate ZURI SVG in these placements; keep an accessible Zuri-Go label.
- Keep the source and byte-identical copies; do not create a new logo master or promote draft assets.

## Ownership
- Feature owner: [DOM-BRN](../../domains/brand/README.md) — Brand. Type: domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator also runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Logo contract (0.2.1 logo correction) | `docs/architecture/logo-correction-spec.md` | v0.2.1 |

## Requirement index
Written on 2026-10-01 from the approved [spec.md](spec.md) (PLAN-001 WI-06) as `status: proposed`; the owner approves them (PLAN-003 G4). Each file cites the spec section it comes from, holds its acceptance criteria and records its delivery evidence. No TC binds to them yet (WI-08). Spec map: “Approved source and scope” to FR-009-001 (bytes and copies), -002 (the two regions), -003 (placements), -005 (accessible label), -008 (no new master) and NFR-009-001 (nothing else changes); “Acceptance and verification” item 1 to FR-009-004, 2 to FR-009-006, 3 to FR-009-007; items 4 and 5 (build and audit checks, browser views, source hash and diff) are obligations of release 0.2.1, met in the [0.3.0 record](../../history/zuri-go-cloud-review/verification.md), not standing requirements.

| ID | Requirement | Delivery |
|---|---|---|
| [FR-009-001](requirements/FR-009-001-logo-from-unchanged-bytes.md) | The logo is rendered from the unchanged bytes of the approved brand sheet | implemented |
| [FR-009-002](requirements/FR-009-002-two-regions.md) | The logo is shown as a full lockup or as a small navigation mark | implemented |
| [FR-009-003](requirements/FR-009-003-placements.md) | The logo appears in the Business header, the campaign toolbar, the site navigation, the 18 guide mastheads and the graph header | implemented |
| [FR-009-004](requirements/FR-009-004-no-substitute.md) | No typeset substitute or corporate ZURI SVG stands in for the logo | implemented |
| [FR-009-005](requirements/FR-009-005-accessible-label.md) | The logo has an accessible Zuri-Go label, with the tagline on a full lockup | implemented |
| [FR-009-006](requirements/FR-009-006-proportions-and-fit.md) | The logo and its tagline keep their proportions and fit desktop and mobile layouts | implemented |
| [FR-009-007](requirements/FR-009-007-only-main-logo-visible.md) | Only the Main Logo artwork is visible; the rest of the brand sheet is clipped | implemented |
| [FR-009-008](requirements/FR-009-008-no-new-master.md) | No new logo master is created and no draft asset is promoted | implemented |
| [NFR-009-001](requirements/NFR-009-001-app-integrity-preserved.md) | Placing the logo changes no business data, KPI, interaction, protected shell or app identity | implemented |

The delivery values rest on the 0.3.0 production record and on checks of the current files made on 2026-10-01: the three copies of the brand sheet have one SHA-256 equal to the recorded one, the viewport percentages equal the two source rectangles, and the generated guide holds 20 logo elements and no corporate wordmark. No committed test covers the logo, no browser check was run for this record, and the accessible label was read from the source only.

## Delivery evidence
- Verified locally and in production as part of 0.3.0: [history/zuri-go-cloud-review](../../history/zuri-go-cloud-review/verification.md).

## Notes
- This is the “logo contract” referenced by [AGENTS.md](../../../AGENTS.md) and [brand/README.md](../../../brand/README.md).
