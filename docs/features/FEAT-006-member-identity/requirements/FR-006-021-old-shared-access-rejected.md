---
id: FR-006-021
title: The shared team password and the team cookie are rejected, with no fallback
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-005-003]
---

# FR-006-021 — The shared team password and the team cookie are rejected, with no fallback

The system SHALL reject the old shared team password and the Business-only team session now that Member sign-in exists, SHALL keep no shared-password fallback, and, if a rollout of identity fails, SHALL keep Guest reads and fail closed for writes instead of reactivating a shared password.

## Acceptance criteria
- AC-006-021-01 — Given a request that carries only the old team cookie, when it writes, then the answer is 401.
- AC-006-021-02 — Given the old shared password, when it is submitted at sign-in, then the answer is 401, because sign-in checks Member credentials only.
- AC-006-021-03 — Given a sign-in or a logout, then the old team cookie is expired in the same answer.
- AC-006-021-04 — Given the hosted configuration, then it holds no shared-password hash and no code path reads one.

## Implementation
- `apps/api/cloud.mjs:handler` — claims come only from `readMemberSession`; `/login` and `/logout` also set `sessionCookie('')`; `apps/api/member-auth.mjs:loginMember` — credentials of Members only.
- Test: `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”: a write with the old team cookie answers 401); `apps/api/test/member-auth.test.mjs` (a cookie named like the team cookie is rejected). Run on 2026-10-01 by the author of this file: passed. The 0.4.0 record shows the old shared password rejected on staging and production, and the obsolete variable removed before the final deployment ([member review](../../../history/zuri-go-member-review/verification.md)); the configuration was not read for this record, and no code path in `apps/api` reads a shared-password hash.

## Notes
- Spec: [spec.md](../spec.md) §1 assumption 3, §4 (the bullet “New versioned session payload … reject the old team cookie”), §5 steps 5 and 7, §6 (“the old shared cookie/password fail”).
- The team session helpers in `apps/api/team-auth.mjs` remain only for the origin check, the sign-in rate limit, the code hashing and expiring the old cookie.
