---
id: FR-002-003
title: The Overview answers what to decide or fix now
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-003 — The Overview answers what to decide or fix now

The system SHALL show on the Overview of a campaign its header, a thin phase rail, one to three headline measures, an actual-versus-plan trend, a decision area and the work due before the next checkpoint, SHALL mark an offer that is not open as “ยังไม่เปิด” and never as zero performance, and SHALL show an unknown actual as “ยังไม่มีข้อมูล” or “รอข้อมูล” and an unconfigured target as not set.

## Acceptance criteria
- AC-002-003-01 — Given the Overview, then its header names the campaign, objective, period, timezone and phase and shows the source watermarks.
- AC-002-003-02 — Given the phase rail, then it runs Normal → review → DESTINY if released → review → the next offer if released → month-end review, and an offer not yet open shows “ยังไม่เปิด”, not a zero.
- AC-002-003-03 — Given an inventory-clearance campaign like MUJEEN, then the headline measures are the net fulfilled units against 108, the contribution after media against the approved floor, and the media spend against the released cap, the last one labelled as a guardrail.
- AC-002-003-04 — Given the trend, then it shows the cumulative actual against the approved plan, shows the Low, Mid and High paths only once targets exist, and keeps future actuals null.
- AC-002-003-05 — Given the decision area, then it shows the decision due, the eligibility status, one dominant call to action and a checklist of what blocks.
- AC-002-003-06 — Given the lower area, then it lists the tasks due before the next checkpoint and a short offer comparison; full diagnostics stay in Performance.
- AC-002-003-07 — Given an actual that is unknown or a target that is not set, then the screen says so (“ยังไม่มีข้อมูล”, “รอข้อมูล”, “ยังไม่กำหนด …”) and draws no line.

## Implementation
- `CampaignContent` (view overview), `PhaseRail`, `Metric` and `Evidence` in `apps/web/src/content/dashboard/DashboardContent.jsx` and `apps/web/src/content/dashboard/Views.jsx`; `trend` and `currentPhase` in `apps/web/src/content/shared/model.mjs`.
- Populated Overview with real line marks over a synthetic fixture and future actual null ([verification](../verification.md), “Evidence”; [populated-overview.png](../../../history/campaign-mission-control-review/populated-overview.png)). Test: `tests/campaign/model.test.mjs` (“plan trend keeps future actuals null and hits exact final goals”).

## Notes
- Spec trace ([spec.md](../spec.md)): §2.1, bullets 1 to 7 and the last bullet (AC-01 to AC-07); §10 AC-16 for the unknown label (AC-07). Legacy label: AC-16 (part).
- The forecast series of §2.1 (“forecast is a separate dashed series”) is in [FR-002-009](FR-002-009-pacing-forecast.md). The spec words an unconfigured target “ยังไม่กำหนดเป้า”; the screens say “ยังไม่กำหนด …” (same meaning, other words).
