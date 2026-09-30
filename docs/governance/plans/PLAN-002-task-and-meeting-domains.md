---
id: PLAN-002
title: Task and meeting domains for every department
status: proposed
owner: governance
relations:
  relates_to: [ADR-002, ADR-003, ADR-004, FEAT-004, FEAT-010, FEAT-011]
---

# PLAN-002 — Task and meeting domains for every department

Delivery plan for [ADR-002, ADR-003 and ADR-004](../../architecture/decisions.md): a Task Manager for every department ([FEAT-010](../../features/FEAT-010-task-manager/feature.md)) and visibility with confidential meetings ([FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md)). Nothing here is approved. Each phase starts only after the owner approves the ADRs and the phase's FR files. This document changes no application code, schema or data.

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
| WI-01 | FR / AC files for FEAT-011; SDD-011 with `## Interfaces` | P1 | FR-011-001…012 and NFR-011-001 approved by the owner 2026-10-01; SDD-011 in progress |
| WI-02 | Migration: teams, team members, admin flag, visibility, task viewers, meeting participants, row-level security viewer policies | P1 | Additive; existing rows readable by Members |
| WI-03 | Viewer-aware reads: `/state`, `/overview`, `/workspace`, attachments, history, AI-summary input, backups | P1 | Test each read as Guest, Member outside the team, team Member, named person and local operator |
| WI-04 | UI: visibility and team pickers, team management, a sign-in prompt for Guests where work is hidden | P1 | Data App authored content only |
| WI-05 | FR / AC files for FEAT-010; SDD-010; API contract | P2 | |
| WI-06 | Migration: projects; `project_id`, `team_id`, `owner_label`, `completion_rule` and `idempotency_key` on tasks; `campaign_task_details` | P2 | Additive |
| WI-07 | Task API, shared task rules, deployment allowlist | P2 | `scripts/deploy/build_cloud.py:25` |
| WI-08 | Boards, Projects view, context pickers, Workboard as a view | P2 | |
| WI-09 | Meeting participants, confidential meetings, transcript custody, server-side meeting commit | P3 | Changes FEAT-004 and delivers FEAT-011 part P03 |
| WI-10 | Workboard backfill | P4 | Owner authorization for production |
| WI-11 | ARCH-002 amendment; PRD-001, BRD-001 and AGENTS.md updates | After approval | |
| WI-12 | FEAT-004 split: FEAT-010 carries the task requirements, and meeting intake moves to DOM-MTG | With WI-05 | STD-003 R7 “Part becomes its own feature” / ownership transfer |

## Decisions needed

Q1–Q5 were answered by the owner on 2026-10-01, as recommended. The ADRs themselves remain `proposed`; Q6–Q12 are still open.

| # | Question | Recommendation |
|---|---|---|
| Q1 | What does a Guest see once P1 is live? | **Decided (owner, 2026-10-01):** public items only; the same levels later apply to campaign records and Member profiles |
| Q2 | Default visibility of new tasks, projects and meetings | **Decided (owner, 2026-10-01):** `business` (signed-in Members) |
| Q3 | Who is the Business admin, managing teams? | **Decided (owner, 2026-10-01):** the owner's own Member, to start |
| Q4 | May a confidential meeting's transcript ever be uploaded to the cloud? | **Decided (owner, 2026-10-01):** not by default; only as an explicit, audited choice |
| Q5 | Visibility of the 11 tasks already in production | **Decided (owner, 2026-10-01):** `business` — Guests no longer see them (applied in P1, not before) |
| Q6 | Can a task belong to a campaign and a project at once? | Yes (ADR-003 D2) |
| Q7 | Must a campaign task have a due date before Done? | Yes for tasks with a campaign context, as FEAT-002 AC-13 requires today |
| Q8 | Workboard Backlog and Ready | Map to `planned`, with the original status shown as a badge |
| Q9 | Names in the site menu | “Task Manager” and “Meetings” |
| Q10 | Drag to reorder cards within a lane | Later |
| Q11 | Domain codes DOM-TSK and DOM-MTG | Adopt; they freeze once adopted |
| Q12 | Production backfill of Workboard tasks (P4) | Asked again at P4, with the dry-run report |
