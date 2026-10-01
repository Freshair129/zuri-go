---
id: FR-011-020
title: Visibility of Member contact details
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004]
  relates_to: [FR-011-007, FEAT-006]
---

# FR-011-020 — Visibility of Member contact details

The system SHALL give each Member a contact level — `business` (the default), `team` or `restricted` — over their email, phone and notes, SHALL withhold those three fields from a Member the level does not allow on every path that returns a Member, and SHALL keep returning the Member's ID, PID, display name and status to everyone and no contact field to a Guest.

## Acceptance criteria
- AC-011-020-01 — Given the Members that exist when this is released, then every one is `business` and every signed-in Member reads every field as before.
- AC-011-020-02 — Given a Member whose level is `restricted`, when another Member who is not a Business admin reads `/state` and `/workspace`, then `email`, `phone` and `notes` are `null` with `contactWithheld: true`, also inside `legacy_metadata`, and the ID, PID, display name, status, full name, nickname, team label and position still appear.
- AC-011-020-03 — Given a Member whose level is `team`, then a Member who shares a team with them reads the contact fields and a Member who shares none does not.
- AC-011-020-04 — Given the Member concerned, a Business admin or the local operator, then they read every contact field at every level.
- AC-011-020-05 — Given a Guest, then no contact field is returned whatever the level, and the Guest still reads only the ID, PID, display name and status (FR-011-007 AC-011-007-06).
- AC-011-020-06 — Given a Member's workspace save that returns a Member with withheld fields unchanged, then the save is not refused and the stored contact fields are not overwritten.
- AC-011-020-07 — Given a Member who sets their own contact level, then it changes; given another Member who is not the admin or the operator, when they try to change it, then the answer is 403 and nothing changes.
- AC-011-020-08 — Given the migration, then it adds one column with the default `business`, changes no other field and the counts of `members` and `change_events` are equal before and after.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. `members.contact_visibility` in a new migration (schema 9); `memberView` (`apps/api/audience.mjs`) used by `snapshot` (`apps/api/service.mjs`) and `readLegacy` (`apps/api/workspace.mjs`); the comparison of the Member save uses the viewer's view of the row.
- Today (0.5.1): a Guest reads only the ID, PID, display name and status (`guestMember`, `apps/api/service.mjs:17`); every Member reads every field, `legacy_metadata` included.

## Notes
- Contact data is never public: the column has no `public` value.
- Q-V7 of [ADR-005](../../../architecture/decisions.md) is the open choice, with the question whether `notes` should be admin-only by default. Enforcement is in the application; a database policy cannot withhold one column of a visible row.
