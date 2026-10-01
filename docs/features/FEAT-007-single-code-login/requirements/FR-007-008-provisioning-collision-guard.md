---
id: FR-007-008
title: Provisioning and reset refuse a code that collides with another credential
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-006-012, FR-006-014]
---

# FR-007-008 — Provisioning and reset refuse a code that collides with another credential

The system SHALL check, before saving, that a newly generated code does not match any other credential of the Business, SHALL refuse the provisioning or reset when it does, and SHALL NOT reset an existing credential automatically; an ambiguity that already exists is resolved only by an explicit operator reset.

## Acceptance criteria
- AC-007-008-01 — Given a generated code that matches another credential of the Business, when an operator provisions or resets a Member, then the operation fails with “Generated identity code collision; retry provisioning.” and nothing is saved.
- AC-007-008-02 — Given credentials issued before this change, when single-code sign-in is released, then none is reset or reissued.
- AC-007-008-03 — Given two credentials that already match the same code, then neither signs in (FR-007-004) until the operator runs an explicit reset for the target PID.

## Implementation
- `apps/api/provision-members.mjs:provisionMembers` — after generating `password` and before the `INSERT … ON CONFLICT` it verifies the code against every `password_hash` of the Business and throws on a match; the whole transaction rolls back.
- No committed test forces the collision (a random 24-character code cannot be made to collide without a stub). The reset itself and idempotence are covered by `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable; operator provisioning is idempotent and reset revokes sessions”), which passed on 2026-10-01. The 0.4.2 record lists the guard in its version diff and states that no real code was reset ([0.4.2 verification](../../../releases/0.4.2/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) “Evidence และวิธีทำ” last bullet (“Operator provisioning/reset…”), “ขอบเขตไฟล์” (`provision-members.mjs`).
- Operator tooling runs outside the deployment; this requirement does not add a Member-facing way to reset a code.
