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
delivery: implemented
status: approved
legacy: []
relations:
  depends_on: [FEAT-011]
  decided_by: [ADR-002, ADR-003]
  relates_to: [FEAT-002, FEAT-004]
---

# FEAT-010 — Task Manager for every department

> **Approved 2026-10-01; phase P2 released to production the same day with 0.5.0 (schema 7; [verification](../../releases/0.5.0/verification.md)).** Declared by [ADR-002, ADR-003](../../architecture/decisions.md), approved by the owner with the requirements and the design [SDD-010](design.md). The delivery plan is [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md).

One place for the work of every department — sales, production, accounting, HR and marketing. A task starts from a name, is assigned with RACI, moves through the same five statuses, gets a MoSCoW priority per week, and can be linked to a campaign, a project, a team, several of these or none. The campaign Workboard becomes the same board filtered to one campaign, and projects gather work that is not part of a campaign.

## Scope
- Task records for every department in DOM-TSK; campaign, project, team, content item and goal are contexts of a task — several at once, or none ([ADR-003](../../architecture/decisions.md) D1–D2).
- Projects with a `PRJ-nnnn` code, status, owner, team, dates and progress; an existing project label is linked to a project by a person, never converted automatically (D3).
- Boards for all work, a campaign, a project, a team, unlinked work and “my tasks”, with the five existing lanes, drag and a keyboard path; Weekly To-do, List and RACI stay (D5).
- The campaign Workboard, its overview panel and “create a task from a finding” use the same records; campaign-only fields stay in DOM-CAM (D4).
- One completion rule for new work; tasks completed under the Workboard rule stay valid (D7).
- A per-task API: idempotent create, row versions, rules checked on the server, Guest 401, actor from the session (D8).
- A reviewed move of the existing Workboard tasks, with the owner’s authorization for production (D9).
- From FEAT-004 (approved 2026-10-01, [PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md) WI-12): the weekly seed, the RACI rules, assignment by Member, one MoSCoW scale, the priority views and the Won’t shelf, priority per week with carry-over, and the persistence of details and priority (FR-010-017…023).

## Ownership
- Feature owner: [DOM-TSK](../../domains/tasks/README.md) — Tasks & projects. Type: cross-domain feature.
- Runtime owner: [SRV-001](../../services/SRV-001-hosted/SERVICE.md).

| Part | Domain | Role |
|---|---|---|
| [FEAT-010-P01](parts/P01-tasks.md) | [DOM-TSK](../../domains/tasks/README.md) | Task records, projects, contexts, boards and the task API |
| [FEAT-010-P02](parts/P02-campaign.md) | [DOM-CAM](../../domains/campaign/README.md) | Campaign task details and the campaign Workboard as a view of the task records |

## Requirement index
FR-010-001…016 and NFR-010-001/002 were approved by the owner on 2026-10-01, with ADR-002, ADR-003 and PLAN-002 Q6–Q11 as recommended (Q12 is asked again at P4); FR-010-017…023 were written later the same day from FEAT-004 and approved by the owner the same day. Each file holds the requirement and its acceptance criteria. The design is [SDD-010](design.md), which also outlines the API contract. Visibility of tasks and projects is [FEAT-011](../FEAT-011-visibility-and-confidential-meetings/feature.md)’s, released in the same version; these files refer to [FR-011-004](../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-004-task-project-visibility.md) instead of restating it.

| ID | Requirement | Part | Delivery |
|---|---|---|---|
| [FR-010-001](requirements/FR-010-001-create-task-from-title.md) | Create a task from a title alone | FEAT-010-P01 | implemented |
| [FR-010-002](requirements/FR-010-002-task-contexts.md) | Contexts of a task | FEAT-010-P01 | implemented |
| [FR-010-003](requirements/FR-010-003-projects.md) | Projects | FEAT-010-P01 | implemented |
| [FR-010-004](requirements/FR-010-004-project-label-link.md) | Linking a project label to a project | FEAT-010-P01 | implemented |
| [FR-010-005](requirements/FR-010-005-boards.md) | Boards for all work, a campaign, a project, a team, unlinked work and my tasks | FEAT-010-P01 | implemented |
| [FR-010-006](requirements/FR-010-006-move-task-status.md) | Moving a task through the five statuses | FEAT-010-P01 | implemented |
| [FR-010-007](requirements/FR-010-007-completion-rule.md) | Completion rule | FEAT-010-P01 | implemented |
| [FR-010-008](requirements/FR-010-008-owner-label.md) | Owner label until a Member is bound | FEAT-010-P01 | implemented |
| [FR-010-009](requirements/FR-010-009-task-api-create-update.md) | Task API — idempotent create and versioned update | FEAT-010-P01 | implemented |
| [FR-010-010](requirements/FR-010-010-task-api-rules-identity.md) | Task API — rules, identity and audience on the server | FEAT-010-P01 | implemented |
| [FR-010-011](requirements/FR-010-011-workspace-save-compatible.md) | The whole-workspace save stays compatible | FEAT-010-P01 | implemented |
| [FR-010-012](requirements/FR-010-012-campaign-task-details.md) | Campaign task details | FEAT-010-P02 | implemented |
| [FR-010-013](requirements/FR-010-013-workboard-as-view.md) | The Workboard as a view of the task records | FEAT-010-P02 | implemented |
| [FR-010-014](requirements/FR-010-014-task-from-finding.md) | Create a task from a metric finding | FEAT-010-P02 | implemented |
| [FR-010-015](requirements/FR-010-015-campaign-tasks-projection.md) | campaign.tasks stays complete as a projection | FEAT-010-P02 | implemented |
| [FR-010-016](requirements/FR-010-016-move-workboard-tasks.md) | Moving the existing Workboard tasks | FEAT-010-P02 | implemented |
| [FR-010-017](requirements/FR-010-017-weekly-seed.md) | Weekly seed of 28 September – 4 October 2026 | FEAT-010-P01 | implemented |
| [FR-010-018](requirements/FR-010-018-raci-rules.md) | RACI rules — one R, one A, Members only | FEAT-010-P01 | implemented |
| [FR-010-019](requirements/FR-010-019-assign-by-member.md) | Assigning people to a task by Member | FEAT-010-P01 | implemented |
| [FR-010-020](requirements/FR-010-020-moscow-values.md) | One MoSCoW scale | FEAT-010-P01 | implemented |
| [FR-010-021](requirements/FR-010-021-priority-views-wont.md) | Priority views and the Won’t shelf | FEAT-010-P01 | implemented |
| [FR-010-022](requirements/FR-010-022-priority-per-week.md) | Priority per week and carry-over | FEAT-010-P01 | implemented |
| [FR-010-023](requirements/FR-010-023-details-priority-persistence.md) | Details and priority survive a backup and restore | FEAT-010-P01 | implemented |
| [NFR-010-001](requirements/NFR-010-001-row-level-security-new-tables.md) | Row-level security covers the new task tables | FEAT-010-P01 | implemented |
| [NFR-010-002](requirements/NFR-010-002-additive-schema.md) | The schema change is additive and reconcilable | FEAT-010-P01 | implemented |

The ten proposals of the earlier draft map to these files: create from a title (001), contexts (002), projects (003, 004), boards (005), moving and the blocked reason (006), completion (007), owner text (008), the campaign Workboard and finding (012–015), the API (009–011) and the move of existing Workboard tasks (016). The requirements of [FEAT-004](../FEAT-004-meeting-task-manager/feature.md) that the approved split gives to this feature map to the later files: MT-02 to 017, MT-04 to 018, MT-21 to 019, MT-26 to 020, MT-27 to 021, MT-28 to 022 and MT-29 to 023; each file names its origin in its notes, and the MT numbers are not IDs.

## Delivery evidence
- Local only (2026-10-01): migration 007 applied to the local database after a backup (counts reconciled); `npm test` passed end to end (140 Node tests, Python packaging, metrics and extraction checks, 54 packaged files) and `npm run build` passed. The UI passed an independent verify gate after two fixes; a browser check on the local server (operator) showed the “Task Manager” and “Meetings” menu, the Boards view with its five lanes and the Projects view with its form, with no console errors. Not browser-checked: drag and drop, the task editor's saves, Guest and Member sessions (hosted only). Production was unchanged at that point (schema 5).
- Released to production (2026-10-01, 0.5.0, code commit `7bb538c`): production backed up, then migrated from schema 5 to schema 7 (migrations 006 and 007; every pre-existing table kept its row count) and the new deployment promoted to https://zuri-metrics-map.vercel.app/. Hosted Guest checks passed: no task is visible to a Guest (production tasks are all `business`), and Guest task, project and meeting-commit writes answer 401. The Workboard backfill dry run on schema 7 found 0 Workboard tasks, so nothing was moved (FR-010-016). Not run: Member checks on the hosted site (creating a task and a project, the 12 existing tasks with RACI, MoSCoW and attachments), which need the owner's Member code, and browser checks on production. Record: [verification](../../releases/0.5.0/verification.md).
- Requirements written from FEAT-004 (2026-10-01, documentation only): FR-010-017…023 cover MT-02, 04, 21, 26, 27, 28 and 29. Their delivery is `implemented` because the [FEAT-004 verification](../FEAT-004-meeting-task-manager/verification.md) marks those rows PASS and the current code still behaves that way: `seedWorkspace`, `saveTask`, `setPriority`, `weeklySummary` and `validateState` in `apps/web/src/content/meeting/model.mjs` and the weekly views in `MeetingWorkspace.jsx` were read, `seedWorkspace` and `setPriority` were run directly, and the pure model suite (36 tests) and `task-rules` suite (8 tests) passed. Not run for this record: the PostgreSQL tests, browser checks, and any check on production. Two limits are stated in the files: only the browser workspace applies the weekly seed when it opens (FR-010-017), and a backup cannot be restored over a populated PostgreSQL workspace (FR-010-023).

## Notes
- Proposed split of [FEAT-004](../FEAT-004-meeting-task-manager/feature.md): this feature would carry its task-manager requirements, and its meeting intake would move to DOM-MTG. The plan, which moves and renumbers nothing, is in the FEAT-004 feature file ([PLAN-002](../../governance/plans/PLAN-002-task-and-meeting-domains.md) WI-12), and was approved on 2026-10-01; FR-010-017…023 are the task requirements it marked “to write”. Meeting intake goes to a DOM-MTG feature, written separately.
