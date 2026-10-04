---
id: CMP-003
title: Local marketing preparation and immutable report ledger
owner: DOM-CAM
runtime: SRV-002
status: approved
superseded_by: null
version: 0.5.0
date: 2026-10-05
relations:
  implements: [FR-015-001, FR-015-003]
  relates_to: [SDD-015]
  exposes: [API-025]
---

# CMP-003 — Local marketing report ledger

Approved FEAT-015 P2 component in `apps/api/marketing-report-ledger.mjs`, routed from `apps/api/api.mjs`; additive migration file `apps/api/migrations/011_marketing_report_ledger.sql`. It reads CMP-002's scoped source and owns the four private association/preparation/report/outbox tables defined once in [the P2 design](../../features/FEAT-015-marketing-report-exchange/p2-freeze-outbox.md). No separate deployable or network dependency.

Interface signatures and ownership: [SDD-015](../../features/FEAT-015-marketing-report-exchange/design.md#interfaces--approved-p2). SQL finalizers construct projections from actual scoped rows; caller data cannot supply a preview/envelope or server clock. The runtime role can SELECT only as a resolved operator and EXECUTE the two finalizers; direct ledger writes and helper execution are revoked. Preparations, reports and QUEUED records are append-only. Association reactivation increments its version and invalidates prior preparations/replays. Current association authority is checked before result disclosure.

Verification: [TC-015-005–007](../../features/FEAT-015-marketing-report-exchange/verification.md). Native PostgreSQL 18.6 now passes five REPEATABLE READ concurrency/lock/ACL cases. The migrator grant/revoke batch is atomic after independent review found its original autocommit window; corrected code candidate `99ed23a` passed independent L2 review and a fresh native six-case rerun, including actual migration/rerun. Production migration 011 and metadata/source-preservation postchecks passed on 2026-10-05 after a verified full backup. Local restore/migration passed and its actual restricted runtime session denied all 12 direct table write probes; direct Production runtime-session tests remain NOT_RUN. See the linked verification for exact boundaries. New Local database credentials were created under the separate restore approval; no restored Member credential or Production credential changed. No real parent association, sender, parent receiver or deployment is created.
