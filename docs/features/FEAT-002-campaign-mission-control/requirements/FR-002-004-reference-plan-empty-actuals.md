---
id: FR-002-004
title: The original plan is read-only evidence and actuals start empty
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-004 — The original plan is read-only evidence and actuals start empty

The system SHALL keep the original MUJEEN M1 plan as read-only reviewed evidence separate from the manual workspace, SHALL start the workspace with no actuals, SHALL label the provenance of plan and scenario figures, and SHALL NOT draw a performance chart when no actual source is connected.

## Acceptance criteria
- AC-002-004-01 — Given a new workspace, then the actuals are empty except for the documented MUJEEN target and reference.
- AC-002-004-02 — Given no actual source connected, then the screen shows unknown actuals and the provenance of the plan and scenario figures, and draws no performance chart.
- AC-002-004-03 — Given the original plan file, then it is stored as read-only evidence and its original assumptions are not edited silently.
- AC-002-004-04 — Given the original scenario (Low 2%, Mid 5%, High 10% Lead-to-Sale, all toward 43 orders and 108 units), then it is shown as a labelled reference, pending a phased reforecast, and never as an observed result or an approved spending cap.

## Implementation
- `createCampaign` (seeded MUJEEN target only) in `apps/web/src/content/shared/model.mjs`; the source inspector of the original plan and the label “ข้อมูลจริงกรอกเอง · Local workspace · M01 เป็นแผนอ้างอิง” in `apps/web/src/content/dashboard/DashboardContent.jsx`; `Forecast` and `OFFERS` for the scenario.
- The workspace starts empty except for the documented MUJEEN target ([verification](../verification.md), “Browser verification”); original M01 file evidence opens from the source inspector (Browser report).

## Notes
- Spec trace ([spec.md](../spec.md)): §13, first and second paragraphs (AC-01, AC-03); §1.2, last paragraph (AC-03); §4.2 and §4.1, last sentence (AC-04); §10 AC-16 (AC-02). Legacy label: AC-16.
- Original source file, `C:/Users/pc/Downloads/MUJEEN_GTM_M1_…`, is outside the repository; it is evidence of the plan, not a build input.
