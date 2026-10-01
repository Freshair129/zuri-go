---
id: FR-006-011
title: Each Member’s code is independent and random, stored only as a salted hash
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-007-003, NFR-006-001]
---

# FR-006-011 — Each Member’s code is independent and random, stored only as a salted hash

The system SHALL give each Member who may sign in an independent, cryptographically random code of 24 URL-safe characters, SHALL store only a salted scrypt hash of it, with a credential version and an enabled flag, in the private table `member_credentials`, and SHALL offer no endpoint that lists or reads credential records.

## Acceptance criteria
- AC-006-011-01 — Given a provisioning run, then every issued code has 24 URL-safe characters and no two Members hold the same code.
- AC-006-011-02 — Given a stored credential, then it holds a salted hash (`salt:hash`) and a credential version of at least 1, and the plaintext code is nowhere in PostgreSQL.
- AC-006-011-03 — Given the API, then no route lists or reads credential rows; the session and the sign-in answers hold the public identity only ([FR-006-017](FR-006-017-session-public-identity-only.md)).
- AC-006-011-04 — Given the four Members of the production Business at 0.4.0, then each received an independent code at version 1.

## Implementation
- `apps/api/provision-members.mjs:provisionMembers` — `randomBytes(18).toString('base64url')` (24 characters), `passwordHash` (`apps/api/team-auth.mjs`: random 16-byte salt and scrypt), `INSERT INTO member_credentials`.
- `apps/api/migrations/005_member_identity.sql` — table `member_credentials` (composite primary key and foreign key to `members`, `credential_version bigint`, `enabled`).
- Test: `apps/api/test/member-auth.test.mjs` (“PID creation is unique and immutable; operator provisioning is idempotent…”: the issued codes are unique and 24 characters long); `apps/api/test/team-auth.test.mjs` (salted derivation). Run on 2026-10-01 by the author of this file: passed. AC-006-011-03 rests on reading `api.mjs`, which has no credential route. AC-006-011-04 is the 0.4.0 production record (“Credentials were provisioned once, version 1”).

## Notes
- Spec: [spec.md](../spec.md) §2 (the bullet “Generate an independent cryptographically random password (24 URL-safe characters)”), §3 (the table row for `member_credentials`: “no public list/read endpoint”).
- The database-level isolation of the table is [NFR-006-001](NFR-006-001-credential-table-isolation.md).
- The sign-in input is the code alone ([FEAT-007](../../FEAT-007-single-code-login/feature.md)); the spec’s word “password” for the code is a technical name.
