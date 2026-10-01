# DOM-MET — API contracts

API contracts owned by [DOM-MET](README.md) ([STD-003 R2](../../governance/standards/STD-003-REPOSITORY-DOCUMENT-STRUCTURE.md)). Transport, authorization, the error envelope and the shared rules of the record routes are [API-001](../platform/contracts.md#api-001--http-api-transport-authorization-and-error-envelope). All are `proposed` and written on 2026-10-01 from the code of release 0.5.1. Every operation needs a Member (hosted) or the operator (local); goals, series and observations are read through `GET /businesses/{b}/state` (API-005) and the Overview (API-006).

### API-014 — Goals
Relations: relates_to: FEAT-001, ARCH-002, BR-009, BR-011, API-001, API-015
Owner: DOM-MET

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`save` resource `goals`), tables `goals`, `goal_series`.

| Operation | Request | Success | Errors |
|---|---|---|---|
| `POST /businesses/{b}/goals` | `name`, `metric_code`, `period_kind`, `period_start`, `period_end_exclusive`, `target_value`, `series_ids` (a non-empty array of metric series IDs) and any of `campaign_id`, `owner_member_id`, `status`, `change_reason` | 200 the `goals` row (`series_ids` are stored in `goal_series` and are not part of the row) | 422 for an unknown field or a value PostgreSQL refuses (for example a period that is not a whole week or month); the rule errors below |
| `PATCH /businesses/{b}/goals/{id}` | the same fields and `row_version` | 200 the row | the rule errors below, plus 404, 409 |

- Rules checked by the server (422): `series_ids` must be a non-empty array (`เลือกช่องทางข้อมูลสำหรับเป้า`) of series of this Business (`ไม่พบขอบเขตข้อมูล`) whose metric equals the goal's (the series `followers_total` serves the goal metric `followers_net`) and whose campaign scope equals the goal's (`Metric หรือ campaign scope ไม่ตรงกับเป้า`); a goal with a `campaign_id` cannot use a `followers_…` metric (`Follower ของบัญชีไม่ใช่ attribution ต่อ campaign`); a Business-level series cannot be combined with channel series (`ไม่รวมยอด Business กับยอดช่องทางซ้ำกัน`).
- A new goal takes the Business timezone and, unless sent, `status` `active`. Changing `target_value`, `metric_code`, `period_start`, `period_end_exclusive` or `campaign_id` needs a `change_reason` (`ระบุเหตุผลที่แก้เป้าหมาย`), and so does changing the set of series (`ระบุเหตุผลที่เปลี่ยนขอบเขตช่องทางของเป้า`); `series_ids` always replaces the stored set.
- **Idempotency.** None on create; update by `row_version`.
- **Specified by.** [FEAT-001 spec](../../features/FEAT-001-business-overview/spec.md) (net followers goal, BR-009), [ARCH-002 §4.4 and §4.5](../../architecture/ARCH-002-postgresql-data-model.md). No FR file exists yet (PLAN-001 WI-06).

### API-015 — Metric observations
Relations: relates_to: FEAT-001, ARCH-002, BR-011, API-001, API-014
Owner: DOM-MET

**Status:** proposed. **Served by:** SRV-001, SRV-002. **Code:** `apps/api/service.mjs` (`observe`), routed in `apps/api/api.mjs`; tables `metric_series`, `metric_observations`.

| Operation | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /businesses/{b}/observations` | Member, operator | `series_id`, `value`, `source_ref`, `effective_at` and any of `coverage` (`complete` by default, or `partial`), `date` (required for a daily `flow` series), `correction_reason`, `expected_id` | 200 the new `metric_observations` row (`revision`, `supersedes_id`, `is_current`, …) | 422 `ไม่พบ metric series`, `ตัวเลขนี้คำนวณจากรายการจริง ไม่กรอกซ้ำ` (a series that is not `manual` or `import`), `ค่าผลจริงไม่ถูกต้อง`, `ระบุที่มาของตัวเลข`, `เวลาที่วัดไม่ถูกต้องหรืออยู่ในอนาคต`, `ข้อมูลรายวันต้องอ้างถึงวันสิ้นสุดช่วงนั้น`; 409 `มีข้อมูลเวลานี้แล้ว เปิดรายการเดิมและระบุเหตุผลเพื่อแก้ไข` |

- The value must be a finite number, not negative unless the metric allows it, and an integer when the metric is integer-only. For a `flow` series `date` is the first day of the one-day period and `effective_at` must be the Business-timezone midnight of the day after it (an invalid `date` throws a plain error and answers 500).
- A current observation at the same `effective_at` is not overwritten: the request is refused with 409 unless it carries a `correction_reason` and an `expected_id` equal to that observation's ID, in which case the old one stops being current and the new one has `revision` + 1 and `supersedes_id` set. A missing value is refused (`ค่าผลจริงไม่ถูกต้อง`), never stored as 0 (BR-011).
- Writes a change event (entity type `metric_observations`, event type `observe`). Does not raise `domain_revision`.
- **Idempotency.** None by key; the one-current-value-per-time rule above makes a repeated request a 409.
- **Specified by.** [FEAT-001 spec](../../features/FEAT-001-business-overview/spec.md), [ARCH-002 §4.3](../../architecture/ARCH-002-postgresql-data-model.md), [ARCH-001 §3](../../architecture/ARCH-001-baseline-architecture.md) (route outline).
