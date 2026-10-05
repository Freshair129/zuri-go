---
id: CMP-004
title: Explicit local marketing report delivery
owner: DOM-CAM
runtime: SRV-002
status: approved
superseded_by: null
version: 0.1.0
date: 2026-10-05
---

# CMP-004 — Explicit report delivery

Implementation binding for the owner-approved [P3 physical design](../../features/FEAT-015-marketing-report-exchange/p3-physical-delivery.md), [FR-015-004](../../features/FEAT-015-marketing-report-exchange/requirements/FR-015-004-durable-delivery-receipt.md) and [wire contract](../../features/FEAT-015-marketing-report-exchange/contract.md). Source is `apps/api/marketing-report-delivery.mjs`; storage is additive migration `012_marketing_report_delivery.sql`; local-only route is API-026. These paths bind the approved scope, without a new service or behavior.

Claim/Complete/Settle follow the physical chapter's Business→association→delivery locks, runtime direct-DML denial, current grants, live-lease CAS and first-committed-claim limits. Network occurs only after Claim commits and releases its connection. Private `.local/marketing-report-delivery.json` holds version 1 and bindings keyed by associationId, rowVersion and bindingId, with origin and credential. No real file or credential is created by implementation. The fixed receiver path and bounded no-redirect transport obey the wire contract; only exact validated durable receipt permits ACK.

Native acceptance remains NOT_RUN. Existing frozen report/outbox bytes and migration 011 are preserved. No live migration, binding, send, scheduler or deployment is implied.

Version diff 0 → 0.1.0: binds approved P3 implementation paths and private server configuration custody; no delivered runtime claim.
