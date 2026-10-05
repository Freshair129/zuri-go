---
id: FR-005-012
title: Guests read evidence files; active Members manage them
delivery: declared
status: approved
legacy: []
relations:
  decided_by: [ADR-004, ADR-008]
  relates_to: [FEAT-005, FR-011-007, FR-011-008, FR-005-003]
---

# FR-005-012 — Guests read evidence files; active Members manage them

The system SHALL let a Guest list and download every non-secret evidence file in the configured Business, and SHALL let every active Member create, read, update or remove any such file regardless of task audience, team, ownership or assignment metadata. All operations remain Business-scoped; attachment audit events are append-only.

## Acceptance criteria
- AC-005-012-01 — Given any task in the configured Business, when a Guest lists or downloads its non-secret files, then both answer 200 with the available metadata and bytes.
- AC-005-012-02 — Given a file outside the configured Business or secret material, when a Guest or Member requests it by ID, then no data is returned.
- AC-005-012-03 — Given a Guest, when they upload or remove a file, then the answer is 401 and nothing changes.
- AC-005-012-04 — Given any active Member, when they create, update or remove a file for a task in the configured Business, then the authorized change succeeds regardless of task audience or assignment.

## Implementation
- `apps/api/attachments.mjs:attachmentAction` — the task must be readable by the viewer (`canRead`), else 404; `apps/api/api.mjs:handleApi` — `scopedTransaction` calls `authorizeWrite` for any method but GET.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“attachments persist bytes, follow their task visibility…”: a Guest gets 404 for a business task’s files, a Member downloads, a Guest PATCH answers 401, a Member PATCH answers 200; “guest write attempts…”). Run on 2026-10-01 by the author of this file: passed. No committed test reads the files of a public task as a Guest (AC-005-012-01); the 0.3.1 production check did so when every task was readable by Guests (“Reloaded in Guest and downloaded TXT”, [guest review](../../../history/zuri-go-guest-review/verification.md)).

## Notes
- Supersession: [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) supersedes the public-task-only Guest rule and task-audience inheritance for attachment reads and writes. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; prior test and release evidence remains historical.
