---
id: CMP-003
title: Local marketing preparation and immutable report ledger
owner: DOM-CAM
runtime: SRV-002
status: approved
superseded_by: null
version: 0.1.0
date: 2026-10-05
relations:
  implements: [FR-015-001, FR-015-003]
  relates_to: [SDD-015]
  exposes: [API-025]
---

# CMP-003 — Local marketing report ledger

Approved FEAT-015 P2 component in `apps/api/marketing-report-ledger.mjs`, routed from `apps/api/api.mjs`; additive migration file `apps/api/migrations/011_marketing_report_ledger.sql`. It reads CMP-002's scoped source and owns the four private association/preparation/report/outbox tables defined once in [the P2 design](../../features/FEAT-015-marketing-report-exchange/p2-freeze-outbox.md). No separate deployable or network dependency.

Interface signatures and ownership: [SDD-015](../../features/FEAT-015-marketing-report-exchange/design.md#interfaces--approved-p2). SQL finalizers construct projections from actual scoped rows; caller data cannot supply a preview/envelope or server clock. The runtime role can SELECT only as a resolved operator and EXECUTE the two finalizers; direct ledger writes and helper execution are revoked. Preparations, reports and QUEUED records are append-only. Association reactivation increments its version and invalidates prior preparations/replays. Current association authority is checked before result disclosure.

Verification: [TC-015-005–007](../../features/FEAT-015-marketing-report-exchange/verification.md). Disposable WASM PostgreSQL checks execute real migration/functions/roles, but have one connection; native REPEATABLE READ concurrency/lock acceptance is NOT_RUN. Migration 011 has **not** been applied to the application/production database. No real association, credentials, sender, parent receiver or deployment is created.
