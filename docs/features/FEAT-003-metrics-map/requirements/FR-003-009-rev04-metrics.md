---
id: FR-003-009
title: Media Spend, Revenue and Overstock SKU are added with their guardrails
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-002]
---

# FR-003-009 — Media Spend, Revenue and Overstock SKU are added with their guardrails

The guide SHALL add exactly three metric cards — Media Spend, Revenue and Overstock SKU — each with its definition and guardrail, and SHALL NOT import the MUJEEN offer data, targets, budgets, CPL assumptions or sales-routing rules.

## Acceptance criteria
- AC-003-009-01 — Given the three additions, then Media Spend is on page 10 (KPI & Budget, Acquisition), Revenue on page 05 (Revenue & Profit, Revenue & Operations) and Overstock SKU on page 17 (Inventory & Fulfillment, Revenue & Operations), and the guide then has 38 unique metric cards.
- AC-003-009-02 — Given Media Spend, then it is the actual media cost of a named campaign, channel and period, the sum of platform-reported media spend for exactly that scope, kept apart from the planned or approved budget, with the currency, the date range and whether taxes and agency fees are included stated, and with no duplicate platform attribution cost added.
- AC-003-009-03 — Given Revenue, then it is the net revenue — paid or completed order value after discounts, minus refunds, excluding cancelled or void orders by the stated accounting policy — shown apart from the attributed revenue used for ROAS, with order status, period and the gross or net basis kept consistent.
- AC-003-009-04 — Given Overstock SKU, then it is the sellable stock above the approved target of that SKU, the larger of 0 and the sellable units minus the target units, with the target set by SKU and planning horizon before use, described as a derived alert and not a universal benchmark; when demand is zero, days of inventory is undefined.
- AC-003-009-05 — Given the three terms, then they appear in the guide and in the graph detail, search, export and refresh paths, and MQL and SQL remain distinct stage counts.

## Implementation
- `scripts/metrics/build_metrics_map.py`; `scripts/metrics/verify_metrics_map_static.py` checks the required REV 04 titles.
- REV 04 static, browser (search and detail of Media Spend, Revenue, Overstock SKU, CTR, MQL, SQL; export and refresh) and print checks: [static-checks.json](../../../history/campaign-01_metrics-map-review-rev04/static-checks.json), [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace: [spec-graph.md](../spec-graph.md) “REV 04 — Spend, Revenue, and Overstock SKU”, the table (AC-02 to AC-04) and “REV 04 acceptance and verification”, bullets 1 to 3 (AC-01, AC-05). No AC label.
