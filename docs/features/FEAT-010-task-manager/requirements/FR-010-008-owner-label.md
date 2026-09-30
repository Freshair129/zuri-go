---
id: FR-010-008
title: Owner label until a Member is bound
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-008 — Owner label until a Member is bound

The system SHALL show the owner text of a Workboard task as an owner label until a signed-in Member binds a person to the task, and SHALL never match that text to a Member automatically.

## Acceptance criteria
- AC-010-008-01 — Given a Workboard task whose owner is the text “Chef”, then it is shown with the owner label “Chef” and with no R.
- AC-010-008-02 — Given a Member whose display name is “Chef”, then the task is still not bound to that Member.
- AC-010-008-03 — Given that task, when a signed-in Member binds a person as R, then the task shows that person, and the stored owner label is unchanged.
- AC-010-008-04 — Given a Guest, when they try to bind a person, then it is refused with 401.

## Implementation
- Not built. Today the owner is `task.owner` inside `legacy_metadata` of the `campaign-legacy` row (`apps/api/workspace.mjs:68`) and nothing binds it.
- Precedent for “no display-name matching”: `apps/api/migrations/005_member_identity.sql:22`. The campaign’s own owner is matched by display name when exactly one Member matches (`workspace.mjs:64`); that rule belongs to the campaign, not the task, and is unchanged.

## Notes
- ADR-003 D6; ARCH-001 §5, step 8, forbids guessing owners.
