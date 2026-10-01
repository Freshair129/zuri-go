---
id: FR-006-012
title: Provisioning is idempotent and a Member registered later has a PID but no code
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-006-001, FR-007-008]
---

# FR-006-012 — Provisioning is idempotent and a Member registered later has a PID but no code

The system SHALL let the trusted operator provision credentials idempotently, so that running it again neither rotates an existing code nor reassigns a PID, and SHALL give a Member who is registered later a PID at once but no credential until the operator provisions one.

## Acceptance criteria
- AC-006-012-01 — Given a Business whose Members were provisioned, when provisioning runs again, then no Member is reported as newly issued and no code changes.
- AC-006-012-02 — Given a Member with a credential whose private handover is missing or does not match, when provisioning runs, then it fails with “explicit --reset required” and changes nothing.
- AC-006-012-03 — Given a Member registered in the application, then the Member has a PID and no credential, can be assigned work, and cannot sign in until the operator provisions one.

## Implementation
- `apps/api/provision-members.mjs:provisionMembers` — an existing credential is verified against its handover and reported as `created:false`; a missing or unverifiable handover throws; only a Member without a credential, or an explicit `--reset`, gets a new code.
- Test: `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable; operator provisioning is idempotent and reset revokes sessions”): the second run reports every Member as not created. Run on 2026-10-01 by the author of this file: passed. AC-006-012-02 rests on reading the code; AC-006-012-03 is stated in [FR-006-001](FR-006-001-register-member.md) “Notes”.

## Notes
- Spec: [spec.md](../spec.md) §1 assumption 4, §2 (the bullet “Provisioning is idempotent”), §6 (“repeated provisioning do not change them”).
- Provisioning is an operator tool outside the deployment (`npm run members`); a hosted Member cannot run it.
