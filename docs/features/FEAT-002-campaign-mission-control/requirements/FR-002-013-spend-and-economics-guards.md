---
id: FR-002-013
title: Spend caps and margin floors block a release or a scale (G-07, G-08)
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-013 — Spend caps and margin floors block a release or a scale (G-07, G-08)

The system SHALL apply rule G-07 — media spend plus commitments reaching the released cap blocks further release and proposes a scoped pause — and rule G-08 — a measured contribution below the approved floor gives FIX / NO SCALE, and incomplete costs give `DATA_HOLD` — and SHALL NOT let a high conversion override either.

## Acceptance criteria
- AC-002-013-01 — Given a high conversion and a contribution below the approved floor, then the scale is blocked by the economics guardrail with an actionable reason.
- AC-002-013-02 — Given the spend and the confirmed commitments reach the released cap, then further release is blocked and a scoped pause or decision is proposed.
- AC-002-013-03 — Given a cost that is missing, then the contribution is unknown and the result is a data hold, never a green scale recommendation.
- AC-002-013-04 — Given a released ceiling, then one ceiling and scope are chosen before execution; the proposed range of 15,000–20,000 baht and the base estimate of 116,400 baht are not authorizations to spend.

## Implementation
- `evaluate` (`hard`: “งบใช้จริงและภาระที่ยืนยันถึง released cap แล้ว”, “Contribution margin ต่ำกว่า floor”; `missing`: cost completeness) and `alertList` (`G-07`, `G-08`) in `apps/web/src/content/shared/model.mjs`; `costComplete`.
- Tests: `tests/campaign/model.test.mjs` (“AC-08 high CVR cannot override a margin breach”, “cost missing does not become zero or a green scale recommendation”). Screen text “ไม่ใช่งบที่ปล่อยแล้ว” on the 15,000–20,000 baht range (apps/web/src/content/dashboard/DashboardContent.jsx).

## Notes
- Spec trace ([spec.md](../spec.md)): §5.2 rows G-07, G-08 and the paragraph after the table (AC-01 to AC-04); §10 AC-08 (AC-01). Legacy label: AC-08.
- The result label for a margin breach is `BLOCK` in the code and its tests, where the rule library says FIX / NO SCALE; the effect — no scale, an actionable reason — is the spec’s.
