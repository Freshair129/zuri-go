---
id: FR-003-004
title: Worked examples are hypothetical, reconcile, and say when a result cannot be calculated
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-003-004 — Worked examples are hypothetical, reconcile, and say when a result cannot be calculated

The guide SHALL present its worked examples as hypothetical with their assumptions stated, SHALL give the results of the shared examples that follow from their inputs, SHALL NOT call a revenue-based or gross-profit-based lifetime value a net profit, and SHALL show “คำนวณไม่ได้ / ข้อมูลยังไม่พอ” when a divisor is 0 or data is missing, never 0%, 0 baht or infinity.

## Acceptance criteria
- AC-003-004-01 — Given the shared example A (ad cost 10,000 baht; 100,000 impressions and 40,000 reach; 2,000 tracked link clicks; 100 paid orders; revenue after discount 50,000 baht; COGS 25,000; other variable cost 5,000; allocated fixed cost 5,000), then the guide gives Frequency 2.5, CPM 100 baht, CTR 2%, CPC 5 baht, CVR 5%, CPO 100 baht, AOV 500 baht, ROAS 5×, total cost 45,000 baht, scoped profit 5,000 baht, ROI 11.11%, and contribution of 200 baht per order before ad cost and 100 baht per order after it.
- AC-003-004-02 — Given the shared example B (acquisition cost 18,000 baht for 60 new customers; AOV 500 baht × 4 orders a year × 2 years; gross margin 40%), then the guide gives CAC 300 baht, revenue LTV 4,000 baht and gross-profit LTV 1,600 baht.
- AC-003-004-03 — Given the two lifetime-value bases, then neither is called a net profit.
- AC-003-004-04 — Given a divisor of 0 or missing data, then the guide shows “คำนวณไม่ได้ / ข้อมูลยังไม่พอ” and not 0%, 0 baht or infinity.
- AC-003-004-05 — Given each example, then it is labelled as an approved hypothetical example and not a result of a customer or of zuri.

## Implementation
- `scripts/metrics/build_metrics_map.py` (the example sets in the Revenue & Profit and Customer Value pages).
- Independent recomputation of the example values: [qc.md](../qc.md), “Independent arithmetic” (REV 02 baseline). `scripts/metrics/verify_metrics_map_static.py` does not recompute the values; the REV 04 run did not re-derive them either.

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §5, “ชุดตัวอย่างคำนวณร่วม” and the sentence after the examples (AC-01 to AC-05); §15 AC-05 (AC-02, AC-03). Legacy label: AC-05 of [spec-content.md](../spec-content.md) §15.
- Delivery rests on the REV 02 arithmetic check ([qc.md](../qc.md) states these results are REV 02 only), because the example block did not change in later revisions; a recomputation against the current HTML is not on record.
