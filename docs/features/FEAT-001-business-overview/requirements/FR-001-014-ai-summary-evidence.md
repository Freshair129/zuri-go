---
id: FR-001-014
title: The summary is short and every statement traces to evidence
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [ARCH-001, ARCH-002]
---

# FR-001-014 — The summary is short and every statement traces to evidence

The system SHALL give a summary of at most three points — the result now, what to watch and the next step — in plain language, SHALL compute the figures on the server and store an immutable evidence bundle before any model is called, SHALL let the model only phrase and rank that evidence, and SHALL show the time up to which the data runs and a way to see the evidence.

## Acceptance criteria
- AC-001-014-01 — Given a summary, then it has at most three points and each is tied to a fact of the evidence bundle.
- AC-001-014-02 — Given a summary request, then the server computes the figures and stores the evidence bundle first; the model does not recompute an actual.
- AC-001-014-03 — Given a model answer that names a fact not in the evidence bundle, that repeats a fact or that gives more than three, then it is rejected.
- AC-001-014-04 — Given a summary, then it says it was made from the data up to a stated time and offers “ดูหลักฐาน”.
- AC-001-014-05 — Given a stored evidence bundle, when the data changes later, then the stored bundle is not changed.

## Implementation
- `brief` and `summaryFacts` in `apps/api/service.mjs` and `apps/web/src/content/business/model.mjs`; `validateSummarySelection`; table `ai_briefs` with a unique key on the input hash; the “Zuri สรุปให้” block and “ดูหลักฐานที่ใช้สรุป” in `apps/web/src/content/business/BusinessWorkspace.jsx`.
- Tests: `apps/api/test/model.test.mjs` (“AI can select only evidence-backed facts”); `apps/api/test/database.test.mjs` (“… briefs are immutable and repeatable”).

## Notes
- Spec trace ([spec.md](../spec.md)): §8, first paragraph and the second paragraph (AC-01, AC-02); first bullet (AC-04); last bullet (AC-03); ZGO-07, first clause (AC-01, AC-03). Legacy label: ZGO-07 (part). AC-05 is the “immutable evidence bundle” of §8 as stored by `ai_briefs`; the same evidence returns the stored brief (unique key on the input hash).
- The 40 to 80 words and the clickable evidence tokens of §8 are guidance for the wording; the evidence is shown in a details block, not as tokens.
