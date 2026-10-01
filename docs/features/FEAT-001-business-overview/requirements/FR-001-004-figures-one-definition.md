---
id: FR-001-004
title: Every overview figure has one definition shared by screen, API and database
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [ARCH-002]
---

# FR-001-004 — Every overview figure has one definition shared by screen, API and database

The system SHALL compute each figure of the Business Overview from the source rows with one definition used by the screen and the API alike, and SHALL NOT keep a figure as a stored counter.

## Acceptance criteria
- AC-001-004-01 — Given the same stored data, when the screen and `GET …/overview` give the figures, then they are equal, because both use the one `overview` computation.
- AC-001-004-02 — Given a campaign, content item, publication, goal or observation is changed, then the next reading of a figure reflects it and no counter has to be corrected.

## Implementation
- `overview` in `apps/web/src/content/business/model.mjs` is imported by `apps/api/api.mjs` and `apps/api/service.mjs` and used by `apps/web/src/content/business/BusinessWorkspace.jsx`.
- Test: `apps/api/test/model.test.mjs` (the overview counts, goal progress and period boundaries).

## Notes
- Spec trace ([spec.md](../spec.md)): §6, heading and opening line (“นิยามตัวเลขที่ใช้ร่วมกันทั้ง UI / API / DB”) (AC-01, AC-02). No ZGO label.
- The rule is also stated for the domain: [DOM-BIZ](../../../domains/business/README.md), “Business rules”; [ARCH-002 §1](../../../architecture/ARCH-002-postgresql-data-model.md).
