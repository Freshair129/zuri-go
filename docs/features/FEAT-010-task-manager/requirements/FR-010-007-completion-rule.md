---
id: FR-010-007
title: Completion rule
part: FEAT-010-P01
owner: DOM-TSK
delivery: declared
status: proposed
relations:
  specified_by: [SDD-010]
  decided_by: [ADR-003]
---

# FR-010-007 — Completion rule

The system SHALL allow a new completion only for a task that has an R, a confirmed A, a confirmed acceptance criterion and evidence — and a recheck date when a KPI or a campaign gate is named — and SHALL leave tasks already Done under the Workboard rule valid, marked with the rule they were completed under.

## Acceptance criteria
- AC-010-007-01 — Given a task without an R, or whose A is not confirmed, or whose acceptance criterion is still proposed or empty, or without evidence, when it is moved to `done`, then the move is refused.
- AC-010-007-02 — Given a task that names a KPI, or whose campaign details name a gate, and has no recheck date, when it is moved to `done`, then the move is refused.
- AC-010-007-03 — Given a Workboard task that is Done before the change, then it is still Done after it, carries the marker `workboard`, and is not re-checked against the new rule.
- AC-010-007-04 — Given a task marked `workboard`, when it is moved out of `done` and back, then the new completion must satisfy AC-010-007-01 and AC-010-007-02 and the marker becomes `standard`.
- AC-010-007-05 — Given a task with a campaign context and no due date, when it is moved to `done`, then the move is refused (assumption — PLAN-002 Q7, open).

## Implementation
- Not built as one rule. The Meeting & Task Manager rule is in `saveTask` (`apps/web/src/content/meeting/model.mjs:52-54`): R, confirmed A, confirmed acceptance, evidence, and a recheck date when `kpi` is set. The Workboard rule is different (`apps/web/src/content/shared/model.mjs:89-90`): evidence, acceptance, an owner as text, a due date and a recheck date.
- The marker is the planned `tasks.completion_rule` (SDD-010 Data).

## Notes
- Assumption — PLAN-002 Q7 recommends “yes” because FEAT-002 AC-13 needs a due date on closing a campaign task today; AC-010-007-05 stands or falls with that answer.
- ADR-003 D7 keeps the gate and KPI recheck of the Workboard rule; the recheck date is the same field in both (`tasks.recheck_date`).
