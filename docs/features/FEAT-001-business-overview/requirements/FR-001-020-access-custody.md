---
id: FR-001-020
title: No anonymous write, and database credentials stay on the server
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-005, FEAT-007, FEAT-011]
---

# FR-001-020 — No anonymous write, and database credentials stay on the server

The system SHALL NOT open an anonymous write on a backend that holds real data and SHALL keep the PostgreSQL credentials on the server side only.

## Acceptance criteria
- AC-001-020-01 — Given a request with no session, when it writes, then it is refused.
- AC-001-020-02 — Given the static package and the browser bundle, then they hold no database URL, admin URL or credential.

## Implementation
- Write authorization `authorizeWrite` in `apps/api/member-auth.mjs` and the same-origin check in `apps/api/api.mjs`; the hosted handler `apps/api/cloud.mjs`.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“guest write attempts cannot alter state …”), `apps/api/test/http.test.mjs`. Private URLs absent from the static package ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”); anonymous API 401 and secret checks on the 44-file package ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “Access and packaging”).

## Notes
- Spec trace ([spec.md](../spec.md)): ZGO-11 (“Backend ที่เก็บข้อมูลจริงไม่เปิด anonymous read/write; PostgreSQL credentials อยู่ฝั่ง server เท่านั้น”) (AC-01 for the write half, AC-02 for the credentials). Legacy label: ZGO-11 (part).
- Conflict with later approved work, recorded for the owner: ZGO-11 also says there is no anonymous read. Production now opens in Guest mode, which reads ([FEAT-005](../../FEAT-005-guest-access/feature.md)), narrowed to public items by [FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md). This requirement therefore keeps the write and credential halves; the read half is FEAT-005’s and FEAT-011’s. Guests still read campaign records and Member names (PLAN-002 Q1).
