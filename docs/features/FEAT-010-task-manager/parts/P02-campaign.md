---
id: FEAT-010-P02
title: Task Manager for every department — Campaign & content
owner: DOM-CAM
runtime: SRV-001
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-002, ADR-003]
---

# FEAT-010-P02 — Campaign task details and the campaign Workboard as a view of the task records

Part of [FEAT-010](../feature.md), owned by [DOM-CAM](../../../domains/campaign/README.md). Approved 2026-10-01; P2 released to production on 2026-10-01 with 0.5.0 ([verification](../../../releases/0.5.0/verification.md)).

## Scope
- Campaign-only fields of a task (gate, offer, hypothesis, action, estimate, outcome, Low/Medium/High priority, original Workboard status).
- The Workboard, the “งานที่ต้องไปต่อ” panel and “create a task from a finding” as views and writes through the task contract.
- `campaign.tasks` as a projection of the task records, so campaign summaries, evidence snapshots and backups stay complete.

## Data
- planned `campaign_task_details`

## Boundary
Writes a task only through the FEAT-010-P01 contract, in the same transaction as its detail row.

## Requirements
Approved by the owner on 2026-10-01.
- [FR-010-012](../requirements/FR-010-012-campaign-task-details.md) — Campaign task details
- [FR-010-013](../requirements/FR-010-013-workboard-as-view.md) — The Workboard as a view of the task records
- [FR-010-014](../requirements/FR-010-014-task-from-finding.md) — Create a task from a metric finding
- [FR-010-015](../requirements/FR-010-015-campaign-tasks-projection.md) — campaign.tasks stays complete as a projection
- [FR-010-016](../requirements/FR-010-016-move-workboard-tasks.md) — Moving the existing Workboard tasks
