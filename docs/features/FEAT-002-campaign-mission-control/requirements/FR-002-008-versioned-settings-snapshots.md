---
id: FR-002-008
title: Settings are versioned and saved results keep the version they used
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-001]
---

# FR-002-008 — Settings are versioned and saved results keep the version they used

The system SHALL record a version, its author, its effective date and its reason whenever a target or rule changes, SHALL compare historical results with the target in force then, and SHALL keep every saved snapshot unchanged when the settings or the records change later.

## Acceptance criteria
- AC-002-008-01 — Given an original target or rule changes, then a new version is stored with its reason and the previous version is kept.
- AC-002-008-02 — Given a decision or review saved earlier, then its snapshot keeps the prior version and reason, and it is not silently regraded.
- AC-002-008-03 — Given a record is corrected afterwards, then the correction is kept as a restated actual and a review snapshot already saved does not change.
- AC-002-008-04 — Given a later edit of settings or records, then a saved snapshot is not mutated.

## Implementation
- `settingsSnapshot` and `evidenceSnapshot` in `apps/web/src/content/shared/model.mjs`; `version`, `previous` and `recordedAt` of a settings save and the history “ดู version ก่อนเปลี่ยน” in `apps/web/src/content/dashboard/DashboardContent.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“AC-14 saved evidence and previous settings cannot be mutated by later edits”). Browser: settings, decisions and snapshots survive save, reload and backup ([verification](../verification.md), “Evidence”).

## Notes
- Spec trace ([spec.md](../spec.md)): §4.1 table row “Effective version” (AC-01); §5.3, last paragraph (AC-01); §10 AC-14 (AC-02, AC-04); §6, last bullet and §13 (“restated actual”) (AC-03). Legacy label: AC-14.
- The dashboard filter uses the settings version on screen; a historical decision uses its own preserved snapshot (stated in the verification, “Operational boundaries”).
