---
id: FR-011-006
title: Meeting audience metadata and participants
part: FEAT-011-P03
owner: DOM-MTG
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-006 — Visibility and participants of meetings

The system SHALL retain meeting audience, confidentiality and participant values as business metadata, but SHALL NOT use them to filter access. Guests read every non-secret meeting record in the Business; every active Member has equal CRUD and internal approval rights.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes participant, team, organizer and audience access restrictions below. Transcript-provider custody remains a separate rule; this access policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment.

## Acceptance criteria
- AC-011-006-01 — Given any meeting, including one marked confidential, when a Guest or active Member in the Business lists meetings, then the non-secret meeting is present.
- AC-011-006-02 — Given a meeting, when participants change, then participant metadata changes without changing Business-record access.
- AC-011-006-03 — Given a meeting with any team value, then team membership does not change which Business records a Guest or active Member can read.
- AC-011-006-04 — Given any active Member, when they change mutable meeting or audience metadata, then the change is audited and access remains Business-scoped.

## Implementation
- Built locally 2026-10-01: columns `visibility`, `team_id`, `transcript_custody` on `meetings`; table `meeting_participants`; `participantIds` and `organizerId` on the meeting payload (`apps/api/workspace.mjs`); meeting form in `apps/web/src/content/meeting/Meetings.jsx`. `project_id` follows with FEAT-010.
- Tests: `apps/api/test/visibility-db.test.mjs` (restricted meetings). The meeting form was not browser-checked (no local meetings).
- Planned table `meeting_participants`; planned columns `visibility`, `team_id` and `project_id` on `meetings`.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Production held no meetings at the latest record (member review, 2026-09-30).
