---
id: FR-007-002
title: The typed code is cleared when the modal closes or sign-in succeeds
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-007-001]
---

# FR-007-002 — The typed code is cleared when the modal closes or sign-in succeeds

The system SHALL clear the typed code from the sign-in modal when the modal is closed and when sign-in succeeds, so that no code stays in the page for the next person.

## Acceptance criteria
- AC-007-002-01 — Given a code typed into the modal, when the modal is closed or cancelled, then the field is empty the next time the modal opens.
- AC-007-002-02 — Given a code typed into the modal, when sign-in succeeds, then the field is cleared and the modal closes.

## Implementation
- `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — `close` and `login` call `setPassword('')`.
- Evidence: the 0.4.2 record names “clear-on-close/success” from the source form ([0.4.2 verification](../../../releases/0.4.2/verification.md)); its browser interaction check was NOT_RUN and no later record runs it. No committed test covers it.

## Notes
- Spec: [spec.md](../spec.md) “Acceptance / success / exit criteria” item 6 (“รหัสถูกล้างเมื่อปิดหรือ login สำเร็จ”).
- A failed attempt keeps the typed code so that it can be corrected; the spec is silent on that case and this requirement does not decide it.
