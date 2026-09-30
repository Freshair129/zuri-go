---
id: DOM-CAM
title: Campaign & content
status: proposed
---

# DOM-CAM — Campaign & content

Plan and run campaigns and their content: an objective and targets per campaign, content items and where/when they publish, and the gate-based decisions that say whether to keep an offer or add budget.

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
- Planned ([ADR-003](../../architecture/decisions.md)): `campaign_task_details` — the campaign-only fields of a task (gate, offer, hypothesis, action, estimate, outcome, Low/Medium/High priority, original Workboard status)
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- Each campaign has its own objective and KPI set; no single north-star metric is forced on every campaign ([FEAT-002 spec §1.1](../../features/FEAT-002-campaign-mission-control/spec.md)).
- Normal-price sale comes first; a conditional package release needs enough data, and a week change is a review checkpoint, never an automatic approval ([FEAT-002 brief](../../features/FEAT-002-campaign-mission-control/brief.md)).
- Scheduling a publication records a plan; nothing is posted automatically ([ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) implementation notes).
- Plan figures are labelled plan/scenario; actuals and benchmarks are never invented ([FEAT-002 brief](../../features/FEAT-002-campaign-mission-control/brief.md)).
- Proposed: the Workboard shows the campaign’s tasks from the task records of DOM-TSK, and creating a task from a metric finding writes the task and its campaign details in one step ([ADR-003](../../architecture/decisions.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `core` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-002](../../features/FEAT-002-campaign-mission-control/feature.md) | Campaign Mission Control | implemented |

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-010](../../features/FEAT-010-task-manager/feature.md) | [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md) | Campaign task details and the campaign Workboard as a view of the task records | declared |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
