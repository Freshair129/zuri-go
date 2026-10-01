---
id: FR-002-018
title: Leads, qualification, conversion, cost per lead, acquisition cost and response are counted as defined
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-003]
---

# FR-002-018 — Leads, qualification, conversion, cost per lead, acquisition cost and response are counted as defined

The system SHALL count MQL and SQL as distinct leads that reached each stage in the cohort or window, with the stock of the current stage shown apart from the flow of stage entries; Lead-to-Sale as distinct eligible leads with a qualifying sale inside the conversion window over the eligible leads of the same acquisition cohort, split into mature and pending; CPL and qualified CPL as matched spend over distinct eligible leads or stage counts; the cost per order as media cost over eligible orders, named a modelled media cost per order unless one new customer per sale is established; actual CAC only over distinct acquired new customers; AOV and units per order on comparable bases; and the response SLA as eligible inbound requests answered in the agreed window over eligible inbound requests.

## Acceptance criteria
- AC-002-018-01 — Given MQL and SQL, then they are never added into one unique denominator and the stage entries are shown apart from the current-stage stock.
- AC-002-018-02 — Given a lead that buys in a later week or another offer, then it converts once and the lead and the order are linked by Lead ID.
- AC-002-018-03 — Given the cost per order, then it is displayed as the media cost per order and not as CAC unless the new-customer scope is established; actual CAC needs distinct customers marked new with a customer ID.
- AC-002-018-04 — Given the response SLA, then it excludes automated replies and counts a same-day unanswered request apart, pending.
- AC-002-018-05 — Given an unmapped order, then it stays in the actuals and holds the sales-conversion decision.

## Implementation
- `measure` (`mql`, `sql`, `mature`, `pending`, `cvr`, `converted`, `sla`, `newCustomers`) in `apps/web/src/content/shared/model.mjs`; `DEFINITIONS` and the metric detail in `apps/web/src/content/dashboard/Views.jsx`; the order form requires a customer ID for a new customer (`validateRecord`).
- Tests: `tests/campaign/model.test.mjs` (“AC-10 cross-week and cross-offer lead converts only once”, “stage-entry flows can occur after acquisition and do not create a second lead”, “unmapped orders remain in actuals but hold a sales-conversion decision”).

## Notes
- Spec trace ([spec.md](../spec.md)): §6 table rows “MQL / SQL”, “Lead-to-Sale”, “CPL / qualified CPL”, “CPO / actual CAC”, “AOV / Units per Order” and “Response SLA”; §1.3 item 5 (the CAC naming) (AC-01 to AC-05). No AC label of §10 beyond AC-10.
- Available stock, complete-set capacity and overstock SKU are in [FR-002-014](FR-002-014-stock-and-response-guards.md).
