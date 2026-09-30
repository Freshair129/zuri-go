---
id: FR-011-003
title: Viewer identity on every read
part: FEAT-011-P01
owner: DOM-IAM
delivery: declared
status: approved
relations:
  decided_by: [ADR-004]
---

# FR-011-003 — Viewer identity on every read

The system SHALL resolve, for every request including reads, one viewer — Guest, a signed-in Member or the trusted local operator — from the session alone, and SHALL hand that viewer to the read logic and to the database transaction.

## Acceptance criteria
- AC-011-003-01 — Given a request with a valid Member session, when it reads any endpoint, then the viewer is that Member, whose credential version and active status are rechecked as for writes.
- AC-011-003-02 — Given a request without a session, or with an expired, tampered or wrong-Business session, when it reads, then the viewer is Guest.
- AC-011-003-03 — Given a request that names a `memberId`, `pid` or `actor` in its query or body, when the viewer is resolved, then those fields are ignored.
- AC-011-003-04 — Given the local server on `127.0.0.1:4319`, when it reads, then the viewer is the local operator, who sees every row of the local database.
- AC-011-003-05 — Given any transaction, when it starts, then the viewer kind and member ID are set with `set_config` next to `zuri_go.business_id`.

## Implementation
- Not built.
- Today reads do not resolve the Member: `authorizeWrite` sets the actor for writes only (`apps/api/member-auth.mjs:26-31`, `apps/api/api.mjs:12`), and `transaction()` sets only the Business (`apps/api/db.mjs:6`).

## Notes
- A viewer never widens because of a request parameter.
