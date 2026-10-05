---
id: FEAT-015
title: Marketing report exchange with Zuri-AI
type: domain-feature
owner: DOM-CAM
runtime: SRV-002
delivery: building
status: approved
superseded_by: null
version: 0.9.0
date: 2026-10-05
complexity: C-3
risk: HIGH
relations:
  depends_on: [FEAT-002]
  relates_to: [ARCH-005, ADR-007, DOM-MET, SRV-001]
---

# FEAT-015 — Marketing report exchange with Zuri-AI

ส่งผลแคมเปญและ weekly review จาก Zuri-Go ไปเป็น external reported evidence ใน Marketing ของ Zuri-AI โดยรักษาเจ้าของข้อมูล สถานะหลักฐาน และขอบเขต Business. Gap/contract preparation was approved on 2026-10-04; the owner approved P1 source snapshot/preview and then [P2 preparation/freeze](p2-freeze-outbox.md) on 2026-10-05. P2 approval covers code/tests and an additive migration file only. Receiver, credentials, applying schema to an application database, actual sending and production operations remain outside that approval.

## Scope

- First implementation candidate: local SRV-002 only, operator-triggered freeze/preview and explicit send; one campaign and one weekly window per report. No automatic schedule.
- Whitelisted campaign context, aggregate reported measurements and a bounded weekly review assertion. Unknown remains unknown. No provider import, LINE conversation, customer, order, stock, raw workspace or free-text review export.
- Zuri-Go owns its campaign records and report/outbox ledger. Zuri-AI owns its external evidence receipt and projection; receiving a report does not create, revise, review or approve a MarketingPlan.
- Receiver and Identity changes belong in the parent repository's own reviewed records. This feature does not allocate IDs, change code or authorize migrations there.
- Hosted sending, automatic Ads execution, A/B winner selection, CRM/sales sync, provider verification, two-way writes and production deployment are deferred.

## Current delivery and exit gates

P3 candidate now implements [CMP-004](../../services/SRV-002-local/CMP-004-marketing-report-delivery.md)/API-026/schema file 012 under paired approval and the owner-selected existing operator/Business authority. Isolated PostgreSQL sender and full paired SQLite receiver acceptance pass; [verification](verification.md#native-sender-and-full-paired-qa--2026-10-05) owns exact checks and limits. Real migration 012, binding, credentials, sending, deployment and merge remain open. The earlier P1/P2 operational facts below remain valid for the real schema-11 databases.

**BUILDING / P1 and P2 implemented; native database checks passed.** [API-024](../../domains/campaign/contracts.md#api-024--local-marketing-report-preview) stays a read-only preview; [API-025](../../domains/campaign/contracts.md#api-025--local-marketing-report-preparation-and-freeze) persists preparation and atomically freezes immutable report + QUEUED + private audit. Native PostgreSQL 18.6 passes 5 P2 concurrency/lock/ACL cases and the original P1 snapshot case. Independent L2 found a grant window; the atomic correction passed review at `99ed23a` with an independent migration/rerun and six native cases. Production migration 011 passed on 2026-10-05 after a verified full backup; schema 11 and unchanged existing data/ACL/RLS were verified. Existing hosted Guest reads and write denial passed. Local migration 011 passed after the separately owner-authorized restore of the verified Production backup into a new persistent loopback database; schema 11 and all 47 source table counts/content hashes match. Local API-024 HTTP preview passed (200, HELD, 12 UNKNOWN/null measurements and valid canonical hash); real API-025 preparation/freeze HTTP remains NOT_RUN because no reviewed parent association is provisioned. No marketing API rollout is claimed. Actual measurements remain null/UNKNOWN and readiness HELD without audited source timezone/coverage. See [verification](verification.md).

P1 is C-3 / MEDIUM (API and private-data boundary). The full exchange remains HIGH risk because it adds persistence and cross-system authorization. No source timezone attestation is accepted from a caller or arbitrary state field.

Completed operational gates: independent corrective review, PR #6 merge and migration 011 on both real targets. Remaining gates: real API-025 binding acceptance and hosted marketing rollout. Parent receiver ownership/schema and machine authorization require its own approved records. Real associations/credentials, sender and rollout remain outside this operational scope.

## Requirement index

| ID | Requirement | Delivery |
|---|---|---|
| [FR-015-001](requirements/FR-015-001-scoped-source-snapshot.md) | Freeze one authorized campaign source snapshot | building |
| [FR-015-002](requirements/FR-015-002-reported-metric-semantics.md) | Export truthful metrics and reported review semantics | building |
| [FR-015-003](requirements/FR-015-003-immutable-report-envelope.md) | Build a strict immutable envelope and explicit binding | building |
| [FR-015-004](requirements/FR-015-004-durable-delivery-receipt.md) | Send with bounded recovery and durable receiver receipt | building |
| [FR-015-005](requirements/FR-015-005-source-preserving-receiver.md) | Preserve parent authority and receipt evidence | building |

## Documents

- [Gap analysis](gap-analysis.md) — MKT-F01–F07, observed code and semantic mapping.
- [SDD-015](design.md) — sequence, persistent boundaries, authority and implementation gates.
- [Approved P2 design](p2-freeze-outbox.md) — server-issued preparation, immutable freeze/QUEUED storage and isolated-QA/grant checks; code reviewed, migration 011 applied on both targets.
- [Wire contract proposal](contract.md) — field types, allowed payload, states and proposed interfaces.
- [Approved P3 scope](p3-delivery-receiver.md) — sequencing, report-only Identity binding, minimum 90-day evidence/receipt retention, delivery state and isolated end-to-end acceptance; parent record migration gate remains open before coding.
- [Quality/security constraints](requirements/NFR-015-001-bounded-private-exchange.md).
- [Verification plan and executed checks](verification.md).

## Version diff

0.8.0 → 0.9.0: records the approved existing operator/Business sender authority and P3 candidate implementation (CMP-004/API-026/schema file 012). Parent reconciled issuance supplies FR-281–283/SDD-112. Isolated sender/cross-system acceptance is recorded in verification; live migration, credentials, sends, deployment and merge remain separate gates. Application stays 0.5.1; real Local and Production stay schema 11.

0.7.0 → 0.8.0: recorded P3 owner approval and minimum 90-day evidence/receipt retention; parent-owned detailed contract/record migration prepared as intake. Coding/QA delivery remains unperformed until that parent gate closes.

0.6.0 → 0.7.0: separately approved persistent Local restore/migration and actual runtime/API-024/build acceptance passed; schema 11 on both targets. API-025 real binding, browser and parent/sender acceptance remain open. No application version or Production deployment change.

0.1.0 → 0.2.0: approved P1 adds the source reader, observed arithmetic, strict sanitized preview and local-only API-024 with bound tests. Delivery advances declared → building. Freeze/outbox/receiver remain declared. Application package stays 0.5.1; no database, credential, UI or deployment change was performed.
