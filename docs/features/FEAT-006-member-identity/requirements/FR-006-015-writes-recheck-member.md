---
id: FR-006-015
title: Every write rechecks the Member and the credential in its own transaction
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-007-005, FR-007-010, FR-005-003]
---

# FR-006-015 — Every write rechecks the Member and the credential in its own transaction

The system SHALL validate on every hosted write, inside the transaction of that write, that the Member is Active, the credential is enabled and its version equals the session’s, SHALL serialize that check against a concurrent reset or disable, and SHALL NOT rely on the cookie or the screen alone; an Inactive Member or a disabled credential therefore cannot write.

## Acceptance criteria
- AC-006-015-01 — Given a session whose Member became Inactive, then the next read is answered as a Guest and the next write with 401.
- AC-006-015-02 — Given a session whose credential version was raised, then the next write answers 401.
- AC-006-015-03 — Given a session whose credential was disabled, then the next write answers 401.
- AC-006-015-04 — Given a write that runs while a reset or disable commits, then the write fails to serialize (409) or is refused; it never proceeds on the stale snapshot.

## Implementation
- `apps/api/db.mjs:transaction` — a `REPEATABLE READ` transaction whose first step is `resolveViewer`; `apps/api/viewer.mjs:resolveViewer` → `apps/api/member-auth.mjs:resolveMember` (Active, enabled, version); `authorizeWrite` locks the Business row `FOR UPDATE` and refuses a write without a Member; `apps/api/provision-members.mjs` takes the same lock first.
- Test: `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”: after the version is raised `/session` is unauthenticated and the write answers 401). Run on 2026-10-01 by the author of this file: passed. AC-006-015-01 and -03 follow from the same `resolveMember` and are not asserted on a live session by a committed test; AC-006-015-04 is not tested for concurrency and rests on the 0.4.0 record (“repeatable-read conflicts fail rather than authorize from a stale snapshot”, [member review](../../../history/zuri-go-member-review/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) §2 (the bullet “Inactive or disabled sign-in accounts cannot log in or write”), §4 (the bullet “Every write validates credential enabled/version and Member active status from PostgreSQL…”), §6.
- Refusing the sign-in itself is [FR-007-005](../../FEAT-007-single-code-login/requirements/FR-007-005-inactive-or-disabled-refused.md).
