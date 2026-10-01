---
id: FR-002-016
title: An alert is one open item, acknowledged is not resolved, and overrides expire
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-016 — An alert is one open item, acknowledged is not resolved, and overrides expire

The system SHALL give each rule a rule ID, version and scope with its metric, operator, value and unit, numerator and denominator policy, lookback, maturity lag, minimum sample, cadence, severity, action scope, owner, deadline and source, SHALL keep one open item per gate per campaign, SHALL NOT treat an acknowledgment as a resolution, SHALL record a new rule version whenever a rule changes, and SHALL require an override to name a decision owner, a reason, an expiry and follow-up evidence.

## Acceptance criteria
- AC-002-016-01 — Given the same alert repeats and the owner acknowledges it, then one open alert remains with its observations updated and the acknowledgment does not resolve it.
- AC-002-016-02 — Given a condition that passes again, then the item leaves the queue and the history of acknowledgments is kept.
- AC-002-016-03 — Given an override, then it needs a named decision owner, a reason, an expiry date and follow-up evidence.
- AC-002-016-04 — Given a data-hold badge, then it does not hide a known overspend or stock-out.
- AC-002-016-05 — Given a rule changes, then a new version is recorded.
- AC-002-016-06 — Given a rule, then it carries the fields listed above as stored data.

## Implementation
- `alertList` (one entry per rule ID, `Open` or `Acknowledged`) and `alertActions` in `apps/web/src/content/shared/model.mjs`; `Acknowledge` in `apps/web/src/content/dashboard/Views.jsx`; the override fields (“Override ต้องมีวันหมดอายุ”, “Override หมดอายุ”) in `apps/web/src/content/dashboard/Forms.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“AC-12 repeated breach produces one alert, acknowledgement is not resolution”, “AC-09 stale data and budget breach both remain visible”).

## Notes
- Spec trace ([spec.md](../spec.md)): §5.3 (AC-02 to AC-06 in its second and third paragraphs; AC-06 from its first paragraph); §10 AC-12 (AC-01). Legacy label: AC-12.
- Gap: the rules are written in code (`evaluate`); their field list of AC-06 is not stored as data and a rule has no version of its own, so a rule change is a code change, not a recorded version (AC-05). No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
