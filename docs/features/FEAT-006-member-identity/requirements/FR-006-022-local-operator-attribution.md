---
id: FR-006-022
title: A local write is attributed to the trusted local operator and never to a Member
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006]
---

# FR-006-022 — A local write is attributed to the trusted local operator and never to a Member

The system SHALL attribute a write made on the local runtime to the trusted local operator, SHALL NOT infer or impersonate a Member there, and SHALL NOT synchronize the local and the hosted databases.

## Acceptance criteria
- AC-006-022-01 — Given a write on the local runtime, then its audit event has actor kind `local_operator` and no actor Member.
- AC-006-022-02 — Given the local runtime, then it offers no Member sign-in and no Member is assumed from the machine.
- AC-006-022-03 — Given a local change, then it does not appear in the hosted database, and the reverse.

## Implementation
- `apps/api/service.mjs:audit` — `c.zuriActor?'authenticated':'local_operator'`; `apps/api/viewer.mjs` (`OPERATOR` principal, refused when `VERCEL==='1'`); `apps/api/server.mjs` (loopback only); `apps/web/src/content/business/TeamAccess.jsx` — `local=location.hostname==='127.0.0.1'` skips sign-in.
- Test: `apps/api/test/meeting-commit.test.mjs` (“five viewers: Guest 401, outsider 404, participant commits, named R reads without quotes, operator commits…”, line 103) asserts that the audit event of a commit made on the local principal has `actor_kind` `local_operator`. Run on 2026-10-01 by the author of this file: the 13 tests of that file passed. No committed test asserts that no Member is assumed on the local runtime (AC-006-022-02) or that the databases stay separate (AC-006-022-03); both rest on reading the code and on [AGENTS.md](../../../../AGENTS.md). The 0.4.0 record states that loopback-only access stays a trusted operator with no inferred Member ([member review](../../../history/zuri-go-member-review/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) §1 assumption 5, §3 (“legacy shared/local events stay nullable”), §7 (“local/cloud synchronization” out of scope).
- The operator is not an authenticated Member session ([AGENTS.md](../../../../AGENTS.md)); [SRV-002](../../../services/SRV-002-local/SERVICE.md) describes the runtime.
