---
id: FR-001-009
title: Net follower growth is the latest stock minus the stock at the start of the period
delivery: implemented
status: proposed
legacy: []
relations:
  relates_to: [FEAT-003]
---

# FR-001-009 — Net follower growth is the latest stock minus the stock at the start of the period

The system SHALL compute net follower growth as the sum over the accounts of the goal of the latest follower stock minus the stock at the start of the period, SHALL use the same accounts for the whole period, SHALL show the cumulative stock apart from the growth, and SHALL NOT sum daily snapshots or call a sum over accounts “unique people”.

## Acceptance criteria
- AC-001-009-01 — Given a baseline of 4,500 and a latest value of 4,820 (a fixture), then the growth is +320 of 500, 64%, 180 remain, and the cumulative stock is 4,820.
- AC-001-009-02 — Given a goal, then its account set is the same for the whole period.
- AC-001-009-03 — Given a goal over several accounts, then the growth is the sum of the account growths and is labelled as a count of followed accounts, not as new unique people.
- AC-001-009-04 — Given several goals that share an account, then the system does not add them into one Business total.
- AC-001-009-05 — Given the stock of each account, then the system takes the latest observation, with its own time, and does not sum daily snapshots.

## Implementation
- `goalProgress` in `apps/web/src/content/business/model.mjs` (`followers_net`, `followers_total`, `stock`); the note “ผลรวมข้ามช่องทางไม่ใช่คนที่ไม่ซ้ำ” in `apps/web/src/content/business/BusinessWorkspace.jsx`.
- Tests: `apps/api/test/model.test.mjs` (“net followers 320/500 differs from total stock 1320”); `apps/api/test/database.test.mjs` (“real stored observations produce net 320/500, corrections retain history …”).

## Notes
- Spec trace ([spec.md](../spec.md)): §6 rows “ผู้ติดตามเพิ่มสุทธิ” and “ผู้ติดตามสะสม” (AC-01, AC-05); ZGO-05 (AC-01); §6 row “ผู้ติดตามเพิ่มสุทธิ”, “account set เดิมตลอดรอบ” (AC-02); §7 bullet 6 (AC-03, AC-04). Legacy label: ZGO-05.
- The 4,500 / 4,820 figures are the spec’s fixture, not a Business result; the test uses 1,000 and 1,320 for the same arithmetic.
