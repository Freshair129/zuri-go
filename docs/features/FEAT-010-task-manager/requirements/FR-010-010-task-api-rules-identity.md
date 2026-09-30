---
id: FR-010-010
title: Task API — rules, identity and audience on the server
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
  relates_to: [FR-011-003, FR-011-007, FR-011-011]
---

# FR-010-010 — Task API — rules, identity and audience on the server

The system SHALL check the task rules on the server for every write, take the actor from the session only, refuse a Guest’s write with 401, and answer every read for the viewer’s audience.

## Acceptance criteria
- AC-010-010-01 — Given a Guest, when they create or change a task or a project, then the answer is 401 `AUTH_REQUIRED` and nothing changes.
- AC-010-010-02 — Given a body that carries `actor`, `memberId` or `pid`, then those fields are ignored and the audit event names the session’s Member.
- AC-010-010-03 — Given a client that skips the browser checks, when it sends a move to `done` without evidence or a move to `blocked` without a blocker, then the server refuses it with 422.
- AC-010-010-04 — Given a task the viewer may not read, when it is read or updated by ID, then the answer is the same 404 as for a task that does not exist.
- AC-010-010-05 — Given any create or update, then one audit event records the task’s before and after states and the session actor.
- AC-010-010-06 — Given a change of visibility or team through the API, then FR-011-011 decides whether it is allowed and how it is audited.

## Implementation
- Built locally 2026-10-01: `cleanInput` refuses unknown fields and ignores `actor`, `memberId`, `pid`; writes need a Member (401); unreadable tasks answer 404; one audit event per create or update; visibility changes follow FR-011-011.
- Tests: `apps/api/test/tasks-api.test.mjs`, `apps/api/test/cloud-handler.test.mjs`.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- “Guest 401” is for writes. A Guest’s reads are allowed and return public items only (FR-011-007).
