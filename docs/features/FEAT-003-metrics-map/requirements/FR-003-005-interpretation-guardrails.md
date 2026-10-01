---
id: FR-003-005
title: The guide does not claim a cause or a profit its numbers cannot show
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-003-005 — The guide does not claim a cause or a profit its numbers cannot show

The guide SHALL list what to check instead of concluding a cause from a single metric, SHALL keep conversion, revenue and profit apart, SHALL present the 3× LTV/CAC rule as a heuristic that needs a stated LTV base, margin, cohort and payback period, SHALL explain CPO as contribution before ad cost on the first order without a verdict on lifetime profitability, and SHALL end with a checklist for reading results before deciding.

## Acceptance criteria
- AC-003-005-01 — Given a low CTR, then the guide lists what to check (audience, placement, destination quality and the like) and does not conclude a cause.
- AC-003-005-02 — Given conversion, ROAS, ROI, revenue LTV and gross-profit LTV, then the guide distinguishes them and never says that conversion, ROAS or revenue LTV equals profit.
- AC-003-005-03 — Given the LTV/CAC rule of 3×, then the guide says it is a heuristic and not a guarantee, and asks for the LTV base, the margin, the cohort and the payback period.
- AC-003-005-04 — Given CPO, then the guide explains contribution before ad cost and the scope of the first order and gives no verdict on lifetime profitability.
- AC-003-005-05 — Given the last guide page, then it gives the eight-point checklist: the metric and its event, denominator and unit; comparable period, channel, audience and attribution; tracking, duplicates, cancellations and conversion delay; people, times and orders, new and returning customers; ROAS, ROI and contribution; LTV with base, assumptions and cohort; small samples and incomplete measurement; and an owner, evidence and a date to look again for every decision.

## Implementation
- `scripts/metrics/build_metrics_map.py` (the CTR, Conversion, Revenue & Profit, Customer Value and Reading & Sources pages).
- REV 02 result for “no conversion / ROAS / revenue LTV called profit”: [qc.md](../qc.md), “Acceptance results — REV 02 baseline” (AC-06 PASS). The text has not been re-checked line by line since; REV 04 changed three cards only.

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §2 (the table rows CTR, profit, LTV/CAC and CPO) (AC-01 to AC-04) and §13 (AC-05); §15 AC-06 (AC-02). Legacy label: AC-06 of [spec-content.md](../spec-content.md) §15.
