---
id: FR-005-003
title: Every write needs a Member session; a Guest write answers 401 and changes nothing
delivery: implemented
status: proposed
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-005, FEAT-006, FEAT-007, FR-007-010]
---

# FR-005-003 — Every write needs a Member session; a Guest write answers 401 and changes nothing

The system SHALL require, for every state-changing request (POST, PATCH, PUT), a valid Member session and a same-origin JSON request, SHALL answer a Guest’s write with 401 and change no database row, and SHALL persist the write of a signed-in Member in PostgreSQL.

## Acceptance criteria
- AC-005-003-01 — Given no session, when a POST, PATCH or PUT is sent (a record, the whole workspace, an attachment upload or removal), then the answer is 401 and a read of the state afterwards equals the read before.
- AC-005-003-02 — Given a write that is cross-origin, or without the same-origin application header or a JSON content type, then the answer is 403.
- AC-005-003-03 — Given a signed-in Member, when they write, then the change is stored in PostgreSQL and is read back by another independently signed-in session.
- AC-005-003-04 — Given an altered or expired session cookie, then the write answers 401 (FR-007-010).

## Implementation
- `apps/api/cloud.mjs:handler` — `if(req.method!=='GET'&&!claims){send(res,401,{error:'เข้าสู่ระบบด้วย รหัสระบุตัวตนก่อนแก้ไข',code:'AUTH_REQUIRED'})}`; `apps/api/api.mjs:handleApi` — the same-origin header and JSON check and `authorizeWrite` (`apps/api/member-auth.mjs`) inside the write transaction.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“guest write attempts cannot alter state, including attachments and wrong businesses”; “hosted API allows guest reads, denies writes…”; “Vercel parsed JSON writes persist across independently authenticated sessions”). Run on 2026-10-01 by the author of this file: passed. Production: hosted Guest writes answered 401 and a cross-origin write 403 on 0.5.0 and 0.5.1 ([0.5.0](../../../releases/0.5.0/verification.md), [0.5.1](../../../releases/0.5.1/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 3, “Verification” items 2 and 4 (the first sentence).
- The 0.3.1 text says “valid shared-team session”; 0.4.0 replaced it with the individual Member session ([FEAT-006](../../FEAT-006-member-identity/feature.md)) and 0.4.2 with the single code ([FEAT-007](../../FEAT-007-single-code-login/feature.md)). The shared password and the team cookie are no longer accepted ([FR-006-021](../../FEAT-006-member-identity/requirements/FR-006-021-old-shared-access-rejected.md)).
- The API authorizes writes independently of the screen ([AGENTS.md](../../../../AGENTS.md)); the local runtime on `127.0.0.1:4319` is a trusted operator and has no Guest mode ([SRV-002](../../../services/SRV-002-local/SERVICE.md)).
