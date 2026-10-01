---
id: FR-005-007
title: An expired session falls back to Guest mode and the next write asks to sign in
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-011-007, FR-006-016]
---

# FR-005-007 — An expired session falls back to Guest mode and the next write asks to sign in

The system SHALL treat a Member whose session has expired or become invalid as a Guest for every read, SHALL answer their next write with 401 and the code `AUTH_REQUIRED`, and SHALL make the screen open the sign-in modal for that write.

## Acceptance criteria
- AC-005-007-01 — Given a session cookie that is expired, altered or of another Business, when a read is made, then it is answered as a Guest.
- AC-005-007-02 — Given the same cookie, when a write is made, then the answer is 401 `AUTH_REQUIRED`.
- AC-005-007-03 — Given the screen receives `AUTH_REQUIRED`, then it shows Guest mode and opens the sign-in modal with “กรุณาใส่ รหัสระบุตัวตนเพื่อบันทึกการเปลี่ยนแปลง”.

## Implementation
- `apps/api/cloud.mjs:handler` and `apps/api/member-auth.mjs:readMemberSession` (a bad cookie gives no claims, so reads run as a Guest); `apps/web/src/content/business/api.mjs` (`zuri-go-auth-required` on `AUTH_REQUIRED`) and `TeamAccess.jsx` (`expired` handler).
- Tests: `apps/api/test/cloud-handler.test.mjs` (“hosted API allows guest reads…”: an altered cookie still reads `bootstrap` with 200 and a `PUT` of the workspace answers 401; “four individual identities…”: a raised credential version makes `/session` unauthenticated and the write 401); `apps/api/test/member-auth.test.mjs` (session expiry and tampering). Run on 2026-10-01 by the author of this file: passed. The screen reaction is not covered by a committed test or a browser record.

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 5 (the first sentence), “Verification” item 4.
- The same rule for a Member in the visibility model is [FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) AC-011-007-05.
