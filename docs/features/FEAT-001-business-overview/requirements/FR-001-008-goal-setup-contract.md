---
id: FR-001-008
title: A goal is set from a metric, its accounts, a period, a target and an owner
delivery: building
status: approved
legacy: []
relations:
  relates_to: [FEAT-003, ARCH-002]
---

# FR-001-008 — A goal is set from a metric, its accounts, a period, a target and an owner

The system SHALL let a goal be set by choosing the metric, the scope or account(s), the week or month, the target and the owner, with one target by default, SHALL require the accounts that measure a follower goal to be chosen when the goal is created, SHALL NOT set a target of 500 for every Business or week automatically, and SHALL explain how the goal is counted and where to read more.

## Acceptance criteria
- AC-001-008-01 — Given the goal form, then it asks for the metric, the accounts, the period, the target and the owner, in that order, and takes one target.
- AC-001-008-02 — Given a follower goal, when it is created, then the accounts that measure it are chosen, and a Business without a goal gets none automatically.
- AC-001-008-03 — Given the confirmed example, then it is stored as metric `followers_net`, period weekly, target 500, direction higher is better, for the chosen accounts and the real period dates.
- AC-001-008-04 — Given a goal card, then it explains that net growth is the current stock minus the stock at the start of the period.
- AC-001-008-05 — Given the explanation on a goal card, then it opens the page of the guide that defines the metric.

## Implementation
- Goal form (`kind==="goal"`) and `GoalCard` in `apps/web/src/content/business/BusinessWorkspace.jsx`; `save` (resource `goals`) in `apps/api/service.mjs`; table `goals` and `metric_definitions.direction` in `apps/api/migrations/001_core.sql`.
- Test: `apps/api/test/database.test.mjs`. The import into production invented no follower goal and no campaign lifecycle ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “State and persistence”).

## Notes
- Spec trace ([spec.md](../spec.md)): §7 bullets 1 and 2 (AC-01, AC-03); §3 [ASSUMPTIONS] item 5 (AC-02); §9 item 5 (AC-04, AC-05). No ZGO label.
- Gap: the guide link of AC-05 (“พร้อมเปิดคู่มือเดิม”) was not found in `apps/web/src/content/business/BusinessWorkspace.jsx`. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
