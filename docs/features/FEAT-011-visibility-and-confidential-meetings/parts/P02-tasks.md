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
- [FR-011-004](../requirements/FR-011-004-task-project-visibility.md) — Visibility of tasks and projects
- [FR-011-005](../requirements/FR-011-005-named-viewers.md) — Named viewers of a task
- [FR-011-008](../requirements/FR-011-008-content-follows-item.md) — Content follows its item
- [FR-011-009](../requirements/FR-011-009-confidential-meeting-tasks.md) — Tasks from a confidential meeting
- [FR-011-011](../requirements/FR-011-011-widening-visibility.md) — Widening the visibility of a task or project
- [FR-011-012](../requirements/FR-011-012-existing-data.md) — Visibility of data that exists before the change
