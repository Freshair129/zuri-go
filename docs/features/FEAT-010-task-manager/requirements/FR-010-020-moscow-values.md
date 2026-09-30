---
id: FR-010-020
title: One MoSCoW scale
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-012, FR-010-021, FR-010-022]
---

# FR-010-020 — One MoSCoW scale

The system SHALL use one priority scale — `must`, `should`, `could`, `wont` or none — for manual tasks, tasks created from a meeting and the task details, SHALL refuse any other value, SHALL NOT set a priority itself, and SHALL NOT convert the campaign’s Low/Medium/High priority.

## Acceptance criteria
- AC-010-020-01 — Given the task form, a meeting draft and the filter of the weekly views, then each offers the same values with the same labels — “Must · ต้องทำ”, “Should · ควรทำ”, “Could · มีเวลาแล้วทำ”, “Won’t · ไม่ทำรอบนี้” — and “ยังไม่จัดลำดับ” for none; none is not a fifth category.
- AC-010-020-02 — Given a new task, a seeded task (FR-010-017) or a draft item from a meeting for which no priority was chosen, then the week’s priority is empty (`null`) and no value is chosen for it.
- AC-010-020-03 — Given a priority that is not one of the four — for example `high` or `Urgent` — when it is saved through the workspace, the meeting commit, a backup or a restore, then it is refused (“Priority ต้องเป็น MoSCoW”, “Membership / priority ไม่ถูกต้อง”) and nothing changes; the database also refuses it.
- AC-010-020-04 — Given a campaign task whose Low, Medium or High priority is kept in its campaign details, then no MoSCoW value is derived from it (FR-010-012, AC-010-012-03).

## Implementation
- `apps/web/src/content/meeting/model.mjs:MOSCOW` (the four values and labels), `:setPriority` (refuses other values, `null` allowed), `:validateState` (refuses a week entry with another value); `apps/web/src/content/meeting/TaskForms.jsx:TaskForm` (MoSCoW field), `apps/web/src/content/meeting/Meetings.jsx` (per-draft MoSCoW field, starts empty), `apps/web/src/content/meeting/MeetingWorkspace.jsx` (filter “กรอง MoSCoW”). Database: `apps/api/migrations/001_core.sql`, `weekly_plan_tasks.priority CHECK(priority IN('must','should','could','wont'))`, null allowed.
- The meeting commit on the server runs the same `commitBatch` and `setPriority` (`apps/api/meeting-commit.mjs`).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “MoSCoW never changes task status and is independent per week” (rejects `high`), “backup validates all member and weekly references” (rejects `urgent` in a backup), “seed repeats preserve 5 tasks, 4 members, names and user edits”; `apps/api/test/tasks-api.test.mjs` (Low/Medium/High kept in campaign details, no week entry). AC-010-020-01 has no test of its own. The pure model suite (36 tests) passed on 2026-10-01; the PostgreSQL tests need a local PostgreSQL and were not re-run for this record.
- In production since 0.5.0 (code commit `7bb538c`). Not run: Member checks and browser checks on production ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-26 (verification row PASS on the local browser workspace, model and IndexedDB checks). The scale is that of [SDD-004](../../FEAT-004-meeting-task-manager/design.md) §4.2 and the spec’s MoSCoW table; the labels above are the ones in `MOSCOW`, which differ slightly from the spec’s “Must have — ต้องทำ” wording.
- The per-task API (FR-010-009) carries no weekly priority: its `priority` field is the campaign-only one and is refused on the general operation (FR-010-012, AC-010-012-05). A weekly priority is written through the workspace save (`PUT /workspace`, `weeks`) and through the meeting commit. Decided 2026-10-01 ([PLAN-002 “Design gaps decided”](../../../governance/plans/PLAN-002-task-and-meeting-domains.md#design-gaps-decided-2026-10-01), D10): a per-task operation for it is later; the workspace save and the meeting commit remain the paths. No code change.
- The Boards view (FR-010-005) does not show MoSCoW; the weekly views do (FR-010-021).
