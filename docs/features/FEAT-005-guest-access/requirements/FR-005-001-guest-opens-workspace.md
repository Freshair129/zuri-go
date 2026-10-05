---
id: FR-005-001
title: An anonymous visitor opens the live workspace in Guest mode with no login wall
delivery: declared
status: approved
legacy: []
relations:
  decided_by: [ADR-004]
  relates_to: [FEAT-005, FR-011-007]
---

# FR-005-001 — An anonymous visitor opens the live workspace in Guest mode with no login wall

The system SHALL let an anonymous visitor open the live PostgreSQL workspace of the hosted site at once, with no login wall, and SHALL show **Guest mode** in the upper-right authored toolbar together with an explicit sign-in action.

## Acceptance criteria
- AC-005-001-01 — Given a visitor with no session, when the site is opened, reloaded or opened afresh, then the Business Overview renders and no sign-in is requested.
- AC-005-001-02 — Given the same visitor, then the upper-right toolbar shows “Guest mode” and a button “เข้าสู่ระบบเพื่อแก้ไข”.
- AC-005-001-03 — Given a Guest, then all non-secret Business records are readable regardless of former audience metadata, under ADR-008; Guest mutations and approvals remain denied.

## Implementation
- `apps/web/src/content/business/TeamAccess.jsx:TeamAccess` — the `zg-team-bar` badge reads “Guest mode” when there is no session and the button reads “เข้าสู่ระบบเพื่อแก้ไข”; the session check on load never blocks the page.
- `apps/api/cloud.mjs:handler` — every GET is answered without a session.
- Evidence: 0.3.1 production browser, “no login wall after logout/reload/fresh navigation; Guest badge” ([guest review](../../../history/zuri-go-guest-review/verification.md)); 0.5.1 production browser as a Guest, “The overview loads with ‘Guest mode’” ([0.5.1 verification](../../../releases/0.5.1/verification.md), “Browser checks”). No committed test covers the badge.

## Notes
- Spec: [spec.md](../spec.md) “Behavior” bullet 1, “Verification” item 1.
- The 0.3.1 text lists “Overview and current tasks” as readable without sign-in; since 2026-10-01 a Guest reads only public tasks and meetings (FR-011-007, [ADR-004](../../../architecture/decisions.md) D3), which is why AC-005-001-03 cites it instead of restating the old sentence.
- Supersession: [ADR-008](../../../architecture/decisions.md) (approved 2026-10-05) restores Guest reads across all non-secret Business records and supersedes FR-011-007's public-only limit. This contract is implemented locally as migration 012 targeting schema 12; the earlier schema-10-to-11 QA candidate predates FEAT-015 migration 011 and is not current-candidate evidence; fresh schema-11-to-12 database verification passed in isolated QA on 2026-10-05 (ADR-008 current QA record); production remains on schema 11 pending separately authorized migration 012 and deployment; the evidence above records the earlier implementation.
