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

> **Proposed, not built.** Declared by [ADR-002, ADR-003](../../architecture/decisions.md) for the owner’s review; both ADRs are still `proposed`, and so are the requirements and the design [SDD-010](design.md) below. The delivery plan is [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md). Nothing in the application, schema or data has changed.

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

## Requirement index
Proposed on 2026-10-01 for the owner’s review; each file holds the requirement and its acceptance criteria, all `delivery: declared`. Nothing is approved: ADR-002 and ADR-003 must be approved first, and PLAN-002 Q6–Q12 are still open (answers used in the files are marked as assumptions). The design is [SDD-010](design.md), which also outlines the API contract. Visibility of tasks and projects is [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md)’s, already built locally; these files refer to [FR-011-004](../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-004-task-project-visibility.md) instead of restating it.

| ID | Requirement | Part | Delivery |
|---|---|---|---|
| [FR-010-001](requirements/FR-010-001-create-task-from-title.md) | Create a task from a title alone | FEAT-010-P01 | declared |
| [FR-010-002](requirements/FR-010-002-task-contexts.md) | Contexts of a task | FEAT-010-P01 | declared |
| [FR-010-003](requirements/FR-010-003-projects.md) | Projects | FEAT-010-P01 | declared |
| [FR-010-004](requirements/FR-010-004-project-label-link.md) | Linking a project label to a project | FEAT-010-P01 | declared |
| [FR-010-005](requirements/FR-010-005-boards.md) | Boards for all work, a campaign, a project, a team, unlinked work and my tasks | FEAT-010-P01 | declared |
| [FR-010-006](requirements/FR-010-006-move-task-status.md) | Moving a task through the five statuses | FEAT-010-P01 | declared |
| [FR-010-007](requirements/FR-010-007-completion-rule.md) | Completion rule | FEAT-010-P01 | declared |
| [FR-010-008](requirements/FR-010-008-owner-label.md) | Owner label until a Member is bound | FEAT-010-P01 | declared |
| [FR-010-009](requirements/FR-010-009-task-api-create-update.md) | Task API — idempotent create and versioned update | FEAT-010-P01 | declared |
| [FR-010-010](requirements/FR-010-010-task-api-rules-identity.md) | Task API — rules, identity and audience on the server | FEAT-010-P01 | declared |
| [FR-010-011](requirements/FR-010-011-workspace-save-compatible.md) | The whole-workspace save stays compatible | FEAT-010-P01 | declared |
| [FR-010-012](requirements/FR-010-012-campaign-task-details.md) | Campaign task details | FEAT-010-P02 | declared |
| [FR-010-013](requirements/FR-010-013-workboard-as-view.md) | The Workboard as a view of the task records | FEAT-010-P02 | declared |
| [FR-010-014](requirements/FR-010-014-task-from-finding.md) | Create a task from a metric finding | FEAT-010-P02 | declared |
| [FR-010-015](requirements/FR-010-015-campaign-tasks-projection.md) | campaign.tasks stays complete as a projection | FEAT-010-P02 | declared |
| [FR-010-016](requirements/FR-010-016-move-workboard-tasks.md) | Moving the existing Workboard tasks | FEAT-010-P02 | declared |
| [NFR-010-001](requirements/NFR-010-001-row-level-security-new-tables.md) | Row-level security covers the new task tables | FEAT-010-P01 | declared |
| [NFR-010-002](requirements/NFR-010-002-additive-schema.md) | The schema change is additive and reconcilable | FEAT-010-P01 | declared |

The ten proposals of the earlier draft map to these files: create from a title (001), contexts (002), projects (003, 004), boards (005), moving and the blocked reason (006), completion (007), owner text (008), the campaign Workboard and finding (012–015), the API (009–011) and the move of existing Workboard tasks (016).

## Delivery evidence
- None: declared, not built.

## Notes
- Proposed split of [FEAT-004](../FEAT-004-meeting-task-manager/feature.md): this feature would carry its task-manager requirements, and its meeting intake would move to DOM-MTG. The plan, which moves and renumbers nothing, is in the FEAT-004 feature file ([PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md) WI-12).
