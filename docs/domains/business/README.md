---
id: DOM-BIZ
title: Business workspace
status: proposed
---

# DOM-BIZ — Business workspace

The Business is the tenant scope everything else hangs from, and the Business Overview is the one-page answer to “what is running, how far to target, what next”.

## Language
- Business
- Channel account
- Business Overview
- AI brief
- Change event (audit trail)
- Import (migration) batch

## Owned data
- `businesses`
- `channel_accounts`
- `ai_briefs`
- `change_events`
- `migration_batches`
- `migration_keys`
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- Every business-owned row carries `business_id` and child keys are composite `(business_id, parent_id)` ([ARCH-002 §1](../../architecture/ARCH-002-postgresql-data-model.md)); row-level security is forced on the Business tables ([ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md), “Implementation 0.2.0 / schema 2”).
- Overview numbers are computed from source rows and never stored as counters ([ARCH-002 §1](../../architecture/ARCH-002-postgresql-data-model.md)).
- The AI summary receives only evidence supplied by the API and has no write access to campaigns or tasks ([ARCH-001 §1](../../architecture/ARCH-001-baseline-architecture.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `supporting` · role `foundation`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-001](../../features/FEAT-001-business-overview/feature.md) | Business Overview | implemented |

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
