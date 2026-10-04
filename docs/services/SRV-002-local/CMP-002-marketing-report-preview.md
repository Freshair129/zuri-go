---
id: CMP-002
title: Local marketing report preview adapter
owner: DOM-CAM
runtime: SRV-002
status: approved
superseded_by: null
version: 0.1.0
date: 2026-10-05
relations:
  implements: [FR-015-001, FR-015-002]
  relates_to: [SDD-015]
  exposes: [API-024]
---

# CMP-002 — Marketing report preview

Approved FEAT-015 P1 adapter, `apps/api/marketing-report.mjs`, routed from `apps/api/api.mjs`. Reads one resolved-operator, Business-scoped campaign/state/revision snapshot in the existing repeatable-read transaction; writes nothing and consumes no external API. No schema change or separate service.

Source and exported signatures: [SDD-015 interfaces](../../features/FEAT-015-marketing-report-exchange/design.md#interfaces--approved-p1). API-024 belongs only to SRV-002; SRV-001 rejects the preview. Current source timezone/coverage evidence is insufficient, so every actual measurement stays null/UNKNOWN and readiness is HELD. Internal observed arithmetic is never upgraded by a caller/state field. Immutable ledger, sender and parent receiver remain outside this component.

Verification: [TC-015-001/002](../../features/FEAT-015-marketing-report-exchange/verification.md) passed synthetic/unit checks; TC-015-003 (PostgreSQL) and live HTTP acceptance remain NOT_RUN. This source implementation does not claim feature completion or production availability.
