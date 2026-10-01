---
id: FR-002-007
title: Performance target bands and their boundary rules
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-007 — Performance target bands and their boundary rules

The system SHALL hold for each KPI a target with its campaign, phase and offer scope, its direction, explicit Low, Mid and High values and a decision cutoff, SHALL place a value at a boundary in the band it reaches, SHALL reverse the boundaries for a lower-is-better KPI, and SHALL NOT give a full traffic-light score when a band is missing.

## Acceptance criteria
- AC-002-007-01 — Given a target, then its campaign, phase and offer scope are stored and DESTINY thresholds are never applied silently to Normal.
- AC-002-007-02 — Given a higher-is-better KPI, then the bands are below Low, Low to below Mid, Mid to below High, and at or above High; for a lower-is-better KPI the numeric boundaries are reversed and for an acceptable range the configured bounds are used.
- AC-002-007-03 — Given a value equal to a boundary, then it belongs to the band it reaches, and the rule is shown.
- AC-002-007-04 — Given a missing Low, Mid or High value, then it stays TBD and no full traffic-light score is produced.
- AC-002-007-05 — Given the decision cutoff, then its minimum sample, maturity, evaluation window and action scope are separate fields.
- AC-002-007-06 — Given MUJEEN, then only the 108-unit monthly goal is set and no 80%, 100% or 120% band is invented; a stretch target fits the sellable stock plus the confirmed inbound.

## Implementation
- `targetBand`, `validateSettings` (ordering Low ≤ Mid ≤ High, Normal CVR Low < Mid < High) and `createCampaign` in `apps/web/src/content/shared/model.mjs`; the settings form in `apps/web/src/content/dashboard/Forms.jsx`.
- Test: `tests/campaign/model.test.mjs` (“invalid dates, target ordering and future actual records are rejected”). The screen text “ค่าเท่าขอบเขตนับเข้าระดับนั้น” states the equality rule (apps/web/src/content/dashboard/DashboardContent.jsx).

## Notes
- Spec trace ([spec.md](../spec.md)): §4.1, the table and the three paragraphs after it (AC-01 to AC-06). No AC label of §10.
- Gaps: a lower-is-better direction and an acceptable range are not modelled in the target form (the KPIs of the four objectives are higher-is-better), so AC-02 holds for higher-is-better KPIs only; the 108-unit stretch limit of AC-06 is guidance in the form, not a check. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
