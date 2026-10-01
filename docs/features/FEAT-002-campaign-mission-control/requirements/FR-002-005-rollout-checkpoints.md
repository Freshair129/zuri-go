---
id: FR-002-005
title: Normal sales first, a conditional DESTINY release, and a checkpoint at each week
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-010]
---

# FR-002-005 — Normal sales first, a conditional DESTINY release, and a checkpoint at each week

The system SHALL run a campaign from Normal sales to a conditional DESTINY release and later offers, SHALL never release an offer without an explicit recorded decision, SHALL record the release decision, a budget decision and an offer decision separately, and SHALL anchor each seven-day observation to the day the offer actually launched.

## Acceptance criteria
- AC-002-005-01 — Given D7 of the normal phase with healthy performance, then continue normal is available and DESTINY stays unreleased until an explicit decision.
- AC-002-005-02 — Given D7 below pace with eligible data and offer evidence, then DESTINY is proposed with a launch checklist and no price or budget changes by itself.
- AC-002-005-03 — Given DESTINY launched on D10, then its seven-day observation and its review are anchored to D10 and fall on D17, not on nominal week dates.
- AC-002-005-04 — Given a release decision, then it neither implies permission to raise the budget nor a new offer; each is recorded with its scope and effective time.
- AC-002-005-05 — Given a week change, then it creates a review checkpoint and approves nothing automatically.
- AC-002-005-06 — Given an approved release decision, then the actual launch is confirmed separately and the offer timing is anchored to that confirmation.

## Implementation
- `currentPhase`, `evaluate` (`reviewDate`, `canRelease`) and `validateRelease` in `apps/web/src/content/shared/model.mjs`; the decision and launch forms in `apps/web/src/content/dashboard/Forms.jsx` (“ยืนยันเปิดขายจริง”, “ยืนยันและเริ่มนับ 7 วัน”).
- Tests: `tests/campaign/model.test.mjs` (“AC-02 healthy normal never auto-releases DESTINY”, “AC-03 eligible normal below pace permits first DESTINY after decision”, “AC-05 launch on D10 anchors review seven days later”).

## Notes
- Spec trace ([spec.md](../spec.md)): §3, table and the paragraph after the flow chart (AC-01, AC-02, AC-04); §1.1 bullets 2 to 5 (AC-02, AC-05); §13, second paragraph (AC-06); §10 AC-02, AC-03, AC-05 (AC-01 to AC-03). Legacy labels: AC-02, AC-03, AC-05.
- The later checkpoints G3, G4 and the close (§3 table rows) are operated by the same review records; the system does not start a new test without time for its review (see [FR-002-015](FR-002-015-pace-remaining-time.md)).
