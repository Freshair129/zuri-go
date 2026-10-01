---
id: FR-007-005
title: A code whose owner is Inactive or whose credential is disabled is refused
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-006-014]
---

# FR-007-005 — A code whose owner is Inactive or whose credential is disabled is refused

The system SHALL refuse a code whose single matching credential is disabled or whose owner is an Inactive Member, and SHALL refuse a code that an operator reset has replaced.

## Acceptance criteria
- AC-007-005-01 — Given a code that matches one credential whose Member is Inactive, when it is submitted, then the sign-in is refused.
- AC-007-005-02 — Given a code that matches one credential that an operator disabled, when it is submitted, then the sign-in is refused; after the operator enables it, the same code signs in.
- AC-007-005-03 — Given a Member whose code the operator reset, when the earlier code is submitted, then it is refused.

## Implementation
- `apps/api/member-auth.mjs:loginMember` — accepts a single match only when `enabled` and `status==='active'`.
- Tests: `apps/api/test/member-auth.test.mjs` (“single code rejects ambiguity…” for the Inactive owner; “PID creation is unique and immutable; operator provisioning is idempotent and reset revokes sessions” for reset, disable, enable and Inactive); `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”, a disabled credential answers 401). Run on 2026-10-01 by the author of this file: passed.

## Notes
- Spec: [spec.md](../spec.md) “Evidence และวิธีทำ” bullets 3 and 4, “Acceptance / success / exit criteria” item 4 (the inactive/disabled and reset/revoked parts).
- The effect on a session that already exists is [FR-006-014](../../FEAT-006-member-identity/requirements/FR-006-014-reset-raises-version.md) and [FR-006-015](../../FEAT-006-member-identity/requirements/FR-006-015-writes-recheck-member.md).
