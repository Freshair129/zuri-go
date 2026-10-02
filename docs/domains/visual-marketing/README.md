---
id: DOM-VIS
title: Visual Marketing
status: approved
relations:
  decided_by: [ADR-006]
---
# DOM-VIS — Visual Marketing

VisualMarketingDomain is a bounded context inside Zuri-Go Marketing. It owns brief-driven creative production with scoped agents and human decisions. Campaign, Member, Task and Project remain owned by existing domains.

## Language and owned data

Brief: structured instructions and evidence. Artifact: immutable stage output. Review: findings about an exact revision. Approval: human decision over a hash. Run: bounded role execution. Job: durable execution state, separate from workflow stage. Owned records are defined once in the [data amendment](../../architecture/visual-marketing/data-model.md).

## Business rules

Agents cannot grant approval, broaden visibility, write peer records or publish. Derived work cannot expose its input context to a wider audience. Brand promotion remains human-only. Local operator identity is explicit, never a Member session.

## Public contracts

[API-023 and EVT-002](contracts.md), approved. [FEAT-014](../../features/FEAT-014-visual-marketing-team/feature.md), [ADR-006](../../architecture/decisions.md#adr-006--visual-marketing-is-a-node-domain-with-explicit-provider-and-executor-boundaries).

<!-- BEGIN GENERATED: feature-index -->
**Classification** — subdomain `core` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml). Proposed.

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-014](../../features/FEAT-014-visual-marketing-team/feature.md) | Visual Marketing Team | implemented |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-002](../../services/SRV-002-local/SERVICE.md) (local first slice; no production deployment).
<!-- END GENERATED -->
