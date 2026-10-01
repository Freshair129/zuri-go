---
id: DOM-TSK
title: Tasks & projects
status: proposed
relations:
  supersedes: [DOM-WRK]
---

# DOM-TSK — Tasks & projects

> **Adopted** with [ADR-002](../../architecture/decisions.md), approved 2026-10-01: together with the other half of the split it replaces DOM-WRK.

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
- Released to production on 2026-10-01 with 0.5.0 (schema 7; [verification](../../releases/0.5.0/verification.md)) ([ADR-003](../../architecture/decisions.md), [ADR-004](../../architecture/decisions.md); schema 6 and 7): `projects`, `project_viewers`, `task_viewers`; on `tasks`: `project_id`, `team_id`, `visibility`, `owner_label`, `completion_rule`, `idempotency_key`, `idempotency_hash`.
- `campaign_task_details` (schema 7) holds the campaign-only fields of a campaign task; it belongs to [DOM-CAM](../campaign/README.md) and is written in the same transaction as the task ([ADR-003](../../architecture/decisions.md) D4).
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- A task can be created from a name alone; details and RACI are filled in later ([FEAT-004 brief](../../features/FEAT-004-meeting-task-manager/brief.md)).
- MoSCoW priority is per task and week; Won’t is shelved, not Done, and unprioritised tasks are shown separately ([FEAT-004 guide](../../features/FEAT-004-meeting-task-manager/guide.md)). Written as requirements FR-010-020…022 (approved 2026-10-01).
- Evidence files: at most 5 active files per task and 2 MiB each ([FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md)).
- Approved 2026-10-01, phase P2 released to production the same day with 0.5.0 (schema 7): every task of every department is one record; campaign, project and team are contexts of it, and the campaign Workboard is a view of those records ([ADR-003](../../architecture/decisions.md)). Its requirements are listed under “Requirements” below.
- Approved 2026-10-01, phase P1 released to production the same day with 0.5.0 (schema 6 and 7): a task is seen only by its audience — `public`, `business`, `team` or `restricted` — and a task created from a confidential meeting starts restricted ([ADR-004](../../architecture/decisions.md)). Guests now read public items only, so the interim rule of ADR-004 D9 (no confidential content in production) ended for tasks on 2026-10-01 ([verification](../../releases/0.5.0/verification.md)); it still applies to campaign records and, on 0.5.0, to Member profiles, which Guests still read (D16, built locally and not released, narrows a Guest’s read of a Member to ID, PID, display name and status).
- Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01); the code of D2 and D12 was released on 2026-10-01 in 0.5.1): the server refuses an Inactive Member in a new R, A, C or I and keeps a role the task already had, while named viewers may be Inactive ([FR-010-019](../../features/FEAT-010-task-manager/requirements/FR-010-019-assign-by-member.md) AC-010-019-05); the same Member may be both R and A (D5, [FR-010-018](../../features/FEAT-010-task-manager/requirements/FR-010-018-raci-rules.md) AC-010-018-07); a weekly priority writes a history event only when the priority or note changes (D12, [FR-010-022](../../features/FEAT-010-task-manager/requirements/FR-010-022-priority-per-week.md) AC-010-022-06); a per-task operation for weekly MoSCoW is later (D10); a PostgreSQL Business is never seeded with the weekly seed (D8).
- These rules are stated today in the feature specifications and AGENTS.md; promoting them to BR- / SEC- artifacts is [PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-10.

## Public contracts
Declared on 2026-10-01, all `proposed`: API-016…API-018 in [contracts.md](contracts.md) (PLAN-001 WI-09); business rules BR-018, BR-019 in [rules.md](rules.md) (PLAN-001 WI-10). The HTTP API under `/api/zuri-go/v1` is outlined in [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) and in the feature specifications below. `decisions.md` and `contracts.md` are added to this folder when the first ADR-, API- or EVT- owned by this domain is declared. An outline of the per-task API, approved with [SDD-010](../../features/FEAT-010-task-manager/design.md#api-contract-proposed) and released in phase P2 (0.5.0), declares no API- artifact.

<!-- BEGIN GENERATED: feature-index -->
_Maintained by hand; `npm run docs:views` (scripts/docs/generate_views.py --check, PLAN-001 WI-11) reports any drift from `feature.md` and the registry._

**Classification** — subdomain `supporting` · role `business`, from [registry/domains.yaml](../../../registry/domains.yaml).

**Owned features**

| Feature | Title | Delivery |
|---|---|---|
| [FEAT-004](../../features/FEAT-004-meeting-task-manager/feature.md) | Meeting & Task Manager | implemented |
| [FEAT-010](../../features/FEAT-010-task-manager/feature.md) | Task Manager for every department | implemented — phase P2 released to production 2026-10-01 with 0.5.0 (approved; design [SDD-010](../../features/FEAT-010-task-manager/design.md)) |

The server-side meeting commit, an amendment to the design of FEAT-004 ([SDD-004](../../features/FEAT-004-meeting-task-manager/design.md)), was approved on 2026-10-01 (PLAN-002 WI-09, Q15). It changes how a meeting creates tasks and calls the idempotent create of FR-010-009; no FEAT-004 file is moved or renumbered.

**Requirements** — FR-010-001…016 and both NFRs approved on 2026-10-01 with ADR-002 and ADR-003; FR-010-017…023, written from FEAT-004 the same day, were approved the same day; delivery as in the [FEAT-010 index](../../features/FEAT-010-task-manager/feature.md#requirement-index), released to production on 2026-10-01 with 0.5.0. Requirement files sit in their feature’s `requirements/` folder; the owning domain is the one of the part.

| Requirement | Part | Title | Delivery |
|---|---|---|---|
| [FR-010-001](../../features/FEAT-010-task-manager/requirements/FR-010-001-create-task-from-title.md) | [FEAT-010-P01](../../features/FEAT-010-task-manager/parts/P01-tasks.md) | Create a task from a title alone | implemented |
| [FR-010-002](../../features/FEAT-010-task-manager/requirements/FR-010-002-task-contexts.md) | FEAT-010-P01 | Contexts of a task | implemented |
| [FR-010-003](../../features/FEAT-010-task-manager/requirements/FR-010-003-projects.md) | FEAT-010-P01 | Projects | implemented |
| [FR-010-004](../../features/FEAT-010-task-manager/requirements/FR-010-004-project-label-link.md) | FEAT-010-P01 | Linking a project label to a project | implemented |
| [FR-010-005](../../features/FEAT-010-task-manager/requirements/FR-010-005-boards.md) | FEAT-010-P01 | Boards for all work, a campaign, a project, a team, unlinked work and my tasks | implemented |
| [FR-010-006](../../features/FEAT-010-task-manager/requirements/FR-010-006-move-task-status.md) | FEAT-010-P01 | Moving a task through the five statuses | implemented |
| [FR-010-007](../../features/FEAT-010-task-manager/requirements/FR-010-007-completion-rule.md) | FEAT-010-P01 | Completion rule | implemented |
| [FR-010-008](../../features/FEAT-010-task-manager/requirements/FR-010-008-owner-label.md) | FEAT-010-P01 | Owner label until a Member is bound | implemented |
| [FR-010-009](../../features/FEAT-010-task-manager/requirements/FR-010-009-task-api-create-update.md) | FEAT-010-P01 | Task API — idempotent create and versioned update | implemented |
| [FR-010-010](../../features/FEAT-010-task-manager/requirements/FR-010-010-task-api-rules-identity.md) | FEAT-010-P01 | Task API — rules, identity and audience on the server | implemented |
| [FR-010-011](../../features/FEAT-010-task-manager/requirements/FR-010-011-workspace-save-compatible.md) | FEAT-010-P01 | The whole-workspace save stays compatible | implemented |
| [FR-010-017](../../features/FEAT-010-task-manager/requirements/FR-010-017-weekly-seed.md) | FEAT-010-P01 | Weekly seed of 28 September – 4 October 2026 | implemented |
| [FR-010-018](../../features/FEAT-010-task-manager/requirements/FR-010-018-raci-rules.md) | FEAT-010-P01 | RACI rules — one R, one A, Members only | implemented |
| [FR-010-019](../../features/FEAT-010-task-manager/requirements/FR-010-019-assign-by-member.md) | FEAT-010-P01 | Assigning people to a task by Member | implemented |
| [FR-010-020](../../features/FEAT-010-task-manager/requirements/FR-010-020-moscow-values.md) | FEAT-010-P01 | One MoSCoW scale | implemented |
| [FR-010-021](../../features/FEAT-010-task-manager/requirements/FR-010-021-priority-views-wont.md) | FEAT-010-P01 | Priority views and the Won’t shelf | implemented |
| [FR-010-022](../../features/FEAT-010-task-manager/requirements/FR-010-022-priority-per-week.md) | FEAT-010-P01 | Priority per week and carry-over | implemented |
| [FR-010-023](../../features/FEAT-010-task-manager/requirements/FR-010-023-details-priority-persistence.md) | FEAT-010-P01 | Details and priority survive a backup and restore | implemented |
| [NFR-010-001](../../features/FEAT-010-task-manager/requirements/NFR-010-001-row-level-security-new-tables.md) | FEAT-010-P01 | Row-level security covers the new task tables | implemented |
| [NFR-010-002](../../features/FEAT-010-task-manager/requirements/NFR-010-002-additive-schema.md) | FEAT-010-P01 | The schema change is additive and reconcilable | implemented |

The campaign half of FEAT-010 (FR-010-012…016, part [FEAT-010-P02](../../features/FEAT-010-task-manager/parts/P02-campaign.md)) is owned by [DOM-CAM](../campaign/README.md). The visibility requirements of tasks and projects (FR-011-004, -005, -008, -009, -011, -012) are in FEAT-011-P02 below. FEAT-004 hands its task requirements MT-02, 04, 21, 26, 27, 28 and 29 to FEAT-010 as FR-010-017…023 (see its “Proposed split”); FEAT-004 keeps its files and its MT register.

**Participating cross-domain features**

| Feature | Part | Role | Delivery |
|---|---|---|---|
| [FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md) | [FEAT-011-P02](../../features/FEAT-011-visibility-and-confidential-meetings/parts/P02-tasks.md) | Visibility of tasks and projects, and of their attachments and history | implemented |

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
