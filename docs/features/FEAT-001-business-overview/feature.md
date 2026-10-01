---
id: FEAT-001
title: Business Overview
type: domain-feature
owner: DOM-BIZ
runtime: SRV-001
delivery: implemented
status: proposed
legacy: [ZGO-OVERVIEW-001]
relations:
  relates_to: [ARCH-001, ARCH-002]
---

# FEAT-001 — Business Overview

A one-page business view across all campaigns: what is running, how far each weekly and monthly goal is to its target, and what to do next. It adds the Business Overview tab, the campaign drill-down, the content list and calendar, goal setup and actual entry, and a short summary built from evidence the API supplies, on a PostgreSQL model.

## Scope
- Business Overview is the default tab (`/?view=1&tab=overview`); the per-campaign overview moves into the campaign context (`tab=campaign-overview`).
- Counts of running and queued campaigns, content waiting to publish, and all content planned for the month (`tab=content`: list and calendar).
- Weekly and monthly goals as actual / target (`tab=goals`); a weekly 500-follower goal means net +500 within the week.
- Product name **Zuri-Go** with the tagline **Let’s Go to Market. Together**.

## Ownership
- Feature owner: [DOM-BIZ](../../domains/business/README.md) — Business workspace. Type: domain feature. Provisional: goal setup and actual entry write DOM-MET data (`goals`, `metric_observations`) and the content list writes DOM-CAM data (`content_items`), which would make this a cross-domain feature under STD-001 R4 — open in PLAN-001 WI-14 (question 3).
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator also runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Feature specification “Business Overview” | `docs/architecture/overview-spec.md` | v0.2.0 · 2026-09-30 · legacy `ZGO-OVERVIEW-001` |

## Requirement index
The requirement files below were written from the approved [spec.md](spec.md) ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, [PLAN-003](../../governance/plans/PLAN-003-remaining-work.md) S1) and were approved by the owner on 2026-10-01 (PLAN-003 G4). Each file holds one requirement with its acceptance criteria, cites the section of the spec it comes from, and gives the spec’s own label (ZGO-01 to ZGO-11) in its notes; those labels are not IDs. Delivery is `implemented` only where the verification records ([0.2.0](../../history/zuri-go-review/verification.md), [0.3.0](../../history/zuri-go-cloud-review/verification.md)), the current code or a test show it; `building` marks a requirement with a clause the current code does not meet, named in its notes. TC bindings do not exist yet (WI-08).

Requirements that FEAT-010 or FEAT-011 changed are not restated: tasks and who may read them are [FEAT-010](../FEAT-010-task-manager/feature.md) and [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md) (see [FR-001-007](requirements/FR-001-007-attention-and-schedule.md) and [FR-001-020](requirements/FR-001-020-access-custody.md)).

| ID | Requirement | Delivery |
|---|---|---|
| [FR-001-001](requirements/FR-001-001-business-scope-default-tab.md) | The Business Overview opens first and covers the whole Business | implemented |
| [FR-001-002](requirements/FR-001-002-product-name-tagline.md) | The product is named Zuri-Go with its tagline | implemented |
| [FR-001-003](requirements/FR-001-003-tabs-and-drill-down.md) | Tabs, deep links and card drill-downs | implemented |
| [FR-001-004](requirements/FR-001-004-figures-one-definition.md) | Every overview figure has one definition shared by screen, API and database | implemented |
| [FR-001-005](requirements/FR-001-005-campaign-counts-lifecycle.md) | Running and queued campaigns come from a lifecycle the user confirms | implemented |
| [FR-001-006](requirements/FR-001-006-content-and-publication-counts.md) | Content items and scheduled publications are counted separately | building |
| [FR-001-007](requirements/FR-001-007-attention-and-schedule.md) | What to do today, what is about to be posted and what needs attention | building |
| [FR-001-008](requirements/FR-001-008-goal-setup-contract.md) | A goal is set from a metric, its accounts, a period, a target and an owner | building |
| [FR-001-009](requirements/FR-001-009-net-followers.md) | Net follower growth is the latest stock minus the stock at the start of the period | implemented |
| [FR-001-010](requirements/FR-001-010-goal-progress-display.md) | A goal card shows the real numbers, with the bar clamped | implemented |
| [FR-001-011](requirements/FR-001-011-goal-data-quality-and-pace.md) | Missing, partial and stale data are shown as such, and pace only when data is complete | building |
| [FR-001-012](requirements/FR-001-012-goal-periods-and-monthly.md) | Weekly and monthly goals use their own boundaries and targets | implemented |
| [FR-001-013](requirements/FR-001-013-goal-versioning.md) | A change of a target or account scope keeps its version, reason and author | implemented |
| [FR-001-014](requirements/FR-001-014-ai-summary-evidence.md) | The summary is short and every statement traces to evidence | implemented |
| [FR-001-015](requirements/FR-001-015-ai-summary-states-fallback.md) | Empty, outdated and unavailable summaries are labelled | implemented |
| [FR-001-016](requirements/FR-001-016-ai-summary-limits-privacy.md) | The AI summary reads evidence only and takes no action | implemented |
| [FR-001-017](requirements/FR-001-017-content-calendar-approval.md) | The content calendar and approval queue are the source of the content figures | implemented |
| [FR-001-018](requirements/FR-001-018-persistence-integrity.md) | PostgreSQL keeps the data whole, scoped to one Business and free of duplicates | implemented |
| [FR-001-019](requirements/FR-001-019-browser-data-import.md) | Existing browser data is imported only after a preview that checks counts and totals | implemented |
| [FR-001-020](requirements/FR-001-020-access-custody.md) | No anonymous write, and database credentials stay on the server | implemented |
| [FR-001-021](requirements/FR-001-021-visual-identity.md) | The Overview follows the brand tokens and places the two mascots by role | building |
| [NFR-001-001](requirements/NFR-001-001-responsive-accessible.md) | The Overview works on a phone, with a keyboard and with enough contrast | implemented |

## Delivery evidence
- Delivered locally in 0.2.0: [history/zuri-go-review](../../history/zuri-go-review/verification.md).
- In production since 0.3.0 — Overview checked in the production browser: [history/zuri-go-cloud-review](../../history/zuri-go-cloud-review/verification.md).

## Notes
- Section 4 of the spec defines the product-wide navigation tabs; [PRD-001](../../product/PRD-001-zuri-go.md) indexes them.
- The content-calendar and goals surfaces are candidates for features of their own (PLAN-001 WI-14).
- Same document set: [ARCH-001](../../architecture/ARCH-001-baseline-architecture.md) (architecture) and [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) (data model).
