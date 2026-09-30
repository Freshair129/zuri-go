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
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Acceptance and verification: [spec.md](spec.md).

## Delivery evidence
- Verified locally and in production as part of 0.3.0: [history/zuri-go-cloud-review](../../history/zuri-go-cloud-review/verification.md).

## Notes
- This is the “logo contract” referenced by [AGENTS.md](../../../AGENTS.md) and [brand/README.md](../../../brand/README.md).
