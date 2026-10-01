---
id: FR-001-015
title: Empty, outdated and unavailable summaries are labelled
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [ARCH-001]
---

# FR-001-015 — Empty, outdated and unavailable summaries are labelled

The system SHALL, when there is no data, show an empty state that names the minimum data to add and send no assumed zeroes to the model; SHALL label a summary made from data older than the latest update and offer to make it again; and, when the AI is unavailable or its output unusable, SHALL show a summary from rules, labelled as such, and never claim the AI answered.

## Acceptance criteria
- AC-001-015-01 — Given no data, then the summary shows an empty state that suggests the minimum data to add, and no assumed zero is passed to the model.
- AC-001-015-02 — Given the data changed after a summary, then the summary is marked as made from data before the latest update and can be made again.
- AC-001-015-03 — Given the AI is unavailable or returns an unsupported output, then a “สรุปจากกติกา” summary is shown, labelled apart from an AI summary.
- AC-001-015-04 — Given a claim of the AI that does not match the evidence, then the claim is rejected and the summary from rules is used.
- AC-001-015-05 — Given a recommendation, then it asserts no cause unless the evidence shows it.

## Implementation
- `brief` (modes `ai` and `rule_based`, error `AI_UNAVAILABLE_OR_UNSUPPORTED_OUTPUT`) in `apps/api/service.mjs`; labels “สรุปจากกติกา”, “ข้อมูลเปลี่ยนแล้ว กรุณาสรุปใหม่” and the empty state in `apps/web/src/content/business/BusinessWorkspace.jsx`.
- The summary was rule-based in every release so far; the optional loopback Ollama adapter is implemented but no model was configured or verified ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Operational boundaries”).

## Notes
- Spec trace ([spec.md](../spec.md)): §8 bullets 2, 3, 4 and 6 (AC-01 to AC-05); ZGO-07, stale, error and fallback (AC-02, AC-03). Legacy label: ZGO-07 (part).
- The provider of the AI is still not chosen (§8, fifth bullet); the AI path is therefore not verified end to end.
