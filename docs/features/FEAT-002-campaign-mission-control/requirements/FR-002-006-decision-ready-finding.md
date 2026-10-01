---
id: FR-002-006
title: A finding is decision-ready only with data, sample, a missed threshold and a feasible action
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-006 — A finding is decision-ready only with data, sample, a missed threshold and a feasible action

The system SHALL call a finding decision-ready only when the applicable data is ready, there are enough eligible observations for that rule, an approved performance threshold was missed and a next action is feasible, SHALL name the specific missing element when any is absent, and SHALL show a ratio as undefined, not as 0%, when its denominator is zero.

## Acceptance criteria
- AC-002-006-01 — Given any of the four elements is absent, then the system reports the element that is missing and gives no verdict.
- AC-002-006-02 — Given D7 with too few eligible leads, then the review is recorded as inconclusive with the sample and lag shown, and the offer is not labelled failed.
- AC-002-006-03 — Given 0 eligible leads and 0 sales, then the conversion is undefined, with no divide by zero and no 0%, and it is not an offer failure.
- AC-002-006-04 — Given weak CTR with below-pace units, or leads with a poor response SLA, or price objections with below-pace units, then the system points to the diagnostic branch of §3.1 and asserts no cause as observed.

## Implementation
- `evaluate` (`missing`, `LEARNING`, `enough`) and `ratio` in `apps/web/src/content/shared/model.mjs`.
- Tests: `tests/campaign/model.test.mjs` (“AC-04 immature and insufficient cohorts remain inconclusive”, “covered zero differs from unknown, zero denominator stays undefined”, “no invented actuals and undefined ratios in an untouched campaign”). Trace in [verification](../verification.md), “Acceptance trace”.

## Notes
- Spec trace ([spec.md](../spec.md)): §3.1 (AC-01, AC-04); §10 AC-04 (AC-02) and AC-07 (AC-03). Legacy labels: AC-04, AC-07.
- The diagnostic branches are shown as checks to make, not as findings (§3.1 last sentence); the screens carry them as suggested work (“ตรวจ …”).
