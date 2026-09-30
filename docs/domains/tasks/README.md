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
- Proposed: every task of every department is one record; campaign, project and team are contexts of it, and the campaign Workboard is a view of those records ([ADR-003](../../architecture/decisions.md)).
- Proposed: a task is seen only by its audience — `public`, `business`, `team` or `restricted` — and a task created from a confidential meeting starts restricted ([ADR-004](../../architecture/decisions.md)).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Not yet declared as API- / EVT- artifacts (PLAN-001 WI-09). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand until `tools/generate-views` exists (PLAN-001 WI-11); edits inside this block are overwritten by that tool._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-004](../../features/FEAT-004-meeting-task-manager/feature.md) | Meeting & Task Manager | implemented |
| [FEAT-010](../../features/FEAT-010-task-manager/feature.md) | Task Manager for every department | declared |

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | [FEAT-011-P02](../../features/FEAT-011-visibility-and-confidential-meetings/parts/P02-tasks.md) | Visibility of tasks and projects, and of their attachments and history | declared |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
