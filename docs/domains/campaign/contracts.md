# DOM-CAM — API contracts

API contracts owned by [DOM-CAM](README.md) ([STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). Transport, authorization, the error envelope and the shared rules of the record routes are [API-001](../platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope). All are `proposed` and written on 2026-10-01 from the code of release 0.5.1. Every operation needs a Member (hosted) or the operator (local); campaign records have no read route of their own and are read through `GET /businesses/{b}/state` (API-005) and the Overview (API-006).

### API-010 — Campaigns
Relations: relates_to: FEAT-002, FEAT-001, ARCH-002, API-001
Owner: DOM-CAM

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`save` resource `campaigns`), tables `campaigns`, `campaign_channels`, `campaign_states`.

| Operation | Request | Success | Errors |
|---|---|---|---|
| `POST /businesses/{b}/campaigns` | `name` (required), and any of `objective`, `lifecycle`, `owner_member_id`, `planned_start`, `planned_end`, `actual_started_at`, `actual_ended_at`, `archived_at`, and `channel_ids` (an array of channel account IDs) | 200 the `campaigns` row, with its `code` (`CAM-nnnn`) | 422 for an unknown field, a planned span over 366 days (`แผนแคมเปญต้องไม่เกิน 366 วัน`), or a value PostgreSQL refuses (`objective`, `lifecycle`, a channel or owner that is not in the Business); a create without `name` (PostgreSQL `23502`) answers the generic 422 `ข้อมูลขัดกับข้อกำหนดหรือรายการที่อ้างอิง กรุณาตรวจอีกครั้ง` (code null) |
| `PATCH /businesses/{b}/campaigns/{id}` | the same fields and `row_version` | 200 the row | the above, plus 404, 409, and 422 `เปลี่ยน objective ในตั้งค่าแคมเปญ เพื่อกำหนด KPI และเป้าหมายใหม่พร้อมกัน` when `objective` differs from the stored one |

- A new campaign defaults to `objective` `awareness` and `lifecycle` `draft`, and gets an empty `campaign_states` row for its settings. Setting `lifecycle` to `active` sets `actual_started_at` when it is empty. `channel_ids`, when sent, replaces the campaign's channels.
- `POST /businesses/{b}/campaigns/{campaignId}/tasks` is the campaign task contract (API-013), not this one.
- **Idempotency.** None on create; update by `row_version`.
- **Specified by.** [FEAT-002 spec](../../features/FEAT-002-campaign-mission-control/spec.md) and [brief](../../features/FEAT-002-campaign-mission-control/brief.md), [ARCH-002 §3](../../architecture/ARCH-002-postgresql-data-model.md). No FR file exists yet (PLAN-001 WI-06).

### API-011 — Content items
Relations: relates_to: FEAT-002, ARCH-002, API-001, API-012
Owner: DOM-CAM

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`save` resource `content`), table `content_items`.

| Operation | Request | Success | Errors |
|---|---|---|---|
| `POST /businesses/{b}/content` | `title` and `planning_month` (both required), and any of `description`, `format`, `campaign_id`, `owner_member_id`, `approval_status`, `approved_by_member_id`, `approved_at`, `asset_url`, `archived_at` | 200 the `content_items` row, with its `code` (`CNT-nnnn`) | 422 for an unknown field, a bad `asset_url`, or a value PostgreSQL refuses (`approval_status` is `draft`, `in_review`, `changes_requested` or `approved`; `planning_month` is the first of a month); a create without `title` or `planning_month` answers the generic 422 `ข้อมูลขัดกับข้อกำหนดหรือรายการที่อ้างอิง กรุณาตรวจอีกครั้ง` (code null) |
| `PATCH /businesses/{b}/content/{id}` | the same fields and `row_version` | 200 the row | the above, plus 404, 409 |

- `approval_status` defaults to `draft` on create and is otherwise kept. Setting it to `approved` sets `approved_at` to the time of the request unless the request sends one.
- Changing `title`, `description`, `asset_url` or `format` of an approved item in the same update returns it to `draft`, clears `approved_at` and `approved_by_member_id`, and moves its `scheduled` publications back to `draft`, in one transaction.
- Setting `archived_at` cancels the item's publications that are `draft`, `scheduled` or `failed`.
- **Idempotency.** None on create; update by `row_version`.
- **Specified by.** [FEAT-002 spec](../../features/FEAT-002-campaign-mission-control/spec.md), [ARCH-002 §3.7](../../architecture/ARCH-002-postgresql-data-model.md).

### API-012 — Publications
Relations: relates_to: FEAT-002, ARCH-002, API-001, API-011, BR-006
Owner: DOM-CAM

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`save` resource `publications`), table `publications`.

| Operation | Request | Success | Errors |
|---|---|---|---|
| `POST /businesses/{b}/publications` | `content_item_id`, `channel_account_id`, `status`, `idempotency_key` (required) and any of `scheduled_at`, `published_at`, `external_post_id`, `published_url`, `confirmation_note`, `failure_reason` | 200 the `publications` row (a replay returns the stored row) | 422 `ต้องมี idempotency key`; 409 `คำขอเดิมมีข้อมูลต่างกัน`; the rule errors below |
| `PATCH /businesses/{b}/publications/{id}` | the fields above and `row_version` | 200 the row | the rule errors below, plus 404, 409 |

- Rules checked by the server (422): the content item and the channel account must exist in the Business (`ไม่พบคอนเทนต์หรือช่องทางในธุรกิจนี้`); a `scheduled` publication needs an `approved`, not archived content item and an `active` channel (`ต้องตรวจอนุมัติคอนเทนต์และใช้ช่องทางที่ active ก่อน`), and, when the item belongs to a campaign, a channel of that campaign (`เพิ่มช่องทางนี้ให้แคมเปญก่อนจัดตาราง`); a `published` publication needs a `published_at` that is not in the future (`เวลาที่ลงจริงต้องไม่อยู่ในอนาคต`). `status` is `draft`, `scheduled`, `published`, `failed` or `cancelled` (PostgreSQL).
- The API records a schedule or a confirmation; it never posts to a channel (BR-006).
- **Idempotency.** On create the `idempotency_key` is unique in the Business: the same key with the same fields returns the stored row and creates nothing; the same key with another value in any field sent is 409. Update by `row_version`.
- **Specified by.** [FEAT-002 spec](../../features/FEAT-002-campaign-mission-control/spec.md), [ARCH-002 §3.8](../../architecture/ARCH-002-postgresql-data-model.md).

### API-013 — Campaign tasks
Relations: relates_to: FR-010-007, FR-010-011, FR-010-012, FR-010-013, FR-010-014, FR-010-015, SDD-010, API-001, API-016; decided_by: ADR-003
Owner: DOM-CAM

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/campaign-tasks.mjs` (`saveCampaignTask`), routed in `apps/api/api.mjs`; the task half is `apps/api/tasks.mjs` (API-016).

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /businesses/{b}/campaigns/{campaignId}/tasks` | Member, operator | the task fields of API-016 including `idempotency_key`, and `details` | 200 the task object (API-016) with `details` | 404 `ไม่พบแคมเปญ`; 422 `BODY_INVALID`, `FIELD_UNKNOWN`, `FIELD_INVALID`, `CONTEXT_CONFLICT`, `CAMPAIGN_FIELD`, `RECHECK_REQUIRED` and the other codes of API-016 |
| `PATCH /businesses/{b}/campaigns/{campaignId}/tasks/{taskId}` | Member, operator | the fields of API-016 `PATCH` including `row_version`, and `details` | 200 the task object | 404 `ไม่พบงาน` when the task is not readable or not in this campaign; 409 `STALE`; the 422 codes above |

- `details` is an object with only `gate`, `offer`, `hypothesis`, `action`, `outcome` (text), `estimate` (a number), `priority` (`Low`, `Medium` or `High`) and `original_status` (`Backlog`, `Ready`, `Doing`, `Blocked`, `Review` or `Done`); any other key is 422 `FIELD_UNKNOWN`, a bad value 422 `FIELD_INVALID`. A campaign-only field sent outside `details` is 422 `CAMPAIGN_FIELD`. A `campaign_id` in the body that is not the path's is 422 `CONTEXT_CONFLICT`.
- The task and its details are saved in one transaction through the task rules of API-016; either failing rolls back both. On `PATCH` the details are written first, so the completion rule sees a gate being saved in the same request (a `done` task with a gate needs a recheck date, `RECHECK_REQUIRED`).
- Any other method, or `POST` with a task ID or `PATCH` without one, answers 404 `Not found`.
- **Idempotency.** As API-016: `POST` needs an `idempotency_key`; a replay returns the stored task and writes `details` only if the task has none yet. `PATCH` by `row_version`.
- **Specified by.** [FR-010-012](../../features/FEAT-010-task-manager/requirements/FR-010-012-campaign-task-details.md), [FR-010-014](../../features/FEAT-010-task-manager/requirements/FR-010-014-task-from-finding.md), [FR-010-015](../../features/FEAT-010-task-manager/requirements/FR-010-015-campaign-tasks-projection.md), [FR-010-013](../../features/FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md), [FR-010-007](../../features/FEAT-010-task-manager/requirements/FR-010-007-completion-rule.md); design in [SDD-010](../../features/FEAT-010-task-manager/design.md#api-contract-proposed).
