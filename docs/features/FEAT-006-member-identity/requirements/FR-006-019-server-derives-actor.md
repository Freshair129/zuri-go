---
id: FR-006-019
title: The server derives the actor of every new write from the session
delivery: implemented
status: approved
legacy: []
relations:
  decided_by: []
  relates_to: [FEAT-006, FR-007-009, FR-005-015]
---

# FR-006-019 — The server derives the actor of every new write from the session

The system SHALL take the actor of every new authenticated mutation — the canonical Member UUID and the PID — from the server session, SHALL record it on the audit event and on every attachment upload and removal, and SHALL NOT accept an actor, PID, member ID or password hash from a request as authorization; an R or A role in a task is assignment data, not proof of who made a change.

## Acceptance criteria
- AC-006-019-01 — Given a signed-in Member who writes, then the audit event holds that Member’s UUID and PID.
- AC-006-019-02 — Given a workspace save whose events claim another actor, member ID or PID, then the stored event holds the session Member.
- AC-006-019-03 — Given a request that carries `pid`, `memberId`, `actor` or `password_hash` in a save payload, then none of them grants authority or changes the actor.
- AC-006-019-04 — Given an attachment upload or removal, then `uploaded_by_member_id` or `deleted_by_member_id` is the session Member.

## Implementation
- `apps/api/service.mjs:audit` — `actor_member_id` and `actor_pid` come from `c.zuriActor`; `apps/api/member-auth.mjs:authorizeWrite` sets `c.zuriActor`; `apps/api/workspace.mjs:writeDomain` overrides a task event’s actor; `apps/api/attachments.mjs:attachmentAction` writes the Member FKs.
- Tests: `apps/api/test/cloud-handler.test.mjs` (“four individual identities…”: four sign-ins each leave an event with their UUID and PID; a workspace whose events claim another Member is stored with the session Member; “attachments persist bytes…”: `uploaded_by_member_id`). Run on 2026-10-01 by the author of this file: passed. Production: the 0.4.0 record shows four real sign-ins, each with a matching actor ([member review](../../../history/zuri-go-member-review/verification.md)).

## Notes
- Spec: [spec.md](../spec.md) §3 (the tables for `change_events` and `task_attachments`), §4 (the bullet “Server injects actor context …”), §6 (“Every newly authenticated business/task/file mutation records the real session Member. Crafted actor claims cannot impersonate another member.”).
- How the single code selects the Member is [FEAT-007](../../FEAT-007-single-code-login/feature.md).
