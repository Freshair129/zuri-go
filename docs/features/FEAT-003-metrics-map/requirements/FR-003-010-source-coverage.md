---
id: FR-003-010
title: Every source image and supporting source is accounted for
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-008]
---

# FR-003-010 — Every source image and supporting source is accounted for

The guide SHALL map the eight source images G01–G08 to the pages that carry their content, SHALL end with a source index of those images and of the supporting sources S01–S12 that separates what is in the images from what is supplementary, and SHALL NOT use the original organization’s name, people or call to action as zuri brand elements.

## Acceptance criteria
- AC-003-010-01 — Given the eight images G01 to G08 (cover summary, Awareness, Consideration, Conversion, CPO and CAC and LTV, the funnel overview, the AARRR and planning image, and the team and workflow image), then each has its content on the pages the source mapping names.
- AC-003-010-02 — Given the last page, then it shows the source index G01–G08 and the links S01–S12, so that what is in an image is told apart from supplementary information.
- AC-003-010-03 — Given the images carry an organization name, people and a call to action, then the guide re-words the content with its source and does not use that logo, those people or that call to action as brand elements.
- AC-003-010-04 — Given the user-supplied M1 planning document (S12), then it is used for metric structure only (see FR-003-008).

## Implementation
- `scripts/metrics/build_metrics_map.py` (the source index of page 18); the source images in `apps/metrics/gvm/`.
- Source mapping checked in the REV 02 QC ([qc.md](../qc.md), AC-01 PASS); Static audit of the generated guide (18 pages, 38 metric cards, 40 graph terms, no missing file or anchor): `scripts/metrics/verify_metrics_map_static.py`, run by `npm test` and `npm run build`; its extraction-time report is [static-checks.json](../../../migrations/verification/metrics/static-checks.json). REV 04 browser and print checks: [browser-checks.json](../../../history/campaign-01_metrics-map-review-rev04/browser-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §3 “Source mapping — ตรวจภาพครบ 8/8” and the paragraph after its table (AC-01, AC-03), §13 (AC-02), §16 (AC-02, AC-04); §15 AC-01 (AC-01). Legacy label: AC-01 of [spec-content.md](../spec-content.md) §15.
- The guide links the source images under `gvm/` (the package copies exactly those the guide links; one file name contains a space).
