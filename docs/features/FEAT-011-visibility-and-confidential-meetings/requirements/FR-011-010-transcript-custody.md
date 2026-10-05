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
- AC-011-010-02 — Given the same meeting, when a current participant whose eligibility was sealed at meeting creation (or at the schema-12 migration baseline for an existing cloud meeting) chooses to upload at least one withheld transcript revision and gives a reason, then it is stored within the meeting’s Business boundary and an audit event records the choice; reads follow ADR-008 regardless of the meeting’s former audience. Roster edits after that seal, including before the first restriction, cannot grant upload eligibility. Zero withheld draft batches are valid when transcript revisions are present, but an empty upload cannot change custody.
- AC-011-010-03 — Given a restricted meeting whose transcript was never uploaded, when anyone reads it in production, then the UI states that the transcript is kept on the recording machine.
- AC-011-010-04 — Given a meeting that is not restricted, then today’s rule applies: the user chooses and sees the scope before a transcript goes to the cloud.

## Implementation
- Built 2026-10-01. Column `transcript_custody` (`local_only` or `cloud`) on `meetings` is set to `local_only` when a meeting becomes restricted (`writeDomain`, `apps/api/workspace.mjs`).
- AC-011-010-01: for any viewer but the local operator, a save stores the revisions of a `local_only` meeting as stubs (`custodyRevision`: `segments` empty, same hashes and lineage, `withheld: true`) and its draft-batch items without evidence text (`custodyBatch`). The local operator keeps full content. `validateEvidence` relaxes the segment and quote check only for a revision marked `withheld`; the client model refuses to review, draft or commit on one (`apps/web/src/content/meeting/model.mjs`). The server's meeting commit (`apps/api/meeting-commit.mjs`, PLAN-002 WI-09) does commit on a stub, on its spans: the links it writes hold `segmentId`, `startMs`, `endMs` and `reviewRevisionId` and no quote, and a later upload does not back-fill them.
- AC-011-010-02: `POST /businesses/:b/meetings/:id/transcript` with `{reason, sources, reviews, batches}` (`uploadTranscript`, `apps/api/workspace.mjs`; route in `apps/api/api.mjs`). Only a participant may call it, with a non-empty reason and at least one withheld transcript revision; `batches` may be empty when no withheld draft batch exists. Each revision stub must be matched by its original content (the stub equals that content without its text, and a review’s hash is recomputed). An empty revision set cannot change custody. A valid upload stores segments within the meeting’s Business boundary, sets `transcript_custody = 'cloud'` and writes an audit event (`entity_type` `meetings`, `event_type` `transcript_upload`) with actor, time and reason. Under ADR-008, all Guests and active Members in that Business may read the stored non-secret transcript.
- ADR-008/schema-12 target: the current roster is necessary but cannot alone prove upload eligibility. A database-owned, write-protected snapshot records participant Member UUIDs at creation, after the initial roster is written in that transaction. Migration 012 seals the existing cloud-meeting roster as an operator-controlled baseline and marks meetings with a prior `transcript_upload` audit as already held. Later roster edits do not change either snapshot. Existing `local_only` meetings without independent evidence fail closed; no eligibility is inferred from their current roster. Production and restored native Local had zero such meetings before migration 012. The database starts local custody on the first restriction only; direct runtime custody changes are denied, and an uploaded transcript cannot be returned to a local hold. Upload locks the meeting and rechecks current participation and sealed eligibility after roster edits are serialized through that row.
- AC-011-010-03: the meeting view states that the transcript is kept on the recording machine and offers the upload to participants (`TranscriptCustody` in `apps/web/src/content/meeting/Visibility.jsx`, used by `Meetings.jsx`). Built but not browser-checked.
- AC-011-010-04: a meeting that is not restricted has `transcript_custody = 'cloud'` and keeps today’s behavior.
- Tests: `apps/api/test/visibility.test.mjs` (`custodyRevision`, `custodyBatch`, `validateEvidence`); `apps/api/test/visibility-db.test.mjs` (AC-011-010-01 to -04, Member against operator); `apps/api/test/cloud-handler.test.mjs` (upload route, hosted commit route); `apps/api/test/meeting-commit.test.mjs` (a commit on stubs stores no segment or quote text); `apps/web/src/content/meeting/model.test.mjs` (stubs validate, guards).
- Limits and choices are listed in [SDD-011](../design.md#changes-found-while-building-p3-2026-10-01).
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Owner decision: not by default, only as an explicit, audited choice (PLAN-002 Q4).
