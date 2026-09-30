---
id: FEAT-010-P02
title: Task Manager for every department — Campaign & content
owner: DOM-CAM
runtime: SRV-001
delivery: declared
status: proposed
relations:
  decided_by: [ADR-002, ADR-003]
---

# FEAT-010-P02 — Campaign task details and the campaign Workboard as a view of the task records

Part of [FEAT-010](../feature.md), owned by [DOM-CAM](../../../domains/campaign/README.md). Proposed, not built.

## Scope
- Campaign-only fields of a task (gate, offer, hypothesis, action, estimate, outcome, Low/Medium/High priority, original Workboard status).
- The Workboard, the “งานที่ต้องไปต่อ” panel and “create a task from a finding” as views and writes through the task contract.
- `campaign.tasks` as a projection of the task records, so campaign summaries, evidence snapshots and backups stay complete.

## Data
- planned `campaign_task_details`

## Boundary
Writes a task only through the FEAT-010-P01 contract, in the same transaction as its detail row.

## Requirements
Written as FR files once the decisions are approved ([PLAN-002](../../../governance/plans/PLAN-002-task-and-meeting-domains.md)).
