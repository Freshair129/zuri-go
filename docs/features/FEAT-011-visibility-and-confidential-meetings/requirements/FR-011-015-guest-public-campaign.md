---
id: FR-011-015
title: Guest access to non-secret campaign records
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: approved
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004, ADR-008]
  relates_to: [FR-011-007, FEAT-002]
---

# FR-011-015 — Guest reads all non-secret campaign records

The system SHALL return every non-secret campaign record in the configured Business to a Guest, including campaign ledgers and linked content, regardless of audience metadata. Guests remain read-only; every active Member has equal CRUD and internal approval rights. Credential/session/provider/operator secrets remain excluded.

> **Supersession:** [ADR-008](../../../architecture/decisions.md), approved 2026-10-05, supersedes public-campaign-only access and ledger/customer-data withholding. This policy is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; prior delivery evidence is historical.

## Acceptance criteria
- AC-011-015-01 — Given any campaign with non-secret ledger and linked records, when a Guest reads `/state`, `/workspace` and `/overview`, then those records are returned within the configured Business regardless of audience metadata.
- AC-011-015-02 — Given a Guest reading campaign records, then the Business data is not hidden based on ledger status; credential/session/provider/operator secrets remain excluded.
- AC-011-015-03 — Given a Guest who calls `/overview`, then it counts all non-secret campaign records in the configured Business.
- AC-011-015-04 — Given a Guest who tries to write, then the answer is 401, as today.
- AC-011-015-05 — Given a signed-in Member or the operator who may read the campaign, then the ledger is returned as today.
- AC-011-015-06 — Given a direct query of an in-Business non-secret campaign-state row as a Guest, then it is returned; a cross-Business query returns no row.

## Implementation
- Approved 2026-10-01 (ADR-005, gate G2); not built. Policy `follows_campaign_ledger` on `campaign_states`; `ledgerFor` (`apps/api/audience.mjs`) shapes the Guest's campaign in `readLegacy`; a notice component beside `GuestNotice` (`apps/web/src/content/meeting/Visibility.jsx`).
- Today (0.5.1): a Guest reads each campaign with its whole stored state (`apps/api/workspace.mjs:46`).

## Notes
- Q-V3 of [ADR-005](../../../architecture/decisions.md) is the open choice: the alternatives are the whole campaign, as today, or the header only.
- Amends [FEAT-002](../../FEAT-002-campaign-mission-control/feature.md), where a Guest reads the whole campaign.
