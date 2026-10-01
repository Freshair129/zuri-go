---
id: FR-002-010
title: Gate checks run in a fixed order and a hard breach is never hidden
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-010 — Gate checks run in a fixed order and a hard breach is never hidden

The system SHALL evaluate a campaign in this order — hard operational constraints, data eligibility, evidence sufficiency, performance band, action readiness, owner decision — SHALL raise a confirmed hard breach at once whatever the sample size, SHALL give `DATA_HOLD` for performance judgment when the data is not eligible while keeping any confirmed hard breach visible, SHALL return the value, numerator, denominator, window and threshold version of a performance result, and SHALL only recommend actions in the first implementation.

## Acceptance criteria
- AC-002-010-01 — Given a confirmed exhausted cap, invalid checkout, unavailable stock or impossible fulfillment, then a scoped blocking action is raised at once, even when the sample is small.
- AC-002-010-02 — Given a stale source, a missing population or an invalid denominator, then the performance judgment is `DATA_HOLD` while any confirmed hard breach stays visible.
- AC-002-010-03 — Given a data hold together with a confirmed budget exhaustion, then the budget breach still blocks release.
- AC-002-010-04 — Given a performance result, then it carries the measured value, numerator, denominator, time window and threshold version.
- AC-002-010-05 — Given an action ready to change an offer, budget or price, then the system records the owner’s decision and recommends only; a platform change needs a separate authorized path.

## Implementation
- `evaluate` in `apps/web/src/content/shared/model.mjs` (order: `hard`, then `missing` → `DATA_HOLD`, then `LEARNING`, then the bands, then `serviceHold`); the decision form in `apps/web/src/content/dashboard/Forms.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“AC-09 stale data and budget breach both remain visible”). The release form says an approved decision is a record by the owner and that the real launch is confirmed apart (apps/web/src/content/dashboard/Forms.jsx).

## Notes
- Spec trace ([spec.md](../spec.md)): §5.1, items 1 to 6 (AC-01, AC-02, AC-04, AC-05); §10 AC-09 (AC-03). Legacy label: AC-09.
- The metric value, numerator and denominator are shown in the detail panel and stored in the review snapshot; the threshold version is the settings version of the snapshot.
