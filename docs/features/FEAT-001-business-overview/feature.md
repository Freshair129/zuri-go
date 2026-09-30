---
id: FEAT-001
title: Business Overview
type: domain-feature
owner: DOM-BIZ
runtime: SRV-001
delivery: live
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
- Feature owner: [DOM-BIZ](../../domains/business/README.md) — Business workspace. Type: domain feature, no cross-domain participants.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [spec.md](spec.md) | Feature specification “Business Overview” | `docs/architecture/overview-spec.md` | v0.2.0 · 2026-09-30 · legacy `ZGO-OVERVIEW-001` |

## Requirement index
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Acceptance / exit criteria: [spec.md](spec.md) §11. No requirement IDs exist yet.

## Delivery evidence
- Delivered locally in 0.2.0: [history/zuri-go-review](../../history/zuri-go-review/verification.md).
- Delivered to production in 0.3.0: [history/zuri-go-cloud-review](../../history/zuri-go-cloud-review/verification.md).

## Notes
- Section 4 of the spec defines the product-wide navigation tabs; [PRD-001](../../product/PRD-001-zuri-go.md) indexes them.
- The content-calendar and goals surfaces are candidates for features of their own (PLAN-001 WI-14).
- Same document set: [ARCH-001](../../architecture/ARCH-001-baseline-architecture.md) (architecture) and [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) (data model).
