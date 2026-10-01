---
id: FR-002-012
title: Lead-to-Sale boundaries at 2%, 5% and 10% give exactly one result (G-03 to G-06)
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-012 — Lead-to-Sale boundaries at 2%, 5% and 10% give exactly one result (G-03 to G-06)

The system SHALL apply rules G-03 to G-06 to the mature package-cohort Lead-to-Sale rate — at most 2% is FIX / NO SCALE, above 2% and below 5% is LEARNING, 5% up to below 10% is eligible for a scale review, and 10% or more is a strong candidate for a scale review — SHALL give exactly one result at each boundary, and SHALL NOT release another offer or pause all ads automatically.

## Acceptance criteria
- AC-002-012-01 — Given a conversion of exactly 2%, 5% or 10%, then exactly one applicable result is given: at most 2% no scale, 5% eligibility for a base review, 10% eligibility for a high review.
- AC-002-012-02 — Given a result in the scale-review range, then it is eligible only if the other gates pass and it is not an automatic budget release.
- AC-002-012-03 — Given the normal phase, then it uses its own cutoffs when they are set and otherwise only the KPI pace, because G-03 to G-06 are package-scenario rules and not validated Normal cutoffs.

## Implementation
- `evaluate` (the `low`, `mid`, `high` branch: `FIX`, `LEARNING`, `BASE`, `HIGH`; `normalLow`, `normalMid`, `normalHigh`) in `apps/web/src/content/shared/model.mjs`.
- Tests: `tests/campaign/model.test.mjs` (“AC-06 package CVR boundary 2% -> FIX”, 3% -> LEARNING, 5% and 9% -> BASE, 10% -> HIGH; “AC-03 eligible normal below pace permits first DESTINY after decision”). Trace: [verification](../verification.md), “Acceptance trace”, AC-06–09.

## Notes
- Spec trace ([spec.md](../spec.md)): §5.2 rows G-03 to G-06 and the sentence “G-03–G-06 are inherited package-scenario rules …” (AC-01 to AC-03); §10 AC-06 (AC-01). Legacy label: AC-06.
- The labels of the code are FIX, LEARNING, BASE and HIGH; the spec’s names (FIX / NO SCALE, LEARNING, eligible, strong candidate) map to them one to one.
