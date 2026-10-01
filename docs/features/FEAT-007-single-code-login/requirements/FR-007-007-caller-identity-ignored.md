---
id: FR-007-007
title: A PID or member ID sent by the caller never selects the signed-in Member
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FEAT-006]
---

# FR-007-007 — A PID or member ID sent by the caller never selects the signed-in Member

The system SHALL NOT use a PID or member ID that the caller attaches to a sign-in to select the Member, so that an older browser that still sends a PID gets exactly the result of one that does not.

## Acceptance criteria
- AC-007-007-01 — Given a code and the PID and member ID of another Member sent with it, when the sign-in is submitted, then the session is that of the code’s owner.
- AC-007-007-02 — Given a PID of an existing Member and a code that is not theirs, when it is submitted, then the sign-in is refused.

## Implementation
- `apps/api/cloud.mjs:handler` and `apps/api/member-auth.mjs:loginMember` — only `input?.password` is read; the Business is the only other input.
- Test: `apps/api/test/cloud-handler.test.mjs` (“four individual identities, single-code binding, audit actors, disabled/reset sessions and legacy rejection”) signs in four times with another Member’s `pid` and `memberId` attached and asserts the identity is the code owner’s. Run on 2026-10-01 by the author of this file: passed.

## Notes
- Spec: [spec.md](../spec.md) “Evidence และวิธีทำ” bullet 2, “Acceptance / success / exit criteria” item 3.
- AC-007-007-02 follows from the code reading only `password`; the committed test does not send a PID with a wrong code.
