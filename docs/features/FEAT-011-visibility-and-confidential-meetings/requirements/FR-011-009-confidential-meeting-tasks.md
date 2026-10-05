---
id: FR-011-009
title: Tasks from a confidential meeting
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-009 — Tasks from a confidential meeting

The system SHALL retain the source meeting's audience, participant and confidentiality metadata on linked tasks as provenance, but SHALL NOT use those values to filter task or evidence access. Guests read all non-secret Business records; every active Member has equal CRUD and internal approval rights.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes inherited audience restrictions on tasks, quotes, transcripts, attachments and history. Transcript custody remains an external-transfer rule; this access policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap; production remains on schema 11 pending separately authorized migration 012 and deployment.

## Acceptance criteria
- AC-011-009-01 — Given a meeting with any audience and three participants, when a draft task is committed from it, then source/participant metadata may be retained but does not change who can read or mutate the task.
- AC-011-009-02 — Given such a task, when any Guest or active Member in the Business reads it, then all non-secret task evidence is available regardless of meeting participation.
- AC-011-009-03 — Given such a task, when its visibility metadata changes, then evidence access remains Business-scoped and unchanged.
- AC-011-009-04 — Given a restricted meeting with an Inactive participant, whose chosen R and A are Active, when a draft task is committed from it, then the task is created `restricted` and the Inactive participant is one of its viewers; given an Inactive R or A, then the commit is refused with 422 “สมาชิกนี้ปิดใช้งานอยู่ กรุณาเลือกคนที่ Active” and nothing is stored ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D2).
- AC-011-009-05 — Given a task with meeting evidence, when an audit event is stored, then the event remains append-only and stores only the defined snapshot fields; any non-secret content present in an event is readable under the Business policy, including legacy events.

## Implementation
- Built 2026-10-01. `meetingAudience` (`apps/web/src/content/shared/visibility.mjs`) returns the audience of a restricted meeting. `writeDomain` (`apps/api/workspace.mjs`) applies it to every new task whose `sourceRefs` point to a restricted meeting in the same save: the task is stored `restricted` and the meeting’s participants are added to its viewers, whatever level and viewers the client sent. An existing task is never changed by it.
- Quotes: a person who can read the task but not the meeting gets `sourceRefsWithheld` and no quotes (`readLegacy`), and the quotes inside the task’s history events are withheld the same way (`withholdQuotes`). Widening the task changes neither. The quotes stay in the meeting’s revisions, draft batches and `meeting_task_links.evidence`, which follow the meeting.
- Server-side commit, built 2026-10-01 (PLAN-002 WI-09, [SDD-004 amendment](../../FEAT-004-meeting-task-manager/design.md#proposed-amendment--server-side-meeting-commit-plan-002-wi-09)): `POST /businesses/:b/meeting-commits` (`commitMeeting`, `apps/api/meeting-commit.mjs`; route in `apps/api/api.mjs`). The request carries choices only; the server takes the audience from the stored meeting (`meetingAudience`), runs the pure `commitBatch` rules with it on the viewer's readable state, and stores the tasks, the receipt, the links and one `commit` audit event on the meeting in one transaction (`writeDomain`). `PUT /workspace` refuses a receipt it did not already store (422 `RECEIPT_SERVER_OWNED`).
- Quotes (WI-09): a task reference is stored without `evidence` once `meeting_task_links` holds it; `readLegacy` re-attaches the evidence for someone who can read the meeting, so a direct query of `tasks.legacy_metadata` finds no quote. A task written before WI-09 keeps its inline evidence.
- Released 2026-10-01 in 0.5.1 (before it, on 0.5.0, an Inactive participant blocks the commit and history events hold the quotes), for AC-011-009-04 and -05: `apps/web/src/content/meeting/model.mjs:known` (a named viewer or participant is checked for existence only, so `saveTask` no longer applies the Inactive rule to `viewerIds`; `person` still does for R, A, C and I); `apps/api/workspace.mjs:writeDomain` — `bareEvent` and `bareTask` apply the same `bare()` rule as the task row to the snapshots in each event before `change_events` is written. The `.brain/rca/` records are [zuri-go-inactive-participant-blocks-restricted-commit](../../../../.brain/rca/zuri-go-inactive-participant-blocks-restricted-commit.md) and [zuri-go-history-events-store-evidence-quotes](../../../../.brain/rca/zuri-go-history-events-store-evidence-quotes.md). Tests, written with the change and not run for this record: `apps/api/test/meeting-commit.test.mjs` (“a restricted meeting with an Inactive participant commits and keeps them in the audience; an Inactive R is refused” and “history events keep no quote text, after a commit or a later edit…”, which queries `change_events` directly) and `apps/web/src/content/meeting/model.test.mjs` (“an Inactive Member may be a named viewer or meeting participant; a new R, A, C or I still may not”).
- Tests: `apps/api/test/visibility.test.mjs` (`meetingAudience`, acceptance and holdout); `apps/api/test/visibility-db.test.mjs` (AC-011-009-01, -02 and -03 for a Member-visible task, a business-meeting holdout, and the direct query of the task row and the links); `apps/api/test/meeting-commit.test.mjs` (the endpoint for Guest, outsider, participant, named R and operator, replay, conflict, stale batch, rollback, `AUDIENCE_WIDER`); `apps/web/src/content/meeting/model.test.mjs` (`commitBatch` with an audience, `canonicalChoices`).
- The note on the task form (`apps/web/src/content/meeting/TaskForms.jsx`) was built but not browser-checked.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).
