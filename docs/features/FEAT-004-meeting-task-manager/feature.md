---
id: FEAT-004
title: Meeting & Task Manager
type: domain-feature
owner: DOM-TSK
runtime: SRV-001
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-002, FEAT-010, ARCH-002]
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
- Feature owner: [DOM-TSK](../../domains/tasks/README.md) — Tasks & projects. Type: domain feature. Provisional: its meeting intake writes DOM-MTG data (`meetings`, `meeting_revisions`, `meeting_draft_batches`, `meeting_task_links`) and its Member registry writes DOM-IAM data (`members`), so it may be cross-domain under STD-001 R4 — PLAN-001 WI-14 (question 2) and PLAN-002 WI-12.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md) in production; the trusted local operator also runs it on [SRV-002](../../services/SRV-002-local/SERVICE.md).

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
The requirement register `MT-01`–`MT-29` stays in [spec.md](spec.md) §5, with its trace in [verification.md](verification.md). Following the approved split below (PLAN-002 WI-12), each MT row now points to the requirement file that carries it. The files were written and approved by the owner on 2026-10-01; each records its MT origin in its notes. MT-14 (backup and restore of the whole domain) and MT-17 (UI and brand) stay here, as decided.

| MT | Requirement | Feature |
|---|---|---|
| MT-01, MT-03, MT-16, MT-19, MT-25 | [FR-010-001](../FEAT-010-task-manager/requirements/FR-010-001-create-task-from-title.md), [FR-010-002](../FEAT-010-task-manager/requirements/FR-010-002-task-contexts.md), [FR-010-005](../FEAT-010-task-manager/requirements/FR-010-005-boards.md), [FR-010-006](../FEAT-010-task-manager/requirements/FR-010-006-move-task-status.md), [FR-010-013](../FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md) | FEAT-010 (approved) |
| MT-02 | [FR-010-017](../FEAT-010-task-manager/requirements/FR-010-017-weekly-seed.md) | FEAT-010 |
| MT-04 | [FR-010-018](../FEAT-010-task-manager/requirements/FR-010-018-raci-rules.md) | FEAT-010 |
| MT-21 | [FR-010-019](../FEAT-010-task-manager/requirements/FR-010-019-assign-by-member.md) | FEAT-010 |
| MT-26 | [FR-010-020](../FEAT-010-task-manager/requirements/FR-010-020-moscow-values.md) | FEAT-010 |
| MT-27 | [FR-010-021](../FEAT-010-task-manager/requirements/FR-010-021-priority-views-wont.md) | FEAT-010 |
| MT-28 | [FR-010-022](../FEAT-010-task-manager/requirements/FR-010-022-priority-per-week.md) | FEAT-010 |
| MT-29 | [FR-010-023](../FEAT-010-task-manager/requirements/FR-010-023-details-priority-persistence.md) | FEAT-010 |
| MT-05 | [FR-012-001](../FEAT-012-meeting-intake/requirements/FR-012-001-fung-local-connection.md) | FEAT-012 |
| MT-06 | [FR-012-002](../FEAT-012-meeting-intake/requirements/FR-012-002-audio-intake.md) | FEAT-012 |
| MT-07 | [FR-012-003](../FEAT-012-meeting-intake/requirements/FR-012-003-transcript-provenance.md) | FEAT-012 |
| MT-08 | [FR-012-004](../FEAT-012-meeting-intake/requirements/FR-012-004-review-revision.md) | FEAT-012 |
| MT-09 | [FR-012-005](../FEAT-012-meeting-intake/requirements/FR-012-005-action-extraction.md) | FEAT-012 |
| MT-10 | [FR-012-006](../FEAT-012-meeting-intake/requirements/FR-012-006-evidence.md) | FEAT-012 |
| MT-11 | [FR-012-007](../FEAT-012-meeting-intake/requirements/FR-012-007-assignment-check.md) | FEAT-012 (task side: FR-010-009, FR-010-018, FR-010-019) |
| MT-12 | [FR-012-008](../FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md) | FEAT-012 (task side: FR-010-009) |
| MT-13 | [FR-012-009](../FEAT-012-meeting-intake/requirements/FR-012-009-commit-one-transaction.md) | FEAT-012 (task side: FR-010-009) |
| MT-15 | [NFR-012-001](../FEAT-012-meeting-intake/requirements/NFR-012-001-transcript-is-data.md) | FEAT-012 |
| MT-18 | [FR-012-010](../FEAT-012-meeting-intake/requirements/FR-012-010-end-to-end.md) | FEAT-012 |
| MT-20 | [FR-006-001](../FEAT-006-member-identity/requirements/FR-006-001-register-member.md) | FEAT-006 |
| MT-22 | [FR-006-002](../FEAT-006-member-identity/requirements/FR-006-002-rename-keeps-references.md), [FR-006-003](../FEAT-006-member-identity/requirements/FR-006-003-inactive-not-offered.md), [FR-006-004](../FEAT-006-member-identity/requirements/FR-006-004-inactive-history-and-reactivation.md) | FEAT-006 |
| MT-23 | [FR-006-005](../FEAT-006-member-identity/requirements/FR-006-005-seed-once.md), [FR-006-006](../FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md) | FEAT-006 |
| MT-24 | [FR-006-007](../FEAT-006-member-identity/requirements/FR-006-007-registry-needs-no-provider.md), [FR-006-008](../FEAT-006-member-identity/requirements/FR-006-008-failed-save-not-reported-saved.md) | FEAT-006 |
| MT-14, MT-17 | stay in [spec.md](spec.md) §5 | FEAT-004 (umbrella record) |

## Proposed split (PLAN-002 WI-12)
> **Approved 2026-10-01 (delegated by the owner, PLAN-002 WI-12); nothing is moved, renamed or renumbered yet.** [ADR-002](../../architecture/decisions.md) and [ADR-003](../../architecture/decisions.md) were approved on 2026-10-01. FEAT-004 keeps its ID, folder, files, requirement register MT-01…29 and its delivered status. The operations below are the ones of [STD-003 R7](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md), to be carried out only after approval.

**Why.** As delivered this feature is three things: the task manager (DOM-TSK), a meeting intake that writes DOM-MTG data, and a Member registry that writes DOM-IAM data (see Ownership above). The meeting intake meets all three conditions of [STD-001 R3](../../governance/standards/STD-001-DOCUMENT-ARTIFACT-STANDARD.md) for its own feature: a person can work with manual tasks while it is not shipped (MT-19), the FUNG connector can be enabled or retired alone, and the confidential-meeting feature [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md) depends on meetings independently.

**Where each requirement goes.** MT-01…29 have no IDs of their own, so each new requirement records its MT origin in its notes. The files were written on 2026-10-01; the Requirement index above maps each MT row to them.

| MT | Topic | Proposed home |
|---|---|---|
| MT-01, MT-03, MT-16, MT-19, MT-25 | Navigation, Kanban, campaign link, manual task, fill details later | [FEAT-010](../FEAT-010-task-manager/feature.md): FR-010-001, -002, -005, -006, -013 (approved) |
| MT-02, MT-04, MT-21, MT-26, MT-27, MT-28, MT-29 | Weekly seed, RACI and Member assignment, MoSCoW per week, details persistence | FEAT-010, as new requirements still to write; FR-010-005 AC-010-005-07 only protects today’s behavior |
| MT-05…MT-10, MT-15, MT-18 | FUNG connection, audio intake, provenance, review, extraction, evidence, source handling, end to end | New feature owned by DOM-MTG |
| MT-11, MT-12, MT-13 | Assignment check and idempotent commit with its receipt | DOM-MTG for the commit and receipt; FEAT-010 for the task side (FR-010-009 AC-010-009-05 and -07, FR-010-007) |
| MT-20, MT-22, MT-23, MT-24 | Member registration, lifecycle, seed and local boundary | DOM-IAM; whether they join [FEAT-006](../FEAT-006-member-identity/feature.md) or a new feature is the owner’s decision |
| MT-14, MT-17 | Backup and restore of the whole domain; UI and brand | Shared: each new feature cites them for its own views and data; the owner decides where the combined backup lives |

**Steps, after approval.**
1. Ownership: FEAT-004 already names DOM-TSK as owner in its metadata, as ADR-002 D5 proposes; it stays `domain-feature` with its provisional note above until the owner confirms. No ID or folder changes (R7, “Transfer ownership”).
2. Tasks: approve FEAT-010 and its FR files, then write the FRs marked “to write” above, with `delivery: implemented` only where [verification.md](verification.md) holds the evidence.
3. Meeting intake: declare a new feature owned by DOM-MTG (the next free ID at approval; FEAT-012 today), written together with the server-side meeting commit (PLAN-002 P3, WI-09). Its FRs get new IDs and cite MT-nn in their notes; the MT numbers are never kept under the new feature (R7, “Part becomes its own feature”).
4. Member registry: move its requirements to DOM-IAM the same way.
5. FEAT-004 then keeps the delivered 0.3.0 documents as history, and its requirement index above gains a pointer table from each MT row to its new file. Whether it is then retired (STD-002 R3) or kept as an umbrella record is the owner’s decision. [SDD-004](design.md) stays where it is and is cited with `relates_to` by the new features.
6. After each step, regenerate the views and run the validator (R7).

**Decided (2026-10-01, delegated by the owner).** The combined Backup v2 stays with FEAT-004; the Member registry requirements (MT-20, MT-22, MT-23, MT-24) join [FEAT-006](../FEAT-006-member-identity/feature.md) in DOM-IAM; FEAT-004 is kept as the umbrella record of the delivered 0.3.0 documents, not retired. Written and approved 2026-10-01: [FEAT-012](../FEAT-012-meeting-intake/feature.md) for the meeting intake (DOM-MTG), FR-010-017…023 in FEAT-010 and FR-006-001…008 in FEAT-006.

## Delivery evidence
- In production since the unified-site release, where the task manager reloaded with its five-task Kanban on the production origin ([FEAT-008 verification](../FEAT-008-unified-site/verification.md), “Production”). In 0.3.0 Weekly To-do showed the 11 imported tasks in the production browser ([history/zuri-go-cloud-review](../../history/zuri-go-cloud-review/verification.md)).
- Acceptance of the installed FUNG desktop, real audio and model inference is NOT_RUN: see [verification.md](verification.md), “Remaining acceptance”.

## Notes
- The v0.3.0 documents describe browser storage (IndexedDB); the current system persists the same entities in PostgreSQL ([ARCH-002 §5–6](../../architecture/ARCH-002-postgresql-data-model.md)).
- Approved 2026-10-01 ([ADR-002](../../architecture/decisions.md), [ADR-003](../../architecture/decisions.md)): owner moves from DOM-WRK to DOM-TSK. Once FR files exist, its task-manager requirements are carried by [FEAT-010](../FEAT-010-task-manager/feature.md) and its meeting intake moves to DOM-MTG ([PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md) WI-12).
