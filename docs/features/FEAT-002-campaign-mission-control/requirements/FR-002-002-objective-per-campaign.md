---
id: FR-002-002
title: Each campaign has its own objective, KPI set and rule set
delivery: building
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-002 — Each campaign has its own objective, KPI set and rule set

The system SHALL give each campaign its own objective — inventory clearance, revenue / commerce, lead generation or awareness / consideration — with its own outcome KPI, diagnostic drivers, guardrails and applicable rules, SHALL let the owner choose one to three headline KPIs from the objective’s template, SHALL NOT force ROAS or sales as the North Star of every campaign, SHALL NOT total unlike currencies, periods, overlapping reach or North Stars across campaigns, and SHALL NOT let the data of one campaign appear in another.

## Acceptance criteria
- AC-002-002-01 — Given the objective of a campaign is switched, then the metric roles, the targets and the applicability of the rules change together and no data of another campaign appears.
- AC-002-002-02 — Given a lead-generation or an awareness campaign, then it does not inherit the sales-conversion gates.
- AC-002-002-03 — Given an objective, then the template offers the outcome KPI candidates, diagnostic drivers and guardrails of that objective, as a starting point and not a mandatory set.
- AC-002-002-04 — Given campaigns with different currencies, periods, overlapping reach or North Stars, then no total is shown across them; a list of campaigns compares status, objective, budget use and next action only.
- AC-002-002-05 — Given a campaign, then its owner chooses one to three headline KPIs from the template.

## Implementation
- `OBJECTIVES`, `PRIMARY` and `createCampaign` in `apps/web/src/content/shared/model.mjs`; `evaluate` applies the objective-specific rules.
- Tests: `tests/campaign/model.test.mjs` (“AC-01 lead objective uses SQL and does not require sales/contribution”, “AC-01 awareness uses ad observations without CRM qualification lag”). Browser: independent campaign selection and empty targets for a new campaign ([verification](../verification.md), “Acceptance trace”).

## Notes
- Spec trace ([spec.md](../spec.md)): §1.1 bullet 1 and §2.2 (AC-01 to AC-04); §2.2, last paragraph (AC-04); §2.2, first sentence (AC-05); §10 AC-01 (AC-01). Legacy label: AC-01 of §10.
- Gap: the headline KPIs are fixed per objective (`PRIMARY` plus the spend and support measures); the owner cannot choose one to three (AC-05). No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
- Changing the objective of a saved campaign clears its targets and sets the new KPI set in the same step (the form says so; `apps/api/service.mjs` refuses it elsewhere).
