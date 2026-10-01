---
id: NFR-011-003
title: The added policies keep reads fast
part: FEAT-011-P04
delivery: declared
status: approved
relations:
  decided_by: [ADR-005]
  relates_to: [NFR-011-002]
---

# NFR-011-003 — The added policies keep reads fast

The system SHALL keep a signed-in Member's read of `/state` within twice the median time it takes before the campaign policies exist, on a QA Business that holds campaigns, content items, publications, series and observations in the volume of production plus a margin the owner confirms.

## Measurement
- Given a QA Business with the rows above, then the median of 20 reads of `/state` as a Member before and after the migration is recorded in the release record, and the ratio is at most 2.
- Given the observations table, which is the largest and sits two joins from `campaigns`, then its share of the read time is recorded separately.
- Given a ratio above 2, then the release stops and SDD-011 is reopened; the threshold of 2, the 20 reads and the QA volume were approved with this requirement on 2026-10-01.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. A timing script beside `apps/api/test/visibility-db.test.mjs`; the result goes under `docs/releases/<version>/`.

## Notes
- Each observation costs two `EXISTS` lookups through unique keys (SDD-011 “Failure modes”). The numbers here are a design judgement, not a measured fact.
