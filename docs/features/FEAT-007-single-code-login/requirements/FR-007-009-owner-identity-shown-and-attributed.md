---
id: FR-007-009
title: The session, the top bar and the audit show the real owner of the code
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-007, FR-005-005, FR-006-019]
---

# FR-007-009 — The session, the top bar and the audit show the real owner of the code

The system SHALL start the session of the owner of the code with the canonical Member UUID and PID taken from the server, SHALL show that Member’s name and PID in the top bar, and SHALL keep the PID as the identifier of the Member in the database, the Member cards, the session and the audit, not as something the user types to sign in.

## Acceptance criteria
- AC-007-009-01 — Given a successful sign-in, then the session returns the owner’s `memberId`, `pid` and `displayName`, and the top bar reads “name · PID” of that Member.
- AC-007-009-02 — Given a sign-in followed by a write, then the audit event records the actor’s canonical Member UUID and PID, whatever the request claims.
- AC-007-009-03 — Given a write action that opened the sign-in modal, when sign-in succeeds, then the chosen action continues ([FR-005-005](../../FEAT-005-guest-access/requirements/FR-005-005-action-resumes.md)).

## Implementation
- `apps/api/member-auth.mjs:identity` and `publicIdentity`; `apps/api/cloud.mjs:handler` (the `/login` and `/session` answers).
- `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — the badge `session.member?.displayName+' · '+session.member?.pid`; `login` and the pending action in `requestWrite`.
- Test: `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”) asserts `actor_member_id` and `actor_pid` for each of four sign-ins. Run on 2026-10-01 by the author of this file: passed. The resumed action after the single-code modal is not covered by a committed test, and the 0.4.2 record states that browser interaction was NOT_RUN. The 0.4.0 production browser check, made with the PID and password form, saw the name and PID in the bar and the resumed editor ([0.4.0 record](../../../history/zuri-go-member-review/verification.md)); that was before the single code.

## Notes
- Spec: [spec.md](../spec.md) “พฤติกรรมที่เปลี่ยน” bullets 5 and 6, “Acceptance / success / exit criteria” items 5 (first sentence) and 6 (“resumed write flow ยังทำงาน”).
- Who the audit actor is, and the history that predates it, are [FR-006-019](../../FEAT-006-member-identity/requirements/FR-006-019-server-derives-actor.md) and [FR-006-020](../../FEAT-006-member-identity/requirements/FR-006-020-earlier-history-keeps-label.md). The other half of item 5, that tasks, RACI, MoSCoW, attachments and credential values stayed as they were, was checked once for release 0.4.2 by row digests (`database-preservation.json`, kept under `.local`) and is not a standing behavior.
