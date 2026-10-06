---
id: FEAT-015
title: Marketing report exchange with Zuri-AI
type: domain-feature
owner: DOM-CAM
runtime: SRV-002
delivery: building
status: approved
superseded_by: null
version: 0.12.0
date: 2026-10-06
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

P3 implements [CMP-004](../../services/SRV-002-local/CMP-004-marketing-report-delivery.md)/API-026 under paired approval and the owner-selected existing operator/Business authority. Parent PR #633 and Go PR #10 are merged; migration 012 passed on both actual Local and Production databases, now schema 12. Go code was staged, verified and promoted on 2026-10-06. [Verification](verification.md) owns the executed evidence and limitations. The parent primary checkout/runtime remains at the earlier `07779662`; parent deployment/migration, real association/binding/credential and sending remain open. Hosted Marketing operations remain denied. Earlier schema-11 checkpoints below are historical, superseded by the dated operational evidence.

**BUILDING / P1 and P2 implemented; native database checks passed.** [API-024](../../domains/campaign/contracts.md#api-024--local-marketing-report-preview) stays a read-only preview; [API-025](../../domains/campaign/contracts.md#api-025--local-marketing-report-preparation-and-freeze) persists preparation and atomically freezes immutable report + QUEUED + private audit. Native PostgreSQL 18.6 passes 5 P2 concurrency/lock/ACL cases and the original P1 snapshot case. Independent L2 found a grant window; the atomic correction passed review at `99ed23a` with an independent migration/rerun and six native cases. Production migration 011 passed on 2026-10-05 after a verified full backup; schema 11 and unchanged existing data/ACL/RLS were verified. Existing hosted Guest reads and write denial passed. Local migration 011 passed after the separately owner-authorized restore of the verified Production backup into a new persistent loopback database; schema 11 and all 47 source table counts/content hashes match. Local API-024 HTTP preview passed (200, HELD, 12 UNKNOWN/null measurements and valid canonical hash); real API-025 preparation/freeze HTTP remains NOT_RUN because no reviewed parent association is provisioned. No marketing API rollout is claimed. Actual measurements remain null/UNKNOWN and readiness HELD without audited source timezone/coverage. See [verification](verification.md).

P1 is C-3 / MEDIUM (API and private-data boundary). The full exchange remains HIGH risk because it adds persistence and cross-system authorization. No source timezone attestation is accepted from a caller or arbitrary state field.

Completed operational gates: independent review, paired PR merges, migrations 011/012 on both actual Go targets and the Go code rollout. Remaining gates: parent receiver runtime/schema readiness, exact source/target mapping, scoped report-only credential and real API-025/API-026 acceptance. The owner approved the [Local pilot workflow](p3-local-pilot.md) and selected the existing parent database on 2026-10-06. Actual restricted read-only Go source previews pass for two campaigns; target discovery remains partial because the existing parent runtime/database location and mapping are unresolved. Exact target/report operation gates remain in that approved workflow. FEAT-015 remains `building`.

## Requirement index

**Owner recovery checkpoint (2026-10-06):** the existing parent database is on another inaccessible machine. Owner requested a GitHub document handoff while reinstalling Windows, then restoring/moving the database and deploying Docker. Pilot execution is deferred pending that recovery; [the approved pilot resume chapter](p3-local-pilot.md#windows-recovery-handoff--owner-decision-2026-10-06) owns the handoff and parent-guide locator. Docker production PostgreSQL remains outside current SQLite receiver qualification; app recovery/deployment does not qualify Marketing exchange. No new database or report send.

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
- [Approved P3 scope](p3-delivery-receiver.md) — sequencing, report-only Identity binding, minimum 90-day evidence/receipt retention, delivery state and isolated end-to-end acceptance; parent records and code are merged, real operations remain separately scoped.
- [Approved Local pilot workflow](p3-local-pilot.md) — operational gates, target selection, backup, private handover and one-report receipt acceptance; read-only Go discovery passed, existing parent location/mapping pending.
- [Quality/security constraints](requirements/NFR-015-001-bounded-private-exchange.md).
- [Verification plan and executed checks](verification.md).

## Version diff

0.11.0 → 0.12.0: records the owner's Windows recovery/GitHub handoff decision and deferred pilot, preserving the existing parent database selection and separate Docker receiver qualification gate. Documentation only; application/schema unchanged.

0.10.0 → 0.11.0: records owner approval of the Local pilot and existing-parent-database decision; links actual read-only discovery and unresolved target gates. Application/schema unchanged; no report write/send or parent operation.

0.9.0 → 0.10.0: reconciles current delivery gates with the dated merge, actual schema-12 migration and Go deployment evidence; retains historical checkpoints and links the draft Local pilot. Application 0.5.1 → 0.5.1; both Go databases schema 12 → 12. Documentation only; no parent runtime, binding, credential or report changed.

0.8.0 → 0.9.0: records the approved existing operator/Business sender authority and P3 candidate implementation (CMP-004/API-026/schema file 012). Parent reconciled issuance supplies FR-281–283/SDD-112. Isolated sender/cross-system acceptance is recorded in verification; live migration, credentials, sends, deployment and merge remain separate gates. Application stays 0.5.1; real Local and Production stay schema 11.

0.7.0 → 0.8.0: recorded P3 owner approval and minimum 90-day evidence/receipt retention; parent-owned detailed contract/record migration prepared as intake. Coding/QA delivery remains unperformed until that parent gate closes.

0.6.0 → 0.7.0: separately approved persistent Local restore/migration and actual runtime/API-024/build acceptance passed; schema 11 on both targets. API-025 real binding, browser and parent/sender acceptance remain open. No application version or Production deployment change.

0.1.0 → 0.2.0: approved P1 adds the source reader, observed arithmetic, strict sanitized preview and local-only API-024 with bound tests. Delivery advances declared → building. Freeze/outbox/receiver remain declared. Application package stays 0.5.1; no database, credential, UI or deployment change was performed.
