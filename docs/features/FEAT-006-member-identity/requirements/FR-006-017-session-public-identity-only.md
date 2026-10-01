---
id: FR-006-017
title: The session answer carries the public identity only
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: [ADR-004]
  relates_to: [FEAT-006, FR-011-003]
---

# FR-006-017 — The session answer carries the public identity only

The system SHALL answer `/session` with the authenticated flag, the Business ID and, for a valid session, the Member’s public identity `{memberId, pid, displayName}`, and SHALL NOT return a password hash, a credential record or the credential version.

## Acceptance criteria
- AC-006-017-01 — Given a valid Member session, when `/session` is read, then the Member is `{memberId, pid, displayName}` and nothing else of the credential.
- AC-006-017-02 — Given no session, then `/session` reports `authenticated: false` and no Member.
- AC-006-017-03 — Given the sign-in answer, then it carries the same public identity and no credential field.

## Implementation
- `apps/api/member-auth.mjs:publicIdentity`; `apps/api/cloud.mjs:handler` — the `/session` and `/login` answers.
- Test: `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”: each sign-in returns `member.memberId` and `member.pid`; “hosted API allows guest reads…”: `/session` of a Guest is unauthenticated). Run on 2026-10-01 by the author of this file: passed. The absence of credential fields in `/session` is read from `publicIdentity`; the committed regex check for `password_hash` and `credential_version` runs on `/state`, not on `/session`.

## Notes
- Spec: [spec.md](../spec.md) §4 (the first bullet).
- FEAT-011 adds `admin` and `teamIds` to the same answer for the Business-admin flag and team membership ([FR-011-003](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-003-viewer-identity.md)); they are not credential data.
