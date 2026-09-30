---
id: FR-010-021
title: Priority views and the Won’t shelf
part: FEAT-010-P01
owner: DOM-TSK
delivery: implemented
status: approved
relations:
  specified_by: [SDD-004]
  decided_by: [ADR-002]
  relates_to: [FEAT-004, FR-010-005, FR-010-020, FR-010-022]
---

# FR-010-021 — Priority views and the Won’t shelf

The system SHALL show the selected week’s priority as a badge and offer the same MoSCoW filter and sort in the Kanban, List and RACI layouts of Weekly To-do, SHALL keep a Won’t task openable and editable, not Done and outside the Kanban lanes in a counted section “ไม่ทำในรอบนี้”, and SHALL summarise the week with chosen work (Must, Should, Could) apart from unprioritised and Won’t work.

## Acceptance criteria
- AC-010-021-01 — Given a selected week, then every card and every table row shows the week’s priority badge, or “ยังไม่จัดลำดับ” when none is set.
- AC-010-021-02 — Given a MoSCoW filter set to one value or to “ยังไม่จัดลำดับ”, then the Kanban, List and RACI layouts list the same tasks, because the filter, the R filter and the search are one state shared by the three layouts.
- AC-010-021-03 — Given “เรียงตาม MoSCoW”, then the rows are ordered Must, Should, Could, unprioritised, Won’t, and rows of the same priority keep their earlier order; sorting changes neither status nor due date.
- AC-010-021-04 — Given a task whose priority in the selected week is Won’t, then it is not in a Kanban lane, it is listed in the section “ไม่ทำในรอบนี้ · n” with the count, it is still listed in List and RACI, its card opens the task so the priority can be changed, and its status is unchanged — it is not Done and not cancelled.
- AC-010-021-05 — Given the week’s summary, then “เลือกทำ · M / S / C” counts only Must, Should and Could tasks, “เสร็จในกลุ่มที่เลือกทำ” counts Done among those, and “รอจัดลำดับ / ไม่ทำรอบนี้” counts the unprioritised and the Won’t tasks separately.
- AC-010-021-06 — Given a week in which no task is Must, Should or Could, or in which a chosen task’s status is still unconfirmed, then progress shows “ยังไม่จัดแผน / สถานะรอยืนยัน” and no percentage; it is never shown as 0% in place of “not planned”.

## Implementation
- `apps/web/src/content/meeting/MeetingWorkspace.jsx` — `Priority` (badge), the row filter and sort (`rows`, `sort`), the summary tiles, the Kanban lanes (Won’t rows excluded) and the section `mt-deferred`; `apps/web/src/content/meeting/model.mjs:weeklyRows`, `:weeklySummary` (counts `planned`, `done`, `unknown`, `deferred`; `percent` is `null` unless every chosen task has a confirmed status).
- Tests: `apps/web/src/content/meeting/model.test.mjs` — “summary excludes Won’t/unclassified and never asserts unknown progress” (AC-010-021-05, -06) and “MoSCoW never changes task status and is independent per week” (AC-010-021-04, status unchanged). The badge, the filter, the sort and the shelf are interface behavior with no automated test; the 0.3.0 [verification](../../FEAT-004-meeting-task-manager/verification.md) records a browser check of the List and RACI filters and the Won’t shelf on the earlier browser workspace, not repeated on the current build. The pure model suite (36 tests) passed on 2026-10-01.
- In production since 0.5.0 (code commit `7bb538c`). Not run: browser checks on production and on the current build ([verification](../../../releases/0.5.0/verification.md)).

## Notes
- Origin: FEAT-004 MT-27 (verification row PASS on the local browser workspace, model and IndexedDB checks).
- These are the weekly views; the Boards view (FR-010-005) shows no priority, and FR-010-005 (AC-010-005-07) only protects the weekly views as they are.
- The spec does not place Won’t in the sort order; the code puts it last.
