---
id: FEAT-002
title: Campaign Mission Control
type: domain-feature
owner: DOM-CAM
runtime: SRV-001
delivery: live
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
- Feature owner: [DOM-CAM](../../domains/campaign/README.md) — Campaign & content. Type: domain feature, no cross-domain participants.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

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
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Acceptance scenarios `AC-01`–`AC-18`: [spec.md](spec.md) §10; trace in [verification.md](verification.md). These labels are local to the document and do not follow the STD-002 AC grammar.

## Delivery evidence
- Review evidence: `docs/history/campaign-mission-control-review/` (screenshots and browser results).

## Notes
- Served from the unified site ([FEAT-008](../FEAT-008-unified-site/feature.md)); the documents describe the feature as delivered in 0.2.0 and their file paths describe the original repository.
