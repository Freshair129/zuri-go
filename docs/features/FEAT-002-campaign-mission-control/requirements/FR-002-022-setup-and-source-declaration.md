---
id: FR-002-022
title: Missing setup is shown as a setup requirement and sources must be declared
delivery: implemented
status: approved
legacy: []
relations:
  relates_to: [FEAT-005, FEAT-006]
---

# FR-002-022 — Missing setup is shown as a setup requirement and sources must be declared

The system SHALL show the setup the spec lists as explicit requirements and invent no threshold when one is missing, SHALL require a manual declaration of the coverage and watermark of each source before a campaign is decision-ready, and SHALL join the records by stable IDs and keep an unmapped record for reconciliation instead of dropping it.

## Acceptance criteria
- AC-002-022-01 — Given a campaign missing dates, offer and cost basis, unit definition, per-phase cap and approver, DESTINY readiness, lead qualification, sample and maturity rules, SKU stock, shipping, payment and return costs, source bindings and freshness policies, or roles, then each is shown as a setup requirement and no value is filled in.
- AC-002-022-02 — Given no source coverage declared, then the campaign is not decision-ready.
- AC-002-022-03 — Given a record that joins by ID, then an unmapped record is kept and shown for reconciliation, not dropped.
- AC-002-022-04 — Given data by grain — daily ad and creative costs and delivery, lead and stage events, orders with lines and refunds, order costs, inventory snapshots and movements, offer and BOM versions, targets and budget releases, tasks and decisions — then each can be entered with a source reference.

## Implementation
- `evaluate` (`missing`, one entry per missing requirement) in `apps/web/src/content/shared/model.mjs`; the setup prompts (“เติมข้อกำหนดเพื่อเริ่มวัดผล”) and the source coverage fields in `apps/web/src/content/dashboard/DashboardContent.jsx` and `apps/web/src/content/dashboard/Forms.jsx`.
- Tests: `tests/campaign/model.test.mjs` (“unmapped orders remain in actuals but hold a sales-conversion decision”); no-fill behavior of a new campaign: “no invented actuals and undefined ratios in an untouched campaign”.

## Notes
- Spec trace ([spec.md](../spec.md)): §8, table and the last paragraph (AC-01, AC-03, AC-04); §11, last paragraph (AC-01); §13, last paragraph (“manual source-coverage/watermark declaration is required”) (AC-02).
- Roles and permissions of §8 (“separates observation, target edits and release decisions”) are held today by the sign-in rules of [FEAT-005](../../FEAT-005-guest-access/feature.md) and [FEAT-006](../../FEAT-006-member-identity/feature.md); the campaign workspace has no finer role split, and the spec marks it “role-based design only”.
