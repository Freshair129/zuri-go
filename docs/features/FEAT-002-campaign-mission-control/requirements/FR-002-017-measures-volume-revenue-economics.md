---
id: FR-002-017
title: Net units, orders, net revenue, contribution and spend are counted as defined
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-003]
---

# FR-002-017 — Net units, orders, net revenue, contribution and spend are counted as defined

The system SHALL count net fulfilled units as fulfilled line quantities less returned units, never counting a cancellation and showing paid-unfulfilled units apart; orders as distinct eligible order IDs with the placed, paid, fulfilled and cancelled states kept apart; net revenue as the eligible paid value after discounts less refunds, without subtracting a void twice; and contribution after media as net revenue less product cost, actual packaging, shipping subsidy, payment fees, commissions, other scoped variable costs and the media spend, with the cost completeness shown and no second subtraction of the media cost.

## Acceptance criteria
- AC-002-017-01 — Given orders with fulfillment, return, refund and cancellation dates, then each event is posted on its own date and cancelled orders never count as fulfilled.
- AC-002-017-02 — Given a cancelled receipt, then its retained variable costs reconcile and the refund is counted once.
- AC-002-017-03 — Given the contribution, then it is computed only when every cost of the six kinds and the media are known; otherwise it is unknown and the completeness is shown.
- AC-002-017-04 — Given the actual media spend, then it is compared with the released cap and the plan to date with the fee and tax policy stated.
- AC-002-017-05 — Given an order, then the net revenue excludes a void and is not reduced twice by a refund.

## Implementation
- `measure`, `netUnits`, `netRevenue`, `eligibleOrder`, `costComplete` and `COSTS` in `apps/web/src/content/shared/model.mjs`; the definitions panel `DEFINITIONS` in `apps/web/src/content/dashboard/Views.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“fulfillment, returns and refunds are posted on event dates”, “cancelled receipts and retained variable costs reconcile”, “cost missing does not become zero …”, “M01 source arithmetic reconciles without rounded packaging leakage”).

## Notes
- Spec trace ([spec.md](../spec.md)): §6 table rows “Net fulfilled units”, “Orders”, “Net revenue”, “Contribution after media” and “Media Spend / pacing” (AC-01 to AC-05). No AC label of §10.
- Order records carry one date each for payment, fulfillment, refund and return; a detailed ledger reconciliation stays upstream (the verification’s “Operational boundaries”).
