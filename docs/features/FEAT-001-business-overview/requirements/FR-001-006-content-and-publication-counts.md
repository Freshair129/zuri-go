---
id: FR-001-006
title: Content items and scheduled publications are counted separately
delivery: building
status: proposed
legacy: []
relations:
  relates_to: [FEAT-002]
---

# FR-001-006 — Content items and scheduled publications are counted separately

The system SHALL count distinct content items planned for the selected month apart from the scheduled publications (one content item on one channel at one time), SHALL show those whose scheduled time has passed as overdue, and SHALL NOT mark a publication published because its time has come.

## Acceptance criteria
- AC-001-006-01 — Given one content item scheduled on three channels, then the content count is 1 and the count of publications waiting to be posted is 3.
- AC-001-006-02 — Given a content item whose planning month is the selected month and that is not archived, then it counts once, whatever the number of channels or media files; `created_at` is not used and cancelled or archived items are not counted.
- AC-001-006-03 — Given publications that are `scheduled`, with a scheduled time not before now and before the end of the selected week or month, then they count as “รอลงตามตาราง”; published, failed, cancelled and draft ones do not, and overdue ones are shown separately.
- AC-001-006-04 — Given the scheduled time has passed, then the system does not mark the publication published and lists it as “เลยเวลาลง” for checking.
- AC-001-006-05 — Given the card “ลงแล้ว”, then it counts the content items of the month plan with at least one published publication, says so, and shows in the detail whether the posting is partial or complete.

## Implementation
- `overview` in `apps/web/src/content/business/model.mjs` (`scheduled`, `scheduledContents`, `contentMonth`, `publishedContents`, `overdue`); cards in `apps/web/src/content/business/BusinessWorkspace.jsx` (“ลงแล้วอย่างน้อยหนึ่งช่องทาง … ชิ้น”).
- Test: `apps/api/test/model.test.mjs` (“one monthly content item has three scheduled channel publications”); `apps/api/test/database.test.mjs` (“approval, scheduling, publication evidence and correction version conflicts”).

## Notes
- Spec trace ([spec.md](../spec.md)): §6 rows “รอลงตามตาราง”, “คอนเทนต์เดือนนี้”, “ลงแล้วในแผนเดือนนี้”, “เลยกำหนดลง” and §3 [ASSUMPTIONS] item 3; ZGO-03 (AC-01, AC-02); ZGO-04 (AC-04). Legacy labels: ZGO-03, ZGO-04.
- Gap: the card says “at least one channel”, but the partial or complete badge of the last clause of AC-05 was not found. No implementation of this clause was found in the current code, so the delivery is `building`, not `implemented`.
