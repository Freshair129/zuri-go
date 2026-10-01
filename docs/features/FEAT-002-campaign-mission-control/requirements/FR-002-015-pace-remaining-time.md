---
id: FR-002-015
title: Pace below the Low path and too little time to test again (G-11, G-12)
delivery: building
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-015 — Pace below the Low path and too little time to test again (G-11, G-12)

The system SHALL apply rule G-11 — a unit pace below the approved Low path, after the relevant eligibility checks, prompts a review of the missed pace and of the offer, with DESTINY a candidate only at the first gate — and rule G-12 — a further seven-day review that cannot fit the remaining time, or a test cap reached inconclusively, leads to a decision to stop, hold or use the existing offer and never to an indefinite extension.

## Acceptance criteria
- AC-002-015-01 — Given eligible data and a primary KPI below the Low path to date, then a review of the missed pace and of the offer diagnosis is prompted, and DESTINY is a candidate only at the first gate.
- AC-002-015-02 — Given fewer than seven days remaining, then a new offer recommendation reports the time constraint and requires an explicit alternate plan.
- AC-002-015-03 — Given the test cap reached without a conclusion, then the decision is to stop, hold or use the existing offer; the test is not extended indefinitely.

## Implementation
- `evaluate` (`below`, `daysLeft`, `canRelease`, caution “เหลือเวลาไม่ครบ 7 วันสำหรับการทดสอบใหม่”), `validateRelease` and `alertList` (`G-11`, `G-12`) in `apps/web/src/content/shared/model.mjs`.
- Tests: `tests/campaign/model.test.mjs` (“AC-17 cannot fit another 7-day test”, “AC-03 eligible normal below pace permits first DESTINY after decision”).

## Notes
- Spec trace ([spec.md](../spec.md)): §5.2 rows G-11, G-12 (AC-01, AC-03); §10 AC-17 (AC-02). Legacy label: AC-17.
- The Low pace band for G-11 is a setting still TBD in the spec; with no Low target the rule cannot fire. Gap: a maximum test spend or duration is not a stored field, so the “test cap” of AC-03 is the owner’s decision, not a check. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
