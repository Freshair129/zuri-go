---
id: FR-005-005
title: After a successful sign-in the chosen action continues
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-005-004, FR-007-009]
---

# FR-005-005 — After a successful sign-in the chosen action continues

The system SHALL continue the action that opened the sign-in modal once sign-in succeeds, so that the Guest does not repeat it.

## Acceptance criteria
- AC-005-005-01 — Given a Guest who chose an editor and signed in from the modal, when sign-in succeeds, then that editor opens.
- AC-005-005-02 — Given a Guest who opened the modal from the sign-in button and no action, when sign-in succeeds, then the modal closes and the page shows the Member’s name and PID.

## Implementation
- `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — `pending` holds the action; the effect on `canWrite` runs it once.
- Evidence: 0.3.1 production browser, “Login enables the task editor and resumes selected create-campaign form” ([guest review](../../../history/zuri-go-guest-review/verification.md)); 0.4.0 production browser, a real Chef sign-in “resumes the add-task editor” ([member review](../../../history/zuri-go-member-review/verification.md)). Both were made before the single code of 0.4.2; its record states that the resumed-write interaction was NOT_RUN ([0.4.2 verification](../../../releases/0.4.2/verification.md)) and no later record runs it. No committed test covers it.

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 4 (“After successful login, continue that chosen action”), “Verification” item 3 (the last sentence).
- [FEAT-007](../../FEAT-007-single-code-login/spec.md) “Acceptance” item 6 requires the resumed write flow to keep working under the single code; that is the open browser check.
