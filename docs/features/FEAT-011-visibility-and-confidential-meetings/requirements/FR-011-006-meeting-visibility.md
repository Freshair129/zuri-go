---
id: FR-011-006
title: Visibility and participants of meetings
part: FEAT-011-P03
owner: DOM-MTG
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-006 — Visibility and participants of meetings

The system SHALL store a visibility level and a participant list on every meeting, defaulting the level to `business`, and SHALL treat a confidential meeting as `restricted` to its participants, organizer included.

## Acceptance criteria
- AC-011-006-01 — Given a meeting marked confidential, when a Member who is not a participant lists meetings, then it is absent, title and date included.
- AC-011-006-02 — Given a restricted meeting, when a participant is added, then they can read it; when removed, then they no longer can.
- AC-011-006-03 — Given a `team` meeting, when a Member of that team reads meetings, then it is present.
- AC-011-006-04 — Given a meeting whose visibility is widened, then only its organizer may do so, with a reason, and the change is audited; any editor who can see it may narrow it.

## Implementation
- Not built.
- Planned table `meeting_participants`; planned columns `visibility`, `team_id` and `project_id` on `meetings`.

## Notes
- Production held no meetings at the latest record (member review, 2026-09-30).
