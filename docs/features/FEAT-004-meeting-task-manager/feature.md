---
id: FEAT-004
title: Meeting & Task Manager
type: domain-feature
owner: DOM-WRK
runtime: SRV-001
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-002, ARCH-002]
---

# FEAT-004 — Meeting & Task Manager

Weekly To-do / Kanban / List / RACI, a simple Member registry, manual tasks, MoSCoW priority per week, and meeting intake through the FUNG connector (transcript review → owned tasks), inside the same app as Mission Control.

## Scope
- A task can be created from a name alone; details, R/A/C/I and the optional Member fields are filled in later.
- MoSCoW priority per task and week with a Won’t shelf; RACI with a confirmation state.
- Weekly seed of five tasks from the weekly Kanban (28 Sep – 4 Oct 2026).
- FUNG connector: connect, import a transcript, reviewed revision, draft tasks, idempotent commit with evidence and receipt.
- Combined Backup v2 with v1 compatibility.

## Ownership
- Feature owner: [DOM-WRK](../../domains/work/README.md) — Work (tasks & meetings). Type: domain feature, no cross-domain participants.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

## Documents
| File | Role | Original location | Version |
|---|---|---|---|
| [brief.md](brief.md) | Domain brief (confirmed direction, approval record) | `docs/product/meeting-task-manager-brief.md` | v0.3.0 · 2026-09-30 |
| [spec.md](spec.md) | Specification with requirement register MT-01 – MT-29 | `docs/product/meeting-task-manager-spec.md` | v0.3.0 · 2026-09-30 |
| [design.md](design.md) | Architecture and connector contract — **SDD-004** | `docs/product/meeting-task-manager-architecture.md` | v0.3.0 · 2026-09-30 |
| [guide.md](guide.md) | User guide | `docs/product/meeting-task-manager-guide.md` | v0.3 |
| [verification.md](verification.md) | Implementation verification and requirement trace | `docs/product/meeting-task-manager-verification.md` | v0.3.0 · 2026-09-30 |
| [weekly-kanban-2026-09-28.md](weekly-kanban-2026-09-28.md) | Weekly Kanban + RACI — source of the weekly seed | `docs/product/weekly-kanban-2026-09-28.md` | v0.1 · 2026-09-30 |

Text inside these documents may still name a sibling by its original file name; the **Original location** column maps each to its current file.

## Requirement index
FR / NFR / AC files and TC bindings do not exist yet ([PLAN-001](../../governance/plans/PLAN-001-document-standard-adoption.md) WI-06, WI-08): the approved requirements remain in the documents above. Requirement register `MT-01`–`MT-29`: [spec.md](spec.md) §5; trace in [verification.md](verification.md).

## Delivery evidence
- Acceptance of the installed FUNG desktop, real audio and model inference is NOT_RUN: see [verification.md](verification.md), “Remaining acceptance”.

## Notes
- The v0.3.0 documents describe browser storage (IndexedDB); the current system persists the same entities in PostgreSQL ([ARCH-002 §5–6](../../architecture/ARCH-002-postgresql-data-model.md)).
- The Member registry uses data owned by DOM-IAM; whether this feature becomes cross-domain is an open question (PLAN-001 WI-14).
