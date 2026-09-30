---
id: DOM-MET
title: Metrics & goals
status: proposed
---

# DOM-MET — Metrics & goals

The shared vocabulary and arithmetic of marketing metrics — definitions, formulas, observations and targets — and the Metrics Map guide and Graph View that teach them.

Classification ([registry/domains.yaml](../../../registry/domains.yaml)): subdomain `core` · role `business`.

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
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-003](../../features/FEAT-003-metrics-map/feature.md) | Marketing Metrics Map and Graph View | live |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
