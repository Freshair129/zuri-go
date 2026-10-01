---
id: PLAN-002
title: Task and meeting domains for every department
status: proposed
owner: governance
relations:
  relates_to: [ADR-002, ADR-003, ADR-004, FEAT-004, FEAT-010, FEAT-011]
---

# PLAN-002 — Task and meeting domains for every department

Delivery plan for [ADR-002, ADR-003 and ADR-004](../../architecture/decisions.md): a Task Manager for every department ([FEAT-010](../../features/FEAT-010-task-manager/feature.md)) and visibility with confidential meetings ([FEAT-011](../../features/FEAT-011-visibility-and-confidential-meetings/feature.md)). All three ADRs, FEAT-010, FEAT-011, their requirements and SDD-010 and SDD-011 were approved on 2026-10-01, and phases P1 to P5 were delivered the same day: release 0.5.0 is live in production ([verification record](../../releases/0.5.0/verification.md)). Each phase started only after the owner approved its ADRs and FR files. This document changes no application code, schema or data; what remains is listed under “Final state”.

## Interim rule — ended for tasks and meetings on 2026-10-01

The rule was: until phase P1 is live in production, do not record HR, accounting, salaries, customers' personal data or any other confidential matter in production tasks, meetings, attachments or campaign records, because Guests could read the whole production workspace (ADR-004, Context).

Release 0.5.0 (2026-10-01) ended it for **tasks and meetings**: every read resolves a viewer, Guests read public items only, and production tasks are all `business`, so Guests see no task and no meeting; Guest writes answer 401 ([verification](../../releases/0.5.0/verification.md)). It still stands, in narrower form, for **Member profiles and campaign records**, which Guests still read because Q1 defers those levels: keep HR, accounting, salary and customers' personal data out of them. The owner's hosted Member, participant and Business-admin checks are not yet done, so treat a first confidential meeting as the first check of the restricted path.

## Phases

| Phase | Scope | Done when | C / risk |
|---|---|---|---|
| P0 — Decisions | ADR-002 to ADR-004, DOM-TSK, DOM-MTG, FEAT-010 and FEAT-011 as proposed documents (this change) | The owner approves or amends the ADRs (Q1–Q5 answered 2026-10-01) | C-2 / LOW |
| P1 — Visibility (FEAT-011) | Teams and a Business admin; visibility and named viewers on tasks and meetings; Guests read public items only, on every read path; row-level security viewer check; existing rows default to `business` | Tests for every read path and every viewer kind pass locally and against the hosted API; release record written | C-3 / HIGH |
| P2 — Task Manager (FEAT-010) | Projects; contexts; campaign task details; task API and deployment allowlist; boards for all work, campaign, project, team, unlinked work and “my tasks”; Projects view; the Workboard as a view | Model, API and database tests pass; browser checks run with approved tools, or are reported as not run | C-3 / HIGH |
| P3 — Meetings | Participants; confidential meetings; transcripts kept local by default; meeting commit moved to the server, with tasks inheriting the meeting's audience | A restricted transcript is never served outside its audience; a replayed commit returns the same tasks | C-3 / HIGH |
| P4 — Workboard consolidation | Count the campaign tasks in production; dry run; owner authorization; backfill; reconciliation; projection | Counts per campaign and status equal the dry run; stored snapshots unchanged; attachments still resolve | C-3 / HIGH |
| P5 — Release 0.5.0 | Build, tests, authorized deployment, hosted checks for each viewer kind, `docs/releases/0.5.0/` | The checks actually run are recorded, and the ones not run are named | C-2 / HIGH |

State on 2026-10-01: P0 to P4 are done. **P5 is done** — 0.5.0 was released to production the same day ([record](../../releases/0.5.0/verification.md)) — with the hosted Member, participant and Business-admin checks and the browser checks recorded there as not run; the Business-admin flag was set for the owner's Member after the release (Q3).

P1 comes first because tasks and meetings from HR and accounting must not become publicly readable. Each phase that changes the schema or production data is a separate authorization (AGENTS.md).

## Work items

| ID | Work item | Phase | Note |
|---|---|---|---|
| WI-01 | FR / AC files for FEAT-011; SDD-011 with `## Interfaces` | P1 | FR-011-001…012 and NFR-011-001 approved by the owner 2026-10-01; [SDD-011](../../features/FEAT-011-visibility-and-confidential-meetings/design.md) approved by the owner 2026-10-01 |
| WI-02 | Migration: teams, team members, admin flag, visibility, task viewers, meeting participants, row-level security viewer policies | P1 | `006_visibility.sql`; applied locally 2026-10-01 after a backup (counts reconciled); **production migrated 2026-10-01** (schema 5 to 7, every pre-existing table count unchanged; [verification](../../releases/0.5.0/verification.md)) |
| WI-03 | Viewer-aware reads: `/state`, `/overview`, `/workspace`, attachments, history, AI-summary input, backups | P1 | Built 2026-10-01; `apps/api/test/visibility-db.test.mjs` covers all five viewer kinds; released 2026-10-01 (0.5.0), hosted Guest reads checked |
| WI-04 | UI: visibility and team pickers, team management, a sign-in prompt for Guests where work is hidden | P1 | Built 2026-10-01 (`meeting/Visibility.jsx`) and released with 0.5.0; partly browser-checked locally, not on production — see FEAT-011 delivery evidence |
| WI-05 | FR / AC files for FEAT-010; SDD-010; API contract | P2 | FR-010-001…016, NFR-010-001/002 and SDD-010 (with the API contract) approved by the owner 2026-10-01 |
| WI-06 | Migration: projects; `project_id`, `team_id`, `owner_label`, `completion_rule` and `idempotency_key` on tasks; `campaign_task_details` | P2 | `007_tasks_projects.sql` (plus `project_viewers`; `team_id` exists since 006); applied locally 2026-10-01 after a backup, counts reconciled; **production migrated 2026-10-01** together with 006 ([verification](../../releases/0.5.0/verification.md)) |
| WI-07 | Task API, shared task rules, deployment allowlist | P2 | Built 2026-10-01: `tasks.mjs`, `projects.mjs`, `campaign-tasks.mjs`, `shared/task-rules.mjs`; released with 0.5.0 (the `tasks` and `projects` routes answer on production; 55 packaged files) |
| WI-08 | Boards, Projects view, context pickers, Workboard as a view | P2 | Built 2026-10-01 (`meeting/Boards.jsx`, Workboard five lanes, “Task Manager” / “Meetings” menu); passed a verify gate; partly browser-checked locally; released with 0.5.0, not browser-checked on production |
| WI-09 | Meeting participants, confidential meetings, transcript custody, server-side meeting commit | P3 | FR-011-009/010 built 2026-10-01 (stubs, audited upload); the server-side commit amendment to SDD-004 approved 2026-10-01 (Q15), **built and released** with 0.5.0 (`POST /businesses/{b}/meeting-commits`; production held 0 meetings, so one release; [verification](../../releases/0.5.0/verification.md)) |
| WI-10 | Workboard backfill | P4 | `backfill-workboard.mjs` built and rehearsed 2026-10-01; read-only dry runs found 0 Workboard tasks in production and locally, so nothing is moved; **dry run repeated on production schema 7 after the migration on 2026-10-01: 0**, nothing written |
| WI-11 | ARCH-002 amendment; PRD-001, BRD-001 and AGENTS.md updates | After approval | Done 2026-10-01 for ADR-004 / FEAT-011 and ADR-002/003 / FEAT-010, and updated again for the release (production on schema 7; [verification](../../releases/0.5.0/verification.md)) |
| WI-12 | FEAT-004 split: FEAT-010 carries the task requirements, and meeting intake moves to DOM-MTG | With WI-05 | Split plan approved 2026-10-01 (delegated by the owner). Written and approved by the owner 2026-10-01: FEAT-012 Meeting intake (DOM-MTG, FR-012-001…010, NFR-012-001), FR-010-017…023 and FR-006-001…008; FEAT-004 keeps MT-14 and MT-17 and points each MT row to its new file; no file or ID moved |

## Final state

State after release 0.5.0 (2026-10-01, Bangkok). Production runs application 0.5.0 on PostgreSQL schema 7; the new deployment was promoted to https://zuri-metrics-map.vercel.app/ from code commit `7bb538c` (deployment ID in the record). Record: [verification](../../releases/0.5.0/verification.md), with the stage, production and database-preservation JSON beside it.

**Done**

- The Business-admin flag set for the owner's Member (Q3), after the release, on 2026-10-01.
- P0 decisions; P1 visibility (WI-01 to WI-04); P2 Task Manager (WI-05 to WI-08); P3 meetings (WI-09, including the server-side meeting commit); P4 Workboard tool (WI-10, dry run repeated on schema 7: 0 Workboard tasks, nothing moved); P5 release (production backup, staged deployment, migrations 006 and 007, hosted Guest checks on the unique deployment and on the public URL, promotion).
- WI-11 documentation updates for the release.
- The owner's hosted checks as a Member and as Business admin, reported passed by the owner on 2026-10-01 after the 0.5.1 follow-up deployment ([record](../../releases/0.5.1/verification.md#owners-hosted-checks-2026-10-01)); browser checks as a Guest and as the local operator ran the same day.

**Remains**

- The design gaps of the WI-12 requirement files were decided on 2026-10-01 (see “Design gaps decided” below); the code changes they need (D2, D3, D4, D6, D12, D14, D16) were built on 2026-10-01 and released as 0.5.1 ([record](../../releases/0.5.1/verification.md)).
- Browser checks that write (drag and drop, editor saves) and of a restricted meeting. The restore drill of the pre-release backup was done on 2026-10-01 ([record](../../releases/0.5.0/restore-drill.md)); the rest is tracked in [PLAN-003](PLAN-003-remaining-work.md).
- Q1 follow-up: the same levels for campaign records and Member contact details — designed and approved on 2026-10-01 as ADR-005 (PLAN-003 V1); not built.

**Rollback.** There is no down-migration. The fallback chosen is to fix forward on schema 7; code from before 0.5.0 on schema 7 reads as a Guest and shows no business work.

## Design gaps decided (2026-10-01)

The owner asked for the gaps recorded in the WI-12 requirement files to be decided as recommended. D-numbers are local to this list.

| # | Gap | Decision | Code |
|---|---|---|---|
| D1 | The meeting commit writes tasks through `writeDomain`, not the per-task create of FR-010-009 (ADR-002 D2, AC-010-009-05) | Accepted: the in-process call applies the same task rules, audit and single transaction, and counts as the task domain's contract | None |
| D2 | The API does not refuse an Inactive Member; an Inactive participant blocks a restricted meeting's commit (422) | The server refuses naming an Inactive Member in a new R, A, C or I role and keeps a role the task already had; named viewers and meeting participants may be Inactive (access, not work) | Yes |
| D3 | Any Member may add Members and change anyone's record or status | Adding a Member and changing any status need the Business admin or the operator; a Member may edit their own details but not their own status; another Member's record needs the admin | Yes |
| D4 | A meeting commit needs a connected FUNG | With a server workspace the commit is allowed without FUNG; the server checks the stored hashes and the screen says the FUNG comparison was skipped | Yes |
| D5 | R and A may be the same Member | Allowed, as today | None |
| D6 | Stale screen text (Members stored “on this machine”, a Member save reported as a task save, the commit note) | Corrected | Yes |
| D7 | A restore into an empty Business assigns new PIDs and restores no credentials | Intended: a restore is not an identity migration | None |
| D8 | PostgreSQL Businesses are never seeded with the weekly seed | Intended; the seed stays a browser-workspace start | None |
| D9 | Restore over a populated PostgreSQL workspace is unsupported | Stays unsupported | None |
| D10 | No per-task operation for weekly MoSCoW | Later; the workspace save and the meeting commit remain the paths | None |
| D11 | RACI confirmation is stored differently by the task API and the workspace save | Unchanged; only the A confirmation is read | None |
| D12 | A history event is written when a weekly priority does not change | No event when priority and note are unchanged | Yes |
| D13 | Campaign owner text binds to a Member by a unique exact name | Unchanged: it is the campaign owner, not the task owner text of FR-010-008 | None |
| D14 | Task history events store evidence quotes in `change_events` | New events store no quote whose evidence lives in `meeting_task_links`; older events stay withheld on read | Yes |
| D15 | FUNG status screens are narrower than MT-06, MT-07, MT-09 and MT-11 describe | Unchanged for now | None |
| D16 | Guests read Member contact details (email, phone, notes) in production | Guests read only a Member's ID, PID, display name and status | Yes |

The code was released as 0.5.1 on 2026-10-01. The acceptance criteria added to the requirement files for these decisions were approved by the owner the same day; AC-006-003-02 is superseded for named viewers by AC-006-003-06, and the notice text of AC-006-008-04 by AC-006-008-05.

## Decisions needed

Q1–Q5 were answered by the owner on 2026-10-01, as recommended. ADR-004 was approved the same day. ADR-002, ADR-003, FEAT-010, its requirements and SDD-010 were approved later on 2026-10-01, with Q6–Q11 as recommended and part of Q16; Q12 is asked again at P4. The owner delegated the remaining questions (Q13–Q16) and WI-12 on 2026-10-01, and they were decided as recommended; the production backup, migration and deployment of P5 were authorized by the owner on 2026-10-01 and carried out the same day.

| # | Question | Recommendation |
|---|---|---|
| Q1 | What does a Guest see once P1 is live? | **Decided (owner, 2026-10-01):** public items only; the same levels later apply to campaign records and Member profiles. Released for tasks and meetings on 2026-10-01; Member profiles and campaign records are still Guest-readable |
| Q2 | Default visibility of new tasks, projects and meetings | **Decided (owner, 2026-10-01):** `business` (signed-in Members) |
| Q3 | Who is the Business admin, managing teams? | **Decided (owner, 2026-10-01):** the owner's own Member, to start. Granted in production after the release on 2026-10-01 (`npm run members -- --admin <PID> --cloud`, one audit event, no credential changed; [verification](../../releases/0.5.0/verification.md)) |
| Q4 | May a confidential meeting's transcript ever be uploaded to the cloud? | **Decided (owner, 2026-10-01):** not by default; only as an explicit, audited choice |
| Q5 | Visibility of the 11 tasks already in production | **Decided (owner, 2026-10-01):** `business` — Guests no longer see them (applied in P1, not before). Applied to production on 2026-10-01: it held 12 tasks, all `business` |
| Q6 | Can a task belong to a campaign and a project at once? | **Decided (owner, 2026-10-01):** yes (ADR-003 D2) |
| Q7 | Must a campaign task have a due date before Done? | **Decided (owner, 2026-10-01):** yes for tasks with a campaign context, as FEAT-002 AC-13 requires today |
| Q8 | Workboard Backlog and Ready | **Decided (owner, 2026-10-01):** map to `planned`, with the original status shown as a badge |
| Q9 | Names in the site menu | **Decided (owner, 2026-10-01):** “Task Manager” and “Meetings” |
| Q10 | Drag to reorder cards within a lane | **Decided (owner, 2026-10-01):** later |
| Q11 | Domain codes DOM-TSK and DOM-MTG | **Decided (owner, 2026-10-01):** adopt; they freeze once adopted |
| Q12 | Production backfill of Workboard tasks (P4) | Dry run 2026-10-01: production holds 0 Workboard tasks, so no backfill is needed now; repeated on schema 7 after the migration (0); asked again only if a later dry run finds some |
| Q13 | Do evidence quotes kept inside a task's `sourceRefs`, and meeting text copied into a task description, count as transcript under FR-011-010? | **Decided (delegated by the owner, 2026-10-01):** evidence quotes are transcript: they are kept only in `meeting_task_links` and follow the meeting (WI-09); tasks written before WI-09 keep them inline, withheld from readers who cannot read the meeting. Text a person writes or copies into a task's title or description is task content: it follows the task's audience, which for a restricted meeting is its participants (FR-011-009), not transcript custody |
| Q14 | When a restricted meeting is widened, does its transcript custody return to `cloud` automatically? | **Decided (delegated by the owner, 2026-10-01):** no — it stays `local_only` until an explicit, audited upload, as built in P3 |
| Q15 | The WI-09 open questions (update/link of existing tasks, `team` meetings, viewer snapshot, quote spans, who may commit, release staging) | **Decided (owner, 2026-10-01):** as recommended — see “Decisions” in the SDD-004 amendment, which the owner approved the same day |
| Q16 | FEAT-010 open items (people named on a project, project progress, “my tasks”, blocked Workboard tasks without blocker text) | **Decided (owner, 2026-10-01):** a project’s owner and its listed viewers are named on it, and a project must have an owner; “my tasks” are those whose R or A is the Member. The P2 defaults in SDD-010 “Decisions” were confirmed the same day (delegated by the owner) |
