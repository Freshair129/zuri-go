---
id: FEAT-010
title: Task Manager for every department
type: cross-domain-feature
owner: DOM-TSK
runtime: SRV-001
participants:
  - domain: DOM-TSK
    part: FEAT-010-P01
    role: Task records, projects, contexts, boards and the task API
  - domain: DOM-CAM
    part: FEAT-010-P02
    role: Campaign task details and the campaign Workboard as a view of the task records
delivery: declared
status: proposed
legacy: []
relations:
  depends_on: [FEAT-011]
  decided_by: [ADR-002, ADR-003]
  relates_to: [FEAT-002, FEAT-004]
---

# FEAT-010 — Task Manager for every department

> **Proposed, not built.** Declared by [ADR-002, ADR-003](../../architecture/decisions.md) for the owner's review; the delivery plan is [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md). Nothing in the application, schema or data has changed.

One place for the work of every department — sales, production, accounting, HR and marketing. A task starts from a name, is assigned with RACI, moves through the same five statuses, gets a MoSCoW priority per week, and can be linked to a campaign, a project, a team, several of these or none. The campaign Workboard becomes the same board filtered to one campaign, and projects gather work that is not part of a campaign.

## Scope
- Task records for every department in DOM-TSK; campaign, project, team, content item and goal are contexts of a task — several at once, or none ([ADR-003](../../architecture/decisions.md) D1–D2).
- Projects with a `PRJ-nnnn` code, status, owner, team, dates and progress; an existing project label is linked to a project by a person, never converted automatically (D3).
- Boards for all work, a campaign, a project, a team, unlinked work and “my tasks”, with the five existing lanes, drag and a keyboard path; Weekly To-do, List and RACI stay (D5).
- The campaign Workboard, its overview panel and “create a task from a finding” use the same records; campaign-only fields stay in DOM-CAM (D4).
- One completion rule for new work; tasks completed under the Workboard rule stay valid (D7).
- A per-task API: idempotent create, row versions, rules checked on the server, Guest 401, actor from the session (D8).
- A reviewed move of the existing Workboard tasks, with the owner’s authorization for production (D9).

## Ownership
- Feature owner: [DOM-TSK](../../domains/tasks/README.md) — Tasks & projects. Type: cross-domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md).

| Part | Domain | Role |
|---|---|---|
| [FEAT-010-P01](parts/P01-tasks.md) | [DOM-TSK](../../domains/tasks/README.md) | Task records, projects, contexts, boards and the task API |
| [FEAT-010-P02](parts/P02-campaign.md) | [DOM-CAM](../../domains/campaign/README.md) | Campaign task details and the campaign Workboard as a view of the task records |

## Planned requirements
These statements are proposals, not requirements yet: FR / AC files are written once the decisions are approved ([PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md)), as STD-003 R7 requires before the feature is built.

1. Create a task in any department from a title alone and fill in the details later.
2. Link a task to a campaign, a project, a team, a content item or a goal — several or none.
3. Create, change and archive projects, and see each project’s board and progress.
4. See boards for all work, a campaign, a project, a team, unlinked work or my tasks.
5. Move a task through the five statuses by drag or keyboard; a blocked task needs its reason.
6. Complete a task only with R, a confirmed A, a confirmed acceptance criterion and evidence, plus a recheck date when a KPI or a campaign gate is named.
7. Show owner text from the Workboard until a Member is bound to the task.
8. Show a campaign’s tasks on its Workboard from the same records, and create a task from a metric finding together with its campaign details.
9. Create, change and move tasks through an API that enforces the rules and the Member session.
10. Move the existing Workboard tasks without losing or duplicating any, after a reviewed dry run.

## Delivery evidence
- None: declared, not built.
