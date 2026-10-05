---
id: CMP-004
title: Explicit local marketing report delivery
owner: DOM-CAM
runtime: SRV-002
status: approved
superseded_by: null
version: 0.3.0
date: 2026-10-05
relations:
  exposes: [API-026]
  relates_to: [FEAT-015, FR-015-004, SDD-015]
---

# CMP-004 — Explicit report delivery

Implementation binding for the owner-approved [P3 physical design](../../features/FEAT-015-marketing-report-exchange/p3-physical-delivery.md), [FR-015-004](../../features/FEAT-015-marketing-report-exchange/requirements/FR-015-004-durable-delivery-receipt.md) and [wire contract](../../features/FEAT-015-marketing-report-exchange/contract.md). Source is `apps/api/marketing-report-delivery.mjs`; storage is additive migration `012_marketing_report_delivery.sql`; local-only route is API-026. These paths bind the approved scope, without a new service or behavior.

Claim/Complete/Settle follow the physical chapter's Business→association→delivery locks, runtime direct-DML denial, current grants, live-lease CAS and first-committed-claim limits. Network occurs only after Claim commits and releases its connection. Private `.local/marketing-report-delivery.json` holds version 1 and bindings keyed by associationId, rowVersion and bindingId, with origin and credential. No real file or credential is created by implementation. The fixed receiver path and bounded no-redirect transport obey the wire contract; only exact validated durable receipt permits ACK.

Native acceptance passes TC-015-008/009 in isolated QA: 16/16 sender checks and the full PostgreSQL sender/SQLite receiver case in the parent's 18/18 runner. Existing frozen report/outbox bytes and migration 011 are preserved. See [verification](../../features/FEAT-015-marketing-report-exchange/verification.md#native-sender-and-full-paired-qa--2026-10-05). Real migration 012, binding, credential, send, scheduler and deployment remain unperformed.

2026-10-05 candidate checkpoint: pure receipt/config/HTTP transport is implemented and its three Node tests pass, including actual loopback HTTP body timeout, bounded response and no redirects. Owner subsequently chose existing local operator + non-archived configured Business authority, closing the sender clarification without a new Go policy. Claim/Complete/Settle and migration 012 now proceed under paired approval; parent deny-default policy is unchanged. Parent receiver native evidence is recorded in its reconciled worktree, independently of full Go delivery acceptance.

Version diff 0 → 0.1.0: binds approved P3 implementation paths and private server configuration custody; no delivered runtime claim.

Version diff 0.1.0 → 0.2.0: records the sender authority decision and closes its implementation prerequisite. Native/full paired acceptance is still pending execution.

Version diff 0.2.0 → 0.3.0: binds API-026 and records native candidate/full paired QA. Sender SQL waits are bounded to five seconds and Complete to its remaining lease, with a fresh database clock after the final attempt lock. Independent source-review closeout is recorded in verification; live operational readiness remains open.
