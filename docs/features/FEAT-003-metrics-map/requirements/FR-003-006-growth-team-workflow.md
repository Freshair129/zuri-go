---
id: FR-003-006
title: AARRR, the team and the working loop are explained as frames
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-003-006 — AARRR, the team and the working loop are explained as frames

The guide SHALL present AARRR as another way to look at the business and not as a one-to-one match with the three funnel stages, SHALL show the marketing team structure with the hand-offs between Data & Strategy and the execution functions, and SHALL describe the working loop from data to measurable work and the three skill levels.

## Acceptance criteria
- AC-003-006-01 — Given the AARRR page, then it gives the five stages — Acquisition, Activation, Retention, Referral and Revenue — each with its question, its measure and the related work, and says AARRR is not matched one to one with the funnel.
- AC-003-006-02 — Given the team page, then it shows Data & Strategy connected to the execution functions (Live, Affiliate, Influencer, Platform, Website, MDT, Content and Ads) and who takes over which stage.
- AC-003-006-03 — Given the workflow page, then it gives the loop Data & Insight → Strategy → Execution → Optimize, the hand-offs and the three skill levels.
- AC-003-006-04 — Given a team or workflow figure, then it is an illustration and not an actual structure of zuri.

## Implementation
- `scripts/metrics/build_metrics_map.py` (pages 07 to 09).
- Static audit of the generated guide (18 pages, 38 metric cards, 40 graph terms, no missing file or anchor): `scripts/metrics/verify_metrics_map_static.py`, run by `npm test` and `npm run build`; its extraction-time report is [static-checks.json](../../../migrations/verification/metrics/static-checks.json). REV 04 browser and print checks: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §6 (page 07), §7 (page 08), §8 (page 09) (AC-01 to AC-03); §1 [ASSUMPTIONS] item 3 (AC-04). No AC label.
- The source image G08 shows the Data & Strategy and execution structure; the guide rewrites it and does not reuse the original organization’s name, people or call to action (see [FR-003-010](FR-003-010-source-coverage.md)).
