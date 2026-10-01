---
id: FR-002-014
title: Short stock blocks an offer and a slow response holds the scale (G-09, G-10)
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-014 — Short stock blocks an offer and a slow response holds the scale (G-09, G-10)

The system SHALL apply rule G-09 — a sellable inventory that cannot fulfil the offer’s bill of materials and the reservations blocks the affected offer — and rule G-10 — a sales response or fulfillment backlog beyond the approved capacity or SLA holds the scale — and SHALL compute the capacity of a set from the BOM, the available stock and the reservations.

## Acceptance criteria
- AC-002-014-01 — Given a reserved or short SKU, then the capacity of the Complete set is recomputed from the BOM and the launch or scale of the affected offer is blocked.
- AC-002-014-02 — Given the available stock of a SKU, then it is the sellable stock minus the reservations, and the capacity of a set is the minimum, over the SKUs of its BOM, of the available units divided by the required quantity, rounded down.
- AC-002-014-03 — Given a SKU with a target, then its overstock is the larger of 0 and the available or sellable units, on the stock basis named, minus the target; without a target it is unknown.
- AC-002-014-04 — Given a BOM that is malformed, duplicated or fractional, then it is rejected.
- AC-002-014-05 — Given a lead whose first response breaches the SLA, then the scale is held even when the conversion is high, until the service work is unblocked.

## Implementation
- `capacity`, `stockAt`, `parseBom`, `evaluate` (`HOLD_SCALE`, `serviceHold`) and `alertList` (`G-09`, `G-10`) in `apps/web/src/content/shared/model.mjs`.
- Tests: `tests/campaign/model.test.mjs` (“AC-11 reserved/short SKU determines set capacity”, “BOM grammar rejects malformed, duplicate and fractional quantities”, “late sales responses hold scale even with high CVR”).

## Notes
- Spec trace ([spec.md](../spec.md)): §5.2 rows G-09, G-10 (AC-01, AC-05); §6 rows “Available stock / complete-set capacity” (AC-02) and “Overstock SKU” (AC-03); §10 AC-11 (AC-01); BOM format is the form’s (AC-04; the spec asks only for a versioned BOM). Legacy label: AC-11.
- The consideration of a feasible mix when a bundle is blocked (G-09) is guidance, not a computation.
