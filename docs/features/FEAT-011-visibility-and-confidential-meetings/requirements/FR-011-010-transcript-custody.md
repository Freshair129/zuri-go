---
id: FR-011-010
title: Custody of confidential transcripts
part: FEAT-011-P03
owner: DOM-MTG
delivery: declared
status: approved
relations:
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
- Not built.
- Planned column `transcript_custody` (`local_only` or `cloud`) on `meetings`. Today any signed-in client can save transcript revisions through `PUT /workspace` (`apps/api/workspace.mjs:72-75`).

## Notes
- Owner decision: not by default, only as an explicit, audited choice (PLAN-002 Q4).
