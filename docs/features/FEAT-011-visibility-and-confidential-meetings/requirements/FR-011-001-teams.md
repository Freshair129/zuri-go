---
id: FR-011-001
title: Teams and team membership
part: FEAT-011-P01
owner: DOM-IAM
delivery: implemented
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
- Built 2026-10-01 (schema 6): `apps/api/teams.mjs` (`listTeams`, `saveTeam`; routes `GET`/`POST /teams`, `PATCH /teams/:id` in `apps/api/api.mjs`); tables `teams`, `team_members` in `apps/api/migrations/006_visibility.sql`; UI `TeamsPanel` in `apps/web/src/content/meeting/Visibility.jsx`.
- Tests: `apps/api/test/visibility-db.test.mjs` (teams).
- Planned tables `teams` and `team_members`: Business-scoped, composite foreign keys and forced row-level security, like every table since `001_core.sql`.
- The free-text `members.team` field stays a label; nothing converts it into team membership automatically.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Team names are data, not a fixed list; the owner named sales, production, accounting, HR and marketing (BRD-001).
