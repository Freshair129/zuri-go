---
id: FR-001-010
title: A goal card shows the real numbers, with the bar clamped
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [ARCH-002]
---

# FR-001-010 — A goal card shows the real numbers, with the bar clamped

The system SHALL show on each goal card the actual and the target, the percentage, the amount remaining, the time of the data and the way to the source, SHALL NOT divide when the target is zero or missing, SHALL allow a negative actual, and SHALL limit only the progress bar to 0–100% while the numbers stay untruncated.

## Acceptance criteria
- AC-001-010-01 — Given a goal, then its card shows actual / target, the percentage, the amount remaining, the time up to which the data runs and a link to its evidence.
- AC-001-010-02 — Given a target of zero or none, then no division is made and no completion percentage is shown.
- AC-001-010-03 — Given a net follower actual below zero, then the number is shown as it is (for example −20 of 500) and the bar stays at 0%.
- AC-001-010-04 — Given an actual above the target (for example 620 of 500, 124%), then the number and the percentage are not cut and the bar stays at 100%.

## Implementation
- `goalProgress` (`percent`, `barPercent`, `remaining`, `asOf`) in `apps/web/src/content/business/model.mjs`; `GoalCard` and its details “วิธีนับและแหล่งข้อมูล” in `apps/web/src/content/business/BusinessWorkspace.jsx`; `target_value>0` is a database check on `goals`.
- Test: `apps/api/test/model.test.mjs` (“confirmed zero, negative and above-target deltas preserve meaning”).

## Notes
- Spec trace ([spec.md](../spec.md)): §7 bullets 3 and 4 (AC-01 to AC-04); ZGO-06 in part (AC-03, AC-04). Legacy label: ZGO-06 (part).
- A target of zero cannot be stored (`target_value>0`), so the second criterion is met at the database before it reaches the card.
