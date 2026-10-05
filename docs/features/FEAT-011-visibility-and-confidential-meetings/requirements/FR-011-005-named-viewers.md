---
id: FR-011-005
title: Named viewers of a task
part: FEAT-011-P02
owner: DOM-TSK
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-004, ADR-008]
---

# FR-011-005 — Named viewers of a task

The system SHALL retain RACI and explicit-viewer values as assignment/provenance metadata and SHALL let any active Member manage those mutable values. They do not grant or restrict Business-record access.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes the access effects in the criteria below; this new policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment.

## Acceptance criteria
- AC-011-005-01 — Given a task, when a Member is added or removed as I, then the assignment metadata changes; all Guests and active Members retain the same Business-scoped read access.
- AC-011-005-02 — Given a task, when an explicit viewer without a RACI role is added, then they take on no RACI duty and gain no additional access.
- AC-011-005-03 — Given a Member removed from a task’s RACI and viewers, when they reload, then the task remains readable and mutable under the same Business policy.
- AC-011-005-04 — Given any change to viewers, then an audit event records it with the session actor.

## Implementation
- Built locally 2026-10-01: table `task_viewers`; `viewerIds` on the task payload, written with an audit event (`task_viewers`) in `apps/api/workspace.mjs`.
- Tests: `apps/api/test/visibility-db.test.mjs`.
- Planned table `task_viewers`; RACI stays in `task_roles`.
- Released to production on 2026-10-01 with 0.5.0 (schema 7): the hosted Guest checks passed; the Member, participant and Business-admin checks and the browser checks are not yet run ([verification](../../../releases/0.5.0/verification.md)).
