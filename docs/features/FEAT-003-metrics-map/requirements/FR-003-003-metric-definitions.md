---
id: FR-003-003
title: Every metric keeps its definition, unit, basis, example and how to read it
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-003-003 — Every metric keeps its definition, unit, basis, example and how to read it

The guide SHALL keep the 11 original metrics — Impressions, CPM, Clicks, CTR, CPC, CVR, ROAS, ROI, CPO, CAC and LTV — and SHALL define 38 metric cards and the two lead stages MQL and SQL as 40 terms, each with its unit, calculation basis, a hypothetical example and how to read the result, separating counts of people, of times and of orders.

## Acceptance criteria
- AC-003-003-01 — Given the guide, then all 11 original metrics are present.
- AC-003-003-02 — Given the guide, then it has 38 unique metric cards and the terms MQL and SQL, 40 terms in all.
- AC-003-003-03 — Given a metric, then the guide gives its unit, the basis of its calculation, a hypothetical example and how to read the result.
- AC-003-003-04 — Given the Awareness page, then it separates the number of times (Impressions) from the number of people (Reach) and defines Frequency as impressions over unique users in the same scope.
- AC-003-003-05 — Given MQL and SQL, then the guide defines each stage, counts distinct leads, gives a cohort-based MQL-to-SQL example, and tells the team to agree the criteria, with no score or benchmark invented.

## Implementation
- `scripts/metrics/build_metrics_map.py` (the metric cards); `scripts/metrics/verify_metrics_map_static.py` (38 cards, 40 graph terms).
- Static audit of the generated guide (18 pages, 38 metric cards, 40 graph terms, no missing file or anchor): `scripts/metrics/verify_metrics_map_static.py`, run by `npm test` and `npm run build`; its extraction-time report is [static-checks.json](../../../migrations/verification/metrics/static-checks.json). REV 04 browser and print checks: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §1 and §2 (the original 11 metrics kept), §5 (the metric pages 02–06) and §15 AC-01 (AC-01 to AC-03); §5 page 02 (AC-04); “บันทึก REV 02.1” and S11 (AC-05). Legacy label: AC-01 of [spec-content.md](../spec-content.md) §15.
- The 38 cards and 40 terms are the REV 04 totals; REV 04’s three additions are in [FR-003-009](FR-003-009-rev04-metrics.md).
