---
id: FR-001-012
title: Weekly and monthly goals use their own boundaries and targets
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-002]
---

# FR-001-012 — Weekly and monthly goals use their own boundaries and targets

The system SHALL use Monday-to-Sunday weeks and calendar months in the time zone of the Business (Asia/Bangkok by default), SHALL set a monthly target separately and never as four times the weekly target, SHALL let a week that crosses a month keep its weekly period while a monthly actual uses the true month boundary, and SHALL store the time zone of the Business.

## Acceptance criteria
- AC-001-012-01 — Given the week of 28 September 2026, then it runs from Monday 28 September to Monday 5 October (exclusive) in Asia/Bangkok, and December 2026 runs from 1 December to 1 January.
- AC-001-012-02 — Given a monthly goal, then its target is set apart from the weekly target and is not four times it.
- AC-001-012-03 — Given a week that spans two months, then the weekly goal keeps its weekly period, and a monthly actual uses the boundary of the real month.
- AC-001-012-04 — Given a Business, then its time zone is stored and the goals use it.

## Implementation
- `periodFor`, `midnight` and `localDate` in `apps/web/src/content/business/model.mjs`; `goals.timezone` and the period checks of `goals` in `apps/api/migrations/001_core.sql`.
- Test: `apps/api/test/model.test.mjs` (“Bangkok boundaries include Monday and calendar month”, which also refuses an invalid date).

## Notes
- Spec trace ([spec.md](../spec.md)): §3 [ASSUMPTIONS] item 2 (AC-01, AC-04); §7 bullet 5 (AC-02, AC-03); ZGO-06 in part (AC-03). Legacy label: ZGO-06 (part).
