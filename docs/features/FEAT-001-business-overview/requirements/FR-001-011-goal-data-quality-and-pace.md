---
id: FR-001-011
title: Missing, partial and stale data are shown as such, and pace only when data is complete
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-003]
---

# FR-001-011 — Missing, partial and stale data are shown as such, and pace only when data is complete

The system SHALL show a goal whose baseline or latest value is missing as not computable, with a prompt to enter the start-of-period figure, SHALL show partial and stale data as such without judging the goal reached or missed, SHALL never count an account twice, and SHALL show a pace line only when the data is complete for the scope and the baseline is known, labelled as an even-distribution assumption and not a forecast.

## Acceptance criteria
- AC-001-011-01 — Given no baseline, then the goal says that the growth cannot be calculated yet and offers to enter the start-of-period figure; a missing value is not shown as zero.
- AC-001-011-02 — Given data of only some of the accounts, then the card says how many accounts are covered and does not judge the goal reached or missed.
- AC-001-011-03 — Given a latest value older than the freshness of its series, then the card says the data needs updating.
- AC-001-011-04 — Given a goal over several accounts, then no account is counted twice.
- AC-001-011-05 — Given complete data and a known baseline, then the pace is the target times the elapsed fraction of the period up to the cut-off of the data, and the card says the line assumes an even spread and is not a forecast.

## Implementation
- `goalProgress` in `apps/web/src/content/business/model.mjs` (`quality` missing / partial / stale / complete, `expected` when complete); quality text in `GoalCard` of `apps/web/src/content/business/BusinessWorkspace.jsx`.
- Tests: `apps/api/test/model.test.mjs` (“missing baseline is unknown and cannot masquerade as zero”, “stale and misaligned account snapshots never become a complete scope”).

## Notes
- Spec trace ([spec.md](../spec.md)): §7 bullets 7 and 8 (AC-01, AC-02, AC-05); §9 item 3 (AC-03); ZGO-06 in part (AC-01 to AC-04). Legacy label: ZGO-06 (part).
- Gaps found in the code: `expected` is computed but no pace line is shown (AC-05), and the card gives a general partial message, not “ข้อมูลครบ 1/2 ช่องทาง” (AC-02). No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
