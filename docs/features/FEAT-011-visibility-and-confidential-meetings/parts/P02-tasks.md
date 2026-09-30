---
id: FEAT-011-P02
title: Visibility, teams and confidential meetings — Tasks & projects
owner: DOM-TSK
runtime: SRV-001
delivery: declared
status: proposed
relations:
  decided_by: [ADR-004]
---

# FEAT-011-P02 — Visibility of tasks and projects, and of their attachments and history

Part of [FEAT-011](../feature.md), owned by [DOM-TSK](../../../domains/tasks/README.md). Proposed, not built.

## Scope
- Visibility and named viewers on tasks and projects; defaults and inheritance from meetings.
- Viewer filtering of tasks, projects, attachments, history, the overview’s task list and backups.

## Data
- planned `task_viewers`; `visibility` and `team_id` on `tasks` and `projects`

## Boundary
Filters by the viewer from FEAT-011-P01; receives the audience of a confidential meeting from FEAT-011-P03.

## Requirements
Written as FR files once the decisions are approved ([PLAN-002](../../../governance/plans/PLAN-002-task-and-meeting-domains.md)).
