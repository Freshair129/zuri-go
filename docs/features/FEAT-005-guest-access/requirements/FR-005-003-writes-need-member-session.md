---
id: FR-005-003
title: Mutations need an active Member session; Guests remain read-only
delivery: declared
status: approved
legacy: []
relations:
  decided_by: [ADR-008]
  relates_to: [FEAT-005, FEAT-006, FEAT-007, FR-007-010]
---

# FR-005-003 — Mutations need an active Member session; Guests remain read-only

The system SHALL require, for every state-changing request (POST, PATCH, PUT, DELETE) or internal approval, a valid active Member session and a same-origin request; SHALL answer a Guest mutation or approval with 401 and change no data; and SHALL give every active Member identical CRUD and internal approval rights over every mutable non-secret record in the configured Business. Audience, team, ownership, assignee, RACI and named-viewer metadata SHALL NOT restrict those rights. DELETE follows each record family's existing archive, deactivate, cancel or retract lifecycle; a reversible tombstone/archive is added only for mutable Task, Meeting or week-plan records with no existing lifecycle. Foreign keys, work, append-only audit and immutable measurement/Visual history are preserved; hard-delete and purge are out of scope.

## Acceptance criteria
- AC-005-003-01 — Given no session, when a mutation or internal approval is sent for any Business record or attachment, then the answer is 401 and a read of the state afterwards equals the read before.
- AC-005-003-02 — Given a write that is cross-origin, or without the same-origin application header or a JSON content type, then the answer is 403.
- AC-005-003-03 — Given any active signed-in Member, when they create, update, delete or internally approve a mutable non-secret record, then the authorized change is stored and is readable by a Guest or another active Member in the same Business; audit events remain append-only.
- AC-005-003-04 — Given an altered or expired session cookie, then the write answers 401 (FR-007-010).

## Implementation
- `apps/api/cloud.mjs:handler` — `if(req.method!=='GET'&&!claims){send(res,401,{error:'เข้าสู่ระบบด้วย รหัสระบุตัวตนก่อนแก้ไข',code:'AUTH_REQUIRED'})}`; `apps/api/api.mjs:handleApi` — the same-origin header and JSON check and `authorizeWrite` (`apps/api/member-auth.mjs`) inside the write transaction.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“guest write attempts cannot alter state, including attachments and wrong businesses”; “hosted API allows guest reads, denies writes…”; “Vercel parsed JSON writes persist across independently authenticated sessions”). Run on 2026-10-01 by the author of this file: passed. Production: hosted Guest writes answered 401 and a cross-origin write 403 on 0.5.0 and 0.5.1 ([0.5.0](../../../releases/0.5.0/verification.md), [0.5.1](../../../releases/0.5.1/verification.md)).

## Notes
- Supersession: [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) establishes equal active-Member CRUD and internal approval. This changed authorization behavior is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification is NOT_RUN after the command runner rejected bootstrap; production remains on schema 11 pending separately authorized migration 012 and deployment; test and release evidence below describes earlier behavior.
- Spec: [spec.md](../spec.md) “Behavior” bullet 3, “Verification” items 2 and 4 (the first sentence).
- The 0.3.1 text says “valid shared-team session”; 0.4.0 replaced it with the individual Member session ([FEAT-006](../../FEAT-006-member-identity/feature.md)) and 0.4.2 with the single code ([FEAT-007](../../FEAT-007-single-code-login/feature.md)). The shared password and the team cookie are no longer accepted ([FR-006-021](../../FEAT-006-member-identity/requirements/FR-006-021-old-shared-access-rejected.md)).
- The API authorizes writes independently of the screen ([AGENTS.md](../../../../AGENTS.md)); the local runtime on `127.0.0.1:4319` is a trusted operator and has no Guest mode ([SRV-002](../../../services/SRV-002-local/SERVICE.md)).
