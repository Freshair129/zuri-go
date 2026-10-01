---
id: DOM-BRN
title: Brand
status: proposed
---

# DOM-BRN — Brand

Brand rules and approved assets for Zuri-Go: the wordmark and logo lockups, palette tokens, and the Zuri and น้องวางใจ mascots.

## Language
- Brand profile
- Logo lockup
- Mascots (Zuri, น้องวางใจ)
- Approved asset
- Human-only promotion

## Owned data
- No PostgreSQL tables. Files: `brand/` (rules) and `assets/` (approved sources).

## Business rules
- Use existing approved assets; never redraw a logo or invent brand tokens, names or taglines; brand promotion is human-only ([AGENTS.md](../../../AGENTS.md)).
- The Zuri-Go logo is rendered from the unchanged bytes of the approved brand-sheet region, never recoloured, stretched or regenerated ([FEAT-009 spec](../../features/FEAT-009-logo-placement/spec.md)); proposed requirements [FR-009-001](../../features/FEAT-009-logo-placement/requirements/FR-009-001-logo-from-unchanged-bytes.md) and [FR-009-008](../../features/FEAT-009-logo-placement/requirements/FR-009-008-no-new-master.md).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Declared on 2026-10-01, all `proposed`: business rules BR-020, BR-021 in [rules.md](rules.md) (PLAN-001 WI-10). This domain exposes no HTTP API of its own. The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-009](../../features/FEAT-009-logo-placement/feature.md) | Zuri-Go logo placement | implemented |

**Requirements** — the requirements of [FEAT-009](../../features/FEAT-009-logo-placement/feature.md#requirement-index) were written on 2026-10-01 from its approved specification (PLAN-001 WI-06) and are `proposed`: the owner approves them (PLAN-003 G4). Requirement files sit in the feature’s `requirements/` folder.

| Requirement | Feature | Title | Status | Delivery |
|---|---|---|---|---|
| [FR-009-001](../../features/FEAT-009-logo-placement/requirements/FR-009-001-logo-from-unchanged-bytes.md) | FEAT-009 | The logo is rendered from the unchanged bytes of the approved brand sheet | proposed | implemented |
| [FR-009-002](../../features/FEAT-009-logo-placement/requirements/FR-009-002-two-regions.md) | FEAT-009 | The logo is shown as a full lockup or as a small navigation mark | proposed | implemented |
| [FR-009-003](../../features/FEAT-009-logo-placement/requirements/FR-009-003-placements.md) | FEAT-009 | The logo appears in the Business header, the campaign toolbar, the site navigation, the 18 guide mastheads and the graph header | proposed | implemented |
| [FR-009-004](../../features/FEAT-009-logo-placement/requirements/FR-009-004-no-substitute.md) | FEAT-009 | No typeset substitute or corporate ZURI SVG stands in for the logo | proposed | implemented |
| [FR-009-005](../../features/FEAT-009-logo-placement/requirements/FR-009-005-accessible-label.md) | FEAT-009 | The logo has an accessible Zuri-Go label, with the tagline on a full lockup | proposed | implemented |
| [FR-009-006](../../features/FEAT-009-logo-placement/requirements/FR-009-006-proportions-and-fit.md) | FEAT-009 | The logo and its tagline keep their proportions and fit desktop and mobile layouts | proposed | implemented |
| [FR-009-007](../../features/FEAT-009-logo-placement/requirements/FR-009-007-only-main-logo-visible.md) | FEAT-009 | Only the Main Logo artwork is visible; the rest of the brand sheet is clipped | proposed | implemented |
| [FR-009-008](../../features/FEAT-009-logo-placement/requirements/FR-009-008-no-new-master.md) | FEAT-009 | No new logo master is created and no draft asset is promoted | proposed | implemented |
| [NFR-009-001](../../features/FEAT-009-logo-placement/requirements/NFR-009-001-app-integrity-preserved.md) | FEAT-009 | Placing the logo changes no business data, KPI, interaction, protected shell or app identity | proposed | implemented |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
