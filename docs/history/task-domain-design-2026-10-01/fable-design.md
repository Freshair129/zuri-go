claude-fable-5-1

# Task Manager domain — design proposal (Zuri-Go 0.4.2 → 0.5.0)

Facts cite `path:line` in `D:\workspace\zuri-go` at commit `a601bc8`. Everything marked as proposal is my design; nothing was run.

## 1. Current state

**Reading the request.** "Kanban board ที่อยู่ใน campaign ปัจจุบัน" can mean two things, and both are true today: (a) the drag-and-drop Weekly To-do Kanban sits inside the app that was built as *Campaign* Mission Control, under a tab called Meeting & Task Manager (FEAT-004 brief.md:15 "เพิ่มโดเมน Meeting & Task Manager ใน Mission Control เดิม"; spec.md:36–50); (b) every campaign also has its own Workboard whose tasks are stored inside the campaign record. I read the request as: make tasks a first-class domain, with one board that holds campaign tasks, project tasks and unlinked tasks, so a task is no longer a child of a campaign.

**Two task models exist.**

| | Campaign Workboard (FEAT-002) | Weekly To-do Kanban (FEAT-004) |
|---|---|---|
| UI | `tab=work`: six status counters plus a card list, no drag (DashboardContent.jsx:87–93); Overview "งานที่ต้องไปต่อ" (:39, :57); MetricDetail "สร้างงานจากสิ่งที่พบ" seeds `gate`/`hypothesis` (:108) | `tab=meeting-task-manager`, views Weekly / Meetings / Tasks / Members (MeetingWorkspace.jsx:20); Kanban / List / RACI layouts; lanes from `STATUSES` planned·doing·blocked·review·done (meeting/model.mjs:2); drag-and-drop and status menu (MeetingWorkspace.jsx:53, 66); Won't shelf (:67); Backlog list (:68) |
| Record | JSON inside the campaign: `{id,title,status:Backlog…Done,owner:'',due,priority:High/Medium/Low,offer,gate,hypothesis,action,dependencies,estimate,acceptance,evidence,recheck,outcome}` (Forms.jsx:39, 54); `owner` is free text; Done needs evidence, acceptance, owner, due and recheck (shared/model.mjs:86–92) | Task with nullable details, R/A/C/I member IDs and confirmations, `campaignId`, free-text `project`, MoSCoW per week (meeting/model.mjs:26–56); Done needs R, confirmed A, confirmed acceptance, evidence; a KPI needs a recheck date (:48–51) |
| Storage | `tasks` rows with `source_kind='campaign-legacy'`; Done/Doing/Blocked/Review map to canonical statuses and everything else (Backlog, Ready) falls to `planned`; the whole JSON is kept in `legacy_metadata` (workspace.mjs:43); the UI reads that JSON back, not the typed columns (:20) | `tasks` typed columns via `T_FIELDS` (workspace.mjs:10, 66); `task_roles` deleted and re-inserted on every save (:67–68), `weekly_plan_tasks` likewise (:70); history as `change_events.entity_type='legacy_task_event'` (:79) |

**Schema 5.** `tasks` (001_core.sql:91–98): status CHECK, `campaign_id`, `content_item_id`, `goal_id`, `source_kind` CHECK manual / manual-from-meeting / meeting / weekly-plan / campaign-legacy, `project_label text`, `legacy_metadata jsonb`, `archived_at`; code `TSK-nnnn` (service.mjs:23). `task_roles` PK (business_id, task_id, member_id, role), `confirmation`, partial unique `single_r_a` (:99–103). `weekly_plans` / `weekly_plan_tasks` with nullable MoSCoW `priority` and `priority_note` (:104–112); the lane is `task.status`, never copied per week (ARCH-002:203). `meeting_task_links` (:131–134). `task_attachments` with uploader/deleter FKs (004:3–14; 005:48–50). `change_events` with `actor_member_id`, `actor_kind`, `actor_pid` (001:141–145; 005:47). Forced RLS on every table keyed by `zuri_go.business_id` (001:166–176). The runtime role may DELETE only `campaign_channels, goal_series, task_roles, weekly_plan_tasks` (migrate.mjs:15). "Project" today is only the free-text `project_label` (001:95; TaskForms.jsx:49).

**API.** There is no task endpoint. All task writes go through `PUT /businesses/:id/workspace` (api.mjs:36 → `saveLegacy`, workspace.mjs:82–88), which re-sends the whole domain, requires `version == domain_revision` (:83) and refuses a payload that omits an existing member or task (:62–63). Typed resources exist only for members, channels, campaigns, content, publications and goals (service.mjs:12–19). The browser wraps the PUT as `openServerRepository.mutate` (business/api.mjs:14). Hosted: GET is public, non-GET needs a Member session (cloud.mjs:27); `authorizeWrite` sets `c.zuriActor` inside the write transaction (member-auth.mjs:26–31; api.mjs:12). Attachments resolve legacy or canonical task IDs (attachments.mjs:22). Business Overview counts blocked/overdue tasks from the typed table (business/model.mjs:54).

**Cross-links.** A Task-Manager task with `campaignId` shows in the campaign Workboard as a read projection, no copy (MeetingWorkspace.jsx:54, 56; DashboardContent.jsx:88; FEAT-004 spec.md:222). Campaign JSON tasks are frozen into decision/review snapshots (shared/model.mjs:233) and counted by `summary()` (:244).

**Tests that depend on it.** `apps/api/test/database.test.mjs:15–28, 59–80` (RLS, FK, R/A uniqueness, import/replay with MoSCoW and evidence); `cloud-handler.test.mjs:43–50, 51–78, 95–99` (Guest 401 on `PUT workspace`, attachments, actor stamping); `meeting/model.test.mjs` (28 domain tests); `tests/campaign/model.test.mjs:31–32` (AC-13 Done rule; snapshot freezes `tasks`); all run by `npm test` (scripts/run.mjs:18).

**Docs and data.** DOM-WRK owns the nine task/meeting tables (docs/domains/work/README.md:25–35); DOM-CAM lists "Workboard" in its language (campaign/README.md:22). Production holds 1 campaign, 11 Task-Manager tasks, 4 Members and 11 weekly entries (history/zuri-go-member-review/verification.md:48); the number of campaign-local tasks was to be "counted separately" (ARCH-003:25) and is not recorded.

## 2. Options and recommendation

| Option | What changes | For | Against |
|---|---|---|---|
| A. Minimal | Keep both models; add a read-only "All tasks" list that merges them; keep `project_label` | Days of work; no migration | Two write models, two Done rules, owner as text, no RACI / attachments / MoSCoW on campaign tasks; the split the owner wants removed stays |
| B. One enlarged domain | Retitle DOM-WRK "Task manager", absorb campaign tasks, add projects; meetings stay inside | One README; fewer ADRs | Meeting intake (transcripts, revisions, FUNG) has its own language and external system; a "Task manager" that owns transcripts blurs the boundary STD-001 R2 asks for |
| C. Task domain + meeting-intake domain (recommended) | New DOM-TSK owns tasks, roles, plans, attachments, projects; meetings get their own supporting domain; the campaign Workboard becomes a projection of canonical tasks; campaign-legacy tasks are lifted into typed columns; Project becomes an entity | One task aggregate, one Done rule, one board component; RACI, MoSCoW and evidence for every task; campaign-specific fields keep a typed home owned by DOM-CAM | Largest change: migration 006, typed task API, UI switch, two ADRs, FEAT-004 narrowed; C-3 / HIGH |
| D. Ownership by context, aggregated reads | Campaign keeps its JSON tasks, Task Manager its own; a cross-domain "All work" read model on top | No campaign-task migration | Still two models; the aggregate board cannot move a card without knowing its model; rules duplicated forever |

**Recommendation: C.** The request is literally "แยกออกมา … ผูกกับ Project หรือ อื่นๆ"; only one canonical task aggregate with typed scope links does that. The approved model already treats `tasks` as canonical for both origins (ARCH-001:103; ARCH-002:187 asks for a mapping manifest for the remaining legacy fields), so C finishes what the 0.2.0 import started. B is the fallback if the owner prefers one domain: same data model, one README.

## 3. Domain design

| | DOM-TSK — Task manager | DOM-MTG — Meetings & intake |
|---|---|---|
| Classification | supporting · business | supporting · business |
| Purpose | Owned, prioritised, evidenced work for any scope: campaign, project, content, goal or none | Turn recorded meetings into reviewed transcripts and task proposals with evidence |
| Owned data | `tasks`, `task_roles`, `weekly_plans`, `weekly_plan_tasks`, `task_attachments`, `projects` (new) | `meetings`, `meeting_revisions`, `meeting_draft_batches`, `meeting_task_links` |
| Language | Task, Board, Lane, Scope (campaign / project / none), Project, RACI, MoSCoW, Weekly plan, Evidence, Backlog, Rank | Meeting, Source snapshot, Review revision, Draft batch, Proposal, Evidence quote, Commit receipt, FUNG |
| Leaves to others | Campaign semantics (gates, offers, hypotheses) → DOM-CAM extension table; Member identity and who-did-it → DOM-IAM; campaign / content / goal rows → their domains | Task creation → DOM-TSK contract (commit calls the task service inside the same transaction) |

DOM-WRK is retired with `supersedes` from both new domains, because a split domain is declared anew (STD-002:76–78). ADR-001 D4 says the codes are proposed and must be confirmed before use, and no `@trace` annotation references them yet (PLAN-001 WI-12), so the cost is registry and README edits. Cheaper variant: keep `DOM-WRK` for meetings and only add `DOM-TSK` (ownership transfer, STD-003 R7); semantically weaker, since "WRK" would then mean meetings.

Relations: DOM-CAM and DOM-MTG `depends_on` the DOM-TSK task contract; DOM-TSK reads Members through DOM-IAM's public read, which is not cross-domain (STD-001:96–100). Identity is untouched: the actor is always `c.zuriActor` from the session; RACI stays assignment data, never proof of who acted (FEAT-006 spec.md:76).

## 4. Data model

Kept from ARCH-002 §1: uuid PK plus UNIQUE(business_id, id), composite FKs, typed columns for relationships, JSONB only for legacy payloads, `row_version` + stamp trigger, reversible archive.

**Scope.** A task keeps its nullable FKs (`campaign_id`, `content_item_id`, `goal_id`) and gains `project_id`. Scope is a set of facets, not one polymorphic pointer: a task may serve a project and a campaign at once ("MUJEEN website" for "MUJEEN M1"); a task with none is งานทั่วไป. I rejected a `(target_kind, target_id)` table because it cannot carry an FK and ARCH-002:31 keeps relationships in typed columns; a new scope kind later is one more nullable FK column. `project_label` stays for compatibility and shows only when `project_id` is NULL.

**Project** becomes an entity: name, optional description / owner / dates, status `active | on_hold | done | archived`, code `PRJ-nnnn`. No automatic conversion of existing labels; the owner names the projects.

**Campaign-only fields** (`gate`, `hypothesis`, `action`, `offer`, `estimate`, `outcome`, legacy priority) move to `campaign_task_details`, a one-row-per-task extension owned by DOM-CAM, so the task aggregate stays generic and the campaign keeps its vocabulary.

**Statuses / lanes.** Keep the five canonical statuses; they are already the DB CHECK (001:93) and the lanes. Mapping manifest for legacy campaign statuses (ARCH-001:112 asks for one): Backlog → planned without weekly membership; Ready → planned; Doing / Blocked / Review / Done → same names. That is what `writeCampaigns` already did at import (workspace.mjs:43), so no row changes status.

**Done rule (owner decision).** Unified rule = the FEAT-004 rule (R, confirmed A, confirmed acceptance, evidence; recheck when a KPI is named) plus: a task with a `gate` or `kpi_note` needs `recheck_date`. The campaign-only "due date always required" (shared/model.mjs:90) is dropped, because MT-25 forbids an artificial due date.

**Assignment.** `task_roles` unchanged. Legacy `owner` text surfaces as `tasks.owner_label` so old campaign tasks show a name until a person binds a Member; binding is human (ARCH-001:106 forbids guessing).

**Ordering.** `tasks.rank numeric(20,10)`, nullable, fractional insert; NULL sorts by `created_at`; one rank per task across boards (optional, phase 3).

**Audit.** Every write goes through `audit()` (service.mjs:20–22) with a typed `entity_type`; existing `legacy_task_event` rows remain and appear in the same history.

Sketch of `apps/api/migrations/006_task_manager.sql` (additive; RLS and stamp triggers must be created explicitly because the 001 loop covered only the tables that existed then):

```sql
BEGIN; SET search_path TO zuri_go,public;
ALTER TABLE businesses ADD COLUMN next_project_no bigint NOT NULL DEFAULT 1;
CREATE TABLE projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id),
 code text NOT NULL, name text NOT NULL CHECK(length(trim(name))>0), description text,
 status text NOT NULL DEFAULT 'active' CHECK(status IN('active','on_hold','done','archived')),
 owner_member_id uuid, planned_start date, planned_end date, archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 UNIQUE(business_id,id), UNIQUE(business_id,code), CHECK(planned_end>=planned_start),
 FOREIGN KEY(business_id,owner_member_id) REFERENCES members(business_id,id));
ALTER TABLE tasks ADD COLUMN project_id uuid, ADD COLUMN owner_label text, ADD COLUMN rank numeric(20,10), ADD COLUMN idempotency_key uuid,
 ADD FOREIGN KEY(business_id,project_id) REFERENCES projects(business_id,id), ADD UNIQUE(business_id,idempotency_key);
ALTER TABLE tasks DROP CONSTRAINT tasks_source_kind_check;   -- verify the auto-generated name before running
ALTER TABLE tasks ADD CONSTRAINT tasks_source_kind_check CHECK(source_kind IN('manual','manual-from-meeting','meeting','weekly-plan','campaign-legacy','campaign'));
CREATE TABLE campaign_task_details (
 business_id uuid NOT NULL REFERENCES businesses(id), task_id uuid NOT NULL, gate text, hypothesis text, action text,
 offer text CHECK(offer IN('normal','destiny','pair','complete')), estimate numeric(18,2) CHECK(estimate>=0), outcome text,
 legacy_priority text CHECK(legacy_priority IN('High','Medium','Low')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1,
 PRIMARY KEY(business_id,task_id), FOREIGN KEY(business_id,task_id) REFERENCES tasks(business_id,id));
CREATE INDEX task_project ON tasks(business_id,project_id);
-- RLS: same policy text as 004_task_attachments.sql:11-13, plus stamp triggers, for both new tables.
-- Backfill (mirror 005's RLS-disable + per-Business set_config pattern, 005:23-35):
--   UPDATE tasks SET owner_label=nullif(legacy_metadata->>'owner','') WHERE source_kind='campaign-legacy' AND owner_label IS NULL;
--   INSERT INTO campaign_task_details(...) SELECT ... FROM tasks WHERE source_kind='campaign-legacy' ON CONFLICT DO NOTHING;
COMMIT;
```

Business scoping: both new tables carry `business_id`, composite FKs and the forced `business_scope` policy; grants for `zuri_go_app` are SELECT / INSERT / UPDATE only (archive, never delete), added in migrate.mjs:13–18. `snapshot()` TABLES (service.mjs:7) gains `projects` and `campaign_task_details`.

## 5. Migration and compatibility

1. **Before.** `npm run backup` locally and a matching-major dump of Neon (RB-001:18); record counts of tasks by `source_kind`, `task_roles`, `weekly_plan_tasks`, attachments, and `measure()` per campaign.
2. **006** is additive and idempotent: no DROP, no status rewrite, no MoSCoW conversion (MT-26, FEAT-004 spec.md:166), no RACI change, no deletion. `legacy_metadata` stays byte-identical so old code and the v2 export keep working.
3. **After.** Same counts; `campaign_task_details` rows equal campaign-legacy rows; every backfilled task still resolves by legacy ID for attachments (attachments.mjs:22).
4. **Dual read, single write.** `readLegacy` keeps emitting `meetingTaskManager.tasks` for the old UI until phase 3 ships. `campaignWorkspace.campaigns[].tasks` becomes `[]` — an empty array passes `restoreWorkspace` (shared/model.mjs:103–104) — and the Workboard reads canonical tasks through the task API. `writeCampaigns` stops upserting tasks from campaign JSON on ordinary saves (workspace.mjs:43) and keeps doing so only inside `importCommit` for old backups. `PUT /workspace` runs in compatibility mode: it accepts tasks produced by a batch receipt (source_kind meeting / manual-from-meeting, so FUNG commits keep working) and rejects typed-field changes to existing tasks with 409 "แก้งานผ่าน Task Manager". Every typed write bumps `businesses.domain_revision` (pattern service.mjs:72) so the whole-workspace version stays honest.
5. **Snapshots.** Stored decision/review snapshots keep their frozen `records.tasks`; `summary()` and `evidenceSnapshot()` gain an explicit `tasks` argument defaulting to `c.tasks`, so the 35 campaign tests stay green and new snapshots freeze canonical tasks.
6. **Rollback.** Code rollback to 0.4.2 works on schema 6: the old code reads `SELECT *` and ignores unknown columns; tasks created by the new API appear in the old Meeting list as linked tasks. Dropping the new tables would be a destructive migration; it is not planned and needs the owner's specific authorization (AGENTS.md).
7. **Preserved.** UUIDs, codes, RACI rows and confirmations, MoSCoW per week, attachments, meeting links, event history, the PID / session model and the app ID.

## 6. API and authorization

New module `apps/api/tasks.mjs` — it must be added to the deploy allowlist (build_cloud.py:25) or production returns 500 — dispatched from `handleApi` with a nested matcher like the attachment route (api.mjs:17), so it inherits `scopedTransaction`, `authorizeWrite`, the `X-Zuri-Go` / same-origin checks and `sendError`.

| Route | Guest | Behaviour |
|---|---|---|
| `GET /businesses/:b/tasks?scope=campaign:<id>\|project:<id>\|none&week=&status=&member=&q=` | read | Rows with roles, week entries, attachment count, links, campaign details |
| `GET /businesses/:b/tasks/:t` | read | Detail plus history from `change_events` (typed and `legacy_task_event`) |
| `POST /businesses/:b/tasks` | 401 | `idempotency_key` required: replay returns the same row, a changed payload is 409, as publications do (service.mjs:52); server allocates `TSK-nnnn`; optional roles, week, priority, campaign / project |
| `PATCH /businesses/:b/tasks/:t` | 401 | `row_version` required (409 on mismatch); omitted = keep, null = clear (SDD-004 §4.1); status rules from the shared model |
| `PUT /businesses/:b/tasks/:t/roles` | 401 | Replace R/A/C/I atomically; the DB keeps single R/A |
| `PUT /businesses/:b/tasks/:t/weeks/:monday` | 401 | Upsert membership, MoSCoW and note; `{member:false}` removes |
| `GET/POST/PATCH /businesses/:b/projects[/:id]` | read / 401 | Through `save()` CONFIG (service.mjs:12–19) plus `PRJ` in `allocate()` |
| `GET/PUT /businesses/:b/workspace` | read / 401 | Kept, compatibility mode as in §5.4 |

Enforcement is unchanged in kind: a hosted non-GET without a valid Member session is 401 before any handler (cloud.mjs:27); `authorizeWrite` rechecks credential version and active status inside the write transaction and sets the actor (member-auth.mjs:26–31); caller-supplied `memberId` / `pid` / `actor` fields are ignored (FEAT-007); local loopback stays `local_operator` (service.mjs:21). The Done / Blocked / KPI and RACI rules move from `meeting/model.mjs:35–56` into a pure `validateTask()` shared by the browser form and the server, as `workspace.mjs` already shares `validateState`.

## 7. UI/UX

- **Site menu.** "Meeting & Task Manager" → **Task Manager** (a FEAT-008 label; PRD-001 row updated). Inside: **Board · Weekly To-do · Tasks · Projects · Meetings · Members** (SegmentedControl, MeetingWorkspace.jsx:58). Weekly To-do stays exactly as approved (MT-01–04, 27–28).
- **Board** is the existing Kanban component with a scope bar — ทั้งหมด / แคมเปญ ▾ / Project ▾ / ไม่ผูก — and filters: status, week (any / this week), MoSCoW, R, source, search; sort by rank / due / MoSCoW. "งานของฉัน" preselects the signed-in Member from `session.member` (TeamAccess.jsx:25) and is a plain filter for Guests. Cards add a scope chip (CAM-0001 / PRJ-0002) to today's content.
- **Campaign Workboard** (`tab=work`) renders the same Board locked to `scope=campaign:<id>`; the six counters become the five lanes. "＋ เพิ่มงาน" and MetricDetail's "สร้างงานจากสิ่งที่พบ" open the unified TaskForm with the campaign preset and a collapsible **Campaign** section (gate, offer, hypothesis, action, estimate, outcome). Overview's "งานที่ต้องไปต่อ" reads the same list.
- **TaskForm** gains Project ▾ (with quick-add like the Member quick-add, TaskForms.jsx:35) next to the existing Campaign ▾, and shows `owner_label` as "ผู้รับผิดชอบ (ยังไม่ผูก Member)" with a bind action.
- **Projects** view: cards with open / done counts and a "เปิดบอร์ด" link.
- **Data App constraints.** All files stay under `src/content/` (protected-runtime.json:3–7); tabs through `useDashboardTabs` and `shell.exploreDashboard`; no shell edits, app ID unchanged; custom collections keep `data-reviewed-rows` (apps/web/AGENTS.md:21); build with `data-app.mjs build --separate-data`; Thai copy with the English product labels; both mascots on every logical view; Guests see disabled fieldsets and `requestWrite` login on drag or status change (MeetingWorkspace.jsx:52).

## 8. Documentation and governance

| Artifact | Change |
|---|---|
| `registry/domains.yaml` | Add `DOM-TSK` (slug tasks, supporting / business) and `DOM-MTG` (slug meetings, supporting / business); mark `DOM-WRK` retired with a reason line |
| `docs/domains/tasks/README.md`, `docs/domains/meetings/README.md` | From `docs/templates/domain.md`; `work/README.md` stays with `delivery: retired` and `supersedes` |
| `docs/governance/decisions.md` | **ADR-002** — split DOM-WRK into DOM-TSK and DOM-MTG (STD-003 R7 "add ADR if it splits an existing domain") |
| `docs/architecture/decisions.md` (new) | **ADR-003** — one canonical task aggregate; campaign and project are scopes; campaign-specific fields in a DOM-CAM extension table; the FEAT-010 ownership split (STD-001 R5) |
| `docs/features/FEAT-010-task-manager/` | `feature.md` type `cross-domain-feature`, owner DOM-TSK, runtime SRV-001, `depends_on: [FEAT-004, FEAT-005, FEAT-006]`; `parts/P01-tasks.md` (DOM-TSK: board, projects, RACI, weekly plan, API) and `parts/P02-campaign.md` (DOM-CAM: Workboard projection, `campaign_task_details`); `design.md` = SDD-010 with `## Interfaces`; `verification.md` with TC-010-nnn bound to test files; FR files per STD-003 R3 — this feature is authored under the standard from the start |
| FEAT-004 | `owner: DOM-MTG`; scope narrowed to meeting intake; note that MT-01–04, 16–17, 19–29 are carried by FEAT-010 (formal `supersedes` when WI-06 creates FR files); Members view and WI-14 #2 unchanged |
| FEAT-002 | Amendment: the Workboard is delivered by FEAT-010-P02; §7.1 record and AC-13 replaced by the unified Done rule; `depends_on: [FEAT-010]` |
| FEAT-005 | Attachment paragraph names DOM-TSK as data owner (closes WI-14 #1 without moving text) |
| ARCH-002, ARCH-001 | "0.5.0 amendment: task manager / schema 6"; §3 route table updated |
| SRV-001/002 `SERVICE.md`, PRD-001, `docs/README.md` | hosts / implements, surfaces table, feature and domain tables |
| `registry/crosswalk/ZGO.csv` | Rows DOM-WRK → DOM-TSK / DOM-MTG |
| PLAN-001 | WI-14 #1 closed, #2 restated; new WI-17 "FEAT-010 FR / AC / TC under the standard", WI-18 "retire task writes from PUT /workspace" |

## 9. Delivery plan

| Phase | Scope | Acceptance checks and tests | C / risk |
|---|---|---|---|
| 0 Documents | Everything in §8 except release records; the owner approves ADR-002 / 003, FEAT-010 and the Done rule | Links resolve; IDs unique; no code change | C-2 / LOW |
| 1 Schema 6 | 006 migration, backfill, migrate.mjs version 6 and grants, `snapshot()` tables | `database.test.mjs`: RLS / FK on `projects` and `campaign_task_details`, cross-Business rejection, `single_r_a` still enforced, backfill idempotent on a QA Business seeded with campaign-legacy rows, source_kind `campaign` accepted; counts before / after equal locally, then on Neon after the dump | C-3 / HIGH (production DB) |
| 2 Task API | `tasks.mjs`, projects resource, shared `validateTask()`, audit, PUT-workspace compatibility mode, packaging allowlist | `cloud-handler.test.mjs`: Guest 401 on every new write route, wrong Business 403, actor UUID / PID in `change_events`, idempotent POST replay, 409 on stale `row_version`, Done / Blocked / KPI rules, R/A uniqueness; batch commit through workspace PUT still creates tasks; edits through PUT rejected; `http.test.mjs` origin checks | C-3 / HIGH |
| 3 UI | Board, scope bar, filters, my tasks, Projects view, unified TaskForm, campaign Workboard projection, menu label | `meeting/model.test.mjs` green; new pure tests for grouping / filters / mapping manifest; `tests/campaign` green with `summary` / `evidenceSnapshot(tasks)`; `npm run build` protected-runtime pass; browser checks with approved tools (drag, status menu, Guest resume, 390 px lanes) or reported as unverified | C-3 / MEDIUM |
| 4 Meetings commit server-side | `POST …/meetings/:m/batches/:b/commit` creating tasks and links in one transaction; remove task writes from PUT | Replay returns the same task IDs (MT-12); stale review rejected; receipts unchanged | C-3 / MEDIUM |
| 5 Release 0.5.0 | build, `npm test`, deploy `--prod --skip-domain`, hosted checks (Guest reads, write denial, one disposable QA task per identity then archived), promote, `docs/releases/0.5.0/` | Row digests of user tasks unchanged except revision counters | C-2 / HIGH |

Phase 1 can ship alone (nothing reads the new columns yet); phases 2 and 3 ship together so there is never a build with two task write paths in the UI.

## 10. Risks and open questions for the owner

1. **Domain codes.** Two new codes (DOM-TSK, DOM-MTG) and retire DOM-WRK, or keep DOM-WRK for meetings? Codes freeze once adopted (ADR-001 D4).
2. **Done rule.** Accept dropping "due date always required" for campaign tasks and requiring `recheck_date` only when a gate or KPI is named? This changes FEAT-002 AC-13.
3. **Project entity.** Confirm `projects` with `PRJ-nnnn` codes and name the first projects (for example the "MUJEEN" label on W40-01, FEAT-004 spec.md:204); nothing is converted automatically.
4. **Lanes.** Keep five canonical lanes with Backlog / Ready as "planned without / with a week", or add a `ready` status? The import already collapsed them (workspace.mjs:43).
5. **Legacy priority.** High / Medium / Low stays a badge in `campaign_task_details.legacy_priority`, never converted to MoSCoW (MT-26) — confirm.
6. **Unknown count.** The number of campaign-local tasks in production is not recorded; verify before backfill.
7. **Menu label.** "Meeting & Task Manager" → "Task Manager" touches FEAT-008 / PRD-001; the old label can stay.
8. **Ordering.** Is drag ordering within a lane (rank column) wanted now or later?
9. **Two write paths** until phase 4 (typed API plus PUT /workspace for FUNG commits); mitigated by revision bumps and compatibility mode, but a stale tab sees 409 more often.
10. **Browser verification** was NOT_RUN in 0.4.2 (releases/0.4.2/verification.md:25); phase 3 acceptance must state what actually ran.
11. **Members registry ownership** (WI-14 #2) stays open; `members` does not move.
