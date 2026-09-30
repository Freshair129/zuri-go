---
id: DOM-WRK
title: Work (tasks & meetings)
status: proposed
---

# DOM-WRK — Work (tasks & meetings)

Turn decisions and meetings into owned, prioritised, evidenced work: tasks with RACI and a MoSCoW priority per week, weekly plans, meeting intake through reviewed FUNG transcripts, and evidence attachments.

## Language
- Task
- RACI (R / A / C / I)
- MoSCoW (Must / Should / Could / Won’t)
- Weekly plan
- Meeting
- Transcript revision
- Draft batch
- FUNG
- Evidence attachment
- Backup v2

## Owned data
- `tasks`
- `task_roles`
- `weekly_plans`
- `weekly_plan_tasks`
- `meetings`
- `meeting_revisions`
- `meeting_draft_batches`
- `meeting_task_links`
- `task_attachments`
- Table definitions: [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md) and `apps/api/migrations/`.

## Business rules
- A task can be created from a name alone; details and the extra Member fields are nullable and filled in later ([FEAT-004 brief](../../features/FEAT-004-meeting-task-manager/brief.md)).
- MoSCoW priority is per task and week; Won’t is shelved, not Done, and unprioritised tasks are shown separately ([FEAT-004 guide](../../features/FEAT-004-meeting-task-manager/guide.md)).
- A task created from a FUNG transcript comes from a reviewed revision and is idempotent: replaying the same request leaves one task ([FEAT-004 verification](../../features/FEAT-004-meeting-task-manager/verification.md)).
- Evidence files: at most 5 active files per task and 2 MiB each ([FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md)).
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

**Participating cross-domain features** — none.

**Services that host it** — [SRV-001](../../services/SRV-001-hosted/SERVICE.md), [SRV-002](../../services/SRV-002-local/SERVICE.md)
<!-- END GENERATED -->
