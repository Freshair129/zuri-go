---
id: FR-007-003
title: The server identifies the Member from the code alone
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FEAT-006, FR-006-011]
---

# FR-007-003 — The server identifies the Member from the code alone

The system SHALL verify a submitted code on the server against every credential of the configured Business, without stopping at the first match and without sending any credential hash to the browser, and when exactly one credential matches and its owner may sign in (FR-007-004, FR-007-005) SHALL start the ordinary Member session of that owner; the personal code of each Member issued before this change stays valid and none is reissued.

## Acceptance criteria
- AC-007-003-01 — Given a Member’s existing personal code, when it is submitted with no PID, then the session and the returned identity (`memberId`, `pid`, `displayName`) are those of its owner; each of the four Members with a credential when the change was released authenticated this way.
- AC-007-003-02 — Given a Business with several credentials, when a code is submitted, then the server reads only that Business’s candidates, verifies the code against all of them, and counts the matches.
- AC-007-003-03 — Given a sign-in, then no credential hash or other credential record is returned to the browser.

## Implementation
- `apps/api/member-auth.mjs:loginMember` — reads the Business’s `members` joined to `member_credentials`, runs `verifyPassword` on every candidate, and returns the identity only for exactly one match.
- `apps/api/cloud.mjs:handler` — route `/login` calls `loginMember(c,cfg.businessId,input?.password)` and sets the versioned Member cookie.
- Tests: `apps/api/test/member-auth.test.mjs` (“single code rejects ambiguity even with a disabled duplicate and validates input”, first assertion); `apps/api/test/cloud-handler.test.mjs` (“four individual identities, single-code binding, audit actors, disabled/reset sessions and legacy rejection”).
- Checked 2026-10-01 by the author of this file: `node --test apps/api/test/cloud-handler.test.mjs apps/api/test/member-auth.test.mjs` passed (15 tests, local PostgreSQL). The release record states that on staging and on production all four existing codes authenticated to the correct PID and session ([0.4.2 verification](../../../releases/0.4.2/verification.md)); the owner reported on 2026-10-01 that production sign-in as a Member passed ([0.5.1 verification](../../../releases/0.5.1/verification.md), “Owner’s hosted checks”), which the agent did not observe.

## Notes
- Spec: [spec.md](../spec.md) “พฤติกรรมที่เปลี่ยน” bullets 2 and 3, “Evidence และวิธีทำ” bullets 1 to 3, “Acceptance / success / exit criteria” item 1.
- The release added no schema and changed no account data (“Evidence และวิธีทำ” bullet 6); this is a property of release 0.4.2, not a standing behavior, and the 0.4.2 record states that schema 5 was kept.
- Sign-in is hosted only: the local runtime has no Member sign-in ([SRV-002](../../../services/SRV-002-local/SERVICE.md)).
