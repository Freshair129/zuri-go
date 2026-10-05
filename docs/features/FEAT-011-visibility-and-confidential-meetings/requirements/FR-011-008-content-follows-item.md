---
id: FR-011-008
title: Content follows its item
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-008 — Content follows its item

The system SHALL scope attachments, history entries, overview task lists, search results, exports and backups to the configured Business and SHALL NOT filter them by a task or meeting audience. Guests read all non-secret records; active Members have equal CRUD and internal approval rights. Provider input remains subject to separate egress authorization; item content stays out of logs.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes inherited audience filtering for attachments, history and derived content. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; earlier implementation evidence is historical.

## Acceptance criteria
- AC-011-008-01 — Given any in-Business non-secret task with an attachment, when a Guest or active Member lists or downloads it, then it is returned regardless of task audience.
- AC-011-008-02 — Given the Business Overview, when a Guest or active Member reads it, then all non-secret in-Business tasks are listed and counted.
- AC-011-008-03 — Given an AI summary request, then it uses only Business-scoped authorized input and any provider egress requires its separate grant; audience metadata does not filter input.
- AC-011-008-04 — Given a UI backup, then it holds all non-secret records the viewer may read in the Business; the operator database dump remains private.
- AC-011-008-05 — Given a failed request on a restricted item, then logs hold the error code and IDs only, never titles, text or transcript content.

## Implementation
- Built locally 2026-10-01: snapshot, overview and AI-brief input from the viewer's rows; `audienceKey` in the brief cache key (`service.mjs`); attachments answer 404 when unseen; history (`change_events`) and weekly entries follow their task; the UI backup is built from the filtered workspace.
- Tests: `apps/api/test/visibility-db.test.mjs`, `apps/api/test/cloud-handler.test.mjs`.
- History events stored with a task’s snapshot keep no evidence quote that `meeting_task_links` holds (released 2026-10-01 in 0.5.1): [FR-011-009](FR-011-009-confidential-meeting-tasks.md) AC-011-009-05, D14.
- Overview task rows today: `apps/web/src/content/business/model.mjs:54`; history: `change_events` read in `apps/api/workspace.mjs:28`; attachments: `apps/api/attachments.mjs`.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).
