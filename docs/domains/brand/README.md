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
- The Zuri-Go logo is rendered from the unchanged bytes of the approved brand-sheet region, never recoloured, stretched or regenerated ([FEAT-009 spec](../../features/FEAT-009-logo-placement/spec.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-009](../../features/FEAT-009-logo-placement/feature.md) | Zuri-Go logo placement | implemented |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
