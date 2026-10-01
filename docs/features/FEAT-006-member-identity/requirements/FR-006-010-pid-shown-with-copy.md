---
id: FR-006-010
title: The Members view and the Member details show the PID, with a copy action
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-011-007]
---

# FR-006-010 — The Members view and the Member details show the PID, with a copy action

The system SHALL show each Member’s PID on the Members view and, with a copy action, in the Member details, and SHALL show the name and PID of the signed-in Member in the top bar.

## Acceptance criteria
- AC-006-010-01 — Given the Members view of a PostgreSQL workspace, then each Member card shows its PID.
- AC-006-010-02 — Given a Member’s details, then the PID is shown with a button “คัดลอก PID” that copies it.
- AC-006-010-03 — Given the browser workspace that is not backed by PostgreSQL, then a Member has no PID and the view says “PID จะกำหนดเมื่อบันทึกใน PostgreSQL”.
- AC-006-010-04 — Given a Guest, then the PID is still shown, because a Guest reads each Member’s ID, PID, display name and status ([FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) AC-011-007-06).

## Implementation
- `apps/web/src/content/meeting/MeetingWorkspace.jsx:MeetingWorkspace` — the Members view (`m.pid||'PID จะกำหนดเมื่อบันทึกใน PostgreSQL'`); `apps/web/src/content/meeting/TaskForms.jsx:MemberForm` — `PID: <strong>{member.pid}</strong>` and `คัดลอก PID`; `apps/web/src/content/business/TeamAccess.jsx` — the top bar.
- Evidence: the 0.4.0 production browser check, “Member cards show all four PIDs; details show immutable PID and copy action” ([member review](../../../history/zuri-go-member-review/verification.md)); the 0.5.1 production check as a Guest, “4 cards with display name, PID and status” ([0.5.1 verification](../../../releases/0.5.1/verification.md)). No committed test covers the screens.

## Notes
- Spec: [spec.md](../spec.md) §2 (the bullet “Members page and member details display PID with a copy action”; the top-bar display is the one of the sign-in flow, now [FR-007-009](../../FEAT-007-single-code-login/requirements/FR-007-009-owner-identity-shown-and-attributed.md)).
- The 0.4.0 text lets a Guest read every Member field; since 0.5.1 a Guest reads only ID, PID, display name and status (D16), which is the cited requirement above.
