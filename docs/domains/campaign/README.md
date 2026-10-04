---
id: DOM-CAM
title: Campaign & content
status: proposed
---

# DOM-CAM — Campaign & content

Plan and run campaigns and their content: an objective and targets per campaign, content items and where/when they publish, and the gate-based decisions that say whether to keep an offer or add budget.

## Parent platform and process context

Zuri-Go provides the light Marketing/Commercial edition. The intended relationship between local DOM-CAM / DOM-MET and the parent `ZAI:DOM-MARKETING` is authored in [registry/relations.yaml](../../../registry/relations.yaml); it is a draft semantic mapping, not an identity or table alias. [ARCH-005](../../architecture/commercial-pipeline/ARCH-005-commercial-pipeline.md) is the canonical whole-platform process context; its [Marketing chapter](../../architecture/commercial-pipeline/marketing-campaign.md) defines the seven draft marketing flows and linked Full Pipeline view. Exact receiver contracts and operational writers need reconciliation. Existing FEAT-002 contracts continue to define implemented Campaign behavior.

## Language
- Campaign
- Objective
- Low / Mid / High target
- Gate
- Content item
- Publication
- Channel
- Mission Control
- Workboard

## Owned data
- `campaigns`
- `campaign_channels`
- `campaign_states`
- `content_items`
- `publications`
- Released to production on 2026-10-01 with 0.5.0 (schema 7; [ADR-003](../../architecture/decisions.md)): `campaign_task_details` — the campaign-only fields of a task (gate, offer, hypothesis, action, estimate, outcome, Low/Medium/High priority, original Workboard status)
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- Each campaign has its own objective and KPI set; no single north-star metric is forced on every campaign ([FEAT-002 spec §1.1](../../features/FEAT-002-campaign-mission-control/spec.md)).
- Normal-price sale comes first; a conditional package release needs enough data, and a week change is a review checkpoint, never an automatic approval ([FEAT-002 brief](../../features/FEAT-002-campaign-mission-control/brief.md)).
- Scheduling a publication records a plan; nothing is posted automatically ([ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) implementation notes).
- Plan figures are labelled plan/scenario; actuals and benchmarks are never invented ([FEAT-002 brief](../../features/FEAT-002-campaign-mission-control/brief.md)).
- Approved 2026-10-01, released to production the same day with 0.5.0: the Workboard shows the campaign’s tasks from the task records of DOM-TSK, and creating a task from a metric finding writes the task and its campaign details in one step ([ADR-003](../../architecture/decisions.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Declared on 2026-10-01, all `proposed`: API-010…API-013 in [contracts.md](contracts.md) (PLAN-001 WI-09); business rules BR-003…BR-007 in [rules.md](rules.md) (PLAN-001 WI-10). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` is added to this folder when the first ADR owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `core` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-002](../../features/FEAT-002-campaign-mission-control/feature.md) | Campaign Mission Control | implemented |

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-010](../../features/FEAT-010-task-manager/feature.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | Campaign task details and the campaign Workboard as a view of the task records | implemented |
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | [FEAT-011-P04](../../features/FEAT-011-visibility-and-confidential-meetings/parts/P04-campaign-records.md) | Visibility of campaign records (approved 2026-10-01, PLAN-003 V1; not built) | declared |

**Requirements** — approved on 2026-10-01 with ADR-002 and ADR-003.

| Requirement | Part | Title |
|---|---|---|
| [FR-010-012](../../features/FEAT-010-task-manager/requirements/FR-010-012-campaign-task-details.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | Campaign task details |
| [FR-010-013](../../features/FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | The Workboard as a view of the task records |
| [FR-010-014](../../features/FEAT-010-task-manager/requirements/FR-010-014-task-from-finding.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | Create a task from a metric finding |
| [FR-010-015](../../features/FEAT-010-task-manager/requirements/FR-010-015-campaign-tasks-projection.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | campaign.tasks stays complete as a projection |
| [FR-010-016](../../features/FEAT-010-task-manager/requirements/FR-010-016-move-workboard-tasks.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | Moving the existing Workboard tasks |

**Requirements of [FEAT-002](../../features/FEAT-002-campaign-mission-control/feature.md)** — written from the approved specification on 2026-10-01 (PLAN-001 WI-06), approved by the owner the same day (PLAN-003 G4); delivery as in the [feature’s index](../../features/FEAT-002-campaign-mission-control/feature.md#requirement-index). Requirement files sit in the feature’s `requirements/` folder.

| Requirement | Title | Delivery |
|---|---|---|
| [FR-002-001](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-001-five-views-campaign-selector.md) | Five views and a campaign selector that moves everything together | implemented |
| [FR-002-002](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-002-objective-per-campaign.md) | Each campaign has its own objective, KPI set and rule set | building |
| [FR-002-003](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-003-overview-view.md) | The Overview answers what to decide or fix now | implemented |
| [FR-002-004](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-004-reference-plan-empty-actuals.md) | The original plan is read-only evidence and actuals start empty | implemented |
| [FR-002-005](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-005-rollout-checkpoints.md) | Normal sales first, a conditional DESTINY release, and a checkpoint at each week | implemented |
| [FR-002-006](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-006-decision-ready-finding.md) | A finding is decision-ready only with data, sample, a missed threshold and a feasible action | implemented |
| [FR-002-007](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-007-target-bands.md) | Performance target bands and their boundary rules | building |
| [FR-002-008](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-008-versioned-settings-snapshots.md) | Settings are versioned and saved results keep the version they used | implemented |
| [FR-002-009](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-009-pacing-forecast.md) | Pace to date, remaining need and forecast are shown with their basis | building |
| [FR-002-010](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-010-ordered-gate-checks.md) | Gate checks run in a fixed order and a hard breach is never hidden | implemented |
| [FR-002-011](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-011-data-and-sample-holds.md) | Stale data and an immature sample hold the verdict (G-01, G-02) | implemented |
| [FR-002-012](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-012-lead-to-sale-boundaries.md) | Lead-to-Sale boundaries at 2%, 5% and 10% give exactly one result (G-03 to G-06) | implemented |
| [FR-002-013](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-013-spend-and-economics-guards.md) | Spend caps and margin floors block a release or a scale (G-07, G-08) | implemented |
| [FR-002-014](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-014-stock-and-response-guards.md) | Short stock blocks an offer and a slow response holds the scale (G-09, G-10) | implemented |
| [FR-002-015](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-015-pace-remaining-time.md) | Pace below the Low path and too little time to test again (G-11, G-12) | building |
| [FR-002-016](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-016-rule-lifecycle-alerts.md) | An alert is one open item, acknowledged is not resolved, and overrides expire | building |
| [FR-002-017](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-017-measures-volume-revenue-economics.md) | Net units, orders, net revenue, contribution and spend are counted as defined | implemented |
| [FR-002-018](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-018-measures-leads-capacity.md) | Leads, qualification, conversion, cost per lead, acquisition cost and response are counted as defined | implemented |
| [FR-002-019](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-019-attribution-dimensions.md) | Cohorts, scopes and platforms are never mixed into one total | building |
| [FR-002-020](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-020-work-tracking.md) | Work that keeps a campaign moving, with evidence and a KPI recheck | implemented |
| [FR-002-021](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-021-review-output-snapshots.md) | Daily and weekly reviews and decisions are saved as dated snapshots | building |
| [FR-002-022](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-022-setup-and-source-declaration.md) | Missing setup is shown as a setup requirement and sources must be declared | implemented |
| [FR-002-023](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-023-filters-detail-export.md) | Filters, the detail panel and exports use the same population | implemented |
| [FR-002-024](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-024-backup-restore-persistence.md) | Saving, backup and a reviewed restore never replace saved work silently | implemented |
| [FR-002-025](../../features/FEAT-002-campaign-mission-control/requirements/FR-002-025-visual-interaction.md) | The campaign views follow the brand and the interaction rules | implemented |
| [NFR-002-001](../../features/FEAT-002-campaign-mission-control/requirements/NFR-002-001-responsive-readable.md) | The campaign views are readable and fit desktop and phone | implemented |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
