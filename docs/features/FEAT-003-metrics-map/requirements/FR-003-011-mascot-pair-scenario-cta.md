---
id: FR-003-011
title: Both mascots, a short scenario and an action on every page
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-009]
---

# FR-003-011 — Both mascots, a short scenario and an action on every page

The guide SHALL show Zuri and น้องวางใจ in the content of every page, with each name and a text alternative, with Zuri explaining and น้องวางใจ pointing at a check, SHALL vary the pose and side across pages without hiding the pair at any breakpoint or overlaying the text, and SHALL give every page one short practical scenario and a call-to-action link to a relevant section.

## Acceptance criteria
- AC-003-011-01 — Given each of the 18 pages, then both Zuri and น้องวางใจ appear in the page content, each with its name and an alt text naming both, and the ZURI wordmark is not used in place of the image of Zuri.
- AC-003-011-02 — Given the pair, then Zuri explains and น้องวางใจ points at a check related to the topic, and the pair is not hidden by a breakpoint or placed as a fixed overlay that covers text.
- AC-003-011-03 — Given the pages, then three paired poses rotate, the art alternates sides and some pages put the guide before the content; the images are not stretched, flipped or recreated.
- AC-003-011-04 — Given each page, then it has one short scenario and an amber call-to-action link that goes to a relevant section.
- AC-003-011-05 — Given the Consideration page, then its scenario uses CTR to judge how interesting content is and says the comparison needs the same audience, placement, objective and period.

## Implementation
- `scripts/metrics/build_metrics_map.py` and the paired illustrations in `apps/web/src/content/assets/`; `scripts/metrics/verify_metrics_map_static.py` checks, for every page, the two role names, the pair image and the call to action.
- Both mascots and the pair on all 18 pages and in the graph; REV 04 print: each sheet shows both mascots ([static-checks.json](../../../history/campaign-01_metrics-map-review-rev04/static-checks.json), [print-checks.json](../../../history/campaign-01_metrics-map-review-rev04/print-checks.json)).

## Notes
- Spec trace: [spec-content.md](../spec-content.md) §14 “Mascot และกฎการจัดหน้า”, the table and the requirement list (AC-01 to AC-03); “บันทึก REV 02.3” and §19 (AC-03 to AC-05); §15 AC-03 and AC-04 (AC-01). Legacy labels: AC-03, AC-04 of [spec-content.md](../spec-content.md) §15.
- The paired illustrations are draft art generated from the reference; their final color approval is open (stated in the brief and the QC).
