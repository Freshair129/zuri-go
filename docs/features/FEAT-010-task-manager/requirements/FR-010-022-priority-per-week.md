---
id: FR-010-022
title: Priority per week and carry-over
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-005, FR-010-020, FR-010-021, FR-011-008]
---

# FR-010-022 — Priority per week and carry-over

The system SHALL keep a task’s MoSCoW priority and its note on the task’s entry for one week, so the same task can have different priorities in different weeks, SHALL carry a task into another week by adding it to that week without changing its ID, status or details or the earlier week’s entry, SHALL record each priority change in the task’s history with its week, and SHALL let a task with no week be saved as Backlog.

## Acceptance criteria
- AC-010-022-01 — Given a task with Must in the week of 2026-09-28, when it is given Won’t in the week of 2026-10-05, then the first week still shows Must and the second Won’t; there is one task and two week entries, and changing a priority never changes the task’s status.
- AC-010-022-02 — Given a task with a priority in an earlier week, when the person picks a later week in “สัปดาห์ที่วางแผน” and saves, then the task keeps its ID, status and details, the earlier week’s entry and note are unchanged, and the new week’s entry exists with no priority, ready to be chosen; no copy of the task is made.
- AC-010-022-03 — Given a person who changes a priority or a note in a week, then the task’s history (“ประวัติการแก้ไข”) gains an entry “MoSCoW · <week start> · <value>” with the time and the actor, and earlier entries are not changed; in the hosted workspace the actor is the session’s Member and the time is the server’s, and a Guest sees no history.
- AC-010-022-04 — Given a task with no week, when it is saved, then it is stored as Backlog — no week entry — and its MoSCoW field is disabled with “เลือกสัปดาห์ก่อน”; a priority set without a week is refused with “กรุณาเลือกสัปดาห์ก่อนจัดลำดับ”.
- AC-010-022-05 — Given any day chosen as the week, then the entry is stored under the Monday of that week (weeks run Monday to Sunday, Asia/Bangkok), and a task has at most one entry per week.
- AC-010-022-06 — Given a week chosen for a task, or a save of the same week, when neither the priority nor the note (compared after trimming) differs from the week’s stored entry — for example a week chosen with no priority, or the five seeded tasks — then the week entry is added or kept and no `priority` history entry is written; a change of either still writes one, as AC-010-022-03 states ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D12).

## Implementation
- `apps/web/src/content/meeting/model.mjs:setPriority` (writes the week’s entry and a `priority` event with the week, the entry before and the entry after — on 0.5.0 always, since D12 (built locally 2026-10-01, not released) only when the priority or the note changed; refuses a missing or non-Monday week), `:saveTask` (the `week` option), `:weekOf` (Monday of any date), `:validateState` (one entry per task and week, Monday week starts); `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` (“สัปดาห์ที่วางแผน”, the MoSCoW field disabled without a week, `changeWeek` loads that week’s stored entry, the history list).
- Hosted workspace: `apps/api/workspace.mjs:writeDomain` stores `weekly_plans` and `weekly_plan_tasks` and the events (`change_events`, entity `legacy_task_event`, stamped with the session’s Member and the server time); `:readLegacy` serves them, withholding the entries and events of tasks the viewer cannot read (FR-011-008). Database: `apps/api/migrations/001_core.sql` — `weekly_plans.week_start` must be a Monday (`isodow = 1`), `weekly_plan_tasks` has the primary key (business, week, task).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “MoSCoW never changes task status and is independent per week” (AC-010-022-01, -05), “history snapshots do not change when tasks are updated” (AC-010-022-03), “week boundaries and invalid dates” (AC-010-022-05), “title-only tasks and name-only members keep optional values null” (AC-010-022-04, no week entry); `apps/api/test/meeting-commit.test.mjs` (a commit writes the week entry and its priority) and `apps/api/test/visibility-db.test.mjs` (a hidden task’s weekly entry is kept). The carry-over of AC-010-022-02 and the history of AC-010-022-03 in the interface have no test of their own. The pure model suite (36 tests) passed on 2026-10-01; the PostgreSQL tests need a local PostgreSQL and were not re-run for this record.
- Built locally 2026-10-01, not released, for AC-010-022-06: `apps/web/src/content/meeting/model.mjs:setPriority` (`changed` compares the stored priority and note with the new ones before `event`). Test, written with the change and not run for this record: `apps/web/src/content/meeting/model.test.mjs` (“no priority event when neither the priority nor the note changes; a change still records one”, which also checks that applying the seed records none) and `apps/api/test/meeting-commit.test.mjs` (“history events keep no quote text… no priority event when the priority does not change”).
- In production since 0.5.0 (code commit `7bb538c`). Not run: Member checks — which include the existing weekly MoSCoW entries — and browser checks on production ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-28 (verification row PASS on the local browser workspace, model and IndexedDB checks); design in [SDD-004](../../FEAT-004-meeting-task-manager/design.md) §4.2.
- There is no separate “carry over” command: a task is carried into a week by opening it, choosing that week and saving (“งานทั้งหมด / Backlog” in the Tasks / RACI view says so). An earlier week’s priority is seen by choosing that week on the task.
- On 0.5.0, choosing a week with no priority still records one `priority` history entry whose value is “ยังไม่จัดลำดับ”, because `setPriority` always writes an event; applying the seed does the same for its five tasks. Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D12): no event when the priority and the note are unchanged (AC-010-022-06); built locally and not released, so events of that kind already stored stay.
- The per-task API (FR-010-009) carries no week or priority; see the note of FR-010-020.
