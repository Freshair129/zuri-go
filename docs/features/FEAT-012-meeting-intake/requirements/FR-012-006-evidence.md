---
id: FR-012-006
title: Evidence for every drafted task
delivery: implemented
status: approved
legacy: []
relations:
  specified_by: [SDD-004]
  relates_to: [FR-011-009, FR-011-010]
---

# FR-012-006 — Evidence for every drafted task

The system SHALL require every draft item to carry evidence — one or more spans of the reviewed revision it was drafted from, each with a quote that appears in that segment’s text — and SHALL check it when the draft is received, when it is stored and when it is committed, never trusting a quote sent by the client.

## Acceptance criteria
- AC-012-006-01 — Given a draft item with no evidence, or evidence whose segment is not in the reviewed revision, whose quote is empty or not contained in that segment’s text, whose start or end time is not a finite number or lies outside the segment, whose end is before its start, or whose revision ID is another, then it is refused (“งานจากประชุมต้องมีหลักฐาน” or “ข้อความอ้างอิงไม่ตรงฉบับตรวจแล้ว”) and the draft is not stored.
- AC-012-006-02 — Given a save of the workspace or a meeting commit, then the server runs the same check on the reviewed revision it has stored, for every batch item it writes and every item the commit selects, and uses no quote from the request.
- AC-012-006-03 — Given a committed task, then each of its source references names the meeting, source, revision and proposal it came from, and a task whose reference names a revision that does not belong to that meeting and source is refused (“งานอ้างฉบับประชุมที่ไม่มีอยู่”); a draft never cites another meeting.
- AC-012-006-04 — Given a revision kept on the recording machine (a stub), then evidence is accepted as a span — segment ID, start and end times and the stub’s revision ID — with no quote, and no quote text is required or stored on the server; a reference whose quote was withheld validates.

## Implementation
- `apps/web/src/content/meeting/model.mjs`: `validateEvidence` (AC-012-006-01, -04; `spans` option for a task reference that keeps span-only evidence), used by `addBatch`, `commitBatch` and `validateState` (AC-012-006-03).
- Server: `writeDomain` (`apps/api/workspace.mjs`) calls `validateState` and `validateEvidence` for every batch item of a save; `commitMeeting` (`apps/api/meeting-commit.mjs`) runs `commitBatch`, which validates each selected item against the stored review (AC-012-006-02).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “draft evidence requires exact quote and finite source timecodes”, “a state of stubs validates, and only the marker allows it”, “a task reference whose evidence is withheld validates; a missing reference target still does not”, “a stub review commits only when the caller allows it (the server), on its spans”; `apps/api/test/meeting-commit.test.mjs` — the custody test (“a meeting whose transcript stays on the recording machine stores no segment and no quote …”).

## Notes
- Origin: FEAT-004 MT-10. The [verification](../../FEAT-004-meeting-task-manager/verification.md) row is PASS (model, IndexedDB and browser fixture, 2026-09-30); the server checks were added by PLAN-002 WI-09 and are tested against local PostgreSQL ([SDD-004 amendment](../../FEAT-004-meeting-task-manager/design.md#validation-moves-to-the-server)).
- On a stub the server cannot compare a quote with the transcript; only the client on the recording machine can, before it sends the request ([SDD-004 amendment](../../FEAT-004-meeting-task-manager/design.md#transcript-custody-interplay), “Trust limit”). Who reads the quotes is FR-011-009 and FR-011-010.
- Where the quotes are stored (`meeting_task_links.evidence` rather than the task row) is described in FR-011-009, not restated here.
