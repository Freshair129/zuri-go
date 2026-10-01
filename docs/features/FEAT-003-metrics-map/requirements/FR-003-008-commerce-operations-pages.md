---
id: FR-003-008
title: Lead, order, contribution and inventory metrics are defined in general terms
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-002]
---

# FR-003-008 — Lead, order, contribution and inventory metrics are defined in general terms

The guide SHALL define the metrics of lead and sales efficiency, order and offer economics, contribution and returns, and inventory and fulfillment, together with the required-leads and estimated-media-budget formulas, in general terms with their measuring conditions, and SHALL NOT adopt the offers, prices, targets, assumptions, budgets, routing rules or SKU counts of the MUJEEN M1 document it was drawn from.

## Acceptance criteria
- AC-003-008-01 — Given the Lead & Sales Efficiency page, then it defines Leads, CPL, Qualified CPL, Lead-to-sale rate, Response SLA and Lost reason mix, counting distinct leads, naming the MQL or SQL stage, using a lead cohort followed for the full window, separating a human response from an auto-reply and keeping an unknown lost reason apart.
- AC-003-008-02 — Given the Order & Offer Economics page, then it defines Paid orders, Units per Order, Offer Mix and packaging cost per order, separates the share of orders from the share of units, and uses one scope for order states and actual costs.
- AC-003-008-03 — Given the Contribution & Returns page, then it defines contribution before marketing and after CAC, media share of revenue, and the cancellation and return rates on different denominators, and says contribution after CAC is not a net profit.
- AC-003-008-04 — Given the Inventory & Fulfillment page, then it defines sellable stock by SKU, units sold by SKU, inventory velocity, days of inventory and bundle capacity, names the snapshot time, deducts reserved and unavailable stock, fixes the velocity window and the bundle BOM, and says days of inventory cannot be calculated when the velocity is zero.
- AC-003-008-05 — Given the KPI & Budget page, then it gives required leads as the target paid orders divided by the lead-to-sale rate, rounded up, and the estimated media budget as that times the CPL of the matching offer and cohort, as planning formulas and not as an approved budget.
- AC-003-008-06 — Given AOV, CAC, ROAS, CTR, MQL and SQL, then the new pages use their existing definitions, split by offer or cohort, and define none again.
- AC-003-008-07 — Given the guide, then it contains none of the offer names, prices, 2%, 5% and 10% conversion scenarios, CPL assumptions, revenue, order and media budgets, segment and routing rules or SKU counts of the reference document.

## Implementation
- `scripts/metrics/build_metrics_map.py` (pages 10 and 14 to 17).
- Static audit of the generated guide (18 pages, 38 metric cards, 40 graph terms, no missing file or anchor): `scripts/metrics/verify_metrics_map_static.py`, run by `npm test` and `npm run build`; its extraction-time report is [static-checks.json](../../../migrations/verification/metrics/static-checks.json). REV 04 browser and print checks: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §18 “REV 02.2 addendum”, the table and the two paragraphs after it (AC-01 to AC-07); S12 in §16 (AC-07). No AC label.
- The M1 document is a user-supplied reference outside the repository; only its metric categories and formula structure are used (stated in the spec and in the brief).
