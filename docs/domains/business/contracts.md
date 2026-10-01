# DOM-BIZ — API and event contracts

API and event contracts owned by [DOM-BIZ](README.md) ([STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). Transport, authorization and the error envelope are [API-001](../platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope). All are `proposed` and written on 2026-10-01 from the code of release 0.5.1.

### API-005 — Bootstrap, Business state and Business name
Relations: relates_to: FEAT-001, FEAT-005, FR-011-007, FR-011-008, API-001; decided_by: ADR-004
Owner: DOM-BIZ

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/api.mjs` (`/bootstrap`, `state`, the `PATCH` of the Business), `apps/api/service.mjs` (`snapshot`).

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /bootstrap` | Guest, Member, operator | none | 200 `{business, storage, apiVersion:1}`; `business` is the `businesses` row; `storage` is `postgresql-cloud` or `postgresql-local` | 404 `ไม่พบธุรกิจ` |
| `GET /businesses/{b}/state` | Guest, Member, operator | none | 200 the snapshot: `business`, `members`, `channel_accounts`, `campaigns`, `content_items`, `publications`, `metric_series`, `metric_observations`, `goals`, `goal_series`, `tasks`, `task_roles`, `weekly_plans`, `weekly_plan_tasks`, `projects`, `campaign_task_details` and `campaign_channels`, each an array of rows (the Business is one row) | 404 `ไม่พบธุรกิจ` |
| `PATCH /businesses/{b}` | Member, operator | `{name, row_version}` | 200 the `businesses` row | 422 `ระบุชื่อธุรกิจ`; 409 `ข้อมูลเปลี่ยนแล้ว โหลดใหม่` |

- The snapshot is built for the viewer: a Guest reads a Member only as `{id, pid, display_name, status}`; tasks and projects are those the viewer may read; roles, weekly entries and campaign task details follow their tasks; meeting quotes copied into task metadata are withheld unless the viewer may read that meeting (FR-011-007, FR-011-008). Campaign, content, publication, goal and metric rows are not filtered by audience (PLAN-002 Q1 defers it; SEC-020).
- `PATCH` changes only `name`; any other field is ignored. It writes a change event (EVT-001, entity type `businesses`, event type `update`).
- **Idempotency.** Reads only; `PATCH` is by `row_version`.
- **Specified by.** [FEAT-001 spec](../../features/FEAT-001-business-overview/spec.md), [FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md); the viewer filter by [FR-011-007](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) and [FR-011-008](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md).

### API-006 — Business Overview and AI brief
Relations: relates_to: FEAT-001, FR-011-008, API-001, API-005
Owner: DOM-BIZ

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/api.mjs` (`overview`, `briefs`), `apps/api/service.mjs` (`brief`, `audienceKey`), `apps/web/src/content/business/model.mjs` (`overview`, `summaryFacts`, `validateSummarySelection`).

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /businesses/{b}/overview?date=YYYY-MM-DD&period=month` | Guest, Member, operator | `date` defaults to today in `Asia/Bangkok`; `period=month` gives the monthly Overview and any other value, `week` included, the weekly one | 200 the Overview view computed from the viewer's snapshot (keys include `period`, `kind`, `date`, `asOf`, `counts`, `goals`) | 404 `ไม่พบธุรกิจ`; a `date` that is not a real calendar date throws a plain error and answers 500 (code null), not 422 |
| `POST /businesses/{b}/briefs` | Member, operator | an object passed to the Overview as its options: `date`, `kind` (`weekly` or `monthly`) and, when sent, `asOf` | 200 the stored `ai_briefs` row: `id`, `period_start`, `period_end_exclusive`, `as_of`, `input_hash`, `prompt_version` (`1`), `mode` (`ai` or `rule_based`), `provider`, `model`, `status` (`ready`), `summary` (up to three facts), `evidence_snapshot`, `generated_at`, `error_code` | 404 `ไม่พบธุรกิจ` |

- **Idempotency.** A brief is stored once per `(Business, input_hash, prompt_version, mode)` while `ready`; the same facts, period and audience return the stored row and write no event. The hash includes the audience of the viewer's tasks, so a cached brief never crosses audiences (FR-011-008).
- **Model boundary.** `mode` is `ai` only when the server has a loopback `ZURI_GO_AI_URL` and a model name and the model answers within 25 seconds with fact IDs it was given; otherwise the brief is `rule_based` and, when a model was tried, `error_code` is `AI_UNAVAILABLE_OR_UNSUPPORTED_OUTPUT`. The model receives facts only, no tools and no write access (SEC-018).
- A new brief writes a change event (entity type `ai_briefs`, event type `create`). The Overview and briefs are not counted in `domain_revision`.
- **Specified by.** [FEAT-001 spec](../../features/FEAT-001-business-overview/spec.md); [ARCH-001 §3 and §6](../../architecture/ARCH-001-baseline-architecture.md) outline the routes.

### API-007 — Channel accounts
Relations: relates_to: FEAT-001, FEAT-002, API-001
Owner: DOM-BIZ

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`save` resource `channels`), table `channel_accounts`.

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /businesses/{b}/channels` | Member, operator | `platform` and `display_name` (both required), and any of `external_account_id`, `url`, `status`, `default_freshness_hours` | 200 the `channel_accounts` row | 422 for an unknown field, a bad `url`, or a value PostgreSQL refuses (`platform`, `status`, `default_freshness_hours` > 0, a duplicate `external_account_id` on a platform); a create without `platform` or `display_name` (PostgreSQL `23502`) answers the generic 422 `ข้อมูลขัดกับข้อกำหนดหรือรายการที่อ้างอิง กรุณาตรวจอีกครั้ง` (code null) |
| `PATCH /businesses/{b}/channels/{id}` | Member, operator | the same fields and `row_version` | 200 the row | 404, 409 |

- Creating a channel also creates four metric series for it: `followers_total`, `leads`, `net_revenue` (source `manual`) and `published_posts` (source `publication_projection`).
- **Idempotency.** None on create; update by `row_version`. See API-001 "Record routes" for the shared rules.
- **Specified by.** [FEAT-001 spec](../../features/FEAT-001-business-overview/spec.md), [ARCH-002 §3](../../architecture/ARCH-002-postgresql-data-model.md).

### API-008 — Whole-workspace read and save
Relations: relates_to: FR-010-011, FR-010-013, FR-006-006, FR-011-003, FR-011-004, FR-011-009, FR-011-010, FR-012-008, SDD-004, SDD-010, SDD-011, API-001; decided_by: ADR-003, ADR-004
Owner: DOM-BIZ

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/workspace.mjs` (`readLegacy`, `saveLegacy`, `writeCampaigns`, `writeDomain`), `apps/api/campaign-tasks.mjs` (`projectCampaignTask`, `writeWorkboardEntry`).

The compatibility surface the web app still saves through. It reads and writes the campaign workspace, the Member registry, tasks, weeks, meetings, transcript revisions, draft batches, receipts and history events together, so it touches data of DOM-CAM, DOM-IAM, DOM-TSK and DOM-MTG; it is declared here because it is the Business's workspace and the split is an open question (see the notes of this change).

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /businesses/{b}/workspace` | Guest, Member, operator | none | 200 `{schemaVersion:2, appId, version, campaignWorkspace:{schemaVersion:1, selected, campaigns}, meetingTaskManager:{…}}`; `version` is `domain_revision`; `meetingTaskManager` holds `members`, `tasks`, `weeks`, `meetings`, `sources`, `reviews`, `batches`, `receipts`, `events` and `seedKeys`, filtered to what the viewer may read | none beyond API-001 |
| `PUT /businesses/{b}/workspace` | Member, operator | `{version, campaignWorkspace?, meetingTaskManager?}`; `version` must be the current `domain_revision` | 200 the workspace as `GET` returns it, after the save | listed below |

- **Errors of `PUT`.** 409 `ข้อมูลถูกแก้แล้ว กรุณาโหลด workspace ใหม่` for a stale `version` or an ID held by an item the viewer cannot see; 409 `Workspace ขาดสมาชิกเดิม …` or `Workspace ขาดงานเดิม …` when the body leaves out a Member or task the viewer can read (a save never silently drops records); 422 `MEMBER_INACTIVE` for a new R, A, C or I who is Inactive; 403 `เฉพาะ Business admin …` and 403 `เปลี่ยนสถานะของตัวเองไม่ได้ …` from the registry rules (API-004); the visibility rules `WIDEN_DENIED` (403), `REASON_REQUIRED`, `TEAM_REQUIRED`, `NAMED_REQUIRED`, `SELF_EXCLUDED` and `LEVEL_INVALID` (422) of FR-011-011, which on this route are rule names, not codes: `access()` raises them through `fail()` with the Thai message of `CHANGE_ERRORS` and the status, and the body has code null (the code string is attached only on API-016 and API-017); 422 `RECEIPT_SERVER_OWNED` for a receipt the server did not store (a receipt is made only by the meeting commit, API-019); 422 for a batch whose hashes do not match its evidence, for an attempt to rewrite a stored draft batch, receipt or transcript revision, and for a revision lineage loop; the completion-rule codes of FR-010-007 (for example `R_REQUIRED`) when a Workboard entry newly moves to Done without what the rule needs.
- **Malformed bodies.** A body that fails `validateState` or the campaign workspace validation throws a plain error without a status and answers 500 `บันทึกไม่สำเร็จ กรุณาลองใหม่` (code null), not 422. Recorded as an open issue of this change; no requirement states it.
- **Atomicity.** One transaction: the Business row is locked, campaigns, Members, tasks (with RACI, viewers and week entries), meetings, revisions, batches, links and history events are written, `domain_revision` rises by one and a change event (entity type `workspace`, event type `save`) is written. A failure rolls everything back.
- **Meetings held on the recording machine.** For a meeting whose transcript custody is `local_only`, a save by anyone but the operator stores revisions and batches as stubs without text or quotes (FR-011-010).
- **Idempotency.** None as a key; the whole save is guarded by `version`. History events are inserted once per event ID.
- **Specified by.** [FR-010-011](../../features/FEAT-010-task-manager/requirements/FR-010-011-workspace-save-compatible.md), [FR-010-013](../../features/FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md), [FR-006-006](../../features/FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md), [FR-011-004](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-004-task-project-visibility.md), [FR-011-009](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-009-confidential-meeting-tasks.md), [FR-011-010](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-010-transcript-custody.md), [FR-012-008](../../features/FEAT-012-meeting-intake/requirements/FR-012-008-idempotent-commit.md) AC-012-008-07; design in [SDD-010](../../features/FEAT-010-task-manager/design.md), [SDD-011](../../features/FEAT-011-visibility-and-confidential-meetings/design.md) and [SDD-004](../../features/FEAT-004-meeting-task-manager/design.md).

### API-009 — Backup import (local operator only)
Relations: relates_to: FR-006-006, FR-011-012, ARCH-001, API-001, API-008
Owner: DOM-BIZ

**Status:** proposed. **Served by:** SRV-002 only. **Code:** `apps/api/workspace.mjs` (`importPreview`, `importCommit`, `decodeBackup`), routed in `apps/api/api.mjs`; the hosted refusal is in `apps/api/cloud.mjs`.

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /businesses/{b}/imports` | operator | `{backup, includeTranscript?, source_namespace?}`; `backup` is a version 2 workspace backup of this app (`schemaVersion` 2, `appId`, `campaignWorkspace`, `meetingTaskManager`) or an older campaign-only backup | 200 the report `{id, source_namespace, backup_sha256, campaigns, members, tasks, meetings, containsTranscript, canCommit, warnings}`, or the stored report with `alreadyCommitted:true` when this namespace and hash were already committed | 422 `Backup เป็นของแอปอื่น`; 422 `Backup มี restore ที่ยังไม่เสร็จ`; 422 `Backup มี transcript เลือกรวมข้อมูลประชุมก่อนนำเข้า` when the backup holds transcripts and `includeTranscript` is not true |
| `POST /businesses/{b}/imports/{id}/commit` | operator | `{backup_sha256}` of the previewed report | 200 `{id, report, workspace}`, or `{id, alreadyCommitted:true, workspace}` | 409 `Import preview ไม่ตรงกับคำยืนยัน`; 409 `ธุรกิจไม่ว่าง ไม่แทนที่ข้อมูลที่มีอยู่` when the Business already has a campaign; 404 `ไม่พบรายการ` when no staged preview has that `id`; 422 `Import reconciliation failed: revenue|units|spend|sql` when a metric differs after the import (nothing is kept) |

- The preview stages the backup in `.local/imports/{id}.json` on the machine that runs the server; the commit reads it back. `canCommit` is true only when the Business has no campaign. The commit writes in one transaction with `restore` mode for the operator (people, roles and the registry are kept as they were), records `migration_batches` and `migration_keys`, and raises `domain_revision`.
- A `POST` to `/imports/{id}` without `/commit` is treated as a preview (the route reads `commit` as the only action).
- **Hosted.** Any method on `/businesses/{b}/imports…` answers 403 `นำเข้า backup ผ่านผู้ดูแลระบบ` after the Member check of API-001 (a Guest write gets 401 first). Backup import in production is an operator task (RB-001), not an API call.
- **Malformed backups** fail like a malformed workspace (API-008, 500).
- **Idempotency.** By `(source_namespace, backup_sha256)`: a committed backup is never applied twice.
- **Specified by.** [ARCH-001 §5](../../architecture/ARCH-001-baseline-architecture.md) (import and source-of-truth transition), [FR-006-006](../../features/FEAT-006-member-identity/requirements/FR-006-006-backup-restore-keeps-members.md); the ARCH-001 §3 outline names `imports/preview`, which the code does not have.

### EVT-001 — Change event
Relations: relates_to: FR-011-008, FEAT-006, ARCH-002, API-001; decided_by: ADR-004
Owner: DOM-BIZ

**Status:** proposed. **Emitted by:** SRV-001 and SRV-002 (`apps/api/service.mjs:audit` and the two direct inserts below). **Table:** `change_events`.

This is the audit event of the system. STD-001 R1 asks an event contract for every published event or job; nothing publishes these events to a subscriber, so this declares the schema of the records the system writes and reads back, and the owner decides whether audit records count as events (see the notes of this change).

**Envelope.** One row per event: `id` (UUID), `business_id`, `entity_type`, `entity_id` (UUID), `event_type`, `before_data` and `after_data` (JSON or null), `actor_member_id` (UUID or null), `actor_pid`, `actor_kind`, `actor_subject`, `request_id`, `occurred_at`.

- `actor_kind` is one of `local_operator`, `authenticated`, `system`, `import` (a CHECK); the code writes only the first two. An authenticated write records the session's Member (`actor_member_id`, `actor_pid`, and the PID again as `actor_subject`); a local write records `local_operator` with no Member. The actor is never read from the request (SEC-003, SEC-010).
- `request_id` is a new random UUID for each event (it is not shared by the events of one HTTP request), except a `legacy_task_event`, whose `request_id` is the client's event ID.
- The runtime role may insert and read events but not update or delete them (`apps/api/migrate.mjs` grants; no code path updates or deletes one). Events are written in the same transaction as the change they describe.

**Catalogue (entity type → event types).**

| Entity type (`entity_id`) | Event types | Written by |
|---|---|---|
| `businesses` | `update` | `PATCH /businesses/{b}` (API-005) |
| `members`, `channel_accounts`, `campaigns`, `content_items`, `publications`, `goals` | `create`, `update` | record routes (API-004, API-007, API-010, API-011, API-012, API-014) |
| `metric_observations` | `observe` | API-015 |
| `ai_briefs` | `create` | API-006 |
| `tasks` | `create`, `update` (before and after hold the task) | API-016 |
| `task_viewers`, `task_visibility` | `update` | API-016, API-008 |
| `task_attachments` | `update` (upload and removal) | API-018 |
| `projects` | `create`, `update` | API-017 |
| `project_viewers`, `project_visibility` | `update` | API-017 |
| `campaign_task_details` | `create`, `update` | API-013, API-008 |
| `teams` | `create`, `update` | API-003 |
| `meetings` | `commit` (batch, receipt, task IDs, mappings), `transcript_upload` (reason, revision and batch IDs) | API-019, API-020 |
| `meeting_participants`, `meeting_visibility` | `update` | API-008 |
| `workspace` (the Business ID) | `save` (which domains were saved) | API-008 |
| `legacy_task_event` (the task ID, or the Business ID) | the client's own `type`, or `legacy` when it sends none; today `priority`, `task-created`, `task-updated`, `source-linked` | API-008 (`writeDomain`), idempotent by event ID |
| `members` | `admin_granted`, `admin_revoked` | operator tool `npm run members` (`actor_subject` `provision-members`; `before_data` and `after_data` hold `is_business_admin`) |
| `workspace` | `workboard_backfill` | operator tool `apps/api/backfill-workboard.mjs` (`actor_subject` `backfill-workboard`) |

**Audience.** No route returns change events except the task history inside `GET /workspace` (API-008): `legacy_task_event` rows of the tasks the viewer may read, and none to a Guest. In PostgreSQL a Guest reads no event; a Member or the operator reads the events of the entities they may read (tasks and their viewers, visibility, attachments and details follow the task; meetings and their participants follow the meeting; projects follow the project); other events are readable by any Member or the operator (migrations 006 and 007). Item content is kept out of logs (FR-011-008).

**Specified by.** [FR-011-008](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md), [FEAT-006 spec](../../features/FEAT-006-member-identity/spec.md) (server-derived actor), [ARCH-002](../../architecture/ARCH-002-postgresql-data-model.md).
