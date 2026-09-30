---
id: FR-011-001
title: Teams and team membership
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004]
---

# FR-011-001 — Teams and team membership

The system SHALL let a Business admin create, rename and archive teams (ฝ่าย) and add or remove Members from them. A Member MAY belong to several teams, and only a Business admin SHALL change teams or team membership.

## Acceptance criteria
- AC-011-001-01 — Given a Business admin, when they create the team “บัญชี” and add two Members, then both appear as members of that team and one audit event per change records the admin as actor.
- AC-011-001-02 — Given a signed-in Member who is not an admin, when they try to create a team or change membership through the API, then the request is refused with 403 and nothing changes.
- AC-011-001-03 — Given a Member in two teams, when team visibility is evaluated, then items of either team are visible to them.
- AC-011-001-04 — Given an archived team, when a new item is saved, then that team cannot be chosen, while existing items keep their team and audience.

## Implementation
- Not built.
- Planned tables `teams` and `team_members`: Business-scoped, composite foreign keys and forced row-level security, like every table since `001_core.sql`.
- The free-text `members.team` field stays a label; nothing converts it into team membership automatically.

## Notes
- Team names are data, not a fixed list; the owner named sales, production, accounting, HR and marketing (BRD-001).
