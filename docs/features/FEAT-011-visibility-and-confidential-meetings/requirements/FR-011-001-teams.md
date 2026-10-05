---
id: FR-011-001
title: Teams and team membership records
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-001 — Teams and team membership records

The system SHALL let every active authenticated Member create, rename and archive teams (ฝ่าย), and add or remove Members from teams in the same Business. A Member MAY belong to several teams. Team membership remains business metadata and SHALL NOT grant or restrict access to other Business records.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, replaces the admin-only write rule; Business-admin grants remain operator-managed and do not change record access. The new policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap; production remains on schema 11 pending separately authorized migration 012 and deployment; the implementation evidence below records the previous runtime behavior.

## Acceptance criteria
- AC-011-001-01 — Given any active authenticated Member, when they create the team “บัญชี” and add two Members, then both appear as members of that team and one audit event per change records the session-derived Member as actor.
- AC-011-001-02 — Given any active authenticated Member, when they change a Team or its membership through the API, then the change is accepted within the same Business and audited; Guest writes remain denied.
- AC-011-001-03 — Given a Member in any team, when another Business record is read, then team membership does not grant or restrict access to that record.
- AC-011-001-04 — Given an archived team, when a new item is saved, then that team cannot be chosen, while existing items keep their team and audience.

## Implementation
- Built 2026-10-01 (schema 6): `apps/api/teams.mjs` (`listTeams`, `saveTeam`; routes `GET`/`POST /teams`, `PATCH /teams/:id` in `apps/api/api.mjs`); tables `teams`, `team_members` in `apps/api/migrations/006_visibility.sql`; UI `TeamsPanel` in `apps/web/src/content/meeting/Visibility.jsx`.
- Tests: `apps/api/test/visibility-db.test.mjs` (teams).
- Planned tables `teams` and `team_members`: Business-scoped, composite foreign keys and forced row-level security, like every table since `001_core.sql`.
- Note 2026-10-01: “Planned” above is stale. Both tables exist: `006_visibility.sql` creates `teams` and `team_members` with `business_scope` and forced row-level security, and they have been in production since release 0.5.0 (schema 7).
- The free-text `members.team` field stays a label; nothing converts it into team membership automatically.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Team names are data, not a fixed list; the owner named sales, production, accounting, HR and marketing (BRD-001).
