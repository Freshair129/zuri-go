---
id: FR-007-004
title: A code that matches more than one credential is refused
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-007-003]
---

# FR-007-004 — A code that matches more than one credential is refused

The system SHALL refuse a code that matches more than one credential of the Business, counting disabled credentials and credentials of Inactive Members among the matches, SHALL NOT choose the first match, and SHALL NOT reveal which accounts matched.

## Acceptance criteria
- AC-007-004-01 — Given two active credentials that match the same code, when it is submitted, then the sign-in is refused and no session starts.
- AC-007-004-02 — Given one active credential and one disabled credential that match the same code, when it is submitted, then the sign-in is refused, so that enabling or disabling a duplicate never changes who owns the code.
- AC-007-004-03 — Given the same candidates read in the reverse order, then the answer is the same.

## Implementation
- `apps/api/member-auth.mjs:loginMember` — collects every matching candidate in `matched` and accepts only `matched.length===1`.
- Test: `apps/api/test/member-auth.test.mjs` (“single code rejects ambiguity even with a disabled duplicate and validates input”) covers both pairs in both orders. Run on 2026-10-01 by the author of this file: passed.

## Notes
- Spec: [spec.md](../spec.md) “Evidence และวิธีทำ” bullet 4 and bullet 5 (the first sentence), “Acceptance / success / exit criteria” item 2 (“รหัส ambiguous login ไม่ได้”).
- Only an explicit operator reset removes an ambiguity ([FR-007-008](FR-007-008-provisioning-collision-guard.md)).
