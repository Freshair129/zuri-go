---
id: FR-002-023
title: Filters, the detail panel and exports use the same population
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-023 — Filters, the detail panel and exports use the same population

The system SHALL filter by date, offer and channel so that the cards, the numerators and denominators, the detail panel and an exported snapshot all use the same population, SHALL open a metric or row in a detail panel with its definition, source, time basis, formula, target or cutoff, breakdown and linked tasks, and SHALL export a scoped snapshot.

## Acceptance criteria
- AC-002-023-01 — Given a filter to a phase or an offer, when a metric is inspected or exported, then the cards, the numerator and denominator, the detail and the exported snapshot use the same population.
- AC-002-023-02 — Given a metric or a row, when it is opened, then a right-side panel shows its definition, source, time basis, formula, target or cutoff, breakdown and linked tasks; on a phone it is a full-width view with a clear way back.
- AC-002-023-03 — Given a scoped export, then its totals and denominators reconcile with the screen for All and for a single channel.
- AC-002-023-04 — Given tabs, filters and detail drawers, then they keep the same campaign and phase population.

## Implementation
- `matches` and `measure(scope)` in `apps/web/src/content/shared/model.mjs`; `scopedExport`, the filter row and `MetricDetail` in `apps/web/src/content/dashboard/DashboardContent.jsx` and `apps/web/src/content/dashboard/Views.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“AC-15 offer/channel filters apply to facts and numerators”). Browser: All and Meta export totals and denominators reconcile; the desktop and mobile detail panels and the Escape key ([verification](../verification.md), “Evidence”; [metric-detail-desktop.png](../../../history/campaign-mission-control-review/metric-detail-desktop.png)).

## Notes
- Spec trace ([spec.md](../spec.md)): §9, the bullets on tabs, filters and detail drawers and on the right-side detail panel (AC-02, AC-04); §10 AC-15 (AC-01, AC-03); §13, second paragraph (day, offer and channel filtering). Legacy label: AC-15.
