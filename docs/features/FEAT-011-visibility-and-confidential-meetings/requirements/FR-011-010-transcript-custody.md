---
id: FR-011-010
title: Custody of confidential transcripts
part: FEAT-011-P03
owner: DOM-MTG
delivery: implemented
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-010 — Custody of confidential transcripts

The system SHALL keep the transcript of a restricted meeting only on the machine that recorded it unless someone explicitly uploads it, and SHALL record every such upload with its actor, time and reason.

## Acceptance criteria
- AC-011-010-01 — Given a restricted meeting captured locally, when it is saved to production, then production receives its title, date, participants and approved tasks and decisions, and no transcript segments.
- AC-011-010-02 — Given the same meeting, when a participant chooses to upload the transcript and gives a reason, then it is stored in production with the meeting’s audience and an audit event records the choice.
- AC-011-010-03 — Given a restricted meeting whose transcript was never uploaded, when anyone reads it in production, then the UI states that the transcript is kept on the recording machine.
- AC-011-010-04 — Given a meeting that is not restricted, then today’s rule applies: the user chooses and sees the scope before a transcript goes to the cloud.

## Implementation
- Built locally 2026-10-01 (not deployed). Column `transcript_custody` (`local_only` or `cloud`) on `meetings` is set to `local_only` when a meeting becomes restricted (`writeDomain`, `apps/api/workspace.mjs`).
- AC-011-010-01: for any viewer but the local operator, a save stores the revisions of a `local_only` meeting as stubs (`custodyRevision`: `segments` empty, same hashes and lineage, `withheld: true`) and its draft-batch items without evidence text (`custodyBatch`). The local operator keeps full content. `validateEvidence` relaxes the segment and quote check only for a revision marked `withheld`; the client model refuses to review, draft or commit on one (`apps/web/src/content/meeting/model.mjs`). The server's meeting commit (`apps/api/meeting-commit.mjs`, PLAN-002 WI-09) does commit on a stub, on its spans: the links it writes hold `segmentId`, `startMs`, `endMs` and `reviewRevisionId` and no quote, and a later upload does not back-fill them.
- AC-011-010-02: `POST /businesses/:b/meetings/:id/transcript` with `{reason, sources, reviews, batches}` (`uploadTranscript`, `apps/api/workspace.mjs`; route in `apps/api/api.mjs`). Only a participant may call it, with a non-empty reason; each stub must be matched by the content it came from (the stub equals that content without its text, and a review’s hash is recomputed). It then stores the segments under the meeting’s audience, sets `transcript_custody = 'cloud'` and writes an audit event (`entity_type` `meetings`, `event_type` `transcript_upload`) with actor, time and reason.
- AC-011-010-03: the meeting view states that the transcript is kept on the recording machine and offers the upload to participants (`TranscriptCustody` in `apps/web/src/content/meeting/Visibility.jsx`, used by `Meetings.jsx`). Built but not browser-checked.
- AC-011-010-04: a meeting that is not restricted has `transcript_custody = 'cloud'` and keeps today’s behavior.
- Tests: `apps/api/test/visibility.test.mjs` (`custodyRevision`, `custodyBatch`, `validateEvidence`); `apps/api/test/visibility-db.test.mjs` (AC-011-010-01 to -04, Member against operator); `apps/api/test/cloud-handler.test.mjs` (upload route, hosted commit route); `apps/api/test/meeting-commit.test.mjs` (a commit on stubs stores no segment or quote text); `apps/web/src/content/meeting/model.test.mjs` (stubs validate, guards).
- Limits and choices are listed in [SDD-011](../design.md#changes-found-while-building-p3-2026-10-01).

## Notes
- Owner decision: not by default, only as an explicit, audited choice (PLAN-002 Q4).
