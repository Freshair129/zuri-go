---
id: FR-002-019
title: Cohorts, scopes and platforms are never mixed into one total
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-003]
---

# FR-002-019 — Cohorts, scopes and platforms are never mixed into one total

The system SHALL give a lead acquired in one week and bought in the next its acquisition cohort and its transaction view and the purchased offer, SHALL keep the offer exposed, requested and purchased apart, SHALL NOT mix session-source, first-user and event-attributed scopes, SHALL NOT sum platform-attributed sales into business sales, SHALL recompute a funnel rate from compatible numerators and denominators, SHALL show sequential offer changes as before-and-after observations and not as causal uplift, and SHALL store event time, acquisition time, ingestion time and source watermark apart.

## Acceptance criteria
- AC-002-019-01 — Given a lead that enters in W1 and buys in W2, then the cohort view and the transaction view reconcile without counting the lead or the order twice.
- AC-002-019-02 — Given the offer, then the offer exposed, requested and purchased are kept apart, unknowns and multi-offer exposure included.
- AC-002-019-03 — Given business sales, then they come from the order ledger and not from the sum of platform-attributed sales.
- AC-002-019-04 — Given a funnel rate over subgroups, then it is recomputed from numerators and denominators and not averaged from the subgroup percentages.
- AC-002-019-05 — Given a change of offer between weeks, then it is shown as an observation and the screen asserts no causal uplift.
- AC-002-019-06 — Given the cross-cutting dimensions of the spec (campaign, date and timezone, phase, acquisition and purchased offer and version, channel, source, medium, campaign, ad and creative, placement, audience, new or returning customer, stage, cohort, SKU, lost and return reason), then the records carry them, with device and geography optional where coverage is adequate.
- AC-002-019-07 — Given a record, then its event time, its acquisition time, its ingestion time and the watermark of its source are stored apart.

## Implementation
- `measure` (acquisition cohort by `date`, purchased offer by `offer` on the order, `leadId` link) in `apps/web/src/content/shared/model.mjs`; the offer comparison and notes in `apps/web/src/content/dashboard/DashboardContent.jsx` (“purchased offer ใช้กับ order การเปลี่ยน offer ต่างสัปดาห์เป็น observation ไม่ใช่ causal uplift”).
- Tests: `tests/campaign/model.test.mjs` (“AC-10 cross-week and cross-offer lead converts only once”, “AC-15 offer/channel filters apply to facts and numerators”).

## Notes
- Spec trace ([spec.md](../spec.md)): §6, “Cross-cutting dimensions” and the list “Attribution safeguards” (AC-01 to AC-07); §10 AC-10 (AC-01). Legacy label: AC-10.
- Gaps: the records hold date, offer, channel, lead and customer fields and the stage, return and lost reasons, but not the source, medium, creative, placement or audience dimensions, and no ingestion time per record (only the watermark per source, `sources`) (AC-06, AC-07). No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
