---
id: FR-011-015
title: What a Guest reads of a public campaign
part: FEAT-011-P04
owner: DOM-CAM
delivery: declared
status: proposed
relations:
  specified_by: [SDD-011]
  decided_by: [ADR-005, ADR-004]
  relates_to: [FR-011-007, FEAT-002]
---

# FR-011-015 — What a Guest reads of a public campaign

The system SHALL return to a Guest, for a `public` campaign, its header, content items, publications, goals, series and observations, and SHALL NOT return its ledger — the ads, leads, orders, inventory, decisions, releases, history, reviews and alert actions stored in `campaign_states` — or any customer or lead ID, on any path, at any level.

## Acceptance criteria
- AC-011-015-01 — Given a `public` campaign whose orders carry customer IDs and lead IDs, when a Guest calls `/state`, `/workspace` and `/overview`, then the campaign, its content, publications, goals and series appear and no order, lead, ad, inventory record or customer ID appears on any path.
- AC-011-015-02 — Given the same campaign, then the Guest's campaign object carries `ledgerWithheld: true` and empty ledger collections, and Mission Control shows a notice that the ledger needs sign-in instead of KPIs computed from an empty ledger.
- AC-011-015-03 — Given a Guest who calls `/overview`, then it counts only public campaigns and their records, and a Business-level goal is computed from what the Guest reads.
- AC-011-015-04 — Given a Guest who tries to write, then the answer is 401, as today.
- AC-011-015-05 — Given a signed-in Member or the operator who may read the campaign, then the ledger is returned as today.
- AC-011-015-06 — Given a direct query of `campaign_states` as a Guest, then no row is returned, whatever the campaign's level.

## Implementation
- Proposed 2026-10-01; not built. Policy `follows_campaign_ledger` on `campaign_states`; `ledgerFor` (`apps/api/audience.mjs`) shapes the Guest's campaign in `readLegacy`; a notice component beside `GuestNotice` (`apps/web/src/content/meeting/Visibility.jsx`).
- Today (0.5.1): a Guest reads each campaign with its whole stored state (`apps/api/workspace.mjs:46`).

## Notes
- Q-V3 of [ADR-005](../../../architecture/decisions.md) is the open choice: the alternatives are the whole campaign, as today, or the header only.
- Amends [FEAT-002](../../FEAT-002-campaign-mission-control/feature.md), where a Guest reads the whole campaign.
