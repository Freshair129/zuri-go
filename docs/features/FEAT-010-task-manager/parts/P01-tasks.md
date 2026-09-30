---
id: FEAT-010-P01
title: Task Manager for every department — Tasks & projects
owner: DOM-TSK
runtime: SRV-001
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-002, ADR-003]
---

# FEAT-010-P01 — Task records, projects, contexts, boards and the task API

Part of [FEAT-010](../feature.md), owned by [DOM-TSK](../../../domains/tasks/README.md). Approved 2026-10-01; P2 released to production on 2026-10-01 with 0.5.0 ([verification](../../../releases/0.5.0/verification.md)).

## Scope
- Tasks with contexts, projects, boards, the completion rule, owner labels and the per-task API.
- Reads team membership through DOM-IAM; accepts tasks from meeting commits through the same contract.
- The weekly plan and its rules, from FEAT-004 (approved 2026-10-01): the weekly seed, RACI rules, assignment by Member, one MoSCoW scale, the priority views with the Won’t shelf, priority per week with carry-over, and the persistence of details and priority.

## Data
- `tasks`, `task_roles`, `weekly_plans`, `weekly_plan_tasks`, `task_attachments`
- planned `projects`

## Boundary
Exposes the task contract. FEAT-010-P02 and meeting commits write tasks only through it.

## Requirements
FR-010-001…011 and both NFRs were approved by the owner on 2026-10-01; FR-010-017…023 were written from FEAT-004 later the same day and approved by the owner the same day.
- [FR-010-001](../requirements/FR-010-001-create-task-from-title.md) — Create a task from a title alone
- [FR-010-002](../requirements/FR-010-002-task-contexts.md) — Contexts of a task
- [FR-010-003](../requirements/FR-010-003-projects.md) — Projects
- [FR-010-004](../requirements/FR-010-004-project-label-link.md) — Linking a project label to a project
- [FR-010-005](../requirements/FR-010-005-boards.md) — Boards for all work, a campaign, a project, a team, unlinked work and my tasks
- [FR-010-006](../requirements/FR-010-006-move-task-status.md) — Moving a task through the five statuses
- [FR-010-007](../requirements/FR-010-007-completion-rule.md) — Completion rule
- [FR-010-008](../requirements/FR-010-008-owner-label.md) — Owner label until a Member is bound
- [FR-010-009](../requirements/FR-010-009-task-api-create-update.md) — Task API — idempotent create and versioned update
- [FR-010-010](../requirements/FR-010-010-task-api-rules-identity.md) — Task API — rules, identity and audience on the server
- [FR-010-011](../requirements/FR-010-011-workspace-save-compatible.md) — The whole-workspace save stays compatible
- [FR-010-017](../requirements/FR-010-017-weekly-seed.md) — Weekly seed of 28 September – 4 October 2026
- [FR-010-018](../requirements/FR-010-018-raci-rules.md) — RACI rules — one R, one A, Members only
- [FR-010-019](../requirements/FR-010-019-assign-by-member.md) — Assigning people to a task by Member
- [FR-010-020](../requirements/FR-010-020-moscow-values.md) — One MoSCoW scale
- [FR-010-021](../requirements/FR-010-021-priority-views-wont.md) — Priority views and the Won’t shelf
- [FR-010-022](../requirements/FR-010-022-priority-per-week.md) — Priority per week and carry-over
- [FR-010-023](../requirements/FR-010-023-details-priority-persistence.md) — Details and priority survive a backup and restore
- [NFR-010-001](../requirements/NFR-010-001-row-level-security-new-tables.md) — Row-level security covers the new task tables
- [NFR-010-002](../requirements/NFR-010-002-additive-schema.md) — The schema change is additive and reconcilable
