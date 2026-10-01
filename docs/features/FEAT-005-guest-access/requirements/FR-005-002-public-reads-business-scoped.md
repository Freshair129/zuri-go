---
id: FR-005-002
title: Session, bootstrap and Business reads are public and limited to the configured Business
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FR-011-003, FR-011-007]
---

# FR-005-002 — Session, bootstrap and Business reads are public and limited to the configured Business

The system SHALL answer the session, the bootstrap and the Business read routes without a session, SHALL restrict them to the configured Business so that a request that names another Business fails, and SHALL NOT expose a way to select a tenant, database credentials or private server files.

## Acceptance criteria
- AC-005-002-01 — Given no session, when `/session` and `/bootstrap` are read, then each answers 200 and `/session` reports `authenticated: false`.
- AC-005-002-02 — Given no session, when a read route of the configured Business is called, then it answers 200 with the content that the Guest rule allows ([FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md)).
- AC-005-002-03 — Given a read or a write that names another Business ID, then it answers 403 and returns no data.
- AC-005-002-04 — Given a public request for a backend source file, the private environment file or a member handover path, then it answers 404; no response holds a database credential.

## Implementation
- `apps/api/cloud.mjs:handler` — origin and method checks, then the route; the Business is `cfg.businessId`, never a request value. `apps/api/api.mjs:handleApi` — `if(!match||match[1]!==businessId)fail('Business access denied',403)` and the same check on the attachment and campaign-task routes.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“hosted API allows guest reads, denies writes…”: `bootstrap` 200, `session` unauthenticated, another Business 403; “guest write attempts cannot alter state…”: another Business 403). Run on 2026-10-01 by the author of this file: passed.
- Evidence for AC-005-002-04: production requests for backend source and the private environment file returned 404 in the 0.3.0 and 0.4.0 checks ([cloud review](../../../history/zuri-go-cloud-review/verification.md), “Access and packaging”; [member review](../../../history/zuri-go-member-review/verification.md)); no committed test covers it and it was not rerun for this record.

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 2, “Verification” item 2 (“wrong Business fails”).
- What a Guest read returns is narrower than in 0.3.1: [FR-011-007](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-007-guest-public-only.md) (public items; Members reduced to ID, PID, display name and status).
