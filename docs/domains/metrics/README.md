---
id: DOM-MET
title: Metrics & goals
status: proposed
---

# DOM-MET — Metrics & goals

The shared vocabulary and arithmetic of marketing metrics — definitions, formulas, observations and targets — and the Metrics Map guide and Graph View that teach them.

## Language
- Metric definition
- Metric series
- Observation
- Goal (weekly / monthly, actual vs target)
- Net followers
- Metrics Map
- Graph term
- Media spend
- Revenue
- Overstock SKU

## Owned data
- `metric_definitions`
- `metric_series`
- `metric_observations`
- `goals`
- `goal_series`
- Generated guide and graph content: `apps/metrics` (built by `scripts/metrics`)
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- A weekly follower goal means net growth within the week, not a cumulative total ([FEAT-001 spec §1](../../features/FEAT-001-business-overview/spec.md)).
- Guide definitions come from the guide cards; graph examples are hypothetical and show no live performance ([FEAT-003 brief](../../features/FEAT-003-metrics-map/brief.md)).
- `NULL` means unknown and `0` means confirmed zero; a missing value is never turned into zero before a completion calculation ([ARCH-002 §1](../../architecture/ARCH-002-postgresql-data-model.md)).
- Navigation and deployment changes do not change KPI definitions or metric formulas ([FEAT-008 spec](../../features/FEAT-008-unified-site/spec.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Declared on 2026-10-01, all `proposed`: API-014, API-015 in [contracts.md](contracts.md) (PLAN-001 WI-09); business rules BR-009…BR-012 in [rules.md](rules.md) (PLAN-001 WI-10). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `core` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-003](../../features/FEAT-003-metrics-map/feature.md) | Marketing Metrics Map and Graph View | implemented |

**Participating cross-domain features** — none.

**Requirements of [FEAT-003](../../features/FEAT-003-metrics-map/feature.md)** — written from the approved specification on 2026-10-01 (PLAN-001 WI-06), `status: proposed` until the owner approves them (PLAN-003 G4); delivery as in the [feature’s index](../../features/FEAT-003-metrics-map/feature.md#requirement-index). Requirement files sit in the feature’s `requirements/` folder.

| Requirement | Title | Delivery |
|---|---|---|
| [FR-003-001](../../features/FEAT-003-metrics-map/requirements/FR-003-001-guide-structure.md) | An 18-page guide in six categories with a linked contents | implemented |
| [FR-003-002](../../features/FEAT-003-metrics-map/requirements/FR-003-002-page-viewer.md) | The guide shows one page at a time with previous, next and a linkable hash | implemented |
| [FR-003-003](../../features/FEAT-003-metrics-map/requirements/FR-003-003-metric-definitions.md) | Every metric keeps its definition, unit, basis, example and how to read it | implemented |
| [FR-003-004](../../features/FEAT-003-metrics-map/requirements/FR-003-004-worked-examples.md) | Worked examples are hypothetical, reconcile, and say when a result cannot be calculated | implemented |
| [FR-003-005](../../features/FEAT-003-metrics-map/requirements/FR-003-005-interpretation-guardrails.md) | The guide does not claim a cause or a profit its numbers cannot show | implemented |
| [FR-003-006](../../features/FEAT-003-metrics-map/requirements/FR-003-006-growth-team-workflow.md) | AARRR, the team and the working loop are explained as frames | implemented |
| [FR-003-007](../../features/FEAT-003-metrics-map/requirements/FR-003-007-planning-templates.md) | KPI & Budget, RACI, the 90-day roadmap and the 12-month outlook are labelled templates | implemented |
| [FR-003-008](../../features/FEAT-003-metrics-map/requirements/FR-003-008-commerce-operations-pages.md) | Lead, order, contribution and inventory metrics are defined in general terms | implemented |
| [FR-003-009](../../features/FEAT-003-metrics-map/requirements/FR-003-009-rev04-metrics.md) | Media Spend, Revenue and Overstock SKU are added with their guardrails | implemented |
| [FR-003-010](../../features/FEAT-003-metrics-map/requirements/FR-003-010-source-coverage.md) | Every source image and supporting source is accounted for | implemented |
| [FR-003-011](../../features/FEAT-003-metrics-map/requirements/FR-003-011-mascot-pair-scenario-cta.md) | Both mascots, a short scenario and an action on every page | implemented |
| [FR-003-012](../../features/FEAT-003-metrics-map/requirements/FR-003-012-brand-application.md) | The guide follows the brand tokens, fonts, wordmark and tone | implemented |
| [FR-003-013](../../features/FEAT-003-metrics-map/requirements/FR-003-013-graph-terms-categories.md) | The graph holds 40 unique terms in three groups | implemented |
| [FR-003-014](../../features/FEAT-003-metrics-map/requirements/FR-003-014-graph-modes-rotation.md) | A 2D and a 3D graph that rotate, zoom and fit | implemented |
| [FR-003-015](../../features/FEAT-003-metrics-map/requirements/FR-003-015-graph-search-detail.md) | Search, category browse and a detail panel that explain each term | implemented |
| [FR-003-016](../../features/FEAT-003-metrics-map/requirements/FR-003-016-graph-backgrounds.md) | Three approved backgrounds for the graph stage only | implemented |
| [FR-003-017](../../features/FEAT-003-metrics-map/requirements/FR-003-017-graph-self-contained-read-only.md) | The graph is self-contained and shows no live data | implemented |
| [FR-003-018](../../features/FEAT-003-metrics-map/requirements/FR-003-018-print-output.md) | The guide prints as 18 sheets with both mascots, and nothing interactive | implemented |
| [NFR-003-001](../../features/FEAT-003-metrics-map/requirements/NFR-003-001-responsive-no-overflow.md) | The guide and the graph fit a phone and a desktop in both themes | implemented |
| [NFR-003-002](../../features/FEAT-003-metrics-map/requirements/NFR-003-002-offline-self-contained.md) | The guide can be read and printed with no network and no script | implemented |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
