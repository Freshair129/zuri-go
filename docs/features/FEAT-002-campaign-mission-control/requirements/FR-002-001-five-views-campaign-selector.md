---
id: FR-002-001
title: Five views and a campaign selector that moves everything together
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001, FEAT-010]
---

# FR-002-001 — Five views and a campaign selector that moves everything together

The system SHALL give each campaign a workspace of five views — Overview, Performance, Plan & Gates, Workboard and Review & Decisions — SHALL let a campaign selector change the objective, dates, currency, target set, owners and data scope together, and SHALL make the status of the data and its sources reachable from the common header and from the metrics it affects, with no sixth page needed for a review.

## Acceptance criteria
- AC-002-001-01 — Given a campaign, then the five views are offered, each with its main action: open a review checkpoint, open a metric or segment detail, record the decision, add or assign an action, make a review snapshot.
- AC-002-001-02 — Given another campaign is chosen in the selector, then the objective, dates, currency, target set, owners and data scope change together.
- AC-002-001-03 — Given the common header or an affected metric, then the source status and watermarks can be reached from it.
- AC-002-001-04 — Given the monthly history and the per-phase cohort views, then they use the same metric definitions.

## Implementation
- `TABS` in `apps/web/src/content/meeting/MeetingWorkspace.jsx` (`campaign-overview`, `performance`, `plan`, `work`, `review`); `CampaignContent` in `apps/web/src/content/dashboard/DashboardContent.jsx`; the health strip “ข้อมูลครบถึง”.
- All five views opened at 1440 px and 390 px with no page overflow ([verification](../verification.md), “Evidence”; [browser-results.json](../../../history/campaign-mission-control-review/browser-results.json)).

## Notes
- Spec trace ([spec.md](../spec.md)): §2, opening sentence, table and the paragraph after it (AC-01 to AC-04). No AC label of §10.
- The Workboard row of the §2 table is now a view of the task records: its content is [FR-010-013](../../FEAT-010-task-manager/requirements/FR-010-013-workboard-as-view.md) and is not restated here.
