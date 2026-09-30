# Architecture decisions

System-level ADRs ([STD-003 R1](../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)); governance ADRs are in [governance/decisions.md](../governance/decisions.md). Each ADR is declared by its heading ([STD-002 R2](../governance/standards/STD-002-IDENTITY-AND-TRACEABILITY.md)). Open questions are numbered in [PLAN-002](../governance/plans/PLAN-002-task-and-meeting-domains.md) (“Decisions needed”).

### ADR-002 — Split DOM-WRK into two domains for every department: DOM-TSK (tasks and projects) and DOM-MTG (meetings)
Relations: relates_to: ADR-001, ADR-003, ADR-004, FEAT-004, FEAT-010, FEAT-011, PLAN-002

**Status:** approved — by the owner, 2026-10-01. **Date:** 2026-10-01. **Complexity / risk:** C-3 / HIGH for the delivery it leads to; this change is documentation only.

**Context.**

- The owner asked for a Task manager domain on 2026-10-01: create, track and assign tasks; take the kanban out of the campaign; and let a task belong to a project or to other work, not only to a campaign.
- The owner then stated that every department — sales, production, accounting and HR — will use tasks and meetings, and that some meetings are confidential (2026-10-01).
- DOM-WRK “Work (tasks & meetings)” was proposed by ADR-001 D4 and has not been adopted.
- The meeting pipeline is already independent of campaigns. `meetings.campaign_id` is optional (`apps/api/migrations/001_core.sql:114`), and the Meetings screen never asks for a campaign (`apps/web/src/content/meeting/Meetings.jsx`). Only its place inside the marketing app makes it look like marketing.
- Two design proposals were written independently from one brief, by Opus 5.5 and Fable 5.1, and then compared ([evidence](../history/task-domain-design-2026-10-01/comparison.md)). Both put every task into one task domain; the Fable proposal also split meetings out.

**Decision.**

- **D1 — Two domains.** DOM-TSK “Tasks & projects” (slug `tasks`) and DOM-MTG “Meetings” (slug `meetings`) replace DOM-WRK. Both are `supporting` / `business` and serve every department; neither belongs to marketing. DOM-WRK is marked superseded, and its code is never reused (STD-002 R3). This amends ADR-001 D4; the other six domains are unchanged.
- **D2 — Data ownership.**
  - DOM-TSK owns `tasks`, `task_roles`, `weekly_plans`, `weekly_plan_tasks` and `task_attachments`, plus the planned `projects` and `task_viewers`.
  - DOM-MTG owns `meetings`, `meeting_revisions`, `meeting_draft_batches` and `meeting_task_links`, plus the planned `meeting_participants`.
  - A meeting creates tasks only through the task domain's contract.
- **D3 — Teams (ฝ่าย) belong to DOM-IAM.** The planned `teams` and `team_members` record who is in sales, production, accounting, HR or marketing. Both domains use teams to group and filter work and, under ADR-004, to decide who may see it.
- **D4 — Campaign semantics stay in DOM-CAM.** They go into the planned `campaign_task_details` (ADR-003); a campaign is one context of a task among others.
- **D5 — Feature ownership.**
  - FEAT-004 moves to DOM-TSK, because as delivered it is mostly the task manager. It stays provisionally cross-domain: its meeting intake writes DOM-MTG data and its Member registry writes DOM-IAM data.
  - FEAT-010 (Task Manager for every department, ADR-003) is owned by DOM-TSK.
  - FEAT-011 (visibility, teams and confidential meetings, ADR-004) is owned by DOM-IAM.
  - When FR files are written, FEAT-010 carries FEAT-004's task requirements, and FEAT-004's meeting intake moves to DOM-MTG ([PLAN-002](../governance/plans/PLAN-002-task-and-meeting-domains.md) WI-12).

**Alternatives considered.**

1. **One domain for tasks and meetings** (DOM-WRK, or DOM-TSK with meetings inside). Rejected: confidential meetings need their own audience and transcript-custody rules, and FUNG, transcripts and review revisions are a language of their own.
2. **Tasks kept inside each context** (campaign tasks in DOM-CAM, project tasks elsewhere). Rejected: two workflows, two assignment models and no board across departments.
3. **A Project domain (DOM-PRJ).** Deferred: today projects only group tasks. Revisit if budgets or milestones appear.
4. **An Organization domain for teams.** Deferred: teams exist for grouping and access, which DOM-IAM already owns.

**Consequences.**

- The registry gains DOM-TSK and DOM-MTG and marks DOM-WRK superseded, and the crosswalk records the split. Domain codes freeze once adopted, so confirm them when approving (PLAN-002 Q11).
- PLAN-001 WI-14 questions 1 and 7 get proposed answers: attachments are DOM-TSK data, and the Workboard becomes a view of the task records.

### ADR-003 — Every task is one record in DOM-TSK; campaign, project and team are contexts of a task
Relations: relates_to: ADR-002, ADR-004, FEAT-002, FEAT-004, FEAT-010, ARCH-002, PLAN-002

**Status:** approved — by the owner, 2026-10-01. **Date:** 2026-10-01. **Complexity / risk:** C-3 / HIGH (schema, API and a backfill of existing tasks).

**Context.**

- **Two task models.**
  - The campaign Workboard keeps its tasks in campaign JSON. Their statuses run Backlog → Ready → Doing → Blocked / Review → Done, and the owner is free text (`apps/web/src/content/shared/model.mjs:86-92`; [FEAT-002 spec](../features/FEAT-002-campaign-mission-control/spec.md) lines 253–255).
  - The Meeting & Task Manager uses RACI and a MoSCoW priority per week (`apps/web/src/content/meeting/model.mjs:26-56`).
- **Already one table.** In PostgreSQL both kinds live in `tasks`. Workboard tasks are rows with `source_kind='campaign-legacy'`, their JSON sits in `legacy_metadata`, and Backlog and Ready both become `planned` (`apps/api/workspace.mjs:20`, `:43`).
- **The approved architecture already intends this.**
  - It meant to move both kinds into canonical tasks and forbids guessing owners ([ARCH-001 §5](ARCH-001-baseline-architecture.md), steps 5 and 8).
  - It asks for a mapping manifest before legacy fields are migrated ([ARCH-001 §5](ARCH-001-baseline-architecture.md); [ARCH-002 §5.1](ARCH-002-postgresql-data-model.md)).
  - FEAT-004 left the Workboard tasks in place for its round ([FEAT-004 spec §4](../features/FEAT-004-meeting-task-manager/spec.md)).
- **No task endpoint.** Tasks are written by replacing the whole workspace (`apps/api/api.mjs:35-36`) under one Business-wide revision (`apps/api/workspace.mjs:83`).

**Decision.**

- **D1 — One record.** Every task of every department is one `tasks` row owned by DOM-TSK. The campaign Workboard, the weekly board and the department boards are all views of the same rows.
- **D2 — Contexts are typed links.** A task can link to the existing `campaign_id`, `content_item_id` and `goal_id`, plus the planned `project_id` and `team_id`.
  - It can carry several at once, such as a project and a campaign, or none (งานทั่วไป).
  - There is no polymorphic link table, so every relation keeps its composite foreign key.
  - A task's campaign, content item and goal must not contradict one another ([ARCH-002 §5.1](ARCH-002-postgresql-data-model.md)).
- **D3 — Project.** A new DOM-TSK entity with a code `PRJ-nnnn`, name, description, status `active | on_hold | done | archived`, owner Member, team, dates and visibility. `project_label` stays and is shown until a person links the task to a project; nothing is converted automatically.
- **D4 — Campaign-only fields.** The gate, offer, hypothesis, action, estimate, outcome, the Low/Medium/High priority and the original Workboard status move to `campaign_task_details`. DOM-CAM owns that table and writes it in the same transaction as the task, through the campaign's endpoint. Low/Medium/High is never converted to MoSCoW ([FEAT-004 spec](../features/FEAT-004-meeting-task-manager/spec.md), MoSCoW section).
- **D5 — Workflow.** The five statuses stay: `planned`, `doing`, `blocked`, `review` and `done`. A blocked task needs a blocker. Workboard Backlog and Ready map to `planned`, as they already do, and the board shows the original status as a badge.
- **D6 — Assignment.** RACI stays in `task_roles`. A Workboard owner written as text becomes `owner_label` and stays visible until a signed-in Member binds a person. Nothing is matched automatically ([ARCH-001 §5](ARCH-001-baseline-architecture.md), step 8; precedent in `005_member_identity.sql:22`).
- **D7 — Completion.**
  - A new completion needs R, a confirmed A, a confirmed acceptance criterion and evidence, plus a recheck date when a KPI or a campaign gate is named.
  - Tasks already Done under the Workboard rule (`shared/model.mjs:89-90`) carry a `completion_rule` marker and stay valid.
  - Whether campaign tasks still need a due date is PLAN-002 Q7.
- **D8 — Task API.**
  - Per-task endpoints: create with an idempotency key, update with `row_version`, status changes checked on the server, Guest 401 and the actor from the session.
  - New server modules join the deployment allowlist (`scripts/deploy/build_cloud.py:25`).
  - The whole-workspace PUT stays for compatibility and stops writing tasks once meeting commits run on the server.
- **D9 — Migration.**
  - The schema change is additive.
  - Workboard tasks are lifted by a reviewed backfill: a backup, a count of campaign tasks in production (never recorded, [ARCH-003](ARCH-003-hosted-deployment.md)), a dry run, a reconciliation per campaign and status, and an idempotent replay. `legacy_metadata` is left untouched.
  - `campaign.tasks` becomes a projection of the task rows, so campaign summaries, evidence snapshots and backups stay complete (`shared/model.mjs:233`, `:244`).
  - The production backfill needs the owner's specific authorization (PLAN-002 Q12).

**Alternatives considered.**

1. **Keep both models and add a merged read-only list.** Rejected: two workflows and the owner-as-text would remain.
2. **A polymorphic `task_links(target_type, target_id)` table.** Rejected: it cannot carry foreign keys.
3. **One home context per task** (a campaign or a project). Not chosen, because departments, projects and campaigns overlap in practice; the owner can still restrict it (PLAN-002 Q6).
4. **A new `backlog` status.** Rejected: it rewrites stored statuses and makes a code rollback unsafe, and the badge in D5 keeps the information.

**Consequences.**

- FEAT-010 is a cross-domain feature, with a DOM-TSK part and a DOM-CAM part.
- The FEAT-002 Workboard becomes a view delivered by FEAT-010's DOM-CAM part.
- Once FR files exist, FEAT-010 carries FEAT-004's task-manager requirements.
- ARCH-002 needs an amendment for the new schema.

### ADR-004 — Who may see tasks and meetings: visibility levels, confidential meetings and a public-only Guest view
Relations: relates_to: ADR-002, ADR-003, FEAT-005, FEAT-006, FEAT-011, PLAN-002

**Status:** approved — by the owner, 2026-10-01. **Date:** 2026-10-01. **Complexity / risk:** C-3 / HIGH (authorization and confidential data).

**Context.**

- Every department will use the workspace, and some meetings are confidential (owner, 2026-10-01).
- **Anyone can read production today.** Anyone can read the whole production workspace without signing in (FEAT-005). Non-GET requests need a Member session; GET requests do not (`apps/api/cloud.mjs:27`). The public reads include:
  - every table in the Business snapshot, Member contact fields among them (`apps/api/api.mjs:30`; `apps/api/service.mjs:7-10`);
  - the overview's overdue and blocked task rows (`api.mjs:31`; `apps/web/src/content/business/model.mjs:54`);
  - the workspace, with tasks, meetings, transcript segments and task history (`api.mjs:35`; `apps/api/workspace.mjs:20-28`);
  - the list and download of task attachments (FEAT-005).
- **No rule per person or team.** Row-level security separates Businesses only (`001_core.sql:166-176`).
- **Roles were deferred.** FEAT-006 left “granular Member roles” and “profile contact-data visibility redesign” out of scope ([FEAT-006 spec](../features/FEAT-006-member-identity/spec.md), “Out of scope”).
- **Production data today.** The latest record shows 1 campaign, 11 tasks and 4 Members, and no meetings ([member review](../history/zuri-go-member-review/verification.md); [ARCH-003](ARCH-003-hosted-deployment.md)). Nothing in the code stops a signed-in client from saving a transcript to production (`workspace.mjs:72-75`).

**Decision.**

- **D1 — Visibility levels** on tasks, projects and meetings:
  - `public`: anyone, Guests included;
  - `business`: signed-in Members of the Business;
  - `team`: Members of the item's team and the people named on it;
  - `restricted`: only the people named on it.
  - New items default to `business` (PLAN-002 Q2). A confidential meeting is `restricted`.
- **D2 — Named people.**
  - For tasks: R, A, C and I, plus the planned `task_viewers`.
  - For meetings: the planned `meeting_participants`, the organizer included.
  - A task created from a restricted meeting starts `restricted`, with the meeting's participants as viewers.
- **D3 — Guests see public items only.** Everything else requires a Member session. Guests get no titles or counts of items they cannot see.
- **D4 — Content follows its item.**
  - Transcript segments, evidence quotes, attachments and history entries inherit the visibility of their task or meeting.
  - The Business Overview, the AI-summary input, search, exports and backups contain only what the viewer may see.
  - Logs never contain content.
- **D5 — Transcript custody.**
  - A restricted meeting's transcript stays on the machine that recorded it by default. The cloud keeps the title, date, participants and the approved tasks and decisions.
  - Uploading such a transcript is an explicit, audited choice. The approved architecture already treats a transcript upload as sending content to a new destination ([ARCH-001 §5](ARCH-001-baseline-architecture.md)).
- **D6 — Enforced twice.**
  - The API filters every read path by the viewer.
  - Row-level security adds a viewer check: the member and the viewer kind are set per transaction, as `zuri_go.business_id` is today. One missed filter therefore cannot leak rows.
  - The trusted local operator (SRV-002) sees its whole database by definition, so a confidential meeting recorded on a machine is visible to whoever operates it.
- **D7 — Teams and a minimal admin.** Members belong to one or more teams, and a Business admin manages teams and their members (PLAN-002 Q3). Being admin does not grant reading restricted items.
- **D8 — Changing visibility.** Only the task's A or the meeting's organizer may widen visibility (for example `restricted` → `business`), with a reason, and the change is audited. Any editor may narrow it.
- **D9 — Interim rule.** Until FEAT-011 is live, do not record HR, accounting, salaries, customers' personal data or any confidential matter in production tasks, meetings, attachments or campaign records, because Guests can read them.

**Alternatives considered.**

1. **Turn Guest mode off, so reading needs sign-in.** Simplest and safest. Not chosen as the default only because Guest mode is an approved owner choice (FEAT-005); it stays open as PLAN-002 Q1.
2. **One Business per department.** Rejected: there would be no shared boards, and every foreign key is Business-scoped.
3. **Hide items in the UI only.** Rejected: the API would still serve them.
4. **Encrypt confidential transcripts.** Deferred; custody (D5) comes first.

**Consequences.**

- **FEAT-011 is cross-domain.**
  - DOM-IAM owns teams, the admin capability, viewer identity and the Guest rule.
  - DOM-TSK owns task and project visibility.
  - DOM-MTG owns meeting visibility, participants and transcript custody.
- **FEAT-005 is amended:** the Guest view narrows to public items. AGENTS.md (“Production opens in Guest mode, read-only”) stays true and is updated after approval.
- **Other public data is untouched for now.** Campaign records (orders, revenue, lead and customer IDs) and Member contact details are Guest-readable today too. This ADR does not change them; applying the same levels to them is part of PLAN-002 Q1.
- **Personal data in HR content.** HR content can include personal data about employees, so the owner decides retention and access in line with PDPA duties. This is a design note, not legal advice.
- **Tests.** Tests cover every read path for each viewer kind: Guest, a Member outside the team, a team Member, a named person and the local operator.
