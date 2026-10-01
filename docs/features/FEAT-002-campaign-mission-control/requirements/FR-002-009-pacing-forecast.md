---
id: FR-002-009
title: Pace to date, remaining need and forecast are shown with their basis
delivery: building
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-009 — Pace to date, remaining need and forecast are shown with their basis

The system SHALL show the target to date as the approved final target times the cumulative approved daily weights, or a uniform calendar-day path labelled as a planning assumption when there are none, SHALL show actual, expected and gap together, SHALL show the units remaining and the required units per day, SHALL keep a forecast a separate dashed series with its lookback, known phase changes and constraints and suppress it when there are no useful observations, and SHALL compute the reforecast from the expected orders of each phase and offer.

## Acceptance criteria
- AC-002-009-01 — Given no approved daily weights, then the target to date follows a uniform calendar-day path, labelled as a planning assumption.
- AC-002-009-02 — Given the target to date is above zero, then the target attainment is actual divided by it, and actual, expected and the gap are shown together.
- AC-002-009-03 — Given the monthly goal of 108 units, then the units remaining are the larger of 0 and 108 minus the eligible net fulfilled units to date, and the required units per day are those remaining divided by the remaining eligible selling days (undefined when no day remains, then the final gap is shown).
- AC-002-009-04 — Given the simple end forecast, then it is the actual to date plus the comparable recent units per day times the remaining selling days, shows its lookback, known phase changes and stock and time constraints, and is suppressed when it rests on no useful observation.
- AC-002-009-05 — Given the expected orders by active and planned phase and offer, then the reforecast of orders, units and revenue is their sum, and the remaining budget is the released cap minus actual spend and known commitments, counted once.

## Implementation
- `trend`, `evaluate` (`lowToDate`, `midToDate`, `highToDate`, `remainingBudget`) in `apps/web/src/content/shared/model.mjs`; `Forecast` (an offer-count scenario saved as “บันทึก scenario”) in `apps/web/src/content/dashboard/Views.jsx`; the note “Target to date: Low … / Mid … · Actual …” in `apps/web/src/content/dashboard/DashboardContent.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“plan trend keeps future actuals null and hits exact final goals”, “headline target band compares to date rather than the final monthly goal”). The 0.2.0 scope names a uniform daily path and an explicit offer-count reforecast ([verification](../verification.md), “Operational boundaries”).

## Notes
- Spec trace ([spec.md](../spec.md)): §4.3, bullets 1 to 7 (AC-01 to AC-05); §2.1, fourth bullet (separate dashed forecast). No AC label of §10.
- Gaps: approved daily weights are not modelled (only the uniform path), and the screens show no units remaining, required units per day or simple end forecast. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
