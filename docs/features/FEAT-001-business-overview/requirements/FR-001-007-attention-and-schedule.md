---
id: FR-001-007
title: What to do today, what is about to be posted and what needs attention
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-010, FEAT-011]
---

# FR-001-007 — What to do today, what is about to be posted and what needs attention

The system SHALL show an attention queue and a view of the next posts, with time, channel and owner, in which every line opens the item to act on; the queue SHALL hold content past its time, content waiting for approval, campaigns that reached their planned start but are still queued, and tasks that are overdue or blocked, and SHALL count a task once.

## Acceptance criteria
- AC-001-007-01 — Given content past its scheduled time or waiting to be checked, then the attention queue lists it with a link to fix it.
- AC-001-007-02 — Given a campaign whose planned start has come while its lifecycle is still `queued`, then it stays in the queue count and is raised as a warning in the attention queue.
- AC-001-007-03 — Given a task that is overdue or blocked, or a Must task of the week, then it is in the queue once, by task ID, and a done task is not; a MoSCoW Won’t task adds nothing.
- AC-001-007-04 — Given the next 7 days, then the upcoming publications are shown with time, channel and owner and open on a click.

## Implementation
- `taskAttention`, `upcoming` and `overdue` in `overview` of `apps/web/src/content/business/model.mjs`; the panels “วันนี้ควรทำ” and “กำลังจะลง” in `apps/web/src/content/business/BusinessWorkspace.jsx`.
- No test of the queue as a whole; the counts are covered by `apps/api/test/model.test.mjs`.

## Notes
- Spec trace ([spec.md](../spec.md)): §9 items 2 and 4 (AC-01, AC-04); §6 row “อยู่ในคิว” and §9 item 4 (AC-02); §6 row “งานต้องทำ” (AC-03). No ZGO label.
- Gaps found in the code: no warning for a queued campaign past its planned start (AC-02); the task attention rule counts overdue and blocked tasks but not the “Must in the week” part of AC-03. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
- Tasks come from the task records of [FEAT-010](../../FEAT-010-task-manager/feature.md); which tasks a viewer may see is [FR-011-004](../../FEAT-011-visibility-and-confidential-meetings/requirements/FR-011-004-task-project-visibility.md).
