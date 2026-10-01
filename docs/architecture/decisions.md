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

### ADR-005 — Who may see campaign records and Member profiles: the levels of ADR-004 applied to the rest of the Business
Relations: decided_by: ADR-004; relates_to: ADR-003, FEAT-002, FEAT-005, FEAT-006, FEAT-011, SDD-011, PLAN-002

**Status:** approved — by the owner, 2026-10-01, with Q-V1…Q-V9 answered as recommended ([PLAN-003](../governance/plans/PLAN-003-remaining-work.md) node V1, gate G2). Nothing in it is built, migrated or released yet, and it changes no approved text: it adds to ADR-004, whose Consequences deferred this step to PLAN-002 Q1. **Date:** 2026-10-01. **Complexity / risk:** C-3 / HIGH (authorization, customer-level business data and a schema change).

**Context.** Verified against the 0.5.1 code and migrations 001–007.

- **The owner's direction.** Q1 (2026-10-01): Guests see public items only, and “the same levels later apply to campaign records and Member profiles” ([PLAN-002](../governance/plans/PLAN-002-task-and-meeting-domains.md), Q1). Release 0.5.1 narrowed the Members a Guest reads to ID, PID, display name and status (PLAN-002 D16); nothing else about these two record families changed.
- **Campaign records have no audience rule.**
  - `campaigns`, `campaign_channels`, `campaign_states`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series` and `metric_observations` carry only the Business boundary (`001_core.sql:166-176`). Migrations 006 and 007 add audience policies for tasks, meetings, projects and what follows them.
  - A Guest reads them whole: `/state` returns every table of `TABLES` (`apps/api/service.mjs:18`) and the campaign channels (`apps/api/api.mjs:45`); `/workspace` returns each campaign with its stored state (`apps/api/workspace.mjs:36`, `:46`); `/overview` is built from the same snapshot.
- **The stored state is the sensitive part.** `campaign_states.state_json` holds the ledger collections `ads`, `leads`, `orders`, `inventory`, `decisions`, `releases`, `history`, `reviews` and `alertActions` (`apps/web/src/content/shared/model.mjs:6`). An order holds amounts, costs, `leadId` and `customerId` (`validateRecord`, `shared/model.mjs:44-94`), so a public Guest read includes customer-level business data.
- **Member profiles.** Members read every field of every Member: `snapshot` returns `SELECT *` of `members` (`service.mjs:22`; `db.mjs` `rows`), including `legacy_metadata`, which repeats the contact fields (`writeDomain` stores the whole Member object there, `workspace.mjs:126`). Only a Guest is narrowed (`guestMember`, `service.mjs:17`). Row-level security cannot hide one column of a row that stays visible, so any rule on contact fields is an application filter.
- **The campaign owner is fragile.** `campaigns.owner_member_id` is nullable, and `writeCampaigns` rebinds it from the owner's display name on every workspace save, writing NULL unless exactly one Member matches (`workspace.mjs:74`). A rule that depends on the owner needs a stable owner.
- **Tasks already link to campaigns.** Workboard tasks are `tasks` rows with `campaign_id` and their own visibility (ADR-003 D1, D2; FEAT-010). A campaign level must say how it meets them.
- **Production** held 1 campaign, 12 tasks and 4 Members, and no meeting, at the 0.5.0 record ([verification](../releases/0.5.0/verification.md)).

**Decision (proposed).**

- **D1 — The campaign is the unit.**
  - `campaigns` gets a level (the four levels of ADR-004 D1) and, for `team`, a team. The named people are the campaign's owner and its listed viewers (a new `campaign_viewers`, as `project_viewers`). The rule is ADR-004 D1 unchanged: `public` anyone, `business` signed-in Members, `team` the team and the named, `restricted` the named; the operator reads all; a Business admin gains nothing (ADR-004 D7).
  - Everything attached to a campaign follows it: `campaign_states`, `campaign_channels`, `content_items`, `publications`, `goals`, `goal_series`, `metric_series` and `metric_observations`, as attachments follow their task (ADR-004 D4). Naming a Member the owner of a content item or goal gives no access to its campaign.
- **D2 — Records attached to no campaign are Business-level.** A content item, goal or metric series with no campaign is readable by signed-in Members and never by Guests, and has no level of its own. Channel accounts are unchanged: they name public pages and a public campaign needs their names.
- **D3 — A Guest of a public campaign never reads its ledger.** For a `public` campaign a Guest reads the header, channels, content, publications, goals, series and observations. `campaign_states` is Member-only at every level, because it holds orders, leads and customer IDs; the campaign reaches a Guest with `ledgerWithheld: true`, and Mission Control shows a sign-in notice instead of figures computed from an empty ledger.
- **D4 — Defaults.** A new campaign is `business` (ADR-004 D1). Every existing campaign becomes `business` in an additive migration: Members see no change, and a Guest no longer reads the production campaign until someone with the right marks it `public` (as tasks in FR-011-012). The production migration needs a backup and the owner's specific authorization.
- **D5 — Changing a campaign's level** follows ADR-004 D8 with the campaign's owner as the accountable person: widening needs the owner, as stored before the request, and a reason; any Member who can read the campaign may narrow it; every change is audited; a change that locks the actor out is refused. A campaign with no owner can be widened only by the local operator. A workspace save keeps the stored owner unless the owner text names another Member.
- **D6 — Tasks and meetings keep their own audiences.**
  - A task or meeting is never hidden or shown by its campaign's level. A task whose campaign the viewer cannot read is served with the campaign's ID only, as a task whose project is hidden is served without the project's code and name (FR-010-002 AC-010-002-05).
  - A task created on the Workboard of a `team` or `restricted` campaign starts at that level, with the campaign's team or named people, unless the creator picks another level. A change of the campaign's level never changes a task; the response says how many linked tasks are broader than the new level.
- **D7 — Overview, brief, exports and backups** contain only the campaign records the viewer may read (ADR-004 D4 extended). The brief's cache key adds the campaign IDs and versions the viewer reads.
- **D8 — Member contact details get a level.**
  - `members.contact_visibility` is `business` (default, today's exposure), `team` (Members who share a team with that Member) or `restricted` (that Member only). It covers `email`, `phone` and `notes`.
  - ID, PID, display name and status stay as in PLAN-002 D16; full name, nickname, team label and position stay readable to every Member; a Guest never reads a contact field.
  - The Member sets the level of their own record; a Business admin or the operator sets any (registry duty, PLAN-002 D3). A Business admin and the operator always read every contact field: an exception to ADR-004 D7 for this group only, because they maintain the registry.
- **D9 — Enforcement.** Campaign records are enforced twice, as tasks are: the API filters by the viewer and row-level security repeats the rule, so one missed filter cannot leak a row. Contact details are enforced in the API alone, by one function used on every path that returns a Member, because a policy cannot withhold a column; history rows of Member changes are closed to everyone but the Member concerned, a Business admin and the operator.
- **D10 — Delivery in two steps**, each additive, each with its own migration and its own owner authorization for production: V2a campaign records (D1–D7, D9), V2b Member contact details (D8, D9). The interim rule of ADR-004 D9 ends for each family when its step is released.

**Decisions (owner, 2026-10-01).** The owner answered every question below as recommended, so D1–D10 above stand as written: the campaign carries the level (Q-V1 a); the existing campaign becomes `business` (Q-V2 a); a Guest of a `public` campaign reads its header and marketing records, never the ledger (Q-V3 a); records attached to no campaign are for signed-in Members only (Q-V4 a); the owner widens with a reason, any reader narrows, the operator handles a campaign with no owner (Q-V5 a); tasks and meetings keep their own audiences, new Workboard tasks start at the campaign's team or restricted level (Q-V6 a); Member contact details get a level enforced in the API, the Business admin reads all (Q-V7 a); delivery in two steps, V2a campaigns then V2b contact details (Q-V8 a); the stored campaign owner is kept unless the owner text names another Member (Q-V9 a).

| Q | Question | Options | Recommendation |
|---|---|---|---|
| Q-V1 | What carries the level? | (a) the campaign, attached records follow; (b) every record family its own level; (c) one Business-wide switch for all campaign data | (a): one decision per campaign; (b) multiplies pickers and invalid combinations; (c) cannot publish one campaign |
| Q-V2 | Level of the campaign that exists today | (a) `business`; (b) `public` | (a): consistent with tasks (FR-011-012). With (b) nothing changes for anyone, but the ledger stays public |
| Q-V3 | What a Guest reads of a `public` campaign | (a) header and marketing records, never the ledger; (b) the whole campaign, ledger included, as today; (c) header only | (a): the owner can publish a campaign without publishing customers and costs |
| Q-V4 | Records attached to no campaign | (a) signed-in Members only, no level of their own; (b) Guest-readable as today; (c) their own level columns | (a). Revenue and follower series that belong to no campaign leave the Guest view; (c) can follow if the owner wants public follower counts |
| Q-V5 | Who changes a campaign's level | (a) the owner widens with a reason, any reader narrows, the operator handles a campaign with no owner; (b) the owner only; (c) a Business admin may also widen | (a), as ADR-004 D8. (c) would make the admin a reader of campaigns they are not named on |
| Q-V6 | Tasks and meetings of a campaign | (a) own audiences, new Workboard tasks start at the campaign's team or restricted level; (b) fully independent, new tasks `business`; (c) never broader than the campaign | (a). (b) puts titles of a confidential campaign's tasks in front of every Member; (c) is stricter and refuses valid cases |
| Q-V7 | Member contact details | (a) a level per Member, enforced in the API, admin reads all; (b) no levels, D16 is final; (c) a sidecar table with row-level security | (a). (c) gives database enforcement but copies data and breaks a code rollback; `notes` stays with the group until the owner says otherwise |
| Q-V8 | Delivery | (a) V2a then V2b; (b) one release | (a): the campaign ledger is the larger exposure and V2b waits for Q-V7 |
| Q-V9 | The campaign owner | (a) keep the stored owner unless the owner text names another Member; (b) leave the rebinding as it is | (a), or a restricted campaign can lose its owner on an unrelated save |

**Alternatives considered.**

1. **A level on every campaign table.** Rejected: one campaign would hold content, goals and series at different levels, and every picker and policy is multiplied.
2. **One switch “campaign data is for Members only”.** Simplest and safe. Kept as the fallback if the owner wants no public campaign; it cannot publish a single campaign.
3. **Leave both families Guest-readable and keep ADR-004 D9.** Not recommended: D9 asks the team to keep customer data out of campaign records, and the ledger holds it by design.
4. **Tasks follow their campaign's level.** Rejected: it contradicts ADR-003 D1 (one record, many contexts) and FR-011-004.
5. **A Business admin reads every campaign and contact field.** Rejected for campaigns (ADR-004 D7). Kept only for contact fields, D8.
6. **Encrypt the ledger.** Deferred, as ADR-004 alternative 4.

**Consequences.**

- **FEAT-011 gains a part** owned by DOM-CAM for campaign records (FEAT-011-P04) and a requirement in P01 for contact details; DOM-CAM and DOM-IAM keep their README indexes in step.
- **FEAT-002 is amended:** a Guest no longer reads a whole campaign, and Mission Control shows the ledger notice. FEAT-005 narrows again. AGENTS.md (“Guest mode”) and ADR-004 D9 are updated after approval, not by this record.
- **Schema.** V2a adds columns and a table (`campaigns.visibility`, `campaigns.team_id`, `campaign_viewers`) and V2b one column (`members.contact_visibility`); ARCH-002 gets an amendment after each is built. Neither deletes or rewrites a row.
- **A rollback reopens the exposure,** as for migration 006: code from before the change ignores the new columns and shows the ledger to Guests again, so it needs its own decision.
- **Aggregates differ by audience.** A Business-level goal of published posts is computed from the publications the viewer reads, so two viewers can see different figures (ADR-004 D4); the screens label such figures.
- **Personal data.** The ledger and the contact fields can hold personal data of customers and colleagues; the owner decides retention and access in line with PDPA duties. This is a design note, not legal advice.
- **Tests** cover every read path for each viewer kind (ADR-004 Consequences), plus direct queries of every campaign table as a Guest and as a Member outside the audience.
