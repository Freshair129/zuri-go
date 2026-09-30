---
id: DOM-TSK
title: Tasks & projects
status: proposed
relations:
  supersedes: [DOM-WRK]
---

# DOM-TSK — Tasks & projects

> **Proposed** by [ADR-002](../../architecture/decisions.md): together with the other half of the split it replaces DOM-WRK.

The work of every department — sales, production, accounting, HR and marketing — as one set of tasks: created from a name, assigned with RACI, prioritised per week, tracked to Done with evidence, and grouped by campaign, project or team. Projects gather work that is not part of a campaign.

## Language
- Task
- Context (campaign / project / team / content item / goal / none — งานทั่วไป)
- Project
- Board and lane
- Workflow status
- RACI (R / A / C / I)
- MoSCoW (Must / Should / Could / Won’t)
- Weekly plan
- Acceptance criterion and evidence
- Evidence attachment
- Visibility (public / business / team / restricted)
- Owner label (owner text not yet bound to a Member)
- Completion rule

## Owned data
- `tasks`
- `task_roles`
- `weekly_plans`
- `weekly_plan_tasks`
- `task_attachments`
- Planned ([ADR-003](../../architecture/decisions.md), [ADR-004](../../architecture/decisions.md)): `projects`, `task_viewers`; on `tasks`: `project_id`, `team_id`, `visibility`, `owner_label`, `completion_rule`, `idempotency_key`
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- A task can be created from a name alone; details and RACI are filled in later ([FEAT-004 brief](../../features/FEAT-004-meeting-task-manager/brief.md)).
- MoSCoW priority is per task and week; Won’t is shelved, not Done, and unprioritised tasks are shown separately ([FEAT-004 guide](../../features/FEAT-004-meeting-task-manager/guide.md)).
- Evidence files: at most 5 active files per task and 2 MiB each ([FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md)).
- Proposed: every task of every department is one record; campaign, project and team are contexts of it, and the campaign Workboard is a view of those records ([ADR-003](../../architecture/decisions.md)). Its proposed requirements are listed under “Requirements” below; none is approved.
- Approved 2026-10-01, being built: a task is seen only by its audience — `public`, `business`, `team` or `restricted` — and a task created from a confidential meeting starts restricted ([ADR-004](../../architecture/decisions.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared. A proposed outline of the per-task API is in [SDD-010](../../features/FEAT-010-task-manager/design.md#api-contract-proposed); it declares nothing.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-004](../../features/FEAT-004-meeting-task-manager/feature.md) | Meeting & Task Manager | implemented |
| [FEAT-010](../../features/FEAT-010-task-manager/feature.md) | Task Manager for every department | declared (proposed; design [SDD-010](../../features/FEAT-010-task-manager/design.md)) |

**Requirements** — proposed on 2026-10-01, `delivery: declared`; ADR-002 and ADR-003 are not approved. Requirement files sit in their feature’s `requirements/` folder; the owning domain is the one of the part.

| Requirement | Part | Title |
|---|---|---|
| [FR-010-001](../../features/FEAT-010-task-manager/requirements/FR-010-001-create-task-from-title.md) | [FEAT-010-P01](../../features/FEAT-010-task-manager/parts/P01-tasks.md) | Create a task from a title alone |
| [FR-010-002](../../features/FEAT-010-task-manager/requirements/FR-010-002-task-contexts.md) | FEAT-010-P01 | Contexts of a task |
| [FR-010-003](../../features/FEAT-010-task-manager/requirements/FR-010-003-projects.md) | FEAT-010-P01 | Projects |
| [FR-010-004](../../features/FEAT-010-task-manager/requirements/FR-010-004-project-label-link.md) | FEAT-010-P01 | Linking a project label to a project |
| [FR-010-005](../../features/FEAT-010-task-manager/requirements/FR-010-005-boards.md) | FEAT-010-P01 | Boards for all work, a campaign, a project, a team, unlinked work and my tasks |
| [FR-010-006](../../features/FEAT-010-task-manager/requirements/FR-010-006-move-task-status.md) | FEAT-010-P01 | Moving a task through the five statuses |
| [FR-010-007](../../features/FEAT-010-task-manager/requirements/FR-010-007-completion-rule.md) | FEAT-010-P01 | Completion rule |
| [FR-010-008](../../features/FEAT-010-task-manager/requirements/FR-010-008-owner-label.md) | FEAT-010-P01 | Owner label until a Member is bound |
| [FR-010-009](../../features/FEAT-010-task-manager/requirements/FR-010-009-task-api-create-update.md) | FEAT-010-P01 | Task API — idempotent create and versioned update |
| [FR-010-010](../../features/FEAT-010-task-manager/requirements/FR-010-010-task-api-rules-identity.md) | FEAT-010-P01 | Task API — rules, identity and audience on the server |
| [FR-010-011](../../features/FEAT-010-task-manager/requirements/FR-010-011-workspace-save-compatible.md) | FEAT-010-P01 | The whole-workspace save stays compatible |
| [NFR-010-001](../../features/FEAT-010-task-manager/requirements/NFR-010-001-row-level-security-new-tables.md) | FEAT-010-P01 | Row-level security covers the new task tables |
| [NFR-010-002](../../features/FEAT-010-task-manager/requirements/NFR-010-002-additive-schema.md) | FEAT-010-P01 | The schema change is additive and reconcilable |

The campaign half of FEAT-010 (FR-010-012…016, part [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md)) is owned by [DOM-CAM](../campaign/README.md). The visibility requirements of tasks and projects (FR-011-004, -005, -008, -009, -011, -012) are in FEAT-011-P02 below. FEAT-004 would hand its task requirements to FEAT-010 (see its “Proposed split”).

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | [FEAT-011-P02](../../features/FEAT-011-visibility-and-confidential-meetings/parts/P02-tasks.md) | Visibility of tasks and projects, and of their attachments and history | building |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
