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
Declared on 2026-10-01, all `proposed`: API-005…API-009 and EVT-001 in [contracts.md](contracts.md) (PLAN-001 WI-09); business rules BR-001, BR-002 in [rules.md](rules.md) (PLAN-001 WI-10). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` is added to this folder when the first ADR owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `supporting` · role `foundation`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-001](../../features/FEAT-001-business-overview/feature.md) | Business Overview | implemented |

**Participating cross-domain features** — none.

**Requirements of [FEAT-001](../../features/FEAT-001-business-overview/feature.md)** — written from the approved specification on 2026-10-01 (PLAN-001 WI-06), approved by the owner the same day (PLAN-003 G4); delivery as in the [feature’s index](../../features/FEAT-001-business-overview/feature.md#requirement-index). Requirement files sit in the feature’s `requirements/` folder.

| Requirement | Title | Delivery |
|---|---|---|
| [FR-001-001](../../features/FEAT-001-business-overview/requirements/FR-001-001-business-scope-default-tab.md) | The Business Overview opens first and covers the whole Business | implemented |
| [FR-001-002](../../features/FEAT-001-business-overview/requirements/FR-001-002-product-name-tagline.md) | The product is named Zuri-Go with its tagline | implemented |
| [FR-001-003](../../features/FEAT-001-business-overview/requirements/FR-001-003-tabs-and-drill-down.md) | Tabs, deep links and card drill-downs | implemented |
| [FR-001-004](../../features/FEAT-001-business-overview/requirements/FR-001-004-figures-one-definition.md) | Every overview figure has one definition shared by screen, API and database | implemented |
| [FR-001-005](../../features/FEAT-001-business-overview/requirements/FR-001-005-campaign-counts-lifecycle.md) | Running and queued campaigns come from a lifecycle the user confirms | implemented |
| [FR-001-006](../../features/FEAT-001-business-overview/requirements/FR-001-006-content-and-publication-counts.md) | Content items and scheduled publications are counted separately | building |
| [FR-001-007](../../features/FEAT-001-business-overview/requirements/FR-001-007-attention-and-schedule.md) | What to do today, what is about to be posted and what needs attention | building |
| [FR-001-008](../../features/FEAT-001-business-overview/requirements/FR-001-008-goal-setup-contract.md) | A goal is set from a metric, its accounts, a period, a target and an owner | building |
| [FR-001-009](../../features/FEAT-001-business-overview/requirements/FR-001-009-net-followers.md) | Net follower growth is the latest stock minus the stock at the start of the period | implemented |
| [FR-001-010](../../features/FEAT-001-business-overview/requirements/FR-001-010-goal-progress-display.md) | A goal card shows the real numbers, with the bar clamped | implemented |
| [FR-001-011](../../features/FEAT-001-business-overview/requirements/FR-001-011-goal-data-quality-and-pace.md) | Missing, partial and stale data are shown as such, and pace only when data is complete | building |
| [FR-001-012](../../features/FEAT-001-business-overview/requirements/FR-001-012-goal-periods-and-monthly.md) | Weekly and monthly goals use their own boundaries and targets | implemented |
| [FR-001-013](../../features/FEAT-001-business-overview/requirements/FR-001-013-goal-versioning.md) | A change of a target or account scope keeps its version, reason and author | implemented |
| [FR-001-014](../../features/FEAT-001-business-overview/requirements/FR-001-014-ai-summary-evidence.md) | The summary is short and every statement traces to evidence | implemented |
| [FR-001-015](../../features/FEAT-001-business-overview/requirements/FR-001-015-ai-summary-states-fallback.md) | Empty, outdated and unavailable summaries are labelled | implemented |
| [FR-001-016](../../features/FEAT-001-business-overview/requirements/FR-001-016-ai-summary-limits-privacy.md) | The AI summary reads evidence only and takes no action | implemented |
| [FR-001-017](../../features/FEAT-001-business-overview/requirements/FR-001-017-content-calendar-approval.md) | The content calendar and approval queue are the source of the content figures | implemented |
| [FR-001-018](../../features/FEAT-001-business-overview/requirements/FR-001-018-persistence-integrity.md) | PostgreSQL keeps the data whole, scoped to one Business and free of duplicates | implemented |
| [FR-001-019](../../features/FEAT-001-business-overview/requirements/FR-001-019-browser-data-import.md) | Existing browser data is imported only after a preview that checks counts and totals | implemented |
| [FR-001-020](../../features/FEAT-001-business-overview/requirements/FR-001-020-access-custody.md) | No anonymous write, and database credentials stay on the server | implemented |
| [FR-001-021](../../features/FEAT-001-business-overview/requirements/FR-001-021-visual-identity.md) | The Overview follows the brand tokens and places the two mascots by role | building |
| [NFR-001-001](../../features/FEAT-001-business-overview/requirements/NFR-001-001-responsive-accessible.md) | The Overview works on a phone, with a keyboard and with enough contrast | implemented |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
