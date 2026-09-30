---
id: FEAT-010-P01
title: Task Manager for every department — Tasks & projects
owner: DOM-TSK
runtime: SRV-001
delivery: declared
status: proposed
relations:
  decided_by: [ADR-002, ADR-003]
---

# FEAT-010-P01 — Task records, projects, contexts, boards and the task API

Part of [FEAT-010](../feature.md), owned by [DOM-TSK](../../../domains/tasks/README.md). Proposed, not built.

## Scope
- Tasks with contexts, projects, boards, the completion rule, owner labels and the per-task API.
- Reads team membership through DOM-IAM; accepts tasks from meeting commits through the same contract.

## Data
- `tasks`, `task_roles`, `weekly_plans`, `weekly_plan_tasks`, `task_attachments`
- planned `projects`

## Boundary
Exposes the task contract. FEAT-010-P02 and meeting commits write tasks only through it.

## Requirements
Written as FR files once the decisions are approved ([PLAN-002](../../../governance/plans/PLAN-002-task-and-meeting-domains.md)).
