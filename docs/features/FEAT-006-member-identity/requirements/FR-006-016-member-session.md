---
id: FR-006-016
title: A Member session is signed, versioned, bounded and distinct from the team cookie
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-005-007, FR-007-010]
---

# FR-006-016 — A Member session is signed, versioned, bounded and distinct from the team cookie

The system SHALL start a signed session that carries the Business ID, the Member UUID, the credential version and an expiry of at most 12 hours, in a cookie named `__Host-zuri-go-member` that is HttpOnly, Secure and SameSite=Strict, and SHALL reject a session that is altered, expired, of another Business, signed with another key or of another cookie schema.

## Acceptance criteria
- AC-006-016-01 — Given a signed-in Member, then the session payload holds the schema version 2, the Business ID, the Member UUID, the credential version and an expiry, and no PID, name or credential.
- AC-006-016-02 — Given the cookie, then it is HttpOnly, Secure, SameSite=Strict and expires within 12 hours.
- AC-006-016-03 — Given a cookie that is altered, expired, issued for another Business, signed with another key, valid for more than 12 hours or named like the team cookie, then it is rejected and the request is a Guest’s.

## Implementation
- `apps/api/member-auth.mjs` — `COOKIE='__Host-zuri-go-member'`, `LIFETIME=43200`, `memberToken`, `readMemberSession` (HMAC-SHA256, constant-time compare, `v===2`, Business, UUID, version, expiry window), `memberCookie`.
- Test: `apps/api/test/member-auth.test.mjs` (“member session is versioned, signed, bounded and distinct from team cookie”) covers each rejected case. Run on 2026-10-01 by the author of this file: passed.

## Notes
- Spec: [spec.md](../spec.md) §4 (the bullets “New versioned session payload contains Business ID, canonical Member UUID, credential version and expiry; a distinct member-cookie name and schema reject the old team cookie…” and “bounded lifetime”), §6 (“tampering, expiry, wrong Business … fail”).
- The 12-hour bound is the code’s; the spec says “bounded lifetime”. The old team cookie is also expired by sign-in and logout ([FR-006-021](FR-006-021-old-shared-access-rejected.md)).
