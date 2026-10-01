---
id: FR-003-007
title: KPI & Budget, RACI, the 90-day roadmap and the 12-month outlook are labelled templates
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-003-007 — KPI & Budget, RACI, the 90-day roadmap and the 12-month outlook are labelled templates

The guide SHALL present the KPI card, the budget template, the RACI table, the 90-day roadmap and the 12-month outlook as educational templates and not as actual plans of zuri, SHALL write “รอกำหนด” in every cell without data and invent no target, SHALL give every RACI row exactly one A and at least one R, and SHALL change no real budget from an example.

## Acceptance criteria
- AC-003-007-01 — Given a planning page, then it says it is an educational template.
- AC-003-007-02 — Given the KPI card, then it has one card per goal with business goal, stage, metric, formula and unit, baseline with its period, the target the owners agree, owner, source, review cycle and a stop or adjust condition, and a cell with no data reads “รอกำหนด” with no assumed target.
- AC-003-007-03 — Given the budget template, then its categories (Media, Production, Partners, People & Tools, Reserve) carry Planned, Actual, Remaining and Owner, the planned budget is the sum of the approved categories, the remaining is planned minus actual, and no cost is counted twice across categories.
- AC-003-007-04 — Given the RACI table, then every row has exactly one A and at least one R, and the example duties are not assignments of real people.
- AC-003-007-05 — Given the roadmap, then it has the four periods W1–2 Unblock, W3–4 Foundation, W5–8 Velocity and W9–12 Compound with role, deliverable and evidence to pass, and days 85–90 are marked as the guide’s addition for review and hand-over; the 12-month outlook runs Build, Test, Scale and Compound by quarter and links to the 90-day plan.

## Implementation
- `scripts/metrics/build_metrics_map.py` (pages 10 to 13).
- REV 02 results: RACI rows each with exactly one A and at least one R, planning pages labelled as educational templates ([qc.md](../qc.md), “Acceptance results — REV 02 baseline”, AC-07 and AC-08). Static audit of the generated guide (18 pages, 38 metric cards, 40 graph terms, no missing file or anchor): `scripts/metrics/verify_metrics_map_static.py`, run by `npm test` and `npm run build`; its extraction-time report is [static-checks.json](../../../migrations/verification/metrics/static-checks.json). REV 04 browser and print checks: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §9 (AC-02, AC-03), §10 (AC-04), §11 and §12 (AC-05); §1 [ASSUMPTIONS] item 3 and §15 AC-07 (AC-01), AC-08 (AC-04). Legacy labels: AC-07, AC-08 of [spec-content.md](../spec-content.md) §15.
- Page 10 also holds the required-leads and estimated-media-budget formulas added at REV 02.2 ([FR-003-008](FR-003-008-commerce-operations-pages.md)).
