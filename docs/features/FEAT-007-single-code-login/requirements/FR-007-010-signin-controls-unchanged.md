---
id: FR-007-010
title: Single-code sign-in keeps the controls of Member sign-in
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-006-014, FR-006-015, FR-005-003]
---

# FR-007-010 — Single-code sign-in keeps the controls of Member sign-in

The system SHALL apply to single-code sign-in, unchanged, the controls of Member sign-in: the same-origin check, the persistent sign-in rate limit, the signed HttpOnly, Secure and SameSite=Strict versioned cookie with its expiry, and the credential-version recheck before every write, so that Guest write denial and the refusal of tampered or expired sessions still hold.

## Acceptance criteria
- AC-007-010-01 — Given a request whose origin is not the site’s, then it is refused with 403 before any sign-in is attempted.
- AC-007-010-02 — Given an exhausted sign-in bucket, when a code is submitted, then the answer is 429 with `Retry-After: 900`, and the counter is kept in PostgreSQL without a raw IP address.
- AC-007-010-03 — Given a tampered, expired or wrong-Business session cookie, then a read is answered as a Guest and a write with 401.
- AC-007-010-04 — Given a Member whose credential version was raised, then their earlier session fails on the next write ([FR-006-014](../../FEAT-006-member-identity/requirements/FR-006-014-reset-raises-version.md)).
- AC-007-010-05 — Given a Guest, then every write answers 401 and changes no row ([FR-005-003](../../FEAT-005-guest-access/requirements/FR-005-003-writes-need-member-session.md)).

## Implementation
- `apps/api/cloud.mjs:handler` (origin and method checks, `consumeLoginAttempt`, `readMemberSession`); `apps/api/team-auth.mjs` (`cloudOriginAllowed`, `consumeLoginAttempt`); `apps/api/member-auth.mjs` (`memberToken`, `readMemberSession`, `memberCookie`, `resolveMember`).
- Tests: `apps/api/test/cloud-handler.test.mjs` (“hosted API allows guest reads…”: cross-origin logout 403, altered cookie 401; “rate limiting is persisted in PostgreSQL…”; “four individual identities…”: a raised version fails the session); `apps/api/test/team-auth.test.mjs` (origin and limit); `apps/api/test/member-auth.test.mjs` (“member session is versioned, signed, bounded…”). Run on 2026-10-01 by the author of this file: passed. The cross-origin test posts to `/logout`, not `/login`; the origin check runs before the route is chosen, so it covers both.

## Notes
- Spec: [spec.md](../spec.md) “Evidence และวิธีทำ” bullet 6 (“คง input length/type validation, same-origin checks…”), “Acceptance / success / exit criteria” item 4.
- The definitions of the session and of the recheck are FEAT-006 requirements; this one states that the single code changes none of them.
