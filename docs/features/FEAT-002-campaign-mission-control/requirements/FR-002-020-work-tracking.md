---
id: FR-002-020
title: Work that keeps a campaign moving, with evidence and a KPI recheck
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-010]
---

# FR-002-020 — Work that keeps a campaign moving, with evidence and a KPI recheck

The system SHALL track the work of a campaign as an action record with its task ID, campaign and phase, linked metric or gate, problem or hypothesis, intended action, accountable owner, due time, status, dependencies, priority, estimate, evidence, acceptance criterion and outcome recheck date, SHALL move it through Backlog → Ready → Doing → Blocked / Review → Done, and SHALL let a task reach Done only when its deliverable and its evidence exist, leaving the KPI to be checked at the recheck date.

## Acceptance criteria
- AC-002-020-01 — Given a task marked Done, then the evidence and the acceptance criterion are checked, and the KPI outcome stays scheduled for a recheck.
- AC-002-020-02 — Given a task with Done status, then it also has an owner, a due date and a recheck date.
- AC-002-020-03 — Given a finding or a metric detail, then a task can be created from it linked to that metric or gate.
- AC-002-020-04 — Given the statuses, then they are Backlog, Ready, Doing, Blocked, Review and Done, and “creative uploaded” is not read as “creative succeeded”.

## Implementation
- `validateRecord` (type `tasks`: status list, Done needs evidence, acceptance, owner, due date and recheck) in `apps/web/src/content/shared/model.mjs`; “สร้างงานจากสิ่งที่พบ” in `apps/web/src/content/dashboard/Views.jsx`.
- Test: `tests/campaign/model.test.mjs` (“AC-13 task Done requires acceptance, evidence, owner and outcome recheck”).

## Notes
- Spec trace ([spec.md](../spec.md)): §7.1 (AC-01 to AC-04); §10 AC-13 (AC-01, AC-02). Legacy label: AC-13.
- Now governed by FEAT-010: the Workboard lists the task records ([FR-010-013](../../FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md)), the campaign-only fields are saved as campaign task details ([FR-010-012](../../FEAT-010-task-manager/requirements/FR-010-012-campaign-task-details.md)), a task is created from a finding by [FR-010-014](../../FEAT-010-task-manager/requirements/FR-010-014-task-from-finding.md), and new tasks follow the completion rule of [FR-010-007](../../FEAT-010-task-manager/requirements/FR-010-007-completion-rule.md); a task done under the Workboard rule stays valid. This requirement keeps the campaign rule and does not restate those.
