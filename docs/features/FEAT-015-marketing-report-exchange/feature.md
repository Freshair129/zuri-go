---
id: FEAT-015
title: Marketing report exchange with Zuri-AI
type: domain-feature
owner: DOM-CAM
runtime: SRV-002
delivery: building
status: approved
superseded_by: null
version: 0.2.0
date: 2026-10-05
complexity: C-3
risk: HIGH
relations:
  depends_on: [FEAT-002]
  relates_to: [ARCH-005, ADR-007, DOM-MET, SRV-001]
---

# FEAT-015 — Marketing report exchange with Zuri-AI

ส่งผลแคมเปญและ weekly review จาก Zuri-Go ไปเป็น external reported evidence ใน Marketing ของ Zuri-AI โดยรักษาเจ้าของข้อมูล สถานะหลักฐาน และขอบเขต Business. Gap/contract preparation was approved on 2026-10-04; the owner approved this detailed package for the proposed next step, **P1 source snapshot and sanitized preview**, on 2026-10-05. Receiver, credentials, migrations, durable delivery and production operations remain outside that implementation approval.

## Scope

- First implementation candidate: local SRV-002 only, operator-triggered freeze/preview and explicit send; one campaign and one weekly window per report. No automatic schedule.
- Whitelisted campaign context, aggregate reported measurements and a bounded weekly review assertion. Unknown remains unknown. No provider import, LINE conversation, customer, order, stock, raw workspace or free-text review export.
- Zuri-Go owns its campaign records and report/outbox ledger. Zuri-AI owns its external evidence receipt and projection; receiving a report does not create, revise, review or approve a MarketingPlan.
- Receiver and Identity changes belong in the parent repository's own reviewed records. This feature does not allocate IDs, change code or authorize migrations there.
- Hosted sending, automatic Ads execution, A/B winner selection, CRM/sales sync, provider verification, two-way writes and production deployment are deferred.

## Current delivery and exit gates

**BUILDING / P1 implemented in source, database acceptance NOT_RUN.** [API-024](../../domains/campaign/contracts.md#api-024--local-marketing-report-preview) reads one server-scoped campaign and builds a sanitized, hashed preview without persistence. Current source storage has no audited reporting-timezone/coverage attestation: all measurement scalars and n/N remain null/UNKNOWN and readiness is HELD. Targets and cap remain separate planning context. Internal observed arithmetic is tested but is not exported as a ready metric. See [verification](verification.md) for tests and unresolved gates.

P1 is C-3 / MEDIUM (API and private-data boundary). The full exchange remains HIGH risk because it adds persistence and cross-system authorization. No source timezone attestation is accepted from a caller or arbitrary state field.

Implementation gates: review this package; settle parent receiver ownership/schema and Business-scoped machine authorization; allocate parent records; approve migration design and isolated QA setup separately before applying any schema. No credential provisioning or real-account execution is authorized by this draft.

## Requirement index

| ID | Requirement | Delivery |
|---|---|---|
| [FR-015-001](requirements/FR-015-001-scoped-source-snapshot.md) | Freeze one authorized campaign source snapshot | building |
| [FR-015-002](requirements/FR-015-002-reported-metric-semantics.md) | Export truthful metrics and reported review semantics | building |
| [FR-015-003](requirements/FR-015-003-immutable-report-envelope.md) | Build a strict immutable envelope and explicit binding | declared |
| [FR-015-004](requirements/FR-015-004-durable-delivery-receipt.md) | Send with bounded recovery and durable receiver receipt | declared |
| [FR-015-005](requirements/FR-015-005-source-preserving-receiver.md) | Preserve parent authority and receipt evidence | declared |

## Documents

- [Gap analysis](gap-analysis.md) — MKT-F01–F07, observed code and semantic mapping.
- [SDD-015](design.md) — sequence, persistent boundaries, authority and implementation gates.
- [P2 review proposal](p2-freeze-outbox.md) — server-issued preparation, immutable freeze/QUEUED storage and isolated-QA/grant checks; draft, no P2 code or migration applied.
- [Wire contract proposal](contract.md) — field types, allowed payload, states and proposed interfaces.
- [Quality/security constraints](requirements/NFR-015-001-bounded-private-exchange.md).
- [Verification plan and executed checks](verification.md).

## Version diff

0.1.0 → 0.2.0: approved P1 adds the source reader, observed arithmetic, strict sanitized preview and local-only API-024 with bound tests. Delivery advances declared → building. Freeze/outbox/receiver remain declared. Application package stays 0.5.1; no database, credential, UI or deployment change was performed.
