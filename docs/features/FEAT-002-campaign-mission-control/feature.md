---
id: FEAT-002
title: Campaign Mission Control
type: domain-feature
owner: DOM-CAM
runtime: SRV-001
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-002]
---

# FEAT-002 — Campaign Mission Control

A campaign workspace that shows where each campaign stands against its target, what to do next, who owns it, and whether the evidence is enough to change an offer or add budget. Five views — Overview, Performance, Plan & Gates, Workboard, Review & Decisions — with an independent objective, targets, manual records and decisions for every campaign.

## Scope
- Multiple campaigns, each with its own objective and KPI set.
- Ordered data / sample / economic / stock / SLA / time guards before a release decision; normal-price sale first, then a conditional package release.
- Versioned settings, record-correction history, owner acknowledgment, tasks with evidence and rechecks, and frozen decision and review snapshots.
- Date / offer / channel filters, original-source inspector, scoped JSON export, full local backup and reviewed restore.

## Ownership
- Feature owner: [DOM-CAM](../../domains/campaign/README.md) — Campaign & content. Type: domain feature. Provisional: saving a campaign also writes its Workboard tasks as `tasks` rows (`source_kind` `campaign-legacy`, `apps/api/workspace.mjs`), which is DOM-TSK data, so the feature may be cross-domain under STD-001 R4 — PLAN-001 WI-14 (question 7).
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator also runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [brief.md](brief.md) | Design brief (intent, confirmed direction) | `docs/product/campaign-mission-control-brief.md` | v0.2.0 · 2026-09-29 |
| [spec.md](spec.md) | Requirements and decision design | `docs/product/campaign-mission-control-spec.md` | v0.2.0 · 2026-09-29 |
| [wireframes.md](wireframes.md) | Screen blueprint | `docs/product/campaign-mission-control-wireframes.md` | v0.1.0 · 2026-09-29 |
| [guide.md](guide.md) | User guide | `docs/product/campaign-mission-control-user-guide.md` | v0.2.0 |
| [verification.md](verification.md) | Delivery verification and acceptance trace | `docs/product/campaign-mission-control-verification.md` | v0.2.0 · 2026-09-29 |

Text inside these documents may still name a sibling by its original file name; the **Original location** column maps each to its current file.

## Requirement index
The requirement files below were written from the approved [spec.md](spec.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, [PLAN-003](../../governance/plans/PLAN-003-remaining-work.md) S1) and were approved by the owner on 2026-10-01 (PLAN-003 G4). Each file holds one requirement with its acceptance criteria, cites the section of the spec it comes from, and gives the spec’s own label (AC-01 to AC-18 of §10, local to the document) in its notes; those labels are not IDs. Delivery is `implemented` only where [verification.md](verification.md), the tests in `tests/campaign/`, or the current code show it; `building` marks a requirement with a clause the current code does not meet, named in its notes. Where FEAT-010 changed behavior (the Workboard as a view of the task records), the files cite [FR-010-012…016](../FEAT-010-task-manager/feature.md#requirement-index) instead of restating them. TC bindings do not exist yet (WI-08).

| ID | Requirement | Delivery |
|---|---|---|
| [FR-002-001](requirements/FR-002-001-five-views-campaign-selector.md) | Five views and a campaign selector that moves everything together | implemented |
| [FR-002-002](requirements/FR-002-002-objective-per-campaign.md) | Each campaign has its own objective, KPI set and rule set | building |
| [FR-002-003](requirements/FR-002-003-overview-view.md) | The Overview answers what to decide or fix now | implemented |
| [FR-002-004](requirements/FR-002-004-reference-plan-empty-actuals.md) | The original plan is read-only evidence and actuals start empty | implemented |
| [FR-002-005](requirements/FR-002-005-rollout-checkpoints.md) | Normal sales first, a conditional DESTINY release, and a checkpoint at each week | implemented |
| [FR-002-006](requirements/FR-002-006-decision-ready-finding.md) | A finding is decision-ready only with data, sample, a missed threshold and a feasible action | implemented |
| [FR-002-007](requirements/FR-002-007-target-bands.md) | Performance target bands and their boundary rules | building |
| [FR-002-008](requirements/FR-002-008-versioned-settings-snapshots.md) | Settings are versioned and saved results keep the version they used | implemented |
| [FR-002-009](requirements/FR-002-009-pacing-forecast.md) | Pace to date, remaining need and forecast are shown with their basis | building |
| [FR-002-010](requirements/FR-002-010-ordered-gate-checks.md) | Gate checks run in a fixed order and a hard breach is never hidden | implemented |
| [FR-002-011](requirements/FR-002-011-data-and-sample-holds.md) | Stale data and an immature sample hold the verdict (G-01, G-02) | implemented |
| [FR-002-012](requirements/FR-002-012-lead-to-sale-boundaries.md) | Lead-to-Sale boundaries at 2%, 5% and 10% give exactly one result (G-03 to G-06) | implemented |
| [FR-002-013](requirements/FR-002-013-spend-and-economics-guards.md) | Spend caps and margin floors block a release or a scale (G-07, G-08) | implemented |
| [FR-002-014](requirements/FR-002-014-stock-and-response-guards.md) | Short stock blocks an offer and a slow response holds the scale (G-09, G-10) | implemented |
| [FR-002-015](requirements/FR-002-015-pace-remaining-time.md) | Pace below the Low path and too little time to test again (G-11, G-12) | building |
| [FR-002-016](requirements/FR-002-016-rule-lifecycle-alerts.md) | An alert is one open item, acknowledged is not resolved, and overrides expire | building |
| [FR-002-017](requirements/FR-002-017-measures-volume-revenue-economics.md) | Net units, orders, net revenue, contribution and spend are counted as defined | implemented |
| [FR-002-018](requirements/FR-002-018-measures-leads-capacity.md) | Leads, qualification, conversion, cost per lead, acquisition cost and response are counted as defined | implemented |
| [FR-002-019](requirements/FR-002-019-attribution-dimensions.md) | Cohorts, scopes and platforms are never mixed into one total | building |
| [FR-002-020](requirements/FR-002-020-work-tracking.md) | Work that keeps a campaign moving, with evidence and a KPI recheck | implemented |
| [FR-002-021](requirements/FR-002-021-review-output-snapshots.md) | Daily and weekly reviews and decisions are saved as dated snapshots | building |
| [FR-002-022](requirements/FR-002-022-setup-and-source-declaration.md) | Missing setup is shown as a setup requirement and sources must be declared | implemented |
| [FR-002-023](requirements/FR-002-023-filters-detail-export.md) | Filters, the detail panel and exports use the same population | implemented |
| [FR-002-024](requirements/FR-002-024-backup-restore-persistence.md) | Saving, backup and a reviewed restore never replace saved work silently | implemented |
| [FR-002-025](requirements/FR-002-025-visual-interaction.md) | The campaign views follow the brand and the interaction rules | implemented |
| [NFR-002-001](requirements/NFR-002-001-responsive-readable.md) | The campaign views are readable and fit desktop and phone | implemented |

## Delivery evidence
- Delivered locally in 0.2.0: [verification.md](verification.md), with evidence in `docs/history/campaign-mission-control-review/`. That verification states that no production deployment was used or verified.
- In production since the unified-site release, which opened the dashboard on the production origin: [FEAT-008 verification](../FEAT-008-unified-site/verification.md), “Production”. Campaign records were later imported into production PostgreSQL in 0.3.0: [history/zuri-go-cloud-review](../../history/zuri-go-cloud-review/verification.md).

## Notes
- Served from the unified site ([FEAT-008](../FEAT-008-unified-site/feature.md)); the documents describe the feature as delivered in 0.2.0 and their file paths describe the original repository.
- Approved 2026-10-01, being built ([ADR-003](../../architecture/decisions.md)): the Workboard becomes a view of the task records, delivered by part P02 of [FEAT-010](../FEAT-010-task-manager/feature.md); the approved text here stays until FR files supersede it.
