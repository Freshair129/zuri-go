---
id: FR-011-008
title: Content follows its item
part: FEAT-011-P02
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-008 — Content follows its item

The system SHALL give attachments, history entries, overview task lists, AI-summary input, search results, exports and backups the audience of the task or meeting they come from, and SHALL keep item content out of logs.

## Acceptance criteria
- AC-011-008-01 — Given a restricted task with an attachment, when a Member outside its audience lists attachments, then it is absent, and a direct request returns 404.
- AC-011-008-02 — Given the Business Overview, when a Member reads it, then overdue or blocked tasks they cannot see are neither listed nor counted.
- AC-011-008-03 — Given an AI summary requested by a Member, then its input holds only items that Member may see, and a cached summary is never served to a viewer with a narrower audience.
- AC-011-008-04 — Given a Member’s backup from the UI, then it holds only what that Member may see; the operator database dump is unchanged and stays private.
- AC-011-008-05 — Given a failed request on a restricted item, then logs hold the error code and IDs only, never titles, text or transcript content.

## Implementation
- Built locally 2026-10-01: snapshot, overview and AI-brief input from the viewer's rows; `audienceKey` in the brief cache key (`service.mjs`); attachments answer 404 when unseen; history (`change_events`) and weekly entries follow their task; the UI backup is built from the filtered workspace.
- Tests: `apps/api/test/visibility-db.test.mjs`, `apps/api/test/cloud-handler.test.mjs`.
- Overview task rows today: `apps/web/src/content/business/model.mjs:54`; history: `change_events` read in `apps/api/workspace.mjs:28`; attachments: `apps/api/attachments.mjs`.
