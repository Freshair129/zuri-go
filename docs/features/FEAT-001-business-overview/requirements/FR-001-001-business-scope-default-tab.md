---
id: FR-001-001
title: The Business Overview opens first and covers the whole Business
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-002, ARCH-002]
---

# FR-001-001 — The Business Overview opens first and covers the whole Business

The system SHALL open the Business Overview as the default tab, scoped to the whole Business, SHALL always show the Business name and the time scope in its header, and SHALL NOT narrow the totals to the campaign selected last without saying so.

## Acceptance criteria
- AC-001-001-01 — Given the app is opened at `/?view=1&tab=overview`, then the Business Overview is shown.
- AC-001-001-02 — Given a campaign was selected earlier, when the Business Overview opens, then its totals are those of the whole Business and are not reduced to that campaign.
- AC-001-001-03 — Given the Business Overview, then its header shows the Business name and the time scope (this week or this month).
- AC-001-001-04 — Given a Business with several campaigns and several channel accounts, then the first release shows one Business at a time and adds no portfolio or tenant administration.

## Implementation
- `apps/web/src/content/business/BusinessWorkspace.jsx` (the overview, header “ภาพรวมธุรกิจ” and “ทุกแคมเปญใน …”); `overview` in `apps/web/src/content/business/model.mjs`; `GET /api/zuri-go/v1/businesses/<id>/overview` in `apps/api/api.mjs`.
- Local browser check of the overview and the campaign drill-down ([zuri-go-review](../../../history/zuri-go-review/verification.md), “Verified”); production Overview in the browser ([zuri-go-cloud-review](../../../history/zuri-go-cloud-review/verification.md), “UI and logo”).

## Notes
- Spec trace ([spec.md](../spec.md)): §1 bullet 2 (“Overview เป็นภาพรวมธุรกิจ ครอบคลุมหลายแคมเปญ”) and §4, bullet 1 and the last paragraph (AC-01, AC-03); ZGO-01 (AC-02); §3 [ASSUMPTIONS] item 1 (AC-04). Legacy label: ZGO-01.
- There is no Business selector in the UI; the spec’s sketch shows “[MUJEEN ▾]” but its own text limits the first release to one Business at a time (AC-04).
