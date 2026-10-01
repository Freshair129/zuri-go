---
id: FR-002-011
title: Stale data and an immature sample hold the verdict (G-01, G-02)
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-011 — Stale data and an immature sample hold the verdict (G-01, G-02)

The system SHALL apply rule G-01 — a stale source, a missing population or an invalid denominator gives `DATA_HOLD`, names the affected decisions and keeps the last verified timestamp — and rule G-02 — fewer than seven days from the offer launch, or an insufficient eligible cohort or sample, gives LEARNING / INCONCLUSIVE with no efficacy verdict.

## Acceptance criteria
- AC-002-011-01 — Given a source older than the accepted data age, or a missing population, then the result is `DATA_HOLD`, the decisions it affects are named and the last verified timestamp of the source is kept.
- AC-002-011-02 — Given fewer than seven days since the offer launch, or fewer eligible leads than the minimum sample, then the result is LEARNING and no efficacy verdict is given.
- AC-002-011-03 — Given a review at day 7, then a review record is prompted even when the conclusion is “not enough evidence”.
- AC-002-011-04 — Given leads that have not completed the conversion window, then they are counted as pending and shown apart from the mature cohort.

## Implementation
- `evaluate` and `alertList` (rules `G-01`, `G-02`) in `apps/web/src/content/shared/model.mjs`; the review prompt “ครบหนึ่งสัปดาห์ให้บันทึก review …” in `apps/web/src/content/dashboard/DashboardContent.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“AC-04 immature and insufficient cohorts remain inconclusive”; “AC-09 stale data and budget breach both remain visible”).

## Notes
- Spec trace ([spec.md](../spec.md)): §5.2 rows G-01 and G-02 and the paragraph after the table (“Day 7 always produces a review record”). No AC label of §10 beyond AC-04, AC-09. Source-specific freshness limits are a setting (“อายุข้อมูลสูงสุดที่ยอมรับ”), TBD per the spec.
- The review record is prompted, not enforced: the system does not block the next step if none is saved. The screen names each missing item and says the cutoff decision is held; the source watermark (“ข้อมูลครบถึง”) is the last verified date kept.
