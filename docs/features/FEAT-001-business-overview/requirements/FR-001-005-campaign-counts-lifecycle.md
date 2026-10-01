---
id: FR-001-005
title: Running and queued campaigns come from a lifecycle the user confirms
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-002]
---

# FR-001-005 — Running and queued campaigns come from a lifecycle the user confirms

The system SHALL count as “กำลังรัน” the campaigns whose lifecycle is `active` and that are not archived and as “อยู่ในคิว” those whose lifecycle is `queued` and that are not archived, SHALL NOT infer a lifecycle from dates, and SHALL list the campaigns whose status is unconfirmed so that it can be confirmed.

## Acceptance criteria
- AC-001-005-01 — Given 3 active, 2 queued, 1 paused and 1 unconfirmed campaigns, then the cards show 3 and 2, and the unconfirmed one is listed for confirmation.
- AC-001-005-02 — Given a paused, draft, queued or unconfirmed campaign, then it is not counted as running; an archived campaign is counted in neither card, and no lifecycle is guessed from dates.
- AC-001-005-03 — Given a campaign whose data is entered late, then its lifecycle does not change by itself, for the lifecycle, approval, publication status and the freshness of data are separate dimensions.

## Implementation
- `overview` in `apps/web/src/content/business/model.mjs` (`counts.active`, `counts.queued`, `counts.unconfirmed`; `LIFECYCLE`); the attention list “แคมเปญรอยืนยันสถานะ” in `apps/web/src/content/business/BusinessWorkspace.jsx`.
- Test: `apps/api/test/model.test.mjs` (“lifecycle is explicit, archived excluded and unknown not treated as queued”). The imported campaign stayed unconfirmed in production ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “State and persistence”).

## Notes
- Spec trace ([spec.md](../spec.md)): §6 table rows “กำลังรัน” and “อยู่ในคิว” and the paragraph after the table (AC-01 to AC-03); ZGO-02 (AC-01); the paragraph after the table (AC-03). Legacy label: ZGO-02.
- The warning for a queued campaign past its planned start is [FR-001-007](FR-001-007-attention-and-schedule.md).
