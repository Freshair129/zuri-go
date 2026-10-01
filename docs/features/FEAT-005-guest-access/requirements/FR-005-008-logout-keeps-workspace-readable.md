---
id: FR-005-008
title: Logout clears the session and keeps the workspace readable
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-005-003]
---

# FR-005-008 — Logout clears the session and keeps the workspace readable

The system SHALL clear the session on logout, SHALL keep the workspace readable as a Guest afterwards, and SHALL refuse later writes.

## Acceptance criteria
- AC-005-008-01 — Given a signed-in Member, when they log out, then the session cookie is cleared (`Max-Age=0`) and `/session` reports `authenticated: false`.
- AC-005-008-02 — Given the logged-out visitor, then reads still answer as a Guest and the workspace stays on screen.
- AC-005-008-03 — Given the logged-out visitor, when a write is attempted, then it answers 401.

## Implementation
- `apps/api/cloud.mjs:handler` — route `/logout` sets both cookies to expire; `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — `logout` keeps the page and sets the session to unauthenticated.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“hosted API allows guest reads…”: logout sets `Max-Age=0`, a cross-origin logout answers 403; “attachments persist bytes…”: after logout `/session` is unauthenticated, the attachment list answers as a Guest and a write answers 401). Run on 2026-10-01 by the author of this file: passed. The 0.3.1 production browser check saw “no login wall after logout” ([guest review](../../../history/zuri-go-guest-review/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 5 (the second sentence), “Verification” item 4 (“logout preserves readable state and blocks later writes”).
