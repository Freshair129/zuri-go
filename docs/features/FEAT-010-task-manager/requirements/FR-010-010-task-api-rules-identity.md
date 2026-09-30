---
id: FR-010-010
title: Task API — rules, identity and audience on the server
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
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
- Not built for tasks. Guest writes are already refused before the handler (`apps/api/cloud.mjs:28`) and `authorizeWrite` takes the actor from the viewer that `transaction()` resolved (`apps/api/member-auth.mjs:27`); reads are already filtered by `canRead` (`apps/web/src/content/shared/visibility.mjs:13`) and row-level security (FEAT-011, built locally).
- The rules exist only in the browser today (`apps/web/src/content/meeting/model.mjs:35-57`); moving them into a module shared by the API and the UI is SDD-010 Components.

## Notes
- “Guest 401” is for writes. A Guest’s reads are allowed and return public items only (FR-011-007).
