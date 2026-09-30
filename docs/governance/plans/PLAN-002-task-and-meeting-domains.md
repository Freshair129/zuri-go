---
id: PLAN-002
title: Task and meeting domains for every department
status: proposed
owner: governance
relations:
  relates_to: [ADR-002, ADR-003, ADR-004, FEAT-004, FEAT-010, FEAT-011]
---

# PLAN-002 — Task and meeting domains for every department

Delivery plan for [ADR-002, ADR-003 and ADR-004](../../architecture/decisions.md): a Task Manager for every department ([FEAT-010](../../features/FEAT-010-task-manager/feature.md)) and visibility with confidential meetings ([FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md)). ADR-004, FEAT-011, its requirements and SDD-011 were approved on 2026-10-01, and P1 has started; ADR-002 and ADR-003 are still proposed. Each phase starts only after the owner approves its ADRs and FR files. This document changes no application code, schema or data.

## Interim rule — applies now

Until phase P1 is live in production, do not record HR, accounting, salaries, customers' personal data or any other confidential matter in production tasks, meetings, attachments or campaign records. Guests can read the whole production workspace (ADR-004, Context).

## Phases

| Phase | Scope | Done when | C / risk |
|---|---|---|---|
| P0 — Decisions | ADR-002 to ADR-004, DOM-TSK, DOM-MTG, FEAT-010 and FEAT-011 as proposed documents (this change) | The owner approves or amends the ADRs (Q1–Q5 answered 2026-10-01) | C-2 / LOW |
| P1 — Visibility (FEAT-011) | Teams and a Business admin; visibility and named viewers on tasks and meetings; Guests read public items only, on every read path; row-level security viewer check; existing rows default to `business` | Tests for every read path and every viewer kind pass locally and against the hosted API; release record written | C-3 / HIGH |
| P2 — Task Manager (FEAT-010) | Projects; contexts; campaign task details; task API and deployment allowlist; boards for all work, campaign, project, team, unlinked work and “my tasks”; Projects view; the Workboard as a view | Model, API and database tests pass; browser checks run with approved tools, or are reported as not run | C-3 / HIGH |
| P3 — Meetings | Participants; confidential meetings; transcripts kept local by default; meeting commit moved to the server, with tasks inheriting the meeting's audience | A restricted transcript is never served outside its audience; a replayed commit returns the same tasks | C-3 / HIGH |
| P4 — Workboard consolidation | Count the campaign tasks in production; dry run; owner authorization; backfill; reconciliation; projection | Counts per campaign and status equal the dry run; stored snapshots unchanged; attachments still resolve | C-3 / HIGH |
| P5 — Release 0.5.0 | Build, tests, authorized deployment, hosted checks for each viewer kind, `docs/releases/0.5.0/` | The checks actually run are recorded, and the ones not run are named | C-2 / HIGH |

P1 comes first because tasks and meetings from HR and accounting must not become publicly readable. Each phase that changes the schema or production data is a separate authorization (AGENTS.md).

## Work items

| ID | Work item | Phase | Note |
|---|---|---|---|
| WI-01 | FR / AC files for FEAT-011; SDD-011 with `## Interfaces` | P1 | FR-011-001…012 and NFR-011-001 approved by the owner 2026-10-01; [SDD-011](../../features/FEAT-011-visibility-and-confidential-meetings/design.md) approved by the owner 2026-10-01 |
| WI-02 | Migration: teams, team members, admin flag, visibility, task viewers, meeting participants, row-level security viewer policies | P1 | `006_visibility.sql`; applied locally 2026-10-01 after a backup (counts reconciled); production not migrated |
| WI-03 | Viewer-aware reads: `/state`, `/overview`, `/workspace`, attachments, history, AI-summary input, backups | P1 | Built locally 2026-10-01; `apps/api/test/visibility-db.test.mjs` covers all five viewer kinds |
| WI-04 | UI: visibility and team pickers, team management, a sign-in prompt for Guests where work is hidden | P1 | Built 2026-10-01 (`meeting/Visibility.jsx`); partly browser-checked locally — see FEAT-011 delivery evidence |
| WI-05 | FR / AC files for FEAT-010; SDD-010; API contract | P2 | FR-010-001…016, NFR-010-001/002 and SDD-010 (with the API contract) approved by the owner 2026-10-01 |
| WI-06 | Migration: projects; `project_id`, `team_id`, `owner_label`, `completion_rule` and `idempotency_key` on tasks; `campaign_task_details` | P2 | `007_tasks_projects.sql` (plus `project_viewers`; `team_id` exists since 006); applied locally 2026-10-01 after a backup, counts reconciled; production not migrated |
| WI-07 | Task API, shared task rules, deployment allowlist | P2 | Built locally 2026-10-01: `tasks.mjs`, `projects.mjs`, `campaign-tasks.mjs`, `shared/task-rules.mjs`; allowlist 54 files |
| WI-08 | Boards, Projects view, context pickers, Workboard as a view | P2 | Built 2026-10-01 (`meeting/Boards.jsx`, Workboard five lanes, “Task Manager” / “Meetings” menu); passed a verify gate; partly browser-checked locally |
| WI-09 | Meeting participants, confidential meetings, transcript custody, server-side meeting commit | P3 | FR-011-009/010 built locally 2026-10-01 (stubs, audited upload); server-side commit designed as a proposed amendment to SDD-004, not built |
| WI-10 | Workboard backfill | P4 | Owner authorization for production |
| WI-11 | ARCH-002 amendment; PRD-001, BRD-001 and AGENTS.md updates | After approval | Done 2026-10-01 for ADR-004 / FEAT-011 (schema 6 local only); ADR-002/003 parts wait for their approval |
| WI-12 | FEAT-004 split: FEAT-010 carries the task requirements, and meeting intake moves to DOM-MTG | With WI-05 | Proposed split plan in FEAT-004 `feature.md` (2026-10-01); no file or ID moved |

## Execution DAG

State after the parallel run of 2026-10-01 (four Sonnet tracks, each accepted by an independent Sonnet verify gate, then integrated and re-tested).

```
done ─ P0 decisions ─ P1 visibility (local, schema 6) ─┬─ P3 FR-011-009/010 (local) ────────────┐
                                                       ├─ WI-09 server-side commit (proposed) ──┤
                                                       ├─ WI-05/12 FEAT-010 docs (proposed) ────┼─→ owner review
                                                       └─ WI-11 ARCH/PRD/BRD/AGENTS ────────────┘
owner ─ approve ADR-002/003 + FR-010 ─→ P2 code (WI-06..08) ─→ P4 backfill (WI-10, prod authorization)
owner ─ approve WI-09 design ─→ P3 server-side commit (FEAT-004 change)
owner ─ authorize production migration 006 + deploy ─→ P5 release 0.5.0 (hosted checks per viewer kind)
```

Nothing runs in production until P5; the interim rule above still applies.

## Decisions needed

Q1–Q5 were answered by the owner on 2026-10-01, as recommended. ADR-004 was approved the same day. ADR-002, ADR-003, FEAT-010, its requirements and SDD-010 were approved later on 2026-10-01, with Q6–Q11 as recommended and part of Q16; Q12 is asked again at P4.

| # | Question | Recommendation |
|---|---|---|
| Q1 | What does a Guest see once P1 is live? | **Decided (owner, 2026-10-01):** public items only; the same levels later apply to campaign records and Member profiles |
| Q2 | Default visibility of new tasks, projects and meetings | **Decided (owner, 2026-10-01):** `business` (signed-in Members) |
| Q3 | Who is the Business admin, managing teams? | **Decided (owner, 2026-10-01):** the owner's own Member, to start |
| Q4 | May a confidential meeting's transcript ever be uploaded to the cloud? | **Decided (owner, 2026-10-01):** not by default; only as an explicit, audited choice |
| Q5 | Visibility of the 11 tasks already in production | **Decided (owner, 2026-10-01):** `business` — Guests no longer see them (applied in P1, not before) |
| Q6 | Can a task belong to a campaign and a project at once? | **Decided (owner, 2026-10-01):** yes (ADR-003 D2) |
| Q7 | Must a campaign task have a due date before Done? | **Decided (owner, 2026-10-01):** yes for tasks with a campaign context, as FEAT-002 AC-13 requires today |
| Q8 | Workboard Backlog and Ready | **Decided (owner, 2026-10-01):** map to `planned`, with the original status shown as a badge |
| Q9 | Names in the site menu | **Decided (owner, 2026-10-01):** “Task Manager” and “Meetings” |
| Q10 | Drag to reorder cards within a lane | **Decided (owner, 2026-10-01):** later |
| Q11 | Domain codes DOM-TSK and DOM-MTG | **Decided (owner, 2026-10-01):** adopt; they freeze once adopted |
| Q12 | Production backfill of Workboard tasks (P4) | Asked again at P4, with the dry-run report |
| Q13 | Do evidence quotes kept inside a task's `sourceRefs`, and meeting text copied into a task description, count as transcript under FR-011-010? | Today they are withheld only from readers who cannot read the meeting; WI-09 proposes keeping quotes only in `meeting_task_links` |
| Q14 | When a restricted meeting is widened, does its transcript custody return to `cloud` automatically? | No — stays `local_only` until an explicit, audited upload |
| Q15 | The WI-09 open questions (update/link of existing tasks, `team` meetings, viewer snapshot, quote spans, who may commit, release staging) | See the proposed amendment at the end of SDD-004 |
| Q16 | FEAT-010 open items (people named on a project, project progress, “my tasks”, blocked Workboard tasks without blocker text) | **Decided (owner, 2026-10-01):** a project’s owner and its listed viewers are named on it, and a project must have an owner; “my tasks” are those whose R or A is the Member. The remaining items are P2 defaults in SDD-010 “Decisions”, for confirmation |
