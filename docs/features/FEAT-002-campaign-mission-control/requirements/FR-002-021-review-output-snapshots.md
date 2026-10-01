---
id: FR-002-021
title: Daily and weekly reviews and decisions are saved as dated snapshots
delivery: building
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-021 — Daily and weekly reviews and decisions are saved as dated snapshots

The system SHALL produce a daily summary and a weekly review with the content the spec lists, SHALL link each summary to a dated evidence snapshot and a threshold version, SHALL label an inferred explanation as a hypothesis, SHALL save decision and review snapshots that later edits cannot change, and SHALL NOT invent a causal statement or send an automatic external message.

## Acceptance criteria
- AC-002-021-01 — Given a daily summary, then it states the current phase, the material KPI gaps, the fresh and data-held metrics, the new or unresolved breaches and the day’s due or blocking tasks and owner actions.
- AC-002-021-02 — Given a weekly review, then it compares actual with target and with the previous comparable period, shows offer and cohort performance, spend and cost completeness, units remaining and required pace, completed work and its measured outcomes, decisions with their rationale, and the next seven-day plan, released budget and checkpoint.
- AC-002-021-03 — Given a summary, then it links to a dated evidence snapshot and a threshold version, and an inferred explanation is labelled a hypothesis.
- AC-002-021-04 — Given a saved decision or review, then it keeps the numbers, the settings and the evidence of its date and later edits do not change it.
- AC-002-021-05 — Given a review, then no causal statement is invented and no external message is sent.

## Implementation
- `summary` and `evidenceSnapshot` in `apps/web/src/content/shared/model.mjs`; “บันทึก review snapshot”, `ReviewEditor` and `SnapshotDetail` in `apps/web/src/content/dashboard/Views.jsx`; the decision list “คำตัดสินและหลักฐาน ณ วัน review”.
- Tests: `tests/campaign/model.test.mjs` (“AC-14 saved evidence and previous settings cannot be mutated by later edits”). Browser: review snapshots survive reload and backup ([verification](../verification.md), “Evidence”).

## Notes
- Spec trace ([spec.md](../spec.md)): §7.2 (AC-01 to AC-03, AC-05); §13, first paragraph (“immutable decision snapshots”) (AC-04). No AC label of §10 beyond AC-14.
- Gap: the weekly review of AC-02 includes the units remaining and the required pace, which depend on the formulas that [FR-002-009](FR-002-009-pacing-forecast.md) lists as not shown. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
