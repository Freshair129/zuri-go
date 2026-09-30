# Task domain — design proposal (Opus)

## 0. Model

claude-opus-5-5 — written from the shared brief before the Fable proposal was opened.

Reading of the request: "the kanban board in campaign" is the campaign **Workboard** tab (`work`, `apps/web/src/content/meeting/MeetingWorkspace.jsx:19`), rendered by `CampaignContent` view `work` (`apps/web/src/content/dashboard/DashboardContent.jsx:87-93`). It shows six status counters (Backlog / Ready / Doing / Blocked / Review / Done) that act as filters over a card grid titled "งานของแคมเปญ". It is not a drag-and-drop board; the only drag-and-drop kanban in the product is the weekly board in Meeting & Task Manager (`MeetingWorkspace.jsx:53`, `:66`). "Project or others" is read as: a task may belong to a campaign, to a project, or to nothing (general business work), and may point at related records.

## 1. Current state (facts)

Two task models exist side by side.

| | Campaign Workboard task (FEAT-002) | Meeting & Task Manager task (FEAT-004) |
|---|---|---|
| Client model | `campaign.tasks[]` inside the campaign workspace JSON (`apps/web/src/content/shared/model.mjs:6`, `:21`) | `state.tasks[]` of the task domain (`apps/web/src/content/meeting/model.mjs:5`, `:35-56`) |
| Fields | title, status, owner (free text), due, priority Low/Medium/High, offer, gate, hypothesis, action, dependencies, estimate, acceptance, evidence, recheck, outcome (`apps/web/src/content/dashboard/Forms.jsx:39`) | title, description, deliverable, dueDate, acceptance (+ proposed flag), evidence, blocker, campaignId, project (free text), dependency, kpi, recheckDate, R/A/C/I member IDs, sourceKind/sourceRefs (`meeting/model.mjs:37-44`) |
| Statuses | Backlog → Ready → Doing → Blocked / Review → Done (`shared/model.mjs:88`; FEAT-002 spec:255) | planned, doing, blocked, review, done (`meeting/model.mjs:2`) |
| Assignment | one owner string; the spec calls it the "accountable owner" (FEAT-002 spec:253) | RACI with Member foreign keys, one R and one A (`apps/api/migrations/001_core.sql:99-103`) |
| Planning | priority label | MoSCoW per task per week (`001_core.sql:104-112`; `meeting/model.mjs:26-34`) |
| Done rule | evidence + acceptance + owner + due + recheck (`shared/model.mjs:89-90`; AC-13, FEAT-002 spec:322; `tests/campaign/model.test.mjs:31`) | R + confirmed A + confirmed acceptance + evidence; a KPI-linked task also needs a recheck date (`meeting/model.mjs:48-51`) |
| Intake | manual; "create task" from a metric detail, seeded with gate / offer / hypothesis (`DashboardContent.jsx:108`) | manual; FUNG meeting draft commit with quoted evidence (`meeting/model.mjs:95-109`); weekly-plan seed |

**Storage.** In both PostgreSQL modes the two kinds already share `zuri_go.tasks`:

- Campaign tasks are upserted as `source_kind='campaign-legacy'` rows carrying the whole campaign-task JSON in `legacy_metadata` (`apps/api/workspace.mjs:43`) and are read back from that JSON (`workspace.mjs:20`). The status map is `{Done, Doing, Blocked, Review, Todo}`; `Todo` is not a campaign status, so Backlog and Ready both land as `planned` and only `legacy_metadata` keeps the difference. No `task_roles` or weekly entries are written for them.
- Task-domain tasks are all other rows (`workspace.mjs:23`, `:66-68`). The schema already has nullable `campaign_id`, `content_item_id`, `goal_id` and a free-text `project_label` (`001_core.sql:93-95`); the client uses only `campaignId` and `project` (`workspace.mjs:10`, `:66`).
- In browser-only mode the campaign workspace sits in localStorage (`DashboardContent.jsx:15-21`) and the task domain in one IndexedDB record (`apps/web/src/content/meeting/repository.mjs:3`).

**Writes.** There is no task endpoint. The client saves the whole workspace with `PUT /businesses/:id/workspace` (`apps/api/api.mjs:35-36`; `apps/web/src/content/business/api.mjs:14`), guarded by one Business-wide `domain_revision` (`workspace.mjs:83`) that every other save also increments (`apps/api/service.mjs:72`). A task-domain save that omits an existing task is refused with 409 (`workspace.mjs:63`). Non-GET requests pass `authorizeWrite` when `requireMember` is set (`api.mjs:12`), which the hosted handler does (`apps/api/cloud.mjs:32`); change events take the actor from the session (`workspace.mjs:79`, `service.mjs:21`).

**Existing link between the two.** The Workboard already lists task-domain tasks whose `campaignId` equals the selected campaign, as a read-only list that opens Meeting & Task Manager (`MeetingWorkspace.jsx:54`, `:56`). FEAT-004 deliberately left the old Workboard tasks where they were — "this round does not move or copy the old tasks" (FEAT-004 spec:220-222) — did not convert Low/Normal/High to MoSCoW (spec:166) and kept the owner string (spec:276).

**Other dependants.** Business Overview counts overdue or blocked tasks over all `tasks` rows (`apps/web/src/content/business/model.mjs:54`, `:63`); the campaign summary and evidence snapshots embed `c.tasks` (`shared/model.mjs:233`, `:244`); attachments find a task by UUID or `legacy_metadata.id` (`apps/api/attachments.mjs:22`); `apps/api/test/database.test.mjs:61`, `:71`, `:75`, `:79` pin the campaign-legacy round trip.

**Governance.** The proposed DOM-WRK "Work (tasks & meetings)" already owns `tasks`, `task_roles`, weekly plans, meetings and `task_attachments` (`docs/domains/work/README.md:25-34`). ADR-001 D4 (domain codes) is not approved, so the codes are not adopted; STD-002 R3 freezes a code only once adopted and treats a split or merge as a new domain with `supersedes`.

## 2. Options and recommendation

| Option | Description | For | Against |
|---|---|---|---|
| A. Filters only | Keep both systems; add project filtering to Task Manager | No migration | Two workflows and two assignment models stay; campaign work stays siloed; does not meet the request |
| B. Third task area | New "general tasks" domain next to campaign tasks and meeting tasks | Little change to existing code | Three task models over one table owned by several domains |
| **C. One task domain, typed contexts (recommended)** | DOM-TSK owns every task; a task has at most one home context (campaign or project) plus optional related content/goal; campaign-only fields move to a DOM-CAM extension table; one workflow; the Workboard becomes the task board scoped to one campaign | One board, one workflow, RACI everywhere; reuses the table and code already shared; campaign semantics stay with campaign | Needs a reviewed backfill and client/validator changes |
| D. Polymorphic links | `task_links(target_type, target_id)` to anything | Open-ended "others" without migrations | No foreign keys, unlike every relation in the schema (e.g. `001_core.sql:97`); orphaned links; harder RLS reasoning |
| E. Project domain above campaigns | DOM-PRJ owns projects; campaigns and tasks hang under projects | Portfolio view | Reworks DOM-CAM; Project has no rules yet that justify a domain |

**Recommendation: C**, delivered so that value arrives before any existing record moves: first projects, board scopes and campaign-created tasks in the task domain (additive); then the reviewed migration of old Workboard tasks; then per-task API concurrency.

Why: the database already treats campaign tasks as tasks. What differs is the status vocabulary, the owner model and the campaign-specific fields, and all three can be mapped without loss. FEAT-004 already designed its domain as the long-term home and asked the campaign to read linked tasks "from the source domain, not saving a duplicate" (spec:222). D is rejected because an explicit foreign key per context type is cheap and matches the schema; E is premature.

## 3. Domain design

- **Code and name:** DOM-TSK — Task management (งานและการมอบหมาย). It replaces the proposed DOM-WRK before adoption, recorded in the crosswalk. If the owner prefers to keep DOM-WRK, only its display name and slug change (STD-002 R3).
- **Classification:** supporting · business. The rules are tailored (evidence-based Done, RACI confirmation, meeting evidence) but not the differentiator; campaign and metrics stay core.
- **Language:** Task · Work context (Campaign / Project / ทั่วไป) · Project · Workflow status · Board (a filtered view, not an entity) · Assignment (R / A / C / I, proposed vs confirmed) · Weekly plan and MoSCoW · Intake (manual, meeting, campaign finding, weekly plan) · Acceptance and evidence · Completion rule · Activity.
- **Owns:** `tasks`, `task_roles`, `weekly_plans`, `weekly_plan_tasks`, `task_attachments`, the new `projects`, and meeting intake (`meetings`, `meeting_revisions`, `meeting_draft_batches`, `meeting_task_links`). Meetings exist to produce evidenced tasks — the Task Manager heading is "คุยให้ชัด แล้วไปต่อให้เป็นงาน" (`MeetingWorkspace.jsx:57`). Split meetings into their own domain only when they gain rules of their own (minutes, decision log).
- **Leaves to others:** campaign semantics (offer, gate, hypothesis, action, estimate, outcome, legacy priority label) to DOM-CAM in `campaign_task_details`; Members and PID to DOM-IAM; goals to DOM-MET; content items to DOM-CAM; `change_events` to DOM-BIZ.
- **Relations:** DOM-CAM writes tasks only through the task contract and reads boards through it (STD-001 R4); Business Overview reads task attention; the actor always comes from the session.

## 4. Data model (schema 6 sketch)

```sql
-- DOM-TSK
ALTER TABLE businesses ADD COLUMN next_project_no bigint NOT NULL DEFAULT 1;
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid NOT NULL REFERENCES businesses(id),
  code text NOT NULL,                                   -- PRJ-0001 via allocate()
  name text NOT NULL CHECK (length(trim(name)) > 0), description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','cancelled')),
  owner_member_id uuid, start_date date, target_date date, archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  UNIQUE (business_id, id), UNIQUE (business_id, code),
  FOREIGN KEY (business_id, owner_member_id) REFERENCES members(business_id, id),
  CHECK (target_date >= start_date));
ALTER TABLE tasks
  ADD COLUMN project_id uuid,
  ADD FOREIGN KEY (business_id, project_id) REFERENCES projects(business_id, id),
  ADD CONSTRAINT task_single_context CHECK (num_nonnulls(campaign_id, project_id) <= 1),
  ADD COLUMN owner_label text,   -- unresolved legacy owner text, shown until a Member is assigned
  ADD COLUMN completion_rule text NOT NULL DEFAULT 'task-v1'
    CHECK (completion_rule IN ('campaign-v1','task-v1'));
-- widen the inline status check (PostgreSQL's default name is tasks_status_check; confirm before altering)
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check,
  ADD CONSTRAINT tasks_status_check CHECK (status IN ('backlog','planned','doing','blocked','review','done'));
CREATE INDEX task_project ON tasks(business_id, project_id);

-- DOM-CAM
CREATE TABLE campaign_task_details (
  business_id uuid NOT NULL REFERENCES businesses(id), task_id uuid NOT NULL, campaign_id uuid NOT NULL,
  offer text, gate text, hypothesis text, action text, estimate numeric, outcome text, priority_label text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  PRIMARY KEY (business_id, task_id),
  FOREIGN KEY (business_id, task_id) REFERENCES tasks(business_id, id),
  FOREIGN KEY (business_id, campaign_id) REFERENCES campaigns(business_id, id));
-- Both new tables: ENABLE + FORCE ROW LEVEL SECURITY, the business_scope policy and the stamp trigger.
```

Notes:

- **RLS and grants.** New tables must enable RLS and the `business_scope` policy explicitly, as `004_task_attachments.sql` did; the loop in `001_core.sql:166-176` covered only the tables that existed then. `migrate.mjs` re-grants SELECT/INSERT/UPDATE on all tables to `zuri_go_app` after migrating (`apps/api/migrate.mjs:14`), but its version list and "schema 5" message are hard-coded (`:9`, `:19`) and must be extended.
- **Home context.** At most one of campaign or project; neither means "ทั่วไป". Content item and goal remain optional related references (existing FKs), meeting provenance stays in `meeting_task_links`, and an external reference uses `source_url`. A new context type becomes an explicit column when a real need appears.
- **Project label.** `project_label` stays, read-only, until a Member promotes each label to a project in a review screen. No project is created from text automatically.
- **Workflow.** `backlog` (รอคัดกรอง) → `planned` (พร้อมทำ; still "งานสัปดาห์นี้" in the weekly view) → `doing` → `blocked` (requires a blocker) / `review` → `done`. Mapping from the Workboard: Backlog→backlog, Ready→planned, Doing / Blocked / Review / Done unchanged; any other value → backlog with a flag in the report. Board columns are the workflow; there are no per-board columns.
- **Assignment.** RACI in `task_roles` is unchanged. Legacy owner text goes to `owner_label`, and nobody is assigned automatically — migration 005 set the precedent "no display-name matching" (`005_member_identity.sql:22`). An owner-mapping screen lets a signed-in Member map each distinct label to a Member.
- **Completion rule.** `task-v1` (unified): R and confirmed A, confirmed acceptance and evidence; a recheck date when a KPI or campaign gate is attached; campaign-context tasks also need a due date, which keeps AC-13's intent. `campaign-v1` marks tasks already Done under FEAT-002's rule. Validators accept those as they are and apply `task-v1` only if such a task is reopened.
- **Ordering.** Lanes sort by the viewed week's MoSCoW, then due date, then code. Manual ranking is deferred.
- **Audit.** Every create, move and assignment writes `change_events` with the session actor; a per-task activity timeline reads them.
- **Business scoping.** Composite `(business_id, id)` foreign keys everywhere, as in the existing schema.

## 5. Migration and compatibility

**Schema 006 (phase 1) is additive:** a new table, nullable columns, a widened CHECK and a column default. Old code keeps working until a row uses `backlog`, `project_id` or `completion_rule='campaign-v1'`, so the new client ships before any such row is written. Rolling back phase 1 means redeploying the old code if no new value has been used, otherwise a forward fix.

**Backfill of Workboard tasks (phase 2).** This is an explicit operator step, not part of `db:migrate`, and it needs the owner's specific authorization (AGENTS.md).

1. Private backup (`npm run backup`); for production, a Neon branch or snapshot.
2. Dry run per Business. Map every `campaign-legacy` row to its planned status, owner label, detail row and completion rule. Report counts per campaign × status before and after, unresolved owners, unknown statuses, and Done tasks that would fail `task-v1`.
3. Commit in one transaction per Business. It is idempotent: the task UUID is kept, already-converted rows are skipped, and `migration_batches` / `migration_keys` record it. `legacy_metadata` is left untouched as provenance. `source_kind` stays `campaign-legacy` as provenance, but storage routing stops depending on it.
4. Reconcile:
   - counts per campaign and status equal the dry run;
   - the Business Overview attention count is unchanged;
   - campaign `summary()` open and closed counts are unchanged;
   - existing review and decision snapshots are byte-identical — they embed the task copies of their time (`shared/model.mjs:233`).
5. Code switch in the same release:
   - `readLegacy` builds `campaign.tasks` as a read-only projection of the task rows with that campaign context, so `summary`, `evidenceSnapshot` and backups keep working.
   - `writeCampaigns` stops writing tasks. It refuses a changed `campaign.tasks` with 409 "โหลดหน้าใหม่" rather than dropping it silently, which protects against an old open tab.
6. Restore and import of v1/v2 backups that contain campaign tasks run the same conversion function. It lives in a shared module used by both the server and the browser.
7. Browser-only mode runs the same function on an explicit "ย้ายงานแคมเปญเข้า Task Manager" action, after downloading a backup.

**Rollback of phase 2.** A reverse script restores campaign-legacy routing from the unchanged `legacy_metadata` and removes the `campaign_task_details` rows the batch created. It is rehearsed on a QA Business.

**Preserved:**
- task UUIDs and codes;
- RACI rows and MoSCoW entries;
- attachments — same task UUID, and lookup by `legacy_metadata.id` still works (`attachments.mjs:22`);
- meeting links;
- change history;
- review snapshots.

## 6. API and authorization

Target contract, to be declared as API- artifacts:

- `GET /businesses/:b/tasks?context=all|none|campaign:<id>|project:<id>&status=&assignee=me|<memberId>&week=&q=`
- `POST /businesses/:b/tasks`
- `PATCH /businesses/:b/tasks/:id`, with `row_version`
- `POST …/tasks/:id/transition {to, row_version, blocker?, evidence?}` — the server enforces the blocked and Done rules
- `PUT …/tasks/:id/roles`
- `PUT …/weekly-plans/:week/tasks/:id {priority, note}`
- `projects` through the existing generic `save`: add it to `CONFIG` (`service.mjs:12-19`), with prefix `PRJ` in `allocate` (`service.mjs:23`)
- `POST /businesses/:b/campaigns/:cid/tasks` (DOM-CAM): creates the task through the task service and the campaign detail row in one transaction

Rules:

- **Writes need a Member.** Every non-GET goes through `scopedTransaction` → `authorizeWrite` in hosted mode (`api.mjs:12`). Guest gets reads and the existing login prompt.
- **Identity comes from the session.** `assignee=me` resolves from the session, never from a caller-supplied ID, and the `change_events` actor is the session's.
- **Concurrency.** While the whole-document `PUT /workspace` still writes tasks (meetings, backup, restore), every task write keeps bumping `domain_revision`, so a stale whole-document save gets 409 instead of overwriting a newer edit. Once meeting commits also go through the task service (phase 3), task edits use per-task `row_version`. Two Members editing different tasks then stop conflicting.

## 7. UI/UX

- **Navigation.** The domain menu entry "Meeting & Task Manager" becomes "Task Manager" (`MeetingWorkspace.jsx:55`). Its sub-views are Board, Weekly To-do (as today), List / RACI, Projects, Meetings (intake) and Members.
- **Board.**
  - Scope picker: ทั้งหมด / แคมเปญ ▸ / โปรเจกต์ ▸ / ทั่วไป / งานของฉัน (signed-in Members only).
  - Lanes follow the workflow. Drag and drop is kept alongside the per-card status select, which is the keyboard path (`:53`, `:66`).
  - Filters: R, the viewed week's MoSCoW, due (overdue / this week) and search.
  - A context chip on each card.
- **Campaign → Workboard.**
  - The tab embeds the same board component with the scope fixed to the campaign, and shows the campaign-only fields (gate, offer, hypothesis) in the card detail.
  - "Create task from finding" (`DashboardContent.jsx:108`) writes through the campaign endpoint.
  - The overview panel "งานที่ต้องไปต่อ" reads the same tasks.
  - The separate read-only linked-task list goes away, because there is one list.
  - Until phase 2, old Workboard tasks show in a clearly labelled "งานเดิม (ก่อนย้าย)" section and edit as today.
- **Projects view.**
  - Each project shows status, owner, dates and progress (done / total, overdue, blocked).
  - Opening a project opens the board scoped to it.
  - A review screen promotes existing `project_label` values to projects.
- **Task detail.** Context selector (Campaign / Project / ทั่วไป), related content item and goal, activity timeline, and the existing attachments.
- **Data App.**
  - All changes stay in `src/content/`, using public components and `useDashboardTabs`, with no protected-runtime edit.
  - The app ID and user layout are kept.
  - `authoredRevision` does not change unless the owner asks for the tab rearrangement (`apps/web/AGENTS.md`).

## 8. Documentation and governance

- `registry/domains.yaml`: add DOM-TSK (supporting, business), and add a crosswalk row DOM-WRK → DOM-TSK (proposed code, never adopted).
- `docs/domains/tasks/README.md` replaces `docs/domains/work/`. The DOM-CAM README gains `campaign_task_details`.
- **FEAT-010 — Task board and work contexts** (DOM-TSK, domain feature): the board, scopes, projects and task contract.
- **FEAT-011 — Campaign Workboard consolidation** (cross-domain):
  - Part P01, DOM-TSK: workflow, assignment and backfill.
  - Part P02, DOM-CAM: detail table, embedded board and snapshot projection.
  - It has its own lifecycle (the backfill), which is the STD-001 R3 test for a separate feature.
- **ADR-002** in `docs/architecture/decisions.md`: one task domain, the context model (typed FKs, one home), the workflow mapping, completion rules, and no automatic owner matching. STD-001 R5 requires an ADR for a cross-domain ownership split.
- **ARCH-002:** amendment for schema 6.
- **FEAT-002 and FEAT-004 `feature.md`:** record which Workboard and task clauses FEAT-011 supersedes. The approved spec text stays as written. FEAT-004's owner becomes DOM-TSK.
- **PLAN-001:** WI-14 question 1 (attachments) is answered by DOM-TSK; WI-06 gains FR files for FEAT-010/011.

## 9. Delivery plan

| Phase | Scope | Acceptance checks and tests | Complexity / risk |
|---|---|---|---|
| P0 | ADR-002, DOM-TSK README, FEAT-010/011 specs, ARCH-002 amendment; owner approval | ID/link validation; owner sign-off | C-2 / LOW |
| P1 | Migration 006; server task service used by both the whole-document save and the new endpoints; projects; board scopes; context selector; the campaign endpoint for tasks created from findings; label promotion; old Workboard tasks untouched | Model tests: statuses, single context, completion rules. DB tests: RLS isolation of `projects` and `campaign_task_details` across two QA Businesses; Guest write denial on project and task create. Browser: board drag and drop plus keyboard, scope switch, mobile | C-3 / MEDIUM |
| P2 | Backfill, owner mapping, projection and 409 guard, restore/import conversion, browser-mode conversion, removal of the old Workboard editor | Dry-run report equals commit; idempotent replay; reconciliation per campaign and status; snapshot hashes unchanged; attachments resolve; Overview counts unchanged; restoring the campaign-v1 fixture (`meeting/tests/campaign-v1.fixture.json`) converts | C-3 / HIGH |
| P3 | Meeting commits through the task service; per-task `row_version`; whole-document PUT no longer writes tasks | Cloud-handler tests for each endpoint: Guest 401/403, same-origin header, actor from session, `row_version` 409; two Members editing different tasks both succeed | C-3 / MEDIUM |

## 10. Risks and open questions

**Risks, each with its mitigation:**

- **Backfill loses or duplicates tasks.** Dry run, idempotent IDs, reconciliation and a backup.
- **The wrong person gets assigned.** No automatic matching of owner text to Members.
- **An old open tab overwrites migrated tasks.** The 409 guard.
- **Done history becomes invalid.** The completion rule marks what was Done under the old rule.
- **More 409s while tasks still use the whole-document save.** Phase 3 removes it.
- **Scope creep.** Custom columns, notifications and recurring tasks stay out.

**Questions for the owner:**

1. DOM-TSK as the new code, with meetings inside it — or keep DOM-WRK?
2. Project as an entity inside DOM-TSK now (recommended), a label only, or a separate domain?
3. One home context per task (recommended), or allow a campaign and a project together? Should a project be able to contain campaigns later?
4. Legacy owner text: map it to R, or to A, since FEAT-002 calls it the "accountable owner" (spec:253)?
5. Add the `backlog` status and label `planned` as พร้อมทำ outside the weekly view?
6. Keep the legacy Low/Medium/High as a campaign label (recommended), or convert it to MoSCoW?
7. Keep supporting browser-only mode?
8. Authorization and timing for the production backfill.
9. Later additions to consider:
   - a due-soon digest (no messaging exists today);
   - checklists and subtasks;
   - recurring tasks;
   - WIP limits;
   - projects that contain campaigns.
   
   The activity timeline and "my tasks" are already in P1.
