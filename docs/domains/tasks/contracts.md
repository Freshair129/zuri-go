# DOM-TSK — API contracts

API contracts owned by [DOM-TSK](README.md) ([STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). Transport, authorization and the error envelope are [API-001](../platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope). All are `proposed` and written on 2026-10-01 from the code of release 0.5.1. They are the per-record operations of the Task Manager ([SDD-010 “API contract”](../../features/FEAT-010-task-manager/design.md#api-contract-proposed) outlined them without declaring them); the campaign half is API-013 and the whole-workspace save is API-008.

### API-016 — Tasks
Relations: relates_to: FR-010-001, FR-010-002, FR-010-005, FR-010-006, FR-010-007, FR-010-009, FR-010-010, FR-010-018, FR-010-019, FR-011-004, FR-011-005, FR-011-007, FR-011-011, SDD-010, SDD-011, API-001, API-013, API-018; decided_by: ADR-002, ADR-003, ADR-004
Owner: DOM-TSK

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/tasks.mjs` (`listTasks`, `readTask`, `createTask`, `updateTask`, `cleanInput`), `apps/web/src/content/shared/task-rules.mjs` (the rules), routed in `apps/api/api.mjs`.

**The task object** (`GET`, and the answer of `POST` and `PATCH`): `id`, `code` (`TSK-nnnn`), `title`, `row_version` (a number), `source_kind`, `status`, `status_confirmed`, `visibility`, `roles`, `viewer_ids`, `created_at`, `updated_at`, the text fields `description`, `deliverable`, `acceptance`, `evidence`, `blocker`, `kpi_note`, `dependency_note`, the dates `due_date` and `recheck_date` (`YYYY-MM-DD`), the contexts `campaign_id`, `project_id`, `team_id`, `content_item_id`, `goal_id`, `acceptance_proposed`, `project_label`, `owner_label`, `completion_rule`, `project` (`{id, code, name}`, or null when there is none or the viewer may not read the project) and `details` (the campaign details of API-013, or null). `roles` is `{R, A, A_confirmed, C, I}`: a Member ID or null for R and A, a boolean, and arrays of Member IDs for C and I. `status` is `planned`, `doing`, `blocked`, `review` or `done`; `visibility` is `public`, `business`, `team` or `restricted`.

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /businesses/{b}/tasks?board=&campaign_id=&project_id=&team_id=&status=` | Guest (public items), Member, operator | `board` is `all` (default), `campaign`, `project`, `team`, `unlinked` or `mine`; `campaign_id`, `project_id` or `team_id` goes with its board; `status` filters exactly | 200 `{tasks:[task]}` of the tasks the viewer may read and that are not archived | 422 `BOARD_INVALID` `ไม่รู้จักบอร์ดนี้`; 401 (code null) for `board=mine` unless the viewer is a Member (the operator is not one) |
| `GET /businesses/{b}/tasks/{id}` | as above | none | 200 the task | 404 `ไม่พบงาน` for a missing or unreadable ID, or one that is 36 characters of hex and `-` but not a UUID; an ID of any other shape does not match the route and answers 403 `Business access denied` (API-001) |
| `POST /businesses/{b}/tasks` | Member, operator | `idempotency_key` (UUID, required), `title` (required) and any of the text fields, dates, contexts, `status`, `acceptance_proposed`, `visibility`, `viewer_ids`, `roles` | 200 the task | below |
| `PATCH /businesses/{b}/tasks/{id}` | Member, operator | `row_version` (required) and any field above except `idempotency_key`, and `visibility_reason` | 200 the task | below, plus 404 `ไม่พบงาน` |

- **Errors of `POST` and `PATCH`.**
  - 422 `BODY_INVALID`; `FIELD_UNKNOWN` for a field the operation does not list; `FIELD_INVALID` for a value of the wrong type, a date that is not `YYYY-MM-DD`, or an ID that is not a UUID; `CAMPAIGN_FIELD` for a campaign-only field (`details`, `gate`, `offer`, `hypothesis`, `action`, `estimate`, `priority`, `original_status`, `outcome`) sent here, or for moving a Workboard task out of its campaign (use API-013); `IDEMPOTENCY_KEY_REQUIRED`.
  - 422 rule codes of FR-010-006 and FR-010-007: `TITLE_REQUIRED`, `STATUS_INVALID`, `BLOCKER_REQUIRED`, `R_REQUIRED`, `A_UNCONFIRMED`, `ACCEPTANCE_UNCONFIRMED`, `EVIDENCE_REQUIRED`, `RECHECK_REQUIRED`, `DUE_REQUIRED`; `CONTEXT_CONFLICT` when the campaign, content item and goal do not agree (FR-010-002); `CONTEXT_NOT_FOUND`, `TEAM_ARCHIVED`, `MEMBER_NOT_FOUND`; `MEMBER_INACTIVE` for a new R, A, C or I who is Inactive (a role the task already had is kept; viewers may be Inactive).
  - The visibility codes of FR-011-011 and FEAT-011: 403 `WIDEN_DENIED` (only the task's A or the operator widens, with a reason); 422 `REASON_REQUIRED`, `TEAM_REQUIRED`, `NAMED_REQUIRED`, `SELF_EXCLUDED`, `LEVEL_INVALID`.
  - 409 `STALE` (`row_version` differs or is missing) and 409 `IDEMPOTENCY_CONFLICT`.
  - 401 (code null) for a Guest; on the hosted API a write without a Member never reaches here (API-001).
- **Identity.** `actor`, `memberId`, `pid`, `actor_member_id` and `actor_pid` in the body are ignored; the actor is the session's Member (FR-010-010, SEC-003). `completion_rule` cannot be set by a client.
- **One transaction.** The task row, its RACI, viewers and access are written together; a failure leaves nothing (FR-010-009 AC-07). An update raises `row_version` by exactly one. `visibility_reason` is not stored on the task: it goes into the change event of the visibility change.
- **Change events.** `tasks` (`create`, `update`, with the task as `before_data` and `after_data`), `task_viewers` and `task_visibility` (EVT-001).
- **Idempotency.** `POST` is idempotent by `idempotency_key`: a key not seen before creates the task; the same key with the same body (compared after the text fields are trimmed) returns the stored task as the viewer reads it and creates nothing; the same key with another body is 409 `IDEMPOTENCY_CONFLICT`, and so is a second request with the same key at the same time. `PATCH` is by `row_version`.
- **Specified by.** [FR-010-009](../../features/FEAT-010-task-manager/requirements/FR-010-009-task-api-create-update.md), [FR-010-010](../../features/FEAT-010-task-manager/requirements/FR-010-010-task-api-rules-identity.md), [FR-010-001](../../features/FEAT-010-task-manager/requirements/FR-010-001-create-task-from-title.md), [FR-010-002](../../features/FEAT-010-task-manager/requirements/FR-010-002-task-contexts.md), [FR-010-005](../../features/FEAT-010-task-manager/requirements/FR-010-005-boards.md), [FR-010-006](../../features/FEAT-010-task-manager/requirements/FR-010-006-move-task-status.md), [FR-010-007](../../features/FEAT-010-task-manager/requirements/FR-010-007-completion-rule.md), [FR-010-018](../../features/FEAT-010-task-manager/requirements/FR-010-018-raci-rules.md), [FR-010-019](../../features/FEAT-010-task-manager/requirements/FR-010-019-assign-by-member.md); audience by [FR-011-004](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-004-task-project-visibility.md), [FR-011-005](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-005-named-viewers.md), [FR-011-007](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md), [FR-011-011](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-011-widening-visibility.md).

### API-017 — Projects
Relations: relates_to: FR-010-003, FR-010-004, FR-011-004, FR-011-011, SDD-010, API-001, API-016; decided_by: ADR-003, ADR-004
Owner: DOM-TSK

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/projects.mjs`, routed in `apps/api/api.mjs`.

A project is `{id, business_id, code (PRJ-nnnn), name, description, status, owner_member_id, team_id, planned_start, planned_end, visibility, created_at, updated_at, row_version (a number), viewer_ids}`; `status` is `active`, `on_hold`, `done` or `archived`.

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /businesses/{b}/projects` | Guest (public items), Member, operator | none | 200 `{projects:[project]}` ordered by code, those the viewer may read | none |
| `GET /businesses/{b}/projects/{id}` | as above | none | 200 `{project, tasks, counts}`: the tasks of the project the viewer may read, and how many are in each status | 404 `ไม่พบโปรเจกต์` |
| `POST /businesses/{b}/projects` | Member, operator | `name` (required) and any of `description`, `status`, `owner_member_id`, `team_id`, `planned_start`, `planned_end`, `visibility`, `viewer_ids` | 200 the project | below |
| `PATCH /businesses/{b}/projects/{id}` | Member, operator | `row_version` (required), the fields above, `visibility_reason` | 200 the project | below, plus 404, 409 `STALE` |

- Errors of `POST` and `PATCH`: 422 `BODY_INVALID`, `FIELD_UNKNOWN`, `FIELD_INVALID`, `LEVEL_INVALID`, `NAME_REQUIRED`, `NAME_TOO_LONG` (over 80 characters), `STATUS_INVALID`, `DATES_INVALID` (`planned_end` before `planned_start`), `OWNER_REQUIRED`, `MEMBER_NOT_FOUND`, `TEAM_ARCHIVED`; and the visibility codes of API-016, where only the project's owner (or the operator) widens it (FR-011-011); 401 (code null) for a Guest.
- A project always has an owner: a Member who creates one owns it unless they name another; the operator must name one. `actor`, `memberId` and `pid` in the body are ignored.
- Change events: `projects` (`create`, `update`), `project_viewers` and `project_visibility` (EVT-001).
- **Idempotency.** None on create (each `POST` makes a project); update by `row_version`.
- **Specified by.** [FR-010-003](../../features/FEAT-010-task-manager/requirements/FR-010-003-projects.md), [FR-010-004](../../features/FEAT-010-task-manager/requirements/FR-010-004-project-label-link.md), [FR-011-004](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-004-task-project-visibility.md), [FR-011-011](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-011-widening-visibility.md).

### API-018 — Task attachments
Relations: relates_to: FEAT-005, FR-011-007, FR-011-008, BR-018, API-001, API-016
Owner: DOM-TSK

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/attachments.mjs` (`attachmentAction`, `decodeAttachment`, `sendAttachment`), routed in `apps/api/api.mjs`.

The task in the path is its UUID or the ID the legacy workspace gave it (1 to 160 characters of `A-Z a-z 0-9 _ -`); an archived or unreadable task answers 404 `ไม่พบงาน`, exactly as a missing one (FR-011-007, FR-011-008).

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /businesses/{b}/tasks/{task}/attachments` | Guest (public tasks), Member, operator | none | 200 an array of `{id, task_id, filename, media_type, byte_size, sha256, created_at, uploaded_by_member_id, deleted_by_member_id}` of the files not removed, oldest first | 404 `ไม่พบงาน` |
| `GET /businesses/{b}/tasks/{task}/attachments/{id}[?preview=1]` | as above | none | 200 the bytes (below) | 404 `ไม่พบงาน`, 404 `ไม่พบไฟล์` |
| `POST /businesses/{b}/tasks/{task}/attachments` | Member, operator | `{filename, base64}` | 200 the metadata row above | 422 `ชื่อไฟล์ไม่ถูกต้อง` (empty, over 180 characters, or containing a control character, `/` or `\`), 422 `ข้อมูลไฟล์ไม่ถูกต้อง`, 413 `ไฟล์ต้องไม่เกิน 2 MB`, 422 `แนบได้สูงสุด 5 ไฟล์ต่องาน`, 404 `ไม่พบงาน` |
| `PATCH /businesses/{b}/tasks/{task}/attachments/{id}` | Member, operator | `{deleted:true}` | 200 `{id, deleted:true}` | 404 `ไม่พบไฟล์`; 404 `Not found` for any other body |

- **Download.** The response is not JSON: `Content-Type` is the stored image type (`image/png`, `image/jpeg`, `image/gif` or `image/webp`, found from the file's signature, never from the name) only when `preview=1` is sent and the file is one of those images, and `application/octet-stream` otherwise; `Content-Disposition` is `inline` for a previewed image and `attachment` otherwise, with `filename="download"` and the real name in `filename*` (UTF-8, percent-encoded); `Content-Length` is the size; `X-Content-Type-Options: nosniff`; `Content-Security-Policy: sandbox; default-src 'none'`; `Cache-Control: no-store`.
- **Limits.** At most 2 MiB per file and 5 files not removed per task (BR-018), and `base64` must be well-formed standard base64 that decodes to a non-empty file. A removed file stays in the table (`deleted_at`, `deleted_by_member_id`) and is no longer listed or served. A write first raises the Business revision, which serializes concurrent uploads, so the second of two racing uploads can answer 409.
- **Change events.** `task_attachments`, event type `update`, for an upload and for a removal (EVT-001).
- **Idempotency.** None: each `POST` stores another file until the limit; a second `PATCH` of the same file is 404.
- **Specified by.** [FEAT-005 spec](../../features/FEAT-005-guest-access/spec.md) “Evidence attachments”, [FR-011-008](../../features/FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-008-content-follows-item.md). No FR file exists yet for the limits (PLAN-001 WI-06).
