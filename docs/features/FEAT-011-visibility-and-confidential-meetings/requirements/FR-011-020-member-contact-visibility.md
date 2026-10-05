---
id: FR-011-020
title: Member contact fields follow the Business access policy
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [FR-011-007, FEAT-006]
---

# FR-011-020 — Visibility of Member contact details

The system SHALL retain any Member contact-visibility field as metadata, but SHALL NOT use it to filter non-secret profile access. Guests read all non-secret Member profile and contact fields; every active Member has equal CRUD and internal approval rights for Member records. Credentials, sessions and operator/provider secrets remain excluded.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes contact-level filtering and the limited Guest profile projection below. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; earlier evidence is historical.

## Acceptance criteria
- AC-011-020-01 — Given the Members that exist when this is released, then every one is `business` and every signed-in Member reads every field as before.
- AC-011-020-02 — Given a Member whose contact level is any value, when a Guest or active Member reads `/state` and `/workspace`, then all non-secret profile fields, including contact fields, are returned.
- AC-011-020-03 — Given Members who share or do not share a team, then team membership does not change access to non-secret Member records.
- AC-011-020-04 — Given the Member concerned, a Business admin or the local operator, then they read every contact field at every level.
- AC-011-020-05 — Given a Guest, then non-secret contact fields are returned regardless of the stored level; secret material remains excluded.
- AC-011-020-06 — Given a Member's workspace save that returns a Member with withheld fields unchanged, then the save is not refused and the stored contact fields are not overwritten.
- AC-011-020-07 — Given any active Member, when they update another Member's non-secret contact fields or audience metadata, then it is allowed within the Business; metadata does not alter access.
- AC-011-020-08 — Given the migration, then it adds one column with the default `business`, changes no other field and the counts of `members` and `change_events` are equal before and after.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `members.contact_visibility` in a new migration (schema 9); `memberView` (`apps/api/audience.mjs`) used by `snapshot` (`apps/api/service.mjs`) and `readLegacy` (`apps/api/workspace.mjs`); the comparison of the Member save uses the viewer's view of the row.
- Today (0.5.1): a Guest reads only the ID, PID, display name and status (`guestMember`, `apps/api/service.mjs:17`); every Member reads every field, `legacy_metadata` included.

## Notes
- Contact data is never public: the column has no `public` value.
- Q-V7 of [ADR-005](../../../architecture/decisions.md) is the open choice, with the question whether `notes` should be admin-only by default. Enforcement is in the application; a database policy cannot withhold one column of a visible row.
